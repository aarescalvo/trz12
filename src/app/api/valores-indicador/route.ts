import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Fetch all valores de indicador
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const indicadorId = searchParams.get('indicadorId')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    const where: Record<string, unknown> = {}

    if (indicadorId) {
      where.indicadorId = indicadorId
    }

    if (fechaDesde || fechaHasta) {
      where.fecha = {}
      if (fechaDesde) {
        where.fecha = { ...where.fecha as object, gte: new Date(fechaDesde) }
      }
      if (fechaHasta) {
        where.fecha = { ...where.fecha as object, lte: new Date(fechaHasta) }
      }
    }

    const valores = await db.valorIndicador.findMany({
      where,
      include: {
        indicador: true
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: valores.map(v => ({
        id: v.id,
        indicadorId: v.indicadorId,
        indicador: {
          id: v.indicador.id,
          codigo: v.indicador.codigo,
          nombre: v.indicador.nombre,
          unidad: v.indicador.unidad,
          categoria: v.indicador.categoria,
        },
        fecha: v.fecha.toISOString(),
        valor: v.valor,
        valorMeta: v.valorMeta,
        desviacion: v.desviacion,
        observaciones: v.observaciones,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
      }))
    })
  } catch (error) {
    console.error('Error fetching valores de indicador:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener valores de indicador' },
      { status: 500 }
    )
  }
}

// POST - Create new valor de indicador
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      indicadorId,
      fecha,
      valor,
      valorMeta,
      desviacion,
      observaciones
    } = body

    // Validar campos requeridos
    if (!indicadorId || !fecha || valor === undefined || valor === null) {
      return NextResponse.json(
        { success: false, error: 'Indicador, fecha y valor son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el indicador existe
    const indicador = await db.indicador.findUnique({
      where: { id: indicadorId }
    })

    if (!indicador) {
      return NextResponse.json(
        { success: false, error: 'El indicador no existe' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un valor para esta fecha
    const existente = await db.valorIndicador.findUnique({
      where: {
        indicadorId_fecha: {
          indicadorId,
          fecha: new Date(fecha)
        }
      } as unknown as Prisma.ValorIndicadorWhereUniqueInput
    })

    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un valor para este indicador en la fecha especificada' },
        { status: 400 }
      )
    }

    // Calcular desviación si hay meta
    const valorNumerico = parseFloat(valor)
    const meta = valorMeta ? parseFloat(valorMeta) : indicador.meta
    let desviacionCalculada = desviacion ? parseFloat(desviacion) : null

    if (meta && valorNumerico) {
      desviacionCalculada = ((valorNumerico - meta) / meta) * 100
    }

    const valorIndicador = await db.valorIndicador.create({
      data: {
        indicadorId,
        fecha: new Date(fecha),
        valor: valorNumerico,
        valorMeta: meta,
        desviacion: desviacionCalculada,
        observaciones: observaciones || null,
      },
      include: {
        indicador: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: valorIndicador.id,
        indicadorId: valorIndicador.indicadorId,
        indicador: {
          id: valorIndicador.indicador.id,
          codigo: valorIndicador.indicador.codigo,
          nombre: valorIndicador.indicador.nombre,
          unidad: valorIndicador.indicador.unidad,
          categoria: valorIndicador.indicador.categoria,
        },
        fecha: valorIndicador.fecha.toISOString(),
        valor: valorIndicador.valor,
        valorMeta: valorIndicador.valorMeta,
        desviacion: valorIndicador.desviacion,
        observaciones: valorIndicador.observaciones,
        createdAt: valorIndicador.createdAt.toISOString(),
        updatedAt: valorIndicador.updatedAt.toISOString(),
      }
    })
  } catch (error) {
    console.error('Error creating valor de indicador:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear valor de indicador' },
      { status: 500 }
    )
  }
}

// PUT - Update valor de indicador
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      id,
      indicadorId,
      fecha,
      valor,
      valorMeta,
      desviacion,
      observaciones
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}

    // Si se cambia el indicador o la fecha, verificar que no exista conflicto
    if (indicadorId || fecha) {
      const actual = await db.valorIndicador.findUnique({
        where: { id },
        include: { indicador: true }
      })

      if (actual) {
        const nuevoIndicadorId = indicadorId || actual.indicadorId
        const nuevaFecha = fecha ? new Date(fecha) : actual.fecha

        // Verificar que el indicador existe si se está cambiando
        if (indicadorId) {
          const indicador = await db.indicador.findUnique({
            where: { id: indicadorId }
          })
          if (!indicador) {
            return NextResponse.json(
              { success: false, error: 'El indicador no existe' },
              { status: 400 }
            )
          }
        }

        const existente = await db.valorIndicador.findUnique({
          where: {
            indicadorId_fecha: {
              indicadorId: nuevoIndicadorId,
              fecha: nuevaFecha
            }
          } as unknown as Prisma.ValorIndicadorWhereUniqueInput
        })

        if (existente && existente.id !== id) {
          return NextResponse.json(
            { success: false, error: 'Ya existe un valor para este indicador en la fecha especificada' },
            { status: 400 }
          )
        }
      }
    }

    if (indicadorId) updateData.indicadorId = indicadorId
    if (fecha) updateData.fecha = new Date(fecha)
    if (valor !== undefined) updateData.valor = parseFloat(valor)

    // Recalcular desviación si se actualiza valor o meta
    if (valor !== undefined || valorMeta !== undefined) {
      const actual = await db.valorIndicador.findUnique({
        where: { id },
        include: { indicador: true }
      })

      if (actual) {
        const nuevoValor = valor !== undefined ? parseFloat(valor) : actual.valor
        const nuevaMeta = valorMeta !== undefined ? (valorMeta ? parseFloat(valorMeta) : null) : actual.valorMeta

        updateData.valorMeta = nuevaMeta

        if (nuevaMeta && nuevoValor) {
          updateData.desviacion = ((nuevoValor - nuevaMeta) / nuevaMeta) * 100
        } else {
          updateData.desviacion = desviacion ? parseFloat(desviacion) : null
        }
      }
    } else if (desviacion !== undefined) {
      updateData.desviacion = desviacion ? parseFloat(desviacion) : null
    }

    if (observaciones !== undefined) updateData.observaciones = observaciones || null

    const valorIndicador = await db.valorIndicador.update({
      where: { id },
      data: updateData,
      include: {
        indicador: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: valorIndicador.id,
        indicadorId: valorIndicador.indicadorId,
        indicador: {
          id: valorIndicador.indicador.id,
          codigo: valorIndicador.indicador.codigo,
          nombre: valorIndicador.indicador.nombre,
          unidad: valorIndicador.indicador.unidad,
          categoria: valorIndicador.indicador.categoria,
        },
        fecha: valorIndicador.fecha.toISOString(),
        valor: valorIndicador.valor,
        valorMeta: valorIndicador.valorMeta,
        desviacion: valorIndicador.desviacion,
        observaciones: valorIndicador.observaciones,
        createdAt: valorIndicador.createdAt.toISOString(),
        updatedAt: valorIndicador.updatedAt.toISOString(),
      }
    })
  } catch (error) {
    console.error('Error updating valor de indicador:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar valor de indicador' },
      { status: 500 }
    )
  }
}

// DELETE - Delete valor de indicador
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

    await db.valorIndicador.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Valor de indicador eliminado correctamente'
    })
  } catch (error) {
    console.error('Error deleting valor de indicador:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar valor de indicador' },
      { status: 500 }
    )
  }
}
