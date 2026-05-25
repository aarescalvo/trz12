import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'
import { createLogger } from '@/lib/logger'
const log = createLogger('app.api.lista-faena.tropas.route')

// POST - Add tropa to lista de faena (with transaction for multi-user safety)
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeListaFaena')
  if (authError) return authError
  try {
    const body = await request.json()
    const { listaFaenaId, tropaId, corralId, cantidad } = body

    if (!listaFaenaId || !tropaId || !cantidad) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    const cantidadNum = parseInt(cantidad)
    if (cantidadNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'La cantidad debe ser mayor a 0' },
        { status: 400 }
      )
    }

    // USAR TRANSACCIÓN para evitar race conditions
    const result = await db.$transaction(async (tx) => {
      // Check if lista is open
      const lista = await tx.listaFaena.findUnique({
        where: { id: listaFaenaId }
      })

      if (!lista || lista.estado !== 'ABIERTA') {
        throw new Error('LISTA_NO_ABIERTA')
      }

      // Check if already added for this specific tropa+corral combination
      const existing = await tx.listaFaenaTropa.findFirst({
        where: {
          listaFaenaId,
          tropaId,
          corralId: corralId || null
        }
      })

      // Calculate available animals from this specific corral
      const animalesEnCorral = await tx.animal.count({
        where: {
          tropaId,
          corralId: corralId || null,
          estado: { not: 'FALLECIDO' }
        }
      })

      // Animals already in open lists for this tropa+corral
      const enListasAbiertas = await tx.listaFaenaTropa.aggregate({
        where: {
          tropaId,
          corralId: corralId || null,
          listaFaena: { estado: 'ABIERTA' },
          listaFaenaId: { not: listaFaenaId }
        },
        _sum: { cantidad: true }
      })

      // Animals with garron in closed lists (faenados)
      const faenados = await tx.animal.count({
        where: {
          tropaId,
          corralId: corralId || null,
          estado: { not: 'FALLECIDO' },
          asignacionGarron: {
            listaFaena: { estado: 'CERRADA' }
          }
        }
      })

      // Current quantity in this list (if already added)
      const cantidadActualEnLista = existing?.cantidad || 0

      // Available = Animals in corral - in other open lists - faenados
      const disponible = animalesEnCorral - (enListasAbiertas._sum.cantidad || 0) - faenados

      if (cantidadNum > disponible + cantidadActualEnLista) {
        throw new Error(`STOCK_INSUFICIENTE:${disponible}`)
      }

      if (existing) {
        // Update existing quantity
        const nuevaCantidad = existing.cantidad + cantidadNum
        await tx.listaFaenaTropa.update({
          where: { id: existing.id },
          data: { cantidad: nuevaCantidad }
        })
        
        // Update total - only increment by the new amount
        await tx.listaFaena.update({
          where: { id: listaFaenaId },
          data: {
            cantidadTotal: { increment: cantidadNum }
          }
        })
      } else {
        // Add tropa to lista
        await tx.listaFaenaTropa.create({
          data: {
            listaFaenaId,
            tropaId,
            corralId: corralId || null,
            cantidad: cantidadNum
          }
        })

        // Update total
        await tx.listaFaena.update({
          where: { id: listaFaenaId },
          data: {
            cantidadTotal: { increment: cantidadNum }
          }
        })

        // Update tropa status
        await tx.tropa.update({
          where: { id: tropaId },
          data: { estado: 'LISTO_FAENA' }
        })
      }

      return { success: true }
    })

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('Error adding tropa:', error)
    
    // Manejar errores específicos
    if (error instanceof Error) {
      if (error.message === 'LISTA_NO_ABIERTA') {
        return NextResponse.json(
          { success: false, error: 'La lista no está abierta' },
          { status: 400 }
        )
      }
      if (error.message.startsWith('STOCK_INSUFICIENTE:')) {
        const disponible = error.message.split(':')[1]
        return NextResponse.json(
          { success: false, error: `Stock insuficiente en este corral. Disponible: ${disponible} animales` },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Error al agregar tropa' },
      { status: 500 }
    )
  }
}

