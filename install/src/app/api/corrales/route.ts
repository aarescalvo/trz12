import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar corrales
export async function GET(request: NextRequest) {
  try {
    const corrales = await db.corral.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        tropas: {
          where: {
            estado: { in: ['RECIBIDO', 'EN_CORRAL', 'EN_PESAJE', 'PESADO', 'LISTO_FAENA'] }
          },
          select: {
            id: true,
            codigo: true,
            especie: true,
            cantidadCabezas: true,
            estado: true
          }
        }
      }
    })
    
    // Calcular stock actual por corral
    const corralesConStock = corrales.map(corral => {
      const tropasActivas = corral.tropas
      const stockBovinos = tropasActivas
        .filter(t => t.especie === 'BOVINO')
        .reduce((acc, t) => acc + t.cantidadCabezas, 0)
      const stockEquinos = tropasActivas
        .filter(t => t.especie === 'EQUINO')
        .reduce((acc, t) => acc + t.cantidadCabezas, 0)
      
      return {
        id: corral.id,
        nombre: corral.nombre,
        capacidad: corral.capacidad,
        observaciones: corral.observaciones,
        activo: corral.activo,
        stockBovinos,
        stockEquinos,
        stockTotal: stockBovinos + stockEquinos,
        disponible: corral.capacidad - stockBovinos - stockEquinos,
        tropasActivas: tropasActivas.length,
        tropas: tropasActivas
      }
    })
    
    return NextResponse.json({
      success: true,
      data: corralesConStock
    })
  } catch (error) {
    console.error('Error fetching corrales:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener corrales' },
      { status: 500 }
    )
  }
}

// POST - Crear corral
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, capacidad, observaciones } = body
    
    if (!nombre) {
      return NextResponse.json(
        { success: false, error: 'Nombre es requerido' },
        { status: 400 }
      )
    }
    
    // Verificar si ya existe un corral con el mismo nombre
    const existing = await db.corral.findFirst({
      where: { nombre }
    })
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un corral con ese nombre' },
        { status: 400 }
      )
    }
    
    const corral = await db.corral.create({
      data: {
        nombre,
        capacidad: parseInt(capacidad) || 0,
        observaciones: observaciones || null
      }
    })
    
    return NextResponse.json({
      success: true,
      data: corral
    })
  } catch (error) {
    console.error('Error creating corral:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear corral' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar corral
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, nombre, capacidad, observaciones, activo } = body
    
    const updateData: Record<string, unknown> = {}
    
    if (nombre !== undefined) updateData.nombre = nombre
    if (capacidad !== undefined) updateData.capacidad = parseInt(capacidad) || 0
    if (observaciones !== undefined) updateData.observaciones = observaciones || null
    if (activo !== undefined) updateData.activo = activo
    
    const corral = await db.corral.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json({
      success: true,
      data: corral
    })
  } catch (error) {
    console.error('Error updating corral:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar corral' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar corral
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
    
    // Verificar que no tenga tropas activas
    const tropasActivas = await db.tropa.count({
      where: {
        corralId: id,
        estado: { in: ['RECIBIDO', 'EN_CORRAL', 'EN_PESAJE', 'PESADO', 'LISTO_FAENA'] }
      }
    })
    
    if (tropasActivas > 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar un corral con tropas activas' },
        { status: 400 }
      )
    }
    
    await db.corral.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting corral:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar corral' },
      { status: 500 }
    )
  }
}
