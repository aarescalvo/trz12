import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validarPermiso } from '@/lib/auth-helpers'
import { startOfWeek, format } from 'date-fns'
import { es } from 'date-fns/locale'

function getOperadorId(request: NextRequest): string | null {
  return request.headers.get('x-operador-id')
}

// GET - Informes de facturación con datos para gráficos
export async function GET(request: NextRequest) {
  try {
    const operadorId = getOperadorId(request)
    const puedeVer = await validarPermiso(operadorId, 'puedeFacturacion')
    if (!puedeVer) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos de facturación' },
        { status: 403 }
      )
    }
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'general' // semanal, mensual, porCliente, porTipo, general
    const clienteId = searchParams.get('clienteId')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    // Construir filtro de fechas
    const where: any = {
      estado: { not: 'ANULADA' },
    }

    if (fechaDesde || fechaHasta) {
      where.fecha = {}
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde)
      if (fechaHasta) where.fecha.lte = new Date(fechaHasta + 'T23:59:59')
    } else if (tipo === 'semanal') {
      const ochoSemanasAtras = new Date()
      ochoSemanasAtras.setDate(ochoSemanasAtras.getDate() - 56)
      where.fecha = { gte: ochoSemanasAtras }
    } else if (tipo === 'mensual') {
      const doceMesesAtras = new Date()
      doceMesesAtras.setMonth(doceMesesAtras.getMonth() - 12)
      where.fecha = { gte: doceMesesAtras }
    }

    if (clienteId) {
      where.clienteId = clienteId
    }

    // Obtener facturas con pagos
    const facturas = await db.factura.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true } },
        pagosFactura: true,
      },
      orderBy: { fecha: 'asc' }
    })

    // Calcular montos pagados y saldos
    const facturasConMontos = facturas.map(f => {
      const totalPagado = f.pagosFactura.reduce((sum, p) => sum + p.monto, 0)
      const saldoPendiente = Math.max(0, f.total - totalPagado)
      return { ...f, totalPagado, saldoPendiente }
    })

    // Procesar según tipo de informe
    if (tipo === 'semanal') {
      return NextResponse.json({ success: true, data: procesarDatosSemanales(facturasConMontos) })
    }

    if (tipo === 'mensual') {
      return NextResponse.json({ success: true, data: procesarDatosMensuales(facturasConMontos) })
    }

    if (tipo === 'porCliente') {
      return NextResponse.json({ success: true, data: procesarDatosPorCliente(facturasConMontos) })
    }

    if (tipo === 'porTipo') {
      return NextResponse.json({ success: true, data: procesarDatosPorTipo(facturasConMontos) })
    }

    // General: devolver resumen completo
    const montoTotal = facturasConMontos.reduce((sum, f) => sum + f.total, 0)
    const montoPagado = facturasConMontos.reduce((sum, f) => sum + f.totalPagado, 0)
    const saldoPendiente = facturasConMontos.reduce((sum, f) => sum + f.saldoPendiente, 0)

    // Top clientes por deuda
    const clientesConDeuda = procesarDatosPorCliente(facturasConMontos)
      .filter(c => c.saldoPendiente > 0)
      .slice(0, 10)

    // Distribución por tipo de comprobante
    const porTipo = procesarDatosPorTipo(facturasConMontos)

    // Distribución por estado
    const porEstado = {
      pendientes: facturasConMontos.filter(f => f.estado === 'PENDIENTE').length,
      emitidas: facturasConMontos.filter(f => f.estado === 'EMITIDA').length,
      pagadas: facturasConMontos.filter(f => f.estado === 'PAGADA').length,
      montoPendientes: facturasConMontos.filter(f => f.estado === 'PENDIENTE').reduce((s, f) => s + f.total, 0),
      montoEmitidas: facturasConMontos.filter(f => f.estado === 'EMITIDA').reduce((s, f) => s + f.total, 0),
      montoPagadas: facturasConMontos.filter(f => f.estado === 'PAGADA').reduce((s, f) => s + f.total, 0),
    }

    // Facturas vencidas (> 30 días sin pagar)
    const ahora = new Date()
    const vencidas = facturasConMontos.filter(f => {
      if (f.estado === 'PAGADA') return false
      const dias = Math.floor((ahora.getTime() - new Date(f.fecha).getTime()) / (1000 * 60 * 60 * 24))
      return dias > 30
    })

    const resumen = {
      totalFacturas: facturasConMontos.length,
      montoTotal,
      montoPagado,
      saldoPendiente,
      porcentajeCobro: montoTotal > 0 ? ((montoPagado / montoTotal) * 100).toFixed(1) : '0',
      facturasVencidas: vencidas.length,
      montoVencido: vencidas.reduce((s, f) => s + f.saldoPendiente, 0),
      porEstado,
      porTipo,
      topClientesDeuda: clientesConDeuda,
      periodo: {
        desde: fechaDesde || null,
        hasta: fechaHasta || null,
      }
    }

    return NextResponse.json({ success: true, data: resumen })
  } catch (error) {
    console.error('Error generando informe de facturación:', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar informe' },
      { status: 500 }
    )
  }
}

