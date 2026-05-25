import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener un rótulo específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { id } = await params

    const rotulo = await db.rotulo.findUnique({
      where: { id }
    })

    if (!rotulo) {
      return NextResponse.json(
        { error: 'Rótulo no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(rotulo)
  } catch (error) {
    console.error('Error al obtener rótulo:', error)
    return NextResponse.json(
      { error: 'Error al obtener rótulo' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un rótulo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { id } = await params
    const data = await request.json()

    // Verificar que el rótulo existe
    const existente = await db.rotulo.findUnique({
      where: { id }
    })

    if (!existente) {
      return NextResponse.json(
        { error: 'Rótulo no encontrado' },
        { status: 404 }
      )
    }

    // Si está cambiando el código, verificar que no exista otro
    if (data.codigo && data.codigo !== existente.codigo) {
      const otroConCodigo = await db.rotulo.findUnique({
        where: { codigo: data.codigo }
      })
      if (otroConCodigo) {
        return NextResponse.json(
          { error: 'Ya existe otro rótulo con ese código' },
          { status: 400 }
        )
      }
    }

    // Si es default, quitar default de otros del mismo tipo
    if (data.esDefault) {
      await db.rotulo.updateMany({
        where: { 
          tipo: data.tipo || existente.tipo, 
          esDefault: true,
          NOT: { id }
        },
        data: { esDefault: false }
      })
    }

    const rotulo = await db.rotulo.update({
      where: { id },
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        tipo: data.tipo,
        categoria: data.categoria,
        tipoImpresora: data.tipoImpresora,
        ancho: data.ancho,
        alto: data.alto,
        dpi: data.dpi,
        contenido: data.contenido,
        variables: data.variables,
        nombreArchivo: data.nombreArchivo,
        diasConsumo: data.diasConsumo,
        temperaturaMax: data.temperaturaMax,
        activo: data.activo,
        esDefault: data.esDefault
      }
    })

    return NextResponse.json(rotulo)
  } catch (error) {
    console.error('Error al actualizar rótulo:', error)
    return NextResponse.json(
      { error: 'Error al actualizar rótulo' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un rótulo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { id } = await params

    const rotulo = await db.rotulo.findUnique({
      where: { id }
    })

    if (!rotulo) {
      return NextResponse.json(
        { error: 'Rótulo no encontrado' },
        { status: 404 }
      )
    }

    await db.rotulo.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Rótulo eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar rótulo:', error)
    return NextResponse.json(
      { error: 'Error al eliminar rótulo' },
      { status: 500 }
    )
  }
}
