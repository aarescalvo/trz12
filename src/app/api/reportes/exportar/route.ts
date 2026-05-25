import { NextRequest, NextResponse } from 'next/server'
import { exportReportToFile, ExportReportPayload } from '@/lib/reportes-export'
import { checkPermission } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const body = await request.json()
    const payload = body as ExportReportPayload

    if (!payload.tipo) {
      return NextResponse.json({ success: false, error: 'Tipo de reporte es requerido' }, { status: 400 })
    }

    if (!payload.datos || !Array.isArray(payload.datos) || payload.datos.length === 0) {
      return NextResponse.json({ success: false, error: 'Datos insuficientes para exportar' }, { status: 400 })
    }

    const archivo = await exportReportToFile(payload)

    return NextResponse.json({ success: true, archivo })
  } catch (error) {
    console.error('Error exportando:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Error al exportar' }, { status: 500 })
  }
}
