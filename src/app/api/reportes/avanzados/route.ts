import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { checkPermission } from '@/lib/auth-helpers'

// Tipos de reporte disponibles
type TipoReporte = 'produccion' | 'rinde-productor' | 'rinde-animal' | 'stock-camaras' | 'despachos' | 'curva-faena'

// Interfaces para tipar las respuestas
interface ProduccionDiaria {
  fecha: string
  kgFaenados: number
  cabezas: number
  rindePromedio: number
}

interface RindeProductor {
  productorId: string | null
  productorNombre: string
  totalCabezas: number
  totalKgVivo: number
  totalKgMedia: number
  rindePromedio: number
  posicion: number
}

interface RindeAnimal {
  tipoAnimal: string
  cantidad: number
  totalKgVivo: number
  totalKgMedia: number
  rindePromedio: number
  rindeMin: number
  rindeMax: number
}

interface StockCamara {
  camaraId: string
  camaraNombre: string
  tipoCamara: string
  totalPiezas: number
  totalKg: number
  capacidad: number
  porcentajeOcupacion: number
}

interface DespachoData {
  clienteId: string
  clienteNombre: string
  totalDespachos: number
  totalKg: number
  totalFacturado: number
}

interface CurvaFaena {
  dia: string
  diaNumero: number
  totalAnimales: number
  totalKg: number
  promedioDiario: number
}

interface KPIs {
  totalKgFaenados: number
  totalCabezas: number
  rindePromedio: number
  comparativaAnterior: {
    kgFaenadosDiff: number
    cabezasDiff: number
    rindeDiff: number
  }
}

// GET - Obtener datos de reportes avanzados
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const tipo = (searchParams.get('tipo') || 'produccion') as TipoReporte
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const especie = searchParams.get('especie')
    const productorId = searchParams.get('productor')

    // Construir filtros de fecha
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (fechaDesde) {
      dateFilter.gte = new Date(fechaDesde)
    }
    if (fechaHasta) {
      const hasta = new Date(fechaHasta)
      hasta.setHours(23, 59, 59, 999)
      dateFilter.lte = hasta
    }

    // Si no hay fechas, usar último mes
    if (Object.keys(dateFilter).length === 0) {
      const hoy = new Date()
      const haceUnMes = new Date(hoy)
      haceUnMes.setMonth(haceUnMes.getMonth() - 1)
      dateFilter.gte = haceUnMes
      dateFilter.lte = hoy
    }

    // Calcular período anterior para comparativa
    const fechaDesdeComparativa = new Date(dateFilter.gte!)
    fechaDesdeComparativa.setMonth(fechaDesdeComparativa.getMonth() - 1)
    const fechaHastaComparativa = new Date(dateFilter.lte!)
    fechaHastaComparativa.setMonth(fechaHastaComparativa.getMonth() - 1)

    let data: ProduccionDiaria[] | RindeProductor[] | RindeAnimal[] | StockCamara[] | DespachoData[] | CurvaFaena[] = []
    let kpis: KPIs = {
      totalKgFaenados: 0,
      totalCabezas: 0,
      rindePromedio: 0,
      comparativaAnterior: {
        kgFaenadosDiff: 0,
        cabezasDiff: 0,
        rindeDiff: 0
      }
    }

    switch (tipo) {
      case 'produccion':
        const produccionResult = await getProduccionDiaria(dateFilter, especie, productorId)
        data = produccionResult.data
        kpis = produccionResult.kpis
        // Calcular comparativa
        const kpisAnterior = await getKPIsPeriodo(fechaDesdeComparativa, fechaHastaComparativa, especie, productorId)
        if (kpisAnterior.totalKgFaenados > 0) {
          kpis.comparativaAnterior = {
            kgFaenadosDiff: ((kpis.totalKgFaenados - kpisAnterior.totalKgFaenados) / kpisAnterior.totalKgFaenados) * 100,
            cabezasDiff: ((kpis.totalCabezas - kpisAnterior.totalCabezas) / kpisAnterior.totalCabezas) * 100,
            rindeDiff: kpisAnterior.rindePromedio > 0 ? ((kpis.rindePromedio - kpisAnterior.rindePromedio) / kpisAnterior.rindePromedio) * 100 : 0
          }
        }
        break

      case 'rinde-productor':
        data = await getRindeProductor(dateFilter, especie)
        break

      case 'rinde-animal':
        data = await getRindeAnimal(dateFilter, especie)
        break

      case 'stock-camaras':
        data = await getStockCamaras(especie)
        break

      case 'despachos':
        data = await getDespachos(dateFilter)
        break

      case 'curva-faena':
        data = await getCurvaFaena(dateFilter, especie)
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Tipo de reporte no válido' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data,
      kpis,
      filtros: {
        tipo,
        fechaDesde: dateFilter.gte?.toISOString(),
        fechaHasta: dateFilter.lte?.toISOString(),
        especie,
        productor: productorId
      }
    })
  } catch (error) {
    console.error('Error fetching reportes avanzados:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener reportes avanzados' },
      { status: 500 }
    )
  }
}

