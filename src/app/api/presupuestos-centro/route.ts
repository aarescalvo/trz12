import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar presupuestos de centros de costo
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const centroCostoId = searchParams.get('centroCostoId')
    const anio = searchParams.get('anio')
    const mes = searchParams.get('mes')
    const id = searchParams.get('id')

    // Si se pasa un ID, devolver un solo presupuesto
    if (id) {
      const presupuesto = await db.presupuestoCentro.findUnique({
        where: { id },
        include: {
          centroCosto: true
        }
      })

      if (!presupuesto) {
        return NextResponse.json(
          { success: false, error: 'Presupuesto no encontrado' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: presupuesto
      })
    }

    const where: Record<string, unknown> = {}
    if (centroCostoId) {
      where.centroCostoId = centroCostoId
    }
    if (anio) {
      where.anio = parseInt(anio)
    }
    if (mes) {
      where.mes = parseInt(mes)
    }

    const presupuestos = await db.presupuestoCentro.findMany({
      where,
      include: {
        centroCosto: true
      },
      orderBy: [
        { anio: 'desc' },
        { mes: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: presupuestos
    })
  } catch (error) {
    console.error('Error al obtener presupuestos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener presupuestos' },
      { status: 500 }
    )
  }
}

// POST - Crear presupuesto de centro de costo
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
    if (!data.anio) {
      return NextResponse.json(
        { success: false, error: 'El año es requerido' },
        { status: 400 }
      )
    }
    if (!data.mes) {
      return NextResponse.json(
        { success: false, error: 'El mes es requerido' },
        { status: 400 }
      )
    }
    if (data.presupuesto === undefined || data.presupuesto === null) {
      return NextResponse.json(
        { success: false, error: 'El presupuesto es requerido' },
        { status: 400 }
      )
    }

    // Validar que el mes esté entre 1 y 12
    const mes = parseInt(data.mes)
    if (mes < 1 || mes > 12) {
      return NextResponse.json(
        { success: false, error: 'El mes debe estar entre 1 y 12' },
        { status: 400 }
      )
    }

    // Validar que el año sea razonable
    const anio = parseInt(data.anio)
    if (anio < 2020 || anio > 2100) {
      return NextResponse.json(
        { success: false, error: 'El año no es válido' },
        { status: 400 }
      )
    }

    // Verificar que el centro de costo existe
    const centroCosto = await db.centroCosto.findUnique({
      where: { id: data.centroCostoId }
    })

    if (!centroCosto) {
      return NextResponse.json(
        { success: false, error: 'El centro de costo no existe' },
        { status: 404 }
      )
    }

    // Verificar si ya existe un presupuesto para el mismo centro/año/mes
    const existente = await db.presupuestoCentro.findFirst({
      where: {
        centroCostoId: data.centroCostoId,
        anio: anio,
        mes: mes
      }
    })

    if (existente) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Ya existe un presupuesto para este centro de costo en ${mes}/${anio}` 
        },
        { status: 400 }
      )
    }

    const presupuesto = await db.presupuestoCentro.create({
      data: {
        centroCostoId: data.centroCostoId,
        anio: anio,
        mes: mes,
        presupuesto: parseFloat(data.presupuesto) || 0,
        ejecutado: parseFloat(data.ejecutado) || 0,
        desviacion: data.desviacion !== undefined ? parseFloat(data.desviacion) : null
      },
      include: {
        centroCosto: true
      }
    })

    return NextResponse.json({
      success: true,
      data: presupuesto
    })
  } catch (error) {
    console.error('Error al crear presupuesto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear presupuesto' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar presupuesto de centro de costo
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
    const existente = await db.presupuestoCentro.findUnique({
      where: { id: data.id }
    })

    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Presupuesto no encontrado' },
        { status: 404 }
      )
    }

    // Si se están cambiando centro/año/mes, verificar que no exista otro
    const nuevoCentroCostoId = data.centroCostoId || existente.centroCostoId
    const nuevoAnio = data.anio ? parseInt(data.anio) : existente.anio
    const nuevoMes = data.mes ? parseInt(data.mes) : existente.mes

    if (nuevoCentroCostoId !== existente.centroCostoId || 
        nuevoAnio !== existente.anio || 
        nuevoMes !== existente.mes) {
      
      const duplicado = await db.presupuestoCentro.findFirst({
        where: {
          id: { not: data.id },
          centroCostoId: nuevoCentroCostoId,
          anio: nuevoAnio,
          mes: nuevoMes
        }
      })

      if (duplicado) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Ya existe un presupuesto para este centro de costo en ${nuevoMes}/${nuevoAnio}` 
          },
          { status: 400 }
        )
      }
    }

    const presupuesto = await db.presupuestoCentro.update({
      where: { id: data.id },
      data: {
        centroCostoId: nuevoCentroCostoId,
        anio: nuevoAnio,
        mes: nuevoMes,
        presupuesto: data.presupuesto !== undefined ? parseFloat(data.presupuesto) : existente.presupuesto,
        ejecutado: data.ejecutado !== undefined ? parseFloat(data.ejecutado) : existente.ejecutado,
        desviacion: data.desviacion !== undefined 
          ? (data.desviacion ? parseFloat(data.desviacion) : null)
          : existente.desviacion
      },
      include: {
        centroCosto: true
      }
    })

    return NextResponse.json({
      success: true,
      data: presupuesto
    })
  } catch (error) {
    console.error('Error al actualizar presupuesto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar presupuesto' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar presupuesto de centro de costo
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
    const existente = await db.presupuestoCentro.findUnique({
      where: { id }
    })

    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Presupuesto no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no tenga ejecución (ejecutado > 0)
    if (existente.ejecutado > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No se puede eliminar el presupuesto porque tiene monto ejecutado' 
        },
        { status: 400 }
      )
    }

    await db.presupuestoCentro.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Presupuesto eliminado correctamente'
    })
  } catch (error) {
    console.error('Error al eliminar presupuesto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar presupuesto' },
      { status: 500 }
    )
  }
}
