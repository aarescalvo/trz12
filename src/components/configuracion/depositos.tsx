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
import { Warehouse, Plus, Pencil, Trash2 } from 'lucide-react'

interface Deposito {
  id: string
  nombre: string
  codigo?: string
  ubicacion?: string
  responsable?: string
  tipo?: string
  capacidad?: number
  observaciones?: string
  activo: boolean
}

interface Props {
  operador: { id: string; nombre: string; nivel: string }
}

const TIPOS_DEPOSITO = [
  'Almacén General',
  'Depósito de Insumos',
  'Cámara Frigorífica',
  'Depósito de Seguridad',
  'Almacén Temporal',
  'Otro',
]

export function Depositos({ operador }: Props) {
  const [depositos, setDepositos] = useState<Deposito[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDeposito, setEditingDeposito] = useState<Deposito | null>(null)
  const [formData, setFormData] = useState<Partial<Deposito>>({
    nombre: '',
    codigo: '',
    ubicacion: '',
    responsable: '',
    tipo: '',
    capacidad: undefined,
    observaciones: '',
    activo: true,
  })

  useEffect(() => {
    fetchDepositos()
  }, [])

  const fetchDepositos = async () => {
    try {
      const res = await fetch('/api/depositos')
      if (res.ok) {
        const data = await res.json()
        setDepositos(data)
      }
    } catch (error) {
      console.error('Error al cargar depósitos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = '/api/depositos'
      const method = editingDeposito ? 'PUT' : 'POST'
      const body = editingDeposito
        ? { ...formData, id: editingDeposito.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        fetchDepositos()
        setDialogOpen(false)
        setEditingDeposito(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error al guardar depósito:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este depósito?')) return

    try {
      const res = await fetch(`/api/depositos?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchDepositos()
      }
    } catch (error) {
      console.error('Error al eliminar depósito:', error)
    }
  }

  const handleEdit = (deposito: Deposito) => {
    setEditingDeposito(deposito)
    setFormData(deposito)
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      codigo: '',
      ubicacion: '',
      responsable: '',
      tipo: '',
      capacidad: undefined,
      observaciones: '',
      activo: true,
    })
  }

  const handleNew = () => {
    setEditingDeposito(null)
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
          <Warehouse className="w-5 h-5" />
          Depósitos / Almacenes
        </CardTitle>
        <Button onClick={handleNew} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Depósito
        </Button>
      </CardHeader>
      <CardContent>
        {depositos.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            No hay depósitos registrados
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Capacidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {depositos.map((deposito) => (
                <TableRow key={deposito.id}>
                  <TableCell className="font-mono">{deposito.codigo || '-'}</TableCell>
                  <TableCell className="font-medium">{deposito.nombre}</TableCell>
                  <TableCell>{deposito.ubicacion || '-'}</TableCell>
                  <TableCell>{deposito.tipo || '-'}</TableCell>
                  <TableCell>{deposito.responsable || '-'}</TableCell>
                  <TableCell>{deposito.capacidad ? `${deposito.capacidad} m³` : '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      deposito.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {deposito.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(deposito)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(deposito.id)}>
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
              {editingDeposito ? 'Editar Depósito' : 'Nuevo Depósito'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Código</Label>
                <Input
                  value={formData.codigo || ''}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Código interno"
                />
              </div>
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre || ''}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre del depósito"
                />
              </div>
            </div>

            <div>
              <Label>Ubicación</Label>
              <Input
                value={formData.ubicacion || ''}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                placeholder="Dirección o referencia"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    {TIPOS_DEPOSITO.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Capacidad (m³)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.capacidad ?? ''}
                  onChange={(e) => setFormData({ ...formData, capacidad: parseFloat(e.target.value) || undefined })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label>Responsable</Label>
              <Input
                value={formData.responsable || ''}
                onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                placeholder="Persona encargada"
              />
            </div>

            <div>
              <Label>Observaciones</Label>
              <Textarea
                value={formData.observaciones || ''}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas adicionales"
                rows={2}
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
              {editingDeposito ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default Depositos