// Función para obtener producción diaria
async function getProduccionDiaria(
  dateFilter: { gte?: Date; lte?: Date },
  especie?: string | null,
  productorId?: string | null
): Promise<{ data: ProduccionDiaria[]; kpis: KPIs }> {
  const whereClause: Prisma.RomaneoWhereInput = {
    fecha: dateFilter,
    ...(especie && {
      tropa: { especie: especie as Prisma.EnumEspecieFilter['equals'] }
    }),
    ...(productorId && {
      tropa: { productorId }
    })
  }

  const romaneos = await db.romaneo.findMany({
    where: whereClause,
    orderBy: { fecha: 'asc' }
  })

  // Agrupar por fecha
  const produccionPorDia = new Map<string, { kgFaenados: number; cabezas: number; rindes: number[] }>()

  for (const romaneo of romaneos) {
    const fecha = new Date(romaneo.fecha).toISOString().split('T')[0]
    const existente = produccionPorDia.get(fecha) || { kgFaenados: 0, cabezas: 0, rindes: [] }

    existente.kgFaenados += romaneo.pesoTotal || 0
    existente.cabezas += 1
    if (romaneo.rinde && romaneo.rinde > 0) {
      existente.rindes.push(romaneo.rinde)
    }

    produccionPorDia.set(fecha, existente)
  }

  const data: ProduccionDiaria[] = Array.from(produccionPorDia.entries()).map(([fecha, datos]) => ({
    fecha,
    kgFaenados: Math.round(datos.kgFaenados * 100) / 100,
    cabezas: datos.cabezas,
    rindePromedio: datos.rindes.length > 0
      ? Math.round((datos.rindes.reduce((a, b) => a + b, 0) / datos.rindes.length) * 100) / 100
      : 0
  }))

  // Calcular KPIs
  const totalKgFaenados = data.reduce((acc, d) => acc + d.kgFaenados, 0)
  const totalCabezas = data.reduce((acc, d) => acc + d.cabezas, 0)
  const rindes = data.filter(d => d.rindePromedio > 0).map(d => d.rindePromedio)
  const rindePromedio = rindes.length > 0
    ? Math.round((rindes.reduce((a, b) => a + b, 0) / rindes.length) * 100) / 100
    : 0

  return {
    data,
    kpis: {
      totalKgFaenados: Math.round(totalKgFaenados * 100) / 100,
      totalCabezas,
      rindePromedio,
      comparativaAnterior: { kgFaenadosDiff: 0, cabezasDiff: 0, rindeDiff: 0 }
    }
  }
}

// Función para obtener KPIs de un período específico
async function getKPIsPeriodo(
  fechaDesde: Date,
  fechaHasta: Date,
  especie?: string | null,
  productorId?: string | null
): Promise<{ totalKgFaenados: number; totalCabezas: number; rindePromedio: number }> {
  const whereClause: Prisma.RomaneoWhereInput = {
    fecha: { gte: fechaDesde, lte: fechaHasta },
    ...(especie && {
      tropa: { especie: especie as Prisma.EnumEspecieFilter['equals'] }
    }),
    ...(productorId && {
      tropa: { productorId }
    })
  }

  const romaneos = await db.romaneo.findMany({
    where: whereClause,
    select: {
      pesoTotal: true,
      rinde: true
    }
  })

  const totalKgFaenados = romaneos.reduce((acc, r) => acc + (r.pesoTotal || 0), 0)
  const totalCabezas = romaneos.length
  const rindes = romaneos.filter(r => r.rinde && r.rinde > 0).map(r => r.rinde!)
  const rindePromedio = rindes.length > 0
    ? rindes.reduce((a, b) => a + b, 0) / rindes.length
    : 0

  return {
    totalKgFaenados: Math.round(totalKgFaenados * 100) / 100,
    totalCabezas,
    rindePromedio: Math.round(rindePromedio * 100) / 100
  }
}

