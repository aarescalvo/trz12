import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar arqueos de caja
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const cajaId = searchParams.get('cajaId')
    const estado = searchParams.get('estado')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const id = searchParams.get('id')

    // Si se pasa un ID específico, devolver ese arqueo
    if (id) {
      const arqueo = await db.arqueoCaja.findUnique({
        where: { id },
        include: {
          caja: true
        }
      })
      
      if (!arqueo) {
        return NextResponse.json(
          { success: false, error: 'Arqueo no encontrado' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: arqueo
      })
    }

    const where: Record<string, unknown> = {}
    if (cajaId) {
      where.cajaId = cajaId
    }
    if (estado) {
      where.estado = estado
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

    const arqueos = await db.arqueoCaja.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: {
        caja: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            saldoActual: true
          }
        }
      },
      take: 100
    })

    return NextResponse.json({
      success: true,
      data: arqueos
    })
  } catch (error) {
    console.error('Error al obtener arqueos de caja:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener arqueos de caja' },
      { status: 500 }
    )
  }
}

// POST - Crear arqueo de caja
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
    if (data.saldoFisico === undefined || data.saldoFisico === null) {
      return NextResponse.json(
        { success: false, error: 'El saldo físico es requerido' },
        { status: 400 }
      )
    }

    // Verificar que la caja existe
    const caja = await db.caja.findUnique({
      where: { id: data.cajaId }
    })
    if (!caja) {
      return NextResponse.json(
        { success: false, error: 'Caja no encontrada' },
        { status: 404 }
      )
    }

    // Calcular valores automáticamente
    const saldoSistema = data.saldoSistema ?? caja.saldoActual
    const saldoFisico = parseFloat(data.saldoFisico)
    const diferencia = saldoFisico - saldoSistema

    const arqueo = await db.arqueoCaja.create({
      data: {
        cajaId: data.cajaId,
        fecha: data.fecha ? new Date(data.fecha) : new Date(),
        saldoSistema: saldoSistema,
        saldoFisico: saldoFisico,
        diferencia: diferencia,
        estado: data.estado || 'PENDIENTE',
        observaciones: data.observaciones || null,
        operadorId: data.operadorId || null,
        supervisorId: data.supervisorId || null,
      },
      include: {
        caja: true
      }
    })

    return NextResponse.json({
      success: true,
      data: arqueo
    })
  } catch (error) {
    console.error('Error al crear arqueo de caja:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear arqueo de caja' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar arqueo de caja
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
    const existente = await db.arqueoCaja.findUnique({
      where: { id: data.id },
      include: { caja: true }
    })
    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Arqueo no encontrado' },
        { status: 404 }
      )
    }

    // Calcular diferencia si se modifican los saldos
    let saldoSistema = existente.saldoSistema
    let saldoFisico = existente.saldoFisico
    let diferencia = existente.diferencia

    if (data.saldoSistema !== undefined) {
      saldoSistema = parseFloat(data.saldoSistema)
    }
    if (data.saldoFisico !== undefined) {
      saldoFisico = parseFloat(data.saldoFisico)
    }
    diferencia = saldoFisico - saldoSistema

    const arqueo = await db.arqueoCaja.update({
      where: { id: data.id },
      data: {
        saldoSistema: saldoSistema,
        saldoFisico: saldoFisico,
        diferencia: diferencia,
        estado: data.estado || existente.estado,
        observaciones: data.observaciones,
        supervisorId: data.supervisorId,
      },
      include: {
        caja: true
      }
    })

    return NextResponse.json({
      success: true,
      data: arqueo
    })
  } catch (error) {
    console.error('Error al actualizar arqueo de caja:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar arqueo de caja' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar arqueo de caja
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
    const existente = await db.arqueoCaja.findUnique({
      where: { id }
    })
    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Arqueo no encontrado' },
        { status: 404 }
      )
    }

    await db.arqueoCaja.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Arqueo eliminado correctamente'
    })
  } catch (error) {
    console.error('Error al eliminar arqueo de caja:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar arqueo de caja' },
      { status: 500 }
    )
  }
}

// PATCH - Aprobar/Rechazar arqueo y aplicar ajuste
export async function PATCH(request: NextRequest) {
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

    if (!data.accion) {
      return NextResponse.json(
        { success: false, error: 'Acción es requerida (aprobar/rechazar)' },
        { status: 400 }
      )
    }

    // Verificar que existe
    const existente = await db.arqueoCaja.findUnique({
      where: { id: data.id },
      include: { caja: true }
    })
    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Arqueo no encontrado' },
        { status: 404 }
      )
    }

    if (existente.estado !== 'PENDIENTE') {
      return NextResponse.json(
        { success: false, error: 'El arqueo ya fue procesado' },
        { status: 400 }
      )
    }

    let resultado

    if (data.accion === 'aprobar') {
      // Si hay diferencia, crear movimiento de ajuste
      if (existente.diferencia !== 0) {
        resultado = await db.$transaction(async (tx) => {
          const caja = await tx.caja.findUnique({
            where: { id: existente.cajaId }
          })
          if (!caja) throw new Error('Caja no encontrada')

          const saldoAnterior = caja.saldoActual
          const nuevoSaldo = existente.saldoFisico
          const montoAjuste = existente.diferencia

          // Crear movimiento de ajuste
          await tx.movimientoCaja.create({
            data: {
              cajaId: existente.cajaId,
              tipo: 'AJUSTE',
              monto: Math.abs(montoAjuste),
              saldoAnterior: saldoAnterior,
              saldoNueva: nuevoSaldo,
              concepto: `Ajuste por arqueo - Diferencia: ${montoAjuste >= 0 ? '+' : ''}${montoAjuste.toFixed(2)}`,
              documentoTipo: 'ARQUEO',
              documentoId: existente.id,
              observaciones: `Arqueo aprobado - ID: ${existente.id}`,
              operadorId: data.supervisorId || existente.operadorId
            }
          })

          // Actualizar saldo de la caja
          await tx.caja.update({
            where: { id: existente.cajaId },
            data: { saldoActual: nuevoSaldo }
          })

          // Actualizar estado del arqueo
          return await tx.arqueoCaja.update({
            where: { id: data.id },
            data: {
              estado: 'APROBADO',
              supervisorId: data.supervisorId
            },
            include: { caja: true }
          })
        })
      } else {
        // Sin diferencia, solo actualizar estado
        resultado = await db.arqueoCaja.update({
          where: { id: data.id },
          data: {
            estado: 'APROBADO',
            supervisorId: data.supervisorId
          },
          include: { caja: true }
        })
      }
    } else if (data.accion === 'rechazar') {
      resultado = await db.arqueoCaja.update({
        where: { id: data.id },
        data: {
          estado: 'RECHAZADO',
          supervisorId: data.supervisorId,
          observaciones: data.observaciones 
            ? `${existente.observaciones || ''}\nMotivo rechazo: ${data.observaciones}`.trim()
            : existente.observaciones
        },
        include: { caja: true }
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Acción inválida. Use: aprobar o rechazar' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: resultado,
      message: `Arqueo ${data.accion === 'aprobar' ? 'aprobado' : 'rechazado'} correctamente`
    })
  } catch (error) {
    console.error('Error al procesar arqueo de caja:', error)
    return NextResponse.json(
      { success: false, error: 'Error al procesar arqueo de caja' },
      { status: 500 }
    )
  }
}
