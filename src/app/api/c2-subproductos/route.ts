import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar subproductos pesaje C2
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeDesposte')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const tropaCodigo = searchParams.get('tropaCodigo')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (tipo) where.tipo = tipo
    if (tropaCodigo) where.tropaCodigo = tropaCodigo

    const [registros, total] = await Promise.all([
      db.c2SubproductoPesaje.findMany({
        where,
        include: {
          operador: { select: { id: true, nombre: true } }
        },
        orderBy: { fecha: 'desc' },
        take: limit,
        skip: offset
      }),
      db.c2SubproductoPesaje.count({ where })
    ])

    // Calcular resumen por tipo
    const resumen = await db.c2SubproductoPesaje.groupBy({
      by: ['tipo'],
      _sum: { pesoKg: true },
      _count: { id: true }
    })

    return NextResponse.json({
      success: true,
      data: registros,
      resumen: resumen.map(r => ({
        tipo: r.tipo,
        pesoTotal: r._sum.pesoKg || 0,
        cantidad: r._count.id
      })),
      pagination: { total, limit, offset, hasMore: offset + registros.length < total }
    })
  } catch (error) {
    console.error('Error fetching subproductos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener subproductos' },
      { status: 500 }
    )
  }
}

// POST - Crear registro de pesaje de subproducto
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeDesposte')
  if (authError) return authError
  try {
    const body = await request.json()
    const { tipo, pesoKg, tropaCodigo, destino, operadorId, observaciones } = body

    if (!tipo) {
      return NextResponse.json(
        { success: false, error: 'Tipo de subproducto es requerido' },
        { status: 400 }
      )
    }

    if (!pesoKg || pesoKg <= 0) {
      return NextResponse.json(
        { success: false, error: 'Peso debe ser mayor a 0' },
        { status: 400 }
      )
    }

    const registro = await db.c2SubproductoPesaje.create({
      data: {
        tipo,
        pesoKg: parseFloat(pesoKg),
        tropaCodigo: tropaCodigo || null,
        destino: destino || null,
        operadorId: operadorId || null,
        observaciones: observaciones || null
      },
      include: {
        operador: { select: { id: true, nombre: true } }
      }
    })

    return NextResponse.json({
      success: true,
      data: registro,
      message: `${tipo} registrado: ${pesoKg} kg`
    })
  } catch (error) {
    console.error('Error creating subproducto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al registrar subproducto' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar registro de subproducto
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeDesposte')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    await db.c2SubproductoPesaje.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Registro eliminado correctamente'
    })
  } catch (error) {
    console.error('Error deleting subproducto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar registro' },
      { status: 500 }
    )
  }
}
