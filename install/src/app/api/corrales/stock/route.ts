import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Obtener todos los corrales
    const corrales = await db.corral.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    })

    // Obtener tropas en corrales con estados activos
    const tropasEnCorrales = await db.tropa.findMany({
      where: {
        estado: { in: ['RECIBIDO', 'EN_CORRAL', 'EN_PESAJE', 'PESADO', 'LISTO_FAENA'] },
        corralId: { not: null }
      },
      include: {
        productor: {
          select: { nombre: true }
        },
        usuarioFaena: {
          select: { nombre: true }
        }
      }
    })

    // Calcular stock por corral
    const stockPorCorral: Record<string, { bovinos: number; equinos: number; tropas: typeof tropasEnCorrales }> = {}
    
    for (const tropa of tropasEnCorrales) {
      if (!tropa.corralId) continue
      
      if (!stockPorCorral[tropa.corralId]) {
        stockPorCorral[tropa.corralId] = { bovinos: 0, equinos: 0, tropas: [] }
      }
      
      if (tropa.especie === 'BOVINO') {
        stockPorCorral[tropa.corralId].bovinos += tropa.cantidadCabezas
      } else if (tropa.especie === 'EQUINO') {
        stockPorCorral[tropa.corralId].equinos += tropa.cantidadCabezas
      }
      
      stockPorCorral[tropa.corralId].tropas.push(tropa)
    }

    // Mapear los datos
    const stockData = corrales.map(corral => {
      const stock = stockPorCorral[corral.id] || { bovinos: 0, equinos: 0, tropas: [] }
      
      return {
        id: corral.id,
        nombre: corral.nombre,
        capacidad: corral.capacidad,
        stockBovinos: stock.bovinos,
        stockEquinos: stock.equinos,
        activo: corral.activo,
        tropas: stock.tropas.map(t => ({
          id: t.id,
          codigo: t.codigo,
          especie: t.especie,
          cantidadCabezas: t.cantidadCabezas,
          estado: t.estado,
          productor: t.productor,
          usuarioFaena: t.usuarioFaena,
          fechaRecepcion: t.fechaRecepcion.toISOString()
        }))
      }
    })

    return NextResponse.json({
      success: true,
      data: stockData
    })
  } catch (error) {
    console.error('Error fetching corrales stock:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener stock de corrales' },
      { status: 500 }
    )
  }
}
