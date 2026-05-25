import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar cueros
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const conservacion = searchParams.get('conservacion')

    const where: Record<string, unknown> = {}
    if (estado) where.estado = estado
    if (conservacion) where.conservacion = conservacion

    const cueros = await db.cuero.findMany({
      where,
      include: {
        operador: {
          select: { id: true, nombre: true }
        }
      },
      orderBy: { fecha: 'desc' }
    })

    // Calcular estadísticas
    const stats = {
      total: cueros.length,
      pendientes: cueros.filter(c => c.estado === 'PENDIENTE').length,
      despachados: cueros.filter(c => c.estado === 'DESPACHADO').length,
      pesoTotalPendiente: cueros
        .filter(c => c.estado === 'PENDIENTE')
        .reduce((acc, c) => acc + c.pesoKg, 0),
      pesoTotalDespachado: cueros
        .filter(c => c.estado === 'DESPACHADO')
        .reduce((acc, c) => acc + c.pesoKg, 0),
      porConservacion: {
        SALADO: cueros.filter(c => c.conservacion === 'SALADO' && c.estado === 'PENDIENTE').length,
        FRESCO: cueros.filter(c => c.conservacion === 'FRESCO' && c.estado === 'PENDIENTE').length,
        CORTADO: cueros.filter(c => c.conservacion === 'CORTADO' && c.estado === 'PENDIENTE').length,
      }
    }

    return NextResponse.json({
      success: true,
      data: cueros,
      stats
    })
  } catch (error) {
    console.error('Error fetching cueros:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener cueros' },
      { status: 500 }
    )
  }
}

// POST - Crear cuero
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      tropaCodigo,
      cantidad,
      pesoKg,
      conservacion,
      destino,
      tipoDestino,
      observaciones,
      operadorId
    } = body

    if (!pesoKg || pesoKg <= 0) {
      return NextResponse.json(
        { success: false, error: 'El peso es requerido y debe ser mayor a 0' },
        { status: 400 }
      )
    }

    const cuero = await db.cuero.create({
      data: {
        tropaCodigo: tropaCodigo || null,
        cantidad: cantidad || 1,
        pesoKg,
        conservacion: conservacion || 'SALADO',
        destino: destino || null,
        tipoDestino: tipoDestino || null,
        observaciones: observaciones || null,
        operadorId: operadorId || null
      }
    })

    return NextResponse.json({
      success: true,
      data: cuero,
      message: 'Cuero registrado correctamente'
    })
  } catch (error) {
    console.error('Error creating cuero:', error)
    return NextResponse.json(
      { success: false, error: 'Error al registrar cuero' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar cuero
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, ...bodyData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    // Whitelist only valid Cuero fields
    const data = {
      tropaCodigo: bodyData.tropaCodigo,
      cantidad: bodyData.cantidad !== undefined ? parseInt(bodyData.cantidad) : undefined,
      pesoKg: bodyData.pesoKg ? parseFloat(bodyData.pesoKg) : undefined,
      conservacion: bodyData.conservacion,
      destino: bodyData.destino,
      tipoDestino: bodyData.tipoDestino,
      estado: bodyData.estado,
      remito: bodyData.remito,
      fechaDespacho: bodyData.fechaDespacho ? new Date(bodyData.fechaDespacho) : undefined,
      observaciones: bodyData.observaciones,
      operadorId: bodyData.operadorId,
    }

    const cuero = await db.cuero.update({
      where: { id },
      data
    })

    return NextResponse.json({
      success: true,
      data: cuero,
      message: 'Cuero actualizado correctamente'
    })
  } catch (error) {
    console.error('Error updating cuero:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar cuero' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar cuero
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

    await db.cuero.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Cuero eliminado correctamente'
    })
  } catch (error) {
    console.error('Error deleting cuero:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar cuero' },
      { status: 500 }
    )
  }
}
