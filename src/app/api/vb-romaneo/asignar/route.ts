import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// POST - Asignar animal a un garrón que no tiene asignación
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError
  try {
    const body = await request.json()
    const { garron, animalId, listaFaenaId, operadorId, supervisorId } = body

    if (!garron) {
      return NextResponse.json(
        { success: false, error: 'Número de garrón requerido' },
        { status: 400 }
      )
    }

    if (!animalId) {
      return NextResponse.json(
        { success: false, error: 'ID de animal requerido' },
        { status: 400 }
      )
    }

    if (!listaFaenaId) {
      return NextResponse.json(
        { success: false, error: 'ID de lista de faena requerido' },
        { status: 400 }
      )
    }

    // Verificar que el animal existe y no tiene garrón asignado
    const animal = await db.animal.findUnique({
      where: { id: animalId },
      include: {
        tropa: true,
        pesajeIndividual: true,
        asignacionGarron: true
      }
    })

    if (!animal) {
      return NextResponse.json(
        { success: false, error: 'Animal no encontrado' },
        { status: 404 }
      )
    }

    if (animal.asignacionGarron) {
      return NextResponse.json(
        { success: false, error: 'El animal ya tiene un garrón asignado' },
        { status: 400 }
      )
    }

    // Verificar que el garrón existe en la lista y no tiene animal
    const asignacion = await db.asignacionGarron.findUnique({
      where: {
        listaFaenaId_garron: { listaFaenaId, garron }
      }
    })

    if (!asignacion) {
      return NextResponse.json(
        { success: false, error: 'Garrón no encontrado en esta lista de faena' },
        { status: 404 }
      )
    }

    if (asignacion.animalId) {
      return NextResponse.json(
        { success: false, error: 'El garrón ya tiene un animal asignado' },
        { status: 400 }
      )
    }

    // Obtener romaneo si existe (para actualizar datos)
    const romaneo = await db.romaneo.findFirst({
      where: { garron }
    })

    // Datos para auditoría
    const datosAntes = {
      garron,
      animalId: null,
      animalCodigo: null,
      pesoVivo: asignacion.pesoVivo
    }

    // Ejecutar asignación
    await db.$transaction(async (tx) => {
      // Actualizar asignación de garrón
      await tx.asignacionGarron.update({
        where: { id: asignacion.id },
        data: {
          animalId: animal.id,
          tropaCodigo: animal.tropa.codigo,
          animalNumero: animal.numero,
          tipoAnimal: animal.tipoAnimal,
          pesoVivo: animal.pesoVivo || animal.pesajeIndividual?.peso || null
        }
      })

      // Actualizar estado del animal
      await tx.animal.update({
        where: { id: animal.id },
        data: { estado: 'EN_FAENA' }
      })

      // Si hay romaneo, actualizar datos
      if (romaneo) {
        const pesoVivo = animal.pesoVivo || animal.pesajeIndividual?.peso || 0
        const nuevoRinde = pesoVivo > 0 ? ((romaneo.pesoTotal || 0) / pesoVivo) * 100 : null

        await tx.romaneo.update({
          where: { id: romaneo.id },
          data: {
            tropaCodigo: animal.tropa.codigo,
            numeroAnimal: animal.numero,
            tipoAnimal: animal.tipoAnimal,
            raza: animal.raza,
            pesoVivo: pesoVivo,
            rinde: nuevoRinde
          }
        })
      }

      // Registrar auditoría
      await tx.auditoria.create({
        data: {
          operadorId: supervisorId || operadorId,
          modulo: 'VB_ROMANEO',
          accion: 'ASIGNAR_ANIMAL',
          entidad: 'AsignacionGarron',
          entidadId: asignacion.id,
          descripcion: `Asignación de animal ${animal.codigo} a garrón ${garron}`,
          datosAntes: JSON.stringify(datosAntes),
          datosDespues: JSON.stringify({
            garron,
            animalId: animal.id,
            animalCodigo: animal.codigo,
            pesoVivo: animal.pesoVivo || animal.pesajeIndividual?.peso
          })
        }
      })
    })

    // Verificar alerta de rinde
    let alertaRinde: string | null = null
    if (romaneo) {
      const pesoVivo = animal.pesoVivo || animal.pesajeIndividual?.peso || 0
      const nuevoRinde = pesoVivo > 0 ? ((romaneo.pesoTotal || 0) / pesoVivo) * 100 : 0
      if (nuevoRinde > 70) {
        alertaRinde = `Rinde ${nuevoRinde.toFixed(1)}% supera el 70%`
      }
    }

    return NextResponse.json({
      success: true,
      message: `Animal ${animal.codigo} asignado correctamente al garrón ${garron}`,
      data: {
        garron,
        animalId: animal.id,
        animalCodigo: animal.codigo,
        alertaRinde
      }
    })

  } catch (error) {
    console.error('Error asignando animal:', error)
    return NextResponse.json(
      { success: false, error: 'Error al asignar animal' },
      { status: 500 }
    )
  }
}
