import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    const dateFilter: Record<string, unknown> = {}
    if (fecha) {
      const d = new Date(fecha)
      d.setHours(0, 0, 0, 0)
      dateFilter.gte = d
      const dEnd = new Date(fecha)
      dEnd.setHours(23, 59, 59, 999)
      dateFilter.lte = dEnd
    } else {
      if (fechaDesde) dateFilter.gte = new Date(fechaDesde)
      if (fechaHasta) {
        const hasta = new Date(fechaHasta)
        hasta.setHours(23, 59, 59, 999)
        dateFilter.lte = hasta
      }
    }

    // Romaneos (no need to include mediasRes, we only use romaneo-level fields)
    const romaneos = await db.romaneo.findMany({
      where: { ...(Object.keys(dateFilter).length > 0 && { fecha: dateFilter }) },
      select: { tropaCodigo: true, pesoVivo: true, pesoTotal: true },
    })

    const totalAnimales = romaneos.length
    const totalPesoVivo = romaneos.reduce((s, r) => s + (r.pesoVivo || 0), 0)
    const totalPesoCanal = romaneos.reduce((s, r) => s + (r.pesoTotal || 0), 0)
    const rindePromedio = totalPesoVivo > 0 ? Number(((totalPesoCanal / totalPesoVivo) * 100).toFixed(2)) : 0

    // Medias reses por estado
    const mediasEnCamara = await db.mediaRes.count({ where: { estado: 'EN_CAMARA' } })
    const mediasEnCuarteo = await db.mediaRes.count({ where: { estado: 'EN_CUARTEO' } })
    const mediasDespachadas = await db.mediaRes.count({ where: { estado: 'DESPACHADO' } })

    // Menudencias
    const menudencias = await db.menudencia.aggregate({
      _count: { id: true },
      _sum: { pesoIngreso: true, pesoElaborado: true },
      where: { ...(Object.keys(dateFilter).length > 0 && { fechaIngreso: dateFilter }) },
    })

    // Cueros
    const cueros = await db.cuero.aggregate({
      _count: { id: true },
      _sum: { pesoKg: true },
      where: { ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }) },
    })

    // Rendering
    const rendering = await db.registroRendering.aggregate({
      _count: { id: true },
      _sum: { pesoKg: true },
      where: { ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }) },
    })

    // Tropas procesadas
    const tropasUnicas = [...new Set(romaneos.map(r => r.tropaCodigo).filter(Boolean))]

    return NextResponse.json({
      success: true,
      data: {
        totalAnimales,
        totalPesoVivo: Number(totalPesoVivo.toFixed(2)),
        totalPesoCanal: Number(totalPesoCanal.toFixed(2)),
        rindePromedio,
        medias: { enCamara: mediasEnCamara, enCuarteo: mediasEnCuarteo, despachadas: mediasDespachadas },
        menudencias: { cantidad: menudencias._count.id, pesoIngreso: menudencias._sum.pesoIngreso || 0, pesoElaborado: menudencias._sum.pesoElaborado || 0 },
        cueros: { cantidad: cueros._count.id, pesoKg: cueros._sum.pesoKg || 0 },
        rendering: { cantidad: rendering._count.id, pesoKg: rendering._sum.pesoKg || 0 },
        tropasProcesadas: tropasUnicas.length,
      },
    })
  } catch (error) {
    console.error('Error en balance faena:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
