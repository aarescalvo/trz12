'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Tag, Edit, Plus, Save, X, Loader2, Search, Power, Trash2 } from 'lucide-react'

interface Operador { id: string; nombre: string; rol: string }

interface Rubro {
  id: string
  nombre: string
  descripcion?: string | null
  orden: number
  activo: boolean
}

export default function C2RubrosModule({ operador }: { operador: Operador }) {
  const [rubros, setRubros] = useState<Rubro[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [rubroEditando, setRubroEditando] = useState<Rubro | null>(null)

  // Filtros
  const [busqueda, setBusqueda] = useState('')

  // Form
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    orden: '0',
    activo: true
  })

  useEffect(() => {
    fetchRubros()
  }, [])

  const fetchRubros = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/c2-rubros')
      const data = await res.json()
      if (data.success) {
        setRubros(data.data || [])
      } else {
        toast.error('Error al cargar rubros')
      }
    } catch (error) {
      console.error('Error fetching rubros:', error)
      toast.error('Error al cargar rubros')
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total: rubros.length,
    activos: rubros.filter(r => r.activo).length,
    inactivos: rubros.filter(r => !r.activo).length,
  }

  const handleNuevo = () => {
    setRubroEditando(null)
    setFormData({
      nombre: '',
      descripcion: '',
      orden: '0',
      activo: true
    })
    setDialogOpen(true)
  }

  const handleEditar = (rubro: Rubro) => {
    setRubroEditando(rubro)
    setFormData({
      nombre: rubro.nombre,
      descripcion: rubro.descripcion || '',
      orden: rubro.orden.toString(),
      activo: rubro.activo
    })
    setDialogOpen(true)
  }

  const handleToggleEstado = async (rubro: Rubro) => {
    try {
      const res = await fetch('/api/c2-rubros', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rubro.id, activo: !rubro.activo })
      })

      const data = await res.json()

      if (data.success) {
        setRubros(rubros.map(r =>
          r.id === rubro.id ? { ...r, activo: !r.activo } : r
        ))
        toast.success(rubro.activo
          ? `Rubro "${rubro.nombre}" desactivado`
          : `Rubro "${rubro.nombre}" activado`
        )
      } else {
        toast.error(data.error || 'Error al actualizar estado')
      }
    } catch (error) {
      toast.error('Error al actualizar estado')
    }
  }

  const handleEliminar = async (rubro: Rubro) => {
    if (!confirm(`¿Está seguro de eliminar el rubro "${rubro.nombre}"?`)) return

    try {
      const res = await fetch(`/api/c2-rubros?id=${rubro.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        setRubros(rubros.filter(r => r.id !== rubro.id))
        toast.success('Rubro eliminado')
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleGuardar = async () => {
    if (!formData.nombre.trim()) {
      toast.error('Ingrese el nombre')
      return
    }

    setSaving(true)
    try {
      const payload = {
        id: rubroEditando?.id,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        orden: parseInt(formData.orden) || 0,
        activo: formData.activo,
      }

      const res = await fetch('/api/c2-rubros', {
        method: rubroEditando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.success) {
        toast.success(rubroEditando ? 'Rubro actualizado' : 'Rubro creado')
        setDialogOpen(false)
        fetchRubros()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar rubro')
    } finally {
      setSaving(false)
    }
  }

  // Filtrar rubros
  const rubrosFiltrados = rubros.filter(r => {
    if (busqueda) {
      const termino = busqueda.toLowerCase()
      return r.nombre.toLowerCase().includes(termino) ||
        (r.descripcion && r.descripcion.toLowerCase().includes(termino))
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
              Configuración de Rubros (C2)
            </h1>
            <p className="text-stone-500">Gestión de categorías de productos de desposte</p>
          </div>
          <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Rubro
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-stone-100 p-2 rounded-lg">
                  <Tag className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Total Rubros</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Tag className="w-5 h-5 text-green-600" />
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
                  <Tag className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Inactivos</p>
                  <p className="text-xl font-bold text-red-600">{stats.inactivos}</p>
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
                    placeholder="Nombre o descripción..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Rubros */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-600" />
              Rubros Configurados ({rubrosFiltrados.length})
            </CardTitle>
            <CardDescription>
              Listado de categorías de productos del Ciclo II
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                <p className="text-stone-400 mt-2">Cargando rubros...</p>
              </div>
            ) : rubrosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No se encontraron rubros</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-stone-50/50">
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Orden</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rubrosFiltrados.map((rubro) => (
                    <TableRow key={rubro.id} className={!rubro.activo ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{rubro.nombre}</TableCell>
                      <TableCell className="text-stone-500">{rubro.descripcion || '-'}</TableCell>
                      <TableCell className="text-center">{rubro.orden}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={
                          rubro.activo
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                        }>
                          {rubro.activo ? 'ACTIVO' : 'INACTIVO'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditar(rubro)} title="Editar">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleEstado(rubro)}
                            title={rubro.activo ? 'Desactivar' : 'Activar'}
                            className={rubro.activo ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEliminar(rubro)}
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

        {/* Dialog Nuevo/Editar Rubro */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md" maximizable>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-500" />
                {rubroEditando ? 'Editar Rubro' : 'Nuevo Rubro'}
              </DialogTitle>
              <DialogDescription>
                {rubroEditando
                  ? 'Modifique los datos del rubro'
                  : 'Complete los datos para crear un nuevo rubro'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Cortes Traseros"
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del rubro..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Orden</Label>
                <Input
                  type="number"
                  value={formData.orden}
                  onChange={(e) => setFormData({ ...formData, orden: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center justify-between">
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
