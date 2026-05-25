import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar registros de empaque
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeEmpaque')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const producto = searchParams.get('producto')
    const camaraId = searchParams.get('camaraId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (estado) where.estado = estado
    if (producto) where.producto = { contains: producto }
    if (camaraId) where.camaraId = camaraId

    const [registros, total] = await Promise.all([
      db.registroEmpaque.findMany({
        where,
        include: {
          camara: { select: { id: true, nombre: true } },
          operador: { select: { id: true, nombre: true } },
          lote: { select: { id: true, numero: true } }
        },
        orderBy: { fecha: 'desc' },
        take: limit,
        skip: offset
      }),
      db.registroEmpaque.count({ where })
    ])

    // Calcular estadísticas
    const stats = await db.registroEmpaque.aggregate({
      _count: { id: true },
      _sum: { pesoKg: true, cantidad: true }
    })

    const porEstado = await db.registroEmpaque.groupBy({
      by: ['estado'],
      _count: { id: true }
    })

    return NextResponse.json({
      success: true,
      data: registros,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + registros.length < total
      },
      stats: {
        total: stats._count.id,
        pesoTotal: stats._sum.pesoKg || 0,
        cantidadTotal: stats._sum.cantidad || 0,
        porEstado
      }
    })
  } catch (error) {
    console.error('Error fetching empaques:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener registros de empaque' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo registro de empaque
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeEmpaque')
  if (authError) return authError
  try {
    const body = await request.json()
    const {
      producto,
      productoId,
      pesoKg,
      cantidad,
      destino,
      camaraId,
      loteId,
      operadorId,
      observaciones
    } = body

    if (!producto || !pesoKg || !cantidad) {
      return NextResponse.json(
        { success: false, error: 'Producto, peso y cantidad son requeridos' },
        { status: 400 }
      )
    }

    // Generar ID de paquete
    const year = new Date().getFullYear()
    const ultimo = await db.registroEmpaque.findFirst({
      where: { paqueteId: { startsWith: `EMP-${year}` } },
      orderBy: { paqueteId: 'desc' },
      select: { paqueteId: true }
    })

    const nextNum = ultimo ? (parseInt(ultimo.paqueteId.split('-')[2]) + 1) : 1
    const paqueteId = `EMP-${year}-${String(nextNum).padStart(4, '0')}`

    const registro = await db.registroEmpaque.create({
      data: {
        paqueteId,
        producto,
        productoId,
        pesoKg: parseFloat(pesoKg),
        cantidad: parseInt(cantidad),
        destino,
        camaraId,
        loteId,
        operadorId,
        observaciones,
        estado: 'PENDIENTE'
      },
      include: {
        camara: { select: { id: true, nombre: true } },
        operador: { select: { id: true, nombre: true } },
        lote: { select: { id: true, numero: true } }
      }
    })

    return NextResponse.json({
      success: true,
      data: registro,
      message: 'Registro de empaque creado correctamente'
    })
  } catch (error) {
    console.error('Error creating empaque:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear registro de empaque' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar registro de empaque
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeEmpaque')
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, accion, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    let data: any = {}

    // Acciones especiales
    if (accion === 'empacar') {
      data.estado = 'EMPACADO'
    } else if (accion === 'despachar') {
      data.estado = 'DESPACHADO'
      data.fechaDespacho = new Date()
    } else if (accion === 'anular') {
      data.estado = 'ANULADO'
    } else {
      // Actualización normal
      if (updateData.producto) data.producto = updateData.producto
      if (updateData.pesoKg) data.pesoKg = parseFloat(updateData.pesoKg)
      if (updateData.cantidad) data.cantidad = parseInt(updateData.cantidad)
      if (updateData.destino) data.destino = updateData.destino
      if (updateData.camaraId) data.camaraId = updateData.camaraId
      if (updateData.observaciones !== undefined) data.observaciones = updateData.observaciones
      if (updateData.estado) data.estado = updateData.estado
    }

    const registro = await db.registroEmpaque.update({
      where: { id },
      data,
      include: {
        camara: { select: { id: true, nombre: true } },
        operador: { select: { id: true, nombre: true } },
        lote: { select: { id: true, numero: true } }
      }
    })

    return NextResponse.json({
      success: true,
      data: registro,
      message: 'Registro actualizado correctamente'
    })
  } catch (error) {
    console.error('Error updating empaque:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar registro' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar registro de empaque
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeEmpaque')
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

    await db.registroEmpaque.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Registro eliminado correctamente'
    })
  } catch (error) {
    console.error('Error deleting empaque:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar registro' },
      { status: 500 }
    )
  }
}
