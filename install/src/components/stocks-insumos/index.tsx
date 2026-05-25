'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  Package, Plus, Loader2, Edit, Trash2, Save, X, RefreshCw,
  TrendingDown, TrendingUp, AlertTriangle, Search, DollarSign
} from 'lucide-react'

interface Operador { id: string; nombre: string; rol: string }

interface Insumo {
  id: string
  codigo: string
  nombre: string
  categoria: string
  subcategoria: string | null
  unidadMedida: string
  stockActual: number
  stockMinimo: number
  stockMaximo: number | null
  puntoReposicion: number | null
  proveedorNombre: string | null
  precioUnitario: number | null
  ubicacion: string | null
  activo: boolean
  observaciones: string | null
}

interface Props { operador: Operador }

const CATEGORIAS = [
  { value: 'EMBALAJE', label: 'Embalaje (Bolsas, Films)' },
  { value: 'ETIQUETAS', label: 'Etiquetas y Rótulos' },
  { value: 'HIGIENE', label: 'Higiene y Limpieza' },
  { value: 'PROTECCION', label: 'Protección (EPP)' },
  { value: 'HERRAMIENTAS', label: 'Herramientas' },
  { value: 'OFICINA', label: 'Oficina' },
  { value: 'OTROS', label: 'Otros' }
]

const UNIDADES = [
  { value: 'UN', label: 'Unidades (UN)' },
  { value: 'KG', label: 'Kilogramos (KG)' },
  { value: 'L', label: 'Litros (L)' },
  { value: 'M', label: 'Metros (M)' },
  { value: 'ROLLO', label: 'Rollos' }
]

