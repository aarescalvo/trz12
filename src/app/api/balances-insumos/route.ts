import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Fetch all balances de insumos
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const centroCostoId = searchParams.get('centroCostoId')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    const where: Record<string, unknown> = {}

    if (centroCostoId) {
      where.centroCostoId = centroCostoId
    }

    if (fechaDesde || fechaHasta) {
      where.fechaDesde = {}
      if (fechaDesde) {
        where.fechaDesde = { ...where.fechaDesde as object, gte: new Date(fechaDesde) }
      }
    }

    if (fechaHasta) {
      where.fechaHasta = { lte: new Date(fechaHasta) }
    }

    const balances = await db.balanceInsumos.findMany({
      where,
      orderBy: {
        fechaDesde: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: balances.map(b => ({
        id: b.id,
        fechaDesde: b.fechaDesde.toISOString(),
        fechaHasta: b.fechaHasta.toISOString(),
        centroCostoId: b.centroCostoId,
        consumoTotal: b.consumoTotal,
        kgProducidos: b.kgProducidos,
        cabezasFaenadas: b.cabezasFaenadas,
        costoPorKg: b.costoPorKg,
        costoPorCabeza: b.costoPorCabeza,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      }))
    })
  } catch (error) {
    console.error('Error fetching balances de insumos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener balances de insumos' },
      { status: 500 }
    )
  }
}

// POST - Create new balance de insumos
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json()
    const {
      fechaDesde,
      fechaHasta,
      centroCostoId,
      consumoTotal,
      kgProducidos,
      cabezasFaenadas,
      costoPorKg,
      costoPorCabeza
    } = body

    // Validar campos requeridos
    if (!fechaDesde || !fechaHasta) {
      return NextResponse.json(
        { success: false, error: 'Fecha desde y fecha hasta son requeridas' },
        { status: 400 }
      )
    }

    // Calcular indicadores automáticamente si hay datos
    const consumo = parseFloat(consumoTotal) || 0
    const kgProd = parseFloat(kgProducidos) || 0
    const cabezas = parseInt(cabezasFaenadas) || 0

    let costoKgCalculado = costoPorKg ? parseFloat(costoPorKg) : null
    let costoCabezaCalculado = costoPorCabeza ? parseFloat(costoPorCabeza) : null

    // Calcular costo por kg si hay consumo y producción
    if (consumo > 0 && kgProd > 0) {
      costoKgCalculado = consumo / kgProd
    }

    // Calcular costo por cabeza si hay consumo y cabezas
    if (consumo > 0 && cabezas > 0) {
      costoCabezaCalculado = consumo / cabezas
    }

    const balance = await db.balanceInsumos.create({
      data: {
        fechaDesde: new Date(fechaDesde),
        fechaHasta: new Date(fechaHasta),
        centroCostoId: centroCostoId || null,
        consumoTotal: consumo,
        kgProducidos: kgProd,
        cabezasFaenadas: cabezas,
        costoPorKg: costoKgCalculado,
        costoPorCabeza: costoCabezaCalculado,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: balance.id,
        fechaDesde: balance.fechaDesde.toISOString(),
        fechaHasta: balance.fechaHasta.toISOString(),
        centroCostoId: balance.centroCostoId,
        consumoTotal: balance.consumoTotal,
        kgProducidos: balance.kgProducidos,
        cabezasFaenadas: balance.cabezasFaenadas,
        costoPorKg: balance.costoPorKg,
        costoPorCabeza: balance.costoPorCabeza,
        createdAt: balance.createdAt.toISOString(),
        updatedAt: balance.updatedAt.toISOString(),
      }
    })
  } catch (error) {
    console.error('Error creating balance de insumos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear balance de insumos' },
      { status: 500 }
    )
  }
}

// PUT - Update balance de insumos
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json()
    const {
      id,
      fechaDesde,
      fechaHasta,
      centroCostoId,
      consumoTotal,
      kgProducidos,
      cabezasFaenadas,
      costoPorKg,
      costoPorCabeza
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (fechaDesde) updateData.fechaDesde = new Date(fechaDesde)
    if (fechaHasta) updateData.fechaHasta = new Date(fechaHasta)
    if (centroCostoId !== undefined) updateData.centroCostoId = centroCostoId || null
    if (consumoTotal !== undefined) updateData.consumoTotal = parseFloat(consumoTotal) || 0
    if (kgProducidos !== undefined) updateData.kgProducidos = parseFloat(kgProducidos) || 0
    if (cabezasFaenadas !== undefined) updateData.cabezasFaenadas = parseInt(cabezasFaenadas) || 0

    // Recalcular indicadores si se actualizan valores relevantes
    const consumo = updateData.consumoTotal as number
    const kgProd = updateData.kgProducidos as number
    const cabezas = updateData.cabezasFaenadas as number

    if (consumo !== undefined && kgProd !== undefined && consumo > 0 && kgProd > 0) {
      updateData.costoPorKg = consumo / kgProd
    } else if (costoPorKg !== undefined) {
      updateData.costoPorKg = costoPorKg ? parseFloat(costoPorKg) : null
    }

    if (consumo !== undefined && cabezas !== undefined && consumo > 0 && cabezas > 0) {
      updateData.costoPorCabeza = consumo / cabezas
    } else if (costoPorCabeza !== undefined) {
      updateData.costoPorCabeza = costoPorCabeza ? parseFloat(costoPorCabeza) : null
    }

    const balance = await db.balanceInsumos.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: {
        id: balance.id,
        fechaDesde: balance.fechaDesde.toISOString(),
        fechaHasta: balance.fechaHasta.toISOString(),
        centroCostoId: balance.centroCostoId,
        consumoTotal: balance.consumoTotal,
        kgProducidos: balance.kgProducidos,
        cabezasFaenadas: balance.cabezasFaenadas,
        costoPorKg: balance.costoPorKg,
        costoPorCabeza: balance.costoPorCabeza,
        createdAt: balance.createdAt.toISOString(),
        updatedAt: balance.updatedAt.toISOString(),
      }
    })
  } catch (error) {
    console.error('Error updating balance de insumos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar balance de insumos' },
      { status: 500 }
    )
  }
}

// DELETE - Delete balance de insumos
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

    await db.balanceInsumos.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Balance de insumos eliminado correctamente'
    })
  } catch (error) {
    console.error('Error deleting balance de insumos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar balance de insumos' },
      { status: 500 }
    )
  }
}
