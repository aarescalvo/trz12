'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, Plus, Pencil, Trash2, Search, Loader2,
  Package, DollarSign, Save, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface TipoServicio {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  unidad: string
  seFactura: boolean
  incluidoEn?: string
  porcentajeIva: number
  orden: number
  activo: boolean
  _count?: {
    precios: number
    detallesFactura: number
  }
}

interface Props {
  operador?: { id: string; nombre: string; rol: string }
}

const UNIDADES = [
  { value: 'KG', label: 'Kilogramos (kg)' },
  { value: 'UN', label: 'Unidades' },
  { value: 'HORA', label: 'Horas' },
  { value: 'CORREL', label: 'Correlativo' },
]

export function TiposServicioConfig({ operador }: Props) {
  const [tipos, setTipos] = useState<TipoServicio[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedTipo, setSelectedTipo] = useState<TipoServicio | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    unidad: 'KG',
    seFactura: true,
    incluidoEn: '',
    porcentajeIva: 21,
    orden: 0,
    activo: true
  })

  useEffect(() => {
    fetchTipos()
  }, [])

  const fetchTipos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tipos-servicio')
      const data = await res.json()
      if (data.success) {
        setTipos(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar tipos de servicio')
    } finally {
      setLoading(false)
    }
  }

  const handleNuevo = () => {
    setSelectedTipo(null)
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      unidad: 'KG',
      seFactura: true,
      incluidoEn: '',
      porcentajeIva: 21,
      orden: tipos.length,
      activo: true
    })
    setDialogOpen(true)
  }

  const handleEditar = (tipo: TipoServicio) => {
    setSelectedTipo(tipo)
    setFormData({
      codigo: tipo.codigo,
      nombre: tipo.nombre,
      descripcion: tipo.descripcion || '',
      unidad: tipo.unidad,
      seFactura: tipo.seFactura,
      incluidoEn: tipo.incluidoEn || '',
      porcentajeIva: tipo.porcentajeIva,
      orden: tipo.orden,
      activo: tipo.activo
    })
    setDialogOpen(true)
  }

  const handleGuardar = async () => {
    if (!formData.codigo || !formData.nombre) {
      toast.error('Código y nombre son requeridos')
      return
    }

    setSaving(true)
    try {
      const url = '/api/tipos-servicio'
      const method = selectedTipo ? 'PUT' : 'POST'
      const body = selectedTipo 
        ? { id: selectedTipo.id, ...formData }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(selectedTipo ? 'Tipo de servicio actualizado' : 'Tipo de servicio creado')
        setDialogOpen(false)
        fetchTipos()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al guardar tipo de servicio')
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = async () => {
    if (!selectedTipo) return

    setSaving(true)
    try {
      const res = await fetch(`/api/tipos-servicio?id=${selectedTipo.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Tipo de servicio eliminado')
        setDeleteOpen(false)
        fetchTipos()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar tipo de servicio')
    } finally {
      setSaving(false)
    }
  }

  const tiposFiltrados = tipos.filter(t => 
    t.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-500" />
            Tipos de Servicio
          </h2>
          <p className="text-stone-500">Configuración de servicios facturables</p>
        </div>
        <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Servicio
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Buscar por código o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : tiposFiltrados.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No hay tipos de servicio configurados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Código</TableHead>
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Unidad</TableHead>
                    <TableHead className="font-semibold">% IVA</TableHead>
                    <TableHead className="font-semibold">Se Factura</TableHead>
                    <TableHead className="font-semibold">Precios</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiposFiltrados.map((tipo) => (
                    <TableRow key={tipo.id} className={!tipo.activo ? 'bg-stone-50 opacity-60' : ''}>
                      <TableCell className="font-mono font-medium">{tipo.codigo}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tipo.nombre}</p>
                          {tipo.descripcion && (
                            <p className="text-xs text-stone-500">{tipo.descripcion}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tipo.unidad}</Badge>
                      </TableCell>
                      <TableCell>{tipo.porcentajeIva}%</TableCell>
                      <TableCell>
                        {tipo.seFactura ? (
                          <Badge className="bg-emerald-100 text-emerald-700">Sí</Badge>
                        ) : (
                          <Badge className="bg-stone-100 text-stone-600">Incluido</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tipo._count?.precios || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        {tipo.activo ? (
                          <Badge className="bg-emerald-100 text-emerald-700">Activo</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditar(tipo)}
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedTipo(tipo)
                              setDeleteOpen(true)
                            }}
                            title="Eliminar"
                            className="text-red-500 hover:text-red-600"
                          >
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

      {/* Dialog Nuevo/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" maximizable>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-600" />
              {selectedTipo ? 'Editar Tipo de Servicio' : 'Nuevo Tipo de Servicio'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  placeholder="FAENA, EMBOLSADO, etc."
                  disabled={!!selectedTipo}
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre del servicio"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción opcional"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unidad de Medida</Label>
                <select
                  value={formData.unidad}
                  onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {UNIDADES.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>% IVA</Label>
                <select
                  value={formData.porcentajeIva}
                  onChange={(e) => setFormData({ ...formData, porcentajeIva: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value={10.5}>10.5%</option>
                  <option value={21}>21%</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Se Factura</Label>
                <p className="text-xs text-stone-500">Si está incluido en otro servicio, desmarcar</p>
              </div>
              <Switch
                checked={formData.seFactura}
                onCheckedChange={(checked) => setFormData({ ...formData, seFactura: checked })}
              />
            </div>

            {!formData.seFactura && (
              <div className="space-y-2">
                <Label>Incluido en</Label>
                <Input
                  value={formData.incluidoEn}
                  onChange={(e) => setFormData({ ...formData, incluidoEn: e.target.value })}
                  placeholder="Código del servicio que lo incluye"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Orden</Label>
                <Input
                  type="number"
                  value={formData.orden}
                  onChange={(e) => setFormData({ ...formData, orden: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center justify-between pt-6">
                <Label>Activo</Label>
                <Switch
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleGuardar} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm" maximizable>
          <DialogHeader>
            <DialogTitle className="text-red-600">Eliminar Tipo de Servicio</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-500">
            ¿Está seguro que desea eliminar "{selectedTipo?.nombre}"?
            {selectedTipo?._count?.precios && selectedTipo._count.precios > 0 && (
              <span className="block mt-2 text-amber-600">
                Tiene {selectedTipo._count.precios} precios asociados. Se desactivará en lugar de eliminar.
              </span>
            )}
          </p>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEliminar} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TiposServicioConfig
