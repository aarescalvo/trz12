import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar cámaras
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const camaras = await db.camara.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        mediasRes: {
          where: { estado: 'EN_CAMARA' },
          include: {
            romaneo: { select: { tropaCodigo: true } }
          }
        },
        stockMedias: true
      }
    })
    
    const camarasConStock = camaras.map(camara => {
      // Calcular stock total
      const stockTotal = camara.mediasRes.length
      const pesoTotal = camara.mediasRes.reduce((sum, m) => sum + (m.peso || 0), 0)
      const disponible = camara.capacidad - stockTotal

      // Agrupar medias por tropa
      const tropasMap = new Map<string, { cantidad: number; peso: number }>()
      camara.mediasRes.forEach(media => {
        const tropaCodigo = media.romaneo?.tropaCodigo
        if (tropaCodigo) {
          const existing = tropasMap.get(tropaCodigo) || { cantidad: 0, peso: 0 }
          tropasMap.set(tropaCodigo, {
            cantidad: existing.cantidad + 1,
            peso: existing.peso + (media.peso || 0)
          })
        }
      })

      const medias = Array.from(tropasMap.entries()).map(([tropaCodigo, datos]) => ({
        tropaCodigo,
        cantidad: datos.cantidad,
        peso: datos.peso
      }))

      return {
        id: camara.id,
        nombre: camara.nombre,
        tipo: camara.tipo,
        capacidad: camara.capacidad,
        observaciones: camara.observaciones,
        activo: camara.activo,
        stockTotal,
        pesoTotal,
        disponible: Math.max(0, disponible),
        medias
      }
    })
    
    return NextResponse.json({
      success: true,
      data: camarasConStock
    })
  } catch (error) {
    console.error('Error fetching cámaras:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener cámaras' },
      { status: 500 }
    )
  }
}

// POST - Crear cámara
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json()
    const { nombre, tipo, capacidad, observaciones } = body
    
    if (!nombre) {
      return NextResponse.json(
        { success: false, error: 'Nombre es requerido' },
        { status: 400 }
      )
    }
    
    // Verificar si ya existe una cámara con el mismo nombre
    const existing = await db.camara.findFirst({
      where: { nombre }
    })
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una cámara con ese nombre' },
        { status: 400 }
      )
    }
    
    const camara = await db.camara.create({
      data: {
        nombre,
        tipo: tipo || 'FAENA',
        capacidad: parseInt(capacidad) || 0,
        observaciones: observaciones || null
      }
    })
    
    return NextResponse.json({
      success: true,
      data: camara
    })
  } catch (error) {
    console.error('Error creating cámara:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear cámara' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar cámara
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, nombre, tipo, capacidad, observaciones, activo } = body
    
    const updateData: Record<string, unknown> = {}
    
    if (nombre !== undefined) updateData.nombre = nombre
    if (tipo !== undefined) updateData.tipo = tipo
    if (capacidad !== undefined) updateData.capacidad = parseInt(capacidad) || 0
    if (observaciones !== undefined) updateData.observaciones = observaciones || null
    if (activo !== undefined) updateData.activo = activo
    
    const camara = await db.camara.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json({
      success: true,
      data: camara
    })
  } catch (error) {
    console.error('Error updating cámara:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar cámara' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar cámara
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
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
    
    // Verificar que no tenga stock
    const stockCount = await db.mediaRes.count({
      where: { camaraId: id }
    })
    
    if (stockCount > 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar una cámara con stock' },
        { status: 400 }
      )
    }
    
    await db.camara.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cámara:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar cámara' },
      { status: 500 }
    )
  }
}
