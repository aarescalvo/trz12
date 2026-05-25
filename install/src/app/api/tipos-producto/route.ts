import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar tipos de producto
export async function GET(request: NextRequest) {
  try {
    const tipos = await db.tipoProducto.findMany({
      orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
      include: {
        categoriaPadre: {
          select: {
            id: true,
            codigo: true,
            nombre: true
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: tipos
    })
  } catch (error) {
    console.error('Error fetching tipos producto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener tipos de producto' },
      { status: 500 }
    )
  }
}

// POST - Crear tipo de producto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      codigo, 
      nombre, 
      categoriaPadreId, 
      tipo, 
      especie, 
      requiereFrio, 
      diasConservacion, 
      temperaturaMax, 
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
    
    // Verificar si ya existe un tipo con el mismo código
    const existing = await db.tipoProducto.findFirst({
      where: { codigo }
    })
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un tipo de producto con ese código' },
        { status: 400 }
      )
    }
    
    const tipoProducto = await db.tipoProducto.create({
      data: {
        codigo,
        nombre,
        categoriaPadreId: categoriaPadreId || null,
        tipo: tipo || 'OTRO',
        especie: especie || null,
        requiereFrio: requiereFrio ?? true,
        diasConservacion: diasConservacion ? parseInt(diasConservacion) : null,
        temperaturaMax: temperaturaMax ? parseFloat(temperaturaMax) : null,
        activo: activo ?? true,
        observaciones: observaciones || null
      },
      include: {
        categoriaPadre: {
          select: {
            id: true,
            codigo: true,
            nombre: true
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: tipoProducto
    })
  } catch (error) {
    console.error('Error creating tipo producto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear tipo de producto' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar tipo de producto
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      id, 
      codigo, 
      nombre, 
      categoriaPadreId, 
      tipo, 
      especie, 
      requiereFrio, 
      diasConservacion, 
      temperaturaMax, 
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
      const existing = await db.tipoProducto.findFirst({
        where: { 
          codigo,
          NOT: { id }
        }
      })
      
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un tipo de producto con ese código' },
          { status: 400 }
        )
      }
      updateData.codigo = codigo
    }
    if (nombre !== undefined) updateData.nombre = nombre
    if (categoriaPadreId !== undefined) updateData.categoriaPadreId = categoriaPadreId || null
    if (tipo !== undefined) updateData.tipo = tipo
    if (especie !== undefined) updateData.especie = especie || null
    if (requiereFrio !== undefined) updateData.requiereFrio = requiereFrio
    if (diasConservacion !== undefined) updateData.diasConservacion = diasConservacion ? parseInt(diasConservacion) : null
    if (temperaturaMax !== undefined) updateData.temperaturaMax = temperaturaMax ? parseFloat(temperaturaMax) : null
    if (activo !== undefined) updateData.activo = activo
    if (observaciones !== undefined) updateData.observaciones = observaciones || null
    
    const tipoProducto = await db.tipoProducto.update({
      where: { id },
      data: updateData,
      include: {
        categoriaPadre: {
          select: {
            id: true,
            codigo: true,
            nombre: true
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: tipoProducto
    })
  } catch (error) {
    console.error('Error updating tipo producto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar tipo de producto' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar tipo de producto
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
    
    // Verificar que no tenga subcategorías
    const subcategorias = await db.tipoProducto.count({
      where: { categoriaPadreId: id }
    })
    
    if (subcategorias > 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar un tipo que tiene subcategorías asociadas' },
        { status: 400 }
      )
    }
    
    await db.tipoProducto.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tipo producto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar tipo de producto' },
      { status: 500 }
    )
  }
}
