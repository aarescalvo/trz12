import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar tipos de menudencia
export async function GET() {
  try {
    const tipos = await db.tipoMenudencia.findMany({
      where: {
        activo: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: tipos
    })
  } catch (error) {
    console.error('Error fetching tipos menudencia:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener tipos de menudencia' },
      { status: 500 }
    )
  }
}

// POST - Crear tipo de menudencia
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, observaciones } = body

    if (!nombre) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const tipo = await db.tipoMenudencia.create({
      data: {
        nombre,
        observaciones: observaciones || null,
        activo: true
      }
    })

    return NextResponse.json({
      success: true,
      data: tipo
    })
  } catch (error) {
    console.error('Error creating tipo menudencia:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear tipo de menudencia' },
      { status: 500 }
    )
  }
}
