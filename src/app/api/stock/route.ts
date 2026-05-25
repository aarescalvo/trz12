import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Fetch all stock (usando StockMediaRes)
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const camaraId = searchParams.get('camaraId')
    
    // Parse pagination params with defaults
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const where: Record<string, unknown> = {}
    
    if (camaraId) {
      where.camaraId = camaraId
    }
    
    const [stock, total] = await Promise.all([
      db.stockMediaRes.findMany({
        where,
        include: {
          camara: { select: { id: true, nombre: true } }
        },
        orderBy: {
          fechaIngreso: 'desc'
        },
        take: limit,
        skip: offset
      }),
      db.stockMediaRes.count({ where })
    ])
    
    return NextResponse.json({
      success: true,
      data: stock.map(s => ({
        id: s.id,
        camaraId: s.camaraId,
        camara: s.camara?.nombre,
        tropaCodigo: s.tropaCodigo,
        especie: s.especie,
        cantidad: s.cantidad,
        pesoTotal: s.pesoTotal,
        fechaIngreso: s.fechaIngreso.toLocaleDateString('es-AR')
      })),
      pagination: { total, limit, offset, pages: Math.ceil(total / limit) }
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
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json()
    const { camaraId, tropaCodigo, especie, cantidad, pesoTotal } = body
    
    if (!camaraId || !especie) {
      return NextResponse.json(
        { success: false, error: 'camaraId y especie son requeridos' },
        { status: 400 }
      )
    }
    
    const stock = await db.stockMediaRes.create({
      data: {
        camaraId,
        tropaCodigo,
        especie,
        cantidad: parseInt(cantidad) || 0,
        pesoTotal: parseFloat(pesoTotal) || 0
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: stock.id,
        camaraId: stock.camaraId,
        tropaCodigo: stock.tropaCodigo,
        especie: stock.especie,
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
