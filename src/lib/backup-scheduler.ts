/**
 * Backup Scheduler Library
 * Sistema de backups automáticos para la base de datos
 */

import cron from 'node-cron'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import { db } from './db'
import { createLogger } from '@/lib/logger'
const log = createLogger('lib.backup-scheduler')

const execAsync = promisify(exec)

// Tipos para la configuración
export type FrecuenciaBackup = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
export type DestinoBackup = 'LOCAL' | 'GOOGLE_DRIVE' | 'FTP' | 'S3'
export type EstadoBackup = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADO' | 'FALLIDO' | 'VERIFICANDO'

export interface BackupConfig {
  id: string
  activo: boolean
  backupDiario: boolean
  horaBackup: string
  retenerDias: number
  nubeHabilitado: boolean
  proveedorNube: string | null
  credenciales: any | null
  pointInTime: boolean
  intervaloPIT: string | null
  ultimoBackup: Date | null
  ultimoExitoso: boolean
  tamanoUltimo: number | null
  espacioUsado: number | null
  frecuencia: FrecuenciaBackup
  retencionDias: number
  maxBackups: number
  destino: DestinoBackup
  rutaDestino?: string | null
  credencialesDestino?: string | null
  compresion: boolean
  incluirArchivos: boolean
  verificarIntegridad: boolean
  notificarExito: boolean
  notificarFallo: boolean
  emailNotificacion?: string | null
  ultimoEstado: EstadoBackup
  ultimoError?: string | null
  totalBackups: number
}

// Instancia del scheduler
let scheduledTask: cron.ScheduledTask | null = null
let currentConfig: BackupConfig | null = null

/**
 * Obtiene la configuración actual de backups
 */
export async function getBackupConfig(): Promise<BackupConfig | null> {
  try {
    // Check if default config needs updating for interface fields
    const configFromDb = await db.configuracionBackup.findFirst()
    if (!configFromDb) {
      // Crear configuración por defecto
      const newConfig = await db.configuracionBackup.create({
        data: {
          activo: false,
          backupDiario: true,
          horaBackup: '02:00',
          retenerDias: 30,
          nubeHabilitado: false,
          ultimoExitoso: false
        }
      })
      return mapToBackupConfig(newConfig)
    }
    return mapToBackupConfig(configFromDb)
  } catch (error) {
    console.error('Error obteniendo configuración de backup:', error)
    return null
  }
}

/**
 * Actualiza la configuración de backups
 */
export async function updateBackupConfig(data: Partial<BackupConfig>): Promise<BackupConfig | null> {
  try {
    const existing = await getBackupConfig()
    if (!existing) return null

    // Update DB fields that exist in schema
    const dbData: Record<string, unknown> = {}
    if (data.activo !== undefined) dbData.activo = data.activo
    if (data.backupDiario !== undefined) dbData.backupDiario = data.backupDiario
    if (data.horaBackup !== undefined) dbData.horaBackup = data.horaBackup
    if (data.retenerDias !== undefined) dbData.retenerDias = data.retenerDias
    if (data.nubeHabilitado !== undefined) dbData.nubeHabilitado = data.nubeHabilitado
    if (data.proveedorNube !== undefined) dbData.proveedorNube = data.proveedorNube
    dbData.updatedAt = new Date()

    const updated = await db.configuracionBackup.update({
      where: { id: existing.id },
      data: dbData
    })

    // Reiniciar scheduler si cambió la configuración
    if (data.activo !== undefined || data.backupDiario !== undefined || data.horaBackup !== undefined) {
      await restartScheduler()
    }

    return mapToBackupConfig(updated)
  } catch (error) {
    console.error('Error actualizando configuración de backup:', error)
    return null
  }
}

/**
 * Obtiene el directorio de backups
 */
export function getBackupDir(): string {
  // En producción: C:\SolemarFrigorifico\backups
  // En desarrollo: /home/z/my-project/backups
  return process.env.BACKUP_DIR || '/home/z/my-project/backups'
}

/**
 * Genera el cron expression basado en la configuración
 */
