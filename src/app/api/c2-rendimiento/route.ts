import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Rendimiento de desposte C2
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'global'
    const tropaCodigo = searchParams.get('tropaCodigo')
    const fecha = searchParams.get('fecha')

    if (tipo === 'global') {
      return await getRendimientoGlobal(tropaCodigo, fecha)
    } else if (tipo === 'productos') {
      return await getRendimientoPorProducto(tropaCodigo, fecha)
    } else if (tipo === 'ingresos') {
      return await getRendimientoPorIngreso(tropaCodigo, fecha)
    }

    return NextResponse.json({ success: false, error: 'Tipo no válido' }, { status: 400 })
  } catch (error) {
    console.error('Error calculando rendimiento:', error)
    return NextResponse.json(
      { success: false, error: 'Error al calcular rendimiento' },
      { status: 500 }
    )
  }
}

async function getRendimientoGlobal(tropaCodigo?: string | null, fecha?: string | null) {
  // Filtro de cajas
  const whereCajas: any = {}
  if (tropaCodigo) whereCajas.tropaCodigo = tropaCodigo
  if (fecha) {
    const fechaInicio = new Date(fecha)
    const fechaFin = new Date(fecha)
    fechaFin.setDate(fechaFin.getDate() + 1)
    whereCajas.fechaDesposte = { gte: fechaInicio, lt: fechaFin }
  }

  // Total ingresado (desde ingresos despostada)
  const whereIngresos: any = {}
  if (tropaCodigo) whereIngresos.tropaCodigo = tropaCodigo
  if (fecha) {
    const fechaInicio = new Date(fecha)
    const fechaFin = new Date(fecha)
    fechaFin.setDate(fechaFin.getDate() + 1)
    whereIngresos.fecha = { gte: fechaInicio, lt: fechaFin }
  }

  const [ingresos, cajasResult, subproductos] = await Promise.all([
    db.ingresoDespostada.aggregate({
      where: whereIngresos,
      _sum: { pesoKg: true },
      _count: true
    }),
    db.cajaEmpaque.aggregate({
      where: { ...whereCajas, productoDesposteId: { not: null } },
      _sum: { pesoNeto: true },
      _count: true
    }),
    db.c2SubproductoPesaje.aggregate({
      where: tropaCodigo ? { tropaCodigo } : {},
      _sum: { pesoKg: true }
    })
  ])

  const totalIngresado = ingresos._sum?.pesoKg ?? 0
  const totalProducido = cajasResult._sum.pesoNeto || 0
  const totalSubproductos = subproductos._sum.pesoKg || 0
  const rendimientoGlobal = totalIngresado > 0 ? (totalProducido / totalIngresado) * 100 : 0
  const mermaTotal = totalIngresado - totalProducido - totalSubproductos
  const porcentajeMerma = totalIngresado > 0 ? (mermaTotal / totalIngresado) * 100 : 0

  return NextResponse.json({
    success: true,
    data: {
      totalIngresado,
      totalProducido,
      totalSubproductos,
      rendimientoGlobal,
      mermaTotal: Math.max(0, mermaTotal),
      porcentajeMerma: Math.max(0, porcentajeMerma),
      cantidadIngresos: ingresos._count,
      cantidadCajas: cajasResult._count
    }
  })
}

