import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// POST - Desasignar animal de un garrón
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeListaFaena')
  if (authError) return authError
  try {
    const body = await request.json()
    const { garron, operadorId } = body

    if (!garron) {
      return NextResponse.json(
        { success: false, error: 'Número de garrón requerido' },
        { status: 400 }
      )
    }

    // Buscar la asignación
    const asignacion = await db.asignacionGarron.findFirst({
      where: { garron }
    })

    if (!asignacion) {
      return NextResponse.json(
        { success: false, error: 'Asignación no encontrada' },
        { status: 404 }
      )
    }

    // Verificar si ya tiene medias pesadas (no se puede desasignar)
    if (asignacion.tieneMediaDer || asignacion.tieneMediaIzq) {
      return NextResponse.json(
        { success: false, error: 'No se puede desasignar un garrón con medias pesadas' },
        { status: 400 }
      )
    }

    // Limpiar los datos del animal
    await db.asignacionGarron.update({
      where: { id: asignacion.id },
      data: {
        animalId: null,
        tropaCodigo: null,
        animalNumero: null,
        tipoAnimal: null,
        pesoVivo: null
      }
    })

    return NextResponse.json({
      success: true,
      data: { garron }
    })

  } catch (error) {
    console.error('Error desasignando animal:', error)
    return NextResponse.json(
      { success: false, error: 'Error al desasignar animal' },
      { status: 500 }
    )
  }
}
