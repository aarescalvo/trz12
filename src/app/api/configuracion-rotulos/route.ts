import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener configuraciones de rótulos
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')

    const where: Record<string, unknown> = {}
    if (tipo) where.tipo = tipo

    const rotulos = await db.configuracionRotulo.findMany({
      where,
      orderBy: { tipo: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: rotulos.map(r => ({
        id: r.id,
        tipo: r.tipo,
        nombre: r.nombre,
        ancho: r.ancho,
        alto: r.alto,
        campos: r.campos ? JSON.parse(r.campos) : [],
        incluyeCodigoBarras: r.incluyeCodigoBarras,
        codigoBarrasTipo: r.codigoBarrasTipo,
        codigoBarrasPosicion: r.codigoBarrasPosicion,
        orientacion: r.orientacion,
        margenes: r.margenes ? JSON.parse(r.margenes) : null,
        plantilla: r.plantilla,
        activo: r.activo
      }))
    })
  } catch (error) {
    console.error('Error fetching configuracion rotulos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener configuración de rótulos' },
      { status: 500 }
    )
  }
}

// POST - Crear configuración de rótulo
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const body = await request.json()
    const {
      tipo,
      nombre,
      ancho,
      alto,
      campos,
      incluyeCodigoBarras,
      codigoBarrasTipo,
      codigoBarrasPosicion,
      orientacion,
      margenes,
      plantilla
    } = body

    if (!tipo || !nombre) {
      return NextResponse.json(
        { success: false, error: 'tipo y nombre son requeridos' },
        { status: 400 }
      )
    }

    const rotulo = await db.configuracionRotulo.create({
      data: {
        tipo,
        nombre,
        ancho: ancho || 100,
        alto: alto || 50,
        campos: campos ? JSON.stringify(campos) : null,
        incluyeCodigoBarras: incluyeCodigoBarras ?? true,
        codigoBarrasTipo: codigoBarrasTipo || 'CODE128',
        codigoBarrasPosicion,
        orientacion: orientacion || 'HORIZONTAL',
        margenes: margenes ? JSON.stringify(margenes) : null,
        plantilla
      }
    })

    return NextResponse.json({ success: true, data: rotulo })
  } catch (error) {
    console.error('Error creating configuracion rotulo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear configuración de rótulo' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar configuración de rótulo
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    // Convertir campos JSON
    const data: Record<string, unknown> = { ...updateData }
    if (data.campos !== undefined) data.campos = JSON.stringify(data.campos)
    if (data.margenes !== undefined) data.margenes = JSON.stringify(data.margenes)

    const rotulo = await db.configuracionRotulo.update({
      where: { id },
      data
    })

    return NextResponse.json({ success: true, data: rotulo })
  } catch (error) {
    console.error('Error updating configuracion rotulo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar configuración de rótulo' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar configuración de rótulo
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
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

    await db.configuracionRotulo.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting configuracion rotulo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar configuración de rótulo' },
      { status: 500 }
    )
  }
}
