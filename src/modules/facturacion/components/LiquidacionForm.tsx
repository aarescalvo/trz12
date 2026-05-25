'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  FileText, Plus, Trash2, Loader2, Shield, CheckCircle, AlertTriangle,
  DollarSign, Receipt, Lock
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

interface TipoTarifa { id: string; codigo: string; descripcion: string; unidad: string }
interface LiquidacionItem { id?: string; tipoTarifaId?: string | null; descripcion: string; unidad: string; cantidad: number; tarifaValor: number; alicuotaIVA: number; esDescuento: boolean; subtotal?: number; importeIVA?: number }
interface Liquidacion { id: string; numero: number; estado: string; kgRomaneo: number; tarifaFaenaValor: number; subtotalNeto: number; totalIVA: number; totalRetenciones: number; totalFinal: number; fechaFaena: string; cantCabezas: number; dteSenasa?: string; supervisorId?: string | null; cliente?: { id: string; nombre: string; cuit?: string; condicionIva?: string; razonSocial?: string }; tropa?: { id: string; codigo: string; especie: string; cantidadCabezas: number }; items?: LiquidacionItem[]; factura?: { id: string; numero: string; cae?: string | null } }

interface Props { operador: { id: string; nombre: string; rol: string }; liquidacionId: string; onClose?: () => void }

