import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// ============================================
// Clasificación automática de pH según umbrales configurables
// ============================================
async function clasificarPH(valorPH: number): Promise<string> {
  let config = await db.configuracionPH.findFirst()
  if (!config) {
    config = await db.configuracionPH.create({ data: { umbralPSE: 5.4, umbralNormMax: 5.7, umbralIntMax: 5.9 } })
  }
  if (valorPH < config.umbralPSE) return 'ALTO'          // PSE
  if (valorPH <= config.umbralNormMax) return 'NORMAL'
  if (valorPH <= config.umbralIntMax) return 'INTERMEDIO'
  return 'DFD'
}

// ============================================
// GET - Obtener mediciones de pH con filtros
// ============================================
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const mediaResId = searchParams.get('mediaResId')
    const tropaCodigo = searchParams.get('tropaCodigo')
    const clasificacion = searchParams.get('clasificacion')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const productorId = searchParams.get('productorId')
    const operadorId = searchParams.get('operadorId')
    const incluirMediaRes = searchParams.get('incluirMediaRes') === 'true'

    const where: any = {}

    if (mediaResId) where.mediaResId = mediaResId
    if (tropaCodigo) where.tropaCodigo = tropaCodigo
    if (clasificacion && clasificacion !== 'TODAS') where.clasificacion = clasificacion
    if (productorId) where.productorId = productorId
    if (operadorId) where.operadorId = operadorId

    if (fechaDesde || fechaHasta) {
      where.horaMedicion = {}
      if (fechaDesde) where.horaMedicion.gte = new Date(fechaDesde)
      if (fechaHasta) where.horaMedicion.lte = new Date(fechaHasta)
    }

    const include: any = {}
    if (incluirMediaRes) {
      include.mediaRes = {
        include: {
          romaneo: {
            include: {
              tipificador: true
            }
          },
          camara: true,
          usuarioFaena: true
        }
      }
    }
    include.operador = true

    const mediciones = await db.medicionPH.findMany({
      where,
      include,
      orderBy: { horaMedicion: 'desc' }
    })

    return NextResponse.json({ success: true, data: mediciones })
  } catch (error) {
    console.error('[calidad-ph GET] Error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener mediciones de pH' }, { status: 500 })
  }
}

