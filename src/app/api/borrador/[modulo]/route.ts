// ============================================================
// API BORRADOR - Capa 2: Auto-guardado de formularios en DB
// POST   /api/borrador/[modulo]  → Crear/actualizar borrador
// GET    /api/borrador/[modulo]  → Obtener borrador activo
// DELETE /api/borrador/[modulo]  → Descartar borrador
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ modulo: string }> }
) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { modulo } = await params
    const body = await request.json()
    const { operadorId, datos, sesionKey } = body

    if (!datos) {
      return NextResponse.json(
        { success: false, error: 'Datos del borrador requeridos' },
        { status: 400 }
      )
    }

    const key = sesionKey || `${modulo}-${operadorId || 'anon'}`

    const borrador = await db.borrador.upsert({
      where: {
        modulo_sesionKey: {
          modulo,
          sesionKey: key,
        },
      },
      create: {
        modulo,
        operadorId: operadorId || null,
        datos: typeof datos === 'string' ? datos : JSON.stringify(datos),
        sesionKey: key,
        estado: 'ACTIVO',
      },
      update: {
        operadorId: operadorId || null,
        datos: typeof datos === 'string' ? datos : JSON.stringify(datos),
        estado: 'ACTIVO',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: borrador.id,
        modulo: borrador.modulo,
        updatedAt: borrador.updatedAt,
      },
    })
  } catch (error: any) {
    console.error('[Borrador API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al guardar borrador' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modulo: string }> }
) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { modulo } = await params
    const operadorId = request.headers.get('x-operador-id')
    const sesionKey = request.nextUrl.searchParams.get('sesionKey')

    const key = sesionKey || `${modulo}-${operadorId || 'anon'}`

    const borrador = await db.borrador.findFirst({
      where: {
        modulo,
        sesionKey: key,
        estado: 'ACTIVO',
      },
      orderBy: { updatedAt: 'desc' },
    })

    if (!borrador) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No hay borrador activo para este módulo',
      })
    }

    let datosParseados
    try {
      datosParseados = JSON.parse(borrador.datos)
    } catch {
      datosParseados = borrador.datos
    }

    return NextResponse.json({
      success: true,
      data: {
        id: borrador.id,
        modulo: borrador.modulo,
        datos: datosParseados,
        updatedAt: borrador.updatedAt,
        createdAt: borrador.createdAt,
      },
    })
  } catch (error: any) {
    console.error('[Borrador API] Error GET:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener borrador' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ modulo: string }> }
) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { modulo } = await params
    const body = await request.json()
    const { operadorId, sesionKey, borradorId } = body

    if (borradorId) {
      await db.borrador.update({
        where: { id: borradorId },
        data: { estado: 'DESCARTADO' },
      })
    } else {
      const key = sesionKey || `${modulo}-${operadorId || 'anon'}`
      await db.borrador.updateMany({
        where: {
          modulo,
          sesionKey: key,
          estado: 'ACTIVO',
        },
        data: { estado: 'DESCARTADO' },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Borrador API] Error DELETE:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al descartar borrador' },
      { status: 500 }
    )
  }
}