export function LiquidacionForm({ operador, liquidacionId, onClose }: Props) {
  const [liquidacion, setLiquidacion] = useState<Liquidacion | null>(null)
  const [tipos, setTipos] = useState<TipoTarifa[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [pinDialogOpen, setPinDialogOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [items, setItems] = useState<LiquidacionItem[]>([])
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [newItem, setNewItem] = useState<LiquidacionItem>({ descripcion: '', unidad: 'POR_KG', cantidad: 0, tarifaValor: 0, alicuotaIVA: 21, esDescuento: false })

  const formatCurrency = (v: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(v)

  const fetchLiquidacion = useCallback(async () => {
    setLoading(true)
    try {
      const [liqRes, tiposRes] = await Promise.all([
        fetch(`/api/liquidaciones/${liquidacionId}`),
        fetch('/api/tarifas?modo=tipos'),
      ])
      const liqData = await liqRes.json()
      const tiposData = await tiposRes.json()
      if (liqData.success) { setLiquidacion(liqData.data); setItems(liqData.data.items || []) }
      if (tiposData.success) setTipos(tiposData.data)
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }, [liquidacionId])

  useEffect(() => { fetchLiquidacion() }, [fetchLiquidacion])

  const handleAutorizar = async () => {
    if (pin.length < 4) { toast.error('PIN debe tener al menos 4 dígitos'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/liquidaciones/${liquidacionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'autorizar', pin, operadorId: operador.id })
      })
      const data = await res.json()
      if (data.success) { toast.success(`Autorizado por ${data.data.supervisorNombre}`); setEditMode(true); setPinDialogOpen(false); fetchLiquidacion() }
      else { toast.error(data.error || 'PIN no válido') }
    } catch { toast.error('Error de conexión') } finally { setSaving(false) }
  }

  const handleGuardarItems = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/liquidaciones/${liquidacionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'items', items: items.map(({ id, subtotal, importeIVA, ...rest }) => rest) })
      })
      const data = await res.json()
      if (data.success) { toast.success('Items actualizados'); setEditMode(false); fetchLiquidacion() }
      else { toast.error(data.error) }
    } catch { toast.error('Error al guardar') } finally { setSaving(false) }
  }

  const handleEmitir = async () => {
    if (!confirm('¿Confirma la emisión de la factura? Esta acción no se puede deshacer.')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/liquidaciones/${liquidacionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'emitir' })
      })
      const data = await res.json()
      if (data.success) { toast.success('Factura emitida exitosamente'); fetchLiquidacion() }
      else { toast.error(data.error) }
    } catch { toast.error('Error al emitir') } finally { setSaving(false) }
  }

  const handleAddItem = () => {
    if (!newItem.descripcion || newItem.cantidad <= 0 || newItem.tarifaValor <= 0) {
      toast.error('Complete todos los campos del item')
      return
    }
    setItems([...items, { ...newItem }])
    setNewItem({ descripcion: '', unidad: 'POR_KG', cantidad: 0, tarifaValor: 0, alicuotaIVA: 21, esDescuento: false })
    setAddItemOpen(false)
  }

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
  if (!liquidacion) return <div className="text-center py-12 text-stone-400">Liquidación no encontrada</div>

  const isBorrador = liquidacion.estado === 'BORRADOR'
  const isEmitida = liquidacion.estado === 'EMITIDA'
  const isAnulada = liquidacion.estado === 'ANULADA'
  const condicionIva = liquidacion.cliente?.condicionIva || 'CF'
  const tipoComprobante = condicionIva === 'RI' ? 'Factura A' : condicionIva === 'EX' || condicionIva === 'NC' || condicionIva === 'NR' ? 'Factura C' : 'Factura B'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Panel izquierdo (60%) */}
      <div className="lg:col-span-3 space-y-4">
        {/* Cliente y Faena */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 py-3">
            <CardTitle className="text-sm font-semibold">Datos de la Faena</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-stone-500">Cliente:</span> <span className="font-medium">{liquidacion.cliente?.razonSocial || liquidacion.cliente?.nombre}</span></div>
              <div><span className="text-stone-500">CUIT:</span> <span className="font-mono">{liquidacion.cliente?.cuit || '-'}</span></div>
              <div><span className="text-stone-500">Cond. IVA:</span> <Badge variant="outline">{condicionIva}</Badge></div>
              <div><span className="text-stone-500">Comprobante:</span> <Badge className="bg-amber-100 text-amber-700">{tipoComprobante}</Badge></div>
              <div><span className="text-stone-500">Tropa:</span> <span className="font-mono">{liquidacion.tropa?.codigo}</span></div>
              <div><span className="text-stone-500">Especie:</span> <span>{liquidacion.tropa?.especie}</span></div>
              <div><span className="text-stone-500">Cabezas:</span> <span>{liquidacion.cantCabezas}</span></div>
              <div><span className="text-stone-500">Fecha Faena:</span> <span>{new Date(liquidacion.fechaFaena).toLocaleDateString('es-AR')}</span></div>
              <div><span className="text-stone-500">DT-e SENASA:</span> <span>{liquidacion.dteSenasa || '-'}</span></div>
              <div><span className="text-stone-500">KG Romaneo:</span> <span className="font-bold text-lg">{liquidacion.kgRomaneo?.toLocaleString('es-AR', { maximumFractionDigits: 1 })} kg</span></div>
            </div>
            {liquidacion.kgRomaneo && (
              <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                Los kg de romaneo son de solo lectura. Si hubo un error, debe corregirse desde el módulo Romaneo y se generará una nota de crédito automáticamente.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 py-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Conceptos Facturados</CardTitle>
            {(isBorrador || editMode) && (
              <Button size="sm" variant="outline" onClick={() => setAddItemOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" />Agregar</Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Concepto</TableHead>
                  <TableHead className="text-xs text-right">Cantidad</TableHead>
                  <TableHead className="text-xs">Unidad</TableHead>
                  <TableHead className="text-xs text-right">$/unit</TableHead>
                  <TableHead className="text-xs text-right">Subtotal</TableHead>
                  <TableHead className="text-xs text-right">IVA</TableHead>
                  {(isBorrador || editMode) && <TableHead className="text-xs w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx} className="text-xs">
                    <TableCell className={item.esDescuento ? 'text-green-600' : ''}>{item.esDescuento ? '(+) ' : ''}{item.descripcion}</TableCell>
                    <TableCell className="text-right">{item.cantidad?.toLocaleString('es-AR', { maximumFractionDigits: 1 })}</TableCell>
                    <TableCell>{item.unidad}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(item.tarifaValor)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency((item.subtotal ?? item.cantidad * item.tarifaValor) * (item.esDescuento ? -1 : 1))}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(item.importeIVA ?? item.cantidad * item.tarifaValor * item.alicuotaIVA / 100)}</TableCell>
                    {(isBorrador || editMode) && (
                      <TableCell><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setItems(items.filter((_, i) => i !== idx))}><Trash2 className="w-3 h-3 text-red-500" /></Button></TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Panel derecho (40%) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Resumen */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 py-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Receipt className="w-4 h-4 text-amber-500" />Resumen</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between text-sm"><span className="text-stone-500">Subtotal Neto</span><span className="font-mono">{formatCurrency(liquidacion.subtotalNeto)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-stone-500">IVA (21%)</span><span className="font-mono">{formatCurrency(liquidacion.totalIVA)}</span></div>
            {liquidacion.totalRetenciones > 0 && <div className="flex justify-between text-sm"><span className="text-stone-500">Retenciones</span><span className="font-mono text-red-600">-{formatCurrency(liquidacion.totalRetenciones)}</span></div>}
            <Separator />
            <div className="flex justify-between text-lg font-bold"><span>TOTAL</span><span className="font-mono text-amber-700">{formatCurrency(liquidacion.totalFinal)}</span></div>
          </CardContent>
        </Card>

        {/* Tarifa Info */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 py-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-500" />Tarifa Aplicada</CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-sm">
            <p>Tarifa vigente al {new Date(liquidacion.fechaFaena).toLocaleDateString('es-AR')}: <span className="font-bold">{formatCurrency(liquidacion.tarifaFaenaValor)}/kg</span></p>
            <p className="text-stone-400 text-xs mt-1">Valor congelado al momento de la liquidación</p>
          </CardContent>
        </Card>

        {/* Estado */}
        <Card className={`border-0 shadow-md ${isEmitida ? 'bg-emerald-50' : isAnulada ? 'bg-red-50' : ''}`}>
          <CardContent className="p-4">
            {isBorrador && (
              <div className="space-y-3">
                <div className="flex items-center gap-2"><Badge className="bg-amber-100 text-amber-700">BORRADOR</Badge><span className="text-xs text-stone-500">— Pendiente de emisión</span></div>
                <Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={handleEmitir} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}Emitir Factura
                </Button>
                <Button variant="outline" className="w-full" onClick={handleGuardarItems} disabled={saving}>Guardar Cambios</Button>
              </div>
            )}
            {isEmitida && (
              <div className="space-y-2">
                <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-600" /><Badge className="bg-emerald-100 text-emerald-700">EMITIDA</Badge></div>
                {liquidacion.factura && <p className="text-sm">Factura N° <span className="font-mono font-bold">{liquidacion.factura.numero}</span></p>}
                {liquidacion.factura?.cae && <p className="text-xs text-emerald-600">CAE: {liquidacion.factura.cae}</p>}
                {!editMode && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setPinDialogOpen(true)}>
                    <Lock className="w-3.5 h-3.5 mr-1" />Editar con clave supervisor
                  </Button>
                )}
              </div>
            )}
            {isAnulada && <Badge className="bg-red-100 text-red-700">ANULADA</Badge>}
          </CardContent>
        </Card>
      </div>

      {/* PIN Dialog */}
      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent className="max-w-sm" maximizable>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-amber-500" />Autorización Supervisor</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-500">Ingrese el PIN del supervisor para habilitar la edición de esta liquidación.</p>
          <Input type="password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="PIN de supervisor" className="text-center text-2xl tracking-widest h-14" maxLength={6} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPinDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-amber-500 hover:bg-amber-600" onClick={handleAutorizar} disabled={saving || pin.length < 4}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Shield className="w-4 h-4 mr-1" />}Autorizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
        <DialogContent className="max-w-md" maximizable>
          <DialogHeader><DialogTitle>Agregar Concepto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Tipo de Tarifa</Label>
              <Select value={newItem.tipoTarifaId || ''} onValueChange={v => {
                const tipo = tipos.find(t => t.id === v)
                setNewItem({ ...newItem, tipoTarifaId: v, descripcion: tipo?.descripcion || newItem.descripcion, unidad: tipo?.unidad || newItem.unidad })
              }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {tipos.map(t => <SelectItem key={t.id} value={t.id}>{t.descripcion}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Descripción</Label><Input value={newItem.descripcion} onChange={e => setNewItem({ ...newItem, descripcion: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Cantidad</Label><Input type="number" value={newItem.cantidad || ''} onChange={e => setNewItem({ ...newItem, cantidad: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Valor ($)</Label><Input type="number" value={newItem.tarifaValor || ''} onChange={e => setNewItem({ ...newItem, tarifaValor: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={newItem.esDescuento} onChange={e => setNewItem({ ...newItem, esDescuento: e.target.checked })} className="rounded" />
              <Label className="text-sm">Es descuento/pago parcial (cueros, menudencias)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemOpen(false)}>Cancelar</Button>
            <Button className="bg-amber-500 hover:bg-amber-600" onClick={handleAddItem}><Plus className="w-4 h-4 mr-1" />Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
