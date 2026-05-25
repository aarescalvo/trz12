import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// POST - Aprobar/Rechazar romaneo (VB Supervisor)
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError
  try {
    const body = await request.json()
    const { garrones, listaFaenaId, operadorId, supervisorId, aprobar } = body

    if (!garrones || !Array.isArray(garrones) || garrones.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requiere al menos un garrón' },
        { status: 400 }
      )
    }

    if (!supervisorId) {
      return NextResponse.json(
        { success: false, error: 'Se requiere autenticación de supervisor' },
        { status: 401 }
      )
    }

    const resultados: any[] = []

    for (const garron of garrones) {
      // Buscar el romaneo
      const romaneo = await db.romaneo.findFirst({
        where: { garron },
        include: { mediasRes: true }
      })

      if (!romaneo) {
        resultados.push({ garron, success: false, error: 'Romaneo no encontrado' })
        continue
      }

      if (aprobar) {
        // Aprobar - cambiar estado a CONFIRMADO
        await db.$transaction(async (tx) => {
          await tx.romaneo.update({
            where: { id: romaneo.id },
            data: {
              estado: 'CONFIRMADO',
              supervisorId,
              fechaConfirmacion: new Date()
            }
          })

          // Marcar asignación como completada
          await tx.asignacionGarron.updateMany({
            where: { garron },
            data: { completado: true }
          })

          // Registrar auditoría
          await tx.auditoria.create({
            data: {
              operadorId: supervisorId,
              modulo: 'VB_ROMANEO',
              accion: 'APROBAR_ROMANEO',
              entidad: 'Romaneo',
              entidadId: romaneo.id,
              descripcion: `Romaneo aprobado para garrón ${garron}`
            }
          })
        })

        resultados.push({ garron, success: true, estado: 'CONFIRMADO' })
      } else {
        // Rechazar/Observar - cambiar estado a ANULADO o mantener PENDIENTE con observaciones
        await db.$transaction(async (tx) => {
          await tx.romaneo.update({
            where: { id: romaneo.id },
            data: {
              estado: 'ANULADO',
              supervisorId
            }
          })

          // Registrar auditoría
          await tx.auditoria.create({
            data: {
              operadorId: supervisorId,
              modulo: 'VB_ROMANEO',
              accion: 'RECHAZAR_ROMANEO',
              entidad: 'Romaneo',
              entidadId: romaneo.id,
              descripcion: `Romaneo rechazado para garrón ${garron}`
            }
          })
        })

        resultados.push({ garron, success: true, estado: 'ANULADO' })
      }
    }

    const aprobados = resultados.filter((r: any) => r.success && r.estado === 'CONFIRMADO').length
    const rechazados = resultados.filter((r: any) => r.success && r.estado === 'ANULADO').length
    const errores = resultados.filter((r: any) => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Procesados ${garrones.length} garrones: ${aprobados} aprobados, ${rechazados} rechazados, ${errores} con error`,
      data: {
        resultados,
        resumen: { total: garrones.length, aprobados, rechazados, errores }
      }
    })

  } catch (error) {
    console.error('Error aprobando romaneos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al procesar romaneos' },
      { status: 500 }
    )
  }
}
