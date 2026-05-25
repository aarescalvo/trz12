import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar consumos de centros de costo
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const centroCostoId = searchParams.get('centroCostoId')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const categoria = searchParams.get('categoria')
    const id = searchParams.get('id')

    // Si se pasa un ID, devolver un solo consumo
    if (id) {
      const consumo = await db.consumoCentro.findUnique({
        where: { id },
        include: {
          centroCosto: true
        }
      })

      if (!consumo) {
        return NextResponse.json(
          { success: false, error: 'Consumo no encontrado' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: consumo
      })
    }

    const where: Record<string, unknown> = {}
    if (centroCostoId) {
      where.centroCostoId = centroCostoId
    }
    if (categoria) {
      where.categoria = categoria
    }
    if (fechaDesde || fechaHasta) {
      const fechaFilter: Record<string, unknown> = {}
      if (fechaDesde) {
        fechaFilter.gte = new Date(fechaDesde)
      }
      if (fechaHasta) {
        fechaFilter.lte = new Date(fechaHasta)
      }
      where.fecha = fechaFilter
    }

    const consumos = await db.consumoCentro.findMany({
      where,
      include: {
        centroCosto: true
      },
      orderBy: [
        { fecha: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: consumos
    })
  } catch (error) {
    console.error('Error al obtener consumos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener consumos' },
      { status: 500 }
    )
  }
}

// POST - Crear consumo de centro de costo
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const data = await request.json()

    // Validaciones
    if (!data.centroCostoId) {
      return NextResponse.json(
        { success: false, error: 'El centro de costo es requerido' },
        { status: 400 }
      )
    }
    if (!data.concepto) {
      return NextResponse.json(
        { success: false, error: 'El concepto es requerido' },
        { status: 400 }
      )
    }
    if (data.monto === undefined || data.monto === null) {
      return NextResponse.json(
        { success: false, error: 'El monto es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el centro de costo existe y está activo
    const centroCosto = await db.centroCosto.findUnique({
      where: { id: data.centroCostoId }
    })

    if (!centroCosto) {
      return NextResponse.json(
        { success: false, error: 'El centro de costo no existe' },
        { status: 404 }
      )
    }

    if (!centroCosto.activo) {
      return NextResponse.json(
        { success: false, error: 'El centro de costo no está activo' },
        { status: 400 }
      )
    }

    // Determinar fecha del consumo
    const fecha = data.fecha ? new Date(data.fecha) : new Date()
    const anio = fecha.getFullYear()
    const mes = fecha.getMonth() + 1

    const monto = parseFloat(data.monto) || 0

    // Crear el consumo
    const consumo = await db.consumoCentro.create({
      data: {
        centroCostoId: data.centroCostoId,
        fecha: fecha,
        concepto: data.concepto,
        categoria: data.categoria || null,
        cantidad: data.cantidad !== undefined ? parseFloat(data.cantidad) : null,
        monto: monto,
        observaciones: data.observaciones || null
      },
      include: {
        centroCosto: true
      }
    })

    // Actualizar el presupuesto correspondiente si existe
    const presupuesto = await db.presupuestoCentro.findFirst({
      where: {
        centroCostoId: data.centroCostoId,
        anio: anio,
        mes: mes
      }
    })

    if (presupuesto) {
      const nuevoEjecutado = presupuesto.ejecutado + monto
      const nuevaDesviacion = presupuesto.presupuesto - nuevoEjecutado

      await db.presupuestoCentro.update({
        where: { id: presupuesto.id },
        data: {
          ejecutado: nuevoEjecutado,
          desviacion: nuevaDesviacion
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: consumo
    })
  } catch (error) {
    console.error('Error al crear consumo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear consumo' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar consumo de centro de costo
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const data = await request.json()

    if (!data.id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    // Verificar que existe
    const existente = await db.consumoCentro.findUnique({
      where: { id: data.id }
    })

    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Consumo no encontrado' },
        { status: 404 }
      )
    }

    const montoAnterior = existente.monto
    const montoNuevo = data.monto !== undefined ? parseFloat(data.monto) : montoAnterior
    const diferenciaMonto = montoNuevo - montoAnterior

    const fecha = data.fecha ? new Date(data.fecha) : existente.fecha

    const consumo = await db.consumoCentro.update({
      where: { id: data.id },
      data: {
        centroCostoId: data.centroCostoId || existente.centroCostoId,
        fecha: fecha,
        concepto: data.concepto || existente.concepto,
        categoria: data.categoria !== undefined ? data.categoria : existente.categoria,
        cantidad: data.cantidad !== undefined 
          ? (data.cantidad ? parseFloat(data.cantidad) : null)
          : existente.cantidad,
        monto: montoNuevo,
        observaciones: data.observaciones !== undefined ? data.observaciones : existente.observaciones
      },
      include: {
        centroCosto: true
      }
    })

    // Si cambió el monto, actualizar el presupuesto
    if (diferenciaMonto !== 0) {
      const fechaOriginal = existente.fecha
      const presupuesto = await db.presupuestoCentro.findFirst({
        where: {
          centroCostoId: existente.centroCostoId,
          anio: fechaOriginal.getFullYear(),
          mes: fechaOriginal.getMonth() + 1
        }
      })

      if (presupuesto) {
        const nuevoEjecutado = presupuesto.ejecutado + diferenciaMonto
        const nuevaDesviacion = presupuesto.presupuesto - nuevoEjecutado

        await db.presupuestoCentro.update({
          where: { id: presupuesto.id },
          data: {
            ejecutado: nuevoEjecutado,
            desviacion: nuevaDesviacion
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: consumo
    })
  } catch (error) {
    console.error('Error al actualizar consumo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar consumo' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar consumo de centro de costo
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
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

    // Verificar que existe
    const existente = await db.consumoCentro.findUnique({
      where: { id }
    })

    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Consumo no encontrado' },
        { status: 404 }
      )
    }

    // Guardar datos para actualizar presupuesto
    const monto = existente.monto
    const fecha = existente.fecha

    // Eliminar el consumo
    await db.consumoCentro.delete({
      where: { id }
    })

    // Actualizar el presupuesto (revertir el monto)
    const presupuesto = await db.presupuestoCentro.findFirst({
      where: {
        centroCostoId: existente.centroCostoId,
        anio: fecha.getFullYear(),
        mes: fecha.getMonth() + 1
      }
    })

    if (presupuesto) {
      const nuevoEjecutado = presupuesto.ejecutado - monto
      const nuevaDesviacion = presupuesto.presupuesto - nuevoEjecutado

      await db.presupuestoCentro.update({
        where: { id: presupuesto.id },
        data: {
          ejecutado: nuevoEjecutado,
          desviacion: nuevaDesviacion
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Consumo eliminado correctamente'
    })
  } catch (error) {
    console.error('Error al eliminar consumo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar consumo' },
      { status: 500 }
    )
  }
}
