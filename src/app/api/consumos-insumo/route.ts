import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Fetch consumos de insumo
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const insumoId = searchParams.get('insumoId')
    const centroCostoId = searchParams.get('centroCostoId')
    const tropaId = searchParams.get('tropaId')
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    
    const where: any = {}
    
    if (insumoId) {
      where.insumoId = insumoId
    }
    
    if (centroCostoId) {
      where.centroCostoId = centroCostoId
    }
    
    if (tropaId) {
      where.tropaId = tropaId
    }
    
    if (desde || hasta) {
      where.fecha = {}
      if (desde) {
        where.fecha.gte = new Date(desde)
      }
      if (hasta) {
        where.fecha.lte = new Date(hasta + 'T23:59:59')
      }
    }
    
    const consumos = await db.consumoInsumo.findMany({
      where,
      include: {
        insumo: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            unidadMedida: true,
            precioUnitario: true
          }
        }
      },
      orderBy: { fecha: 'desc' }
    })
    
    return NextResponse.json({
      success: true,
      data: consumos
    })
  } catch (error) {
    console.error('Error fetching consumos de insumo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener consumos de insumo' },
      { status: 500 }
    )
  }
}

// POST - Create new consumo de insumo
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json()
    const { 
      insumoId, 
      centroCostoId,
      cantidad,
      costoUnitario,
      tropaId,
      produccionFecha,
      cantidadProducida,
      consumoEstandar,
      observaciones,
      fecha
    } = body
    
    if (!insumoId) {
      return NextResponse.json(
        { success: false, error: 'El insumo es requerido' },
        { status: 400 }
      )
    }
    
    if (!cantidad || Number(cantidad) <= 0) {
      return NextResponse.json(
        { success: false, error: 'La cantidad debe ser mayor a 0' },
        { status: 400 }
      )
    }
    
    const cantidadNum = Number(cantidad)
    const costoUnitarioNum = costoUnitario ? Number(costoUnitario) : null
    const costoTotal = costoUnitarioNum ? cantidadNum * costoUnitarioNum : null
    
    // Calcular desviación si hay consumo estándar
    let desviacion: number | null = null
    if (consumoEstandar !== undefined && consumoEstandar !== null) {
      desviacion = cantidadNum - Number(consumoEstandar)
    }
    
    const consumo = await db.consumoInsumo.create({
      data: {
        insumoId,
        centroCostoId: centroCostoId || null,
        cantidad: cantidadNum,
        costoUnitario: costoUnitarioNum,
        costoTotal,
        tropaId: tropaId || null,
        produccionFecha: produccionFecha ? new Date(produccionFecha) : null,
        cantidadProducida: cantidadProducida ? Number(cantidadProducida) : null,
        consumoEstandar: consumoEstandar ? Number(consumoEstandar) : null,
        desviacion,
        observaciones: observaciones || null,
        fecha: fecha ? new Date(fecha) : new Date()
      },
      include: {
        insumo: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            unidadMedida: true
          }
        },
        centroCosto: {
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
      data: consumo
    })
  } catch (error) {
    console.error('Error creating consumo de insumo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear consumo de insumo' },
      { status: 500 }
    )
  }
}

// PUT - Update consumo de insumo
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json()
    const { 
      id, 
      cantidad, 
      costoUnitario, 
      consumoEstandar,
      centroCostoId,
      observaciones,
      cantidadProducida
    } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }
    
    const consumoActual = await db.consumoInsumo.findUnique({
      where: { id }
    })
    
    if (!consumoActual) {
      return NextResponse.json(
        { success: false, error: 'Consumo no encontrado' },
        { status: 404 }
      )
    }
    
    const updateData: any = {}
    
    if (cantidad !== undefined) {
      updateData.cantidad = Number(cantidad)
    }
    
    if (costoUnitario !== undefined) {
      updateData.costoUnitario = Number(costoUnitario)
    }
    
    if (centroCostoId !== undefined) {
      updateData.centroCostoId = centroCostoId || null
    }
    
    if (observaciones !== undefined) {
      updateData.observaciones = observaciones
    }
    
    if (cantidadProducida !== undefined) {
      updateData.cantidadProducida = Number(cantidadProducida)
    }
    
    // Recalcular costo total si hay cambios
    if (cantidad !== undefined || costoUnitario !== undefined) {
      const cantidadNum = cantidad !== undefined ? Number(cantidad) : consumoActual.cantidad
      const costoUnitarioNum = costoUnitario !== undefined ? Number(costoUnitario) : consumoActual.costoUnitario
      updateData.costoTotal = costoUnitarioNum ? cantidadNum * costoUnitarioNum : null
    }
    
    // Recalcular desviación si hay cambios en cantidad o consumo estándar
    if (cantidad !== undefined || consumoEstandar !== undefined) {
      const cantidadNum = cantidad !== undefined ? Number(cantidad) : consumoActual.cantidad
      if (consumoEstandar !== undefined) {
        updateData.consumoEstandar = consumoEstandar ? Number(consumoEstandar) : null
        updateData.desviacion = consumoEstandar ? cantidadNum - Number(consumoEstandar) : null
      } else if (consumoActual.consumoEstandar !== null) {
        updateData.desviacion = cantidadNum - consumoActual.consumoEstandar
      }
    }
    
    const consumo = await db.consumoInsumo.update({
      where: { id },
      data: updateData,
      include: {
        insumo: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            unidadMedida: true
          }
        },
        centroCosto: {
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
      data: consumo
    })
  } catch (error) {
    console.error('Error updating consumo de insumo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar consumo de insumo' },
      { status: 500 }
    )
  }
}

// DELETE - Delete consumo de insumo
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
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
    
    const consumo = await db.consumoInsumo.findUnique({
      where: { id }
    })
    
    if (!consumo) {
      return NextResponse.json(
        { success: false, error: 'Consumo no encontrado' },
        { status: 404 }
      )
    }
    
    await db.consumoInsumo.delete({
      where: { id }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Consumo eliminado correctamente'
    })
  } catch (error) {
    console.error('Error deleting consumo de insumo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar consumo de insumo' },
      { status: 500 }
    )
  }
}
