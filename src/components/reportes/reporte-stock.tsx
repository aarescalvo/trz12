'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Package, Loader2, FileSpreadsheet, Warehouse, Beef } from 'lucide-react'
import { exportReport } from '@/lib/reportes-api'
import { ExportButton } from '@/components/ui/export-button'
import { PDFExporter } from '@/lib/export-pdf'

interface StockData {
  camaraId: string
  camaraNombre: string
  tropaCodigo: string | null
  especie: string
  cantidad: number
  pesoTotal: number
  pesoPromedio: number
  fechaIngreso: string
  diasEnCamara: number
}

interface CamaraStock {
  id: string
  nombre: string
  tipo: string
  capacidad: number
  stockActual: number
  porcentajeOcupacion: number
}

export function ReporteStock() {
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [camaraSeleccionada, setCamaraSeleccionada] = useState<string>('todas')
  const [especie, setEspecie] = useState<string>('todas')
  const [datos, setDatos] = useState<StockData[]>([])
  const [camaras, setCamaras] = useState<CamaraStock[]>([])
  const [resumen, setResumen] = useState({
    totalMedias: 0,
    totalPeso: 0,
    totalBovinos: 0,
    totalEquinos: 0,
    camarasEnUso: 0
  })

  useEffect(() => {
    fetchStock()
  }, [camaraSeleccionada, especie])

  const fetchStock = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reportes/stock?camara=${camaraSeleccionada}&especie=${especie}`)
      const data = await res.json()
      
      if (data.success) {
        setDatos(data.data)
        setCamaras(data.camaras || [])
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
        tipo: 'stock',
        datos: datos as unknown as Record<string, unknown>[],
        resumen,
        camaras: camaras as unknown as Record<string, unknown>[],
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

    const headers = ['Cámara', 'Tropa', 'Especie', 'Cantidad', 'Peso Total', 'P. Promedio', 'Fecha Ingreso', 'Días']
    const rows = datos.map(d => [
      d.camaraNombre, d.tropaCodigo || 'N/A', d.especie,
      d.cantidad.toString(), d.pesoTotal.toFixed(1) + ' kg',
      d.pesoPromedio.toFixed(1) + ' kg', d.fechaIngreso, d.diasEnCamara.toString()
    ])
    const doc = PDFExporter.generateReport({
      title: 'Reporte de Stock de Cámaras',
      headers,
      data: rows,
      orientation: 'landscape',
    })
    PDFExporter.downloadPDF(doc, `reporte_stock_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-amber-600" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cámara</label>
              <Select value={camaraSeleccionada} onValueChange={setCamaraSeleccionada}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las cámaras</SelectItem>
                  {camaras.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Especie</label>
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
            <div className="col-span-2 flex items-end justify-end">
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-stone-500">Total Medias</p>
            <p className="text-2xl font-bold text-stone-800">{resumen.totalMedias}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-stone-500">Peso Total</p>
            <p className="text-2xl font-bold text-stone-800">{resumen.totalPeso.toLocaleString()} kg</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-stone-500">Medias Bovinas</p>
            <p className="text-2xl font-bold text-amber-600">{resumen.totalBovinos}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-stone-500">Medias Equinas</p>
            <p className="text-2xl font-bold text-emerald-600">{resumen.totalEquinos}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-stone-500">Cámaras en Uso</p>
            <p className="text-2xl font-bold text-blue-600">{resumen.camarasEnUso}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cámaras */}
      {camaras.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg">Estado de Cámaras</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
              {camaras.map((camara) => (
                <div key={camara.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{camara.nombre}</span>
                    <Badge variant="outline">{camara.tipo}</Badge>
                  </div>
                  <div className="text-sm text-stone-500 mb-2">
                    {camara.stockActual} / {camara.capacidad} {camara.tipo === 'FAENA' ? 'ganchos' : 'kg'}
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        camara.porcentajeOcupacion >= 90 ? 'bg-red-500' : 
                        camara.porcentajeOcupacion >= 70 ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(camara.porcentajeOcupacion, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-right mt-1 text-stone-400">
                    {camara.porcentajeOcupacion.toFixed(0)}% ocupación
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de detalle */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <CardTitle className="text-lg">Detalle de Stock</CardTitle>
          <CardDescription>
            {loading ? 'Cargando...' : `${datos.length} registros encontrados`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
            </div>
          ) : datos.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay stock disponible</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cámara</TableHead>
                    <TableHead>Tropa</TableHead>
                    <TableHead>Especie</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Peso Total</TableHead>
                    <TableHead className="text-right">P. Promedio</TableHead>
                    <TableHead>Fecha Ingreso</TableHead>
                    <TableHead className="text-center">Días</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datos.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.camaraNombre}</TableCell>
                      <TableCell className="font-mono">{row.tropaCodigo || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={row.especie === 'BOVINO' ? 'default' : 'secondary'}>
                          {row.especie === 'BOVINO' ? 'B' : 'E'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">{row.cantidad}</TableCell>
                      <TableCell className="text-right">{row.pesoTotal.toFixed(1)} kg</TableCell>
                      <TableCell className="text-right">{row.pesoPromedio.toFixed(1)} kg</TableCell>
                      <TableCell className="font-mono text-xs">{row.fechaIngreso}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={row.diasEnCamara > 30 ? 'destructive' : 'outline'}>
                          {row.diasEnCamara}
                        </Badge>
                      </TableCell>
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

export default ReporteStock
