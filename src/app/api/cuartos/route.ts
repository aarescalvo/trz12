import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar cuartos con filtros
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeCuarteo')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const camaraId = searchParams.get('camaraId')
    const tipoCuartoId = searchParams.get('tipoCuartoId')
    const mediaResId = searchParams.get('mediaResId')
    const codigo = searchParams.get('codigo')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (estado) where.estado = estado
    if (camaraId) where.camaraId = camaraId
    if (tipoCuartoId) where.tipoCuartoId = tipoCuartoId
    if (mediaResId) where.mediaResId = mediaResId
    if (codigo) where.codigo = { contains: codigo, mode: 'insensitive' }

    const [cuartos, total] = await Promise.all([
      db.cuarto.findMany({
        where,
        include: {
          mediaRes: {
            select: {
              id: true,
              codigo: true,
              peso: true,
              lado: true,
              sigla: true,
              estado: true,
              romaneo: {
                select: { tropaCodigo: true, garron: true }
              }
            }
          },
          tipoCuarto: { select: { id: true, nombre: true, codigo: true } },
          camara: { select: { id: true, nombre: true } },
          propietario: { select: { id: true, nombre: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      db.cuarto.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: cuartos,
      pagination: { total, limit, offset, hasMore: offset + cuartos.length < total }
    })
  } catch (error) {
    console.error('Error fetching cuartos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener cuartos' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar cuarto (cambiar estado, cámara, etc.)
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeCuarteo')
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const updateData: any = { updatedAt: new Date() }
    if (data.estado) updateData.estado = data.estado
    if (data.camaraId !== undefined) updateData.camaraId = data.camaraId || null
    if (data.ingresoDespostadaId !== undefined) updateData.ingresoDespostadaId = data.ingresoDespostadaId

    const cuarto = await db.cuarto.update({
      where: { id },
      data: updateData,
      include: {
        mediaRes: { select: { id: true, codigo: true, peso: true } },
        tipoCuarto: { select: { id: true, nombre: true, codigo: true } },
        camara: { select: { id: true, nombre: true } }
      }
    })

    return NextResponse.json({ success: true, data: cuarto })
  } catch (error) {
    console.error('Error updating cuarto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar cuarto' },
      { status: 500 }
    )
  }
}
