import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar cuentas bancarias
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const activos = searchParams.get('activos')
    const banco = searchParams.get('banco')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (activos === 'true') {
      where.activo = true
    }

    if (banco) {
      where.banco = banco
    }

    if (search) {
      where.OR = [
        { banco: { contains: search } },
        { numeroCuenta: { contains: search } },
        { cbu: { contains: search } },
        { alias: { contains: search } },
        { titular: { contains: search } }
      ]
    }

    const cuentas = await db.cuentaBancaria.findMany({
      where,
      include: {
        cheques: {
          where: { estado: { in: ['RECIBIDO', 'DEPOSITADO'] } },
          orderBy: { fechaVencimiento: 'asc' },
          take: 10
        },
        _count: {
          select: { cheques: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: cuentas
    })
  } catch (error) {
    console.error('Error al obtener cuentas bancarias:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener cuentas bancarias' },
      { status: 500 }
    )
  }
}

// POST - Crear cuenta bancaria
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError
  try {
    const data = await request.json()

    // Validaciones
    if (!data.banco) {
      return NextResponse.json(
        { success: false, error: 'El banco es requerido' },
        { status: 400 }
      )
    }
    if (!data.tipoCuenta) {
      return NextResponse.json(
        { success: false, error: 'El tipo de cuenta es requerido' },
        { status: 400 }
      )
    }
    if (!data.numeroCuenta) {
      return NextResponse.json(
        { success: false, error: 'El número de cuenta es requerido' },
        { status: 400 }
      )
    }

    // Verificar si ya existe una cuenta con el mismo CBU
    if (data.cbu) {
      const existente = await db.cuentaBancaria.findUnique({
        where: { cbu: data.cbu }
      })
      if (existente) {
        return NextResponse.json(
          { success: false, error: 'Ya existe una cuenta bancaria con ese CBU' },
          { status: 400 }
        )
      }
    }

    const cuenta = await db.cuentaBancaria.create({
      data: {
        banco: data.banco,
        tipoCuenta: data.tipoCuenta,
        numeroCuenta: data.numeroCuenta,
        cbu: data.cbu || null,
        alias: data.alias || null,
        saldoActual: data.saldoActual ? Number(data.saldoActual) : 0,
        saldoConciliado: data.saldoConciliado ? Number(data.saldoConciliado) : 0,
        titular: data.titular || null,
        cuitTitular: data.cuitTitular || null,
        activo: data.activo ?? true
      },
      include: {
        cheques: true
      }
    })

    return NextResponse.json({
      success: true,
      data: cuenta
    })
  } catch (error) {
    console.error('Error al crear cuenta bancaria:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear cuenta bancaria' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar cuenta bancaria
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
    const existente = await db.cuentaBancaria.findUnique({
      where: { id: data.id }
    })
    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Cuenta bancaria no encontrada' },
        { status: 404 }
      )
    }

    // Verificar CBU duplicado si se está cambiando
    if (data.cbu && data.cbu !== existente.cbu) {
      const cbuDuplicado = await db.cuentaBancaria.findUnique({
        where: { cbu: data.cbu }
      })
      if (cbuDuplicado) {
        return NextResponse.json(
          { success: false, error: 'Ya existe una cuenta bancaria con ese CBU' },
          { status: 400 }
        )
      }
    }

    const cuenta = await db.cuentaBancaria.update({
      where: { id: data.id },
      data: {
        banco: data.banco,
        tipoCuenta: data.tipoCuenta,
        numeroCuenta: data.numeroCuenta,
        cbu: data.cbu,
        alias: data.alias,
        saldoActual: data.saldoActual !== undefined ? Number(data.saldoActual) : undefined,
        saldoConciliado: data.saldoConciliado !== undefined ? Number(data.saldoConciliado) : undefined,
        titular: data.titular,
        cuitTitular: data.cuitTitular,
        activo: data.activo
      },
      include: {
        cheques: true
      }
    })

    return NextResponse.json({
      success: true,
      data: cuenta
    })
  } catch (error) {
    console.error('Error al actualizar cuenta bancaria:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar cuenta bancaria' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar cuenta bancaria
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

    // Verificar que no tenga cheques asociados
    const chequesAsociados = await db.cheque.findFirst({
      where: { cuentaBancariaId: id }
    })
    if (chequesAsociados) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar, tiene cheques asociados' },
        { status: 400 }
      )
    }

    await db.cuentaBancaria.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Cuenta bancaria eliminada correctamente'
    })
  } catch (error) {
    console.error('Error al eliminar cuenta bancaria:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar cuenta bancaria' },
      { status: 500 }
    )
  }
}
