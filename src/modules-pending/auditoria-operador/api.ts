// API functions para el módulo de Auditoría por Operador

import type { AuditoriaItem, OperadorStats, FiltrosAuditoria, AuditoriaResponse } from './types'

const API_BASE = '/api/auditoria'

// Obtener lista de auditoría con filtros y paginación
export async function getAuditoria(filtros: FiltrosAuditoria & { pagina?: number; limite?: number }): Promise<AuditoriaResponse> {
  const params = new URLSearchParams()
  
  if (filtros.operadorId) params.append('operadorId', filtros.operadorId)
  if (filtros.modulo) params.append('modulo', filtros.modulo)
  if (filtros.accion) params.append('accion', filtros.accion)
  if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde)
  if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta)
  if (filtros.busqueda) params.append('busqueda', filtros.busqueda)
  if (filtros.pagina) params.append('pagina', filtros.pagina.toString())
  if (filtros.limite) params.append('limite', filtros.limite.toString())

  const res = await fetch(`${API_BASE}?${params}`)
  return res.json()
}

// Obtener un registro de auditoría por ID
export async function getAuditoriaById(id: string): Promise<AuditoriaItem> {
  const res = await fetch(`${API_BASE}?id=${id}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Error al obtener auditoría')
  return data.data
}

// Obtener estadísticas por operador
export async function getEstadisticasOperadores(fechaDesde?: string, fechaHasta?: string): Promise<OperadorStats[]> {
  const params = new URLSearchParams()
  if (fechaDesde) params.append('fechaDesde', fechaDesde)
  if (fechaHasta) params.append('fechaHasta', fechaHasta)

  const res = await fetch(`${API_BASE}/stats?${params}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Error al obtener estadísticas')
  return data.data
}

// Obtener actividad de un operador específico
export async function getActividadOperador(operadorId: string, limite?: number): Promise<AuditoriaItem[]> {
  const params = new URLSearchParams({ operadorId })
  if (limite) params.append('limite', limite.toString())

  const res = await fetch(`${API_BASE}?${params}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Error al obtener actividad')
  return data.data
}

// Obtener errores recientes
export async function getErroresRecientes(limite?: number): Promise<AuditoriaItem[]> {
  const params = new URLSearchParams({ accion: 'ERROR' })
  if (limite) params.append('limite', limite.toString())

  const res = await fetch(`${API_BASE}?${params}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Error al obtener errores')
  return data.data
}

// Obtener logins recientes
export async function getLoginsRecientes(limite?: number): Promise<AuditoriaItem[]> {
  const params = new URLSearchParams({ accion: 'LOGIN' })
  if (limite) params.append('limite', limite.toString())

  const res = await fetch(`${API_BASE}?${params}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Error al obtener logins')
  return data.data
}

// Exportar auditoría a CSV
export async function exportarAuditoriaCSV(filtros: FiltrosAuditoria): Promise<Blob> {
  const params = new URLSearchParams()
  Object.entries(filtros).forEach(([key, value]) => {
    if (value) params.append(key, value)
  })
  params.append('formato', 'csv')

  const res = await fetch(`${API_BASE}/exportar?${params}`)
  if (!res.ok) throw new Error('Error al exportar auditoría')
  return res.blob()
}

// Exportar auditoría a Excel
export async function exportarAuditoriaExcel(filtros: FiltrosAuditoria): Promise<Blob> {
  const params = new URLSearchParams()
  Object.entries(filtros).forEach(([key, value]) => {
    if (value) params.append(key, value)
  })
  params.append('formato', 'excel')

  const res = await fetch(`${API_BASE}/exportar?${params}`)
  if (!res.ok) throw new Error('Error al exportar auditoría')
  return res.blob()
}

// Obtener actividad por módulo
export async function getActividadPorModulo(fechaDesde?: string, fechaHasta?: string): Promise<{ modulo: string; cantidad: number }[]> {
  const params = new URLSearchParams()
  if (fechaDesde) params.append('fechaDesde', fechaDesde)
  if (fechaHasta) params.append('fechaHasta', fechaHasta)

  const res = await fetch(`${API_BASE}/por-modulo?${params}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Error al obtener actividad por módulo')
  return data.data
}

// Obtener actividad por día
export async function getActividadPorDia(dias?: number): Promise<{ fecha: string; cantidad: number }[]> {
  const params = new URLSearchParams()
  if (dias) params.append('dias', dias.toString())

  const res = await fetch(`${API_BASE}/por-dia?${params}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Error al obtener actividad por día')
  return data.data
}

// Registrar evento de auditoría (para uso interno)
export async function registrarAuditoria(evento: {
  operadorId?: string
  modulo: string
  accion: string
  entidad: string
  entidadId?: string
  descripcion: string
  datosAntes?: object
  datosDespues?: object
  ip?: string
}): Promise<void> {
  await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...evento,
      datosAntes: evento.datosAntes ? JSON.stringify(evento.datosAntes) : undefined,
      datosDespues: evento.datosDespues ? JSON.stringify(evento.datosDespues) : undefined
    })
  })
}

// Limpiar auditoría antigua (solo ADMIN)
export async function limpiarAuditoriaAntigua(diasAConservar: number): Promise<{ eliminados: number }> {
  const res = await fetch(`${API_BASE}/limpiar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ diasAConservar })
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Error al limpiar auditoría')
  return data.data
}
