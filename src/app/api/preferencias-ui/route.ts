import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener preferencias de UI del usuario
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const operadorId = request.headers.get('x-operador-id')

    if (!operadorId) {
      return NextResponse.json({ success: false, error: 'ID de operador requerido' }, { status: 400 })
    }

    let preferencias = await db.preferenciasUI.findUnique({
      where: { operadorId }
    })

    // Si no existe, crear con valores por defecto
    if (!preferencias) {
      preferencias = await db.preferenciasUI.create({
        data: {
          operadorId,
          moduloOrden: null,
          moduloTamano: null,
          moduloVisible: null,
          moduloColor: null,
          sidebarExpandido: true,
          gruposExpandidos: null,
          tema: 'light',
          tamanoFuente: 'normal',
          densidad: 'normal'
        }
      })
    }

    // Parsear JSON strings a objetos
    const parsedData = {
      ...preferencias,
      moduloOrden: preferencias.moduloOrden ? JSON.parse(preferencias.moduloOrden as string) : null,
      moduloTamano: preferencias.moduloTamano ? JSON.parse(preferencias.moduloTamano as string) : null,
      moduloVisible: preferencias.moduloVisible ? JSON.parse(preferencias.moduloVisible as string) : null,
      moduloColor: preferencias.moduloColor ? JSON.parse(preferencias.moduloColor as string) : null,
      gruposExpandidos: preferencias.gruposExpandidos ? JSON.parse(preferencias.gruposExpandidos as string) : null,
    }

    return NextResponse.json({ success: true, data: parsedData })
  } catch (error) {
    console.error('Error obteniendo preferencias UI:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener preferencias' }, { status: 500 })
  }
}

// POST - Guardar preferencias de UI
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const body = await request.json()
    const { operadorId, ...preferencias } = body

    if (!operadorId) {
      return NextResponse.json({ success: false, error: 'ID de operador requerido' }, { status: 400 })
    }

    // Convertir objetos a JSON strings si es necesario
    const dataToUpdate: Record<string, unknown> = {}
    
    if (preferencias.moduloOrden !== undefined) {
      dataToUpdate.moduloOrden = typeof preferencias.moduloOrden === 'string' 
        ? preferencias.moduloOrden 
        : JSON.stringify(preferencias.moduloOrden)
    }
    if (preferencias.moduloTamano !== undefined) {
      dataToUpdate.moduloTamano = typeof preferencias.moduloTamano === 'string'
        ? preferencias.moduloTamano
        : JSON.stringify(preferencias.moduloTamano)
    }
    if (preferencias.moduloVisible !== undefined) {
      dataToUpdate.moduloVisible = typeof preferencias.moduloVisible === 'string'
        ? preferencias.moduloVisible
        : JSON.stringify(preferencias.moduloVisible)
    }
    if (preferencias.moduloColor !== undefined) {
      dataToUpdate.moduloColor = typeof preferencias.moduloColor === 'string'
        ? preferencias.moduloColor
        : JSON.stringify(preferencias.moduloColor)
    }
    if (preferencias.gruposExpandidos !== undefined) {
      dataToUpdate.gruposExpandidos = typeof preferencias.gruposExpandidos === 'string'
        ? preferencias.gruposExpandidos
        : JSON.stringify(preferencias.gruposExpandidos)
    }
    if (preferencias.sidebarExpandido !== undefined) {
      dataToUpdate.sidebarExpandido = preferencias.sidebarExpandido
    }
    if (preferencias.tema !== undefined) {
      dataToUpdate.tema = preferencias.tema
    }
    if (preferencias.tamanoFuente !== undefined) {
      dataToUpdate.tamanoFuente = preferencias.tamanoFuente
    }
    if (preferencias.densidad !== undefined) {
      dataToUpdate.densidad = preferencias.densidad
    }
    if (preferencias.paginaInicio !== undefined) {
      dataToUpdate.paginaInicio = preferencias.paginaInicio
    }

    const preferenciasActualizadas = await db.preferenciasUI.upsert({
      where: { operadorId },
      update: dataToUpdate,
      create: {
        operadorId,
        ...dataToUpdate
      }
    })

    return NextResponse.json({ success: true, data: preferenciasActualizadas })
  } catch (error) {
    console.error('Error guardando preferencias UI:', error)
    return NextResponse.json({ success: false, error: 'Error al guardar preferencias' }, { status: 500 })
  }
}

// DELETE - Resetear preferencias a valores por defecto
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const operadorId = request.headers.get('x-operador-id')

    if (!operadorId) {
      return NextResponse.json({ success: false, error: 'ID de operador requerido' }, { status: 400 })
    }

    await db.preferenciasUI.delete({
      where: { operadorId }
    })

    return NextResponse.json({ success: true, message: 'Preferencias reseteadas' })
  } catch (error) {
    console.error('Error reseteando preferencias UI:', error)
    return NextResponse.json({ success: false, error: 'Error al resetear preferencias' }, { status: 500 })
  }
}
