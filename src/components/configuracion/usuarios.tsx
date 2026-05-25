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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users, Plus, Pencil, Trash2 } from 'lucide-react'

interface Usuario {
  id: string
  nombre: string
  cuit?: string
  direccion?: string
  telefono?: string
  email?: string
  esConsignatario: boolean
  esProveedor: boolean
  observaciones?: string
  activo: boolean
}

interface Props {
  operador: { id: string; nombre: string; nivel: string }
}

export function Usuarios({ operador }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [formData, setFormData] = useState<Partial<Usuario>>({
    nombre: '',
    cuit: '',
    direccion: '',
    telefono: '',
    email: '',
    esConsignatario: false,
    esProveedor: false,
    observaciones: '',
    activo: true,
  })

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async () => {
    try {
      const res = await fetch('/api/usuarios')
      if (res.ok) {
        const data = await res.json()
        setUsuarios(data)
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = '/api/usuarios'
      const method = editingUsuario ? 'PUT' : 'POST'
      const body = editingUsuario
        ? { ...formData, id: editingUsuario.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        fetchUsuarios()
        setDialogOpen(false)
        setEditingUsuario(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error al guardar usuario:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return

    try {
      const res = await fetch(`/api/usuarios?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchUsuarios()
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error)
    }
  }

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario)
    setFormData(usuario)
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      cuit: '',
      direccion: '',
      telefono: '',
      email: '',
      esConsignatario: false,
      esProveedor: false,
      observaciones: '',
      activo: true,
    })
  }

  const handleNew = () => {
    setEditingUsuario(null)
    resetForm()
    setDialogOpen(true)
  }

  const getTipos = (u: Usuario) => {
    const tipos: string[] = []
    if (u.esConsignatario) tipos.push('Consignat.')
    if (u.esProveedor) tipos.push('Proveedor')
    return tipos.join(', ') || '-'
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Usuarios
        </CardTitle>
        <Button onClick={handleNew} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Usuario
        </Button>
      </CardHeader>
      <CardContent>
        {usuarios.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            No hay usuarios registrados
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>CUIT</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Tipos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">{usuario.nombre}</TableCell>
                  <TableCell>{usuario.cuit || '-'}</TableCell>
                  <TableCell>{usuario.telefono || '-'}</TableCell>
                  <TableCell>
                    <span className="text-xs">{getTipos(usuario)}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      usuario.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(usuario)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(usuario.id)}>
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
              {editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={formData.nombre || ''}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre del usuario"
              />
            </div>

            <div>
              <Label>CUIT</Label>
              <Input
                value={formData.cuit || ''}
                onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                placeholder="00-00000000-0"
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
              <Label>Dirección</Label>
              <Input
                value={formData.direccion || ''}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-semibold">Tipos de Usuario</Label>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.esConsignatario ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, esConsignatario: checked })}
                  />
                  <Label className="font-normal">Consignatario</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.esProveedor ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, esProveedor: checked })}
                  />
                  <Label className="font-normal">Proveedor</Label>
                </div>
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
              {editingUsuario ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default Usuarios
