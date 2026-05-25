import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch detalles de nota de crédito
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const notaCreditoId = searchParams.get('notaCreditoId')
    
    const where: any = {}
    
    if (notaCreditoId) {
      where.notaCreditoId = notaCreditoId
    }
    
    const detalles = await db.detalleNotaCredito.findMany({
      where,
      include: {
        notaCredito: {
          select: {
            id: true,
            numero: true,
            cliente: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
    
    return NextResponse.json({
      success: true,
      data: detalles
    })
  } catch (error) {
    console.error('Error fetching detalles de nota de crédito:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener detalles de nota de crédito' },
      { status: 500 }
    )
  }
}

// POST - Create new detalle de nota de crédito
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const body = await request.json()
    const { 
      notaCreditoId, 
      descripcion,
      cantidad,
      precioUnitario
    } = body
    
    if (!notaCreditoId) {
      return NextResponse.json(
        { success: false, error: 'La nota de crédito es requerida' },
        { status: 400 }
      )
    }
    
    if (!descripcion) {
      return NextResponse.json(
        { success: false, error: 'La descripción es requerida' },
        { status: 400 }
      )
    }
    
    const cantidadNum = Number(cantidad) || 1
    const precioNum = Number(precioUnitario) || 0
    const subtotal = cantidadNum * precioNum
    
    const detalle = await db.detalleNotaCredito.create({
      data: {
        notaCreditoId,
        descripcion,
        cantidad: cantidadNum,
        precioUnitario: precioNum,
        subtotal
      },
      include: {
        notaCredito: {
          select: {
            id: true,
            numero: true
          }
        }
      }
    })
    
    // Actualizar totales de la nota de crédito
    await actualizarTotalesNotaCredito(notaCreditoId)
    
    return NextResponse.json({
      success: true,
      data: detalle
    })
  } catch (error) {
    console.error('Error creating detalle de nota de crédito:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear detalle de nota de crédito' },
      { status: 500 }
    )
  }
}

// PUT - Update detalle de nota de crédito
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, descripcion, cantidad, precioUnitario } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }
    
    const updateData: any = {}
    
    if (descripcion !== undefined) {
      updateData.descripcion = descripcion
    }
    
    if (cantidad !== undefined) {
      updateData.cantidad = Number(cantidad)
    }
    
    if (precioUnitario !== undefined) {
      updateData.precioUnitario = Number(precioUnitario)
    }
    
    // Recalcular subtotal si hay cambios en cantidad o precio
    if (cantidad !== undefined || precioUnitario !== undefined) {
      const detalle = await db.detalleNotaCredito.findUnique({
        where: { id }
      })
      if (detalle) {
        const cantidadNum = cantidad !== undefined ? Number(cantidad) : detalle.cantidad
        const precioNum = precioUnitario !== undefined ? Number(precioUnitario) : detalle.precioUnitario
        updateData.subtotal = cantidadNum * precioNum
      }
    }
    
    const detalle = await db.detalleNotaCredito.update({
      where: { id },
      data: updateData
    })
    
    // Actualizar totales de la nota de crédito
    await actualizarTotalesNotaCredito(detalle.notaCreditoId)
    
    return NextResponse.json({
      success: true,
      data: detalle
    })
  } catch (error) {
    console.error('Error updating detalle de nota de crédito:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar detalle de nota de crédito' },
      { status: 500 }
    )
  }
}

// DELETE - Delete detalle de nota de crédito
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
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
    
    const detalle = await db.detalleNotaCredito.findUnique({
      where: { id }
    })
    
    if (!detalle) {
      return NextResponse.json(
        { success: false, error: 'Detalle no encontrado' },
        { status: 404 }
      )
    }
    
    const notaCreditoId = detalle.notaCreditoId
    
    await db.detalleNotaCredito.delete({
      where: { id }
    })
    
    // Actualizar totales de la nota de crédito
    await actualizarTotalesNotaCredito(notaCreditoId)
    
    return NextResponse.json({
      success: true,
      message: 'Detalle eliminado correctamente'
    })
  } catch (error) {
    console.error('Error deleting detalle de nota de crédito:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar detalle de nota de crédito' },
      { status: 500 }
    )
  }
}

// Helper function to update nota de crédito totals
async function actualizarTotalesNotaCredito(notaCreditoId: string) {
  const detalles = await db.detalleNotaCredito.findMany({
    where: { notaCreditoId }
  })
  
  const subtotal = detalles.reduce((sum, d) => sum + d.subtotal, 0)
  const iva = subtotal * 0.21
  const total = subtotal + iva
  
  await db.notaCredito.update({
    where: { id: notaCreditoId },
    data: { subtotal, iva, total }
  })
}
