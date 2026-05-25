import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { checkPermission } from '@/lib/auth-helpers'
import { checkAdminRole } from '@/lib/auth-helpers'
import { createLogger } from '@/lib/logger'
const log = createLogger('app.api.admin.actualizaciones.route')

const execAsync = promisify(exec)

// Interfaz para información de versión
interface VersionInfo {
  version: string
  commit: string
  date: string
  message: string
}

// GET - Verificar actualizaciones disponibles
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    // Leer configuración del sistema
    const config = await getSistemaConfig()
    
    const repoUrl = config.GITHUB_REPO_URL || 'https://github.com/aarescalvo/153'
    const branch = config.GITHUB_BRANCH || 'master'
    const token = config.GITHUB_TOKEN

    // Obtener versión instalada
    const installedVersion = await getInstalledVersion()
    
    // Obtener último commit del repositorio
    const repoPath = repoUrl.replace('https://github.com/', '').replace('.git', '')
    const apiUrl = `https://api.github.com/repos/${repoPath}/commits/${branch}`

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Solemar-Updater'
    }

    if (token) {
      headers['Authorization'] = `token ${token}`
    }

    const response = await fetch(apiUrl, { headers })
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo conectar con GitHub',
        details: `Status: ${response.status}`
      }, { status: 500 })
    }

    const data = await response.json()
    
    const latestVersion: VersionInfo = {
      version: extractVersionFromMessage(data.commit.message),
      commit: data.sha.substring(0, 7),
      date: data.commit.committer.date,
      message: data.commit.message.split('\n')[0]
    }

    // Verificar si hay actualización disponible
    const updateAvailable = installedVersion.commit !== latestVersion.commit && 
                            installedVersion.commit !== 'local-dev'

    // Obtener historial de commits (changelog)
    const changelog = await getChangelog(repoPath, branch, token, 10)

    return NextResponse.json({
      success: true,
      data: {
        installedVersion,
        latestVersion,
        updateAvailable,
        repository: repoUrl,
        branch: branch,
        lastChecked: new Date().toISOString(),
        changelog
      }
    })

  } catch (error) {
    console.error('Error verificando actualizaciones:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Ejecutar actualización (solo ADMINISTRADOR)
export async function POST(request: NextRequest) {
  const authError = await checkAdminRole(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { force = false, skipBackup = false } = body

    // En entorno de desarrollo, no permitir actualización real
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: false,
        error: 'Las actualizaciones automáticas no están disponibles en modo desarrollo',
        hint: 'En producción, use el script actualizar-sistema.ps1'
      }, { status: 400 })
    }

    // Verificar que existe el script de actualización y que la ruta está dentro del proyecto
    const scriptPath = path.join(process.cwd(), 'installers', 'actualizar-sistema.ps1')
    
    // Validar que la ruta resuelta está dentro del directorio del proyecto (previene path traversal)
    const resolvedScriptPath = path.resolve(scriptPath)
    const projectDir = path.resolve(process.cwd())
    if (!resolvedScriptPath.startsWith(projectDir)) {
      return NextResponse.json({
        success: false,
        error: 'Ruta de script no autorizada'
      }, { status: 403 })
    }
    
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json({
        success: false,
        error: 'Script de actualización no encontrado'
      }, { status: 404 })
    }

    // Construir comando
    let command = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}"`
    if (force) command += ' -Forzar'
    if (skipBackup) command += ' -SinBackup'

    // Ejecutar actualización en background
    execAsync(command, {
      timeout: 300000, // 5 minutos máximo
      cwd: process.cwd()
    }).then(({ stdout, stderr }) => {
      log.info(`'Actualización completada:' stdout`)
      if (stderr) console.error('Warnings:', stderr)
    }).catch(err => {
      console.error('Error en actualización:', err)
    })

    return NextResponse.json({
      success: true,
      message: 'Actualización iniciada en segundo plano',
      data: {
        startedAt: new Date().toISOString(),
        note: 'El sistema se reiniciará automáticamente al completar la actualización'
      }
    })

  } catch (error) {
    console.error('Error ejecutando actualización:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al ejecutar actualización',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Función auxiliar para obtener configuración
async function getSistemaConfig(): Promise<Record<string, string>> {
  const configPath = path.join(process.cwd(), 'installers', 'config', 'sistema.conf')
  
  const defaultConfig = {
    GITHUB_REPO_URL: 'https://github.com/aarescalvo/153',
    GITHUB_BRANCH: 'master',
    GITHUB_TOKEN: '',
    BACKUP_DIR: path.join(process.cwd(), 'backups'),
    BACKUP_KEEP_COUNT: '30',
    AUTO_BACKUP_BEFORE_UPDATE: 'true'
  }

  try {
    if (!fs.existsSync(configPath)) {
      return defaultConfig
    }

    const content = fs.readFileSync(configPath, 'utf-8')
    const config = { ...defaultConfig }

    content.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
        if (key.trim() in config) {
          (config as Record<string, string>)[key.trim()] = value
        }
      }
    })

    return config
  } catch {
    return defaultConfig
  }
}

// Función auxiliar para obtener versión instalada
async function getInstalledVersion(): Promise<VersionInfo> {
  const commitFile = path.join(process.cwd(), '.commit')
  const packageFile = path.join(process.cwd(), 'package.json')

  try {
    // Intentar leer archivo .commit
    if (fs.existsSync(commitFile)) {
      const commit = fs.readFileSync(commitFile, 'utf-8').trim()
      return {
        version: 'dev',
        commit: commit.substring(0, 7),
        date: new Date().toISOString(),
        message: 'Versión de desarrollo'
      }
    }

    // Intentar leer package.json
    if (fs.existsSync(packageFile)) {
      const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf-8'))
      return {
        version: pkg.version || '0.0.0',
        commit: 'local-dev',
        date: new Date().toISOString(),
        message: 'Versión local de desarrollo'
      }
    }

    return {
      version: '0.0.0',
      commit: 'local-dev',
      date: new Date().toISOString(),
      message: 'Versión no determinada'
    }
  } catch {
    return {
      version: '0.0.0',
      commit: 'local-dev',
      date: new Date().toISOString(),
      message: 'Error al leer versión'
    }
  }
}

// Función para extraer versión del mensaje de commit
function extractVersionFromMessage(message: string): string {
  // Buscar patrón v1.2.3 o v1.2.3-beta en el mensaje
  const versionMatch = message.match(/v(\d+\.\d+\.\d+(?:-[a-zA-Z0-9]+)?)/)
  if (versionMatch) {
    return versionMatch[1]
  }
  return 'dev'
}

// Función para obtener changelog
async function getChangelog(
  repoPath: string, 
  branch: string, 
  token: string | undefined, 
  limit: number
): Promise<Array<{ commit: string; message: string; date: string; author: string }>> {
  try {
    const apiUrl = `https://api.github.com/repos/${repoPath}/commits?sha=${branch}&per_page=${limit}`

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Solemar-Updater'
    }

    if (token) {
      headers['Authorization'] = `token ${token}`
    }

    const response = await fetch(apiUrl, { headers })
    
    if (!response.ok) {
      return []
    }

    const commits = await response.json()
    
    return commits.map((c: { sha: string; commit: { message: string; committer: { date: string }; author: { name: string } } }) => ({
      commit: c.sha.substring(0, 7),
      message: c.commit.message.split('\n')[0].substring(0, 80),
      date: c.commit.committer.date,
      author: c.commit.author?.name || 'Unknown'
    }))
  } catch {
    return []
  }
}
