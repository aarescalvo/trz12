import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener historial de precios de un insumo
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const insumoId = searchParams.get('insumoId')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    const where: Record<string, unknown> = {}

    if (insumoId) {
      where.insumoId = insumoId
    }

    if (fechaDesde || fechaHasta) {
      where.fecha = {}
      if (fechaDesde) (where.fecha as Record<string, unknown>).gte = new Date(fechaDesde)
      if (fechaHasta) (where.fecha as Record<string, unknown>).lte = new Date(fechaHasta + 'T23:59:59')
    }

    const historial = await db.historialPrecioInsumo.findMany({
      where,
      include: {
        insumo: {
          select: { id: true, codigo: true, nombre: true }
        },
        operador: {
          select: { id: true, nombre: true }
        }
      },
      orderBy: { fecha: 'desc' },
      take: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    })

    return NextResponse.json({
      success: true,
      data: historial
    })
  } catch (error) {
    console.error('Error al obtener historial de precios:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener historial de precios' },
      { status: 500 }
    )
  }
}

// POST - Registrar cambio de precio (se usa internamente desde el API de insumos)
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json()

    if (!body.insumoId) {
      return NextResponse.json(
        { success: false, error: 'insumoId es requerido' },
        { status: 400 }
      )
    }

    const registro = await db.historialPrecioInsumo.create({
      data: {
        insumoId: body.insumoId,
        precioAnterior: body.precioAnterior ?? null,
        precioNuevo: body.precioNuevo ?? null,
        moneda: body.moneda || 'ARS',
        motivo: body.motivo || 'Actualización manual',
        operadorId: body.operadorId || null,
      },
      include: {
        insumo: {
          select: { id: true, codigo: true, nombre: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: registro
    })
  } catch (error) {
    console.error('Error al registrar historial de precio:', error)
    return NextResponse.json(
      { success: false, error: 'Error al registrar historial de precio' },
      { status: 500 }
    )
  }
}
