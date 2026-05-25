import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar autorizaciones pendientes
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado') || 'PENDIENTE'
    const tipoReporte = searchParams.get('tipoReporte')

    const where: Prisma.AutorizacionReporteWhereInput = {}
    if (estado !== 'TODOS') {
      where.estado = estado
    }
    if (tipoReporte) {
      where.tipoReporte = tipoReporte
    }

    const autorizaciones = await db.autorizacionReporte.findMany({
      where,
      orderBy: { fechaSolicitud: 'desc' },
      take: 50
    })

    return NextResponse.json({
      success: true,
      data: autorizaciones
    })

  } catch (error) {
    console.error('Error al obtener autorizaciones:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error al obtener autorizaciones' 
    }, { status: 500 })
  }
}

// POST - Crear nueva solicitud de autorización
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const body = await request.json()
    const {
      tipoReporte,
      datosReporte,
      resumenReporte,
      solicitadoPorId,
      solicitadoPor,
      destinatarios,
      copiasOcultas,
      motivoSolicitud,
      fechaVigencia
    } = body

    // Validar campos requeridos
    if (!tipoReporte || !destinatarios || !solicitadoPorId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Faltan campos requeridos' 
      }, { status: 400 })
    }

    const autorizacion = await db.autorizacionReporte.create({
      data: {
        tipoReporte,
        datosReporte: datosReporte ? JSON.stringify(datosReporte) : null,
        resumenReporte,
        solicitadoPorId,
        solicitadoPor,
        destinatarios,
        copiasOcultas,
        motivoSolicitud,
        fechaVigencia: fechaVigencia ? new Date(fechaVigencia) : null,
        estado: 'PENDIENTE'
      }
    })

    return NextResponse.json({
      success: true,
      data: autorizacion
    })

  } catch (error) {
    console.error('Error al crear autorización:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error al crear solicitud de autorización' 
    }, { status: 500 })
  }
}

// PUT - Autorizar o rechazar
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, accion, autorizadoPorId, autorizadoPor, motivoRechazo } = body

    if (!id || !accion || !autorizadoPorId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Faltan campos requeridos' 
      }, { status: 400 })
    }

    // Verificar que el operador puede autorizar
    const operador = await db.operador.findUnique({
      where: { id: autorizadoPorId },
      select: { puedeReportes: true, activo: true }
    })

    if (!operador?.activo || !operador.puedeReportes) {
      return NextResponse.json({ 
        success: false, 
        error: 'No tiene permisos para autorizar reportes' 
      }, { status: 403 })
    }

    const estado = accion === 'AUTORIZAR' ? 'AUTORIZADO' : 'RECHAZADO'

    const autorizacion = await db.autorizacionReporte.update({
      where: { id },
      data: {
        estado,
        autorizadoPorId,
        autorizadoPor,
        fechaAutorizacion: new Date(),
        motivoRechazo: accion === 'RECHAZAR' ? motivoRechazo : null
      }
    })

    // Si fue autorizado, aquí se podría disparar el envío del email
    // Por ahora solo actualizamos el estado

    return NextResponse.json({
      success: true,
      data: autorizacion,
      message: accion === 'AUTORIZAR' 
        ? 'Reporte autorizado correctamente' 
        : 'Reporte rechazado'
    })

  } catch (error) {
    console.error('Error al procesar autorización:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error al procesar autorización' 
    }, { status: 500 })
  }
}
