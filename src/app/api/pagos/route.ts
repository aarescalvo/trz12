import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { EstadoPago } from '@prisma/client'

// GET - Listar pagos
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const terceroId = searchParams.get('terceroId')
    const terceroTipo = searchParams.get('terceroTipo')
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (estado && estado !== 'TODOS') {
      where.estado = estado as EstadoPago
    }

    if (terceroId) {
      where.terceroId = terceroId
    }

    if (terceroTipo) {
      where.terceroTipo = terceroTipo
    }

    if (desde || hasta) {
      where.fecha = {}
      if (desde) {
        (where.fecha as Record<string, Date>).gte = new Date(desde)
      }
      if (hasta) {
        (where.fecha as Record<string, Date>).lte = new Date(hasta + 'T23:59:59')
      }
    }

    if (search) {
      where.OR = [
        { terceroNombre: { contains: search } },
        { terceroCuit: { contains: search } },
        { comprobante: { contains: search } }
      ]
    }

    const pagos = await db.pago.findMany({
      where,
      include: {
        formaPago: true,
        cheque: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: pagos
    })
  } catch (error) {
    console.error('Error al obtener pagos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener pagos' },
      { status: 500 }
    )
  }
}

// POST - Crear pago
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const data = await request.json()

    // Validaciones
    if (!data.terceroNombre) {
      return NextResponse.json(
        { success: false, error: 'El nombre del tercero es requerido' },
        { status: 400 }
      )
    }
    if (!data.terceroTipo) {
      return NextResponse.json(
        { success: false, error: 'El tipo de tercero es requerido' },
        { status: 400 }
      )
    }
    if (!data.monto || data.monto <= 0) {
      return NextResponse.json(
        { success: false, error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      )
    }

    // Obtener el próximo número de pago
    const numerador = await db.numerador.upsert({
      where: { nombre: 'PAGO' },
      update: { ultimoNumero: { increment: 1 } },
      create: { nombre: 'PAGO', ultimoNumero: 1 }
    })

    const pago = await db.pago.create({
      data: {
        numero: numerador.ultimoNumero,
        terceroId: data.terceroId || null,
        terceroNombre: data.terceroNombre,
        terceroCuit: data.terceroCuit || null,
        terceroTipo: data.terceroTipo,
        formaPagoId: data.formaPagoId || null,
        monto: Number(data.monto),
        chequeId: data.chequeId || null,
        fecha: data.fecha ? new Date(data.fecha) : new Date(),
        estado: data.estado || 'PENDIENTE',
        comprobante: data.comprobante || null,
        observaciones: data.observaciones || null,
        operadorId: data.operadorId || null
      },
      include: {
        formaPago: true,
        cheque: true
      }
    })

    return NextResponse.json({
      success: true,
      data: pago
    })
  } catch (error) {
    console.error('Error al crear pago:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear pago' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar pago
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
    const existente = await db.pago.findUnique({
      where: { id: data.id }
    })
    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    // No permitir modificar pagos anulados
    if (existente.estado === 'ANULADO') {
      return NextResponse.json(
        { success: false, error: 'No se puede modificar un pago anulado' },
        { status: 400 }
      )
    }

    const pago = await db.pago.update({
      where: { id: data.id },
      data: {
        terceroId: data.terceroId,
        terceroNombre: data.terceroNombre,
        terceroCuit: data.terceroCuit,
        terceroTipo: data.terceroTipo,
        formaPagoId: data.formaPagoId,
        monto: data.monto ? Number(data.monto) : undefined,
        chequeId: data.chequeId,
        fecha: data.fecha ? new Date(data.fecha) : undefined,
        estado: data.estado,
        comprobante: data.comprobante,
        observaciones: data.observaciones,
        operadorId: data.operadorId
      },
      include: {
        formaPago: true,
        cheque: true
      }
    })

    return NextResponse.json({
      success: true,
      data: pago
    })
  } catch (error) {
    console.error('Error al actualizar pago:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar pago' },
      { status: 500 }
    )
  }
}

// DELETE - Anular pago
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

    // Verificar que existe
    const pago = await db.pago.findUnique({
      where: { id }
    })
    if (!pago) {
      return NextResponse.json(
        { success: false, error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    // Anular el pago en lugar de eliminarlo
    const pagoAnulado = await db.pago.update({
      where: { id },
      data: { estado: 'ANULADO' }
    })

    // Actualizar estados de las facturas asociadas
    // Note: PagoFactura does not have a pagoId, so we just anular the Pago record

    return NextResponse.json({
      success: true,
      data: pagoAnulado,
      message: 'Pago anulado correctamente'
    })
  } catch (error) {
    console.error('Error al anular pago:', error)
    return NextResponse.json(
      { success: false, error: 'Error al anular pago' },
      { status: 500 }
    )
  }
}
