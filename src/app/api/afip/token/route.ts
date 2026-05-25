import { NextRequest, NextResponse } from 'next/server'
import { 
  obtenerTokenAcceso, 
  getConfiguracionAFIP, 
  probarConexionAFIP, 
  invalidarCache,
  getTokenCacheInfo 
} from '@/lib/afip-wsaa'
import { FEDummy } from '@/lib/afip-wsfe'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener información del token actual
export async function GET() {
  try {
    // Verificar configuración
    const config = await getConfiguracionAFIP()
    
    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'Configuración AFIP incompleta',
        configured: false
      }, { status: 400 })
    }

    // Obtener info del cache
    const cacheInfo = getTokenCacheInfo()
    
    // Obtener estado del servicio
    let serviceStatus: { appServer: string; dbServer: string; authServer: string } | null = null
    try {
      serviceStatus = await FEDummy()
    } catch (e) {
      serviceStatus = { appServer: 'ERROR', dbServer: 'ERROR', authServer: 'ERROR' }
    }

    return NextResponse.json({
      success: true,
      data: {
        configured: true,
        cuit: config.cuit,
        puntoVenta: config.puntoVenta,
        ambiente: config.ambiente,
        razonSocial: config.razonSocial,
        tokenCached: cacheInfo !== null,
        tokenExpiration: cacheInfo?.expiration || null,
        serviceStatus
      }
    })
  } catch (error) {
    console.error('Error al obtener token AFIP:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// POST - Obtener/renovar token
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const body = await request.json().catch(() => ({}))
    const { force = false, service = 'wsfe' } = body

    // Verificar configuración
    const config = await getConfiguracionAFIP()
    
    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'Configuración AFIP incompleta. Configure los certificados primero.'
      }, { status: 400 })
    }

    // Si se fuerza renovación, invalidar cache
    if (force) {
      invalidarCache()
    }

    // Obtener token
    const token = await obtenerTokenAcceso(service, config)

    return NextResponse.json({
      success: true,
      data: {
        token: token.token.substring(0, 20) + '...', // No exponer token completo
        sign: token.sign.substring(0, 20) + '...',   // No exponer sign completo
        expiration: token.expiration.toISOString(),
        generationTime: token.generationTime.toISOString(),
        expiresIn: Math.floor((token.expiration.getTime() - Date.now()) / 1000 / 60) // minutos
      }
    })
  } catch (error) {
    console.error('Error al obtener token AFIP:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// PUT - Probar conexión con AFIP
export async function PUT() {
  try {
    const resultado = await probarConexionAFIP()
    
    return NextResponse.json({
      success: resultado.exito,
      message: resultado.mensaje,
      vencimiento: resultado.vencimiento?.toISOString()
    })
  } catch (error) {
    console.error('Error al probar conexión AFIP:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// DELETE - Invalidar cache de tokens
export async function DELETE() {
  try {
    invalidarCache()
    
    return NextResponse.json({
      success: true,
      message: 'Cache de tokens invalidado'
    })
  } catch (error) {
    console.error('Error al invalidar cache:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
