// Hook para manejo de estado offline/online
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { createLogger } from '@/lib/logger'
const log = createLogger('lib.useOffline')

interface OfflineState {
  isOnline: boolean
  isSyncing: boolean
  lastSyncTime: Date | null
  pendingCount: number
}

interface UseOfflineReturn extends OfflineState {
  syncNow: () => Promise<void>
  checkConnection: () => boolean
}

export function useOffline(): UseOfflineReturn {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    lastSyncTime: null,
    pendingCount: 0
  })

  // Detectar cambios de conexión
  useEffect(() => {
    const handleOnline = () => {
      log.info('[Offline] Conexión recuperada')
      setState(prev => ({ ...prev, isOnline: true }))
      toast.success('Conexión recuperada', {
        description: 'Sincronizando datos pendientes...'
      })
      // Auto-sincronizar cuando vuelve la conexión
      syncPendingData()
    }

    const handleOffline = () => {
      log.info('[Offline] Sin conexión')
      setState(prev => ({ ...prev, isOnline: false }))
      toast.warning('Sin conexión', {
        description: 'Los datos se guardarán localmente'
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Verificar pendientes al cargar
    checkPendingCount()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Verificar cantidad de pendientes
  const checkPendingCount = async () => {
    try {
      const { getOfflineStats } = await import('./offline-romaneo-db')
      const stats = await getOfflineStats()
      setState(prev => ({ 
        ...prev, 
        pendingCount: stats.romaneosPendientes + stats.pendientesSync 
      }))
    } catch (error) {
      console.error('[Offline] Error al verificar pendientes:', error)
    }
  }

  // Sincronizar datos pendientes
  const syncPendingData = async () => {
    try {
      const { getRomaneosPendientes, markRomaneoSincronizado, clearPendientesSync } = await import('./offline-romaneo-db')
      
      setState(prev => ({ ...prev, isSyncing: true }))
      
      const pendientes = await getRomaneosPendientes()
      
      if (pendientes.length === 0) {
        setState(prev => ({ ...prev, isSyncing: false }))
        return
      }

      log.info(`[Offline] Sincronizando ${pendientes.length} romaneos pendientes`)

      // Enviar cada romaneo pendiente al servidor
      for (const romaneo of pendientes) {
        try {
          const response = await fetch('/api/romaneo/pesar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(romaneo)
          })

          if (response.ok) {
            await markRomaneoSincronizado(romaneo.id)
            log.info(`[Offline] Romaneo sincronizado: ${romaneo.id}`)
          } else {
            console.error('[Offline] Error al sincronizar romaneo:', romaneo.id)
          }
        } catch (error) {
          console.error('[Offline] Error de red al sincronizar:', error)
        }
      }

      await clearPendientesSync()
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date(),
        pendingCount: 0
      }))

      toast.success('Sincronización completada', {
        description: `${pendientes.length} registros sincronizados`
      })
    } catch (error) {
      console.error('[Offline] Error en sincronización:', error)
      setState(prev => ({ ...prev, isSyncing: false }))
      toast.error('Error en sincronización')
    }
  }

  // Sincronizar manualmente
  const syncNow = useCallback(async () => {
    if (!state.isOnline) {
      toast.error('No hay conexión a internet')
      return
    }
    
    await syncPendingData()
  }, [state.isOnline])

  // Verificar conexión
  const checkConnection = useCallback(() => {
    return navigator.onLine
  }, [])

  return {
    ...state,
    syncNow,
    checkConnection
  }
}

// Componente de indicador de estado offline
export function OfflineIndicator() {
  const { isOnline, isSyncing, pendingCount, syncNow } = useOffline()

  if (isOnline && pendingCount === 0) return null

  return (
    <div className={`fixed bottom-4 right-4 z-50 p-3 rounded-lg shadow-lg ${
      isOnline ? 'bg-amber-500' : 'bg-red-500'
    } text-white`}>
      <div className="flex items-center gap-2">
        {!isOnline && (
          <>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">Sin conexión</span>
          </>
        )}
        {isOnline && pendingCount > 0 && (
          <>
            {isSyncing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Sincronizando...</span>
              </>
            ) : (
              <>
                <span className="text-sm">{pendingCount} pendiente{pendingCount > 1 ? 's' : ''}</span>
                <button
                  onClick={syncNow}
                  className="px-2 py-1 bg-white/20 rounded text-xs hover:bg-white/30"
                >
                  Sincronizar
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
