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
import { Leaf, Plus, Pencil, Trash2 } from 'lucide-react'  // Updated: Farm not available

interface ProductorConsignatario {
  id: string
  nombre: string
  cuit?: string
  direccion?: string
  telefono?: string
  email?: string
  tipo: string
  numeroRenspa?: string
  numeroEstablecimiento?: string
  localidad?: string
  provincia?: string
  observaciones?: string
  activo: boolean
}

interface Props {
  operador: { id: string; nombre: string; nivel?: string }
}

const TIPOS = [
  { value: 'PRODUCTOR', label: 'Productor' },
  { value: 'CONSIGNATARIO', label: 'Consignatario' },
  { value: 'AMBOS', label: 'Ambos' },
]

export function Productores({ operador }: Props) {
  const [productores, setProductores] = useState<ProductorConsignatario[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProductor, setEditingProductor] = useState<ProductorConsignatario | null>(null)
  const [formData, setFormData] = useState<Partial<ProductorConsignatario>>({
    nombre: '',
    cuit: '',
    direccion: '',
    telefono: '',
    email: '',
    tipo: 'PRODUCTOR',
    numeroRenspa: '',
    numeroEstablecimiento: '',
    localidad: '',
    provincia: '',
    observaciones: '',
    activo: true,
  })

  useEffect(() => {
    fetchProductores()
  }, [])

  const fetchProductores = async () => {
    try {
      const res = await fetch('/api/productores')
      if (res.ok) {
        const data = await res.json()
        setProductores(data.success ? data.data : data)
      }
    } catch (error) {
      console.error('Error al cargar productores:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = '/api/productores'
      const method = editingProductor ? 'PUT' : 'POST'
      const body = editingProductor
        ? { ...formData, id: editingProductor.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        fetchProductores()
        setDialogOpen(false)
        setEditingProductor(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error al guardar productor:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este productor/consignatario?')) return

    try {
      const res = await fetch(`/api/productores?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchProductores()
      }
    } catch (error) {
      console.error('Error al eliminar productor:', error)
    }
  }

  const handleEdit = (productor: ProductorConsignatario) => {
    setEditingProductor(productor)
    setFormData(productor)
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      cuit: '',
      direccion: '',
      telefono: '',
      email: '',
      tipo: 'PRODUCTOR',
      numeroRenspa: '',
      numeroEstablecimiento: '',
      localidad: '',
      provincia: '',
      observaciones: '',
      activo: true,
    })
  }

  const handleNew = () => {
    setEditingProductor(null)
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
          <Leaf className="w-5 h-5" />
          Productores / Consignatarios
        </CardTitle>
        <Button onClick={handleNew} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nuevo
        </Button>
      </CardHeader>
      <CardContent>
        {productores.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            No hay productores/consignatarios registrados
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>CUIT</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>N° RENSPA</TableHead>
                <TableHead>Localidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productores.map((productor) => (
                <TableRow key={productor.id}>
                  <TableCell className="font-medium">{productor.nombre}</TableCell>
                  <TableCell>{productor.cuit || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      productor.tipo === 'PRODUCTOR' ? 'bg-blue-100 text-blue-800' :
                      productor.tipo === 'CONSIGNATARIO' ? 'bg-purple-100 text-purple-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {TIPOS.find(t => t.value === productor.tipo)?.label || productor.tipo}
                    </span>
                  </TableCell>
                  <TableCell>{productor.numeroRenspa || '-'}</TableCell>
                  <TableCell>{productor.localidad || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      productor.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {productor.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(productor)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(productor.id)}>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" maximizable>
          <DialogHeader>
            <DialogTitle>
              {editingProductor ? 'Editar' : 'Nuevo'} Productor/Consignatario
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={formData.nombre || ''}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CUIT</Label>
                <Input
                  value={formData.cuit || ''}
                  onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                  placeholder="00-00000000-0"
                />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select
                  value={formData.tipo || 'PRODUCTOR'}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-semibold">Datos RENSPA (Productores)</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>N° RENSPA</Label>
                <Input
                  value={formData.numeroRenspa || ''}
                  onChange={(e) => setFormData({ ...formData, numeroRenspa: e.target.value })}
                />
              </div>
              <div>
                <Label>N° Establecimiento</Label>
                <Input
                  value={formData.numeroEstablecimiento || ''}
                  onChange={(e) => setFormData({ ...formData, numeroEstablecimiento: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Localidad</Label>
                <Input
                  value={formData.localidad || ''}
                  onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                />
              </div>
              <div>
                <Label>Provincia</Label>
                <Input
                  value={formData.provincia || ''}
                  onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Dirección</Label>
              <Input
                value={formData.direccion || ''}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={formData.telefono || ''}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
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
              {editingProductor ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default Productores
