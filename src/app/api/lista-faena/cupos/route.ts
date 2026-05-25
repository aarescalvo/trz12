import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'
import { createLogger } from '@/lib/logger'
const log = createLogger('app.api.lista-faena.cupos.route')

// GET - Obtener cupos de la lista de faena activa
// Devuelve información de cupos por tropa, no animales específicos
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeListaFaena')
  if (authError) return authError
  try {
    log.info('[cupos-lista] Buscando lista de faena activa...')

    // Buscar la lista de faena más reciente con tropas asignadas
    const listaFaena = await db.listaFaena.findFirst({
      where: {
        estado: { in: ['ABIERTA', 'EN_PROCESO', 'CERRADA'] },
        tropas: {
          some: {}
        }
      },
      include: {
        tropas: {
          include: {
            tropa: {
              include: {
                usuarioFaena: true,
                _count: {
                  select: { animales: true }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    log.info(`'[cupos-lista] Lista encontrada:' listaFaena?.id 'Estado:' listaFaena?.estado`)

    if (!listaFaena || listaFaena.tropas.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          listaId: null,
          listaNumero: null,
          cupos: [],
          totalCupos: 0,
          totalAsignados: 0,
          totalPendientes: 0
        }
      })
    }

    // Obtener asignaciones de garrón existentes para esta lista
    const asignaciones = await db.asignacionGarron.findMany({
      where: {
        listaFaenaId: listaFaena.id
      },
      select: {
        id: true,
        garron: true,
        animalId: true,
        tropaCodigo: true
      }
    })

    // Crear mapa de asignaciones por tropa
    const asignacionesPorTropa: Map<string, number> = new Map()
    for (const a of asignaciones) {
      if (a.tropaCodigo) {
        const count = asignacionesPorTropa.get(a.tropaCodigo) || 0
        asignacionesPorTropa.set(a.tropaCodigo, count + 1)
      }
    }

    // Construir información de cupos por tropa
    const cupos = listaFaena.tropas.map(lt => {
      const tropa = lt.tropa
      const asignados = asignacionesPorTropa.get(tropa.codigo) || 0
      const pendientes = lt.cantidad - asignados

      return {
        tropaId: tropa.id,
        tropaCodigo: tropa.codigo,
        tropaNumero: tropa.numero,
        usuarioFaena: tropa.usuarioFaena?.nombre || 'Sin usuario',
        cantidadAsignada: lt.cantidad,      // Cupos asignados en lista
        cantidadAsignadaGarron: asignados,  // Ya con garrón
        cantidadPendiente: Math.max(0, pendientes),
        animalesDisponibles: tropa._count?.animales || 0
      }
    })

    const totalCupos = cupos.reduce((acc, c) => acc + c.cantidadAsignada, 0)
    const totalAsignados = asignaciones.length
    const totalPendientes = totalCupos - totalAsignados

    log.info(`'[cupos-lista] Total cupos:' totalCupos 'Asignados:' totalAsignados 'Pendientes:' totalPendientes`)

    return NextResponse.json({
      success: true,
      data: {
        listaId: listaFaena.id,
        listaNumero: listaFaena.numero,
        listaEstado: listaFaena.estado,
        cupos,
        totalCupos,
        totalAsignados,
        totalPendientes,
        proximoGarron: asignaciones.length > 0 ? Math.max(...asignaciones.map(a => a.garron)) + 1 : 1
      }
    })

  } catch (error) {
    console.error('Error obteniendo cupos de lista:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener cupos' },
      { status: 500 }
    )
  }
}
