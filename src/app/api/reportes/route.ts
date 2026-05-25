import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Especie, EstadoTropa } from '@prisma/client'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener datos de reportes con filtros avanzados
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    
    // Filtros principales
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const tipo = searchParams.get('tipo') || 'todos'
    
    // Filtros avanzados
    const tropaCodigo = searchParams.get('tropaCodigo')
    const fechaFaena = searchParams.get('fechaFaena')
    const clienteId = searchParams.get('clienteId')
    const tipificadorId = searchParams.get('tipificadorId')
    const corralId = searchParams.get('corralId')
    const estado = searchParams.get('estado')

    // Construir filtros de fecha
    const dateFilter: Record<string, Date> = {}
    if (fechaDesde) {
      dateFilter.gte = new Date(fechaDesde)
    }
    if (fechaHasta) {
      const hasta = new Date(fechaHasta)
      hasta.setHours(23, 59, 59, 999)
      dateFilter.lte = hasta
    }

    // Filtro de fecha específica de faena
    const fechaFaenaFilter: Record<string, unknown> = {}
    if (fechaFaena) {
      const fechaFaenaDate = new Date(fechaFaena)
      fechaFaenaFilter.gte = new Date(fechaFaenaDate.setHours(0, 0, 0, 0))
      fechaFaenaFilter.lte = new Date(fechaFaenaDate.setHours(23, 59, 59, 999))
    }

    // Construir where clause para romaneos
    // Romaneo doesn't have a tropa relation - it has tropaCodigo as a string field
    const whereClause: Record<string, unknown> = {
      ...(Object.keys(dateFilter).length > 0 && { fecha: dateFilter }),
      ...(Object.keys(fechaFaenaFilter).length > 0 && { fecha: fechaFaenaFilter })
    }
    
    if (tipificadorId) {
      whereClause.tipificadorId = tipificadorId
    }

    const romaneos = await db.romaneo.findMany({
      where: whereClause,
      include: {
        tipificador: true,
      },
      orderBy: { fecha: 'desc' },
      take: 500
     
    }) as Array<any>

    // RESUMEN - Estadísticas generales
    const totalAnimalesFaenados = romaneos.length
    const totalPesoVivo = romaneos.reduce((acc, r) => acc + (r.pesoVivo || 0), 0)
    const totalPesoCanal = romaneos.reduce((acc, r) => acc + (r.pesoTotal || 0), 0)
    const pesoMedias = romaneos.reduce((acc, r) => {
      return acc + (r.pesoMediaIzq || 0) + (r.pesoMediaDer || 0)
    }, 0)
    const rindePromedio = totalPesoVivo > 0 ? (totalPesoCanal / totalPesoVivo) * 100 : 0
    const rindeMedias = pesoMedias > 0 && totalPesoVivo > 0 ? (pesoMedias / totalPesoVivo) * 100 : 0

    // Agrupar por fecha
    const faenaDiaria = romaneos.reduce((acc, romaneo) => {
      const fecha = new Date(romaneo.fecha).toISOString().split('T')[0]
      const existente = acc.find(d => d.fecha === fecha)
      
      if (existente) {
        existente.totalAnimales++
        existente.totalMedias += (romaneo.pesoMediaIzq ? 1 : 0) + (romaneo.pesoMediaDer ? 1 : 0)
        existente.pesoTotal += romaneo.pesoTotal || 0
      } else {
        acc.push({
          fecha,
          totalAnimales: 1,
          totalMedias: (romaneo.pesoMediaIzq ? 1 : 0) + (romaneo.pesoMediaDer ? 1 : 0),
          pesoTotal: romaneo.pesoTotal || 0
        })
      }
      
      return acc
    }, [] as { fecha: string; totalAnimales: number; totalMedias: number; pesoTotal: number }[])

    // Agrupar por tropa (RESUMEN)
    const rendimientoPorTropa = romaneos.reduce((acc, r) => {
      const codigo = r.tropaCodigo || 'SIN TROPA'
      const existente = acc.find(a => a.tropaCodigo === codigo)
      
      if (existente) {
        existente.cantidad++
        existente.pesoVivo += r.pesoVivo || 0
        existente.pesoFaena += r.pesoTotal || 0
      } else {
        acc.push({
          tropaCodigo: codigo,
          productor: '-',
          cantidad: 1,
          pesoVivo: r.pesoVivo || 0,
          pesoFaena: r.pesoTotal || 0,
          tipoAnimal: r.tipoAnimal || '-',
          rinde: r.pesoVivo && r.pesoTotal ? (r.pesoTotal / r.pesoVivo) * 100 : 0
        })
      }
      return acc
    }, [] as { tropaCodigo: string; productor: string; cantidad: number; pesoVivo: number; pesoFaena: number; tipoAnimal: string; rinde: number }[])

    // Calcular rinde por tropa
    rendimientoPorTropa.forEach(t => {
      t.rinde = t.pesoVivo > 0 ? (t.pesoFaena / t.pesoVivo) * 100 : 0
    })

    // Agrupar por tipificador
    const rendimientoPorTipificador = romaneos.reduce((acc, r) => {
      const nombre = r.tipificador?.nombre || 'SIN TIPIFICADOR'
      const existente = acc.find(a => a.nombre === nombre)
      
      if (existente) {
        existente.cantidad++
        existente.pesoVivo += r.pesoVivo || 0
        existente.pesoFaena += r.pesoTotal || 0
      } else {
        acc.push({
          nombre,
          cantidad: 1,
          pesoVivo: r.pesoVivo || 0,
          pesoFaena: r.pesoTotal || 0,
          rinde: r.pesoVivo && r.pesoTotal ? (r.pesoTotal / r.pesoVivo) * 100 : 0
        })
      }
      return acc
    }, [] as { nombre: string; cantidad: number; pesoVivo: number; pesoFaena: number; rinde: number }[])

    rendimientoPorTipificador.forEach(t => {
      t.rinde = t.pesoVivo > 0 ? (t.pesoFaena / t.pesoVivo) * 100 : 0
    })

    // Detalle - Lista completa de romaneos
    const detalleFaena = romaneos.map(r => ({
      id: r.id,
      fecha: new Date(r.fecha).toISOString(),
      tropaCodigo: r.tropaCodigo,
      garron: r.garron,
      tipoAnimal: r.tipoAnimal,
      pesoVivo: r.pesoVivo,
      pesoTotal: r.pesoTotal,
      pesoMediaIzq: r.pesoMediaIzq,
      pesoMediaDer: r.pesoMediaDer,
      rinde: r.rinde || (r.pesoVivo && r.pesoTotal ? (r.pesoTotal / r.pesoVivo) * 100 : 0),
      tipificador: r.tipificador?.nombre,
      estado: r.estado
    }))

    // Reporte de Rendimiento por Tropa (completo)
    // Build tropa where clause with proper types
    const tropaWhere: Record<string, unknown> = {}
    if (tipo !== 'todos') {
      tropaWhere.especie = tipo.toUpperCase() as Especie
    }
    if (tropaCodigo) {
      tropaWhere.codigo = { contains: tropaCodigo.toUpperCase() }
    }
    if (clienteId) {
      tropaWhere.productorId = clienteId
    }
    if (estado) {
      tropaWhere.estado = estado as EstadoTropa
    }

    const tropasConRomaneo = await db.tropa.findMany({
      where: tropaWhere,
      include: {
        productor: true,
        corral: true,
        tiposAnimales: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
     
    }) as Array<any>

    // Obtener todos los romaneos que corresponden a estas tropas para calcular pesos reales
    const tropaCodigos = tropasConRomaneo.map((t: any) => t.codigo as string)
    const romaneosTropas = await db.romaneo.findMany({
      where: {
        tropaCodigo: { in: tropaCodigos }
      },
      select: {
        tropaCodigo: true,
        pesoVivo: true,
        pesoTotal: true
      }
    })

    // Agrupar romaneos por tropaCodigo
    const romaneosPorTropa = romaneosTropas.reduce((acc, r) => {
      const codigo = r.tropaCodigo || 'SIN_CODIGO'
      if (!acc[codigo]) {
        acc[codigo] = { pesoVivo: 0, pesoFaena: 0 }
      }
      acc[codigo].pesoVivo += r.pesoVivo || 0
      acc[codigo].pesoFaena += r.pesoTotal || 0
      return acc
    }, {} as Record<string, { pesoVivo: number; pesoFaena: number }>)

    const rendimientos = tropasConRomaneo.map(tropa => {
      const romaneoData = romaneosPorTropa[tropa.codigo] || { pesoVivo: 0, pesoFaena: 0 }
      
      // Usar pesos desde romaneos si existen, sino usar pesos del pesaje
      const pesoVivoTotal = romaneoData.pesoVivo > 0 
        ? romaneoData.pesoVivo 
        : (tropa.pesoNeto || tropa.pesoTotalIndividual || 0)
      
      const pesoFaenaTotal = romaneoData.pesoFaena > 0 
        ? romaneoData.pesoFaena 
        : (pesoVivoTotal * 0.52)
      
      const rinde = pesoVivoTotal > 0 ? (pesoFaenaTotal / pesoVivoTotal) * 100 : 0
      const cantidadFaenada = tropa.cantidadCabezas

      return {
        tropaCodigo: tropa.codigo,
        especie: tropa.especie,
        productor: tropa.productor ? { nombre: tropa.productor.nombre, cuit: tropa.productor.cuit } : null,
        cantidad: cantidadFaenada,
        pesoVivoTotal: Number(pesoVivoTotal.toFixed(2)),
        pesoFaenaTotal: Number(pesoFaenaTotal.toFixed(2)),
        reine: Number(rinde.toFixed(2)),
        corral: tropa.corral?.nombre,
        estado: tropa.estado,
        fechaRecepcion: tropa.fechaRecepcion
      }
    })

    // Reporte de Stock por Cámara
    const camaras = await db.camara.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    })

    const stockCamaras = await Promise.all(camaras.map(async camara => {
      const mediasCount = await db.mediaRes.count({
        where: { 
          camaraId: camara.id,
          estado: 'EN_CAMARA'
        }
      })
      
      const medias = await db.mediaRes.findMany({
        where: { 
          camaraId: camara.id,
          estado: 'EN_CAMARA'
        },
        select: { peso: true }
      })

      const pesoTotal = medias.reduce((acc, m) => acc + (m.peso || 0), 0)

      return {
        camara: camara.nombre,
        tipo: camara.tipo,
        capacidad: camara.capacidad,
        totalMedias: mediasCount,
        pesoTotal,
        ocupacionPorc: camara.capacidad > 0 ? Number(((mediasCount / camara.capacidad) * 100).toFixed(1)) : 0
      }
    }))

    return NextResponse.json({
      success: true,
      data: {
        // Resumen general
        resumen: {
          totalAnimalesFaenados,
          totalPesoVivo,
          totalPesoCanal,
          pesoMedias,
          rindePromedio: Number(rindePromedio.toFixed(2)),
          rindeMedias: Number(rindeMedias.toFixed(2)),
          tropasProcesadas: rendimientoPorTropa.length,
          tipificadoresActivos: rendimientoPorTipificador.length
        },
        // Faena por fecha
        faenaDiaria,
        // Rendimiento por tropa
        rendimientoPorTropa,
        // Rendimiento por tipificador
        rendimientoPorTipificador,
        // Detalle completo
        detalleFaena,
        // Rendimientos completos
        rendimientos,
        // Stock
        stockCamaras,
        // Filtros aplicados
        filtrosAplicados: {
          fechaDesde,
          fechaHasta,
          tipo,
          tropaCodigo,
          fechaFaena,
          clienteId,
          tipificadorId,
          corralId,
          estado
        }
      }
    })
  } catch (error) {
    console.error('Error fetching reportes:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener reportes: ' + String(error) },
      { status: 500 }
    )
  }
}
