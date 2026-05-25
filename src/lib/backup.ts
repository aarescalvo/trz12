/**
 * Sistema de Backup Automático de Base de Datos
 * Soporta SQLite (archivo) y PostgreSQL (pg_dump/psql)
 */

import { spawn } from 'child_process'
import { createReadStream, createWriteStream } from 'fs'
import fs from 'fs/promises'
import path from 'path'
import { createLogger } from '@/lib/logger'
const log = createLogger('lib.backup')

// exec removed to prevent command injection — using spawn instead

// Configuración
const BACKUP_DIR = path.join(process.cwd(), 'backups')
const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db')
const MAX_BACKUPS = 30 // Mantener últimos 30 backups

type DatabaseType = 'sqlite' | 'postgresql'

interface BackupInfo {
  filename: string
  path: string
  size: number
  createdAt: Date
  type: 'auto' | 'manual'
}

/**
 * Detect the database type from DATABASE_URL environment variable
 */
export function getDatabaseType(): DatabaseType {
  const dbUrl = process.env.DATABASE_URL || ''
  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    return 'postgresql'
  }
  return 'sqlite'
}

/**
 * Crear directorio de backups si no existe
 */
async function ensureBackupDir(): Promise<void> {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true })
  } catch {
    // Directorio ya existe
  }
}

/**
 * Generar nombre de archivo de backup
 */
function generateBackupFilename(type: 'auto' | 'manual' = 'auto', dbType: DatabaseType = 'sqlite'): string {
  const now = new Date()
  const timestamp = now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19)
  const extension = dbType === 'postgresql' ? '.sql' : '.db'
  return `backup_${type}_${timestamp}${extension}`
}

/**
 * Crear backup SQLite (copia de archivo)
 */
async function createBackupSQLite(type: 'auto' | 'manual'): Promise<BackupInfo> {
  const filename = generateBackupFilename(type, 'sqlite')
  const backupPath = path.join(BACKUP_DIR, filename)

  // Verificar que la BD existe
  try {
    await fs.access(DB_PATH)
  } catch {
    throw new Error('Base de datos SQLite no encontrada')
  }

  // Copiar archivo de BD (SQLite es un solo archivo)
  await fs.copyFile(DB_PATH, backupPath)

  // Obtener tamaño
  const stats = await fs.stat(backupPath)

  return {
    filename,
    path: backupPath,
    size: stats.size,
    createdAt: new Date(),
    type
  }
}

/**
 * Crear backup PostgreSQL usando pg_dump (spawn to prevent command injection)
 */
async function createBackupPostgreSQL(type: 'auto' | 'manual'): Promise<BackupInfo> {
  const filename = generateBackupFilename(type, 'postgresql')
  const backupPath = path.join(BACKUP_DIR, filename)

  const dbUrl = process.env.DATABASE_URL || ''

  try {
    await new Promise<void>((resolve, reject) => {
      const args = ['--no-owner', '--no-acl', '--format=plain', dbUrl]
      const proc = spawn('pg_dump', args, { shell: false })
      const writeStream = createWriteStream(backupPath)
      proc.stdout.pipe(writeStream)
      proc.stderr.on('data', (data) => console.error('[pg_dump]', data.toString()))
      proc.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`pg_dump exited with code ${code}`))
      })
      proc.on('error', reject)
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Error ejecutando pg_dump: ${msg}`)
  }

  // Obtener tamaño
  const stats = await fs.stat(backupPath)

  return {
    filename,
    path: backupPath,
    size: stats.size,
    createdAt: new Date(),
    type
  }
}

/**
 * Crear backup de la base de datos (rutea al motor correcto)
 */
export async function createBackup(type: 'auto' | 'manual' = 'auto'): Promise<BackupInfo> {
  await ensureBackupDir()

  const dbType = getDatabaseType()
  log.info(`Creando backup [${type}] para database: ${dbType}`)

  let backup: BackupInfo
  if (dbType === 'postgresql') {
    backup = await createBackupPostgreSQL(type)
  } else {
    backup = await createBackupSQLite(type)
  }

  // Limpiar backups antiguos
  await cleanOldBackups()

  return backup
}

/**
 * Restaurar backup SQLite
 */
async function restoreBackupSQLite(backupFilename: string): Promise<void> {
  // Sanitize filename - only allow alphanumeric, dashes, underscores, dots
  const sanitizedFilename = backupFilename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const backupPath = path.join(BACKUP_DIR, sanitizedFilename)

  // Verificar que el backup existe
  try {
    await fs.access(backupPath)
  } catch {
    throw new Error('Backup no encontrado')
  }

  // Crear backup del estado actual antes de restaurar
  await createBackup('manual')

  // Restaurar copiando el archivo
  await fs.copyFile(backupPath, DB_PATH)
}

/**
 * Restaurar backup PostgreSQL usando psql (spawn to prevent command injection)
 */
async function restoreBackupPostgreSQL(backupFilename: string): Promise<void> {
  // Sanitize filename - only allow alphanumeric, dashes, underscores, dots
  const sanitizedFilename = backupFilename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const backupPath = path.join(BACKUP_DIR, sanitizedFilename)

  // Verificar que el backup existe
  try {
    await fs.access(backupPath)
  } catch {
    throw new Error('Backup no encontrado')
  }

  // Crear backup del estado actual antes de restaurar
  await createBackup('manual')

  const dbUrl = process.env.DATABASE_URL || ''

  try {
    await new Promise<void>((resolve, reject) => {
      const args = ['--single-transaction', '--on-error-stop', dbUrl]
      const proc = spawn('psql', args, { shell: false })
      const readStream = createReadStream(backupPath)
      readStream.pipe(proc.stdin)
      proc.stderr.on('data', (data) => console.error('[psql]', data.toString()))
      proc.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`psql exited with code ${code}`))
      })
      proc.on('error', reject)
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Error ejecutando psql restore: ${msg}`)
  }
}

