import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener garrones asignados con su estado de pesaje
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')
    
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    const fechaFiltro = fecha ? new Date(fecha) : hoy

    // Buscar asignaciones de garrones del día
    const asignaciones = await db.asignacionGarron.findMany({
      where: {
        horaIngreso: {
          gte: fechaFiltro,
          lt: new Date(fechaFiltro.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        animal: {
          include: {
            tropa: true,
            pesajeIndividual: true
          }
        }
      },
      orderBy: { garron: 'asc' }
    })

    // Formatear respuesta usando los campos del schema
    const data = asignaciones.map(a => {
      return {
        garron: a.garron,
        animalId: a.animalId,
        animalCodigo: a.animal?.codigo || null,
        tropaCodigo: a.tropaCodigo || a.animal?.tropa?.codigo || null,
        tipoAnimal: a.tipoAnimal || a.animal?.tipoAnimal?.toString() || null,
        pesoVivo: a.pesoVivo || a.animal?.pesoVivo || a.animal?.pesajeIndividual?.peso || null,
        tieneMediaDer: a.tieneMediaDer,
        tieneMediaIzq: a.tieneMediaIzq,
        completado: a.completado
      }
    })

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Error obteniendo garrones asignados:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener garrones' },
      { status: 500 }
    )
  }
}

// POST - Asignar garrón a un animal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { garron, animalId, operadorId } = body

    if (!garron) {
      return NextResponse.json(
        { success: false, error: 'Número de garrón requerido' },
        { status: 400 }
      )
    }

    // Verificar si el garrón ya está asignado hoy
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const existente = await db.asignacionGarron.findFirst({
      where: {
        garron,
        horaIngreso: {
          gte: hoy,
          lt: new Date(hoy.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    })

    if (existente) {
      return NextResponse.json(
        { success: false, error: 'El garrón ya está asignado' },
        { status: 400 }
      )
    }

    // Obtener datos del animal si se proporcionó
    let animalData = null
    if (animalId) {
      const animal = await db.animal.findUnique({
        where: { id: animalId },
        include: {
          tropa: true,
          pesajeIndividual: true
        }
      })
      
      if (animal) {
        animalData = {
          id: animal.id,
          codigo: animal.codigo,
          tropaCodigo: animal.tropa?.codigo,
          tipoAnimal: animal.tipoAnimal?.toString(),
          pesoVivo: animal.pesoVivo || animal.pesajeIndividual?.peso,
          numero: animal.numero
        }
      }
    }

    // Crear asignación
    const asignacion = await db.asignacionGarron.create({
      data: {
        garron,
        animalId: animalId || null,
        tropaCodigo: animalData?.tropaCodigo || null,
        animalNumero: animalData?.numero || null,
        tipoAnimal: animalData?.tipoAnimal || null,
        pesoVivo: animalData?.pesoVivo || null,
        operadorId: operadorId || null,
        tieneMediaDer: false,
        tieneMediaIzq: false,
        completado: false,
        horaIngreso: new Date()
      }
    })

    // Si hay animal asignado, actualizar su estado
    if (animalId) {
      await db.animal.update({
        where: { id: animalId },
        data: { estado: 'EN_FAENA' }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: asignacion.id,
        garron: asignacion.garron,
        animalId: asignacion.animalId,
        animalCodigo: animalData?.codigo || null
      }
    })

  } catch (error) {
    console.error('Error asignando garrón:', error)
    return NextResponse.json(
      { success: false, error: 'Error al asignar garrón' },
      { status: 500 }
    )
  }
}
