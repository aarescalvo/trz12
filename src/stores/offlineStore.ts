'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================================
// OFFLINE STORE - Capa 3: Cola de operaciones offline
// Centraliza toda la lógica de sincronización y estado de red
// ============================================================

export interface QueueItem {
  id: string
  module: string       // ej: 'pesajeCamiones', 'romaneo', etc.
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  endpoint: string     // ej: '/api/pesaje-camion'
  method: 'POST' | 'PUT' | 'DELETE'
  data: Record<string, unknown>
  timestamp: number
  attempts: number
  lastError?: string
  synced: boolean
}

interface OfflineState {
  // Connection
  isOnline: boolean
  setIsOnline: (online: boolean) => void
  lastOnlineAt: string | null
  setLastOnlineAt: (date: string | null) => void
  lastSyncAt: string | null
  setLastSyncAt: (date: string | null) => void

  // Queue
  queue: QueueItem[]
  addToQueue: (item: Omit<QueueItem, 'id' | 'timestamp' | 'attempts' | 'synced' | 'lastError'>) => string
  removeFromQueue: (id: string) => void
  markSynced: (id: string) => void
  incrementAttempts: (id: string, error: string) => void
  clearSynced: () => void
  clearAllQueue: () => void

  // Computed helpers
  pendingCount: () => number
  pendingByModule: (module: string) => QueueItem[]

  // Sync
  isSyncing: boolean
  setIsSyncing: (syncing: boolean) => void
  syncAll: () => Promise<{ success: number; failed: number; errors: string[] }>
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      // Connection
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      setIsOnline: (online) => {
        set({ isOnline: online })
        if (online) {
          set({ lastOnlineAt: new Date().toISOString() })
          // Auto-sync when coming back online
          setTimeout(() => get().syncAll(), 500)
        }
      },
      lastOnlineAt: null,
      setLastOnlineAt: (date) => set({ lastOnlineAt: date }),
      lastSyncAt: null,
      setLastSyncAt: (date) => set({ lastSyncAt: date }),

      // Queue
      queue: [],
      addToQueue: (item) => {
        const id = `${item.module}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        const queueItem: QueueItem = {
          ...item,
          id,
          timestamp: Date.now(),
          attempts: 0,
          synced: false,
        }
        set((state) => ({ queue: [...state.queue, queueItem] }))
        return id
      },
      removeFromQueue: (id) =>
        set((state) => ({ queue: state.queue.filter((q) => q.id !== id) })),
      markSynced: (id) =>
        set((state) => ({
          queue: state.queue.map((q) =>
            q.id === id ? { ...q, synced: true } : q
          ),
        })),
      incrementAttempts: (id, error) =>
        set((state) => ({
          queue: state.queue.map((q) =>
            q.id === id
              ? { ...q, attempts: q.attempts + 1, lastError: error }
              : q
          ),
        })),
      clearSynced: () =>
        set((state) => ({ queue: state.queue.filter((q) => !q.synced) })),
      clearAllQueue: () => set({ queue: [] }),

      // Computed helpers
      pendingCount: () => get().queue.filter((q) => !q.synced).length,
      pendingByModule: (module) =>
        get().queue.filter((q) => q.module === module && !q.synced),

      // Sync
      isSyncing: false,
      setIsSyncing: (syncing) => set({ isSyncing: syncing }),
      syncAll: async () => {
        const state = get()
        if (state.isSyncing || !state.isOnline) {
          return { success: 0, failed: 0, errors: [] }
        }

        const pending = state.queue.filter((q) => !q.synced)
        if (pending.length === 0) {
          return { success: 0, failed: 0, errors: [] }
        }

        set({ isSyncing: true })
        let success = 0
        let failed = 0
        const errors: string[] = []

        for (const item of pending) {
          // Max 5 retries, then skip
          if (item.attempts >= 5) {
            failed++
            errors.push(`${item.id}: Max reintentos alcanzados`)
            continue
          }

          try {
            const response = await fetch(item.endpoint, {
              method: item.method,
              headers: { 'Content-Type': 'application/json' },
              body: item.method !== 'DELETE' ? JSON.stringify(item.data) : undefined,
            })

            if (response.ok) {
              get().markSynced(item.id)
              success++
            } else {
              const errorText = await response.text()
              get().incrementAttempts(item.id, `HTTP ${response.status}: ${errorText}`)
              failed++
              errors.push(`${item.id}: HTTP ${response.status}`)
            }
          } catch (error: any) {
            get().incrementAttempts(item.id, error.message)
            failed++
            errors.push(`${item.id}: ${error.message}`)
          }
        }

        if (success > 0) {
          set({ lastSyncAt: new Date().toISOString() })
          // Clean up synced items after a delay
          setTimeout(() => get().clearSynced(), 5000)
        }

        set({ isSyncing: false })
        return { success, failed, errors }
      },
    }),
    {
      name: 'solemar-offline-store',
      partialize: (state) => ({
        queue: state.queue.filter((q) => !q.synced),
        lastOnlineAt: state.lastOnlineAt,
        lastSyncAt: state.lastSyncAt,
        // NOT persisting isOnline, isSyncing - they're transient
      }),
    }
  )
)
