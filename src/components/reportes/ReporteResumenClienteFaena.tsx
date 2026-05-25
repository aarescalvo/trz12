'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  Users, Filter, Loader2, Download, FileSpreadsheet, ChevronDown, ChevronUp
} from 'lucide-react'
import { ExcelExporter } from '@/lib/export-excel'
import { PDFExporter } from '@/lib/export-pdf'

interface Operador {
  id: string
  nombre: string
  rol: string
  permisos: Record<string, boolean>
}

interface FaenaVsFacturadoItem {
  clienteId: string
  clienteNombre: string
  cuit: string
  cabezasFaenadas: number
  kgFaenados: number
  kgDespachados: number
  kgFacturados: number
  montoFacturado: number
  mediasEnCamara: number
  ratioFacturadoFaena: number
}

interface FacturaDetail {
  id: string
  numero: string
  fecha: string
  total: number
  saldo: number
  estado: string
  tipoComprobante: string
}

interface FacturadoVsPagadoItem {
  clienteId: string
  clienteNombre: string
  totalFacturado: number
  totalCobrado: number
  saldoPendiente: number
  facturasPendientes: number
  facturasPagadas: number
  facturasAnuladas: number
  facturas: FacturaDetail[]
}

const currencyFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })

const getRatioColor = (ratio: number) => {
  if (ratio >= 80) return 'text-emerald-600'
  if (ratio >= 50) return 'text-amber-600'
  return 'text-red-600'
}

