import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener sesión activa del operador
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const operadorId = request.headers.get('x-operador-id')

    if (!operadorId) {
      return NextResponse.json(
        { success: false, error: 'operadorId requerido' },
        { status: 400 }
      )
    }

    // Buscar sesión activa
    let sesion = await db.sesionRomaneo.findFirst({
      where: {
        operadorId,
        activa: true
      },
      include: {
        tipificador: true,
        camara: true
      }
    })

    // Si no existe, crear una nueva
    if (!sesion) {
      sesion = await db.sesionRomaneo.create({
        data: {
          operadorId,
          activa: true
        },
        include: {
          tipificador: true,
          camara: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: sesion.id,
        tipificadorId: sesion.tipificadorId,
        tipificador: sesion.tipificador,
        camaraId: sesion.camaraId,
        camara: sesion.camara,
        ultimoGarron: sesion.ultimoGarron,
        fechaInicio: sesion.fechaInicio.toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching sesion romaneo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener sesión' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar configuración de sesión
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, tipificadorId, camaraId, ultimoGarron, cerrar } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (tipificadorId !== undefined) updateData.tipificadorId = tipificadorId || null
    if (camaraId !== undefined) updateData.camaraId = camaraId || null
    if (ultimoGarron !== undefined) updateData.ultimoGarron = ultimoGarron
    if (cerrar) {
      updateData.activa = false
      updateData.fechaFin = new Date()
    }

    const sesion = await db.sesionRomaneo.update({
      where: { id },
      data: updateData,
      include: {
        tipificador: true,
        camara: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: sesion.id,
        tipificadorId: sesion.tipificadorId,
        tipificador: sesion.tipificador,
        camaraId: sesion.camaraId,
        camara: sesion.camara,
        ultimoGarron: sesion.ultimoGarron,
        activa: sesion.activa
      }
    })
  } catch (error) {
    console.error('Error updating sesion romaneo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar sesión' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva sesión
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError
  try {
    const body = await request.json()
    const { operadorId, tipificadorId, camaraId } = body

    if (!operadorId) {
      return NextResponse.json(
        { success: false, error: 'operadorId requerido' },
        { status: 400 }
      )
    }

    // Cerrar sesiones anteriores del operador
    await db.sesionRomaneo.updateMany({
      where: {
        operadorId,
        activa: true
      },
      data: {
        activa: false,
        fechaFin: new Date()
      }
    })

    // Crear nueva sesión
    const sesion = await db.sesionRomaneo.create({
      data: {
        operadorId,
        tipificadorId: tipificadorId || null,
        camaraId: camaraId || null,
        activa: true
      },
      include: {
        tipificador: true,
        camara: true
      }
    })

    return NextResponse.json({
      success: true,
      data: sesion
    })
  } catch (error) {
    console.error('Error creating sesion romaneo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear sesión' },
      { status: 500 }
    )
  }
}
