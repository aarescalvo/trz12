import { db } from '@/lib/db';

export interface AuditLog {
  modulo: string;
  accion: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ' | 'LOGIN' | 'LOGOUT';
  entidad: string;
  entidadId?: string;
  descripcion: string;
  datosAntes?: any;
  datosDespues?: any;
  operadorId?: string;
  ip?: string;
}

export async function logAudit(data: AuditLog): Promise<void> {
  await db.auditoria.create({
    data: {
      modulo: data.modulo,
      accion: data.accion,
      entidad: data.entidad,
      entidadId: data.entidadId,
      descripcion: data.descripcion,
      datosAntes: data.datosAntes ? JSON.stringify(data.datosAntes) : null,
      datosDespues: data.datosDespues ? JSON.stringify(data.datosDespues) : null,
      operadorId: data.operadorId,
      ip: data.ip,
    }
  });
}

// Alias for compatibility with SIGICA and other modules
export async function registrarAuditoria(data: AuditLog): Promise<void> {
  return logAudit(data);
}

export async function getAuditLogs(filters: {
  modulo?: string;
  accion?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  operadorId?: string;
  limit?: number;
  offset?: number;
}) {
  return db.auditoria.findMany({
    where: {
      modulo: filters.modulo,
      accion: filters.accion,
      operadorId: filters.operadorId,
      fecha: {
        gte: filters.fechaDesde,
        lte: filters.fechaHasta
      }
    },
    include: { operador: true },
    orderBy: { fecha: 'desc' },
    take: Math.min(filters.limit || 50, 1000),
    skip: filters.offset
  });
}

// Re-exportar funciones avanzadas del audit-middleware
export {
  logAudit as logAuditAdvanced,
  auditCreate,
  auditUpdate,
  auditDelete,
  auditLogin,
  auditLogout,
  auditExport,
  auditPrint,
  auditPasswordChange,
  auditPermissionChange,
  AUDIT_MODULES,
  type AuditLogParams,
  type AuditAction,
  type AuditModule
} from './audit-middleware';
