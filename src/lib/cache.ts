/**
 * Sistema de Cache en Memoria
 * Para consultas frecuentes y optimización de rendimiento
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
  createdAt: number
  hits: number
}

interface CacheStats {
  totalEntries: number
  hits: number
  misses: number
  hitRate: number
  size: number // bytes aproximados
}

// Store en memoria
const cacheStore = new Map<string, CacheEntry<unknown>>()

// Tamaño máximo del cache (LRU-like eviction al superar)
const MAX_CACHE_SIZE = 500

// Estadísticas
let stats = {
  hits: 0,
  misses: 0
}

// Configuraciones predefinidas de TTL
export const CACHE_TTL = {
  SHORT: 30 * 1000,      // 30 segundos - datos que cambian frecuentemente
  MEDIUM: 5 * 60 * 1000, // 5 minutos - datos semi-estáticos
  LONG: 30 * 60 * 1000,  // 30 minutos - datos estáticos
  HOUR: 60 * 60 * 1000,  // 1 hora - configuraciones
  DAY: 24 * 60 * 60 * 1000 // 1 día - datos muy estáticos
} as const

// Limpiar cache expirado cada minuto
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of cacheStore.entries()) {
    if (entry.expiresAt < now) {
      cacheStore.delete(key)
    }
  }
}, 60000)

/**
 * Obtener valor del cache
 */
export function cacheGet<T>(key: string): T | null {
  const entry = cacheStore.get(key) as CacheEntry<T> | undefined
  
  if (!entry) {
    stats.misses++
    return null
  }

  if (entry.expiresAt < Date.now()) {
    cacheStore.delete(key)
    stats.misses++
    return null
  }

  entry.hits++
  stats.hits++
  return entry.data
}

/**
 * Guardar valor en cache
 */
export function cacheSet<T>(key: string, data: T, ttlMs: number = CACHE_TTL.MEDIUM): void {
  // Evict oldest (first-inserted) entries when at capacity
  if (cacheStore.size >= MAX_CACHE_SIZE && !cacheStore.has(key)) {
    const oldestKey = cacheStore.keys().next().value
    if (oldestKey !== undefined) {
      cacheStore.delete(oldestKey)
    }
  }
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
    createdAt: Date.now(),
    hits: 0
  })
}

/**
 * Obtener o calcular valor (patrón cache-aside)
 */
export async function cacheOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = CACHE_TTL.MEDIUM
): Promise<T> {
  const cached = cacheGet<T>(key)
  if (cached !== null) {
    return cached
  }

  const data = await fetcher()
  cacheSet(key, data, ttlMs)
  return data
}

/**
 * Invalidar cache por patrón
 */
export function cacheInvalidate(pattern: string): number {
  let invalidated = 0
  for (const key of cacheStore.keys()) {
    if (key.startsWith(pattern)) {
      cacheStore.delete(key)
      invalidated++
    }
  }
  return invalidated
}

/**
 * Invalidar cache por key exacta
 */
export function cacheDelete(key: string): boolean {
  return cacheStore.delete(key)
}

/**
 * Limpiar todo el cache
 */
export function cacheClear(): void {
  cacheStore.clear()
  stats = { hits: 0, misses: 0 }
}

/**
 * Obtener estadísticas del cache
 */
export function getCacheStats(): CacheStats {
  let size = 0
  for (const entry of cacheStore.values()) {
    size += JSON.stringify(entry.data).length
  }

  const totalRequests = stats.hits + stats.misses
  
  return {
    totalEntries: cacheStore.size,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: totalRequests > 0 ? (stats.hits / totalRequests) * 100 : 0,
    size
  }
}

/**
 * Decorador para cachear resultados de funciones
 */
export function Cached<T extends (...args: unknown[]) => Promise<unknown>>(
  keyGenerator: (...args: Parameters<T>) => string,
  ttlMs: number = CACHE_TTL.MEDIUM
) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!
    
    descriptor.value = async function (this: unknown, ...args: Parameters<T>) {
      const key = keyGenerator(...args)
      const cached = cacheGet<ReturnType<T>>(key)
      
      if (cached !== null) {
        return cached
      }
      
      const result = await originalMethod.apply(this, args)
      cacheSet(key, result as ReturnType<T>, ttlMs)
      return result
    } as T
    
    return descriptor
  }
}

/**
 * Keys predefinidas para el sistema
 */
export const CACHE_KEYS = {
  // Dashboard
  DASHBOARD_STATS: 'dashboard:stats',
  DASHBOARD_TROPAS: 'dashboard:tropas',
  
  // Tropas
  TROPAS_LIST: 'tropas:list',
  TROPA_BY_ID: (id: string) => `tropa:${id}`,
  
  // Stock
  STOCK_CAMARAS: 'stock:camaras',
  STOCK_CORRALES: 'stock:corrales',
  
  // Configuraciones
  CONFIG_GENERAL: 'config:general',
  CONFIG_BALANZAS: 'config:balanzas',
  CONFIG_ROTULOS: 'config:rotulos',
  
  // Clientes
  CLIENTES_LIST: 'clientes:list',
  CLIENTE_BY_ID: (id: string) => `cliente:${id}`,
  
  // Productos
  PRODUCTOS_LIST: 'productos:list',
  PRODUCTOS_TIPOS: 'productos:tipos',
  
  // Operadores
  OPERADORES_LIST: 'operadores:list',
  OPERADOR_BY_ID: (id: string) => `operador:${id}`,
  
  // Corrales
  CORRALES_LIST: 'corrales:list',
  CORRAL_STOCK: (id: string) => `corral:${id}:stock`,
  
  // Cámaras
  CAMARAS_LIST: 'camaras:list',
  CAMARA_STOCK: (id: string) => `camara:${id}:stock`
} as const
