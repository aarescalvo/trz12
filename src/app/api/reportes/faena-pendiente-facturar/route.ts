import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const clienteId = searchParams.get('clienteId')

    // Find all MediaRes that are dispatched but not facturadas
    const mediasWhere: any = {
      estado: 'DESPACHADO',
      facturado: false
    }

    if (clienteId) {
      mediasWhere.usuarioFaenaId = clienteId
    }

    const mediasPendientes = await db.mediaRes.findMany({
      where: mediasWhere,
      include: {
        romaneo: {
          select: {
            tropaCodigo: true,
            garron: true
          }
        },
        usuarioFaena: {
          select: {
            id: true,
            nombre: true
          }
        },
        despachoItems: {
          include: {
            despacho: {
              select: {
                id: true,
                numero: true,
                fecha: true,
                estado: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Filter by date range on despacho fecha
    let filteredMedias = mediasPendientes
    if (fechaDesde || fechaHasta) {
      filteredMedias = mediasPendientes.filter(m => {
        const despacho = m.despachoItems[0]?.despacho
        if (!despacho) return false
        const fecha = new Date(despacho.fecha)
        if (fechaDesde && fecha < new Date(fechaDesde)) return false
        if (fechaHasta) {
          const hasta = new Date(fechaHasta)
          hasta.setHours(23, 59, 59, 999)
          if (fecha > hasta) return false
        }
        return true
      })
    }

    const now = new Date()

    // Get precio for FAENA service (for estimated price calculation)
    let precioFaena: number | null = null
    const servicioFaena = await db.tipoServicio.findFirst({
      where: { codigo: 'FAENA', activo: true }
    })

    // Build result array
    const items = filteredMedias.map(m => {
      const despachoItem = m.despachoItems[0]
      const despacho = despachoItem?.despacho
      const fechaDespacho = despacho ? new Date(despacho.fecha) : null

      // Days since dispatch
      const diasSinFacturar = fechaDespacho
        ? Math.floor((now.getTime() - fechaDespacho.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      // Alert level
      let alerta: string
      if (diasSinFacturar < 7) alerta = 'NORMAL'
      else if (diasSinFacturar < 15) alerta = 'ATENCION'
      else if (diasSinFacturar < 30) alerta = 'URGENTE'
      else alerta = 'CRITICO'

      // Estimate price
      const precioEstimado = precioFaena ? m.peso * precioFaena : null

      return {
        mediaResId: m.id,
        codigo: m.codigo,
        tropaCodigo: m.romaneo.tropaCodigo || '-',
        garron: m.romaneo.garron,
        peso: m.peso,
        lado: m.lado,
        usuarioId: m.usuarioFaenaId,
        usuarioNombre: m.usuarioFaena?.nombre || '-',
        despachoId: despacho?.id || null,
        despachoNumero: despacho?.numero || null,
        fechaDespacho: despacho?.fecha || null,
        diasSinFacturar,
        precioEstimado,
        alerta
      }
    })

    // If we have clienteId, look up specific precio
    if (clienteId && servicioFaena) {
      const precioCliente = await db.precioServicio.findFirst({
        where: {
          tipoServicioId: servicioFaena.id,
          clienteId,
          fechaHasta: null
        },
        orderBy: { fechaDesde: 'desc' }
      })
      if (precioCliente) {
        precioFaena = precioCliente.precio
        // Update estimated prices
        items.forEach(item => {
          item.precioEstimado = item.peso * precioFaena!
        })
      }
    } else if (servicioFaena) {
      // Get general precio
      const precioGeneral = await db.precioServicio.findFirst({
        where: {
          tipoServicioId: servicioFaena.id,
          fechaHasta: null
        },
        orderBy: { fechaDesde: 'desc' }
      })
      if (precioGeneral) {
        precioFaena = precioGeneral.precio
        items.forEach(item => {
          item.precioEstimado = item.peso * precioFaena!
        })
      }
    }

    // Summary
    const totalMedias = items.length
    const totalKg = items.reduce((sum, i) => sum + i.peso, 0)
    const totalEstimado = items.reduce((sum, i) => sum + (i.precioEstimado || 0), 0)

    const byAlert = {
      NORMAL: { count: 0, kg: 0, monto: 0 },
      ATENCION: { count: 0, kg: 0, monto: 0 },
      URGENTE: { count: 0, kg: 0, monto: 0 },
      CRITICO: { count: 0, kg: 0, monto: 0 }
    }
    items.forEach(i => {
      byAlert[i.alerta as keyof typeof byAlert].count++
      byAlert[i.alerta as keyof typeof byAlert].kg += i.peso
      byAlert[i.alerta as keyof typeof byAlert].monto += i.precioEstimado || 0
    })

    return NextResponse.json({
      success: true,
      data: {
        items,
        summary: {
          totalMedias,
          totalKg: Math.round(totalKg * 100) / 100,
          totalEstimado: Math.round(totalEstimado * 100) / 100,
          byAlert
        }
      }
    })
  } catch (error) {
    console.error('Error en faena-pendiente-facturar:', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar reporte de pendientes de facturación' },
      { status: 500 }
    )
  }
}
