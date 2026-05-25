import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// ==================== HASH DE CONTRASEÑAS ====================

const SALT_ROUNDS = 12

/**
 * Hashea una contraseña usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verifica una contraseña contra su hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ==================== GENERACIÓN DE TOKENS SEGUROS ====================

/**
 * Genera un token seguro aleatorio
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Genera un token de sesión
 */
export function generateSessionToken(): string {
  return generateToken(32)
}

/**
 * Genera un hash de un token (para almacenamiento seguro)
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// ==================== VALIDACIÓN DE FUERZA DE CONTRASEÑA ====================

export interface PasswordValidationResult {
  valid: boolean
  score: number  // 0-5
  feedback: string[]
  checks: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    numbers: boolean
    specialChars: boolean
    noCommonPatterns: boolean
  }
}

/**
 * Valida la fuerza de una contraseña
 */
export function validatePasswordStrength(
  password: string, 
  options: {
    minLength?: number
    requireUppercase?: boolean
    requireLowercase?: boolean
    requireNumbers?: boolean
    requireSpecialChars?: boolean
  } = {}
): PasswordValidationResult {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false
  } = options

  const feedback: string[] = []
  let score = 0

  // Check longitud
  const hasMinLength = password.length >= minLength
  if (!hasMinLength) {
    feedback.push(`Debe tener al menos ${minLength} caracteres`)
  } else {
    score++
  }

  // Check mayúsculas
  const hasUppercase = /[A-Z]/.test(password)
  if (requireUppercase && !hasUppercase) {
    feedback.push('Debe contener al menos una letra mayúscula')
  } else if (hasUppercase) {
    score++
  }

  // Check minúsculas
  const hasLowercase = /[a-z]/.test(password)
  if (requireLowercase && !hasLowercase) {
    feedback.push('Debe contener al menos una letra minúscula')
  } else if (hasLowercase) {
    score++
  }

  // Check números
  const hasNumbers = /[0-9]/.test(password)
  if (requireNumbers && !hasNumbers) {
    feedback.push('Debe contener al menos un número')
  } else if (hasNumbers) {
    score++
  }

  // Check caracteres especiales
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  if (requireSpecialChars && !hasSpecialChars) {
    feedback.push('Debe contener al menos un carácter especial')
  } else if (hasSpecialChars) {
    score++
  }

  // Check patrones comunes
  const commonPatterns = [
    'password', '123456', 'qwerty', 'admin', 'letmein',
    'welcome', 'monkey', 'dragon', 'master', 'login'
  ]
  const hasCommonPattern = commonPatterns.some(pattern => 
    password.toLowerCase().includes(pattern)
  )
  if (hasCommonPattern) {
    feedback.push('Contiene patrones comunes que son fáciles de adivinar')
    score = Math.max(0, score - 2)
  }

  // Bonus por longitud extra
  if (password.length >= 12) score++
  if (password.length >= 16) score++

  // Validar según requisitos
  const valid = hasMinLength && 
    (!requireUppercase || hasUppercase) &&
    (!requireLowercase || hasLowercase) &&
    (!requireNumbers || hasNumbers) &&
    (!requireSpecialChars || hasSpecialChars)

  return {
    valid,
    score: Math.min(5, score),
    feedback,
    checks: {
      length: hasMinLength,
      uppercase: hasUppercase,
      lowercase: hasLowercase,
      numbers: hasNumbers,
      specialChars: hasSpecialChars,
      noCommonPatterns: !hasCommonPattern
    }
  }
}

// ==================== SANITIZACIÓN DE INPUTS ====================

