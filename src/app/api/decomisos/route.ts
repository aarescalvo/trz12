import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TipoDecomiso } from '@prisma/client'

// GET - Fetch decomisos with optional filters
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')
    const garron = searchParams.get('garron')
    const tipo = searchParams.get('tipo') as TipoDecomiso | null

    // Build filter conditions
    const where: Record<string, unknown> = {}
    
    if (garron) {
      where.garron = parseInt(garron, 10)
    }
    
    if (tipo && (tipo === 'TOTAL' || tipo === 'PARCIAL')) {
      where.tipo = tipo
    }
    
    if (fecha) {
      // Filter by date (YYYY-MM-DD format)
      const fechaInicio = new Date(fecha)
      fechaInicio.setHours(0, 0, 0, 0)
      const fechaFin = new Date(fecha)
      fechaFin.setHours(23, 59, 59, 999)
      
      where.fecha = {
        gte: fechaInicio,
        lte: fechaFin
      }
    }

    const decomisos = await db.decomiso.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: {
        romaneo: {
          select: {
            garron: true,
            tropaCodigo: true,
            pesoTotal: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: decomisos.map(d => ({
        id: d.id,
        garron: d.garron,
        tropaCodigo: d.tropaCodigo,
        tipo: d.tipo,
        parte: d.parte,
        motivo: d.motivo,
        peso: d.peso,
        mediaResId: d.mediaResId,
        romaneoId: d.romaneoId,
        operadorId: d.operadorId,
        observaciones: d.observaciones,
        fecha: d.fecha,
        romaneo: d.romaneo
      }))
    })
  } catch (error) {
    console.error('Error fetching decomisos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener decomisos' },
      { status: 500 }
    )
  }
}

// POST - Create new decomiso
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError

  try {
    const body = await request.json()
    const { 
      garron, 
      tropaCodigo, 
      tipo, 
      parte, 
      motivo, 
      peso, 
      mediaResId, 
      romaneoId, 
      operadorId,
      observaciones 
    } = body

    // Validate required fields
    if (garron === undefined || garron === null) {
      return NextResponse.json(
        { success: false, error: 'El número de garrón es requerido' },
        { status: 400 }
      )
    }

    if (!tipo || (tipo !== 'TOTAL' && tipo !== 'PARCIAL')) {
      return NextResponse.json(
        { success: false, error: 'El tipo de decomiso es requerido (TOTAL o PARCIAL)' },
        { status: 400 }
      )
    }

    if (!motivo) {
      return NextResponse.json(
        { success: false, error: 'El motivo del decomiso es requerido' },
        { status: 400 }
      )
    }

    // For PARCIAL decomisos, parte should be required
    if (tipo === 'PARCIAL' && !parte) {
      return NextResponse.json(
        { success: false, error: 'Para decomisos parciales, la parte afectada es requerida' },
        { status: 400 }
      )
    }

    const decomiso = await db.decomiso.create({
      data: {
        garron: parseInt(garron, 10),
        tropaCodigo: tropaCodigo || null,
        tipo: tipo as TipoDecomiso,
        parte: parte || null,
        motivo,
        peso: peso ? parseFloat(peso) : null,
        mediaResId: mediaResId || null,
        romaneoId: romaneoId || null,
        operadorId: operadorId || null,
        observaciones: observaciones || null
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: decomiso.id,
        garron: decomiso.garron,
        tropaCodigo: decomiso.tropaCodigo,
        tipo: decomiso.tipo,
        parte: decomiso.parte,
        motivo: decomiso.motivo,
        peso: decomiso.peso,
        mediaResId: decomiso.mediaResId,
        romaneoId: decomiso.romaneoId,
        operadorId: decomiso.operadorId,
        observaciones: decomiso.observaciones,
        fecha: decomiso.fecha
      },
      message: 'Decomiso registrado exitosamente'
    })
  } catch (error) {
    console.error('Error creating decomiso:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear decomiso' },
      { status: 500 }
    )
  }
}

// PUT - Update decomiso
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError

  try {
    const body = await request.json()
    const { 
      id, 
      garron, 
      tropaCodigo, 
      tipo, 
      parte, 
      motivo, 
      peso, 
      mediaResId, 
      romaneoId, 
      operadorId,
      observaciones 
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    // Check if decomiso exists
    const existingDecomiso = await db.decomiso.findUnique({
      where: { id }
    })

    if (!existingDecomiso) {
      return NextResponse.json(
        { success: false, error: 'Decomiso no encontrado' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (garron !== undefined) updateData.garron = parseInt(garron, 10)
    if (tropaCodigo !== undefined) updateData.tropaCodigo = tropaCodigo || null
    if (tipo !== undefined) {
      if (tipo !== 'TOTAL' && tipo !== 'PARCIAL') {
        return NextResponse.json(
          { success: false, error: 'Tipo de decomiso inválido (debe ser TOTAL o PARCIAL)' },
          { status: 400 }
        )
      }
      updateData.tipo = tipo as TipoDecomiso
    }
    if (parte !== undefined) updateData.parte = parte || null
    if (motivo !== undefined) updateData.motivo = motivo
    if (peso !== undefined) updateData.peso = peso ? parseFloat(peso) : null
    if (mediaResId !== undefined) updateData.mediaResId = mediaResId || null
    if (romaneoId !== undefined) updateData.romaneoId = romaneoId || null
    if (operadorId !== undefined) updateData.operadorId = operadorId || null
    if (observaciones !== undefined) updateData.observaciones = observaciones || null

    const decomiso = await db.decomiso.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: {
        id: decomiso.id,
        garron: decomiso.garron,
        tropaCodigo: decomiso.tropaCodigo,
        tipo: decomiso.tipo,
        parte: decomiso.parte,
        motivo: decomiso.motivo,
        peso: decomiso.peso,
        mediaResId: decomiso.mediaResId,
        romaneoId: decomiso.romaneoId,
        operadorId: decomiso.operadorId,
        observaciones: decomiso.observaciones,
        fecha: decomiso.fecha
      },
      message: 'Decomiso actualizado exitosamente'
    })
  } catch (error) {
    console.error('Error updating decomiso:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar decomiso' },
      { status: 500 }
    )
  }
}

// DELETE - Delete decomiso by id
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
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

    // Check if decomiso exists
    const existingDecomiso = await db.decomiso.findUnique({
      where: { id }
    })

    if (!existingDecomiso) {
      return NextResponse.json(
        { success: false, error: 'Decomiso no encontrado' },
        { status: 404 }
      )
    }

    await db.decomiso.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Decomiso eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error deleting decomiso:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar decomiso' },
      { status: 500 }
    )
  }
}
