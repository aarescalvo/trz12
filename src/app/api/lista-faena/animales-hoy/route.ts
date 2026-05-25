import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'
import { createLogger } from '@/lib/logger'
const log = createLogger('app.api.lista-faena.animales-hoy.route')

// GET - Obtener animales de la lista de faena activa (abierta o cerrada del día)
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeListaFaena')
  if (authError) return authError
  try {
    log.info('[animales-hoy] Buscando lista de faena activa...')

    // Buscar la lista de faena más reciente que tenga tropas asignadas
    // Puede estar ABIERTA, EN_PROCESO o CERRADA
    // Una vez cerrada, los animales deben estar disponibles para ingreso a cajón
    const listaFaena = await db.listaFaena.findFirst({
      where: {
        estado: { in: ['ABIERTA', 'EN_PROCESO', 'CERRADA'] },
        tropas: {
          some: {} // Solo listas que tienen tropas asignadas
        }
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    log.info(`'[animales-hoy] Lista encontrada:' listaFaena?.id 'Estado:' listaFaena?.estado 'Tropas:' listaFaena?.tropas.length`)

    if (!listaFaena || listaFaena.tropas.length === 0) {
      log.info('[animales-hoy] No hay lista de faena con tropas asignadas')
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Obtener IDs de las tropas en la lista y las cantidades asignadas
    const tropasEnLista = listaFaena.tropas.map(lt => ({
      tropaId: lt.tropaId,
      cantidad: lt.cantidad,
      corralId: lt.corralId
    }))

    log.info(`'[animales-hoy] Tropas en lista:' JSON.stringify(tropasEnLista)`)

    // Calcular el total de animales que debería haber en la lista
    const totalEsperado = tropasEnLista.reduce((acc, t) => acc + t.cantidad, 0)
    log.info(`'[animales-hoy] Total esperado según lista:' totalEsperado`)

    // Buscar animales de esas tropas, respetando la cantidad por tropa
    const animalesPorTropa: Map<string, typeof animales> = new Map()
    
    const animales = await db.animal.findMany({
      where: {
        tropaId: { in: tropasEnLista.map(t => t.tropaId) }
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

    // Agrupar animales por tropa
    for (const animal of animales) {
      const tropaId = animal.tropaId
      if (!animalesPorTropa.has(tropaId)) {
        animalesPorTropa.set(tropaId, [])
      }
      animalesPorTropa.get(tropaId)!.push(animal)
    }

    // Tomar solo la cantidad asignada de cada tropa (los primeros N)
    const animalesFinales: typeof animales = []
    for (const tropaInfo of tropasEnLista) {
      const animalesTropa = animalesPorTropa.get(tropaInfo.tropaId) || []
      const cantidadATomar = Math.min(tropaInfo.cantidad, animalesTropa.length)
      animalesFinales.push(...animalesTropa.slice(0, cantidadATomar))
    }

    log.info(`'[animales-hoy] Animales encontrados:' animales.length '-> Respetando cantidad:' animalesFinales.length`)

    // Formatear respuesta
    const data = animalesFinales.map(animal => ({
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
      data,
      debug: {
        totalEncontrado: animales.length,
        totalRespetandoCantidad: animalesFinales.length,
        totalEsperado
      }
    })

  } catch (error) {
    console.error('Error obteniendo animales de lista de faena:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener animales' },
      { status: 500 }
    )
  }
}
