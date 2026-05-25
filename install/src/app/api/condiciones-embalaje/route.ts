import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar condiciones de embalaje
export async function GET(request: NextRequest) {
  try {
    const condiciones = await db.condicionEmbalaje.findMany({
      orderBy: [{ tipoEmpaque: 'asc' }, { nombre: 'asc' }]
    })
    
    return NextResponse.json({
      success: true,
      data: condiciones
    })
  } catch (error) {
    console.error('Error fetching condiciones embalaje:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener condiciones de embalaje' },
      { status: 500 }
    )
  }
}

// POST - Crear condición de embalaje
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      codigo, 
      nombre, 
      temperaturaMin, 
      temperaturaMax, 
      humedadMin, 
      humedadMax, 
      tipoEmpaque, 
      materialEmpaque, 
      requiereFrio, 
      requiereCongelado, 
      diasValidez, 
      requiereRefrigeracion, 
      activo, 
      observaciones 
    } = body
    
    if (!codigo) {
      return NextResponse.json(
        { success: false, error: 'El código es requerido' },
        { status: 400 }
      )
    }
    
    if (!nombre) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }
    
    // Verificar si ya existe una condición con el mismo código
    const existing = await db.condicionEmbalaje.findFirst({
      where: { codigo }
    })
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una condición de embalaje con ese código' },
        { status: 400 }
      )
    }
    
    const condicion = await db.condicionEmbalaje.create({
      data: {
        codigo,
        nombre,
        temperaturaMin: temperaturaMin ? parseFloat(temperaturaMin) : null,
        temperaturaMax: temperaturaMax ? parseFloat(temperaturaMax) : null,
        humedadMin: humedadMin ? parseFloat(humedadMin) : null,
        humedadMax: humedadMax ? parseFloat(humedadMax) : null,
        tipoEmpaque: tipoEmpaque || 'CAJA',
        materialEmpaque: materialEmpaque || null,
        requiereFrio: requiereFrio ?? true,
        requiereCongelado: requiereCongelado ?? false,
        diasValidez: diasValidez ? parseInt(diasValidez) : null,
        requiereRefrigeracion: requiereRefrigeracion ?? true,
        activo: activo ?? true,
        observaciones: observaciones || null
      }
    })
    
    return NextResponse.json({
      success: true,
      data: condicion
    })
  } catch (error) {
    console.error('Error creating condición embalaje:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear condición de embalaje' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar condición de embalaje
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      id, 
      codigo, 
      nombre, 
      temperaturaMin, 
      temperaturaMax, 
      humedadMin, 
      humedadMax, 
      tipoEmpaque, 
      materialEmpaque, 
      requiereFrio, 
      requiereCongelado, 
      diasValidez, 
      requiereRefrigeracion, 
      activo, 
      observaciones 
    } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }
    
    const updateData: Record<string, unknown> = {}
    
    if (codigo !== undefined) {
      // Verificar que el código no esté duplicado
      const existing = await db.condicionEmbalaje.findFirst({
        where: { 
          codigo,
          NOT: { id }
        }
      })
      
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Ya existe una condición de embalaje con ese código' },
          { status: 400 }
        )
      }
      updateData.codigo = codigo
    }
    if (nombre !== undefined) updateData.nombre = nombre
    if (temperaturaMin !== undefined) updateData.temperaturaMin = temperaturaMin ? parseFloat(temperaturaMin) : null
    if (temperaturaMax !== undefined) updateData.temperaturaMax = temperaturaMax ? parseFloat(temperaturaMax) : null
    if (humedadMin !== undefined) updateData.humedadMin = humedadMin ? parseFloat(humedadMin) : null
    if (humedadMax !== undefined) updateData.humedadMax = humedadMax ? parseFloat(humedadMax) : null
    if (tipoEmpaque !== undefined) updateData.tipoEmpaque = tipoEmpaque
    if (materialEmpaque !== undefined) updateData.materialEmpaque = materialEmpaque || null
    if (requiereFrio !== undefined) updateData.requiereFrio = requiereFrio
    if (requiereCongelado !== undefined) updateData.requiereCongelado = requiereCongelado
    if (diasValidez !== undefined) updateData.diasValidez = diasValidez ? parseInt(diasValidez) : null
    if (requiereRefrigeracion !== undefined) updateData.requiereRefrigeracion = requiereRefrigeracion
    if (activo !== undefined) updateData.activo = activo
    if (observaciones !== undefined) updateData.observaciones = observaciones || null
    
    const condicion = await db.condicionEmbalaje.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json({
      success: true,
      data: condicion
    })
  } catch (error) {
    console.error('Error updating condición embalaje:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar condición de embalaje' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar condición de embalaje
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
    
    await db.condicionEmbalaje.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting condición embalaje:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar condición de embalaje' },
      { status: 500 }
    )
  }
}
