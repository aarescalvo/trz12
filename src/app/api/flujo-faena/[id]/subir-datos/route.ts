import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// PUT - Mark data as uploaded to system
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkPermission(request, 'puedeListaFaena')
  if (authError) return authError
  try {
    const { id } = await params
    const body = await request.json()
    const { operadorId, observaciones } = body

    const flujoActual = await db.flujoFaena.findUnique({
      where: { id },
      include: {
        listaFaena: {
          include: {
            tropas: {
              include: {
                tropa: true
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

    // Verify that visto bueno was granted
    if (!flujoActual.vistoBueno) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el visto bueno del supervisor antes de subir los datos' },
        { status: 400 }
      )
    }

    // Check if data was already uploaded
    if (flujoActual.datosSubidos) {
      return NextResponse.json(
        { success: false, error: 'Los datos ya fueron subidos al sistema' },
        { status: 400 }
      )
    }

    // Check current state
    if (flujoActual.estado !== 'CONFIRMADO') {
      return NextResponse.json(
        { success: false, error: `El flujo está en estado ${flujoActual.estado}, no puede subir datos` },
        { status: 400 }
      )
    }

    const flujo = await db.flujoFaena.update({
      where: { id },
      data: {
        fechaSubida: new Date(),
        estado: 'DATOS_SUBIDOS',
        observaciones: observaciones ? `${flujoActual.observaciones || ''}\n[Subida] ${observaciones}` : flujoActual.observaciones,
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
      message: 'Datos subidos correctamente. Listo para emitir reportes.'
    })
  } catch (error) {
    console.error('Error uploading data:', error)
    return NextResponse.json(
      { success: false, error: 'Error al subir datos' },
      { status: 500 }
    )
  }
}
