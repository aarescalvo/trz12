import { NextRequest, NextResponse } from 'next/server'
import { actualizarStockCamaraSIGICA } from '@/lib/sigica'
import { registrarAuditoria } from '@/lib/audit'
import { checkPermission } from '@/lib/auth-helpers'

// POST /api/sigica/actualizar-stock - Actualizar stock de cámaras en SIGICA
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const body = await request.json()
    const { camaraIds, operadorId } = body

    // Enviar actualización a SIGICA
    const resultado = await actualizarStockCamaraSIGICA({
      camaraIds: camaraIds || undefined,
      operadorId
    })

    // Registrar auditoría
    await registrarAuditoria({
      modulo: 'SIGICA',
      accion: 'UPDATE',
      entidad: 'StockCamaraSIGICA',
      descripcion: 'Actualización de stock de cámaras en SIGICA',
      datosDespues: JSON.stringify({
        camaraIds,
        exito: resultado.exito,
        codigoTransaccion: resultado.codigoTransaccion
      }),
      operadorId
    })

    return NextResponse.json({
      success: resultado.exito,
      data: {
        codigoTransaccion: resultado.codigoTransaccion,
        mensajeError: resultado.mensajeError
      }
    })
  } catch (error) {
    console.error('Error al actualizar stock en SIGICA:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al actualizar stock' },
      { status: 500 }
    )
  }
}