// Función para obtener rinde por productor
async function getRindeProductor(
  dateFilter: { gte?: Date; lte?: Date },
  especie?: string | null
): Promise<RindeProductor[]> {
  const whereClause: Prisma.TropaWhereInput = {
    fechaRecepcion: dateFilter,
    ...(especie && { especie: especie as Prisma.EnumEspecieFilter['equals'] })
  }

  const tropas = await db.tropa.findMany({
    where: whereClause,
    include: {
      productor: true,
      usuarioFaena: true,
      animales: {
        include: {
          pesajeIndividual: true,
          asignacionGarron: true
        }
      }
    }
  })

  // Agrupar por productor
  const productorMap = new Map<string | null, {
    productorNombre: string
    cabezas: number
    kgVivo: number
    kgMedia: number
    rindes: number[]
  }>()

  for (const tropa of tropas) {
    const key = tropa.productorId
    const nombre = tropa.productor?.nombre || 'Sin Productor'
    const existente = productorMap.get(key) || {
      productorNombre: nombre,
      cabezas: 0,
      kgVivo: 0,
      kgMedia: 0,
      rindes: []
    }

    existente.cabezas += tropa.cantidadCabezas

    // Calcular kg vivo y kg media
    for (const animal of tropa.animales) {
      existente.kgVivo += animal.pesoVivo || animal.pesajeIndividual?.peso || 0
    }

    productorMap.set(key, existente)
  }

  // Convertir a array y calcular rankings
  const result: RindeProductor[] = Array.from(productorMap.entries())
    .map(([productorId, datos]) => ({
      productorId,
      productorNombre: datos.productorNombre,
      totalCabezas: datos.cabezas,
      totalKgVivo: Math.round(datos.kgVivo * 100) / 100,
      totalKgMedia: Math.round(datos.kgMedia * 100) / 100,
      rindePromedio: datos.rindes.length > 0
        ? Math.round((datos.rindes.reduce((a, b) => a + b, 0) / datos.rindes.length) * 100) / 100
        : datos.kgVivo > 0
          ? Math.round((datos.kgMedia / datos.kgVivo) * 10000) / 100
          : 0,
      posicion: 0
    }))
    .filter(p => p.totalKgVivo > 0)
    .sort((a, b) => b.rindePromedio - a.rindePromedio)
    .map((p, index) => ({ ...p, posicion: index + 1 }))

  return result
}

// Función para obtener rinde por tipo de animal
async function getRindeAnimal(
  dateFilter: { gte?: Date; lte?: Date },
  especie?: string | null
): Promise<RindeAnimal[]> {
  const whereClause: Prisma.AnimalWhereInput = {
    tropa: {
      fechaRecepcion: dateFilter,
      ...(especie && { especie: especie as Prisma.EnumEspecieFilter['equals'] })
    }
  }

  const animales = await db.animal.findMany({
    where: whereClause,
    include: {
      tropa: true,
      pesajeIndividual: true,
      asignacionGarron: true
    }
  })

  // Agrupar por tipo de animal
  const tipoMap = new Map<string, {
    cantidad: number
    kgVivo: number
    kgMedia: number
    rindes: number[]
  }>()

  for (const animal of animales) {
    const tipo = animal.tipoAnimal
    const existente = tipoMap.get(tipo) || { cantidad: 0, kgVivo: 0, kgMedia: 0, rindes: [] }

    existente.cantidad += 1
    existente.kgVivo += animal.pesoVivo || animal.pesajeIndividual?.peso || 0

    tipoMap.set(tipo, existente)
  }

  const result: RindeAnimal[] = Array.from(tipoMap.entries())
    .map(([tipoAnimal, datos]) => ({
      tipoAnimal,
      cantidad: datos.cantidad,
      totalKgVivo: Math.round(datos.kgVivo * 100) / 100,
      totalKgMedia: Math.round(datos.kgMedia * 100) / 100,
      rindePromedio: datos.rindes.length > 0
        ? Math.round((datos.rindes.reduce((a, b) => a + b, 0) / datos.rindes.length) * 100) / 100
        : datos.kgVivo > 0
          ? Math.round((datos.kgMedia / datos.kgVivo) * 10000) / 100
          : 0,
      rindeMin: datos.rindes.length > 0
        ? Math.round(Math.min(...datos.rindes) * 100) / 100
        : 0,
      rindeMax: datos.rindes.length > 0
        ? Math.round(Math.max(...datos.rindes) * 100) / 100
        : 0
    }))
    .sort((a, b) => b.cantidad - a.cantidad)

  return result
}

