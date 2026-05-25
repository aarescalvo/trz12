import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar todas las terminales
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const terminales = await db.terminal.findMany({
      include: {
        balanza: true,
        impresora: true
      },
      orderBy: { nombre: 'asc' as const }
    })
    
    return NextResponse.json({ success: true, data: terminales })
  } catch (error) {
    console.error('Error fetching terminales:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener terminales' }, { status: 500 })
  }
}

// POST - Crear nueva terminal
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const data = await request.json()
    
    const terminal = await db.terminal.create({
      data: {
        id: randomUUID(),
        nombre: data.nombre,
        ubicacion: data.ubicacion,
        balanzaId: data.balanzaId || null,
        impresoraId: data.impresoraId || null,
        activa: data.activa ?? true,
        observaciones: data.observaciones,
        updatedAt: new Date()
      },
      include: {
        balanza: true,
        impresora: true
      }
    })
    
    return NextResponse.json({ success: true, data: terminal })
  } catch (error) {
    console.error('Error creating terminal:', error)
    return NextResponse.json({ success: false, error: 'Error al crear terminal' }, { status: 500 })
  }
}

// PUT - Actualizar terminal
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const data = await request.json()
    
    const terminal = await db.terminal.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        ubicacion: data.ubicacion,
        balanzaId: data.balanzaId || null,
        impresoraId: data.impresoraId || null,
        activa: data.activa,
        observaciones: data.observaciones,
        updatedAt: new Date()
      },
      include: {
        balanza: true,
        impresora: true
      }
    })
    
    return NextResponse.json({ success: true, data: terminal })
  } catch (error) {
    console.error('Error updating terminal:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar terminal' }, { status: 500 })
  }
}

// DELETE - Eliminar terminal
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }
    
    await db.terminal.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting terminal:', error)
    return NextResponse.json({ success: false, error: 'Error al eliminar terminal' }, { status: 500 })
  }
}
