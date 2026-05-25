'use client'

// ============================================================
// RESILIENCE PROVIDER - Proveedor de resiliencia de 3 capas
// Capa 1: Zustand+persist (auto-save a localStorage)
// Capa 2: BORRADOR/draft DB saving (auto-save a PostgreSQL)
// Capa 3: Offline mode con operation queue
// ============================================================

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useOfflineStore } from '@/stores/offlineStore'
import { useAppStore } from '@/stores/appStore'
import { OfflineBanner } from '@/lib/offline/components'
import { initOfflineDB } from '@/lib/offline'
import { createLogger } from '@/lib/logger'
const log = createLogger('components.ResilienceProvider')

export function ResilienceProvider({ children }: { children: React.ReactNode }) {
  const setIsOnline = useOfflineStore((s) => s.setIsOnline)
  const syncAll = useOfflineStore((s) => s.syncAll)
  const isOnline = useOfflineStore((s) => s.isOnline)
  const pendingCount = useOfflineStore((s) => s.pendingCount)
  const hasAnyDirty = useAppStore((s) => s.hasAnyDirty)
  const [initialized, setInitialized] = useState(false)

  // ===== Inicializar IndexedDB para Capa 3 =====
  useEffect(() => {
    initOfflineDB()
      .then(() => {
        log.info('[Resilience] IndexedDB inicializada')
        setInitialized(true)
      })
      .catch((err) => {
        console.error('[Resilience] Error inicializando IndexedDB:', err)
        setInitialized(true) // No bloquear la app
      })
  }, [])

  // ===== Listeners online/offline =====
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Conexión recuperada', {
        description: 'Sincronizando datos pendientes...',
        duration: 3000,
      })
      // Auto-sync al reconectar
      setTimeout(() => {
        syncAll().then((result) => {
          if (result.success > 0) {
            toast.success(`${result.success} registros sincronizados`)
          }
        })
      }, 500)
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('Sin conexión', {
        description: 'Los datos se guardarán localmente y se sincronizarán después',
        duration: 5000,
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set estado inicial
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setIsOnline, syncAll])

  // ===== beforeunload - Protección contra cierre accidental =====
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasAnyDirty()) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasAnyDirty])

  // ===== Sync periódico cada 60s cuando hay pendientes =====
  useEffect(() => {
    if (!initialized) return

    const syncInterval = setInterval(() => {
      if (navigator.onLine && pendingCount() > 0) {
        syncAll()
      }
    }, 60000)

    return () => clearInterval(syncInterval)
  }, [initialized, syncAll, pendingCount])

  return (
    <>
      {/* Banner de modo offline - siempre visible arriba cuando no hay conexión */}
      <OfflineBanner />
      {children}
    </>
  )
}

/**
 * Hook para que los módulos registren datos sucios en el sistema global.
 * Cada módulo debe usar esto para que el beforeunload funcione correctamente.
 *
 * Uso en cada módulo:
 *   const { markDirty, markClean, isDirty } = useModuleResilience('pesajeCamiones')
 *   // Al modificar un campo: markDirty()
 *   // Al guardar exitosamente: markClean()
 */
export function useModuleResilience(moduleId: string) {
  const markDirty = useAppStore((s) => s.markDirty)
  const markClean = useAppStore((s) => s.markClean)
  const isModuleDirty = useAppStore((s) => s.isDirty)
  const isOnline = useOfflineStore((s) => s.isOnline)
  const addToQueue = useOfflineStore((s) => s.addToQueue)

  /**
   * Guardado resiliente: si hay conexión usa fetch normal, si no hay encola.
   * Retorna { success, offline?, queueId? }
   */
  const resilientSave = useCallback(
    async (
      endpoint: string,
      method: 'POST' | 'PUT' | 'DELETE',
      data: Record<string, unknown>
    ): Promise<{ success: boolean; data?: any; error?: string; offline?: boolean; queueId?: string }> => {
      // Marcar como sucio antes de intentar guardar
      markDirty(moduleId)

      if (!navigator.onLine) {
        // OFFLINE: Encolar operación
        const queueId = addToQueue({
          module: moduleId,
          action: method === 'POST' ? 'CREATE' : method === 'PUT' ? 'UPDATE' : 'DELETE',
          endpoint,
          method,
          data,
        })

        toast.info('Guardado localmente', {
          description: `Se sincronizará cuando vuelva la conexión`,
          duration: 2000,
        })

        return { success: true, offline: true, queueId }
      }

      // ONLINE: Intentar fetch
      try {
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (response.ok && result.success !== false) {
          markClean(moduleId)
          return { success: true, data: result.data || result }
        } else {
          const error = result.error || `Error ${response.status}`
          return { success: false, error }
        }
      } catch (error: any) {
        // Conexión perdida durante el fetch: encolar
        const queueId = addToQueue({
          module: moduleId,
          action: method === 'POST' ? 'CREATE' : method === 'PUT' ? 'UPDATE' : 'DELETE',
          endpoint,
          method,
          data,
        })

        return { success: true, offline: true, queueId }
      }
    },
    [moduleId, markDirty, markClean, addToQueue]
  )

  /**
   * Guardado de borrador (Capa 2): siempre exitoso, marca como BORRADOR en DB
   */
  const saveDraft = useCallback(
    async (data: Record<string, unknown>): Promise<{ success: boolean; id?: string }> => {
      try {
        const response = await fetch(`/api/borrador/${moduleId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const result = await response.json()
        if (result.success) {
          return { success: true, id: result.data?.id }
        }
        return { success: false }
      } catch {
        // Si falla, el auto-save de localStorage (Capa 1) ya protege los datos
        return { success: false }
      }
    },
    [moduleId]
  )

  return {
    markDirty: () => markDirty(moduleId),
    markClean: () => markClean(moduleId),
    isDirty: isModuleDirty(moduleId),
    isOnline,
    resilientSave,
    saveDraft,
  }
}
