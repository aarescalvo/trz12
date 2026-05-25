import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Register animal death/baja (V2: with corral stock update + transaction)
import { checkPermission } from '@/lib/auth-helpers'
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeMovimientoHacienda')
  if (authError) return authError

  try {
    const body = await request.json()
    const { animalId, motivoBaja } = body

    if (!animalId || !motivoBaja) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Ejecutar todo en transacción
    const updatedAnimal = await db.$transaction(async (tx) => {
      // Get animal
      const animal = await tx.animal.findUnique({
        where: { id: animalId },
        include: { tropa: true }
      })

      if (!animal) {
        throw new Error('Animal no encontrado')
      }

      // 1. Update animal state
      const updated = await tx.animal.update({
        where: { id: animalId },
        data: {
          estado: 'FALLECIDO',
          fechaBaja: new Date(),
          motivoBaja
        }
      })

      // 2. Update tropa cantidadCabezas
      await tx.tropa.update({
        where: { id: animal.tropaId },
        data: {
          cantidadCabezas: { decrement: 1 }
        }
      })

      // 3. Decrement corral stock if animal was in a corral
      if (animal.corralId) {
        const stockField = animal.tropa.especie === 'BOVINO' ? 'stockBovinos' : 'stockEquinos'
        await tx.corral.update({
          where: { id: animal.corralId },
          data: { [stockField]: { decrement: 1 } }
        })
      }

      // 4. Register audit
      await tx.auditoria.create({
        data: {
          operadorId: null,
          modulo: 'MOVIMIENTO_HACIENDA',
          accion: 'UPDATE',
          entidad: 'Animal',
          entidadId: animalId,
          descripcion: `Animal ${animal.codigo} dado de baja - Motivo: ${motivoBaja}`
        }
      })

      return updated
    })

    return NextResponse.json({
      success: true,
      data: updatedAnimal
    })
  } catch (error: any) {
    if (error.message === 'Animal no encontrado') {
      return NextResponse.json(
        { success: false, error: 'Animal no encontrado' },
        { status: 404 }
      )
    }
    console.error('Error registering baja:', error)
    return NextResponse.json(
      { success: false, error: 'Error al registrar baja' },
      { status: 500 }
    )
  }
}
