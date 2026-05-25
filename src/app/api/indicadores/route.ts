import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Fetch all indicadores with most recent values
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')
    const activo = searchParams.get('activo')

    const where: Record<string, unknown> = {}

    if (categoria && categoria !== 'todos') {
      where.categoria = categoria
    }

    if (activo !== null && activo !== undefined && activo !== 'todos') {
      where.activo = activo === 'true'
    }

    const indicadores = await db.indicador.findMany({
      where,
      include: {
        valores: {
          orderBy: {
            fecha: 'desc'
          },
          take: 1 // Solo el valor más reciente
        }
      },
      orderBy: {
        codigo: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: indicadores.map(i => {
        const valorRecente = i.valores[0]
        return {
          id: i.id,
          codigo: i.codigo,
          nombre: i.nombre,
          descripcion: i.descripcion,
          unidad: i.unidad,
          meta: i.meta,
          alertaMinima: i.alertaMinima,
          alertaMaxima: i.alertaMaxima,
          categoria: i.categoria,
          activo: i.activo,
          createdAt: i.createdAt.toISOString(),
          updatedAt: i.updatedAt.toISOString(),
          // Valor más reciente
          valorReciente: valorRecente ? {
            id: valorRecente.id,
            fecha: valorRecente.fecha.toISOString(),
            valor: valorRecente.valor,
            valorMeta: valorRecente.valorMeta,
            desviacion: valorRecente.desviacion,
            observaciones: valorRecente.observaciones,
          } : null,
        }
      })
    })
  } catch (error) {
    console.error('Error fetching indicadores:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener indicadores' },
      { status: 500 }
    )
  }
}

// POST - Create new indicador
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const body = await request.json()
    const {
      codigo,
      nombre,
      descripcion,
      unidad,
      meta,
      alertaMinima,
      alertaMaxima,
      categoria
    } = body

    // Validar campos requeridos
    if (!codigo || !nombre || !unidad || !categoria) {
      return NextResponse.json(
        { success: false, error: 'Código, nombre, unidad y categoría son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un indicador con el mismo código
    const existente = await db.indicador.findUnique({
      where: { codigo }
    })

    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un indicador con este código' },
        { status: 400 }
      )
    }

    const indicador = await db.indicador.create({
      data: {
        codigo,
        nombre,
        descripcion: descripcion || null,
        unidad,
        meta: meta ? parseFloat(meta) : null,
        alertaMinima: alertaMinima ? parseFloat(alertaMinima) : null,
        alertaMaxima: alertaMaxima ? parseFloat(alertaMaxima) : null,
        categoria,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: indicador.id,
        codigo: indicador.codigo,
        nombre: indicador.nombre,
        descripcion: indicador.descripcion,
        unidad: indicador.unidad,
        meta: indicador.meta,
        alertaMinima: indicador.alertaMinima,
        alertaMaxima: indicador.alertaMaxima,
        categoria: indicador.categoria,
        activo: indicador.activo,
        createdAt: indicador.createdAt.toISOString(),
        updatedAt: indicador.updatedAt.toISOString(),
        valorReciente: null,
      }
    })
  } catch (error) {
    console.error('Error creating indicador:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear indicador' },
      { status: 500 }
    )
  }
}

// PUT - Update indicador
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const body = await request.json()
    const {
      id,
      codigo,
      nombre,
      descripcion,
      unidad,
      meta,
      alertaMinima,
      alertaMaxima,
      categoria,
      activo
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (codigo) {
      // Verificar si el código ya existe en otro indicador
      const existente = await db.indicador.findUnique({
        where: { codigo }
      })

      if (existente && existente.id !== id) {
        return NextResponse.json(
          { success: false, error: 'Ya existe otro indicador con este código' },
          { status: 400 }
        )
      }
      updateData.codigo = codigo
    }
    if (nombre) updateData.nombre = nombre
    if (descripcion !== undefined) updateData.descripcion = descripcion || null
    if (unidad) updateData.unidad = unidad
    if (meta !== undefined) updateData.meta = meta ? parseFloat(meta) : null
    if (alertaMinima !== undefined) updateData.alertaMinima = alertaMinima ? parseFloat(alertaMinima) : null
    if (alertaMaxima !== undefined) updateData.alertaMaxima = alertaMaxima ? parseFloat(alertaMaxima) : null
    if (categoria) updateData.categoria = categoria
    if (activo !== undefined) updateData.activo = activo

    const indicador = await db.indicador.update({
      where: { id },
      data: updateData,
      include: {
        valores: {
          orderBy: {
            fecha: 'desc'
          },
          take: 1
        }
      }
    })

    const valorRecente = indicador.valores[0]
    return NextResponse.json({
      success: true,
      data: {
        id: indicador.id,
        codigo: indicador.codigo,
        nombre: indicador.nombre,
        descripcion: indicador.descripcion,
        unidad: indicador.unidad,
        meta: indicador.meta,
        alertaMinima: indicador.alertaMinima,
        alertaMaxima: indicador.alertaMaxima,
        categoria: indicador.categoria,
        activo: indicador.activo,
        createdAt: indicador.createdAt.toISOString(),
        updatedAt: indicador.updatedAt.toISOString(),
        valorReciente: valorRecente ? {
          id: valorRecente.id,
          fecha: valorRecente.fecha.toISOString(),
          valor: valorRecente.valor,
          valorMeta: valorRecente.valorMeta,
          desviacion: valorRecente.desviacion,
          observaciones: valorRecente.observaciones,
        } : null,
      }
    })
  } catch (error) {
    console.error('Error updating indicador:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar indicador' },
      { status: 500 }
    )
  }
}

// DELETE - Delete indicador
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
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

    // Eliminar primero los valores asociados
    await db.valorIndicador.deleteMany({
      where: { indicadorId: id }
    })

    // Luego eliminar el indicador
    await db.indicador.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Indicador eliminado correctamente'
    })
  } catch (error) {
    console.error('Error deleting indicador:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar indicador' },
      { status: 500 }
    )
  }
}
