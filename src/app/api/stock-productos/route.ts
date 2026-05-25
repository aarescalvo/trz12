import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar stock de productos
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const tipo = searchParams.get('tipo')
    const camaraId = searchParams.get('camaraId')
    const busqueda = searchParams.get('busqueda')

    const where: Record<string, unknown> = {}
    
    if (estado) where.estado = estado
    if (tipo) where.tipo = tipo
    if (camaraId) where.camaraId = camaraId
    if (busqueda) {
      where.OR = [
        { productoNombre: { contains: busqueda } },
        { lote: { contains: busqueda } },
        { tropaCodigo: { contains: busqueda } }
      ]
    }

    const stock = await db.stockProducto.findMany({
      where,
      include: {
        camara: { select: { nombre: true, tipo: true } }
      },
      orderBy: { fechaIngreso: 'desc' }
    })

    // Estadísticas
    const totalKg = stock.reduce((acc: number, s: any) => acc + (s.pesoKg || s.pesoTotal || 0), 0)
    const totalPiezas = stock.reduce((acc, s) => acc + s.cantidad, 0)

    return NextResponse.json({
      success: true,
      data: stock,
      stats: {
        totalProductos: stock.length,
        totalKg,
        totalPiezas
      }
    })
  } catch (error) {
    console.error('Error fetching stock productos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener stock' },
      { status: 500 }
    )
  }
}

// POST - Crear/actualizar stock de producto
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const data = await request.json()
    
    // Buscar si ya existe stock del mismo producto en la misma cámara
    const existente = await db.stockProducto.findFirst({
      where: {
        productoNombre: data.productoNombre,
        camaraId: data.camaraId || null,
        lote: data.lote || null
      }
    })

    if (existente) {
      // Actualizar stock existente
      const actualizado = await db.stockProducto.update({
        where: { id: existente.id },
        data: {
          cantidad: { increment: parseInt(data.cantidad) || 0 },
        }
      })
      return NextResponse.json({ success: true, data: actualizado })
    }

    // Crear nuevo stock
    const stock = await db.stockProducto.create({
      data: {
        productoId: data.productoId || null,
        productoNombre: data.productoNombre,
        tipo: data.tipo || 'OTRO',
        cantidad: parseInt(data.cantidad) || 0,
        camaraId: data.camaraId || null,
        tropaCodigo: data.tropaCodigo || null,
        lote: data.lote || null,
        estado: data.estado || 'DISPONIBLE'
      }
    })

    return NextResponse.json({
      success: true,
      data: stock
    })
  } catch (error) {
    console.error('Error creating stock producto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear stock' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar stock
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const data = await request.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    const stock = await db.stockProducto.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: stock
    })
  } catch (error) {
    console.error('Error updating stock producto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar stock' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar stock
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
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

    await db.stockProducto.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Stock eliminado'
    })
  } catch (error) {
    console.error('Error deleting stock producto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar stock' },
      { status: 500 }
    )
  }
}
