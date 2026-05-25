import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'
import { createLogger } from '@/lib/logger'

const logger = createLogger('API:ReportesInsumos')

// GET - Reporte de Consumo de Insumos
export async function GET(request: NextRequest) {
  try {
    const authError = await checkPermission(request, 'puedeReportes')
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria') || 'todas'

    // Obtener insumos activos con stock
    const where: any = { activo: true }
    if (categoria !== 'todas') {
      where.categoria = categoria
    }

    const insumos = await db.insumo.findMany({
      where,
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
    })

    const detalles = insumos.map(i => ({
      id: i.id,
      nombre: i.nombre,
      codigo: i.codigo,
      categoria: i.categoria,
      stockActual: i.stockActual,
      stockMinimo: i.stockMinimo,
      stockMaximo: i.stockMaximo,
      unidadMedida: i.unidadMedida,
      precioUnitario: i.precioUnitario,
      ubicacion: i.ubicacion,
      proveedorNombre: i.proveedorNombre,
      alerta: i.stockActual <= i.stockMinimo,
    }))

    // Calcular resumen
    const totalInsumos = detalles.length
    const alertas = detalles.filter(d => d.alerta).length
    const valorTotal = detalles.reduce(
      (sum, d) => sum + (d.stockActual * (d.precioUnitario || 0)),
      0
    )

    return NextResponse.json({
      success: true,
      data: {
        detalles,
        resumen: {
          totalInsumos,
          alertas,
          valorTotal: Math.round(valorTotal * 100) / 100,
        },
      },
    })
  } catch (error) {
    logger.error('Error en reporte de insumos', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar reporte de insumos' },
      { status: 500 }
    )
  }
}