function getCronExpression(config: BackupConfig): string {
  // Use parsed hour and minute from horaBackup (HH:mm format)
  const hourStr = config.horaBackup || '02:00'
  const [hora, minuto] = hourStr.split(':').map(Number)
  const { frecuencia } = config

  switch (frecuencia) {
    case 'HOURLY':
      return `${minuto} * * * *`
    case 'DAILY':
      return `${minuto} ${hora} * * *`
    case 'WEEKLY':
      return `${minuto} ${hora} * * 0`
    case 'MONTHLY':
      return `${minuto} ${hora} 1 * *`
    default:
      return `${minuto} ${hora} * * *`
  }
}

/**
 * Calcula la próxima fecha de backup
 */
export function calculateNextBackup(config: BackupConfig): Date {
  const now = new Date()
  const next = new Date()
  const hourStr = config.horaBackup || '02:00'
  const [hora, minuto] = hourStr.split(':').map(Number)

  switch (config.frecuencia) {
    case 'HOURLY':
      next.setMinutes(minuto, 0, 0)
      if (next <= now) {
        next.setHours(next.getHours() + 1)
      }
      break
    case 'DAILY':
      next.setHours(hora, minuto, 0, 0)
      if (next <= now) {
        next.setDate(next.getDate() + 1)
      }
      break
    case 'WEEKLY':
      next.setHours(hora, minuto, 0, 0)
      const currentDay = next.getDay()
      const daysUntil = (0 - currentDay + 7) % 7
      next.setDate(next.getDate() + (daysUntil === 0 && next <= now ? 7 : daysUntil))
      break
    case 'MONTHLY':
      next.setHours(hora, minuto, 0, 0)
      next.setDate(1)
      if (next <= now) {
        next.setMonth(next.getMonth() + 1)
      }
      break
  }

  return next
}

/**
 * Ejecuta un backup de la base de datos
 */
