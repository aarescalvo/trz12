import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

// GET - Listar reclamos con filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')
    const tipo = searchParams.get('tipo')
    const estado = searchParams.get('estado')
    const prioridad = searchParams.get('prioridad')
    const pendientes = searchParams.get('pendientes')
    const busqueda = searchParams.get('busqueda')

    const where: Record<string, unknown> = {}

    if (clienteId) {
      where.clienteId = clienteId
    }
    if (tipo && tipo !== 'TODOS') {
      where.tipo = tipo
    }
    if (estado && estado !== 'TODOS') {
      where.estado = estado
    }
    if (prioridad && prioridad !== 'TODOS') {
      where.prioridad = prioridad
    }
    if (pendientes === 'true') {
      where.estado = { in: ['PENDIENTE', 'EN_REVISION'] }
    }
    if (busqueda) {
      where.OR = [
        { titulo: { contains: busqueda } },
        { descripcion: { contains: busqueda } },
        { cliente: { nombre: { contains: busqueda } } }
      ]
    }

    const reclamos = await db.reclamoCliente.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            cuit: true,
            telefono: true,
            email: true,
            esUsuarioFaena: true
          }
        }
      },
      orderBy: [
        { prioridad: 'desc' },
        { fecha: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: reclamos
    })

  } catch (error) {
    console.error('[Calidad Reclamos API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener reclamos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo reclamo
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.clienteId || !data.titulo || !data.tipo) {
      return NextResponse.json(
        { success: false, error: 'Cliente, título y tipo son requeridos' },
        { status: 400 }
      )
    }

    const reclamo = await db.reclamoCliente.create({
      data: {
        id: randomUUID(),
        clienteId: data.clienteId,
        tipo: data.tipo,
        titulo: data.titulo,
        descripcion: data.descripcion || null,
        fecha: data.fecha ? new Date(data.fecha) : new Date(),
        tropaCodigo: data.tropaCodigo || null,
        registradoPor: data.registradoPor || null,
        estado: data.estado || 'PENDIENTE',
        prioridad: data.prioridad || 'NORMAL',
        respuesta: data.respuesta || null,
        fechaRespuesta: data.fechaRespuesta ? new Date(data.fechaRespuesta) : null,
        respondidoPor: data.respondidoPor || null,
        seguimiento: data.seguimiento || null,
        adjuntoUrl: data.adjuntoUrl || null,
        observaciones: data.observaciones || null,
        updatedAt: new Date()
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            cuit: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: reclamo
    })

  } catch (error) {
    console.error('[Calidad Reclamos API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear reclamo' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar reclamo (responder, resolver, etc.)
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    }

    // Campos actualizables
    if (data.tipo) updateData.tipo = data.tipo
    if (data.titulo) updateData.titulo = data.titulo
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion || null
    if (data.tropaCodigo !== undefined) updateData.tropaCodigo = data.tropaCodigo || null
    if (data.estado) updateData.estado = data.estado
    if (data.prioridad) updateData.prioridad = data.prioridad
    if (data.seguimiento !== undefined) updateData.seguimiento = data.seguimiento || null
    if (data.observaciones !== undefined) updateData.observaciones = data.observaciones || null

    // Respuesta al cliente
    if (data.respuesta !== undefined) {
      updateData.respuesta = data.respuesta || null
      updateData.fechaRespuesta = new Date()
      updateData.respondidoPor = data.respondidoPor || null
    }

    // Resolución
    if (data.estado === 'RESUELTO' || data.estado === 'CERRADO') {
      updateData.fechaResolucion = new Date()
      updateData.resueltoPor = data.resueltoPor || null
      updateData.resultado = data.resultado || null
    }

    const reclamo = await db.reclamoCliente.update({
      where: { id: data.id },
      data: updateData,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            cuit: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: reclamo
    })

  } catch (error) {
    console.error('[Calidad Reclamos API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar reclamo' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar reclamo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    await db.reclamoCliente.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Reclamo eliminado correctamente'
    })

  } catch (error) {
    console.error('[Calidad Reclamos API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar reclamo' },
      { status: 500 }
    )
  }
}
