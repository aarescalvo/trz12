import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener animales de un corral específico
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeMovimientoHacienda')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const corralId = searchParams.get('corralId')

    if (!corralId) {
      return NextResponse.json(
        { success: false, error: 'corralId es requerido' },
        { status: 400 }
      )
    }

    const animales = await db.animal.findMany({
      where: {
        corralId,
        estado: { in: ['RECIBIDO', 'PESADO'] } // Solo animales vivos en corral
      },
      include: {
        tropa: {
          select: {
            id: true,
            codigo: true,
            especie: true,
            usuarioFaena: {
              select: { id: true, nombre: true }
            }
          }
        }
      },
      orderBy: [
        { tropa: { codigo: 'asc' } },
        { numero: 'asc' }
      ]
    })

    // Agrupar por tropa con el formato que espera el frontend
    const animalesPorTropa = animales.reduce((acc, animal) => {
      const tropaId = animal.tropaId
      if (!acc[tropaId]) {
        acc[tropaId] = {
          tropaId: animal.tropa.id,
          tropaCodigo: animal.tropa.codigo,
          especie: animal.tropa.especie,
          usuarioFaena: animal.tropa.usuarioFaena.nombre,
          cantidadAnimales: 0,
          animales: []
        }
      }
      acc[tropaId].cantidadAnimales++
      acc[tropaId].animales.push({
        id: animal.id,
        numero: animal.numero,
        codigo: animal.codigo,
        tipoAnimal: animal.tipoAnimal,
        pesoVivo: animal.pesoVivo
      })
      return acc
    }, {} as Record<string, {
      tropaId: string
      tropaCodigo: string
      especie: string
      usuarioFaena: string
      cantidadAnimales: number
      animales: { id: string; numero: number; codigo: string; tipoAnimal: string; pesoVivo?: number | null }[]
    }>)

    return NextResponse.json({
      success: true,
      data: {
        total: animales.length,
        animales: Object.values(animalesPorTropa)
      }
    })
  } catch (error) {
    console.error('Error fetching animales por corral:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener animales' },
      { status: 500 }
    )
  }
}
