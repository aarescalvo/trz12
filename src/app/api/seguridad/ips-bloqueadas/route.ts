import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener IPs bloqueadas
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const soloActivas = searchParams.get('activas') !== 'false'

    const where: any = {}
    
    if (soloActivas) {
      where.activo = true
      where.OR = [
        { fechaExpiracion: null },
        { fechaExpiracion: { gt: new Date() } }
      ]
    }

    const ipsBloqueadas = await db.ipBloqueada.findMany({
      where,
      orderBy: {
        fechaBloqueo: 'desc'
      }
    })
    
    return NextResponse.json({
      success: true,
      data: ipsBloqueadas
    })
  } catch (error) {
    console.error('Error obteniendo IPs bloqueadas:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener IPs bloqueadas' },
      { status: 500 }
    )
  }
}

// POST - Bloquear IP
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const body = await request.json()
    const { ip, motivo, duracionMinutos, operadorId } = body
    
    if (!ip) {
      return NextResponse.json(
        { success: false, error: 'IP es requerida' },
        { status: 400 }
      )
    }
    
    // Verificar si ya existe
    const existente = await db.ipBloqueada.findFirst({
      where: {
        ip,
        activo: true,
        OR: [
          { fechaExpiracion: null },
          { fechaExpiracion: { gt: new Date() } }
        ]
      }
    })
    
    if (existente) {
      return NextResponse.json(
        { success: false, error: 'La IP ya está bloqueada' },
        { status: 400 }
      )
    }
    
    // Calcular fecha de expiración
    let fechaExpiracion: Date | null = null
    if (duracionMinutos) {
      fechaExpiracion = new Date()
      fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + duracionMinutos)
    }
    
    // Crear bloqueo
    const bloqueo = await db.ipBloqueada.create({
      data: {
        ip,
        motivo: motivo || 'MANUAL',
        fechaExpiracion,
        operadorId
      }
    })
    
    // Registrar en auditoría
    await db.auditoria.create({
      data: {
        operadorId,
        modulo: 'SEGURIDAD',
        accion: 'LOCK',
        entidad: 'IpBloqueada',
        entidadId: bloqueo.id,
        descripcion: `IP bloqueada: ${ip}. Motivo: ${motivo || 'MANUAL'}`,
        datosDespues: JSON.stringify({ ip, motivo, duracionMinutos })
      }
    })
    
    return NextResponse.json({
      success: true,
      data: bloqueo
    })
  } catch (error) {
    console.error('Error bloqueando IP:', error)
    return NextResponse.json(
      { success: false, error: 'Error al bloquear IP' },
      { status: 500 }
    )
  }
}
