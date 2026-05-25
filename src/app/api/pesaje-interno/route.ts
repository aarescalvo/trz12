import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch pesajes internos con filtros
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedePesajeIndividual')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const tropaCodigo = searchParams.get('tropaCodigo')
    const fecha = searchParams.get('fecha')
    
    const where: Record<string, unknown> = {}
    
    if (tropaCodigo) {
      where.tropaCodigo = tropaCodigo
    }
    
    if (fecha) {
      const fechaInicio = new Date(fecha)
      fechaInicio.setHours(0, 0, 0, 0)
      const fechaFin = new Date(fecha)
      fechaFin.setHours(23, 59, 59, 999)
      where.fecha = {
        gte: fechaInicio,
        lte: fechaFin
      }
    }
    
    const pesajes = await db.pesajeInterno.findMany({
      where,
      orderBy: { fecha: 'desc' }
    })
    
    return NextResponse.json({
      success: true,
      data: pesajes.map(p => ({
        id: p.id,
        tropaCodigo: p.tropaCodigo,
        fecha: p.fecha,
        grasa: p.grasa,
        lavadito: p.lavadito,
        bolsaAzul: p.bolsaAzul,
        hueso: p.hueso,
        grasaBascula: p.grasaBascula,
        despojo: p.despojo,
        operadorId: p.operadorId,
        observaciones: p.observaciones,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }))
    })
  } catch (error) {
    console.error('Error fetching pesajes internos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener pesajes internos' },
      { status: 500 }
    )
  }
}

// POST - Create new pesaje interno
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedePesajeIndividual')
  if (authError) return authError

  try {
    const body = await request.json()
    const { 
      tropaCodigo, 
      fecha,
      grasa, 
      lavadito, 
      bolsaAzul,
      hueso,
      grasaBascula,
      despojo,
      operadorId,
      observaciones 
    } = body
    
    if (!tropaCodigo) {
      return NextResponse.json(
        { success: false, error: 'El código de tropa es requerido' },
        { status: 400 }
      )
    }
    
    // Verificar si ya existe un pesaje para esta tropa
    const existente = await db.pesajeInterno.findFirst({
      where: { tropaCodigo }
    })
    
    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un pesaje interno para esta tropa. Use PUT para actualizar.' },
        { status: 400 }
      )
    }
    
    const pesaje = await db.pesajeInterno.create({
      data: {
        tropaCodigo,
        fecha: fecha ? new Date(fecha) : new Date(),
        grasa: parseFloat(grasa) || 0,
        lavadito: parseFloat(lavadito) || 0,
        bolsaAzul: parseFloat(bolsaAzul) || 0,
        hueso: parseFloat(hueso) || 0,
        grasaBascula: parseFloat(grasaBascula) || 0,
        despojo: parseFloat(despojo) || 0,
        operadorId: operadorId || null,
        observaciones: observaciones || null
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: pesaje.id,
        tropaCodigo: pesaje.tropaCodigo,
        fecha: pesaje.fecha,
        grasa: pesaje.grasa,
        lavadito: pesaje.lavadito,
        bolsaAzul: pesaje.bolsaAzul,
        hueso: pesaje.hueso,
        grasaBascula: pesaje.grasaBascula,
        despojo: pesaje.despojo,
        operadorId: pesaje.operadorId,
        observaciones: pesaje.observaciones,
        createdAt: pesaje.createdAt,
        updatedAt: pesaje.updatedAt
      }
    })
  } catch (error) {
    console.error('Error creating pesaje interno:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear pesaje interno' },
      { status: 500 }
    )
  }
}

// PUT - Update pesaje interno
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedePesajeIndividual')
  if (authError) return authError

  try {
    const body = await request.json()
    const { 
      id,
      tropaCodigo, 
      fecha,
      grasa, 
      lavadito, 
      bolsaAzul,
      hueso,
      grasaBascula,
      despojo,
      operadorId,
      observaciones 
    } = body
    
    if (!id && !tropaCodigo) {
      return NextResponse.json(
        { success: false, error: 'ID o código de tropa es requerido' },
        { status: 400 }
      )
    }
    
    // Buscar por ID o por tropaCodigo
    let existente: any = null
    if (id) {
      existente = await db.pesajeInterno.findUnique({
        where: { id }
      })
    } else if (tropaCodigo) {
      existente = await db.pesajeInterno.findFirst({
        where: { tropaCodigo }
      })
    }
    
    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Pesaje interno no encontrado' },
        { status: 404 }
      )
    }
    
    const updateData: Record<string, unknown> = {}
    if (tropaCodigo !== undefined) updateData.tropaCodigo = tropaCodigo
    if (fecha !== undefined) updateData.fecha = new Date(fecha)
    if (grasa !== undefined) updateData.grasa = parseFloat(grasa) || 0
    if (lavadito !== undefined) updateData.lavadito = parseFloat(lavadito) || 0
    if (bolsaAzul !== undefined) updateData.bolsaAzul = parseFloat(bolsaAzul) || 0
    if (hueso !== undefined) updateData.hueso = parseFloat(hueso) || 0
    if (grasaBascula !== undefined) updateData.grasaBascula = parseFloat(grasaBascula) || 0
    if (despojo !== undefined) updateData.despojo = parseFloat(despojo) || 0
    if (operadorId !== undefined) updateData.operadorId = operadorId
    if (observaciones !== undefined) updateData.observaciones = observaciones
    
    const pesaje = await db.pesajeInterno.update({
      where: { id: existente.id },
      data: updateData as Record<string, unknown>
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: pesaje.id,
        tropaCodigo: pesaje.tropaCodigo,
        fecha: pesaje.fecha,
        grasa: pesaje.grasa,
        lavadito: pesaje.lavadito,
        bolsaAzul: pesaje.bolsaAzul,
        hueso: pesaje.hueso,
        grasaBascula: pesaje.grasaBascula,
        despojo: pesaje.despojo,
        operadorId: pesaje.operadorId,
        observaciones: pesaje.observaciones,
        createdAt: pesaje.createdAt,
        updatedAt: pesaje.updatedAt
      }
    })
  } catch (error) {
    console.error('Error updating pesaje interno:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar pesaje interno' },
      { status: 500 }
    )
  }
}

// DELETE - Delete pesaje interno
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedePesajeIndividual')
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
    
    // Verificar que el pesaje existe
    const existente = await db.pesajeInterno.findUnique({
      where: { id }
    })
    
    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Pesaje interno no encontrado' },
        { status: 404 }
      )
    }
    
    await db.pesajeInterno.delete({
      where: { id }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Pesaje interno eliminado'
    })
  } catch (error) {
    console.error('Error deleting pesaje interno:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar pesaje interno' },
      { status: 500 }
    )
  }
}
