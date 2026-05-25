/**
 * Sistema de Logs Estructurados para producción
 * Niveles: DEBUG, INFO, WARN, ERROR
 * Formato JSON para fácil parsing y análisis
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

interface LogEntry {
  timestamp: string
  level: LogLevel
  module: string
  message: string
  data?: Record<string, unknown>
  error?: string
  stack?: string
  duration?: number
  userId?: string
  ip?: string
  requestId?: string
}

// Configuración de niveles según entorno
const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
}

const currentLevel = process.env.NODE_ENV === 'production' 
  ? LOG_LEVELS.INFO 
  : LOG_LEVELS.DEBUG

// Formatear timestamp ISO
const timestamp = () => new Date().toISOString()

// Colores para consola (solo desarrollo)
const colors = {
  DEBUG: '\x1b[36m', // cyan
  INFO: '\x1b[32m',  // green
  WARN: '\x1b[33m',  // yellow
  ERROR: '\x1b[31m', // red
  RESET: '\x1b[0m'
}

class Logger {
  private module: string
  private requestId?: string

  constructor(module: string, requestId?: string) {
    this.module = module
    this.requestId = requestId
  }

  private formatMessage(entry: LogEntry): string {
    if (process.env.NODE_ENV === 'production') {
      // JSON en producción para logging centralizado
      return JSON.stringify(entry)
    } else {
      // Formato legible en desarrollo
      const color = colors[entry.level]
      const prefix = `${entry.timestamp} [${entry.level}] [${entry.module}]`
      let msg = `${color}${prefix}${colors.RESET} ${entry.message}`
      
      if (entry.data) {
        msg += `\n  Data: ${JSON.stringify(entry.data, null, 2)}`
      }
      if (entry.error) {
        msg += `\n  Error: ${entry.error}`
      }
      if (entry.duration !== undefined) {
        msg += ` (${entry.duration}ms)`
      }
      
      return msg
    }
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>, error?: Error) {
    if (LOG_LEVELS[level] < currentLevel) return

    const entry: LogEntry = {
      timestamp: timestamp(),
      level,
      module: this.module,
      message,
      data,
      requestId: this.requestId
    }

    if (error) {
      entry.error = error.message
      entry.stack = error.stack
    }

    const formatted = this.formatMessage(entry)
    
    if (level === 'ERROR') {
      console.error(formatted)
    } else if (level === 'WARN') {
      console.warn(formatted)
    } else {
      console.log(formatted)
    }
  }

  debug(message: string, data?: Record<string, unknown>) {
    this.log('DEBUG', message, data)
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log('INFO', message, data)
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log('WARN', message, data)
  }

  error(message: string, error?: Error | unknown, data?: Record<string, unknown>) {
    const err = error instanceof Error ? error : undefined
    this.log('ERROR', message, data, err)
  }

  // Medir tiempo de ejecución
  time(label: string): () => void {
    const start = Date.now()
    return () => {
      const duration = Date.now() - start
      this.debug(`${label} completado`, { duration })
    }
  }

  // Log con duración
  logWithDuration(level: LogLevel, message: string, duration: number, data?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: timestamp(),
      level,
      module: this.module,
      message,
      data,
      duration
    }
    this.log(level, message, { ...data, duration })
  }
}

// Factory function
export function createLogger(module: string, requestId?: string): Logger {
  return new Logger(module, requestId)
}

// Logger global para uso rápido
export const logger = {
  debug: (module: string, message: string, data?: Record<string, unknown>) => 
    createLogger(module).debug(message, data),
  info: (module: string, message: string, data?: Record<string, unknown>) => 
    createLogger(module).info(message, data),
  warn: (module: string, message: string, data?: Record<string, unknown>) => 
    createLogger(module).warn(message, data),
  error: (module: string, message: string, error?: Error | unknown, data?: Record<string, unknown>) => 
    createLogger(module).error(message, error, data),
  time: (module: string, label: string) => createLogger(module).time(label)
}

export type { LogEntry, LogLevel }
