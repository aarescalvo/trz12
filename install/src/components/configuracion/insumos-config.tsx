'use client'

import { useState, useEffect } from 'react'
import { Package, Plus, Edit2, Trash2, Save, X, RefreshCw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

// Types based on Prisma schema
type CategoriaInsumo = 'EMBALAJE' | 'ETIQUETAS' | 'HIGIENE' | 'PROTECCION' | 'HERRAMIENTAS' | 'OFICINA' | 'OTROS'

interface Insumo {
  id: string
  codigo: string
  nombre: string
  categoria: CategoriaInsumo
  subcategoria?: string | null
  unidadMedida: string
  stockActual: number
  stockMinimo: number
  stockMaximo?: number | null
  puntoReposicion?: number | null
  proveedorNombre?: string | null
  codigoProveedor?: string | null
  precioUnitario?: number | null
  moneda: string
  ubicacion?: string | null
  activo: boolean
  observaciones?: string | null
}

interface Operador {
  id: string
  nombre: string
  usuario?: string
  rol?: string
}

const CATEGORIAS: { value: CategoriaInsumo; label: string }[] = [
  { value: 'EMBALAJE', label: 'Embalaje' },
  { value: 'ETIQUETAS', label: 'Etiquetas' },
  { value: 'HIGIENE', label: 'Higiene' },
  { value: 'PROTECCION', label: 'Protección' },
  { value: 'HERRAMIENTAS', label: 'Herramientas' },
  { value: 'OFICINA', label: 'Oficina' },
  { value: 'OTROS', label: 'Otros' },
]

const UNIDADES_MEDIDA = ['UN', 'KG', 'L', 'M', 'ROLLO']

const emptyFormData = {
  codigo: '',
  nombre: '',
  categoria: 'OTROS' as CategoriaInsumo,
  subcategoria: '',
  unidadMedida: 'UN',
  stockActual: 0,
  stockMinimo: 0,
  stockMaximo: '',
  puntoReposicion: '',
  proveedorNombre: '',
  codigoProveedor: '',
  precioUnitario: '',
  ubicacion: '',
  activo: true,
  observaciones: '',
}

export function InsumosConfig({ operador }: { operador: Operador }) {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editando, setEditando] = useState<Insumo | null>(null)
  
  const [formData, setFormData] = useState(emptyFormData)

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
      }
    } catch (error) {
      console.error('Error fetching insumos:', error)
      toast.error('Error al cargar insumos')
    } finally {
      setLoading(false)
    }
  }

  const handleNuevo = () => {
    setEditando(null)
    setFormData(emptyFormData)
    setDialogOpen(true)
  }

  const handleEditar = (insumo: Insumo) => {
    setEditando(insumo)
    setFormData({
      codigo: insumo.codigo,
      nombre: insumo.nombre,
      categoria: insumo.categoria,
      subcategoria: insumo.subcategoria || '',
      unidadMedida: insumo.unidadMedida,
      stockActual: insumo.stockActual,
      stockMinimo: insumo.stockMinimo,
      stockMaximo: insumo.stockMaximo?.toString() || '',
      puntoReposicion: insumo.puntoReposicion?.toString() || '',
      proveedorNombre: insumo.proveedorNombre || '',
      codigoProveedor: insumo.codigoProveedor || '',
      precioUnitario: insumo.precioUnitario?.toString() || '',
      ubicacion: insumo.ubicacion || '',
      activo: insumo.activo,
      observaciones: insumo.observaciones || '',
    })
    setDialogOpen(true)
  }

  const handleEliminar = (insumo: Insumo) => {
    setEditando(insumo)
    setDeleteOpen(true)
  }

  const handleGuardar = async () => {
    if (!formData.codigo.trim()) {
      toast.error('El código es obligatorio')
      return
    }
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setSaving(true)
    try {
      const url = '/api/insumos'
      const method = editando ? 'PUT' : 'POST'
      const body = {
        ...(editando ? { id: editando.id } : {}),
        codigo: formData.codigo.trim(),
        nombre: formData.nombre.trim(),
        categoria: formData.categoria,
        subcategoria: formData.subcategoria.trim() || null,
        unidadMedida: formData.unidadMedida,
        stockActual: Number(formData.stockActual) || 0,
        stockMinimo: Number(formData.stockMinimo) || 0,
        stockMaximo: formData.stockMaximo ? Number(formData.stockMaximo) : null,
        puntoReposicion: formData.puntoReposicion ? Number(formData.puntoReposicion) : null,
        proveedorNombre: formData.proveedorNombre.trim() || null,
        codigoProveedor: formData.codigoProveedor.trim() || null,
        precioUnitario: formData.precioUnitario ? Number(formData.precioUnitario) : null,
        ubicacion: formData.ubicacion.trim() || null,
        activo: formData.activo,
        observaciones: formData.observaciones.trim() || null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editando ? 'Insumo actualizado' : 'Insumo creado')
        setDialogOpen(false)
        fetchInsumos()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error saving insumo:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmarEliminar = async () => {
    if (!editando) return

    setSaving(true)
    try {
      const res = await fetch(`/api/insumos?id=${editando.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Insumo eliminado')
        setDeleteOpen(false)
        fetchInsumos()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      console.error('Error deleting insumo:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const getCategoriaLabel = (cat: CategoriaInsumo) => {
    return CATEGORIAS.find(c => c.value === cat)?.label || cat
  }

  const isStockBajo = (insumo: Insumo) => {
    return insumo.stockActual < insumo.stockMinimo
  }

  const formatPrecio = (precio?: number | null) => {
    if (precio === null || precio === undefined) return '-'
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(precio)
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                Gestión de Insumos
              </CardTitle>
              <CardDescription>
                Administre los insumos y materiales del frigorífico
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={fetchInsumos} title="Actualizar">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Insumo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="p-8 text-center">
              <Package className="w-8 h-8 animate-pulse mx-auto text-amber-500" />
              <p className="mt-2 text-stone-500">Cargando insumos...</p>
            </div>
          ) : insumos.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay insumos registrados</p>
              <Button onClick={handleNuevo} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Insumo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insumos.map((insumo) => (
                <Card 
                  key={insumo.id} 
                  className={`border ${isStockBajo(insumo) ? 'border-red-200 bg-red-50/30' : 'border-stone-200'}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                            {insumo.codigo}
                          </span>
                          <Badge 
                            variant={insumo.activo ? 'default' : 'secondary'}
                            className={insumo.activo ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}
                          >
                            {insumo.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                        <CardTitle className="text-base mt-1">{insumo.nombre}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Categoría:</span>
                        <Badge variant="outline" className="text-xs">
                          {getCategoriaLabel(insumo.categoria)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Stock:</span>
                        <div className="flex items-center gap-1">
                          {isStockBajo(insumo) && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`font-medium ${isStockBajo(insumo) ? 'text-red-600' : ''}`}>
                            {insumo.stockActual} / {insumo.stockMinimo} {insumo.unidadMedida}
                          </span>
                        </div>
                      </div>
                      
                      {insumo.stockMinimo > 0 && (
                        <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              isStockBajo(insumo) ? 'bg-red-500' : 'bg-green-500'
                            }`}
                            style={{ 
                              width: `${Math.min((insumo.stockActual / insumo.stockMinimo) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Precio:</span>
                        <span className="font-medium">{formatPrecio(insumo.precioUnitario)}</span>
                      </div>
                      
                      {insumo.ubicacion && (
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Ubicación:</span>
                          <span className="text-xs">{insumo.ubicacion}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-end gap-1 pt-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditar(insumo)}
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEliminar(insumo)}
                          className="text-red-500 hover:text-red-700"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nuevo/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              {editando ? 'Editar Insumo' : 'Nuevo Insumo'}
            </DialogTitle>
            <DialogDescription>
              Complete los datos del insumo
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Código */}
            <div className="space-y-2">
              <Label>Código *</Label>
              <Input
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="INS-001"
              />
            </div>
            
            {/* Nombre */}
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre del insumo"
              />
            </div>
            
            {/* Categoría */}
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select 
                value={formData.categoria} 
                onValueChange={(value) => setFormData({ ...formData, categoria: value as CategoriaInsumo })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Subcategoría */}
            <div className="space-y-2">
              <Label>Subcategoría</Label>
              <Input
                value={formData.subcategoria}
                onChange={(e) => setFormData({ ...formData, subcategoria: e.target.value })}
                placeholder="Subcategoría (opcional)"
              />
            </div>
            
            {/* Unidad de Medida */}
            <div className="space-y-2">
              <Label>Unidad de Medida</Label>
              <Select 
                value={formData.unidadMedida} 
                onValueChange={(value) => setFormData({ ...formData, unidadMedida: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar unidad" />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES_MEDIDA.map((unidad) => (
                    <SelectItem key={unidad} value={unidad}>
                      {unidad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Stock Actual */}
            <div className="space-y-2">
              <Label>Stock Actual</Label>
              <Input
                type="number"
                value={formData.stockActual}
                onChange={(e) => setFormData({ ...formData, stockActual: Number(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
            </div>
            
            {/* Stock Mínimo */}
            <div className="space-y-2">
              <Label>Stock Mínimo</Label>
              <Input
                type="number"
                value={formData.stockMinimo}
                onChange={(e) => setFormData({ ...formData, stockMinimo: Number(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
            </div>
            
            {/* Stock Máximo */}
            <div className="space-y-2">
              <Label>Stock Máximo</Label>
              <Input
                type="number"
                value={formData.stockMaximo}
                onChange={(e) => setFormData({ ...formData, stockMaximo: e.target.value })}
                placeholder="Opcional"
                min="0"
                step="0.01"
              />
            </div>
            
            {/* Punto de Reposición */}
            <div className="space-y-2">
              <Label>Punto de Reposición</Label>
              <Input
                type="number"
                value={formData.puntoReposicion}
                onChange={(e) => setFormData({ ...formData, puntoReposicion: e.target.value })}
                placeholder="Opcional"
                min="0"
                step="0.01"
              />
            </div>
            
            {/* Proveedor */}
            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Input
                value={formData.proveedorNombre}
                onChange={(e) => setFormData({ ...formData, proveedorNombre: e.target.value })}
                placeholder="Nombre del proveedor"
              />
            </div>
            
            {/* Código Proveedor */}
            <div className="space-y-2">
              <Label>Código Proveedor</Label>
              <Input
                value={formData.codigoProveedor}
                onChange={(e) => setFormData({ ...formData, codigoProveedor: e.target.value })}
                placeholder="Código del proveedor"
              />
            </div>
            
            {/* Precio Unitario */}
            <div className="space-y-2">
              <Label>Precio Unitario</Label>
              <Input
                type="number"
                value={formData.precioUnitario}
                onChange={(e) => setFormData({ ...formData, precioUnitario: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            
            {/* Ubicación */}
            <div className="space-y-2">
              <Label>Ubicación</Label>
              <Input
                value={formData.ubicacion}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                placeholder="Depósito, estantería, etc."
              />
            </div>
            
            {/* Activo */}
            <div className="space-y-2 flex items-center justify-between">
              <Label>Activo</Label>
              <Switch
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
            </div>
            
            {/* Observaciones - Full width */}
            <div className="space-y-2 md:col-span-2">
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
              <AlertTriangle className="w-5 h-5" />
              Eliminar Insumo
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar el insumo &quot;{editando?.nombre}&quot;?
              <br />
              <span className="text-red-500">Esta acción no se puede deshacer.</span>
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

export default InsumosConfig
