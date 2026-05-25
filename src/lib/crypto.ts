// Utilidades de cifrado para datos sensibles (contraseñas, tokens, etc.)
// Usa AES-256-GCM con la clave derivada de ENCRYPTION_KEY en variables de entorno

import crypto from 'crypto'
import { createLogger } from '@/lib/logger'
const log = createLogger('lib.crypto')

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

/**
 * Deriva una clave de 32 bytes desde un string usando SHA-256
 */
function deriveKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret).digest()
}

/**
 * Obtiene la clave de encriptación desde variable de entorno
 * Si no existe, genera una clave temporal (solo para desarrollo)
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    // En desarrollo, usar una clave por defecto (WARNING en consola)
    if (process.env.NODE_ENV === 'development') {
      log.warn('[CRYPTO] ENCRYPTION_KEY no configurada. Usando clave de desarrollo. NO usar en producción.')
      return 'dev-key-frigorifico-2024-change-me'
    }
    throw new Error('ENCRYPTION_KEY no configurada en variables de entorno')
  }
  return key
}

/**
 * Encripta un texto plano usando AES-256-GCM
 * Retorna string en formato: iv:authTag:encrypted (todos hex)
 */
export function encrypt(plaintext: string | null | undefined): string | null {
  if (!plaintext) return null

  const key = deriveKey(getEncryptionKey())
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()

  // Formato: iv:authTag:encrypted (hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Desencripta un texto cifrado con AES-256-GCM
 * Espera formato: iv:authTag:encrypted (todos hex)
 */
export function decrypt(ciphertext: string | null | undefined): string | null {
  if (!ciphertext) return null

  // Si no tiene el formato de cipher (no contiene ':'), devolver como está (dato no encriptado legacy)
  if (!ciphertext.includes(':')) {
    log.warn('[CRYPTO] Dato no está encriptado. Se devuelve tal cual. Considere encriptarlo.')
    return ciphertext
  }

  const key = deriveKey(getEncryptionKey())

  const parts = ciphertext.split(':')
  if (parts.length !== 3) {
    throw new Error('Formato de texto cifrado inválido')
  }

  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
