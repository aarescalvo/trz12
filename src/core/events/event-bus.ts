type EventCallback = (data: unknown) => void | Promise<void>

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map()

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback)
    }
  }

  emit(event: string, data: unknown): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        // Use Promise.resolve to handle both sync and async callbacks
        Promise.resolve()
          .then(() => callback(data))
          .catch(error => {
            console.error(`Error in event listener for ${event}:`, error)
            // Error is caught per-listener, other listeners still execute
          })
      })
    }
  }

  // Async emit that waits for all listeners to complete
  // Useful when you need to know if all listeners succeeded
  async emitAsync(event: string, data: unknown): Promise<{ success: number; failed: number; errors: Error[] }> {
    const callbacks = this.listeners.get(event)
    const result = { success: 0, failed: 0, errors: [] as Error[] }
    
    if (callbacks) {
      const promises = Array.from(callbacks).map(async callback => {
        try {
          await callback(data)
          result.success++
        } catch (error) {
          result.failed++
          const err = error instanceof Error ? error : new Error(String(error))
          result.errors.push(err)
          console.error(`Error in async event listener for ${event}:`, err)
        }
      })
      
      await Promise.all(promises)
    }
    
    return result
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback)
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }
}

export const eventBus = new EventBus()

// Event types for the application
export const EventTypes = {
  // Tropa events
  TROPA_CREADA: 'tropa.creada',
  TROPA_ACTUALIZADA: 'tropa.actualizada',
  TROPA_ELIMINADA: 'tropa.eliminada',
  TROPA_ESTADO_CAMBIADO: 'tropa.estado_cambiado',
  
  // Animal events
  ANIMAL_CREADO: 'animal.creado',
  ANIMAL_ACTUALIZADO: 'animal.actualizado',
  ANIMAL_PESADO: 'animal.pesado',
  
  // Faena events
  LISTA_FAENA_CREADA: 'lista_faena.creada',
  LISTA_FAENA_CERRADA: 'lista_faena.cerrada',
  
  // Romaneo events
  ROMANEO_COMPLETADO: 'romaneo.completado',
  ROMANEO_CONFIRMADO: 'romaneo.confirmado',
  
  // Stock events
  STOCK_ACTUALIZADO: 'stock.actualizado',
  
  // Notification events
  NOTIFICACION_NUEVA: 'notificacion.nueva',
} as const

export type EventType = typeof EventTypes[keyof typeof EventTypes]
