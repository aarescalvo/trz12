'use client'

import { useState, useEffect } from 'react'
import { Box, Plus, Edit2, Trash2, Save, X, RefreshCw, Thermometer, Droplet, Snowflake, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

const TIPOS_EMPAQUE = [
  { id: 'CAJA', label: 'Caja', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'BOLSA', label: 'Bolsa', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'BULTO', label: 'Bulto', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'CAJON', label: 'Cajón', color: 'bg-purple-100 text-purple-700 border-purple-200' },
]

interface CondicionEmbalaje {
  id: string
  codigo: string
  nombre: string
  temperaturaMin?: number | null
  temperaturaMax?: number | null
  humedadMin?: number | null
  humedadMax?: number | null
  tipoEmpaque: string
  materialEmpaque?: string | null
  requiereFrio: boolean
  requiereCongelado: boolean
  diasValidez?: number | null
  requiereRefrigeracion: boolean
  activo: boolean
  observaciones?: string
}

interface Operador {
  id: string
  nombre: string
  usuario?: string
  rol?: string
}

export function CondicionesEmbalaje({ operador }: { operador: Operador }) {
  const [condiciones, setCondiciones] = useState<CondicionEmbalaje[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [condicionEditando, setCondicionEditando] = useState<CondicionEmbalaje | null>(null)
  
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    temperaturaMin: '',
    temperaturaMax: '',
    humedadMin: '',
    humedadMax: '',
    tipoEmpaque: 'CAJA',
    materialEmpaque: '',
    requiereFrio: true,
    requiereCongelado: false,
    diasValidez: '',
    requiereRefrigeracion: true,
    activo: true,
    observaciones: ''
  })

  useEffect(() => {
    fetchCondiciones()
  }, [])

  const fetchCondiciones = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/condiciones-embalaje')
      const data = await res.json()
      if (data.success) {
        setCondiciones(data.data)
      }
    } catch (error) {
      console.error('Error fetching condiciones embalaje:', error)
      toast.error('Error al cargar condiciones de embalaje')
    } finally {
      setLoading(false)
    }
  }

  const handleNuevo = () => {
    setCondicionEditando(null)
    setFormData({
      codigo: '',
      nombre: '',
      temperaturaMin: '',
      temperaturaMax: '',
      humedadMin: '',
      humedadMax: '',
      tipoEmpaque: 'CAJA',
      materialEmpaque: '',
      requiereFrio: true,
      requiereCongelado: false,
      diasValidez: '',
      requiereRefrigeracion: true,
      activo: true,
      observaciones: ''
    })
    setDialogOpen(true)
  }

  const handleEditar = (condicion: CondicionEmbalaje) => {
    setCondicionEditando(condicion)
    setFormData({
      codigo: condicion.codigo,
      nombre: condicion.nombre,
      temperaturaMin: condicion.temperaturaMin?.toString() || '',
      temperaturaMax: condicion.temperaturaMax?.toString() || '',
      humedadMin: condicion.humedadMin?.toString() || '',
      humedadMax: condicion.humedadMax?.toString() || '',
      tipoEmpaque: condicion.tipoEmpaque,
      materialEmpaque: condicion.materialEmpaque || '',
      requiereFrio: condicion.requiereFrio,
      requiereCongelado: condicion.requiereCongelado,
      diasValidez: condicion.diasValidez?.toString() || '',
      requiereRefrigeracion: condicion.requiereRefrigeracion,
      activo: condicion.activo,
      observaciones: condicion.observaciones || ''
    })
    setDialogOpen(true)
  }

  const handleEliminar = (condicion: CondicionEmbalaje) => {
    setCondicionEditando(condicion)
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
      const url = '/api/condiciones-embalaje'
      const method = condicionEditando ? 'PUT' : 'POST'
      const body = {
        ...(condicionEditando ? { id: condicionEditando.id } : {}),
        codigo: formData.codigo,
        nombre: formData.nombre,
        temperaturaMin: formData.temperaturaMin ? parseFloat(formData.temperaturaMin) : null,
        temperaturaMax: formData.temperaturaMax ? parseFloat(formData.temperaturaMax) : null,
        humedadMin: formData.humedadMin ? parseFloat(formData.humedadMin) : null,
        humedadMax: formData.humedadMax ? parseFloat(formData.humedadMax) : null,
        tipoEmpaque: formData.tipoEmpaque,
        materialEmpaque: formData.materialEmpaque || null,
        requiereFrio: formData.requiereFrio,
        requiereCongelado: formData.requiereCongelado,
        diasValidez: formData.diasValidez ? parseInt(formData.diasValidez) : null,
        requiereRefrigeracion: formData.requiereRefrigeracion,
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
        toast.success(condicionEditando ? 'Condición de embalaje actualizada' : 'Condición de embalaje creada')
        setDialogOpen(false)
        fetchCondiciones()
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
    if (!condicionEditando) return

    setSaving(true)
    try {
      const res = await fetch(`/api/condiciones-embalaje?id=${condicionEditando.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Condición de embalaje eliminada')
        setDeleteOpen(false)
        fetchCondiciones()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const getTipoEmpaqueInfo = (tipo: string) => TIPOS_EMPAQUE.find(t => t.id === tipo) || TIPOS_EMPAQUE[0]

  const formatRango = (min?: number | null, max?: number | null, unit: string = '') => {
    if (min === null && max === null) return null
    if (min !== null && max !== null) return `${min}${unit} - ${max}${unit}`
    if (min !== null) return `Min: ${min}${unit}`
    return `Max: ${max}${unit}`
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Box className="w-5 h-5 text-amber-600" />
                Gestión de Condiciones de Embalaje
              </CardTitle>
              <CardDescription>
                Configure las condiciones de almacenamiento y transporte
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={fetchCondiciones} title="Actualizar">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Condición
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="p-8 text-center">
              <Box className="w-8 h-8 animate-pulse mx-auto text-amber-500" />
              <p className="text-stone-400 mt-2">Cargando condiciones de embalaje...</p>
            </div>
          ) : condiciones.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay condiciones de embalaje configuradas</p>
              <Button onClick={handleNuevo} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Agregar primera condición
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {condiciones.map((condicion) => {
                const tipoInfo = getTipoEmpaqueInfo(condicion.tipoEmpaque)
                const tempRango = formatRango(condicion.temperaturaMin, condicion.temperaturaMax, '°C')
                const humedadRango = formatRango(condicion.humedadMin, condicion.humedadMax, '%')
                
                return (
                  <Card 
                    key={condicion.id} 
                    className={`overflow-hidden transition-all hover:shadow-lg ${!condicion.activo ? 'opacity-60' : ''}`}
                  >
                    <div className={`h-1 ${tipoInfo.color.split(' ')[0]}`} />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-stone-100 px-2 py-0.5 rounded">
                              {condicion.codigo}
                            </span>
                            <Badge className={condicion.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                              {condicion.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                          <h3 className="font-semibold mt-1">{condicion.nombre}</h3>
                        </div>
                        <Badge variant="outline" className={tipoInfo.color}>
                          {tipoInfo.label}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm text-stone-600">
                        {tempRango && (
                          <div className="flex items-center gap-2">
                            <Thermometer className="w-4 h-4 text-orange-500" />
                            <span>{tempRango}</span>
                          </div>
                        )}

                        {humedadRango && (
                          <div className="flex items-center gap-2">
                            <Droplet className="w-4 h-4 text-blue-500" />
                            <span>Humedad: {humedadRango}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 mt-2">
                          {(condicion.requiereFrio || condicion.requiereCongelado) && (
                            <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                              <Snowflake className="w-3 h-3 mr-1" />
                              {condicion.requiereCongelado ? 'Congelado' : 'Frío'}
                            </Badge>
                          )}
                          
                          {condicion.requiereRefrigeracion && (
                            <Badge variant="outline" className="text-xs bg-cyan-50 border-cyan-200 text-cyan-700">
                              <Truck className="w-3 h-3 mr-1" />
                              Refrig. Transporte
                            </Badge>
                          )}
                        </div>

                        {condicion.diasValidez && (
                          <div className="text-xs text-stone-400 mt-2">
                            Validez: <strong>{condicion.diasValidez} días</strong>
                          </div>
                        )}

                        {condicion.materialEmpaque && (
                          <div className="text-xs text-stone-400">
                            Material: {condicion.materialEmpaque}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditar(condicion)}
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEliminar(condicion)}
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
              <Box className="w-5 h-5 text-amber-600" />
              {condicionEditando ? 'Editar Condición de Embalaje' : 'Nueva Condición de Embalaje'}
            </DialogTitle>
            <DialogDescription>
              {condicionEditando ? 'Modifique los datos de la condición de embalaje' : 'Complete los datos para crear una nueva condición de embalaje'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  placeholder="Ej: CE001"
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Caja Estándar Frío"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-orange-500" />
                Rango de Temperatura (°C)
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-stone-400">Mínima</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.temperaturaMin}
                    onChange={(e) => setFormData({ ...formData, temperaturaMin: e.target.value })}
                    placeholder="Ej: -18"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-stone-400">Máxima</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.temperaturaMax}
                    onChange={(e) => setFormData({ ...formData, temperaturaMax: e.target.value })}
                    placeholder="Ej: 4"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Droplet className="w-4 h-4 text-blue-500" />
                Rango de Humedad (%)
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-stone-400">Mínima</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.humedadMin}
                    onChange={(e) => setFormData({ ...formData, humedadMin: e.target.value })}
                    placeholder="Ej: 60"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-stone-400">Máxima</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.humedadMax}
                    onChange={(e) => setFormData({ ...formData, humedadMax: e.target.value })}
                    placeholder="Ej: 80"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Empaque</Label>
                <Select value={formData.tipoEmpaque} onValueChange={(v) => setFormData({ ...formData, tipoEmpaque: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_EMPAQUE.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Material de Empaque</Label>
                <Input
                  value={formData.materialEmpaque}
                  onChange={(e) => setFormData({ ...formData, materialEmpaque: e.target.value })}
                  placeholder="Ej: Cartón corrugado"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-blue-500" />
                  <Label className="cursor-pointer text-sm">Requiere Frío</Label>
                </div>
                <Switch
                  checked={formData.requiereFrio}
                  onCheckedChange={(v) => setFormData({ ...formData, requiereFrio: v })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-cyan-500" />
                  <Label className="cursor-pointer text-sm">Congelado</Label>
                </div>
                <Switch
                  checked={formData.requiereCongelado}
                  onCheckedChange={(v) => setFormData({ ...formData, requiereCongelado: v })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Días Validez</Label>
                <Input
                  type="number"
                  value={formData.diasValidez}
                  onChange={(e) => setFormData({ ...formData, diasValidez: e.target.value })}
                  placeholder="Ej: 30"
                  min="0"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-green-500" />
                  <Label className="cursor-pointer text-sm">Refrig. Transporte</Label>
                </div>
                <Switch
                  checked={formData.requiereRefrigeracion}
                  onCheckedChange={(v) => setFormData({ ...formData, requiereRefrigeracion: v })}
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
              Eliminar Condición de Embalaje
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar la condición de embalaje &quot;{condicionEditando?.nombre}&quot;?
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

export default CondicionesEmbalaje
