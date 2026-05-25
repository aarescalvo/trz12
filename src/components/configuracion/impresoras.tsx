'use client'

import { useState, useEffect } from 'react'
import { Printer, Plus, Edit2, Trash2, Save, X, RefreshCw, Star, Wifi, Usb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Impresora {
  id: string
  nombre: string
  tipo: string
  marca: string
  modelo: string | null
  puerto: string
  direccionIP: string | null
  anchoEtiqueta: number
  altoEtiqueta: number
  dpi: number
  activa: boolean
  predeterminada: boolean
  observaciones: string | null
}

interface Operador {
  id: string
  nombre: string
  usuario?: string
  rol?: string
}

const TIPOS_IMPRESORA = [
  { value: 'ANIMAL', label: 'Rótulo de Animal' },
  { value: 'MEDIA_RES', label: 'Rótulo de Media Res' },
  { value: 'CAJA', label: 'Rótulo de Caja' }
]

const MARCAS = [
  { value: 'ZEBRA', label: 'Zebra' },
  { value: 'DATAMAX', label: 'Datamax-O Neil' },
  { value: 'NETTIRA', label: 'Nettira (Datamax)' },
  { value: 'OTRA', label: 'Otra' }
]

const TIPOS_PUERTO = [
  { value: 'USB', label: 'USB' },
  { value: 'RED', label: 'Red (IP)' },
  { value: 'COM', label: 'Puerto Serie' }
]

export function Impresoras({ operador }: { operador: Operador }) {
  const [impresoras, setImpresoras] = useState<Impresora[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingImpresora, setEditingImpresora] = useState<Impresora | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'MEDIA_RES',
    marca: 'ZEBRA',
    modelo: '',
    puerto: 'USB',
    direccionIP: '',
    anchoEtiqueta: 80,
    altoEtiqueta: 50,
    dpi: 203,
    activa: true,
    predeterminada: false,
    observaciones: ''
  })

  useEffect(() => {
    fetchImpresoras()
  }, [])

  const fetchImpresoras = async () => {
    try {
      const res = await fetch('/api/impresoras')
      const data = await res.json()
      if (data.success) {
        setImpresoras(data.data)
      }
    } catch (error) {
      console.error('Error fetching impresoras:', error)
      toast.error('Error al cargar impresoras')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: 'MEDIA_RES',
      marca: 'ZEBRA',
      modelo: '',
      puerto: 'USB',
      direccionIP: '',
      anchoEtiqueta: 80,
      altoEtiqueta: 50,
      dpi: 203,
      activa: true,
      predeterminada: false,
      observaciones: ''
    })
    setEditingImpresora(null)
  }

  const openNewDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (impresora: Impresora) => {
    setEditingImpresora(impresora)
    setFormData({
      nombre: impresora.nombre,
      tipo: impresora.tipo,
      marca: impresora.marca,
      modelo: impresora.modelo || '',
      puerto: impresora.puerto,
      direccionIP: impresora.direccionIP || '',
      anchoEtiqueta: impresora.anchoEtiqueta,
      altoEtiqueta: impresora.altoEtiqueta,
      dpi: impresora.dpi,
      activa: impresora.activa,
      predeterminada: impresora.predeterminada,
      observaciones: impresora.observaciones || ''
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nombre) {
      toast.error('El nombre es requerido')
      return
    }

    setSaving(true)
    try {
      const url = '/api/impresoras'
      const method = editingImpresora ? 'PUT' : 'POST'
      const body = editingImpresora 
        ? { ...formData, id: editingImpresora.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editingImpresora ? 'Impresora actualizada' : 'Impresora creada')
        fetchImpresoras()
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

  const handleDelete = async (impresora: Impresora) => {
    if (!confirm(`¿Eliminar la impresora "${impresora.nombre}"?`)) return

    try {
      const res = await fetch(`/api/impresoras?id=${impresora.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Impresora eliminada')
        fetchImpresoras()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const handleTestPrint = async (impresora: Impresora) => {
    try {
      // TODO: Implementar test de impresión real
      toast.success(`Enviando prueba a ${impresora.nombre}...`)
    } catch {
      toast.error('Error al imprimir prueba')
    }
  }

  const getTipoLabel = (tipo: string) => {
    return TIPOS_IMPRESORA.find(t => t.value === tipo)?.label || tipo
  }

  const getMarcaLabel = (marca: string) => {
    return MARCAS.find(m => m.value === marca)?.label || marca
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con botón */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-stone-500">Configure las impresoras térmicas para rótulos</p>
        </div>
        <Button onClick={openNewDialog} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Impresora
        </Button>
      </div>

      {/* Lista de impresoras */}
      {impresoras.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-8 text-center">
            <Printer className="w-16 h-16 mx-auto mb-4 text-stone-300" />
            <p className="text-stone-500">No hay impresoras configuradas</p>
            <Button onClick={openNewDialog} variant="outline" className="mt-4">
              Agregar primera impresora
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {impresoras.map(impresora => (
            <Card key={impresora.id} className={`border-0 shadow-md ${!impresora.activa ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Printer className="w-5 h-5 text-amber-500" />
                      {impresora.nombre}
                      {impresora.predeterminada && (
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      )}
                    </CardTitle>
                    <CardDescription>{getTipoLabel(impresora.tipo)}</CardDescription>
                  </div>
                  <Badge variant={impresora.activa ? 'default' : 'secondary'} className={impresora.activa ? 'bg-green-100 text-green-700' : ''}>
                    {impresora.activa ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-stone-700">{getMarcaLabel(impresora.marca)}</span>
                  {impresora.modelo && (
                    <>
                      <span className="text-stone-400">|</span>
                      <span className="text-stone-600">{impresora.modelo}</span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  {impresora.puerto === 'USB' ? (
                    <Usb className="w-4 h-4" />
                  ) : impresora.puerto === 'RED' ? (
                    <Wifi className="w-4 h-4" />
                  ) : null}
                  <span>{impresora.puerto}</span>
                  {impresora.direccionIP && (
                    <span className="text-stone-400">({impresora.direccionIP})</span>
                  )}
                </div>

                <div className="text-xs text-stone-500">
                  Etiqueta: {impresora.anchoEtiqueta}x{impresora.altoEtiqueta}mm | {impresora.dpi} DPI
                </div>

                {impresora.observaciones && (
                  <p className="text-xs text-stone-500 italic">{impresora.observaciones}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => handleTestPrint(impresora)}>
                    <Printer className="w-4 h-4 mr-1" />
                    Test
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(impresora)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(impresora)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" maximizable>
          <DialogHeader>
            <DialogTitle>{editingImpresora ? 'Editar Impresora' : 'Nueva Impresora'}</DialogTitle>
            <DialogDescription>
              Configure los parámetros de la impresora térmica
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Impresora Media Res Principal"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Rótulo</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_IMPRESORA.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marca">Marca</Label>
                <Select value={formData.marca} onValueChange={(v) => setFormData({ ...formData, marca: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MARCAS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  value={formData.modelo}
                  onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                  placeholder="Ej: ZD420"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="puerto">Tipo de Conexión</Label>
                <Select value={formData.puerto} onValueChange={(v) => setFormData({ ...formData, puerto: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_PUERTO.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.puerto === 'RED' && (
              <div className="space-y-2">
                <Label htmlFor="direccionIP">Dirección IP</Label>
                <Input
                  id="direccionIP"
                  value={formData.direccionIP}
                  onChange={(e) => setFormData({ ...formData, direccionIP: e.target.value })}
                  placeholder="192.168.1.100"
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="anchoEtiqueta">Ancho (mm)</Label>
                <Input
                  id="anchoEtiqueta"
                  type="number"
                  value={formData.anchoEtiqueta}
                  onChange={(e) => setFormData({ ...formData, anchoEtiqueta: parseInt(e.target.value) || 80 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="altoEtiqueta">Alto (mm)</Label>
                <Input
                  id="altoEtiqueta"
                  type="number"
                  value={formData.altoEtiqueta}
                  onChange={(e) => setFormData({ ...formData, altoEtiqueta: parseInt(e.target.value) || 50 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dpi">DPI</Label>
                <Select value={formData.dpi.toString()} onValueChange={(v) => setFormData({ ...formData, dpi: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="203">203</SelectItem>
                    <SelectItem value="300">300</SelectItem>
                    <SelectItem value="600">600</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Input
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas adicionales..."
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                <div>
                  <p className="font-medium">Impresora Activa</p>
                  <p className="text-sm text-stone-500">Habilitar para su uso en el sistema</p>
                </div>
                <Switch
                  checked={formData.activa}
                  onCheckedChange={(checked) => setFormData({ ...formData, activa: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                <div>
                  <p className="font-medium">Predeterminada</p>
                  <p className="text-sm text-stone-500">Impresora por defecto para este tipo de rótulo</p>
                </div>
                <Switch
                  checked={formData.predeterminada}
                  onCheckedChange={(checked) => setFormData({ ...formData, predeterminada: checked })}
                />
              </div>
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

export default Impresoras
