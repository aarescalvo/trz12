import { createLogger } from '@/lib/logger'
const log = createLogger('lib.offline.index')

/**
 * OFFLINE MANAGER - Sistema de funcionamiento offline
 * 
 * Este módulo permite que el sistema funcione sin conexión a internet,
 * guardando los datos localmente en IndexedDB y sincronizándolos
 * cuando vuelve la conexión.
 * 
 * MÓDULOS QUE FUNCIONAN OFFLINE:
 * - Pesaje Individual
 * - Ingreso a Faena (Cajón)
 * - Romaneo
 * - Menudencias
 * 
 * FLUJO:
 * 1. Verificar conexión
 * 2. Si hay conexión → usar API normal
 * 3. Si no hay conexión → usar IndexedDB local
 * 4. Cuando vuelve la conexión → sincronizar datos pendientes
 */

// Nombre de la base de datos IndexedDB
const DB_NAME = 'solemar-offline'
const DB_VERSION = 1

// Stores (tablas) para datos offline
export const OFFLINE_STORES = {
  PESAJES_PENDIENTES: 'pesajes_pendientes',
  ASIGNACIONES_GARRON: 'asignaciones_garron',
  ROMANEOS_PENDIENTES: 'romaneos_pendientes',
  MENUDENCIAS_PENDIENTES: 'menudencias_pendientes',
  TROPAS_CACHE: 'tropas_cache',
  ANIMALES_CACHE: 'animales_cache',
  SYNC_QUEUE: 'sync_queue',
} as const

// Interfaz para elementos en cola de sincronización
export interface SyncQueueItem {
  id: string
  store: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  data: any
  timestamp: number
  synced: boolean
  attempts: number
  error?: string
}

// Interfaz para estado de conexión
export interface ConnectionStatus {
  isOnline: boolean
  lastOnline: Date | null
  lastSync: Date | null
  pendingItems: number
}

// Variable para la base de datos
let db: IDBDatabase | null = null

/**
 * Inicializa la base de datos IndexedDB
 */
export async function initOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('Error abriendo IndexedDB:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      db = request.result
      log.info('IndexedDB inicializada correctamente')
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Store para pesajes pendientes
      if (!database.objectStoreNames.contains(OFFLINE_STORES.PESAJES_PENDIENTES)) {
        database.createObjectStore(OFFLINE_STORES.PESAJES_PENDIENTES, { keyPath: 'id' })
      }

      // Store para asignaciones de garrón
      if (!database.objectStoreNames.contains(OFFLINE_STORES.ASIGNACIONES_GARRON)) {
        database.createObjectStore(OFFLINE_STORES.ASIGNACIONES_GARRON, { keyPath: 'id' })
      }

      // Store para romaneos pendientes
      if (!database.objectStoreNames.contains(OFFLINE_STORES.ROMANEOS_PENDIENTES)) {
        database.createObjectStore(OFFLINE_STORES.ROMANEOS_PENDIENTES, { keyPath: 'id' })
      }

      // Store para menudencias pendientes
      if (!database.objectStoreNames.contains(OFFLINE_STORES.MENUDENCIAS_PENDIENTES)) {
        database.createObjectStore(OFFLINE_STORES.MENUDENCIAS_PENDIENTES, { keyPath: 'id' })
      }

      // Store para caché de tropas
      if (!database.objectStoreNames.contains(OFFLINE_STORES.TROPAS_CACHE)) {
        database.createObjectStore(OFFLINE_STORES.TROPAS_CACHE, { keyPath: 'id' })
      }

      // Store para caché de animales
      if (!database.objectStoreNames.contains(OFFLINE_STORES.ANIMALES_CACHE)) {
        database.createObjectStore(OFFLINE_STORES.ANIMALES_CACHE, { keyPath: 'id' })
      }

      // Store para cola de sincronización
      if (!database.objectStoreNames.contains(OFFLINE_STORES.SYNC_QUEUE)) {
        const syncStore = database.createObjectStore(OFFLINE_STORES.SYNC_QUEUE, { keyPath: 'id' })
        syncStore.createIndex('synced', 'synced', { unique: false })
        syncStore.createIndex('timestamp', 'timestamp', { unique: false })
      }

      log.info('Stores de IndexedDB creados')
    }
  })
}

/**
 * Verifica si hay conexión a internet
 */
export function isOnline(): boolean {
  return navigator.onLine
}

/**
 * Obtiene el estado actual de conexión
 */
export async function getConnectionStatus(): Promise<ConnectionStatus> {
  const pendingItems = await getPendingSyncCount()
  
  return {
    isOnline: navigator.onLine,
    lastOnline: localStorage.getItem('lastOnline') 
      ? new Date(localStorage.getItem('lastOnline')!) 
      : null,
    lastSync: localStorage.getItem('lastSync') 
      ? new Date(localStorage.getItem('lastSync')!) 
      : null,
    pendingItems
  }
}

/**
 * Guarda un elemento en un store
 */
