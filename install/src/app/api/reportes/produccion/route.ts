import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Reporte de Producción
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaDesde = searchParams.get('fechaDesde') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const fechaHasta = searchParams.get('fechaHasta') || new Date().toISOString().split('T')[0]
    const tipoProducto = searchParams.get('tipoProducto')

    // Obtener romaneos del período
    const romaneos = await db.romaneo.findMany({
      where: {
        fecha: {
          gte: new Date(fechaDesde),
          lte: new Date(fechaHasta + 'T23:59:59')
        }
      },
      include: {
        mediasRes: true
      },
      orderBy: { fecha: 'asc' }
    })

    // Obtener menudencias del período
    const menudencias = await db.menudencia.findMany({
      where: {
        fechaIngreso: {
          gte: new Date(fechaDesde),
          lte: new Date(fechaHasta + 'T23:59:59')
        }
      },
      include: {
        tipoMenudencia: { select: { nombre: true } }
      },
      orderBy: { fechaIngreso: 'asc' }
    })

    // Obtener movimientos de cámara del período
    const movimientos = await db.movimientoCamara.findMany({
      where: {
        fecha: {
          gte: new Date(fechaDesde),
          lte: new Date(fechaHasta + 'T23:59:59')
        }
      },
      include: {
        camaraOrigen: { select: { nombre: true, tipo: true } },
        camaraDestino: { select: { nombre: true, tipo: true } }
      },
      orderBy: { fecha: 'asc' }
    })

    // Producción de medias reses
    const totalMedias = romaneos.reduce((acc, r) => acc + r.mediasRes.length, 0)
    const pesoTotalMedias = romaneos.reduce((acc, r) => acc + (r.pesoTotal || 0), 0)
    
    // Producción por fecha
    const produccionPorFecha: Record<string, { 
      animales: number; 
      medias: number; 
      pesoCanal: number;
      menudencias: number;
      pesoMenudencias: number;
    }> = {}

    romaneos.forEach(r => {
      const fecha = r.fecha.toISOString().split('T')[0]
      if (!produccionPorFecha[fecha]) {
        produccionPorFecha[fecha] = { animales: 0, medias: 0, pesoCanal: 0, menudencias: 0, pesoMenudencias: 0 }
      }
      produccionPorFecha[fecha].animales++
      produccionPorFecha[fecha].medias += r.mediasRes.length
      produccionPorFecha[fecha].pesoCanal += r.pesoTotal || 0
    })

    menudencias.forEach(m => {
      const fecha = m.fechaIngreso.toISOString().split('T')[0]
      if (!produccionPorFecha[fecha]) {
        produccionPorFecha[fecha] = { animales: 0, medias: 0, pesoCanal: 0, menudencias: 0, pesoMenudencias: 0 }
      }
      produccionPorFecha[fecha].menudencias++
      produccionPorFecha[fecha].pesoMenudencias += m.pesoIngreso || 0
    })

    // Producción de menudencias por tipo
    const menudenciasPorTipo: Record<string, { cantidad: number; pesoIngreso: number; pesoElaborado: number }> = {}
    menudencias.forEach(m => {
      const tipo = m.tipoMenudencia?.nombre || 'Sin tipo'
      if (!menudenciasPorTipo[tipo]) {
        menudenciasPorTipo[tipo] = { cantidad: 0, pesoIngreso: 0, pesoElaborado: 0 }
      }
      menudenciasPorTipo[tipo].cantidad++
      menudenciasPorTipo[tipo].pesoIngreso += m.pesoIngreso || 0
      menudenciasPorTipo[tipo].pesoElaborado += m.pesoElaborado || 0
    })

    // Movimientos por tipo de cámara
    const movimientosPorTipoCamara: Record<string, { ingresos: number; egresos: number; pesoTotal: number }> = {}
    movimientos.forEach(m => {
      if (m.camaraDestino) {
        const tipo = m.camaraDestino.tipo
        if (!movimientosPorTipoCamara[tipo]) {
          movimientosPorTipoCamara[tipo] = { ingresos: 0, egresos: 0, pesoTotal: 0 }
        }
        movimientosPorTipoCamara[tipo].ingresos++
        movimientosPorTipoCamara[tipo].pesoTotal += m.peso || 0
      }
      if (m.camaraOrigen) {
        const tipo = m.camaraOrigen.tipo
        if (!movimientosPorTipoCamara[tipo]) {
          movimientosPorTipoCamara[tipo] = { ingresos: 0, egresos: 0, pesoTotal: 0 }
        }
        movimientosPorTipoCamara[tipo].egresos++
      }
    })

    // Resumen general
    const resumen = {
      totalAnimalesFaenados: romaneos.length,
      totalMedias,
      pesoTotalCanal: pesoTotalMedias,
      promedioPesoCanal: romaneos.length > 0 ? pesoTotalMedias / romaneos.length : 0,
      totalMenudencias: menudencias.length,
      pesoTotalMenudencias: menudencias.reduce((acc, m) => acc + (m.pesoIngreso || 0), 0),
      pesoElaboradoMenudencias: menudencias.reduce((acc, m) => acc + (m.pesoElaborado || 0), 0),
      totalMovimientos: movimientos.length
    }

    // Promedios diarios
    const dias = Object.keys(produccionPorFecha).length || 1
    const promediosDiarios = {
      animales: resumen.totalAnimalesFaenados / dias,
      medias: resumen.totalMedias / dias,
      pesoCanal: resumen.pesoTotalCanal / dias,
      menudencias: resumen.totalMenudencias / dias
    }

    return NextResponse.json({
      success: true,
      data: {
        fechaDesde,
        fechaHasta,
        resumen,
        promediosDiarios,
        produccionPorFecha: Object.entries(produccionPorFecha).map(([fecha, datos]) => ({
          fecha,
          ...datos
        })),
        menudenciasPorTipo: Object.entries(menudenciasPorTipo).map(([tipo, datos]) => ({
          tipoMenudencia: tipo,
          ...datos
        })),
        movimientosPorTipoCamara: Object.entries(movimientosPorTipoCamara).map(([tipo, datos]) => ({
          tipoCamara: tipo,
          ...datos
        })),
        detalleRomaneos: romaneos.slice(0, 100).map(r => ({
          garron: r.garron,
          fecha: r.fecha.toISOString(),
          tropaCodigo: r.tropaCodigo,
          pesoTotal: r.pesoTotal,
          medias: r.mediasRes.length
        })),
        detalleMenudencias: menudencias.slice(0, 100).map(m => ({
          id: m.id,
          tipo: m.tipoMenudencia?.nombre,
          fecha: m.fechaIngreso.toISOString(),
          pesoIngreso: m.pesoIngreso,
          pesoElaborado: m.pesoElaborado,
          elaborado: !!m.pesoElaborado
        }))
      }
    })
  } catch (error) {
    console.error('[Reporte Producción API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar reporte de producción' },
      { status: 500 }
    )
  }
}
