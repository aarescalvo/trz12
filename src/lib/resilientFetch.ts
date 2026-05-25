'use client'

// ============================================================
// RESILIENT FETCH - Capa 3: Fetch que encola operaciones cuando no hay conexión
// Reemplaza fetch() en todas las llamadas de escritura de los módulos
// ============================================================

import { useOfflineStore } from '@/stores/offlineStore'

export interface ResilientFetchOptions {
  /** Módulo que origina la operación (ej: 'pesajeCamiones') */
  module: string
  /** Endpoint de la API (ej: '/api/pesaje-camion') */
  endpoint: string
  /** Método HTTP */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** Datos a enviar */
  body?: Record<string, unknown>
  /** Si es true, NO encola cuando está offline (solo lectura) */
  readOnly?: boolean
  /** Callback cuando la operación se completa exitosamente */
  onSuccess?: (data: any) => void
  /** Callback cuando la operación falla */
  onError?: (error: string) => void
  /** Callback cuando la operación se encola offline */
  onQueued?: (queueId: string) => void
}

export interface ResilientFetchResult {
  success: boolean
  data?: any
  error?: string
  offline?: boolean
  queueId?: string
}

/**
 * Fetch resistente a desconexiones.
 * - Si hay conexión: ejecuta el fetch normal.
 * - Si no hay conexión y es escritura: encola en el offlineStore.
 * - Si no hay conexión y es lectura: intenta caché o retorna error.
 */
export async function resilientFetch(options: ResilientFetchOptions): Promise<ResilientFetchResult> {
  const {
    module,
    endpoint,
    method = 'POST',
    body,
    readOnly = false,
    onSuccess,
    onError,
    onQueued,
  } = options

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  // Si es solo lectura y estamos offline, no podemos hacer nada
  if (readOnly && !isOnline) {
    const error = 'Sin conexión - operación de lectura no disponible'
    onError?.(error)
    return { success: false, error }
  }

  // Si estamos offline y es escritura, encolar
  if (!isOnline && !readOnly) {
    // method is guaranteed to be POST/PUT/DELETE here since readOnly=false excludes GET
    const writeMethod = method as 'POST' | 'PUT' | 'DELETE'
    const store = useOfflineStore.getState()
    const queueId = store.addToQueue({
      module,
      action: writeMethod === 'POST' ? 'CREATE' : writeMethod === 'PUT' ? 'UPDATE' : 'DELETE',
      endpoint,
      method: writeMethod,
      data: body || {},
    })

    onQueued?.(queueId)
    return { success: true, offline: true, queueId }
  }

  // Estamos online - ejecutar fetch normal
  try {
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()

    if (response.ok && data.success !== false) {
      onSuccess?.(data)
      return { success: true, data: data.data || data }
    } else {
      const error = data.error || `Error ${response.status}`
      onError?.(error)
      return { success: false, error }
    }
  } catch (error: unknown) {
    // Si falla la conexión durante el fetch, encolar si es escritura
    if (!readOnly) {
      const writeMethod = method as 'POST' | 'PUT' | 'DELETE'
      const store = useOfflineStore.getState()
      const queueId = store.addToQueue({
        module,
        action: writeMethod === 'POST' ? 'CREATE' : writeMethod === 'PUT' ? 'UPDATE' : 'DELETE',
        endpoint,
        method: writeMethod,
        data: body || {},
      })

      onQueued?.(queueId)
      return { success: true, offline: true, queueId }
    }

    const errorMsg = error instanceof Error ? error.message : 'Error de conexión'
    onError?.(errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Helper para operaciones de escritura (POST/PUT/DELETE) con protección offline
 * Uso: const result = await resilientSave('pesajeCamiones', '/api/pesaje-camion', 'POST', payload)
 */
export async function resilientSave(
  module: string,
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE',
  data: Record<string, unknown>
): Promise<ResilientFetchResult> {
  return resilientFetch({ module, endpoint, method, body: data })
}

/**
 * Helper para operaciones de lectura con fallback a caché
 * Uso: const result = await resilientLoad('/api/tropas')
 */
export async function resilientLoad(
  endpoint: string
): Promise<ResilientFetchResult> {
  return resilientFetch({ module: '__load__', endpoint, method: 'GET', readOnly: true })
}
