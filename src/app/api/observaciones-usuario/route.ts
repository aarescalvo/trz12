import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET: Listar observaciones con filtros
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    
    const clienteId = searchParams.get('clienteId')
    const tipo = searchParams.get('tipo')
    const resuelto = searchParams.get('resuelto')

    // Construir filtros
    const where: any = {}
    
    if (clienteId) {
      where.clienteId = clienteId
    }
    
    if (tipo && ['NOTA', 'RECLAMO', 'RECORDATORIO', 'INCIDENTE'].includes(tipo)) {
      where.tipo = tipo
    }
    
    if (resuelto !== null) {
      where.resuelto = resuelto === 'true'
    }

    const observaciones = await db.observacionUsuario.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            cuit: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: observaciones
    })
  } catch (error) {
    console.error('Error al obtener observaciones:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener observaciones' },
      { status: 500 }
    )
  }
}

// POST: Crear nueva observación
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const body = await request.json()
    
    const {
      clienteId,
      tipo,
      observacion,
      fechaSeguimiento,
      operadorId
    } = body

    // Validaciones
    if (!clienteId) {
      return NextResponse.json(
        { success: false, error: 'El cliente es requerido' },
        { status: 400 }
      )
    }

    if (!observacion || observacion.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'La observación es requerida' },
        { status: 400 }
      )
    }

    // Verificar que el cliente existe
    const cliente = await db.cliente.findUnique({
      where: { id: clienteId }
    })

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    const nuevaObservacion = await db.observacionUsuario.create({
      data: {
        clienteId,
        tipo: tipo || 'NOTA',
        observacion: observacion.trim(),
        fechaSeguimiento: fechaSeguimiento ? new Date(fechaSeguimiento) : null,
        resuelto: false,
        operadorId
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
      data: nuevaObservacion,
      message: 'Observación creada correctamente'
    })
  } catch (error) {
    console.error('Error al crear observación:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear observación' },
      { status: 500 }
    )
  }
}

// PUT: Actualizar observación (incluyendo marcar como resuelta)
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const body = await request.json()
    
    const {
      id,
      tipo,
      observacion,
      fechaSeguimiento,
      resuelto,
      resolucion,
      fechaResolucion,
      operadorId
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de observación requerido' },
        { status: 400 }
      )
    }

    // Verificar que la observación existe
    const observacionExistente = await db.observacionUsuario.findUnique({
      where: { id }
    })

    if (!observacionExistente) {
      return NextResponse.json(
        { success: false, error: 'Observación no encontrada' },
        { status: 404 }
      )
    }

    // Construir datos a actualizar
    const datosActualizacion: any = {}

    if (tipo && ['NOTA', 'RECLAMO', 'RECORDATORIO', 'INCIDENTE'].includes(tipo)) {
      datosActualizacion.tipo = tipo
    }

    if (observacion !== undefined) {
      datosActualizacion.observacion = observacion.trim()
    }

    if (fechaSeguimiento !== undefined) {
      datosActualizacion.fechaSeguimiento = fechaSeguimiento ? new Date(fechaSeguimiento) : null
    }

    // Manejar resolución
    if (resuelto !== undefined) {
      datosActualizacion.resuelto = resuelto
      
      if (resuelto && !observacionExistente.resuelto) {
        // Si se está marcando como resuelto
        datosActualizacion.fechaResolucion = fechaResolucion ? new Date(fechaResolucion) : new Date()
        if (resolucion) {
          datosActualizacion.resolucion = resolucion.trim()
        }
      } else if (!resuelto) {
        // Si se está desmarcando como resuelto
        datosActualizacion.fechaResolucion = null
        datosActualizacion.resolucion = null
      }
    }

    if (resolucion !== undefined && resuelto) {
      datosActualizacion.resolucion = resolucion.trim()
    }

    const observacionActualizada = await db.observacionUsuario.update({
      where: { id },
      data: datosActualizacion,
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
      data: observacionActualizada,
      message: 'Observación actualizada correctamente'
    })
  } catch (error) {
    console.error('Error al actualizar observación:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar observación' },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar observación
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de observación requerido' },
        { status: 400 }
      )
    }

    // Verificar que la observación existe
    const observacion = await db.observacionUsuario.findUnique({
      where: { id }
    })

    if (!observacion) {
      return NextResponse.json(
        { success: false, error: 'Observación no encontrada' },
        { status: 404 }
      )
    }

    await db.observacionUsuario.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Observación eliminada correctamente'
    })
  } catch (error) {
    console.error('Error al eliminar observación:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar observación' },
      { status: 500 }
    )
  }
}
