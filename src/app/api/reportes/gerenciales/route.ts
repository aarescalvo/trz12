import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'
import { createLogger } from '@/lib/logger'

const logger = createLogger('API:ReportesGerenciales')

// GET - Reportes gerenciales con indicadores clave
export async function GET(request: NextRequest) {
  try {
    const authError = await checkPermission(request, 'puedeReportes')
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || 'mes'

    const hoy = new Date()
    let fechaInicio: Date

    switch (periodo) {
      case 'semana':
        fechaInicio = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'trimestre':
        fechaInicio = new Date(hoy.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'anio':
        fechaInicio = new Date(hoy.getFullYear(), 0, 1)
        break
      default: // mes
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    }

    // Faena
    const romaneos = await db.romaneo.findMany({
      where: { fecha: { gte: fechaInicio } },
      select: { fecha: true, pesoTotal: true, pesoVivo: true }
    })

    const diasUnicos = new Set(romaneos.map(r => r.fecha.toISOString().split('T')[0]))
    const totalFaena = romaneos.length
    const promedioFaena = diasUnicos.size > 0 ? Math.round(totalFaena / diasUnicos.size) : 0

    // Rinde
    const rindes = romaneos
      .filter(r => r.pesoVivo && r.pesoVivo > 0 && r.pesoTotal && r.pesoTotal > 0)
      .map(r => (r.pesoTotal! / r.pesoVivo!) * 100)

    const rindePromedio = rindes.length > 0 ? rindes.reduce((a, b) => a + b, 0) / rindes.length : 0
    const rindeMaximo = rindes.length > 0 ? Math.max(...rindes) : 0
    const rindeMinimo = rindes.length > 0 ? Math.min(...rindes) : 0

    // Stock
    const stockMedias = await db.mediaRes.count({ where: { estado: 'EN_CAMARA' } })
    const stockCuartos = await db.cuarto.count({ where: { estado: 'EN_CAMARA' } })
    const stockProductos = await db.cajaEmpaque.count({ where: { estado: 'EN_CAMARA' } })

    // Ingresos
    const facturas = await db.factura.findMany({
      where: { fecha: { gte: fechaInicio } },
      select: { total: true }
    })
    const ingresosTotal = facturas.reduce((sum, f) => sum + (f.total || 0), 0)
    const ingresosPendiente = ingresosTotal // saldo is derived, not stored

    // Tendencia (comparar con período anterior)
    const duracionPeriodo = hoy.getTime() - fechaInicio.getTime()
    const fechaInicioAnterior = new Date(fechaInicio.getTime() - duracionPeriodo)
    const faenaAnterior = await db.romaneo.count({
      where: { fecha: { gte: fechaInicioAnterior, lt: fechaInicio } }
    })
    const tendencia = faenaAnterior > 0
      ? Math.round(((totalFaena - faenaAnterior) / faenaAnterior) * 100)
      : 0

    return NextResponse.json({
      success: true,
      data: {
        faena: {
          total: totalFaena,
          promedio: promedioFaena,
          tendencia
        },
        rinde: {
          promedio: Math.round(rindePromedio * 10) / 10,
          maximo: Math.round(rindeMaximo * 10) / 10,
          minimo: Math.round(rindeMinimo * 10) / 10
        },
        stock: {
          mediasRes: stockMedias,
          cuartos: stockCuartos,
          productos: stockProductos
        },
        ingresos: {
          total: Math.round(ingresosTotal * 100) / 100,
          pendiente: Math.round(ingresosPendiente * 100) / 100
        }
      }
    })
  } catch (error) {
    logger.error('Error en reportes gerenciales', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar reporte gerencial' },
      { status: 500 }
    )
  }
}
