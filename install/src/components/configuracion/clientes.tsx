'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Edit, Trash2, Save, X, AlertTriangle, Phone, MapPin, Mail, UserCheck, Beef } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface ClienteItem {
  id: string
  nombre: string
  cuit?: string
  direccion?: string
  telefono?: string
  email?: string
  esProductor: boolean
  esUsuarioFaena: boolean
}

interface Operador {
  id: string
  nombre: string
  nivel: string
}

export function Clientes({ operador }: { operador: Operador }) {
  const [clientes, setClientes] = useState<ClienteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editando, setEditando] = useState<ClienteItem | null>(null)
  const [activeTab, setActiveTab] = useState('todos')
  
  const [formData, setFormData] = useState({
    nombre: '',
    cuit: '',
    direccion: '',
    telefono: '',
    email: '',
    esProductor: false,
    esUsuarioFaena: false
  })

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    try {
      const res = await fetch('/api/clientes')
      const data = await res.json()
      if (data.success) {
        setClientes(data.data)
      }
    } catch (error) {
      console.error('Error fetching clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNuevo = (tipo?: 'productor' | 'usuarioFaena') => {
    setEditando(null)
    setFormData({ 
      nombre: '', 
      cuit: '', 
      direccion: '', 
      telefono: '', 
      email: '',
      esProductor: tipo === 'productor',
      esUsuarioFaena: tipo === 'usuarioFaena'
    })
    setDialogOpen(true)
  }

  const handleEditar = (c: ClienteItem) => {
    setEditando(c)
    setFormData({
      nombre: c.nombre,
      cuit: c.cuit || '',
      direccion: c.direccion || '',
      telefono: c.telefono || '',
      email: c.email || '',
      esProductor: c.esProductor,
      esUsuarioFaena: c.esUsuarioFaena
    })
    setDialogOpen(true)
  }

  const handleEliminar = (c: ClienteItem) => {
    setEditando(c)
    setDeleteOpen(true)
  }

  const handleGuardar = async () => {
    if (!formData.nombre) {
      toast.error('Ingrese el nombre')
      return
    }

    if (!formData.esProductor && !formData.esUsuarioFaena) {
      toast.error('Seleccione al menos un tipo: Productor o Usuario de Faena')
      return
    }

    setSaving(true)
    try {
      const url = '/api/clientes'
      const method = editando ? 'PUT' : 'POST'
      const body = editando ? { ...formData, id: editando.id } : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editando ? 'Cliente actualizado' : 'Cliente creado')
        setDialogOpen(false)
        fetchClientes()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmarEliminar = async () => {
    if (!editando) return

    setSaving(true)
    try {
      const res = await fetch(`/api/clientes?id=${editando.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Cliente eliminado')
        setDeleteOpen(false)
        fetchClientes()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const clientesFiltrados = clientes.filter(c => {
    if (activeTab === 'todos') return true
    if (activeTab === 'productores') return c.esProductor
    if (activeTab === 'usuarios') return c.esUsuarioFaena
    return true
  })

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                Gestión de Productores y Usuarios de Faena
              </CardTitle>
              <CardDescription>
                Proveedores de hacienda y usuarios del servicio de faena
              </CardDescription>
            </div>
            <Button onClick={() => handleNuevo()} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Tabs de filtro */}
          <div className="border-b px-4 pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="todos">Todos ({clientes.length})</TabsTrigger>
                <TabsTrigger value="productores">
                  <Beef className="w-4 h-4 mr-1" />
                  Productores ({clientes.filter(c => c.esProductor).length})
                </TabsTrigger>
                <TabsTrigger value="usuarios">
                  <UserCheck className="w-4 h-4 mr-1" />
                  Usuarios Faena ({clientes.filter(c => c.esUsuarioFaena).length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <Users className="w-8 h-8 animate-pulse mx-auto text-amber-500" />
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay clientes registrados en esta categoría</p>
              <Button onClick={() => handleNuevo()} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Cliente
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>CUIT</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesFiltrados.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nombre}</TableCell>
                    <TableCell className="font-mono">{c.cuit || '-'}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {c.telefono && <div>{c.telefono}</div>}
                        {c.email && <div className="text-stone-500">{c.email}</div>}
                        {!c.telefono && !c.email && '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.esProductor && (
                          <Badge className="bg-green-100 text-green-700">
                            <Beef className="w-3 h-3 mr-1" />
                            Productor
                          </Badge>
                        )}
                        {c.esUsuarioFaena && (
                          <Badge className="bg-blue-100 text-blue-700">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Usuario Faena
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditar(c)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEliminar(c)} className="text-red-500 hover:text-red-700">
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

      {/* Dialog Nuevo/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription>
              Complete los datos del cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre / Razón Social *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre del cliente"
              />
            </div>
            <div className="space-y-2">
              <Label>CUIT</Label>
              <Input
                value={formData.cuit}
                onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                placeholder="20-12345678-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="011-1234-5678"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Dirección del cliente"
              />
            </div>
            <div className="space-y-3 pt-2 border-t">
              <Label>Tipo de Cliente *</Label>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-stone-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.esProductor}
                    onChange={(e) => setFormData({ ...formData, esProductor: e.target.checked })}
                    className="rounded"
                  />
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      <Beef className="w-4 h-4 text-green-600" />
                      Productor
                    </div>
                    <p className="text-xs text-stone-500">Proveedor de hacienda</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-stone-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.esUsuarioFaena}
                    onChange={(e) => setFormData({ ...formData, esUsuarioFaena: e.target.checked })}
                    className="rounded"
                  />
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      Usuario de Faena
                    </div>
                    <p className="text-xs text-stone-500">Cliente del servicio de faena</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleGuardar} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Eliminar Cliente
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar a &quot;{editando?.nombre}&quot;?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarEliminar} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Clientes
