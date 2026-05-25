import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Cambiar animal asignado a un garrón
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { garron, nuevoAnimalCodigo, operadorId } = body

    if (!garron || !nuevoAnimalCodigo) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Buscar el nuevo animal por código
    const nuevoAnimal = await db.animal.findFirst({
      where: { codigo: nuevoAnimalCodigo },
      include: { tropa: true }
    })

    if (!nuevoAnimal) {
      return NextResponse.json(
        { success: false, error: 'Animal no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el nuevo animal ya tiene un garrón asignado
    const garronExistente = await db.asignacionGarron.findFirst({
      where: { 
        animalId: nuevoAnimal.id,
        NOT: { garron }
      }
    })

    if (garronExistente) {
      return NextResponse.json(
        { success: false, error: `El animal ya está asignado al garrón #${garronExistente.garron}` },
        { status: 400 }
      )
    }

    // Actualizar la asignación
    const asignacion = await db.asignacionGarron.findFirst({
      where: { garron }
    })

    if (!asignacion) {
      return NextResponse.json(
        { success: false, error: 'Asignación no encontrada' },
        { status: 404 }
      )
    }

    await db.asignacionGarron.update({
      where: { id: asignacion.id },
      data: {
        animalId: nuevoAnimal.id,
        tropaCodigo: nuevoAnimal.tropa?.codigo,
        animalNumero: nuevoAnimal.numero,
        tipoAnimal: nuevoAnimal.tipoAnimal?.toString(),
        pesoVivo: nuevoAnimal.pesoVivo
      }
    })

    // Actualizar el romaneo si existe
    await db.romaneo.updateMany({
      where: { garron },
      data: {
        tropaCodigo: nuevoAnimal.tropa?.codigo,
        numeroAnimal: nuevoAnimal.numero,
        tipoAnimal: nuevoAnimal.tipoAnimal,
        pesoVivo: nuevoAnimal.pesoVivo
      }
    })

    return NextResponse.json({
      success: true,
      data: { garron, nuevoAnimalCodigo }
    })

  } catch (error) {
    console.error('Error cambiando animal:', error)
    return NextResponse.json(
      { success: false, error: 'Error al cambiar animal' },
      { status: 500 }
    )
  }
}
