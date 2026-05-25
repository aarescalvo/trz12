import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'

import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeMovimientoHacienda')
  if (authError) return authError

  try {
    // Obtener todos los corrales
    const corrales = await db.corral.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    })

    // Obtener animales agrupados por corral (basado en animal.corralId, no tropa.corralId)
    // Esto permite que los animales tengan ubicación independiente de la tropa
    const animales = await db.animal.findMany({
      where: {
        estado: { in: ['RECIBIDO', 'PESADO'] } // Solo animales disponibles en corrales
      },
      include: {
        tropa: {
          include: {
            productor: { select: { nombre: true } },
            usuarioFaena: { select: { nombre: true } }
          }
        },
        corral: true
      }
    })

    // Agrupar animales por corral y luego por tropa
    const stockPorCorral: Record<string, {
      bovinos: number
      equinos: number
      tropas: Map<string, {
        id: string
        numero: number
        codigo: string
        especie: string
        cantidadCabezas: number
        estado: string
        productor?: { nombre: string } | null
        usuarioFaena?: { nombre: string } | null
        fechaRecepcion: string
        dte: string | null
        guia: string | null
        observaciones: string | null
      }>
    }> = {}

    for (const animal of animales) {
      const corralId = animal.corralId || 'sin-corral'
      
      if (!stockPorCorral[corralId]) {
        stockPorCorral[corralId] = { bovinos: 0, equinos: 0, tropas: new Map() }
      }

      // Contar por especie
      if (animal.tropa.especie === 'BOVINO') {
        stockPorCorral[corralId].bovinos++
      } else if (animal.tropa.especie === 'EQUINO') {
        stockPorCorral[corralId].equinos++
      }

      // Agrupar por tropa dentro del corral
      const tropaId = animal.tropaId
      if (!stockPorCorral[corralId].tropas.has(tropaId)) {
        stockPorCorral[corralId].tropas.set(tropaId, {
          id: animal.tropa.id,
          numero: animal.tropa.numero,
          codigo: animal.tropa.codigo,
          especie: animal.tropa.especie,
          cantidadCabezas: 1,
          estado: animal.tropa.estado,
          productor: animal.tropa.productor,
          usuarioFaena: animal.tropa.usuarioFaena,
          fechaRecepcion: animal.tropa.fechaRecepcion.toISOString(),
          dte: animal.tropa.dte,
          guia: animal.tropa.guia,
          observaciones: animal.tropa.observaciones
        })
      } else {
        // Incrementar cantidad de animales de esta tropa en el corral
        const tropaData = stockPorCorral[corralId].tropas.get(tropaId)!
        tropaData.cantidadCabezas++
      }
    }

    // Mapear los datos
    const stockData = corrales.map(corral => {
      const stock = stockPorCorral[corral.id] || { bovinos: 0, equinos: 0, tropas: new Map() }
      
      return {
        id: corral.id,
        nombre: corral.nombre,
        capacidad: corral.capacidad,
        stockBovinos: stock.bovinos,
        stockEquinos: stock.equinos,
        activo: corral.activo,
        tropas: Array.from(stock.tropas.values())
      }
    })

    // Agregar animales sin corral asignado
    if (stockPorCorral['sin-corral']) {
      const sinCorral = stockPorCorral['sin-corral']
      stockData.push({
        id: 'sin-corral',
        nombre: 'Sin Asignar',
        capacidad: 0,
        stockBovinos: sinCorral.bovinos,
        stockEquinos: sinCorral.equinos,
        activo: true,
        tropas: Array.from(sinCorral.tropas.values())
      })
    }

    return NextResponse.json({
      success: true,
      data: stockData
    })
  } catch (error) {
    console.error('Error fetching corrales stock:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener stock de corrales' },
      { status: 500 }
    )
  }
}
