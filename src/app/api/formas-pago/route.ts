import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar formas de pago
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const activos = searchParams.get('activos')
    const tipo = searchParams.get('tipo')

    const where: Record<string, unknown> = {}
    if (activos === 'true') {
      where.activo = true
    }
    if (tipo) {
      where.tipo = tipo
    }

    const formasPago = await db.formaPago.findMany({
      where,
      orderBy: { nombre: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: formasPago
    })
  } catch (error) {
    console.error('Error al obtener formas de pago:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener formas de pago' },
      { status: 500 }
    )
  }
}

// POST - Crear forma de pago
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const data = await request.json()

    // Validaciones
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

    // Verificar si ya existe una forma de pago con el mismo nombre
    const existente = await db.formaPago.findUnique({
      where: { nombre: data.nombre }
    })
    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una forma de pago con ese nombre' },
        { status: 400 }
      )
    }

    const formaPago = await db.formaPago.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        tipo: data.tipo,
        requiereBanco: data.requiereBanco ?? false,
        requiereCheque: data.requiereCheque ?? false,
        requiereTarjeta: data.requiereTarjeta ?? false,
        cuentaContable: data.cuentaContable || null,
        activo: data.activo ?? true,
      }
    })

    return NextResponse.json({
      success: true,
      data: formaPago
    })
  } catch (error) {
    console.error('Error al crear forma de pago:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear forma de pago' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar forma de pago
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const data = await request.json()

    if (!data.id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    // Verificar que existe
    const existente = await db.formaPago.findUnique({
      where: { id: data.id }
    })
    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Forma de pago no encontrada' },
        { status: 404 }
      )
    }

    // Verificar nombre duplicado si se está cambiando
    if (data.nombre && data.nombre !== existente.nombre) {
      const nombreDuplicado = await db.formaPago.findUnique({
        where: { nombre: data.nombre }
      })
      if (nombreDuplicado) {
        return NextResponse.json(
          { success: false, error: 'Ya existe una forma de pago con ese nombre' },
          { status: 400 }
        )
      }
    }

    const formaPago = await db.formaPago.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo: data.tipo,
        requiereBanco: data.requiereBanco,
        requiereCheque: data.requiereCheque,
        requiereTarjeta: data.requiereTarjeta,
        cuentaContable: data.cuentaContable,
        activo: data.activo,
      }
    })

    return NextResponse.json({
      success: true,
      data: formaPago
    })
  } catch (error) {
    console.error('Error al actualizar forma de pago:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar forma de pago' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar forma de pago
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

    // Verificar que no tenga pagos asociados
    const pagosAsociados = await db.pago.findFirst({
      where: { formaPagoId: id }
    })
    if (pagosAsociados) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar, tiene pagos asociados' },
        { status: 400 }
      )
    }

    await db.formaPago.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Forma de pago eliminada correctamente'
    })
  } catch (error) {
    console.error('Error al eliminar forma de pago:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar forma de pago' },
      { status: 500 }
    )
  }
}
