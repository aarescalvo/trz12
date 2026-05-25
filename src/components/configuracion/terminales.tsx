'use client'

import { useState, useEffect } from 'react'
import { Monitor, Plus, Edit2, Trash2, Save, X, RefreshCw, Scale, Printer, MapPin } from 'lucide-react'
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
  activa: boolean
}

interface Impresora {
  id: string
  nombre: string
  tipo: string
  marca: string
  activa: boolean
}

interface Terminal {
  id: string
  nombre: string
  ubicacion: string
  balanzaId: string | null
  impresoraId: string | null
  activa: boolean
  ultimaActividad: string | null
  observaciones: string | null
  Balanza: Balanza | null
  Impresora: Impresora | null
}

interface Operador {
  id: string
  nombre: string
  usuario?: string
  rol?: string
}

const UBICACIONES = [
  { value: 'BALANZA_CAMION', label: 'Balanza de Camión' },
  { value: 'HACIENDA', label: 'Hacienda' },
  { value: 'ROMANEO', label: 'Romaneo' },
  { value: 'CUARTEO', label: 'Cuarteo' },
  { value: 'EMPAQUE', label: 'Empaque' },
  { value: 'DESPOSTADA', label: 'Despostada' }
]

export function Terminales({ operador }: { operador: Operador }) {
  const [terminales, setTerminales] = useState<Terminal[]>([])
  const [balanzas, setBalanzas] = useState<Balanza[]>([])
  const [impresoras, setImpresoras] = useState<Impresora[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    ubicacion: 'BALANZA_CAMION',
    balanzaId: 'all',
    impresoraId: 'all',
    activa: true,
    observaciones: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [termRes, balRes, impRes] = await Promise.all([
        fetch('/api/terminales'),
        fetch('/api/balanzas'),
        fetch('/api/impresoras')
      ])

      const [termData, balData, impData] = await Promise.all([
        termRes.json(),
        balRes.json(),
        impRes.json()
      ])

      if (termData.success) setTerminales(termData.data)
      if (balData.success) setBalanzas(balData.data.filter((b: Balanza) => b.activa))
      if (impData.success) setImpresoras(impData.data.filter((i: Impresora) => i.activa))
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      ubicacion: 'BALANZA_CAMION',
      balanzaId: 'all',
      impresoraId: 'all',
      activa: true,
      observaciones: ''
    })
    setEditingTerminal(null)
  }

  const openNewDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (terminal: Terminal) => {
    setEditingTerminal(terminal)
    setFormData({
      nombre: terminal.nombre,
      ubicacion: terminal.ubicacion,
      balanzaId: terminal.balanzaId || 'all',
      impresoraId: terminal.impresoraId || 'all',
      activa: terminal.activa,
      observaciones: terminal.observaciones || ''
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
      const url = '/api/terminales'
      const method = editingTerminal ? 'PUT' : 'POST'
      const cleanedData = {
        ...formData,
        balanzaId: formData.balanzaId === 'all' ? null : formData.balanzaId,
        impresoraId: formData.impresoraId === 'all' ? null : formData.impresoraId,
      }
      const body = editingTerminal 
        ? { ...cleanedData, id: editingTerminal.id }
        : cleanedData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editingTerminal ? 'Terminal actualizada' : 'Terminal creada')
        fetchData()
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

  const handleDelete = async (terminal: Terminal) => {
    if (!confirm(`¿Eliminar la terminal "${terminal.nombre}"?`)) return

    try {
      const res = await fetch(`/api/terminales?id=${terminal.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Terminal eliminada')
        fetchData()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const getUbicacionLabel = (ubicacion: string) => {
    return UBICACIONES.find(u => u.value === ubicacion)?.label || ubicacion
  }

  const getBalanzasPorUbicacion = (ubicacion: string) => {
    // Mapear ubicaciones a tipos de balanza
    const mapaTipos: Record<string, string> = {
      'BALANZA_CAMION': 'CAMIONES',
      'HACIENDA': 'HACIENDA_INDIVIDUAL',
      'ROMANEO': 'MEDIA_RES',
      'CUARTEO': 'CUARTEO',
      'EMPAQUE': 'EMPAQUE',
      'DESPOSTADA': 'CUARTEO'
    }
    
    const tipoNecesario = mapaTipos[ubicacion]
    return balanzas.filter(b => b.tipo === tipoNecesario)
  }

  const getImpresorasPorUbicacion = (ubicacion: string) => {
    // Mapear ubicaciones a tipos de impresora
    const mapaTipos: Record<string, string[]> = {
      'HACIENDA': ['ANIMAL'],
      'ROMANEO': ['MEDIA_RES'],
      'EMPAQUE': ['CAJA']
    }
    
    const tiposNecesarios = mapaTipos[ubicacion]
    if (!tiposNecesarios) return impresoras
    return impresoras.filter(i => tiposNecesarios.includes(i.tipo))
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
          <p className="text-stone-500">Configure los puestos de trabajo del sistema</p>
        </div>
        <Button onClick={openNewDialog} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Terminal
        </Button>
      </div>

      {/* Lista de terminales */}
      {terminales.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-8 text-center">
            <Monitor className="w-16 h-16 mx-auto mb-4 text-stone-300" />
            <p className="text-stone-500">No hay terminales configuradas</p>
            <Button onClick={openNewDialog} variant="outline" className="mt-4">
              Agregar primera terminal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {terminales.map(terminal => (
            <Card key={terminal.id} className={`border-0 shadow-md ${!terminal.activa ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-amber-500" />
                      {terminal.nombre}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {getUbicacionLabel(terminal.ubicacion)}
                    </CardDescription>
                  </div>
                  <Badge variant={terminal.activa ? 'default' : 'secondary'} className={terminal.activa ? 'bg-green-100 text-green-700' : ''}>
                    {terminal.activa ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Equipos asignados */}
                <div className="space-y-2">
                  {terminal.Balanza ? (
                    <div className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded">
                      <Scale className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-700">{terminal.Balanza.nombre}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm bg-stone-50 p-2 rounded text-stone-400">
                      <Scale className="w-4 h-4" />
                      <span>Sin balanza asignada</span>
                    </div>
                  )}

                  {terminal.Impresora ? (
                    <div className="flex items-center gap-2 text-sm bg-purple-50 p-2 rounded">
                      <Printer className="w-4 h-4 text-purple-600" />
                      <span className="text-purple-700">{terminal.Impresora.nombre}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm bg-stone-50 p-2 rounded text-stone-400">
                      <Printer className="w-4 h-4" />
                      <span>Sin impresora asignada</span>
                    </div>
                  )}
                </div>

                {terminal.observaciones && (
                  <p className="text-xs text-stone-500 italic">{terminal.observaciones}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(terminal)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(terminal)} className="text-red-600 hover:text-red-700">
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
            <DialogTitle>{editingTerminal ? 'Editar Terminal' : 'Nueva Terminal'}</DialogTitle>
            <DialogDescription>
              Configure el puesto de trabajo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Terminal Romaneo 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Select value={formData.ubicacion} onValueChange={(v) => setFormData({ ...formData, ubicacion: v, balanzaId: '', impresoraId: '' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UBICACIONES.map(u => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="balanzaId">Balanza Asignada</Label>
                <Select 
                  value={formData.balanzaId} 
                  onValueChange={(v) => setFormData({ ...formData, balanzaId: v })}
                  disabled={getBalanzasPorUbicacion(formData.ubicacion).length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Sin asignar</SelectItem>
                    {getBalanzasPorUbicacion(formData.ubicacion).map((b: Balanza) => (
                      <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                    ))}
                    {/* Si no hay del tipo correcto, mostrar todas */}
                    {getBalanzasPorUbicacion(formData.ubicacion).length === 0 && balanzas.map((b: Balanza) => (
                      <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getBalanzasPorUbicacion(formData.ubicacion).length === 0 && (
                  <p className="text-xs text-amber-600">No hay balanzas del tipo correcto configuradas</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="impresoraId">Impresora Asignada</Label>
                <Select 
                  value={formData.impresoraId} 
                  onValueChange={(v) => setFormData({ ...formData, impresoraId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Sin asignar</SelectItem>
                    {(getImpresorasPorUbicacion(formData.ubicacion).length > 0 ? getImpresorasPorUbicacion(formData.ubicacion) : impresoras).map((i: Impresora) => (
                      <SelectItem key={i.id} value={i.id}>{i.nombre}</SelectItem>
                    ))}
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

            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
              <div>
                <p className="font-medium">Terminal Activa</p>
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

export default Terminales
