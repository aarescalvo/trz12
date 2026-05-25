import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { checkPermission } from '@/lib/auth-helpers'

const execAsync = promisify(exec)

// Regex para validar nombres de archivo de backup: solo alfanuméricos, guiones, guiones bajos y puntos
const SAFE_FILENAME_REGEX = /^[a-zA-Z0-9_\-]+(\.sql|\.zip|\.gz|\.bak)$/

// POST - Restaurar desde backup
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const body = await request.json()
    const { fileName, createBackupBefore = true } = body

    if (!fileName) {
      return NextResponse.json({
        success: false,
        error: 'Nombre de archivo requerido'
      }, { status: 400 })
    }

    // Validar que el nombre de archivo solo contiene caracteres seguros (previene command injection)
    if (!SAFE_FILENAME_REGEX.test(fileName)) {
      return NextResponse.json({
        success: false,
        error: 'Nombre de archivo inválido. Solo se permiten caracteres alfanuméricos, guiones, guiones bajos y extensiones .sql, .zip, .gz, .bak'
      }, { status: 400 })
    }

    const backupDir = path.join(process.cwd(), 'backups')
    const filePath = path.join(backupDir, fileName)

    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({
        success: false,
        error: 'Archivo de backup no encontrado'
      }, { status: 404 })
    }

    // Verificar path traversal
    const resolvedPath = path.resolve(filePath)
    if (!resolvedPath.startsWith(backupDir)) {
      return NextResponse.json({
        success: false,
        error: 'Acceso no autorizado'
      }, { status: 403 })
    }

    // Crear backup antes de restaurar si se solicita
    if (createBackupBefore) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const preRestoreBackup = path.join(backupDir, `pre_restore_${timestamp}.sql`)
      
      try {
        // En producción, aquí ejecutaríamos pg_dump
        // Por ahora, solo registramos
        fs.writeFileSync(preRestoreBackup, `-- Pre-restore backup\n-- Fecha: ${new Date().toISOString()}\n`)
      } catch {
        console.error('No se pudo crear backup pre-restore')
      }
    }

    // En entorno de desarrollo, simular restauración
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        message: 'Restauración simulada completada',
        data: {
          fileName,
          restoredAt: new Date().toISOString(),
          note: 'En producción, se restauraría la base de datos desde el backup'
        }
      })
    }

    // En producción, ejecutar restauración con psql
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      name: process.env.DB_NAME || 'solemar_frigorifico',
      user: process.env.DB_USER || 'solemar_user',
      password: process.env.DB_PASSWORD || ''
    }

    // Si es un archivo comprimido, descomprimir primero
    let sqlFile = filePath
    if (fileName.endsWith('.zip')) {
      const unzipDir = path.join(backupDir, 'temp_extract')
      if (!fs.existsSync(unzipDir)) {
        fs.mkdirSync(unzipDir, { recursive: true })
      }
      
      await execAsync(`unzip -o "${filePath}" -d "${unzipDir}"`)
      
      // Buscar archivo SQL extraído
      const extractedFiles = fs.readdirSync(unzipDir).filter(f => f.endsWith('.sql'))
      if (extractedFiles.length > 0) {
        sqlFile = path.join(unzipDir, extractedFiles[0])
      }
    }

    // Ejecutar restauración
    const env = { ...process.env, PGPASSWORD: dbConfig.password }
    const psqlPath = process.env.PSQL_PATH || 'psql'
    
    const { stdout, stderr } = await execAsync(
      `"${psqlPath}" -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.name} -f "${sqlFile}"`,
      { env, timeout: 300000 }
    )

    // Limpiar archivos temporales
    if (sqlFile !== filePath) {
      const unzipDir = path.dirname(sqlFile)
      fs.rmSync(unzipDir, { recursive: true, force: true })
    }

    return NextResponse.json({
      success: true,
      message: 'Restauración completada exitosamente',
      data: {
        fileName,
        restoredAt: new Date().toISOString(),
        output: stdout || undefined,
        warnings: stderr || undefined
      }
    })

  } catch (error) {
    console.error('Error restaurando backup:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al restaurar backup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET - Verificar integridad de backup
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('file')

    if (!fileName) {
      return NextResponse.json({
        success: false,
        error: 'Nombre de archivo requerido'
      }, { status: 400 })
    }

    // Validar que el nombre de archivo solo contiene caracteres seguros (previene command injection)
    if (!SAFE_FILENAME_REGEX.test(fileName)) {
      return NextResponse.json({
        success: false,
        error: 'Nombre de archivo inválido. Solo se permiten caracteres alfanuméricos, guiones, guiones bajos y extensiones .sql, .zip, .gz, .bak'
      }, { status: 400 })
    }

    const backupDir = path.join(process.cwd(), 'backups')
    const filePath = path.join(backupDir, fileName)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({
        success: false,
        error: 'Archivo no encontrado'
      }, { status: 404 })
    }

    // Verificar path traversal
    const resolvedPath = path.resolve(filePath)
    if (!resolvedPath.startsWith(backupDir)) {
      return NextResponse.json({
        success: false,
        error: 'Acceso no autorizado'
      }, { status: 403 })
    }

    const stats = fs.statSync(filePath)
    
    // Verificar contenido básico
    let valid = false
    let lineCount = 0
    let tableCount = 0

    try {
      if (fileName.endsWith('.sql')) {
        const content = fs.readFileSync(filePath, 'utf-8')
        lineCount = content.split('\n').length
        tableCount = (content.match(/CREATE TABLE/gi) || []).length
        valid = content.includes('-- Backup') || content.includes('CREATE TABLE') || content.includes('INSERT INTO')
      } else if (fileName.endsWith('.zip')) {
        // Verificar que es un ZIP válido
        const raw = fs.readFileSync(filePath, { encoding: null, flag: 'r' }) as unknown as Buffer
        const header = Buffer.from(raw.slice(0, 4))
        valid = header[0] === 0x50 && header[1] === 0x4B // PK signature
      }
    } catch {
      valid = false
    }

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        size: formatBytes(stats.size),
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        valid,
        lineCount: lineCount || undefined,
        tableCount: tableCount || undefined
      }
    })

  } catch (error) {
    console.error('Error verificando backup:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al verificar backup'
    }, { status: 500 })
  }
}

// Función auxiliar para formatear bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
