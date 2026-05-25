import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar cajas de producción C2 con filtros
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeDesposte')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const productoDesposteId = searchParams.get('productoDesposteId')
    const cuartoId = searchParams.get('cuartoId')
    const tropaCodigo = searchParams.get('tropaCodigo')
    const loteId = searchParams.get('loteId')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (estado) where.estado = estado
    if (productoDesposteId) where.productoDesposteId = productoDesposteId
    if (cuartoId) where.cuartoId = cuartoId
    if (tropaCodigo) where.tropaCodigo = tropaCodigo
    if (loteId) where.loteId = loteId

    const [cajas, total] = await Promise.all([
      db.cajaEmpaque.findMany({
        where,
        include: {
          productoDesposte: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
              gtin: true,
              diasVencimiento: true,
              pesoTaraCaja: true,
              rubro: { select: { id: true, nombre: true } }
            }
          },
          producto: { select: { id: true, nombre: true } },
          cuarto: {
            select: {
              id: true,
              codigo: true,
              tipo: true,
              peso: true,
              tipoCuarto: { select: { nombre: true, codigo: true } }
            }
          },
          pallet: { select: { id: true, numero: true } },
          propietario: { select: { id: true, nombre: true } },
          lote: { select: { id: true, numero: true, estado: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      db.cajaEmpaque.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: cajas,
      pagination: { total, limit, offset, hasMore: offset + cajas.length < total }
    })
  } catch (error) {
    console.error('Error fetching cajas:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener cajas de producción' },
      { status: 500 }
    )
  }
}

