import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar ingresos de terceros
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const terceroId = searchParams.get('terceroId')
    const fecha = searchParams.get('fecha')
    
    const where: any = {}
    
    if (terceroId) {
      where.terceroId = terceroId
    }
    
    if (fecha) {
      const fechaInicio = new Date(fecha)
      fechaInicio.setHours(0, 0, 0, 0)
      const fechaFin = new Date(fecha)
      fechaFin.setHours(23, 59, 59, 999)
      where.fecha = { gte: fechaInicio, lte: fechaFin }
    }
    
    const ingresos = await db.ingresoTercero.findMany({
      where,
      include: {
        tercero: { select: { id: true, nombre: true, cuit: true } },
        camaraDestino: { select: { id: true, nombre: true } },
        operador: { select: { id: true, nombre: true } }
      },
      orderBy: { fecha: 'desc' }
    })
    
    return NextResponse.json({ success: true, data: ingresos })
  } catch (error) {
    console.error('Error fetching ingresos terceros:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener ingresos' }, { status: 500 })
  }
}

// POST - Crear nuevo ingreso de terceros
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json()
    const { 
      terceroId, 
      tipoCuarto, 
      tipificacion,
      cantidad, 
      pesoTotal, 
      camaraDestinoId,
      dte,
      guia,
      operadorId,
      observaciones 
    } = body
    
    // Validaciones
    if (!terceroId || !pesoTotal || pesoTotal <= 0) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios' }, { status: 400 })
    }
    
    // Generar código único
    const ultimoIngreso = await db.ingresoTercero.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { codigo: true }
    })
    
    const numeroIngreso = ultimoIngreso?.codigo 
      ? parseInt(ultimoIngreso.codigo.replace('IT-', '')) + 1 
      : 1
    
    const codigo = `IT-${numeroIngreso.toString().padStart(6, '0')}`
    
    const ingreso = await db.ingresoTercero.create({
      data: {
        codigo,
        terceroId,
        tipoCuarto: tipoCuarto || 'ASADO',
        tipificacion,
        especie: 'EQUINO', // Solo equino
        cantidad: cantidad || 1,
        pesoTotal,
        camaraDestinoId,
        dte,
        guia,
        operadorId,
        observaciones
      },
      include: {
        tercero: { select: { id: true, nombre: true, cuit: true } },
        camaraDestino: { select: { id: true, nombre: true } }
      }
    })
    
    return NextResponse.json({ success: true, data: ingreso })
  } catch (error) {
    console.error('Error creating ingreso tercero:', error)
    return NextResponse.json({ success: false, error: 'Error al crear ingreso' }, { status: 500 })
  }
}
