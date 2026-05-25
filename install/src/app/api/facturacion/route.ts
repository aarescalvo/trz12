import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Fetch facturas
export async function GET(request: NextRequest) {
  try {
    const authError = await checkPermission(request, 'puedeFacturacion')
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const clienteId = searchParams.get('clienteId')
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const search = searchParams.get('search')
    
    let where: any = {}
    
    if (estado && estado !== 'TODOS') {
      where.estado = estado
    }
    
    if (clienteId) {
      where.clienteId = clienteId
    }
    
    if (desde || hasta) {
      where.fecha = {}
      if (desde) {
        where.fecha.gte = new Date(desde)
      }
      if (hasta) {
        where.fecha.lte = new Date(hasta + 'T23:59:59')
      }
    }
    
    if (search) {
      where.OR = [
        { numero: { contains: search } },
        { cliente: { nombre: { contains: search } } },
        { remito: { contains: search } }
      ]
    }
    
    const facturas = await db.factura.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            cuit: true,
            direccion: true
          }
        },
        detalles: {
          orderBy: { createdAt: 'asc' }
        },
        operador: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({
      success: true,
      data: facturas
    })
  } catch (error) {
    console.error('Error fetching facturas:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener facturas' },
      { status: 500 }
    )
  }
}

// POST - Create new factura
export async function POST(request: NextRequest) {
  try {
    const authError = await checkPermission(request, 'puedeFacturacion')
    if (authError) return authError

    const body = await request.json()
    const { 
      clienteId, 
      fecha,
      detalles,
      observaciones,
      condicionVenta,
      remito 
    } = body
    
    // Obtener operadorId del header (middleware JWT), no del body (previene suplantación)
    const operadorId = request.headers.get('x-operador-id')
    
    if (!clienteId) {
      return NextResponse.json(
        { success: false, error: 'El cliente es requerido' },
        { status: 400 }
      )
    }
    
    if (!detalles || detalles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Debe agregar al menos un detalle' },
        { status: 400 }
      )
    }
    
    // Obtener el último número de factura
    const numerador = await db.numerador.upsert({
      where: { nombre: 'FACTURA' },
      update: { ultimoNumero: { increment: 1 } },
      create: { nombre: 'FACTURA', ultimoNumero: 1 }
    })
    
    const numeroInterno = numerador.ultimoNumero
    const numero = String(numeroInterno).padStart(8, '0')
    
    // Calcular totales
    let subtotal = 0
    const detallesCalculados = detalles.map((d: any) => {
      const subtotalDetalle = Number(d.cantidad) * Number(d.precioUnitario)
      subtotal += subtotalDetalle
      return {
        ...d,
        subtotal: subtotalDetalle
      }
    })
    
    const iva = subtotal * 0.21 // IVA 21%
    const total = subtotal + iva
    
    // Crear la factura con sus detalles
    const factura = await db.factura.create({
      data: {
        numero,
        numeroInterno,
        clienteId,
        fecha: fecha ? new Date(fecha) : new Date(),
        subtotal,
        iva,
        total,
        observaciones: observaciones || null,
        condicionVenta: condicionVenta || null,
        remito: remito || null,
        operadorId: operadorId || null,
        detalles: {
          create: detallesCalculados.map((d: any) => ({
            tipoProducto: d.tipoProducto,
            descripcion: d.descripcion,
            cantidad: Number(d.cantidad),
            unidad: d.unidad || 'KG',
            precioUnitario: Number(d.precioUnitario),
            subtotal: d.subtotal,
            tropaCodigo: d.tropaCodigo || null,
            garron: d.garron || null,
            mediaResId: d.mediaResId || null,
            pesoKg: d.pesoKg ? Number(d.pesoKg) : null
          }))
        }
      },
      include: {
        cliente: true,
        detalles: true,
        operador: true
      }
    })
    
    return NextResponse.json({
      success: true,
      data: factura
    })
  } catch (error) {
    console.error('Error creating factura:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear factura' },
      { status: 500 }
    )
  }
}