export async function saveItem<T>(storeName: string, item: T): Promise<void> {
  const database = await initOfflineDB()
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(item)

    request.onsuccess = () => {
      log.info(`Item guardado en ${storeName}: ${item}`)
      resolve()
    }

    request.onerror = () => {
      console.error(`Error guardando en ${storeName}:`, request.error)
      reject(request.error)
    }
  })
}

/**
 * Obtiene todos los elementos de un store
 */
export async function getAllItems<T>(storeName: string): Promise<T[]> {
  const database = await initOfflineDB()
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()

    request.onsuccess = () => {
      resolve(request.result || [])
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

/**
 * Obtiene un elemento por ID
 */
export async function getItemById<T>(storeName: string, id: string): Promise<T | null> {
  const database = await initOfflineDB()
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.get(id)

    request.onsuccess = () => {
      resolve(request.result || null)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

/**
 * Elimina un elemento por ID
 */
export async function deleteItem(storeName: string, id: string): Promise<void> {
  const database = await initOfflineDB()
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(id)

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

/**
 * Agrega un item a la cola de sincronización
 */
export async function addToSyncQueue(
  store: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  data: any
): Promise<void> {
  const syncItem: SyncQueueItem = {
    id: `${store}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    store,
    action,
    data,
    timestamp: Date.now(),
    synced: false,
    attempts: 0
  }

  await saveItem(OFFLINE_STORES.SYNC_QUEUE, syncItem)
  log.info(`Item agregado a cola de sincronización: ${syncItem.id}`)
}

/**
 * Obtiene cantidad de items pendientes de sincronizar
 */
export async function getPendingSyncCount(): Promise<number> {
  const items = await getAllItems<SyncQueueItem>(OFFLINE_STORES.SYNC_QUEUE)
  return items.filter(item => !item.synced).length
}

/**
 * Procesa la cola de sincronización
 * Llamar cuando vuelve la conexión
 */
export async function processSyncQueue(): Promise<{
  success: number
  failed: number
  errors: string[]
}> {
  const items = await getAllItems<SyncQueueItem>(OFFLINE_STORES.SYNC_QUEUE)
  const pendingItems = items.filter(item => !item.synced)
  
  let success = 0
  let failed = 0
  const errors: string[] = []

  for (const item of pendingItems) {
    try {
      // Determinar endpoint según el store
      const endpoints: Record<string, string> = {
        [OFFLINE_STORES.PESAJES_PENDIENTES]: '/api/pesaje-individual',
        [OFFLINE_STORES.ASIGNACIONES_GARRON]: '/api/lista-faena/asignar',
        [OFFLINE_STORES.ROMANEOS_PENDIENTES]: '/api/romaneo',
        [OFFLINE_STORES.MENUDENCIAS_PENDIENTES]: '/api/menudencias',
      }

      const endpoint = endpoints[item.store]
      if (!endpoint) {
        throw new Error(`No hay endpoint para ${item.store}`)
      }

      // Hacer la petición
      const response = await fetch(endpoint, {
        method: item.action === 'DELETE' ? 'DELETE' : (item.action === 'CREATE' ? 'POST' : 'PUT'),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data)
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      // Marcar como sincronizado
      item.synced = true
      item.attempts++
      await saveItem(OFFLINE_STORES.SYNC_QUEUE, item)
      
      success++
      log.info(`Sincronizado: ${item.id}`)
    } catch (error: any) {
      failed++
      item.attempts++
      item.error = error.message
      await saveItem(OFFLINE_STORES.SYNC_QUEUE, item)
      errors.push(`${item.id}: ${error.message}`)
      console.error(`Error sincronizando ${item.id}:`, error)
    }
  }

  // Actualizar fecha de última sincronización
  if (success > 0) {
    localStorage.setItem('lastSync', new Date().toISOString())
  }

  return { success, failed, errors }
}

/**
 * Limpia items sincronizados de la cola
 */
export async function clearSyncedItems(): Promise<void> {
  const database = await initOfflineDB()
  const items = await getAllItems<SyncQueueItem>(OFFLINE_STORES.SYNC_QUEUE)
  
  const transaction = database.transaction([OFFLINE_STORES.SYNC_QUEUE], 'readwrite')
  const store = transaction.objectStore(OFFLINE_STORES.SYNC_QUEUE)
  
  for (const item of items) {
    if (item.synced) {
      store.delete(item.id)
    }
  }
}

/**
 * Guarda datos en caché para uso offline
 */
export async function cacheData(storeName: string, data: any[]): Promise<void> {
  const database = await initOfflineDB()
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    
    // Limpiar datos anteriores
    store.clear()
    
    // Guardar nuevos datos
    for (const item of data) {
      store.put(item)
    }
    
    transaction.oncomplete = () => {
      log.info(`Cache actualizado: ${storeName} (${data.length} items)`)
      resolve()
    }
    
    transaction.onerror = () => {
      reject(transaction.error)
    }
  })
}

// Exportar todo
export const OfflineManager = {
  init: initOfflineDB,
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
}

export default OfflineManager
