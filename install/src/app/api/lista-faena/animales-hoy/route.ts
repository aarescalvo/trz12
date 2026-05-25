import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener animales de la lista de faena del día
export async function GET(request: NextRequest) {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    // Buscar lista de faena abierta de hoy
    const listaFaena = await db.listaFaena.findFirst({
      where: {
        fecha: {
          gte: hoy,
          lt: new Date(hoy.getTime() + 24 * 60 * 60 * 1000)
        },
        estado: { in: ['ABIERTA', 'EN_PROCESO'] }
      },
      include: {
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
    })

    if (!listaFaena || listaFaena.tropas.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Obtener IDs de las tropas en la lista
    const tropaIds = listaFaena.tropas.map(lt => lt.tropaId)

    // Buscar animales de esas tropas con su asignación de garrón
    const animales = await db.animal.findMany({
      where: {
        tropaId: { in: tropaIds }
      },
      include: {
        tropa: {
          select: {
            codigo: true,
            usuarioFaena: { select: { nombre: true } }
          }
        },
        pesajeIndividual: { select: { peso: true } },
        asignacionGarron: { select: { garron: true } }
      },
      orderBy: [
        { tropa: { codigo: 'asc' } },
        { numero: 'asc' }
      ]
    })

    // Formatear respuesta
    const data = animales.map(animal => ({
      id: animal.id,
      codigo: animal.codigo,
      tropaCodigo: animal.tropa?.codigo || null,
      tipoAnimal: animal.tipoAnimal?.toString() || null,
      pesoVivo: animal.pesoVivo || animal.pesajeIndividual?.peso || null,
      numero: animal.numero,
      garronAsignado: animal.asignacionGarron?.garron || null,
      estado: animal.estado
    }))

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Error obteniendo animales de lista de faena:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener animales' },
      { status: 500 }
    )
  }
}
