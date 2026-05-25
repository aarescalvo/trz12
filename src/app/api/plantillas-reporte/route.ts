import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar plantillas
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')
    
    const where = categoria ? { categoria } : {}
    
    const plantillas = await db.plantillaReporte.findMany({
      where,
      orderBy: { nombre: 'asc' }
    })
    
    // No devolver el contenido del archivo en el listado
    const plantillasSinContenido = plantillas.map(p => ({
      id: p.id,
      nombre: p.nombre,
      codigo: p.codigo,
      descripcion: p.descripcion,
      archivoNombre: p.archivoNombre,
      categoria: p.categoria,
      activo: p.activo,
      hojaDatos: p.hojaDatos,
      filaInicio: p.filaInicio,
      rangoDatos: p.rangoDatos,
      columnas: p.columnas,
      createdAt: p.createdAt
    }))
    
    return NextResponse.json({
      success: true,
      data: plantillasSinContenido
    })
  } catch (error) {
    console.error('Error al listar plantillas:', error)
    return NextResponse.json(
      { success: false, error: 'Error al listar plantillas' },
      { status: 500 }
    )
  }
}

// POST - Crear/actualizar plantilla
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const formData = await request.formData()
    
    const nombre = formData.get('nombre') as string
    const codigo = formData.get('codigo') as string
    const descripcion = formData.get('descripcion') as string || ''
    const categoria = formData.get('categoria') as string || null
    const archivo = formData.get('archivo') as File | null
    
    // Configuración de marcadores
    const hojaDatos = formData.get('hojaDatos') as string || 'Datos'
    const filaInicio = parseInt(formData.get('filaInicio') as string) || 1
    const rangoDatos = formData.get('rangoDatos') as string || null
    const columnas = formData.get('columnas') as string || null
    const marcadores = formData.get('marcadores') as string || null
    
    if (!nombre || !codigo) {
      return NextResponse.json(
        { success: false, error: 'Nombre y código son requeridos' },
        { status: 400 }
      )
    }
    
    if (!archivo) {
      return NextResponse.json(
        { success: false, error: 'Archivo de plantilla requerido' },
        { status: 400 }
      )
    }
    
    // Leer archivo y convertir a base64
    const buffer = await archivo.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    
    // Verificar si ya existe
    const existente = await db.plantillaReporte.findUnique({
      where: { codigo }
    })
    
    let plantilla
    
    if (existente) {
      // Actualizar
      plantilla = await db.plantillaReporte.update({
        where: { codigo },
        data: {
          nombre,
          descripcion,
          categoria,
          archivoNombre: archivo.name,
          archivoContenido: base64,
          hojaDatos,
          filaInicio,
          rangoDatos,
          columnas,
          marcadores
        }
      })
    } else {
      // Crear
      plantilla = await db.plantillaReporte.create({
        data: {
          nombre,
          codigo,
          descripcion,
          categoria,
          archivoNombre: archivo.name,
          archivoContenido: base64,
          hojaDatos,
          filaInicio,
          rangoDatos,
          columnas,
          marcadores
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: plantilla.id,
        nombre: plantilla.nombre,
        codigo: plantilla.codigo
      }
    })
  } catch (error) {
    console.error('Error al guardar plantilla:', error)
    return NextResponse.json(
      { success: false, error: 'Error al guardar plantilla' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar plantilla
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }
    
    await db.plantillaReporte.delete({
      where: { id }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Plantilla eliminada'
    })
  } catch (error) {
    console.error('Error al eliminar plantilla:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar plantilla' },
      { status: 500 }
    )
  }
}
