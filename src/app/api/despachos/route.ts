import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// V2: Despachos con transacciones para consistencia de datos
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar despachos
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (estado) where.estado = estado

    const [despachos, total] = await Promise.all([
      db.despacho.findMany({
        where,
        include: {
          items: {
            include: {
              mediaRes: {
                include: {
                  romaneo: {
                    select: { garron: true, tropaCodigo: true }
                  }
                }
              }
            }
          },
          ticketPesaje: {
            select: { numeroTicket: true, patenteChasis: true, choferNombre: true }
          },
          operador: {
            select: { id: true, nombre: true }
          }
        },
        orderBy: { fecha: 'desc' },
        take: limit,
        skip: offset
      }),
      db.despacho.count({ where })
    ])

    // Calcular estadísticas
    const stats = await db.despacho.aggregate({
      where: { estado: 'DESPACHADO' },
      _count: { id: true },
      _sum: { kgTotal: true }
    })

    return NextResponse.json({
      success: true,
      data: despachos,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + despachos.length < total
      },
      stats: {
        totalDespachados: stats._count.id,
        kgTotalDespachado: stats._sum.kgTotal || 0
      }
    })
  } catch (error) {
    console.error('Error fetching despachos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener despachos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo despacho (with transaction)
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      destino,
      direccionDestino,
      patenteCamion,
      patenteAcoplado,
      chofer,
      choferDni,
      transportista,
      remito,
      observaciones,
      mediasIds,
      operadorId
    } = body

    if (!destino) {
      return NextResponse.json(
        { success: false, error: 'El destino es requerido' },
        { status: 400 }
      )
    }

    // Obtener último número de despacho
    const ultimo = await db.despacho.findFirst({
      orderBy: { numero: 'desc' },
      select: { numero: true }
    })

    const numero = (ultimo?.numero || 0) + 1

    // Obtener medias seleccionadas
    const medias = await db.mediaRes.findMany({
      where: {
        id: { in: mediasIds || [] },
        estado: 'EN_CAMARA'
      },
      include: {
        romaneo: {
          select: { garron: true, tropaCodigo: true }
        }
      }
    })

    if (medias.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay medias válidas para despachar' },
        { status: 400 }
      )
    }

    // Calcular peso total
    const pesoTotal = medias.reduce((acc, m) => acc + m.peso, 0)

    // Crear despacho con items + actualizar medias EN TRANSACCIÓN
    const despacho = await db.$transaction(async (tx) => {
      const desp = await tx.despacho.create({
        data: {
          numero,
          destino,
          direccionDestino,
          patenteCamion,
          patenteAcoplado,
          chofer,
          choferDni,
          transportista,
          remito,
          observaciones,
          kgTotal: pesoTotal,
          cantidadMedias: medias.length,
          estado: 'PENDIENTE',
          operadorId,
          items: {
            create: medias.map(m => ({
              mediaResId: m.id,
              peso: m.peso,
              tropaCodigo: m.romaneo?.tropaCodigo,
              garron: m.romaneo?.garron
            }))
          }
        },
        include: {
          items: true
        }
      })

      // Actualizar estado de las medias a DESPACHADO
      await tx.mediaRes.updateMany({
        where: { id: { in: medias.map(m => m.id) } },
        data: { estado: 'DESPACHADO' }
      })

      return desp
    })

    return NextResponse.json({
      success: true,
      data: despacho,
      message: 'Despacho creado correctamente'
    })
  } catch (error) {
    console.error('Error creating despacho:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear despacho' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar despacho (with transaction for anulación)
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, accion, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    if (accion === 'anular') {
      // Anulación en transacción
      const despacho = await db.$transaction(async (tx) => {
        const desp = await tx.despacho.findUnique({
          where: { id },
          include: { items: true }
        })
        
        if (!desp) throw new Error('Despacho no encontrado')
        
        // Devolver medias a cámara
        await tx.mediaRes.updateMany({
          where: { id: { in: desp.items.map(i => i.mediaResId) } },
          data: { estado: 'EN_CAMARA' }
        })
        
        // Actualizar estado del despacho
        return tx.despacho.update({
          where: { id },
          data: { estado: 'ANULADO' },
          include: { items: { include: { mediaRes: true } } }
        })
      })
      
      return NextResponse.json({
        success: true,
        data: despacho,
        message: 'Despacho anulado correctamente'
      })
    }

    let data: any = {}

    if (accion === 'confirmar') {
      data.estado = 'DESPACHADO'
      data.fechaDespacho = new Date()
    } else if (accion === 'entregar') {
      data.estado = 'ENTREGADO'
      data.fechaEntrega = new Date()
    } else {
      // Actualización normal
      if (updateData.destino) data.destino = updateData.destino
      if (updateData.direccionDestino !== undefined) data.direccionDestino = updateData.direccionDestino
      if (updateData.patenteCamion !== undefined) data.patenteCamion = updateData.patenteCamion
      if (updateData.patenteAcoplado !== undefined) data.patenteAcoplado = updateData.patenteAcoplado
      if (updateData.chofer !== undefined) data.chofer = updateData.chofer
      if (updateData.choferDni !== undefined) data.choferDni = updateData.choferDni
      if (updateData.transportista !== undefined) data.transportista = updateData.transportista
      if (updateData.remito !== undefined) data.remito = updateData.remito
      if (updateData.observaciones !== undefined) data.observaciones = updateData.observaciones
    }

    const despacho = await db.despacho.update({
      where: { id },
      data,
      include: {
        items: {
          include: {
            mediaRes: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: despacho,
      message: 'Despacho actualizado correctamente'
    })
  } catch (error) {
    console.error('Error updating despacho:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar despacho' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar despacho (with transaction)
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

    await db.$transaction(async (tx) => {
      // Obtener items del despacho
      const despacho = await tx.despacho.findUnique({
        where: { id },
        include: { items: true }
      })

      if (despacho && despacho.estado === 'PENDIENTE') {
        // Devolver medias a cámara
        await tx.mediaRes.updateMany({
          where: { id: { in: despacho.items.map(i => i.mediaResId) } },
          data: { estado: 'EN_CAMARA' }
        })
      }

      // Eliminar items primero
      await tx.despachoItem.deleteMany({
        where: { despachoId: id }
      })

      // Eliminar despacho
      await tx.despacho.delete({
        where: { id }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Despacho eliminado correctamente'
    })
  } catch (error) {
    console.error('Error deleting despacho:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar despacho' },
      { status: 500 }
    )
  }
}
