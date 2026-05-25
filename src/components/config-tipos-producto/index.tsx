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
import { Tag, Beef, Package, Edit, Plus, Save, X, Loader2, Search, Power, Trash2 } from 'lucide-react'

interface Operador { id: string; nombre: string; rol: string }

const FAMILIAS = [
  { id: 'CORTE_VACUNO', label: 'Corte Vacuno' },
  { id: 'CORTE_EQUINO', label: 'Corte Equino' },
  { id: 'MENUDENCIA', label: 'Menudencia' },
  { id: 'SUBPRODUCTO', label: 'Subproducto' },
  { id: 'PRODUCTO_ELAVORADO', label: 'Producto Elaborado' },
  { id: 'DESPERDICIO', label: 'Desperdicio' },
  { id: 'OTRO', label: 'Otro' },
]

const ESPECIES = [
  { value: 'BOVINO', label: 'Bovino' },
  { value: 'EQUINO', label: 'Equino' },
]

interface TipoProducto {
  id: string
  codigo: string
  nombre: string
  tipo: string
  especie?: string | null
  requiereFrio: boolean
  diasConservacion?: number | null
  temperaturaMax?: number | null
  activo: boolean
  observaciones?: string | null
  categoriaPadre?: { id: string; codigo: string; nombre: string } | null
}

