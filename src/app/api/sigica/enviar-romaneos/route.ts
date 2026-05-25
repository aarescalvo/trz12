import { NextRequest, NextResponse } from 'next/server'
import { enviarRomaneosSIGICA } from '@/lib/sigica'
import { registrarAuditoria } from '@/lib/audit'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// POST /api/sigica/enviar-romaneos - Enviar romaneos a SIGICA
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const body = await request.json()
    const { romaneoIds, operadorId } = body

    // Validar que se proporcionaron IDs de romaneos
    if (!romaneoIds || !Array.isArray(romaneoIds) || romaneoIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requieren IDs de romaneos' },
        { status: 400 }
      )
    }

    // Verificar que los romaneos existen y están confirmados
    const romaneos = await db.romaneo.findMany({
      where: {
        id: { in: romaneoIds },
        estado: 'CONFIRMADO'
      },
      select: {
        id: true,
        garron: true,
        tropaCodigo: true
      }
    })

    if (romaneos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se encontraron romaneos confirmados para enviar' },
        { status: 400 }
      )
    }

    // Filtrar solo los IDs que existen y están confirmados
    const idsValidos = romaneos.map(r => r.id)

    // Enviar a SIGICA
    const resultado = await enviarRomaneosSIGICA({
      romaneoIds: idsValidos,
      operadorId
    })

    // Registrar auditoría
    await registrarAuditoria({
      modulo: 'SIGICA',
      accion: 'CREATE',
      entidad: 'EnvioSIGICA',
      descripcion: `Envío de ${idsValidos.length} romaneos a SIGICA`,
      datosDespues: JSON.stringify({
        romaneoIds: idsValidos,
        exito: resultado.exito,
        codigoTransaccion: resultado.codigoTransaccion
      }),
      operadorId
    })

    return NextResponse.json({
      success: resultado.exito,
      data: {
        cantidadEnviada: idsValidos.length,
        codigoTransaccion: resultado.codigoTransaccion,
        mensajeError: resultado.mensajeError
      }
    })
  } catch (error) {
    console.error('Error al enviar romaneos a SIGICA:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al enviar romaneos' },
      { status: 500 }
    )
  }
}
