'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Package, Tag, Scissors, Edit, Plus, Save, X, Loader2, Search, Power, Trash2, ClipboardList } from 'lucide-react'

interface Operador { id: string; nombre: string; rol: string }

interface Rubro { id: string; nombre: string; activo: boolean }
interface TipoCuarto { id: string; nombre: string; codigo: string; activo: boolean }
interface InsumoSimple { id: string; nombre: string; codigo: string }

interface BOMItem {
  id: string
  insumoId: string
  cantidadPorCaja: number
  observaciones?: string | null
  insumo: InsumoSimple
}

interface ProductoDesposte {
  id: string
  rubroId: string
  rubro: Rubro
  nombre: string
  codigo: string
  gtin?: string | null
  especie: string
  tipoCuartoOrigen?: string | null
  diasVencimiento?: number | null
  tempMin?: number | null
  tempMax?: number | null
  pesoTaraCaja?: number | null
  precioKg?: number | null
  apareceRendimiento: boolean
  apareceStock: boolean
  activo: boolean
  observaciones?: string | null
  bomItems?: BOMItem[]
}

const ESPECIES = [
  { value: 'BOVINO', label: 'Bovino' },
  { value: 'EQUINO', label: 'Equino' },
]

export default function C2ProductosDesposteModule({ operador }: { operador: Operador }) {
  const [productos, setProductos] = useState<ProductoDesposte[]>([])
  const [rubros, setRubros] = useState<Rubro[]>([])
  const [tiposCuarto, setTiposCuarto] = useState<TipoCuarto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [productoEditando, setProductoEditando] = useState<ProductoDesposte | null>(null)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroRubro, setFiltroRubro] = useState<string>('TODOS')
  const [filtroEspecie, setFiltroEspecie] = useState<string>('TODOS')

  // Form
  const [formData, setFormData] = useState({
    rubroId: '',
    nombre: '',
    codigo: '',
    gtin: '',
    especie: 'BOVINO',
    tipoCuartoOrigen: '',
    diasVencimiento: '',
    tempMin: '',
    tempMax: '',
    pesoTaraCaja: '',
    precioKg: '',
    apareceRendimiento: true,
    apareceStock: true,
    activo: true,
    observaciones: ''
  })

  useEffect(() => {
    fetchProductos()
    fetchRubros()
    fetchTiposCuarto()
  }, [])

  const fetchProductos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/c2-productos-desposte')
      const data = await res.json()
      if (data.success) {
        setProductos(data.data || [])
      } else {
        toast.error('Error al cargar productos de desposte')
      }
    } catch (error) {
      console.error('Error fetching productos:', error)
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  const fetchRubros = async () => {
    try {
      const res = await fetch('/api/c2-rubros')
      const data = await res.json()
      if (data.success) {
        setRubros(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching rubros:', error)
    }
  }

  const fetchTiposCuarto = async () => {
    try {
      const res = await fetch('/api/c2-tipos-cuarto')
      const data = await res.json()
      if (data.success) {
        setTiposCuarto(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching tipos cuarto:', error)
    }
  }

  const stats = {
    total: productos.length,
    activos: productos.filter(p => p.activo).length,
    porEspecie: {
      BOVINO: productos.filter(p => p.especie === 'BOVINO' && p.activo).length,
      EQUINO: productos.filter(p => p.especie === 'EQUINO' && p.activo).length,
    },
    conBOM: productos.filter(p => (p.bomItems?.length ?? 0) > 0).length,
  }

  const handleNuevo = () => {
    setProductoEditando(null)
    setFormData({
      rubroId: rubros.find(r => r.activo)?.id || '',
      nombre: '',
      codigo: '',
      gtin: '',
      especie: 'BOVINO',
      tipoCuartoOrigen: '',
      diasVencimiento: '',
      tempMin: '',
      tempMax: '',
      pesoTaraCaja: '',
      precioKg: '',
      apareceRendimiento: true,
      apareceStock: true,
      activo: true,
      observaciones: ''
    })
    setDialogOpen(true)
  }

  const handleEditar = (producto: ProductoDesposte) => {
    setProductoEditando(producto)
    setFormData({
      rubroId: producto.rubroId,
      nombre: producto.nombre,
      codigo: producto.codigo,
      gtin: producto.gtin || '',
      especie: producto.especie,
      tipoCuartoOrigen: producto.tipoCuartoOrigen || '',
      diasVencimiento: producto.diasVencimiento?.toString() || '',
      tempMin: producto.tempMin?.toString() || '',
      tempMax: producto.tempMax?.toString() || '',
      pesoTaraCaja: producto.pesoTaraCaja?.toString() || '',
      precioKg: producto.precioKg?.toString() || '',
      apareceRendimiento: producto.apareceRendimiento,
      apareceStock: producto.apareceStock,
      activo: producto.activo,
      observaciones: producto.observaciones || ''
    })
    setDialogOpen(true)
  }

  const handleToggleEstado = async (producto: ProductoDesposte) => {
    try {
      const res = await fetch('/api/c2-productos-desposte', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: producto.id, activo: !producto.activo })
      })

      const data = await res.json()

      if (data.success) {
        setProductos(productos.map(p =>
          p.id === producto.id ? { ...p, activo: !p.activo } : p
        ))
        toast.success(producto.activo
          ? `Producto "${producto.nombre}" desactivado`
          : `Producto "${producto.nombre}" activado`
        )
      } else {
        toast.error(data.error || 'Error al actualizar estado')
      }
    } catch (error) {
      toast.error('Error al actualizar estado')
    }
  }

  const handleEliminar = async (producto: ProductoDesposte) => {
    if (!confirm(`¿Está seguro de eliminar el producto "${producto.nombre}"?`)) return

    try {
      const res = await fetch(`/api/c2-productos-desposte?id=${producto.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        setProductos(productos.filter(p => p.id !== producto.id))
        toast.success('Producto eliminado')
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleGuardar = async () => {
    if (!formData.rubroId) {
      toast.error('Seleccione un rubro')
      return
    }
    if (!formData.nombre.trim()) {
      toast.error('Ingrese el nombre')
      return
    }
    if (!formData.codigo.trim()) {
      toast.error('Ingrese el código')
      return
    }

    setSaving(true)
    try {
      const payload = {
        id: productoEditando?.id,
        rubroId: formData.rubroId,
        nombre: formData.nombre.trim(),
        codigo: formData.codigo.trim(),
        gtin: formData.gtin.trim() || null,
        especie: formData.especie,
        tipoCuartoOrigen: formData.tipoCuartoOrigen || null,
        diasVencimiento: formData.diasVencimiento ? parseInt(formData.diasVencimiento) : null,
        tempMin: formData.tempMin ? parseFloat(formData.tempMin) : null,
        tempMax: formData.tempMax ? parseFloat(formData.tempMax) : null,
        pesoTaraCaja: formData.pesoTaraCaja ? parseFloat(formData.pesoTaraCaja) : null,
        precioKg: formData.precioKg ? parseFloat(formData.precioKg) : null,
        apareceRendimiento: formData.apareceRendimiento,
        apareceStock: formData.apareceStock,
        activo: formData.activo,
        observaciones: formData.observaciones.trim() || null,
      }

      const res = await fetch('/api/c2-productos-desposte', {
        method: productoEditando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.success) {
        toast.success(productoEditando ? 'Producto actualizado' : 'Producto creado')
        setDialogOpen(false)
        fetchProductos()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar producto')
    } finally {
      setSaving(false)
    }
  }

  // Filtrar productos
  const productosFiltrados = productos.filter(p => {
    if (filtroRubro !== 'TODOS' && p.rubroId !== filtroRubro) return false
    if (filtroEspecie !== 'TODOS' && p.especie !== filtroEspecie) return false
    if (busqueda) {
      const termino = busqueda.toLowerCase()
      return p.nombre.toLowerCase().includes(termino) ||
        p.codigo.toLowerCase().includes(termino) ||
        (p.gtin && p.gtin.toLowerCase().includes(termino))
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Package className="w-8 h-8 text-amber-500" />
              Configuración de Productos de Desposte (C2)
            </h1>
            <p className="text-stone-500">Gestión de cortes y productos del Ciclo II</p>
          </div>
          <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-stone-100 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Total Productos</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Activos</p>
                  <p className="text-xl font-bold text-green-600">{stats.activos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <Tag className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Bovinos</p>
                  <p className="text-xl font-bold text-amber-600">{stats.porEspecie.BOVINO}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-teal-100 p-2 rounded-lg">
                  <ClipboardList className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Con BOM</p>
                  <p className="text-xl font-bold text-teal-600">{stats.conBOM}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label className="text-xs">Buscar</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <Input
                    className="pl-9"
                    placeholder="Nombre, código o GTIN..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Label className="text-xs">Rubro</Label>
                <Select value={filtroRubro} onValueChange={setFiltroRubro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    {rubros.filter(r => r.activo).map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-40">
                <Label className="text-xs">Especie</Label>
                <Select value={filtroEspecie} onValueChange={setFiltroEspecie}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todas</SelectItem>
                    {ESPECIES.map(e => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Productos */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              Productos de Desposte ({productosFiltrados.length})
            </CardTitle>
            <CardDescription>
              Listado de cortes y productos del Ciclo II
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                <p className="text-stone-400 mt-2">Cargando productos...</p>
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No se encontraron productos</p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50/50">
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Rubro</TableHead>
                      <TableHead>Especie</TableHead>
                      <TableHead>Tipo Cuarto</TableHead>
                      <TableHead className="text-center">BOM</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productosFiltrados.map((producto) => (
                      <TableRow key={producto.id} className={!producto.activo ? 'opacity-50' : ''}>
                        <TableCell className="font-mono text-sm font-medium">{producto.codigo}</TableCell>
                        <TableCell className="font-medium">{producto.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-stone-50">
                            {producto.rubro?.nombre || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            producto.especie === 'BOVINO'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-stone-50 text-stone-700'
                          }>
                            {producto.especie}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-stone-500">{producto.tipoCuartoOrigen || '-'}</TableCell>
                        <TableCell className="text-center">
                          {(producto.bomItems?.length ?? 0) > 0 ? (
                            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                              {producto.bomItems!.length} item{producto.bomItems!.length > 1 ? 's' : ''}
                            </Badge>
                          ) : (
                            <span className="text-stone-300">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={
                            producto.activo
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                          }>
                            {producto.activo ? 'ACTIVO' : 'INACTIVO'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditar(producto)} title="Editar">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleEstado(producto)}
                              title={producto.activo ? 'Desactivar' : 'Activar'}
                              className={producto.activo ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}
                            >
                              <Power className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEliminar(producto)}
                              title="Eliminar"
                              className="text-red-400 hover:text-red-600"
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

        {/* Dialog Nuevo/Editar Producto */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" maximizable>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                {productoEditando ? 'Editar Producto de Desposte' : 'Nuevo Producto de Desposte'}
              </DialogTitle>
              <DialogDescription>
                {productoEditando
                  ? 'Modifique los datos del producto'
                  : 'Complete los datos para crear un nuevo producto de desposte'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rubro *</Label>
                  <Select value={formData.rubroId} onValueChange={(value) => setFormData({ ...formData, rubroId: value })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar rubro" /></SelectTrigger>
                    <SelectContent>
                      {rubros.filter(r => r.activo).map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Especie</Label>
                  <Select value={formData.especie} onValueChange={(value) => setFormData({ ...formData, especie: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ESPECIES.map(e => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Lomo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase().replace(/\s/g, '') })}
                    placeholder="LOM"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>GTIN</Label>
                  <Input
                    value={formData.gtin}
                    onChange={(e) => setFormData({ ...formData, gtin: e.target.value })}
                    placeholder="Código GS1 de 14 dígitos"
                    className="font-mono"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo Cuarto Origen</Label>
                  <Select value={formData.tipoCuartoOrigen} onValueChange={(value) => setFormData({ ...formData, tipoCuartoOrigen: value === '_NINGUNO' ? '' : value })}>
                    <SelectTrigger><SelectValue placeholder="Sin especificar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_NINGUNO">Sin especificar</SelectItem>
                      {tiposCuarto.filter(t => t.activo).map(t => (
                        <SelectItem key={t.id} value={t.codigo}>{t.nombre} ({t.codigo})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Días Vencimiento</Label>
                  <Input
                    type="number"
                    value={formData.diasVencimiento}
                    onChange={(e) => setFormData({ ...formData, diasVencimiento: e.target.value })}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Temp. Mín (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.tempMin}
                    onChange={(e) => setFormData({ ...formData, tempMin: e.target.value })}
                    placeholder="-2.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Temp. Máx (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.tempMax}
                    onChange={(e) => setFormData({ ...formData, tempMax: e.target.value })}
                    placeholder="5.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Peso Tara Caja (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.pesoTaraCaja}
                    onChange={(e) => setFormData({ ...formData, pesoTaraCaja: e.target.value })}
                    placeholder="0.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio por Kg ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.precioKg}
                    onChange={(e) => setFormData({ ...formData, precioKg: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Observaciones..."
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="apareceRendimiento"
                      checked={formData.apareceRendimiento}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, apareceRendimiento: checked as boolean })
                      }
                    />
                    <Label htmlFor="apareceRendimiento" className="cursor-pointer">En Rendimiento</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="apareceStock"
                      checked={formData.apareceStock}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, apareceStock: checked as boolean })
                      }
                    />
                    <Label htmlFor="apareceStock" className="cursor-pointer">En Stock</Label>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Activo</Label>
                  <Button
                    type="button"
                    variant={formData.activo ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                    className={formData.activo ? 'bg-green-500 hover:bg-green-600' : ''}
                  >
                    {formData.activo ? 'Sí' : 'No'}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleGuardar} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
