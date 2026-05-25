import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar subproductos incomestibles
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const estado = searchParams.get('estado')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    const where: any = {}

    if (tipo) {
      where.tipo = tipo
    }

    if (estado) {
      where.estado = estado
    }

    if (fechaDesde || fechaHasta) {
      where.fecha = {}
      if (fechaDesde) {
        where.fecha.gte = new Date(fechaDesde)
      }
      if (fechaHasta) {
        where.fecha.lte = new Date(fechaHasta)
      }
    }

    const subproductos = await db.subproductoIncomestible.findMany({
      where,
      orderBy: { fecha: 'desc' },
      take: 100
    })

    const resumen = await db.subproductoIncomestible.aggregate({
      where: { estado: 'DISPONIBLE' },
      _sum: {
        kilos: true,
        montoTotal: true
      },
      _count: true
    })

    return NextResponse.json({
      subproductos,
      resumen: {
        totalKilos: resumen._sum.kilos || 0,
        totalMonto: resumen._sum.montoTotal || 0,
        cantidad: resumen._count
      }
    })
  } catch (error) {
    console.error('Error al obtener subproductos:', error)
    return NextResponse.json(
      { error: 'Error al obtener subproductos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo subproducto
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const data = await request.json()

    const subproducto = await db.subproductoIncomestible.create({
      data: {
        tipo: data.tipo,
        descripcion: data.descripcion,
        kilos: parseFloat(data.kilos),
        cantidad: data.cantidad ? parseInt(data.cantidad) : null,
        tropaCodigo: data.tropaCodigo,
        fechaFaena: data.fechaFaena ? new Date(data.fechaFaena) : null,
        destino: data.destino,
        clienteId: data.clienteId,
        precioKg: data.precioKg ? parseFloat(data.precioKg) : null,
        montoTotal: data.montoTotal ? parseFloat(data.montoTotal) : null,
        estado: data.estado || 'DISPONIBLE',
        operadorId: data.operadorId,
        observaciones: data.observaciones
      }
    })

    return NextResponse.json(subproducto, { status: 201 })
  } catch (error) {
    console.error('Error al crear subproducto:', error)
    return NextResponse.json(
      { error: 'Error al crear subproducto' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar subproducto (para venta/descarte)
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const data = await request.json()

    if (!data.id) {
      return NextResponse.json(
        { error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const subproducto = await db.subproductoIncomestible.update({
      where: { id: data.id },
      data: {
        destino: data.destino,
        clienteId: data.clienteId,
        precioKg: data.precioKg ? parseFloat(data.precioKg) : null,
        montoTotal: data.montoTotal ? parseFloat(data.montoTotal) : null,
        estado: data.estado,
        observaciones: data.observaciones
      }
    })

    return NextResponse.json(subproducto)
  } catch (error) {
    console.error('Error al actualizar subproducto:', error)
    return NextResponse.json(
      { error: 'Error al actualizar subproducto' },
      { status: 500 }
    )
  }
}
