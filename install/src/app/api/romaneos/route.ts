import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar todos los romaneos con filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const tropaCodigo = searchParams.get('tropaCodigo')
    const garron = searchParams.get('garron')

    const where: Record<string, unknown> = {}

    // Filtro por fecha
    if (fechaDesde || fechaHasta) {
      where.fecha = {}
      if (fechaDesde) {
        where.fecha = { ...where.fecha, gte: new Date(fechaDesde) }
      }
      if (fechaHasta) {
        const hasta = new Date(fechaHasta)
        hasta.setHours(23, 59, 59, 999)
        where.fecha = { ...where.fecha, lte: hasta }
      }
    }

    // Filtro por tropa
    if (tropaCodigo) {
      where.tropaCodigo = { contains: tropaCodigo }
    }

    // Filtro por garrón
    if (garron) {
      where.garron = parseInt(garron)
    }

    const romaneos = await db.romaneo.findMany({
      where,
      include: {
        tipificador: true
      },
      orderBy: [
        { fecha: 'desc' },
        { garron: 'asc' }
      ],
      take: 500
    })

    return NextResponse.json({
      success: true,
      data: romaneos
    })

  } catch (error) {
    console.error('[Romaneos API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener romaneos' },
      { status: 500 }
    )
  }
}
