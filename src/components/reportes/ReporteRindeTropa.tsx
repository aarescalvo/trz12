'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshCw, TrendingUp, Download, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { ExcelExporter } from '@/lib/export-excel'
import { PDFExporter } from '@/lib/export-pdf'

interface RindeTropaItem {
  tropaCodigo: string
  productor: string
  cantidad: number
  pesoVivoTotal: number
  pesoCanalTotal: number
  rinde: number
}

export function ReporteRindeTropa() {
  const [data, setData] = useState<RindeTropaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [especie, setEspecie] = useState('todas')

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (fechaDesde) params.append('fechaDesde', fechaDesde)
      if (fechaHasta) params.append('fechaHasta', fechaHasta)
      if (especie !== 'todas') params.append('especie', especie)
      const res = await fetch(`/api/reportes/rinde-tropa?${params.toString()}`)
      const json = await res.json()
      if (json.success) setData(json.data)
      else toast.error('Error al cargar rinde por tropa')
    } catch (error) {
      console.error(error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const rindePromedio = data.length > 0 ? Number((data.reduce((s, r) => s + r.rinde, 0) / data.length).toFixed(2)) : 0
  const totalAnimales = data.reduce((s, r) => s + r.cantidad, 0)

  const exportarExcel = () => {
    if (data.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }
    const dateStr = new Date().toISOString().split('T')[0]
    ExcelExporter.exportToExcel({
      filename: `rinde_tropa_${dateStr}`,
      sheets: [{
        name: 'Rinde por Tropa',
        headers: ['Tropa', 'Productor', 'Cabezas', 'Peso Vivo (kg)', 'Peso Canal (kg)', 'Rinde %'],
        data: data.map(r => [
          r.tropaCodigo,
          r.productor,
          r.cantidad.toString(),
          r.pesoVivoTotal.toLocaleString('es-AR'),
          r.pesoCanalTotal.toLocaleString('es-AR'),
          r.rinde.toString(),
        ])
      }],
      title: 'Rinde por Tropa - Solemar Alimentaria'
    })
    toast.success('Excel descargado')
  }

  const exportarPDF = () => {
    if (data.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }
    const dateStr = new Date().toISOString().split('T')[0]
    const headers = ['Tropa', 'Productor', 'Cabezas', 'Peso Vivo (kg)', 'Peso Canal (kg)', 'Rinde %']
    const rows = data.map(r => [
      r.tropaCodigo,
      r.productor,
      r.cantidad.toString(),
      r.pesoVivoTotal.toLocaleString('es-AR'),
      r.pesoCanalTotal.toLocaleString('es-AR'),
      r.rinde.toString() + '%',
    ])
    const doc = PDFExporter.generateReport({ title: 'Rinde por Tropa - Solemar Alimentaria', headers, data: rows, orientation: 'landscape' })
    PDFExporter.downloadPDF(doc, `rinde_tropa_${dateStr}.pdf`)
    toast.success('PDF descargado')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 animate-pulse text-amber-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label className="text-xs text-stone-500">Desde</Label>
              <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs text-stone-500">Hasta</Label>
              <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs text-stone-500">Especie</Label>
              <Select value={especie} onValueChange={setEspecie}>
                <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="BOVINO">Bovino</SelectItem>
                  <SelectItem value="EQUINO">Equino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchData} size="sm" className="bg-amber-500 hover:bg-amber-600">
              <RefreshCw className="w-4 h-4 mr-1" /> Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-amber-600">Total Tropas</p>
            <p className="text-2xl font-bold text-amber-800">{data.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-blue-600">Total Animales</p>
            <p className="text-2xl font-bold text-blue-800">{totalAnimales}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto text-green-600 mb-1" />
            <p className="text-xs text-green-600">Rinde Promedio</p>
            <p className="text-2xl font-bold text-green-800">{rindePromedio}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Export buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={exportarExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar Excel
        </Button>
        <Button variant="outline" size="sm" onClick={exportarPDF}>
          <Download className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Tabla */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50">
          <CardTitle className="text-sm">Rinde por Tropa (ordenado de mayor a menor)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.length === 0 ? (
            <div className="p-8 text-center text-stone-400">No hay datos disponibles</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tropa</TableHead>
                  <TableHead>Productor</TableHead>
                  <TableHead className="text-right">Cabezas</TableHead>
                  <TableHead className="text-right">Peso Vivo (kg)</TableHead>
                  <TableHead className="text-right">Peso Canal (kg)</TableHead>
                  <TableHead className="text-right">Rinde %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono font-medium">{r.tropaCodigo}</TableCell>
                    <TableCell>{r.productor}</TableCell>
                    <TableCell className="text-right">{r.cantidad}</TableCell>
                    <TableCell className="text-right">{r.pesoVivoTotal.toLocaleString('es-AR')}</TableCell>
                    <TableCell className="text-right">{r.pesoCanalTotal.toLocaleString('es-AR')}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={r.rinde >= 52 ? 'default' : r.rinde >= 48 ? 'secondary' : 'destructive'}
                        className={r.rinde >= 52 ? 'bg-green-100 text-green-700' : r.rinde >= 48 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                        {r.rinde}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
