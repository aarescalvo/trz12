'use client'

import { useEffect, useCallback } from 'react'
import { useAppStore } from '@/stores/appStore'

// ============================================================
// HOOK: useUnsavedChanges - Capa 1
// Protege contra cierre accidental del navegador/pestaña
// Muestra diálogo de confirmación si hay módulos con datos sucios
// ============================================================

export function useUnsavedChanges() {
  const hasAnyDirty = useAppStore((s) => s.hasAnyDirty)

  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (hasAnyDirty()) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    },
    [hasAnyDirty]
  )

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [handleBeforeUnload])
}

/**
 * Hook para registrar un módulo como sucio/limpio
 * Uso en cada módulo:
 *   const { markDirty, markClean } = useModuleDirty('pesajeCamiones')
 *   // Cuando el usuario escribe algo: markDirty()
 *   // Cuando se guarda exitosamente: markClean()
 */
export function useModuleDirty(moduleId: string) {
  const markDirty = useAppStore((s) => s.markDirty)
  const markClean = useAppStore((s) => s.markClean)
  const isDirty = useAppStore((s) => s.isDirty)

  return {
    markDirty: () => markDirty(moduleId),
    markClean: () => markClean(moduleId),
    isDirty: isDirty(moduleId),
  }
}
