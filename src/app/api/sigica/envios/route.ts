import { NextRequest, NextResponse } from 'next/server'
import { obtenerEnviosSIGICA, enviarRomaneosSIGICA, actualizarStockCamaraSIGICA } from '@/lib/sigica'
import { registrarAuditoria } from '@/lib/audit'
import { checkPermission } from '@/lib/auth-helpers'

// GET /api/sigica/envios - Listar envíos a SIGICA
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    
    // Parsear filtros
    const filtros = {
      tipo: searchParams.get('tipo') || undefined,
      estado: searchParams.get('estado') || undefined,
      desde: searchParams.get('desde') ? new Date(searchParams.get('desde')!) : undefined,
      hasta: searchParams.get('hasta') ? new Date(searchParams.get('hasta')!) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!) : 50
    }

    const envios = await obtenerEnviosSIGICA(filtros)

    return NextResponse.json({
      success: true,
      data: envios
    })
  } catch (error) {
    console.error('Error al obtener envíos SIGICA:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener envíos' },
      { status: 500 }
    )
  }
}

// POST /api/sigica/envios - Crear y enviar un nuevo envío a SIGICA
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const body = await request.json()
    
    const { tipo, romaneoIds, camaraIds, operadorId } = body

    if (!tipo) {
      return NextResponse.json(
        { success: false, error: 'Tipo de envío es requerido' },
        { status: 400 }
      )
    }

    let resultado

    if (tipo === 'ROMANEO') {
      if (!romaneoIds || !Array.isArray(romaneoIds) || romaneoIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Se requieren IDs de romaneos para enviar' },
          { status: 400 }
        )
      }

      resultado = await enviarRomaneosSIGICA({
        romaneoIds,
        operadorId
      })

      // Registrar auditoría
      await registrarAuditoria({
        modulo: 'SIGICA',
        accion: 'CREATE',
        entidad: 'EnvioSIGICA',
        descripcion: `Envío de romaneos a SIGICA: ${romaneoIds.length} registros`,
        datosDespues: JSON.stringify({
          tipo: 'ROMANEO',
          romaneoIds,
          resultado
        }),
        operadorId
      })
    } else if (tipo === 'STOCK_CAMARA') {
      resultado = await actualizarStockCamaraSIGICA({
        camaraIds,
        operadorId
      })

      // Registrar auditoría
      await registrarAuditoria({
        modulo: 'SIGICA',
        accion: 'CREATE',
        entidad: 'EnvioSIGICA',
        descripcion: 'Actualización de stock de cámaras en SIGICA',
        datosDespues: JSON.stringify({
          tipo: 'STOCK_CAMARA',
          camaraIds,
          resultado
        }),
        operadorId
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Tipo de envío no soportado' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: resultado.exito,
      data: resultado
    })
  } catch (error) {
    console.error('Error al crear envío SIGICA:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear envío' },
      { status: 500 }
    )
  }
}
