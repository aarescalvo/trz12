'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Search, Loader2, RefreshCw, Eye, CreditCard, Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface Factura {
  id: string; numero: string; tipoComprobante: string; clienteNombre?: string; clienteCuit?: string;
  clienteCondicionIva?: string; clienteDireccion?: string; fecha: string; subtotal: number;
  iva: number; porcentajeIva: number; total: number; saldo: number; estado: string;
  cae?: string | null; caeVencimiento?: string | null; puntoVenta: number;
  numeroAfip?: number; remito?: string; observaciones?: string; condicionVenta?: string;
  importeTributos?: number; detalles?: any[]; pagos?: any[]; tributos?: any[];
  operador?: { id: string; nombre: string }
}

interface Props { operador: { id: string; nombre: string; rol: string } }

export function ComprobantesTable({ operador }: Props) {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewFactura, setViewFactura] = useState<Factura | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  const formatCurrency = (v: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(v)
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('es-AR') : '-'

  const TIPOS_COMPROBANTE: Record<string, string> = {
    FACTURA_A: 'Factura A', FACTURA_B: 'Factura B', FACTURA_C: 'Factura C',
    NOTA_CREDITO: 'Nota de Crédito', NOTA_DEBITO: 'Nota de Débito', REMITO: 'Remito',
  }

  const CONDICION_IVA: Record<string, string> = {
    RI: 'Responsable Inscripto', CF: 'Consumidor Final', MT: 'Monotributista',
    EX: 'Exento', NR: 'No Responsable',
  }

  const METODOS_PAGO: Record<string, string> = {
    EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia Bancaria',
    CHEQUE: 'Cheque', TARJETA_DEBITO: 'Tarjeta Débito', TARJETA_CREDITO: 'Tarjeta Crédito',
  }

  const fetchFacturas = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado !== 'TODOS') params.set('estado', filtroEstado)
      if (searchTerm) params.set('search', searchTerm)
      const res = await fetch(`/api/facturacion?${params.toString()}`)
      const data = await res.json()
      if (data.success) setFacturas(data.data)
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }, [filtroEstado, searchTerm])

  useEffect(() => { fetchFacturas() }, [fetchFacturas])

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return <Badge className="bg-amber-100 text-amber-700">Pendiente</Badge>
      case 'EMITIDA': return <Badge className="bg-blue-100 text-blue-700">Emitida</Badge>
      case 'PAGADA': return <Badge className="bg-emerald-100 text-emerald-700">Pagada</Badge>
      case 'ANULADA': return <Badge className="bg-red-100 text-red-700">Anulada</Badge>
      default: return <Badge>{estado}</Badge>
    }
  }

  const getTipoLabel = (tipo: string) => {
    const map: Record<string, string> = { FACTURA_A: 'Fc A', FACTURA_B: 'Fc B', FACTURA_C: 'Fc C', NOTA_CREDITO: 'NC', NOTA_DEBITO: 'ND', REMITO: 'Rem' }
    return map[tipo] || tipo
  }

  const handleDownloadPDF = async (facturaId: string, numero: string) => {
    setDownloading(facturaId)
    try {
      const res = await fetch('/api/facturacion/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facturaId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Error al generar PDF')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Comprobante_${numero.replace(/-/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF descargado exitosamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al generar PDF')
    } finally {
      setDownloading(null)
    }
  }

  // KPIs
  const totalFacturado = facturas.filter(f => f.estado !== 'ANULADA').reduce((s, f) => s + f.total, 0)
  const pendienteCobro = facturas.filter(f => f.estado !== 'ANULADA' && f.estado !== 'PAGADA').reduce((s, f) => s + f.saldo, 0)
  const facturasVencidas = facturas.filter(f => {
    if (f.estado === 'PAGADA' || f.estado === 'ANULADA') return false
    const dias = Math.floor((Date.now() - new Date(f.fecha).getTime()) / (1000 * 60 * 60 * 24))
    return dias > 30
  }).length

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm bg-emerald-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-600" /><div><p className="text-xs text-stone-500">Total Facturado</p><p className="text-lg font-bold text-emerald-700">{formatCurrency(totalFacturado)}</p></div></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-amber-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-amber-600" /><div><p className="text-xs text-stone-500">Pendiente Cobro</p><p className="text-lg font-bold text-amber-700">{formatCurrency(pendienteCobro)}</p></div></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-red-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-red-600" /><div><p className="text-xs text-stone-500">Vencidas (+30d)</p><p className="text-xl font-bold text-red-700">{facturasVencidas}</p></div></div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="w-64"><Input placeholder="Buscar por número o cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            <SelectItem value="PENDIENTE">Pendientes</SelectItem>
            <SelectItem value="EMITIDA">Emitidas</SelectItem>
            <SelectItem value="PAGADA">Pagadas</SelectItem>
            <SelectItem value="ANULADA">Anuladas</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchFacturas}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      {/* Tabla */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
          ) : facturas.length === 0 ? (
            <div className="py-12 text-center text-stone-400"><FileText className="w-16 h-16 mx-auto mb-4 opacity-50" /><p>No hay comprobantes</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50">
                  <TableHead className="text-xs font-semibold">Tipo</TableHead>
                  <TableHead className="text-xs font-semibold">Número</TableHead>
                  <TableHead className="text-xs font-semibold">Cliente</TableHead>
                  <TableHead className="text-xs font-semibold">Fecha</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Total</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Saldo</TableHead>
                  <TableHead className="text-xs font-semibold">CAE</TableHead>
                  <TableHead className="text-xs font-semibold">Estado</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturas.map(f => (
                  <TableRow key={f.id} className="text-xs">
                    <TableCell><Badge variant="outline" className="text-xs font-mono">{getTipoLabel(f.tipoComprobante)}</Badge></TableCell>
                    <TableCell className="font-mono">{f.numero}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{f.clienteNombre || '-'}</TableCell>
                    <TableCell>{formatDate(f.fecha)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(f.total)}</TableCell>
                    <TableCell className={`text-right font-mono ${f.saldo > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{formatCurrency(f.saldo)}</TableCell>
                    <TableCell>{f.cae ? <Badge className="bg-emerald-100 text-emerald-700 text-xs">CAE</Badge> : '-'}</TableCell>
                    <TableCell>{getEstadoBadge(f.estado)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewFactura(f)} title="Ver detalle">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDownloadPDF(f.id, f.numero)}
                          disabled={downloading === f.id}
                          title="Descargar PDF"
                        >
                          {downloading === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Dialog - Profesional */}
      <Dialog open={!!viewFactura} onOpenChange={() => setViewFactura(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" maximizable>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                Comprobante {viewFactura?.numero}
              </span>
              <div className="flex gap-2">
                {viewFactura && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadPDF(viewFactura.id, viewFactura.numero)}
                    disabled={downloading === viewFactura.id}
                  >
                    {downloading === viewFactura.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
                    PDF
                  </Button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          {viewFactura && (
            <div className="space-y-4">
              {/* Encabezado */}
              <div className="flex justify-between items-start border-b-2 border-amber-500 pb-3">
                <div>
                  <p className="text-lg font-bold">{TIPOS_COMPROBANTE[viewFactura.tipoComprobante] || viewFactura.tipoComprobante}</p>
                  <p className="text-sm text-stone-500">N° {viewFactura.numero} · Pto. Vta. {String(viewFactura.puntoVenta).padStart(4, '0')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-stone-500">Fecha: {formatDate(viewFactura.fecha)}</p>
                  <p className="text-sm text-stone-500">{viewFactura.condicionVenta === 'CONTADO' ? 'Contado' : 'Cuenta Corriente'}</p>
                  {getEstadoBadge(viewFactura.estado)}
                </div>
              </div>

              {/* Cliente */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-stone-400 uppercase mb-1">Cliente</p>
                  <p className="font-medium">{viewFactura.clienteNombre || '-'}</p>
                  <p className="text-stone-500">CUIT: {viewFactura.clienteCuit || '-'}</p>
                  <p className="text-stone-500">Cond. IVA: {CONDICION_IVA[viewFactura.clienteCondicionIva || ''] || viewFactura.clienteCondicionIva || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-400 uppercase mb-1">Comprobante</p>
                  {viewFactura.numeroAfip && <p className="text-stone-500">N° AFIP: {viewFactura.numeroAfip}</p>}
                  {viewFactura.remito && <p className="text-stone-500">Remito: {viewFactura.remito}</p>}
                  {viewFactura.cae && <p className="text-emerald-600">CAE: <span className="font-mono">{viewFactura.cae}</span></p>}
                  {viewFactura.caeVencimiento && <p className="text-stone-500">Vto. CAE: {formatDate(viewFactura.caeVencimiento)}</p>}
                </div>
              </div>

              <Separator />

              {/* Detalle */}
              {viewFactura.detalles && viewFactura.detalles.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-stone-400 uppercase mb-2">Detalle</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Concepto</TableHead>
                        <TableHead className="text-xs text-right">Cant.</TableHead>
                        <TableHead className="text-xs">Unidad</TableHead>
                        <TableHead className="text-xs text-right">P.Unit.</TableHead>
                        <TableHead className="text-xs text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewFactura.detalles.map((d: any, i: number) => (
                        <TableRow key={d.id || i} className="text-xs">
                          <TableCell>{d.descripcion}</TableCell>
                          <TableCell className="text-right">{d.cantidad}</TableCell>
                          <TableCell>{d.unidad}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(d.precioUnitario)}</TableCell>
                          <TableCell className="text-right font-mono font-medium">{formatCurrency(d.subtotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <Separator />

              {/* Totales */}
              <div className="flex justify-end">
                <div className="w-72 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Subtotal:</span>
                    <span className="font-mono">{formatCurrency(viewFactura.subtotal)}</span>
                  </div>
                  {viewFactura.iva > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">IVA ({viewFactura.porcentajeIva}%):</span>
                      <span className="font-mono">{formatCurrency(viewFactura.iva)}</span>
                    </div>
                  )}
                  {(viewFactura.tributos || []).map((t: any) => (
                    <div key={t.id} className="flex justify-between text-sm">
                      <span className="text-stone-500">{t.descripcion} ({t.alicuota}%):</span>
                      <span className="font-mono">{formatCurrency(t.importe)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>TOTAL:</span>
                    <span className="font-mono text-amber-700">{formatCurrency(viewFactura.total)}</span>
                  </div>
                  {viewFactura.saldo > 0 && viewFactura.estado !== 'PAGADA' && viewFactura.estado !== 'ANULADA' && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Saldo Pendiente:</span>
                      <span className="font-mono">{formatCurrency(viewFactura.saldo)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pagos */}
              {(viewFactura.pagos || []).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold text-stone-400 uppercase mb-2">Pagos Registrados</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Fecha</TableHead>
                          <TableHead className="text-xs">Método</TableHead>
                          <TableHead className="text-xs">Referencia</TableHead>
                          <TableHead className="text-xs text-right">Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(viewFactura.pagos || []).map((p: any, i: number) => (
                          <TableRow key={p.id || i} className="text-xs">
                            <TableCell>{formatDate(p.fecha)}</TableCell>
                            <TableCell>{METODOS_PAGO[p.metodoPago] || p.metodoPago}</TableCell>
                            <TableCell>{p.referencia || '-'}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(p.monto)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              {/* Observaciones */}
              {viewFactura.observaciones && (
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-600">Observaciones</p>
                  <p className="text-sm text-stone-700 mt-1">{viewFactura.observaciones}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
