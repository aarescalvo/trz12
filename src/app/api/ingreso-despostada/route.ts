import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar ingresos a despostada
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeDesposte')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const tropaCodigo = searchParams.get('tropaCodigo')
    const tipoMedia = searchParams.get('tipoMedia')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (estado) where.estado = estado
    if (tropaCodigo) where.tropaCodigo = { contains: tropaCodigo }
    if (tipoMedia) where.tipoMedia = tipoMedia

    const [registros, total] = await Promise.all([
      db.ingresoDespostada.findMany({
        where,
        include: {
          camaraOrigen: { select: { id: true, nombre: true } },
          camaraDestino: { select: { id: true, nombre: true } },
          lote: { select: { id: true, numero: true, estado: true } },
          operador: { select: { id: true, nombre: true } }
        },
        orderBy: { fecha: 'desc' },
        take: limit,
        skip: offset
      }),
      db.ingresoDespostada.count({ where })
    ])

    // Calcular estadísticas
    const stats = await db.ingresoDespostada.aggregate({
      _count: { id: true },
      _sum: { pesoKg: true }
    })

    const porEstado = await db.ingresoDespostada.groupBy({
      by: ['estado'],
      _count: { id: true },
      _sum: { pesoKg: true }
    })

    const porTipo = await db.ingresoDespostada.groupBy({
      by: ['tipoMedia'],
      _count: { id: true },
      _sum: { pesoKg: true }
    })

    return NextResponse.json({
      success: true,
      data: registros,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + registros.length < total
      },
      stats: {
        total: stats._count.id,
        pesoTotal: stats._sum.pesoKg || 0,
        porEstado,
        porTipo
      }
    })
  } catch (error) {
    console.error('Error fetching ingresos despostada:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener ingresos a despostada' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo ingreso a despostada
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeDesposte')
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      mediaResId,
      tropaCodigo,
      mediaCodigo,
      tipoMedia,
      pesoKg,
      camaraOrigenId,
      camaraDestinoId,
      loteId,
      operadorId,
      observaciones
    } = body

    if (!pesoKg) {
      return NextResponse.json(
        { success: false, error: 'El peso es requerido' },
        { status: 400 }
      )
    }

    const registro = await db.ingresoDespostada.create({
      data: {
        mediaResId,
        tropaCodigo,
        mediaCodigo,
        tipoMedia: tipoMedia || 'DELANTERA',
        pesoKg: parseFloat(pesoKg),
        camaraOrigenId,
        camaraDestinoId,
        loteId,
        operadorId,
        observaciones,
        estado: 'PENDIENTE'
      },
      include: {
        camaraOrigen: { select: { id: true, nombre: true } },
        camaraDestino: { select: { id: true, nombre: true } },
        lote: { select: { id: true, numero: true } },
        operador: { select: { id: true, nombre: true } }
      }
    })

    // Si hay mediaResId, actualizar estado
    if (mediaResId) {
      await db.mediaRes.update({
        where: { id: mediaResId },
        data: { estado: 'EN_CUARTEO' }
      })
    }

    return NextResponse.json({
      success: true,
      data: registro,
      message: 'Ingreso a despostada creado correctamente'
    })
  } catch (error) {
    console.error('Error creating ingreso despostada:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear ingreso a despostada' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar ingreso a despostada
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeDesposte')
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, accion, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    let data: any = {}

    // Acciones especiales
    if (accion === 'ingresar') {
      data.estado = 'INGRESADO'
    } else if (accion === 'en_proceso') {
      data.estado = 'EN_PROCESO'
    } else if (accion === 'procesar') {
      data.estado = 'PROCESADO'
    } else if (accion === 'devolver') {
      data.estado = 'DEVUELTO'
      // Si se devuelve, actualizar estado de la media
      const registro = await db.ingresoDespostada.findUnique({
        where: { id },
        select: { mediaResId: true }
      })
      if (registro?.mediaResId) {
        await db.mediaRes.update({
          where: { id: registro.mediaResId },
          data: { estado: 'EN_CAMARA' }
        })
      }
    } else if (accion === 'anular') {
      data.estado = 'ANULADO'
    } else {
      // Actualización normal
      if (updateData.tipoMedia) data.tipoMedia = updateData.tipoMedia
      if (updateData.pesoKg) data.pesoKg = parseFloat(updateData.pesoKg)
      if (updateData.camaraOrigenId) data.camaraOrigenId = updateData.camaraOrigenId
      if (updateData.camaraDestinoId) data.camaraDestinoId = updateData.camaraDestinoId
      if (updateData.loteId) data.loteId = updateData.loteId
      if (updateData.observaciones !== undefined) data.observaciones = updateData.observaciones
      if (updateData.estado) data.estado = updateData.estado
    }

    const registro = await db.ingresoDespostada.update({
      where: { id },
      data,
      include: {
        camaraOrigen: { select: { id: true, nombre: true } },
        camaraDestino: { select: { id: true, nombre: true } },
        lote: { select: { id: true, numero: true } },
        operador: { select: { id: true, nombre: true } }
      }
    })

    return NextResponse.json({
      success: true,
      data: registro,
      message: 'Registro actualizado correctamente'
    })
  } catch (error) {
    console.error('Error updating ingreso despostada:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar registro' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar ingreso a despostada
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeDesposte')
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

    await db.ingresoDespostada.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Registro eliminado correctamente'
    })
  } catch (error) {
    console.error('Error deleting ingreso despostada:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar registro' },
      { status: 500 }
    )
  }
}
