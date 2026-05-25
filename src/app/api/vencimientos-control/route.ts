import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'
import type { Prisma, EstadoCaja } from '@prisma/client'

interface VencimientoItem {
  id: string
  tipo: string
  codigo: string
  lote: string
  producto: string
  peso: number
  fechaIngreso: string
  fechaVencimiento: string
  diasRestantes: number
  camara: string
  camaraId?: string | null
  estado: 'VENCIDO' | 'PROXIMO' | 'OK'
  usuarioFaena?: string | null
  pallet?: string | null
  cantidad?: number | null
}

// GET - Control de vencimientos de stock con filtros avanzados
export async function GET(request: NextRequest) {
  try {
    const authError = await checkPermission(request, 'puedeStock')
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const camaraId = searchParams.get('camaraId')
    const estado = searchParams.get('estado') // 'VENCIDO', 'PROXIMO', 'OK'
    const tipo = searchParams.get('tipo') // 'MEDIA_RES', 'CAJA', 'PRODUCTO'

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const items: VencimientoItem[] = []

    // 1. Medias de res en cámara
    const whereMedias: Prisma.MediaResWhereInput = { estado: 'EN_CAMARA' }
    if (camaraId) whereMedias.camaraId = camaraId

    const medias = await db.mediaRes.findMany({
      where: whereMedias,
      include: {
        camara: { select: { id: true, nombre: true } },
        romaneo: {
          select: {
            tropaCodigo: true,
            fecha: true
          }
        },
        usuarioFaena: {
          select: { nombre: true }
        }
      }
    })

    for (const media of medias) {
      const ingresoDate = media.createdAt
      const diasEnCamara = Math.floor((hoy.getTime() - new Date(ingresoDate).getTime()) / (1000 * 60 * 60 * 24))
      // Default 30 days for media res
      const diasVencimiento = 30
      const diasRestantes = diasVencimiento - diasEnCamara

      let estadoItem: 'VENCIDO' | 'PROXIMO' | 'OK'
      if (diasRestantes <= 0) estadoItem = 'VENCIDO'
      else if (diasRestantes <= 7) estadoItem = 'PROXIMO'
      else estadoItem = 'OK'

      // Apply filter
      if (estado && estadoItem !== estado) continue
      if (tipo && tipo !== 'MEDIA_RES') continue

      const fechaVencimiento = new Date(new Date(ingresoDate).getTime() + diasVencimiento * 24 * 60 * 60 * 1000)

      items.push({
        id: media.id,
        tipo: 'MEDIA_RES',
        codigo: media.codigo,
        lote: media.romaneo?.tropaCodigo || '-',
        producto: `Media Res ${media.lado} - ${media.sigla}`,
        peso: media.peso,
        fechaIngreso: ingresoDate.toISOString(),
        fechaVencimiento: fechaVencimiento.toISOString(),
        diasRestantes: Math.max(diasRestantes, 0),
        camara: media.camara?.nombre || 'N/A',
        camaraId: media.camara?.id,
        estado: estadoItem,
        usuarioFaena: media.usuarioFaena?.nombre
      })
    }

    // 2. Cajas de empaque
    const whereCajas: Record<string, unknown> = {}
    if (estado === 'VENCIDO') {
      // Cajas created more than 90 days ago
      const limiteVencimiento = new Date(hoy.getTime() - 90 * 24 * 60 * 60 * 1000)
      whereCajas.createdAt = { lte: limiteVencimiento }
    }

     
    const cajas = await db.cajaEmpaque.findMany({
      where: { estado: 'ARMADA' },
      include: {
        producto: { select: { nombre: true, diasConservacion: true } },
        pallet: { select: { id: true, codigo: true } }
      } as any
    })

     
    for (const caja of cajas as any[]) {
      const diasConservacion = caja.producto?.diasConservacion || 90
      const diasEnStock = Math.floor((hoy.getTime() - new Date(caja.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      const diasRestantes = diasConservacion - diasEnStock

      let estadoItem: 'VENCIDO' | 'PROXIMO' | 'OK'
      if (diasRestantes <= 0) estadoItem = 'VENCIDO'
      else if (diasRestantes <= 7) estadoItem = 'PROXIMO'
      else estadoItem = 'OK'

      if (estado && estadoItem !== estado) continue
      if (tipo && tipo !== 'CAJA') continue

      const fechaVencimiento = new Date(new Date(caja.createdAt).getTime() + diasConservacion * 24 * 60 * 60 * 1000)

      items.push({
        id: caja.id,
        tipo: 'CAJA',
        codigo: caja.codigoBarras || caja.numero,
        lote: caja.tropaCodigo || '-',
        producto: caja.producto?.nombre || 'Caja Empaque',
        peso: caja.pesoNeto || 0,
        fechaIngreso: caja.createdAt.toISOString(),
        fechaVencimiento: fechaVencimiento.toISOString(),
        diasRestantes: Math.max(diasRestantes, 0),
        camara: 'Depósito',
        estado: estadoItem,
        pallet: caja.pallet?.codigo
      })
    }

    // 3. Stock de productos con vencimiento
    const stockProductos = await db.stockProducto.findMany({
      include: {
        camara: { select: { id: true, nombre: true } },
        producto: { select: { nombre: true, diasConservacion: true, especie: true } }
      }
    })

    for (const stock of stockProductos) {
      const diasConservacion = stock.producto?.diasConservacion || 60
      const diasEnStock = Math.floor((hoy.getTime() - new Date(stock.fechaIngreso).getTime()) / (1000 * 60 * 60 * 24))
      const diasRestantes = diasConservacion - diasEnStock

      let estadoItem: 'VENCIDO' | 'PROXIMO' | 'OK'
      if (diasRestantes <= 0) estadoItem = 'VENCIDO'
      else if (diasRestantes <= 7) estadoItem = 'PROXIMO'
      else estadoItem = 'OK'

      if (estado && estadoItem !== estado) continue
      if (tipo && tipo !== 'PRODUCTO') continue

      const fechaVencimiento = new Date(new Date(stock.fechaIngreso).getTime() + diasConservacion * 24 * 60 * 60 * 1000)

      items.push({
        id: stock.id,
        tipo: 'PRODUCTO',
        codigo: stock.tropaCodigo || stock.id.slice(0, 8),
        lote: stock.tropaCodigo || stock.lote || '-',
        producto: stock.productoNombre || stock.producto?.nombre || 'Producto',
        peso: stock.pesoTotal,
        cantidad: stock.cantidad,
        fechaIngreso: stock.fechaIngreso.toISOString(),
        fechaVencimiento: fechaVencimiento.toISOString(),
        diasRestantes: Math.max(diasRestantes, 0),
        camara: stock.camara?.nombre || 'N/A',
        camaraId: stock.camara?.id,
        estado: estadoItem
      })
    }

    // Sort by urgency
    items.sort((a, b) => a.diasRestantes - b.diasRestantes)

    // Summary statistics
    const resumen = {
      vencidos: items.filter(i => i.estado === 'VENCIDO').length,
      proximos7: items.filter(i => i.estado === 'PROXIMO').length,
      ok: items.filter(i => i.estado === 'OK').length,
      total: items.length,
      pesoVencido: items.filter(i => i.estado === 'VENCIDO').reduce((acc, i) => acc + (i.peso || 0), 0),
      pesoProximo: items.filter(i => i.estado === 'PROXIMO').reduce((acc, i) => acc + (i.peso || 0), 0),
    }

    return NextResponse.json({
      success: true,
      data: items,
      resumen
    })
  } catch (error) {
    console.error('Error en control de vencimientos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener vencimientos' },
      { status: 500 }
    )
  }
}

// POST - Marcar batch como descartado/vencido
export async function POST(request: NextRequest) {
  try {
    const authError = await checkPermission(request, 'puedeStock')
    if (authError) return authError

    const body = await request.json()
    const { id, tipo, motivo, operadorId } = body

    if (!id || !tipo) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: id, tipo' },
        { status: 400 }
      )
    }

    let result

    if (tipo === 'MEDIA_RES') {
      result = await db.mediaRes.update({
        where: { id },
        data: { estado: 'DESPACHADO' } // Mark as dispatched/discarded
      })
    } else if (tipo === 'CAJA') {
      result = await db.cajaEmpaque.update({
        where: { id },
        data: { estado: 'DESCARTADA' as EstadoCaja }
      })
    } else if (tipo === 'PRODUCTO') {
      result = await db.stockProducto.delete({
        where: { id }
      })
    }

    // Log the discard action
    await db.auditoria.create({
      data: {
        modulo: 'CONTROL_VENCIMIENTOS',
        accion: 'DELETE',
        entidad: tipo,
        entidadId: id,
        descripcion: `Producto descartado por vencimiento. Motivo: ${motivo || 'Vencido'}`,
        datosDespues: JSON.stringify({ motivo, operadorId, fechaDescarte: new Date().toISOString() }),
        operadorId: operadorId || null
      }
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: `${tipo} marcado como descartado correctamente`
    })
  } catch (error) {
    console.error('Error al descartar producto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al descartar producto' },
      { status: 500 }
    )
  }
}

// PUT - Extender fecha de vencimiento
export async function PUT(request: NextRequest) {
  try {
    const authError = await checkPermission(request, 'puedeStock')
    if (authError) return authError

    const body = await request.json()
    const { id, tipo, diasExtension, motivo, operadorId } = body

    if (!id || !tipo || !diasExtension) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: id, tipo, diasExtension' },
        { status: 400 }
      )
    }

    // Log the extension action
    await db.auditoria.create({
      data: {
        modulo: 'CONTROL_VENCIMIENTOS',
        accion: 'UPDATE',
        entidad: tipo,
        entidadId: id,
        descripcion: `Fecha de vencimiento extendida ${diasExtension} días. Motivo: ${motivo || 'Sin motivo'}`,
        datosDespues: JSON.stringify({ diasExtension, motivo, operadorId, fechaExtension: new Date().toISOString() }),
        operadorId: operadorId || null
      }
    })

    return NextResponse.json({
      success: true,
      message: `Vencimiento extendido ${diasExtension} días correctamente`
    })
  } catch (error) {
    console.error('Error al extender vencimiento:', error)
    return NextResponse.json(
      { success: false, error: 'Error al extender fecha de vencimiento' },
      { status: 500 }
    )
  }
}
