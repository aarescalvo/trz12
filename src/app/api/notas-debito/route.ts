import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { EstadoNota } from '@prisma/client'

// GET - Fetch notas de débito
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const clienteId = searchParams.get('clienteId')
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const search = searchParams.get('search')
    
    const where: any = {}
    
    if (estado && estado !== 'TODOS') {
      where.estado = estado as EstadoNota
    }
    
    if (clienteId) {
      where.clienteId = clienteId
    }
    
    if (desde || hasta) {
      where.fecha = {}
      if (desde) {
        where.fecha.gte = new Date(desde)
      }
      if (hasta) {
        where.fecha.lte = new Date(hasta + 'T23:59:59')
      }
    }
    
    if (search) {
      where.OR = [
        { numero: { contains: search } },
        { motivo: { contains: search } },
        { cliente: { nombre: { contains: search } } }
      ]
    }
    
    const notasDebito = await db.notaDebito.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            cuit: true,
            direccion: true
          }
        },
        detalles: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({
      success: true,
      data: notasDebito
    })
  } catch (error) {
    console.error('Error fetching notas de débito:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener notas de débito' },
      { status: 500 }
    )
  }
}

// POST - Create new nota de débito
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const body = await request.json()
    const { 
      clienteId, 
      facturaId,
      fecha,
      motivo,
      detalles,
      observaciones,
      operadorId 
    } = body
    
    if (!clienteId) {
      return NextResponse.json(
        { success: false, error: 'El cliente es requerido' },
        { status: 400 }
      )
    }
    
    if (!motivo) {
      return NextResponse.json(
        { success: false, error: 'El motivo es requerido' },
        { status: 400 }
      )
    }
    
    if (!detalles || detalles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Debe agregar al menos un detalle' },
        { status: 400 }
      )
    }
    
    // Obtener el último número de nota de débito
    const numerador = await db.numerador.upsert({
      where: { nombre: 'NOTA_DEBITO' },
      update: { ultimoNumero: { increment: 1 } },
      create: { nombre: 'NOTA_DEBITO', ultimoNumero: 1 }
    })
    
    const numeroInterno = numerador.ultimoNumero
    const numero = `ND-${String(numeroInterno).padStart(8, '0')}`
    
    // Calcular totales
    let subtotal = 0
    const detallesCalculados = detalles.map((d: any) => {
      const subtotalDetalle = Number(d.cantidad) * Number(d.precioUnitario)
      subtotal += subtotalDetalle
      return {
        ...d,
        subtotal: subtotalDetalle
      }
    })
    
    const iva = subtotal * 0.21 // IVA 21%
    const total = subtotal + iva
    
    // Crear la nota de débito con sus detalles
    const notaDebito = await db.notaDebito.create({
      data: {
        numero,
        numeroInterno,
        clienteId,
        facturaId: facturaId || null,
        fecha: fecha ? new Date(fecha) : new Date(),
        subtotal,
        iva,
        total,
        motivo,
        observaciones: observaciones || null,
        operadorId: operadorId || null,
        detalles: {
          create: detallesCalculados.map((d: any) => ({
            descripcion: d.descripcion,
            cantidad: Number(d.cantidad),
            precioUnitario: Number(d.precioUnitario),
            subtotal: d.subtotal
          }))
        }
      },
      include: {
        cliente: true,
        detalles: true
      }
    })
    
    return NextResponse.json({
      success: true,
      data: notaDebito
    })
  } catch (error) {
    console.error('Error creating nota de débito:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear nota de débito' },
      { status: 500 }
    )
  }
}

// PUT - Update nota de débito
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, estado, observaciones, motivo } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }
    
    const updateData: any = {}
    
    if (estado) {
      updateData.estado = estado as EstadoNota
    }
    
    if (observaciones !== undefined) {
      updateData.observaciones = observaciones
    }
    
    if (motivo) {
      updateData.motivo = motivo
    }
    
    const notaDebito = await db.notaDebito.update({
      where: { id },
      data: updateData,
      include: {
        cliente: true,
        detalles: true
      }
    })
    
    return NextResponse.json({
      success: true,
      data: notaDebito
    })
  } catch (error) {
    console.error('Error updating nota de débito:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar nota de débito' },
      { status: 500 }
    )
  }
}

// DELETE - Delete nota de débito
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
    
    // Verificar si la nota se puede eliminar (solo si está EMITIDA)
    const notaDebito = await db.notaDebito.findUnique({
      where: { id }
    })
    
    if (!notaDebito) {
      return NextResponse.json(
        { success: false, error: 'Nota de débito no encontrada' },
        { status: 404 }
      )
    }
    
    if (notaDebito.estado === 'APLICADA') {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar una nota de débito aplicada' },
        { status: 400 }
      )
    }
    
    await db.notaDebito.delete({
      where: { id }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Nota de débito eliminada correctamente'
    })
  } catch (error) {
    console.error('Error deleting nota de débito:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar nota de débito' },
      { status: 500 }
    )
  }
}