/**
 * Sanitiza un string para prevenir inyecciones
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    // Eliminar caracteres nulos
    .replace(/\0/g, '')
    // Normalizar espacios en blanco
    .replace(/\s+/g, ' ')
    // Trim
    .trim()
    // Escapar caracteres HTML básicos
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * Sanitiza un objeto recursivamente
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) {
    return obj.map(item => 
      typeof item === 'string' ? sanitizeInput(item) :
      typeof item === 'object' ? sanitizeObject(item) : item
    ) as unknown as T
  }

  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    // Validar que la clave no sea peligrosa
    const sanitizedKey = sanitizeInput(key)
    if (sanitizedKey !== key) continue // Saltar claves sospechosas

    if (typeof value === 'string') {
      result[key] = sanitizeInput(value)
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value)
    } else {
      result[key] = value
    }
  }
  return result as T
}

// ==================== UTILIDADES ADICIONALES ====================

/**
 * Extrae la IP del cliente de un request
 */
export function getClientIp(request: { headers: Headers }): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return 'unknown'
}

/**
 * Extrae el User-Agent del cliente
 */
export function getUserAgent(request: { headers: Headers }): string {
  return request.headers.get('user-agent') || 'unknown'
}

/**
 * Detecta si es un dispositivo móvil
 */
export function isMobileDevice(userAgent: string): boolean {
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
}

/**
 * Extrae información del dispositivo del User-Agent
 */
export function parseUserAgent(userAgent: string): {
  browser: string
  os: string
  device: string
} {
  const ua = userAgent.toLowerCase()
  
  // Detectar navegador
  let browser = 'Unknown'
  if (ua.includes('firefox')) browser = 'Firefox'
  else if (ua.includes('edg')) browser = 'Edge'
  else if (ua.includes('chrome')) browser = 'Chrome'
  else if (ua.includes('safari')) browser = 'Safari'
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera'

  // Detectar OS
  let os = 'Unknown'
  if (ua.includes('windows')) os = 'Windows'
  else if (ua.includes('mac')) os = 'macOS'
  else if (ua.includes('linux')) os = 'Linux'
  else if (ua.includes('android')) os = 'Android'
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS'

  // Detectar tipo de dispositivo
  let device = 'Desktop'
  if (isMobileDevice(userAgent)) {
    if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet'
    else device = 'Mobile'
  }

  return { browser, os, device }
}

/**
 * Verifica si el acceso está fuera del horario permitido
 */
export function isOutOfAllowedHours(
  allowedHourStart: number | null,
  allowedHourEnd: number | null
): boolean {
  if (allowedHourStart === null || allowedHourEnd === null) return false

  const currentHour = new Date().getHours()

  if (allowedHourStart <= allowedHourEnd) {
    // Rango normal (ej: 8-18)
    return currentHour < allowedHourStart || currentHour >= allowedHourEnd
  } else {
    // Rango que cruza medianoche (ej: 22-6)
    return currentHour < allowedHourStart && currentHour >= allowedHourEnd
  }
}

/**
 * Genera una descripción del cambio para auditoría
 */
export function generateChangeDescription(
  datosAntes: Record<string, any> | null,
  datosDespues: Record<string, any> | null
): string {
  if (!datosAntes && datosDespues) return 'Creación de registro'
  if (datosAntes && !datosDespues) return 'Eliminación de registro'
  if (!datosAntes && !datosDespues) return 'Sin cambios'

  const cambios: string[] = []
  // After null checks above, both are guaranteed to be non-null
  const antes = datosAntes as Record<string, any>
  const despues = datosDespues as Record<string, any>
  const todasLasClaves = new Set([
    ...Object.keys(antes),
    ...Object.keys(despues)
  ])

  for (const clave of todasLasClaves) {
    const valorAntes = antes[clave]
    const valorDespues = despues[clave]

    if (JSON.stringify(valorAntes) !== JSON.stringify(valorDespues)) {
      cambios.push(`${clave}: "${valorAntes}" → "${valorDespues}"`)
    }
  }

  if (cambios.length === 0) return 'Sin cambios'
  if (cambios.length <= 3) return cambios.join(', ')
  return `${cambios.slice(0, 3).join(', ')} y ${cambios.length - 3} más`
}
