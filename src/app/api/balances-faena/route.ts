import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch all balances de faena
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const tropaId = searchParams.get('tropaId')
    const centroCostoId = searchParams.get('centroCostoId')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    const where: Record<string, unknown> = {}

    if (tropaId) {
      where.tropaId = tropaId
    }

    if (centroCostoId) {
      where.centroCostoId = centroCostoId
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

    const balances = await db.balanceFaena.findMany({
      where,
      include: {
        tropa: {
          include: {
            productor: true,
          }
        },
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: balances.map(b => ({
        id: b.id,
        tropaId: b.tropaId,
        tropa: b.tropa ? {
          id: b.tropa.id,
          numero: b.tropa.numero,
          codigo: b.tropa.codigo,
          productor: b.tropa.productor,
        } : null,
        fecha: b.fecha.toISOString(),
        pesoVivoTotal: b.pesoVivoTotal,
        cantidadCabezas: b.cantidadCabezas,
        pesoFrioTotal: b.pesoFrioTotal,
        cantidadMedias: b.cantidadMedias,
        rindePromedio: b.rindePromedio,
        rindeMinimo: b.rindeMinimo,
        rindeMaximo: b.rindeMaximo,
        pesoMenudencias: b.pesoMenudencias,
        pesoMerma: b.pesoMerma,
        porcentajeMerma: b.porcentajeMerma,
        centroCostoId: b.centroCostoId,
        observaciones: b.observaciones,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      }))
    })
  } catch (error) {
    console.error('Error fetching balances de faena:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener balances de faena' },
      { status: 500 }
    )
  }
}

// POST - Create new balance de faena
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      tropaId,
      fecha,
      pesoVivoTotal,
      cantidadCabezas,
      pesoFrioTotal,
      cantidadMedias,
      rindeMinimo,
      rindeMaximo,
      pesoMenudencias,
      pesoMerma,
      porcentajeMerma,
      centroCostoId,
      observaciones
    } = body

    // Preparar datos
    const data: Record<string, unknown> = {
      tropaId: tropaId || null,
      fecha: fecha ? new Date(fecha) : new Date(),
      pesoVivoTotal: parseFloat(pesoVivoTotal) || 0,
      cantidadCabezas: parseInt(cantidadCabezas) || 0,
      pesoFrioTotal: parseFloat(pesoFrioTotal) || 0,
      cantidadMedias: parseInt(cantidadMedias) || 0,
      rindeMinimo: rindeMinimo ? parseFloat(rindeMinimo) : null,
      rindeMaximo: rindeMaximo ? parseFloat(rindeMaximo) : null,
      pesoMenudencias: pesoMenudencias ? parseFloat(pesoMenudencias) : null,
      pesoMerma: pesoMerma ? parseFloat(pesoMerma) : null,
      porcentajeMerma: porcentajeMerma ? parseFloat(porcentajeMerma) : null,
      centroCostoId: centroCostoId || null,
      observaciones: observaciones || null,
    }

    // Calcular rinde automáticamente si hay peso vivo y peso frío
    const pesoVivo = data.pesoVivoTotal as number
    const pesoFrio = data.pesoFrioTotal as number
    if (pesoVivo && pesoFrio && pesoVivo > 0) {
      data.rindePromedio = (pesoFrio / pesoVivo) * 100
    }

    const balance = await db.balanceFaena.create({
      data,
      include: {
        tropa: {
          include: {
            productor: true,
          }
        },
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: balance.id,
        tropaId: balance.tropaId,
        tropa: balance.tropa ? {
          id: balance.tropa.id,
          numero: balance.tropa.numero,
          codigo: balance.tropa.codigo,
          productor: balance.tropa.productor,
        } : null,
        fecha: balance.fecha.toISOString(),
        pesoVivoTotal: balance.pesoVivoTotal,
        cantidadCabezas: balance.cantidadCabezas,
        pesoFrioTotal: balance.pesoFrioTotal,
        cantidadMedias: balance.cantidadMedias,
        rindePromedio: balance.rindePromedio,
        rindeMinimo: balance.rindeMinimo,
        rindeMaximo: balance.rindeMaximo,
        pesoMenudencias: balance.pesoMenudencias,
        pesoMerma: balance.pesoMerma,
        porcentajeMerma: balance.porcentajeMerma,
        centroCostoId: balance.centroCostoId,
        observaciones: balance.observaciones,
        createdAt: balance.createdAt.toISOString(),
        updatedAt: balance.updatedAt.toISOString(),
      }
    })
  } catch (error) {
    console.error('Error creating balance de faena:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear balance de faena' },
      { status: 500 }
    )
  }
}