function procesarDatosSemanales(facturas: any[]) {
  const semanas: Record<string, { label: string; total: number; cantidad: number; pagado: number; pendiente: number }> = {}

  for (const factura of facturas) {
    const fecha = new Date(factura.fecha)
    const inicioSemana = startOfWeek(fecha, { weekStartsOn: 1, locale: es })
    const key = format(inicioSemana, 'yyyy-MM-dd')
    const label = format(inicioSemana, "dd MMM", { locale: es })

    if (!semanas[key]) {
      semanas[key] = { label, total: 0, cantidad: 0, pagado: 0, pendiente: 0 }
    }

    semanas[key].total += factura.total
    semanas[key].cantidad += 1
    semanas[key].pagado += factura.totalPagado
    semanas[key].pendiente += factura.saldoPendiente
  }

  return Object.entries(semanas)
    .map(([key, data]) => ({ fecha: key, ...data }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

function procesarDatosMensuales(facturas: any[]) {
  const meses: Record<string, { label: string; total: number; cantidad: number; pagado: number; pendiente: number }> = {}

  for (const factura of facturas) {
    const fecha = new Date(factura.fecha)
    const key = format(fecha, 'yyyy-MM')
    const label = format(fecha, "MMMM yyyy", { locale: es })

    if (!meses[key]) {
      meses[key] = { label, total: 0, cantidad: 0, pagado: 0, pendiente: 0 }
    }

    meses[key].total += factura.total
    meses[key].cantidad += 1
    meses[key].pagado += factura.totalPagado
    meses[key].pendiente += factura.saldoPendiente
  }

  return Object.entries(meses)
    .map(([key, data]) => ({ mes: key, ...data }))
    .sort((a, b) => a.mes.localeCompare(b.mes))
}

function procesarDatosPorCliente(facturas: any[]) {
  const clientes: Record<string, { clienteId: string; clienteNombre: string; total: number; cantidad: number; saldoPendiente: number }> = {}

  for (const factura of facturas) {
    const key = factura.clienteId

    if (!clientes[key]) {
      clientes[key] = {
        clienteId: factura.clienteId,
        clienteNombre: factura.cliente?.nombre || 'Sin cliente',
        total: 0,
        cantidad: 0,
        saldoPendiente: 0
      }
    }

    clientes[key].total += factura.total
    clientes[key].cantidad += 1
    clientes[key].saldoPendiente += factura.saldoPendiente
  }

  return Object.values(clientes).sort((a, b) => b.total - a.total)
}

function procesarDatosPorTipo(facturas: any[]) {
  const tipos: Record<string, { tipo: string; label: string; cantidad: number; total: number }> = {
    FACTURA_A: { tipo: 'FACTURA_A', label: 'Factura A', cantidad: 0, total: 0 },
    FACTURA_B: { tipo: 'FACTURA_B', label: 'Factura B', cantidad: 0, total: 0 },
    FACTURA_C: { tipo: 'FACTURA_C', label: 'Factura C', cantidad: 0, total: 0 },
  }

  for (const factura of facturas) {
    const tipo = factura.tipoComprobante as string
    if (tipos[tipo]) {
      tipos[tipo].cantidad += 1
      tipos[tipo].total += factura.total
    }
  }

  return Object.values(tipos).filter(t => t.cantidad > 0)
}
