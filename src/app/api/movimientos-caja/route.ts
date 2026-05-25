import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar movimientos de caja
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const cajaId = searchParams.get('cajaId')
    const tipo = searchParams.get('tipo')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const id = searchParams.get('id')

    // Si se pasa un ID específico, devolver ese movimiento
    if (id) {
      const movimiento = await db.movimientoCaja.findUnique({
        where: { id },
        include: {
          caja: true
        }
      })
      
      if (!movimiento) {
        return NextResponse.json(
          { success: false, error: 'Movimiento no encontrado' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: movimiento
      })
    }

    const where: Record<string, unknown> = {}
    if (cajaId) {
      where.cajaId = cajaId
    }
    if (tipo) {
      where.tipo = tipo
    }
    if (fechaDesde || fechaHasta) {
      where.fecha = {}
      if (fechaDesde) {
        (where.fecha as Record<string, Date>).gte = new Date(fechaDesde)
      }
      if (fechaHasta) {
        (where.fecha as Record<string, Date>).lte = new Date(fechaHasta)
      }
    }

    const movimientos = await db.movimientoCaja.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: {
        caja: {
          select: {
            id: true,
            nombre: true,
            tipo: true
          }
        }
      },
      take: 200
    })

    return NextResponse.json({
      success: true,
      data: movimientos
    })
  } catch (error) {
    console.error('Error al obtener movimientos de caja:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener movimientos de caja' },
      { status: 500 }
    )
  }
}

// POST - Crear movimiento de caja
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const data = await request.json()

    // Validaciones
    if (!data.cajaId) {
      return NextResponse.json(
        { success: false, error: 'La caja es requerida' },
        { status: 400 }
      )
    }
    if (!data.tipo) {
      return NextResponse.json(
        { success: false, error: 'El tipo de movimiento es requerido' },
        { status: 400 }
      )
    }
    if (data.monto === undefined || data.monto === null) {
      return NextResponse.json(
        { success: false, error: 'El monto es requerido' },
        { status: 400 }
      )
    }
    if (!data.concepto) {
      return NextResponse.json(
        { success: false, error: 'El concepto es requerido' },
        { status: 400 }
      )
    }

    // Verificar que la caja existe y está activa
    const caja = await db.caja.findUnique({
      where: { id: data.cajaId }
    })
    if (!caja) {
      return NextResponse.json(
        { success: false, error: 'Caja no encontrada' },
        { status: 404 }
      )
    }
    if (!caja.activo) {
      return NextResponse.json(
        { success: false, error: 'La caja está inactiva' },
        { status: 400 }
      )
    }

    // Usar transacción para garantizar consistencia
    const resultado = await db.$transaction(async (tx) => {
      // Obtener saldo actual de la caja (con lock)
      const cajaActual = await tx.caja.findUnique({
        where: { id: data.cajaId }
      })
      if (!cajaActual) {
        throw new Error('Caja no encontrada')
      }

      const saldoAnterior = cajaActual.saldoActual
      const monto = parseFloat(data.monto)
      
      // Calcular nuevo saldo según el tipo de movimiento
      let nuevoSaldo: number
      const tipoMovimiento = data.tipo as string
      
      if (['INGRESO', 'TRANSFERENCIA_ENTRADA', 'APERTURA', 'AJUSTE'].includes(tipoMovimiento)) {
        nuevoSaldo = saldoAnterior + monto
      } else if (['EGRESO', 'TRANSFERENCIA_SALIDA', 'CIERRE'].includes(tipoMovimiento)) {
        nuevoSaldo = saldoAnterior - monto
        // Verificar que no quede saldo negativo (excepto en cierre)
        if (nuevoSaldo < 0 && tipoMovimiento !== 'CIERRE') {
          throw new Error('Saldo insuficiente para realizar el movimiento')
        }
      } else {
        // Para AJUSTE, el monto puede ser negativo
        nuevoSaldo = saldoAnterior + monto
      }

      // Crear el movimiento
      const movimiento = await tx.movimientoCaja.create({
        data: {
          cajaId: data.cajaId,
          tipo: data.tipo,
          monto: monto,
          saldoAnterior: saldoAnterior,
          saldoNueva: nuevoSaldo,
          documentoTipo: data.documentoTipo || null,
          documentoId: data.documentoId || null,
          documentoNumero: data.documentoNumero || null,
          concepto: data.concepto,
          observaciones: data.observaciones || null,
          terceroNombre: data.terceroNombre || null,
          terceroCuit: data.terceroCuit || null,
          operadorId: data.operadorId || null,
          fecha: data.fecha ? new Date(data.fecha) : new Date()
        }
      })

      // Actualizar saldo de la caja
      await tx.caja.update({
        where: { id: data.cajaId },
        data: { saldoActual: nuevoSaldo }
      })

      // Si es transferencia, crear el movimiento en la caja destino
      if (data.tipo === 'TRANSFERENCIA_SALIDA' && data.cajaDestinoId) {
        const cajaDestino = await tx.caja.findUnique({
          where: { id: data.cajaDestinoId }
        })
        if (!cajaDestino) {
          throw new Error('Caja destino no encontrada')
        }
        if (!cajaDestino.activo) {
          throw new Error('La caja destino está inactiva')
        }

        const saldoAnteriorDestino = cajaDestino.saldoActual
        const nuevoSaldoDestino = saldoAnteriorDestino + monto

        await tx.movimientoCaja.create({
          data: {
            cajaId: data.cajaDestinoId,
            tipo: 'TRANSFERENCIA_ENTRADA',
            monto: monto,
            saldoAnterior: saldoAnteriorDestino,
            saldoNueva: nuevoSaldoDestino,
            documentoTipo: 'TRANSFERENCIA',
            documentoId: movimiento.id,
            concepto: `Transferencia recibida de ${caja.nombre}`,
            observaciones: data.observaciones || null,
            operadorId: data.operadorId || null,
            fecha: new Date()
          }
        })

        await tx.caja.update({
          where: { id: data.cajaDestinoId },
          data: { saldoActual: nuevoSaldoDestino }
        })
      }

      return movimiento
    })

    return NextResponse.json({
      success: true,
      data: resultado
    })
  } catch (error) {
    console.error('Error al crear movimiento de caja:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Saldo insuficiente')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }
      if (error.message.includes('no encontrada')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        )
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Error al crear movimiento de caja' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar movimiento de caja
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
    const existente = await db.movimientoCaja.findUnique({
      where: { id: data.id }
    })
    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Movimiento no encontrado' },
        { status: 404 }
      )
    }

    // No permitir modificar el monto o tipo de un movimiento ya registrado
    // Solo se pueden modificar campos descriptivos
    const movimiento = await db.movimientoCaja.update({
      where: { id: data.id },
      data: {
        concepto: data.concepto,
        observaciones: data.observaciones,
        terceroNombre: data.terceroNombre,
        terceroCuit: data.terceroCuit,
        documentoNumero: data.documentoNumero,
      }
    })

    return NextResponse.json({
      success: true,
      data: movimiento
    })
  } catch (error) {
    console.error('Error al actualizar movimiento de caja:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar movimiento de caja' },
      { status: 500 }
    )
  }
}