// PUT - Update balance de faena
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      id,
      tropaId,
      fecha,
      pesoVivoTotal,
      cantidadCabezas,
      pesoFrioTotal,
      cantidadMedias,
      rindeMinimo,
      rindeMaximo,
      pesoMenudencias,
      pesoMerma,
      porcentajeMerma,
      centroCostoId,
      observaciones
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (tropaId !== undefined) updateData.tropaId = tropaId || null
    if (fecha) updateData.fecha = new Date(fecha)
    if (pesoVivoTotal !== undefined) updateData.pesoVivoTotal = parseFloat(pesoVivoTotal) || 0
    if (cantidadCabezas !== undefined) updateData.cantidadCabezas = parseInt(cantidadCabezas) || 0
    if (pesoFrioTotal !== undefined) updateData.pesoFrioTotal = parseFloat(pesoFrioTotal) || 0
    if (cantidadMedias !== undefined) updateData.cantidadMedias = parseInt(cantidadMedias) || 0
    if (rindeMinimo !== undefined) updateData.rindeMinimo = rindeMinimo ? parseFloat(rindeMinimo) : null
    if (rindeMaximo !== undefined) updateData.rindeMaximo = rindeMaximo ? parseFloat(rindeMaximo) : null
    if (pesoMenudencias !== undefined) updateData.pesoMenudencias = pesoMenudencias ? parseFloat(pesoMenudencias) : null
    if (pesoMerma !== undefined) updateData.pesoMerma = pesoMerma ? parseFloat(pesoMerma) : null
    if (porcentajeMerma !== undefined) updateData.porcentajeMerma = porcentajeMerma ? parseFloat(porcentajeMerma) : null
    if (centroCostoId !== undefined) updateData.centroCostoId = centroCostoId || null
    if (observaciones !== undefined) updateData.observaciones = observaciones || null

    // Recalcular rinde si se actualizan pesos
    const pesoVivo = updateData.pesoVivoTotal as number
    const pesoFrio = updateData.pesoFrioTotal as number
    if (pesoVivo !== undefined && pesoFrio !== undefined && pesoVivo > 0) {
      updateData.rindePromedio = (pesoFrio / pesoVivo) * 100
    }

    const balance = await db.balanceFaena.update({
      where: { id },
      data: updateData,
      include: {
        tropa: {
          include: {
            productor: true,
          }
        },
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: balance.id,
        tropaId: balance.tropaId,
        tropa: balance.tropa ? {
          id: balance.tropa.id,
          numero: balance.tropa.numero,
          codigo: balance.tropa.codigo,
          productor: balance.tropa.productor,
        } : null,
        fecha: balance.fecha.toISOString(),
        pesoVivoTotal: balance.pesoVivoTotal,
        cantidadCabezas: balance.cantidadCabezas,
        pesoFrioTotal: balance.pesoFrioTotal,
        cantidadMedias: balance.cantidadMedias,
        rindePromedio: balance.rindePromedio,
        rindeMinimo: balance.rindeMinimo,
        rindeMaximo: balance.rindeMaximo,
        pesoMenudencias: balance.pesoMenudencias,
        pesoMerma: balance.pesoMerma,
        porcentajeMerma: balance.porcentajeMerma,
        centroCostoId: balance.centroCostoId,
        observaciones: balance.observaciones,
        createdAt: balance.createdAt.toISOString(),
        updatedAt: balance.updatedAt.toISOString(),
      }
    })
  } catch (error) {
    console.error('Error updating balance de faena:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar balance de faena' },
      { status: 500 }
    )
  }
}

// DELETE - Delete balance de faena
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
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

    await db.balanceFaena.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Balance de faena eliminado correctamente'
    })
  } catch (error) {
    console.error('Error deleting balance de faena:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar balance de faena' },
      { status: 500 }
    )
  }
}
