import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Assign garron to animal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listaFaenaId, garron, animalCodigo } = body

    if (!listaFaenaId || !garron) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Check if lista is open
    const lista = await db.listaFaena.findUnique({
      where: { id: listaFaenaId }
    })

    if (!lista || lista.estado === 'CERRADA') {
      return NextResponse.json(
        { success: false, error: 'La lista está cerrada' },
        { status: 400 }
      )
    }

    // Check if garron already assigned
    const existingGarron = await db.asignacionGarron.findUnique({
      where: {
        listaFaenaId_garron: { listaFaenaId, garron: parseInt(garron) }
      }
    })

    if (existingGarron) {
      return NextResponse.json(
        { success: false, error: 'El garrón ya está asignado' },
        { status: 400 }
      )
    }

    let animal = null

    // Find animal by code or get next available
    if (animalCodigo) {
      animal = await db.animal.findUnique({
        where: { codigo: animalCodigo }
      })

      if (!animal) {
        return NextResponse.json(
          { success: false, error: 'Animal no encontrado' },
          { status: 404 }
        )
      }

      // Check if animal already assigned
      const existingAnimal = await db.asignacionGarron.findUnique({
        where: { animalId: animal.id }
      })

      if (existingAnimal) {
        return NextResponse.json(
          { success: false, error: 'El animal ya tiene garrón asignado' },
          { status: 400 }
        )
      }
    } else {
      // Get next available animal from tropas in this lista
      const listaTropas = await db.listaFaenaTropa.findMany({
        where: { listaFaenaId }
      })

      const tropaIds = listaTropas.map(lt => lt.tropaId)

      // Find first animal without garron assignment
      const animalesDisponibles = await db.animal.findMany({
        where: {
          tropaId: { in: tropaIds },
          estado: 'PESADO',
          asignacionGarron: null
        },
        orderBy: { numero: 'asc' },
        take: 1
      })

      if (animalesDisponibles.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No hay animales disponibles' },
          { status: 400 }
        )
      }

      animal = animalesDisponibles[0]
    }

    // Create assignment
    const asignacion = await db.asignacionGarron.create({
      data: {
        listaFaenaId,
        garron: parseInt(garron),
        animalId: animal.id,
        numeroAnimal: animal.numero
      },
      include: {
        animal: {
          select: {
            id: true,
            codigo: true,
            numero: true,
            tipoAnimal: true
          }
        }
      }
    })

    // Update animal status
    await db.animal.update({
      where: { id: animal.id },
      data: { estado: 'EN_FAENA' }
    })

    return NextResponse.json({ success: true, data: asignacion })
  } catch (error) {
    console.error('Error assigning garron:', error)
    return NextResponse.json(
      { success: false, error: 'Error al asignar garrón' },
      { status: 500 }
    )
  }
}
