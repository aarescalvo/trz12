import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'
import { createLogger } from '@/lib/logger'
const log = createLogger('app.api.admin.migrar-estados.route')

// GET - Ver estado de tropas y animales
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    // Obtener todas las tropas con sus animales
    const tropas = await db.tropa.findMany({
      include: {
        _count: { select: { animales: true } },
        animales: {
          select: { estado: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Resumen por estado de tropa
    const estadoTropas = await db.tropa.groupBy({
      by: ['estado'],
      _count: true
    })

    // Resumen por estado de animales
    const estadoAnimales = await db.animal.groupBy({
      by: ['estado'],
      _count: true
    })

    return NextResponse.json({
      success: true,
      resumen: {
        totalTropas: tropas.length,
        estadoTropas: estadoTropas.map(e => ({ estado: e.estado, cantidad: e._count })),
        estadoAnimales: estadoAnimales.map(e => ({ estado: e.estado, cantidad: e._count }))
      },
      tropas: tropas.slice(0, 10).map(t => ({
        codigo: t.codigo,
        estado: t.estado,
        pesoBruto: t.pesoBruto,
        pesoTara: t.pesoTara,
        totalAnimales: t._count.animales,
        estadosAnimales: t.animales.reduce((acc, a) => {
          acc[a.estado] = (acc[a.estado] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }))
    })
  } catch (error) {
    console.error('[DEBUG-ESTADOS] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener datos' },
      { status: 500 }
    )
  }
}

// POST - Migrar animales de tropas con pesaje completo a estado PESADO
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    // Buscar tropas con pesaje completo (pesoBruto y pesoTara) cuyos animales estén en RECIBIDO
    const tropasConPesajeCompleto = await db.tropa.findMany({
      where: {
        pesoBruto: { not: null },
        pesoTara: { not: null },
        animales: {
          some: { estado: 'RECIBIDO' }
        }
      },
      include: {
        _count: {
          select: { animales: { where: { estado: 'RECIBIDO' } } }
        }
      }
    })

    log.info(`[MIGRAR-ESTADOS] Encontradas ${tropasConPesajeCompleto.length} tropas con pesaje completo`)

    let totalAnimalesActualizados = 0
    const tropasActualizadas: string[] = []

    for (const tropa of tropasConPesajeCompleto) {
      // Actualizar animales a PESADO
      const result = await db.animal.updateMany({
        where: {
          tropaId: tropa.id,
          estado: 'RECIBIDO'
        },
        data: { estado: 'PESADO' }
      })

      // Actualizar estado de la tropa
      await db.tropa.update({
        where: { id: tropa.id },
        data: { estado: 'PESADO' }
      })

      totalAnimalesActualizados += result.count
      tropasActualizadas.push(`${tropa.codigo} (${result.count} animales)`)
      log.info(`[MIGRAR-ESTADOS] Tropa ${tropa.codigo}: ${result.count} animales actualizados`)
    }

    return NextResponse.json({
      success: true,
      message: `Migración completada: ${totalAnimalesActualizados} animales actualizados a PESADO`,
      tropasActualizadas,
      totalAnimales: totalAnimalesActualizados
    })
  } catch (error) {
    console.error('[MIGRAR-ESTADOS] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error en migración' },
      { status: 500 }
    )
  }
}
