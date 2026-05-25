'use client'

import { useState, useEffect } from 'react'
import { 
  Layers2, Plus, Edit2, Trash2, Save, X, RefreshCw, 
  Thermometer, Tag, Weight, DollarSign, Barcode, AlertCircle, Package, Search, TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface Subproducto {
  id: string
  codigo: string
  nombre: string
  categoria: string
  especie: string | null
  requiereFrio: boolean
  temperaturaMax: number | null
  unidadMedida: string
  rendimientoPct: number | null
  generaRotulo: boolean
  codigoRotulo: string | null
  precioReferencia: number | null
  activo: boolean
  observaciones: string | null
}

interface Operador {
  id: string
  nombre: string
  usuario?: string
  rol?: string
}

const CATEGORIAS = [
  { value: 'MENUDENCIA', label: 'Menudencias', color: 'bg-amber-100 text-amber-700' },
  { value: 'CUERO', label: 'Cueros', color: 'bg-stone-100 text-stone-700' },
  { value: 'GRASA', label: 'Grasa', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'HUESO', label: 'Huesos', color: 'bg-gray-100 text-gray-700' },
  { value: 'VISCERAS', label: 'Vísceras', color: 'bg-red-100 text-red-700' },
  { value: 'OTRO', label: 'Otros', color: 'bg-blue-100 text-blue-700' }
]

const ESPECIES = [
  { value: 'BOVINO', label: 'Bovino' },
  { value: 'EQUINO', label: 'Equino' },
  { value: 'AMBOS', label: 'Ambos' }
]

const UNIDADES = [
  { value: 'KG', label: 'Kilogramos (KG)' },
  { value: 'UNIDAD', label: 'Unidades' },
  { value: 'LITRO', label: 'Litros (L)' }
]

export function SubproductosConfig({ operador }: { operador: Operador }) {
  const [subproductos, setSubproductos] = useState<Subproducto[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSubproducto, setEditingSubproducto] = useState<Subproducto | null>(null)
  const [saving, setSaving] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [busqueda, setBusqueda] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria: 'MENUDENCIA',
    especie: '',
    requiereFrio: true,
    temperaturaMax: '',
    unidadMedida: 'KG',
    rendimientoPct: '',
    generaRotulo: false,
    codigoRotulo: '',
    precioReferencia: '',
    activo: true,
    observaciones: ''
  })

  useEffect(() => {
    fetchSubproductos()
  }, [])

  const fetchSubproductos = async () => {
    try {
      const res = await fetch('/api/subproductos-config')
      const data = await res.json()
      if (data.success) {
        setSubproductos(data.data)
      }
    } catch {
      toast.error('Error al cargar subproductos')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      categoria: 'MENUDENCIA',
      especie: '',
      requiereFrio: true,
      temperaturaMax: '',
      unidadMedida: 'KG',
      rendimientoPct: '',
      generaRotulo: false,
      codigoRotulo: '',
      precioReferencia: '',
      activo: true,
      observaciones: ''
    })
    setEditingSubproducto(null)
  }

  const openNewDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (subproducto: Subproducto) => {
    setEditingSubproducto(subproducto)
    setFormData({
      codigo: subproducto.codigo,
      nombre: subproducto.nombre,
      categoria: subproducto.categoria,
      especie: subproducto.especie || '',
      requiereFrio: subproducto.requiereFrio,
      temperaturaMax: subproducto.temperaturaMax?.toString() || '',
      unidadMedida: subproducto.unidadMedida,
      rendimientoPct: subproducto.rendimientoPct?.toString() || '',
      generaRotulo: subproducto.generaRotulo,
      codigoRotulo: subproducto.codigoRotulo || '',
      precioReferencia: subproducto.precioReferencia?.toString() || '',
      activo: subproducto.activo,
      observaciones: subproducto.observaciones || ''
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.codigo || !formData.nombre) {
      toast.error('Código y nombre son requeridos')
      return
    }

    setSaving(true)
    try {
      const url = '/api/subproductos-config'
      const method = editingSubproducto ? 'PUT' : 'POST'
      const body = editingSubproducto 
        ? { ...formData, id: editingSubproducto.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editingSubproducto ? 'Subproducto actualizado' : 'Subproducto creado')
        fetchSubproductos()
        setDialogOpen(false)
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

  const handleDelete = async (subproducto: Subproducto) => {
    if (!confirm(`¿Eliminar el subproducto "${subproducto.nombre}"?`)) return

    try {
      const res = await fetch(`/api/subproductos-config?id=${subproducto.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Subproducto eliminado')
        fetchSubproductos()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const getCategoriaInfo = (categoria: string) => {
    return CATEGORIAS.find(c => c.value === categoria) || { label: categoria, color: 'bg-stone-100 text-stone-700' }
  }

  const subproductosFiltrados = subproductos.filter(s => {
    const matchCategoria = filtroCategoria === 'todas' || s.categoria === filtroCategoria
    const matchBusqueda = busqueda === '' || 
      s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.codigo.toLowerCase().includes(busqueda.toLowerCase())
    return matchCategoria && matchBusqueda
  })

  // Agrupar por categoría
  const subproductosPorCategoria = subproductosFiltrados.reduce((acc, s) => {
    if (!acc[s.categoria]) acc[s.categoria] = []
    acc[s.categoria].push(s)
    return acc
  }, {} as Record<string, Subproducto[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-stone-500">Configure los tipos de subproductos del frigorífico</p>
        </div>
        <Button onClick={openNewDialog} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Subproducto
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  placeholder="Buscar por código o nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {CATEGORIAS.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchSubproductos}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista por categorías */}
      {subproductosFiltrados.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-8 text-center">
            <Layers2 className="w-16 h-16 mx-auto mb-4 text-stone-300" />
            <p className="text-stone-500">No hay subproductos configurados</p>
            <Button onClick={openNewDialog} variant="outline" className="mt-4">
              Agregar primer subproducto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(subproductosPorCategoria).map(([categoria, items]) => (
            <Card key={categoria} className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Badge className={getCategoriaInfo(categoria).color}>
                    {getCategoriaInfo(categoria).label}
                  </Badge>
                  <span className="text-sm text-stone-500">({items.length} items)</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(subproducto => (
                    <div 
                      key={subproducto.id} 
                      className={`p-4 rounded-lg border ${subproducto.activo ? 'bg-white border-stone-200' : 'bg-stone-50 border-stone-200 opacity-60'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-stone-500">{subproducto.codigo}</span>
                            {!subproducto.activo && (
                              <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                            )}
                          </div>
                          <p className="font-medium text-stone-800">{subproducto.nombre}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEditDialog(subproducto)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDelete(subproducto)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-stone-600">
                        <div className="flex items-center gap-1">
                          <Weight className="w-3 h-3" />
                          <span>{subproducto.unidadMedida}</span>
                        </div>
                        {subproducto.especie && (
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            <span>{subproducto.especie}</span>
                          </div>
                        )}
                        {subproducto.temperaturaMax && (
                          <div className="flex items-center gap-1">
                            <Thermometer className="w-3 h-3" />
                            <span>Máx {subproducto.temperaturaMax}°C</span>
                          </div>
                        )}
                        {subproducto.rendimientoPct && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>{subproducto.rendimientoPct}% rendimiento</span>
                          </div>
                        )}
                        {subproducto.precioReferencia && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>${subproducto.precioReferencia}/kg</span>
                          </div>
                        )}
                        {subproducto.generaRotulo && (
                          <div className="flex items-center gap-1 text-amber-600">
                            <Barcode className="w-3 h-3" />
                            <span>Con rótulo</span>
                          </div>
                        )}
                      </div>

                      {subproducto.observaciones && (
                        <p className="text-xs text-stone-400 mt-2 italic truncate">
                          {subproducto.observaciones}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSubproducto ? 'Editar Subproducto' : 'Nuevo Subproducto'}</DialogTitle>
            <DialogDescription>
              Configure las características del subproducto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  placeholder="Ej: MEN-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Hígado"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="especie">Especie</Label>
                <Select value={formData.especie} onValueChange={(v) => setFormData({ ...formData, especie: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {ESPECIES.map(e => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unidadMedida">Unidad</Label>
                <Select value={formData.unidadMedida} onValueChange={(v) => setFormData({ ...formData, unidadMedida: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIDADES.map(u => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rendimientoPct">Rendimiento %</Label>
                <Input
                  id="rendimientoPct"
                  type="number"
                  step="0.01"
                  value={formData.rendimientoPct}
                  onChange={(e) => setFormData({ ...formData, rendimientoPct: e.target.value })}
                  placeholder="Ej: 3.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precioReferencia">Precio Ref. ($)</Label>
                <Input
                  id="precioReferencia"
                  type="number"
                  step="0.01"
                  value={formData.precioReferencia}
                  onChange={(e) => setFormData({ ...formData, precioReferencia: e.target.value })}
                  placeholder="Ej: 1500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Thermometer className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Requiere Frío</p>
                    <p className="text-sm text-stone-500">Necesita almacenamiento refrigerado</p>
                  </div>
                </div>
                <Switch
                  checked={formData.requiereFrio}
                  onCheckedChange={(checked) => setFormData({ ...formData, requiereFrio: checked })}
                />
              </div>

              {formData.requiereFrio && (
                <div className="space-y-2 ml-4">
                  <Label htmlFor="temperaturaMax">Temperatura Máxima (°C)</Label>
                  <Input
                    id="temperaturaMax"
                    type="number"
                    step="0.1"
                    value={formData.temperaturaMax}
                    onChange={(e) => setFormData({ ...formData, temperaturaMax: e.target.value })}
                    placeholder="Ej: 4"
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Barcode className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="font-medium">Genera Rótulo</p>
                    <p className="text-sm text-stone-500">Imprime etiqueta de trazabilidad</p>
                  </div>
                </div>
                <Switch
                  checked={formData.generaRotulo}
                  onCheckedChange={(checked) => setFormData({ ...formData, generaRotulo: checked })}
                />
              </div>

              {formData.generaRotulo && (
                <div className="space-y-2 ml-4">
                  <Label htmlFor="codigoRotulo">Código de Rótulo</Label>
                  <Input
                    id="codigoRotulo"
                    value={formData.codigoRotulo}
                    onChange={(e) => setFormData({ ...formData, codigoRotulo: e.target.value.toUpperCase() })}
                    placeholder="Ej: ROT-MEN"
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                <div>
                  <p className="font-medium">Activo</p>
                  <p className="text-sm text-stone-500">Habilitar para uso en el sistema</p>
                </div>
                <Switch
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas adicionales..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SubproductosConfig
