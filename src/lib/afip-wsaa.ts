// AFIP WSAA - Web Service de Autenticación y Autorización
// Referencia: https://www.afip.gob.ar/ws/WSAA/WSAA.HTM

import crypto from 'crypto'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, unlinkSync, existsSync, mkdirSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { db } from '@/lib/db'
import { createLogger } from '@/lib/logger'
const log = createLogger('lib.afip-wsaa')

// URLs de AFIP según ambiente
export const WSAA_URLS = {
  testing: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
  production: 'https://wsaa.afip.gov.ar/ws/services/LoginCms'
}

// Cache de tokens en memoria (12 horas de validez)
interface TokenCache {
  token: string
  sign: string
  expiration: Date
  cuit: string
  service: string
  ambiente: string
}

const tokenCache = new Map<string, TokenCache>()

export interface WSAAConfig {
  cuit: string
  certificado: string  // Contenido del certificado .pem
  clavePrivada: string // Contenido de la clave privada .key
  puntoVenta: number
  razonSocial: string
  domicilio?: string    // Domicilio comercial
  inicioActividades?: string // Fecha inicio actividades
  ambiente: 'testing' | 'production'
}

export interface TokenAcceso {
  token: string
  sign: string
  expiration: Date
  generationTime: Date
}

const execFileAsync = promisify(execFile)

/**
 * Genera el TRA (Ticket de Requerimiento de Acceso) en XML
 */