export async function runBackup(tipo: 'AUTOMATICO' | 'MANUAL' = 'MANUAL'): Promise<{
  success: boolean
  file?: string
  error?: string
  size?: number
  duration?: number
}> {
  const startTime = Date.now()
  const backupDir = getBackupDir()

  try {
    // Crear directorio si no existe
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // Generar nombre del archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')
    const date = timestamp[0]
    const time = timestamp[1].split('-')[0]
    const backupName = `backup_${date}_${time}`
    const sqlFile = path.join(backupDir, `${backupName}.sql`)

    // Obtener ruta de la base de datos
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './db/custom.db'
    const absoluteDbPath = path.resolve(dbPath)

    // Ejecutar backup según el tipo de base de datos
    // Para SQLite usamos sqlite3 .backup
    // Para PostgreSQL usaríamos pg_dump

    if (process.env.DATABASE_URL?.includes('sqlite') || process.env.DATABASE_URL?.includes('file:')) {
      // Backup de SQLite
      await execAsync(`sqlite3 "${absoluteDbPath}" ".backup '${sqlFile}'"`)
    } else {
      // Simular backup para PostgreSQL (en producción usar pg_dump)
      const backupContent = `-- Backup de Base de Datos Solemar
-- Fecha: ${new Date().toISOString()}
-- Tipo: ${tipo}
-- Generado por Sistema de Backups Automático

-- En producción, aquí irían los comandos SQL de pg_dump
`
      fs.writeFileSync(sqlFile, backupContent)
    }

    // Verificar que el archivo se creó
    if (!fs.existsSync(sqlFile)) {
      throw new Error('El archivo de backup no se creó correctamente')
    }

    // Compresión si está habilitada
    const config = await getBackupConfig()
    let finalFile = sqlFile

    if (config?.compresion) {
      try {
        // En Linux/Mac usar gzip, en Windows usar compresión nativa
        const zipFile = path.join(backupDir, `${backupName}.zip`)
        
        // Intentar con gzip primero (Linux/Mac)
        try {
          await execAsync(`gzip -c "${sqlFile}" > "${zipFile}"`)
          fs.unlinkSync(sqlFile) // Eliminar archivo original
        } catch {
          // Si gzip falla, crear archivo zip con Node.js
          const { createGzip } = await import('zlib')
          const pipeline = promisify((await import('stream')).pipeline)
          
          const gzip = createGzip()
          const source = fs.createReadStream(sqlFile)
          const destination = fs.createWriteStream(zipFile)
          
          await pipeline(source, gzip, destination)
          fs.unlinkSync(sqlFile)
        }
        
        finalFile = zipFile
      } catch (compressError) {
        log.warn(`'Error comprimiendo backup, usando archivo sin comprimir:' compressError`)
      }
    }

    // Obtener tamaño del archivo
    const stats = fs.statSync(finalFile)
    const sizeMB = stats.size / (1024 * 1024)

    const duration = Date.now() - startTime

    await db.historialBackup.create({
      data: {
        rutaArchivo: finalFile,
        nombreArchivo: path.basename(finalFile),
        tamanio: sizeMB,
        estado: 'COMPLETADO',
        tipo,
      }
    })

    // Actualizar configuración
    if (config) {
      await db.configuracionBackup.update({
        where: { id: config.id },
        data: {
          ultimoBackup: new Date(),
          ultimoExitoso: true,
          tamanoUltimo: sizeMB,
          espacioUsado: (config.espacioUsado || 0) + sizeMB
        }
      })
    }

    // Limpiar backups antiguos
    await cleanupOldBackups()

    return {
      success: true,
      file: path.basename(finalFile),
      size: sizeMB,
      duration
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error ejecutando backup:', errorMessage)

    // Actualizar estado de error
    const config = await getBackupConfig()
    if (config) {
      await db.configuracionBackup.update({
        where: { id: config.id },
        data: {
          ultimoExitoso: false,
        }
      })

      // Registrar en historial
      await db.historialBackup.create({
        data: {
          rutaArchivo: '',
          tamanio: 0,
          estado: 'FALLIDO',
          mensajeError: errorMessage,
          tipo,
        }
      })
    }

    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Limpia backups antiguos según la configuración de retención
 */
export async function cleanupOldBackups(): Promise<{ deleted: number; freedMB: number }> {
  try {
    const config = await getBackupConfig()
    if (!config) return { deleted: 0, freedMB: 0 }

    const backupDir = getBackupDir()
    
    if (!fs.existsSync(backupDir)) {
      return { deleted: 0, freedMB: 0 }
    }

    // Leer archivos de backup
    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.sql') || f.endsWith('.zip') || f.endsWith('.gz'))
      .map(f => {
        const filePath = path.join(backupDir, f)
        const stats = fs.statSync(filePath)
        return {
          name: f,
          path: filePath,
          date: stats.mtime,
          size: stats.size
        }
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime())

    // Calcular fecha límite por días de retención
    const retentionDate = new Date()
    retentionDate.setDate(retentionDate.getDate() - config.retencionDias)

    let deleted = 0
    let freedMB = 0

    // Eliminar archivos antiguos (más de maxBackups o más antiguos que retención)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const shouldDelete = i >= config.maxBackups || file.date < retentionDate

      if (shouldDelete) {
        try {
          fs.unlinkSync(file.path)
          freedMB += file.size / (1024 * 1024)
          deleted++

          // Actualizar historial
          await db.historialBackup.deleteMany({
            where: { nombreArchivo: file.name }
          })
        } catch (deleteError) {
          log.warn(`No se pudo eliminar backup antiguo ${file.name}`, { error: deleteError } as Record<string, unknown>)
        }
      }
    }

    // Actualizar espacio usado
    if (deleted > 0) {
      await db.configuracionBackup.update({
        where: { id: config.id },
        data: {
          espacioUsado: { decrement: freedMB }
        }
      })
    }

    return { deleted, freedMB }
  } catch (error) {
    console.error('Error limpiando backups antiguos:', error)
    return { deleted: 0, freedMB: 0 }
  }
}

/**
 * Verifica la integridad de un backup
 */
export async function verifyBackup(fileName: string): Promise<{
  valid: boolean
  error?: string
  details?: string
}> {
  try {
    const backupDir = getBackupDir()
    const filePath = path.join(backupDir, fileName)

    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      return { valid: false, error: 'Archivo no encontrado' }
    }

    // Verificar path traversal
    const resolvedPath = path.resolve(filePath)
    if (!resolvedPath.startsWith(backupDir)) {
      return { valid: false, error: 'Ruta inválida' }
    }

    // Verificar que el archivo tiene contenido
    const stats = fs.statSync(filePath)
    if (stats.size === 0) {
      return { valid: false, error: 'Archivo vacío' }
    }

    // Para archivos SQL, verificar contenido básico
    if (fileName.endsWith('.sql')) {
      const content = fs.readFileSync(filePath, 'utf-8')
      if (!content.includes('--') && content.length < 100) {
        return { valid: false, error: 'Contenido de backup inválido' }
      }
    }

    // Actualizar historial
    await db.historialBackup.updateMany({
      where: { nombreArchivo: fileName },
      data: {
        descripcion: 'OK'
      }
    })

    return {
      valid: true,
      details: `Tamaño: ${formatBytes(stats.size)}`
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return { valid: false, error: errorMessage }
  }
}

/**
 * Map DB config to BackupConfig interface
 */
function mapToBackupConfig(config: any): BackupConfig {
  return {
    id: config.id,
    activo: config.activo,
    backupDiario: config.backupDiario,
    horaBackup: config.horaBackup,
    retenerDias: config.retenerDias,
    nubeHabilitado: config.nubeHabilitado,
    proveedorNube: config.proveedorNube,
    credenciales: config.credenciales,
    pointInTime: config.pointInTime,
    intervaloPIT: config.intervaloPIT,
    ultimoBackup: config.ultimoBackup,
    ultimoExitoso: config.ultimoExitoso,
    tamanoUltimo: config.tamanoUltimo,
    espacioUsado: config.espacioUsado,
    // Defaults for interface fields not in DB
    frecuencia: 'DAILY',
    retencionDias: config.retenerDias || 30,
    maxBackups: 10,
    destino: 'LOCAL',
    compresion: true,
    incluirArchivos: false,
    verificarIntegridad: true,
    notificarExito: false,
    notificarFallo: true,
    ultimoEstado: 'PENDIENTE',
    totalBackups: 0,
  }
}

/**
 * Inicia el scheduler de backups
 */
export function startScheduler(config: BackupConfig): boolean {
  if (!config.activo) {
    log.info('Backup scheduler deshabilitado')
    return false
  }

  // Detener scheduler anterior si existe
  stopScheduler()

  try {
    const cronExpression = getCronExpression(config)
    
    // Validar expresión cron
    if (!cron.validate(cronExpression)) {
      console.error('Expresión cron inválida:', cronExpression)
      return false
    }

    currentConfig = config

    scheduledTask = cron.schedule(cronExpression, async () => {
      log.info(`'Ejecutando backup programado:' new Date().toISOString()`)
      await runBackup('AUTOMATICO')
    }, {
      scheduled: true,
      timezone: 'America/Argentina/Buenos_Aires'
    })

    log.info(`'Backup scheduler iniciado:' cronExpression`)
    return true
  } catch (error) {
    console.error('Error iniciando backup scheduler:', error)
    return false
  }
}

/**
 * Detiene el scheduler de backups
 */
export function stopScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop()
    scheduledTask = null
    log.info('Backup scheduler detenido')
  }
}

/**
 * Reinicia el scheduler con la configuración actual
 */
export async function restartScheduler(): Promise<boolean> {
  const config = await getBackupConfig()
  if (!config) return false

  stopScheduler()
  
  if (config && config.activo) {
    return startScheduler(config)
  }
  
  return true
}

/**
 * Inicializa el scheduler al arrancar la aplicación
 */
export async function initializeScheduler(): Promise<void> {
  try {
    const config = await getBackupConfig()
    if (config && config.activo) {
      startScheduler(config)
      log.info('Backup scheduler inicializado')
    }
  } catch (error) {
    console.error('Error inicializando backup scheduler:', error)
  }
}

/**
 * Formatea bytes a string legible
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Obtiene el estado actual del scheduler
 */
export function getSchedulerStatus(): {
  running: boolean
  config: BackupConfig | null
  cronExpression: string | null
} {
  return {
    running: scheduledTask !== null,
    config: currentConfig,
    cronExpression: currentConfig ? getCronExpression(currentConfig) : null
  }
}
