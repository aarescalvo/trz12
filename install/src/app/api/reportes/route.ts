import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener datos de reportes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const tipo = searchParams.get('tipo') || 'todos'

    // Construir filtros de fecha
    const dateFilter: Record<string, Date> = {}
    if (fechaDesde) {
      dateFilter.gte = new Date(fechaDesde)
    }
    if (fechaHasta) {
      const hasta = new Date(fechaHasta)
      hasta.setHours(23, 59, 59, 999)
      dateFilter.lte = hasta
    }

    // Reporte de Faena Diaria
    const romaneos = await db.romaneo.findMany({
      where: {
        ...(Object.keys(dateFilter).length > 0 && { fecha: dateFilter }),
        ...(tipo !== 'todos' && { 
          tropa: {
            especie: tipo.toUpperCase()
          }
        })
      },
      include: {
        tipificador: true
      },
      orderBy: { fecha: 'desc' },
      take: 100
    })

    // Agrupar por fecha
    const faenaDiaria = romaneos.reduce((acc, romaneo) => {
      const fecha = new Date(romaneo.fecha).toISOString().split('T')[0]
      const existente = acc.find(d => d.fecha === fecha)
      
      if (existente) {
        existente.totalAnimales++
        existente.totalMedias += (romaneo.pesoMediaIzq ? 1 : 0) + (romaneo.pesoMediaDer ? 1 : 0)
        existente.pesoTotal += (romaneo.pesoTotal || 0)
      } else {
        acc.push({
          fecha,
          totalAnimales: 1,
          totalMedias: (romaneo.pesoMediaIzq ? 1 : 0) + (romaneo.pesoMediaDer ? 1 : 0),
          pesoTotal: romaneo.pesoTotal || 0
        })
      }
      
      return acc
    }, [] as { fecha: string; totalAnimales: number; totalMedias: number; pesoTotal: number }[])

    // Reporte de Rendimiento por Tropa
    const tropasConRomaneo = await db.tropa.findMany({
      where: {
        ...(tipo !== 'todos' && { especie: tipo.toUpperCase() }),
        pesoNeto: { not: null },
        pesoTotalIndividual: { not: null }
      },
      include: {
        productor: true,
        animales: {
          where: { pesoVivo: { not: null } },
          select: { pesoVivo: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    const rendimientos = tropasConRomaneo.map(tropa => {
      const pesoVivoTotal = tropa.pesoNeto || tropa.pesoTotalIndividual || 0
      const pesoMediaTotal = tropa.animales?.reduce((acc, a) => acc + (a.pesoVivo || 0), 0) || pesoVivoTotal * 0.2
      const rinde = pesoMediaTotal > 0 && pesoVivoTotal > 0 ? (pesoMediaTotal / pesoVivoTotal) * 100 : 0

      return {
        tropaCodigo: tropa.codigo,
        productor: tropa.productor,
        cantidad: tropa.cantidadCabezas,
        pesoVivoTotal,
        pesoMediaTotal,
        rinde
      }
    })

    // Reporte de Stock por Cámara
    const camaras = await db.camara.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    })

    const stockCamaras = await Promise.all(camaras.map(async camara => {
      const mediasCount = await db.mediaRes.count({
        where: { 
          camaraId: camara.id,
          estado: 'EN_CAMARA'
        }
      })
      
      const medias = await db.mediaRes.findMany({
        where: { 
          camaraId: camara.id,
          estado: 'EN_CAMARA'
        },
        select: { peso: true }
      })

      const pesoTotal = medias.reduce((acc, m) => acc + (m.peso || 0), 0)

      return {
        camara: camara.nombre,
        tipo: camara.tipo,
        totalMedias: mediasCount,
        pesoTotal
      }
    } ))

    return NextResponse.json({
      success: true,
      data: {
        faenaDiaria,
        rendimientos,
        stockCamaras
      }
    })
  } catch (error) {
    console.error('Error fetching reportes:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener reportes' },
      { status: 500 }
    )
  }
}
