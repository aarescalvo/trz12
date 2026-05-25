import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validarPermiso } from '@/lib/auth-helpers'

function getOperadorId(request: NextRequest): string | null {
  return request.headers.get('x-operador-id')
}

// GET - Listar tipos de servicio
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activo = searchParams.get('activo')
    const seFactura = searchParams.get('seFactura')

    const where: any = {}
    
    if (activo === 'true') where.activo = true
    if (activo === 'false') where.activo = false
    if (seFactura === 'true') where.seFactura = true
    if (seFactura === 'false') where.seFactura = false

    const tiposServicio = await db.tipoServicio.findMany({
      where,
      orderBy: { orden: 'asc' },
      include: {
        _count: {
          select: { 
            precios: true,
            detallesFactura: true 
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: tiposServicio
    })
  } catch (error) {
    console.error('Error fetching tipos servicio:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener tipos de servicio' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo tipo de servicio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const operadorId = body.operadorId || getOperadorId(request)
    const puedeCrear = await validarPermiso(operadorId, 'puedeFacturacion')
    if (!puedeCrear) {
      return NextResponse.json({ success: false, error: 'Sin permisos de facturación' }, { status: 403 })
    }
    const {
      codigo, 
      nombre, 
      descripcion, 
      unidad, 
      seFactura, 
      porcentajeIva, 
      orden 
    } = body

    if (!codigo || !nombre) {
      return NextResponse.json(
        { success: false, error: 'Código y nombre son requeridos' },
        { status: 400 }
      )
    }

    const existente = await db.tipoServicio.findUnique({
      where: { codigo }
    })

    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un tipo de servicio con ese código' },
        { status: 400 }
      )
    }

    const tipoServicio = await db.tipoServicio.create({
      data: {
        codigo,
        nombre,
        descripcion,
        unidad: unidad || 'KG',
        seFactura: seFactura ?? true,
        porcentajeIva: porcentajeIva ?? 21,
        orden: orden ?? 0
      }
    })

    return NextResponse.json({
      success: true,
      data: tipoServicio
    })
  } catch (error) {
    console.error('Error creating tipo servicio:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear tipo de servicio' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar tipo de servicio
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, operadorId: bodyOpId, ...data } = body
    const operadorId = bodyOpId || getOperadorId(request)
    const puedeEditar = await validarPermiso(operadorId, 'puedeFacturacion')
    if (!puedeEditar) {
      return NextResponse.json({ success: false, error: 'Sin permisos de facturación' }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const tipoServicio = await db.tipoServicio.update({
      where: { id },
      data
    })

    return NextResponse.json({
      success: true,
      data: tipoServicio
    })
  } catch (error) {
    console.error('Error updating tipo servicio:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar tipo de servicio' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar tipo de servicio
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const operadorId = request.headers.get('x-operador-id')
    const puedeEliminar = await validarPermiso(operadorId, 'puedeConfiguracion')
    if (!puedeEliminar) {
      return NextResponse.json({ success: false, error: 'Solo un administrador puede eliminar tipos de servicio' }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const tipoServicio = await db.tipoServicio.findUnique({
      where: { id },
      include: {
        _count: {
          select: { 
            precios: true,
            detallesFactura: true 
          }
        }
      }
    })

    if (!tipoServicio) {
      return NextResponse.json(
        { success: false, error: 'Tipo de servicio no encontrado' },
        { status: 404 }
      )
    }

    if (tipoServicio._count.precios > 0 || tipoServicio._count.detallesFactura > 0) {
      const updated = await db.tipoServicio.update({
        where: { id },
        data: { activo: false }
      })

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Tipo de servicio desactivado (tiene registros asociados)'
      })
    }

    await db.tipoServicio.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Tipo de servicio eliminado'
    })
  } catch (error) {
    console.error('Error deleting tipo servicio:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar tipo de servicio' },
      { status: 500 }
    )
  }
}
