import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'
import { createLogger } from '@/lib/logger'

const logger = createLogger('API:AlertasStock')

// GET /api/alertas/stock
export async function GET(request: NextRequest) {
  try {
    const authError = await checkPermission(request, 'puedeStock')
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const prioridad = searchParams.get('prioridad')
    const tipo = searchParams.get('tipo')
    const estado = searchParams.get('estado') || 'ACTIVA'
    const camaraId = searchParams.get('camaraId')

    const where: Record<string, unknown> = { estado }
    if (prioridad) where.prioridad = prioridad
    if (tipo) where.tipo = tipo
    if (camaraId) where.camaraId = camaraId

    const alertas = await db.alertaStock.findMany({
      where,
      include: {
        camara: { select: { nombre: true } }
      },
      orderBy: [
        { prioridad: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 200
    })

    const criticas = alertas.filter(a => a.prioridad === 'CRITICA').length
    const altas = alertas.filter(a => a.prioridad === 'ALTA').length
    const medias = alertas.filter(a => a.prioridad === 'MEDIA').length
    const bajas = alertas.filter(a => a.prioridad === 'BAJA').length

    return NextResponse.json({
      alertas,
      resumen: { criticas, altas, medias, bajas, total: alertas.length }
    })
  } catch (error) {
    logger.error('Error obteniendo alertas de stock', error)
    return NextResponse.json(
      { error: 'Error al obtener alertas' },
      { status: 500 }
    )
  }
}

// POST /api/alertas/stock
export async function POST(request: NextRequest) {
  try {
    const authError = await checkPermission(request, 'puedeStock')
    if (authError) return authError

    const body = await request.json()
    const { action, alertaId, operadorId, ...data } = body

    if (action === 'resolver' && alertaId) {
      const alerta = await db.alertaStock.update({
        where: { id: alertaId },
        data: {
          estado: 'RESUELTA',
          fechaResolucion: new Date(),
          resueltaPor: operadorId
        }
      })
      return NextResponse.json({ success: true, data: alerta })
    }

    if (action === 'descartar' && alertaId) {
      const alerta = await db.alertaStock.update({
        where: { id: alertaId },
        data: { estado: 'DESCARTADA' }
      })
      return NextResponse.json({ success: true, data: alerta })
    }

    const alerta = await db.alertaStock.create({
      data: {
        tipo: data.tipo || 'STOCK_BAJO',
        entidad: data.entidad || 'PRODUCTO',
        entidadId: data.entidadId,
        entidadNombre: data.entidadNombre,
        stockActual: data.stockActual || 0,
        stockMinimo: data.stockMinimo,
        stockDeseado: data.stockDeseado,
        camaraId: data.camaraId,
        prioridad: data.prioridad || 'MEDIA'
      }
    })
    return NextResponse.json({ success: true, data: alerta })
  } catch (error) {
    logger.error('Error en POST alertas', error)
    return NextResponse.json(
      { error: 'Error al procesar alerta' },
      { status: 500 }
    )
  }
}
