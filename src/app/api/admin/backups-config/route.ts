import { NextRequest, NextResponse } from 'next/server'
import {
  getBackupConfig,
  updateBackupConfig,
  runBackup,
  cleanupOldBackups,
  verifyBackup,
  getSchedulerStatus,
  restartScheduler,
  calculateNextBackup,
  type BackupConfig,
  type FrecuenciaBackup,
  type DestinoBackup
} from '@/lib/backup-scheduler'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener configuración actual de backups
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const config = await getBackupConfig()
    const schedulerStatus = getSchedulerStatus()

    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo obtener la configuración de backups'
      }, { status: 500 })
    }

    // Calcular próxima ejecución
    const proximoBackup = calculateNextBackup(config)

    return NextResponse.json({
      success: true,
      data: {
        config: {
          ...config,
          proximoBackup: proximoBackup.toISOString()
        },
        scheduler: {
          running: schedulerStatus.running,
          cronExpression: schedulerStatus.cronExpression
        }
      }
    })

  } catch (error) {
    console.error('Error obteniendo configuración de backups:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener configuración',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Guardar configuración de backups
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      enabled,
      frecuencia,
      hora,
      minuto,
      diaSemana,
      diaMes,
      retencionDias,
      maxBackups,
      destino,
      rutaDestino,
      compresion,
      incluirArchivos,
      verificarIntegridad,
      notificarExito,
      notificarFallo,
      emailNotificacion
    } = body

    // Validaciones
    if (hora !== undefined && (hora < 0 || hora > 23)) {
      return NextResponse.json({
        success: false,
        error: 'La hora debe estar entre 0 y 23'
      }, { status: 400 })
    }

    if (minuto !== undefined && (minuto < 0 || minuto > 59)) {
      return NextResponse.json({
        success: false,
        error: 'El minuto debe estar entre 0 y 59'
      }, { status: 400 })
    }

    if (frecuencia && !['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'].includes(frecuencia)) {
      return NextResponse.json({
        success: false,
        error: 'Frecuencia inválida'
      }, { status: 400 })
    }

    if (destino && !['LOCAL', 'GOOGLE_DRIVE', 'FTP', 'S3'].includes(destino)) {
      return NextResponse.json({
        success: false,
        error: 'Destino inválido'
      }, { status: 400 })
    }

    // Preparar datos a actualizar
    const updateData: any = {}

    if (enabled !== undefined) updateData.activo = Boolean(enabled)
    if (frecuencia) updateData.frecuencia = frecuencia as FrecuenciaBackup
    if (hora !== undefined) updateData.horaBackup = `${Number(hora)}:00`
    if (minuto !== undefined) updateData.horaBackup = updateData.horaBackup || `${Number(minuto)}`
    if (diaSemana !== undefined) updateData.diaSemana = diaSemana !== null ? Number(diaSemana) : null
    if (diaMes !== undefined) updateData.diaMes = diaMes !== null ? Number(diaMes) : null
    if (retencionDias !== undefined) updateData.retencionDias = Number(retencionDias)
    if (maxBackups !== undefined) updateData.maxBackups = Number(maxBackups)
    if (destino) updateData.destino = destino as DestinoBackup
    if (rutaDestino !== undefined) updateData.rutaDestino = rutaDestino || null
    if (compresion !== undefined) updateData.compresion = Boolean(compresion)
    if (incluirArchivos !== undefined) updateData.incluirArchivos = Boolean(incluirArchivos)
    if (verificarIntegridad !== undefined) updateData.verificarIntegridad = Boolean(verificarIntegridad)
    if (notificarExito !== undefined) updateData.notificarExito = Boolean(notificarExito)
    if (notificarFallo !== undefined) updateData.notificarFallo = Boolean(notificarFallo)
    if (emailNotificacion !== undefined) updateData.emailNotificacion = emailNotificacion || null

    // Actualizar configuración
    const updatedConfig = await updateBackupConfig(updateData)

    if (!updatedConfig) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo actualizar la configuración'
      }, { status: 500 })
    }

    // Calcular próxima ejecución
    const proximoBackup = calculateNextBackup(updatedConfig)
    const schedulerStatus = getSchedulerStatus()

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada correctamente',
      data: {
        config: {
          ...updatedConfig,
          proximoBackup: proximoBackup.toISOString()
        },
        scheduler: {
          running: schedulerStatus.running,
          cronExpression: schedulerStatus.cronExpression
        }
      }
    })

  } catch (error) {
    console.error('Error guardando configuración de backups:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al guardar configuración',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PATCH - Ejecutar acciones específicas
export async function PATCH(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const body = await request.json()
    const { action, fileName } = body

    switch (action) {
      case 'runNow':
        // Ejecutar backup manual inmediato
        const result = await runBackup('MANUAL')
        return NextResponse.json({
          success: result.success,
          message: result.success ? 'Backup ejecutado correctamente' : 'Error al ejecutar backup',
          data: result
        })

      case 'cleanup':
        // Limpiar backups antiguos
        const cleanupResult = await cleanupOldBackups()
        return NextResponse.json({
          success: true,
          message: `Se eliminaron ${cleanupResult.deleted} backups antiguos`,
          data: {
            deleted: cleanupResult.deleted,
            freedMB: cleanupResult.freedMB
          }
        })

      case 'verify':
        // Verificar integridad de un backup
        if (!fileName) {
          return NextResponse.json({
            success: false,
            error: 'Nombre de archivo requerido'
          }, { status: 400 })
        }
        const verifyResult = await verifyBackup(fileName)
        return NextResponse.json({
          success: verifyResult.valid,
          message: verifyResult.valid ? 'Backup verificado correctamente' : 'Backup con errores',
          data: verifyResult
        })

      case 'restart':
        // Reiniciar scheduler
        const restartResult = await restartScheduler()
        return NextResponse.json({
          success: restartResult,
          message: restartResult ? 'Scheduler reiniciado' : 'Error al reiniciar scheduler'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Acción no reconocida'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Error ejecutando acción de backup:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al ejecutar acción',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
