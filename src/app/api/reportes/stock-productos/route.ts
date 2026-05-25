import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const camaraId = searchParams.get('camaraId')

    // Stock de medias reses por cámara
    const mediasRes = await db.mediaRes.findMany({
      where: {
        estado: 'EN_CAMARA',
        ...(camaraId && { camaraId }),
      },
      include: {
        romaneo: { select: { tropaCodigo: true, garron: true, tipoAnimal: true } },
        camara: { select: { nombre: true, tipo: true } },
        usuarioFaena: { select: { nombre: true } },
      },
    })

    // Stock por cámara
    const camaras = await db.camara.findMany({ where: { activo: true } })
    const stockPorCamara = await Promise.all(camaras.map(async camara => {
      const medias = await db.mediaRes.findMany({
        where: { camaraId: camara.id, estado: 'EN_CAMARA' },
        select: { peso: true, sigla: true },
      })
      return {
        camara: camara.nombre,
        tipo: camara.tipo,
        totalMedias: medias.length,
        pesoTotal: medias.reduce((s, m) => s + m.peso, 0),
        capacidad: camara.capacidad,
        ocupacion: camara.capacidad > 0 ? Number(((medias.length / camara.capacidad) * 100).toFixed(1)) : 0,
      }
    }))

    // Stock por tropa
    const stockPorTropa = mediasRes.reduce((acc, m) => {
      const tropa = m.romaneo?.tropaCodigo || 'SIN_TROPA'
      if (!acc[tropa]) acc[tropa] = { tropaCodigo: tropa, cantidad: 0, pesoTotal: 0 }
      acc[tropa].cantidad++
      acc[tropa].pesoTotal += m.peso
      return acc
    }, {} as Record<string, { tropaCodigo: string; cantidad: number; pesoTotal: number }>)

    return NextResponse.json({
      success: true,
      data: {
        stockPorCamara,
        stockPorTropa: Object.values(stockPorTropa),
        totalMedias: mediasRes.length,
        pesoTotal: mediasRes.reduce((s, m) => s + m.peso, 0),
      },
    })
  } catch (error) {
    console.error('Error en stock productos:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
