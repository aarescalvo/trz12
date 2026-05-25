import { createLogger } from '@/lib/logger'
const log = createLogger('lib.offline-romaneo-db')

// IndexedDB wrapper para almacenamiento offline
// Usado por el módulo de Romaneo cuando no hay conexión

const DB_NAME = 'FrigorificoOffline'
const DB_VERSION = 1

// Stores (tablas)
const STORES = {
  ROMANEOS: 'romaneos',
  MEDIAS_RES: 'mediasRes',
  PENDIENTES: 'pendientesSync',
  CONFIG: 'configuracion'
}

let db: IDBDatabase | null = null

// Inicializar la base de datos
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('Error al abrir IndexedDB:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      db = request.result
      log.info('[OfflineDB] Base de datos inicializada')
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Store de Romaneos
      if (!database.objectStoreNames.contains(STORES.ROMANEOS)) {
        const romaneosStore = database.createObjectStore(STORES.ROMANEOS, { keyPath: 'id' })
        romaneosStore.createIndex('garron', 'garron', { unique: false })
        romaneosStore.createIndex('fecha', 'fecha', { unique: false })
        romaneosStore.createIndex('sincronizado', 'sincronizado', { unique: false })
      }

      // Store de Medias Reses
      if (!database.objectStoreNames.contains(STORES.MEDIAS_RES)) {
        const mediasStore = database.createObjectStore(STORES.MEDIAS_RES, { keyPath: 'id' })
        mediasStore.createIndex('romaneoId', 'romaneoId', { unique: false })
        mediasStore.createIndex('codigo', 'codigo', { unique: true })
      }

      // Store de elementos pendientes de sincronización
      if (!database.objectStoreNames.contains(STORES.PENDIENTES)) {
        const pendientesStore = database.createObjectStore(STORES.PENDIENTES, { keyPath: 'id', autoIncrement: true })
        pendientesStore.createIndex('tipo', 'tipo', { unique: false })
        pendientesStore.createIndex('timestamp', 'timestamp', { unique: false })
      }

      // Store de configuración
      if (!database.objectStoreNames.contains(STORES.CONFIG)) {
        database.createObjectStore(STORES.CONFIG, { keyPath: 'key' })
      }

      log.info('[OfflineDB] Stores creados')
    }
  })
}

// Guardar romaneo offline
export async function saveRomaneoOffline(romaneo: any): Promise<void> {
  const database = await initDB()
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.ROMANEOS, STORES.PENDIENTES], 'readwrite')
    
    const romaneoStore = transaction.objectStore(STORES.ROMANEOS)
    const pendientesStore = transaction.objectStore(STORES.PENDIENTES)

    // Guardar romaneo con flag de no sincronizado
    const romaneoData = {
      ...romaneo,
      sincronizado: false,
      timestampOffline: Date.now()
    }
    
    romaneoStore.put(romaneoData)

    // Agregar a pendientes
    pendientesStore.add({
      tipo: 'ROMANEO',
      entidadId: romaneo.id,
      accion: 'CREATE',
      datos: romaneoData,
      timestamp: Date.now()
    })

    transaction.oncomplete = () => {
      log.info(`'[OfflineDB] Romaneo guardado offline:' romaneo.id`)
      resolve()
    }

    transaction.onerror = () => {
      console.error('[OfflineDB] Error al guardar romaneo:', transaction.error)
      reject(transaction.error)
    }
  })
}

// Guardar media res offline
export async function saveMediaResOffline(mediaRes: any): Promise<void> {
  const database = await initDB()
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.MEDIAS_RES, 'readwrite')
    const store = transaction.objectStore(STORES.MEDIAS_RES)

    store.put({
      ...mediaRes,
      timestampOffline: Date.now()
    })

    transaction.oncomplete = () => {
      log.info(`'[OfflineDB] Media res guardada offline:' mediaRes.id`)
      resolve()
    }

    transaction.onerror = () => {
      reject(transaction.error)
    }
  })
}

