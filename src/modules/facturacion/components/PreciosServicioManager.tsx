'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DollarSign, Plus, Loader2, RefreshCw, TrendingUp, TrendingDown,
  Tag, Building2, History, Trash2, Edit2, Search, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface TipoServicio { id: string; codigo: string; nombre: string; unidad: string; porcentajeIva: number; activo: boolean }
interface Cliente { id: string; nombre: string; razonSocial?: string; cuit?: string }
interface PrecioServicio {
  id: string; tipoServicioId: string; clienteId: string; precio: number;
  fechaDesde: string; fechaHasta?: string | null; observaciones?: string | null;
  tipoServicio?: TipoServicio; cliente?: Cliente;
}
interface PrecioHistorial {
  id: string; tipoServicioId: string; tipoServicioNombre: string;
  clienteId: string; clienteNombre: string;
  precioAnterior?: number | null; precioNuevo: number;
  fechaDesde: string; fechaHasta?: string | null;
  motivo?: string | null; operadorId?: string | null;
  operadorNombre?: string | null; tipoCambio: string; createdAt: string;
}

interface Props { operador: { id: string; nombre: string; rol: string } }

export function PreciosServicioManager({ operador }: Props) {
  const [precios, setPrecios] = useState<PrecioServicio[]>([])
  const [historial, setHistorial] = useState<PrecioHistorial[]>([])
  const [tiposServicio, setTiposServicio] = useState<TipoServicio[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('vigentes')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  // Filters
  const [filtroTipo, setFiltroTipo] = useState('TODOS')
  const [filtroCliente, setFiltroCliente] = useState('TODOS')
  const [searchTerm, setSearchTerm] = useState('')

  // Form
  const [form, setForm] = useState({
    tipoServicioId: '',
    clienteId: '',
    precio: 0,
    fechaDesde: new Date().toISOString().split('T')[0],
    observaciones: '',
    motivo: '',
  })

  const esAdmin = operador.rol === 'ADMINISTRADOR'
  const formatCurrency = (v: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(v)
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('es-AR') : '-'

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [tiposRes, clientesRes] = await Promise.all([
        fetch('/api/tipos-servicio?activo=true&seFactura=true'),
        fetch('/api/clientes'),
      ])
      const tiposData = await tiposRes.json()
      const clientesData = await clientesRes.json()
      if (tiposData.success) setTiposServicio(tiposData.data || [])
      if (clientesData.success) setClientes(clientesData.data || [])
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }, [])

  const fetchPrecios = useCallback(async () => {
    try {
      const params = new URLSearchParams({ modo: 'todos' })
      if (filtroTipo !== 'TODOS') params.set('tipoServicioId', filtroTipo)
      if (filtroCliente !== 'TODOS') params.set('clienteId', filtroCliente)
      const res = await fetch(`/api/precios?${params.toString()}`)
      const data = await res.json()
      if (data.success) setPrecios(data.data || [])
    } catch (error) { console.error(error) }
  }, [filtroTipo, filtroCliente])

  const fetchHistorial = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filtroTipo !== 'TODOS') params.set('tipoServicioId', filtroTipo)
      if (filtroCliente !== 'TODOS') params.set('clienteId', filtroCliente)
      params.set('limite', '100')
      const res = await fetch(`/api/precios/historial?${params.toString()}`)
      const data = await res.json()
      if (data.success) setHistorial(data.data || [])
    } catch (error) { console.error(error) }
  }, [filtroTipo, filtroCliente])

  useEffect(() => { fetchAll() }, [fetchAll])
  useEffect(() => { fetchPrecios() }, [fetchPrecios])
  useEffect(() => { if (tab === 'historial') fetchHistorial() }, [tab, fetchHistorial])

  const handleOpenNew = () => {
    setEditId(null)
    setForm({
      tipoServicioId: '',
      clienteId: '',
      precio: 0,
      fechaDesde: new Date().toISOString().split('T')[0],
      observaciones: '',
      motivo: '',
    })
    setDialogOpen(true)
  }

  const handleEdit = (precio: PrecioServicio) => {
    setEditId(precio.id)
    setForm({
      tipoServicioId: precio.tipoServicioId,
      clienteId: precio.clienteId,
      precio: precio.precio,
      fechaDesde: new Date(precio.fechaDesde).toISOString().split('T')[0],
      observaciones: precio.observaciones || '',
      motivo: '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.tipoServicioId || !form.clienteId || form.precio <= 0) {
      toast.error('Complete todos los campos obligatorios')
      return
    }
    if (!editId && !form.motivo) {
      toast.error('Ingrese el motivo del cambio')
      return
    }

    setSaving(true)
    try {
      if (editId) {
        // Actualizar precio existente
        const res = await fetch('/api/precios', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, precio: form.precio, observaciones: form.observaciones, motivo: form.motivo || 'Actualización', operadorId: operador.id }),
        })
        const data = await res.json()
        if (data.success) {
          toast.success('Precio actualizado exitosamente')
          setDialogOpen(false)
          fetchPrecios()
        } else {
          toast.error(data.error || 'Error al actualizar')
        }
      } else {
        // Crear nuevo precio
        const res = await fetch('/api/precios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, operadorId: operador.id }),
        })
        const data = await res.json()
        if (data.success) {
          toast.success('Precio creado exitosamente')
          setDialogOpen(false)
          fetchPrecios()
        } else {
          toast.error(data.error || 'Error al crear precio')
        }
      }
    } catch { toast.error('Error de conexión') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este precio? Se registrará en el historial.')) return
    try {
      const res = await fetch(`/api/precios?id=${id}&operadorId=${operador.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { toast.success('Precio eliminado'); fetchPrecios(); }
      else { toast.error(data.error) }
    } catch { toast.error('Error al eliminar') }
  }

  // KPIs
  const vigentes = precios.filter(p => !p.fechaHasta)
  const clientesConPrecio = new Set(vigentes.map(p => p.clienteId)).size
  const precioPromedio = vigentes.length > 0 ? vigentes.reduce((s, p) => s + p.precio, 0) / vigentes.length : 0

  // Precios filtrados
  const preciosFiltrados = precios.filter(p => {
    if (filtroTipo !== 'TODOS' && p.tipoServicioId !== filtroTipo) return false
    if (filtroCliente !== 'TODOS' && p.clienteId !== filtroCliente) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matchNombre = p.tipoServicio?.nombre?.toLowerCase().includes(search)
      const matchCliente = p.cliente?.nombre?.toLowerCase().includes(search) || p.cliente?.razonSocial?.toLowerCase().includes(search)
      if (!matchNombre && !matchCliente) return false
    }
    return true
  })

  // Tipo cambio badge
  const getTipoCambioBadge = (tipo: string) => {
    switch (tipo) {
      case 'CREACION': return <Badge className="bg-emerald-100 text-emerald-700">Creación</Badge>
      case 'ACTUALIZACION': return <Badge className="bg-blue-100 text-blue-700">Actualización</Badge>
      case 'ELIMINACION': return <Badge className="bg-red-100 text-red-700">Eliminación</Badge>
      default: return <Badge>{tipo}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm bg-amber-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-xs text-stone-500">Precios Vigentes</p>
                <p className="text-xl font-bold text-amber-700">{vigentes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-emerald-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs text-stone-500">Precio Promedio</p>
                <p className="text-lg font-bold text-emerald-700">{formatCurrency(precioPromedio)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-stone-500">Clientes con Precio</p>
                <p className="text-xl font-bold text-blue-700">{clientesConPrecio}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-stone-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-stone-600" />
              <div>
                <p className="text-xs text-stone-500">Tipos de Servicio</p>
                <p className="text-xl font-bold text-stone-700">{tiposServicio.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros + Acciones */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-2 items-end justify-between">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="w-52">
                <Input placeholder="Buscar servicio o cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Servicio</Label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    {tiposServicio.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cliente</Label>
                <Select value={filtroCliente} onValueChange={setFiltroCliente}>
                  <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.razonSocial || c.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" className="h-9" onClick={() => { setFiltroTipo('TODOS'); setFiltroCliente('TODOS'); setSearchTerm('') }}>
                <X className="w-3.5 h-3.5 mr-1" />Limpiar
              </Button>
            </div>
            <div className="flex gap-2">
              {esAdmin && (
                <Button size="sm" className="h-9 bg-amber-500 hover:bg-amber-600" onClick={handleOpenNew}>
                  <Plus className="w-4 h-4 mr-1" />Nuevo Precio
                </Button>
              )}
              <Button size="sm" variant="outline" className="h-9" onClick={() => { fetchPrecios(); if (tab === 'historial') fetchHistorial(); }}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="vigentes">Vigentes ({vigentes.length})</TabsTrigger>
          <TabsTrigger value="todos">Todos ({precios.length})</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        {/* Vigentes / Todos */}
        {['vigentes', 'todos'].map(tabVal => (
          <TabsContent key={tabVal} value={tabVal}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
                ) : preciosFiltrados.length === 0 ? (
                  <div className="py-12 text-center text-stone-400">
                    <Tag className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No hay precios {tabVal === 'vigentes' ? 'vigentes' : 'registrados'}</p>
                    {esAdmin && <Button className="mt-4 bg-amber-500 hover:bg-amber-600" onClick={handleOpenNew}><Plus className="w-4 h-4 mr-1" />Crear Precio</Button>}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50">
                        <TableHead className="text-xs font-semibold">Servicio</TableHead>
                        <TableHead className="text-xs font-semibold">Cliente</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Precio</TableHead>
                        <TableHead className="text-xs font-semibold">Unidad</TableHead>
                        <TableHead className="text-xs font-semibold">% IVA</TableHead>
                        <TableHead className="text-xs font-semibold">Vigencia</TableHead>
                        <TableHead className="text-xs font-semibold">Estado</TableHead>
                        {esAdmin && <TableHead className="text-xs font-semibold text-center">Acciones</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preciosFiltrados
                        .filter(p => tabVal === 'vigentes' ? !p.fechaHasta : true)
                        .map(p => (
                          <TableRow key={p.id} className="text-xs">
                            <TableCell className="font-medium">{p.tipoServicio?.nombre || '-'}</TableCell>
                            <TableCell>{p.cliente?.razonSocial || p.cliente?.nombre || '-'}</TableCell>
                            <TableCell className="text-right font-mono font-bold">{formatCurrency(p.precio)}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{p.tipoServicio?.unidad || 'KG'}</Badge></TableCell>
                            <TableCell>{p.tipoServicio?.porcentajeIva || 21}%</TableCell>
                            <TableCell>
                              <p>Desde: {formatDate(p.fechaDesde)}</p>
                              {p.fechaHasta && <p className="text-stone-400">Hasta: {formatDate(p.fechaHasta)}</p>}
                            </TableCell>
                            <TableCell>
                              {!p.fechaHasta
                                ? <Badge className="bg-emerald-100 text-emerald-700">Vigente</Badge>
                                : <Badge className="bg-stone-100 text-stone-500">Vencido</Badge>
                              }
                            </TableCell>
                            {esAdmin && (
                              <TableCell className="text-center">
                                <div className="flex justify-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(p)} title="Editar precio">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(p.id)} title="Eliminar">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        {/* Historial */}
        <TabsContent value="historial">
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              {historial.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No hay registros en el historial</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50">
                      <TableHead className="text-xs font-semibold">Fecha</TableHead>
                      <TableHead className="text-xs font-semibold">Tipo</TableHead>
                      <TableHead className="text-xs font-semibold">Servicio</TableHead>
                      <TableHead className="text-xs font-semibold">Cliente</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Precio Ant.</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Precio Nuevo</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Variación</TableHead>
                      <TableHead className="text-xs font-semibold">Operador</TableHead>
                      <TableHead className="text-xs font-semibold">Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historial.map(h => {
                      const variacion = h.precioAnterior && h.precioAnterior > 0
                        ? ((h.precioNuevo - h.precioAnterior) / h.precioAnterior * 100)
                        : null
                      return (
                        <TableRow key={h.id} className="text-xs">
                          <TableCell>{formatDate(h.createdAt)}</TableCell>
                          <TableCell>{getTipoCambioBadge(h.tipoCambio)}</TableCell>
                          <TableCell className="font-medium">{h.tipoServicioNombre}</TableCell>
                          <TableCell>{h.clienteNombre}</TableCell>
                          <TableCell className="text-right font-mono">{h.precioAnterior != null ? formatCurrency(h.precioAnterior) : '-'}</TableCell>
                          <TableCell className="text-right font-mono font-bold">{formatCurrency(h.precioNuevo)}</TableCell>
                          <TableCell className="text-right">
                            {variacion !== null ? (
                              <Badge className={`text-xs ${variacion > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {variacion > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                {variacion > 0 ? '+' : ''}{variacion.toFixed(1)}%
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>{h.operadorNombre || '-'}</TableCell>
                          <TableCell className="max-w-[120px] truncate" title={h.motivo || ''}>{h.motivo || '-'}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Nuevo/Editar Precio Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" maximizable>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-500" />
              {editId ? 'Actualizar Precio' : 'Nuevo Precio por Cliente'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Servicio *</Label>
                <Select value={form.tipoServicioId} onValueChange={v => setForm({ ...form, tipoServicioId: v })} disabled={!!editId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {tiposServicio.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre} ({t.unidad})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select value={form.clienteId} onValueChange={v => setForm({ ...form, clienteId: v })} disabled={!!editId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.razonSocial || c.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{editId ? 'Nuevo Precio' : 'Precio'} *</Label>
                <Input
                  type="number"
                  value={form.precio || ''}
                  onChange={e => setForm({ ...form, precio: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Vigencia Desde *</Label>
                <Input
                  type="date"
                  value={form.fechaDesde}
                  onChange={e => setForm({ ...form, fechaDesde: e.target.value })}
                  disabled={!!editId}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motivo del cambio *</Label>
              <Textarea
                value={form.motivo}
                onChange={e => setForm({ ...form, motivo: e.target.value })}
                placeholder="Ej: Ajuste trimestral, Nuevo contrato, Actualización por inflación..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Input
                value={form.observaciones}
                onChange={e => setForm({ ...form, observaciones: e.target.value })}
                placeholder="Observaciones adicionales (opcional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-amber-500 hover:bg-amber-600" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              {editId ? 'Actualizar Precio' : 'Crear Precio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
