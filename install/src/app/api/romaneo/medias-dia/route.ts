import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener medias reses pesadas del día
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')
    
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    const fechaFiltro = fecha ? new Date(fecha) : hoy

    // Buscar medias del día con su romaneo
    const medias = await db.mediaRes.findMany({
      where: {
        createdAt: {
          gte: fechaFiltro,
          lt: new Date(fechaFiltro.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        romaneo: {
          include: {
            tipificador: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Formatear respuesta
    const data = medias.map(m => ({
      id: m.id,
      garron: m.romaneo.garron,
      lado: m.lado,
      peso: m.peso,
      siglas: ['A', 'T', 'D'],
      fecha: m.createdAt,
      tropaCodigo: m.romaneo.tropaCodigo,
      tipoAnimal: m.romaneo.tipoAnimal?.toString() || null
    }))

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Error obteniendo medias del día:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener medias' },
      { status: 500 }
    )
  }
}
