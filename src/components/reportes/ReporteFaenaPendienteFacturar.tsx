'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  AlertTriangle, Filter, RefreshCw, Loader2, Download, FileSpreadsheet
} from 'lucide-react'
import { ExcelExporter } from '@/lib/export-excel'
import { PDFExporter } from '@/lib/export-pdf'

interface Operador {
  id: string
  nombre: string
  rol: string
  permisos: Record<string, boolean>
}

interface PendienteItem {
  mediaResId: string
  codigo: string
  tropaCodigo: string
  garron: number
  peso: number
  lado: string
  usuarioId: string | null
  usuarioNombre: string
  despachoId: string | null
  despachoNumero: number | null
  fechaDespacho: string | null
  diasSinFacturar: number
  precioEstimado: number | null
  alerta: string
}

interface Summary {
  totalMedias: number
  totalKg: number
  totalEstimado: number
  byAlert: {
    NORMAL: { count: number; kg: number; monto: number }
    ATENCION: { count: number; kg: number; monto: number }
    URGENTE: { count: number; kg: number; monto: number }
    CRITICO: { count: number; kg: number; monto: number }
  }
}

const currencyFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })

const ALERT_CONFIG: Record<string, { bg: string; text: string; badge: string }> = {
  NORMAL: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  ATENCION: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  URGENTE: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  CRITICO: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' }
}

export function ReporteFaenaPendienteFacturar({ operador }: { operador: Operador }) {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<PendienteItem[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [clientes, setClientes] = useState<{ id: string; nombre: string }[]>([])
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [clienteId, setClienteId] = useState('todos')

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    try {
      const res = await fetch('/api/clientes')
      const data = await res.json()
      if (data.success) {
        setClientes(data.data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (fechaDesde) params.append('fechaDesde', fechaDesde)
      if (fechaHasta) params.append('fechaHasta', fechaHasta)
      if (clienteId && clienteId !== 'todos') params.append('clienteId', clienteId)

      const res = await fetch(`/api/reportes/faena-pendiente-facturar?${params.toString()}`)
      const result = await res.json()
      if (result.success) {
        setItems(result.data.items)
        setSummary(result.data.summary)
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

  const exportarExcel = () => {
    const dateStr = new Date().toISOString().split('T')[0]
    ExcelExporter.exportToExcel({
      filename: `pendiente_facturar_${dateStr}`,
      sheets: [{
        name: 'Pendiente Facturar',
        headers: ['Tropa', 'Garrón', 'Lado', 'Kg', 'Cliente', 'Despacho N°', 'Fecha Despacho', 'Días Sin Facturar', 'Precio Estimado', 'Alerta'],
        data: items.map(d => [
          d.tropaCodigo,
          d.garron.toString(),
          d.lado,
          d.peso.toLocaleString('es-AR'),
          d.usuarioNombre,
          d.despachoNumero?.toString() || '-',
          d.fechaDespacho ? new Date(d.fechaDespacho).toLocaleDateString('es-AR') : '-',
          d.diasSinFacturar.toString(),
          d.precioEstimado ? currencyFmt.format(d.precioEstimado) : '-',
          d.alerta
        ])
      }],
      title: 'Faena Pendiente de Facturar - Solemar Alimentaria'
    })
    toast.success('Excel descargado')
  }

  const exportarPDF = () => {
    const headers = ['Tropa', 'Garrón', 'Lado', 'Kg', 'Cliente', 'Despacho', 'Días', 'Alerta']
    const rows = items.map(d => [
      d.tropaCodigo,
      d.garron.toString(),
      d.lado,
      d.peso.toFixed(1),
      d.usuarioNombre,
      d.despachoNumero?.toString() || '-',
      d.diasSinFacturar.toString(),
      d.alerta
    ])
    const doc = PDFExporter.generateReport({ title: 'Faena Pendiente de Facturar', headers, data: rows, orientation: 'landscape' })
    PDFExporter.downloadPDF(doc, `pendiente_facturar_${new Date().toISOString().split('T')[0]}.pdf`)
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
              <Label className="text-xs text-stone-500">Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {clientes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchData} className="bg-amber-500 hover:bg-amber-600">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-8 gap-3">
          <Card className="bg-stone-50 border-stone-200">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-stone-500">Total Medias</p>
              <p className="text-xl font-bold text-stone-800">{summary.totalMedias}</p>
            </CardContent>
          </Card>
          <Card className="bg-stone-50 border-stone-200">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-stone-500">Total Kg</p>
              <p className="text-xl font-bold text-stone-800">{summary.totalKg.toLocaleString('es-AR')}</p>
            </CardContent>
          </Card>
          <Card className="bg-stone-50 border-stone-200">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-stone-500">Monto Estimado</p>
              <p className="text-lg font-bold text-stone-800">{currencyFmt.format(summary.totalEstimado)}</p>
            </CardContent>
          </Card>
          {Object.entries(summary.byAlert).map(([level, info]) => (
            <Card key={level} className={ALERT_CONFIG[level].bg}>
              <CardContent className="p-3 text-center">
                <p className={`text-xs ${ALERT_CONFIG[level].text}`}>{level === 'ATENCION' ? 'Atención' : level.charAt(0) + level.slice(1).toLowerCase()}</p>
                <p className={`text-xl font-bold ${ALERT_CONFIG[level].text}`}>{info.count}</p>
                <p className={`text-xs ${ALERT_CONFIG[level].text}`}>{info.kg.toFixed(0)} kg</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
      ) : items.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-stone-300" />
            <p className="text-lg text-stone-600">No hay medias pendientes de facturación</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="overflow-x-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50">
                  <TableHead>Tropa</TableHead>
                  <TableHead>Garrón</TableHead>
                  <TableHead>Lado</TableHead>
                  <TableHead className="text-right">Kg</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Despacho N°</TableHead>
                  <TableHead>Fecha Despacho</TableHead>
                  <TableHead className="text-right">Días Sin Facturar</TableHead>
                  <TableHead className="text-right">Precio Estimado</TableHead>
                  <TableHead>Alerta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((d) => (
                  <TableRow key={d.mediaResId} className="hover:bg-stone-50">
                    <TableCell className="font-mono">{d.tropaCodigo}</TableCell>
                    <TableCell>{d.garron}</TableCell>
                    <TableCell>{d.lado === 'IZQUIERDA' ? 'Izq' : 'Der'}</TableCell>
                    <TableCell className="text-right">{d.peso.toFixed(1)}</TableCell>
                    <TableCell>{d.usuarioNombre}</TableCell>
                    <TableCell>{d.despachoNumero ? `#${d.despachoNumero}` : '-'}</TableCell>
                    <TableCell>{d.fechaDespacho ? new Date(d.fechaDespacho).toLocaleDateString('es-AR') : '-'}</TableCell>
                    <TableCell className="text-right font-bold">{d.diasSinFacturar}</TableCell>
                    <TableCell className="text-right">{d.precioEstimado ? currencyFmt.format(d.precioEstimado) : '-'}</TableCell>
                    <TableCell>
                      <Badge className={ALERT_CONFIG[d.alerta]?.badge || 'bg-stone-100 text-stone-700'}>
                        {d.alerta === 'ATENCION' ? 'Atención' : d.alerta === 'CRITICO' ? 'Crítico' : d.alerta === 'URGENTE' ? 'Urgente' : 'Normal'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