// DELETE - Anular movimiento de caja
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

    // Usar transacción para revertir el movimiento
    const resultado = await db.$transaction(async (tx) => {
      // Obtener el movimiento a anular
      const movimiento = await tx.movimientoCaja.findUnique({
        where: { id }
      })
      if (!movimiento) {
        throw new Error('Movimiento no encontrado')
      }

      // Obtener la caja actual
      const caja = await tx.caja.findUnique({
        where: { id: movimiento.cajaId }
      })
      if (!caja) {
        throw new Error('Caja no encontrada')
      }

      // Revertir el saldo
      const monto = movimiento.monto
      const tipoMovimiento = movimiento.tipo as string
      let saldoRevertido: number

      if (['INGRESO', 'TRANSFERENCIA_ENTRADA', 'APERTURA', 'AJUSTE'].includes(tipoMovimiento)) {
        saldoRevertido = caja.saldoActual - monto
      } else if (['EGRESO', 'TRANSFERENCIA_SALIDA', 'CIERRE'].includes(tipoMovimiento)) {
        saldoRevertido = caja.saldoActual + monto
      } else {
        saldoRevertido = caja.saldoActual - monto
      }

      // Crear movimiento de anulación
      const movimientoAnulacion = await tx.movimientoCaja.create({
        data: {
          cajaId: movimiento.cajaId,
          tipo: 'AJUSTE',
          monto: saldoRevertido - caja.saldoActual,
          saldoAnterior: caja.saldoActual,
          saldoNueva: saldoRevertido,
          concepto: `Anulación de movimiento: ${movimiento.concepto}`,
          documentoTipo: 'ANULACION',
          documentoId: movimiento.id,
          observaciones: `Anulación del movimiento ${movimiento.id}`,
          operadorId: movimiento.operadorId
        }
      })

      // Actualizar saldo de la caja
      await tx.caja.update({
        where: { id: movimiento.cajaId },
        data: { saldoActual: saldoRevertido }
      })

      // Si era transferencia, revertir también la entrada
      if (movimiento.tipo === 'TRANSFERENCIA_SALIDA') {
        const movimientoEntrada = await tx.movimientoCaja.findFirst({
          where: {
            documentoId: movimiento.id,
            tipo: 'TRANSFERENCIA_ENTRADA'
          }
        })
        if (movimientoEntrada) {
          const cajaDestino = await tx.caja.findUnique({
            where: { id: movimientoEntrada.cajaId }
          })
          if (cajaDestino) {
            const nuevoSaldoDestino = cajaDestino.saldoActual - monto
            await tx.movimientoCaja.create({
              data: {
                cajaId: cajaDestino.id,
                tipo: 'AJUSTE',
                monto: -monto,
                saldoAnterior: cajaDestino.saldoActual,
                saldoNueva: nuevoSaldoDestino,
                concepto: `Anulación de transferencia recibida`,
                documentoTipo: 'ANULACION',
                documentoId: movimiento.id
              }
            })
            await tx.caja.update({
              where: { id: cajaDestino.id },
              data: { saldoActual: nuevoSaldoDestino }
            })
          }
        }
      }

      return movimientoAnulacion
    })

    return NextResponse.json({
      success: true,
      data: resultado,
      message: 'Movimiento anulado correctamente'
    })
  } catch (error) {
    console.error('Error al anular movimiento de caja:', error)
    
    if (error instanceof Error && error.message.includes('no encontrado')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Error al anular movimiento de caja' },
      { status: 500 }
    )
  }
}
