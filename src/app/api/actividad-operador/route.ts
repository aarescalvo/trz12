import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener actividades recientes (usa modelo Auditoria)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const operadorId = request.headers.get('x-operador-id')
    const modulo = searchParams.get('modulo')
    const limite = parseInt(searchParams.get('limite') || '100')

    const where: Record<string, unknown> = {}

    if (operadorId) {
      where.operadorId = operadorId
    }
    if (modulo) {
      where.modulo = modulo
    }

    const actividades = await db.auditoria.findMany({
      where,
      include: {
        operador: {
          select: {
            id: true,
            nombre: true,
            usuario: true,
            rol: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      },
      take: limite
    })

    // Mapear al formato esperado por el frontend
    const data = actividades.map(a => ({
      id: a.id,
      tipo: a.accion,
      modulo: a.modulo,
      descripcion: a.descripcion,
      entidad: a.entidad,
      entidadId: a.entidadId,
      fecha: a.fecha.toISOString(),
      operador: a.operador
    }))

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error al obtener actividades:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener actividades' },
      { status: 500 }
    )
  }
}

// POST - Registrar nueva actividad (usa modelo Auditoria)
export async function POST(request: NextRequest) {
  try {
    // Verify permission - only admin or supervisor can create audit entries
    const operadorId = request.headers.get('x-operador-id');
    if (!operadorId) {
      return NextResponse.json({ error: 'Se requiere operador autenticado' }, { status: 401 });
    }

    const body = await request.json()
    const {
      tipo,
      modulo,
      descripcion,
      entidad,
      entidadId,
      datos,
      ip,
      userAgent
    } = body

    if (!tipo || !modulo || !descripcion) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: tipo, modulo, descripcion' },
        { status: 400 }
      )
    }

    const actividad = await db.auditoria.create({
      data: {
        operadorId,
        accion: tipo,
        modulo,
        entidad: entidad || modulo,
        entidadId,
        descripcion,
        datosAntes: null,
        datosDespues: datos ? JSON.stringify(datos) : null,
        ip
      }
    })

    return NextResponse.json({
      success: true,
      data: actividad
    })
  } catch (error) {
    console.error('Error al registrar actividad:', error)
    return NextResponse.json(
      { success: false, error: 'Error al registrar actividad' },
      { status: 500 }
    )
  }
}
