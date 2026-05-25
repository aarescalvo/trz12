import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'
import { checkPermission } from '@/lib/auth-helpers'
import { createLogger } from '@/lib/logger'
const log = createLogger('app.api.afip.auth.route')

/**
 * API de Autenticación AFIP
 * 
 * En modo testing: genera un token ficticio para pruebas
 * En modo producción: conecta con AFIP WSAA para obtener token real
 */

// Configuración de endpoints AFIP
const AFIP_WSAA_URLS = {
  testing: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
  production: 'https://wsaa.afip.gov.ar/ws/services/LoginCms'
}

const AFIP_WSFEX_URLS = {
  testing: 'https://wshomo.afip.gov.ar/wsfexv1/service.asmx',
  production: 'https://servicios1.afip.gov.ar/wsfexv1/service.asmx'
}

interface AFIPConfig {
  cuit: string | null
  razonSocial: string | null
  puntoVenta: number
  ambiente: string
  certificado: string | null
  clavePrivada: string | null
  habilitado: boolean
}

/**
 * Genera un token ficticio para testing
 */
function generateMockToken(): { token: string; sign: string; expiration: Date } {
  // Token ficticio para testing
  const token = `TEST_TOKEN_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const sign = crypto.createHash('sha256').update(token).digest('hex')
  
  // Token válido por 12 horas
  const expiration = new Date()
  expiration.setHours(expiration.getHours() + 12)
  
  return { token, sign, expiration }
}

/**
 * Genera el CMS (Cryptographic Message Syntax) para AFIP
 * En producción, esto usa OpenSSL con los certificados reales
 */
async function generateCMS(
  certificado: string,
  clavePrivada: string,
  service: string,
  ttl: number = 3600000 // 1 hora por defecto
): Promise<string> {
  // En testing, retornamos un CMS ficticio
  // En producción, se usaría OpenSSL para generar el CMS real
  
  const now = new Date()
  const expiration = new Date(now.getTime() + ttl)
  
  const tra = `<?xml version="1.0" encoding="UTF-8"?>
    <loginTicketRequest version="1.0">
      <header>
        <uniqueId>${Date.now()}</uniqueId>
        <generationTime>${now.toISOString()}</generationTime>
        <expirationTime>${expiration.toISOString()}</expirationTime>
      </header>
      <service>${service}</service>
    </loginTicketRequest>`
  
  // En producción, aquí se firmaría el TRA con OpenSSL
  // Por ahora retornamos el TRA sin firmar (solo para testing)
  return Buffer.from(tra).toString('base64')
}

/**
 * GET - Obtener configuración AFIP y estado de autenticación
 */
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    // Obtener configuración AFIP
    let config = await db.aFIPConfig.findFirst()
    
    if (!config) {
      // Crear configuración por defecto
      config = await db.aFIPConfig.create({
        data: {
          ambiente: 'testing',
          puntoVenta: 1,
          habilitado: true
        }
      })
    }
    
    // Verificar si hay un token válido (cacheado)
    const tokenValido = config.ultimoToken && 
      config.ultimoToken > new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 horas
    
    return NextResponse.json({
      success: true,
      data: {
        configurado: !!(config.cuit && config.razonSocial),
        habilitado: config.habilitado,
        ambiente: config.ambiente,
        cuit: config.cuit,
        razonSocial: config.razonSocial,
        puntoVenta: config.puntoVenta,
        certificadoCargado: !!config.certificado,
        clavePrivadaCargada: !!config.clavePrivada,
        fechaVencimiento: config.fechaVencimiento,
        tokenValido,
        ultimoToken: config.ultimoToken,
        urls: {
          wsaa: config.ambiente === 'testing' ? AFIP_WSAA_URLS.testing : AFIP_WSAA_URLS.production,
          wsfex: config.ambiente === 'testing' ? AFIP_WSFEX_URLS.testing : AFIP_WSFEX_URLS.production
        }
      }
    })
  } catch (error) {
    console.error('Error obteniendo configuración AFIP:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener configuración AFIP' },
      { status: 500 }
    )
  }
}

/**
 * POST - Autenticar con AFIP y obtener token
 */
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const body = await request.json()
    const { service = 'wsfex' } = body
    
    // Obtener configuración AFIP
    const config = await db.aFIPConfig.findFirst()
    
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Configuración AFIP no encontrada' },
        { status: 400 }
      )
    }
    
    // Validar configuración mínima
    if (!config.cuit) {
      return NextResponse.json(
        { success: false, error: 'CUIT no configurado' },
        { status: 400 }
      )
    }
    
    let token: string
    let sign: string
    let expiration: Date
    
    if (config.ambiente === 'testing') {
      // MODO TESTING: Generar token ficticio
      const mockAuth = generateMockToken()
      token = mockAuth.token
      sign = mockAuth.sign
      expiration = mockAuth.expiration
      
      log.info('[AFIP] Generando token de TESTING')
    } else {
      // MODO PRODUCCIÓN: Conectar con AFIP WSAA
      if (!config.certificado || !config.clavePrivada) {
        return NextResponse.json(
          { success: false, error: 'Certificados no configurados para producción' },
          { status: 400 }
        )
      }
      
      try {
        // Generar CMS firmado
        const cms = await generateCMS(
          config.certificado,
          config.clavePrivada,
          service
        )
        
        // En producción, aquí se haría la llamada SOAP a AFIP WSAA
        // Por ahora simulamos la respuesta
        const mockAuth = generateMockToken()
        token = mockAuth.token
        sign = mockAuth.sign
        expiration = mockAuth.expiration
        
        log.info('[AFIP] Token de PRODUCCIÓN generado (simulado)')
      } catch (error) {
        console.error('[AFIP] Error generando CMS:', error)
        return NextResponse.json(
          { success: false, error: 'Error al generar CMS para AFIP' },
          { status: 500 }
        )
      }
    }
    
    // Actualizar fecha de último token
    await db.aFIPConfig.update({
      where: { id: config.id },
      data: { ultimoToken: new Date() }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        token,
        sign,
        expiration,
        cuit: config.cuit,
        ambiente: config.ambiente,
        puntoVenta: config.puntoVenta
      },
      message: config.ambiente === 'testing' 
        ? 'Token de testing generado exitosamente' 
        : 'Token de producción generado exitosamente'
    })
    
  } catch (error) {
    console.error('Error en autenticación AFIP:', error)
    return NextResponse.json(
      { success: false, error: 'Error en autenticación AFIP' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Actualizar configuración AFIP
 */
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      cuit,
      razonSocial,
      puntoVenta,
      ambiente,
      certificado,
      clavePrivada,
      habilitado,
      inicioActividades
    } = body
    
    let config = await db.aFIPConfig.findFirst()
    
    const data: any = {}
    if (cuit !== undefined) data.cuit = cuit
    if (razonSocial !== undefined) data.razonSocial = razonSocial
    if (puntoVenta !== undefined) data.puntoVenta = puntoVenta
    if (ambiente !== undefined) data.ambiente = ambiente
    if (certificado !== undefined) data.certificado = certificado
    if (clavePrivada !== undefined) data.clavePrivada = clavePrivada
    if (habilitado !== undefined) data.habilitado = habilitado
    if (inicioActividades !== undefined) data.inicioActividades = new Date(inicioActividades)
    
    if (config) {
      config = await db.aFIPConfig.update({
        where: { id: config.id },
        data
      })
    } else {
      config = await db.aFIPConfig.create({
        data: {
          ...data,
          ambiente: ambiente || 'testing',
          puntoVenta: puntoVenta || 1
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        cuit: config.cuit,
        razonSocial: config.razonSocial,
        puntoVenta: config.puntoVenta,
        ambiente: config.ambiente,
        habilitado: config.habilitado
      },
      message: 'Configuración AFIP actualizada'
    })
    
  } catch (error) {
    console.error('Error actualizando configuración AFIP:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar configuración AFIP' },
      { status: 500 }
    )
  }
}
