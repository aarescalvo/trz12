import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { EstadoListaFaena } from '@prisma/client'
import { checkPermission } from '@/lib/auth-helpers'

// POST - Aceptar lista de faena
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeListaFaena')
  if (authError) return authError
  try {
    const body = await request.json()
    const { listaFaenaId, supervisorId } = body

    if (!listaFaenaId) {
      return NextResponse.json(
        { success: false, error: 'Falta el ID de la lista de faena' },
        { status: 400 }
      )
    }

    // Check if lista exists and is open
    const lista = await db.listaFaena.findUnique({
      where: { id: listaFaenaId },
      include: {
        tropas: {
          include: {
            tropa: true
          }
        }
      }
    })

    if (!lista) {
      return NextResponse.json(
        { success: false, error: 'Lista de faena no encontrada' },
        { status: 404 }
      )
    }

    if (lista.estado !== EstadoListaFaena.ABIERTA) {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden aceptar listas en estado ABIERTA' },
        { status: 400 }
      )
    }

    // Update lista status to EN_PROCESO
    const updatedLista = await db.listaFaena.update({
      where: { id: listaFaenaId },
      data: {
        estado: EstadoListaFaena.EN_PROCESO,
        supervisorId: supervisorId,
      },
      include: {
        tropas: {
          include: {
            tropa: {
              include: {
                usuarioFaena: true,
                corral: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedLista,
      message: 'Lista de faena aceptada correctamente'
    })
  } catch (error) {
    console.error('Error accepting lista faena:', error)
    return NextResponse.json(
      { success: false, error: 'Error al aceptar lista de faena: ' + (error instanceof Error ? error.message : 'Error desconocido') },
      { status: 500 }
    )
  }
}
