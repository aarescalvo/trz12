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
import { Scissors, Edit, Plus, Save, X, Loader2, Search, Power, Trash2 } from 'lucide-react'

interface Operador { id: string; nombre: string; rol: string }

interface TipoCuarto {
  id: string
  nombre: string
  codigo: string
  descripcion?: string | null
  orden: number
  activo: boolean
}

export default function C2TiposCuartoModule({ operador }: { operador: Operador }) {
  const [tipos, setTipos] = useState<TipoCuarto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tipoEditando, setTipoEditando] = useState<TipoCuarto | null>(null)

  // Filtros
  const [busqueda, setBusqueda] = useState('')

  // Form
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    orden: '0',
    activo: true
  })

  useEffect(() => {
    fetchTipos()
  }, [])

  const fetchTipos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/c2-tipos-cuarto')
      const data = await res.json()
      if (data.success) {
        setTipos(data.data || [])
      } else {
        toast.error('Error al cargar tipos de cuarto')
      }
    } catch (error) {
      console.error('Error fetching tipos de cuarto:', error)
      toast.error('Error al cargar tipos de cuarto')
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total: tipos.length,
    activos: tipos.filter(t => t.activo).length,
    inactivos: tipos.filter(t => !t.activo).length,
  }

  const handleNuevo = () => {
    setTipoEditando(null)
    setFormData({
      nombre: '',
      codigo: '',
      descripcion: '',
      orden: '0',
      activo: true
    })
    setDialogOpen(true)
  }

  const handleEditar = (tipo: TipoCuarto) => {
    setTipoEditando(tipo)
    setFormData({
      nombre: tipo.nombre,
      codigo: tipo.codigo,
      descripcion: tipo.descripcion || '',
      orden: tipo.orden.toString(),
      activo: tipo.activo
    })
    setDialogOpen(true)
  }

  const handleToggleEstado = async (tipo: TipoCuarto) => {
    try {
      const res = await fetch('/api/c2-tipos-cuarto', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tipo.id, activo: !tipo.activo })
      })

      const data = await res.json()

      if (data.success) {
        setTipos(tipos.map(t =>
          t.id === tipo.id ? { ...t, activo: !t.activo } : t
        ))
        toast.success(tipo.activo
          ? `Tipo de cuarto "${tipo.nombre}" desactivado`
          : `Tipo de cuarto "${tipo.nombre}" activado`
        )
      } else {
        toast.error(data.error || 'Error al actualizar estado')
      }
    } catch (error) {
      toast.error('Error al actualizar estado')
    }
  }

  const handleEliminar = async (tipo: TipoCuarto) => {
    if (!confirm(`¿Está seguro de eliminar el tipo de cuarto "${tipo.nombre}"?`)) return

    try {
      const res = await fetch(`/api/c2-tipos-cuarto?id=${tipo.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        setTipos(tipos.filter(t => t.id !== tipo.id))
        toast.success('Tipo de cuarto eliminado')
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
    if (!formData.codigo.trim()) {
      toast.error('Ingrese el código')
      return
    }

    setSaving(true)
    try {
      const payload = {
        id: tipoEditando?.id,
        nombre: formData.nombre.trim(),
        codigo: formData.codigo.trim().toUpperCase(),
        descripcion: formData.descripcion.trim() || null,
        orden: parseInt(formData.orden) || 0,
        activo: formData.activo,
      }

      const res = await fetch('/api/c2-tipos-cuarto', {
        method: tipoEditando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.success) {
        toast.success(tipoEditando ? 'Tipo de cuarto actualizado' : 'Tipo de cuarto creado')
        setDialogOpen(false)
        fetchTipos()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar tipo de cuarto')
    } finally {
      setSaving(false)
    }
  }

  // Filtrar tipos de cuarto
  const tiposFiltrados = tipos.filter(t => {
    if (busqueda) {
      const termino = busqueda.toLowerCase()
      return t.nombre.toLowerCase().includes(termino) ||
        t.codigo.toLowerCase().includes(termino) ||
        (t.descripcion && t.descripcion.toLowerCase().includes(termino))
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
              <Scissors className="w-8 h-8 text-amber-500" />
              Configuración de Tipos de Cuarto (C2)
            </h1>
            <p className="text-stone-500">Gestión de tipos de cuarto para cuarteo y desposte</p>
          </div>
          <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Tipo
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-stone-100 p-2 rounded-lg">
                  <Scissors className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Total Tipos</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Scissors className="w-5 h-5 text-green-600" />
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
                  <Scissors className="w-5 h-5 text-red-600" />
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
                    placeholder="Nombre, código o descripción..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Tipos de Cuarto */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Scissors className="w-5 h-5 text-amber-600" />
              Tipos de Cuarto Configurados ({tiposFiltrados.length})
            </CardTitle>
            <CardDescription>
              Listado de tipos de cuarto del Ciclo II
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                <p className="text-stone-400 mt-2">Cargando tipos de cuarto...</p>
              </div>
            ) : tiposFiltrados.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <Scissors className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No se encontraron tipos de cuarto</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-stone-50/50">
                    <TableHead>Nombre</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Orden</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiposFiltrados.map((tipo) => (
                    <TableRow key={tipo.id} className={!tipo.activo ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{tipo.nombre}</TableCell>
                      <TableCell className="font-mono text-sm">{tipo.codigo}</TableCell>
                      <TableCell className="text-stone-500">{tipo.descripcion || '-'}</TableCell>
                      <TableCell className="text-center">{tipo.orden}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={
                          tipo.activo
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                        }>
                          {tipo.activo ? 'ACTIVO' : 'INACTIVO'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditar(tipo)} title="Editar">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleEstado(tipo)}
                            title={tipo.activo ? 'Desactivar' : 'Activar'}
                            className={tipo.activo ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEliminar(tipo)}
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

        {/* Dialog Nuevo/Editar Tipo de Cuarto */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md" maximizable>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-amber-500" />
                {tipoEditando ? 'Editar Tipo de Cuarto' : 'Nuevo Tipo de Cuarto'}
              </DialogTitle>
              <DialogDescription>
                {tipoEditando
                  ? 'Modifique los datos del tipo de cuarto'
                  : 'Complete los datos para crear un nuevo tipo de cuarto'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Delantero"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase().replace(/\s/g, '') })}
                    placeholder="DEL"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del tipo de cuarto..."
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
