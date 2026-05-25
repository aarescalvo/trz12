import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener configuración de seguridad
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    let config = await db.configuracionSeguridad.findFirst()
    
    if (!config) {
      // Crear configuración por defecto
      config = await db.configuracionSeguridad.create({
        data: {}
      })
    }
    
    return NextResponse.json({
      success: true,
      data: config
    })
  } catch (error) {
    console.error('Error obteniendo configuración de seguridad:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener configuración' },
      { status: 500 }
    )
  }
}

// POST - Actualizar configuración de seguridad
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const body = await request.json()
    
    // Buscar configuración existente
    let config = await db.configuracionSeguridad.findFirst()
    
    const dataToUpdate = {
      passwordMinLength: body.passwordMinLength ?? 8,
      passwordRequireUppercase: body.passwordRequireUppercase ?? true,
      passwordRequireLowercase: body.passwordRequireLowercase ?? true,
      passwordRequireNumbers: body.passwordRequireNumbers ?? true,
      passwordRequireSpecialChars: body.passwordRequireSpecialChars ?? false,
      passwordMaxAge: body.passwordMaxAge ?? 90,
      sessionTimeout: body.sessionTimeout ?? 480,
      maxConcurrentSessions: body.maxConcurrentSessions ?? 1,
      maxLoginAttempts: body.maxLoginAttempts ?? 5,
      lockoutDuration: body.lockoutDuration ?? 30,
      notifyNewIp: body.notifyNewIp ?? true,
      notifyFailedAttempts: body.notifyFailedAttempts ?? true,
      notifyPasswordChange: body.notifyPasswordChange ?? true,
      notifyOutOfHoursAccess: body.notifyOutOfHoursAccess ?? false,
      restrictedHoursEnabled: body.restrictedHoursEnabled ?? false,
      allowedHourStart: body.allowedHourStart,
      allowedHourEnd: body.allowedHourEnd
    }
    
    if (config) {
      // Actualizar
      config = await db.configuracionSeguridad.update({
        where: { id: config.id },
        data: dataToUpdate
      })
    } else {
      // Crear
      config = await db.configuracionSeguridad.create({
        data: dataToUpdate
      })
    }
    
    return NextResponse.json({
      success: true,
      data: config
    })
  } catch (error) {
    console.error('Error actualizando configuración de seguridad:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar configuración' },
      { status: 500 }
    )
  }
}
