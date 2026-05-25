'use client'

import { useState, useEffect } from 'react'
import { Tags, Plus, Edit2, Trash2, Save, X, RefreshCw, Layers, Snowflake, Thermometer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

const TIPOS_PRODUCTO = [
  { id: 'CORTE_VACUNO', label: 'Corte Vacuno', color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'CORTE_EQUINO', label: 'Corte Equino', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'MENUDENCIA', label: 'Menudencia', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'SUBPRODUCTO', label: 'Subproducto', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'PRODUCTO_ELAVORADO', label: 'Producto Elaborado', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'DESPOSTADO', label: 'Despostado', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'OTRO', label: 'Otro', color: 'bg-gray-100 text-gray-700 border-gray-200' },
]

const ESPECIES = [
  { id: 'BOVINO', label: 'Bovino' },
  { id: 'EQUINO', label: 'Equino' },
]

interface TipoProducto {
  id: string
  codigo: string
  nombre: string
  categoriaPadreId?: string
  categoriaPadre?: TipoProducto
  tipo: string
  especie?: string | null
  requiereFrio: boolean
  diasConservacion?: number | null
  temperaturaMax?: number | null
  activo: boolean
  observaciones?: string
}

interface Operador {
  id: string
  nombre: string
  usuario?: string
  rol?: string
}

export function TiposProducto({ operador }: { operador: Operador }) {
  const [tipos, setTipos] = useState<TipoProducto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [tipoEditando, setTipoEditando] = useState<TipoProducto | null>(null)
  
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoriaPadreId: '',
    tipo: 'CORTE_VACUNO',
    especie: '',
    requiereFrio: true,
    diasConservacion: '',
    temperaturaMax: '',
    activo: true,
    observaciones: ''
  })

  useEffect(() => {
    fetchTipos()
  }, [])

  const fetchTipos = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/tipos-producto')
      const data = await res.json()
      if (data.success) {
        setTipos(data.data)
      }
    } catch (error) {
      console.error('Error fetching tipos producto:', error)
      toast.error('Error al cargar tipos de producto')
    } finally {
      setLoading(false)
    }
  }

  const handleNuevo = () => {
    setTipoEditando(null)
    setFormData({
      codigo: '',
      nombre: '',
      categoriaPadreId: '',
      tipo: 'CORTE_VACUNO',
      especie: '',
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
      categoriaPadreId: tipo.categoriaPadreId || '',
      tipo: tipo.tipo,
      especie: tipo.especie || '',
      requiereFrio: tipo.requiereFrio,
      diasConservacion: tipo.diasConservacion?.toString() || '',
      temperaturaMax: tipo.temperaturaMax?.toString() || '',
      activo: tipo.activo,
      observaciones: tipo.observaciones || ''
    })
    setDialogOpen(true)
  }

  const handleEliminar = (tipo: TipoProducto) => {
    setTipoEditando(tipo)
    setDeleteOpen(true)
  }

  const handleGuardar = async () => {
    if (!formData.codigo) {
      toast.error('El código es requerido')
      return
    }
    if (!formData.nombre) {
      toast.error('El nombre es requerido')
      return
    }

    setSaving(true)
    try {
      const url = '/api/tipos-producto'
      const method = tipoEditando ? 'PUT' : 'POST'
      const body = {
        ...(tipoEditando ? { id: tipoEditando.id } : {}),
        codigo: formData.codigo,
        nombre: formData.nombre,
        categoriaPadreId: formData.categoriaPadreId || null,
        tipo: formData.tipo,
        especie: formData.especie || null,
        requiereFrio: formData.requiereFrio,
        diasConservacion: formData.diasConservacion ? parseInt(formData.diasConservacion) : null,
        temperaturaMax: formData.temperaturaMax ? parseFloat(formData.temperaturaMax) : null,
        activo: formData.activo,
        observaciones: formData.observaciones || null
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(tipoEditando ? 'Tipo de producto actualizado' : 'Tipo de producto creado')
        setDialogOpen(false)
        fetchTipos()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmarEliminar = async () => {
    if (!tipoEditando) return

    setSaving(true)
    try {
      const res = await fetch(`/api/tipos-producto?id=${tipoEditando.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Tipo de producto eliminado')
        setDeleteOpen(false)
        fetchTipos()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const getTipoInfo = (tipo: string) => TIPOS_PRODUCTO.find(t => t.id === tipo) || TIPOS_PRODUCTO[6]

  // Categorías padre disponibles (excluir la actual y sus descendientes)
  const categoriasPadreDisponibles = tipos.filter(t => 
    t.id !== tipoEditando?.id && t.activo
  )

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tags className="w-5 h-5 text-amber-600" />
                Gestión de Tipos de Producto
              </CardTitle>
              <CardDescription>
                Configure los tipos y categorías de productos
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={fetchTipos} title="Actualizar">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Tipo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="p-8 text-center">
              <Tags className="w-8 h-8 animate-pulse mx-auto text-amber-500" />
              <p className="text-stone-400 mt-2">Cargando tipos de producto...</p>
            </div>
          ) : tipos.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <Tags className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay tipos de producto configurados</p>
              <Button onClick={handleNuevo} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Agregar primer tipo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tipos.map((tipo) => {
                const tipoInfo = getTipoInfo(tipo.tipo)
                return (
                  <Card 
                    key={tipo.id} 
                    className={`overflow-hidden transition-all hover:shadow-lg ${!tipo.activo ? 'opacity-60' : ''}`}
                  >
                    <div className={`h-1 ${tipoInfo.color.split(' ')[0]}`} />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-stone-100 px-2 py-0.5 rounded">
                              {tipo.codigo}
                            </span>
                            <Badge className={tipo.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                              {tipo.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                          <h3 className="font-semibold mt-1">{tipo.nombre}</h3>
                        </div>
                        <Badge variant="outline" className={tipoInfo.color}>
                          {tipoInfo.label}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm text-stone-600">
                        {tipo.especie && (
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            <span>Especie: <strong>{tipo.especie}</strong></span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Snowflake className={`w-4 h-4 ${tipo.requiereFrio ? 'text-blue-500' : 'text-stone-300'}`} />
                          <span>Requiere frío: <strong>{tipo.requiereFrio ? 'Sí' : 'No'}</strong></span>
                        </div>

                        {tipo.diasConservacion && (
                          <div className="flex items-center gap-2">
                            <span className="text-stone-400">Conservación:</span>
                            <strong>{tipo.diasConservacion} días</strong>
                          </div>
                        )}

                        {tipo.temperaturaMax && (
                          <div className="flex items-center gap-2">
                            <Thermometer className="w-4 h-4 text-orange-500" />
                            <span>Temp. máx: <strong>{tipo.temperaturaMax}°C</strong></span>
                          </div>
                        )}

                        {tipo.categoriaPadre && (
                          <div className="text-xs text-stone-400">
                            Categoría padre: {tipo.categoriaPadre.nombre}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditar(tipo)}
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEliminar(tipo)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nuevo/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tags className="w-5 h-5 text-amber-600" />
              {tipoEditando ? 'Editar Tipo de Producto' : 'Nuevo Tipo de Producto'}
            </DialogTitle>
            <DialogDescription>
              {tipoEditando ? 'Modifique los datos del tipo de producto' : 'Complete los datos para crear un nuevo tipo de producto'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  placeholder="Ej: CV001"
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Corte Vacuno Premium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categoría Padre</Label>
              <Select 
                value={formData.categoriaPadreId} 
                onValueChange={(v) => setFormData({ ...formData, categoriaPadreId: v === '_none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin categoría padre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin categoría padre</SelectItem>
                  {categoriasPadreDisponibles.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.codigo} - {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_PRODUCTO.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Especie</Label>
                <Select 
                  value={formData.especie} 
                  onValueChange={(v) => setFormData({ ...formData, especie: v === '_none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin especificar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin especificar</SelectItem>
                    {ESPECIES.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Snowflake className="w-5 h-5 text-blue-500" />
                <div>
                  <Label className="cursor-pointer">Requiere Frío</Label>
                  <p className="text-xs text-stone-400">Indica si requiere cadena de frío</p>
                </div>
              </div>
              <Switch
                checked={formData.requiereFrio}
                onCheckedChange={(v) => setFormData({ ...formData, requiereFrio: v })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Días Conservación</Label>
                <Input
                  type="number"
                  value={formData.diasConservacion}
                  onChange={(e) => setFormData({ ...formData, diasConservacion: e.target.value })}
                  placeholder="Ej: 30"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Temperatura Máxima (°C)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.temperaturaMax}
                  onChange={(e) => setFormData({ ...formData, temperaturaMax: e.target.value })}
                  placeholder="Ej: 4"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label className="cursor-pointer">Activo</Label>
                <p className="text-xs text-stone-400">Los inactivos no aparecen en listados</p>
              </div>
              <Switch
                checked={formData.activo}
                onCheckedChange={(v) => setFormData({ ...formData, activo: v })}
              />
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Input
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas adicionales..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleGuardar} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Eliminar Tipo de Producto
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar el tipo de producto &quot;{tipoEditando?.nombre}&quot;?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarEliminar} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TiposProducto
