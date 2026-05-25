import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// POST - Inicializar tipos de servicio por defecto
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const tiposDefault = [
      { codigo: 'FAENA', nombre: 'Servicio de Faena x Kg', unidad: 'KG', seFactura: true, porcentajeIva: 10.5, orden: 1, descripcion: 'Servicio de faena por kilogramo de res' },
      { codigo: 'EMBOLSADO_VACIO', nombre: 'Embolsado al Vacío x Kg', unidad: 'KG', seFactura: true, porcentajeIva: 21, orden: 2, descripcion: 'Empaque al vacío de productos' },
      { codigo: 'DESHUESADO', nombre: 'Despostado con Hueso x kg', unidad: 'KG', seFactura: true, porcentajeIva: 21, orden: 3, descripcion: 'Corte con hueso incluido' },
      { codigo: 'CUERO_UN', nombre: 'Cuero por Unidad', unidad: 'UN', seFactura: true, porcentajeIva: 21, orden: 4, descripcion: 'Venta de cuero por unidad' },
      { codigo: 'CUERO_KG', nombre: 'Cuero por Kg', unidad: 'KG', seFactura: true, porcentajeIva: 21, orden: 5, descripcion: 'Venta de cuero por kilogramo' },
      { codigo: 'MENUDENCIA', nombre: 'Menudencias', unidad: 'KG', seFactura: true, porcentajeIva: 21, orden: 6, descripcion: 'Menudencias varias' },
      { codigo: 'FAENA_INCLUIDO', nombre: 'Faena con Subproductos Incluidos', unidad: 'KG', seFactura: false, incluidoEn: 'FAENA', porcentajeIva: 10.5, orden: 0, descripcion: 'Precio incluye subproductos' },
    ]

    const creados: any[] = []

    for (const tipo of tiposDefault) {
      const existente = await db.tipoServicio.findUnique({
        where: { codigo: tipo.codigo }
      })

      if (!existente) {
        const nuevo = await db.tipoServicio.create({
          data: tipo
        })
        creados.push(nuevo)
      }
    }

    return NextResponse.json({
      success: true,
      creados: creados.length,
      message: creados.length > 0 
        ? `Se crearon ${creados.length} tipos de servicio` 
        : 'Todos los tipos de servicio ya existen'
    })
  } catch (error) {
    console.error('Error inicializando tipos servicio:', error)
    return NextResponse.json(
      { success: false, error: 'Error al inicializar tipos de servicio' },
      { status: 500 }
    )
  }
}
