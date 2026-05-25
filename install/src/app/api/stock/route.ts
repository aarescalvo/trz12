import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch all stock
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const camara = searchParams.get('camara')
    
    const where: Record<string, unknown> = {}
    
    if (camara) {
      where.camara = camara
    }
    
    const stock = await db.stockCamara.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json({
      success: true,
      data: stock.map(s => ({
        id: s.id,
        camara: s.camara,
        producto: s.producto,
        cantidad: s.cantidad,
        pesoTotal: s.pesoTotal,
        fechaIngreso: s.fechaIngreso.toLocaleDateString('es-AR'),
        observaciones: s.observaciones
      }))
    })
  } catch (error) {
    console.error('Error fetching stock:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener stock' },
      { status: 500 }
    )
  }
}

// POST - Create new stock entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { camara, producto, cantidad, pesoTotal, observaciones } = body
    
    const stock = await db.stockCamara.create({
      data: {
        camara,
        producto,
        cantidad: parseInt(cantidad),
        pesoTotal: parseFloat(pesoTotal),
        observaciones
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: stock.id,
        camara: stock.camara,
        producto: stock.producto,
        cantidad: stock.cantidad,
        pesoTotal: stock.pesoTotal,
        fechaIngreso: stock.fechaIngreso.toLocaleDateString('es-AR')
      }
    })
  } catch (error) {
    console.error('Error creating stock:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear stock' },
      { status: 500 }
    )
  }
}
