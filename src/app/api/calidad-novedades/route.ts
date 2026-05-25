import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar novedades con filtros
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const usuarioId = searchParams.get('usuarioId')
    const tipo = searchParams.get('tipo')
    const estado = searchParams.get('estado')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const pendientes = searchParams.get('pendientes')

    const where: Record<string, unknown> = {}

    if (usuarioId) {
      where.usuarioId = usuarioId
    }
    if (tipo && tipo !== 'TODOS') {
      where.tipo = tipo
    }
    if (estado && estado !== 'TODOS') {
      where.estado = estado
    }
    if (fechaDesde || fechaHasta) {
      const fechaFilter: Record<string, Date> = {}
      if (fechaDesde) {
        fechaFilter.gte = new Date(fechaDesde)
      }
      if (fechaHasta) {
        const hasta = new Date(fechaHasta)
        hasta.setHours(23, 59, 59)
        fechaFilter.lte = hasta
      }
      where.fecha = fechaFilter
    }
    if (pendientes === 'true') {
      where.estado = 'PENDIENTE'
    }

    const novedades = await db.novedadCalidad.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            dni: true,
            area: true,
            tipo: true,
            estado: true
          }
        }
      },
      orderBy: { fecha: 'desc' },
      take: 200
    })

    // Buscar vencimientos próximos (próximos 7 días)
    let vencimientosProximos: typeof novedades = []
    
    const hoy = new Date()
    const en7Dias = new Date()
    en7Dias.setDate(en7Dias.getDate() + 7)

    vencimientosProximos = await db.novedadCalidad.findMany({
      where: {
        fechaVencimiento: {
          gte: hoy,
          lte: en7Dias
        },
        estado: { notIn: ['RESUELTO', 'ANULADO'] }
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            dni: true,
            area: true,
            tipo: true,
            estado: true
          }
        }
      },
      orderBy: { fechaVencimiento: 'asc' },
      take: 20
    })

    return NextResponse.json({
      success: true,
      data: novedades,
      vencimientosProximos
    })

  } catch (error) {
    console.error('[Calidad Novedades API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener novedades' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva novedad
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const data = await request.json()

    // Verificar que el usuario existe
    const usuario = await db.usuarioCalidad.findUnique({
      where: { id: data.usuarioId }
    })

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 400 }
      )
    }

    const novedad = await db.novedadCalidad.create({
      data: {
        id: randomUUID(),
        usuarioId: data.usuarioId,
        tipo: data.tipo,
        titulo: data.titulo,
        descripcion: data.descripcion || null,
        fecha: data.fecha ? new Date(data.fecha) : new Date(),
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
        responsableId: data.responsableId || null,
        responsableNombre: data.responsableNombre || null,
        estado: data.estado || 'PENDIENTE',
        acciones: data.acciones || null,
        adjuntoUrl: data.adjuntoUrl || null,
        observaciones: data.observaciones || null,
        updatedAt: new Date()
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            area: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: novedad
    })

  } catch (error) {
    console.error('[Calidad Novedades API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear novedad' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar novedad
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const data = await request.json()

    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    }

    if (data.tipo !== undefined) updateData.tipo = data.tipo
    if (data.titulo !== undefined) updateData.titulo = data.titulo
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion || null
    if (data.fecha !== undefined) updateData.fecha = new Date(data.fecha)
    if (data.fechaVencimiento !== undefined) updateData.fechaVencimiento = data.fechaVencimiento ? new Date(data.fechaVencimiento) : null
    if (data.responsableId !== undefined) updateData.responsableId = data.responsableId || null
    if (data.responsableNombre !== undefined) updateData.responsableNombre = data.responsableNombre || null
    if (data.estado !== undefined) {
      updateData.estado = data.estado
      if (data.estado === 'RESUELTO') {
        updateData.fechaResolucion = new Date()
        updateData.resueltoPor = data.resueltoPor || data.responsableNombre || null
      }
    }
    if (data.acciones !== undefined) updateData.acciones = data.acciones || null
    if (data.adjuntoUrl !== undefined) updateData.adjuntoUrl = data.adjuntoUrl || null
    if (data.observaciones !== undefined) updateData.observaciones = data.observaciones || null

    const novedad = await db.novedadCalidad.update({
      where: { id: data.id },
      data: updateData,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            area: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: novedad
    })

  } catch (error) {
    console.error('[Calidad Novedades API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar novedad' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar novedad
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    await db.novedadCalidad.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Novedad eliminada correctamente'
    })

  } catch (error) {
    console.error('[Calidad Novedades API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar novedad' },
      { status: 500 }
    )
  }
}