export function StocksInsumosModule({ operador }: Props) {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Insumo | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria: 'EMBALAJE',
    subcategoria: '',
    unidadMedida: 'UN',
    stockActual: '0',
    stockMinimo: '0',
    stockMaximo: '',
    puntoReposicion: '',
    proveedorNombre: '',
    precioUnitario: '',
    ubicacion: '',
    activo: true,
    observaciones: ''
  })

  useEffect(() => {
    fetchInsumos()
  }, [])

  const fetchInsumos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/insumos')
      const data = await res.json()
      if (data.success) {
        setInsumos(data.data)
      } else {
        toast.error('Error al cargar insumos')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      categoria: 'EMBALAJE',
      subcategoria: '',
      unidadMedida: 'UN',
      stockActual: '0',
      stockMinimo: '0',
      stockMaximo: '',
      puntoReposicion: '',
      proveedorNombre: '',
      precioUnitario: '',
      ubicacion: '',
      activo: true,
      observaciones: ''
    })
    setEditando(null)
  }

  const handleNuevo = () => {
    resetForm()
    setModalOpen(true)
  }

  const handleEditar = (insumo: Insumo) => {
    setEditando(insumo)
    setFormData({
      codigo: insumo.codigo,
      nombre: insumo.nombre,
      categoria: insumo.categoria,
      subcategoria: insumo.subcategoria || '',
      unidadMedida: insumo.unidadMedida,
      stockActual: insumo.stockActual.toString(),
      stockMinimo: insumo.stockMinimo.toString(),
      stockMaximo: insumo.stockMaximo?.toString() || '',
      puntoReposicion: insumo.puntoReposicion?.toString() || '',
      proveedorNombre: insumo.proveedorNombre || '',
      precioUnitario: insumo.precioUnitario?.toString() || '',
      ubicacion: insumo.ubicacion || '',
      activo: insumo.activo,
      observaciones: insumo.observaciones || ''
    })
    setModalOpen(true)
  }

  const handleGuardar = async () => {
    if (!formData.codigo || !formData.nombre) {
      toast.error('Código y nombre son requeridos')
      return
    }

    setSaving(true)
    try {
      const url = '/api/insumos'
      const method = editando ? 'PUT' : 'POST'
      const body = editando 
        ? { 
            id: editando.id, 
            ...formData,
            stockActual: parseFloat(formData.stockActual) || 0,
            stockMinimo: parseFloat(formData.stockMinimo) || 0,
            stockMaximo: formData.stockMaximo ? parseFloat(formData.stockMaximo) : null,
            puntoReposicion: formData.puntoReposicion ? parseFloat(formData.puntoReposicion) : null,
            precioUnitario: formData.precioUnitario ? parseFloat(formData.precioUnitario) : null
          }
        : {
            ...formData,
            stockActual: parseFloat(formData.stockActual) || 0,
            stockMinimo: parseFloat(formData.stockMinimo) || 0,
            stockMaximo: formData.stockMaximo ? parseFloat(formData.stockMaximo) : null,
            puntoReposicion: formData.puntoReposicion ? parseFloat(formData.puntoReposicion) : null,
            precioUnitario: formData.precioUnitario ? parseFloat(formData.precioUnitario) : null
          }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editando ? 'Insumo actualizado' : 'Insumo creado')
        fetchInsumos()
        setModalOpen(false)
        resetForm()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = async (insumo: Insumo) => {
    if (!confirm(`¿Eliminar el insumo "${insumo.nombre}"?`)) return

    try {
      const res = await fetch(`/api/insumos?id=${insumo.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Insumo eliminado')
        fetchInsumos()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const getStockStatus = (insumo: Insumo): 'ok' | 'bajo' | 'critico' => {
    if (insumo.stockActual === 0) return 'critico'
    if (insumo.stockActual <= insumo.stockMinimo) return 'critico'
    if (insumo.stockActual <= insumo.stockMinimo * 1.5) return 'bajo'
    return 'ok'
  }

  const getStockBadge = (insumo: Insumo) => {
    const status = getStockStatus(insumo)
    switch (status) {
      case 'critico': return <Badge className="bg-red-100 text-red-700">Crítico</Badge>
      case 'bajo': return <Badge className="bg-amber-100 text-amber-700">Bajo</Badge>
      default: return <Badge className="bg-emerald-100 text-emerald-700">OK</Badge>
    }
  }

  const getCategoriaLabel = (cat: string) => {
    return CATEGORIAS.find(c => c.value === cat)?.label || cat
  }

  // Filtrar insumos
  const insumosFiltrados = insumos.filter(i => {
    if (filtroEstado === 'criticos' && getStockStatus(i) !== 'critico') return false
    if (filtroEstado === 'bajos' && getStockStatus(i) !== 'bajo') return false
    if (filtroEstado === 'ok' && getStockStatus(i) !== 'ok') return false
    if (busqueda) {
      const term = busqueda.toLowerCase()
      return i.codigo.toLowerCase().includes(term) || 
             i.nombre.toLowerCase().includes(term) ||
             i.ubicacion?.toLowerCase().includes(term)
    }
    return true
  })

  // Estadísticas
  const stats = {
    total: insumos.length,
    criticos: insumos.filter(i => getStockStatus(i) === 'critico').length,
    bajos: insumos.filter(i => getStockStatus(i) === 'bajo').length,
    valorTotal: insumos.reduce((acc, i) => acc + (i.stockActual * (i.precioUnitario || 0)), 0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-7 h-7 text-amber-500" />
              Stocks de Insumos
            </h1>
            <p className="text-stone-500">Control de inventario de insumos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchInsumos}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" />Nuevo Insumo
            </Button>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500">Total Insumos</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500">Stock Crítico</p>
                  <p className="text-3xl font-bold text-red-600">{stats.criticos}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500">Stock Bajo</p>
                  <p className="text-3xl font-bold text-amber-600">{stats.bajos}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500">Valor Stock</p>
                  <p className="text-xl font-bold text-emerald-600">
                    ${stats.valorTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar por código, nombre o ubicación..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="criticos">Críticos</SelectItem>
                  <SelectItem value="bajos">Bajos</SelectItem>
                  <SelectItem value="ok">OK</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
              </div>
            ) : insumosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No se encontraron insumos</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50">
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-center">Unidad</TableHead>
                      <TableHead className="text-right">Stock Actual</TableHead>
                      <TableHead className="text-right">Stock Mínimo</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insumosFiltrados.map((i) => (
                      <TableRow key={i.id} className={!i.activo ? 'opacity-50' : getStockStatus(i) === 'critico' ? 'bg-red-50' : ''}>
                        <TableCell className="font-mono text-sm font-medium">{i.codigo}</TableCell>
                        <TableCell className="font-medium">{i.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getCategoriaLabel(i.categoria)}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{i.unidadMedida}</TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={i.stockActual <= i.stockMinimo ? 'text-red-600' : ''}>
                            {i.stockActual.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-stone-500">{i.stockMinimo.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {i.precioUnitario ? `$${i.precioUnitario.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-stone-500">{i.ubicacion || '-'}</TableCell>
                        <TableCell>{getStockBadge(i)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditar(i)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEliminar(i)} className="text-red-600">
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

        {/* Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar Insumo' : 'Nuevo Insumo'}</DialogTitle>
              <DialogDescription>
                Complete los datos del insumo
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    value={formData.codigo}
                    onChange={(e) => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
                    placeholder="INS-001"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Nombre del insumo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={formData.categoria} onValueChange={(v) => setFormData({...formData, categoria: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unidad de Medida</Label>
                  <Select value={formData.unidadMedida} onValueChange={(v) => setFormData({...formData, unidadMedida: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNIDADES.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Stock Actual</Label>
                  <Input
                    type="number"
                    value={formData.stockActual}
                    onChange={(e) => setFormData({...formData, stockActual: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock Mínimo</Label>
                  <Input
                    type="number"
                    value={formData.stockMinimo}
                    onChange={(e) => setFormData({...formData, stockMinimo: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock Máximo</Label>
                  <Input
                    type="number"
                    value={formData.stockMaximo}
                    onChange={(e) => setFormData({...formData, stockMaximo: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Precio Unitario</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.precioUnitario}
                    onChange={(e) => setFormData({...formData, precioUnitario: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Input
                    value={formData.proveedorNombre}
                    onChange={(e) => setFormData({...formData, proveedorNombre: e.target.value})}
                    placeholder="Nombre del proveedor"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ubicación</Label>
                <Input
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
                  placeholder="Depósito A - Estante 1"
                />
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                <div>
                  <p className="font-medium">Activo</p>
                  <p className="text-sm text-stone-500">Habilitar para uso</p>
                </div>
                <Switch
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({...formData, activo: checked})}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                <X className="w-4 h-4 mr-2" />Cancelar
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

export default StocksInsumosModule
