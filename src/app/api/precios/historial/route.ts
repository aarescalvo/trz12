import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET /api/precios/historial — Historial de cambios de precios
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const tipoServicioId = searchParams.get('tipoServicioId') || undefined
    const clienteId = searchParams.get('clienteId') || undefined
    const operadorId = request.headers.get('x-operador-id') || undefined
    const tipoCambio = searchParams.get('tipoCambio') || undefined
    const desde = searchParams.get('desde') ? new Date(searchParams.get('desde')!) : undefined
    const hasta = searchParams.get('hasta') ? new Date(searchParams.get('hasta')!) : undefined
    const limite = parseInt(searchParams.get('limite') || '50')
    const pagina = parseInt(searchParams.get('pagina') || '1')

    const where: any = {}
    if (tipoServicioId) where.tipoServicioId = tipoServicioId
    if (clienteId) where.clienteId = clienteId
    if (operadorId) where.operadorId = operadorId
    if (tipoCambio) where.tipoCambio = tipoCambio
    if (desde || hasta) {
      where.createdAt = {}
      if (desde) where.createdAt.gte = desde
      if (hasta) where.createdAt.lte = hasta
    }

    const skip = (pagina - 1) * limite

    const [historial, total] = await Promise.all([
      db.precioHistorial.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limite,
      }),
      db.precioHistorial.count({ where }),
    ])

    // Calcular estadísticas
    const stats = await db.precioHistorial.aggregate({
      where,
      _count: true,
      _min: { createdAt: true },
      _max: { createdAt: true },
    })

    // Agrupar por tipo de cambio
    const porTipo = await db.precioHistorial.groupBy({
      by: ['tipoCambio'],
      where,
      _count: true,
    })

    return NextResponse.json({
      success: true,
      data: historial,
      pagination: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
      stats: {
        total: stats._count,
        fechaDesde: stats._min.createdAt,
        fechaHasta: stats._max.createdAt,
        porTipo: porTipo.map(p => ({ tipo: p.tipoCambio, cantidad: p._count })),
      },
    })
  } catch (error: any) {
    console.error('Error historial precios GET:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
