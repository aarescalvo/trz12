import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { checkPermission } from '@/lib/auth-helpers'

const logger = createLogger('API:AuditoriaExportar')

// GET - Exportar auditoría en formato CSV
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const operadorId = request.headers.get('x-operador-id')
    const modulo = searchParams.get('modulo')
    const accion = searchParams.get('accion')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    const where: any = {}
    if (operadorId) where.operadorId = operadorId
    if (modulo) where.modulo = modulo
    if (accion) where.accion = accion
    if (fechaDesde || fechaHasta) {
      where.fecha = {}
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde)
      if (fechaHasta) where.fecha.lte = new Date(fechaHasta)
    }

    const auditorias = await db.auditoria.findMany({
      where,
      include: {
        operador: { select: { nombre: true, usuario: true, rol: true } }
      },
      orderBy: { fecha: 'desc' },
      take: 5000
    })

    // Generar CSV
    const headers = ['Fecha', 'Operador', 'Usuario', 'Rol', 'Módulo', 'Acción', 'Entidad', 'ID Entidad', 'Descripción', 'IP']
    const rows = auditorias.map(a => [
      new Date(a.fecha).toLocaleString('es-AR'),
      a.operador?.nombre || 'Sistema',
      a.operador?.usuario || '',
      a.operador?.rol || '',
      a.modulo,
      a.accion,
      a.entidad,
      a.entidadId || '',
      `"${(a.descripcion || '').replace(/"/g, '""')}"`,
      a.ip || ''
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="auditoria_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    logger.error('Error exportando auditoría', error)
    return NextResponse.json(
      { success: false, error: 'Error al exportar auditoría' },
      { status: 500 }
    )
  }
}
