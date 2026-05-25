import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Especie } from '@prisma/client'
import { checkPermission } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const especie = searchParams.get('especie')

    const dateFilter: Record<string, unknown> = {}
    if (fechaDesde) dateFilter.gte = new Date(fechaDesde)
    if (fechaHasta) {
      const hasta = new Date(fechaHasta)
      hasta.setHours(23, 59, 59, 999)
      dateFilter.lte = hasta
    }

    // Build where for romaneos - Romaneo does NOT have a tropa relation,
    // only tropaCodigo (string). So we filter by especie via Tropa if needed.
    const romaneoWhere: Record<string, unknown> = {}
    if (Object.keys(dateFilter).length > 0) {
      romaneoWhere.fecha = dateFilter
    }

    // If especie filter, find tropa codes for that especie first
    let tropaCodigosEspecie: string[] | null = null
    if (especie && especie !== 'todas') {
      const tropasEspecie = await db.tropa.findMany({
        where: { especie: especie.toUpperCase() as Especie },
        select: { codigo: true },
      })
      tropaCodigosEspecie = tropasEspecie.map(t => t.codigo)
      romaneoWhere.tropaCodigo = { in: tropaCodigosEspecie }
    }

    const romaneos = await db.romaneo.findMany({
      where: romaneoWhere,
      include: {
        tipificador: true,
      },
      orderBy: { fecha: 'desc' },
    })

    // Fetch all relevant tropas to get productor names
    const tropaCodigos = [...new Set(romaneos.map(r => r.tropaCodigo).filter(Boolean))] as string[]
    const tropas = await db.tropa.findMany({
      where: { codigo: { in: tropaCodigos } },
      include: { productor: true },
    })
    const tropaMap = new Map(tropas.map(t => [t.codigo, t]))

    const rindesPorTropa = romaneos.reduce((acc, r) => {
      const codigo = r.tropaCodigo || 'SIN_TROPA'
      const existente = acc.find(a => a.tropaCodigo === codigo)
      if (existente) {
        existente.cantidad++
        existente.pesoVivoTotal += r.pesoVivo || 0
        existente.pesoCanalTotal += r.pesoTotal || 0
      } else {
        const tropa = tropaMap.get(codigo)
        acc.push({
          tropaCodigo: codigo,
          productor: tropa?.productor?.nombre || '-',
          especie: tropa?.especie || especie || '-',
          cantidad: 1,
          pesoVivoTotal: r.pesoVivo || 0,
          pesoCanalTotal: r.pesoTotal || 0,
          rinde: 0,
        })
      }
      return acc
    }, [] as { tropaCodigo: string; productor: string; especie: string; cantidad: number; pesoVivoTotal: number; pesoCanalTotal: number; rinde: number }[])

    rindesPorTropa.forEach(t => {
      t.rinde = t.pesoVivoTotal > 0 ? Number(((t.pesoCanalTotal / t.pesoVivoTotal) * 100).toFixed(2)) : 0
    })

    rindesPorTropa.sort((a, b) => b.rinde - a.rinde)

    return NextResponse.json({ success: true, data: rindesPorTropa })
  } catch (error) {
    console.error('Error en reporte rinde tropa:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
