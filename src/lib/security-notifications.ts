import { db } from '@/lib/db'
import { createLogger } from '@/lib/logger'
const log = createLogger('lib.security-notifications')

// ==================== NOTIFICACIONES DE SEGURIDAD ====================

export interface SecurityNotification {
  tipo: 'NEW_IP' | 'FAILED_ATTEMPTS' | 'PASSWORD_CHANGE' | 'OUT_OF_HOURS' | 'ACCOUNT_LOCKED' | 'SUSPICIOUS_ACTIVITY'
  operadorId?: string
  operadorNombre?: string
  ip: string
  detalles: string
  severidad: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  fecha?: Date
}

/**
 * Registra una notificación de seguridad en el sistema
 */
export async function createSecurityNotification(notification: SecurityNotification): Promise<void> {
  try {
    // Crear registro de alerta (podría ser una tabla separada en el futuro)
    await db.auditoria.create({
      data: {
        operadorId: notification.operadorId || null,
        modulo: 'SEGURIDAD',
        accion: 'ALERT',
        entidad: 'NotificacionSeguridad',
        descripcion: `[${notification.severidad}] ${notification.tipo}: ${notification.detalles}`,
        ip: notification.ip,
        datosDespues: JSON.stringify({
          tipo: notification.tipo,
          severidad: notification.severidad,
          operadorNombre: notification.operadorNombre,
          detalles: notification.detalles
        })
      }
    })

    // NOTE: Posibles mejoras futuras para notificaciones de seguridad:
    //   1. Enviar email al administrador (usando nodemailer ya configurado)
    //   2. Enviar notificación push (WebSocket / Server-Sent Events)
    //   3. Mostrar en un panel de alertas en tiempo real

    log.info(`[SECURITY ALERT] ${notification.tipo}: ${notification.detalles}`)
  } catch (error) {
    console.error('Error creando notificación de seguridad:', error)
  }
}

/**
 * Notifica un login desde una IP nueva
 */
export async function notifyNewIpLogin(params: {
  operadorId: string
  operadorNombre: string
  ip: string
  userAgent: string
}): Promise<void> {
  // Verificar si es una IP nueva para este usuario
  const sesionesPrevias = await db.sesion.count({
    where: {
      operadorId: params.operadorId,
      ip: params.ip
    }
  })

  if (sesionesPrevias === 0) {
    await createSecurityNotification({
      tipo: 'NEW_IP',
      operadorId: params.operadorId,
      operadorNombre: params.operadorNombre,
      ip: params.ip,
      detalles: `Login desde IP nueva: ${params.ip}. Usuario: ${params.operadorNombre}`,
      severidad: 'LOW',
      fecha: new Date()
    })
  }
}

/**
 * Notifica múltiples intentos fallidos de login
 */
export async function notifyFailedLoginAttempts(params: {
  ip: string
  usuario?: string
  operadorId?: string
  cantidadIntentos: number
}): Promise<void> {
  const severidad = params.cantidadIntentos >= 10 ? 'CRITICAL' : 
                    params.cantidadIntentos >= 5 ? 'HIGH' : 
                    params.cantidadIntentos >= 3 ? 'MEDIUM' : 'LOW'

  await createSecurityNotification({
    tipo: 'FAILED_ATTEMPTS',
    operadorId: params.operadorId,
    operadorNombre: params.usuario,
    ip: params.ip,
    detalles: `${params.cantidadIntentos} intentos fallidos de login desde IP: ${params.ip}. Usuario intentado: ${params.usuario || 'N/A'}`,
    severidad,
    fecha: new Date()
  })

  // Si hay demasiados intentos, bloquear la IP automáticamente
  if (params.cantidadIntentos >= 5) {
    await autoBlockIp(params.ip, 'BRUTE_FORCE')
  }
}

/**
 * Notifica un cambio de contraseña
 */
export async function notifyPasswordChange(params: {
  operadorId: string
  operadorNombre: string
  ip: string
  forzado: boolean
}): Promise<void> {
  await createSecurityNotification({
    tipo: 'PASSWORD_CHANGE',
    operadorId: params.operadorId,
    operadorNombre: params.operadorNombre,
    ip: params.ip,
    detalles: `Contraseña ${params.forzado ? 'cambiada forzadamente' : 'actualizada'} para usuario: ${params.operadorNombre}`,
    severidad: 'MEDIUM',
    fecha: new Date()
  })
}

/**
 * Notifica un acceso fuera de horario
 */
