import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch listas de faena
export async function GET(request: NextRequest) {
  try {
    const listas = await db.listaFaena.findMany({
      include: {
        supervisor: true,
        tropas: {
          include: {
            tropa: {
              include: {
                usuarioFaena: true,
                tiposAnimales: true
              }
            }
          }
        },
        asignaciones: {
          include: {
            animal: {
              select: {
                id: true,
                codigo: true,
                numero: true,
                tipoAnimal: true
              }
            }
          },
          orderBy: { garron: 'asc' }
        }
      },
      orderBy: { fecha: 'desc' }
    })

    return NextResponse.json({ success: true, data: listas })
  } catch (error) {
    console.error('Error fetching listas:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener listas de faena' },
      { status: 500 }
    )
  }
}

// POST - Create new lista de faena
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operadorId } = body

    // Check if there's already an open lista today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const existingOpen = await db.listaFaena.findFirst({
      where: {
        fecha: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        },
        estado: 'ABIERTA'
      }
    })

    if (existingOpen) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una lista abierta para hoy' },
        { status: 400 }
      )
    }

    const lista = await db.listaFaena.create({
      data: {
        fecha: new Date(),
        estado: 'ABIERTA',
        cantidadTotal: 0
      },
      include: {
        supervisor: true,
        tropas: true,
        asignaciones: true
      }
    })

    return NextResponse.json({ success: true, data: lista })
  } catch (error) {
    console.error('Error creating lista:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear lista de faena' },
      { status: 500 }
    )
  }
}
