'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tags, Plus, Pencil, Trash2 } from 'lucide-react'

interface CategoriaInsumo {
  id: string
  nombre: string
  descripcion?: string
  activo: boolean
}

interface Props {
  operador: { id: string; nombre: string; nivel: string }
}

export function CategoriasInsumos({ operador }: Props) {
  const [categorias, setCategorias] = useState<CategoriaInsumo[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<CategoriaInsumo | null>(null)
  const [formData, setFormData] = useState<Partial<CategoriaInsumo>>({
    nombre: '',
    descripcion: '',
    activo: true,
  })

  useEffect(() => {
    fetchCategorias()
  }, [])

  const fetchCategorias = async () => {
    try {
      const res = await fetch('/api/categorias-insumos')
      if (res.ok) {
        const data = await res.json()
        setCategorias(data)
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = '/api/categorias-insumos'
      const method = editingCategoria ? 'PUT' : 'POST'
      const body = editingCategoria
        ? { ...formData, id: editingCategoria.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        fetchCategorias()
        setDialogOpen(false)
        setEditingCategoria(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error al guardar categoría:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return

    try {
      const res = await fetch(`/api/categorias-insumos?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchCategorias()
      }
    } catch (error) {
      console.error('Error al eliminar categoría:', error)
    }
  }

  const handleEdit = (categoria: CategoriaInsumo) => {
    setEditingCategoria(categoria)
    setFormData(categoria)
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      activo: true,
    })
  }

  const handleNew = () => {
    setEditingCategoria(null)
    resetForm()
    setDialogOpen(true)
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Tags className="w-5 h-5" />
          Categorías de Insumos
        </CardTitle>
        <Button onClick={handleNew} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nueva Categoría
        </Button>
      </CardHeader>
      <CardContent>
        {categorias.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            No hay categorías registradas
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.map((categoria) => (
                <TableRow key={categoria.id}>
                  <TableCell className="font-medium">{categoria.nombre}</TableCell>
                  <TableCell>{categoria.descripcion || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      categoria.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {categoria.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(categoria)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(categoria.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" maximizable>
          <DialogHeader>
            <DialogTitle>
              {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={formData.nombre || ''}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre de la categoría"
              />
            </div>

            <div>
              <Label>Descripción</Label>
              <Textarea
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción opcional"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.activo ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
              <Label>Activo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formData.nombre}>
              {editingCategoria ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default CategoriasInsumos
