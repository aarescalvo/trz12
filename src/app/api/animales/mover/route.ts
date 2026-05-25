import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Mover animal(es) entre corrales (V2: stock update, capacity check, transaction)
import { checkPermission } from '@/lib/auth-helpers'
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeMovimientoHacienda')
  if (authError) return authError

  try {
    const body = await request.json()
    const { animalIds, corralDestinoId, operadorId, observaciones, forzarCapacidad } = body

    if (!animalIds || !Array.isArray(animalIds) || animalIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requieren IDs de animales' },
        { status: 400 }
      )
    }

    if (!corralDestinoId) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el corral destino' },
        { status: 400 }
      )
    }

    // Verificar que el corral destino existe
    const corralDestino = await db.corral.findUnique({
      where: { id: corralDestinoId }
    })

    if (!corralDestino) {
      return NextResponse.json(
        { success: false, error: 'Corral destino no encontrado' },
        { status: 404 }
      )
    }

    // Obtener animales a mover
    const animales = await db.animal.findMany({
      where: {
        id: { in: animalIds }
      },
      include: { tropa: true }
    })

    if (animales.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se encontraron animales' },
        { status: 404 }
      )
    }

    // Verificar capacidad del corral destino (advertencia, no bloqueante)
    // Contar bovinos y equinos separadamente
    const bovinosAMover = animales.filter(a => a.tropa.especie === 'BOVINO').length
    const equinosAMover = animales.filter(a => a.tropa.especie === 'EQUINO').length
    let advertenciaCapacidad: string | null = null

    if (bovinosAMover > 0) {
      const disponibleBovinos = corralDestino.capacidad - corralDestino.stockBovinos
      if (disponibleBovinos < bovinosAMover && !forzarCapacidad) {
        return NextResponse.json({
          success: false,
          requiresConfirmation: true,
          error: `Capacidad insuficiente en corral "${corralDestino.nombre}" para bovinos. Disponible: ${disponibleBovinos}, Se requieren: ${bovinosAMover}. ¿Desea continuar de todas formas?`,
          capacidadInfo: {
            corral: corralDestino.nombre,
            capacidad: corralDestino.capacidad,
            stockActual: corralDestino.stockBovinos,
            disponible: disponibleBovinos,
            cantidadIngresar: bovinosAMover
          }
        }, { status: 409 })
      }
      if (disponibleBovinos < bovinosAMover && forzarCapacidad) {
        advertenciaCapacidad = `ATENCIÓN: Se excedió la capacidad del corral "${corralDestino.nombre}" para bovinos.`
      }
    }

    if (equinosAMover > 0) {
      const disponibleEquinos = corralDestino.capacidad - corralDestino.stockEquinos
      if (disponibleEquinos < equinosAMover && !forzarCapacidad) {
        return NextResponse.json({
          success: false,
          requiresConfirmation: true,
          error: `Capacidad insuficiente en corral "${corralDestino.nombre}" para equinos. Disponible: ${disponibleEquinos}, Se requieren: ${equinosAMover}. ¿Desea continuar de todas formas?`,
          capacidadInfo: {
            corral: corralDestino.nombre,
            capacidad: corralDestino.capacidad,
            stockActual: corralDestino.stockEquinos,
            disponible: disponibleEquinos,
            cantidadIngresar: equinosAMover
          }
        }, { status: 409 })
      }
      if (disponibleEquinos < equinosAMover && forzarCapacidad) {
        advertenciaCapacidad = `ATENCIÓN: Se excedió la capacidad del corral "${corralDestino.nombre}" para equinos.`
      }
    }

    // Agrupar por corral origen para registrar movimientos
    const porCorralOrigen = animales.reduce((acc, animal) => {
      const corralId = animal.corralId || 'sin-corral'
      if (!acc[corralId]) {
        acc[corralId] = []
      }
      acc[corralId].push(animal)
      return acc
    }, {} as Record<string, typeof animales>)

    // Ejecutar todo en transacción
    const movimientosCreados = await db.$transaction(async (tx) => {
      const movimientos: any[] = []
      
      for (const [corralOrigenId, animalesGrupo] of Object.entries(porCorralOrigen)) {
        // Actualizar corral de cada animal
        await tx.animal.updateMany({
          where: {
            id: { in: animalesGrupo.map(a => a.id) }
          },
          data: {
            corralId: corralDestinoId
          }
        })

        // Decrementar stock del corral origen
        if (corralOrigenId !== 'sin-corral') {
          const bovinosGrupo = animalesGrupo.filter(a => a.tropa.especie === 'BOVINO').length
          const equinosGrupo = animalesGrupo.filter(a => a.tropa.especie === 'EQUINO').length
          
          const origenData: any = {}
          if (bovinosGrupo > 0) origenData.stockBovinos = { decrement: bovinosGrupo }
          if (equinosGrupo > 0) origenData.stockEquinos = { decrement: equinosGrupo }
          
          if (Object.keys(origenData).length > 0) {
            await tx.corral.update({
              where: { id: corralOrigenId },
              data: origenData
            })
          }
        }

        // Incrementar stock del corral destino
        const bovinosGrupo = animalesGrupo.filter(a => a.tropa.especie === 'BOVINO').length
        const equinosGrupo = animalesGrupo.filter(a => a.tropa.especie === 'EQUINO').length
        
        const destinoData: any = {}
        if (bovinosGrupo > 0) destinoData.stockBovinos = { increment: bovinosGrupo }
        if (equinosGrupo > 0) destinoData.stockEquinos = { increment: equinosGrupo }
        
        if (Object.keys(destinoData).length > 0) {
          await tx.corral.update({
            where: { id: corralDestinoId },
            data: destinoData
          })
        }

        // Crear registro de movimiento
        const movimiento = await tx.movimientoCorral.create({
          data: {
            corralOrigenId: corralOrigenId === 'sin-corral' ? null : corralOrigenId,
            corralDestinoId,
            cantidad: animalesGrupo.length,
            especie: animalesGrupo[0].tropa.especie,
            observaciones: observaciones || `Movimiento de ${animalesGrupo.length} animal(es)`,
            operadorId: operadorId || null
          }
        })
        movimientos.push(movimiento)

        // Registrar auditoría
        for (const animal of animalesGrupo) {
          await tx.auditoria.create({
            data: {
              operadorId: operadorId || null,
              modulo: 'MOVIMIENTO_HACIENDA',
              accion: 'UPDATE',
              entidad: 'Animal',
              entidadId: animal.id,
              descripcion: `Animal ${animal.codigo} movido de ${corralOrigenId === 'sin-corral' ? 'sin corral' : corralOrigenId} a ${corralDestino.nombre}`
            }
          })
        }
      }
      
      return movimientos
    })

    const response: any = {
      success: true,
      data: {
        movidos: animales.length,
        movimientos: movimientosCreados
      }
    }
    
    if (advertenciaCapacidad) {
      response.advertencia = advertenciaCapacidad
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error moviendo animales:', error)
    return NextResponse.json(
      { success: false, error: 'Error al mover animales' },
      { status: 500 }
    )
  }
}
