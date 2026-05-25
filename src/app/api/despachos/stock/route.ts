import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener stock disponible para despacho por cliente/usuario faena
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')
    const camaraId = searchParams.get('camaraId')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    // Construir filtros
    const whereStock: Record<string, unknown> = { estado: 'EN_CAMARA' }
    const whereRomaneo: Record<string, unknown> = {}

    if (camaraId) whereStock.camaraId = camaraId
    if (fechaDesde || fechaHasta) {
      const fechaFilter: Record<string, Date> = {}
      if (fechaDesde) fechaFilter.gte = new Date(fechaDesde)
      if (fechaHasta) fechaFilter.lte = new Date(fechaHasta + 'T23:59:59')
      whereRomaneo.fecha = fechaFilter
    }

    // Si hay cliente, filtrar por tropas de ese cliente
    let tropasDelCliente: string[] = []
    if (clienteId) {
      const tropas = await db.tropa.findMany({
        where: { usuarioFaenaId: clienteId },
        select: { codigo: true }
      })
      tropasDelCliente = tropas.map(t => t.codigo)
    }

    // Obtener medias res en cámara
    const mediasRes = await db.mediaRes.findMany({
      where: {
        ...whereStock,
        ...(tropasDelCliente.length > 0 ? { romaneo: { tropaCodigo: { in: tropasDelCliente } } } : {})
      },
      include: {
        romaneo: {
          select: {
            garron: true,
            tropaCodigo: true,
            fecha: true,
            tipoAnimal: true,
            pesoVivo: true
          }
        },
        camara: { select: { id: true, nombre: true } }
      }
    })

    // Agrupar por cámara, tropa y tipo
    const stockAgrupado = new Map<string, {
      camaraId: string
      camaraNombre: string
      tropaCodigo: string | null
      fechaFaena: Date | null
      cantidad: number
      pesoTotal: number
      tipoProducto: string
    }>()

    mediasRes.forEach(media => {
      const key = `${media.camaraId}-${media.romaneo.tropaCodigo || 'sin-tropa'}-MEDIA_RES`
      const existing = stockAgrupado.get(key)
      
      if (existing) {
        existing.cantidad++
        existing.pesoTotal += media.peso
      } else {
        stockAgrupado.set(key, {
          camaraId: media.camaraId || '',
          camaraNombre: media.camara?.nombre || 'Sin cámara',
          tropaCodigo: media.romaneo.tropaCodigo,
          fechaFaena: media.romaneo.fecha,
          cantidad: 1,
          pesoTotal: media.peso,
          tipoProducto: 'MEDIA_RES'
        })
      }
    })

    // También obtener menudencias disponibles
    const menudencias = await db.menudencia.findMany({
      where: {
        pesoElaborado: { not: null },
        ...(tropasDelCliente.length > 0 ? { tropaCodigo: { in: tropasDelCliente } } : {})
      },
      include: {
        tipoMenudencia: { select: { nombre: true } }
      }
    })

    // Agrupar menudencias
    menudencias.forEach(m => {
      if (!m.pesoElaborado) return
      const key = `MENUDENCIA-${m.tipoMenudencia.nombre}`
      const existing = stockAgrupado.get(key)
      
      if (existing) {
        existing.cantidad++
        existing.pesoTotal += m.pesoElaborado
      } else {
        stockAgrupado.set(key, {
          camaraId: '',
          camaraNombre: 'Menudencias',
          tropaCodigo: m.tropaCodigo,
          fechaFaena: m.fechaIngreso,
          cantidad: 1,
          pesoTotal: m.pesoElaborado,
          tipoProducto: 'MENUDENCIA'
        })
      }
    })

    const stock = Array.from(stockAgrupado.values())
      .sort((a, b) => a.camaraNombre.localeCompare(b.camaraNombre))

    return NextResponse.json({ success: true, data: stock })
  } catch (error) {
    console.error('Error fetching stock for despacho:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener stock' },
      { status: 500 }
    )
  }
}
