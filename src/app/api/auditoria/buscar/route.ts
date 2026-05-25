import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Buscar en auditoría con filtros avanzados
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    
    // Parámetros de filtro
    const operadorId = request.headers.get('x-operador-id')
    const modulo = searchParams.get('modulo')
    const submodulo = searchParams.get('submodulo')
    const accion = searchParams.get('accion')
    const entidad = searchParams.get('entidad')
    const entidadId = searchParams.get('entidadId')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const busquedaTexto = searchParams.get('q')
    const ip = searchParams.get('ip')
    
    // Parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    
    // Construir filtros
    const where: Prisma.AuditoriaWhereInput = {}
    
    if (operadorId) {
      where.operadorId = operadorId
    }
    
    if (modulo) {
      where.modulo = modulo
    }
    
    if (submodulo) {
      where.modulo = submodulo
    }
    
    if (accion) {
      where.accion = accion
    }
    
    if (entidad) {
      where.entidad = entidad
    }
    
    if (entidadId) {
      where.entidadId = entidadId
    }
    
    if (ip) {
      where.ip = ip
    }
    
    // Filtro de fechas
    if (fechaDesde || fechaHasta) {
      where.fecha = {}
      if (fechaDesde) {
        where.fecha.gte = new Date(fechaDesde)
      }
      if (fechaHasta) {
        // Incluir todo el día final
        const fechaFin = new Date(fechaHasta)
        fechaFin.setHours(23, 59, 59, 999)
        where.fecha.lte = fechaFin
      }
    }
    
    // Búsqueda de texto libre
    if (busquedaTexto) {
      where.OR = [
        { descripcion: { contains: busquedaTexto } },
        { entidad: { contains: busquedaTexto } },
        { operador: { nombre: { contains: busquedaTexto } } },
        { operador: { usuario: { contains: busquedaTexto } } }
      ]
    }
    
    // Ejecutar consulta con conteo total
    const [auditoria, total] = await Promise.all([
      db.auditoria.findMany({
        where,
        include: {
          operador: {
            select: {
              id: true,
              nombre: true,
              usuario: true,
              rol: true
            }
          }
        },
        orderBy: {
          fecha: 'desc'
        },
        skip,
        take: limit
      }),
      db.auditoria.count({ where })
    ])
    
    // Calcular estadísticas
    const estadisticas = await getEstadisticas(where)
    
    return NextResponse.json({
      success: true,
      data: auditoria,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      estadisticas
    })
  } catch (error) {
    console.error('Error buscando auditoría:', error)
    return NextResponse.json(
      { success: false, error: 'Error al buscar en auditoría' },
      { status: 500 }
    )
  }
}

// Función para obtener estadísticas
async function getEstadisticas(where: Prisma.AuditoriaWhereInput) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  
  const hace7dias = new Date(hoy)
  hace7dias.setDate(hace7dias.getDate() - 7)
  
  const hace30dias = new Date(hoy)
  hace30dias.setDate(hace30dias.getDate() - 30)
  
  // Estadísticas por acción
  const porAccion = await db.auditoria.groupBy({
    by: ['accion'],
    where: {
      ...where,
      fecha: { gte: hace7dias }
    },
    _count: true
  })
  
  // Estadísticas por módulo
  const porModulo = await db.auditoria.groupBy({
    by: ['modulo'],
    where: {
      ...where,
      fecha: { gte: hace7dias }
    },
    _count: true,
    orderBy: {
      _count: {
        modulo: 'desc'
      }
    }
  })
  
  // Estadísticas por operador (top 10)
  const porOperador = await db.auditoria.groupBy({
    by: ['operadorId'],
    where: {
      ...where,
      fecha: { gte: hace7dias },
      operadorId: { not: null }
    },
    _count: true,
    orderBy: {
      _count: {
        operadorId: 'desc'
      }
    },
    take: 10
  })
  
  // Obtener nombres de operadores
  const operadorIds = porOperador.map(o => o.operadorId).filter(Boolean) as string[]
  const operadores = await db.operador.findMany({
    where: { id: { in: operadorIds } },
    select: { id: true, nombre: true, usuario: true }
  })
  
  const operadoresMap = new Map(operadores.map(o => [o.id, o]))
  
  // Actividad por hora
  const actividadPorHora = await db.$queryRaw<{ hora: number; count: bigint }[]>`
    SELECT CAST(strftime('%H', fecha) AS INTEGER) as hora, COUNT(*) as count
    FROM Auditoria
    WHERE fecha >= datetime('now', '-7 days')
    GROUP BY hora
    ORDER BY hora
  `
  
  // Conteos de períodos
  const [conteoHoy, conteo7dias, conteo30dias] = await Promise.all([
    db.auditoria.count({
      where: { ...where, fecha: { gte: hoy } }
    }),
    db.auditoria.count({
      where: { ...where, fecha: { gte: hace7dias } }
    }),
    db.auditoria.count({
      where: { ...where, fecha: { gte: hace30dias } }
    })
  ])
  
  return {
    porAccion: porAccion.map(p => ({ accion: p.accion, count: p._count })),
    porModulo: porModulo.map(p => ({ modulo: p.modulo, count: p._count })),
    porOperador: porOperador.map(p => ({
      operadorId: p.operadorId,
      nombre: operadoresMap.get(p.operadorId!)?.nombre || 'Desconocido',
      usuario: operadoresMap.get(p.operadorId!)?.usuario || 'N/A',
      count: p._count
    })),
    actividadPorHora: actividadPorHora.map(a => ({
      hora: a.hora,
      count: Number(a.count)
    })),
    conteos: {
      hoy: conteoHoy,
      ultimos7dias: conteo7dias,
      ultimos30dias: conteo30dias
    }
  }
}
