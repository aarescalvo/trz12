import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { EstadoCheque } from '@prisma/client'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar cheques
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const banco = searchParams.get('banco')
    const cuentaBancariaId = searchParams.get('cuentaBancariaId')
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const vencimientoDesde = searchParams.get('vencimientoDesde')
    const vencimientoHasta = searchParams.get('vencimientoHasta')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (estado && estado !== 'TODOS') {
      where.estado = estado as EstadoCheque
    }

    if (banco) {
      where.banco = banco
    }

    if (cuentaBancariaId) {
      where.cuentaBancariaId = cuentaBancariaId
    }

    if (desde || hasta) {
      where.fechaEmision = {}
      if (desde) {
        (where.fechaEmision as Record<string, Date>).gte = new Date(desde)
      }
      if (hasta) {
        (where.fechaEmision as Record<string, Date>).lte = new Date(hasta + 'T23:59:59')
      }
    }

    if (vencimientoDesde || vencimientoHasta) {
      where.fechaVencimiento = {}
      if (vencimientoDesde) {
        (where.fechaVencimiento as Record<string, Date>).gte = new Date(vencimientoDesde)
      }
      if (vencimientoHasta) {
        (where.fechaVencimiento as Record<string, Date>).lte = new Date(vencimientoHasta + 'T23:59:59')
      }
    }

    if (search) {
      where.OR = [
        { numero: { contains: search } },
        { banco: { contains: search } },
        { libradorNombre: { contains: search } },
        { libradorCuit: { contains: search } }
      ]
    }

    const cheques = await db.cheque.findMany({
      where,
      include: {
        cuentaBancaria: true,
        pagos: {
          include: {
            formaPago: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: cheques
    })
  } catch (error) {
    console.error('Error al obtener cheques:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener cheques' },
      { status: 500 }
    )
  }
}

// POST - Crear cheque
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError
  try {
    const data = await request.json()

    // Validaciones
    if (!data.numero) {
      return NextResponse.json(
        { success: false, error: 'El número de cheque es requerido' },
        { status: 400 }
      )
    }
    if (!data.banco) {
      return NextResponse.json(
        { success: false, error: 'El banco es requerido' },
        { status: 400 }
      )
    }
    if (!data.monto || data.monto <= 0) {
      return NextResponse.json(
        { success: false, error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      )
    }
    if (!data.fechaVencimiento) {
      return NextResponse.json(
        { success: false, error: 'La fecha de vencimiento es requerida' },
        { status: 400 }
      )
    }
    if (!data.libradorNombre) {
      return NextResponse.json(
        { success: false, error: 'El nombre del librador es requerido' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un cheque con el mismo número y banco
    const existente = await db.cheque.findUnique({
      where: {
        cheque_numero_banco: {
          numero: data.numero,
          banco: data.banco
        }
      }
    })
    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un cheque con ese número y banco' },
        { status: 400 }
      )
    }

    const cheque = await db.cheque.create({
      data: {
        numero: data.numero,
        banco: data.banco,
        monto: Number(data.monto),
        fechaEmision: data.fechaEmision ? new Date(data.fechaEmision) : new Date(),
        fechaVencimiento: new Date(data.fechaVencimiento),
        fechaCobro: data.fechaCobro ? new Date(data.fechaCobro) : null,
        cuentaBancariaId: data.cuentaBancariaId || null,
        libradorNombre: data.libradorNombre,
        libradorCuit: data.libradorCuit || null,
        libradorTelefono: data.libradorTelefono || null,
        estado: data.estado || 'RECIBIDO',
        destino: data.destino || null,
        observaciones: data.observaciones || null
      },
      include: {
        cuentaBancaria: true,
        pagos: true
      }
    })

    return NextResponse.json({
      success: true,
      data: cheque
    })
  } catch (error) {
    console.error('Error al crear cheque:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear cheque' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar cheque
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
    const existente = await db.cheque.findUnique({
      where: { id: data.id }
    })
    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Cheque no encontrado' },
        { status: 404 }
      )
    }

    // Verificar número y banco duplicados si se están cambiando
    if ((data.numero && data.numero !== existente.numero) || 
        (data.banco && data.banco !== existente.banco)) {
      const duplicado = await db.cheque.findUnique({
        where: {
          cheque_numero_banco: {
            numero: data.numero || existente.numero,
            banco: data.banco || existente.banco
          }
        }
      })
      if (duplicado && duplicado.id !== data.id) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un cheque con ese número y banco' },
          { status: 400 }
        )
      }
    }

    const cheque = await db.cheque.update({
      where: { id: data.id },
      data: {
        numero: data.numero,
        banco: data.banco,
        monto: data.monto ? Number(data.monto) : undefined,
        fechaEmision: data.fechaEmision ? new Date(data.fechaEmision) : undefined,
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : undefined,
        fechaCobro: data.fechaCobro ? new Date(data.fechaCobro) : null,
        cuentaBancariaId: data.cuentaBancariaId,
        libradorNombre: data.libradorNombre,
        libradorCuit: data.libradorCuit,
        libradorTelefono: data.libradorTelefono,
        estado: data.estado,
        destino: data.destino,
        observaciones: data.observaciones
      },
      include: {
        cuentaBancaria: true,
        pagos: true
      }
    })

    return NextResponse.json({
      success: true,
      data: cheque
    })
  } catch (error) {
    console.error('Error al actualizar cheque:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar cheque' },
      { status: 500 }
    )
  }
}

// DELETE - Anular cheque
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
    const cheque = await db.cheque.findUnique({
      where: { id },
      include: { pagos: true }
    })
    if (!cheque) {
      return NextResponse.json(
        { success: false, error: 'Cheque no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si tiene pagos asociados
    if (cheque.pagos.length > 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar, tiene pagos asociados' },
        { status: 400 }
      )
    }

    // Anular el cheque en lugar de eliminarlo
    const chequeAnulado = await db.cheque.update({
      where: { id },
      data: { estado: 'ANULADO' }
    })

    return NextResponse.json({
      success: true,
      data: chequeAnulado,
      message: 'Cheque anulado correctamente'
    })
  } catch (error) {
    console.error('Error al anular cheque:', error)
    return NextResponse.json(
      { success: false, error: 'Error al anular cheque' },
      { status: 500 }
    )
  }
}
