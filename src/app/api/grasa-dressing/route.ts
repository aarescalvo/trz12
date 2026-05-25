import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar grasa dressing
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const enStock = searchParams.get('enStock')
    const fechaFaena = searchParams.get('fechaFaena')

    const where: Record<string, unknown> = {}
    
    if (enStock === 'true') {
      where.enStock = true
    }
    if (fechaFaena) {
      where.fechaFaena = new Date(fechaFaena)
    }

    const grasas = await db.grasaDressing.findMany({
      where,
      orderBy: { fechaFaena: 'desc' }
    })

    // Calcular estadísticas
    const stats = await db.grasaDressing.aggregate({
      _count: { id: true },
      _sum: { pesoTotal: true }
    })

    const statsEnStock = await db.grasaDressing.aggregate({
      where: { enStock: true },
      _count: { id: true },
      _sum: { pesoTotal: true }
    })

    return NextResponse.json({
      success: true,
      data: grasas,
      stats: {
        total: stats._count.id || 0,
        pesoTotal: stats._sum.pesoTotal || 0,
        enStock: statsEnStock._count.id || 0,
        pesoEnStock: statsEnStock._sum.pesoTotal || 0
      }
    })
  } catch (error) {
    console.error('Error fetching grasa dressing:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener grasa dressing' },
      { status: 500 }
    )
  }
}

// POST - Crear grasa dressing
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError

  try {
    const data = await request.json()
    
    const grasa = await db.grasaDressing.create({
      data: {
        fechaFaena: data.fechaFaena ? new Date(data.fechaFaena) : new Date(),
        tropaCodigo: data.tropaCodigo || null,
        pesoTotal: parseFloat(data.pesoTotal) || 0,
        observaciones: data.observaciones || null,
        destino: data.destino || null,
        operadorId: data.operadorId || null
      }
    })

    return NextResponse.json({
      success: true,
      data: grasa
    })
  } catch (error) {
    console.error('Error creating grasa dressing:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear grasa dressing' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar grasa dressing
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, ...bodyData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    // Whitelist only valid GrasaDressing fields
    const data = {
      tropaCodigo: bodyData.tropaCodigo,
      garron: bodyData.garron !== undefined ? parseInt(bodyData.garron) : undefined,
      tipo: bodyData.tipo,
      pesoTotal: bodyData.pesoTotal ? parseFloat(bodyData.pesoTotal) : undefined,
      enStock: bodyData.enStock,
      fechaFaena: bodyData.fechaFaena ? new Date(bodyData.fechaFaena) : undefined,
      destino: bodyData.destino,
      operadorId: bodyData.operadorId,
      observaciones: bodyData.observaciones,
    }

    const grasa = await db.grasaDressing.update({
      where: { id },
      data
    })

    return NextResponse.json({
      success: true,
      data: grasa
    })
  } catch (error) {
    console.error('Error updating grasa dressing:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar grasa dressing' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar grasa dressing
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    await db.grasaDressing.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Grasa dressing eliminada'
    })
  } catch (error) {
    console.error('Error deleting grasa dressing:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar grasa dressing' },
      { status: 500 }
    )
  }
}
