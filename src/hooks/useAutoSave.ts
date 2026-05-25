'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { createLogger } from '@/lib/logger'
const log = createLogger('hooks.useAutoSave')

// ============================================================
// HOOK: useAutoSave - Capa 2
// Temporizador de autoguardado que salva un borrador cada N segundos
// Se usa en módulos críticos donde la pérdida de datos es severa
// ============================================================

interface UseAutoSaveOptions {
  /** Función que guarda el borrador (debe retornar true si tuvo éxito) */
  saveFn: () => Promise<boolean | { success: boolean; id?: string }>
  /** Intervalo en milisegundos (default: 30000 = 30 segundos) */
  intervalMs?: number
  /** Si el autoguardado está habilitado (default: true) */
  enabled?: boolean
  /** Nombre del módulo para los toasts */
  moduleName?: string
  /** Callback cuando se guarda exitosamente */
  onSave?: (result: boolean | { success: boolean; id?: string }) => void
}

export function useAutoSave({
  saveFn,
  intervalMs = 30000,
  enabled = true,
  moduleName = 'módulo',
  onSave,
}: UseAutoSaveOptions) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSaveRef = useRef<Date | null>(null)
  const [lastSave, setLastSave] = useState<Date | null>(null)
  const isSavingRef = useRef(false)

  const executeSave = useCallback(async () => {
    if (isSavingRef.current) return

    isSavingRef.current = true
    try {
      const result = await saveFn()
      lastSaveRef.current = new Date()
      setLastSave(lastSaveRef.current)

      const success =
        typeof result === 'boolean' ? result : result?.success

      if (success) {
        onSave?.(result)
        // Toast silencioso - solo mostrar si hay un indicador visual
        log.info(`[AutoSave] ${moduleName} - borrador guardado`)
      }
    } catch (error) {
      console.error(`[AutoSave] ${moduleName} - error:`, error)
    } finally {
      isSavingRef.current = false
    }
  }, [saveFn, moduleName, onSave])

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setInterval(executeSave, intervalMs)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [enabled, intervalMs, executeSave])

  // Guardar manualmente (útil para guardar antes de navegar)
  const saveNow = useCallback(async () => {
    const result = await executeSave()
    const success = typeof result === 'boolean' ? result : ((result as unknown) as { success?: boolean })?.success
    if (success) {
      toast.success(`Borrador de ${moduleName} guardado`)
    } else {
      toast.error(`Error al guardar borrador de ${moduleName}`)
    }
    return result
  }, [executeSave, moduleName])

  return {
    lastSave,
    saveNow,
  }
}
