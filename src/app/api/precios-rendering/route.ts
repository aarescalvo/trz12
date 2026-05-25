import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar precios de rendering
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')
    const tipoProducto = searchParams.get('tipoProducto')
    const soloActivos = searchParams.get('activos')

    const where: Record<string, unknown> = {}
    
    if (clienteId) where.clienteId = clienteId
    if (tipoProducto) where.tipoProducto = tipoProducto
    if (soloActivos === 'true') where.activo = true

    const precios = await db.precioRendering.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true } }
      },
      orderBy: { fechaDesde: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: precios
    })
  } catch (error) {
    console.error('Error fetching precios rendering:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener precios' },
      { status: 500 }
    )
  }
}

// POST - Crear/actualizar precio
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError

  try {
    const data = await request.json()
    
    // Desactivar precios anteriores
    await db.precioRendering.updateMany({
      where: {
        clienteId: data.clienteId,
        tipoProducto: data.tipoProducto,
        activo: true
      },
      data: { activo: false, fechaHasta: new Date() }
    })

    // Crear nuevo precio
    const precio = await db.precioRendering.create({
      data: {
        clienteId: data.clienteId,
        tipoProducto: data.tipoProducto,
        precioKg: parseFloat(data.precioKg)
      }
    })

    return NextResponse.json({
      success: true,
      data: precio
    })
  } catch (error) {
    console.error('Error creating precio rendering:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear precio' },
      { status: 500 }
    )
  }
}
