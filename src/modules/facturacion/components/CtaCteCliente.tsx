'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Building2, Loader2, RefreshCw, DollarSign, CreditCard,
  CheckCircle, AlertCircle, ChevronDown, ChevronUp, FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface Cliente {
  id: string; nombre: string; cuit?: string; razonSocial?: string;
  condicionIva?: string
}
interface Pago { id: string; fecha: string; monto: number; metodoPago: string; referencia?: string }
interface Factura {
  id: string; numero: string; tipoComprobante: string; fecha: string;
  total: number; saldo: number; estado: string; pagos?: Pago[];
  detalles?: any[]; observaciones?: string
}

interface Props { operador: { id: string; nombre: string; rol: string } }

const METODOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia Bancaria' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'TARJETA_DEBITO', label: 'Tarjeta Débito' },
  { value: 'TARJETA_CREDITO', label: 'Tarjeta Crédito' },
]

export function CtaCteCliente({ operador }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteId, setClienteId] = useState('')
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(false)

  // Pago simple
  const [pagoOpen, setPagoOpen] = useState(false)
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null)
  const [saving, setSaving] = useState(false)
  const [pagoData, setPagoData] = useState({ monto: 0, metodoPago: 'EFECTIVO', referencia: '', banco: '', observaciones: '' })

  // Imputación múltiple
  const [imputacionOpen, setImputacionOpen] = useState(false)
  const [imputacionData, setImputacionData] = useState({
    montoTotal: 0,
    metodoPago: 'TRANSFERENCIA',
    referencia: '',
    banco: '',
    observaciones: '',
  })
  const [facturasSeleccionadas, setFacturasSeleccionadas] = useState<Map<string, number>>(new Map())
  const [showHistorial, setShowHistorial] = useState<string | null>(null)

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(v)

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('es-AR') : '-'

  useEffect(() => {
    fetch('/api/clientes')
      .then(r => r.json())
      .then(d => { if (d.success) setClientes(d.data) })
  }, [])

  const fetchCtaCte = useCallback(async () => {
    if (!clienteId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/facturacion?clienteId=${clienteId}`)
      const data = await res.json()
      if (data.success) setFacturas(data.data)
    } catch {
      toast.error('Error al cargar cuenta corriente')
    } finally {
      setLoading(false)
    }
  }, [clienteId])

  useEffect(() => { fetchCtaCte() }, [fetchCtaCte])

  const clienteSeleccionado = clientes.find(c => c.id === clienteId)

  // Solo facturas con saldo pendiente
  const facturasPendientes = facturas.filter(f => f.saldo > 0 && f.estado !== 'ANULADA')
  const saldoTotal = facturas.filter(f => f.estado !== 'ANULADA').reduce((s, f) => s + f.saldo, 0)
  const totalFacturado = facturas.filter(f => f.estado !== 'ANULADA').reduce((s, f) => s + f.total, 0)
  const totalCobrado = totalFacturado - saldoTotal

  // Pago simple
  const handlePagar = async () => {
    if (!facturaSeleccionada || pagoData.monto <= 0) {
      toast.error('Monto inválido')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/cuenta-corriente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facturaId: facturaSeleccionada.id,
          ...pagoData,
          operadorId: operador.id,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Pago registrado exitosamente')
        setPagoOpen(false)
        setPagoData({ monto: 0, metodoPago: 'EFECTIVO', referencia: '', banco: '', observaciones: '' })
        fetchCtaCte()
      } else {
        toast.error(data.error || 'Error al registrar pago')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Imputación múltiple
  const handleImputarPago = async () => {
    if (facturasSeleccionadas.size === 0) {
      toast.error('Seleccione al menos una factura')
      return
    }
    if (!imputacionData.montoTotal || imputacionData.montoTotal <= 0) {
      toast.error('Ingrese un monto total válido')
      return
    }

    const totalImputar = Array.from(facturasSeleccionadas.values()).reduce((s, m) => s + m, 0)
    if (Math.abs(totalImputar - imputacionData.montoTotal) > 0.01) {
      toast.error(`El monto total ($${imputacionData.montoTotal.toLocaleString('es-AR')}) no coincide con la suma de imputaciones ($${totalImputar.toLocaleString('es-AR')})`)
      return
    }

    setSaving(true)
    try {
      const imputaciones = Array.from(facturasSeleccionadas.entries()).map(([facturaId, monto]) => ({
        facturaId,
        monto,
      }))

      const res = await fetch('/api/cuenta-corriente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imputaciones,
          metodoPago: imputacionData.metodoPago,
          referencia: imputacionData.referencia,
          banco: imputacionData.banco,
          observaciones: imputacionData.observaciones,
          operadorId: operador.id,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Pagos imputados exitosamente')
        setImputacionOpen(false)
        setFacturasSeleccionadas(new Map())
        setImputacionData({ montoTotal: 0, metodoPago: 'TRANSFERENCIA', referencia: '', banco: '', observaciones: '' })
        fetchCtaCte()
      } else {
        toast.error(data.error || 'Error al imputar pagos')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const toggleFacturaImputacion = (factura: Factura) => {
    setFacturasSeleccionadas(prev => {
      const newMap = new Map(prev)
      if (newMap.has(factura.id)) {
        newMap.delete(factura.id)
      } else {
        newMap.set(factura.id, factura.saldo)
      }
      return newMap
    })
  }

  const updateMontoImputacion = (facturaId: string, monto: number) => {
    setFacturasSeleccionadas(prev => {
      const newMap = new Map(prev)
      newMap.set(facturaId, monto)
      return newMap
    })
  }

  const autoDistribuirPago = () => {
    const nuevasImputaciones = new Map<string, number>()
    let montoRestante = imputacionData.montoTotal

    // Distribuir por orden de antigüedad (más viejas primero)
    const pendientesOrdenadas = [...facturasPendientes].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    )

    for (const f of pendientesOrdenadas) {
      if (montoRestante <= 0) break
      const montoImputar = Math.min(montoRestante, f.saldo)
      nuevasImputaciones.set(f.id, montoImputar)
      montoRestante -= montoImputar
    }

    setFacturasSeleccionadas(nuevasImputaciones)
    if (montoRestante > 0) {
      toast.info(`Quedan ${formatCurrency(montoRestante)} sin imputar`)
    }
  }

  const totalImputacionSeleccionada = Array.from(facturasSeleccionadas.values()).reduce((s, m) => s + m, 0)

  return (
    <div className="space-y-4">
      {/* Selector de cliente */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-3">
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
                <SelectContent>
                  {clientes.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.razonSocial || c.nombre} {c.cuit ? `(${c.cuit})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={fetchCtaCte} disabled={!clienteId}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            {facturasPendientes.length > 0 && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  setImputacionData({ montoTotal: 0, metodoPago: 'TRANSFERENCIA', referencia: '', banco: '', observaciones: '' })
                  setFacturasSeleccionadas(new Map())
                  setImputacionOpen(true)
                }}
              >
                <CreditCard className="w-4 h-4 mr-1" /> Imputar Pago
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info cliente */}
      {clienteSeleccionado && (
        <Card className="border-0 shadow-sm bg-stone-50">
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <div><span className="text-stone-400">Razón Social:</span> <span className="font-medium">{clienteSeleccionado.razonSocial || clienteSeleccionado.nombre}</span></div>
              {clienteSeleccionado.cuit && <div><span className="text-stone-400">CUIT:</span> <span className="font-mono">{clienteSeleccionado.cuit}</span></div>}
              {clienteSeleccionado.condicionIva && <div><span className="text-stone-400">Cond. IVA:</span> {clienteSeleccionado.condicionIva}</div>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      {clienteId && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 shadow-sm bg-stone-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-stone-600" />
                <div>
                  <p className="text-xs text-stone-500">Total Facturado</p>
                  <p className="text-lg font-bold">{formatCurrency(totalFacturado)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-emerald-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs text-stone-500">Cobrado</p>
                  <p className="text-lg font-bold text-emerald-700">{formatCurrency(totalCobrado)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-amber-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-xs text-stone-500">Saldo Pendiente</p>
                  <p className="text-lg font-bold text-amber-700">{formatCurrency(saldoTotal)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de movimientos */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : !clienteId ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center text-stone-400">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Seleccione un cliente para ver su cuenta corriente</p>
          </CardContent>
        </Card>
      ) : facturas.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center text-stone-400">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No hay movimientos para este cliente</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50">
                  <TableHead className="text-xs font-semibold">Comprobante</TableHead>
                  <TableHead className="text-xs font-semibold">Tipo</TableHead>
                  <TableHead className="text-xs font-semibold">Fecha</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Total</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Saldo</TableHead>
                  <TableHead className="text-xs font-semibold">Estado</TableHead>
                  <TableHead className="text-xs font-semibold">Pagos</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturas.map(f => (
                  <>
                    <TableRow key={f.id} className="text-xs">
                      <TableCell className="font-mono font-medium">{f.numero}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {f.tipoComprobante === 'FACTURA_A' ? 'Fc A' :
                           f.tipoComprobante === 'FACTURA_B' ? 'Fc B' :
                           f.tipoComprobante === 'FACTURA_C' ? 'Fc C' :
                           f.tipoComprobante === 'NOTA_CREDITO' ? 'NC' :
                           f.tipoComprobante === 'NOTA_DEBITO' ? 'ND' : f.tipoComprobante}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(f.fecha)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(f.total)}</TableCell>
                      <TableCell className={`text-right font-mono ${f.saldo > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600'}`}>
                        {formatCurrency(f.saldo)}
                      </TableCell>
                      <TableCell>
                        {f.estado === 'PAGADA' ? <Badge className="bg-emerald-100 text-emerald-700 text-xs">Pagada</Badge> :
                         f.estado === 'ANULADA' ? <Badge className="bg-red-100 text-red-700 text-xs">Anulada</Badge> :
                         f.estado === 'EMITIDA' ? <Badge className="bg-blue-100 text-blue-700 text-xs">Emitida</Badge> :
                         <Badge className="bg-amber-100 text-amber-700 text-xs">Pendiente</Badge>}
                      </TableCell>
                      <TableCell>
                        {f.pagos && f.pagos.length > 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs gap-1"
                            onClick={() => setShowHistorial(showHistorial === f.id ? null : f.id)}
                          >
                            {f.pagos.length} pago(s)
                            {showHistorial === f.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </Button>
                        ) : (
                          <span className="text-stone-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {f.saldo > 0 && f.estado !== 'ANULADA' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
                            onClick={() => {
                              setFacturaSeleccionada(f)
                              setPagoData({ ...pagoData, monto: f.saldo })
                              setPagoOpen(true)
                            }}
                          >
                            <CreditCard className="w-3.5 h-3.5 mr-1" /> Pagar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {/* Historial de pagos expandible */}
                    {showHistorial === f.id && f.pagos && f.pagos.length > 0 && (
                      <TableRow key={`${f.id}-pagos`}>
                        <TableCell colSpan={8} className="bg-stone-50/50 p-0">
                          <div className="px-8 py-2">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-transparent">
                                  <TableHead className="text-[10px] py-1">Fecha Pago</TableHead>
                                  <TableHead className="text-[10px] py-1">Método</TableHead>
                                  <TableHead className="text-[10px] py-1">Referencia</TableHead>
                                  <TableHead className="text-[10px] py-1 text-right">Monto</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {f.pagos!.map((p, i) => (
                                  <TableRow key={p.id || i} className="bg-transparent">
                                    <TableCell className="text-[11px] py-1">{formatDate(p.fecha)}</TableCell>
                                    <TableCell className="text-[11px] py-1">
                                      {METODOS_PAGO.find(m => m.value === p.metodoPago)?.label || p.metodoPago}
                                    </TableCell>
                                    <TableCell className="text-[11px] py-1 font-mono">{p.referencia || '-'}</TableCell>
                                    <TableCell className="text-[11px] py-1 text-right font-mono font-medium text-emerald-700">
                                      {formatCurrency(p.monto)}
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
          </CardContent>
        </Card>
      )}

      {/* Dialog Pago Simple */}
      <Dialog open={pagoOpen} onOpenChange={setPagoOpen}>
        <DialogContent className="max-w-sm" maximizable>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              Registrar Pago
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-stone-50 rounded-lg p-3 space-y-1">
              <p className="text-sm text-stone-500">Factura: <span className="font-mono font-medium">{facturaSeleccionada?.numero}</span></p>
              <p className="text-sm text-stone-500">Total: <span className="font-mono">{formatCurrency(facturaSeleccionada?.total || 0)}</span></p>
              <p className="text-sm text-stone-500">Saldo: <span className="font-bold text-amber-600 font-mono">{formatCurrency(facturaSeleccionada?.saldo || 0)}</span></p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Monto</Label>
              <Input
                type="number"
                value={pagoData.monto || ''}
                onChange={e => setPagoData({ ...pagoData, monto: parseFloat(e.target.value) || 0 })}
                max={facturaSeleccionada?.saldo}
              />
              {facturaSeleccionada && pagoData.monto > facturaSeleccionada.saldo && (
                <p className="text-xs text-red-500">El monto excede el saldo pendiente</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Método de Pago</Label>
              <Select value={pagoData.metodoPago} onValueChange={v => setPagoData({ ...pagoData, metodoPago: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Referencia</Label>
              <Input
                value={pagoData.referencia}
                onChange={e => setPagoData({ ...pagoData, referencia: e.target.value })}
                placeholder="N° transferencia, cheque..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Observaciones</Label>
              <Textarea
                value={pagoData.observaciones}
                onChange={e => setPagoData({ ...pagoData, observaciones: e.target.value })}
                placeholder="Observaciones del pago..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPagoOpen(false)}>Cancelar</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handlePagar}
              disabled={saving || pagoData.monto <= 0 || (facturaSeleccionada ? pagoData.monto > facturaSeleccionada.saldo : false)}
            >
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Imputación Múltiple */}
      <Dialog open={imputacionOpen} onOpenChange={setImputacionOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" maximizable>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              Imputar Pago a Múltiples Facturas
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Datos del pago */}
            <Card className="border shadow-sm">
              <CardContent className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Monto Total a Imputar</Label>
                    <Input
                      type="number"
                      value={imputacionData.montoTotal || ''}
                      onChange={e => setImputacionData({ ...imputacionData, montoTotal: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Método de Pago</Label>
                    <Select value={imputacionData.metodoPago} onValueChange={v => setImputacionData({ ...imputacionData, metodoPago: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {METODOS_PAGO.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Referencia</Label>
                    <Input
                      value={imputacionData.referencia}
                      onChange={e => setImputacionData({ ...imputacionData, referencia: e.target.value })}
                      placeholder="N° transferencia..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Banco</Label>
                    <Input
                      value={imputacionData.banco}
                      onChange={e => setImputacionData({ ...imputacionData, banco: e.target.value })}
                      placeholder="Nombre del banco..."
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={autoDistribuirPago}
                  disabled={!imputacionData.montoTotal}
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Auto-distribuir por antigüedad
                </Button>
              </CardContent>
            </Card>

            {/* Facturas pendientes para seleccionar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-semibold text-stone-500 uppercase">
                  Facturas Pendientes ({facturasPendientes.length})
                </p>
                <p className="text-xs text-stone-500">
                  Seleccionadas: {facturasSeleccionadas.size} | Total: <span className={`font-mono font-bold ${Math.abs(totalImputacionSeleccionada - imputacionData.montoTotal) < 0.01 ? 'text-emerald-600' : 'text-amber-600'}`}>{formatCurrency(totalImputacionSeleccionada)}</span>
                </p>
              </div>

              <div className="max-h-64 overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead className="text-[10px] py-1 w-8"></TableHead>
                      <TableHead className="text-[10px] py-1">Comprobante</TableHead>
                      <TableHead className="text-[10px] py-1">Fecha</TableHead>
                      <TableHead className="text-[10px] py-1 text-right">Saldo</TableHead>
                      <TableHead className="text-[10px] py-1 text-right">A Imputar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturasPendientes.map(f => {
                      const seleccionada = facturasSeleccionadas.has(f.id)
                      const montoImputar = facturasSeleccionadas.get(f.id) || 0
                      return (
                        <TableRow
                          key={f.id}
                          className={`text-xs cursor-pointer ${seleccionada ? 'bg-emerald-50' : ''}`}
                          onClick={() => toggleFacturaImputacion(f)}
                        >
                          <TableCell className="py-1">
                            <input
                              type="checkbox"
                              checked={seleccionada}
                              onChange={() => toggleFacturaImputacion(f)}
                              className="rounded"
                            />
                          </TableCell>
                          <TableCell className="font-mono py-1">{f.numero}</TableCell>
                          <TableCell className="py-1">{formatDate(f.fecha)}</TableCell>
                          <TableCell className="text-right font-mono py-1 text-amber-600">{formatCurrency(f.saldo)}</TableCell>
                          <TableCell className="py-1" onClick={e => e.stopPropagation()}>
                            {seleccionada && (
                              <Input
                                type="number"
                                value={montoImputar || ''}
                                onChange={e => updateMontoImputacion(f.id, parseFloat(e.target.value) || 0)}
                                className="h-7 text-xs text-right"
                                max={f.saldo}
                                min={0}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Resumen */}
            {facturasSeleccionadas.size > 0 && (
              <Card className={`border shadow-sm ${Math.abs(totalImputacionSeleccionada - imputacionData.montoTotal) < 0.01 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-stone-500">Monto a imputar</p>
                      <p className="text-lg font-bold font-mono">{formatCurrency(totalImputacionSeleccionada)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-stone-500">Monto total ingresado</p>
                      <p className="text-lg font-bold font-mono">{formatCurrency(imputacionData.montoTotal)}</p>
                    </div>
                  </div>
                  {Math.abs(totalImputacionSeleccionada - imputacionData.montoTotal) > 0.01 && (
                    <div className="flex items-center gap-1 mt-2 text-amber-600">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-xs">La diferencia es de {formatCurrency(Math.abs(totalImputacionSeleccionada - imputacionData.montoTotal))}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImputacionOpen(false)}>Cancelar</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleImputarPago}
              disabled={saving || facturasSeleccionadas.size === 0 || Math.abs(totalImputacionSeleccionada - imputacionData.montoTotal) > 0.01}
            >
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
              Imputar Pago ({facturasSeleccionadas.size} facturas)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
