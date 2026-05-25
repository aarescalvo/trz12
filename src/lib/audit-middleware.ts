import { db } from '@/lib/db'
import { getClientIp, getUserAgent, generateChangeDescription } from '@/lib/security'

// ==================== TIPOS ====================

export interface AuditLogParams {
  /** ID del operador que realiza la acción */
  operadorId?: string
  /** Módulo principal (ej: 'PESAJE', 'TROPAS', 'FACTURACION') */
  modulo: string
  /** Submódulo opcional (ej: 'CAMIONES', 'INDIVIDUAL') */
  submodulo?: string
  /** Tipo de acción: CREATE, UPDATE, DELETE, READ, LOGIN, LOGOUT, EXPORT */
  accion: AuditAction
  /** Nombre de la entidad afectada (ej: 'Tropa', 'Factura') */
  entidad: string
  /** ID de la entidad afectada */
  entidadId?: string
  /** Nombre legible de la entidad (ej: 'Tropa B20260001') */
  entidadNombre?: string
  /** Descripción del cambio */
  descripcion: string
  /** Datos antes del cambio (JSON) */
  datosAntes?: any
  /** Datos después del cambio (JSON) */
  datosDespues?: any
  /** IP del cliente */
  ip?: string
  /** User Agent del cliente */
  userAgent?: string
  /** ID de sesión */
  sessionId?: string
  /** Información del dispositivo */
  dispositivo?: string
}

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'READ' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'LOGIN_PIN'
  | 'LOGIN_FAILED'
  | 'EXPORT' 
  | 'IMPORT'
  | 'PRINT'
  | 'LOCK'
  | 'UNLOCK'
  | 'PASSWORD_CHANGE'
  | 'PERMISSION_CHANGE'

// ==================== FUNCIÓN PRINCIPAL ====================

/**
 * Registra un evento en la auditoría
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await db.auditoria.create({
      data: {
        operadorId: params.operadorId || null,
        modulo: params.modulo,
        accion: params.accion,
        entidad: params.entidad,
        entidadId: params.entidadId || null,
        descripcion: params.descripcion,
        datosAntes: params.datosAntes ? JSON.stringify(params.datosAntes) : null,
        datosDespues: params.datosDespues ? JSON.stringify(params.datosDespues) : null,
        ip: params.ip || null,
      }
    })
  } catch (error) {
    console.error('Error al registrar auditoría:', error)
    // No lanzar error para no interrumpir la operación principal
  }
}

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Calcula los cambios entre dos objetos
 */
function calculateChanges(antes: any, despues: any): Record<string, { antes: any; despues: any }> {
  const cambios: Record<string, { antes: any; despues: any }> = {}
  
  const todasLasClaves = new Set([
    ...Object.keys(antes || {}),
    ...Object.keys(despues || {})
  ])

  for (const clave of todasLasClaves) {
    const valorAntes = antes?.[clave]
    const valorDespues = despues?.[clave]

    // Comparar valores (manejar fechas y objetos)
    const antesStr = typeof valorAntes === 'object' ? JSON.stringify(valorAntes) : String(valorAntes)
    const despuesStr = typeof valorDespues === 'object' ? JSON.stringify(valorDespues) : String(valorDespues)

    if (antesStr !== despuesStr) {
      cambios[clave] = {
        antes: valorAntes,
        despues: valorDespues
      }
    }
  }

  return cambios
}

/**
 * Extrae información de auditoría de un Request
 */
export function extractAuditInfo(request: Request): {
  ip: string
  userAgent: string
} {
  return {
    ip: getClientIp({ headers: request.headers }),
    userAgent: getUserAgent({ headers: request.headers })
  }
}

// ==================== FUNCIONES DE CONVENIENCIA ====================

/**
 * Registra una creación
 */
export async function auditCreate(params: {
  operadorId?: string
  modulo: string
  submodulo?: string
  entidad: string
  entidadId?: string
  entidadNombre?: string
  datos: any
  descripcion?: string
  ip?: string
  userAgent?: string
}): Promise<void> {
  await logAudit({
    ...params,
    accion: 'CREATE',
    datosDespues: params.datos,
    descripcion: params.descripcion || `Creación de ${params.entidad}${params.entidadNombre ? `: ${params.entidadNombre}` : ''}`
  })
}

/**
 * Registra una actualización
 */
export async function auditUpdate(params: {
  operadorId?: string
  modulo: string
  submodulo?: string
  entidad: string
  entidadId?: string
  entidadNombre?: string
  datosAntes: any
  datosDespues: any
  descripcion?: string
  ip?: string
  userAgent?: string
}): Promise<void> {
  const descripcionBase = generateChangeDescription(params.datosAntes, params.datosDespues)
  await logAudit({
    ...params,
    accion: 'UPDATE',
    descripcion: params.descripcion || `Actualización de ${params.entidad}: ${descripcionBase}`
  })
}

/**
 * Registra una eliminación
 */
export async function auditDelete(params: {
  operadorId?: string
  modulo: string
  submodulo?: string
  entidad: string
  entidadId?: string
  entidadNombre?: string
  datos: any
  descripcion?: string
  ip?: string
  userAgent?: string
}): Promise<void> {
  await logAudit({
    ...params,
    accion: 'DELETE',
    datosAntes: params.datos,
    descripcion: params.descripcion || `Eliminación de ${params.entidad}${params.entidadNombre ? `: ${params.entidadNombre}` : ''}`
  })
}

