import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar centros de costo
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const activos = searchParams.get('activos')
    const tipo = searchParams.get('tipo')
    const id = searchParams.get('id')

    // Si se pasa un ID, devolver un solo centro de costo
    if (id) {
      const centroCosto = await db.centroCosto.findUnique({
        where: { id },
        include: {
          presupuestos: {
            orderBy: { anio: 'desc', mes: 'desc' },
            take: 12
          },
          _count: {
            select: { consumosCentro: true }
          }
        }
      })

      if (!centroCosto) {
        return NextResponse.json(
          { success: false, error: 'Centro de costo no encontrado' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: centroCosto
      })
    }

    const where: Record<string, unknown> = {}
    if (activos === 'true') {
      where.activo = true
    }
    if (tipo) {
      where.tipo = tipo
    }

    const centrosCosto = await db.centroCosto.findMany({
      where,
      include: {
        presupuestos: {
          orderBy: { anio: 'desc', mes: 'desc' },
          take: 12
        },
        _count: {
          select: { consumosCentro: true }
        }
      },
      orderBy: { nombre: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: centrosCosto
    })
  } catch (error) {
    console.error('Error al obtener centros de costo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener centros de costo' },
      { status: 500 }
    )
  }
}

// POST - Crear centro de costo
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const data = await request.json()

    // Validaciones
    if (!data.codigo) {
      return NextResponse.json(
        { success: false, error: 'El código es requerido' },
        { status: 400 }
      )
    }
    if (!data.nombre) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }
    if (!data.tipo) {
      return NextResponse.json(
        { success: false, error: 'El tipo es requerido' },
        { status: 400 }
      )
    }

    // Verificar si ya existe el código
    const existente = await db.centroCosto.findUnique({
      where: { codigo: data.codigo }
    })

    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un centro de costo con ese código' },
        { status: 400 }
      )
    }

    const centroCosto = await db.centroCosto.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        tipo: data.tipo,
        responsable: data.responsable || null,
        presupuestoMensual: data.presupuestoMensual ? parseFloat(data.presupuestoMensual) : null,
        activo: data.activo ?? true
      }
    })

    return NextResponse.json({
      success: true,
      data: centroCosto
    })
  } catch (error) {
    console.error('Error al crear centro de costo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear centro de costo' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar centro de costo
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const data = await request.json()

    if (!data.id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    // Verificar que existe
    const existente = await db.centroCosto.findUnique({
      where: { id: data.id }
    })

    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Centro de costo no encontrado' },
        { status: 404 }
      )
    }

    // Si se está cambiando el código, verificar que no exista otro con el mismo código
    if (data.codigo && data.codigo !== existente.codigo) {
      const codigoExistente = await db.centroCosto.findUnique({
        where: { codigo: data.codigo }
      })
      if (codigoExistente) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un centro de costo con ese código' },
          { status: 400 }
        )
      }
    }

    const centroCosto = await db.centroCosto.update({
      where: { id: data.id },
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo: data.tipo,
        responsable: data.responsable,
        presupuestoMensual: data.presupuestoMensual !== undefined 
          ? (data.presupuestoMensual ? parseFloat(data.presupuestoMensual) : null)
          : existente.presupuestoMensual,
        activo: data.activo
      }
    })

    return NextResponse.json({
      success: true,
      data: centroCosto
    })
  } catch (error) {
    console.error('Error al actualizar centro de costo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar centro de costo' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar centro de costo
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
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

    // Verificar que no tenga presupuestos o consumos asociados
    const relaciones = await db.centroCosto.findUnique({
      where: { id },
      include: {
        _count: {
          select: { presupuestos: true, consumosCentro: true, consumosInsumo: true }
        }
      }
    })

    if (relaciones && (relaciones._count.presupuestos > 0 || relaciones._count.consumosCentro > 0 || relaciones._count.consumosInsumo > 0)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No se puede eliminar el centro de costo porque tiene presupuestos, consumos o consumos de insumos asociados' 
        },
        { status: 400 }
      )
    }

    await db.centroCosto.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Centro de costo eliminado correctamente'
    })
  } catch (error) {
    console.error('Error al eliminar centro de costo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar centro de costo' },
      { status: 500 }
    )
  }
}
