import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// PUT - Generate reports
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkPermission(request, 'puedeListaFaena')
  if (authError) return authError
  try {
    const { id } = await params
    const body = await request.json()
    const { operadorId, observaciones, tiposReportes } = body

    const flujoActual = await db.flujoFaena.findUnique({
      where: { id },
      include: {
        listaFaena: {
          include: {
            tropas: {
              include: {
                tropa: {
                  include: {
                    usuarioFaena: true,
                    animales: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!flujoActual) {
      return NextResponse.json(
        { success: false, error: 'Flujo no encontrado' },
        { status: 404 }
      )
    }

    // Verify that data was uploaded
    if (!flujoActual.datosSubidos) {
      return NextResponse.json(
        { success: false, error: 'Los datos deben ser subidos antes de emitir reportes' },
        { status: 400 }
      )
    }

    // Check if reports were already issued
    if (flujoActual.reportesEmitidos) {
      return NextResponse.json(
        { success: false, error: 'Los reportes ya fueron emitidos' },
        { status: 400 }
      )
    }

    // Check current state
    if (flujoActual.estado !== 'DATOS_SUBIDOS') {
      return NextResponse.json(
        { success: false, error: `El flujo está en estado ${flujoActual.estado}, no puede emitir reportes` },
        { status: 400 }
      )
    }

    // Build report metadata
    const reportesMetadata = {
      tiposGenerados: tiposReportes || [
        'RENDIMIENTO_DIARIO',
        'PESAJE_MEDIAS',
        'BALANCE_FAENA',
        'CONTROL_PRODUCCION'
      ],
      fechaGeneracion: new Date().toISOString(),
      generadoPor: operadorId
    }

    const flujo = await db.flujoFaena.update({
      where: { id },
      data: {
        fechaReportes: new Date(),
        estado: 'REPORTES_EMITIDOS',
        observaciones: observaciones 
          ? `${flujoActual.observaciones || ''}\n[Reportes] ${observaciones}` 
          : flujoActual.observaciones,
      },
      include: {
        listaFaena: {
          include: {
            supervisor: true,
            tropas: {
              include: {
                tropa: {
                  include: {
                    usuarioFaena: true
                  }
                }
              }
            }
          }
        },
        verificador: true,
        supervisor: true,
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: flujo,
      message: 'Reportes emitidos correctamente. Listo para enviar romaneos.',
      metadata: reportesMetadata
    })
  } catch (error) {
    console.error('Error emitting reports:', error)
    return NextResponse.json(
      { success: false, error: 'Error al emitir reportes' },
      { status: 500 }
    )
  }
}
