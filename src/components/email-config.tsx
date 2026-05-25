// NOTA: Componente disponible para uso futuro - verificar antes de eliminar
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Mail,
  Users,
  Clock,
  History,
  TestTube,
  Plus,
  Pencil,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Save,
} from 'lucide-react'

// Tipos
interface Destinatario {
  id: string
  nombre: string
  email: string
  activo: boolean
  recibeStock: boolean
  recibeFaena: boolean
  recibeRendimiento: boolean
  recibeAlertas: boolean
  observaciones?: string
  createdAt: string
}

interface Programacion {
  id: string
  nombre: string
  tipoReporte: string
  frecuencia: string
  horaEnvio: number
  diaSemana?: number
  diaMes?: number
  destinatarios: string
  destinatariosData: { id: string; nombre: string; email: string }[]
  activo: boolean
  ultimoEnvio?: string
  proximoEnvio?: string
  incluirGraficos: boolean
  formato: string
  observaciones?: string
}

interface HistorialItem {
  id: string
  tipoReporte: string
  asunto: string
  destinatarioEmail: string
  estado: string
  fechaEnvio: string
  fechaProcesado?: string
  error?: string
  destinatario?: { nombre: string; email: string }
  programacion?: { nombre: string }
}

interface SMTPConfig {
  configured: boolean
  host: string
  puerto: number
  usuario: string
  habilitado: boolean
  nombreEmpresa?: string
}

const TIPOS_REPORTE = [
  { value: 'STOCK_DIARIO', label: 'Stock Diario' },
  { value: 'STOCK_SEMANAL', label: 'Stock Semanal' },
  { value: 'FAENA_DIARIO', label: 'Faena Diario' },
  { value: 'FAENA_SEMANAL', label: 'Faena Semanal' },
  { value: 'RENDIMIENTO_DIARIO', label: 'Rendimiento Diario' },
  { value: 'RENDIMIENTO_SEMANAL', label: 'Rendimiento Semanal' },
  { value: 'ALERTA_STOCK_BAJO', label: 'Alerta Stock Bajo' },
  { value: 'ALERTA_CAMARA', label: 'Alerta Cámara' },
  { value: 'RESUMEN_MENSUAL', label: 'Resumen Mensual' },
  { value: 'PERSONALIZADO', label: 'Personalizado' },
]

const FRECUENCIAS = [
  { value: 'DIARIO', label: 'Diario' },
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'QUINCENAL', label: 'Quincenal' },
  { value: 'MENSUAL', label: 'Mensual' },
  { value: 'MANUAL', label: 'Solo Manual' },
]

const DIAS_SEMANA = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Lunes' },
  { value: '2', label: 'Martes' },
  { value: '3', label: 'Miércoles' },
  { value: '4', label: 'Jueves' },
  { value: '5', label: 'Viernes' },
  { value: '6', label: 'Sábado' },
]

const FORMATOS = [
  { value: 'PDF', label: 'PDF' },
  { value: 'EXCEL', label: 'Excel' },
  { value: 'AMBOS', label: 'PDF y Excel' },
]

