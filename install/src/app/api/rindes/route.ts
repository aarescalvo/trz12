import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET - Obtener rindes por tropa
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tropaId = searchParams.get('tropaId')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    // Construir filtros
    const where: Prisma.RomaneoWhereInput = {
      estado: 'CONFIRMADO'
    }

    if (fechaDesde || fechaHasta) {
      where.fecha = {}
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde)
      if (fechaHasta) where.fecha.lte = new Date(fechaHasta + 'T23:59:59')
    }

    // Obtener romaneos con datos agrupados por tropa
    const romaneos = await db.romaneo.findMany({
      where,
      include: {
        tipificador: true
      },
      orderBy: { fecha: 'desc' }
    })

    // Agrupar por tropaCodigo
    const rindesPorTropa: Record<string, {
      tropaCodigo: string
      cantidadAnimales: number
      pesoVivoTotal: number
      pesoFaenaTotal: number
      rindePromedio: number
      rindeMinimo: number
      rindeMaximo: number
      animales: typeof romaneos
    }> = {}

    for (const romaneo of romaneos) {
      const codigoTropa = romaneo.tropaCodigo || 'SIN-TROPA'
      
      if (!rindesPorTropa[codigoTropa]) {
        rindesPorTropa[codigoTropa] = {
          tropaCodigo: codigoTropa,
          cantidadAnimales: 0,
          pesoVivoTotal: 0,
          pesoFaenaTotal: 0,
          rindePromedio: 0,
          rindeMinimo: 100,
          rindeMaximo: 0,
          animales: []
        }
      }

      const grupo = rindesPorTropa[codigoTropa]
      grupo.cantidadAnimales++
      grupo.pesoVivoTotal += romaneo.pesoVivo || 0
      grupo.pesoFaenaTotal += romaneo.pesoTotal || 0
      grupo.animales.push(romaneo)

      if (romaneo.rinde) {
        grupo.rindeMinimo = Math.min(grupo.rindeMinimo, romaneo.rinde)
        grupo.rindeMaximo = Math.max(grupo.rindeMaximo, romaneo.rinde)
      }
    }

    // Calcular rindes promedio
    const resultado = Object.values(rindesPorTropa).map(grupo => {
      const rindePromedio = grupo.pesoVivoTotal > 0 
        ? (grupo.pesoFaenaTotal / grupo.pesoVivoTotal) * 100 
        : 0
      
      return {
        ...grupo,
        rindePromedio: Math.round(rindePromedio * 100) / 100,
        pesoVivoTotal: Math.round(grupo.pesoVivoTotal * 100) / 100,
        pesoFaenaTotal: Math.round(grupo.pesoFaenaTotal * 100) / 100,
        animales: undefined // No enviar animales en listado general
      }
    }).sort((a, b) => b.rindePromedio - a.rindePromedio)

    // Si se solicita una tropa específica, devolver detalle
    if (tropaId) {
      const tropa = await db.tropa.findUnique({
        where: { id: tropaId },
        include: {
          productor: true,
          usuarioFaena: true,
          animales: true
        }
      })

      const romaneosTropa = await db.romaneo.findMany({
        where: {
          tropaCodigo: tropa?.codigo,
          estado: 'CONFIRMADO'
        },
        include: {
          tipificador: true
        },
        orderBy: { garron: 'asc' }
      })

      // Calcular estadísticas
      const pesoVivoTotal = romaneosTropa.reduce((sum, r) => sum + (r.pesoVivo || 0), 0)
      const pesoFaenaTotal = romaneosTropa.reduce((sum, r) => sum + (r.pesoTotal || 0), 0)
      const rindes = romaneosTropa.filter(r => r.rinde).map(r => r.rinde!)
      
      // Distribución por tipo de animal
      const distribucionTipo: Record<string, number> = {}
      for (const r of romaneosTropa) {
        const tipo = r.tipoAnimal || 'SIN_TIPO'
        distribucionTipo[tipo] = (distribucionTipo[tipo] || 0) + 1
      }

      return NextResponse.json({
        success: true,
        data: {
          tropa,
          romaneos: romaneosTropa,
          estadisticas: {
            cantidadAnimales: romaneosTropa.length,
            pesoVivoTotal,
            pesoFaenaTotal,
            rindePromedio: pesoVivoTotal > 0 ? Math.round((pesoFaenaTotal / pesoVivoTotal) * 10000) / 100 : 0,
            rindeMinimo: rindes.length > 0 ? Math.min(...rindes) : 0,
            rindeMaximo: rindes.length > 0 ? Math.max(...rindes) : 0,
            pesoVivoPromedio: romaneosTropa.length > 0 ? Math.round(pesoVivoTotal / romaneosTropa.length) : 0,
            pesoFaenaPromedio: romaneosTropa.length > 0 ? Math.round(pesoFaenaTotal / romaneosTropa.length) : 0,
            distribucionTipo
          }
        }
      })
    }

    // Estadísticas generales
    const totalAnimales = resultado.reduce((sum, t) => sum + t.cantidadAnimales, 0)
    const totalPesoVivo = resultado.reduce((sum, t) => sum + t.pesoVivoTotal, 0)
    const totalPesoFaena = resultado.reduce((sum, t) => sum + t.pesoFaenaTotal, 0)
    const rindeGeneral = totalPesoVivo > 0 ? (totalPesoFaena / totalPesoVivo) * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        rindesPorTropa: resultado,
        estadisticasGenerales: {
          totalTropas: resultado.length,
          totalAnimales,
          totalPesoVivo,
          totalPesoFaena,
          rindeGeneral: Math.round(rindeGeneral * 100) / 100
        }
      }
    })
  } catch (error) {
    console.error('Error fetching rindes:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener rindes' }, { status: 500 })
  }
}
