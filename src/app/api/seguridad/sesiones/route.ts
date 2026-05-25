import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener sesiones activas
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const operadorId = request.headers.get('x-operador-id')
    const soloActivas = searchParams.get('activas') !== 'false'
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: any = {}
    
    if (operadorId) {
      where.operadorId = operadorId
    }
    
    if (soloActivas) {
      where.activa = true
      where.fechaExpiracion = { gt: new Date() }
    }

    const sesiones = await db.sesion.findMany({
      where,
      include: {
        operador: {
          select: {
            id: true,
            nombre: true,
            usuario: true,
            rol: true
          }
        }
      },
      orderBy: {
        fechaInicio: 'desc'
      },
      take: limit
    })
    
    return NextResponse.json({
      success: true,
      data: sesiones
    })
  } catch (error) {
    console.error('Error obteniendo sesiones:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener sesiones' },
      { status: 500 }
    )
  }
}
