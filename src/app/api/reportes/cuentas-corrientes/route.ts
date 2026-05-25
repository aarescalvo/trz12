import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'
import { createLogger } from '@/lib/logger'

const logger = createLogger('API:ReportesCuentasCorrientes')

// GET - Reporte de Cuentas Corrientes
export async function GET(request: NextRequest) {
  try {
    const authError = await checkPermission(request, 'puedeReportes')
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    const hoy = new Date()
    const fechaInicio = fechaDesde
      ? new Date(fechaDesde + 'T00:00:00')
      : new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const fechaFin = fechaHasta
      ? new Date(fechaHasta + 'T23:59:59')
      : new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59)

    // Construir filtro para facturas
    const whereFacturas: any = {
      fecha: { gte: fechaInicio, lte: fechaFin },
      estado: { in: ['EMITIDA', 'PENDIENTE'] },
    }

    if (clienteId) {
      whereFacturas.clienteId = clienteId
    }

    // Obtener facturas con pagos
    const facturas = await db.factura.findMany({
      where: whereFacturas,
      include: {
        cliente: { select: { id: true, nombre: true, cuit: true } },
        pagosFactura: {
          select: { id: true, fecha: true, monto: true, metodoPago: true },
          orderBy: { fecha: 'desc' },
        },
      },
      orderBy: { fecha: 'desc' },
    })

    // Obtener última fecha de pago por cliente
    const ultimosPagos = await db.pagoFactura.findMany({
      where: {
        fecha: { lte: new Date() },
        ...(clienteId ? {} : {}),
      },
      include: {
        factura: {
          select: {
            clienteId: true,
          },
        },
      },
      orderBy: { fecha: 'desc' },
      take: 500,
    })

    // Agrupar por cliente
    const clientesMap = new Map<string, {
      clienteId: string
      clienteNombre: string
      clienteCuit: string | null
      totalFacturado: number
      totalPagado: number
      saldo: number
      diasDesdeUltimoPago: number | null
      estado: string
      cantidadFacturas: number
      aging0_30: number
      aging31_60: number
      aging61_90: number
      agingMas90: number
    }>()

    for (const f of facturas) {
      const cid = f.cliente.id
      if (!clientesMap.has(cid)) {
        clientesMap.set(cid, {
          clienteId: cid,
          clienteNombre: f.cliente.nombre,
          clienteCuit: f.cliente.cuit,
          totalFacturado: 0,
          totalPagado: 0,
          saldo: 0,
          diasDesdeUltimoPago: null,
          estado: 'sin pagos',
          cantidadFacturas: 0,
          aging0_30: 0,
          aging31_60: 0,
          aging61_90: 0,
          agingMas90: 0,
        })
      }

      const entry = clientesMap.get(cid)!
      entry.totalFacturado += f.total
      entry.saldo += (f.total - f.pagosFactura.reduce((s, p) => s + p.monto, 0))
      entry.cantidadFacturas++

      // Calcular pagos de esta factura
      const pagosFactura = f.pagosFactura.reduce((sum, p) => sum + p.monto, 0)
      entry.totalPagado += pagosFactura
    }

    // Calcular aging y estado
    const hoyMs = hoy.getTime()
    const detalles = Array.from(clientesMap.values()).map(entry => {
      // Último pago del cliente
      const pagosCliente = ultimosPagos.filter(p => p.factura.clienteId === entry.clienteId)
      const ultimoPago = pagosCliente.length > 0 ? pagosCliente[0] : null

      const diasDesdeUltimoPago = ultimoPago
        ? Math.floor((hoyMs - ultimoPago.fecha.getTime()) / (1000 * 60 * 60 * 24))
        : null

      // Calcular aging según el saldo
      const dias = diasDesdeUltimoPago || 999
      if (entry.saldo <= 0) {
        entry.estado = 'al dia'
      } else if (dias <= 30) {
        entry.estado = 'al dia'
        entry.aging0_30 = entry.saldo
      } else if (dias <= 60) {
        entry.estado = 'vencido'
        entry.aging31_60 = entry.saldo
      } else if (dias <= 90) {
        entry.estado = 'vencido'
        entry.aging61_90 = entry.saldo
      } else {
        entry.estado = 'vencido'
        entry.agingMas90 = entry.saldo
      }

      entry.diasDesdeUltimoPago = diasDesdeUltimoPago

      return {
        ...entry,
        totalFacturado: Math.round(entry.totalFacturado * 100) / 100,
        totalPagado: Math.round(entry.totalPagado * 100) / 100,
        saldo: Math.round(entry.saldo * 100) / 100,
        aging0_30: Math.round(entry.aging0_30 * 100) / 100,
        aging31_60: Math.round(entry.aging31_60 * 100) / 100,
        aging61_90: Math.round(entry.aging61_90 * 100) / 100,
        agingMas90: Math.round(entry.agingMas90 * 100) / 100,
      }
    })

    // Resumen
    const totalSaldos = detalles.reduce((sum, d) => sum + d.saldo, 0)
    const clientesAlDia = detalles.filter(d => d.estado === 'al dia').length
    const clientesVencidos = detalles.filter(d => d.estado === 'vencido').length
    const saldoVencido = detalles
      .filter(d => d.estado === 'vencido')
      .reduce((sum, d) => sum + d.saldo, 0)

    return NextResponse.json({
      success: true,
      data: {
        detalles,
        resumen: {
          totalClientes: detalles.length,
          totalSaldos: Math.round(totalSaldos * 100) / 100,
          clientesAlDia,
          clientesVencidos,
          saldoVencido: Math.round(saldoVencido * 100) / 100,
        },
      },
    })
  } catch (error) {
    logger.error('Error en reporte de cuentas corrientes', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar reporte de cuentas corrientes' },
      { status: 500 }
    )
  }
}
