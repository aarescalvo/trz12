import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Fetch all articulos
// Optional query param: ?activo=true to filter only active articulos
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const activoParam = searchParams.get('activo')
    const categoriaParam = searchParams.get('categoria')
    const especieParam = searchParams.get('especie')
    
    const where: Record<string, unknown> = {}
    
    if (activoParam === 'true') {
      where.activo = true
    }
    
    if (categoriaParam) {
      where.categoria = categoriaParam
    }
    
    if (especieParam) {
      where.especie = especieParam
    }
    
    const articulos = await db.articulo.findMany({
      where,
      orderBy: { codigo: 'asc' }
    })
    
    return NextResponse.json({
      success: true,
      data: articulos.map(a => ({
        id: a.id,
        codigo: a.codigo,
        nombre: a.nombre,
        categoria: a.categoria,
        especie: a.especie,
        observaciones: a.observaciones,
        activo: a.activo,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
      }))
    })
  } catch (error) {
    console.error('Error fetching articulos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener articulos' },
      { status: 500 }
    )
  }
}

// POST - Create new articulo
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const body = await request.json()
    const { codigo, nombre, categoria, especie, observaciones } = body
    
    // Validar código obligatorio y formato de 3 dígitos
    if (!codigo) {
      return NextResponse.json(
        { success: false, error: 'El código es requerido' },
        { status: 400 }
      )
    }
    
    // Validar que el código tenga formato de 3 dígitos (puede empezar con punto)
    const codigoLimpio = codigo.startsWith('.') ? codigo.substring(1) : codigo
    if (!/^\d{3}$/.test(codigoLimpio)) {
      return NextResponse.json(
        { success: false, error: 'El código debe tener exactamente 3 dígitos (ej: .001, 001, .002, 002)' },
        { status: 400 }
      )
    }
    
    // Normalizar código con punto
    const codigoNormalizado = codigo.startsWith('.') ? codigo : `.${codigo}`
    
    if (!nombre) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }
    
    // Verificar que no exista un articulo con el mismo código
    const existente = await db.articulo.findUnique({
      where: { codigo: codigoNormalizado }
    })
    
    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un articulo con ese código' },
        { status: 400 }
      )
    }
    
    const articulo = await db.articulo.create({
      data: {
        codigo: codigoNormalizado,
        nombre,
        categoria: categoria || null,
        especie: especie || null,
        observaciones: observaciones || null,
        activo: true
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: articulo.id,
        codigo: articulo.codigo,
        nombre: articulo.nombre,
        categoria: articulo.categoria,
        especie: articulo.especie,
        observaciones: articulo.observaciones,
        activo: articulo.activo,
        createdAt: articulo.createdAt,
        updatedAt: articulo.updatedAt
      }
    })
  } catch (error) {
    console.error('Error creating articulo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear articulo' },
      { status: 500 }
    )
  }
}

// PUT - Update articulo
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, codigo, nombre, categoria, especie, observaciones, activo } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }
    
    // Verificar que el articulo existe
    const existente = await db.articulo.findUnique({
      where: { id }
    })
    
    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Articulo no encontrado' },
        { status: 404 }
      )
    }
    
    // Si se cambia el código, validar formato y verificar que no exista otro
    let codigoNormalizado = existente.codigo
    if (codigo && codigo !== existente.codigo) {
      const codigoLimpio = codigo.startsWith('.') ? codigo.substring(1) : codigo
      if (!/^\d{3}$/.test(codigoLimpio)) {
        return NextResponse.json(
          { success: false, error: 'El código debe tener exactamente 3 dígitos' },
          { status: 400 }
        )
      }
      codigoNormalizado = codigo.startsWith('.') ? codigo : `.${codigo}`
      
      const codigoDuplicado = await db.articulo.findUnique({
        where: { codigo: codigoNormalizado }
      })
      
      if (codigoDuplicado) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un articulo con ese código' },
          { status: 400 }
        )
      }
    }
    
    const updateData: Record<string, unknown> = {}
    if (codigo !== undefined) updateData.codigo = codigoNormalizado
    if (nombre !== undefined) updateData.nombre = nombre
    if (categoria !== undefined) updateData.categoria = categoria
    if (especie !== undefined) updateData.especie = especie
    if (observaciones !== undefined) updateData.observaciones = observaciones
    if (activo !== undefined) updateData.activo = activo
    
    const articulo = await db.articulo.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: articulo.id,
        codigo: articulo.codigo,
        nombre: articulo.nombre,
        categoria: articulo.categoria,
        especie: articulo.especie,
        observaciones: articulo.observaciones,
        activo: articulo.activo,
        createdAt: articulo.createdAt,
        updatedAt: articulo.updatedAt
      }
    })
  } catch (error) {
    console.error('Error updating articulo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar articulo' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete articulo (set activo=false)
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
    
    // Verificar que el articulo existe
    const existente = await db.articulo.findUnique({
      where: { id }
    })
    
    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Articulo no encontrado' },
        { status: 404 }
      )
    }
    
    // Soft delete - marcar como inactivo
    await db.articulo.update({
      where: { id },
      data: { activo: false }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Articulo eliminado'
    })
  } catch (error) {
    console.error('Error deleting articulo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar articulo' },
      { status: 500 }
    )
  }
}
