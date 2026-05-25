import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener stock de cámaras y despachos
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'stock'
    const camaraId = searchParams.get('camaraId')

    switch (tipo) {
      case 'stock':
        return await getStockCamaras()
      case 'medias':
        return await getMediasResDisponibles(camaraId)
      case 'despachos':
        return await getDespachos(searchParams)
      case 'despacho':
        return await getDespachoById(searchParams.get('id'))
      default:
        return NextResponse.json({ success: false, error: 'Tipo no válido' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Expedición API] Error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}

// Obtener stock de cámaras ordenado por tropa y usuario
async function getStockCamaras() {
  // Obtener medias reses en cámara con datos de tropa y usuario
  const mediasRes = await db.mediaRes.findMany({
    where: {
      estado: 'EN_CAMARA'
    },
    include: {
      romaneo: {
        select: {
          garron: true,
          tropaCodigo: true,
          fecha: true
        }
      },
      camara: {
        select: { nombre: true }
      },
      usuarioFaena: {
        select: { id: true, nombre: true }
      }
    },
    orderBy: [
      { romaneo: { tropaCodigo: 'asc' } },
      { usuarioFaena: { nombre: 'asc' } }
    ]
  })

  // Agrupar por cámara
  const camarasMap = new Map<string, {
    id: string
    nombre: string
    totalMedias: number
    totalKg: number
    porTropa: Map<string, {
      tropaCodigo: string
      cantidad: number
      pesoTotal: number
      porUsuario: Map<string, {
        usuarioId: string | null
        usuarioNombre: string
        cantidad: number
        pesoTotal: number
        medias: Array<{
          id: string
          codigo: string
          lado: string
          peso: number
          garron: number
        }>
      }>
    }>
  }>()

  for (const media of mediasRes) {
    const camaraId = media.camaraId || 'sin-camara'
    const camaraNombre = media.camara?.nombre || 'Sin cámara'
    const tropaCodigo = media.romaneo?.tropaCodigo || 'Sin tropa'
    const usuarioId = media.usuarioFaenaId || 'sin-usuario'
    const usuarioNombre = media.usuarioFaena?.nombre || 'Sin usuario'

    if (!camarasMap.has(camaraId)) {
      camarasMap.set(camaraId, {
        id: camaraId,
        nombre: camaraNombre,
        totalMedias: 0,
        totalKg: 0,
        porTropa: new Map()
      })
    }

    const camara = camarasMap.get(camaraId)!
    camara.totalMedias++
    camara.totalKg += media.peso

    if (!camara.porTropa.has(tropaCodigo)) {
      camara.porTropa.set(tropaCodigo, {
        tropaCodigo,
        cantidad: 0,
        pesoTotal: 0,
        porUsuario: new Map()
      })
    }

    const tropa = camara.porTropa.get(tropaCodigo)!
    tropa.cantidad++
    tropa.pesoTotal += media.peso

    if (!tropa.porUsuario.has(usuarioId)) {
      tropa.porUsuario.set(usuarioId, {
        usuarioId: media.usuarioFaenaId,
        usuarioNombre,
        cantidad: 0,
        pesoTotal: 0,
        medias: []
      })
    }

    const usuario = tropa.porUsuario.get(usuarioId)!
    usuario.cantidad++
    usuario.pesoTotal += media.peso
    usuario.medias.push({
      id: media.id,
      codigo: media.codigo,
      lado: media.lado,
      peso: media.peso,
      garron: media.romaneo?.garron || 0
    })
  }

  // Convertir a array para la respuesta
  const stock = Array.from(camarasMap.values()).map(camara => ({
    ...camara,
    porTropa: Array.from(camara.porTropa.values()).map(tropa => ({
      ...tropa,
      porUsuario: Array.from(tropa.porUsuario.values())
    }))
  }))

  return NextResponse.json({
    success: true,
    data: {
      stock,
      totalMedias: mediasRes.length,
      totalKg: mediasRes.reduce((sum, m) => sum + m.peso, 0)
    }
  })
}

// Obtener medias res disponibles para selección
async function getMediasResDisponibles(camaraId: string | null) {
  const where: Record<string, unknown> = { estado: 'EN_CAMARA' }
  if (camaraId) where.camaraId = camaraId

  const medias = await db.mediaRes.findMany({
    where,
    include: {
      romaneo: {
        select: {
          garron: true,
          tropaCodigo: true,
          fecha: true
        }
      },
      camara: {
        select: { nombre: true }
      },
      usuarioFaena: {
        select: { id: true, nombre: true }
      }
    }
  })

  return NextResponse.json({
    success: true,
    data: medias.map(m => ({
      id: m.id,
      codigo: m.codigo,
      lado: m.lado,
      peso: m.peso,
      sigla: m.sigla,
      camara: m.camara?.nombre || null,
      tropaCodigo: m.romaneo?.tropaCodigo || null,
      garron: m.romaneo?.garron || null,
      usuarioId: m.usuarioFaenaId,
      usuarioNombre: m.usuarioFaena?.nombre || null
    }))
  })
}

// Obtener lista de despachos
async function getDespachos(searchParams: URLSearchParams) {
  const fechaDesde = searchParams.get('fechaDesde')
  const fechaHasta = searchParams.get('fechaHasta')
  const estado = searchParams.get('estado')

  const where: Record<string, unknown> = {}
  
  if (fechaDesde || fechaHasta) {
    const fechaFilter: Record<string, unknown> = {}
    if (fechaDesde) fechaFilter.gte = new Date(fechaDesde)
    if (fechaHasta) {
      const hasta = new Date(fechaHasta)
      hasta.setHours(23, 59, 59, 999)
      fechaFilter.lte = hasta
    }
    where.fecha = fechaFilter
  }
  
  if (estado) where.estado = estado

  const despachos = await db.despacho.findMany({
    where,
    include: {
      items: {
        include: {
          mediaRes: {
            include: {
              romaneo: { select: { tropaCodigo: true, garron: true } }
            }
          }
        }
      },
      operador: { select: { nombre: true } }
    },
    orderBy: { fecha: 'desc' },
    take: 50
  })

  return NextResponse.json({
    success: true,
    data: despachos.map(d => ({
      id: d.id,
      numero: d.numero,
      fecha: d.fecha,
      destino: d.destino,
      patenteCamion: d.patenteCamion,
      chofer: d.chofer,
      remito: d.remito,
      kgTotal: d.kgTotal,
      cantidadMedias: d.cantidadMedias,
      estado: d.estado,
      operador: d.operador?.nombre
    }))
  })
}

// Obtener despacho por ID
async function getDespachoById(id: string | null) {
  if (!id) {
    return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
  }

  const despacho = await db.despacho.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          mediaRes: {
            include: {
              romaneo: { select: { tropaCodigo: true, garron: true } }
            }
          }
        }
      },
      operador: { select: { nombre: true } },
      ticketPesaje: { select: { numeroTicket: true, pesoBruto: true, pesoTara: true, pesoNeto: true } }
    }
  })

  if (!despacho) {
    return NextResponse.json({ success: false, error: 'Despacho no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: despacho })
}

// POST - Crear nuevo despacho
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const body = await request.json()
    const { accion, ...data } = body

    switch (accion) {
      case 'crear':
        return await crearDespacho(data)
      case 'agregarMedia':
        return await agregarMediaDespacho(data)
      case 'quitarMedia':
        return await quitarMediaDespacho(data)
      case 'confirmar':
        return await confirmarDespacho(data)
      case 'anular':
        return await anularDespacho(data)
      default:
        return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Expedición API] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error del servidor: ' + (error instanceof Error ? error.message : 'Error desconocido') 
    }, { status: 500 })
  }
}

