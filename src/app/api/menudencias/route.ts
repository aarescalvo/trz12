import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar menudencias
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeMenudencias')
  if (authError) return authError
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
  const authError = await checkPermission(request, 'puedeMenudencias')
  if (authError) return authError

  try {
    const body = await request.json()
    const { tipoMenudenciaId, tipoMenudenciaNombre, tropaCodigo, pesoIngreso, operadorElaboracion } = body

    if (!pesoIngreso || parseFloat(pesoIngreso) <= 0) {
      return NextResponse.json(
        { success: false, error: 'El peso de ingreso es requerido y debe ser mayor a 0' },
        { status: 400 }
      )
    }

    // Si se pasa nombre del tipo, buscar o crear
    let tipoId = tipoMenudenciaId
    if (!tipoId && tipoMenudenciaNombre) {
      let tipo = await db.tipoMenudencia.findFirst({
        where: { nombre: tipoMenudenciaNombre }
      })
      if (!tipo) {
        tipo = await db.tipoMenudencia.create({
          data: { nombre: tipoMenudenciaNombre }
        })
      }
      tipoId = tipo.id
    }

    // Si no hay tipo, crear uno por defecto
    if (!tipoId) {
      let tipoDefault = await db.tipoMenudencia.findFirst({
        where: { nombre: 'Sin tipo' }
      })
      if (!tipoDefault) {
        tipoDefault = await db.tipoMenudencia.create({
          data: { nombre: 'Sin tipo' }
        })
      }
      tipoId = tipoDefault.id
    }

    const menudencia = await db.menudencia.create({
      data: {
        tipoMenudenciaId: tipoId,
        tropaCodigo: tropaCodigo || null,
        pesoIngreso: parseFloat(pesoIngreso),
        operadorElaboracion: operadorElaboracion || null,
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
  const authError = await checkPermission(request, 'puedeMenudencias')
  if (authError) return authError

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
