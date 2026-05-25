import { NextRequest, NextResponse } from 'next/server'
import { getCacheStats, cacheClear } from '@/lib/cache'
import { getRateLimitStats } from '@/lib/rate-limit'
import { getBackupStats } from '@/lib/backup'
import { createLogger } from '@/lib/logger'
import { db } from '@/lib/db'
import fs from 'fs/promises'
import path from 'path'

const logger = createLogger('API:Status')

// Verificar permisos de administrador
async function checkAdminAuth(request: NextRequest): Promise<boolean> {
  const operadorId = request.headers.get('x-operador-id')
  if (!operadorId) return false
  
  const operador = await db.operador.findUnique({
    where: { id: operadorId },
    select: { rol: true }
  })
  
  return operador?.rol === 'ADMINISTRADOR'
}

// GET - Obtener estadísticas del sistema
export async function GET(request: NextRequest) {
  try {
    // Verificar auth
    const isAuth = await checkAdminAuth(request)
    if (!isAuth) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    // Estadísticas de cache
    const cacheStats = getCacheStats()
    
    // Estadísticas de rate limiting
    const rateLimitStats = getRateLimitStats()
    
    // Estadísticas de backup
    const backupStats = await getBackupStats()
    
    // Conteos de base de datos
    const [
      tropasCount,
      animalesCount,
      clientesCount,
      operadoresCount,
      auditoriaCount
    ] = await Promise.all([
      db.tropa.count(),
      db.animal.count(),
      db.cliente.count(),
      db.operador.count(),
      db.auditoria.count()
    ])
    
    // Tamaño de la base de datos
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    let dbSize = 0
    try {
      const stats = await fs.stat(dbPath)
      dbSize = stats.size
    } catch {
      // DB no encontrada
    }
    
    // Uso de memoria
    const memUsage = process.memoryUsage()
    
    const systemStatus = {
      version: '2.1.0',
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rss: formatBytes(memUsage.rss),
        heapTotal: formatBytes(memUsage.heapTotal),
        heapUsed: formatBytes(memUsage.heapUsed),
        external: formatBytes(memUsage.external)
      },
      database: {
        size: formatBytes(dbSize),
        tables: {
          tropas: tropasCount,
          animales: animalesCount,
          clientes: clientesCount,
          operadores: operadoresCount,
          auditoria: auditoriaCount
        }
      },
      cache: cacheStats,
      rateLimit: rateLimitStats,
      backup: backupStats,
      timestamp: new Date().toISOString()
    }
    
    logger.info('Estado del sistema consultado')
    
    return NextResponse.json({
      success: true,
      data: systemStatus
    })
    
  } catch (error) {
    logger.error('Error al obtener estado del sistema', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener estado del sistema' },
      { status: 500 }
    )
  }
}

// DELETE - Limpiar cache
export async function DELETE(request: NextRequest) {
  try {
    // Verificar auth
    const isAuth = await checkAdminAuth(request)
    if (!isAuth) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    cacheClear()
    logger.info('Cache limpiado manualmente')
    
    // Registrar en auditoría
    const operadorId = request.headers.get('x-operador-id')
    await db.auditoria.create({
      data: {
        operadorId,
        modulo: 'Sistema',
        accion: 'DELETE',
        entidad: 'Cache',
        descripcion: 'Cache limpiado manualmente'
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Cache limpiado exitosamente'
    })
    
  } catch (error) {
    logger.error('Error al limpiar cache', error)
    return NextResponse.json(
      { success: false, error: 'Error al limpiar cache' },
      { status: 500 }
    )
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}
