import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener cotizaciones
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const monedaId = searchParams.get('monedaId')
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const limite = searchParams.get('limite')

    const where: any = {}
    
    if (monedaId) {
      where.monedaId = monedaId
    }
    
    if (desde || hasta) {
      where.fecha = {}
      if (desde) where.fecha.gte = new Date(desde)
      if (hasta) where.fecha.lte = new Date(hasta)
    }

    const cotizaciones = await db.cotizacion.findMany({
      where,
      orderBy: { fecha: 'desc' },
      take: limite ? parseInt(limite) : 100,
      include: {
        moneda: true
      }
    })

    return NextResponse.json(cotizaciones)
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener cotizaciones' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva cotización
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const data = await request.json()
    
    // Validar datos requeridos
    if (!data.monedaId || data.compra === undefined || data.venta === undefined) {
      return NextResponse.json(
        { error: 'Moneda, compra y venta son requeridos' },
        { status: 400 }
      )
    }

    // Validar que la moneda exista
    const moneda = await db.moneda.findUnique({
      where: { id: data.monedaId }
    })

    if (!moneda) {
      return NextResponse.json(
        { error: 'Moneda no encontrada' },
        { status: 404 }
      )
    }

    // Validar valores positivos
    if (data.compra <= 0 || data.venta <= 0) {
      return NextResponse.json(
        { error: 'Los valores de compra y venta deben ser mayores a 0' },
        { status: 400 }
      )
    }

    const cotizacion = await db.cotizacion.create({
      data: {
        monedaId: data.monedaId,
        compra: parseFloat(data.compra),
        venta: parseFloat(data.venta),
        fuente: data.fuente || 'MANUAL',
        fecha: data.fecha ? new Date(data.fecha) : new Date()
      },
      include: {
        moneda: true
      }
    })

    return NextResponse.json(cotizacion, { status: 201 })
  } catch (error) {
    console.error('Error al crear cotización:', error)
    return NextResponse.json(
      { error: 'Error al crear cotización' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar cotización
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const data = await request.json()
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'ID de cotización es requerido' },
        { status: 400 }
      )
    }

    const cotizacion = await db.cotizacion.update({
      where: { id: data.id },
      data: {
        compra: data.compra !== undefined ? parseFloat(data.compra) : undefined,
        venta: data.venta !== undefined ? parseFloat(data.venta) : undefined,
        fuente: data.fuente
      },
      include: {
        moneda: true
      }
    })

    return NextResponse.json(cotizacion)
  } catch (error) {
    console.error('Error al actualizar cotización:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cotización' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar cotización
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID de cotización es requerido' },
        { status: 400 }
      )
    }

    await db.cotizacion.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Cotización eliminada correctamente' })
  } catch (error) {
    console.error('Error al eliminar cotización:', error)
    return NextResponse.json(
      { error: 'Error al eliminar cotización' },
      { status: 500 }
    )
  }
}
