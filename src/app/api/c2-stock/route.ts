import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Stock de cajas C2 agrupado por producto/estado/cámara
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const agrupar = searchParams.get('agrupar') || 'producto' // producto, estado, camara, tropa
    const estado = searchParams.get('estado')
    const productoDesposteId = searchParams.get('productoDesposteId')
    const camaraId = searchParams.get('camaraId')
    const tropaCodigo = searchParams.get('tropaCodigo')

    const where: any = { productoDesposteId: { not: null } }
    if (estado) where.estado = estado
    if (productoDesposteId) where.productoDesposteId = productoDesposteId
    if (tropaCodigo) where.tropaCodigo = tropaCodigo

    // If filtering by cámara, get pallets in that camera
    if (camaraId) {
      const palletsEnCamara = await db.pallet.findMany({
        where: { camaraId },
        select: { id: true }
      })
      const palletIds = palletsEnCamara.map(p => p.id)
      // Cajas en pallets de esa cámara o cajas sueltas en esa cámara
      where.OR = [
        { palletId: { in: palletIds } },
        { palletId: null, estado: 'EN_CAMARA' }
      ]
    }

    // Get all matching boxes with product details
    const cajas = await db.cajaEmpaque.findMany({
      where,
      include: {
        productoDesposte: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            rubro: { select: { nombre: true } }
          }
        },
        pallet: {
          select: {
            id: true,
            numero: true,
            camara: { select: { id: true, nombre: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Agrupar según el criterio
    if (agrupar === 'producto') {
      const grupos = new Map<string, {
        productoId: string
        productoNombre: string
        productoCodigo: string
        rubroNombre: string
        cantidadCajas: number
        pesoNetoTotal: number
        porEstado: Record<string, { cantidad: number; peso: number }>
      }>()

      for (const caja of cajas) {
        const pd = caja.productoDesposte
        if (!pd) continue
        const key = pd.id
        if (!grupos.has(key)) {
          grupos.set(key, {
            productoId: pd.id,
            productoNombre: pd.nombre,
            productoCodigo: pd.codigo,
            rubroNombre: pd.rubro?.nombre || 'Sin rubro',
            cantidadCajas: 0,
            pesoNetoTotal: 0,
            porEstado: {}
          })
        }
        const g = grupos.get(key)!
        g.cantidadCajas++
        g.pesoNetoTotal += caja.pesoNeto
        if (!g.porEstado[caja.estado]) {
          g.porEstado[caja.estado] = { cantidad: 0, peso: 0 }
        }
        g.porEstado[caja.estado].cantidad++
        g.porEstado[caja.estado].peso += caja.pesoNeto
      }

      return NextResponse.json({
        success: true,
        data: Array.from(grupos.values()).sort((a, b) => b.pesoNetoTotal - a.pesoNetoTotal),
        resumen: {
          totalCajas: cajas.length,
          totalPesoNeto: cajas.reduce((s, c) => s + c.pesoNeto, 0),
          productosDistintos: grupos.size
        }
      })

    } else if (agrupar === 'estado') {
      const grupos = new Map<string, { estado: string; cantidadCajas: number; pesoNetoTotal: number }>()

      for (const caja of cajas) {
        const key = caja.estado
        if (!grupos.has(key)) {
          grupos.set(key, { estado: key, cantidadCajas: 0, pesoNetoTotal: 0 })
        }
        const g = grupos.get(key)!
        g.cantidadCajas++
        g.pesoNetoTotal += caja.pesoNeto
      }

      return NextResponse.json({
        success: true,
        data: Array.from(grupos.values()).sort((a, b) => b.pesoNetoTotal - a.pesoNetoTotal)
      })

    } else if (agrupar === 'camara') {
      const grupos = new Map<string, { camaraId: string; camaraNombre: string; cantidadCajas: number; pesoNetoTotal: number }>()

      for (const caja of cajas) {
        const camNombre = caja.pallet?.camara?.nombre || 'Sin cámara'
        const camId = caja.pallet?.camara?.id || 'sin-camara'
        const key = camId
        if (!grupos.has(key)) {
          grupos.set(key, { camaraId: camId, camaraNombre: camNombre, cantidadCajas: 0, pesoNetoTotal: 0 })
        }
        const g = grupos.get(key)!
        g.cantidadCajas++
        g.pesoNetoTotal += caja.pesoNeto
      }

      return NextResponse.json({
        success: true,
        data: Array.from(grupos.values()).sort((a, b) => b.pesoNetoTotal - a.pesoNetoTotal)
      })

    } else if (agrupar === 'tropa') {
      const grupos = new Map<string, { tropaCodigo: string; cantidadCajas: number; pesoNetoTotal: number; productosDistintos: number; productos: Map<string, number> }>()

      for (const caja of cajas) {
        const key = caja.tropaCodigo || 'SIN-TROPA'
        if (!grupos.has(key)) {
          grupos.set(key, { tropaCodigo: key, cantidadCajas: 0, pesoNetoTotal: 0, productosDistintos: 0, productos: new Map() })
        }
        const g = grupos.get(key)!
        g.cantidadCajas++
        g.pesoNetoTotal += caja.pesoNeto
        const pNombre = caja.productoDesposte?.nombre || 'Sin producto'
        g.productos.set(pNombre, (g.productos.get(pNombre) || 0) + caja.pesoNeto)
        g.productosDistintos = g.productos.size
      }

      const result = Array.from(grupos.values()).map(g => ({
        tropaCodigo: g.tropaCodigo,
        cantidadCajas: g.cantidadCajas,
        pesoNetoTotal: g.pesoNetoTotal,
        productosDistintos: g.productosDistintos,
        productos: Object.fromEntries(g.productos)
      })).sort((a, b) => b.pesoNetoTotal - a.pesoNetoTotal)

      return NextResponse.json({
        success: true,
        data: result
      })
    }

    // Default: return raw cajas
    return NextResponse.json({
      success: true,
      data: cajas,
      total: cajas.length
    })
  } catch (error) {
    console.error('Error fetching stock C2:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener stock C2' },
      { status: 500 }
    )
  }
}
