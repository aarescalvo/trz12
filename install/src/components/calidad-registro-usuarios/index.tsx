'use client'

import { useState, useEffect } from 'react'
import { 
  Users, FileText, Plus, Save, X, Loader2, Search, 
  Calendar, AlertCircle, CheckCircle, AlertTriangle, 
  ChevronRight, Filter, MessageSquare, Send,
  Clock, Phone, Mail, User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'

const TIPOS_RECLAMO = [
  { id: 'RECLAMO', label: 'Reclamo', color: 'bg-red-100 text-red-700' },
  { id: 'QUEJA', label: 'Queja', color: 'bg-orange-100 text-orange-700' },
  { id: 'INCIDENTE', label: 'Incidente', color: 'bg-purple-100 text-purple-700' },
  { id: 'CONSULTA', label: 'Consulta', color: 'bg-blue-100 text-blue-700' },
  { id: 'SUGERENCIA', label: 'Sugerencia', color: 'bg-green-100 text-green-700' },
  { id: 'OTRO', label: 'Otro', color: 'bg-stone-100 text-stone-700' },
]

const ESTADOS_RECLAMO = [
  { id: 'PENDIENTE', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'EN_REVISION', label: 'En Revisión', color: 'bg-blue-100 text-blue-700' },
  { id: 'RESPONDIDO', label: 'Respondido', color: 'bg-cyan-100 text-cyan-700' },
  { id: 'RESUELTO', label: 'Resuelto', color: 'bg-green-100 text-green-700' },
  { id: 'CERRADO', label: 'Cerrado', color: 'bg-stone-100 text-stone-700' },
  { id: 'ANULADO', label: 'Anulado', color: 'bg-red-100 text-red-700' },
]

const PRIORIDADES = [
  { id: 'BAJA', label: 'Baja', color: 'bg-stone-100 text-stone-600' },
  { id: 'NORMAL', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  { id: 'ALTA', label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  { id: 'URGENTE', label: 'Urgente', color: 'bg-red-100 text-red-700' },
]

interface Cliente {
  id: string
  nombre: string
  cuit: string | null
  telefono: string | null
  email: string | null
  esUsuarioFaena: boolean
  _count?: {
    reclamosPendientes: number
    totalReclamos: number
  }
}

interface Reclamo {
  id: string
  clienteId: string
  tipo: string
  titulo: string
  descripcion: string | null
  fecha: string
  tropaCodigo: string | null
  registradoPor: string | null
  estado: string
  prioridad: string
  respuesta: string | null
  fechaRespuesta: string | null
  respondidoPor: string | null
  fechaResolucion: string | null
  resueltoPor: string | null
  resultado: string | null
  seguimiento: string | null
  observaciones: string | null
  cliente?: {
    id: string
    nombre: string
    cuit: string | null
    telefono: string | null
    email: string | null
  }
}

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Props {
  operador: Operador
}

export function CalidadRegistroUsuariosModule({ operador }: Props) {
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [reclamosPendientes, setReclamosPendientes] = useState<Reclamo[]>([])
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [reclamosCliente, setReclamosCliente] = useState<Reclamo[]>([])
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('TODOS')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [busqueda, setBusqueda] = useState('')
  
  // Dialogs
  const [dialogReclamoOpen, setDialogReclamoOpen] = useState(false)
  const [dialogRespuestaOpen, setDialogRespuestaOpen] = useState(false)
  const [detalleClienteOpen, setDetalleClienteOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Forms
  const [reclamoForm, setReclamoForm] = useState({
    clienteId: '', tipo: 'RECLAMO', titulo: '', descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    tropaCodigo: '', prioridad: 'NORMAL', observaciones: ''
  })
  
  const [respuestaForm, setRespuestaForm] = useState({
    id: '', respuesta: '', resultado: '', estado: 'RESPONDIDO'
  })
  
  const [selectedReclamo, setSelectedReclamo] = useState<Reclamo | null>(null)

  useEffect(() => {
    fetchClientes()
    fetchReclamosPendientes()
  }, [])

  const fetchClientes = async () => {
    setLoading(true)
    try {
      // Traer clientes que son usuarios de faena
      const res = await fetch('/api/clientes?esUsuarioFaena=true')
      const data = await res.json()
      if (data.success) {
        // Obtener conteo de reclamos por cliente
        const clientesConStats = await Promise.all(
          data.data.map(async (cliente: Cliente) => {
            const resReclamos = await fetch(`/api/calidad-reclamos?clienteId=${cliente.id}`)
            const dataReclamos = await resReclamos.json()
            if (dataReclamos.success) {
              const reclamos = dataReclamos.data
              return {
                ...cliente,
                _count: {
                  reclamosPendientes: reclamos.filter((r: Reclamo) => 
                    r.estado === 'PENDIENTE' || r.estado === 'EN_REVISION'
                  ).length,
                  totalReclamos: reclamos.length
                }
              }
            }
            return cliente
          })
        )
        setClientes(clientesConStats)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  const fetchReclamosPendientes = async () => {
    try {
      const res = await fetch('/api/calidad-reclamos?pendientes=true')
      const data = await res.json()
      if (data.success) {
        setReclamosPendientes(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchReclamosCliente = async (clienteId: string) => {
    try {
      const res = await fetch(`/api/calidad-reclamos?clienteId=${clienteId}`)
      const data = await res.json()
      if (data.success) {
        setReclamosCliente(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSelectCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    fetchReclamosCliente(cliente.id)
    setDetalleClienteOpen(true)
  }

  const handleNuevoReclamo = (clienteId: string) => {
    setReclamoForm({
      clienteId,
      tipo: 'RECLAMO',
      titulo: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      tropaCodigo: '',
      prioridad: 'NORMAL',
      observaciones: ''
    })
    setDialogReclamoOpen(true)
  }

  const handleGuardarReclamo = async () => {
    if (!reclamoForm.titulo) {
      toast.error('Complete el título del reclamo')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/calidad-reclamos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reclamoForm,
          registradoPor: operador.nombre
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Reclamo registrado correctamente')
        setDialogReclamoOpen(false)
        if (selectedCliente) {
          fetchReclamosCliente(selectedCliente.id)
        }
        fetchReclamosPendientes()
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

  const handleResponderReclamo = (reclamo: Reclamo) => {
    setSelectedReclamo(reclamo)
    setRespuestaForm({
      id: reclamo.id,
      respuesta: reclamo.respuesta || '',
      resultado: reclamo.resultado || '',
      estado: 'RESPONDIDO'
    })
    setDialogRespuestaOpen(true)
  }

  const handleGuardarRespuesta = async () => {
    if (!respuestaForm.respuesta) {
      toast.error('Ingrese la respuesta')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/calidad-reclamos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: respuestaForm.id,
          respuesta: respuestaForm.respuesta,
          resultado: respuestaForm.resultado,
          estado: respuestaForm.estado,
          respondidoPor: operador.nombre,
          resueltoPor: respuestaForm.estado === 'RESUELTO' ? operador.nombre : undefined
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Respuesta guardada correctamente')
        setDialogRespuestaOpen(false)
        if (selectedCliente) {
          fetchReclamosCliente(selectedCliente.id)
        }
        fetchReclamosPendientes()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleCambiarEstado = async (reclamo: Reclamo, nuevoEstado: string) => {
    try {
      const res = await fetch('/api/calidad-reclamos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reclamo.id,
          estado: nuevoEstado,
          resueltoPor: nuevoEstado === 'RESUELTO' ? operador.nombre : undefined
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Estado actualizado')
        if (selectedCliente) {
          fetchReclamosCliente(selectedCliente.id)
        }
        fetchReclamosPendientes()
      }
    } catch (error) {
      toast.error('Error al actualizar')
    }
  }

  const getTipoBadge = (tipo: string) => {
    const tipoInfo = TIPOS_RECLAMO.find(t => t.id === tipo)
    return (
      <Badge variant="outline" className={tipoInfo?.color || 'bg-gray-100'}>
        {tipoInfo?.label || tipo}
      </Badge>
    )
  }

  const getEstadoBadge = (estado: string) => {
    const estadoInfo = ESTADOS_RECLAMO.find(e => e.id === estado)
    return (
      <Badge variant="outline" className={estadoInfo?.color || 'bg-gray-100'}>
        {estadoInfo?.label || estado}
      </Badge>
    )
  }

  const getPrioridadBadge = (prioridad: string) => {
    const prioridadInfo = PRIORIDADES.find(p => p.id === prioridad)
    return (
      <Badge variant="outline" className={prioridadInfo?.color || 'bg-gray-100'}>
        {prioridadInfo?.label || prioridad}
      </Badge>
    )
  }

  const stats = {
    totalClientes: clientes.length,
    totalReclamos: clientes.reduce((acc, c) => acc + (c._count?.totalReclamos || 0), 0),
    pendientes: reclamosPendientes.length,
    urgentes: reclamosPendientes.filter(r => r.prioridad === 'URGENTE' || r.prioridad === 'ALTA').length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Users className="w-8 h-8 text-amber-500" />
              Control de Calidad - Reclamos de Clientes
            </h1>
            <p className="text-stone-500">Registro de reclamos, quejas e incidentes de usuarios de faena</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { fetchClientes(); fetchReclamosPendientes(); }}>
              <Clock className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-stone-100 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Usuarios de Faena</p>
                  <p className="text-xl font-bold">{stats.totalClientes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Total Reclamos</p>
                  <p className="text-xl font-bold">{stats.totalReclamos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Pendientes</p>
                  <p className="text-xl font-bold text-yellow-600">{stats.pendientes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Urgentes/Altos</p>
                  <p className="text-xl font-bold text-red-600">{stats.urgentes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pendientes" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pendientes">
              Pendientes
              {reclamosPendientes.length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">{reclamosPendientes.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          {/* Tab: Pendientes */}
          <TabsContent value="pendientes">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Reclamos Pendientes de Atención
                </CardTitle>
                <CardDescription>Reclamos que requieren respuesta o resolución</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {reclamosPendientes.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p>No hay reclamos pendientes</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50/50">
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Prioridad</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="w-28"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reclamosPendientes.map((reclamo) => (
                        <TableRow key={reclamo.id}>
                          <TableCell>{new Date(reclamo.fecha).toLocaleDateString('es-AR')}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{reclamo.cliente?.nombre || '-'}</p>
                              <p className="text-xs text-stone-400">{reclamo.cliente?.cuit || ''}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getTipoBadge(reclamo.tipo)}</TableCell>
                          <TableCell className="font-medium max-w-xs truncate">{reclamo.titulo}</TableCell>
                          <TableCell>{getPrioridadBadge(reclamo.prioridad)}</TableCell>
                          <TableCell>{getEstadoBadge(reclamo.estado)}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              onClick={() => handleResponderReclamo(reclamo)}
                              className="bg-amber-500 hover:bg-amber-600"
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Responder
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Clientes */}
          <TabsContent value="clientes">
            {/* Filtros */}
            <Card className="border-0 shadow-md mb-4">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label className="text-xs">Buscar</Label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <Input
                        className="pl-9"
                        placeholder="Nombre, CUIT..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={fetchClientes} className="self-end bg-amber-500 hover:bg-amber-600">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtrar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de Clientes */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg">Usuarios de Faena ({clientes.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                  </div>
                ) : clientes.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay usuarios de faena registrados</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50/50">
                        <TableHead>Nombre</TableHead>
                        <TableHead>CUIT</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Reclamos</TableHead>
                        <TableHead>Pendientes</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientes.map((cliente) => (
                        <TableRow 
                          key={cliente.id}
                          className="cursor-pointer hover:bg-stone-50"
                          onClick={() => handleSelectCliente(cliente)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-stone-400" />
                              <span className="font-medium">{cliente.nombre}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{cliente.cuit || '-'}</TableCell>
                          <TableCell>{cliente.telefono || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{cliente._count?.totalReclamos || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            {cliente._count?.reclamosPendientes ? (
                              <Badge className="bg-red-100 text-red-700">
                                {cliente._count.reclamosPendientes} pend.
                              </Badge>
                            ) : (
                              <span className="text-stone-400">0</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="w-4 h-4 text-stone-400" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Historial */}
          <TabsContent value="historial">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg">Historial de Reclamos</CardTitle>
                <CardDescription>Seleccione un cliente para ver su historial completo</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-8 text-center text-stone-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Seleccione un cliente de la pestaña "Clientes" para ver su historial</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog: Detalle Cliente */}
        <Dialog open={detalleClienteOpen} onOpenChange={setDetalleClienteOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-amber-500" />
                Historial del Cliente
              </DialogTitle>
            </DialogHeader>
            
            {selectedCliente && (
              <div className="space-y-6">
                {/* Info del cliente */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-lg">{selectedCliente.nombre}</h4>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">Usuario de Faena</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <Button onClick={() => handleNuevoReclamo(selectedCliente.id)} className="bg-amber-500 hover:bg-amber-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Reclamo
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-stone-400" />
                    <span className="text-stone-500">CUIT:</span>
                    <span className="font-medium">{selectedCliente.cuit || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-stone-400" />
                    <span className="text-stone-500">Tel:</span>
                    <span className="font-medium">{selectedCliente.telefono || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-stone-400" />
                    <span className="text-stone-500">Email:</span>
                    <span className="font-medium">{selectedCliente.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-stone-500">Reclamos:</span>
                    <span className="font-medium">{selectedCliente._count?.totalReclamos || 0}</span>
                  </div>
                </div>

                {/* Historial de reclamos */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    Historial de Reclamos
                  </h4>
                  {reclamosCliente.length === 0 ? (
                    <div className="p-4 text-center text-stone-400 bg-stone-50 rounded-lg">
                      Sin reclamos registrados
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {reclamosCliente.map((reclamo) => (
                        <div key={reclamo.id} className="p-3 bg-stone-50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getTipoBadge(reclamo.tipo)}
                                {getEstadoBadge(reclamo.estado)}
                                {getPrioridadBadge(reclamo.prioridad)}
                                <span className="text-xs text-stone-400">
                                  {new Date(reclamo.fecha).toLocaleDateString('es-AR')}
                                </span>
                              </div>
                              <p className="font-medium">{reclamo.titulo}</p>
                              {reclamo.descripcion && (
                                <p className="text-sm text-stone-500 mt-1">{reclamo.descripcion}</p>
                              )}
                              {reclamo.respuesta && (
                                <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                                  <p className="text-green-700 font-medium">Respuesta:</p>
                                  <p className="text-green-600">{reclamo.respuesta}</p>
                                </div>
                              )}
                            </div>
                            {(reclamo.estado === 'PENDIENTE' || reclamo.estado === 'EN_REVISION') && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleResponderReclamo(reclamo)}
                                className="text-amber-600"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetalleClienteOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Nuevo Reclamo */}
        <Dialog open={dialogReclamoOpen} onOpenChange={setDialogReclamoOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Reclamo/Queja</DialogTitle>
              <DialogDescription>Registrar un nuevo reclamo para el cliente</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select value={reclamoForm.tipo} onValueChange={(v) => setReclamoForm({...reclamoForm, tipo: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_RECLAMO.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select value={reclamoForm.prioridad} onValueChange={(v) => setReclamoForm({...reclamoForm, prioridad: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORIDADES.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Título *</Label>
                <Input value={reclamoForm.titulo} onChange={(e) => setReclamoForm({...reclamoForm, titulo: e.target.value})} placeholder="Título del reclamo" />
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea 
                  value={reclamoForm.descripcion} 
                  onChange={(e) => setReclamoForm({...reclamoForm, descripcion: e.target.value})} 
                  placeholder="Detalle del reclamo..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input type="date" value={reclamoForm.fecha} onChange={(e) => setReclamoForm({...reclamoForm, fecha: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Tropa (opcional)</Label>
                  <Input value={reclamoForm.tropaCodigo} onChange={(e) => setReclamoForm({...reclamoForm, tropaCodigo: e.target.value})} placeholder="Código de tropa" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea 
                  value={reclamoForm.observaciones} 
                  onChange={(e) => setReclamoForm({...reclamoForm, observaciones: e.target.value})} 
                  placeholder="Observaciones internas..."
                  rows={2}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogReclamoOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGuardarReclamo} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Responder Reclamo */}
        <Dialog open={dialogRespuestaOpen} onOpenChange={setDialogRespuestaOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Responder Reclamo</DialogTitle>
              {selectedReclamo && (
                <DialogDescription>
                  {selectedReclamo.cliente?.nombre} - {selectedReclamo.titulo}
                </DialogDescription>
              )}
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {selectedReclamo && selectedReclamo.descripcion && (
                <div className="p-3 bg-stone-50 rounded-lg">
                  <p className="text-sm text-stone-500">Descripción del reclamo:</p>
                  <p className="text-stone-700">{selectedReclamo.descripcion}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Respuesta al Cliente *</Label>
                <Textarea 
                  value={respuestaForm.respuesta} 
                  onChange={(e) => setRespuestaForm({...respuestaForm, respuesta: e.target.value})} 
                  placeholder="Escriba la respuesta que se dará al cliente..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={respuestaForm.estado} onValueChange={(v) => setRespuestaForm({...respuestaForm, estado: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RESPONDIDO">Respondido</SelectItem>
                      <SelectItem value="EN_REVISION">En Revisión</SelectItem>
                      <SelectItem value="RESUELTO">Resuelto</SelectItem>
                      <SelectItem value="CERRADO">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Resultado</Label>
                  <Select value={respuestaForm.resultado} onValueChange={(v) => setRespuestaForm({...respuestaForm, resultado: v})}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FAVORABLE">Favorable al cliente</SelectItem>
                      <SelectItem value="PARCIAL">Parcialmente favorable</SelectItem>
                      <SelectItem value="DESESTIMADO">Desestimado</SelectItem>
                      <SelectItem value="EN_PROCESO">En proceso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogRespuestaOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGuardarRespuesta} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Guardar Respuesta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
