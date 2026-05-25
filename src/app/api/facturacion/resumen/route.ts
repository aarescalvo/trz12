import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET: Resumen mensual
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const mes = searchParams.get('mes') // 1-12
    const anio = searchParams.get('anio') // 2024, 2025, etc.

    // Si no se especifica mes/año, usar el actual
    const fecha = new Date()
    const mesActual = mes ? parseInt(mes) : fecha.getMonth() + 1
    const anioActual = anio ? parseInt(anio) : fecha.getFullYear()

    // Calcular rango de fechas del mes
    const fechaInicio = new Date(anioActual, mesActual - 1, 1)
    const fechaFin = new Date(anioActual, mesActual, 0, 23, 59, 59)

    // Obtener facturas del mes
    const facturas = await db.factura.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
          }
        },
        detalles: {
          include: {
          }
        }
      }
    })

    // Calcular totales
    const totalFacturado = facturas.reduce((sum, f) => sum + f.total, 0)
    const totalPagado = facturas
      .filter(f => f.estado === 'PAGADA')
      .reduce((sum, f) => sum + f.total, 0)
    const totalPendiente = facturas
      .filter(f => f.estado === 'PENDIENTE')
      .reduce((sum, f) => sum + f.total, 0)

    // Calcular totales por concepto
    let totalServicioFaena = 0
    let totalServicioDespostada = 0
    let totalVentasExtras = 0
    let totalCabezas = 0
    let totalKgGancho = 0

    for (const factura of facturas) {
      for (const detalle of (factura.detalles || [])) {
        const d = detalle as unknown as Record<string, number | undefined>
        totalServicioFaena += d.servicioFaena || 0
        totalServicioDespostada += d.servicioDespostada || 0
        totalVentasExtras += (d.ventaMenudencia || 0) + (d.ventaHueso || 0) + (d.ventaGrasa || 0) + (d.ventaCuero || 0)
        totalCabezas += d.cantidadAnimales || 0
        totalKgGancho += d.kgGancho || 0
      }
    }

    const totalIva = totalServicioFaena + totalServicioDespostada - totalVentasExtras * 0.21

    // Resumen por cliente
    const porCliente: Record<string, {
      cliente: { id: string; nombre: string } | null
      facturas: number
      total: number
      pagado: number
      pendiente: number
      cabezas: number
      kgGancho: number
    }> = {}

    for (const factura of facturas) {
      const clienteId = factura.clienteId
      if (!porCliente[clienteId]) {
        porCliente[clienteId] = {
          cliente: factura.cliente,
          facturas: 0,
          total: 0,
          pagado: 0,
          pendiente: 0,
          cabezas: 0,
          kgGancho: 0
        }
      }
      porCliente[clienteId].facturas += 1
      porCliente[clienteId].total += factura.total
      if (factura.estado === 'PAGADA') {
        porCliente[clienteId].pagado += factura.total
      } else if (factura.estado === 'PENDIENTE') {
        porCliente[clienteId].pendiente += factura.total
      }
      for (const detalle of (factura.detalles || [])) {
        const d = detalle as unknown as Record<string, number | undefined>
        porCliente[clienteId].cabezas += d.cantidadAnimales || 0
        porCliente[clienteId].kgGancho += d.kgGancho || 0
      }
    }

    // Obtener resumen de los últimos 12 meses
    const resumenAnual: Array<{
      mes: number
      anio: number
      nombreMes: string
      totalFacturado: number
      totalPagado: number
      cantidadFacturas: number
    }> = []
    for (let m = 0; m < 12; m++) {
      const fechaInicioMes = new Date(anioActual, mesActual - 1 - m, 1)
      const fechaFinMes = new Date(anioActual, mesActual - m, 0, 23, 59, 59)

      const facturasMes = await db.factura.findMany({
        where: {
          fecha: {
            gte: fechaInicioMes,
            lte: fechaFinMes
          }
        }
      })

      resumenAnual.push({
        mes: fechaInicioMes.getMonth() + 1,
        anio: fechaInicioMes.getFullYear(),
        nombreMes: fechaInicioMes.toLocaleDateString('es-AR', { month: 'long' }),
        totalFacturado: facturasMes.reduce((sum, f) => sum + (f.total || 0), 0),
        totalPagado: facturasMes.filter((f) => f.estado === 'PAGADA').reduce((sum, f) => sum + (f.total || 0), 0),
        cantidadFacturas: facturasMes.length
      })
    }

    // Invertir para mostrar de más antiguo a más reciente
    resumenAnual.reverse()

    return NextResponse.json({
      success: true,
      data: {
        mes: mesActual,
        anio: anioActual,
        nombreMes: fechaInicio.toLocaleDateString('es-AR', { month: 'long' }),
        totalFacturado,
        totalPagado,
        totalPendiente,
        totalServicioFaena,
        totalServicioDespostada,
        totalVentasExtras,
        totalIva,
        totalCabezas,
        totalKgGancho,
        cantidadFacturas: facturas.length,
        porCliente: Object.values(porCliente),
        resumenAnual
      }
    })
  } catch (error) {
    console.error('Error fetching resumen:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener resumen' },
      { status: 500 }
    )
  }
}
