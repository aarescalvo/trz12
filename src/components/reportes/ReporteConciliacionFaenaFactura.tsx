'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  CheckCircle, Filter, RefreshCw, Loader2, ChevronDown, ChevronUp,
  Download, FileSpreadsheet
} from 'lucide-react'
import { ExcelExporter } from '@/lib/export-excel'
import { PDFExporter } from '@/lib/export-pdf'

interface Operador {
  id: string
  nombre: string
  rol: string
  permisos: Record<string, boolean>
}

interface FacturaItem {
  id: string
  numero: string
  estado: string
  total: number
  saldo: number
  fecha: string
}

interface ConciliacionItem {
  tropaCodigo: string
  tropaId: string
  fechaFaena: string
  productorNombre: string
  usuarioFaenaNombre: string
  totalCabezas: number
  totalMedias: number
  mediasDespachadas: number
  mediasEnCamara: number
  mediasFacturadas: number
  totalKgFaenados: number
  totalKgDespachados: number
  totalKgFacturados: number
  montoFacturado: number
  montoCobrado: number
  porcentajeCicloCerrado: number
  facturas: FacturaItem[]
}

const currencyFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })

export function ReporteConciliacionFaenaFactura({ operador }: { operador: Operador }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ConciliacionItem[]>([])
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [tropaCodigo, setTropaCodigo] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (fechaDesde) params.append('fechaDesde', fechaDesde)
      if (fechaHasta) params.append('fechaHasta', fechaHasta)
      if (tropaCodigo) params.append('tropaCodigo', tropaCodigo)

      const res = await fetch(`/api/reportes/conciliacion-faena-factura?${params.toString()}`)
      const result = await res.json()
      if (result.success) {
        setData(result.data)
      } else {
        toast.error(result.error || 'Error al cargar datos')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // KPIs
  const totalMedias = data.reduce((sum, d) => sum + d.totalMedias, 0)
  const totalDespachadas = data.reduce((sum, d) => sum + d.mediasDespachadas, 0)
  const totalFacturadas = data.reduce((sum, d) => sum + d.mediasFacturadas, 0)
  const porcentajeGlobal = totalMedias > 0 ? Math.round((totalFacturadas / totalMedias) * 10000) / 100 : 0
  const totalMontoFacturado = data.reduce((sum, d) => sum + d.montoFacturado, 0)
  const totalMontoCobrado = data.reduce((sum, d) => sum + d.montoCobrado, 0)

  const getCicloColor = (pct: number) => {
    if (pct >= 80) return 'text-emerald-600'
    if (pct >= 50) return 'text-amber-600'
    return 'text-red-600'
  }

  const getCicloBg = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-50 border-emerald-200'
    if (pct >= 50) return 'bg-amber-50 border-amber-200'
    return 'bg-red-50 border-red-200'
  }

  const exportarExcel = () => {
    const dateStr = new Date().toISOString().split('T')[0]
    ExcelExporter.exportToExcel({
      filename: `conciliacion_faena_factura_${dateStr}`,
      sheets: [{
        name: 'Conciliación',
        headers: ['Tropa', 'Fecha Faena', 'Productor', 'Usuario Faena', 'Cabezas', 'Medias', 'Despachadas', 'En Cámara', 'Facturadas', '% Cierre', 'Kg Faenados', 'Kg Despachados', 'Kg Facturados', 'Monto Facturado', 'Monto Cobrado'],
        data: data.map(d => [
          d.tropaCodigo,
          new Date(d.fechaFaena).toLocaleDateString('es-AR'),
          d.productorNombre,
          d.usuarioFaenaNombre,
          d.totalCabezas.toString(),
          d.totalMedias.toString(),
          d.mediasDespachadas.toString(),
          d.mediasEnCamara.toString(),
          d.mediasFacturadas.toString(),
          `${d.porcentajeCicloCerrado}%`,
          d.totalKgFaenados.toLocaleString('es-AR'),
          d.totalKgDespachados.toLocaleString('es-AR'),
          d.totalKgFacturados.toLocaleString('es-AR'),
          currencyFmt.format(d.montoFacturado),
          currencyFmt.format(d.montoCobrado)
        ])
      }],
      title: 'Conciliación Faena-Factura - Solemar Alimentaria'
    })
    toast.success('Excel descargado')
  }

  const exportarPDF = () => {
    const headers = ['Tropa', 'Fecha', 'Productor', 'Cabezas', 'Medias', 'Desp.', 'Fact.', '% Cierre', 'Monto Fact.']
    const rows = data.map(d => [
      d.tropaCodigo,
      new Date(d.fechaFaena).toLocaleDateString('es-AR'),
      d.productorNombre,
      d.totalCabezas.toString(),
      d.totalMedias.toString(),
      d.mediasDespachadas.toString(),
      d.mediasFacturadas.toString(),
      `${d.porcentajeCicloCerrado}%`,
      currencyFmt.format(d.montoFacturado)
    ])
    const doc = PDFExporter.generateReport({ title: 'Conciliación Faena-Factura', headers, data: rows, orientation: 'landscape' })
    PDFExporter.downloadPDF(doc, `conciliacion_faena_factura_${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('PDF descargado')
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label className="text-xs text-stone-500">Desde</Label>
              <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
            </div>
            <div className="flex-1">
              <Label className="text-xs text-stone-500">Hasta</Label>
              <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
            </div>
            <div className="flex-1">
              <Label className="text-xs text-stone-500">Tropa</Label>
              <Input placeholder="Código tropa" value={tropaCodigo} onChange={(e) => setTropaCodigo(e.target.value)} />
            </div>
            <Button onClick={fetchData} className="bg-amber-500 hover:bg-amber-600">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="bg-stone-50 border-stone-200">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-stone-500">Total Medias</p>
            <p className="text-xl font-bold text-stone-800">{totalMedias}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-emerald-600">Despachadas</p>
            <p className="text-xl font-bold text-emerald-800">{totalDespachadas}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-amber-600">Facturadas</p>
            <p className="text-xl font-bold text-amber-800">{totalFacturadas}</p>
          </CardContent>
        </Card>
        <Card className={getCicloBg(porcentajeGlobal)}>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-stone-500">% Ciclo Cerrado</p>
            <p className={`text-xl font-bold ${getCicloColor(porcentajeGlobal)}`}>{porcentajeGlobal}%</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-blue-600">Monto Facturado</p>
            <p className="text-lg font-bold text-blue-800">{currencyFmt.format(totalMontoFacturado)}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-green-600">Monto Cobrado</p>
            <p className="text-lg font-bold text-green-800">{currencyFmt.format(totalMontoCobrado)}</p>
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

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : data.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-stone-300" />
            <p className="text-lg text-stone-600">No hay datos para los filtros seleccionados</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50">
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Tropa</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Productor</TableHead>
                  <TableHead>Usuario Faena</TableHead>
                  <TableHead className="text-right">Cabezas</TableHead>
                  <TableHead className="text-right">Medias</TableHead>
                  <TableHead className="text-right">Despachadas</TableHead>
                  <TableHead className="text-right">En Cámara</TableHead>
                  <TableHead className="text-right">Facturadas</TableHead>
                  <TableHead className="text-right">% Cierre</TableHead>
                  <TableHead className="text-right">Monto Facturado</TableHead>
                  <TableHead className="text-right">Monto Cobrado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d) => (
                  <>
                    <TableRow 
                      key={d.tropaId}
                      className="cursor-pointer hover:bg-stone-50"
                      onClick={() => setExpandedRow(expandedRow === d.tropaId ? null : d.tropaId)}
                    >
                      <TableCell>
                        {expandedRow === d.tropaId ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono font-medium">{d.tropaCodigo}</TableCell>
                      <TableCell>{new Date(d.fechaFaena).toLocaleDateString('es-AR')}</TableCell>
                      <TableCell>{d.productorNombre}</TableCell>
                      <TableCell>{d.usuarioFaenaNombre}</TableCell>
                      <TableCell className="text-right">{d.totalCabezas}</TableCell>
                      <TableCell className="text-right">{d.totalMedias}</TableCell>
                      <TableCell className="text-right">{d.mediasDespachadas}</TableCell>
                      <TableCell className="text-right">{d.mediasEnCamara}</TableCell>
                      <TableCell className="text-right">{d.mediasFacturadas}</TableCell>
                      <TableCell className={`text-right font-bold ${getCicloColor(d.porcentajeCicloCerrado)}`}>
                        {d.porcentajeCicloCerrado}%
                      </TableCell>
                      <TableCell className="text-right">{currencyFmt.format(d.montoFacturado)}</TableCell>
                      <TableCell className="text-right">{currencyFmt.format(d.montoCobrado)}</TableCell>
                    </TableRow>
                    {expandedRow === d.tropaId && d.facturas.length > 0 && (
                      <TableRow key={`${d.tropaId}-detail`}>
                        <TableCell colSpan={13} className="bg-stone-50 p-4">
                          <div className="ml-8">
                            <p className="text-sm font-semibold mb-2">Facturas asociadas:</p>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>N° Factura</TableHead>
                                  <TableHead>Fecha</TableHead>
                                  <TableHead>Estado</TableHead>
                                  <TableHead className="text-right">Total</TableHead>
                                  <TableHead className="text-right">Saldo</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {d.facturas.map((f) => (
                                  <TableRow key={f.id}>
                                    <TableCell className="font-mono">{f.numero}</TableCell>
                                    <TableCell>{new Date(f.fecha).toLocaleDateString('es-AR')}</TableCell>
                                    <TableCell>
                                      <Badge className={
                                        f.estado === 'PAGADA' ? 'bg-emerald-100 text-emerald-700' :
                                        f.estado === 'ANULADA' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                      }>
                                        {f.estado}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{currencyFmt.format(f.total)}</TableCell>
                                    <TableCell className="text-right">{currencyFmt.format(f.saldo)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
