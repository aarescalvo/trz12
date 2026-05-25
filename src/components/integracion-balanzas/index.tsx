'use client'

import { useState, useEffect } from 'react'
import { 
  Scale, Plus, Edit, Trash2, Save, X, Search, Loader2, Settings,
  Usb, Wifi, Check, AlertCircle, Play, Square, RefreshCw, Monitor
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface Balanza {
  id: string
  nombre: string
  modelo?: string
  marca?: string
  tipoConexion: string
  puertoSerial?: string
  baudRate?: number
  direccionIP?: string
  puertoTCP?: number
  activa: boolean
  esPrincipal: boolean
  ubicacion?: string
  terminalId?: string
  observaciones?: string
  decimales?: number
  unidad?: string
  intervaloLectura?: number
}

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Props {
  operador: Operador
}

const TIPOS_CONEXION = [
  { value: 'SERIAL', label: 'Puerto Serial (RS232)', icon: Usb },
  { value: 'TCP_IP', label: 'Red TCP/IP', icon: Wifi },
  { value: 'USB', label: 'USB (Simula Serial)', icon: Usb },
  { value: 'SIMULADA', label: 'Simulada (Pruebas)', icon: Monitor }
]

const BAUD_RATES = [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200]

export function IntegracionBalanzasModule({ operador }: Props) {
  const [balanzas, setBalanzas] = useState<Balanza[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [testOpen, setTestOpen] = useState(false)
  const [balanzaEditando, setBalanzaEditando] = useState<Balanza | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Estado para simulación de lectura
  const [pesoSimulado, setPesoSimulado] = useState(0)
  const [leyendo, setLeyendo] = useState(false)
  const [pesoManual, setPesoManual] = useState('')

  const [formData, setFormData] = useState({
    nombre: '',
    modelo: '',
    marca: '',
    tipoConexion: 'SERIAL',
    puertoSerial: 'COM1',
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    paridad: 'NONE',
    direccionIP: '',
    puertoTCP: 5000,
    protocolo: 'CONTINUO',
    timeout: 5000,
    intervaloLectura: 500,
    decimales: 2,
    unidad: 'KG',
    activa: true,
    esPrincipal: false,
    ubicacion: '',
    terminalId: '',
    observaciones: ''
  })

  useEffect(() => {
    fetchBalanzas()
  }, [])

  const fetchBalanzas = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/config-balanzas')
      const data = await res.json()
      if (data.success) {
        setBalanzas(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar configuración de balanzas')
    } finally {
      setLoading(false)
    }
  }

  const handleNuevo = () => {
    setBalanzaEditando(null)
    setFormData({
      nombre: '',
      modelo: '',
      marca: '',
      tipoConexion: 'SERIAL',
      puertoSerial: 'COM1',
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      paridad: 'NONE',
      direccionIP: '',
      puertoTCP: 5000,
      protocolo: 'CONTINUO',
      timeout: 5000,
      intervaloLectura: 500,
      decimales: 2,
      unidad: 'KG',
      activa: true,
      esPrincipal: false,
      ubicacion: '',
      terminalId: '',
      observaciones: ''
    })
    setDialogOpen(true)
  }

  const handleEditar = (balanza: Balanza) => {
    setBalanzaEditando(balanza)
    setFormData({
      nombre: balanza.nombre,
      modelo: balanza.modelo || '',
      marca: balanza.marca || '',
      tipoConexion: balanza.tipoConexion || 'SERIAL',
      puertoSerial: balanza.puertoSerial || 'COM1',
      baudRate: balanza.baudRate || 9600,
      dataBits: 8,
      stopBits: 1,
      paridad: 'NONE',
      direccionIP: balanza.direccionIP || '',
      puertoTCP: balanza.puertoTCP || 5000,
      protocolo: 'CONTINUO',
      timeout: 5000,
      intervaloLectura: balanza.intervaloLectura || 500,
      decimales: balanza.decimales || 2,
      unidad: balanza.unidad || 'KG',
      activa: balanza.activa,
      esPrincipal: balanza.esPrincipal,
      ubicacion: balanza.ubicacion || '',
      terminalId: balanza.terminalId || '',
      observaciones: balanza.observaciones || ''
    })
    setDialogOpen(true)
  }

  const handleEliminar = (balanza: Balanza) => {
    setBalanzaEditando(balanza)
    setDeleteOpen(true)
  }

  const handleGuardar = async () => {
    if (!formData.nombre) {
      toast.error('Ingrese el nombre de la balanza')
      return
    }

    setSaving(true)
    try {
      const url = '/api/config-balanzas'
      const method = balanzaEditando ? 'PUT' : 'POST'
      const body = balanzaEditando 
        ? { ...formData, id: balanzaEditando.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(balanzaEditando ? 'Balanza actualizada' : 'Balanza creada')
        setDialogOpen(false)
        fetchBalanzas()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmarEliminar = async () => {
    if (!balanzaEditando) return

    setSaving(true)
    try {
      const res = await fetch(`/api/config-balanzas?id=${balanzaEditando.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Balanza eliminada')
        setDeleteOpen(false)
        fetchBalanzas()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActiva = async (balanza: Balanza) => {
    try {
      const res = await fetch('/api/config-balanzas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: balanza.id,
          activa: !balanza.activa
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(balanza.activa ? 'Balanza desactivada' : 'Balanza activada')
        fetchBalanzas()
      }
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const handleTogglePrincipal = async (balanza: Balanza) => {
    try {
      const res = await fetch('/api/config-balanzas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: balanza.id,
          esPrincipal: !balanza.esPrincipal
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(balanza.esPrincipal ? 'Balanza ya no es principal' : 'Balanza establecida como principal')
        fetchBalanzas()
      }
    } catch {
      toast.error('Error al actualizar')
    }
  }

  // Simular lectura de peso
  const iniciarLectura = () => {
    setLeyendo(true)
    // Simular lecturas aleatorias
    const interval = setInterval(() => {
      if (!leyendo) {
        clearInterval(interval)
        return
      }
      setPesoSimulado(Math.random() * 500 + 100)
    }, formData.intervaloLectura || 500)
    
    // Detener después de 10 segundos
    setTimeout(() => {
      clearInterval(interval)
      setLeyendo(false)
    }, 10000)
  }

  const detenerLectura = () => {
    setLeyendo(false)
  }

  const handlePesoManual = () => {
    const peso = parseFloat(pesoManual)
    if (isNaN(peso) || peso <= 0) {
      toast.error('Ingrese un peso válido')
      return
    }
    setPesoSimulado(peso)
    toast.success(`Peso registrado: ${peso.toFixed(formData.decimales || 2)} ${formData.unidad || 'KG'}`)
  }

  const getTipoConexionLabel = (tipo: string) => {
    return TIPOS_CONEXION.find(t => t.value === tipo)?.label || tipo
  }

  const balanzasFiltradas = balanzas.filter(b => {
    if (!searchTerm) return true
    return (
      b.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.modelo && b.modelo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.ubicacion && b.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })

  const stats = {
    total: balanzas.length,
    activas: balanzas.filter(b => b.activa).length,
    principales: balanzas.filter(b => b.esPrincipal).length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Scale className="w-8 h-8 text-amber-500" />
              Integración con Balanzas
            </h1>
            <p className="text-stone-500 mt-1">
              Configure la conexión con balanzas electrónicas
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchBalanzas} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Balanza
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-100 rounded-lg">
                  <Scale className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase">Activas</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.activas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Monitor className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase">Principal</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.principales}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel de Lectura / Peso Manual */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor className="w-5 h-5 text-amber-600" />
              Lectura de Peso
            </CardTitle>
            <CardDescription>
              Lectura automática desde balanza o ingreso manual
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lectura Automática */}
              <div className="space-y-4">
                <h4 className="font-medium text-stone-700 flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Lectura Automática
                </h4>
                <div className="bg-stone-800 rounded-lg p-6 text-center">
                  <p className="text-5xl font-bold text-emerald-400 font-mono">
                    {pesoSimulado.toFixed(formData.decimales || 2)}
                  </p>
                  <p className="text-stone-400 mt-2">{formData.unidad || 'KG'}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={iniciarLectura} 
                    disabled={leyendo}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {leyendo ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    {leyendo ? 'Leyendo...' : 'Iniciar Lectura'}
                  </Button>
                  <Button 
                    onClick={detenerLectura} 
                    disabled={!leyendo}
                    variant="destructive"
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </div>
                {leyendo && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Conectando con balanza...
                  </p>
                )}
              </div>

              {/* Ingreso Manual */}
              <div className="space-y-4">
                <h4 className="font-medium text-stone-700 flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Ingreso Manual
                </h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Peso ({formData.unidad || 'KG'})</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={pesoManual}
                      onChange={(e) => setPesoManual(e.target.value)}
                      placeholder="0.00"
                      className="text-2xl text-center h-14"
                    />
                  </div>
                  <Button onClick={handlePesoManual} className="w-full bg-amber-500 hover:bg-amber-600">
                    <Check className="w-4 h-4 mr-2" />
                    Registrar Peso
                  </Button>
                  <p className="text-xs text-stone-400 text-center">
                    Siempre disponible como alternativa a la lectura automática
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Balanzas */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <CardTitle className="text-lg">Balanzas Configuradas</CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  className="pl-9"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
              </div>
            ) : balanzasFiltradas.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <Scale className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay balanzas configuradas</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Conexión</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead className="text-center">Principal</TableHead>
                    <TableHead className="text-center">Activa</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balanzasFiltradas.map((balanza) => (
                    <TableRow key={balanza.id} className={!balanza.activa ? 'opacity-50' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{balanza.nombre}</p>
                          <p className="text-xs text-stone-400">{balanza.marca} {balanza.modelo}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {getTipoConexionLabel(balanza.tipoConexion)}
                        </Badge>
                        {balanza.tipoConexion === 'SERIAL' && balanza.puertoSerial && (
                          <p className="text-xs text-stone-400 mt-1">{balanza.puertoSerial} @ {balanza.baudRate}</p>
                        )}
                        {balanza.tipoConexion === 'TCP_IP' && balanza.direccionIP && (
                          <p className="text-xs text-stone-400 mt-1">{balanza.direccionIP}:{balanza.puertoTCP}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{balanza.ubicacion || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={balanza.esPrincipal}
                          onCheckedChange={() => handleTogglePrincipal(balanza)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={balanza.activa}
                          onCheckedChange={() => handleToggleActiva(balanza)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditar(balanza)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEliminar(balanza)}
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

        {/* Dialog Nueva/Editar Balanza */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" maximizable>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-500" />
                {balanzaEditando ? 'Editar Balanza' : 'Nueva Balanza'}
              </DialogTitle>
              <DialogDescription>
                Configure los parámetros de conexión de la balanza electrónica
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="conexion">Conexión</TabsTrigger>
                <TabsTrigger value="lectura">Lectura</TabsTrigger>
              </TabsList>

              <div className="py-4 space-y-4">
                <TabsContent value="general" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre *</Label>
                      <Input
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Ej: Balanza Principal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Conexión</Label>
                      <Select 
                        value={formData.tipoConexion} 
                        onValueChange={(v) => setFormData({ ...formData, tipoConexion: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_CONEXION.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Marca</Label>
                      <Input
                        value={formData.marca}
                        onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                        placeholder="Ej: Toledo, Mettler"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Modelo</Label>
                      <Input
                        value={formData.modelo}
                        onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                        placeholder="Ej: 8142, IND231"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ubicación</Label>
                      <Input
                        value={formData.ubicacion}
                        onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                        placeholder="Ej: Playa de Pesaje"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ID Terminal</Label>
                      <Input
                        value={formData.terminalId}
                        onChange={(e) => setFormData({ ...formData, terminalId: e.target.value })}
                        placeholder="Ej: TERMINAL-01"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.activa}
                        onCheckedChange={(v) => setFormData({ ...formData, activa: v })}
                      />
                      <Label>Activa</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.esPrincipal}
                        onCheckedChange={(v) => setFormData({ ...formData, esPrincipal: v })}
                      />
                      <Label>Es Principal</Label>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="conexion" className="space-y-4 mt-0">
                  {formData.tipoConexion === 'SERIAL' || formData.tipoConexion === 'USB' ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Puerto Serial</Label>
                          <Input
                            value={formData.puertoSerial}
                            onChange={(e) => setFormData({ ...formData, puertoSerial: e.target.value })}
                            placeholder="COM1 o /dev/ttyUSB0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Baud Rate</Label>
                          <Select 
                            value={String(formData.baudRate)} 
                            onValueChange={(v) => setFormData({ ...formData, baudRate: parseInt(v) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BAUD_RATES.map((br) => (
                                <SelectItem key={br} value={String(br)}>{br}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <p className="text-xs text-stone-400">
                        Configuración típica: 9600 baudios, 8 data bits, 1 stop bit, sin paridad
                      </p>
                    </>
                  ) : formData.tipoConexion === 'TCP_IP' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Dirección IP</Label>
                        <Input
                          value={formData.direccionIP}
                          onChange={(e) => setFormData({ ...formData, direccionIP: e.target.value })}
                          placeholder="192.168.1.100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Puerto TCP</Label>
                        <Input
                          type="number"
                          value={formData.puertoTCP}
                          onChange={(e) => setFormData({ ...formData, puertoTCP: parseInt(e.target.value) })}
                          placeholder="5000"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-amber-700 text-sm">
                        <strong>Modo Simulado:</strong> Esta configuración es para pruebas.
                        La balanza generará pesos aleatorios.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="lectura" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Intervalo de Lectura (ms)</Label>
                      <Input
                        type="number"
                        value={formData.intervaloLectura}
                        onChange={(e) => setFormData({ ...formData, intervaloLectura: parseInt(e.target.value) })}
                        placeholder="500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Timeout (ms)</Label>
                      <Input
                        type="number"
                        value={formData.timeout}
                        onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
                        placeholder="5000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Decimales</Label>
                      <Select 
                        value={String(formData.decimales)} 
                        onValueChange={(v) => setFormData({ ...formData, decimales: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Unidad</Label>
                      <Select 
                        value={formData.unidad} 
                        onValueChange={(v) => setFormData({ ...formData, unidad: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="KG">Kilogramos (KG)</SelectItem>
                          <SelectItem value="G">Gramos (G)</SelectItem>
                          <SelectItem value="LB">Libras (LB)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Observaciones</Label>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      className="w-full min-h-[80px] p-3 border rounded-lg text-sm resize-none"
                      placeholder="Notas adicionales..."
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

        {/* Dialog Eliminar */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent maximizable>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Eliminar Balanza
              </DialogTitle>
              <DialogDescription>
                ¿Está seguro que desea eliminar la balanza &quot;{balanzaEditando?.nombre}&quot;?
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

export default IntegracionBalanzasModule
