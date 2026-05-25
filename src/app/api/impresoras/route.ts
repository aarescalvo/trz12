import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar todas las impresoras
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const impresoras = await db.impresora.findMany({
      orderBy: { nombre: 'asc' }
    })
    
    return NextResponse.json({ success: true, data: impresoras })
  } catch (error) {
    console.error('Error fetching impresoras:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener impresoras' }, { status: 500 })
  }
}

// POST - Crear nueva impresora
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const data = await request.json()
    
    // Si es predeterminada, quitar predeterminada de las demás
    if (data.predeterminada) {
      await db.impresora.updateMany({
        where: { tipo: data.tipo, predeterminada: true },
        data: { predeterminada: false }
      })
    }
    
    const impresora = await db.impresora.create({
      data: {
        id: randomUUID(),
        nombre: data.nombre,
        tipo: data.tipo,
        marca: data.marca,
        modelo: data.modelo,
        puerto: data.puerto || 'USB',
        direccionIP: data.direccionIP,
        anchoEtiqueta: data.anchoEtiqueta || 80,
        altoEtiqueta: data.altoEtiqueta || 50,
        dpi: data.dpi || 203,
        activa: data.activa ?? true,
        predeterminada: data.predeterminada ?? false,
        observaciones: data.observaciones,
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({ success: true, data: impresora })
  } catch (error) {
    console.error('Error creating impresora:', error)
    return NextResponse.json({ success: false, error: 'Error al crear impresora' }, { status: 500 })
  }
}

// PUT - Actualizar impresora
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const data = await request.json()
    
    // Si es predeterminada, quitar predeterminada de las demás del mismo tipo
    if (data.predeterminada) {
      await db.impresora.updateMany({
        where: { tipo: data.tipo, predeterminada: true, NOT: { id: data.id } },
        data: { predeterminada: false }
      })
    }
    
    const impresora = await db.impresora.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        tipo: data.tipo,
        marca: data.marca,
        modelo: data.modelo,
        puerto: data.puerto,
        direccionIP: data.direccionIP,
        anchoEtiqueta: data.anchoEtiqueta,
        altoEtiqueta: data.altoEtiqueta,
        dpi: data.dpi,
        activa: data.activa,
        predeterminada: data.predeterminada,
        observaciones: data.observaciones,
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({ success: true, data: impresora })
  } catch (error) {
    console.error('Error updating impresora:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar impresora' }, { status: 500 })
  }
}

// DELETE - Eliminar impresora
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }
    
    // Verificar si está asignada a una terminal
    const terminal = await db.terminal.findFirst({
      where: { impresoraId: id }
    })
    
    if (terminal) {
      return NextResponse.json({ 
        success: false, 
        error: `No se puede eliminar. Está asignada a la terminal: ${terminal.nombre}` 
      }, { status: 400 })
    }
    
    await db.impresora.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting impresora:', error)
    return NextResponse.json({ success: false, error: 'Error al eliminar impresora' }, { status: 500 })
  }
}
