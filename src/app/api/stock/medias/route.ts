import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Get stock data
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    // Get stock by camera
    const stock = await db.stockMediaRes.findMany({
      include: {
        camara: {
          select: { id: true, nombre: true, tipo: true, capacidad: true }
        }
      },
      orderBy: { fechaIngreso: 'desc' }
    })

    // Get medias res with details
    const mediasRes = await db.mediaRes.findMany({
      where: {
        estado: { in: ['EN_CAMARA', 'EN_CUARTEO'] }
      },
      include: {
        camara: { select: { nombre: true } },
        romaneo: {
          select: {
            garron: true,
            tropaCodigo: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    // Format stock data
    const stockData = stock.map(s => ({
      id: s.id,
      camaraId: s.camaraId,
      camaraNombre: s.camara.nombre,
      tropaCodigo: s.tropaCodigo,
      especie: s.especie,
      cantidad: s.cantidad,
      pesoTotal: s.pesoTotal,
      fechaIngreso: s.fechaIngreso
    }))

    // Format medias res data
    const mediasData = mediasRes.map(m => ({
      id: m.id,
      codigo: m.codigo,
      lado: m.lado,
      sigla: m.sigla,
      peso: m.peso,
      estado: m.estado,
      romaneo: m.romaneo,
      camara: m.camara
    }))

    return NextResponse.json({
      success: true,
      data: stockData,
      mediasRes: mediasData
    })
  } catch (error) {
    console.error('Error fetching stock:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener stock' },
      { status: 500 }
    )
  }
}