export function EmailConfig() {
  // Estados
  const [smtpConfig, setSmtpConfig] = useState<SMTPConfig>({
    configured: false,
    host: '',
    puerto: 587,
    usuario: '',
    habilitado: false,
  })
  const [smtpForm, setSmtpForm] = useState({
    host: '',
    puerto: 587,
    usuario: '',
    password: '',
    habilitado: true,
  })
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([])
  const [programaciones, setProgramaciones] = useState<Programacion[]>([])
  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Estados de diálogos
  const [destinatarioDialogOpen, setDestinatarioDialogOpen] = useState(false)
  const [programacionDialogOpen, setProgramacionDialogOpen] = useState(false)
  const [envioManualDialogOpen, setEnvioManualDialogOpen] = useState(false)

  // Estados de edición
  const [editandoDestinatario, setEditandoDestinatario] = useState<Destinatario | null>(null)
  const [editandoProgramacion, setEditandoProgramacion] = useState<Programacion | null>(null)

  // Formularios
  const [destinatarioForm, setDestinatarioForm] = useState({
    nombre: '',
    email: '',
    activo: true,
    recibeStock: false,
    recibeFaena: false,
    recibeRendimiento: false,
    recibeAlertas: false,
    observaciones: '',
  })

  const [programacionForm, setProgramacionForm] = useState({
    nombre: '',
    tipoReporte: 'STOCK_DIARIO',
    frecuencia: 'DIARIO',
    horaEnvio: 8,
    diaSemana: '',
    diaMes: '',
    destinatarios: [] as string[],
    activo: true,
    incluirGraficos: true,
    formato: 'PDF',
    observaciones: '',
  })

  const [envioManualForm, setEnvioManualForm] = useState({
    destinatarios: [] as string[],
    asunto: '',
    cuerpo: '',
    tipoReporte: 'PERSONALIZADO',
  })

  // Cargar datos iniciales
  const loadSmtpConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/email/test')
      const data = await res.json()
      setSmtpConfig(data)
      if (data.configured) {
        setSmtpForm(prev => ({
          ...prev,
          host: data.host,
          puerto: data.puerto,
          usuario: data.usuario,
          habilitado: data.habilitado,
        }))
      }
    } catch {
      console.error('Error al cargar configuración SMTP')
    }
  }, [])

  const loadDestinatarios = useCallback(async () => {
    try {
      const res = await fetch('/api/email/destinatarios')
      const data = await res.json()
      setDestinatarios(data)
    } catch {
      console.error('Error al cargar destinatarios')
    }
  }, [])

  const loadProgramaciones = useCallback(async () => {
    try {
      const res = await fetch('/api/email/programaciones')
      const data = await res.json()
      setProgramaciones(data)
    } catch {
      console.error('Error al cargar programaciones')
    }
  }, [])

  const loadHistorial = useCallback(async () => {
    try {
      const res = await fetch('/api/email/send?limit=50')
      const data = await res.json()
      setHistorial(data.data || [])
    } catch {
      console.error('Error al cargar historial')
    }
  }, [])

  useEffect(() => {
    loadSmtpConfig()
    loadDestinatarios()
    loadProgramaciones()
    loadHistorial()
  }, [loadSmtpConfig, loadDestinatarios, loadProgramaciones, loadHistorial])

  // Funciones SMTP
  const handleSaveSmtp = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/email/test', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpForm),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Configuración SMTP guardada')
        loadSmtpConfig()
      } else {
        toast.error(data.error || 'Error al guardar configuración')
      }
    } catch {
      toast.error('Error al guardar configuración SMTP')
    } finally {
      setLoading(false)
    }
  }

  const handleTestSmtp = async () => {
    if (!testEmail) {
      toast.error('Ingrese un email para la prueba')
      return
    }
    setLoading(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailPrueba: testEmail }),
      })
      const data = await res.json()
      setTestResult(data)
      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Error al probar conexión SMTP')
    } finally {
      setLoading(false)
    }
  }

  // Funciones Destinatarios
  const handleSaveDestinatario = async () => {
    if (!destinatarioForm.nombre || !destinatarioForm.email) {
      toast.error('Nombre y email son requeridos')
      return
    }
    setLoading(true)
    try {
      const url = '/api/email/destinatarios'
      const method = editandoDestinatario ? 'PUT' : 'POST'
      const body = editandoDestinatario
        ? { ...destinatarioForm, id: editandoDestinatario.id }
        : destinatarioForm

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success(editandoDestinatario ? 'Destinatario actualizado' : 'Destinatario creado')
        setDestinatarioDialogOpen(false)
        resetDestinatarioForm()
        loadDestinatarios()
      }
    } catch {
      toast.error('Error al guardar destinatario')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDestinatario = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este destinatario?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/email/destinatarios?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success('Destinatario eliminado')
        loadDestinatarios()
      }
    } catch {
      toast.error('Error al eliminar destinatario')
    } finally {
      setLoading(false)
    }
  }

  const openEditDestinatario = (dest: Destinatario) => {
    setEditandoDestinatario(dest)
    setDestinatarioForm({
      nombre: dest.nombre,
      email: dest.email,
      activo: dest.activo,
      recibeStock: dest.recibeStock,
      recibeFaena: dest.recibeFaena,
      recibeRendimiento: dest.recibeRendimiento,
      recibeAlertas: dest.recibeAlertas,
      observaciones: dest.observaciones || '',
    })
    setDestinatarioDialogOpen(true)
  }

  const resetDestinatarioForm = () => {
    setDestinatarioForm({
      nombre: '',
      email: '',
      activo: true,
      recibeStock: false,
      recibeFaena: false,
      recibeRendimiento: false,
      recibeAlertas: false,
      observaciones: '',
    })
    setEditandoDestinatario(null)
  }

  // Funciones Programaciones
  const handleSaveProgramacion = async () => {
    if (!programacionForm.nombre || programacionForm.destinatarios.length === 0) {
      toast.error('Nombre y al menos un destinatario son requeridos')
      return
    }
    setLoading(true)
    try {
      const url = '/api/email/programaciones'
      const method = editandoProgramacion ? 'PUT' : 'POST'
      const body = {
        ...programacionForm,
        id: editandoProgramacion?.id,
        diaSemana: programacionForm.diaSemana ? parseInt(programacionForm.diaSemana) : null,
        diaMes: programacionForm.diaMes ? parseInt(programacionForm.diaMes) : null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success(editandoProgramacion ? 'Programación actualizada' : 'Programación creada')
        setProgramacionDialogOpen(false)
        resetProgramacionForm()
        loadProgramaciones()
      }
    } catch {
      toast.error('Error al guardar programación')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProgramacion = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta programación?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/email/programaciones?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success('Programación eliminada')
        loadProgramaciones()
      }
    } catch {
      toast.error('Error al eliminar programación')
    } finally {
      setLoading(false)
    }
  }

  const openEditProgramacion = (prog: Programacion) => {
    setEditandoProgramacion(prog)
    setProgramacionForm({
      nombre: prog.nombre,
      tipoReporte: prog.tipoReporte,
      frecuencia: prog.frecuencia,
      horaEnvio: prog.horaEnvio,
      diaSemana: prog.diaSemana?.toString() || '',
      diaMes: prog.diaMes?.toString() || '',
      destinatarios: prog.destinatariosData.map(d => d.id),
      activo: prog.activo,
      incluirGraficos: prog.incluirGraficos,
      formato: prog.formato,
      observaciones: prog.observaciones || '',
    })
    setProgramacionDialogOpen(true)
  }

  const resetProgramacionForm = () => {
    setProgramacionForm({
      nombre: '',
      tipoReporte: 'STOCK_DIARIO',
      frecuencia: 'DIARIO',
      horaEnvio: 8,
      diaSemana: '',
      diaMes: '',
      destinatarios: [],
      activo: true,
      incluirGraficos: true,
      formato: 'PDF',
      observaciones: '',
    })
    setEditandoProgramacion(null)
  }

  // Envío manual
  const handleEnvioManual = async () => {
    if (!envioManualForm.asunto || envioManualForm.destinatarios.length === 0) {
      toast.error('Asunto y al menos un destinatario son requeridos')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinatarios: envioManualForm.destinatarios,
          asunto: envioManualForm.asunto,
          cuerpo: envioManualForm.cuerpo,
          cuerpoHtml: envioManualForm.cuerpo.replace(/\n/g, '<br>'),
          tipoReporte: envioManualForm.tipoReporte,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Email enviado correctamente')
        setEnvioManualDialogOpen(false)
        setEnvioManualForm({
          destinatarios: [],
          asunto: '',
          cuerpo: '',
          tipoReporte: 'PERSONALIZADO',
        })
        loadHistorial()
      } else {
        toast.error(data.error || 'Error al enviar email')
      }
    } catch {
      toast.error('Error al enviar email')
    } finally {
      setLoading(false)
    }
  }

  // Helpers
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'ENVIADO':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Enviado</Badge>
      case 'PENDIENTE':
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Pendiente</Badge>
      case 'ERROR':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Error</Badge>
      case 'ENVIANDO':
        return <Badge variant="default"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Enviando</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const getTipoReporteLabel = (tipo: string) => {
    const found = TIPOS_REPORTE.find(t => t.value === tipo)
    return found?.label || tipo
  }

  const getFrecuenciaLabel = (frec: string) => {
    const found = FRECUENCIAS.find(f => f.value === frec)
    return found?.label || frec
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Configuración de Email
        </CardTitle>
        <CardDescription>
          Configure el servidor SMTP, destinatarios y programación de reportes automáticos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="smtp" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="smtp" className="flex items-center gap-1">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">SMTP</span>
            </TabsTrigger>
            <TabsTrigger value="destinatarios" className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Destinatarios</span>
            </TabsTrigger>
            <TabsTrigger value="programacion" className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Programación</span>
            </TabsTrigger>
            <TabsTrigger value="historial" className="flex items-center gap-1">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Historial</span>
            </TabsTrigger>
            <TabsTrigger value="prueba" className="flex items-center gap-1">
              <TestTube className="w-4 h-4" />
              <span className="hidden sm:inline">Prueba</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab SMTP */}
          <TabsContent value="smtp" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Habilitar envío de emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Active para permitir el envío de reportes por email
                  </p>
                </div>
                <Switch
                  checked={smtpForm.habilitado}
                  onCheckedChange={(checked) => setSmtpForm(prev => ({ ...prev, habilitado: checked }))}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="host">Servidor SMTP</Label>
                  <Input
                    id="host"
                    placeholder="smtp.office365.com"
                    value={smtpForm.host}
                    onChange={(e) => setSmtpForm(prev => ({ ...prev, host: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="puerto">Puerto</Label>
                  <Input
                    id="puerto"
                    type="number"
                    placeholder="587"
                    value={smtpForm.puerto}
                    onChange={(e) => setSmtpForm(prev => ({ ...prev, puerto: parseInt(e.target.value) || 587 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usuario">Usuario / Email</Label>
                  <Input
                    id="usuario"
                    placeholder="usuario@empresa.com"
                    value={smtpForm.usuario}
                    onChange={(e) => setSmtpForm(prev => ({ ...prev, usuario: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={smtpForm.password}
                    onChange={(e) => setSmtpForm(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveSmtp} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Configuración
                </Button>
              </div>

              {smtpConfig.configured && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Configuración actual</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Servidor:</strong> {smtpConfig.host}:{smtpConfig.puerto}</p>
                    <p><strong>Usuario:</strong> {smtpConfig.usuario}</p>
                    <p><strong>Estado:</strong> {smtpConfig.habilitado ? 
                      <Badge variant="default" className="bg-green-600">Habilitado</Badge> : 
                      <Badge variant="secondary">Deshabilitado</Badge>
                    }</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab Destinatarios */}
          <TabsContent value="destinatarios" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Destinatarios de Reportes</h3>
              <Button onClick={() => { resetDestinatarioForm(); setDestinatarioDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Destinatario
              </Button>
            </div>

            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Reportes</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {destinatarios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No hay destinatarios configurados
                      </TableCell>
                    </TableRow>
                  ) : (
                    destinatarios.map((dest) => (
                      <TableRow key={dest.id}>
                        <TableCell className="font-medium">{dest.nombre}</TableCell>
                        <TableCell>{dest.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {dest.recibeStock && <Badge variant="outline" className="text-xs">Stock</Badge>}
                            {dest.recibeFaena && <Badge variant="outline" className="text-xs">Faena</Badge>}
                            {dest.recibeRendimiento && <Badge variant="outline" className="text-xs">Rendimiento</Badge>}
                            {dest.recibeAlertas && <Badge variant="outline" className="text-xs">Alertas</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {dest.activo ? 
                            <Badge variant="default" className="bg-green-600">Activo</Badge> : 
                            <Badge variant="secondary">Inactivo</Badge>
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditDestinatario(dest)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteDestinatario(dest.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          {/* Tab Programación */}
          <TabsContent value="programacion" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Programación de Reportes</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEnvioManualDialogOpen(true)}>
                  <Send className="w-4 h-4 mr-2" />
                  Envío Manual
                </Button>
                <Button onClick={() => { resetProgramacionForm(); setProgramacionDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Programación
                </Button>
              </div>
            </div>

            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Frecuencia</TableHead>
                    <TableHead>Destinatarios</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programaciones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No hay programaciones configuradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    programaciones.map((prog) => (
                      <TableRow key={prog.id}>
                        <TableCell className="font-medium">{prog.nombre}</TableCell>
                        <TableCell>{getTipoReporteLabel(prog.tipoReporte)}</TableCell>
                        <TableCell>{getFrecuenciaLabel(prog.frecuencia)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {prog.destinatariosData.slice(0, 2).map((d) => (
                              <Badge key={d.id} variant="outline" className="text-xs">{d.nombre}</Badge>
                            ))}
                            {prog.destinatariosData.length > 2 && (
                              <Badge variant="outline" className="text-xs">+{prog.destinatariosData.length - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {prog.activo ? 
                            <Badge variant="default" className="bg-green-600">Activo</Badge> : 
                            <Badge variant="secondary">Inactivo</Badge>
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditProgramacion(prog)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteProgramacion(prog.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          {/* Tab Historial */}
          <TabsContent value="historial" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Historial de Envíos</h3>
              <Button variant="outline" size="sm" onClick={loadHistorial}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>

            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Asunto</TableHead>
                    <TableHead>Destinatario</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historial.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No hay envíos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    historial.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">
                          {new Date(item.fechaEnvio).toLocaleString('es-AR')}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{item.asunto}</TableCell>
                        <TableCell>{item.destinatario?.nombre || item.destinatarioEmail}</TableCell>
                        <TableCell>{getTipoReporteLabel(item.tipoReporte)}</TableCell>
                        <TableCell>{getEstadoBadge(item.estado)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          {/* Tab Prueba */}
          <TabsContent value="prueba" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Probar Conexión SMTP</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Envíe un email de prueba para verificar que la configuración SMTP funciona correctamente
                </p>
              </div>

              <div className="grid gap-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="testEmail">Email de prueba</Label>
                  <div className="flex gap-2">
                    <Input
                      id="testEmail"
                      type="email"
                      placeholder="destino@ejemplo.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                    />
                    <Button onClick={handleTestSmtp} disabled={loading}>
                      <TestTube className="w-4 h-4 mr-2" />
                      Probar
                    </Button>
                  </div>
                </div>
              </div>

              {testResult && (
                <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                      {testResult.message}
                    </span>
                  </div>
                </div>
              )}

              {!smtpConfig.configured && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="text-yellow-800">
                      Debe configurar el servidor SMTP primero
                    </span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Dialog Destinatario */}
      <Dialog open={destinatarioDialogOpen} onOpenChange={setDestinatarioDialogOpen}>
        <DialogContent className="max-w-md" maximizable>
          <DialogHeader>
            <DialogTitle>
              {editandoDestinatario ? 'Editar Destinatario' : 'Nuevo Destinatario'}
            </DialogTitle>
            <DialogDescription>
              Configure los datos del destinatario y los tipos de reportes que recibirá
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="destNombre">Nombre</Label>
              <Input
                id="destNombre"
                value={destinatarioForm.nombre}
                onChange={(e) => setDestinatarioForm(prev => ({ ...prev, nombre: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destEmail">Email</Label>
              <Input
                id="destEmail"
                type="email"
                value={destinatarioForm.email}
                onChange={(e) => setDestinatarioForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Activo</Label>
              <Switch
                checked={destinatarioForm.activo}
                onCheckedChange={(checked) => setDestinatarioForm(prev => ({ ...prev, activo: checked }))}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Tipos de reportes a recibir</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recibeStock"
                    checked={destinatarioForm.recibeStock}
                    onCheckedChange={(checked) => setDestinatarioForm(prev => ({ ...prev, recibeStock: !!checked }))}
                  />
                  <Label htmlFor="recibeStock" className="font-normal">Stock</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recibeFaena"
                    checked={destinatarioForm.recibeFaena}
                    onCheckedChange={(checked) => setDestinatarioForm(prev => ({ ...prev, recibeFaena: !!checked }))}
                  />
                  <Label htmlFor="recibeFaena" className="font-normal">Faena</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recibeRendimiento"
                    checked={destinatarioForm.recibeRendimiento}
                    onCheckedChange={(checked) => setDestinatarioForm(prev => ({ ...prev, recibeRendimiento: !!checked }))}
                  />
                  <Label htmlFor="recibeRendimiento" className="font-normal">Rendimiento</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recibeAlertas"
                    checked={destinatarioForm.recibeAlertas}
                    onCheckedChange={(checked) => setDestinatarioForm(prev => ({ ...prev, recibeAlertas: !!checked }))}
                  />
                  <Label htmlFor="recibeAlertas" className="font-normal">Alertas</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="destObs">Observaciones</Label>
              <Textarea
                id="destObs"
                value={destinatarioForm.observaciones}
                onChange={(e) => setDestinatarioForm(prev => ({ ...prev, observaciones: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDestinatarioDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveDestinatario} disabled={loading}>
              {editandoDestinatario ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Programación */}
      <Dialog open={programacionDialogOpen} onOpenChange={setProgramacionDialogOpen}>
        <DialogContent className="max-w-lg" maximizable>
          <DialogHeader>
            <DialogTitle>
              {editandoProgramacion ? 'Editar Programación' : 'Nueva Programación'}
            </DialogTitle>
            <DialogDescription>
              Configure la programación de envío automático de reportes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="progNombre">Nombre de la programación</Label>
              <Input
                id="progNombre"
                value={programacionForm.nombre}
                onChange={(e) => setProgramacionForm(prev => ({ ...prev, nombre: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Reporte</Label>
                <Select
                  value={programacionForm.tipoReporte}
                  onValueChange={(value) => setProgramacionForm(prev => ({ ...prev, tipoReporte: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_REPORTE.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frecuencia</Label>
                <Select
                  value={programacionForm.frecuencia}
                  onValueChange={(value) => setProgramacionForm(prev => ({ ...prev, frecuencia: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FRECUENCIAS.map((frec) => (
                      <SelectItem key={frec.value} value={frec.value}>
                        {frec.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Hora de envío</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={programacionForm.horaEnvio}
                  onChange={(e) => setProgramacionForm(prev => ({ ...prev, horaEnvio: parseInt(e.target.value) || 8 }))}
                />
              </div>
              {programacionForm.frecuencia === 'SEMANAL' && (
                <div className="space-y-2">
                  <Label>Día de la semana</Label>
                  <Select
                    value={programacionForm.diaSemana}
                    onValueChange={(value) => setProgramacionForm(prev => ({ ...prev, diaSemana: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIAS_SEMANA.map((dia) => (
                        <SelectItem key={dia.value} value={dia.value}>
                          {dia.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {programacionForm.frecuencia === 'MENSUAL' && (
                <div className="space-y-2">
                  <Label>Día del mes</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={programacionForm.diaMes}
                    onChange={(e) => setProgramacionForm(prev => ({ ...prev, diaMes: e.target.value }))}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Destinatarios</Label>
              <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                {destinatarios.filter(d => d.activo).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay destinatarios activos</p>
                ) : (
                  destinatarios.filter(d => d.activo).map((dest) => (
                    <div key={dest.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dest-${dest.id}`}
                        checked={programacionForm.destinatarios.includes(dest.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setProgramacionForm(prev => ({
                              ...prev,
                              destinatarios: [...prev.destinatarios, dest.id]
                            }))
                          } else {
                            setProgramacionForm(prev => ({
                              ...prev,
                              destinatarios: prev.destinatarios.filter(id => id !== dest.id)
                            }))
                          }
                        }}
                      />
                      <Label htmlFor={`dest-${dest.id}`} className="font-normal">
                        {dest.nombre} ({dest.email})
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Formato</Label>
                <Select
                  value={programacionForm.formato}
                  onValueChange={(value) => setProgramacionForm(prev => ({ ...prev, formato: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATOS.map((fmt) => (
                      <SelectItem key={fmt.value} value={fmt.value}>
                        {fmt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between pt-6">
                <Label>Incluir gráficos</Label>
                <Switch
                  checked={programacionForm.incluirGraficos}
                  onCheckedChange={(checked) => setProgramacionForm(prev => ({ ...prev, incluirGraficos: checked }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Activo</Label>
              <Switch
                checked={programacionForm.activo}
                onCheckedChange={(checked) => setProgramacionForm(prev => ({ ...prev, activo: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgramacionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProgramacion} disabled={loading}>
              {editandoProgramacion ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Envío Manual */}
      <Dialog open={envioManualDialogOpen} onOpenChange={setEnvioManualDialogOpen}>
        <DialogContent className="max-w-lg" maximizable>
          <DialogHeader>
            <DialogTitle>Envío Manual de Email</DialogTitle>
            <DialogDescription>
              Envíe un email personalizado a los destinatarios seleccionados
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Destinatarios</Label>
              <div className="border rounded-lg p-3 max-h-32 overflow-y-auto space-y-2">
                {destinatarios.filter(d => d.activo).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay destinatarios activos</p>
                ) : (
                  destinatarios.filter(d => d.activo).map((dest) => (
                    <div key={dest.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`env-${dest.id}`}
                        checked={envioManualForm.destinatarios.includes(dest.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEnvioManualForm(prev => ({
                              ...prev,
                              destinatarios: [...prev.destinatarios, dest.id]
                            }))
                          } else {
                            setEnvioManualForm(prev => ({
                              ...prev,
                              destinatarios: prev.destinatarios.filter(id => id !== dest.id)
                            }))
                          }
                        }}
                      />
                      <Label htmlFor={`env-${dest.id}`} className="font-normal">
                        {dest.nombre} ({dest.email})
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Reporte</Label>
              <Select
                value={envioManualForm.tipoReporte}
                onValueChange={(value) => setEnvioManualForm(prev => ({ ...prev, tipoReporte: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_REPORTE.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="envAsunto">Asunto</Label>
              <Input
                id="envAsunto"
                value={envioManualForm.asunto}
                onChange={(e) => setEnvioManualForm(prev => ({ ...prev, asunto: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="envCuerpo">Mensaje</Label>
              <Textarea
                id="envCuerpo"
                value={envioManualForm.cuerpo}
                onChange={(e) => setEnvioManualForm(prev => ({ ...prev, cuerpo: e.target.value }))}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnvioManualDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEnvioManual} disabled={loading}>
              <Send className="w-4 h-4 mr-2" />
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