/**
 * Registra un login
 */
export async function auditLogin(params: {
  operadorId: string
  metodo: 'PASSWORD' | 'PIN'
  ip: string
  userAgent: string
  exitoso: boolean
  motivo?: string
}): Promise<void> {
  await logAudit({
    operadorId: params.exitoso ? params.operadorId : undefined,
    modulo: 'AUTH',
    accion: params.exitoso 
      ? (params.metodo === 'PIN' ? 'LOGIN_PIN' : 'LOGIN')
      : 'LOGIN_FAILED',
    entidad: 'Operador',
    entidadId: params.operadorId,
    descripcion: params.exitoso 
      ? `Login exitoso mediante ${params.metodo.toLowerCase()}`
      : `Login fallido: ${params.motivo || 'Credenciales incorrectas'}`,
    ip: params.ip,
    userAgent: params.userAgent
  })
}

/**
 * Registra un logout
 */
export async function auditLogout(params: {
  operadorId: string
  ip?: string
  userAgent?: string
  sessionId?: string
}): Promise<void> {
  await logAudit({
    operadorId: params.operadorId,
    modulo: 'AUTH',
    accion: 'LOGOUT',
    entidad: 'Operador',
    entidadId: params.operadorId,
    descripcion: 'Logout exitoso',
    ip: params.ip,
    userAgent: params.userAgent,
    sessionId: params.sessionId
  })
}

/**
 * Registra una exportación
 */
export async function auditExport(params: {
  operadorId?: string
  modulo: string
  formato: string
  registros: number
  filtros?: any
  ip?: string
  userAgent?: string
}): Promise<void> {
  await logAudit({
    operadorId: params.operadorId,
    modulo: params.modulo,
    accion: 'EXPORT',
    entidad: 'Exportación',
    descripcion: `Exportación a ${params.formato.toUpperCase()} de ${params.registros} registros`,
    datosDespues: { formato: params.formato, registros: params.registros, filtros: params.filtros },
    ip: params.ip,
    userAgent: params.userAgent
  })
}

/**
 * Registra una impresión
 */
export async function auditPrint(params: {
  operadorId?: string
  modulo: string
  entidad: string
  entidadId?: string
  entidadNombre?: string
  cantidadCopias?: number
  ip?: string
  userAgent?: string
}): Promise<void> {
  await logAudit({
    operadorId: params.operadorId,
    modulo: params.modulo,
    accion: 'PRINT',
    entidad: params.entidad,
    entidadId: params.entidadId,
    entidadNombre: params.entidadNombre,
    descripcion: `Impresión de ${params.entidad}${params.entidadNombre ? `: ${params.entidadNombre}` : ''}${params.cantidadCopias ? ` (${params.cantidadCopias} copias)` : ''}`,
    ip: params.ip,
    userAgent: params.userAgent
  })
}

/**
 * Registra un cambio de contraseña
 */
export async function auditPasswordChange(params: {
  operadorId: string
  ip?: string
  userAgent?: string
  forzado?: boolean
}): Promise<void> {
  await logAudit({
    operadorId: params.operadorId,
    modulo: 'AUTH',
    accion: 'PASSWORD_CHANGE',
    entidad: 'Operador',
    entidadId: params.operadorId,
    descripcion: params.forzado 
      ? 'Cambio de contraseña forzado por administrador'
      : 'Cambio de contraseña',
    ip: params.ip,
    userAgent: params.userAgent
  })
}

/**
 * Registra un cambio de permisos
 */
export async function auditPermissionChange(params: {
  operadorId?: string  // Quien hace el cambio
  operadorAfectadoId: string  // A quien se le cambian los permisos
  permisosAntes: any
  permisosDespues: any
  ip?: string
  userAgent?: string
}): Promise<void> {
  await logAudit({
    operadorId: params.operadorId,
    modulo: 'SEGURIDAD',
    accion: 'PERMISSION_CHANGE',
    entidad: 'Operador',
    entidadId: params.operadorAfectadoId,
    descripcion: 'Cambio de permisos de operador',
    datosAntes: params.permisosAntes,
    datosDespues: params.permisosDespues,
    ip: params.ip,
    userAgent: params.userAgent
  })
}

// ==================== MÓDULOS PREDEFINIDOS ====================

export const AUDIT_MODULES = {
  AUTH: 'AUTH',
  PESAJE_CAMION: 'PESAJE_CAMION',
  PESAJE_INDIVIDUAL: 'PESAJE_INDIVIDUAL',
  MOVIMIENTO_HACIENDA: 'MOVIMIENTO_HACIENDA',
  TROPAS: 'TROPAS',
  ANIMALES: 'ANIMALES',
  FAENA: 'FAENA',
  ROMANEO: 'ROMANEO',
  STOCK: 'STOCK',
  CAMARAS: 'CAMARAS',
  MENUDENCIAS: 'MENUDENCIAS',
  FACTURACION: 'FACTURACION',
  PAGOS: 'PAGOS',
  CLIENTES: 'CLIENTES',
  PROVEEDORES: 'PROVEEDORES',
  OPERADORES: 'OPERADORES',
  CONFIGURACION: 'CONFIGURACION',
  REPORTES: 'REPORTES',
  SEGURIDAD: 'SEGURIDAD',
  CCIR: 'CCIR',
  INSUMOS: 'INSUMOS'
} as const

export type AuditModule = typeof AUDIT_MODULES[keyof typeof AUDIT_MODULES]