export function ReporteResumenClienteFaena({ operador }: { operador: Operador }) {
  const [loading, setLoading] = useState(false)
  const [subTab, setSubTab] = useState('faenaVsFacturado')
  const [faenaVsFacturado, setFaenaVsFacturado] = useState<FaenaVsFacturadoItem[]>([])
  const [facturadoVsPagado, setFacturadoVsPagado] = useState<FacturadoVsPagadoItem[]>([])
  const [clientes, setClientes] = useState<{ id: string; nombre: string }[]>([])
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [clienteId, setClienteId] = useState('todos')
  const [expandedClient, setExpandedClient] = useState<string | null>(null)

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

      const res = await fetch(`/api/reportes/resumen-cliente-faena?${params.toString()}`)
      const result = await res.json()
      if (result.success) {
        setFaenaVsFacturado(result.data.faenaVsFacturado)
        setFacturadoVsPagado(result.data.facturadoVsPagado)
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
    if (subTab === 'faenaVsFacturado') {
      ExcelExporter.exportToExcel({
        filename: `resumen_faena_vs_facturado_${dateStr}`,
        sheets: [{
          name: 'Faena vs Facturado',
          headers: ['Cliente', 'CUIT', 'Cabezas', 'Kg Faenados', 'Kg Despachados', 'Kg Facturados', 'Monto Facturado', 'En Cámara', 'Ratio %'],
          data: faenaVsFacturado.map(d => [
            d.clienteNombre, d.cuit, d.cabezasFaenadas.toString(),
            d.kgFaenados.toLocaleString('es-AR'), d.kgDespachados.toLocaleString('es-AR'),
            d.kgFacturados.toLocaleString('es-AR'), currencyFmt.format(d.montoFacturado),
            d.mediasEnCamara.toString(), `${d.ratioFacturadoFaena}%`
          ])
        }],
        title: 'Resumen Faena vs Facturado - Solemar Alimentaria'
      })
    } else {
      ExcelExporter.exportToExcel({
        filename: `resumen_facturado_vs_pagado_${dateStr}`,
        sheets: [{
          name: 'Facturado vs Pagado',
          headers: ['Cliente', 'Total Facturado', 'Total Cobrado', 'Saldo Pendiente', 'Pendientes', 'Pagadas', 'Anuladas'],
          data: facturadoVsPagado.map(d => [
            d.clienteNombre, currencyFmt.format(d.totalFacturado),
            currencyFmt.format(d.totalCobrado), currencyFmt.format(d.saldoPendiente),
            d.facturasPendientes.toString(), d.facturasPagadas.toString(), d.facturasAnuladas.toString()
          ])
        }],
        title: 'Resumen Facturado vs Pagado - Solemar Alimentaria'
      })
    }
    toast.success('Excel descargado')
  }

  const exportarPDF = () => {
    const dateStr = new Date().toISOString().split('T')[0]
    if (subTab === 'faenaVsFacturado') {
      const headers = ['Cliente', 'CUIT', 'Cabezas', 'Kg Faenados', 'Kg Facturados', 'Monto Fact.', 'Ratio %']
      const rows = faenaVsFacturado.map(d => [
        d.clienteNombre, d.cuit, d.cabezasFaenadas.toString(),
        d.kgFaenados.toLocaleString('es-AR'), d.kgFacturados.toLocaleString('es-AR'),
        currencyFmt.format(d.montoFacturado), `${d.ratioFacturadoFaena}%`
      ])
      const doc = PDFExporter.generateReport({ title: 'Faena vs Facturado por Cliente', headers, data: rows, orientation: 'landscape' })
      PDFExporter.downloadPDF(doc, `faena_vs_facturado_${dateStr}.pdf`)
    } else {
      const headers = ['Cliente', 'Total Facturado', 'Total Cobrado', 'Saldo Pendiente', 'Pendientes', 'Pagadas']
      const rows = facturadoVsPagado.map(d => [
        d.clienteNombre, currencyFmt.format(d.totalFacturado),
        currencyFmt.format(d.totalCobrado), currencyFmt.format(d.saldoPendiente),
        d.facturasPendientes.toString(), d.facturasPagadas.toString()
      ])
      const doc = PDFExporter.generateReport({ title: 'Facturado vs Pagado por Cliente', headers, data: rows, orientation: 'landscape' })
      PDFExporter.downloadPDF(doc, `facturado_vs_pagado_${dateStr}.pdf`)
    }
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

      {/* Sub-tabs */}
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="faenaVsFacturado" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Faena vs Facturado
          </TabsTrigger>
          <TabsTrigger value="facturadoVsPagado" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Facturado vs Pagado
          </TabsTrigger>
        </TabsList>

        {/* Export buttons */}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={exportarExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportarPDF}>
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        <TabsContent value="faenaVsFacturado">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : (
            <Card className="border-0 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50">
                      <TableHead>Cliente</TableHead>
                      <TableHead>CUIT</TableHead>
                      <TableHead className="text-right">Cabezas Faenadas</TableHead>
                      <TableHead className="text-right">Kg Faenados</TableHead>
                      <TableHead className="text-right">Kg Despachados</TableHead>
                      <TableHead className="text-right">Kg Facturados</TableHead>
                      <TableHead className="text-right">Monto Facturado</TableHead>
                      <TableHead className="text-right">En Cámara</TableHead>
                      <TableHead className="text-right">Ratio %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faenaVsFacturado.map((d) => (
                      <TableRow key={d.clienteId} className="hover:bg-stone-50">
                        <TableCell className="font-medium">{d.clienteNombre}</TableCell>
                        <TableCell className="font-mono text-sm">{d.cuit}</TableCell>
                        <TableCell className="text-right">{d.cabezasFaenadas}</TableCell>
                        <TableCell className="text-right">{d.kgFaenados.toLocaleString('es-AR')}</TableCell>
                        <TableCell className="text-right">{d.kgDespachados.toLocaleString('es-AR')}</TableCell>
                        <TableCell className="text-right">{d.kgFacturados.toLocaleString('es-AR')}</TableCell>
                        <TableCell className="text-right">{currencyFmt.format(d.montoFacturado)}</TableCell>
                        <TableCell className="text-right">{d.mediasEnCamara}</TableCell>
                        <TableCell className={`text-right font-bold ${getRatioColor(d.ratioFacturadoFaena)}`}>
                          {d.ratioFacturadoFaena}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="facturadoVsPagado">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : (
            <Card className="border-0 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50">
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Total Facturado</TableHead>
                      <TableHead className="text-right">Total Cobrado</TableHead>
                      <TableHead className="text-right">Saldo Pendiente</TableHead>
                      <TableHead className="text-right">Pendientes</TableHead>
                      <TableHead className="text-right">Pagadas</TableHead>
                      <TableHead className="text-right">Anuladas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturadoVsPagado.map((d) => (
                      <>
                        <TableRow 
                          key={d.clienteId}
                          className="cursor-pointer hover:bg-stone-50"
                          onClick={() => setExpandedClient(expandedClient === d.clienteId ? null : d.clienteId)}
                        >
                          <TableCell>
                            {expandedClient === d.clienteId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </TableCell>
                          <TableCell className="font-medium">{d.clienteNombre}</TableCell>
                          <TableCell className="text-right">{currencyFmt.format(d.totalFacturado)}</TableCell>
                          <TableCell className="text-right">{currencyFmt.format(d.totalCobrado)}</TableCell>
                          <TableCell className="text-right font-bold text-red-600">{currencyFmt.format(d.saldoPendiente)}</TableCell>
                          <TableCell className="text-right">{d.facturasPendientes}</TableCell>
                          <TableCell className="text-right">{d.facturasPagadas}</TableCell>
                          <TableCell className="text-right">{d.facturasAnuladas}</TableCell>
                        </TableRow>
                        {expandedClient === d.clienteId && d.facturas.length > 0 && (
                          <TableRow key={`${d.clienteId}-detail`}>
                            <TableCell colSpan={8} className="bg-stone-50 p-4">
                              <div className="ml-8">
                                <p className="text-sm font-semibold mb-2">Facturas:</p>
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
                                    {d.facturas.map((f) => (
                                      <TableRow key={f.id}>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
