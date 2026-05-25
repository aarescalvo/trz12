import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener intentos de login
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const ip = searchParams.get('ip')
    const operadorId = request.headers.get('x-operador-id')
    const soloFallidos = searchParams.get('fallidos') === 'true'
    const limit = parseInt(searchParams.get('limit') || '100')
    const horas = parseInt(searchParams.get('horas') || '24')

    const where: any = {}
    
    // Filtrar por tiempo
    const fechaDesde = new Date()
    fechaDesde.setHours(fechaDesde.getHours() - horas)
    where.fecha = { gte: fechaDesde }
    
    if (ip) {
      where.ip = ip
    }
    
    if (operadorId) {
      where.operadorId = operadorId
    }
    
    if (soloFallidos) {
      where.exitoso = false
    }

    const intentos = await db.intentoLogin.findMany({
      where,
      orderBy: {
        fecha: 'desc'
      },
      take: limit
    })
    
    // Estadísticas adicionales
    const estadisticas = await db.intentoLogin.groupBy({
      by: ['ip'],
      where: {
        ...where,
        exitoso: false
      },
      _count: true,
      orderBy: {
        _count: {
          ip: 'desc'
        }
      },
      take: 10
    })
    
    return NextResponse.json({
      success: true,
      data: intentos,
      estadisticas: {
        ipsConMasFallos: estadisticas.map(e => ({
          ip: e.ip,
          fallos: e._count
        }))
      }
    })
  } catch (error) {
    console.error('Error obteniendo intentos de login:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener intentos de login' },
      { status: 500 }
    )
  }
}
