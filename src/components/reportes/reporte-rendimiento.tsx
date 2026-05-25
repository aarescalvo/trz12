'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Calendar, Download, TrendingUp, Loader2, FileSpreadsheet } from 'lucide-react'
import { ExportButton } from '@/components/ui/export-button'
import { PDFExporter } from '@/lib/export-pdf'
import { exportReport } from '@/lib/reportes-api'

interface RendimientoData {
  tropaCodigo: string
  especie: string
  cantidadAnimales: number
  pesoVivoTotal: number
  pesoFaenaTotal: number
  rindePromedio: number
  rindeMinimo: number
  rindeMaximo: number
  desvio: number
}

export function ReporteRendimiento() {
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [especie, setEspecie] = useState<string>('todas')
  const [datos, setDatos] = useState<RendimientoData[]>([])
  const [resumen, setResumen] = useState({
    totalTropas: 0,
    totalAnimales: 0,
    pesoVivoTotal: 0,
    pesoFaenaTotal: 0,
    rindeGeneral: 0,
    rindePromedio: 0
  })

  useEffect(() => {
    const today = new Date()
    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    
    setFechaHasta(today.toISOString().split('T')[0])
    setFechaDesde(monthAgo.toISOString().split('T')[0])
  }, [])

  const handleBuscar = async () => {
    if (!fechaDesde || !fechaHasta) {
      toast.error('Seleccione un rango de fechas')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/reportes/rendimiento?desde=${fechaDesde}&hasta=${fechaHasta}&especie=${especie}`)
      const data = await res.json()
      
      if (data.success) {
        setDatos(data.data)
        setResumen(data.resumen)
      } else {
        toast.error(data.error || 'Error al obtener datos')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleExportar = async () => {
    if (datos.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    setExporting(true)
    try {
      const archivo = await exportReport({
        tipo: 'rendimiento',
        datos: datos as unknown as Record<string, unknown>[],
        resumen,
        fechaDesde,
        fechaHasta
      })

      window.open(archivo, '_blank')
      toast.success('Reporte exportado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al exportar')
    } finally {
      setExporting(false)
    }
  }

  const handleExportarPDF = () => {
    if (datos.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    const headers = ['Tropa', 'Especie', 'Animales', 'P. Vivo Total', 'P. Faena Total', 'Rinde Prom.', 'Rinde Min', 'Rinde Max', 'Desvío']
    const rows = datos.map(d => [
      d.tropaCodigo, d.especie, d.cantidadAnimales.toString(),
      d.pesoVivoTotal.toLocaleString(), d.pesoFaenaTotal.toLocaleString(),
      d.rindePromedio.toFixed(1) + '%', d.rindeMinimo.toFixed(1) + '%',
      d.rindeMaximo.toFixed(1) + '%', d.desvio.toFixed(2)
    ])
    const doc = PDFExporter.generateReport({
      title: 'Reporte de Rendimientos',
      subtitle: `Período: ${fechaDesde} - ${fechaHasta}`,
      headers,
      data: rows,
      orientation: 'landscape',
    })
    PDFExporter.downloadPDF(doc, `reporte_rendimiento_${fechaDesde}_${fechaHasta}.pdf`)
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Fecha Desde</Label>
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Hasta</Label>
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Especie</Label>
              <Select value={especie} onValueChange={setEspecie}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="BOVINO">Bovino</SelectItem>
                  <SelectItem value="EQUINO">Equino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleBuscar} disabled={loading} className="bg-amber-500 hover:bg-amber-600">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                <span className="ml-2">Buscar</span>
              </Button>
              <ExportButton
                onExportExcel={handleExportar}
                onExportPDF={handleExportarPDF}
                onPrint={() => window.print()}
                disabled={exporting || datos.length === 0}
                size="default"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      {datos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">Total Tropas</p>
              <p className="text-2xl font-bold text-stone-800">{resumen.totalTropas}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">Total Animales</p>
              <p className="text-2xl font-bold text-stone-800">{resumen.totalAnimales}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">P. Vivo Total</p>
              <p className="text-2xl font-bold text-stone-800">{resumen.pesoVivoTotal.toLocaleString()} kg</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">P. Faena Total</p>
              <p className="text-2xl font-bold text-stone-800">{resumen.pesoFaenaTotal.toLocaleString()} kg</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">Rinde General</p>
              <p className="text-2xl font-bold text-blue-600">{resumen.rindeGeneral.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">Rinde Promedio</p>
              <p className="text-2xl font-bold text-green-600">{resumen.rindePromedio.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <CardTitle className="text-lg">Rendimiento por Tropa</CardTitle>
          <CardDescription>
            {datos.length > 0 ? `${datos.length} tropas analizadas` : 'Realice una búsqueda para ver datos'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {datos.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Seleccione un rango de fechas y presione Buscar</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tropa</TableHead>
                    <TableHead>Especie</TableHead>
                    <TableHead className="text-center">Animales</TableHead>
                    <TableHead className="text-right">P. Vivo Total</TableHead>
                    <TableHead className="text-right">P. Faena Total</TableHead>
                    <TableHead className="text-right">Rinde Prom.</TableHead>
                    <TableHead className="text-right">Rinde Min</TableHead>
                    <TableHead className="text-right">Rinde Max</TableHead>
                    <TableHead className="text-right">Desvío</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datos.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono font-medium">{row.tropaCodigo}</TableCell>
                      <TableCell>
                        <Badge variant={row.especie === 'BOVINO' ? 'default' : 'secondary'}>
                          {row.especie}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{row.cantidadAnimales}</TableCell>
                      <TableCell className="text-right">{row.pesoVivoTotal.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{row.pesoFaenaTotal.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={row.rindePromedio >= 50 ? 'text-green-600' : 'text-amber-600'}>
                          {row.rindePromedio.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{row.rindeMinimo.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{row.rindeMaximo.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{row.desvio.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ReporteRendimiento