// DELETE - Remove tropa from lista de faena (con transacción)
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeListaFaena')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const listaFaenaId = searchParams.get('listaFaenaId')
    const tropaId = searchParams.get('tropaId')
    const corralId = searchParams.get('corralId')
    const forzar = searchParams.get('forzar') === 'true'

    log.info(`'[DELETE tropa] listaFaenaId:' listaFaenaId 'tropaId:' tropaId 'corralId:' corralId`)

    if (!listaFaenaId || !tropaId) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // USAR TRANSACCIÓN para evitar race conditions
    const result = await db.$transaction(async (tx) => {
      // Get tropa code first
      const tropa = await tx.tropa.findUnique({
        where: { id: tropaId },
        select: { codigo: true }
      })

      if (!tropa) {
        throw new Error('TROPA_NO_ENCONTRADA')
      }

      // Check if lista is open
      const lista = await tx.listaFaena.findUnique({
        where: { id: listaFaenaId }
      })

      if (!lista) {
        throw new Error('LISTA_NO_ENCONTRADA')
      }

      if (lista.estado !== 'ABIERTA') {
        throw new Error('LISTA_NO_ABIERTA')
      }

      // Find the tropa from lista - usar findFirst en lugar de findUnique
      const existing = await tx.listaFaenaTropa.findFirst({
        where: {
          listaFaenaId,
          tropaId,
          corralId: corralId || null
        }
      })

      if (!existing) {
        throw new Error('TROPA_NO_EN_LISTA')
      }

      // Check if there are garrones assigned to animals from this tropa
      const garronesAsignados = await tx.asignacionGarron.count({
        where: {
          listaFaenaId,
          tropaCodigo: tropa.codigo
        }
      })

      if (garronesAsignados > 0 && !forzar) {
        // Get garrones detail
        const garronesDetalle = await tx.asignacionGarron.findMany({
          where: {
            listaFaenaId,
            tropaCodigo: tropa.codigo
          },
          select: {
            garron: true,
            animalId: true
          }
        })

        throw new Error(`REQUIERE_CONFIRMACION:${garronesAsignados}:${JSON.stringify(garronesDetalle)}`)
      }

      // If forzando, also remove garron assignments for this tropa
      let garronesLiberados = 0
      if (garronesAsignados > 0 && forzar) {
        // Desasignar garrones de los animales de esta tropa
        await tx.asignacionGarron.deleteMany({
          where: {
            listaFaenaId,
            tropaCodigo: tropa.codigo
          }
        })

        // Restaurar estado de los animales de esta tropa
        await tx.animal.updateMany({
          where: {
            tropaId,
            estado: 'EN_FAENA'
          },
          data: {
            estado: 'PESADO'
          }
        })
        garronesLiberados = garronesAsignados
      }

      // Remove tropa from lista
      await tx.listaFaenaTropa.delete({
        where: { id: existing.id }
      })

      // Update total
      await tx.listaFaena.update({
        where: { id: listaFaenaId },
        data: {
          cantidadTotal: { decrement: existing.cantidad }
        }
      })

      // Check if tropa has other listas, if not, revert status
      const otrasListas = await tx.listaFaenaTropa.findFirst({
        where: {
          tropaId,
          listaFaena: { estado: { in: ['ABIERTA', 'EN_PROCESO'] } }
        }
      })

      if (!otrasListas) {
        await tx.tropa.update({
          where: { id: tropaId },
          data: { estado: 'PESADO' }
        })
      }

      return { garronesLiberados }
    })

    return NextResponse.json({ 
      success: true,
      garronesLiberados: result.garronesLiberados
    })
  } catch (error: unknown) {
    console.error('Error removing tropa:', error)
    
    // Manejar errores específicos
    if (error instanceof Error) {
      if (error.message === 'TROPA_NO_ENCONTRADA') {
        return NextResponse.json(
          { success: false, error: 'Tropa no encontrada' },
          { status: 404 }
        )
      }
      if (error.message === 'LISTA_NO_ENCONTRADA') {
        return NextResponse.json(
          { success: false, error: 'Lista no encontrada' },
          { status: 404 }
        )
      }
      if (error.message === 'LISTA_NO_ABIERTA') {
        return NextResponse.json(
          { success: false, error: 'La lista debe estar abierta para modificar tropas' },
          { status: 400 }
        )
      }
      if (error.message === 'TROPA_NO_EN_LISTA') {
        return NextResponse.json(
          { success: false, error: 'La tropa no está en la lista' },
          { status: 404 }
        )
      }
      if (error.message.startsWith('REQUIERE_CONFIRMACION:')) {
        const parts = error.message.split(':')
        const garronesAsignados = parseInt(parts[1])
        const garronesDetalle = JSON.parse(parts.slice(2).join(':'))
        
        return NextResponse.json({
          success: false,
          requiresConfirmation: true,
          garronesAsignados,
          garronesDetalle,
          message: `Esta tropa tiene ${garronesAsignados} garrón(es) ya asignado(s). Si continúa, los garrones quedarán pendientes de reasignación.`
        })
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Error al quitar tropa' },
      { status: 500 }
    )
  }
}

