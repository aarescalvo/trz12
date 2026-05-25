import { NextRequest, NextResponse } from 'next/server'
import { createBackup, listBackups, restoreBackup, deleteBackup, getBackupStats } from '@/lib/backup'
import { createLogger } from '@/lib/logger'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

const logger = createLogger('API:Backup')

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

// GET - Listar backups o estadísticas
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    // Verificar auth
    const isAuth = await checkAdminAuth(request)
    if (!isAuth) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    if (action === 'stats') {
      const stats = await getBackupStats()
      logger.info('Estadísticas de backup obtenidas', stats)
      return NextResponse.json({ success: true, data: stats })
    }
    
    // Listar backups por defecto
    const backups = await listBackups()
    logger.info('Lista de backups obtenida', { count: backups.length })
    
    return NextResponse.json({
      success: true,
      data: backups
    })
    
  } catch (error) {
    logger.error('Error al obtener backups', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener backups' },
      { status: 500 }
    )
  }
}

// POST - Crear backup manual
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    // Verificar auth
    const isAuth = await checkAdminAuth(request)
    if (!isAuth) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    const backup = await createBackup('manual')
    logger.info('Backup manual creado', { filename: backup.filename, size: backup.size })
    
    // Registrar en auditoría
    const operadorId = request.headers.get('x-operador-id')
    await db.auditoria.create({
      data: {
        operadorId,
        modulo: 'Sistema',
        accion: 'CREATE',
        entidad: 'Backup',
        entidadId: backup.filename,
        descripcion: `Backup manual creado: ${backup.filename}`
      }
    })
    
    return NextResponse.json({
      success: true,
      data: backup,
      message: 'Backup creado exitosamente'
    })
    
  } catch (error) {
    logger.error('Error al crear backup', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear backup' },
      { status: 500 }
    )
  }
}

// PUT - Restaurar backup
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    // Verificar auth
    const isAuth = await checkAdminAuth(request)
    if (!isAuth) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { filename } = body
    
    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Nombre de archivo requerido' },
        { status: 400 }
      )
    }
    
    await restoreBackup(filename)
    logger.warn('Backup restaurado', { filename })
    
    // Registrar en auditoría
    const operadorId = request.headers.get('x-operador-id')
    await db.auditoria.create({
      data: {
        operadorId,
        modulo: 'Sistema',
        accion: 'UPDATE',
        entidad: 'Backup',
        entidadId: filename,
        descripcion: `Backup restaurado: ${filename}`
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Backup restaurado. Reinicie el servidor para aplicar cambios.'
    })
    
  } catch (error) {
    logger.error('Error al restaurar backup', error)
    return NextResponse.json(
      { success: false, error: 'Error al restaurar backup' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar backup
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    // Verificar auth
    const isAuth = await checkAdminAuth(request)
    if (!isAuth) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    
    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Nombre de archivo requerido' },
        { status: 400 }
      )
    }
    
    const deleted = await deleteBackup(filename)
    
    if (deleted) {
      logger.info('Backup eliminado', { filename })
      
      // Registrar en auditoría
      const operadorId = request.headers.get('x-operador-id')
      await db.auditoria.create({
        data: {
          operadorId,
          modulo: 'Sistema',
          accion: 'DELETE',
          entidad: 'Backup',
          entidadId: filename,
          descripcion: `Backup eliminado: ${filename}`
        }
      })
    }
    
    return NextResponse.json({
      success: deleted,
      message: deleted ? 'Backup eliminado' : 'No se pudo eliminar el backup'
    })
    
  } catch (error) {
    logger.error('Error al eliminar backup', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar backup' },
      { status: 500 }
    )
  }
}
