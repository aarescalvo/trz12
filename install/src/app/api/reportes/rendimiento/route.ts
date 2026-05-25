import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Reporte de Rendimiento
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaDesde = searchParams.get('fechaDesde') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const fechaHasta = searchParams.get('fechaHasta') || new Date().toISOString().split('T')[0]
    const tropaCodigo = searchParams.get('tropaCodigo')

    // Construir filtro
    const where: Record<string, unknown> = {
      fecha: {
        gte: new Date(fechaDesde),
        lte: new Date(fechaHasta + 'T23:59:59')
      }
    }

    if (tropaCodigo) {
      where.tropaCodigo = tropaCodigo
    }

    // Obtener romaneos
    const romaneos = await db.romaneo.findMany({
      where,
      include: {
        tipificador: { select: { nombre: true, apellido: true } }
      },
      orderBy: { fecha: 'asc' }
    })

    // Obtener tropas con peso bruto y tara
    const tropas = await db.tropa.findMany({
      where: tropaCodigo ? { codigo: tropaCodigo } : {},
      include: {
        animales: {
          include: {
            pesajeIndividual: true
          }
        }
      }
    })

    // Calcular estadísticas generales
    const totalAnimales = romaneos.length
    const totalPesoVivo = romaneos.reduce((acc, r) => acc + (r.pesoVivo || 0), 0)
    const totalPesoCanal = romaneos.reduce((acc, r) => acc + (r.pesoTotal || 0), 0)
    const rindeGeneral = totalPesoVivo > 0 ? (totalPesoCanal / totalPesoVivo) * 100 : 0

    // Rendimiento por fecha
    const porFecha: Record<string, { cantidad: number; pesoVivo: number; pesoCanal: number; rinde: number }> = {}
    romaneos.forEach(r => {
      const fecha = r.fecha.toISOString().split('T')[0]
      if (!porFecha[fecha]) {
        porFecha[fecha] = { cantidad: 0, pesoVivo: 0, pesoCanal: 0, rinde: 0 }
      }
      porFecha[fecha].cantidad++
      porFecha[fecha].pesoVivo += r.pesoVivo || 0
      porFecha[fecha].pesoCanal += r.pesoTotal || 0
    })

    // Calcular rinde por fecha
    Object.keys(porFecha).forEach(fecha => {
      porFecha[fecha].rinde = porFecha[fecha].pesoVivo > 0 
        ? (porFecha[fecha].pesoCanal / porFecha[fecha].pesoVivo) * 100 
        : 0
    })

    // Rendimiento por tropa
    const porTropa: Record<string, { cantidad: number; pesoVivo: number; pesoCanal: number; rinde: number; rindePromedio: number }> = {}
    romaneos.forEach(r => {
      const codigo = r.tropaCodigo || 'Sin tropa'
      if (!porTropa[codigo]) {
        porTropa[codigo] = { cantidad: 0, pesoVivo: 0, pesoCanal: 0, rinde: 0, rindePromedio: 0 }
      }
      porTropa[codigo].cantidad++
      porTropa[codigo].pesoVivo += r.pesoVivo || 0
      porTropa[codigo].pesoCanal += r.pesoTotal || 0
    })

    // Calcular rinde por tropa
    Object.keys(porTropa).forEach(codigo => {
      porTropa[codigo].rinde = porTropa[codigo].pesoVivo > 0 
        ? (porTropa[codigo].pesoCanal / porTropa[codigo].pesoVivo) * 100 
        : 0
    })

    // Rendimiento por tipo de animal
    const porTipoAnimal: Record<string, { cantidad: number; pesoVivo: number; pesoCanal: number; rinde: number }> = {}
    romaneos.forEach(r => {
      const tipo = r.tipoAnimal || 'SIN_TIPO'
      if (!porTipoAnimal[tipo]) {
        porTipoAnimal[tipo] = { cantidad: 0, pesoVivo: 0, pesoCanal: 0, rinde: 0 }
      }
      porTipoAnimal[tipo].cantidad++
      porTipoAnimal[tipo].pesoVivo += r.pesoVivo || 0
      porTipoAnimal[tipo].pesoCanal += r.pesoTotal || 0
    })

    // Calcular rinde por tipo
    Object.keys(porTipoAnimal).forEach(tipo => {
      porTipoAnimal[tipo].rinde = porTipoAnimal[tipo].pesoVivo > 0 
        ? (porTipoAnimal[tipo].pesoCanal / porTipoAnimal[tipo].pesoVivo) * 100 
        : 0
    })

    // Rendimiento por rango de denticion
    const porDenticion: Record<string, { cantidad: number; pesoVivo: number; pesoCanal: number; rinde: number }> = {}
    romaneos.forEach(r => {
      const denticion = r.denticion || 'Sin dato'
      if (!porDenticion[denticion]) {
        porDenticion[denticion] = { cantidad: 0, pesoVivo: 0, pesoCanal: 0, rinde: 0 }
      }
      porDenticion[denticion].cantidad++
      porDenticion[denticion].pesoVivo += r.pesoVivo || 0
      porDenticion[denticion].pesoCanal += r.pesoTotal || 0
    })

    // Calcular rinde por denticion
    Object.keys(porDenticion).forEach(d => {
      porDenticion[d].rinde = porDenticion[d].pesoVivo > 0 
        ? (porDenticion[d].pesoCanal / porDenticion[d].pesoVivo) * 100 
        : 0
    })

    // Top 10 mejores y peores rendimientos individuales
    const rendimientosIndividuales = romaneos
      .filter(r => r.pesoVivo && r.pesoTotal)
      .map(r => ({
        garron: r.garron,
        tropaCodigo: r.tropaCodigo,
        tipoAnimal: r.tipoAnimal,
        pesoVivo: r.pesoVivo,
        pesoCanal: r.pesoTotal,
        rinde: r.rinde || (r.pesoVivo > 0 ? (r.pesoTotal! / r.pesoVivo!) * 100 : 0),
        fecha: r.fecha.toISOString()
      }))
      .sort((a, b) => b.rinde - a.rinde)

    const mejores = rendimientosIndividuales.slice(0, 10)
    const peores = rendimientosIndividuales.slice(-10).reverse()

    return NextResponse.json({
      success: true,
      data: {
        fechaDesde,
        fechaHasta,
        resumen: {
          totalAnimales,
          totalPesoVivo,
          totalPesoCanal,
          rindeGeneral,
          promedioPesoVivo: totalAnimales > 0 ? totalPesoVivo / totalAnimales : 0,
          promedioPesoCanal: totalAnimales > 0 ? totalPesoCanal / totalAnimales : 0
        },
        porFecha: Object.entries(porFecha).map(([fecha, datos]) => ({
          fecha,
          ...datos
        })),
        porTropa: Object.entries(porTropa).map(([codigo, datos]) => ({
          tropaCodigo: codigo,
          ...datos
        })),
        porTipoAnimal: Object.entries(porTipoAnimal).map(([tipo, datos]) => ({
          tipoAnimal: tipo,
          ...datos
        })),
        porDenticion: Object.entries(porDenticion).map(([denticion, datos]) => ({
          denticion,
          ...datos
        })),
        mejores,
        peores,
        detalle: rendimientosIndividuales
      }
    })
  } catch (error) {
    console.error('[Reporte Rendimiento API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar reporte de rendimiento' },
      { status: 500 }
    )
  }
}
