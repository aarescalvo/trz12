import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener historico de precios
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')
    const tipoProducto = searchParams.get('tipoProducto')

    const where: Record<string, unknown> = {}

    if (clienteId) where.clienteId = clienteId
    if (tipoProducto) where.tipoProducto = tipoProducto as 'MEDIA_RES' | 'CUARTO_DELANTERO' | 'CUARTO_TRASERO' | 'MENUDENCIA' | 'OTRO'

    const historico = await db.historicoPrecio.findMany({
      where: where as Prisma.HistoricoPrecioWhereInput,
      orderBy: { fechaVigencia: 'desc' },
      take: 50
    })

    return NextResponse.json({
      success: true,
      data: historico
    })
  } catch (error) {
    console.error('Error fetching historico precios:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener historico de precios' },
      { status: 500 }
    )
  }
}

// POST - Guardar precio
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json()
    const { clienteId, tipoProducto, precio, observaciones, registradoPor } = body

    if (!tipoProducto || !precio) {
      return NextResponse.json(
        { success: false, error: 'Tipo de producto y precio son requeridos' },
        { status: 400 }
      )
    }

    const historico = await db.historicoPrecio.create({
      data: {
        clienteId,
        tipoProducto,
        precioNuevo: precio,
        observaciones,
        registradoPor
      } as unknown as Prisma.HistoricoPrecioCreateInput
    })

    return NextResponse.json({
      success: true,
      data: historico
    })
  } catch (error) {
    console.error('Error saving historico precio:', error)
    return NextResponse.json(
      { success: false, error: 'Error al guardar precio' },
      { status: 500 }
    )
  }
}
