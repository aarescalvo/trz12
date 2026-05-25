'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Edit, Trash2, Save, X, AlertTriangle, Shield, KeyRound, Mail, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

const ROLES = [
  { id: 'OPERADOR', label: 'Operador', color: 'bg-blue-100 text-blue-700' },
  { id: 'SUPERVISOR', label: 'Supervisor', color: 'bg-amber-100 text-amber-700' },
  { id: 'ADMINISTRADOR', label: 'Administrador', color: 'bg-purple-100 text-purple-700' },
]

const MODULOS = [
  { id: 'puedePesajeCamiones', label: 'Pesaje Camiones', icon: '🚛' },
  { id: 'puedePesajeIndividual', label: 'Pesaje Individual', icon: '⚖️' },
  { id: 'puedeMovimientoHacienda', label: 'Movimiento Hacienda', icon: '🐄' },
  { id: 'puedeListaFaena', label: 'Lista Faena', icon: '📋' },
  { id: 'puedeRomaneo', label: 'Romaneo', icon: '📊' },
  { id: 'puedeMenudencias', label: 'Menudencias', icon: '🫀' },
  { id: 'puedeStock', label: 'Stock Cámaras', icon: '🏭' },
  { id: 'puedeReportes', label: 'Reportes', icon: '📈' },
  { id: 'puedeConfiguracion', label: 'Configuración', icon: '⚙️' },
]

interface OperadorItem {
  id: string
  nombre: string
  usuario: string
  email?: string
  rol: string
  pin?: string
  activo: boolean
  puedePesajeCamiones: boolean
  puedePesajeIndividual: boolean
  puedeMovimientoHacienda: boolean
  puedeListaFaena: boolean
  puedeRomaneo: boolean
  puedeMenudencias: boolean
  puedeStock: boolean
  puedeReportes: boolean
  puedeConfiguracion: boolean
}

interface Operador {
  id: string
  nombre: string
  rol: string
}

