import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar pallets C2 con filtros
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeExpedicionC2')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const camaraId = searchParams.get('camaraId')
    const esMixto = searchParams.get('esMixto')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (estado) where.estado = estado
    if (camaraId) where.camaraId = camaraId
    if (esMixto !== null && esMixto !== undefined) where.esMixto = esMixto === 'true'

    const [pallets, total] = await Promise.all([
      db.pallet.findMany({
        where,
        include: {
          cajas: {
            include: {
              productoDesposte: {
                select: { id: true, nombre: true, codigo: true, rubro: { select: { nombre: true } } }
              },
              producto: { select: { id: true, nombre: true } }
            }
          },
          camara: { select: { id: true, nombre: true } },
          operador: { select: { id: true, nombre: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      db.pallet.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: pallets,
      pagination: { total, limit, offset, hasMore: offset + pallets.length < total }
    })
  } catch (error) {
    console.error('Error fetching pallets:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener pallets' },
      { status: 500 }
    )
  }
}

// POST - Crear pallet (agrupar cajas)
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeExpedicionC2')
  if (authError) return authError
  try {
    const body = await request.json()
    const {
      cajaIds,
      camaraId,
      esMixto,
      ssccCode,
      operadorId,
      observaciones
    } = body

    if (!cajaIds || !Array.isArray(cajaIds) || cajaIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Debe seleccionar al menos una caja' },
        { status: 400 }
      )
    }

    // Verificar que las cajas existen y están disponibles
    const cajas = await db.cajaEmpaque.findMany({
      where: {
        id: { in: cajaIds },
        estado: { in: ['ARMADA', 'EN_PALLETS'] }
      },
      include: {
        productoDesposte: { select: { nombre: true, codigo: true } }
      }
    })

    if (cajas.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se encontraron cajas disponibles para palletizar' },
        { status: 400 }
      )
    }

    // Validar que todas las cajas sean del mismo producto si no es mixto
    if (!esMixto) {
      const productosUnicos = new Set(cajas.map(c => c.productoDesposteId).filter(Boolean))
      if (productosUnicos.size > 1) {
        return NextResponse.json(
          { success: false, error: 'Para pallets no mixtos, todas las cajas deben ser del mismo producto' },
          { status: 400 }
        )
      }
    }

    // Generar número correlativo
    const ultimoPallet = await db.pallet.findFirst({
      orderBy: { numero: 'desc' },
      select: { numero: true }
    })

    const numeroPalletInt = (ultimoPallet?.numero || 0) + 1
    const numeroPallet = numeroPalletInt.toString().padStart(6, '0')
    const numero = `PAL-${numeroPallet}`

    // Generar SSCC si no se proveyó
    const ssccFinal = ssccCode || `00${Date.now().toString().slice(-16)}`

    // Calcular peso total
    const pesoTotal = cajas.reduce((sum, c) => sum + c.pesoBruto, 0)
    const cantidadCajas = cajas.length

    // Crear el pallet
    const pallet = await db.pallet.create({
      data: {
        numero: numeroPalletInt,
        estado: 'ARMADO',
        esMixto: esMixto || false,
        pesoTotal,
        cantidadCajas,
        camaraId: camaraId || null,
        operadorId: operadorId || null,
        observaciones: observaciones || null
      },
      include: {
        cajas: { select: { id: true, numero: true, pesoNeto: true } },
        camara: { select: { nombre: true } }
      }
    })

    // Asignar cajas al pallet
    for (const caja of cajas) {
      await db.cajaEmpaque.update({
        where: { id: caja.id },
        data: {
          palletId: pallet.id,
          estado: 'EN_PALLETS'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: pallet,
      message: `Pallet ${numero} creado - ${cantidadCajas} cajas, ${pesoTotal.toFixed(1)} kg`
    })
  } catch (error) {
    console.error('Error creating pallet:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear pallet' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar pallet (cambiar estado, agregar/quitar cajas, mover a cámara)
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeExpedicionC2')
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, estado, camaraId, agregarCajaIds, quitarCajaIds, observaciones } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const palletActual = await db.pallet.findUnique({
      where: { id },
      include: { cajas: true }
    })

    if (!palletActual) {
      return NextResponse.json(
        { success: false, error: 'Pallet no encontrado' },
        { status: 404 }
      )
    }

    const updateData: any = { updatedAt: new Date() }

    if (estado) {
      updateData.estado = estado
    }
    if (camaraId !== undefined) {
      updateData.camaraId = camaraId || null
    }
    if (observaciones !== undefined) {
      updateData.observaciones = observaciones
    }

    // Agregar cajas al pallet
    if (agregarCajaIds && agregarCajaIds.length > 0) {
      for (const cajaId of agregarCajaIds) {
        await db.cajaEmpaque.update({
          where: { id: cajaId },
          data: { palletId: id, estado: 'EN_PALLETS' }
        })
      }
      // Recalcular totales
      const todasCajas = await db.cajaEmpaque.findMany({ where: { palletId: id } })
      updateData.cantidadCajas = todasCajas.length
      updateData.pesoTotal = todasCajas.reduce((s: number, c: any) => s + c.pesoBruto, 0)
    }

    // Quitar cajas del pallet
    if (quitarCajaIds && quitarCajaIds.length > 0) {
      for (const cajaId of quitarCajaIds) {
        await db.cajaEmpaque.update({
          where: { id: cajaId },
          data: { palletId: null, estado: 'ARMADA' }
        })
      }
      // Recalcular totales
      const todasCajas = await db.cajaEmpaque.findMany({ where: { palletId: id } })
      updateData.cantidadCajas = todasCajas.length
      updateData.pesoTotal = todasCajas.reduce((s: number, c: any) => s + c.pesoBruto, 0)

      // Si no quedan cajas, eliminar pallet
      if (todasCajas.length === 0) {
        await db.pallet.delete({ where: { id } })
        return NextResponse.json({
          success: true,
          data: null,
          message: 'Pallet eliminado - sin cajas restantes'
        })
      }
    }

    const pallet = await db.pallet.update({
      where: { id },
      data: updateData,
      include: {
        cajas: { select: { id: true, numero: true, pesoNeto: true } },
        camara: { select: { nombre: true } }
      }
    })

    return NextResponse.json({ success: true, data: pallet })
  } catch (error) {
    console.error('Error updating pallet:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar pallet' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar pallet (devolver cajas a ARMADA)
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeExpedicionC2')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const pallet = await db.pallet.findUnique({
      where: { id },
      include: { cajas: true }
    })

    if (!pallet) {
      return NextResponse.json(
        { success: false, error: 'Pallet no encontrado' },
        { status: 404 }
      )
    }

    if (pallet.estado === 'DESPACHADO') {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar un pallet despachado' },
        { status: 400 }
      )
    }

    // Devolver cajas a estado ARMADA
    for (const caja of pallet.cajas) {
      await db.cajaEmpaque.update({
        where: { id: caja.id },
        data: { palletId: null, estado: 'ARMADA' }
      })
    }

    // Eliminar pallet
    await db.pallet.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: `Pallet ${pallet.numero} eliminado - ${pallet.cajas.length} cajas devueltas`
    })
  } catch (error) {
    console.error('Error deleting pallet:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar pallet' },
      { status: 500 }
    )
  }
}
