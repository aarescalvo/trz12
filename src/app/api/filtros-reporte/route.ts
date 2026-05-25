import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('API:FiltrosReporte')

// Helper to get operadorId from request (header only - set by JWT middleware)
function getOperadorId(request: NextRequest): string | null {
  return request.headers.get('x-operador-id')
}

// GET - List saved filters for an operador, optionally filtered by reportType
export async function GET(request: NextRequest) {
  try {
    const operadorId = getOperadorId(request)
    if (!operadorId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('reportType')

    const where: Record<string, unknown> = { operadorId }
    if (reportType) {
      where.reportType = reportType
    }

    const filtros = await db.filtroReporte.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reportType: true,
        nombre: true,
        filtros: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, data: filtros })
  } catch (error) {
    logger.error('Error listando filtros', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener filtros guardados' },
      { status: 500 }
    )
  }
}

// POST - Create a new saved filter
export async function POST(request: NextRequest) {
  try {
    const operadorId = getOperadorId(request)
    if (!operadorId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { reportType, nombre, filtros } = body

    if (!reportType || !nombre || filtros === undefined) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: reportType, nombre, filtros' },
        { status: 400 }
      )
    }

    // Validate that filtros is a valid object
    if (typeof filtros !== 'object' || filtros === null) {
      return NextResponse.json(
        { success: false, error: 'El campo filtros debe ser un objeto' },
        { status: 400 }
      )
    }

    const filtro = await db.filtroReporte.create({
      data: {
        operadorId,
        reportType,
        nombre: nombre.trim().substring(0, 100),
        filtros: JSON.stringify(filtros),
      },
      select: {
        id: true,
        reportType: true,
        nombre: true,
        filtros: true,
        createdAt: true,
      },
    })

    logger.info('Filtro guardado', { operadorId, reportType, nombre: filtro.nombre, filtroId: filtro.id })

    return NextResponse.json({ success: true, data: filtro }, { status: 201 })
  } catch (error) {
    logger.error('Error guardando filtro', error)
    return NextResponse.json(
      { success: false, error: 'Error al guardar filtro' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a saved filter by id
export async function DELETE(request: NextRequest) {
  try {
    const operadorId = getOperadorId(request)
    if (!operadorId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el parámetro id' },
        { status: 400 }
      )
    }

    // Verify ownership before deleting
    const filtro = await db.filtroReporte.findUnique({
      where: { id },
      select: { operadorId: true },
    })

    if (!filtro) {
      return NextResponse.json(
        { success: false, error: 'Filtro no encontrado' },
        { status: 404 }
      )
    }

    if (filtro.operadorId !== operadorId) {
      return NextResponse.json(
        { success: false, error: 'No tiene permiso para eliminar este filtro' },
        { status: 403 }
      )
    }

    await db.filtroReporte.delete({ where: { id } })

    logger.info('Filtro eliminado', { operadorId, filtroId: id })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error eliminando filtro', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar filtro' },
      { status: 500 }
    )
  }
}
