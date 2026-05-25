import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { EstadoAnimal } from '@prisma/client'

// GET - Obtener stock de animales por tropa y corral
import { checkPermission } from '@/lib/auth-helpers'
import { createLogger } from '@/lib/logger'
const log = createLogger('app.api.tropas.stock-corrales.route')
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeMovimientoHacienda')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const estadoParam = searchParams.get('estado')

    // Parsear estados del parámetro o usar valores por defecto
    const estados = estadoParam
      ? estadoParam.split(',').map(e => e.trim()).filter(e => e)
      : ['RECIBIDO', 'PESADO']

    log.info(`'[stock-corrales] Buscando animales con estados:' estados`)

    // Obtener todos los animales agrupados por tropa y corral
    const animales = await db.animal.findMany({
      where: {
        estado: { in: estados as EstadoAnimal[] }
      },
      include: {
        tropa: {
          include: {
            usuarioFaena: true,
            tiposAnimales: true
          }
        },
        corral: true
      }
    })

    log.info(`'[stock-corrales] Animales encontrados:' animales.length`)

    // Agrupar por tropa + corral con estructura que coincide con la interfaz del componente
    const stockPorTropaCorral = new Map<string, {
      tropaId: string
      tropaCodigo: string
      tropaEspecie: string
      usuarioFaena: { id: string | null; nombre: string } | null
      corralId: string | null
      corralNombre: string | null
      totalAnimales: number
    }>()

    for (const animal of animales) {
      const key = `${animal.tropaId}-${animal.corralId || 'sin-corral'}`

      if (!stockPorTropaCorral.has(key)) {
        stockPorTropaCorral.set(key, {
          tropaId: animal.tropaId,
          tropaCodigo: animal.tropa?.codigo || 'Sin código',
          tropaEspecie: animal.tropa?.especie || 'BOVINO',
          usuarioFaena: animal.tropa?.usuarioFaena
            ? { id: animal.tropa.usuarioFaena.id, nombre: animal.tropa.usuarioFaena.nombre }
            : null,
          corralId: animal.corralId,
          corralNombre: animal.corral?.nombre || null,
          totalAnimales: 0
        })
      }

      const grupo = stockPorTropaCorral.get(key)!
      grupo.totalAnimales++
    }

    // Calcular disponibilidad real (restando animales ya en listas abiertas)
    const listasAbiertas = await db.listaFaena.findMany({
      where: { estado: 'ABIERTA' },
      include: {
        tropas: {
          include: {
            tropa: true
          }
        }
      }
    })

    // Mapear cantidades en listas abiertas
    const cantidadesEnListasAbiertas = new Map<string, number>()
    for (const lista of listasAbiertas) {
      for (const tropaLista of lista.tropas) {
        const key = `${tropaLista.tropaId}-${tropaLista.corralId || 'sin-corral'}`
        const actual = cantidadesEnListasAbiertas.get(key) || 0
        cantidadesEnListasAbiertas.set(key, actual + tropaLista.cantidad)
      }
    }

    // Calcular animales faenados (con garrón en listas cerradas)
    const asignacionesCerradas = await db.asignacionGarron.findMany({
      where: {
        listaFaena: { estado: 'CERRADA' }
      },
      include: {
        animal: {
          select: { tropaId: true, corralId: true }
        }
      }
    })

    const animalesFaenados = new Map<string, number>()
    for (const asignacion of asignacionesCerradas) {
      if (asignacion.animal) {
        const key = `${asignacion.animal.tropaId}-${asignacion.animal.corralId || 'sin-corral'}`
        const actual = animalesFaenados.get(key) || 0
        animalesFaenados.set(key, actual + 1)
      }
    }

    // Construir respuesta con disponibilidad calculada - campos que coinciden con la interfaz
    const resultado = Array.from(stockPorTropaCorral.values()).map(grupo => {
      const key = `${grupo.tropaId}-${grupo.corralId || 'sin-corral'}`
      const cantidadEnLista = cantidadesEnListasAbiertas.get(key) || 0
      const faenados = animalesFaenados.get(key) || 0
      const disponibles = grupo.totalAnimales - cantidadEnLista - faenados

      return {
        tropaId: grupo.tropaId,
        tropaCodigo: grupo.tropaCodigo,
        tropaEspecie: grupo.tropaEspecie,
        usuarioFaena: grupo.usuarioFaena,
        corralId: grupo.corralId,
        corralNombre: grupo.corralNombre,
        totalAnimales: grupo.totalAnimales,
        enListaAbierta: cantidadEnLista,
        faenados: faenados,
        disponibles: disponibles, // Campo que espera el componente
        cantidadEnLista: cantidadEnLista // Campo adicional que espera la interfaz
      }
    }).filter(g => g.disponibles > 0) // Solo mostrar los que tienen disponibilidad

    // Ordenar por tropa y corral
    resultado.sort((a, b) => {
      if (a.tropaCodigo !== b.tropaCodigo) {
        return a.tropaCodigo.localeCompare(b.tropaCodigo)
      }
      return (a.corralNombre || '').localeCompare(b.corralNombre || '')
    })

    log.info(`'[stock-corrales] Resultados con disponibilidad:' resultado.length`)

    return NextResponse.json({
      success: true,
      data: resultado
    })
  } catch (error) {
    console.error('Error fetching stock corrales:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener stock por corrales' },
      { status: 500 }
    )
  }
}
