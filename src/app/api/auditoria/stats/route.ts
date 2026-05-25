import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { checkPermission } from '@/lib/auth-helpers'

const logger = createLogger('API:AuditoriaStats')

// GET - Estadísticas de auditoría por operador
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    // Obtener todos los operadores activos
    const operadores = await db.operador.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, usuario: true, rol: true }
    })

    // Obtener estadísticas por operador
    const stats = await Promise.all(
      operadores.map(async (op) => {
        const totalAcciones = await db.auditoria.count({
          where: { operadorId: op.id }
        })

        const creates = await db.auditoria.count({
          where: { operadorId: op.id, accion: 'CREATE' }
        })

        const updates = await db.auditoria.count({
          where: { operadorId: op.id, accion: 'UPDATE' }
        })

        const deletes = await db.auditoria.count({
          where: { operadorId: op.id, accion: 'DELETE' }
        })

        const logins = await db.auditoria.count({
          where: { operadorId: op.id, accion: { in: ['LOGIN', 'LOGIN_PIN'] } }
        })

        const errores = await db.auditoria.count({
          where: { operadorId: op.id, accion: 'ERROR' }
        })

        const ultimoAcceso = await db.auditoria.findFirst({
          where: { operadorId: op.id, accion: { in: ['LOGIN', 'LOGIN_PIN'] } },
          orderBy: { fecha: 'desc' },
          select: { fecha: true }
        })

        return {
          operadorId: op.id,
          operadorNombre: op.nombre,
          operadorUsuario: op.usuario,
          operadorRol: op.rol,
          totalAcciones,
          creates,
          updates,
          deletes,
          logins,
          errores,
          ultimoAcceso: ultimoAcceso?.fecha?.toISOString() || ''
        }
      })
    )

    // Ordenar por total de acciones
    stats.sort((a, b) => b.totalAcciones - a.totalAcciones)

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    logger.error('Error en estadísticas de auditoría', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
