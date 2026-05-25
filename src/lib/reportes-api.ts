export interface ReporteExportPayload {
  tipo: string
  datos: Array<Record<string, unknown>>
  resumen?: Record<string, unknown>
  fechaDesde?: string
  fechaHasta?: string
  camaras?: Array<Record<string, unknown>>
}

export async function exportReport(payload: ReporteExportPayload): Promise<string> {
  const res = await fetch('/api/reportes/exportar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await res.json()

  if (!data.success || !data.archivo) {
    throw new Error(data.error || 'Error al exportar el reporte')
  }

  return data.archivo
}