export function ConfigOperadoresModule({ operador }: { operador: Operador }) {
  const [operadores, setOperadores] = useState<OperadorItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [operadorEditando, setOperadorEditando] = useState<OperadorItem | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState<string>('TODOS')
  
  const [formData, setFormData] = useState({
    nombre: '',
    usuario: '',
    password: '',
    email: '',
    pin: '',
    rol: 'OPERADOR',
    puedePesajeCamiones: true,
    puedePesajeIndividual: true,
    puedeMovimientoHacienda: true,
    puedeListaFaena: false,
    puedeRomaneo: false,
    puedeMenudencias: false,
    puedeStock: false,
    puedeReportes: false,
    puedeConfiguracion: false
  })

  useEffect(() => {
    fetchOperadores()
  }, [])

  const fetchOperadores = async () => {
    try {
      const res = await fetch('/api/operadores')
      const data = await res.json()
      if (data.success) {
        setOperadores(data.data)
      }
    } catch (error) {
      console.error('Error fetching operadores:', error)
      toast.error('Error al cargar operadores')
    } finally {
      setLoading(false)
    }
  }

  const handleNuevo = () => {
    setOperadorEditando(null)
    setFormData({
      nombre: '',
      usuario: '',
      password: '',
      email: '',
      pin: '',
      rol: 'OPERADOR',
      puedePesajeCamiones: true,
      puedePesajeIndividual: true,
      puedeMovimientoHacienda: true,
      puedeListaFaena: false,
      puedeRomaneo: false,
      puedeMenudencias: false,
      puedeStock: false,
      puedeReportes: false,
      puedeConfiguracion: false
    })
    setDialogOpen(true)
  }

  const handleEditar = (op: OperadorItem) => {
    setOperadorEditando(op)
    setFormData({
      nombre: op.nombre,
      usuario: op.usuario,
      password: '',
      email: op.email || '',
      pin: op.pin || '',
      rol: op.rol,
      puedePesajeCamiones: op.puedePesajeCamiones,
      puedePesajeIndividual: op.puedePesajeIndividual,
      puedeMovimientoHacienda: op.puedeMovimientoHacienda,
      puedeListaFaena: op.puedeListaFaena,
      puedeRomaneo: op.puedeRomaneo,
      puedeMenudencias: op.puedeMenudencias,
      puedeStock: op.puedeStock,
      puedeReportes: op.puedeReportes,
      puedeConfiguracion: op.puedeConfiguracion
    })
    setDialogOpen(true)
  }

  const handleEliminar = (op: OperadorItem) => {
    setOperadorEditando(op)
    setDeleteOpen(true)
  }

  const handleGuardar = async () => {
    if (!formData.nombre || !formData.usuario) {
      toast.error('Complete nombre y usuario')
      return
    }

    if (!operadorEditando && !formData.password) {
      toast.error('Ingrese una contraseña para el nuevo operador')
      return
    }

    setSaving(true)
    try {
      const url = '/api/operadores'
      const method = operadorEditando ? 'PUT' : 'POST'
      const body = operadorEditando 
        ? { ...formData, id: operadorEditando.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(operadorEditando ? 'Operador actualizado' : 'Operador creado')
        setDialogOpen(false)
        fetchOperadores()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActivo = async (op: OperadorItem) => {
    try {
      const res = await fetch('/api/operadores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: op.id, 
          activo: !op.activo 
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(op.activo ? 'Operador desactivado' : 'Operador activado')
        fetchOperadores()
      }
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const handleConfirmarEliminar = async () => {
    if (!operadorEditando) return

    setSaving(true)
    try {
      const res = await fetch(`/api/operadores?id=${operadorEditando.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Operador eliminado')
        setDeleteOpen(false)
        fetchOperadores()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleRolChange = (rol: string) => {
    let permisos = { ...formData }
    permisos.rol = rol
    
    if (rol === 'ADMINISTRADOR') {
      permisos = {
        ...permisos,
        puedePesajeCamiones: true,
        puedePesajeIndividual: true,
        puedeMovimientoHacienda: true,
        puedeListaFaena: true,
        puedeRomaneo: true,
        puedeMenudencias: true,
        puedeStock: true,
        puedeReportes: true,
        puedeConfiguracion: true
      }
    } else if (rol === 'SUPERVISOR') {
      permisos = {
        ...permisos,
        puedePesajeCamiones: true,
        puedePesajeIndividual: true,
        puedeMovimientoHacienda: true,
        puedeListaFaena: true,
        puedeRomaneo: true,
        puedeMenudencias: true,
        puedeStock: true,
        puedeReportes: true,
        puedeConfiguracion: false
      }
    }
    
    setFormData(permisos)
  }

  const getRolBadge = (rol: string) => {
    const role = ROLES.find(r => r.id === rol)
    return (
      <Badge className={role?.color || 'bg-gray-100'}>
        {role?.label || rol}
      </Badge>
    )
  }

  // Filtrar operadores
  const operadoresFiltrados = operadores.filter(op => {
    if (filtroRol !== 'TODOS' && op.rol !== filtroRol) return false
    if (busqueda) {
      const termino = busqueda.toLowerCase()
      return op.nombre.toLowerCase().includes(termino) || 
             op.usuario.toLowerCase().includes(termino)
    }
    return true
  })

  const stats = {
    total: operadores.length,
    activos: operadores.filter(o => o.activo).length,
    administradores: operadores.filter(o => o.rol === 'ADMINISTRADOR').length,
    supervisores: operadores.filter(o => o.rol === 'SUPERVISOR').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Users className="w-8 h-8 text-amber-500" />
              Configuración de Operadores
            </h1>
            <p className="text-stone-500">Trabajadores con acceso al sistema (usuarios, contraseñas, PIN)</p>
          </div>
          <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Operador
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-stone-100 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Total</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
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
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Administradores</p>
                  <p className="text-xl font-bold text-purple-600">{stats.administradores}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <Shield className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Supervisores</p>
                  <p className="text-xl font-bold text-amber-600">{stats.supervisores}</p>
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
                    placeholder="Nombre o usuario..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Label className="text-xs">Filtrar por Rol</Label>
                <Select value={filtroRol} onValueChange={setFiltroRol}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    {ROLES.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              Operadores del Sistema ({operadoresFiltrados.length})
            </CardTitle>
            <CardDescription>
              Personas con acceso al software (login, PIN, permisos)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
              </div>
            ) : operadoresFiltrados.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay operadores</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-stone-50/50">
                    <TableHead>Nombre</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Permisos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operadoresFiltrados.map((op) => (
                    <TableRow key={op.id} className={!op.activo ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{op.nombre}</TableCell>
                      <TableCell className="font-mono text-sm">{op.usuario}</TableCell>
                      <TableCell className="text-sm">{op.email || '-'}</TableCell>
                      <TableCell>{getRolBadge(op.rol)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {MODULOS.filter(m => op[m.id as keyof OperadorItem] === true).slice(0, 3).map((m) => (
                            <Badge key={m.id} variant="outline" className="text-xs">
                              {m.icon} {m.label}
                            </Badge>
                          ))}
                          {MODULOS.filter(m => op[m.id as keyof OperadorItem] === true).length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{MODULOS.filter(m => op[m.id as keyof OperadorItem] === true).length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={op.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {op.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditar(op)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <div className="flex items-center justify-center">
                            <Switch 
                              checked={op.activo}
                              onCheckedChange={() => handleToggleActivo(op)}
                              disabled={op.id === operador.id}
                              title={op.activo ? 'Desactivar' : 'Activar'}
                            />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEliminar(op)}
                            className="text-red-500 hover:text-red-700"
                            disabled={op.id === operador.id}
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
                <Users className="w-5 h-5 text-amber-500" />
                {operadorEditando ? 'Editar Operador' : 'Nuevo Operador'}
              </DialogTitle>
              <DialogDescription>
                Complete los datos y permisos del operador del sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Datos básicos */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Datos del Operador
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre Completo *</Label>
                    <Input
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Juan Pérez"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Usuario *</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        value={formData.usuario}
                        onChange={(e) => setFormData({ ...formData, usuario: e.target.value.toLowerCase() })}
                        placeholder="jperez"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contraseña {operadorEditando ? '(dejar vacío para no cambiar)' : '*'}</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PIN (opcional, 4-6 dígitos)</Label>
                    <Input
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      placeholder="1234"
                      maxLength={6}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="jperez@solemar.com.ar"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Rol</Label>
                    <Select value={formData.rol} onValueChange={handleRolChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Permisos */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Permisos por Módulo
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {MODULOS.map((m) => (
                    <label 
                      key={m.id} 
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData[m.id as keyof typeof formData] ? 'bg-amber-50 border-amber-200' : 'bg-white hover:bg-stone-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData[m.id as keyof typeof formData] as boolean}
                        onChange={(e) => setFormData({ ...formData, [m.id]: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">{m.icon} {m.label}</span>
                    </label>
                  ))}
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

        {/* Dialog Eliminar */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Eliminar Operador
              </DialogTitle>
              <DialogDescription>
                ¿Está seguro que desea eliminar al operador &quot;{operadorEditando?.nombre}&quot;?
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

export default ConfigOperadoresModule
