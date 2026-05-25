import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Add tropa to lista de faena
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listaFaenaId, tropaId, cantidad } = body

    if (!listaFaenaId || !tropaId || !cantidad) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Check if lista is open
    const lista = await db.listaFaena.findUnique({
      where: { id: listaFaenaId }
    })

    if (!lista || lista.estado !== 'ABIERTA') {
      return NextResponse.json(
        { success: false, error: 'La lista no está abierta' },
        { status: 400 }
      )
    }

    // Check if tropa exists and has enough animals
    const tropa = await db.tropa.findUnique({
      where: { id: tropaId },
      include: {
        animales: { where: { estado: 'PESADO' } }
      }
    })

    if (!tropa) {
      return NextResponse.json(
        { success: false, error: 'Tropa no encontrada' },
        { status: 404 }
      )
    }

    // Check if already added
    const existing = await db.listaFaenaTropa.findUnique({
      where: {
        listaFaenaId_tropaId: { listaFaenaId, tropaId }
      }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'La tropa ya está en la lista' },
        { status: 400 }
      )
    }

    // Add tropa to lista
    await db.listaFaenaTropa.create({
      data: {
        listaFaenaId,
        tropaId,
        cantidad: parseInt(cantidad)
      }
    })

    // Update total
    await db.listaFaena.update({
      where: { id: listaFaenaId },
      data: {
        cantidadTotal: { increment: parseInt(cantidad) }
      }
    })

    // Update tropa status
    await db.tropa.update({
      where: { id: tropaId },
      data: { estado: 'LISTO_FAENA' }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding tropa:', error)
    return NextResponse.json(
      { success: false, error: 'Error al agregar tropa' },
      { status: 500 }
    )
  }
}
