'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { toast } from 'sonner'

// ============================================================
// HOOK: useBorrador - Capa 2: Auto-save de borradores en DB
// Se usa junto con el Zustand store de cada módulo (Capa 1)
//
// Flujo:
// 1. El operador escribe → Zustand persist salva a localStorage (Capa 1)
// 2. Cada 30s → useBorrador salva el estado actual como BORRADOR en DB (Capa 2)
// 3. Si el operador refresca → se recupera del localStorage (Capa 1)
// 4. Si el operador limpia localStorage → se recupera del BORRADOR en DB (Capa 2)
// ============================================================

interface UseBorradorOptions {
  /** Nombre del módulo (ej: 'pesajeCamiones', 'romaneo') */
  modulo: string
  /** ID del operador actual */
  operadorId?: string
  /** Función que retorna los datos actuales del store a guardar */
  getDatos: () => Record<string, unknown>
  /** Función para restaurar datos recuperados al store */
  setDatos: (datos: Record<string, unknown>) => void
  /** Función para verificar si el store tiene datos sucios */
  isDirty: () => boolean
  /** Intervalo de auto-save en ms (default: 30000 = 30s) */
  intervalMs?: number
  /** Si el auto-save está habilitado */
  enabled?: boolean
}

interface BorradorData {
  id: string
  modulo: string
  datos: Record<string, unknown>
  updatedAt: string
  createdAt: string
}

export function useBorrador({
  modulo,
  operadorId,
  getDatos,
  setDatos,
  isDirty,
  intervalMs = 30000,
  enabled = true,
}: UseBorradorOptions) {
  const [borradorActivo, setBorradorActivo] = useState<BorradorData | null>(null)
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isSavingRef = useRef(false)
  const sesionKeyRef = useRef(`${modulo}-${operadorId || 'anon'}`)

  // Actualizar sesionKey si cambia operadorId
  useEffect(() => {
    sesionKeyRef.current = `${modulo}-${operadorId || 'anon'}`
  }, [modulo, operadorId])

  // ===== Verificar si hay borrador al cargar =====
  useEffect(() => {
    if (!operadorId) return

    const checkBorrador = async () => {
      try {
        const res = await fetch(
          `/api/borrador/${modulo}?operadorId=${operadorId}&sesionKey=${sesionKeyRef.current}`
        )
        const data = await res.json()

        if (data.success && data.data) {
          setBorradorActivo(data.data)
          // Solo mostrar banner de recuperación si el store actual está "limpio"
          // (Capa 1 no tiene datos, pero Capa 2 sí)
          if (!isDirty() && data.data.datos && Object.keys(data.data.datos).length > 0) {
            setShowRecoveryBanner(true)
          }
        }
      } catch (error) {
        console.error(`[Borrador] Error al verificar borrador de ${modulo}:`, error)
      }
    }

    checkBorrador()
  }, [modulo, operadorId])  

  // ===== Auto-save periódico =====
  const saveDraft = useCallback(async () => {
    if (isSavingRef.current || !enabled) return

    const datos = getDatos()
    // No guardar si no hay datos significativos
    if (!datos || Object.keys(datos).length === 0) return

    isSavingRef.current = true
    try {
      const res = await fetch(`/api/borrador/${modulo}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operadorId,
          datos,
          sesionKey: sesionKeyRef.current,
        }),
      })

      const result = await res.json()
      if (result.success) {
        setLastSavedAt(new Date())
        setBorradorActivo((prev) =>
          prev
            ? { ...prev, updatedAt: new Date().toISOString() }
            : null
        )
      }
    } catch (error) {
      console.error(`[Borrador] Error auto-save ${modulo}:`, error)
      // Capa 1 (localStorage) sigue protegiendo los datos
    } finally {
      isSavingRef.current = false
    }
  }, [modulo, operadorId, getDatos, enabled])

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setInterval(saveDraft, intervalMs)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [enabled, intervalMs, saveDraft])

  // ===== Recuperar borrador =====
  const recoverDraft = useCallback(() => {
    if (borradorActivo?.datos) {
      setDatos(borradorActivo.datos)
      setShowRecoveryBanner(false)
      toast.success('Borrador recuperado', {
        description: `Datos de ${modulo} restaurados`,
      })
    }
  }, [borradorActivo, modulo, setDatos])

  // ===== Descartar borrador =====
  const discardDraft = useCallback(async () => {
    setShowRecoveryBanner(false)
    try {
      await fetch(`/api/borrador/${modulo}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operadorId,
          sesionKey: sesionKeyRef.current,
        }),
      })
      setBorradorActivo(null)
      toast.info('Borrador descartado')
    } catch (error) {
      console.error(`[Borrador] Error al descartar:`, error)
    }
  }, [modulo, operadorId])

  // ===== Guardar manualmente (antes de navegar o al confirmar) =====
  const saveNow = useCallback(async () => {
    const result = await saveDraft()
    if (result === undefined) {
      // saveDraft no retorna valor, pero no lanzó error = éxito
      toast.success(`Borrador de ${modulo} guardado`)
    }
  }, [saveDraft, modulo])

  // ===== Limpiar borrador después de guardar exitosamente =====
  const clearDraft = useCallback(async () => {
    try {
      await fetch(`/api/borrador/${modulo}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operadorId,
          sesionKey: sesionKeyRef.current,
        }),
      })
      setBorradorActivo(null)
      setShowRecoveryBanner(false)
    } catch (error) {
      console.error(`[Borrador] Error al limpiar:`, error)
    }
  }, [modulo, operadorId])

  return {
    borradorActivo,
    showRecoveryBanner,
    setShowRecoveryBanner,
    lastSavedAt,
    recoverDraft,
    discardDraft,
    saveNow,
    clearDraft,
    saveDraft,
  }
}
