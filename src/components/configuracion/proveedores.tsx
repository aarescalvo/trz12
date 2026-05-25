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
import { Truck, Plus, Pencil, Trash2 } from 'lucide-react'

interface Proveedor {
  id: string
  nombre: string
  cuit?: string
  direccion?: string
  telefono?: string
  email?: string
  tipo?: string
  contacto?: string
  observaciones?: string
  activo: boolean
}

interface Props {
  operador: { id: string; nombre: string; nivel: string }
}

// Valores coinciden con enum TipoProveedor del schema Prisma (UPPERCASE)
const TIPOS_PROVEEDOR = [
  { value: 'INSUMOS', label: 'Insumos' },
  { value: 'SERVICIOS', label: 'Servicios' },
  { value: 'EQUIPOS', label: 'Equipos' },
  { value: 'EMPAQUES', label: 'Empaques' },
  { value: 'LIMPIEZA', label: 'Limpieza' },
  { value: 'VETERINARIOS', label: 'Veterinarios' },
  { value: 'OTROS', label: 'Otros' },
]

export function Proveedores({ operador }: Props) {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null)
  const [formData, setFormData] = useState<Partial<Proveedor>>({
    nombre: '',
    cuit: '',
    direccion: '',
    telefono: '',
    email: '',
    tipo: '',
    contacto: '',
    observaciones: '',
    activo: true,
  })

  useEffect(() => {
    fetchProveedores()
  }, [])

  const fetchProveedores = async () => {
    try {
      const res = await fetch('/api/proveedores')
      if (res.ok) {
        const data = await res.json()
        setProveedores(data.success ? data.data : data)
      }
    } catch (error) {
      console.error('Error al cargar proveedores:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = '/api/proveedores'
      const method = editingProveedor ? 'PUT' : 'POST'
      const body = editingProveedor
        ? { ...formData, id: editingProveedor.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        fetchProveedores()
        setDialogOpen(false)
        setEditingProveedor(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error al guardar proveedor:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este proveedor?')) return

    try {
      const res = await fetch(`/api/proveedores?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchProveedores()
      }
    } catch (error) {
      console.error('Error al eliminar proveedor:', error)
    }
  }

  const handleEdit = (proveedor: Proveedor) => {
    setEditingProveedor(proveedor)
    setFormData(proveedor)
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      cuit: '',
      direccion: '',
      telefono: '',
      email: '',
      tipo: '',
      contacto: '',
      observaciones: '',
      activo: true,
    })
  }

  const handleNew = () => {
    setEditingProveedor(null)
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
          <Truck className="w-5 h-5" />
          Proveedores
        </CardTitle>
        <Button onClick={handleNew} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Proveedor
        </Button>
      </CardHeader>
      <CardContent>
        {proveedores.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            No hay proveedores registrados
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>CUIT</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proveedores.map((proveedor) => (
                <TableRow key={proveedor.id}>
                  <TableCell className="font-medium">{proveedor.nombre}</TableCell>
                  <TableCell>{proveedor.cuit || '-'}</TableCell>
                  <TableCell>{TIPOS_PROVEEDOR.find(t => t.value === proveedor.tipo)?.label || '-'}</TableCell>
                  <TableCell>{proveedor.contacto || '-'}</TableCell>
                  <TableCell>{proveedor.telefono || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      proveedor.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {proveedor.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(proveedor)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(proveedor.id)}>
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
              {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
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
                <Label>Tipo</Label>
                <Select
                  value={formData.tipo || ''}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_PROVEEDOR.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            <div>
              <Label>Contacto</Label>
              <Input
                value={formData.contacto || ''}
                onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                placeholder="Nombre de persona de contacto"
              />
            </div>

            <div>
              <Label>Observaciones</Label>
              <Input
                value={formData.observaciones || ''}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
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
              {editingProveedor ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default Proveedores