// Crear nuevo despacho
async function crearDespacho(data: {
  destino: string
  direccionDestino?: string
  patenteCamion?: string
  patenteAcoplado?: string
  chofer?: string
  choferDni?: string
  transportista?: string
  remito?: string
  observaciones?: string
  operadorId?: string
  mediasIds?: string[]
}) {
  // Obtener siguiente número de despacho (atomic increment to prevent race conditions)
  const numerador = await db.$transaction(async (tx) => {
    const num = await tx.numerador.upsert({
      where: { nombre: 'DESPACHO' },
      update: { ultimoNumero: { increment: 1 } },
      create: { nombre: 'DESPACHO', ultimoNumero: 1 },
    })
    return num
  })
  const nuevoNumero = numerador.ultimoNumero

  // Crear despacho
  const despacho = await db.despacho.create({
    data: {
      numero: nuevoNumero,
      destino: data.destino,
      direccionDestino: data.direccionDestino,
      patenteCamion: data.patenteCamion,
      patenteAcoplado: data.patenteAcoplado,
      chofer: data.chofer,
      choferDni: data.choferDni,
      transportista: data.transportista,
      remito: data.remito,
      observaciones: data.observaciones,
      operadorId: data.operadorId
    }
  })

  // Si hay medias seleccionadas, agregarlas
  if (data.mediasIds && data.mediasIds.length > 0) {
    await agregarMediasADespacho(despacho.id, data.mediasIds)
  }

  return NextResponse.json({
    success: true,
    data: despacho,
    message: `Despacho #${nuevoNumero} creado correctamente`
  })
}

// Agregar medias a un despacho existente
async function agregarMediaDespacho(data: { despachoId: string; mediaId: string }) {
  const { despachoId, mediaId } = data

  // Verificar que la media está disponible
  const media = await db.mediaRes.findUnique({
    where: { id: mediaId },
    include: { romaneo: { select: { tropaCodigo: true, garron: true } } }
  })

  if (!media) {
    return NextResponse.json({ success: false, error: 'Media res no encontrada' }, { status: 404 })
  }

  if (media.estado !== 'EN_CAMARA') {
    return NextResponse.json({ success: false, error: 'La media res no está disponible' }, { status: 400 })
  }

  // Agregar al despacho
  await agregarMediasADespacho(despachoId, [mediaId])

  return NextResponse.json({ success: true, message: 'Media res agregada al despacho' })
}