export function generarTRA(service: string, ttl: number = 43200): string {
  const now = new Date()
  const expiration = new Date(now.getTime() + ttl * 1000)

  const formatDateTime = (date: Date): string => {
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${Math.floor(now.getTime() / 1000)}</uniqueId>
    <generationTime>${formatDateTime(now)}</generationTime>
    <expirationTime>${formatDateTime(expiration)}</expirationTime>
  </header>
  <service>${service}</service>
</loginTicketRequest>`
}

/**
 * Firma el TRA con el certificado y clave privada usando OpenSSL
 * Genera un CMS (PKCS#7) válido para AFIP
 */
export async function firmarTRA(tra: string, certificado: string, clavePrivada: string): Promise<string> {
  const tmpDir = join(tmpdir(), 'afip-wsaa')
  
  // Ensure tmp directory exists
  if (!existsSync(tmpDir)) {
    mkdirSync(tmpDir, { recursive: true })
  }
  
  const timestamp = Date.now()
  const traFile = join(tmpDir, `tra_${timestamp}.xml`)
  const keyFile = join(tmpDir, `key_${timestamp}.pem`)
  const certFile = join(tmpDir, `cert_${timestamp}.pem`)
  const cmsFile = join(tmpDir, `cms_${timestamp}.pem`)
  
  try {
    // Write temporary files
    writeFileSync(traFile, tra, 'utf8')
    writeFileSync(keyFile, clavePrivada, 'utf8')
    writeFileSync(certFile, certificado, 'utf8')
    
    // Sign with OpenSSL to create PKCS#7
    // The -outform DER is important: AFIP expects DER format
    const opensslArgs = [
      'smime', '-sign',
      '-signer', certFile,
      '-inkey', keyFile,
      '-out', cmsFile,
      '-in', traFile,
      '-outform', 'DER',
      '-nodetach'
    ]
    
    try {
      await execFileAsync('openssl', opensslArgs, { timeout: 30000 })
    } catch (error) {
      // If OpenSSL fails, try alternative approach
      log.error('OpenSSL command failed, trying alternative approach', error)
      
      // Try with -binary flag
      const altArgs = [
        'smime', '-sign',
        '-signer', certFile,
        '-inkey', keyFile,
        '-out', cmsFile,
        '-in', traFile,
        '-outform', 'DER',
        '-binary'
      ]
      
      await execFileAsync('openssl', altArgs, { timeout: 30000 })
    }
    
    // Read the signed CMS
    const cmsBuffer = readFileSync(cmsFile)
    const cmsBase64 = cmsBuffer.toString('base64')
    
    return cmsBase64
    
  } catch (error) {
    log.error('Error firmando TRA', error)
    throw new Error('Error al firmar el TRA. Verifique el certificado y la clave privada.')
  } finally {
    // Clean up temporary files
    try {
      if (existsSync(traFile)) unlinkSync(traFile)
      if (existsSync(keyFile)) unlinkSync(keyFile)
      if (existsSync(certFile)) unlinkSync(certFile)
      if (existsSync(cmsFile)) unlinkSync(cmsFile)
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Parsea la respuesta XML de AFIP
 */
function parsearRespuesta(xml: string): { token: string; sign: string; expiration: Date } {
  try {
    // Extraer token
    const tokenMatch = xml.match(/<token>([^<]+)<\/token>/)
    const signMatch = xml.match(/<sign>([^<]+)<\/sign>/)
    const expirationMatch = xml.match(/<expirationTime>([^<]+)<\/expirationTime>/)

    if (!tokenMatch || !signMatch || !expirationMatch) {
      throw new Error('Respuesta de AFIP incompleta')
    }

    return {
      token: tokenMatch[1],
      sign: signMatch[1],
      expiration: new Date(expirationMatch[1])
    }
  } catch (error) {
    console.error('Error parseando respuesta AFIP:', error)
    throw new Error('Error al procesar respuesta de AFIP')
  }
}

/**
 * Realiza la llamada HTTP al WSAA
 */
async function llamarWSAA(cms: string, url: string): Promise<string> {
  // Crear envelope SOAP
  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="https://wsaahomo.afip.gov.ar/ws/services/LoginCms">
  <soapenv:Header/>
  <soapenv:Body>
    <wsaa:loginCms>
      <wsaa:in0>${cms}</wsaa:in0>
    </wsaa:loginCms>
  </soapenv:Body>
</soapenv:Envelope>`

  log.info(`[WSAA] Llamando a ${url}...`)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
      'User-Agent': 'AFIP-WS-Client/1.0'
    },
    body: soapEnvelope
  })

  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status}`)
  }

  const responseText = await response.text()

  // Verificar fault
  if (responseText.includes('<faultstring>')) {
    const faultMatch = responseText.match(/<faultstring>([^<]+)<\/faultstring>/)
    const faultCode = responseText.match(/<faultcode>([^<]+)<\/faultcode>/)
    throw new Error(`Error AFIP: ${faultMatch ? faultMatch[1] : 'Error desconocido'} (${faultCode ? faultCode[1] : 'sin código'})`)
  }

  // Verificar error específico de AFIP
  if (responseText.includes('<Err>')) {
    const errCodeMatch = responseText.match(/<Code>(\d+)<\/Code>/)
    const errMsgMatch = responseText.match(/<Msg>([^<]+)<\/Msg>/)
    throw new Error(`Error AFIP ${errCodeMatch ? errCodeMatch[1] : ''}: ${errMsgMatch ? errMsgMatch[1] : 'Error desconocido'}`)
  }

  return responseText
}

/**
 * Obtiene un token de acceso del WSAA
 * Usa cache para evitar solicitudes innecesarias (el token dura 12 horas)
 */
export async function obtenerTokenAcceso(
  service: string = 'wsfe',
  config?: WSAAConfig
): Promise<TokenAcceso> {
  // Si no se proporciona config, obtenerlo de la base de datos
  const cfg = config || await getConfiguracionAFIP()
  if (!cfg) {
    throw new Error('Configuración AFIP no disponible. Configure los certificados primero.')
  }

  const cacheKey = `${cfg.cuit}-${service}-${cfg.ambiente}`

  // Verificar cache (token válido por más de 10 minutos)
  const cached = tokenCache.get(cacheKey)
  if (cached && cached.expiration > new Date(Date.now() + 10 * 60 * 1000)) {
    log.info(`[WSAA] Usando token en cache para ${service}`)
    return {
      token: cached.token,
      sign: cached.sign,
      expiration: cached.expiration,
      generationTime: new Date(cached.expiration.getTime() - 12 * 60 * 60 * 1000)
    }
  }

  log.info(`[WSAA] Solicitando nuevo token para ${service}...`)

  // Generar TRA
  const tra = generarTRA(service)

  // Firmar TRA
  const cms = await firmarTRA(tra, cfg.certificado, cfg.clavePrivada)

  // Enviar a AFIP
  const url = WSAA_URLS[cfg.ambiente]
  const responseText = await llamarWSAA(cms, url)

  // Parsear respuesta
  const { token, sign, expiration } = parsearRespuesta(responseText)

  // Guardar en cache
  tokenCache.set(cacheKey, {
    token,
    sign,
    expiration,
    cuit: cfg.cuit,
    service,
    ambiente: cfg.ambiente
  })

  // Actualizar fecha de último token en BD
  try {
    const afipConfig = await db.aFIPConfig.findFirst()
    if (afipConfig) {
      await db.aFIPConfig.update({
        where: { id: afipConfig.id },
        data: { ultimoToken: new Date() }
      })
    }
  } catch (e) {
    // Ignore errors updating last token date
  }

  log.info(`[WSAA] Token obtenido correctamente. Vence: ${expiration.toISOString()}`)

  return {
    token,
    sign,
    expiration,
    generationTime: new Date()
  }
}

/**
 * Obtiene la configuración AFIP desde la base de datos
 */
export async function getConfiguracionAFIP(): Promise<WSAAConfig | null> {
  const config = await db.configuracionFrigorifico.findFirst()

  if (!config || !config.cuit) {
    return null
  }

  // Obtener certificados de la configuración
  const certificados = await db.aFIPConfig.findFirst()

  if (!certificados || !certificados.certificado || !certificados.clavePrivada) {
    return null
  }

  return {
    cuit: config.cuit.replace(/-/g, ''),
    razonSocial: config.nombre,
    puntoVenta: certificados.puntoVenta,
    domicilio: config.direccion || certificados.domicilio || '',
    inicioActividades: certificados.inicioActividades || '',
    certificado: certificados.certificado,
    clavePrivada: certificados.clavePrivada,
    ambiente: certificados.ambiente as 'testing' | 'production'
  }
}

/**
 * Verifica si la configuración AFIP está completa
 */
export async function verificarConfiguracionAFIP(): Promise<{
  configurado: boolean
  errores: string[]
}> {
  const errores: string[] = []

  const config = await db.configuracionFrigorifico.findFirst()

  if (!config) {
    errores.push('No hay configuración del frigorífico')
    return { configurado: false, errores }
  }

  if (!config.cuit) {
    errores.push('Falta configurar el CUIT')
  }

  const afipConfig = await db.aFIPConfig.findFirst()

  if (!afipConfig) {
    errores.push('No hay configuración AFIP')
    return { configurado: false, errores }
  }

  if (!afipConfig.certificado) {
    errores.push('Falta cargar el certificado')
  }

  if (!afipConfig.clavePrivada) {
    errores.push('Falta cargar la clave privada')
  }

  if (!afipConfig.puntoVenta) {
    errores.push('Falta configurar el punto de venta')
  }

  // Verificar si el certificado está por vencer
  if (afipConfig.fechaVencimiento) {
    const diasParaVencer = Math.ceil(
      (afipConfig.fechaVencimiento.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (diasParaVencer < 30) {
      errores.push(`El certificado vence en ${diasParaVencer} días. Renueve el certificado.`)
    }
  }

  return {
    configurado: errores.length === 0,
    errores
  }
}

/**
 * Prueba la conexión con AFIP
 */
export async function probarConexionAFIP(): Promise<{
  exito: boolean
  mensaje: string
  vencimiento?: Date
}> {
  try {
    const config = await getConfiguracionAFIP()

    if (!config) {
      return {
        exito: false,
        mensaje: 'Configuración AFIP incompleta'
      }
    }

    const token = await obtenerTokenAcceso('wsfe', config)

    return {
      exito: true,
      mensaje: 'Conexión exitosa con AFIP',
      vencimiento: token.expiration
    }
  } catch (error) {
    return {
      exito: false,
      mensaje: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Invalida el cache de tokens
 */
export function invalidarCache(): void {
  tokenCache.clear()
  log.info('[WSAA] Cache invalidado')
}

/**
 * Obtiene información del token en cache
 */
export function getTokenCacheInfo(): { service: string; expiration: Date } | null {
  for (const [key, value] of tokenCache.entries()) {
    return { service: value.service, expiration: value.expiration }
  }
  return null
}
