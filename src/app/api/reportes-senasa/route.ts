import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TipoReporteSenasa, EstadoReporteSenasa } from '@prisma/client'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar reportes SENASA
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado') as EstadoReporteSenasa | null
    const tipo = searchParams.get('tipo') as TipoReporteSenasa | null

    const where: any = {}
    if (estado) where.estado = estado
    if (tipo) where.tipoReporte = tipo

    const reportes = await db.reporteSenasa.findMany({
      where,
      include: {
      operador: {
      select: { id: true, nombre: true }
    }
    },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: reportes
    })
  } catch (error) {
    console.error('Error fetching reportes SENASA:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener reportes SENASA' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo reporte SENASA
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      tipoReporte,
      fechaDesde,
      fechaHasta,
      periodo,
      operadorId,
      observaciones
    } = body

    if (!tipoReporte || !fechaDesde || !fechaHasta) {
      return NextResponse.json(
        { success: false, error: 'Tipo de reporte, fechas desde/hasta son requeridos' },
        { status: 400 }
      )
    }

    const reporte = await db.reporteSenasa.create({
      data: {
        tipoReporte: tipoReporte as TipoReporteSenasa,
        fechaDesde: new Date(fechaDesde),
        fechaHasta: new Date(fechaHasta),
        periodo: periodo || `${fechaDesde} - ${fechaHasta}`,
        estado: 'PENDIENTE',
        operadorId: operadorId || null,
        observaciones: observaciones || null
      },
      include: {
        operador: {
      select: { id: true, nombre: true }
    }
  }
    })

    return NextResponse.json({
      success: true,
      data: reporte
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating reporte SENASA:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear reporte SENASA' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar/Enviar reporte SENASA
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, estado, mensajeError, archivoNombre, archivoUrl, datosReporte } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
      { status: 400 }
      )
    }

    const updateData: any = {}
    if (estado) {
      updateData.estado = estado
      if (estado === 'ENVIADO') {
        updateData.fechaEnvio = new Date()
      }
      if (estado === 'CONFIRMADO') {
        updateData.fechaConfirmacion = new Date()
      }
    }
    if (mensajeError !== undefined) updateData.mensajeError = mensajeError
    if (archivoNombre !== undefined) updateData.archivoNombre = archivoNombre
    if (archivoUrl !== undefined) updateData.archivoUrl = archivoUrl
    if (datosReporte !== undefined) updateData.datosReporte = datosReporte

    const reporte = await db.reporteSenasa.update({
      where: { id },
      data: updateData,
      include: {
        operador: {
      select: { id: true, nombre: true }
    }
  }
    })

    return NextResponse.json({
      success: true,
      data: reporte
    })
  } catch (error) {
    console.error('Error updating reporte SENASA:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar reporte SENASA' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar reporte SENASA
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    await db.reporteSenasa.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Reporte eliminado correctamente'
    })
  } catch (error) {
    console.error('Error deleting reporte SENASA:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar reporte SENASA' },
      { status: 500 }
    )
  }
}
