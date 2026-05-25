import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Fetch all razas
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const especie = searchParams.get('especie')
    
    const where: Record<string, unknown> = { activo: true }
    if (especie && especie !== 'todos') {
      where.especie = especie.toUpperCase()
    }
    
    const razas = await db.raza.findMany({
      where,
      orderBy: [
        { especie: 'asc' },
        { nombre: 'asc' }
      ]
    })
    
    return NextResponse.json({
      success: true,
      data: razas
    })
  } catch (error) {
    console.error('Error fetching razas:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener razas' },
      { status: 500 }
    )
  }
}

// POST - Create new raza
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const body = await request.json()
    const { nombre, especie, observaciones } = body
    
    if (!nombre || !especie) {
      return NextResponse.json(
        { success: false, error: 'Nombre y especie son requeridos' },
        { status: 400 }
      )
    }
    
    // Verificar que no exista una raza con el mismo nombre para esa especie
    const existente = await db.raza.findFirst({
      where: {
        nombre: { equals: nombre, mode: 'insensitive' },
        especie
      }
    })
    
    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una raza con ese nombre para esta especie' },
        { status: 400 }
      )
    }
    
    const raza = await db.raza.create({
      data: {
        nombre,
        especie,
        observaciones: observaciones || null,
        activo: true
      }
    })
    
    return NextResponse.json({
      success: true,
      data: raza
    })
  } catch (error) {
    console.error('Error creating raza:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear raza' },
      { status: 500 }
    )
  }
}

// PUT - Update raza
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, nombre, especie, observaciones, activo } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }
    
    const updateData: Record<string, unknown> = {}
    if (nombre !== undefined) updateData.nombre = nombre
    if (especie !== undefined) updateData.especie = especie
    if (observaciones !== undefined) updateData.observaciones = observaciones
    if (activo !== undefined) updateData.activo = activo
    
    const raza = await db.raza.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json({
      success: true,
      data: raza
    })
  } catch (error) {
    console.error('Error updating raza:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar raza' },
      { status: 500 }
    )
  }
}

// DELETE - Delete raza (soft delete)
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
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
    
    // Soft delete - marcar como inactivo
    await db.raza.update({
      where: { id },
      data: { activo: false }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Raza eliminada'
    })
  } catch (error) {
    console.error('Error deleting raza:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar raza' },
      { status: 500 }
    )
  }
}
