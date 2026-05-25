import { NextRequest, NextResponse } from 'next/server'
import { 
  FEParamGetTiposCbte, 
  FEParamGetTiposDoc, 
  FEParamGetTiposIva, 
  FEParamGetTiposMonedas, 
  FEParamGetTiposTributos,
  FEParamGetCotizacion,
  getTiposCacheados,
  limpiarCacheTipos
} from '@/lib/afip-wsfe'
import { getConfiguracionAFIP } from '@/lib/afip-wsaa'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener tipos de AFIP
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const tipo = searchParams.get('tipo') || 'todos'
    const moneda = searchParams.get('moneda') || 'PES'

    // Verificar configuración
    const config = await getConfiguracionAFIP()
    
    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'Configuración AFIP incompleta'
      }, { status: 400 })
    }

    // Si se solicita un tipo específico
    if (tipo !== 'todos') {
      switch (tipo) {
        case 'comprobantes':
          return NextResponse.json({
            success: true,
            data: await FEParamGetTiposCbte()
          })
        case 'documentos':
          return NextResponse.json({
            success: true,
            data: await FEParamGetTiposDoc()
          })
        case 'ivas':
          return NextResponse.json({
            success: true,
            data: await FEParamGetTiposIva()
          })
        case 'monedas':
          return NextResponse.json({
            success: true,
            data: await FEParamGetTiposMonedas()
          })
        case 'tributos':
          return NextResponse.json({
            success: true,
            data: await FEParamGetTiposTributos()
          })
        case 'cotizacion':
          const cotizacion = await FEParamGetCotizacion(moneda)
          return NextResponse.json({
            success: true,
            data: cotizacion
          })
        default:
          return NextResponse.json({
            success: false,
            error: 'Tipo no válido. Use: comprobantes, documentos, ivas, monedas, tributos, cotizacion'
          }, { status: 400 })
      }
    }

    // Obtener todos los tipos (usar cache si está disponible)
    const cacheados = getTiposCacheados()
    
    // Si hay cache, devolverlo
    if (cacheados.comprobantes.length > 0) {
      return NextResponse.json({
        success: true,
        cached: true,
        data: cacheados
      })
    }

    // Si no hay cache, obtener de AFIP
    const [comprobantes, documentos, ivas, monedas, tributos] = await Promise.all([
      FEParamGetTiposCbte(),
      FEParamGetTiposDoc(),
      FEParamGetTiposIva(),
      FEParamGetTiposMonedas(),
      FEParamGetTiposTributos()
    ])

    return NextResponse.json({
      success: true,
      cached: false,
      data: {
        comprobantes,
        documentos,
        ivas,
        monedas,
        tributos
      }
    })
  } catch (error) {
    console.error('Error al obtener tipos AFIP:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// DELETE - Limpiar cache de tipos
export async function DELETE() {
  try {
    limpiarCacheTipos()
    
    return NextResponse.json({
      success: true,
      message: 'Cache de tipos limpiado'
    })
  } catch (error) {
    console.error('Error al limpiar cache:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
