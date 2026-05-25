import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

// GET - Listar todos los subproductos configurados
export async function GET() {
  try {
    const subproductos = await db.subproductoConfig.findMany({
      orderBy: [
        { categoria: 'asc' },
        { nombre: 'asc' }
      ]
    })
    
    return NextResponse.json({ success: true, data: subproductos })
  } catch (error) {
    console.error('Error fetching subproductos:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener subproductos' }, { status: 500 })
  }
}

// POST - Crear nuevo subproducto
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Verificar código único
    const existing = await db.subproductoConfig.findUnique({
      where: { codigo: data.codigo }
    })
    
    if (existing) {
      return NextResponse.json({ success: false, error: 'Ya existe un subproducto con ese código' }, { status: 400 })
    }
    
    const subproducto = await db.subproductoConfig.create({
      data: {
        id: randomUUID(),
        codigo: data.codigo,
        nombre: data.nombre,
        categoria: data.categoria,
        especie: data.especie || null,
        requiereFrio: data.requiereFrio ?? true,
        temperaturaMax: data.temperaturaMax ? parseFloat(data.temperaturaMax) : null,
        unidadMedida: data.unidadMedida || 'KG',
        rendimientoPct: data.rendimientoPct ? parseFloat(data.rendimientoPct) : null,
        generaRotulo: data.generaRotulo ?? false,
        codigoRotulo: data.codigoRotulo || null,
        precioReferencia: data.precioReferencia ? parseFloat(data.precioReferencia) : null,
        activo: data.activo ?? true,
        observaciones: data.observaciones || null
      }
    })
    
    return NextResponse.json({ success: true, data: subproducto })
  } catch (error) {
    console.error('Error creating subproducto:', error)
    return NextResponse.json({ success: false, error: 'Error al crear subproducto' }, { status: 500 })
  }
}

// PUT - Actualizar subproducto
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Verificar código único si se cambia
    if (data.codigo) {
      const existing = await db.subproductoConfig.findFirst({
        where: { 
          codigo: data.codigo,
          NOT: { id: data.id }
        }
      })
      
      if (existing) {
        return NextResponse.json({ success: false, error: 'Ya existe otro subproducto con ese código' }, { status: 400 })
      }
    }
    
    const subproducto = await db.subproductoConfig.update({
      where: { id: data.id },
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        categoria: data.categoria,
        especie: data.especie || null,
        requiereFrio: data.requiereFrio,
        temperaturaMax: data.temperaturaMax ? parseFloat(data.temperaturaMax) : null,
        unidadMedida: data.unidadMedida,
        rendimientoPct: data.rendimientoPct ? parseFloat(data.rendimientoPct) : null,
        generaRotulo: data.generaRotulo,
        codigoRotulo: data.codigoRotulo || null,
        precioReferencia: data.precioReferencia ? parseFloat(data.precioReferencia) : null,
        activo: data.activo,
        observaciones: data.observaciones || null
      }
    })
    
    return NextResponse.json({ success: true, data: subproducto })
  } catch (error) {
    console.error('Error updating subproducto:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar subproducto' }, { status: 500 })
  }
}

// DELETE - Eliminar subproducto
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }
    
    await db.subproductoConfig.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subproducto:', error)
    return NextResponse.json({ success: false, error: 'Error al eliminar subproducto' }, { status: 500 })
  }
}
