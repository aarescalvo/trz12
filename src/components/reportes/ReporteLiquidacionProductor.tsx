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
  FileSpreadsheet, Filter, Loader2, Download, User, Building2
} from 'lucide-react'
import { ExcelExporter } from '@/lib/export-excel'
import { PDFExporter } from '@/lib/export-pdf'

interface Operador {
  id: string
  nombre: string
  rol: string
  permisos: Record<string, boolean>
}

interface ClienteInfo {
  id: string
  nombre: string
  cuit: string | null
  razonSocial: string | null
  condicionIva: string | null
}

interface TropaDetail {
  tropaCodigo: string
  tropaId: string
  fecha: string
  cabezas: number
  kgVivo: number
  kgCanal: number
  rinde: number
  mediasDespachadas: number
  mediasEnCamara: number
  facturas: any[]
  pagos: any[]
}

interface FacturaDetail {
  id: string
  numero: string
  fecha: string
  total: number
  saldo: number
  estado: string
  tipoComprobante: string
  detalles: any[]
  pagos: any[]
}

interface Resumen {
  totalCabezas: number
  totalKgVivo: number
  totalKgCanal: number
  rindePromedio: number
  totalFacturado: number
  totalCobrado: number
  saldoPendiente: number
}

const currencyFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })

export function ReporteLiquidacionProductor({ operador }: { operador: Operador }) {
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<{ id: string; nombre: string }[]>([])
  const [selectedClienteId, setSelectedClienteId] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  
  const [cliente, setCliente] = useState<ClienteInfo | null>(null)
  const [tropas, setTropas] = useState<TropaDetail[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [facturas, setFacturas] = useState<FacturaDetail[]>([])

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
    if (!selectedClienteId) {
      toast.error('Seleccione un cliente')
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('clienteId', selectedClienteId)
      if (fechaDesde) params.append('fechaDesde', fechaDesde)
      if (fechaHasta) params.append('fechaHasta', fechaHasta)

      const res = await fetch(`/api/reportes/liquidacion-productor?${params.toString()}`)
      const result = await res.json()
      if (result.success) {
        setCliente(result.data.cliente)
        setTropas(result.data.tropas)
        setResumen(result.data.resumen)
        setFacturas(result.data.facturas)
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

  const exportarExcel = () => {
    if (!cliente) return
    const dateStr = new Date().toISOString().split('T')[0]
    
    ExcelExporter.exportToExcel({
      filename: `liquidacion_${cliente.nombre.replace(/\s+/g, '_')}_${dateStr}`,
      sheets: [
        {
          name: 'Resumen',
          headers: ['Concepto', 'Valor'],
          data: [
            ['Cliente', cliente.nombre],
            ['CUIT', cliente.cuit || '-'],
            ['Razón Social', cliente.razonSocial || '-'],
            ['Condición IVA', cliente.condicionIva || '-'],
            ['', ''],
            ['Total Cabezas', resumen?.totalCabezas.toString() || '0'],
            ['Total Kg Vivo', resumen?.totalKgVivo.toLocaleString('es-AR') || '0'],
            ['Total Kg Canal', resumen?.totalKgCanal.toLocaleString('es-AR') || '0'],
            ['Rinde Promedio', `${resumen?.rindePromedio || 0}%`],
            ['Total Facturado', resumen ? currencyFmt.format(resumen.totalFacturado) : '$0'],
            ['Total Cobrado', resumen ? currencyFmt.format(resumen.totalCobrado) : '$0'],
            ['Saldo Pendiente', resumen ? currencyFmt.format(resumen.saldoPendiente) : '$0']
          ]
        },
        {
          name: 'Tropas',
          headers: ['Código', 'Fecha', 'Cabezas', 'Kg Vivo', 'Kg Canal', 'Rinde %', 'Despachadas', 'En Cámara'],
          data: tropas.map(t => [
            t.tropaCodigo,
            new Date(t.fecha).toLocaleDateString('es-AR'),
            t.cabezas.toString(),
            t.kgVivo.toLocaleString('es-AR'),
            t.kgCanal.toLocaleString('es-AR'),
            `${t.rinde}%`,
            t.mediasDespachadas.toString(),
            t.mediasEnCamara.toString()
          ])
        },
        {
          name: 'Facturas',
          headers: ['N°', 'Fecha', 'Tipo', 'Total', 'Saldo', 'Estado'],
          data: facturas.map(f => [
            f.numero,
            new Date(f.fecha).toLocaleDateString('es-AR'),
            f.tipoComprobante,
            f.total.toLocaleString('es-AR'),
            f.saldo.toLocaleString('es-AR'),
            f.estado
          ])
        }
      ],
      title: `Liquidación Productor - ${cliente.nombre} - Solemar Alimentaria`
    })
    toast.success('Excel descargado')
  }

  const exportarPDF = () => {
    if (!cliente) return
    const dateStr = new Date().toISOString().split('T')[0]
    const headers = ['Tropa', 'Fecha', 'Cabezas', 'Kg Vivo', 'Kg Canal', 'Rinde %']
    const rows = tropas.map(t => [
      t.tropaCodigo,
      new Date(t.fecha).toLocaleDateString('es-AR'),
      t.cabezas.toString(),
      t.kgVivo.toLocaleString('es-AR'),
      t.kgCanal.toLocaleString('es-AR'),
      `${t.rinde}%`
    ])
    const doc = PDFExporter.generateReport({ 
      title: `Liquidación - ${cliente.nombre}`, 
      subtitle: `CUIT: ${cliente.cuit || '-'} | Total Cabezas: ${resumen?.totalCabezas || 0} | Rinde: ${resumen?.rindePromedio || 0}%`,
      headers, 
      data: rows, 
      orientation: 'landscape' 
    })
    PDFExporter.downloadPDF(doc, `liquidacion_${cliente.nombre.replace(/\s+/g, '_')}_${dateStr}.pdf`)
    toast.success('PDF descargado')
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label className="text-xs text-stone-500">Cliente (Usuario Faena) *</Label>
              <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                <SelectTrigger><SelectValue placeholder="Seleccione un cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-xs text-stone-500">Desde</Label>
              <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
            </div>
            <div className="flex-1">
              <Label className="text-xs text-stone-500">Hasta</Label>
              <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
            </div>
            <Button onClick={fetchData} className="bg-amber-500 hover:bg-amber-600" disabled={!selectedClienteId}>
              <Filter className="w-4 h-4 mr-2" />
              Consultar
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : !cliente ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-stone-300" />
            <p className="text-lg text-stone-600">Seleccione un cliente para ver la liquidación</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Client Info Card */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                {cliente.nombre}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-stone-500">CUIT:</span> <span className="font-medium">{cliente.cuit || '-'}</span></div>
                <div><span className="text-stone-500">Razón Social:</span> <span className="font-medium">{cliente.razonSocial || '-'}</span></div>
                <div><span className="text-stone-500">Condición IVA:</span> <span className="font-medium">{cliente.condicionIva || '-'}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* KPI Cards */}
          {resumen && (
            <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
              <Card className="bg-stone-50 border-stone-200">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-stone-500">Total Cabezas</p>
                  <p className="text-xl font-bold text-stone-800">{resumen.totalCabezas}</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-blue-600">Kg Vivo</p>
                  <p className="text-xl font-bold text-blue-800">{resumen.totalKgVivo.toLocaleString('es-AR')}</p>
                </CardContent>
              </Card>
              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-emerald-600">Kg Canal</p>
                  <p className="text-xl font-bold text-emerald-800">{resumen.totalKgCanal.toLocaleString('es-AR')}</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-amber-600">Rinde Prom.</p>
                  <p className="text-xl font-bold text-amber-800">{resumen.rindePromedio}%</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-purple-600">Total Facturado</p>
                  <p className="text-lg font-bold text-purple-800">{currencyFmt.format(resumen.totalFacturado)}</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-green-600">Total Cobrado</p>
                  <p className="text-lg font-bold text-green-800">{currencyFmt.format(resumen.totalCobrado)}</p>
                </CardContent>
              </Card>
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-red-600">Saldo</p>
                  <p className="text-lg font-bold text-red-800">{currencyFmt.format(resumen.saldoPendiente)}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Export buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportarExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar Excel (3 hojas)
            </Button>
            <Button variant="outline" size="sm" onClick={exportarPDF}>
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>

          {/* Tropas Table */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 py-3">
              <CardTitle className="text-base">Tropas del Período</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {tropas.length === 0 ? (
                <div className="p-8 text-center text-stone-400">No hay tropas para el período seleccionado</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Cabezas</TableHead>
                        <TableHead className="text-right">Kg Vivo</TableHead>
                        <TableHead className="text-right">Kg Canal</TableHead>
                        <TableHead className="text-right">Rinde %</TableHead>
                        <TableHead className="text-right">Despachadas</TableHead>
                        <TableHead className="text-right">En Cámara</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tropas.map((t) => (
                        <TableRow key={t.tropaId} className="hover:bg-stone-50">
                          <TableCell className="font-mono font-medium">{t.tropaCodigo}</TableCell>
                          <TableCell>{new Date(t.fecha).toLocaleDateString('es-AR')}</TableCell>
                          <TableCell className="text-right">{t.cabezas}</TableCell>
                          <TableCell className="text-right">{t.kgVivo.toLocaleString('es-AR')}</TableCell>
                          <TableCell className="text-right">{t.kgCanal.toLocaleString('es-AR')}</TableCell>
                          <TableCell className="text-right font-bold">{t.rinde}%</TableCell>
                          <TableCell className="text-right">{t.mediasDespachadas}</TableCell>
                          <TableCell className="text-right">{t.mediasEnCamara}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Facturas */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 py-3">
              <CardTitle className="text-base">Facturas del Período</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {facturas.length === 0 ? (
                <div className="p-8 text-center text-stone-400">No hay facturas para el período seleccionado</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Factura</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facturas.map((f) => (
                        <TableRow key={f.id} className="hover:bg-stone-50">
                          <TableCell className="font-mono">{f.numero}</TableCell>
                          <TableCell>{new Date(f.fecha).toLocaleDateString('es-AR')}</TableCell>
                          <TableCell>{f.tipoComprobante}</TableCell>
                          <TableCell className="text-right">{currencyFmt.format(f.total)}</TableCell>
                          <TableCell className="text-right">{currencyFmt.format(f.saldo)}</TableCell>
                          <TableCell>
                            <Badge className={
                              f.estado === 'PAGADA' ? 'bg-emerald-100 text-emerald-700' :
                              f.estado === 'ANULADA' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }>
                              {f.estado}
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

          {/* Pagos */}
          {facturas.some(f => f.pagos.length > 0) && (
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 py-3">
                <CardTitle className="text-base">Pagos Registrados</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Factura</TableHead>
                        <TableHead>Fecha Pago</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Referencia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facturas.flatMap(f => 
                        f.pagos.map((p: any) => (
                          <TableRow key={p.id} className="hover:bg-stone-50">
                            <TableCell className="font-mono">{f.numero}</TableCell>
                            <TableCell>{new Date(p.fecha).toLocaleDateString('es-AR')}</TableCell>
                            <TableCell>{p.metodoPago}</TableCell>
                            <TableCell className="text-right">{currencyFmt.format(p.monto)}</TableCell>
                            <TableCell>{p.referencia || '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