// Obtener romaneos pendientes de sincronización
export async function getRomaneosPendientes(): Promise<any[]> {
  const database = await initDB()
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.ROMANEOS, 'readonly')
    const store = transaction.objectStore(STORES.ROMANEOS)
    const index = store.index('sincronizado')
    
    const request = index.getAll(IDBKeyRange.only(false))

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

// Obtener todos los romaneos offline (para trabajar sin conexión)
export async function getAllRomaneosOffline(): Promise<any[]> {
  const database = await initDB()
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.ROMANEOS, 'readonly')
    const store = transaction.objectStore(STORES.ROMANEOS)
    const request = store.getAll()

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

// Marcar romaneo como sincronizado
export async function markRomaneoSincronizado(romaneoId: string): Promise<void> {
  const database = await initDB()
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.ROMANEOS, 'readwrite')
    const store = transaction.objectStore(STORES.ROMANEOS)
    const request = store.get(romaneoId)

    request.onsuccess = () => {
      const romaneo = request.result
      if (romaneo) {
        romaneo.sincronizado = true
        romaneo.fechaSincronizacion = new Date().toISOString()
        store.put(romaneo)
      }
    }

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

// Obtener elementos pendientes de sincronización
export async function getPendientesSync(): Promise<any[]> {
  const database = await initDB()
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.PENDIENTES, 'readonly')
    const store = transaction.objectStore(STORES.PENDIENTES)
    const request = store.getAll()

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

// Limpiar pendientes después de sincronizar
export async function clearPendientesSync(): Promise<void> {
  const database = await initDB()
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.PENDIENTES, 'readwrite')
    const store = transaction.objectStore(STORES.PENDIENTES)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Guardar configuración offline
export async function saveConfigOffline(key: string, value: any): Promise<void> {
  const database = await initDB()
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.CONFIG, 'readwrite')
    const store = transaction.objectStore(STORES.CONFIG)
    store.put({ key, value, timestamp: Date.now() })

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

// Obtener configuración offline
export async function getConfigOffline(key: string): Promise<any> {
  const database = await initDB()
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.CONFIG, 'readonly')
    const store = transaction.objectStore(STORES.CONFIG)
    const request = store.get(key)

    request.onsuccess = () => {
      resolve(request.result?.value || null)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

// Verificar si hay datos offline pendientes
export async function hasPendingData(): Promise<boolean> {
  const pendientes = await getPendientesSync()
  return pendientes.length > 0
}

// Obtener estadísticas de datos offline
export async function getOfflineStats(): Promise<{
  romaneosPendientes: number
  mediasResGuardadas: number
  pendientesSync: number
}> {
  const database = await initDB()
  
  const getCount = (storeName: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  const [romaneosPendientes, mediasResGuardadas, pendientesSync] = await Promise.all([
    new Promise<number>((resolve) => {
      const transaction = database.transaction(STORES.ROMANEOS, 'readonly')
      const store = transaction.objectStore(STORES.ROMANEOS)
      const index = store.index('sincronizado')
      const request = index.count(IDBKeyRange.only(false))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(0)
    }),
    getCount(STORES.MEDIAS_RES),
    getCount(STORES.PENDIENTES)
  ])

  return { romaneosPendientes, mediasResGuardadas, pendientesSync }
}

// Limpiar todos los datos offline (usar con cuidado)
export async function clearAllOfflineData(): Promise<void> {
  const database = await initDB()
  
  const storeNames = Object.values(STORES)
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeNames, 'readwrite')
    
    storeNames.forEach(storeName => {
      transaction.objectStore(storeName).clear()
    })

    transaction.oncomplete = () => {
      log.info('[OfflineDB] Todos los datos limpiados')
      resolve()
    }

    transaction.onerror = () => {
      reject(transaction.error)
    }
  })
}