export async function notifyOutOfHoursAccess(params: {
  operadorId: string
  operadorNombre: string
  ip: string
  hora: number
}): Promise<void> {
  await createSecurityNotification({
    tipo: 'OUT_OF_HOURS',
    operadorId: params.operadorId,
    operadorNombre: params.operadorNombre,
    ip: params.ip,
    detalles: `Acceso fuera de horario permitido por usuario: ${params.operadorNombre} a las ${params.hora}:00 desde IP: ${params.ip}`,
    severidad: 'MEDIUM',
    fecha: new Date()
  })
}

/**
 * Notifica que una cuenta fue bloqueada
 */
export async function notifyAccountLocked(params: {
  operadorId: string
  operadorNombre: string
  ip: string
  motivo: string
}): Promise<void> {
  await createSecurityNotification({
    tipo: 'ACCOUNT_LOCKED',
    operadorId: params.operadorId,
    operadorNombre: params.operadorNombre,
    ip: params.ip,
    detalles: `Cuenta bloqueada para usuario: ${params.operadorNombre}. Motivo: ${params.motivo}`,
    severidad: 'HIGH',
    fecha: new Date()
  })
}

/**
 * Bloquea automáticamente una IP
 */
async function autoBlockIp(ip: string, motivo: string): Promise<void> {
  try {
    // Verificar si ya está bloqueada
    const existingBlock = await db.ipBloqueada.findFirst({
      where: {
        ip,
        activo: true,
        OR: [
          { fechaExpiracion: null },
          { fechaExpiracion: { gt: new Date() } }
        ]
      }
    })

    if (existingBlock) return

    // Bloquear por 1 hora por defecto
    const fechaExpiracion = new Date()
    fechaExpiracion.setHours(fechaExpiracion.getHours() + 1)

    await db.ipBloqueada.create({
      data: {
        ip,
        motivo,
        fechaExpiracion,
        activo: true
      }
    })

    await createSecurityNotification({
      tipo: 'SUSPICIOUS_ACTIVITY',
      ip,
      detalles: `IP ${ip} bloqueada automáticamente. Motivo: ${motivo}`,
      severidad: 'HIGH',
      fecha: new Date()
    })
  } catch (error) {
    console.error('Error bloqueando IP:', error)
  }
}

/**
 * Obtiene las alertas de seguridad recientes
 */
export async function getRecentSecurityAlerts(limit: number = 50): Promise<any[]> {
  try {
    const alertas = await db.auditoria.findMany({
      where: {
        modulo: 'SEGURIDAD',
        accion: 'ALERT'
      },
      include: {
        operador: {
          select: {
            nombre: true,
            usuario: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      },
      take: limit
    })

    return alertas.map(a => ({
      id: a.id,
      tipo: a.datosDespues ? JSON.parse(a.datosDespues).tipo : 'UNKNOWN',
      operador: a.operador?.nombre || 'Sistema',
      ip: a.ip,
      descripcion: a.descripcion,
      fecha: a.fecha,
      datos: a.datosDespues ? JSON.parse(a.datosDespues) : null
    }))
  } catch (error) {
    console.error('Error obteniendo alertas de seguridad:', error)
    return []
  }
}

/**
 * Verifica si una IP está bloqueada
 */
export async function isIpBlocked(ip: string): Promise<boolean> {
  const bloqueo = await db.ipBloqueada.findFirst({
    where: {
      ip,
      activo: true,
      OR: [
        { fechaExpiracion: null },
        { fechaExpiracion: { gt: new Date() } }
      ]
    }
  })

  return !!bloqueo
}

/**
 * Obtiene el conteo de intentos fallidos recientes para una IP
 */
export async function getRecentFailedAttempts(ip: string, minutes: number = 15): Promise<number> {
  const desde = new Date()
  desde.setMinutes(desde.getMinutes() - minutes)

  const count = await db.intentoLogin.count({
    where: {
      ip,
      exitoso: false,
      fecha: { gte: desde }
    }
  })

  return count
}

/**
 * Limpia IPs bloqueadas expiradas
 */
export async function cleanupExpiredIpBlocks(): Promise<void> {
  try {
    await db.ipBloqueada.updateMany({
      where: {
        activo: true,
        fechaExpiracion: { lt: new Date() }
      },
      data: {
        activo: false
      }
    })
  } catch (error) {
    console.error('Error limpiando IPs bloqueadas:', error)
  }
}
