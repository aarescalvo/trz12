import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'
import { createLogger } from '@/lib/logger'

const logger = createLogger('API:StockVencimientos')

// GET - Control de vencimientos de stock
export async function GET(request: NextRequest) {
  try {
    const authError = await checkPermission(request, 'puedeStock')
    if (authError) return authError

    const hoy = new Date()
    const items: Array<{
      id: string
      tipo: string
      codigo: string
      producto: string
      peso: number
      fechaIngreso: string
      fechaVencimiento: string
      diasRestantes: number
      camara?: string
      prioridad: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA'
    }> = []

    // Medias de res en cámara
    const medias = await db.mediaRes.findMany({
      where: { estado: 'EN_CAMARA' },
      include: { camara: { select: { nombre: true } } }
    })

    for (const media of medias) {
      // Calcular días en cámara
      const ingresoDate = media.createdAt
      const diasEnCamara = Math.floor((hoy.getTime() - new Date(ingresoDate).getTime()) / (1000 * 60 * 60 * 24))
      // Vencimiento estimado: 30 días desde ingreso a cámara (configurable)
      const diasVencimiento = 30
      const diasRestantes = diasVencimiento - diasEnCamara

      let prioridad: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA'
      if (diasRestantes <= 7) prioridad = 'CRITICA'
      else if (diasRestantes <= 15) prioridad = 'ALTA'
      else if (diasRestantes <= 25) prioridad = 'MEDIA'
      else prioridad = 'BAJA'

      const fechaVencimiento = new Date(new Date(ingresoDate).getTime() + diasVencimiento * 24 * 60 * 60 * 1000)

      items.push({
        id: media.id,
        tipo: 'MEDIA_RES',
        codigo: media.codigo || media.id.slice(0, 8),
        producto: `Media Res ${media.lado || ''} - Bovino`,
        peso: media.peso || 0,
        fechaIngreso: ingresoDate instanceof Date ? ingresoDate.toISOString() : new Date(ingresoDate).toISOString(),
        fechaVencimiento: fechaVencimiento.toISOString(),
        diasRestantes,
        camara: media.camara?.nombre,
        prioridad
      })
    }

    // Cajas de empaque disponibles
    const cajas = await db.cajaEmpaque.findMany({
      where: { estado: 'ARMADA' },
      include: { producto: { select: { nombre: true } } }
    })

    for (const caja of cajas) {
      const diasEnStock = Math.floor((hoy.getTime() - new Date(caja.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      // Vencimiento estimado para productos procesados: 90 días
      const diasVencimiento = 90
      const diasRestantes = diasVencimiento - diasEnStock

      let prioridad: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA'
      if (diasRestantes <= 7) prioridad = 'CRITICA'
      else if (diasRestantes <= 15) prioridad = 'ALTA'
      else if (diasRestantes <= 30) prioridad = 'MEDIA'
      else prioridad = 'BAJA'

      const fechaVencimiento = new Date(new Date(caja.createdAt).getTime() + diasVencimiento * 24 * 60 * 60 * 1000)

      items.push({
        id: caja.id,
        tipo: 'CAJA',
        codigo: caja.codigoBarras || caja.id.slice(0, 8),
        producto: caja.producto?.nombre || 'Caja Empaque',
        peso: caja.pesoNeto || 0,
        fechaIngreso: caja.createdAt.toISOString(),
        fechaVencimiento: fechaVencimiento.toISOString(),
        diasRestantes,
        camara: 'Depósito',
        prioridad
      })
    }

    // Ordenar por días restantes (más urgentes primero)
    items.sort((a, b) => a.diasRestantes - b.diasRestantes)

    return NextResponse.json({
      success: true,
      data: items
    })
  } catch (error) {
    logger.error('Error en control de vencimientos', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener vencimientos' },
      { status: 500 }
    )
  }
}