// POST - Crear caja de producción desde desposte C2
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeDesposte')
  if (authError) return authError
  try {
    const body = await request.json()
    const {
      productoDesposteId,
      cuartoId,
      loteId,
      pesoBruto,
      pesoNeto,
      tara,
      piezas,
      tropaCodigo,
      propietarioId,
      operadorId,
      camaraId
    } = body

    if (!productoDesposteId) {
      return NextResponse.json(
        { success: false, error: 'Producto de desposte es requerido' },
        { status: 400 }
      )
    }

    if (!pesoNeto || pesoNeto <= 0) {
      return NextResponse.json(
        { success: false, error: 'Peso neto debe ser mayor a 0' },
        { status: 400 }
      )
    }

    // Obtener datos del producto de desposte
    const producto = await db.c2ProductoDesposte.findUnique({
      where: { id: productoDesposteId },
      include: { rubro: { select: { nombre: true } } }
    })

    if (!producto) {
      return NextResponse.json(
        { success: false, error: 'Producto de desposte no encontrado' },
        { status: 404 }
      )
    }

    // Obtener datos del cuarto si se proporcionó
    const cuarto = cuartoId
      ? await db.cuarto.findUnique({
          where: { id: cuartoId },
          include: {
            mediaRes: {
              select: {
                id: true,
                codigo: true,
                romaneo: { select: { tropaCodigo: true, fecha: true } }
              }
            }
          }
        })
      : null

    if (cuartoId && !cuarto) {
      return NextResponse.json(
        { success: false, error: 'Cuarto no encontrado' },
        { status: 404 }
      )
    }

    // Generar número de caja correlativo
    const ultimaCaja = await db.cajaEmpaque.findFirst({
      orderBy: { numero: 'desc' },
      select: { numero: true }
    })

    const numeroCaja = ultimaCaja?.numero
      ? (parseInt(ultimaCaja.numero.replace('CAJA-', '')) + 1).toString().padStart(6, '0')
      : '000001'

    const numero = `CAJA-${numeroCaja}`

    // Calcular tara automática desde el producto si no se proveyó
    const taraFinal = tara || producto.pesoTaraCaja || 0
    const pesoBrutoFinal = pesoBruto || (pesoNeto + taraFinal)

    // Calcular fechas de trazabilidad
    const hoy = new Date()
    const fechaFaena = cuarto?.mediaRes?.romaneo?.fecha
      ? new Date(cuarto.mediaRes.romaneo.fecha)
      : null
    const fechaVencimiento = producto.diasVencimiento
      ? new Date(hoy.getTime() + producto.diasVencimiento * 24 * 60 * 60 * 1000)
      : null

    // Tropa código: prioridad del body, luego del cuarto
    const tropaFinal = tropaCodigo || cuarto?.tropaCodigo || cuarto?.mediaRes?.romaneo?.tropaCodigo || null

    // Generar código GS1-128 si el producto tiene GTIN
    let barcodeGs1_128: string | null = null
    if (producto.gtin) {
      const gtin = producto.gtin
      const loteTropa = tropaFinal || 'SIN-TROPA'
      const fechaFaenaStr = fechaFaena
        ? `${fechaFaena.getFullYear().toString().slice(2)}${(fechaFaena.getMonth() + 1).toString().padStart(2, '0')}${fechaFaena.getDate().toString().padStart(2, '0')}`
        : '000000'
      const fechaDesposteStr = `${hoy.getFullYear().toString().slice(2)}${(hoy.getMonth() + 1).toString().padStart(2, '0')}${hoy.getDate().toString().padStart(2, '0')}`
      const pesoNetoStr = Math.round(pesoNeto * 100).toString().padStart(6, '0')
      const serial = numeroCaja

      barcodeGs1_128 = `(01)${gtin}(10)${loteTropa}(11)${fechaFaenaStr}(13)${fechaDesposteStr}(3102)${pesoNetoStr}(21)${serial}`
    }

    // Crear la caja y descontar insumos EN TRANSACCIÓN
    const insumosDescontadosCount = productoDesposteId ? await db.c2BOM.count({ where: { productoDesposteId } }) : 0
    
    const caja = await db.$transaction(async (tx) => {
      const nuevaCaja = await tx.cajaEmpaque.create({
        data: {
          codigoBarras: numero,
          codigoArticulo: '000',
          codigoEspecie: '0',
          codigoTipificacion: '00',
          codigoTrabajo: '0',
          codigoTransporte: '0',
          codigoDestino: '00',
          loteNumero: 1,
          unidades: piezas || 1,
          numeradorCaja: 1,
          numero,
          productoDesposteId,
          cuartoId: cuartoId || null,
          loteId: loteId || null,
          propietarioId: propietarioId || null,
          pesoBruto: pesoBrutoFinal,
          pesoNeto,
          tara: taraFinal,
          piezas: piezas || 1,
          tropaCodigo: tropaFinal,
          fechaFaena,
          fechaDesposte: hoy,
          fechaVencimiento,
          estado: 'ARMADA',
          barcodeGs1_128
        },
        include: {
          productoDesposte: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
              gtin: true,
              rubro: { select: { nombre: true } }
            }
          },
          cuarto: {
            select: { id: true, codigo: true, tipo: true, tipoCuarto: { select: { nombre: true } } }
          },
          pallet: { select: { id: true, numero: true } }
        }
      })

      // Descontar insumos según BOM (dentro de la misma transacción)
      if (productoDesposteId) {
        const bomItems = await tx.c2BOM.findMany({
          where: { productoDesposteId },
          include: { insumo: true }
        })

        for (const bom of bomItems) {
          const cantidadDescontar = bom.cantidadPorCaja * (piezas || 1)
          await tx.insumo.update({
            where: { id: bom.insumoId },
            data: {
              stockActual: { decrement: cantidadDescontar }
            }
          })
        }
      }

      return nuevaCaja
    })

    return NextResponse.json({
      success: true,
      data: caja,
      insumosDescontados: insumosDescontadosCount,
      message: `Caja ${numero} creada - ${producto.nombre} ${pesoNeto.toFixed(2)} kg`
    })
  } catch (error) {
    console.error('Error creating caja:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear caja de producción' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar caja (cambiar estado, pallet, etc.)
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeDesposte')
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const updateData: any = { updatedAt: new Date() }
    if (data.estado) updateData.estado = data.estado
    if (data.palletId !== undefined) updateData.palletId = data.palletId || null
    if (data.pesoNeto !== undefined) updateData.pesoNeto = parseFloat(data.pesoNeto)
    if (data.pesoBruto !== undefined) updateData.pesoBruto = parseFloat(data.pesoBruto)
    if (data.piezas !== undefined) updateData.piezas = parseInt(data.piezas)

    const caja = await db.cajaEmpaque.update({
      where: { id },
      data: updateData,
      include: {
        productoDesposte: { select: { id: true, nombre: true, codigo: true } },
        pallet: { select: { id: true, numero: true } }
      }
    })

    return NextResponse.json({ success: true, data: caja })
  } catch (error) {
    console.error('Error updating caja:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar caja' },
      { status: 500 }
    )
  }
}