async function getRendimientoPorProducto(tropaCodigo?: string | null, fecha?: string | null) {
  const where: any = { productoDesposteId: { not: null } }
  if (tropaCodigo) where.tropaCodigo = tropaCodigo
  if (fecha) {
    const fechaInicio = new Date(fecha)
    const fechaFin = new Date(fecha)
    fechaFin.setDate(fechaFin.getDate() + 1)
    where.fechaDesposte = { gte: fechaInicio, lt: fechaFin }
  }

  // Obtener total ingresado para calcular porcentajes
  const whereIngresos: any = {}
  if (tropaCodigo) whereIngresos.tropaCodigo = tropaCodigo
  const totalIngresado = (await db.ingresoDespostada.aggregate({
    where: whereIngresos,
    _sum: { pesoKg: true }
  }))._sum?.pesoKg ?? 0

  // Agrupar por producto de desposte
  const cajas = await db.cajaEmpaque.findMany({
    where,
    include: {
      productoDesposte: {
        select: {
          id: true,
          nombre: true,
          codigo: true,
          rubro: { select: { nombre: true } }
        }
      }
    }
  })

  // Agrupar manualmente
  const porProducto = new Map<string, {
    productoId: string
    productoNombre: string
    productoCodigo: string
    rubroNombre: string
    cantidadCajas: number
    pesoNetoTotal: number
  }>()

  for (const caja of cajas) {
    const pd = caja.productoDesposte
    if (!pd) continue

    const key = pd.id
    if (!porProducto.has(key)) {
      porProducto.set(key, {
        productoId: pd.id,
        productoNombre: pd.nombre,
        productoCodigo: pd.codigo,
        rubroNombre: pd.rubro?.nombre || 'Sin rubro',
        cantidadCajas: 0,
        pesoNetoTotal: 0
      })
    }
    const entry = porProducto.get(key)!
    entry.cantidadCajas++
    entry.pesoNetoTotal += caja.pesoNeto
  }

  const resultado = Array.from(porProducto.values()).map(rp => ({
    ...rp,
    porcentajeRendimiento: totalIngresado > 0 ? (rp.pesoNetoTotal / totalIngresado) * 100 : 0
  })).sort((a, b) => b.pesoNetoTotal - a.pesoNetoTotal)

  return NextResponse.json({
    success: true,
    data: resultado
  })
}

async function getRendimientoPorIngreso(tropaCodigo?: string | null, fecha?: string | null) {
  const whereIngresos: any = {}
  if (tropaCodigo) whereIngresos.tropaCodigo = tropaCodigo
  if (fecha) {
    const fechaInicio = new Date(fecha)
    const fechaFin = new Date(fecha)
    fechaFin.setDate(fechaFin.getDate() + 1)
    whereIngresos.fecha = { gte: fechaInicio, lt: fechaFin }
  }

  const ingresos = await db.ingresoDespostada.findMany({
    where: whereIngresos,
    include: {
      camaraOrigen: { select: { nombre: true } },
      camaraDestino: { select: { nombre: true } }
    },
    orderBy: { fecha: 'desc' },
    take: 50
  })

  const resultado: {
    ingresoId: string
    tropaCodigo: string
    pesoIngresado: number
    pesoProducido: number
    rendimiento: number
    cantidadCajas: number
    productos: { nombre: string; peso: number }[]
  }[] = []

  for (const ingreso of ingresos) {
    // Buscar cajas de esta tropa
    const cajas = await db.cajaEmpaque.findMany({
      where: {
        tropaCodigo: ingreso.tropaCodigo,
        productoDesposteId: { not: null }
      },
      include: {
        productoDesposte: { select: { nombre: true } }
      }
    })

    const pesoProducido = cajas.reduce((s, c) => s + c.pesoNeto, 0)

    // Agrupar productos
    const productosMap = new Map<string, number>()
    for (const caja of cajas) {
      const nombre = caja.productoDesposte?.nombre || 'Sin producto'
      productosMap.set(nombre, (productosMap.get(nombre) || 0) + caja.pesoNeto)
    }

    resultado.push({
      ingresoId: ingreso.id,
      tropaCodigo: ingreso.tropaCodigo || 'S/T',
      pesoIngresado: ingreso.pesoKg,
      pesoProducido,
      rendimiento: ingreso.pesoKg > 0 ? (pesoProducido / ingreso.pesoKg) * 100 : 0,
      cantidadCajas: cajas.length,
      productos: Array.from(productosMap.entries()).map(([nombre, peso]) => ({ nombre, peso }))
    })
  }

  return NextResponse.json({
    success: true,
    data: resultado
  })
}
