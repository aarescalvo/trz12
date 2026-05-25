import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener medias reses por vencer/vencidas
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const diasAlerta = parseInt(searchParams.get('diasAlerta') || '7')
    const estado = searchParams.get('estado') // 'proximos', 'vencidos', 'todos'

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    const fechaAlerta = new Date(hoy)
    fechaAlerta.setDate(fechaAlerta.getDate() + diasAlerta)

    // Construir filtro
     
    const where: any = {
      estado: 'EN_CAMARA' // Solo medias reses en cámara
    }

    if (estado === 'vencidos') {
      // Ya vencidos
      where.fechaVencimiento = { lt: hoy }
    } else if (estado === 'proximos') {
      // Próximos a vencer (dentro del rango de alerta)
      where.fechaVencimiento = {
        gte: hoy,
        lte: fechaAlerta
      }
    } else {
      // Todos (vencidos + próximos)
      where.fechaVencimiento = { lte: fechaAlerta }
    }

    const mediasRes = await db.mediaRes.findMany({
      where,
      include: {
        romaneo: {
          include: {
            tipificador: true
          }
        },
        camara: true,
        usuarioFaena: true
      },
      orderBy: {
        fechaIngreso: 'asc'
      } as Prisma.MediaResOrderByWithRelationInput
    })

    // Calcular días restantes para cada media res
    const mediasConDias = mediasRes.map((mr) => {
      const mrExt = mr as typeof mr & { fechaVencimiento?: Date | null }
      const fechaVenc = mrExt.fechaVencimiento ? new Date(mrExt.fechaVencimiento) : null
      const diasRestantes = fechaVenc 
        ? Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
        : null

      return {
        ...mr,
        diasRestantes,
        estadoVencimiento: diasRestantes === null 
          ? 'SIN_FECHA' 
          : diasRestantes < 0 
            ? 'VENCIDO' 
            : diasRestantes <= diasAlerta 
              ? 'PROXIMO' 
              : 'OK'
      }
    })

    // Estadísticas
    const stats = {
      total: mediasConDias.length,
      vencidos: mediasConDias.filter(m => m.estadoVencimiento === 'VENCIDO').length,
      proximos: mediasConDias.filter(m => m.estadoVencimiento === 'PROXIMO').length,
      sinFecha: mediasConDias.filter(m => m.estadoVencimiento === 'SIN_FECHA').length,
      pesoTotalVencidos: mediasConDias
        .filter(m => m.estadoVencimiento === 'VENCIDO')
        .reduce((sum, m) => sum + m.peso, 0),
      pesoTotalProximos: mediasConDias
        .filter(m => m.estadoVencimiento === 'PROXIMO')
        .reduce((sum, m) => sum + m.peso, 0)
    }

    return NextResponse.json({
      success: true,
      data: mediasConDias,
      stats
    })
  } catch (error) {
    console.error('Error fetching vencimientos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener vencimientos' },
      { status: 500 }
    )
  }
}

// POST - Actualizar fecha de vencimiento de una media res
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json()
    const { mediaResId, diasVencimiento, fechaVencimiento } = body

    const mediaRes = await db.mediaRes.update({
      where: { id: mediaResId },
      data: {
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null
      } as Prisma.MediaResUncheckedUpdateInput
    })

    return NextResponse.json({
      success: true,
      data: mediaRes,
      message: 'Fecha de vencimiento actualizada'
    })
  } catch (error) {
    console.error('Error updating vencimiento:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar vencimiento' },
      { status: 500 }
    )
  }
}
