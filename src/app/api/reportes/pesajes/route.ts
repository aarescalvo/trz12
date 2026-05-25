import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const tipo = searchParams.get('tipo')
    const estado = searchParams.get('estado')

    if (!desde || !hasta) {
      return NextResponse.json({ success: false, error: 'Fechas requeridas' }, { status: 400 })
    }

    const fechaDesde = new Date(desde)
    const fechaHasta = new Date(hasta)
    fechaHasta.setHours(23, 59, 59, 999)

    // Build where clause
    const where: Record<string, unknown> = {
      fecha: {
        gte: fechaDesde,
        lte: fechaHasta
      }
    }
    if (tipo && tipo !== 'todas') where.tipo = tipo
    if (estado && estado !== 'todas') where.estado = estado

    // Get pesajes
    const pesajes = await db.pesajeCamion.findMany({
      where,
      include: {
        transportista: true,
        tropa: true
      },
      orderBy: { fecha: 'desc' }
    })

    // Build response data
    const datos = pesajes.map(pesaje => ({
      id: pesaje.id,
      numeroTicket: pesaje.numeroTicket,
      tipo: pesaje.tipo,
      estado: pesaje.estado,
      patenteChasis: pesaje.patenteChasis,
      patenteAcoplado: pesaje.patenteAcoplado,
      choferNombre: pesaje.choferNombre,
      choferDni: pesaje.choferDni,
      transportista: pesaje.transportista?.nombre || null,
      pesoBruto: pesaje.pesoBruto,
      pesoTara: pesaje.pesoTara,
      pesoNeto: pesaje.pesoNeto,
      tropaCodigo: pesaje.tropa?.codigo || null,
      destino: pesaje.destino,
      remito: pesaje.remito,
      fecha: pesaje.fecha.toISOString().split('T')[0],
      fechaTara: pesaje.fechaTara?.toISOString().split('T')[0] || null
    }))

    // Calculate summary
    const resumen = {
      totalPesajes: datos.length,
      totalPesoNeto: datos.reduce((sum, p) => sum + (p.pesoNeto || 0), 0),
      ingresosHacienda: datos.filter(p => p.tipo === 'INGRESO_HACIENDA').length,
      pesajesParticulares: datos.filter(p => p.tipo === 'PESAJE_PARTICULAR').length,
      salidasMercaderia: datos.filter(p => p.tipo === 'SALIDA_MERCADERIA').length,
      abiertos: datos.filter(p => p.estado === 'ABIERTO').length,
      cerrados: datos.filter(p => p.estado === 'CERRADO').length
    }

    return NextResponse.json({ success: true, data: datos, resumen })
  } catch (error) {
    console.error('Error en reporte pesajes:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
