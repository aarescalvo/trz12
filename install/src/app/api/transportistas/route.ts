import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch transportistas
export async function GET() {
  try {
    const transportistas = await db.transportista.findMany({
      orderBy: { nombre: 'asc' }
    })
    
    return NextResponse.json({
      success: true,
      data: transportistas
    })
  } catch (error) {
    console.error('Error fetching transportistas:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener transportistas' },
      { status: 500 }
    )
  }
}

// POST - Create transportista
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, cuit, direccion, telefono } = body
    
    if (!nombre) {
      return NextResponse.json(
        { success: false, error: 'El nombre es obligatorio' },
        { status: 400 }
      )
    }
    
    const transportista = await db.transportista.create({
      data: {
        nombre,
        cuit: cuit || null,
        direccion: direccion || null,
        telefono: telefono || null
      }
    })
    
    return NextResponse.json({
      success: true,
      data: transportista
    })
  } catch (error) {
    console.error('Error creating transportista:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear transportista' },
      { status: 500 }
    )
  }
}

// PUT - Update transportista
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, nombre, cuit, direccion, telefono } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }
    
    const transportista = await db.transportista.update({
      where: { id },
      data: {
        nombre,
        cuit: cuit || null,
        direccion: direccion || null,
        telefono: telefono || null
      }
    })
    
    return NextResponse.json({
      success: true,
      data: transportista
    })
  } catch (error) {
    console.error('Error updating transportista:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar transportista' },
      { status: 500 }
    )
  }
}

// DELETE - Delete transportista
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }
    
    await db.transportista.delete({
      where: { id }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Transportista eliminado'
    })
  } catch (error) {
    console.error('Error deleting transportista:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar transportista' },
      { status: 500 }
    )
  }
}
