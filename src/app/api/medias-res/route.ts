import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener medias reses
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const romaneoId = searchParams.get('romaneoId')
    const camaraId = searchParams.get('camaraId')
    const estado = searchParams.get('estado')
    const tropaCodigo = searchParams.get('tropaCodigo')
    const limit = parseInt(searchParams.get('limit') || '200')

    const where: Record<string, unknown> = {}

    if (romaneoId) where.romaneoId = romaneoId
    if (camaraId) where.camaraId = camaraId
    if (estado) where.estado = estado.toUpperCase()
    if (tropaCodigo) where.romaneo = { tropaCodigo }

    const medias = await db.mediaRes.findMany({
      where,
      include: {
        romaneo: {
          include: { tipificador: true }
        },
        camara: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return NextResponse.json({
      success: true,
      data: medias.map(m => ({
        id: m.id,
        codigo: m.codigo,
        lado: m.lado,
        peso: m.peso,
        sigla: m.sigla,
        estado: m.estado,
        camara: m.camara ? {
          id: m.camara.id,
          nombre: m.camara.nombre,
          tipo: m.camara.tipo
        } : null,
        romaneo: m.romaneo ? {
          id: m.romaneo.id,
          garron: m.romaneo.garron,
          tropaCodigo: m.romaneo.tropaCodigo,
          tipoAnimal: m.romaneo.tipoAnimal,
          raza: m.romaneo.raza
        } : null,
        createdAt: m.createdAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('Error fetching medias res:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener medias res' },
      { status: 500 }
    )
  }
}

// POST - Crear media res
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError
  try {
    const body = await request.json()
    const { romaneoId, lado, peso, sigla, camaraId, tropaCodigo } = body

    if (!romaneoId || !lado || !peso) {
      return NextResponse.json(
        { success: false, error: 'romaneoId, lado y peso son requeridos' },
        { status: 400 }
      )
    }

    // Generar código de barras único
    const romaneo = await db.romaneo.findUnique({
      where: { id: romaneoId }
    })
    
    const codigo = `${romaneo?.tropaCodigo || 'S/T'}-${romaneo?.garron || '000'}-${lado === 'IZQUIERDA' ? 'I' : 'D'}-${Date.now().toString(36).toUpperCase()}`

    const media = await db.mediaRes.create({
      data: {
        romaneoId,
        lado: lado === 'IZQUIERDA' ? 'IZQUIERDA' : 'DERECHA',
        peso: parseFloat(peso),
        sigla: sigla || 'A',
        codigo,
        camaraId,
        estado: camaraId ? 'EN_CAMARA' : 'EN_CAMARA'
      },
      include: {
        romaneo: true,
        camara: true
      }
    })

    // Actualizar stock de la cámara
    if (camaraId) {
      const tropaCod = romaneo?.tropaCodigo || tropaCodigo
      const especie = tropaCod?.startsWith('B') ? 'BOVINO' : 'EQUINO'
      
      await actualizarStockCamara(camaraId, tropaCod, especie, 1, parseFloat(peso))
    }

    return NextResponse.json({
      success: true,
      data: {
        id: media.id,
        codigo: media.codigo,
        lado: media.lado,
        peso: media.peso,
        sigla: media.sigla,
        estado: media.estado,
        camara: media.camara
      }
    })
  } catch (error) {
    console.error('Error creating media res:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear media res' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar media res (mover cámara, cambiar estado)
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, camaraId, estado } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const mediaActual = await db.mediaRes.findUnique({
      where: { id },
      include: { romaneo: true }
    })

    const updateData: Record<string, unknown> = {}
    if (camaraId !== undefined) updateData.camaraId = camaraId
    if (estado !== undefined) updateData.estado = estado

    const media = await db.mediaRes.update({
      where: { id },
      data: updateData
    })

    // Si cambió de cámara, actualizar stocks
    if (mediaActual && camaraId && camaraId !== mediaActual.camaraId) {
      const tropaCodigo = mediaActual.romaneo?.tropaCodigo
      const especie = tropaCodigo?.startsWith('B') ? 'BOVINO' : 'EQUINO'
      
      // Restar de cámara anterior
      if (mediaActual.camaraId) {
        await actualizarStockCamara(mediaActual.camaraId, tropaCodigo, especie, -1, -(mediaActual.peso || 0))
      }
      // Sumar a nueva cámara
      await actualizarStockCamara(camaraId, tropaCodigo, especie, 1, mediaActual.peso || 0)
    }

    return NextResponse.json({ success: true, data: media })
  } catch (error) {
    console.error('Error updating media res:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar media res' },
      { status: 500 }
    )
  }
}

// Función auxiliar para actualizar stock
async function actualizarStockCamara(
  camaraId: string, 
  tropaCodigo: string | null | undefined, 
  especie: string, 
  cantidad: number, 
  peso: number
) {
  const tropa = tropaCodigo || null
  
  try {
    const existente = await db.stockMediaRes.findUnique({
      where: {
        camaraId_tropaCodigo_especie: {
          camaraId,
          tropaCodigo: tropa!,
          especie: especie as 'BOVINO' | 'EQUINO'
        }
      }
    })

    if (existente) {
      await db.stockMediaRes.update({
        where: { id: existente.id },
        data: {
          cantidad: existente.cantidad + cantidad,
          pesoTotal: existente.pesoTotal + peso
        }
      })
    } else if (cantidad > 0) {
      await db.stockMediaRes.create({
        data: {
          camaraId,
          tropaCodigo: tropa,
          especie: especie as 'BOVINO' | 'EQUINO',
          cantidad,
          pesoTotal: peso
        }
      })
    }
  } catch (error) {
    console.error('Error actualizando stock cámara:', error)
  }
}
