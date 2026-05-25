'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Package, Plus, Pencil, Trash2 } from 'lucide-react'

interface Subproducto {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  categoria?: string
  tipo?: string
  precioKg?: number
  costoProcesamiento?: number
  requiereTrazabilidad: boolean
  unidadMedida: string
  stockMinimo?: number
  activo: boolean
}

interface Props {
  operador: { id: string; nombre: string; nivel: string }
}

const CATEGORIAS = [
  'Menudencias',
  'Cueros',
  'Sebos',
  'Huesos',
  'Vísceras',
  'Subproductos Varios',
]

export function Subproductos({ operador }: Props) {
  const [subproductos, setSubproductos] = useState<Subproducto[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSubproducto, setEditingSubproducto] = useState<Subproducto | null>(null)
  const [formData, setFormData] = useState<Partial<Subproducto>>({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    tipo: '',
    precioKg: 0,
    costoProcesamiento: 0,
    requiereTrazabilidad: false,
    unidadMedida: 'KG',
    stockMinimo: 0,
    activo: true,
  })

  useEffect(() => {
    fetchSubproductos()
  }, [])

  const fetchSubproductos = async () => {
    try {
      const res = await fetch('/api/subproductos')
      if (res.ok) {
        const data = await res.json()
        setSubproductos(data)
      }
    } catch (error) {
      console.error('Error al cargar subproductos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = '/api/subproductos'
      const method = editingSubproducto ? 'PUT' : 'POST'
      const body = editingSubproducto
        ? { ...formData, id: editingSubproducto.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        fetchSubproductos()
        setDialogOpen(false)
        setEditingSubproducto(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error al guardar subproducto:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este subproducto?')) return

    try {
      const res = await fetch(`/api/subproductos?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchSubproductos()
      }
    } catch (error) {
      console.error('Error al eliminar subproducto:', error)
    }
  }

  const handleEdit = (subproducto: Subproducto) => {
    setEditingSubproducto(subproducto)
    setFormData(subproducto)
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      categoria: '',
      tipo: '',
      precioKg: 0,
      costoProcesamiento: 0,
      requiereTrazabilidad: false,
      unidadMedida: 'KG',
      stockMinimo: 0,
      activo: true,
    })
  }

  const handleNew = () => {
    setEditingSubproducto(null)
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
          <Package className="w-5 h-5" />
          Subproductos
        </CardTitle>
        <Button onClick={handleNew} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Subproducto
        </Button>
      </CardHeader>
      <CardContent>
        {subproductos.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            No hay subproductos configurados
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio/Kg</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subproductos.map((subproducto) => (
                <TableRow key={subproducto.id}>
                  <TableCell className="font-mono">{subproducto.codigo}</TableCell>
                  <TableCell className="font-medium">{subproducto.nombre}</TableCell>
                  <TableCell>{subproducto.categoria || '-'}</TableCell>
                  <TableCell>
                    {subproducto.precioKg ? `$${subproducto.precioKg.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      subproducto.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {subproducto.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(subproducto)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(subproducto.id)}>
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
        <DialogContent className="max-w-lg" maximizable>
          <DialogHeader>
            <DialogTitle>
              {editingSubproducto ? 'Editar Subproducto' : 'Nuevo Subproducto'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Código *</Label>
                <Input
                  value={formData.codigo || ''}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="SUB001"
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <Select
                  value={formData.categoria || ''}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Nombre *</Label>
              <Input
                value={formData.nombre || ''}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre del subproducto"
              />
            </div>

            <div>
              <Label>Descripción</Label>
              <Input
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Precio/Kg</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.precioKg || ''}
                  onChange={(e) => setFormData({ ...formData, precioKg: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Costo Procesamiento</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.costoProcesamiento || ''}
                  onChange={(e) => setFormData({ ...formData, costoProcesamiento: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Unidad de Medida</Label>
                <Select
                  value={formData.unidadMedida || 'KG'}
                  onValueChange={(value) => setFormData({ ...formData, unidadMedida: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KG">Kilogramos (KG)</SelectItem>
                    <SelectItem value="UN">Unidades (UN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Stock Mínimo</Label>
                <Input
                  type="number"
                  value={formData.stockMinimo || ''}
                  onChange={(e) => setFormData({ ...formData, stockMinimo: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.requiereTrazabilidad ?? false}
                  onCheckedChange={(checked) => setFormData({ ...formData, requiereTrazabilidad: checked })}
                />
                <Label className="font-normal">Requiere Trazabilidad</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.activo ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
                <Label className="font-normal">Activo</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formData.codigo || !formData.nombre}>
              {editingSubproducto ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default Subproductos
