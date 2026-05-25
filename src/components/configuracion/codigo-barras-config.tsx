'use client'

import { useState, useEffect } from 'react'
import { Barcode, Plus, Edit2, Trash2, Save, X, RefreshCw, Eye, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface ConfigCodigoBarras {
  id: string
  nombre: string
  tipo: string
  formato: string
  prefijo: string | null
  incluirTropa: boolean
  incluirAnimal: boolean
  incluirFecha: boolean
  incluirCorral: boolean
  incluirPeso: boolean
  longitudTotal: number
  activo: boolean
}

interface Operador {
  id: string
  nombre: string
  usuario?: string
  rol?: string
}

const TIPOS_CODIGO = [
  { value: 'ANIMAL', label: 'Código de Animal' },
  { value: 'MEDIA_RES', label: 'Código de Media Res' },
  { value: 'PRODUCTO', label: 'Código de Producto' }
]

const FORMATOS = [
  { value: 'EAN128', label: 'EAN-128 (GS1-128)' },
  { value: 'CODE128', label: 'Code 128' },
  { value: 'CODE39', label: 'Code 39' },
  { value: 'QR', label: 'QR Code' }
]

export function CodigoBarrasConfig({ operador }: { operador: Operador }) {
  const [configuraciones, setConfiguraciones] = useState<ConfigCodigoBarras[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ConfigCodigoBarras | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'MEDIA_RES',
    formato: 'EAN128',
    prefijo: '',
    incluirTropa: true,
    incluirAnimal: true,
    incluirFecha: false,
    incluirCorral: false,
    incluirPeso: false,
    longitudTotal: 20,
    activo: true
  })

  useEffect(() => {
    fetchConfiguraciones()
  }, [])

  const fetchConfiguraciones = async () => {
    try {
      const res = await fetch('/api/codigo-barras')
      const data = await res.json()
      if (data.success) {
        setConfiguraciones(data.data)
      }
    } catch (error) {
      console.error('Error fetching configuraciones:', error)
      toast.error('Error al cargar configuraciones')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: 'MEDIA_RES',
      formato: 'EAN128',
      prefijo: '',
      incluirTropa: true,
      incluirAnimal: true,
      incluirFecha: false,
      incluirCorral: false,
      incluirPeso: false,
      longitudTotal: 20,
      activo: true
    })
    setEditingConfig(null)
  }

  const openNewDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (config: ConfigCodigoBarras) => {
    setEditingConfig(config)
    setFormData({
      nombre: config.nombre,
      tipo: config.tipo,
      formato: config.formato,
      prefijo: config.prefijo || '',
      incluirTropa: config.incluirTropa,
      incluirAnimal: config.incluirAnimal,
      incluirFecha: config.incluirFecha,
      incluirCorral: config.incluirCorral,
      incluirPeso: config.incluirPeso,
      longitudTotal: config.longitudTotal,
      activo: config.activo
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
      const url = '/api/codigo-barras'
      const method = editingConfig ? 'PUT' : 'POST'
      const body = editingConfig 
        ? { ...formData, id: editingConfig.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editingConfig ? 'Configuración actualizada' : 'Configuración creada')
        fetchConfiguraciones()
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

  const handleDelete = async (config: ConfigCodigoBarras) => {
    if (!confirm(`¿Eliminar la configuración "${config.nombre}"?`)) return

    try {
      const res = await fetch(`/api/codigo-barras?id=${config.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Configuración eliminada')
        fetchConfiguraciones()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const generarEjemplo = () => {
    let codigo = formData.prefijo || ''
    if (formData.incluirTropa) codigo += 'T00123'
    if (formData.incluirAnimal) codigo += 'A0001'
    if (formData.incluirFecha) codigo += '20240115'
    if (formData.incluirCorral) codigo += 'C01'
    if (formData.incluirPeso) codigo += 'P4500'
    return codigo || 'SIN-DATOS'
  }

  const getTipoLabel = (tipo: string) => {
    return TIPOS_CODIGO.find(t => t.value === tipo)?.label || tipo
  }

  const getFormatoLabel = (formato: string) => {
    return FORMATOS.find(f => f.value === formato)?.label || formato
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
          <p className="text-stone-500">Configure los formatos de código de barras (EAN-128)</p>
        </div>
        <Button onClick={openNewDialog} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Configuración
        </Button>
      </div>

      {/* Lista de configuraciones */}
      {configuraciones.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-8 text-center">
            <Barcode className="w-16 h-16 mx-auto mb-4 text-stone-300" />
            <p className="text-stone-500">No hay configuraciones de código de barras</p>
            <Button onClick={openNewDialog} variant="outline" className="mt-4">
              Agregar primera configuración
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {configuraciones.map(config => (
            <Card key={config.id} className={`border-0 shadow-md ${!config.activo ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Barcode className="w-5 h-5 text-amber-500" />
                      {config.nombre}
                    </CardTitle>
                    <CardDescription>{getTipoLabel(config.tipo)}</CardDescription>
                  </div>
                  <Badge variant={config.activo ? 'default' : 'secondary'} className={config.activo ? 'bg-green-100 text-green-700' : ''}>
                    {config.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="text-stone-500">Formato: </span>
                  <span className="font-medium">{getFormatoLabel(config.formato)}</span>
                </div>

                {config.prefijo && (
                  <div className="text-sm">
                    <span className="text-stone-500">Prefijo: </span>
                    <span className="font-mono bg-stone-100 px-1 rounded">{config.prefijo}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {config.incluirTropa && (
                    <Badge variant="outline" className="text-xs">Tropa</Badge>
                  )}
                  {config.incluirAnimal && (
                    <Badge variant="outline" className="text-xs">Animal</Badge>
                  )}
                  {config.incluirFecha && (
                    <Badge variant="outline" className="text-xs">Fecha</Badge>
                  )}
                  {config.incluirCorral && (
                    <Badge variant="outline" className="text-xs">Corral</Badge>
                  )}
                  {config.incluirPeso && (
                    <Badge variant="outline" className="text-xs">Peso</Badge>
                  )}
                </div>

                <div className="text-xs text-stone-500">
                  Longitud total: {config.longitudTotal} caracteres
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(config)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(config)} className="text-red-600 hover:text-red-700">
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
            <DialogTitle>{editingConfig ? 'Editar Configuración' : 'Nueva Configuración'}</DialogTitle>
            <DialogDescription>
              Configure el formato de código de barras
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Código Media Res Estándar"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Código</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CODIGO.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="formato">Formato</Label>
                <Select value={formData.formato} onValueChange={(v) => setFormData({ ...formData, formato: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATOS.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prefijo">Prefijo (opcional)</Label>
                <Input
                  id="prefijo"
                  value={formData.prefijo}
                  onChange={(e) => setFormData({ ...formData, prefijo: e.target.value.toUpperCase() })}
                  placeholder="Ej: SA"
                  maxLength={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitudTotal">Longitud Total</Label>
                <Input
                  id="longitudTotal"
                  type="number"
                  value={formData.longitudTotal}
                  onChange={(e) => setFormData({ ...formData, longitudTotal: parseInt(e.target.value) || 20 })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Campos a incluir</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <span className="text-sm">Número de Tropa</span>
                  <Switch
                    checked={formData.incluirTropa}
                    onCheckedChange={(checked) => setFormData({ ...formData, incluirTropa: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <span className="text-sm">Número de Animal</span>
                  <Switch
                    checked={formData.incluirAnimal}
                    onCheckedChange={(checked) => setFormData({ ...formData, incluirAnimal: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <span className="text-sm">Fecha</span>
                  <Switch
                    checked={formData.incluirFecha}
                    onCheckedChange={(checked) => setFormData({ ...formData, incluirFecha: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <span className="text-sm">Corral</span>
                  <Switch
                    checked={formData.incluirCorral}
                    onCheckedChange={(checked) => setFormData({ ...formData, incluirCorral: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg col-span-2">
                  <span className="text-sm">Peso</span>
                  <Switch
                    checked={formData.incluirPeso}
                    onCheckedChange={(checked) => setFormData({ ...formData, incluirPeso: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Vista previa */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">Vista Previa</span>
              </div>
              <div className="font-mono text-lg bg-white p-2 rounded border text-center">
                {generarEjemplo()}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
              <div>
                <p className="font-medium">Configuración Activa</p>
                <p className="text-sm text-stone-500">Habilitar para su uso en el sistema</p>
              </div>
              <Switch
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
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

export default CodigoBarrasConfig
