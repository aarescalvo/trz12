'use client'

import { useState, useEffect, useCallback } from 'react'
import { createLogger } from '@/lib/logger'
const log = createLogger('lib.offline.useOffline')
import { 
  initOfflineDB, 
  isOnline, 
  getConnectionStatus,
  saveItem,
  getAllItems,
  getItemById,
  deleteItem,
  addToSyncQueue,
  getPendingSyncCount,
  processSyncQueue,
  clearSyncedItems,
  cacheData,
  OFFLINE_STORES,
  ConnectionStatus
} from './index'

/**
 * Hook para manejar el estado de conexión y funcionalidad offline
 */
export function useOffline() {
  // Estado inicial con valor correcto
  const [online, setOnline] = useState(() => {
    // Solo se ejecuta en el cliente
    if (typeof window !== 'undefined') {
      return navigator.onLine
    }
    return true // Default para SSR
  })
  const [initialized, setInitialized] = useState(false)
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: true,
    lastOnline: null,
    lastSync: null,
    pendingItems: 0
  })

  // Inicializar IndexedDB
  useEffect(() => {
    initOfflineDB()
      .then(() => setInitialized(true))
      .catch(console.error)
  }, [])

  // Escuchar cambios de conexión
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true)
      localStorage.setItem('lastOnline', new Date().toISOString())
      // Intentar sincronizar cuando vuelve la conexión
      processSyncQueue()
        .then(result => {
          if (result.success > 0) {
            log.info(`Sincronización automática: ${result.success} items`)
          }
          if (result.failed > 0) {
            console.error(`Errores de sincronización: ${result.failed}`)
          }
        })
        .catch(console.error)
    }

    const handleOffline = () => {
      setOnline(false)
    }

    // Event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Actualizar estado periódicamente
  useEffect(() => {
    const updateStatus = async () => {
      const newStatus = await getConnectionStatus()
      setStatus(newStatus)
    }

    updateStatus()
    const interval = setInterval(updateStatus, 300000) // Cada 5 minutos (reducido de 30s para menos re-renders)

    return () => clearInterval(interval)
  }, [])

  return {
    online,
    initialized,
    status,
    // Funciones expuestas
    saveItem,
    getAllItems,
    getItemById,
    deleteItem,
    addToSyncQueue,
    getPendingSyncCount,
    processSyncQueue,
    clearSyncedItems,
    cacheData,
  }
}

/**
 * Hook para operaciones offline-aware
 * Automatically usa API online o IndexedDB offline
 */
export function useOfflineAware<T>(storeName: string) {
  const { online, saveItem: saveOffline, getAllItems, addToSyncQueue } = useOffline()

  /**
   * Guarda datos - online: API, offline: IndexedDB
   */
  const save = useCallback(async (
    apiEndpoint: string,
    data: T & { id: string },
    action: 'CREATE' | 'UPDATE' | 'DELETE' = 'CREATE'
  ): Promise<{ success: boolean; data?: T; error?: string; offline?: boolean }> => {
    if (online) {
      // Modo online: usar API
      try {
        const response = await window.fetch(apiEndpoint, {
          method: action === 'DELETE' ? 'DELETE' : (action === 'CREATE' ? 'POST' : 'PUT'),
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })

        const result = await response.json()

        if (result.success) {
          return { success: true, data: result.data }
        } else {
          return { success: false, error: result.error }
        }
      } catch (error: any) {
        // Si falla la conexión, usar offline
        log.warn('Error de conexión, guardando offline', { error: String(error) })
        await saveOffline(storeName, data)
        await addToSyncQueue(storeName, action, data)
        return { success: true, data, offline: true }
      }
    } else {
      // Modo offline: guardar en IndexedDB
      await saveOffline(storeName, data)
      await addToSyncQueue(storeName, action, data)
      return { success: true, data, offline: true }
    }
  }, [online, storeName, saveOffline, addToSyncQueue])

  /**
   * Obtiene datos - online: API, offline: IndexedDB
   */
  const fetchData = useCallback(async (
    apiEndpoint: string
  ): Promise<{ success: boolean; data?: T[]; error?: string; offline?: boolean }> => {
    if (online) {
      // Modo online: usar API
      try {
        const response = await window.fetch(apiEndpoint)
        const result = await response.json()

        if (result.success) {
          // Actualizar caché local
          if (result.data) {
            cacheData(storeName, result.data).catch(console.error)
          }
          return { success: true, data: result.data }
        } else {
          return { success: false, error: result.error }
        }
      } catch (error: any) {
        // Si falla, usar caché local
        log.warn('Error de conexión, usando caché local', { error: String(error) })
        const cachedData = await getAllItems<T>(storeName)
        return { success: true, data: cachedData, offline: true }
      }
    } else {
      // Modo offline: usar caché local
      const cachedData = await getAllItems<T>(storeName)
      return { success: true, data: cachedData, offline: true }
    }
  }, [online, storeName, getAllItems])

  return {
    online,
    save,
    fetchData,
    saveItem: saveOffline,
    getAllItems,
  }
}

/**
 * Hook específico para pesaje individual offline
 */
export function useOfflinePesaje() {
  return useOfflineAware<any>(OFFLINE_STORES.PESAJES_PENDIENTES)
}

/**
 * Hook específico para asignación de garrón offline
 */
export function useOfflineGarron() {
  return useOfflineAware<any>(OFFLINE_STORES.ASIGNACIONES_GARRON)
}

/**
 * Hook específico para romaneo offline
 */
export function useOfflineRomaneo() {
  return useOfflineAware<any>(OFFLINE_STORES.ROMANEOS_PENDIENTES)
}

/**
 * Hook específico para menudencias offline
 */
export function useOfflineMenudencias() {
  return useOfflineAware<any>(OFFLINE_STORES.MENUDENCIAS_PENDIENTES)
}

export default useOffline
