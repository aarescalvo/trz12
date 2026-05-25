import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar eventos de auditoría con filtros avanzados
export async function GET(request: NextRequest) {
  try {
    const authError = await checkPermission(request, 'puedeReportes')
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const operadorId = searchParams.get('operadorId')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const modulo = searchParams.get('modulo')
    const tipoAccion = searchParams.get('tipoAccion')
    const busqueda = searchParams.get('busqueda')
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const limite = parseInt(searchParams.get('limite') || '50')
    const exportar = searchParams.get('exportar') // 'csv'

    const where: Record<string, unknown> = {}

    if (operadorId) where.operadorId = operadorId
    if (modulo) where.modulo = modulo
    if (tipoAccion) where.accion = tipoAccion
    if (busqueda) {
      where.OR = [
        { descripcion: { contains: busqueda, mode: 'insensitive' } },
        { entidad: { contains: busqueda, mode: 'insensitive' } },
        { operador: { nombre: { contains: busqueda, mode: 'insensitive' } } },
      ]
    }

    if (fechaDesde || fechaHasta) {
      where.fecha = {}
      if (fechaDesde) {
        where.fecha = { ...where.fecha as object, gte: new Date(fechaDesde) }
      }
      if (fechaHasta) {
        const fechaFin = new Date(fechaHasta)
        fechaFin.setHours(23, 59, 59, 999)
        where.fecha = { ...where.fecha as object, lte: fechaFin }
      }
    }

    // Export CSV
    if (exportar === 'csv') {
      const registros = await db.auditoria.findMany({
        where,
        include: {
          operador: {
            select: { id: true, nombre: true, usuario: true, rol: true }
          }
        },
        orderBy: { fecha: 'desc' },
        take: 10000
      })

      const header = 'Fecha/Hora,Operador,Usuario,Módulo,Acción,Entidad,ID Entidad,Descripción,IP\n'
      const rows = registros.map(r => {
        const fecha = r.fecha.toISOString().replace('T', ' ').substring(0, 19)
        const operador = r.operador?.nombre || 'Sistema'
        const usuario = r.operador?.usuario || '-'
        const desc = (r.descripcion || '').replace(/"/g, '""')
        const entidad = (r.entidad || '').replace(/"/g, '""')
        return `"${fecha}","${operador}","${usuario}","${r.modulo}","${r.accion}","${entidad}","${r.entidadId || ''}","${desc}","${r.ip || ''}"`
      }).join('\n')

      const csv = header + rows
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=auditoria_operador_${new Date().toISOString().split('T')[0]}.csv`
        }
      })
    }

    // Paginated query
    const total = await db.auditoria.count({ where })
    const registros = await db.auditoria.findMany({
      where,
      include: {
        operador: {
          select: { id: true, nombre: true, usuario: true, rol: true }
        }
      },
      orderBy: { fecha: 'desc' },
      skip: (pagina - 1) * limite,
      take: limite
    })

    // Estadísticas por operador
    const statsPorOperador = await db.auditoria.groupBy({
      by: ['operadorId'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20
    })

    const operadoresStats = await Promise.all(
      statsPorOperador.map(async (stat) => {
        const operador = stat.operadorId
          ? await db.operador.findUnique({ where: { id: stat.operadorId }, select: { nombre: true } })
          : null

        const accionesPorTipo = await db.auditoria.groupBy({
          by: ['accion'],
          where: { ...where, operadorId: stat.operadorId },
          _count: { id: true }
        })

        const ultimoAcceso = await db.auditoria.findFirst({
          where: { operadorId: stat.operadorId },
          orderBy: { fecha: 'desc' },
          select: { fecha: true }
        })

        return {
          operadorId: stat.operadorId || 'sistema',
          operadorNombre: operador?.nombre || 'Sistema',
          totalAcciones: stat._count.id,
          creates: accionesPorTipo.find(a => a.accion === 'CREATE')?._count.id || 0,
          updates: accionesPorTipo.find(a => a.accion === 'UPDATE')?._count.id || 0,
          deletes: accionesPorTipo.find(a => a.accion === 'DELETE')?._count.id || 0,
          logins: accionesPorTipo.find(a => a.accion === 'LOGIN')?._count.id || 0,
          errores: accionesPorTipo.find(a => a.accion === 'ERROR')?._count.id || 0,
          ultimoAcceso: ultimoAcceso?.fecha?.toISOString() || ''
        }
      })
    )

    // Estadísticas por módulo
    const statsPorModulo = await db.auditoria.groupBy({
      by: ['modulo'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    })

    return NextResponse.json({
      success: true,
      data: registros,
      paginas: Math.ceil(total / limite),
      total,
      stats: {
        porOperador: operadoresStats,
        porModulo: statsPorModulo.map(s => ({
          modulo: s.modulo,
          cantidad: s._count.id
        }))
      }
    })
  } catch (error) {
    console.error('Error en auditoría operador:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener auditoría' },
      { status: 500 }
    )
  }
}
