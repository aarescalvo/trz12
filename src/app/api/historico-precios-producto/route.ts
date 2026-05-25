import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener histórico de precios por producto
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const productoVendibleId = searchParams.get('productoVendibleId')
    const clienteId = searchParams.get('clienteId')

    if (!productoVendibleId) {
      return NextResponse.json(
        { success: false, error: 'productoVendibleId es requerido' },
        { status: 400 }
      )
    }

    // Obtener datos del producto
    const producto = await db.productoVendible.findUnique({
      where: { id: productoVendibleId },
      include: {
        preciosHistorico: {
          orderBy: { fechaVigencia: 'desc' },
          take: 50
        },
        preciosCliente: clienteId ? {
          where: {
            clienteId,
            activo: true
          },
          orderBy: { createdAt: 'desc' }
        } : false
      }
    })

    if (!producto) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Calcular variaciones
    const historicoConVariacion = producto.preciosHistorico.map((precio, index, arr) => {
      const precioAnterior = arr[index + 1]?.precioNuevo
      const variacion = precioAnterior 
        ? ((precio.precioNuevo - precioAnterior) / precioAnterior) * 100 
        : 0

      return {
        ...precio,
        precioAnterior: precioAnterior || null,
        variacionPorcentaje: variacion ? variacion.toFixed(2) : null
      }
    })

    // Obtener precios facturados a este cliente (opcional)
    let preciosFacturadosCliente: Array<{ fecha?: Date; facturaNumero?: string; precio: number; kg: number; subtotal: number }> = []
    if (clienteId) {
      const ultimasFacturas = await db.detalleFactura.findMany({
        where: {
          facturaId: { not: undefined },
        },
        include: {
          factura: {
            select: {
              fecha: true,
              numero: true,
              clienteId: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        distinct: ['facturaId'],
        take: 20
      })

      preciosFacturadosCliente = ultimasFacturas.map((detalle) => ({
        fecha: detalle.factura?.fecha,
        facturaNumero: detalle.factura?.numero,
        precio: detalle.precioUnitario,
        kg: detalle.cantidad,
        subtotal: detalle.subtotal
      }))
    }

    return NextResponse.json({
      success: true,
      data: {
        producto: {
          id: producto.id,
          codigo: producto.codigo,
          nombre: producto.nombre,
          categoria: producto.categoria,
          precioBase: producto.precioBase,
          moneda: producto.moneda
        },
        historicoLista: historicoConVariacion,
        precioClienteActual: clienteId ? producto.preciosCliente?.[0] || null : null,
        preciosFacturadosCliente
      }
    })
  } catch (error) {
    console.error('Error obteniendo histórico de precios:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener histórico de precios' },
      { status: 500 }
    )
  }
}

// POST - Registrar nuevo precio
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json()
    const {
      productoVendibleId,
      precioNuevo,
      moneda,
      motivo,
      operadorId,
      observaciones
    } = body

    if (!productoVendibleId || !precioNuevo) {
      return NextResponse.json(
        { success: false, error: 'productoVendibleId y precioNuevo son requeridos' },
        { status: 400 }
      )
    }

    // Obtener precio actual
    const ultimoPrecio = await db.historicoPrecioProducto.findFirst({
      where: { productoVendibleId },
      orderBy: { fechaVigencia: 'desc' }
    })

    // Cerrar vigencia del precio anterior si existe
    if (ultimoPrecio && !(ultimoPrecio as Record<string, unknown>).fechaFin) {
      await db.historicoPrecioProducto.update({
        where: { id: ultimoPrecio.id },
        data: { motivo: `Cerrado: ${new Date().toISOString()}` }
      })
    }

    // Crear nuevo precio
    const nuevoPrecio = await db.historicoPrecioProducto.create({
      data: {
        productoVendibleId,
        precioAnterior: ultimoPrecio?.precioNuevo || null,
        precioNuevo,
        moneda: moneda || 'ARS',
        motivo,
        operadorId
      }
    })

    // Actualizar precio base del producto
    await db.productoVendible.update({
      where: { id: productoVendibleId },
      data: { precioBase: precioNuevo }
    })

    return NextResponse.json({
      success: true,
      data: nuevoPrecio,
      message: `Precio actualizado a ${moneda || 'ARS'} ${precioNuevo.toFixed(2)}`
    })
  } catch (error) {
    console.error('Error registrando nuevo precio:', error)
    return NextResponse.json(
      { success: false, error: 'Error al registrar nuevo precio' },
      { status: 500 }
    )
  }
}
