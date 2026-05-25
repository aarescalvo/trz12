import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Fetch detalles de inventario
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const inventarioId = searchParams.get('inventarioId')
    const insumoId = searchParams.get('insumoId')
    
    const where: any = {}
    
    if (inventarioId) {
      where.inventarioId = inventarioId
    }
    
    if (insumoId) {
      where.insumoId = insumoId
    }
    
    const detalles = await db.detalleInventario.findMany({
      where,
      include: {
        inventario: {
          select: {
            id: true,
            numero: true,
            deposito: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        insumo: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            unidadMedida: true,
            precioUnitario: true
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
    console.error('Error fetching detalles de inventario:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener detalles de inventario' },
      { status: 500 }
    )
  }
}

// POST - Create new detalle de inventario
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json()
    const { 
      inventarioId, 
      insumoId,
      cantidadSistema,
      cantidadFisica,
      costoUnitario,
      observaciones
    } = body
    
    if (!inventarioId) {
      return NextResponse.json(
        { success: false, error: 'El inventario es requerido' },
        { status: 400 }
      )
    }
    
    if (!insumoId) {
      return NextResponse.json(
        { success: false, error: 'El insumo es requerido' },
        { status: 400 }
      )
    }
    
    // Verificar que no exista ya este insumo en el inventario
    const existente = await db.detalleInventario.findFirst({
      where: {
        inventarioId,
        insumoId
      }
    })
    
    if (existente) {
      return NextResponse.json(
        { success: false, error: 'El insumo ya existe en este inventario' },
        { status: 400 }
      )
    }
    
    // Calcular diferencia automáticamente
    const cantidadSistemaNum = Number(cantidadSistema) || 0
    const cantidadFisicaNum = Number(cantidadFisica) || 0
    const diferencia = cantidadFisicaNum - cantidadSistemaNum
    const costoUnitarioNum = costoUnitario ? Number(costoUnitario) : null
    const costoDiferencia = costoUnitarioNum ? diferencia * costoUnitarioNum : null
    
    const detalle = await db.detalleInventario.create({
      data: {
        inventarioId,
        insumoId,
        cantidadSistema: cantidadSistemaNum,
        cantidadFisica: cantidadFisicaNum,
        diferencia,
        costoUnitario: costoUnitarioNum,
        costoDiferencia,
        observaciones: observaciones || null
      },
      include: {
        inventario: {
          select: {
            id: true,
            numero: true
          }
        },
        insumo: {
          select: {
            id: true,
            codigo: true,
            nombre: true
          }
        }
      }
    })
    
    // Actualizar resumen del inventario
    await actualizarResumenInventario(inventarioId)
    
    return NextResponse.json({
      success: true,
      data: detalle
    })
  } catch (error) {
    console.error('Error creating detalle de inventario:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear detalle de inventario' },
      { status: 500 }
    )
  }
}

// PUT - Update detalle de inventario
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, cantidadSistema, cantidadFisica, costoUnitario, observaciones, estado } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }
    
    const detalleActual = await db.detalleInventario.findUnique({
      where: { id }
    })
    
    if (!detalleActual) {
      return NextResponse.json(
        { success: false, error: 'Detalle no encontrado' },
        { status: 404 }
      )
    }
    
    const updateData: any = {}
    
    if (cantidadSistema !== undefined) {
      updateData.cantidadSistema = Number(cantidadSistema)
    }
    
    if (cantidadFisica !== undefined) {
      updateData.cantidadFisica = Number(cantidadFisica)
    }
    
    if (costoUnitario !== undefined) {
      updateData.costoUnitario = Number(costoUnitario)
    }
    
    if (observaciones !== undefined) {
      updateData.observaciones = observaciones
    }
    
    if (estado !== undefined) {
      updateData.estado = estado
    }
    
    // Recalcular diferencia y costo de diferencia
    const cantidadSistemaNum = cantidadSistema !== undefined ? Number(cantidadSistema) : detalleActual.cantidadSistema
    const cantidadFisicaNum = cantidadFisica !== undefined ? Number(cantidadFisica) : detalleActual.cantidadFisica
    const costoUnitarioNum = costoUnitario !== undefined ? Number(costoUnitario) : detalleActual.costoUnitario
    
    updateData.diferencia = cantidadFisicaNum - cantidadSistemaNum
    updateData.costoDiferencia = costoUnitarioNum ? updateData.diferencia * costoUnitarioNum : null
    
    const detalle = await db.detalleInventario.update({
      where: { id },
      data: updateData,
      include: {
        inventario: {
          select: {
            id: true,
            numero: true
          }
        },
        insumo: {
          select: {
            id: true,
            codigo: true,
            nombre: true
          }
        }
      }
    })
    
    // Actualizar resumen del inventario
    await actualizarResumenInventario(detalleActual.inventarioId)
    
    return NextResponse.json({
      success: true,
      data: detalle
    })
  } catch (error) {
    console.error('Error updating detalle de inventario:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar detalle de inventario' },
      { status: 500 }
    )
  }
}

// DELETE - Delete detalle de inventario
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
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
    
    const detalle = await db.detalleInventario.findUnique({
      where: { id }
    })
    
    if (!detalle) {
      return NextResponse.json(
        { success: false, error: 'Detalle no encontrado' },
        { status: 404 }
      )
    }
    
    const inventarioId = detalle.inventarioId
    
    await db.detalleInventario.delete({
      where: { id }
    })
    
    // Actualizar resumen del inventario
    await actualizarResumenInventario(inventarioId)
    
    return NextResponse.json({
      success: true,
      message: 'Detalle eliminado correctamente'
    })
  } catch (error) {
    console.error('Error deleting detalle de inventario:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar detalle de inventario' },
      { status: 500 }
    )
  }
}

// Helper function to update inventario summary
async function actualizarResumenInventario(inventarioId: string) {
  const detalles = await db.detalleInventario.findMany({
    where: { inventarioId }
  })
  
  const itemsTotal = detalles.length
  const itemsConDiferencia = detalles.filter(d => d.diferencia !== 0).length
  const valorDiferencia = detalles.reduce((sum, d) => sum + (d.costoDiferencia || 0), 0)
  
  await db.inventario.update({
    where: { id: inventarioId },
    data: { 
      itemsTotal, 
      itemsConDiferencia, 
      valorDiferencia: valorDiferencia !== 0 ? valorDiferencia : null 
    }
  })
}
