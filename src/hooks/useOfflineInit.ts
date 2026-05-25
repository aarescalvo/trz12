'use client'

import { useEffect } from 'react'
import { useOfflineStore } from '@/stores/offlineStore'

// ============================================================
// HOOK: useOfflineInit - Capa 3
// Inicializa los listeners de conexión y sincronización automática
// Se usa UNA vez en el layout o page principal
// ============================================================

export function useOfflineInit() {
  const setIsOnline = useOfflineStore((s) => s.setIsOnline)
  const syncAll = useOfflineStore((s) => s.syncAll)
  const isOnline = useOfflineStore((s) => s.isOnline)

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Periodic sync check (every 60 seconds when online)
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        const pending = useOfflineStore.getState().queue.filter((q) => !q.synced)
        if (pending.length > 0) {
          syncAll()
        }
      }
    }, 60000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(syncInterval)
    }
  }, [setIsOnline, syncAll])
}
