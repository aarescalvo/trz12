import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Fetch all tipos de trabajo
// Optional query param: ?activo=true to filter only active tipos
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const activoParam = searchParams.get('activo')
    
    const where = activoParam === 'true' 
      ? { activo: true } 
      : {}
    
    const tiposTrabajo = await db.tipoTrabajo.findMany({
      where,
      orderBy: { codigo: 'asc' }
    })
    
    return NextResponse.json({
      success: true,
      data: tiposTrabajo.map(t => ({
        id: t.id,
        codigo: t.codigo,
        nombre: t.nombre,
        descripcion: t.descripcion,
        esDefault: t.esDefault,
        activo: t.activo,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      }))
    })
  } catch (error) {
    console.error('Error fetching tipos de trabajo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener tipos de trabajo' },
      { status: 500 }
    )
  }
}

// POST - Create new tipo de trabajo
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const body = await request.json()
    const { codigo, nombre, descripcion, esDefault } = body
    
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
    
    // Verificar que no exista un tipo de trabajo con el mismo código
    const existente = await db.tipoTrabajo.findUnique({
      where: { codigo }
    })
    
    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un tipo de trabajo con ese código' },
        { status: 400 }
      )
    }
    
    // Si este tipo será el default, quitar el default de los demás
    if (esDefault) {
      await db.tipoTrabajo.updateMany({
        where: { esDefault: true },
        data: { esDefault: false }
      })
    }
    
    const tipoTrabajo = await db.tipoTrabajo.create({
      data: {
        codigo,
        nombre,
        descripcion: descripcion || null,
        esDefault: esDefault || false,
        activo: true
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: tipoTrabajo.id,
        codigo: tipoTrabajo.codigo,
        nombre: tipoTrabajo.nombre,
        descripcion: tipoTrabajo.descripcion,
        esDefault: tipoTrabajo.esDefault,
        activo: tipoTrabajo.activo,
        createdAt: tipoTrabajo.createdAt,
        updatedAt: tipoTrabajo.updatedAt
      }
    })
  } catch (error) {
    console.error('Error creating tipo de trabajo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear tipo de trabajo' },
      { status: 500 }
    )
  }
}

// PUT - Update tipo de trabajo
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, codigo, nombre, descripcion, esDefault, activo } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }
    
    // Verificar que el tipo de trabajo existe
    const existente = await db.tipoTrabajo.findUnique({
      where: { id }
    })
    
    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Tipo de trabajo no encontrado' },
        { status: 404 }
      )
    }
    
    // Si se cambia el código, verificar que no exista otro con el mismo código
    if (codigo && codigo !== existente.codigo) {
      const codigoDuplicado = await db.tipoTrabajo.findUnique({
        where: { codigo }
      })
      
      if (codigoDuplicado) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un tipo de trabajo con ese código' },
          { status: 400 }
        )
      }
    }
    
    // Si este tipo será el default, quitar el default de los demás
    if (esDefault) {
      await db.tipoTrabajo.updateMany({
        where: { 
          esDefault: true,
          id: { not: id }
        },
        data: { esDefault: false }
      })
    }
    
    const updateData: Record<string, unknown> = {}
    if (codigo !== undefined) updateData.codigo = codigo
    if (nombre !== undefined) updateData.nombre = nombre
    if (descripcion !== undefined) updateData.descripcion = descripcion
    if (esDefault !== undefined) updateData.esDefault = esDefault
    if (activo !== undefined) updateData.activo = activo
    
    const tipoTrabajo = await db.tipoTrabajo.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: tipoTrabajo.id,
        codigo: tipoTrabajo.codigo,
        nombre: tipoTrabajo.nombre,
        descripcion: tipoTrabajo.descripcion,
        esDefault: tipoTrabajo.esDefault,
        activo: tipoTrabajo.activo,
        createdAt: tipoTrabajo.createdAt,
        updatedAt: tipoTrabajo.updatedAt
      }
    })
  } catch (error) {
    console.error('Error updating tipo de trabajo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar tipo de trabajo' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete tipo de trabajo (set activo=false)
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
    
    // Verificar que el tipo de trabajo existe
    const existente = await db.tipoTrabajo.findUnique({
      where: { id }
    })
    
    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Tipo de trabajo no encontrado' },
        { status: 404 }
      )
    }
    
    // Si es el default, no permitir eliminar
    if (existente.esDefault) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar el tipo de trabajo por defecto. Asigne otro como default primero.' },
        { status: 400 }
      )
    }
    
    // Soft delete - marcar como inactivo
    await db.tipoTrabajo.update({
      where: { id },
      data: { activo: false }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Tipo de trabajo eliminado'
    })
  } catch (error) {
    console.error('Error deleting tipo de trabajo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar tipo de trabajo' },
      { status: 500 }
    )
  }
}
