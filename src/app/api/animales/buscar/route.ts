import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Buscar animal por número dentro de una tropa específica
import { checkPermission } from '@/lib/auth-helpers'
import { createLogger } from '@/lib/logger'
const log = createLogger('app.api.animales.buscar.route')
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeMovimientoHacienda')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const numero = searchParams.get('numero')
    const tropaId = searchParams.get('tropaId')

    if (!numero) {
      return NextResponse.json({
        success: false,
        error: 'Número de animal requerido'
      }, { status: 400 })
    }

    const numeroInt = parseInt(numero)
    if (isNaN(numeroInt)) {
      return NextResponse.json({
        success: false,
        error: 'Número inválido'
      }, { status: 400 })
    }

    log.info(`'[buscar-animal] Buscando animal:' numero 'en tropa:' tropaId || 'cualquiera'`)

    // Construir filtro de búsqueda
    const where: Record<string, unknown> = {
      numero: numeroInt
    }

    // Si se especifica tropaId, filtrar por esa tropa
    if (tropaId) {
      where.tropaId = tropaId
    }

    // Buscar animal
    const animal = await db.animal.findFirst({
      where,
      include: {
        tropa: {
          select: {
            id: true,
            codigo: true,
            usuarioFaena: { select: { nombre: true } }
          }
        },
        pesajeIndividual: { select: { peso: true } },
        asignacionGarron: { select: { garron: true } } // Para verificar si ya tiene garrón
      }
    })

    if (!animal) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró el animal'
      })
    }

    // Verificar si ya tiene garrón asignado
    if (animal.asignacionGarron) {
      return NextResponse.json({
        success: false,
        error: `El animal ya tiene garrón #${animal.asignacionGarron.garron} asignado`
      })
    }

    log.info(`'[buscar-animal] Animal encontrado:' animal.codigo`)

    return NextResponse.json({
      success: true,
      data: {
        id: animal.id,
        codigo: animal.codigo,
        numero: animal.numero,
        tropaId: animal.tropaId,
        tropaCodigo: animal.tropa?.codigo || null,
        usuarioFaena: animal.tropa?.usuarioFaena?.nombre || null,
        tipoAnimal: animal.tipoAnimal?.toString() || null,
        raza: animal.raza || null,
        pesoVivo: animal.pesoVivo || animal.pesajeIndividual?.peso || null,
        caravana: animal.caravana || null
      }
    })

  } catch (error) {
    console.error('Error buscando animal:', error)
    return NextResponse.json(
      { success: false, error: 'Error al buscar animal' },
      { status: 500 }
    )
  }
}
