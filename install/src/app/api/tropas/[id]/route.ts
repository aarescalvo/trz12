import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get tropa by ID with animals
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const tropa = await db.tropa.findUnique({
      where: { id },
      include: {
        productor: true,
        usuarioFaena: true,
        tiposAnimales: true,
        animales: {
          orderBy: { numero: 'asc' }
        }
      }
    })

    if (!tropa) {
      return NextResponse.json(
        { success: false, error: 'Tropa no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...tropa,
        animales: tropa.animales.map(a => ({
          id: a.id,
          numero: a.numero,
          codigo: a.codigo,
          tipoAnimal: a.tipoAnimal,
          caravana: a.caravana,
          raza: a.raza,
          pesoVivo: a.pesoVivo,
          estado: a.estado,
          corral: a.corral,
          fechaBaja: a.fechaBaja,
          motivoBaja: a.motivoBaja
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching tropa:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener tropa' },
      { status: 500 }
    )
  }
}
