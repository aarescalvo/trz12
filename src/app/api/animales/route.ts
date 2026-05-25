import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TipoAnimal } from '@prisma/client'

// GET - List animales by tropa
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeMovimientoHacienda')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const tropaId = searchParams.get('tropaId')

    if (!tropaId) {
      return NextResponse.json({ error: 'tropaId requerido' }, { status: 400 })
    }

    const animales = await db.animal.findMany({
      where: { tropaId },
      orderBy: { numero: 'asc' }
    })

    return NextResponse.json(animales)
  } catch (error) {
    console.error('Error fetching animales:', error)
    return NextResponse.json({ error: 'Error al obtener animales' }, { status: 500 })
  }
}

// POST - Create new animal with weighing
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeMovimientoHacienda')
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      tropaId,
      numero,
      codigo,
      tipoAnimal,
      caravana,
      raza,
      pesoVivo,
      operadorId,
      observaciones
    } = body

    // Get tropa to know the species and corral
    const tropa = await db.tropa.findUnique({
      where: { id: tropaId },
      include: {
        animales: {
          select: { numero: true },
          orderBy: { numero: 'desc' },
          take: 1
        }
      }
    })

    if (!tropa) {
      return NextResponse.json({ error: 'Tropa no encontrada' }, { status: 404 })
    }

    // Calculate next available number
    let numeroFinal: number
    if (numero !== undefined && numero !== null) {
      // Check if numero already exists
      const existingAnimal = await db.animal.findFirst({
        where: { tropaId, numero: parseInt(numero) }
      })
      if (existingAnimal) {
        return NextResponse.json({ 
          error: `El número ${numero} ya existe en esta tropa` 
        }, { status: 400 })
      }
      numeroFinal = parseInt(numero)
    } else {
      // Auto-assign next number
      const maxNumero = tropa.animales[0]?.numero || 0
      numeroFinal = maxNumero + 1
    }

    // Generate animal code
    const codigoFinal = codigo || `${tropa.codigo.replace(/\s/g, '')}-${String(numeroFinal).padStart(3, '0')}`

    // Verify operador exists if provided
    let validOperadorId: string | null = null
    if (operadorId) {
      const operador = await db.operador.findUnique({
        where: { id: operadorId }
      })
      if (operador) {
        validOperadorId = operador.id
      }
    }

    // Create animal
    const animal = await db.animal.create({
      data: {
        tropaId,
        numero: numeroFinal,
        codigo: codigoFinal,
        tipoAnimal: tipoAnimal as TipoAnimal,
        caravana: caravana || null,
        raza: raza || null,
        pesoVivo: pesoVivo ? parseFloat(pesoVivo) : null,
        corralId: tropa.corralId || null,
        estado: 'PESADO'
      }
    })

    // Create pesaje individual record
    if (pesoVivo && validOperadorId) {
      await db.pesajeIndividual.create({
        data: {
          animalId: animal.id,
          peso: parseFloat(pesoVivo),
          operadorId: validOperadorId,
          caravana: caravana || null,
          observaciones: observaciones || null
        }
      })
    }

    // Register audit
    if (validOperadorId) {
      await db.auditoria.create({
        data: {
          operadorId: validOperadorId,
          modulo: 'PESAJE_INDIVIDUAL',
          accion: 'CREATE',
          entidad: 'Animal',
          entidadId: animal.id,
          descripcion: `Animal ${animal.codigo} pesado - ${pesoVivo} kg`
        }
      })
    }

    return NextResponse.json(animal, { status: 201 })
  } catch (error) {
    console.error('Error creating animal:', error)
    return NextResponse.json({ error: 'Error al crear animal' }, { status: 500 })
  }
}

// PUT - Update animal
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeMovimientoHacienda')
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, pesoVivo, caravana, raza, estado, corral, corralId, tipoAnimal } = body

    const updateData: any = {}
    
    if (pesoVivo !== undefined) updateData.pesoVivo = parseFloat(pesoVivo)
    if (caravana !== undefined) updateData.caravana = caravana || null
    if (raza !== undefined) updateData.raza = raza || null
    if (estado !== undefined) updateData.estado = estado
    if (corralId !== undefined) updateData.corralId = corralId || null
    if (corral !== undefined) updateData.corralId = corral || null
    if (tipoAnimal !== undefined) updateData.tipoAnimal = tipoAnimal

    const animal = await db.animal.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(animal)
  } catch (error) {
    console.error('Error updating animal:', error)
    return NextResponse.json({ error: 'Error al actualizar animal' }, { status: 500 })
  }
}

// DELETE - Delete animal
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeMovimientoHacienda')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Cascade cleanup of related records in a transaction
    await db.$transaction([
      // Delete related PesajeIndividual record (1:1 with Animal)
      db.pesajeIndividual.deleteMany({
        where: { animalId: id }
      }),
      // Delete related AsignacionGarron record (1:1 with Animal)
      db.asignacionGarron.deleteMany({
        where: { animalId: id }
      }),
      // Delete related MovimientoCorral records (loose FK for data integrity)
      db.movimientoCorral.deleteMany({
        where: { animalId: id }
      }),
      // Finally delete the animal itself
      db.animal.delete({
        where: { id }
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting animal:', error)
    return NextResponse.json({ error: 'Error al eliminar animal' }, { status: 500 })
  }
}