export function ConfigTiposProductoModule({ operador }: { operador: Operador }) {
  const [tiposProducto, setTiposProducto] = useState<TipoProducto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tipoEditando, setTipoEditando] = useState<TipoProducto | null>(null)
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS')
  const [busqueda, setBusqueda] = useState('')
  
  // Form
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    tipo: 'OTRO',
    especie: 'all',
    requiereFrio: true,
    diasConservacion: '',
    temperaturaMax: '',
    activo: true,
    observaciones: ''
  })

  useEffect(() => {
    fetchTiposProducto()
  }, [])

  const fetchTiposProducto = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tipos-producto')
      const data = await res.json()
      if (data.success) {
        setTiposProducto(data.data || [])
      } else {
        toast.error('Error al cargar tipos de producto')
      }
    } catch (error) {
      console.error('Error fetching tipos producto:', error)
      toast.error('Error al cargar tipos de producto')
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total: tiposProducto.length,
    activos: tiposProducto.filter(t => t.activo).length,
    porTipo: {
      CORTE_VACUNO: tiposProducto.filter(t => t.tipo === 'CORTE_VACUNO' && t.activo).length,
      CORTE_EQUINO: tiposProducto.filter(t => t.tipo === 'CORTE_EQUINO' && t.activo).length,
      MENUDENCIA: tiposProducto.filter(t => t.tipo === 'MENUDENCIA' && t.activo).length,
      OTROS: tiposProducto.filter(t => !['CORTE_VACUNO', 'CORTE_EQUINO', 'MENUDENCIA'].includes(t.tipo) && t.activo).length,
    }
  }

  const handleNuevo = () => {
    setTipoEditando(null)
    setFormData({
      codigo: '',
      nombre: '',
      tipo: 'OTRO',
      especie: 'all',
      requiereFrio: true,
      diasConservacion: '',
      temperaturaMax: '',
      activo: true,
      observaciones: ''
    })
    setDialogOpen(true)
  }

  const handleEditar = (tipo: TipoProducto) => {
    setTipoEditando(tipo)
    setFormData({
      codigo: tipo.codigo,
      nombre: tipo.nombre,
      tipo: tipo.tipo,
      especie: tipo.especie || 'all',
      requiereFrio: tipo.requiereFrio,
      diasConservacion: tipo.diasConservacion?.toString() || '',
      temperaturaMax: tipo.temperaturaMax?.toString() || '',
      activo: tipo.activo,
      observaciones: tipo.observaciones || ''
    })
    setDialogOpen(true)
  }

  const handleToggleEstado = async (tipo: TipoProducto) => {
    try {
      const res = await fetch('/api/tipos-producto', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tipo.id, activo: !tipo.activo })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setTiposProducto(tiposProducto.map(t => 
          t.id === tipo.id ? { ...t, activo: !t.activo } : t
        ))
        toast.success(tipo.activo 
          ? `Tipo de producto ${tipo.nombre} desactivado` 
          : `Tipo de producto ${tipo.nombre} activado`
        )
      } else {
        toast.error(data.error || 'Error al actualizar estado')
      }
    } catch (error) {
      toast.error('Error al actualizar estado')
    }
  }

  const handleEliminar = async (tipo: TipoProducto) => {
    if (!confirm(`¿Está seguro de eliminar el tipo "${tipo.nombre}"?`)) return
    
    try {
      const res = await fetch(`/api/tipos-producto?id=${tipo.id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        setTiposProducto(tiposProducto.filter(t => t.id !== tipo.id))
        toast.success('Tipo de producto eliminado')
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleGuardar = async () => {
    if (!formData.codigo.trim()) {
      toast.error('Ingrese el código')
      return
    }
    if (!formData.nombre.trim()) {
      toast.error('Ingrese el nombre')
      return
    }
    
    setSaving(true)
    try {
      const payload = {
        id: tipoEditando?.id,
        codigo: formData.codigo.toUpperCase(),
        nombre: formData.nombre,
        tipo: formData.tipo,
        especie: formData.especie === 'all' ? null : formData.especie,
        requiereFrio: formData.requiereFrio,
        diasConservacion: formData.diasConservacion ? parseInt(formData.diasConservacion) : null,
        temperaturaMax: formData.temperaturaMax ? parseFloat(formData.temperaturaMax) : null,
        activo: formData.activo,
        observaciones: formData.observaciones || null
      }

      const res = await fetch('/api/tipos-producto', {
        method: tipoEditando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success(tipoEditando ? 'Tipo de producto actualizado' : 'Tipo de producto creado')
        setDialogOpen(false)
        fetchTiposProducto()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar tipo de producto')
    } finally {
      setSaving(false)
    }
  }

  // Filtrar tipos de producto
  const tiposFiltrados = tiposProducto.filter(t => {
    if (filtroTipo !== 'TODOS' && t.tipo !== filtroTipo) return false
    if (busqueda) {
      const termino = busqueda.toLowerCase()
      return (
        t.codigo.toLowerCase().includes(termino) ||
        t.nombre.toLowerCase().includes(termino)
      )
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
              <Tag className="w-8 h-8 text-amber-500" />
              Configuración de Tipos de Producto
            </h1>
            <p className="text-stone-500">Gestión de tipos y categorías de productos del frigorífico</p>
          </div>
          <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Tipo
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-stone-100 p-2 rounded-lg">
                  <Tag className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Total Tipos</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Beef className="w-5 h-5 text-green-600" />
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
                <div className="bg-red-100 p-2 rounded-lg">
                  <Beef className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Cortes Vacunos</p>
                  <p className="text-xl font-bold text-red-600">{stats.porTipo.CORTE_VACUNO}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Otros Tipos</p>
                  <p className="text-xl font-bold text-amber-600">{stats.porTipo.OTROS + stats.porTipo.MENUDENCIA}</p>
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
                    placeholder="Código o nombre..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Label className="text-xs">Filtrar por Tipo</Label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    {FAMILIAS.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Tipos de Producto */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-600" />
              Tipos de Producto Configurados ({tiposFiltrados.length})
            </CardTitle>
            <CardDescription>
              Listado de tipos y categorías de productos del frigorífico
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                <p className="text-stone-400 mt-2">Cargando tipos de producto...</p>
              </div>
            ) : tiposFiltrados.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No se encontraron tipos de producto</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-stone-50/50">
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Especie</TableHead>
                    <TableHead>Conservación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiposFiltrados.map((tipo) => (
                    <TableRow key={tipo.id} className={!tipo.activo ? 'opacity-50' : ''}>
                      <TableCell className="font-mono text-sm font-medium">{tipo.codigo}</TableCell>
                      <TableCell className="font-medium">{tipo.nombre}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-stone-50">
                          {FAMILIAS.find(f => f.id === tipo.tipo)?.label || tipo.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{tipo.especie || '-'}</TableCell>
                      <TableCell>
                        {tipo.diasConservacion 
                          ? `${tipo.diasConservacion} días${tipo.temperaturaMax ? ` / ${tipo.temperaturaMax}°C` : ''}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          tipo.activo 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'bg-red-100 text-red-700 border-red-200'
                        }>
                          {tipo.activo ? 'ACTIVO' : 'INACTIVO'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditar(tipo)} title="Editar">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleToggleEstado(tipo)}
                            title={tipo.activo ? 'Desactivar' : 'Activar'}
                            className={tipo.activo ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEliminar(tipo)}
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
            )}
          </CardContent>
        </Card>

        {/* Dialog Nuevo/Editar Tipo de Producto */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md" maximizable>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-500" />
                {tipoEditando ? 'Editar Tipo de Producto' : 'Nuevo Tipo de Producto'}
              </DialogTitle>
              <DialogDescription>
                {tipoEditando 
                  ? 'Modifique los datos del tipo de producto' 
                  : 'Complete los datos para crear un nuevo tipo de producto'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase().replace(/\s/g, '') })}
                    placeholder="TIP-001"
                    className="font-mono"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FAMILIAS.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Media Res"
                />
              </div>

              <div className="space-y-2">
                <Label>Especie</Label>
                <Select value={formData.especie} onValueChange={(value) => setFormData({ ...formData, especie: value })}>
                  <SelectTrigger><SelectValue placeholder="Sin especificar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Sin especificar</SelectItem>
                    {ESPECIES.map(e => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Días Conservación</Label>
                  <Input
                    type="number"
                    value={formData.diasConservacion}
                    onChange={(e) => setFormData({ ...formData, diasConservacion: e.target.value })}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Temp. Máx (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.temperaturaMax}
                    onChange={(e) => setFormData({ ...formData, temperaturaMax: e.target.value })}
                    placeholder="5.0"
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
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="frio"
                    checked={formData.requiereFrio}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, requiereFrio: checked as boolean })
                    }
                  />
                  <Label htmlFor="frio" className="cursor-pointer">Requiere Frío</Label>
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

export default ConfigTiposProductoModule
