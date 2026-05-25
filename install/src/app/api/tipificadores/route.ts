import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar todos los tipificadores
export async function GET(request: NextRequest) {
  try {
    const tipificadores = await db.tipificador.findMany({
      orderBy: { nombre: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: tipificadores
    })

  } catch (error) {
    console.error('Error obteniendo tipificadores:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener tipificadores' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo tipificador
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, apellido, matricula, activo = true } = body

    if (!nombre || !apellido || !matricula) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    const tipificador = await db.tipificador.create({
      data: {
        nombre,
        apellido,
        matricula,
        activo
      }
    })

    return NextResponse.json({
      success: true,
      data: tipificador
    })

  } catch (error) {
    console.error('Error creando tipificador:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear tipificador' },
      { status: 500 }
    )
  }
}
