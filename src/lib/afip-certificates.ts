// AFIP Certificate Management
// Handles certificate validation, storage, and verification

import crypto from 'crypto'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export interface CertificateInfo {
  valid: boolean
  subject: string
  issuer: string
  serialNumber: string
  notBefore: Date
  notAfter: Date
  daysUntilExpiry: number
  isExpired: boolean
  cuit?: string
}

export interface CertificateValidationResult {
  valid: boolean
  errors: string[]
  info?: CertificateInfo
}

/**
 * Parse a PEM certificate and extract information
 */
export function parseCertificate(pemContent: string): CertificateInfo | null {
  try {
    // Create a certificate object from PEM
    const cert = new crypto.X509Certificate(pemContent)
    
    // Extract subject and issuer
    const subject = cert.subject
    const issuer = cert.issuer
    const serialNumber = cert.serialNumber
    
    // Get validity dates
    const notBefore = new Date(cert.validFromDate)
    const notAfter = new Date(cert.validToDate)
    
    // Calculate days until expiry
    const now = new Date()
    const diffTime = notAfter.getTime() - now.getTime()
    const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // Extract CUIT from subject if present
    const cuitMatch = subject.match(/CUIT\s*(\d{11})/i) || 
                      subject.match(/CN\s*=\s*(\d{11})/i) ||
                      subject.match(/SERIALNUMBER\s*=\s*CUIT\s*(\d{11})/i)
    const cuit = cuitMatch ? cuitMatch[1] : undefined
    
    return {
      valid: !cert.ca && daysUntilExpiry > 0,
      subject,
      issuer,
      serialNumber,
      notBefore,
      notAfter,
      daysUntilExpiry,
      isExpired: daysUntilExpiry <= 0,
      cuit
    }
  } catch (error) {
    console.error('Error parsing certificate:', error)
    return null
  }
}

/**
 * Validate a certificate and private key pair
 */
export function validateCertificatePair(
  certificate: string,
  privateKey: string
): CertificateValidationResult {
  const errors: string[] = []
  
  // Validate certificate format
  if (!certificate || typeof certificate !== 'string') {
    errors.push('El certificado es requerido')
    return { valid: false, errors }
  }
  
  if (!certificate.includes('-----BEGIN CERTIFICATE-----')) {
    errors.push('El certificado no tiene formato PEM válido')
  }
  
  // Validate private key format
  if (!privateKey || typeof privateKey !== 'string') {
    errors.push('La clave privada es requerida')
    return { valid: false, errors }
  }
  
  if (!privateKey.includes('-----BEGIN') || !privateKey.includes('PRIVATE KEY-----')) {
    errors.push('La clave privada no tiene formato PEM válido')
  }
  
  if (errors.length > 0) {
    return { valid: false, errors }
  }
  
  // Parse certificate
  const certInfo = parseCertificate(certificate)
  if (!certInfo) {
    errors.push('No se pudo parsear el certificado')
    return { valid: false, errors }
  }
  
  // Check if expired
  if (certInfo.isExpired) {
    errors.push(`El certificado expiró el ${certInfo.notAfter.toLocaleDateString('es-AR')}`)
  }
  
  // Verify that private key matches certificate
  try {
    const cert = new crypto.X509Certificate(certificate)
    const publicKey = cert.publicKey
    
    // Create a test signature to verify key pair
    const testData = 'test-data-for-verification'
    const sign = crypto.createSign('RSA-SHA256')
    sign.update(testData)
    sign.end()
    
    const signature = sign.sign(privateKey, 'base64')
    
    // Verify with public key
    const verify = crypto.createVerify('RSA-SHA256')
    verify.update(testData)
    verify.end()
    
    const isValid = verify.verify(publicKey, signature, 'base64')
    
    if (!isValid) {
      errors.push('La clave privada no corresponde al certificado')
    }
  } catch (error) {
    console.error('Error verifying key pair:', error)
    errors.push('Error al verificar el par de claves. Verifique que la clave privada sea correcta.')
  }
  
  return {
    valid: errors.length === 0,
    errors,
    info: certInfo
  }
}

/**
 * Store certificate in database
 */
