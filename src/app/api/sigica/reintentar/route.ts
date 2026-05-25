import { NextRequest, NextResponse } from 'next/server'
import { reintentarEnvioSIGICA } from '@/lib/sigica'
import { registrarAuditoria } from '@/lib/audit'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// POST /api/sigica/reintentar - Reintentar envío fallido
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const body = await request.json()
    const { envioId, operadorId } = body

    if (!envioId) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el ID del envío' },
        { status: 400 }
      )
    }

    // Verificar que el envío existe
    const envio = await db.envioSIGICA.findUnique({
      where: { id: envioId }
    })

    if (!envio) {
      return NextResponse.json(
        { success: false, error: 'Envío no encontrado' },
        { status: 404 }
      )
    }

    // Reintentar envío
    const resultado = await reintentarEnvioSIGICA(envioId)

    // Registrar auditoría
    await registrarAuditoria({
      modulo: 'SIGICA',
      accion: 'UPDATE',
      entidad: 'EnvioSIGICA',
      entidadId: envioId,
      descripcion: `Reintento de envío SIGICA (${envio.tipo})`,
      datosDespues: JSON.stringify({
        exito: resultado.exito,
        codigoTransaccion: resultado.codigoTransaccion,
        intentos: envio.intentos + 1
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
    console.error('Error al reintentar envío SIGICA:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al reintentar envío' },
      { status: 500 }
    )
  }
}
