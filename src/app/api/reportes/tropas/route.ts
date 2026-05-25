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
    const especie = searchParams.get('especie')
    const estado = searchParams.get('estado')

    if (!desde || !hasta) {
      return NextResponse.json({ success: false, error: 'Fechas requeridas' }, { status: 400 })
    }

    const fechaDesde = new Date(desde)
    const fechaHasta = new Date(hasta)
    fechaHasta.setHours(23, 59, 59, 999)

    // Build where clause
    const where: Record<string, unknown> = {
      fechaRecepcion: {
        gte: fechaDesde,
        lte: fechaHasta
      }
    }
    if (especie && especie !== 'todas') where.especie = especie
    if (estado && estado !== 'todas') where.estado = estado

    // Get tropas
    const tropas = await db.tropa.findMany({
      where,
      include: {
        productor: true,
        usuarioFaena: true,
        corral: true,
        animales: {
          include: {
            pesajeIndividual: true
          }
        }
      },
      orderBy: { fechaRecepcion: 'desc' }
    })

    // Build response data
    const datos = tropas.map(tropa => {
      const animalesPesados = tropa.animales.filter(a => a.pesoVivo !== null).length
      const animalesFaenados = tropa.animales.filter(a => a.estado === 'FAENADO' || a.estado === 'EN_CAMARA').length
      
      const pesoPromedioAnimal = tropa.pesoNeto && tropa.cantidadCabezas
        ? tropa.pesoNeto / tropa.cantidadCabezas
        : null

      return {
        id: tropa.id,
        codigo: tropa.codigo,
        especie: tropa.especie,
        estado: tropa.estado,
        cantidadCabezas: tropa.cantidadCabezas,
        pesoBruto: tropa.pesoBruto,
        pesoTara: tropa.pesoTara,
        pesoNeto: tropa.pesoNeto,
        pesoPromedioAnimal,
        productor: tropa.productor?.nombre || null,
        usuarioFaena: tropa.usuarioFaena.nombre,
        corral: tropa.corral?.nombre || null,
        dte: tropa.dte,
        guia: tropa.guia,
        fechaRecepcion: tropa.fechaRecepcion.toISOString().split('T')[0],
        animalesPesados,
        animalesFaenados
      }
    })

    // Calculate summary
    const resumen = {
      totalTropas: datos.length,
      totalCabezas: datos.reduce((sum, t) => sum + t.cantidadCabezas, 0),
      totalPesoNeto: datos.reduce((sum, t) => sum + (t.pesoNeto || 0), 0),
      pesoPromedio: datos.length > 0
        ? datos.reduce((sum, t) => sum + (t.pesoNeto || 0), 0) / datos.reduce((sum, t) => sum + t.cantidadCabezas, 0)
        : 0,
      recibidas: datos.filter(t => t.estado === 'RECIBIDO' || t.estado === 'EN_CORRAL').length,
      enProceso: datos.filter(t => ['EN_PESAJE', 'PESADO', 'LISTO_FAENA', 'EN_FAENA'].includes(t.estado)).length,
      finalizadas: datos.filter(t => t.estado === 'FAENADO' || t.estado === 'DESPACHADO').length
    }

    return NextResponse.json({ success: true, data: datos, resumen })
  } catch (error) {
    console.error('Error en reporte tropas:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
