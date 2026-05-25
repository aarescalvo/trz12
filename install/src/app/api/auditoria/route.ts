import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch auditoría
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modulo = searchParams.get('modulo')
    const accion = searchParams.get('accion')
    const operadorId = searchParams.get('operadorId')
    const limit = parseInt(searchParams.get('limit') || '100')
    
    const where: Record<string, unknown> = {}
    
    if (modulo) where.modulo = modulo
    if (accion) where.accion = accion
    if (operadorId) where.operadorId = operadorId
    
    const auditoria = await db.auditoria.findMany({
      where,
      include: {
        operador: {
          select: {
            nombre: true,
            nivel: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      },
      take: limit
    })
    
    return NextResponse.json({
      success: true,
      data: auditoria
    })
  } catch (error) {
    console.error('Error fetching auditoria:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener auditoría' },
      { status: 500 }
    )
  }
}

// POST - Create auditoría entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      operadorId,
      modulo,
      accion,
      entidad,
      entidadId,
      descripcion,
      datosAntes,
      datosDespues
    } = body
    
    const entry = await db.auditoria.create({
      data: {
        operadorId,
        modulo,
        accion,
        entidad,
        entidadId,
        descripcion,
        datosAntes: datosAntes ? JSON.stringify(datosAntes) : null,
        datosDespues: datosDespues ? JSON.stringify(datosDespues) : null
      },
      include: {
        operador: {
          select: {
            nombre: true,
            nivel: true
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: entry
    })
  } catch (error) {
    console.error('Error creating auditoria:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear registro de auditoría' },
      { status: 500 }
    )
  }
}
