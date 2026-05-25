import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Reporte de Stock
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const camaraId = searchParams.get('camaraId')
    const especie = searchParams.get('especie')

    // Obtener todas las cámaras activas
    const camaras = await db.camara.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      include: {
        stockMedias: true,
        mediasRes: {
          where: { estado: 'EN_CAMARA' },
          include: {
            romaneo: {
              select: {
                tropaCodigo: true,
                fecha: true,
                pesoTotal: true
              }
            }
          }
        }
      }
    })

    // Filtrar por cámara si se especifica
    let camarasFiltradas = camaras
    if (camaraId) {
      camarasFiltradas = camaras.filter(c => c.id === camaraId)
    }

    // Calcular stock por cámara
    const stockPorCamara = camarasFiltradas.map(camara => {
      // Filtrar por especie si se especifica
      let mediasFiltradas = camara.mediasRes
      if (especie) {
        mediasFiltradas = camara.mediasRes.filter(m => {
          // Obtener especie del stockMedias relacionado
          const stockMedia = camara.stockMedias.find(s => s.especie === especie)
          return stockMedia !== undefined
        })
      }

      const totalMedias = mediasFiltradas.length
      const pesoTotal = mediasFiltradas.reduce((acc, m) => acc + (m.peso || 0), 0)
      const ocupacion = camara.capacidad > 0 
        ? Math.round((totalMedias / camara.capacidad) * 100) 
        : 0

      // Agrupar por tropa
      const porTropa: Record<string, { cantidad: number; peso: number }> = {}
      mediasFiltradas.forEach(m => {
        const tropa = m.romaneo?.tropaCodigo || 'Sin tropa'
        if (!porTropa[tropa]) {
          porTropa[tropa] = { cantidad: 0, peso: 0 }
        }
        porTropa[tropa].cantidad++
        porTropa[tropa].peso += m.peso || 0
      })

      // Agrupar por sigla (A, T, D)
      const porSigla: Record<string, number> = {}
      mediasFiltradas.forEach(m => {
        const sigla = m.sigla || 'A'
        porSigla[sigla] = (porSigla[sigla] || 0) + 1
      })

      // Calcular edad promedio del stock
      const fechasIngreso = mediasFiltradas
        .map(m => m.createdAt)
        .filter(f => f)
      
      let edadPromedioDias = 0
      if (fechasIngreso.length > 0) {
        const ahora = new Date()
        const edadTotal = fechasIngreso.reduce((acc, f) => {
          const diff = ahora.getTime() - new Date(f).getTime()
          return acc + (diff / (1000 * 60 * 60 * 24))
        }, 0)
        edadPromedioDias = Math.round(edadTotal / fechasIngreso.length)
      }

      return {
        id: camara.id,
        nombre: camara.nombre,
        tipo: camara.tipo,
        capacidad: camara.capacidad,
        totalMedias,
        pesoTotal,
        ocupacion,
        edadPromedioDias,
        porTropa: Object.entries(porTropa).map(([tropa, datos]) => ({
          tropaCodigo: tropa,
          ...datos
        })),
        porSigla
      }
    })

    // Calcular totales generales
    const totalGeneral = {
      camaras: camarasFiltradas.length,
      totalMedias: stockPorCamara.reduce((acc, c) => acc + c.totalMedias, 0),
      pesoTotal: stockPorCamara.reduce((acc, c) => acc + c.pesoTotal, 0),
      ocupacionPromedio: stockPorCamara.reduce((acc, c) => acc + c.ocupacion, 0) / Math.max(stockPorCamara.length, 1)
    }

    // Alertas de stock
    const alertas: Array<{ camara: string; tipo: string; mensaje: string; nivel: 'warning' | 'critical' }> = []
    
    stockPorCamara.forEach(camara => {
      if (camara.ocupacion >= 90) {
        alertas.push({
          camara: camara.nombre,
          tipo: 'CAPACIDAD',
          mensaje: `Cámara al ${camara.ocupacion}% de capacidad`,
          nivel: 'critical'
        })
      } else if (camara.ocupacion >= 75) {
        alertas.push({
          camara: camara.nombre,
          tipo: 'CAPACIDAD',
          mensaje: `Cámara al ${camara.ocupacion}% de capacidad`,
          nivel: 'warning'
        })
      }

      if (camara.edadPromedioDias > 7) {
        alertas.push({
          camara: camara.nombre,
          tipo: 'ANTIGUEDAD',
          mensaje: `Stock promedio de ${camara.edadPromedioDias} días`,
          nivel: 'warning'
        })
      }
    })

    // Stock por especie
    const stockPorEspecie: Record<string, { cantidad: number; peso: number }> = {
      BOVINO: { cantidad: 0, peso: 0 },
      EQUINO: { cantidad: 0, peso: 0 }
    }

    camarasFiltradas.forEach(camara => {
      camara.stockMedias.forEach(stock => {
        if (!stockPorEspecie[stock.especie]) {
          stockPorEspecie[stock.especie] = { cantidad: 0, peso: 0 }
        }
        stockPorEspecie[stock.especie].cantidad += stock.cantidad
        stockPorEspecie[stock.especie].peso += stock.pesoTotal
      })
    })

    // Últimos movimientos
    const movimientos = await db.movimientoCamara.findMany({
      take: 50,
      orderBy: { fecha: 'desc' },
      include: {
        camaraOrigen: { select: { nombre: true } },
        camaraDestino: { select: { nombre: true } },
        operador: { select: { nombre: true } }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        fechaGeneracion: new Date().toISOString(),
        totalGeneral,
        stockPorCamara,
        stockPorEspecie: Object.entries(stockPorEspecie).map(([esp, datos]) => ({
          especie: esp,
          ...datos
        })),
        alertas,
        ultimosMovimientos: movimientos.map(m => ({
          id: m.id,
          fecha: m.fecha.toISOString(),
          camaraOrigen: m.camaraOrigen?.nombre,
          camaraDestino: m.camaraDestino?.nombre,
          producto: m.producto,
          cantidad: m.cantidad,
          peso: m.peso,
          operador: m.operador?.nombre
        }))
      }
    })
  } catch (error) {
    console.error('[Reporte Stock API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar reporte de stock' },
      { status: 500 }
    )
  }
}
