import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Mover cantidad de animales de una tropa entre corrales (con transacción)
import { checkPermission } from '@/lib/auth-helpers'
import { createLogger } from '@/lib/logger'
const log = createLogger('app.api.animales.mover-cantidad.route')
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeMovimientoHacienda')
  if (authError) return authError

  log.info('[MOVER-CANTIDAD] ===== INICIANDO =====')
  
  try {
    const body = await request.json()
    log.info(`'[MOVER-CANTIDAD] Body recibido:' JSON.stringify(body, null, 2)`)
    
    const { tropaId, corralOrigenId, corralDestinoId, cantidad, operadorId, forzarCapacidad } = body

    // Validar datos requeridos
    if (!tropaId) {
      log.info('[MOVER-CANTIDAD] ERROR: falta tropaId')
      return NextResponse.json(
        { success: false, error: 'tropaId es requerido' },
        { status: 400 }
      )
    }
    if (!corralOrigenId) {
      log.info('[MOVER-CANTIDAD] ERROR: falta corralOrigenId')
      return NextResponse.json(
        { success: false, error: 'corralOrigenId es requerido' },
        { status: 400 }
      )
    }
    if (!corralDestinoId) {
      log.info('[MOVER-CANTIDAD] ERROR: falta corralDestinoId')
      return NextResponse.json(
        { success: false, error: 'corralDestinoId es requerido' },
        { status: 400 }
      )
    }
    if (!cantidad) {
      log.info('[MOVER-CANTIDAD] ERROR: falta cantidad')
      return NextResponse.json(
        { success: false, error: 'cantidad es requerida' },
        { status: 400 }
      )
    }

    const cantidadMover = parseInt(String(cantidad))
    if (isNaN(cantidadMover) || cantidadMover <= 0) {
      log.info(`'[MOVER-CANTIDAD] ERROR: cantidad inválida:' cantidad`)
      return NextResponse.json(
        { success: false, error: 'Cantidad inválida' },
        { status: 400 }
      )
    }

    log.info('[MOVER-CANTIDAD] Datos validados OK:', { tropaId, corralOrigenId, corralDestinoId, cantidadMover } as Record<string, unknown>)

    // Verificar capacidad del corral destino ANTES de la transacción
    const corralDestinoCheck = await db.corral.findUnique({
      where: { id: corralDestinoId }
    })

    if (!corralDestinoCheck) {
      return NextResponse.json(
        { success: false, error: 'Corral destino no encontrado' },
        { status: 404 }
      )
    }

    // Obtener la tropa para saber la especie
    const tropaCheck = await db.tropa.findUnique({
      where: { id: tropaId }
    })

    if (!tropaCheck) {
      return NextResponse.json(
        { success: false, error: 'Tropa no encontrada' },
        { status: 404 }
      )
    }

    // Verificar capacidad
    const stockActual = tropaCheck.especie === 'BOVINO' ? corralDestinoCheck.stockBovinos : corralDestinoCheck.stockEquinos
    const disponible = corralDestinoCheck.capacidad - stockActual

    if (disponible < cantidadMover && !forzarCapacidad) {
      return NextResponse.json({
        success: false,
        requiresConfirmation: true,
        error: `Capacidad insuficiente en corral "${corralDestinoCheck.nombre}". Disponible: ${disponible}, Se requieren: ${cantidadMover}. ¿Desea continuar de todas formas?`,
        capacidadInfo: {
          corral: corralDestinoCheck.nombre,
          capacidad: corralDestinoCheck.capacidad,
          stockActual,
          disponible,
          cantidadIngresar: cantidadMover
        }
      }, { status: 409 })
    }

    let advertenciaCapacidad: string | null = null
    if (disponible < cantidadMover && forzarCapacidad) {
      advertenciaCapacidad = `ATENCIÓN: Se excedió la capacidad del corral "${corralDestinoCheck.nombre}".`
    }

    // USAR TRANSACCIÓN para evitar race conditions
    const result = await db.$transaction(async (tx) => {
      // Verificar que el corral destino existe
      const corralDestino = await tx.corral.findUnique({
        where: { id: corralDestinoId }
      })

      if (!corralDestino) {
        throw new Error('CORRAL_DESTINO_NO_ENCONTRADO')
      }

      // Obtener animales de la tropa en el corral origen (con lock)
      const animalesEnOrigen = await tx.animal.findMany({
        where: {
          tropaId,
          corralId: corralOrigenId,
          estado: { in: ['RECIBIDO', 'PESADO'] }
        },
        orderBy: { numero: 'asc' },
        take: cantidadMover
      })

      log.info(`'[MOVER-CANTIDAD] Animales encontrados en origen:' animalesEnOrigen.length`)

      if (animalesEnOrigen.length < cantidadMover) {
        throw new Error(`STOCK_INSUFICIENTE:${animalesEnOrigen.length}`)
      }

      // Obtener la tropa para saber la especie
      const tropa = await tx.tropa.findUnique({
        where: { id: tropaId }
      })

      if (!tropa) {
        throw new Error('TROPA_NO_ENCONTRADA')
      }

      // Mover los animales (actualizar corralId)
      const idsAMover = animalesEnOrigen.map(a => a.id)
      log.info(`'[MOVER-CANTIDAD] IDs a mover:' idsAMover`)
      
      await tx.animal.updateMany({
        where: {
          id: { in: idsAMover }
        },
        data: {
          corralId: corralDestinoId
        }
      })

      // Crear registro de movimiento
      await tx.movimientoCorral.create({
        data: {
          tropaId,
          corralOrigenId,
          corralDestinoId,
          cantidad: cantidadMover,
          especie: tropa.especie,
          observaciones: `Movimiento de ${cantidadMover} animales de tropa ${tropa.codigo}`,
          operadorId: operadorId || null
        }
      })

      // Actualizar stock de corrales
      // Decrementar stock en corral origen
      if (tropa.especie === 'BOVINO') {
        await tx.corral.update({
          where: { id: corralOrigenId },
          data: { stockBovinos: { decrement: cantidadMover } }
        })
        await tx.corral.update({
          where: { id: corralDestinoId },
          data: { stockBovinos: { increment: cantidadMover } }
        })
      } else if (tropa.especie === 'EQUINO') {
        await tx.corral.update({
          where: { id: corralOrigenId },
          data: { stockEquinos: { decrement: cantidadMover } }
        })
        await tx.corral.update({
          where: { id: corralDestinoId },
          data: { stockEquinos: { increment: cantidadMover } }
        })
      }

      // Registrar auditoría
      await tx.auditoria.create({
        data: {
          operadorId: operadorId || null,
          modulo: 'MOVIMIENTO_HACIENDA',
          accion: 'UPDATE',
          entidad: 'Animal',
          entidadId: idsAMover[0],
          descripcion: `Movidos ${cantidadMover} animales de tropa ${tropa.codigo} al corral ${corralDestino.nombre}`
        }
      })

      return { cantidadMover, tropa, corralDestino }
    })

    log.info('[MOVER-CANTIDAD] ===== ÉXITO =====')

    const response: any = {
      success: true,
      data: {
        movidos: result.cantidadMover,
        tropa: result.tropa.codigo,
        destino: result.corralDestino.nombre
      }
    }
    if (advertenciaCapacidad) {
      response.advertencia = advertenciaCapacidad
    }

    return NextResponse.json(response)
  } catch (error: unknown) {
    console.error('[MOVER-CANTIDAD] ERROR CRÍTICO:', error)
    
    // Manejar errores específicos
    if (error instanceof Error) {
      if (error.message === 'CORRAL_DESTINO_NO_ENCONTRADO') {
        return NextResponse.json(
          { success: false, error: 'Corral destino no encontrado' },
          { status: 404 }
        )
      }
      if (error.message === 'TROPA_NO_ENCONTRADA') {
        return NextResponse.json(
          { success: false, error: 'Tropa no encontrada' },
          { status: 404 }
        )
      }
      if (error.message.startsWith('STOCK_INSUFICIENTE:')) {
        const disponibles = error.message.split(':')[1]
        return NextResponse.json(
          { success: false, error: `Solo hay ${disponibles} animales disponibles en este corral` },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Error al mover animales: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}