export async function storeCertificate(
  certificate: string,
  privateKey: string,
  puntoVenta: number = 1,
  ambiente: 'testing' | 'production' = 'testing'
): Promise<{ success: boolean; errors: string[] }> {
  // Validate first
  const validation = validateCertificatePair(certificate, privateKey)
  
  if (!validation.valid) {
    return { success: false, errors: validation.errors }
  }
  
  try {
    // Check if config exists
    const existing = await db.aFIPConfig.findFirst()
    
    if (existing) {
      // Update existing
      await db.aFIPConfig.update({
        where: { id: existing.id },
        data: {
          certificadoPath: certificate,
          clavePrivadaPath: privateKey,
          puntoVenta,
          entorno: ambiente,
          fechaVencimiento: validation.info?.notAfter ?? null
        } as Prisma.AFIPConfigUncheckedUpdateInput
      })
    } else {
      // Create new
      await db.aFIPConfig.create({
        data: {
          certificadoPath: certificate,
          clavePrivadaPath: privateKey,
          puntoVenta,
          entorno: ambiente,
          fechaVencimiento: validation.info?.notAfter ?? null
        } as Prisma.AFIPConfigUncheckedCreateInput
      })
    }
    
    return { success: true, errors: [] }
  } catch (error) {
    console.error('Error storing certificate:', error)
    return { 
      success: false, 
      errors: ['Error al guardar los certificados en la base de datos'] 
    }
  }
}

/**
 * Get stored certificate configuration
 */
export async function getCertificateConfig(): Promise<{
  certificate: string | null
  privateKey: string | null
  puntoVenta: number
  ambiente: 'testing' | 'production'
  isValid: boolean
  expirationDate: Date | null
  domicilio: string | null
  inicioActividades: string | null
} | null> {
  try {
     
    const config = await db.aFIPConfig.findFirst() as any
    
    if (!config) {
      return null
    }
    
    return {
      certificate: config.certificadoPath,
      privateKey: config.clavePrivadaPath,
      puntoVenta: config.puntoVenta,
      ambiente: (config.entorno || 'testing') as 'testing' | 'production',
      isValid: !!config.fechaVencimiento,
      expirationDate: config.fechaVencimiento,
      domicilio: config.domicilio || null,
      inicioActividades: config.inicioActividades || null
    }
  } catch (error) {
    console.error('Error getting certificate config:', error)
    return null
  }
}

/**
 * Check if certificate needs renewal (less than 30 days)
 */
export function needsRenewal(expirationDate: Date | null): boolean {
  if (!expirationDate) return true
  
  const now = new Date()
  const diffTime = expirationDate.getTime() - now.getTime()
  const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return daysUntilExpiry < 30
}

/**
 * Generate a new private key and CSR (Certificate Signing Request)
 * This is for creating a new certificate request
 */
export function generateCSR(
  cuit: string,
  commonName: string,
  organization?: string,
  country: string = 'AR'
): { privateKey: string; csr: string } {
  // Generate a new RSA key pair
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  })
  
  // Create CSR content (simplified - in production use a proper CSR library)
  // Note: This is a placeholder. For real CSR generation, you would need
  // to use node-forge or similar library
  const csrContent = `-----BEGIN CERTIFICATE REQUEST-----
MIICVzCCAT8CAQAwDzENMAsGA1UEAwwE${Buffer.from(commonName).toString('base64').slice(0, 20)}
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${Buffer.from(publicKey).toString('base64').slice(0, 100)}
-----END CERTIFICATE REQUEST-----`
  
  return {
    privateKey,
    csr: csrContent
  }
}

/**
 * Delete stored certificates
 */
export async function deleteCertificates(): Promise<boolean> {
  try {
    const existing = await db.aFIPConfig.findFirst()
    
    if (existing) {
      await db.aFIPConfig.update({
        where: { id: existing.id },
        data: {
          certificadoPath: null,
          clavePrivadaPath: null,
          fechaVencimiento: null
        } as Prisma.AFIPConfigUncheckedUpdateInput
      })
    }
    
    return true
  } catch (error) {
    console.error('Error deleting certificates:', error)
    return false
  }
}
