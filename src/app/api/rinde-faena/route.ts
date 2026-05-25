import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar rindes de faena
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const tropaId = searchParams.get('tropaId')
    const tropaCodigo = searchParams.get('tropaCodigo')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const resumen = searchParams.get('resumen')

    const where: any = {}

    if (tropaId) {
      where.tropaId = tropaId
    }

    if (tropaCodigo) {
      where.tropaCodigo = tropaCodigo
    }

    if (fechaDesde || fechaHasta) {
      where.fechaFaena = {}
      if (fechaDesde) {
        where.fechaFaena.gte = new Date(fechaDesde)
      }
      if (fechaHasta) {
        where.fechaFaena.lte = new Date(fechaHasta)
      }
    }

    if (resumen === 'true') {
      const aggregate = await db.rindeFaena.aggregate({
        where,
        _count: true,
        _sum: {
          pesoVivo: true,
          pesoTotalMedia: true
        },
        _avg: {
          rindePorcentaje: true
        }
      })

      return NextResponse.json({
        totalAnimales: aggregate._count,
        totalPesoVivo: aggregate._sum.pesoVivo || 0,
        totalPesoMedia: aggregate._sum.pesoTotalMedia || 0,
        rindePromedio: aggregate._avg.rindePorcentaje || 0
      })
    }

    const rindes = await db.rindeFaena.findMany({
      where,
      orderBy: { fechaFaena: 'desc' },
      take: 200
    })

    return NextResponse.json(rindes)
  } catch (error) {
    console.error('Error al obtener rindes:', error)
    return NextResponse.json(
      { error: 'Error al obtener rindes de faena' },
      { status: 500 }
    )
  }
}

// POST - Crear/actualizar rinde de faena
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError

  try {
    const data = await request.json()

    const pesoTotalMedia = (data.pesoMediaA || 0) + (data.pesoMediaB || 0)
    const rinde = data.pesoVivo > 0 ? pesoTotalMedia / data.pesoVivo : 0
    const rindePorcentaje = rinde * 100

    const existente = data.numeroGarron ? await db.rindeFaena.findFirst({
      where: {
        tropaCodigo: data.tropaCodigo,
        numeroGarron: data.numeroGarron
      }
    }) : null

    if (existente) {
      const actualizado = await db.rindeFaena.update({
        where: { id: existente.id },
        data: {
          pesoVivo: parseFloat(data.pesoVivo),
          pesoMediaA: data.pesoMediaA ? parseFloat(data.pesoMediaA) : null,
          pesoMediaB: data.pesoMediaB ? parseFloat(data.pesoMediaB) : null,
          pesoTotalMedia,
          rinde,
          rindePorcentaje,
          caravana: data.caravana,
          raza: data.raza,
          tipoAnimal: data.tipoAnimal,
          matarife: data.matarife,
          numeroDTE: data.numeroDTE,
          operadorId: data.operadorId,
          observaciones: data.observaciones
        }
      })
      return NextResponse.json(actualizado)
    }

    const rindeFaena = await db.rindeFaena.create({
      data: {
        tropaId: data.tropaId,
        tropaCodigo: data.tropaCodigo,
        numeroGarron: data.numeroGarron,
        numeroAnimal: data.numeroAnimal,
        caravana: data.caravana,
        raza: data.raza,
        tipoAnimal: data.tipoAnimal,
        pesoVivo: parseFloat(data.pesoVivo),
        pesoMediaA: data.pesoMediaA ? parseFloat(data.pesoMediaA) : null,
        pesoMediaB: data.pesoMediaB ? parseFloat(data.pesoMediaB) : null,
        pesoTotalMedia,
        rinde,
        rindePorcentaje,
        fechaFaena: data.fechaFaena ? new Date(data.fechaFaena) : new Date(),
        matarife: data.matarife,
        numeroDTE: data.numeroDTE,
        operadorId: data.operadorId,
        observaciones: data.observaciones
      }
    })

    return NextResponse.json(rindeFaena, { status: 201 })
  } catch (error) {
    console.error('Error al crear rinde:', error)
    return NextResponse.json(
      { error: 'Error al crear rinde de faena' },
      { status: 500 }
    )
  }
}

// PUT - Bulk insert
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError

  try {
    const data = await request.json()

    if (!Array.isArray(data.rindes)) {
      return NextResponse.json(
        { error: 'Se espera un array de rindes' },
        { status: 400 }
      )
    }

    const resultados: any[] = []

    for (const r of data.rindes) {
      const pesoTotalMedia = (r.pesoMediaA || 0) + (r.pesoMediaB || 0)
      const rinde = r.pesoVivo > 0 ? pesoTotalMedia / r.pesoVivo : 0

      const registro = await db.rindeFaena.create({
        data: {
          tropaId: r.tropaId,
          tropaCodigo: r.tropaCodigo,
          numeroGarron: r.numeroGarron,
          numeroAnimal: r.numeroAnimal,
          caravana: r.caravana,
          raza: r.raza,
          tipoAnimal: r.tipoAnimal,
          pesoVivo: parseFloat(r.pesoVivo),
          pesoMediaA: r.pesoMediaA ? parseFloat(r.pesoMediaA) : null,
          pesoMediaB: r.pesoMediaB ? parseFloat(r.pesoMediaB) : null,
          pesoTotalMedia,
          rinde,
          rindePorcentaje: rinde * 100,
          fechaFaena: r.fechaFaena ? new Date(r.fechaFaena) : new Date(),
          matarife: r.matarife,
          numeroDTE: r.numeroDTE,
          operadorId: r.operadorId
        }
      })
      resultados.push(registro)
    }

    return NextResponse.json({ creados: resultados.length, rindes: resultados })
  } catch (error) {
    console.error('Error en bulk insert:', error)
    return NextResponse.json(
      { error: 'Error al crear rindes' },
      { status: 500 }
    )
  }
}
