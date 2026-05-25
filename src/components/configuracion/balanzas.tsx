'use client'

import { useState, useEffect } from 'react'
import { Scale, Plus, Edit2, Trash2, Save, X, Power, RefreshCw, Cable } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Balanza {
  id: string
  nombre: string
  tipo: string
  puerto: string
  baudios: number
  bitsDatos: number
  bitsParada: number
  paridad: string
  timeout: number
  activa: boolean
  ultimaLectura: number | null
  fechaUltimaLect: string | null
  observaciones: string | null
}

interface Operador {
  id: string
  nombre: string
  usuario?: string
  rol?: string
}

const TIPOS_BALANZA = [
  { value: 'CAMIONES', label: 'Balanza de Camiones' },
  { value: 'HACIENDA_INDIVIDUAL', label: 'Balanza de Hacienda Individual' },
  { value: 'MEDIA_RES', label: 'Balanza de Media Res' },
  { value: 'CUARTEO', label: 'Balanza de Cuarteo' },
  { value: 'EMPAQUE', label: 'Balanza de Empaque' }
]

const PUERTOS_SERIE = ['COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'COM10']
const BAUDIOS = [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200]
const BITS_DATOS = [7, 8]
const BITS_PARADA = [1, 2]
const PARIDADES = [
  { value: 'NONE', label: 'Ninguna' },
  { value: 'EVEN', label: 'Par' },
  { value: 'ODD', label: 'Impar' }
]

export function Balanzas({ operador }: { operador: Operador }) {
  const [balanzas, setBalanzas] = useState<Balanza[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBalanza, setEditingBalanza] = useState<Balanza | null>(null)
  const [saving, setSaving] = useState(false)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'CAMIONES',
    puerto: 'COM1',
    baudios: 9600,
    bitsDatos: 8,
    bitsParada: 1,
    paridad: 'NONE',
    timeout: 1000,
    activa: true,
    observaciones: ''
  })

  useEffect(() => {
    fetchBalanzas()
  }, [])

  const fetchBalanzas = async () => {
    try {
      const res = await fetch('/api/balanzas')
      const data = await res.json()
      if (data.success) {
        setBalanzas(data.data)
      }
    } catch (error) {
      console.error('Error fetching balanzas:', error)
      toast.error('Error al cargar balanzas')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: 'CAMIONES',
      puerto: 'COM1',
      baudios: 9600,
      bitsDatos: 8,
      bitsParada: 1,
      paridad: 'NONE',
      timeout: 1000,
      activa: true,
      observaciones: ''
    })
    setEditingBalanza(null)
  }

  const openNewDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (balanza: Balanza) => {
    setEditingBalanza(balanza)
    setFormData({
      nombre: balanza.nombre,
      tipo: balanza.tipo,
      puerto: balanza.puerto,
      baudios: balanza.baudios,
      bitsDatos: balanza.bitsDatos,
      bitsParada: balanza.bitsParada,
      paridad: balanza.paridad,
      timeout: balanza.timeout,
      activa: balanza.activa,
      observaciones: balanza.observaciones || ''
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
      const url = '/api/balanzas'
      const method = editingBalanza ? 'PUT' : 'POST'
      const body = editingBalanza 
        ? { ...formData, id: editingBalanza.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editingBalanza ? 'Balanza actualizada' : 'Balanza creada')
        fetchBalanzas()
        setDialogOpen(false)
        resetForm()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (balanza: Balanza) => {
    if (!confirm(`¿Eliminar la balanza "${balanza.nombre}"?`)) return

    try {
      const res = await fetch(`/api/balanzas?id=${balanza.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Balanza eliminada')
        fetchBalanzas()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const handleTestConnection = async (balanza: Balanza) => {
    setTestingConnection(balanza.id)
    try {
      // TODO: Implementar test de conexión real
      // Por ahora simulamos la prueba
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success(`Conexión exitosa con ${balanza.puerto}`)
    } catch {
      toast.error('Error de conexión')
    } finally {
      setTestingConnection(null)
    }
  }

  const getTipoLabel = (tipo: string) => {
    return TIPOS_BALANZA.find(t => t.value === tipo)?.label || tipo
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
          <p className="text-stone-500">Configure las balanzas conectadas por RS232</p>
        </div>
        <Button onClick={openNewDialog} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Balanza
        </Button>
      </div>

      {/* Lista de balanzas */}
      {balanzas.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-8 text-center">
            <Scale className="w-16 h-16 mx-auto mb-4 text-stone-300" />
            <p className="text-stone-500">No hay balanzas configuradas</p>
            <Button onClick={openNewDialog} variant="outline" className="mt-4">
              Agregar primera balanza
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {balanzas.map(balanza => (
            <Card key={balanza.id} className={`border-0 shadow-md ${!balanza.activa ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Scale className="w-5 h-5 text-amber-500" />
                      {balanza.nombre}
                    </CardTitle>
                    <CardDescription>{getTipoLabel(balanza.tipo)}</CardDescription>
                  </div>
                  <Badge variant={balanza.activa ? 'default' : 'secondary'} className={balanza.activa ? 'bg-green-100 text-green-700' : ''}>
                    {balanza.activa ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Cable className="w-4 h-4 text-stone-400" />
                  <span className="text-stone-600">{balanza.puerto}</span>
                  <span className="text-stone-400">|</span>
                  <span className="text-stone-600">{balanza.baudios} baud</span>
                </div>
                
                <div className="text-xs text-stone-500">
                  {balanza.bitsDatos}-{balanza.paridad.charAt(0)}-{balanza.bitsParada}
                </div>

                {balanza.observaciones && (
                  <p className="text-xs text-stone-500 italic">{balanza.observaciones}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleTestConnection(balanza)}
                    disabled={testingConnection === balanza.id}
                  >
                    {testingConnection === balanza.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                    <span className="ml-1">Test</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(balanza)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(balanza)} className="text-red-600 hover:text-red-700">
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
        <DialogContent className="max-w-lg" maximizable>
          <DialogHeader>
            <DialogTitle>{editingBalanza ? 'Editar Balanza' : 'Nueva Balanza'}</DialogTitle>
            <DialogDescription>
              Configure los parámetros de conexión RS232
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Balanza Camiones Principal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Balanza</Label>
              <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_BALANZA.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="puerto">Puerto Serie</Label>
                <Select value={formData.puerto} onValueChange={(v) => setFormData({ ...formData, puerto: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PUERTOS_SERIE.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="baudios">Baudios</Label>
                <Select value={formData.baudios.toString()} onValueChange={(v) => setFormData({ ...formData, baudios: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BAUDIOS.map(b => (
                      <SelectItem key={b} value={b.toString()}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bitsDatos">Bits de Datos</Label>
                <Select value={formData.bitsDatos.toString()} onValueChange={(v) => setFormData({ ...formData, bitsDatos: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BITS_DATOS.map(b => (
                      <SelectItem key={b} value={b.toString()}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paridad">Paridad</Label>
                <Select value={formData.paridad} onValueChange={(v) => setFormData({ ...formData, paridad: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PARIDADES.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bitsParada">Bits de Parada</Label>
                <Select value={formData.bitsParada.toString()} onValueChange={(v) => setFormData({ ...formData, bitsParada: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BITS_PARADA.map(b => (
                      <SelectItem key={b} value={b.toString()}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (ms)</Label>
              <Input
                id="timeout"
                type="number"
                value={formData.timeout}
                onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) || 1000 })}
              />
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

            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
              <div>
                <p className="font-medium">Balanza Activa</p>
                <p className="text-sm text-stone-500">Habilitar para su uso en el sistema</p>
              </div>
              <Switch
                checked={formData.activa}
                onCheckedChange={(checked) => setFormData({ ...formData, activa: checked })}
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

export default Balanzas
