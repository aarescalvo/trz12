import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'
import { createLogger } from '@/lib/logger'

const logger = createLogger('API:AlertasStockGenerar')

// POST /api/alertas/stock/generar - Scan stock and generate alerts
export async function POST(request: NextRequest) {
  try {
    const authError = await checkPermission(request, 'puedeStock')
    if (authError) return authError

    const body = await request.json()
    const { fullScan = false } = body

    let creadas = 0
    let actualizadas = 0

    // 1. Check insumos con stock bajo
    const insumos = await db.stockInsumo.findMany({
      where: { stockActual: { lte: 0 } },
      include: { insumo: { select: { nombre: true, codigo: true } } }
    })

    for (const stock of insumos) {
      const prioridad = stock.stockMinimo != null && stock.stockActual <= 0 ? 'CRITICA' : 'ALTA'
      const existing = await db.alertaStock.findFirst({
        where: { entidadId: stock.id, tipo: 'STOCK_BAJO', estado: 'ACTIVA' }
      })
      if (existing) {
        await db.alertaStock.update({ where: { id: existing.id }, data: { stockActual: stock.stockActual, prioridad } })
        actualizadas++
      } else {
        await db.alertaStock.create({
          data: {
            tipo: prioridad === 'CRITICA' ? 'STOCK_CRITICO' : 'STOCK_BAJO',
            entidad: 'INSUMO',
            entidadId: stock.id,
            entidadNombre: stock.insumo?.nombre || 'Insumo sin nombre',
            stockActual: stock.stockActual,
            stockMinimo: stock.stockMinimo,
            prioridad
          }
        })
        creadas++
      }
    }

    // 2. Insumos near minimum
    const insumosBajo = await db.stockInsumo.findMany({
      where: { stockActual: { gt: 0 }, stockMinimo: { not: null } },
      include: { insumo: { select: { nombre: true, codigo: true } } }
    })

    for (const stock of insumosBajo) {
      if (stock.stockActual <= (stock.stockMinimo || 0)) {
        const existing = await db.alertaStock.findFirst({
          where: { entidadId: stock.id, tipo: 'STOCK_BAJO', estado: 'ACTIVA' }
        })
        if (existing) {
          await db.alertaStock.update({ where: { id: existing.id }, data: { stockActual: stock.stockActual } })
          actualizadas++
        } else {
          await db.alertaStock.create({
            data: {
              tipo: 'STOCK_BAJO',
              entidad: 'INSUMO',
              entidadId: stock.id,
              entidadNombre: stock.insumo?.nombre || 'Insumo',
              stockActual: stock.stockActual,
              stockMinimo: stock.stockMinimo,
              prioridad: 'MEDIA'
            }
          })
          creadas++
        }
      }
    }

    // 3. StockProducto low stock (full scan)
    if (fullScan) {
      const stockProductos = await db.stockProducto.groupBy({
        by: ['productoId', 'camaraId'],
        where: { estado: 'DISPONIBLE' },
        _sum: { pesoTotal: true }
      })

      for (const sp of stockProductos) {
        if (sp._sum.pesoTotal !== null && sp._sum.pesoTotal > 0 && sp._sum.pesoTotal <= 50) {
          const existing = await db.alertaStock.findFirst({
            where: { entidadId: sp.productoId, tipo: 'STOCK_BAJO', estado: 'ACTIVA' }
          })
          if (!existing) {
            await db.alertaStock.create({
              data: {
                tipo: 'STOCK_BAJO',
                entidad: 'PRODUCTO',
                entidadId: sp.productoId,
                entidadNombre: `Producto ${sp.productoId?.slice(0, 8)}`,
                stockActual: sp._sum.pesoTotal,
                prioridad: 'BAJA',
                camaraId: sp.camaraId
              }
            })
            creadas++
          }
        }
      }
    }

    return NextResponse.json({ success: true, creadas, actualizadas })
  } catch (error) {
    logger.error('Error generando alertas', error)
    return NextResponse.json({ error: 'Error al generar alertas' }, { status: 500 })
  }
}
