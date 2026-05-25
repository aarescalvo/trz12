import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - List all flujo faena records
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeListaFaena')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const listaFaenaId = searchParams.get('listaFaenaId')

    const where: Record<string, unknown> = {}
    if (estado) {
      where.estado = estado
    }
    if (listaFaenaId) {
      where.listaFaenaId = listaFaenaId
    }

    const flujos = await db.flujoFaena.findMany({
      where,
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
      },
      orderBy: { fecha: 'desc' }
    })

    return NextResponse.json({ success: true, data: flujos })
  } catch (error) {
    console.error('Error fetching flujos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener flujos de faena' },
      { status: 500 }
    )
  }
}

// POST - Create new flujo faena
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeListaFaena')
  if (authError) return authError
  try {
    const body = await request.json()
    const { listaFaenaId, operadorId, observaciones } = body

    // Verify lista faena exists
    const listaFaena = await db.listaFaena.findUnique({
      where: { id: listaFaenaId }
    })

    if (!listaFaena) {
      return NextResponse.json(
        { success: false, error: 'Lista de faena no encontrada' },
        { status: 404 }
      )
    }

    // Check if there's already a flujo for this lista
    const existingFlujo = await db.flujoFaena.findUnique({
      where: { listaFaenaId }
    })

    if (existingFlujo) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un flujo para esta lista de faena' },
        { status: 400 }
      )
    }

    // Create flujo with initial history entry
    const flujo = await db.flujoFaena.create({
      data: {
        listaFaenaId,
        estado: 'INICIADO',
        observaciones,
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
      },
    })

    return NextResponse.json({ success: true, data: flujo })
  } catch (error) {
    console.error('Error creating flujo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear flujo de faena' },
      { status: 500 }
    )
  }
}

// PUT - Update flujo faena
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeListaFaena')
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, estado, observaciones, operadorId } = body

    const flujoActual = await db.flujoFaena.findUnique({
      where: { id }
    })

    if (!flujoActual) {
      return NextResponse.json(
        { success: false, error: 'Flujo no encontrado' },
        { status: 404 }
      )
    }

    const flujo = await db.flujoFaena.update({
      where: { id },
      data: {
        estado,
        observaciones,
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
      },
    })

    return NextResponse.json({ success: true, data: flujo })
  } catch (error) {
    console.error('Error updating flujo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar flujo de faena' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel flujo
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeListaFaena')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const operadorId = request.headers.get('x-operador-id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de flujo requerido' },
        { status: 400 }
      )
    }

    const flujoActual = await db.flujoFaena.findUnique({
      where: { id }
    })

    if (!flujoActual) {
      return NextResponse.json(
        { success: false, error: 'Flujo no encontrado' },
        { status: 404 }
      )
    }

    // Instead of deleting, mark as ANULADO
    const flujo = await db.flujoFaena.update({
      where: { id },
      data: {
        estado: 'ANULADO',
      },
      include: {
        listaFaena: true,
      },
    })

    return NextResponse.json({ success: true, data: flujo })
  } catch (error) {
    console.error('Error canceling flujo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al anular flujo de faena' },
      { status: 500 }
    )
  }
}
