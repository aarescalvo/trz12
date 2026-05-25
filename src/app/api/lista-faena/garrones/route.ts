import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'
import { createLogger } from '@/lib/logger'
const log = createLogger('app.api.lista-faena.garrones.route')

// GET - Obtener garrones ordenados con tropa asignada
// Cada garrón tiene una tropa asignada según el orden de la lista de faena
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeListaFaena')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const listaIdParam = searchParams.get('listaId')

    log.info('[garrones-lista] Buscando lista de faena activa...', { listaIdParam })

    // Si se pasa listaId, usar esa lista específica
    const whereClause: any = listaIdParam
      ? { id: listaIdParam }
      : {
          estado: { in: ['ABIERTA', 'EN_PROCESO', 'CERRADA'] },
          tropas: { some: {} }
        }

    const listaFaena = await db.listaFaena.findFirst({
      where: whereClause,
      include: {
        tropas: {
          include: {
            tropa: {
              include: {
                usuarioFaena: true
              }
            }
          },
          orderBy: { createdAt: 'asc' } // Orden en que se agregaron a la lista
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!listaFaena || listaFaena.tropas.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          listaId: null,
          listaNumero: null,
          garrones: [],
          proximoGarron: 1,
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
        animalNumero: true,
        tropaCodigo: true,
        tipoAnimal: true,
        pesoVivo: true,
        completado: true
      },
      orderBy: { garron: 'asc' }
    })

    // Crear mapa de asignaciones por garrón
    const asignacionesMap = new Map(asignaciones.map(a => [a.garron, a]))

    // Construir lista de garrones ordenados con su tropa asignada
    const garrones: Array<{
      garron: number
      tropaId: string
      tropaCodigo: string
      usuarioFaena: string
      animalNumero: number | null
      animalId: string | null
      tipoAnimal: string | null
      pesoVivo: number | null
      completado: boolean
      asignado: boolean
      sinIdentificar: boolean
    }> = []

    let garronNumero = 1
    for (const lt of listaFaena.tropas) {
      const tropa = lt.tropa
      for (let i = 0; i < lt.cantidad; i++) {
        const asignacion = asignacionesMap.get(garronNumero)
        
        garrones.push({
          garron: garronNumero,
          tropaId: tropa.id,
          tropaCodigo: tropa.codigo,
          usuarioFaena: tropa.usuarioFaena?.nombre || 'Sin usuario',
          animalNumero: asignacion?.animalNumero || null,
          animalId: asignacion?.animalId || null,
          tipoAnimal: asignacion?.tipoAnimal || null,
          pesoVivo: asignacion?.pesoVivo || null,
          completado: asignacion?.completado || false,
          // Asignado = existe asignación en DB (con o sin animal)
          asignado: !!asignacion,
          // Sin identificar = tiene asignación pero sin animalId
          sinIdentificar: !!asignacion && !asignacion.animalId
        })
        
        garronNumero++
      }
    }

    // Calcular próximos
    const totalAsignados = garrones.filter(g => g.asignado).length
    const totalPendientes = garrones.length - totalAsignados
    
    // Encontrar próximo garrón pendiente
    const proximoPendiente = garrones.find(g => !g.asignado)
    const proximoGarron = proximoPendiente?.garron || garrones.length + 1

    log.info(`'[garrones-lista] Total garrones:' garrones.length 'Asignados:' totalAsignados 'Próximo:' proximoGarron`)

    return NextResponse.json({
      success: true,
      data: {
        listaId: listaFaena.id,
        listaNumero: listaFaena.numero,
        listaFecha: listaFaena.fecha,
        listaEstado: listaFaena.estado,
        garrones,
        proximoGarron,
        totalAsignados,
        totalPendientes
      }
    })

  } catch (error) {
    console.error('Error obteniendo garrones de lista:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener garrones' },
      { status: 500 }
    )
  }
}