// ============================================
// POST - Crear medición(es) de pH
// Soporta creación individual o batch
// ============================================
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const body = await request.json()
    const operadorId = request.headers.get('x-operador-id')

    // Soporte para batch (array) o individual (objeto)
    const mediciones = Array.isArray(body) ? body : [body]

    const resultados: { success: boolean; data?: any; error?: string; accion?: string }[] = []

    for (const med of mediciones) {
      const {
        mediaResId,
        valorPH,
        temperatura,
        horaMedicion,
        numeroMedicion = 1,
        observaciones,
        operadorId: medidoPorOperadorId
      } = med

      if (!mediaResId || valorPH === undefined || !horaMedicion) {
        resultados.push({
          success: false,
          error: 'Faltan campos obligatorios: mediaResId, valorPH, horaMedicion'
        })
        continue
      }

      // Verificar que no exista ya esta medición N para esta media res
      const existente = await db.medicionPH.findUnique({
        where: {
          mediaResId_numeroMedicion: {
            mediaResId,
            numeroMedicion
          }
        }
      })

      if (existente) {
        // Actualizar si ya existe
        const clasificacion = await clasificarPH(valorPH) as any
        const mediaRes = await db.mediaRes.findUnique({
          where: { id: mediaResId },
          include: {
            romaneo: true,
            usuarioFaena: true
          }
        })

        // Obtener productor desde la tropa del romaneo
        let productorNombre: string | null = null
        let productorId: string | null = null
        if (mediaRes?.romaneo?.tropaCodigo) {
          const tropa = await db.tropa.findUnique({
            where: { codigo: mediaRes.romaneo.tropaCodigo },
            include: { productor: true }
          })
          if (tropa?.productor) {
            productorNombre = tropa.productor.nombre
            productorId = tropa.productor.id
          }
        }

        // Obtener nombre del operador que mide
        const operador = medidoPorOperadorId
          ? await db.operador.findUnique({ where: { id: medidoPorOperadorId } })
          : operadorId
            ? await db.operador.findUnique({ where: { id: operadorId } })
            : null

        const actualizada = await db.medicionPH.update({
          where: { id: existente.id },
          data: {
            valorPH,
            clasificacion,
            temperatura: temperatura ?? null,
            horaMedicion: new Date(horaMedicion),
            numeroMedicion,
            operadorId: medidoPorOperadorId || operadorId || null,
            medidoPor: operador?.nombre || null,
            observaciones: observaciones || null
          }
        })
        resultados.push({ success: true, data: actualizada, accion: 'actualizada' })
      } else {
        // Crear nueva medición
        const clasificacion = await clasificarPH(valorPH) as any

        // Buscar datos denormalizados
        const mediaRes = await db.mediaRes.findUnique({
          where: { id: mediaResId },
          include: {
            romaneo: true,
            usuarioFaena: true
          }
        })

        if (!mediaRes) {
          resultados.push({ success: false, error: `MediaRes ${mediaResId} no encontrada` })
          continue
        }

        // Obtener productor desde la tropa
        let productorNombre: string | null = null
        let productorId: string | null = null
        if (mediaRes.romaneo?.tropaCodigo) {
          const tropa = await db.tropa.findUnique({
            where: { codigo: mediaRes.romaneo.tropaCodigo },
            include: { productor: true }
          })
          if (tropa?.productor) {
            productorNombre = tropa.productor.nombre
            productorId = tropa.productor.id
          }
        }

        // Obtener nombre del operador que mide
        const operador = medidoPorOperadorId
          ? await db.operador.findUnique({ where: { id: medidoPorOperadorId } })
          : operadorId
            ? await db.operador.findUnique({ where: { id: operadorId } })
            : null

        const nueva = await db.medicionPH.create({
          data: {
            mediaResId,
            valorPH,
            clasificacion,
            temperatura: temperatura ?? null,
            horaMedicion: new Date(horaMedicion),
            numeroMedicion,
            operadorId: medidoPorOperadorId || operadorId || null,
            medidoPor: operador?.nombre || null,
            tropaCodigo: mediaRes.romaneo?.tropaCodigo || null,
            garron: mediaRes.romaneo?.garron || null,
            tipoAnimal: mediaRes.romaneo?.tipoAnimal || null,
            raza: mediaRes.romaneo?.raza || null,
            ladoMedia: mediaRes.lado || null,
            productorNombre: productorNombre,
            productorId: productorId,
            usuarioFaenaId: mediaRes.usuarioFaenaId || null,
            usuarioFaenaNombre: mediaRes.usuarioFaena?.nombre || null,
            observaciones: observaciones || null
          }
        })
        resultados.push({ success: true, data: nueva, accion: 'creada' })
      }
    }

    const todosOk = resultados.every(r => r.success)
    return NextResponse.json(
      { success: todosOk, data: resultados },
      { status: todosOk ? 200 : 207 }
    )
  } catch (error) {
    console.error('[calidad-ph POST] Error:', error)
    return NextResponse.json({ success: false, error: 'Error al guardar mediciones de pH' }, { status: 500 })
  }
}

// ============================================
// PUT - Actualizar medición de pH
// ============================================
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const { id, valorPH, temperatura, horaMedicion, observaciones, operadorId: medidoPorOperadorId } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }

    const clasificacion = valorPH !== undefined ? await clasificarPH(valorPH) as any : undefined

    const data: any = {}
    if (valorPH !== undefined) data.valorPH = valorPH
    if (clasificacion !== undefined) data.clasificacion = clasificacion
    if (temperatura !== undefined) data.temperatura = temperatura
    if (horaMedicion !== undefined) data.horaMedicion = new Date(horaMedicion)
    if (observaciones !== undefined) data.observaciones = observaciones
    if (medidoPorOperadorId !== undefined) {
      data.operadorId = medidoPorOperadorId
      const operador = await db.operador.findUnique({ where: { id: medidoPorOperadorId } })
      if (operador) data.medidoPor = operador.nombre
    }

    const actualizada = await db.medicionPH.update({
      where: { id },
      data
    })

    return NextResponse.json({ success: true, data: actualizada })
  } catch (error) {
    console.error('[calidad-ph PUT] Error:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar medición de pH' }, { status: 500 })
  }
}

// ============================================
// DELETE - Eliminar medición de pH
// ============================================
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }

    await db.medicionPH.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[calidad-ph DELETE] Error:', error)
    return NextResponse.json({ success: false, error: 'Error al eliminar medición de pH' }, { status: 500 })
  }
}
