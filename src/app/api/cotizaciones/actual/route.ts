import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { obtenerCotizacionBCRA, actualizarCotizacionDia } from '@/lib/moneda'

// GET - Obtener cotizaciones actuales (la más reciente de cada moneda)
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const monedaCodigo = searchParams.get('moneda')

    // Obtener todas las monedas activas
    const monedas = await db.moneda.findMany({
      where: { activa: true },
      orderBy: { codigo: 'asc' }
    })

    const cotizacionesActuales: any[] = []

    for (const moneda of monedas) {
      // Si se especifica una moneda, solo devolver esa
      if (monedaCodigo && moneda.codigo !== monedaCodigo.toUpperCase()) {
        continue
      }

      // Obtener la cotización más reciente
      const ultimaCotizacion = await db.cotizacion.findFirst({
        where: { monedaId: moneda.id },
        orderBy: { fecha: 'desc' }
      })

      cotizacionesActuales.push({
        moneda: {
          id: moneda.id,
          codigo: moneda.codigo,
          nombre: moneda.nombre,
          simbolo: moneda.simbolo,
          esDefault: moneda.esDefault
        },
        cotizacion: ultimaCotizacion ? {
          id: ultimaCotizacion.id,
          compra: ultimaCotizacion.compra,
          venta: ultimaCotizacion.venta,
          fecha: ultimaCotizacion.fecha,
          fuente: ultimaCotizacion.fuente
        } : null
      })
    }

    // Si se pidió una sola moneda, devolver solo esa
    if (monedaCodigo) {
      return NextResponse.json(cotizacionesActuales[0] || null)
    }

    return NextResponse.json(cotizacionesActuales)
  } catch (error) {
    console.error('Error al obtener cotizaciones actuales:', error)
    return NextResponse.json(
      { error: 'Error al obtener cotizaciones actuales' },
      { status: 500 }
    )
  }
}

// POST - Actualizar cotizaciones desde BCRA
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const data = await request.json()
    const { fuente } = data

    if (fuente === 'BCRA') {
      // Obtener cotización del BCRA
      const cotizacionBCRA = await obtenerCotizacionBCRA()
      
      if (!cotizacionBCRA) {
        return NextResponse.json(
          { error: 'No se pudo obtener la cotización del BCRA' },
          { status: 500 }
        )
      }

      // Buscar la moneda USD
      const monedaUSD = await db.moneda.findUnique({
        where: { codigo: 'USD' }
      })

      if (!monedaUSD) {
        return NextResponse.json(
          { error: 'Moneda USD no encontrada' },
          { status: 404 }
        )
      }

      // Actualizar o crear cotización del día
      const cotizacion = await actualizarCotizacionDia(
        monedaUSD.id,
        cotizacionBCRA.compra,
        cotizacionBCRA.venta,
        'BCRA'
      )

      return NextResponse.json({
        message: 'Cotización actualizada desde BCRA',
        cotizacion
      })
    }

    return NextResponse.json(
      { error: 'Fuente no válida' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error al actualizar cotización:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cotización' },
      { status: 500 }
    )
  }
}