/**
 * Restaurar backup (rutea al motor correcto)
 */
export async function restoreBackup(backupFilename: string): Promise<void> {
  const dbType = getDatabaseType()
  log.info(`Restaurando backup "${backupFilename}" para database: ${dbType}`)

  if (dbType === 'postgresql') {
    await restoreBackupPostgreSQL(backupFilename)
  } else {
    await restoreBackupSQLite(backupFilename)
  }
}

/**
 * Listar backups disponibles
 */
export async function listBackups(): Promise<BackupInfo[]> {
  await ensureBackupDir()

  const files = await fs.readdir(BACKUP_DIR)
  const backups: BackupInfo[] = []

  for (const filename of files) {
    if (!filename.endsWith('.db') && !filename.endsWith('.sql')) continue

    const filePath = path.join(BACKUP_DIR, filename)
    const stats = await fs.stat(filePath)

    const type = filename.includes('_auto_') ? 'auto' : 'manual'

    backups.push({
      filename,
      path: filePath,
      size: stats.size,
      createdAt: stats.birthtime,
      type
    })
  }

  // Ordenar por fecha descendente
  return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

/**
 * Eliminar backups antiguos (mantener solo los últimos MAX_BACKUPS)
 */
async function cleanOldBackups(): Promise<number> {
  const backups = await listBackups()

  // Separar automáticos y manuales
  const autoBackups = backups.filter(b => b.type === 'auto')
  const manualBackups = backups.filter(b => b.type === 'manual')

  let deleted = 0

  // Eliminar backups automáticos antiguos
  if (autoBackups.length > MAX_BACKUPS) {
    const toDelete = autoBackups.slice(MAX_BACKUPS)
    for (const backup of toDelete) {
      await fs.unlink(backup.path)
      deleted++
    }
  }

  // Mantener manuales por más tiempo (máximo 10)
  if (manualBackups.length > 10) {
    const toDelete = manualBackups.slice(10)
    for (const backup of toDelete) {
      await fs.unlink(backup.path)
      deleted++
    }
  }

  return deleted
}

/**
 * Eliminar un backup específico
 */
export async function deleteBackup(filename: string): Promise<boolean> {
  // Sanitize filename - only allow alphanumeric, dashes, underscores, dots
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const backupPath = path.join(BACKUP_DIR, sanitizedFilename)

  try {
    await fs.unlink(backupPath)
    return true
  } catch {
    return false
  }
}

/**
 * Obtener información del espacio usado por backups
 */
export async function getBackupStats(): Promise<{
  totalBackups: number
  autoBackups: number
  manualBackups: number
  totalSize: number
  oldestBackup?: Date
  newestBackup?: Date
}> {
  const backups = await listBackups()

  const autoBackups = backups.filter(b => b.type === 'auto')
  const manualBackups = backups.filter(b => b.type === 'manual')
  const totalSize = backups.reduce((sum, b) => sum + b.size, 0)

  return {
    totalBackups: backups.length,
    autoBackups: autoBackups.length,
    manualBackups: manualBackups.length,
    totalSize,
    oldestBackup: backups[backups.length - 1]?.createdAt,
    newestBackup: backups[0]?.createdAt
  }
}

/**
 * Programar backups automáticos
 * @param intervalMs - Intervalo en milisegundos (default: 6 horas)
 */
export function scheduleAutoBackups(intervalMs: number = 6 * 60 * 60 * 1000): NodeJS.Timeout {
  log.info(`[Backup] Programando backups automáticos cada ${intervalMs / 1000 / 60} minutos`)

  // Backup inicial
  createBackup('auto').catch(err =>
    console.error('[Backup] Error en backup inicial:', err)
  )

  // Programar backups periódicos
  return setInterval(async () => {
    try {
      const backup = await createBackup('auto')
      log.info(`[Backup] Backup automático creado: ${backup.filename} (${formatBytes(backup.size)})`)
    } catch (err) {
      console.error('[Backup] Error en backup automático:', err)
    }
  }, intervalMs)
}

/**
 * Formatear bytes a string legible
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

// Exportar para uso en API
export { BACKUP_DIR }
