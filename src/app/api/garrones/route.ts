import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener garrones del día (con estado de pesaje)
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeListaFaena')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const listaFaenaId = searchParams.get('listaFaenaId')
    const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0]

    // Construir filtros
    const where: Record<string, unknown> = {}
    
    if (listaFaenaId) {
      where.listaFaenaId = listaFaenaId
    } else {
      // Buscar lista de faena del día
      const fechaInicio = new Date(fecha)
      fechaInicio.setHours(0, 0, 0, 0)
      const fechaFin = new Date(fecha)
      fechaFin.setHours(23, 59, 59, 999)

      const listaFaena = await db.listaFaena.findFirst({
        where: {
          fecha: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      })

      if (listaFaena) {
        where.listaFaenaId = listaFaena.id
      }
    }

    // Obtener asignaciones de garrones con información del animal
    const asignaciones = await db.asignacionGarron.findMany({
      where,
      include: {
        animal: {
          include: {
            tropa: {
              include: {
                productor: true,
                usuarioFaena: true
              }
            }
          }
        },
        listaFaena: true
      },
      orderBy: { garron: 'asc' }
    })

    // Para cada garrón, obtener estado de medias res
    const garronesConEstado = await Promise.all(
      asignaciones.map(async (asig) => {
        const medias = await db.mediaRes.findMany({
          where: {
            romaneo: {
              garron: asig.garron
            }
          }
        })

        const tieneDer = medias.some(m => m.lado === 'DERECHA')
        const tieneIzq = medias.some(m => m.lado === 'IZQUIERDA')
        const totalMedias = medias.length

        let estado = 'PENDIENTE'
        if (tieneDer && tieneIzq) estado = 'COMPLETO'
        else if (totalMedias > 0) estado = 'PARCIAL'

        return {
          garron: asig.garron,
          animalId: asig.animalId,
          numeroAnimal: asig.animalNumero ?? asig.animal?.numero ?? null,
          horaIngreso: asig.createdAt.toISOString(),
          tropa: asig.animal?.tropa ? {
            id: asig.animal.tropa.id,
            codigo: asig.animal.tropa.codigo,
            especie: asig.animal.tropa.especie,
            productor: asig.animal.tropa.productor,
            usuarioFaena: asig.animal.tropa.usuarioFaena
          } : null,
          animal: asig.animal ? {
            tipoAnimal: asig.animal.tipoAnimal,
            raza: asig.animal.raza,
            pesoVivo: asig.animal.pesoVivo
          } : null,
          estado,
          tieneDer,
          tieneIzq,
          totalMedias
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: garronesConEstado,
      total: garronesConEstado.length,
      completos: garronesConEstado.filter(g => g.estado === 'COMPLETO').length,
      parciales: garronesConEstado.filter(g => g.estado === 'PARCIAL').length,
      pendientes: garronesConEstado.filter(g => g.estado === 'PENDIENTE').length
    })
  } catch (error) {
    console.error('Error fetching garrones:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener garrones' },
      { status: 500 }
    )
  }
}

// POST - Intercambiar garrones entre animales de la misma tropa
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeListaFaena')
  if (authError) return authError
  try {
    const body = await request.json()
    const { garron1, garron2, listaFaenaId } = body

    if (!garron1 || !garron2 || !listaFaenaId) {
      return NextResponse.json(
        { success: false, error: 'garron1, garron2 y listaFaenaId son requeridos' },
        { status: 400 }
      )
    }

    // Obtener las dos asignaciones
    const asig1 = await db.asignacionGarron.findFirst({
      where: { garron: garron1, listaFaenaId },
      include: { animal: { include: { tropa: true } } }
    })
    const asig2 = await db.asignacionGarron.findFirst({
      where: { garron: garron2, listaFaenaId },
      include: { animal: { include: { tropa: true } } }
    })

    if (!asig1 || !asig2) {
      return NextResponse.json(
        { success: false, error: 'Uno o ambos garrones no encontrados' },
        { status: 404 }
      )
    }

    // Verificar que sean de la misma tropa
    if (asig1.animal?.tropaId !== asig2.animal?.tropaId) {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden intercambiar garrones de la misma tropa' },
        { status: 400 }
      )
    }

    // Intercambiar los números de garrón
    await db.$transaction([
      db.asignacionGarron.update({
        where: { id: asig1.id },
        data: { garron: garron2 }
      }),
      db.asignacionGarron.update({
        where: { id: asig2.id },
        data: { garron: garron1 }
      })
    ])

    return NextResponse.json({
      success: true,
      message: `Garrones ${garron1} y ${garron2} intercambiados correctamente`
    })
  } catch (error) {
    console.error('Error intercambiando garrones:', error)
    return NextResponse.json(
      { success: false, error: 'Error al intercambiar garrones' },
      { status: 500 }
    )
  }
}