// Agregar múltiples medias a un despacho
async function agregarMediasADespacho(despachoId: string, mediasIds: string[]) {
  await db.$transaction(async (tx) => {
    // Obtener datos de las medias
    const medias = await tx.mediaRes.findMany({
      where: { id: { in: mediasIds }, estado: 'EN_CAMARA' },
      include: {
        romaneo: { select: { tropaCodigo: true, garron: true } },
        usuarioFaena: { select: { id: true, nombre: true } }
      }
    })

    if (medias.length === 0) {
      throw new Error('No hay medias res disponibles')
    }

    // Crear items del despacho (incluyendo camaraId para poder restaurar al anular)
    await tx.despachoItem.createMany({
      data: medias.map(m => ({
        despachoId,
        mediaResId: m.id,
        tropaCodigo: m.romaneo?.tropaCodigo,
        garron: m.romaneo?.garron,
        peso: m.peso,
        camaraId: m.camaraId,
        usuarioId: m.usuarioFaenaId,
        usuarioNombre: m.usuarioFaena?.nombre
      }))
    })

    // Actualizar estado de las medias a DESPACHADO
    await tx.mediaRes.updateMany({
      where: { id: { in: medias.map(m => m.id) } },
      data: { estado: 'DESPACHADO' }
    })

    // Actualizar totales del despacho
    const despacho = await tx.despacho.findUnique({
      where: { id: despachoId },
      include: { items: true }
    })

    if (despacho) {
      await tx.despacho.update({
        where: { id: despachoId },
        data: {
          cantidadMedias: despacho.items.length,
          kgTotal: despacho.items.reduce((sum, item) => sum + item.peso, 0)
        }
      })
    }
  })
}

// Quitar media de un despacho
async function quitarMediaDespacho(data: { itemId: string }) {
  const { itemId } = data

  const item = await db.despachoItem.findUnique({
    where: { id: itemId },
    include: { despacho: true }
  })

  if (!item) {
    return NextResponse.json({ success: false, error: 'Item no encontrado' }, { status: 404 })
  }

  if (item.despacho.estado === 'DESPACHADO' || item.despacho.estado === 'ENTREGADO') {
    return NextResponse.json({ success: false, error: 'No se puede modificar un despacho finalizado' }, { status: 400 })
  }

  // Restaurar estado de la media y su cámara de origen
  await db.mediaRes.update({
    where: { id: item.mediaResId },
    data: {
      estado: 'EN_CAMARA',
      camaraId: item.camaraId
    }
  })

  // Eliminar item
  await db.despachoItem.delete({ where: { id: itemId } })

  // Actualizar totales
  const despacho = await db.despacho.findUnique({
    where: { id: item.despachoId },
    include: { items: true }
  })

  if (despacho) {
    await db.despacho.update({
      where: { id: item.despachoId },
      data: {
        cantidadMedias: despacho.items.length,
        kgTotal: despacho.items.reduce((sum, i) => sum + i.peso, 0)
      }
    })
  }

  return NextResponse.json({ success: true, message: 'Media removida del despacho' })
}

// Confirmar despacho
async function confirmarDespacho(data: { despachoId: string; ticketPesajeId?: string }) {
  const { despachoId, ticketPesajeId } = data

  const despacho = await db.despacho.findUnique({
    where: { id: despachoId },
    include: { items: true }
  })

  if (!despacho) {
    return NextResponse.json({ success: false, error: 'Despacho no encontrado' }, { status: 404 })
  }

  if (despacho.items.length === 0) {
    return NextResponse.json({ success: false, error: 'El despacho no tiene medias asignadas' }, { status: 400 })
  }

  await db.despacho.update({
    where: { id: despachoId },
    data: {
      estado: 'DESPACHADO',
      ticketPesajeId: ticketPesajeId
    }
  })

  return NextResponse.json({ success: true, message: 'Despacho confirmado correctamente' })
}

// Anular despacho
async function anularDespacho(data: { despachoId: string }) {
  const { despachoId } = data

  const despacho = await db.despacho.findUnique({
    where: { id: despachoId },
    include: { items: true }
  })

  if (!despacho) {
    return NextResponse.json({ success: false, error: 'Despacho no encontrado' }, { status: 404 })
  }

  // Restaurar estado de todas las medias con su cámara de origen,
  // eliminar items y marcar despacho como anulado todo en una sola transacción
  await db.$transaction(async (tx) => {
    // Restaurar medias
    await Promise.all(
      despacho.items.map(item =>
        tx.mediaRes.update({
          where: { id: item.mediaResId },
          data: {
            estado: 'EN_CAMARA',
            camaraId: item.camaraId
          }
        })
      )
    )

    // Eliminar items
    await tx.despachoItem.deleteMany({
      where: { despachoId }
    })

    // Marcar como anulado
    await tx.despacho.update({
      where: { id: despachoId },
      data: {
        estado: 'ANULADO',
        cantidadMedias: 0,
        kgTotal: 0
      }
    })
  })

  return NextResponse.json({ success: true, message: 'Despacho anulado correctamente' })
}
