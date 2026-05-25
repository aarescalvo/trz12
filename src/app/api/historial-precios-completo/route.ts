import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - List price changes with filters and chart data
export async function GET(request: NextRequest) {
  try {
    const authError = await checkPermission(request, 'puedeStock')
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const productoId = searchParams.get('productoId')
    const clienteId = searchParams.get('clienteId')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const grafico = searchParams.get('grafico') === 'true'
    const limite = parseInt(searchParams.get('limite') || '200')
    const exportar = searchParams.get('exportar') // 'csv'

    const where: Record<string, unknown> = {}

    if (productoId) where.productoVendibleId = productoId
    if (clienteId) where.clienteId = clienteId

    if (fechaDesde || fechaHasta) {
      where.fechaVigencia = {}
      if (fechaDesde) {
        where.fechaVigencia = { ...where.fechaVigencia as object, gte: new Date(fechaDesde) }
      }
      if (fechaHasta) {
        const fechaFin = new Date(fechaHasta)
        fechaFin.setHours(23, 59, 59, 999)
        where.fechaVigencia = { ...where.fechaVigencia as object, lte: fechaFin }
      }
    }

    // Get price history from HistoricoPrecioProducto
    const historial = await db.historicoPrecioProducto.findMany({
      where,
      include: {
        productoVendible: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            categoria: true,
            unidadMedida: true
          }
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            cuit: true
          }
        },
        operador: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: { fechaVigencia: 'desc' },
      take: limite
    })

    // Chart data format
    if (grafico) {
      // Get last 12 months of data for charts
      const doceMesesAtras = new Date()
      doceMesesAtras.setMonth(doceMesesAtras.getMonth() - 12)

      const datosGrafico = await db.historicoPrecioProducto.findMany({
        where: {
          ...where,
          fechaVigencia: { gte: doceMesesAtras }
        },
        include: {
          productoVendible: {
            select: { id: true, nombre: true, codigo: true }
          }
        },
        orderBy: { fechaVigencia: 'asc' }
      })

      // Group by month
      const porMes: Record<string, { mes: string; totalCambios: number; variacionPromedio: number; subidas: number; bajas: number }> = {}

      for (const item of datosGrafico) {
        const fecha = new Date(item.fechaVigencia)
        const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
        const mesLabel = fecha.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })

        if (!porMes[mesKey]) {
          porMes[mesKey] = { mes: mesLabel, totalCambios: 0, variacionPromedio: 0, subidas: 0, bajas: 0 }
        }
        porMes[mesKey].totalCambios++

        if (item.precioAnterior && item.precioAnterior > 0) {
          const variacion = ((item.precioNuevo - item.precioAnterior) / item.precioAnterior) * 100
          porMes[mesKey].variacionPromedio += variacion
          if (variacion > 0) porMes[mesKey].subidas++
          else if (variacion < 0) porMes[mesKey].bajas++
        }
      }

      // Calculate averages
      const graficoData = Object.entries(porMes).map(([key, val]) => ({
        mes: key,
        mesLabel: val.mes,
        totalCambios: val.totalCambios,
        variacionPromedio: val.totalCambios > 0 ? (val.variacionPromedio / val.totalCambios).toFixed(1) : '0.0',
        subidas: val.subidas,
        bajas: val.bajas
      }))

      // Top products with most price changes
      const topProductos = await db.historicoPrecioProducto.groupBy({
        by: ['productoVendibleId'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      })

      const topProductosData = await Promise.all(
        topProductos.map(async (tp) => {
          const producto = await db.productoVendible.findUnique({
            where: { id: tp.productoVendibleId },
            select: { id: true, nombre: true, codigo: true, precioActual: true }
          })

          const ultimoPrecio = await db.historicoPrecioProducto.findFirst({
            where: { productoVendibleId: tp.productoVendibleId },
            orderBy: { fechaVigencia: 'desc' }
          })

          return {
            productoId: tp.productoVendibleId,
            nombre: producto?.nombre || 'N/A',
            codigo: producto?.codigo || '',
            precioActual: producto?.precioActual || 0,
            ultimoCambio: ultimoPrecio?.fechaVigencia?.toISOString() || '',
            variacion: ultimoPrecio?.precioAnterior && ultimoPrecio.precioAnterior > 0
              ? (((ultimoPrecio.precioNuevo - ultimoPrecio.precioAnterior) / ultimoPrecio.precioAnterior) * 100).toFixed(1)
              : '0.0',
            totalCambios: tp._count.id
          }
        })
      )

      // Price notifications: recent significant changes
      const cambiosRecientes = await db.historicoPrecioProducto.findMany({
        where: {
          fechaVigencia: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
        include: {
          productoVendible: { select: { nombre: true, codigo: true } },
          operador: { select: { nombre: true } }
        },
        orderBy: { fechaVigencia: 'desc' },
        take: 10
      })

      const notificaciones = cambiosRecientes.map(c => {
        const variacion = c.precioAnterior && c.precioAnterior > 0
          ? (((c.precioNuevo - c.precioAnterior) / c.precioAnterior) * 100)
          : 0
        return {
          id: c.id,
          producto: c.productoVendible?.nombre || 'N/A',
          precioAnterior: c.precioAnterior || 0,
          precioNuevo: c.precioNuevo,
          variacion: variacion.toFixed(1),
          fecha: c.fechaVigencia.toISOString(),
          operador: c.operador?.nombre || 'Sistema',
          significativo: Math.abs(variacion) > 5
        }
      })

      return NextResponse.json({
        success: true,
        grafico: {
          porMes: graficoData,
          topProductos: topProductosData
        },
        notificaciones
      })
    }

    // CSV Export
    if (exportar === 'csv') {
      const header = 'Fecha,Producto,Código,Precio Anterior,Precio Nuevo,Variación %,Moneda,Cliente,Operador,Motivo\n'
      const rows = historial.map(h => {
        const variacion = h.precioAnterior && h.precioAnterior > 0
          ? (((h.precioNuevo - h.precioAnterior) / h.precioAnterior) * 100).toFixed(2)
          : 'N/A'
        const pv = h.productoVendible
        const cl = h.cliente
        const op = h.operador
        return `"${h.fechaVigencia.toISOString().split('T')[0]}","${pv?.nombre || ''}","${pv?.codigo || ''}",${h.precioAnterior || 0},${h.precioNuevo},${variacion},"${h.moneda}","${cl?.nombre || ''}","${op?.nombre || ''}","${(h.motivo || '').replace(/"/g, '""')}"`
      }).join('\n')

      const csv = '\uFEFF' + header + rows // BOM for Excel UTF-8
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=historial_precios_${new Date().toISOString().split('T')[0]}.csv`
        }
      })
    }

    // Get current prices for comparison
    const productosActuales = await db.productoVendible.findMany({
      where: { activo: true },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        categoria: true,
        precioBase: true,
        precioDolar: true,
        precioActual: true,
        moneda: true,
      },
      orderBy: { nombre: 'asc' }
    })

    // Calculate stats for each product
    const productosConHistorial = await Promise.all(
      productosActuales.map(async (p) => {
        const historialProd = await db.historicoPrecioProducto.findMany({
          where: { productoVendibleId: p.id },
          orderBy: { fechaVigencia: 'desc' },
          take: 2
        })

        const precioActual = historialProd[0]?.precioNuevo || p.precioBase || p.precioActual || 0
        const precioAnterior = historialProd[1]?.precioNuevo || historialProd[0]?.precioAnterior || 0

        let variacion = 0
        if (precioAnterior > 0) {
          variacion = ((precioActual - precioAnterior) / precioAnterior) * 100
        }

        let tendencia: 'SUBIENDO' | 'BAJANDO' | 'ESTABLE' = 'ESTABLE'
        if (variacion > 0.5) tendencia = 'SUBIENDO'
        else if (variacion < -0.5) tendencia = 'BAJANDO'

        return {
          id: p.id,
          codigo: p.codigo,
          nombre: p.nombre,
          precioActual,
          precioAnterior,
          variacion: variacion.toFixed(1),
          tendencia,
          ultimaActualizacion: historialProd[0]?.fechaVigencia?.toISOString() || '',
          totalCambios: historialProd.length
        }
      })
    )

    // Summary
    const totalCambios = historial.length
    const productosAfectados = new Set(historial.map(h => h.productoVendibleId)).size
    const subidas = historial.filter(h => h.precioAnterior && h.precioNuevo > h.precioAnterior).length
    const bajas = historial.filter(h => h.precioAnterior && h.precioNuevo < h.precioAnterior).length

    return NextResponse.json({
      success: true,
      data: historial,
      productos: productosConHistorial,
      resumen: {
        totalCambios,
        productosAfectados,
        subidas,
        bajas,
        sinCambio: totalCambios - subidas - bajas
      }
    })
  } catch (error) {
    console.error('Error en historial de precios:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener historial de precios' },
      { status: 500 }
    )
  }
}

// POST - Register price change
export async function POST(request: NextRequest) {
  try {
    const authError = await checkPermission(request, 'puedeStock')
    if (authError) return authError

    const body = await request.json()
    const {
      productoVendibleId,
      precioNuevo,
      moneda,
      motivo,
      clienteId,
      operadorId
    } = body

    if (!productoVendibleId || precioNuevo === undefined) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: productoVendibleId, precioNuevo' },
        { status: 400 }
      )
    }

    // Get current price
    const ultimoPrecio = await db.historicoPrecioProducto.findFirst({
      where: { productoVendibleId },
      orderBy: { fechaVigencia: 'desc' }
    })

    const precioAnterior = ultimoPrecio?.precioNuevo || 0

    // Calculate variation
    const variacion = precioAnterior > 0
      ? (((precioNuevo - precioAnterior) / precioAnterior) * 100).toFixed(2)
      : 'N/A'

    // Create new price record
    const nuevoPrecio = await db.historicoPrecioProducto.create({
      data: {
        productoVendibleId,
        precioAnterior,
        precioNuevo: parseFloat(precioNuevo),
        moneda: moneda || 'ARS',
        motivo: motivo || 'Actualización de precio',
        clienteId: clienteId || null,
        operadorId: operadorId || null
      }
    })

    // Update current price in product
    await db.productoVendible.update({
      where: { id: productoVendibleId },
      data: { precioActual: parseFloat(precioNuevo) }
    })

    // Audit log
    await db.auditoria.create({
      data: {
        modulo: 'HISTORIAL_PRECIOS',
        accion: 'UPDATE',
        entidad: 'Precio',
        entidadId: nuevoPrecio.id,
        descripcion: `Precio actualizado: $${precioAnterior} → $${precioNuevo} (variación: ${variacion}%)`,
        datosDespues: JSON.stringify({ precioAnterior, precioNuevo, variacion, motivo, operadorId }),
        operadorId: operadorId || null
      }
    })

    // Check for significant change (>5%) and create notification
    if (precioAnterior > 0 && Math.abs((precioNuevo - precioAnterior) / precioAnterior * 100) > 5) {
      // Could send notification/email here
      console.log(`[NOTIFICACIÓN] Cambio significativo de precio: ${variacion}% para producto ${productoVendibleId}`)
    }

    return NextResponse.json({
      success: true,
      data: nuevoPrecio,
      message: `Precio actualizado de $${precioAnterior.toFixed(2)} a $${parseFloat(precioNuevo).toFixed(2)} (${variacion}%)`
    })
  } catch (error) {
    console.error('Error al registrar precio:', error)
    return NextResponse.json(
      { success: false, error: 'Error al registrar precio' },
      { status: 500 }
    )
  }
}
