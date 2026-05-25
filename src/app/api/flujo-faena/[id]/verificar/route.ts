import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// PUT - Mark data as verified
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkPermission(request, 'puedeListaFaena')
  if (authError) return authError
  try {
    const { id } = await params
    const body = await request.json()
    const { verificadorId, observaciones } = body

    const flujoActual = await db.flujoFaena.findUnique({
      where: { id },
      include: {
        listaFaena: {
          include: {
            tropas: {
              include: {
                tropa: {
                  include: {
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

    // Check if already verified
    if (flujoActual.datosVerificados) {
      return NextResponse.json(
        { success: false, error: 'Los datos ya fueron verificados' },
        { status: 400 }
      )
    }

    // Validate that lista faena has data to verify
    const tieneTropas = flujoActual.listaFaena?.tropas && flujoActual.listaFaena.tropas.length > 0
    if (!tieneTropas) {
      return NextResponse.json(
        { success: false, error: 'La lista de faena no tiene tropas asignadas' },
        { status: 400 }
      )
    }

    const flujo = await db.flujoFaena.update({
      where: { id },
      data: {
        verificadorId,
        fechaVerificacion: new Date(),
        estado: 'PENDIENTE_VISTO_BUENO',
        observaciones: observaciones ? `${flujoActual.observaciones || ''}\n[Verificación] ${observaciones}` : flujoActual.observaciones,
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
      message: 'Datos verificados correctamente. Pendiente visto bueno del supervisor.'
    })
  } catch (error) {
    console.error('Error verifying data:', error)
    return NextResponse.json(
      { success: false, error: 'Error al verificar datos' },
      { status: 500 }
    )
  }
}
