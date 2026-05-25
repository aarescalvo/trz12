import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Especie } from '@prisma/client'
import { validarPermiso } from '@/lib/auth-helpers'

function getOperadorId(request: NextRequest): string | null {
  return request.headers.get('x-operador-id')
}

// GET - Listar productos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const especie = searchParams.get('especie')
    const activo = searchParams.get('activo')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}
    if (especie) where.especie = especie as Especie
    if (activo !== null) where.activo = activo === 'true'

    const [productos, total] = await Promise.all([
      db.producto.findMany({
        where,
        orderBy: [{ especie: 'asc' }, { codigo: 'asc' }],
        take: limit,
        skip: offset
      }),
      db.producto.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: productos,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + productos.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching productos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo producto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const operadorId = body.operadorId || getOperadorId(request)
    const puedeCrear = await validarPermiso(operadorId, 'puedeStock')
    if (!puedeCrear) {
      return NextResponse.json({ success: false, error: 'Sin permisos de stock' }, { status: 403 })
    }
    const {
      codigo,
      nombre,
      nombreReportes,
      especie,
      codigoTipificacion,
      codigoTipoTrabajo,
      codigoTransporte,
      codigoDestino,
      tara,
      diasConservacion,
      requiereTipificacion,
      tipoRotulo,
      precio,
      temperaturaConservacion,
      apareceRendimiento,
      apareceStock
    } = body

    if (!codigo || !nombre || !especie) {
      return NextResponse.json(
        { success: false, error: 'Código, nombre y especie son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si ya existe el código para esa especie
    const existente = await db.producto.findFirst({
      where: { codigo, especie }
    })

    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un producto con ese código para esta especie' },
        { status: 400 }
      )
    }

    const producto = await db.producto.create({
      data: {
        codigo,
        nombre,
        nombreReportes,
        especie,
        codigoTipificacion,
        codigoTipoTrabajo,
        codigoTransporte,
        codigoDestino,
        tara: tara ? parseFloat(tara) : null,
        diasConservacion: diasConservacion ? parseInt(diasConservacion) : null,
        requiereTipificacion: requiereTipificacion || false,
        tipoRotulo,
        precio: precio ? parseFloat(precio) : null,
        temperaturaConservacion,
        apareceRendimiento: apareceRendimiento || false,
        apareceStock: apareceStock || false,
        activo: true
      }
    })

    return NextResponse.json({
      success: true,
      data: producto,
      message: 'Producto creado correctamente'
    })
  } catch (error) {
    console.error('Error creating producto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear producto' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar producto
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, operadorId: bodyOpId, ...updateData } = body
    const operadorId = bodyOpId || getOperadorId(request)
    const puedeEditar = await validarPermiso(operadorId, 'puedeStock')
    if (!puedeEditar) {
      return NextResponse.json({ success: false, error: 'Sin permisos de stock' }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const data: Record<string, unknown> = {}
    if (updateData.nombre) data.nombre = updateData.nombre
    if (updateData.nombreReportes !== undefined) data.nombreReportes = updateData.nombreReportes
    if (updateData.codigoTipificacion !== undefined) data.codigoTipificacion = updateData.codigoTipificacion
    if (updateData.codigoTipoTrabajo !== undefined) data.codigoTipoTrabajo = updateData.codigoTipoTrabajo
    if (updateData.codigoTransporte !== undefined) data.codigoTransporte = updateData.codigoTransporte
    if (updateData.codigoDestino !== undefined) data.codigoDestino = updateData.codigoDestino
    if (updateData.tara !== undefined) data.tara = updateData.tara ? parseFloat(updateData.tara) : null
    if (updateData.diasConservacion !== undefined) data.diasConservacion = updateData.diasConservacion ? parseInt(updateData.diasConservacion) : null
    if (updateData.requiereTipificacion !== undefined) data.requiereTipificacion = updateData.requiereTipificacion
    if (updateData.tipoRotulo !== undefined) data.tipoRotulo = updateData.tipoRotulo
    if (updateData.precio !== undefined) data.precio = updateData.precio ? parseFloat(updateData.precio) : null
    if (updateData.temperaturaConservacion !== undefined) data.temperaturaConservacion = updateData.temperaturaConservacion
    if (updateData.apareceRendimiento !== undefined) data.apareceRendimiento = updateData.apareceRendimiento
    if (updateData.apareceStock !== undefined) data.apareceStock = updateData.apareceStock
    if (updateData.activo !== undefined) data.activo = updateData.activo

    const producto = await db.producto.update({
      where: { id },
      data
    })

    return NextResponse.json({
      success: true,
      data: producto,
      message: 'Producto actualizado correctamente'
    })
  } catch (error) {
    console.error('Error updating producto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar producto' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar producto
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const operadorId = request.headers.get('x-operador-id')
    const puedeEliminar = await validarPermiso(operadorId, 'puedeConfiguracion')
    if (!puedeEliminar) {
      return NextResponse.json({ success: false, error: 'Solo un administrador puede eliminar productos' }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    // Soft delete
    const producto = await db.producto.update({
      where: { id },
      data: { activo: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Producto desactivado correctamente'
    })
  } catch (error) {
    console.error('Error deleting producto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar producto' },
      { status: 500 }
    )
  }
}
