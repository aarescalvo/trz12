import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Cerrar lista de faena
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listaFaenaId, supervisorId } = body

    if (!listaFaenaId) {
      return NextResponse.json(
        { success: false, error: 'ID de lista requerido' },
        { status: 400 }
      )
    }

    const lista = await db.listaFaena.findUnique({
      where: { id: listaFaenaId }
    })

    if (!lista) {
      return NextResponse.json(
        { success: false, error: 'Lista no encontrada' },
        { status: 404 }
      )
    }

    if (lista.estado !== 'ABIERTA') {
      return NextResponse.json(
        { success: false, error: 'La lista no está abierta' },
        { status: 400 }
      )
    }

    // Cerrar lista
    await db.listaFaena.update({
      where: { id: listaFaenaId },
      data: {
        estado: 'CERRADA',
        supervisorId,
        fechaCierre: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cerrando lista:', error)
    return NextResponse.json(
      { success: false, error: 'Error al cerrar lista' },
      { status: 500 }
    )
  }
}
