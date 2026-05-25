import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// ---- Type definitions for query result shapes ----
type ListaFaenaRow = {
  id: string; fecha: Date;
  tropas?: Array<{ tropa?: {
    id: string; codigo: string; cantidadCabezas: number;
    productor?: { nombre: string } | null;
    usuarioFaena?: { nombre: string } | null;
  } | null }>;
  asignaciones?: Array<{ tropaCodigo?: string; romaneoRef?: string }>;
};

type MediaResRow = { estado: string; peso?: number };
type RomaneoRow = { mediasRes?: MediaResRow[] };
type FacturaRow = { id: string; numero?: string; estado: string; total: number; fecha: Date; pagosFactura?: Array<{ monto: number }> };

export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const tropaCodigo = searchParams.get('tropaCodigo')

    // Build where clause for ListasFaena
    const listaFaenaWhere: Record<string, unknown> = {}
    if (fechaDesde || fechaHasta) {
      const fechaFilter: Record<string, unknown> = {}
      if (fechaDesde) fechaFilter.gte = new Date(fechaDesde)
      if (fechaHasta) {
        const hasta = new Date(fechaHasta)
        hasta.setHours(23, 59, 59, 999)
        fechaFilter.lte = hasta
      }
      listaFaenaWhere.fecha = fechaFilter
    }

    // Find all ListasFaena in the date range
    const listasFaena = await db.listaFaena.findMany({
      where: listaFaenaWhere,
      include: {
        tropas: {
          include: {
            tropa: {
              include: {
                productor: true,
                usuarioFaena: true,
                animales: true,
              }
            }
          }
        },
      } as Record<string, unknown>,
      orderBy: { fecha: 'desc' }
    }) as ListaFaenaRow[]

    // If tropaCodigo filter is specified, filter the results
    const filteredListas = tropaCodigo
      ? listasFaena.map(lf => ({
          ...lf,
          tropas: (lf.tropas || []).filter(t => (t.tropa?.codigo || '').toLowerCase().includes(tropaCodigo.toLowerCase()))
        })).filter(lf => (lf.tropas || []).length > 0)
      : listasFaena

    // Build the result array - one row per tropa
    const result: Array<Record<string, unknown>> = []

    for (const lista of filteredListas) {
      for (const listaTropa of lista.tropas || []) {
        const tropa = listaTropa.tropa
        if (!tropa) continue

        // Get romaneos for this tropa via asignaciones
        const romaneosDeTropa: unknown[] = (lista.asignaciones || [])
          .filter(a => a.tropaCodigo === tropa.codigo)
          .map(a => a.romaneoRef)
          .filter(Boolean)

        // Also fetch romaneos directly by tropaCodigo
        const romaneos: RomaneoRow[] = romaneosDeTropa.length > 0
          ? (romaneosDeTropa as RomaneoRow[])
          : await db.romaneo.findMany({
              where: { tropaCodigo: tropa.codigo },
              include: {
                mediasRes: {
                  include: {
                    despachoItems: {
                      include: {
                        despacho: true
                      }
                    }
                  }
                }
              }
            }) as RomaneoRow[]

        // Get all medias for this tropa
        const allMedias: MediaResRow[] = romaneos.flatMap(r => r.mediasRes || [])

        const totalMedias = allMedias.length
        const mediasDespachadas = allMedias.filter(m => m.estado === 'DESPACHADO').length
        const mediasEnCamara = allMedias.filter(m => m.estado === 'EN_CAMARA').length
        const mediasFacturadas = 0

        const totalKgFaenados = allMedias.reduce((sum, m) => sum + (m.peso || 0), 0)
        const totalKgDespachados = allMedias
          .filter(m => m.estado === 'DESPACHADO')
          .reduce((sum, m) => sum + (m.peso || 0), 0)
        const totalKgFacturados = 0

        // Find facturas related to this tropa
        const facturasFromDetalles = await db.factura.findMany({
          where: {
            detalles: {
              some: {
                tropaCodigo: tropa.codigo
              }
            }
          },
          include: {
            pagosFactura: true
          }
        })

        const facturasFromDespacho = await db.factura.findMany({
          where: {
            detalles: {
              some: {
                tropaCodigo: tropa.codigo
              }
            }
          },
          include: {
            pagosFactura: true
          }
        })

        // Combine and deduplicate facturas
        const allFacturas = [...facturasFromDetalles, ...facturasFromDespacho]
        const uniqueFacturas: FacturaRow[] = Array.from(
          new Map(allFacturas.map((f: FacturaRow) => [f.id, f])).values()
        )

        const montoFacturado = uniqueFacturas.reduce((sum, f) => sum + (f.total || 0), 0)
        const montoCobrado = uniqueFacturas
          .filter(f => f.estado === 'PAGADA')
          .reduce((sum, f) => sum + (f.total || 0), 0)

        const porcentajeCicloCerrado = totalMedias > 0
          ? Math.round((mediasFacturadas / totalMedias) * 10000) / 100
          : 0

        result.push({
          tropaCodigo: tropa.codigo,
          tropaId: tropa.id,
          fechaFaena: lista.fecha,
          productorNombre: tropa.productor?.nombre || tropa.usuarioFaena?.nombre || '-',
          usuarioFaenaNombre: tropa.usuarioFaena?.nombre || '-',
          totalCabezas: tropa.cantidadCabezas,
          totalMedias,
          mediasDespachadas,
          mediasEnCamara,
          mediasFacturadas,
          totalKgFaenados: Math.round(totalKgFaenados * 100) / 100,
          totalKgDespachados: Math.round(totalKgDespachados * 100) / 100,
          totalKgFacturados: Math.round(totalKgFacturados * 100) / 100,
          montoFacturado: Math.round(montoFacturado * 100) / 100,
          montoCobrado: Math.round(montoCobrado * 100) / 100,
          porcentajeCicloCerrado,
          facturas: uniqueFacturas.map(f => ({
            id: f.id,
            numero: f.numero,
            estado: f.estado,
            total: f.total,
            saldo: f.total - (f.pagosFactura || []).reduce((s: number, p: any) => s + p.monto, 0),
            fecha: f.fecha
          }))
        })
      }
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error en conciliacion-faena-factura:', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar reporte de conciliación' },
      { status: 500 }
    )
  }
}