// PATCH - Update tropa quantity in lista de faena (con transacción)
export async function PATCH(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeListaFaena')
  if (authError) return authError
  try {
    const body = await request.json()
    const { listaFaenaId, tropaId, corralId, cantidad } = body

    if (!listaFaenaId || !tropaId || cantidad === undefined) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    const nuevaCantidad = parseInt(cantidad)
    if (nuevaCantidad < 0) {
      return NextResponse.json(
        { success: false, error: 'La cantidad no puede ser negativa' },
        { status: 400 }
      )
    }

    // USAR TRANSACCIÓN
    await db.$transaction(async (tx) => {
      // Check if lista is open
      const lista = await tx.listaFaena.findUnique({
        where: { id: listaFaenaId }
      })

      if (!lista || lista.estado !== 'ABIERTA') {
        throw new Error('LISTA_NO_ABIERTA')
      }

      // Find existing tropa in lista - usar findFirst
      const existing = await tx.listaFaenaTropa.findFirst({
        where: {
          listaFaenaId,
          tropaId,
          corralId: corralId || null
        }
      })

      if (!existing) {
        throw new Error('TROPA_NO_EN_LISTA')
      }

      const cantidadAnterior = existing.cantidad

      if (nuevaCantidad === 0) {
        // Si la nueva cantidad es 0, eliminar la tropa de la lista
        await tx.listaFaenaTropa.delete({
          where: { id: existing.id }
        })

        // Update total
        await tx.listaFaena.update({
          where: { id: listaFaenaId },
          data: {
            cantidadTotal: { decrement: cantidadAnterior }
          }
        })
      } else {
        // Update quantity
        const diferencia = nuevaCantidad - cantidadAnterior

        await tx.listaFaenaTropa.update({
          where: { id: existing.id },
          data: { cantidad: nuevaCantidad }
        })

        // Update total
        await tx.listaFaena.update({
          where: { id: listaFaenaId },
          data: {
            cantidadTotal: { increment: diferencia }
          }
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error updating tropa quantity:', error)
    
    if (error instanceof Error) {
      if (error.message === 'LISTA_NO_ABIERTA') {
        return NextResponse.json(
          { success: false, error: 'La lista no está abierta' },
          { status: 400 }
        )
      }
      if (error.message === 'TROPA_NO_EN_LISTA') {
        return NextResponse.json(
          { success: false, error: 'La tropa no está en la lista con ese corral' },
          { status: 404 }
        )
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Error al actualizar cantidad' },
      { status: 500 }
    )
  }
}
