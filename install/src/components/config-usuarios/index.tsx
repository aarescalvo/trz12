'use client'

import { useState, useEffect } from 'react'
import { 
  User, Plus, Edit, Trash2, Save, X, Search, Loader2, IdCard, Phone, MapPin, Building,
  Mail, FileText, CreditCard, Globe, Eye, EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

const CONDICIONES_IVA = [
  { id: 'RI', label: 'Responsable Inscripto' },
  { id: 'CF', label: 'Consumidor Final' },
  { id: 'EX', label: 'Exento' },
  { id: 'MT', label: 'Monotributo' },
  { id: 'NI', label: 'No Inscripto' },
]

const PROVINCIAS = [
  'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
  'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza',
  'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis',
  'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
]

interface UsuarioFaena {
  id: string
  nombre: string
  dni?: string
  cuit?: string
  matricula?: string
  direccion?: string
  localidad?: string
  provincia?: string
  telefono?: string
  telefonoAlternativo?: string
  email?: string
  razonSocial?: string
  condicionIva?: string
  puntoVenta?: string
  observaciones?: string
  activo: boolean
  esProductor: boolean
  esUsuarioFaena: boolean
}

interface Operador {
  id: string
  nombre: string
  rol: string
}

export function ConfigUsuariosModule({ operador }: { operador: Operador }) {
  const [usuarios, setUsuarios] = useState<UsuarioFaena[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioFaena | null>(null)
  const [usuarioDetalle, setUsuarioDetalle] = useState<UsuarioFaena | null>(null)
  const [busqueda, setBusqueda] = useState('')
  
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    cuit: '',
    matricula: '',
    direccion: '',
    localidad: '',
    provincia: '',
    telefono: '',
    telefonoAlternativo: '',
    email: '',
    razonSocial: '',
    condicionIva: '',
    puntoVenta: '',
    observaciones: '',
    esProductor: false
  })

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async () => {
    try {
      const res = await fetch('/api/clientes?tipo=usuarioFaena')
      const data = await res.json()
      if (data.success) {
        setUsuarios(data.data.filter((c: UsuarioFaena) => c.esUsuarioFaena))
      }
    } catch (error) {
      console.error('Error fetching usuarios:', error)
      toast.error('Error al cargar usuarios de faena')
    } finally {
      setLoading(false)
    }
  }

  const handleNuevo = () => {
    setUsuarioEditando(null)
    setFormData({
      nombre: '',
      dni: '',
      cuit: '',
      matricula: '',
      direccion: '',
      localidad: '',
      provincia: '',
      telefono: '',
      telefonoAlternativo: '',
      email: '',
      razonSocial: '',
      condicionIva: '',
      puntoVenta: '',
      observaciones: '',
      esProductor: false
    })
    setDialogOpen(true)
  }

  const handleEditar = (usuario: UsuarioFaena) => {
    setUsuarioEditando(usuario)
    setFormData({
      nombre: usuario.nombre,
      dni: usuario.dni || '',
      cuit: usuario.cuit || '',
      matricula: usuario.matricula || '',
      direccion: usuario.direccion || '',
      localidad: usuario.localidad || '',
      provincia: usuario.provincia || '',
      telefono: usuario.telefono || '',
      telefonoAlternativo: usuario.telefonoAlternativo || '',
      email: usuario.email || '',
      razonSocial: usuario.razonSocial || '',
      condicionIva: usuario.condicionIva || '',
      puntoVenta: usuario.puntoVenta || '',
      observaciones: usuario.observaciones || '',
      esProductor: usuario.esProductor
    })
    setDialogOpen(true)
  }

  const handleVerDetalle = (usuario: UsuarioFaena) => {
    setUsuarioDetalle(usuario)
    setDetailOpen(true)
  }

  const handleEliminar = (usuario: UsuarioFaena) => {
    setUsuarioEditando(usuario)
    setDeleteOpen(true)
  }

  const handleGuardar = async () => {
    if (!formData.nombre) {
      toast.error('Ingrese el nombre del usuario')
      return
    }

    if (!formData.matricula) {
      toast.error('Ingrese el número de matrícula')
      return
    }

    setSaving(true)
    try {
      const url = '/api/clientes'
      const method = usuarioEditando ? 'PUT' : 'POST'
      const body = usuarioEditando 
        ? { ...formData, id: usuarioEditando.id, esUsuarioFaena: true }
        : { ...formData, esUsuarioFaena: true }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(usuarioEditando ? 'Usuario actualizado' : 'Usuario creado')
        setDialogOpen(false)
        fetchUsuarios()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActivo = async (usuario: UsuarioFaena) => {
    try {
      const res = await fetch('/api/clientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: usuario.id, 
          activo: !usuario.activo 
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(usuario.activo ? 'Usuario desactivado' : 'Usuario activado')
        fetchUsuarios()
      }
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const handleConfirmarEliminar = async () => {
    if (!usuarioEditando) return

    setSaving(true)
    try {
      const res = await fetch(`/api/clientes?id=${usuarioEditando.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Usuario eliminado')
        setDeleteOpen(false)
        fetchUsuarios()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Formatear CUIT
  const formatCuit = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) return cleaned
    if (cleaned.length <= 10) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10, 11)}`
  }

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter(u => {
    if (busqueda) {
      const termino = busqueda.toLowerCase()
      return u.nombre.toLowerCase().includes(termino) || 
             (u.matricula && u.matricula.toLowerCase().includes(termino)) ||
             (u.cuit && u.cuit.includes(termino)) ||
             (u.dni && u.dni.includes(termino))
    }
    return true
  })

  const stats = {
    total: usuarios.length,
    activos: usuarios.filter(u => u.activo).length,
    productores: usuarios.filter(u => u.esProductor).length,
    conDatosFacturacion: usuarios.filter(u => u.condicionIva).length,
  }

  const getCondicionIvaLabel = (codigo: string) => {
    return CONDICIONES_IVA.find(c => c.id === codigo)?.label || codigo || '-'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <User className="w-8 h-8 text-amber-500" />
              Configuración de Usuarios de Faena
            </h1>
            <p className="text-stone-500">Matarifes y personas que faenan con número de matrícula</p>
          </div>
          <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-stone-100 p-2 rounded-lg">
                  <User className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Total Usuarios</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <User className="w-5 h-5 text-green-600" />
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
                <div className="bg-amber-100 p-2 rounded-lg">
                  <Building className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">También Productores</p>
                  <p className="text-xl font-bold text-amber-600">{stats.productores}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">C/Facturación</p>
                  <p className="text-xl font-bold text-purple-600">{stats.conDatosFacturacion}</p>
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
                    placeholder="Nombre, matrícula, CUIT o DNI..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <IdCard className="w-5 h-5 text-amber-600" />
              Usuarios de Faena ({usuariosFiltrados.length})
            </CardTitle>
            <CardDescription>
              Personas con matrícula que faenan en el frigorífico
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
              </div>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay usuarios de faena registrados</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-stone-50/50">
                    <TableHead>Nombre</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead>CUIT</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cond. IVA</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuariosFiltrados.map((usuario) => (
                    <TableRow key={usuario.id} className={!usuario.activo ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{usuario.nombre}</TableCell>
                      <TableCell className="font-mono text-sm">{usuario.dni || '-'}</TableCell>
                      <TableCell className="font-mono text-sm">{usuario.cuit || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          <IdCard className="w-3 h-3 mr-1" />
                          {usuario.matricula || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{usuario.telefono || '-'}</TableCell>
                      <TableCell className="text-sm">{usuario.email || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {usuario.condicionIva ? (
                          <Badge variant="outline">{usuario.condicionIva}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {usuario.esProductor && (
                          <Badge className="bg-amber-100 text-amber-700">Productor</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={usuario.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleVerDetalle(usuario)}
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditar(usuario)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleToggleActivo(usuario)}
                            title={usuario.activo ? 'Desactivar' : 'Activar'}
                          >
                            <User className={`w-4 h-4 ${usuario.activo ? 'text-red-500' : 'text-green-500'}`} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEliminar(usuario)}
                            className="text-red-500 hover:text-red-700"
                            title="Eliminar"
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

        {/* Dialog Nuevo/Editar */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-amber-500" />
                {usuarioEditando ? 'Editar Usuario de Faena' : 'Nuevo Usuario de Faena'}
              </DialogTitle>
              <DialogDescription>
                {usuarioEditando 
                  ? 'Modifique los datos del usuario' 
                  : 'Registre un nuevo matarife/usuario de faena'}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="identificacion" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="identificacion">Identificación</TabsTrigger>
                <TabsTrigger value="contacto">Contacto</TabsTrigger>
                <TabsTrigger value="facturacion">Facturación</TabsTrigger>
                <TabsTrigger value="adicional">Adicional</TabsTrigger>
              </TabsList>
              
              <div className="py-4">
                {/* Tab Identificación */}
                <TabsContent value="identificacion" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label>Nombre Completo *</Label>
                    <Input
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Juan Pérez"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>DNI</Label>
                      <div className="relative">
                        <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <Input
                          value={formData.dni}
                          onChange={(e) => setFormData({ ...formData, dni: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                          placeholder="12345678"
                          className="pl-9"
                          maxLength={8}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>CUIT</Label>
                      <Input
                        value={formData.cuit}
                        onChange={(e) => setFormData({ ...formData, cuit: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                        placeholder="20-12345678-9"
                        maxLength={11}
                      />
                      {formData.cuit && formData.cuit.length === 11 && (
                        <p className="text-xs text-stone-400">{formatCuit(formData.cuit)}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>N° Matrícula *</Label>
                      <Input
                        value={formData.matricula}
                        onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                        placeholder="12345"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="esProductor"
                      checked={formData.esProductor}
                      onChange={(e) => setFormData({ ...formData, esProductor: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="esProductor" className="text-sm">
                      También es productor (envía animales propios)
                    </Label>
                  </div>
                </TabsContent>
                
                {/* Tab Contacto */}
                <TabsContent value="contacto" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <Input
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        placeholder="Av. Principal 123"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Localidad</Label>
                      <Input
                        value={formData.localidad}
                        onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                        placeholder="Bahía Blanca"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Provincia</Label>
                      <Select 
                        value={formData.provincia || ''} 
                        onValueChange={(v) => setFormData({ ...formData, provincia: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PROVINCIAS.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Teléfono Principal</Label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <Input
                          value={formData.telefono}
                          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                          placeholder="0291-1234567"
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono Alternativo</Label>
                      <Input
                        value={formData.telefonoAlternativo}
                        onChange={(e) => setFormData({ ...formData, telefonoAlternativo: e.target.value })}
                        placeholder="0291-7654321"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="correo@ejemplo.com"
                        className="pl-9"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                {/* Tab Facturación */}
                <TabsContent value="facturacion" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label>Razón Social</Label>
                    <div className="relative">
                      <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <Input
                        value={formData.razonSocial}
                        onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                        placeholder="Empresa S.A."
                        className="pl-9"
                      />
                    </div>
                    <p className="text-xs text-stone-400">Si es diferente al nombre del usuario</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Condición IVA</Label>
                      <Select 
                        value={formData.condicionIva || ''} 
                        onValueChange={(v) => setFormData({ ...formData, condicionIva: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDICIONES_IVA.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.id} - {c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Punto de Venta</Label>
                      <Input
                        value={formData.puntoVenta}
                        onChange={(e) => setFormData({ ...formData, puntoVenta: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                        placeholder="0001"
                        maxLength={5}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-stone-50 p-4 rounded-lg">
                    <p className="text-sm text-stone-600">
                      <strong>Nota:</strong> Los datos de facturación se utilizan para generar las facturas de servicio de faena.
                      Asegúrese de que el CUIT y la condición IVA sean correctos.
                    </p>
                  </div>
                </TabsContent>
                
                {/* Tab Adicional */}
                <TabsContent value="adicional" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label>Observaciones</Label>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      placeholder="Notas adicionales sobre el usuario..."
                      className="w-full min-h-[120px] p-3 border rounded-lg text-sm resize-none"
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={handleGuardar} 
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Ver Detalle */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-500" />
                Detalle del Usuario
              </DialogTitle>
            </DialogHeader>
            
            {usuarioDetalle && (
              <div className="space-y-4">
                {/* Datos principales */}
                <div className="bg-stone-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-lg">{usuarioDetalle.nombre}</h4>
                    <Badge className={usuarioDetalle.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {usuarioDetalle.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  {usuarioDetalle.esProductor && (
                    <Badge className="bg-amber-100 text-amber-700">Productor</Badge>
                  )}
                </div>
                
                {/* Identificación */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-stone-400">DNI</p>
                    <p className="font-medium">{usuarioDetalle.dni || '-'}</p>
                  </div>
                  <div>
                    <p className="text-stone-400">CUIT</p>
                    <p className="font-medium">{usuarioDetalle.cuit || '-'}</p>
                  </div>
                  <div>
                    <p className="text-stone-400">Matrícula</p>
                    <p className="font-medium">{usuarioDetalle.matricula || '-'}</p>
                  </div>
                </div>
                
                {/* Contacto */}
                <div className="border-t pt-4">
                  <h5 className="font-medium text-stone-600 mb-2">Contacto</h5>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-stone-400">Dirección</p>
                      <p className="font-medium">{usuarioDetalle.direccion || '-'}</p>
                    </div>
                    <div>
                      <p className="text-stone-400">Localidad</p>
                      <p className="font-medium">{usuarioDetalle.localidad || '-'}</p>
                    </div>
                    <div>
                      <p className="text-stone-400">Provincia</p>
                      <p className="font-medium">{usuarioDetalle.provincia || '-'}</p>
                    </div>
                    <div>
                      <p className="text-stone-400">Teléfono</p>
                      <p className="font-medium">{usuarioDetalle.telefono || '-'}</p>
                    </div>
                    <div>
                      <p className="text-stone-400">Tel. Alternativo</p>
                      <p className="font-medium">{usuarioDetalle.telefonoAlternativo || '-'}</p>
                    </div>
                    <div>
                      <p className="text-stone-400">Email</p>
                      <p className="font-medium">{usuarioDetalle.email || '-'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Facturación */}
                <div className="border-t pt-4">
                  <h5 className="font-medium text-stone-600 mb-2">Facturación</h5>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-stone-400">Razón Social</p>
                      <p className="font-medium">{usuarioDetalle.razonSocial || '-'}</p>
                    </div>
                    <div>
                      <p className="text-stone-400">Cond. IVA</p>
                      <p className="font-medium">{getCondicionIvaLabel(usuarioDetalle.condicionIva || '')}</p>
                    </div>
                    <div>
                      <p className="text-stone-400">Punto de Venta</p>
                      <p className="font-medium">{usuarioDetalle.puntoVenta || '-'}</p>
                    </div>
                  </div>
                </div>
                
                {usuarioDetalle.observaciones && (
                  <div className="border-t pt-4">
                    <h5 className="font-medium text-stone-600 mb-2">Observaciones</h5>
                    <p className="text-sm text-stone-600">{usuarioDetalle.observaciones}</p>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailOpen(false)}>
                Cerrar
              </Button>
              <Button 
                onClick={() => {
                  setDetailOpen(false)
                  if (usuarioDetalle) handleEditar(usuarioDetalle)
                }}
                className="bg-amber-500 hover:bg-amber-600"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Eliminar */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Eliminar Usuario
              </DialogTitle>
              <DialogDescription>
                ¿Está seguro que desea eliminar al usuario &quot;{usuarioEditando?.nombre}&quot;?
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
    </div>
  )
}

export default ConfigUsuariosModule
