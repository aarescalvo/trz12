import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const clienteId = searchParams.get('clienteId')

    // Build date filter
    const dateFilter: any = {}
    if (fechaDesde || fechaHasta) {
      dateFilter.fecha = {}
      if (fechaDesde) dateFilter.fecha.gte = new Date(fechaDesde)
      if (fechaHasta) {
        const hasta = new Date(fechaHasta)
        hasta.setHours(23, 59, 59, 999)
        dateFilter.fecha.lte = hasta
      }
    }

    // ============= DATASET 1: Faena vs Facturado =============
    // Get all usuarios de faena (clients) with their tropas
    const tropasWhere: any = {}
    if (clienteId) {
      tropasWhere.usuarioFaenaId = clienteId
    }
    if (fechaDesde || fechaHasta) {
      tropasWhere.fechaRecepcion = {}
      if (fechaDesde) tropasWhere.fechaRecepcion.gte = new Date(fechaDesde)
      if (fechaHasta) {
        const hasta = new Date(fechaHasta)
        hasta.setHours(23, 59, 59, 999)
        tropasWhere.fechaRecepcion.lte = hasta
      }
    }

    const tropas = await db.tropa.findMany({
      where: tropasWhere,
      include: {
        usuarioFaena: true,
        animales: true
      }
    })

    // Group by usuarioFaenaId
    const clientesMap = new Map<string, any>()

    for (const tropa of tropas) {
      const uId = tropa.usuarioFaenaId
      if (!clientesMap.has(uId)) {
        const cliente = tropa.usuarioFaena
        clientesMap.set(uId, {
          clienteId: uId,
          clienteNombre: cliente.nombre,
          cuit: cliente.cuit || '-',
          cabezasFaenadas: 0,
          kgFaenados: 0,
          mediasDespachadas: 0,
          kgDespachados: 0,
          mediasFacturadas: 0,
          kgFacturados: 0,
          montoFacturado: 0,
          mediasEnCamara: 0
        })
      }

      const entry = clientesMap.get(uId)!
      entry.cabezasFaenadas += tropa.cantidadCabezas
      entry.kgFaenados += tropa.pesoNeto || 0
    }

    // Get medias data for each client
    for (const [uId, entry] of clientesMap) {
      const mediasWhere: any = { usuarioFaenaId: uId }
      if (fechaDesde || fechaHasta) {
        mediasWhere.createdAt = {}
        if (fechaDesde) mediasWhere.createdAt.gte = new Date(fechaDesde)
        if (fechaHasta) {
          const hasta = new Date(fechaHasta)
          hasta.setHours(23, 59, 59, 999)
          mediasWhere.createdAt.lte = hasta
        }
      }

      const medias = await db.mediaRes.findMany({
        where: mediasWhere,
        select: {
          estado: true,
          peso: true
        }
      })

      entry.mediasDespachadas = medias.filter(m => m.estado === 'DESPACHADO').length
      entry.kgDespachados = medias
        .filter(m => m.estado === 'DESPACHADO')
        .reduce((sum, m) => sum + m.peso, 0)
      entry.mediasFacturadas = 0
      entry.kgFacturados = 0
      entry.mediasEnCamara = medias.filter(m => m.estado === 'EN_CAMARA').length
    }

    // Get facturas for montoFacturado
    const facturasForFaena = await db.factura.findMany({
      where: {
        ...dateFilter,
        ...(clienteId ? { clienteId } : {})
      },
      select: {
        clienteId: true,
        total: true
      }
    })

    for (const f of facturasForFaena) {
      const entry = clientesMap.get(f.clienteId)
      if (entry) {
        entry.montoFacturado += f.total
      }
    }

    const faenaVsFacturado = Array.from(clientesMap.values()).map(entry => ({
      ...entry,
      kgFaenados: Math.round(entry.kgFaenados * 100) / 100,
      kgDespachados: Math.round(entry.kgDespachados * 100) / 100,
      kgFacturados: Math.round(entry.kgFacturados * 100) / 100,
      montoFacturado: Math.round(entry.montoFacturado * 100) / 100,
      ratioFacturadoFaena: entry.kgFaenados > 0
        ? Math.round((entry.kgFacturados / entry.kgFaenados) * 10000) / 100
        : 0
    }))

    // ============= DATASET 2: Facturado vs Pagado =============
    const facturasWhere: any = {}
    if (clienteId) {
      facturasWhere.clienteId = clienteId
    }
    if (fechaDesde || fechaHasta) {
      facturasWhere.fecha = {}
      if (fechaDesde) facturasWhere.fecha.gte = new Date(fechaDesde)
      if (fechaHasta) {
        const hasta = new Date(fechaHasta)
        hasta.setHours(23, 59, 59, 999)
        facturasWhere.fecha.lte = hasta
      }
    }

    const facturas = await db.factura.findMany({
      where: facturasWhere,
      include: {
        cliente: {
          select: { id: true, nombre: true }
        },
        pagosFactura: true
      },
      orderBy: { fecha: 'desc' }
    })

    // Group facturas by client
    const facturasByClient = new Map<string, any>()

    for (const f of facturas) {
      const cId = f.clienteId
      if (!facturasByClient.has(cId)) {
        facturasByClient.set(cId, {
          clienteId: cId,
          clienteNombre: f.cliente?.nombre || '-',
          totalFacturado: 0,
          totalCobrado: 0,
          saldoPendiente: 0,
          facturasPendientes: 0,
          facturasPagadas: 0,
          facturasAnuladas: 0,
          facturas: []
        })
      }

      const entry = facturasByClient.get(cId)!
      entry.totalFacturado += f.total
      const totalPagos = f.pagosFactura.reduce((sum, p) => sum + p.monto, 0)
      entry.totalCobrado += totalPagos
      entry.saldoPendiente += (f.total - f.pagosFactura.reduce((s, p) => s + p.monto, 0))

      if (f.estado === 'PENDIENTE' || f.estado === 'EMITIDA') {
        entry.facturasPendientes++
      } else if (f.estado === 'PAGADA') {
        entry.facturasPagadas++
      } else if (f.estado === 'ANULADA') {
        entry.facturasAnuladas++
      }

      entry.facturas.push({
        id: f.id,
        numero: f.numero,
        fecha: f.fecha,
        total: f.total,
        saldo: f.total - f.pagosFactura.reduce((s, p) => s + p.monto, 0),
        estado: f.estado,
        tipoComprobante: f.tipoComprobante
      })
    }

    const facturadoVsPagado = Array.from(facturasByClient.values()).map(entry => ({
      ...entry,
      totalFacturado: Math.round(entry.totalFacturado * 100) / 100,
      totalCobrado: Math.round(entry.totalCobrado * 100) / 100,
      saldoPendiente: Math.round(entry.saldoPendiente * 100) / 100
    }))

    return NextResponse.json({
      success: true,
      data: {
        faenaVsFacturado,
        facturadoVsPagado
      }
    })
  } catch (error) {
    console.error('Error en resumen-cliente-faena:', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar resumen de cliente' },
      { status: 500 }
    )
  }
}
