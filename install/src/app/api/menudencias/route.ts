import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar menudencias
export async function GET() {
  try {
    const menudencias = await db.menudencia.findMany({
      include: {
        tipoMenudencia: true
      },
      orderBy: {
        fechaIngreso: 'desc'
      },
      take: 100
    })

    return NextResponse.json({
      success: true,
      data: menudencias
    })
  } catch (error) {
    console.error('Error fetching menudencias:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener menudencias' },
      { status: 500 }
    )
  }
}

// POST - Crear menudencia
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipoMenudenciaId, tropaCodigo, pesoIngreso, operadorId } = body

    if (!tipoMenudenciaId || !pesoIngreso) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    const menudencia = await db.menudencia.create({
      data: {
        tipoMenudenciaId,
        tropaCodigo: tropaCodigo || null,
        pesoIngreso: parseFloat(pesoIngreso),
        rotuloImpreso: false
      },
      include: {
        tipoMenudencia: true
      }
    })

    return NextResponse.json({
      success: true,
      data: menudencia
    })
  } catch (error) {
    console.error('Error creating menudencia:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear menudencia' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar menudencia (elaboración)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, pesoElaborado, cantidadBolsas, operadorElaboracion } = body

    if (!id || pesoElaborado === undefined) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    const menudencia = await db.menudencia.update({
      where: { id },
      data: {
        pesoElaborado: parseFloat(pesoElaborado),
        cantidadBolsas: parseInt(cantidadBolsas) || 1,
        operadorElaboracion: operadorElaboracion || null,
        fechaElaboracion: new Date(),
        rotuloImpreso: true
      },
      include: {
        tipoMenudencia: true
      }
    })

    return NextResponse.json({
      success: true,
      data: menudencia
    })
  } catch (error) {
    console.error('Error updating menudencia:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar menudencia' },
      { status: 500 }
    )
  }
}
