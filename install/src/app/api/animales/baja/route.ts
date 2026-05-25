import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Register animal death/baja
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { animalId, motivoBaja } = body

    if (!animalId || !motivoBaja) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Get animal
    const animal = await db.animal.findUnique({
      where: { id: animalId },
      include: { tropa: true }
    })

    if (!animal) {
      return NextResponse.json(
        { success: false, error: 'Animal no encontrado' },
        { status: 404 }
      )
    }

    // Update animal state
    const updatedAnimal = await db.animal.update({
      where: { id: animalId },
      data: {
        estado: 'FALLECIDO',
        fechaBaja: new Date(),
        motivoBaja
      }
    })

    // Update tropa cantidadCabezas
    await db.tropa.update({
      where: { id: animal.tropaId },
      data: {
        cantidadCabezas: { decrement: 1 }
      }
    })

    // Register audit
    await db.auditoria.create({
      data: {
        operadorId: null,
        modulo: 'MOVIMIENTO_HACIENDA',
        accion: 'UPDATE',
        entidad: 'Animal',
        entidadId: animalId,
        descripcion: `Animal ${animal.codigo} dado de baja - Motivo: ${motivoBaja}`
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedAnimal
    })
  } catch (error) {
    console.error('Error registering baja:', error)
    return NextResponse.json(
      { success: false, error: 'Error al registrar baja' },
      { status: 500 }
    )
  }
}
