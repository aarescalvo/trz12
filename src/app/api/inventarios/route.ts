import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { EstadoInventario } from '@prisma/client'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Fetch inventarios
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const depositoId = searchParams.get('depositoId')
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    
    const where: any = {}
    
    if (estado && estado !== 'TODOS') {
      where.estado = estado as EstadoInventario
    }
    
    if (depositoId) {
      where.depositoId = depositoId
    }
    
    if (desde || hasta) {
      where.fechaInicio = {}
      if (desde) {
        where.fechaInicio.gte = new Date(desde)
      }
      if (hasta) {
        where.fechaInicio.lte = new Date(hasta + 'T23:59:59')
      }
    }
    
    const inventarios = await db.inventario.findMany({
      where,
      include: {
        deposito: {
          select: {
            id: true,
            nombre: true,
            ubicacion: true
          }
        },
        detalles: {
          include: {
            insumo: {
              select: {
                id: true,
                codigo: true,
                nombre: true,
                unidadMedida: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({
      success: true,
      data: inventarios
    })
  } catch (error) {
    console.error('Error fetching inventarios:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener inventarios' },
      { status: 500 }
    )
  }
}

// POST - Create new inventario
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json()
    const { 
      depositoId, 
      fechaInicio,
      observaciones,
      operadorId,
      detalles
    } = body
    
    if (!depositoId) {
      return NextResponse.json(
        { success: false, error: 'El depósito es requerido' },
        { status: 400 }
      )
    }
    
    // Obtener el último número de inventario
    const numerador = await db.numerador.upsert({
      where: { nombre: 'INVENTARIO' },
      update: { ultimoNumero: { increment: 1 } },
      create: { nombre: 'INVENTARIO', ultimoNumero: 1 }
    })
    
    const numero = numerador.ultimoNumero
    
    // Crear el inventario
    const inventario = await db.inventario.create({
      data: {
        numero,
        depositoId,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : new Date(),
        observaciones: observaciones || null,
        operadorId: operadorId || null,
        estado: 'PENDIENTE' as EstadoInventario,
        detalles: detalles ? {
          create: detalles.map((d: any) => {
            // Calcular diferencia automáticamente
            const diferencia = Number(d.cantidadFisica) - Number(d.cantidadSistema)
            const costoDiferencia = d.costoUnitario ? diferencia * Number(d.costoUnitario) : null
            
            return {
              insumoId: d.insumoId,
              cantidadSistema: Number(d.cantidadSistema),
              cantidadFisica: Number(d.cantidadFisica),
              diferencia,
              costoUnitario: d.costoUnitario ? Number(d.costoUnitario) : null,
              costoDiferencia,
              observaciones: d.observaciones || null
            }
          })
        } : undefined
      },
      include: {
        deposito: true,
        detalles: {
          include: {
            insumo: true
          }
        }
      }
    })
    
    // Actualizar contadores del inventario
    await actualizarResumenInventario(inventario.id)
    
    return NextResponse.json({
      success: true,
      data: inventario
    })
  } catch (error) {
    console.error('Error creating inventario:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear inventario' },
      { status: 500 }
    )
  }
}

// PUT - Update inventario
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, estado, observaciones, fechaFin, supervisorId } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }
    
    const updateData: any = {}
    
    if (estado) {
      updateData.estado = estado as EstadoInventario
    }
    
    if (observaciones !== undefined) {
      updateData.observaciones = observaciones
    }
    
    if (fechaFin) {
      updateData.fechaFin = new Date(fechaFin)
    }
    
    if (supervisorId) {
      updateData.supervisorId = supervisorId
    }
    
    const inventario = await db.inventario.update({
      where: { id },
      data: updateData,
      include: {
        deposito: true,
        detalles: {
          include: {
            insumo: true
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: inventario
    })
  } catch (error) {
    console.error('Error updating inventario:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar inventario' },
      { status: 500 }
    )
  }
}

// DELETE - Delete inventario
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
    
    // Verificar si el inventario se puede eliminar (solo si está PENDIENTE)
    const inventario = await db.inventario.findUnique({
      where: { id }
    })
    
    if (!inventario) {
      return NextResponse.json(
        { success: false, error: 'Inventario no encontrado' },
        { status: 404 }
      )
    }
    
    if (inventario.estado !== 'PENDIENTE' && inventario.estado !== 'ANULADO') {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar un inventario en proceso o completado' },
        { status: 400 }
      )
    }
    
    await db.inventario.delete({
      where: { id }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Inventario eliminado correctamente'
    })
  } catch (error) {
    console.error('Error deleting inventario:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar inventario' },
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
