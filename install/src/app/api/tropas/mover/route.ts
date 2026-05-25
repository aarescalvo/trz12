import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Especie } from '@prisma/client'

// POST - Move tropa to corral with stock update
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tropaId, corralDestinoId, operadorId } = body

    if (!tropaId || !corralDestinoId) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos: tropaId y corralDestinoId' },
        { status: 400 }
      )
    }

    console.log(`[MOVER TROPA] Iniciando movimiento de tropa ${tropaId} a corral ${corralDestinoId}`)

    // Get tropa with animales
    const tropa = await db.tropa.findUnique({
      where: { id: tropaId },
      include: { 
        animales: true,
        corral: true
      }
    })

    if (!tropa) {
      return NextResponse.json(
        { success: false, error: 'Tropa no encontrada' },
        { status: 404 }
      )
    }

    const cantidadAnimales = tropa.animales.length
    const especie = tropa.especie

    // Get corral destino
    const corralDestino = await db.corral.findUnique({
      where: { id: corralDestinoId }
    })

    if (!corralDestino) {
      return NextResponse.json(
        { success: false, error: 'Corral destino no encontrado' },
        { status: 404 }
      )
    }

    // Calcular stock actual del corral destino
    const stockActual = especie === 'BOVINO' ? corralDestino.stockBovinos : corralDestino.stockEquinos
    const disponible = corralDestino.capacidad - stockActual

    // Verificar capacidad
    if (cantidadAnimales > disponible) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Capacidad insuficiente. Disponible: ${disponible} animales. Se requieren: ${cantidadAnimales}` 
        },
        { status: 400 }
      )
    }

    // Obtener corral origen (si existe)
    const corralOrigenId = tropa.corralId
    const corralOrigen = tropa.corral

    // Usar transacción para garantizar consistencia
    const result = await db.$transaction(async (tx) => {
      // 1. Decrementar stock del corral origen (si tenía corral asignado)
      if (corralOrigenId) {
        const updateDataOrigen = especie === 'BOVINO' 
          ? { stockBovinos: { decrement: cantidadAnimales } }
          : { stockEquinos: { decrement: cantidadAnimales } }
        
        await tx.corral.update({
          where: { id: corralOrigenId },
          data: updateDataOrigen
        })
        console.log(`[MOVER TROPA] Stock decrementado en corral origen ${corralOrigenId}`)
      }

      // 2. Incrementar stock del corral destino
      const updateDataDestino = especie === 'BOVINO' 
        ? { stockBovinos: { increment: cantidadAnimales } }
        : { stockEquinos: { increment: cantidadAnimales } }
      
      await tx.corral.update({
        where: { id: corralDestinoId },
        data: updateDataDestino
      })
      console.log(`[MOVER TROPA] Stock incrementado en corral destino ${corralDestinoId}`)

      // 3. Actualizar tropa
      await tx.tropa.update({
        where: { id: tropaId },
        data: { 
          corralId: corralDestinoId,
          estado: 'EN_CORRAL'
        }
      })

      // 4. Actualizar todos los animales
      await tx.animal.updateMany({
        where: { tropaId },
        data: { corralId: corralDestinoId }
      })

      // 5. Crear registro de movimiento
      await tx.movimientoCorral.create({
        data: {
          tropaId,
          corralOrigenId,
          corralDestinoId,
          cantidad: cantidadAnimales,
          especie: especie as Especie,
          operadorId: operadorId || null
        }
      })

      // 6. Registrar auditoría
      await tx.auditoria.create({
        data: {
          operadorId: operadorId || null,
          modulo: 'MOVIMIENTO_HACIENDA',
          accion: 'UPDATE',
          entidad: 'Tropa',
          entidadId: tropaId,
          descripcion: `Tropa ${tropa.codigo} movida de ${corralOrigen?.nombre || 'sin corral'} a ${corralDestino.nombre} (${cantidadAnimales} animales)`
        }
      })

      return { success: true }
    })

    // Obtener datos actualizados
    const tropaActualizada = await db.tropa.findUnique({
      where: { id: tropaId },
      include: {
        corral: true,
        animales: {
          select: { id: true, numero: true, codigo: true, estado: true }
        }
      }
    })

    const corralActualizado = await db.corral.findUnique({
      where: { id: corralDestinoId }
    })

    console.log(`[MOVER TROPA] ✅ Movimiento completado exitosamente`)

    return NextResponse.json({
      success: true,
      data: {
        tropa: tropaActualizada,
        corralDestino: {
          id: corralActualizado?.id,
          nombre: corralActualizado?.nombre,
          stockBovinos: corralActualizado?.stockBovinos,
          stockEquinos: corralActualizado?.stockEquinos,
          capacidad: corralActualizado?.capacidad
        },
        movimiento: {
          tropaCodigo: tropa.codigo,
          cantidadAnimales,
          especie,
          corralOrigen: corralOrigen?.nombre || 'Sin asignar',
          corralDestino: corralDestino.nombre
        }
      }
    })
  } catch (error) {
    console.error('[MOVER TROPA] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al mover tropa: ' + String(error) },
      { status: 500 }
    )
  }
}

// GET - Get available corrales with capacity
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const especie = searchParams.get('especie') as Especie || 'BOVINO'
    const cantidadNecesaria = parseInt(searchParams.get('cantidad') || '0')

    const corrales = await db.corral.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    })

    const corralesConDisponibilidad = corrales.map(corral => {
      const stockActual = especie === 'BOVINO' ? corral.stockBovinos : corral.stockEquinos
      const disponible = corral.capacidad - stockActual
      
      return {
        id: corral.id,
        nombre: corral.nombre,
        capacidad: corral.capacidad,
        stockBovinos: corral.stockBovinos,
        stockEquinos: corral.stockEquinos,
        stockActual,
        disponible,
        puedeRecibir: disponible >= cantidadNecesaria,
        observaciones: corral.observaciones
      }
    })

    return NextResponse.json({
      success: true,
      data: corralesConDisponibilidad
    })
  } catch (error) {
    console.error('[GET CORRALES] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener corrales' },
      { status: 500 }
    )
  }
}
