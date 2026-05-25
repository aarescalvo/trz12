import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validarPermiso } from '@/lib/auth-helpers'

function getOperadorId(request: NextRequest): string | null {
  return request.headers.get('x-operador-id')
}

// GET - List tributos for a factura
export async function GET(request: NextRequest) {
  try {
    const operadorId = getOperadorId(request)
    const puedeVer = await validarPermiso(operadorId, 'puedeFacturacion')
    if (!puedeVer) {
      return NextResponse.json({ success: false, error: 'Sin permisos de facturación' }, { status: 403 })
    }
    const { searchParams } = new URL(request.url)
    const facturaId = searchParams.get('facturaId')
    
    const where: any = {}
    if (facturaId) where.facturaId = facturaId
    
    const tributos = await db.facturaTributo.findMany({
      where,
      orderBy: { createdAt: 'asc' }
    })
    
    return NextResponse.json({ success: true, data: tributos })
  } catch (error) {
    console.error('Error fetching tributos:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener tributos' }, { status: 500 })
  }
}

// POST - Add tributo to a factura
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { facturaId, tributoId, descripcion, baseImponible, alicuota, importe, operadorId } = body
    
    const puedeFacturar = await validarPermiso(operadorId, 'puedeFacturacion')
    if (!puedeFacturar) {
      return NextResponse.json({ success: false, error: 'Sin permisos de facturación' }, { status: 403 })
    }
    
    if (!facturaId || !descripcion) {
      return NextResponse.json({ success: false, error: 'Factura y descripción son requeridos' }, { status: 400 })
    }
    
    const tributo = await db.facturaTributo.create({
      data: { 
        facturaId, 
        tributoId: tributoId || 1, 
        descripcion, 
        baseImponible: baseImponible || 0, 
        alicuota: alicuota || 0, 
        importe: importe || 0 
      }
    })
    
    // Update factura importeTributos
    const allTributos = await db.facturaTributo.findMany({ where: { facturaId } })
    const totalTributos = allTributos.reduce((sum, t) => sum + t.importe, 0)
    // Total tributos calculated but not stored on Factura (field doesn't exist)
    void totalTributos
    
    return NextResponse.json({ success: true, data: tributo })
  } catch (error) {
    console.error('Error creating tributo:', error)
    return NextResponse.json({ success: false, error: 'Error al crear tributo' }, { status: 500 })
  }
}

// DELETE - Remove tributo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const operadorId = request.headers.get('x-operador-id')
    const puedeFacturar = await validarPermiso(operadorId, 'puedeFacturacion')
    if (!puedeFacturar) {
      return NextResponse.json({ success: false, error: 'Sin permisos de facturación' }, { status: 403 })
    }
    if (!id) return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    
    const tributo = await db.facturaTributo.delete({ where: { id } })
    
    // Recalculate total
    const allTributos = await db.facturaTributo.findMany({ where: { facturaId: tributo.facturaId } })
    const totalTributos = allTributos.reduce((sum, t) => sum + t.importe, 0)
    // Total tributos calculated but not stored on Factura (field doesn't exist)
    void totalTributos
    
    return NextResponse.json({ success: true, message: 'Tributo eliminado' })
  } catch (error) {
    console.error('Error deleting tributo:', error)
    return NextResponse.json({ success: false, error: 'Error al eliminar tributo' }, { status: 500 })
  }
}