// Función para obtener stock por cámaras
async function getStockCamaras(especie?: string | null): Promise<StockCamara[]> {
  const camaras = await db.camara.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' }
  })

  const result: StockCamara[] = await Promise.all(camaras.map(async (camara) => {
    const whereClause: Prisma.MediaResWhereInput = {
      camaraId: camara.id,
      estado: 'EN_CAMARA'
    }

    const medias = await db.mediaRes.findMany({
      where: whereClause
    })

    // Filtrar por especie si se especifica (necesitamos incluir romaneo->listaFaena)
    const mediaIds = medias.map(m => m.id)
    // Obtener especies de los romaneos relacionados
    const romaneosMap = new Map<string, string>()
    if (especie) {
      const romaneosForMedias = await db.romaneo.findMany({
        where: { mediasRes: { some: { id: { in: mediaIds } } } },
        select: { id: true, tropaCodigo: true }
      })
      romaneosForMedias.forEach(r => romaneosMap.set(r.id, r.tropaCodigo || ''))
    }

    const mediasFiltradas = especie
      ? medias.filter(m => romaneosMap.has(m.romaneoId))
      : medias

    const totalPiezas = mediasFiltradas.length
    const totalKg = mediasFiltradas.reduce((acc, m) => acc + (m.peso || 0), 0)

    return {
      camaraId: camara.id,
      camaraNombre: camara.nombre,
      tipoCamara: camara.tipo,
      totalPiezas,
      totalKg: Math.round(totalKg * 100) / 100,
      capacidad: camara.capacidad,
      porcentajeOcupacion: camara.capacidad > 0
        ? Math.round((totalPiezas / camara.capacidad) * 10000) / 100
        : 0
    }
  }))

  return result.filter(c => c.totalPiezas > 0)
}

// Función para obtener despachos
async function getDespachos(dateFilter: { gte?: Date; lte?: Date }): Promise<DespachoData[]> {
  const facturas = await db.factura.findMany({
    where: {
      fecha: dateFilter,
      estado: { in: ['EMITIDA', 'PAGADA'] }
    },
    include: {
      cliente: true,
      detalles: true
    }
  })

  // Agrupar por cliente
  const clienteMap = new Map<string, {
    clienteNombre: string
    despachos: number
    kg: number
    facturado: number
  }>()

  for (const factura of facturas) {
    const key = factura.clienteId
    const existente = clienteMap.get(key) || {
      clienteNombre: factura.cliente.nombre,
      despachos: 0,
      kg: 0,
      facturado: 0
    }

    existente.despachos += 1
    existente.kg += factura.detalles.reduce((acc, d) => acc + (d.pesoKg || 0), 0)
    existente.facturado += factura.total

    clienteMap.set(key, existente)
  }

  const result: DespachoData[] = Array.from(clienteMap.entries())
    .map(([clienteId, datos]) => ({
      clienteId,
      clienteNombre: datos.clienteNombre,
      totalDespachos: datos.despachos,
      totalKg: Math.round(datos.kg * 100) / 100,
      totalFacturado: Math.round(datos.facturado * 100) / 100
    }))
    .sort((a, b) => b.totalFacturado - a.totalFacturado)

  return result
}

// Función para obtener curva de faena
async function getCurvaFaena(
  dateFilter: { gte?: Date; lte?: Date },
  especie?: string | null
): Promise<CurvaFaena[]> {
  const whereClause: Prisma.RomaneoWhereInput = {
    fecha: dateFilter,
    ...(especie && {
      tropa: { especie: especie as Prisma.EnumEspecieFilter['equals'] }
    })
  }

  const romaneos = await db.romaneo.findMany({
    where: whereClause,
    orderBy: { fecha: 'asc' }
  })

  // Agrupar por día de la semana
  const diaMap = new Map<string, { animales: number; kg: number; count: number }>()
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  for (const romaneo of romaneos) {
    const fecha = new Date(romaneo.fecha)
    const diaNumero = fecha.getDay()
    const dia = diasSemana[diaNumero]

    const existente = diaMap.get(dia) || { animales: 0, kg: 0, count: 0 }

    existente.animales += 1
    existente.kg += romaneo.pesoTotal || 0
    existente.count += 1

    diaMap.set(dia, existente)
  }

  const totalAnimales = romaneos.length
  const totalKg = romaneos.reduce((acc, r) => acc + (r.pesoTotal || 0), 0)

  const result: CurvaFaena[] = diasSemana.map((dia, index) => {
    const datos = diaMap.get(dia) || { animales: 0, kg: 0, count: 0 }
    return {
      dia,
      diaNumero: index,
      totalAnimales: datos.animales,
      totalKg: Math.round(datos.kg * 100) / 100,
      promedioDiario: datos.count > 0
        ? Math.round((datos.animales / datos.count) * 100) / 100
        : 0
    }
  })

  return result
}
