import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar movimientos de cámara
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const camaraOrigenId = searchParams.get('camaraOrigenId')
    const camaraDestinoId = searchParams.get('camaraDestinoId')
    const fecha = searchParams.get('fecha')
    
    const where: any = {}
    
    if (camaraOrigenId) {
      where.camaraOrigenId = camaraOrigenId
    }
    
    if (camaraDestinoId) {
      where.camaraDestinoId = camaraDestinoId
    }
    
    if (fecha) {
      const fechaInicio = new Date(fecha)
      fechaInicio.setHours(0, 0, 0, 0)
      const fechaFin = new Date(fecha)
      fechaFin.setHours(23, 59, 59, 999)
      where.fecha = { gte: fechaInicio, lte: fechaFin }
    }
    
    const movimientos = await db.movimientoCamara.findMany({
      where,
      include: {
        camaraOrigen: { select: { id: true, nombre: true, tipo: true } },
        camaraDestino: { select: { id: true, nombre: true, tipo: true } },
        operador: { select: { id: true, nombre: true } }
      },
      orderBy: { fecha: 'desc' }
    })
    
    return NextResponse.json({ success: true, data: movimientos })
  } catch (error) {
    console.error('Error fetching movimientos cámara:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener movimientos' }, { status: 500 })
  }
}

// POST - Crear nuevo movimiento de cámara
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json()
    const { 
      camaraOrigenId, 
      camaraDestinoId, 
      tipoProducto, 
      cantidad, 
      peso, 
      tropaCodigo,
      mediaResId,
      observaciones, 
      operadorId 
    } = body
    
    // Validaciones
    if (!camaraOrigenId || !camaraDestinoId) {
      return NextResponse.json({ success: false, error: 'Cámaras de origen y destino requeridas' }, { status: 400 })
    }
    
    if (camaraOrigenId === camaraDestinoId) {
      return NextResponse.json({ success: false, error: 'Las cámaras de origen y destino deben ser diferentes' }, { status: 400 })
    }
    
    const movimiento = await db.movimientoCamara.create({
      data: {
        camaraOrigenId,
        camaraDestinoId,
        producto: tipoProducto,
        cantidad: cantidad || 1,
        peso: peso || 0,
        tropaCodigo,
        mediaResId,
        observaciones,
        operadorId
      },
      include: {
        camaraOrigen: { select: { id: true, nombre: true } },
        camaraDestino: { select: { id: true, nombre: true } }
      }
    })
    
    return NextResponse.json({ success: true, data: movimiento })
  } catch (error) {
    console.error('Error creating movimiento cámara:', error)
    return NextResponse.json({ success: false, error: 'Error al crear movimiento' }, { status: 500 })
  }
}
