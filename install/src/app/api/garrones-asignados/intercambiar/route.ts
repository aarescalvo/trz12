import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Intercambiar animales entre dos garrones
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { garron1, garron2, operadorId } = body

    if (!garron1 || !garron2) {
      return NextResponse.json(
        { success: false, error: 'Se requieren dos garrones' },
        { status: 400 }
      )
    }

    if (garron1 === garron2) {
      return NextResponse.json(
        { success: false, error: 'Los garrones deben ser diferentes' },
        { status: 400 }
      )
    }

    // Obtener ambas asignaciones
    const asignacion1 = await db.asignacionGarron.findFirst({
      where: { garron: garron1 }
    })
    const asignacion2 = await db.asignacionGarron.findFirst({
      where: { garron: garron2 }
    })

    if (!asignacion1 || !asignacion2) {
      return NextResponse.json(
        { success: false, error: 'Uno o ambos garrones no tienen asignación' },
        { status: 404 }
      )
    }

    // Intercambiar los animales
    await db.$transaction([
      db.asignacionGarron.update({
        where: { id: asignacion1.id },
        data: {
          animalId: asignacion2.animalId,
          tropaCodigo: asignacion2.tropaCodigo,
          animalNumero: asignacion2.animalNumero,
          tipoAnimal: asignacion2.tipoAnimal,
          pesoVivo: asignacion2.pesoVivo
        }
      }),
      db.asignacionGarron.update({
        where: { id: asignacion2.id },
        data: {
          animalId: asignacion1.animalId,
          tropaCodigo: asignacion1.tropaCodigo,
          animalNumero: asignacion1.animalNumero,
          tipoAnimal: asignacion1.tipoAnimal,
          pesoVivo: asignacion1.pesoVivo
        }
      })
    ])

    // También actualizar los romaneos si existen
    const romaneo1 = await db.romaneo.findFirst({ where: { garron: garron1 } })
    const romaneo2 = await db.romaneo.findFirst({ where: { garron: garron2 } })

    if (romaneo1 && romaneo2) {
      await db.$transaction([
        db.romaneo.update({
          where: { id: romaneo1.id },
          data: {
            tropaCodigo: romaneo2.tropaCodigo,
            numeroAnimal: romaneo2.numeroAnimal,
            tipoAnimal: romaneo2.tipoAnimal,
            pesoVivo: romaneo2.pesoVivo
          }
        }),
        db.romaneo.update({
          where: { id: romaneo2.id },
          data: {
            tropaCodigo: romaneo1.tropaCodigo,
            numeroAnimal: romaneo1.numeroAnimal,
            tipoAnimal: romaneo1.tipoAnimal,
            pesoVivo: romaneo1.pesoVivo
          }
        })
      ])
    }

    return NextResponse.json({
      success: true,
      data: { garron1, garron2 }
    })

  } catch (error) {
    console.error('Error intercambiando garrones:', error)
    return NextResponse.json(
      { success: false, error: 'Error al intercambiar garrones' },
      { status: 500 }
    )
  }
}
