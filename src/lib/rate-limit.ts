/**
 * Rate Limiting para APIs
 * Protección contra ataques de fuerza bruta
 */

interface RateLimitEntry {
  count: number
  resetAt: number
  blocked: boolean
}

interface RateLimitConfig {
  windowMs: number      // Ventana de tiempo en ms
  maxRequests: number   // Máximo de requests permitidas
  blockDurationMs: number // Tiempo de bloqueo tras exceder
}

// Store en memoria (en producción usar Redis)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Limpiar entradas expiradas cada minuto (incluye entradas bloqueadas cuyo blockDuration pasó)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    // Clean up entries whose window has expired (normal) or whose block duration has passed (blocked)
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000)

// Configuraciones predefinidas
export const RATE_LIMIT_CONFIGS = {
  // Login con usuario/password: 10 intentos en 15 min, bloqueo 5 min
  AUTH_LOGIN: {
    windowMs: 15 * 60 * 1000,     // 15 minutos
    maxRequests: 10,
    blockDurationMs: 5 * 60 * 1000  // 5 minutos
  },
  // Login con PIN: 10 intentos en 15 min, bloqueo 5 min
  AUTH_PIN: {
    windowMs: 15 * 60 * 1000,      // 15 minutos
    maxRequests: 10,
    blockDurationMs: 5 * 60 * 1000  // 5 minutos
  },
  // Login supervisor: 10 intentos en 15 min, bloqueo 5 min
  AUTH_SUPERVISOR: {
    windowMs: 15 * 60 * 1000,     // 15 minutos
    maxRequests: 10,
    blockDurationMs: 5 * 60 * 1000  // 5 minutos
  },
  // API general: 200 requests por minuto
  API_GENERAL: {
    windowMs: 60 * 1000,
    maxRequests: 200,
    blockDurationMs: 60 * 1000
  },
  // Escritura API: 100 requests por minuto
  API_WRITE: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    blockDurationMs: 2 * 60 * 1000
  },
  // Creación de registros: 60 por minuto
  CREATE_RECORD: {
    windowMs: 60 * 1000,
    maxRequests: 60,
    blockDurationMs: 60 * 1000
  }
} as const

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter?: number // Segundos hasta desbloqueo
  blocked: boolean
}

/**
 * Verificar rate limit
 * @param key - Identificador único (ej: IP + endpoint)
 * @param type - Tipo de rate limit
 * @returns Resultado de la verificación
 */
export function checkRateLimit(
  key: string, 
  type: RateLimitType = 'API_GENERAL'
): RateLimitResult {
  const config = RATE_LIMIT_CONFIGS[type]
  return checkRateLimitWithConfig(key, config)
}

/**
 * Verificar rate limit con configuración personalizada
 */
export function checkRateLimitWithConfig(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // Si no hay entrada, crear una nueva
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
      blocked: false
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
      blocked: false
    }
  }

  // Si está bloqueado
  if (entry.blocked) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
      blocked: true
    }
  }

  // Incrementar contador
  entry.count++

  // Verificar si excedió el límite
  if (entry.count > config.maxRequests) {
    entry.blocked = true
    entry.resetAt = now + config.blockDurationMs
    rateLimitStore.set(key, entry)
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil(config.blockDurationMs / 1000),
      blocked: true
    }
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
    blocked: false
  }
}

/**
 * Resetear rate limit para una key (ej: después de login exitoso)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key)
}

/**
 * Obtener estadísticas de rate limiting
 */
export function getRateLimitStats(): {
  totalEntries: number
  blockedEntries: number
  activeEntries: number
} {
  const now = Date.now()
  let blocked = 0
  let active = 0

  for (const entry of rateLimitStore.values()) {
    if (entry.blocked) {
      blocked++
    } else if (entry.resetAt > now) {
      active++
    }
  }

  return {
    totalEntries: rateLimitStore.size,
    blockedEntries: blocked,
    activeEntries: active
  }
}

/**
 * Generar key única para rate limiting
 */
export function generateRateLimitKey(
  ip: string, 
  endpoint: string, 
  userId?: string
): string {
  return userId ? `${ip}:${endpoint}:${userId}` : `${ip}:${endpoint}`
}

/**
 * Middleware helper para Next.js API routes
 */
export function withRateLimit(
  type: RateLimitType,
  getKey: (request: Request) => string
) {
  return async function rateLimitMiddleware(request: Request) {
    const key = getKey(request)
    const result = checkRateLimit(key, type)

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.blocked 
            ? 'Demasiados intentos. Intente más tarde.' 
            : 'Rate limit excedido',
          retryAfter: result.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(result.retryAfter || 60),
            'X-RateLimit-Limit': String(RATE_LIMIT_CONFIGS[type].maxRequests),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000))
          }
        }
      )
    }

    return null // No hay error, continuar
  }
}
