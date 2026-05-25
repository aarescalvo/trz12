// IndexedDB offline storage for frigorifico app

const DB_NAME = 'frigorifico_offline'
const DB_VERSION = 1

export const STORES = {
  PESAJES_CAMIONES: 'pesajes_camiones',
  ANIMALES: 'animales'
}

let db: IDBDatabase | null = null

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      
      // Create object stores
      if (!database.objectStoreNames.contains(STORES.PESAJES_CAMIONES)) {
        database.createObjectStore(STORES.PESAJES_CAMIONES, { keyPath: 'id', autoIncrement: true })
      }
      if (!database.objectStoreNames.contains(STORES.ANIMALES)) {
        database.createObjectStore(STORES.ANIMALES, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

export async function saveOffline(storeName: string, data: Record<string, unknown>): Promise<void> {
  const database = await getDB()
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    
    const dataWithMeta = {
      ...data,
      offlineId: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      synced: false,
      createdAt: new Date().toISOString()
    }
    
    const request = store.add(dataWithMeta)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getAllOffline(storeName: string): Promise<Record<string, unknown>[]> {
  const database = await getDB()
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()
    
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

export async function deleteOffline(storeName: string, id: string | number): Promise<void> {
  const database = await getDB()
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(id)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function clearOffline(storeName: string): Promise<void> {
  const database = await getDB()
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.clear()
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
