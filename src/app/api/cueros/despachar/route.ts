import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Despachar cueros
import { checkPermission } from '@/lib/auth-helpers'
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      cueroIds,
      destino,
      tipoDestino,
      remito,
      observaciones
    } = body

    if (!cueroIds || !Array.isArray(cueroIds) || cueroIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Seleccione al menos un cuero para despachar' },
        { status: 400 }
      )
    }

    if (!destino) {
      return NextResponse.json(
        { success: false, error: 'El destino es requerido' },
        { status: 400 }
      )
    }

    // Actualizar todos los cueros seleccionados
    const result = await db.cuero.updateMany({
      where: {
        id: { in: cueroIds },
        estado: 'PENDIENTE'
      },
      data: {
        estado: 'DESPACHADO',
        destino,
        tipoDestino: tipoDestino || 'CURTIEMBRE',
        remito: remito || null,
        fechaDespacho: new Date(),
        observaciones
      }
    })

    return NextResponse.json({
      success: true,
      data: { count: result.count },
      message: `${result.count} cuero(s) despachado(s) correctamente`
    })
  } catch (error) {
    console.error('Error dispatching cueros:', error)
    return NextResponse.json(
      { success: false, error: 'Error al despachar cueros' },
      { status: 500 }
    )
  }
}
