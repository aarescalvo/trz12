'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, Plus, Pencil, Trash2, Search, Loader2,
  Save, X, Calendar, User, Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface TipoServicio {
  id: string
  codigo: string
  nombre: string
  unidad: string
  porcentajeIva: number
  activo: boolean
}

interface Cliente {
  id: string
  nombre: string
  cuit?: string
  razonSocial?: string
}

interface PrecioServicio {
  id: string
  tipoServicioId: string
  clienteId: string
  precio: number
  fechaDesde: string
  fechaHasta?: string
  observaciones?: string
  tipoServicio: TipoServicio
  cliente: Cliente
}

interface Props {
  operador?: { id: string; nombre: string; rol: string }
}

export function PreciosServicioConfig({ operador }: Props) {
  const [precios, setPrecios] = useState<PrecioServicio[]>([])
  const [tiposServicio, setTiposServicio] = useState<TipoServicio[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedPrecio, setSelectedPrecio] = useState<PrecioServicio | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  const [formData, setFormData] = useState({
    tipoServicioId: '',
    clienteId: '',
    precio: 0,
    fechaDesde: new Date().toISOString().split('T')[0],
    observaciones: ''
  })

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [preciosRes, tiposRes, clientesRes] = await Promise.all([
        fetch('/api/precios-servicio?vigente=true'),
        fetch('/api/tipos-servicio?activo=true'),
        fetch('/api/clientes')
      ])

      const [preciosData, tiposData, clientesData] = await Promise.all([
        preciosRes.json(),
        tiposRes.json(),
        clientesRes.json()
      ])

      if (preciosData.success) setPrecios(preciosData.data)
      if (tiposData.success) setTiposServicio(tiposData.data)
      if (clientesData.success) {
        setClientes(clientesData.data)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleNuevo = () => {
    setSelectedPrecio(null)
    setFormData({
      tipoServicioId: tiposServicio[0]?.id || '',
      clienteId: '',
      precio: 0,
      fechaDesde: new Date().toISOString().split('T')[0],
      observaciones: ''
    })
    setDialogOpen(true)
  }

  const handleEditar = (precio: PrecioServicio) => {
    setSelectedPrecio(precio)
    setFormData({
      tipoServicioId: precio.tipoServicioId,
      clienteId: precio.clienteId,
      precio: precio.precio,
      fechaDesde: precio.fechaDesde.split('T')[0],
      observaciones: precio.observaciones || ''
    })
    setDialogOpen(true)
  }

  const handleGuardar = async () => {
    if (!formData.tipoServicioId || !formData.clienteId || formData.precio <= 0) {
      toast.error('Complete todos los campos requeridos')
      return
    }

    setSaving(true)
    try {
      const url = '/api/precios-servicio'
      const method = selectedPrecio ? 'PUT' : 'POST'
      const body = selectedPrecio 
        ? { id: selectedPrecio.id, ...formData }
        : { ...formData, createdBy: operador?.id }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(selectedPrecio ? 'Precio actualizado' : 'Precio creado')
        setDialogOpen(false)
        fetchAll()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al guardar precio')
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = async () => {
    if (!selectedPrecio) return

    setSaving(true)
    try {
      const res = await fetch(`/api/precios-servicio?id=${selectedPrecio.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Precio eliminado')
        setDeleteOpen(false)
        fetchAll()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar precio')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount)

  const preciosFiltrados = precios.filter(p => {
    const matchTipo = !filtroTipo || p.tipoServicioId === filtroTipo
    const matchSearch = !searchTerm || 
      p.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cliente.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tipoServicio.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    return matchTipo && matchSearch
  })

  // Agrupar precios por cliente
  const preciosPorCliente = clientes.map(cliente => ({
    cliente,
    precios: preciosFiltrados.filter(p => p.clienteId === cliente.id)
  })).filter(c => c.precios.length > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-amber-500" />
            Precios por Cliente
          </h2>
          <p className="text-stone-500">Configuración de precios de servicios por cliente</p>
        </div>
        <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Precio
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Buscar por cliente o servicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-3 py-2 border rounded-md w-full md:w-48"
            >
              <option value="">Todos los servicios</option>
              {tiposServicio.map(t => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de precios */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : preciosFiltrados.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No hay precios configurados</p>
              <Button onClick={handleNuevo} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Agregar primer precio
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Cliente</TableHead>
                    <TableHead className="font-semibold">Servicio</TableHead>
                    <TableHead className="font-semibold">Precio</TableHead>
                    <TableHead className="font-semibold">Unidad</TableHead>
                    <TableHead className="font-semibold">Vigencia</TableHead>
                    <TableHead className="font-semibold text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preciosFiltrados.map((precio) => (
                    <TableRow key={precio.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{precio.cliente.nombre}</p>
                          {precio.cliente.razonSocial && (
                            <p className="text-xs text-stone-500">{precio.cliente.razonSocial}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{precio.tipoServicio.nombre}</p>
                          <p className="text-xs text-stone-500">{precio.tipoServicio.codigo}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-lg">
                        {formatCurrency(precio.precio)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{precio.tipoServicio.unidad}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>Desde: {new Date(precio.fechaDesde).toLocaleDateString('es-AR')}</p>
                          {precio.fechaHasta && (
                            <p className="text-stone-500">Hasta: {new Date(precio.fechaHasta).toLocaleDateString('es-AR')}</p>
                          )}
                          {!precio.fechaHasta && (
                            <Badge className="bg-emerald-100 text-emerald-700 mt-1">Vigente</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditar(precio)}
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPrecio(precio)
                              setDeleteOpen(true)
                            }}
                            title="Eliminar"
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nuevo/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" maximizable>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              {selectedPrecio ? 'Editar Precio' : 'Nuevo Precio'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <select
                value={formData.clienteId}
                onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                disabled={!!selectedPrecio}
              >
                <option value="">Seleccionar cliente...</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.razonSocial ? `(${c.razonSocial})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Servicio *</Label>
              <select
                value={formData.tipoServicioId}
                onChange={(e) => setFormData({ ...formData, tipoServicioId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                disabled={!!selectedPrecio}
              >
                <option value="">Seleccionar servicio...</option>
                {tiposServicio.filter((t: any) => t.activo && t.seFactura).map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} ({t.unidad})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio *</Label>
                <Input
                  type="number"
                  value={formData.precio || ''}
                  onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Vigencia desde</Label>
                <Input
                  type="date"
                  value={formData.fechaDesde}
                  onChange={(e) => setFormData({ ...formData, fechaDesde: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Input
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas opcionales..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleGuardar} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm" maximizable>
          <DialogHeader>
            <DialogTitle className="text-red-600">Eliminar Precio</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-500">
            ¿Está seguro que desea eliminar este precio?
          </p>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEliminar} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PreciosServicioConfig
