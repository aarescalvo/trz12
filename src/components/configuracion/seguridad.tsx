'use client'

import { useState, useEffect } from 'react'
import {
  Shield, Lock, Key, Clock, Users, AlertTriangle, Ban, History,
  Save, RefreshCw, Plus, Trash2, Eye, EyeOff, Check, X,
  Smartphone, Monitor, Tablet, Globe, Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ConfiguracionSeguridad {
  id: string
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireLowercase: boolean
  passwordRequireNumbers: boolean
  passwordRequireSpecialChars: boolean
  passwordMaxAge: number
  sessionTimeout: number
  maxConcurrentSessions: number
  maxLoginAttempts: number
  lockoutDuration: number
  notifyNewIp: boolean
  notifyFailedAttempts: boolean
  notifyPasswordChange: boolean
  notifyOutOfHoursAccess: boolean
  restrictedHoursEnabled: boolean
  allowedHourStart: number | null
  allowedHourEnd: number | null
}

interface IpBloqueada {
  id: string
  ip: string
  motivo: string
  fechaBloqueo: string
  fechaExpiracion: string | null
  activo: boolean
}

interface Sesion {
  id: string
  operadorId: string
  operador: { nombre: string; usuario: string }
  token: string
  fechaInicio: string
  fechaExpiracion: string
  ultimaActividad: string
  ip: string | null
  userAgent: string | null
  dispositivo: string | null
  activa: boolean
  motivoCierre: string | null
}

interface IntentoLogin {
  id: string
  ip: string
  usuario: string | null
  operadorId: string | null
  exitoso: boolean
  motivo: string | null
  fecha: string
  userAgent: string | null
}

const defaultConfig: ConfiguracionSeguridad = {
  id: '',
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: false,
  passwordMaxAge: 90,
  sessionTimeout: 480,
  maxConcurrentSessions: 1,
  maxLoginAttempts: 5,
  lockoutDuration: 30,
  notifyNewIp: true,
  notifyFailedAttempts: true,
  notifyPasswordChange: true,
  notifyOutOfHoursAccess: false,
  restrictedHoursEnabled: false,
  allowedHourStart: null,
  allowedHourEnd: null
}

export function SeguridadConfig() {
  const [config, setConfig] = useState<ConfiguracionSeguridad>(defaultConfig)
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [ipsBloqueadas, setIpsBloqueadas] = useState<IpBloqueada[]>([])
  const [intentosLogin, setIntentosLogin] = useState<IntentoLogin[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Dialogs
  const [addIpDialogOpen, setAddIpDialogOpen] = useState(false)
  const [newIp, setNewIp] = useState('')
  const [newIpMotivo, setNewIpMotivo] = useState('MANUAL')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [configRes, sesionesRes, ipsRes, intentosRes] = await Promise.all([
        fetch('/api/seguridad/config'),
        fetch('/api/seguridad/sesiones'),
        fetch('/api/seguridad/ips-bloqueadas'),
        fetch('/api/seguridad/intentos-login')
      ])

      if (configRes.ok) {
        const configData = await configRes.json()
        if (configData.success) {
          setConfig(configData.data || defaultConfig)
        }
      }

      if (sesionesRes.ok) {
        const sesionesData = await sesionesRes.json()
        if (sesionesData.success) {
          setSesiones(sesionesData.data)
        }
      }

      if (ipsRes.ok) {
        const ipsData = await ipsRes.json()
        if (ipsData.success) {
          setIpsBloqueadas(ipsData.data)
        }
      }

      if (intentosRes.ok) {
        const intentosData = await intentosRes.json()
        if (intentosData.success) {
          setIntentosLogin(intentosData.data)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar datos de seguridad')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/seguridad/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Configuración guardada')
      } else {
        toast.error('Error al guardar configuración')
      }
    } catch (error) {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleAddIpBloqueada = async () => {
    if (!newIp) {
      toast.error('Ingrese una dirección IP')
      return
    }

    try {
      const res = await fetch('/api/seguridad/ips-bloqueadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: newIp, motivo: newIpMotivo })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('IP bloqueada')
        setAddIpDialogOpen(false)
        setNewIp('')
        fetchData()
      }
    } catch (error) {
      toast.error('Error al bloquear IP')
    }
  }

  const handleRemoveIpBloqueada = async (id: string) => {
    try {
      const res = await fetch(`/api/seguridad/ips-bloqueadas/${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        toast.success('IP desbloqueada')
        fetchData()
      }
    } catch (error) {
      toast.error('Error al desbloquear IP')
    }
  }

  const handleCerrarSesion = async (sesionId: string) => {
    try {
      const res = await fetch(`/api/seguridad/sesiones/${sesionId}/cerrar`, {
        method: 'POST'
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Sesión cerrada')
        fetchData()
      }
    } catch (error) {
      toast.error('Error al cerrar sesión')
    }
  }

  const parseUserAgent = (ua: string | null) => {
    if (!ua) return { browser: '-', os: '-', device: 'Desktop' }
    const uaLower = ua.toLowerCase()
    let browser = '-', os = '-', device = 'Desktop'

    if (uaLower.includes('firefox')) browser = 'Firefox'
    else if (uaLower.includes('edg')) browser = 'Edge'
    else if (uaLower.includes('chrome')) browser = 'Chrome'
    else if (uaLower.includes('safari')) browser = 'Safari'

    if (uaLower.includes('windows')) os = 'Windows'
    else if (uaLower.includes('mac')) os = 'macOS'
    else if (uaLower.includes('linux')) os = 'Linux'
    else if (uaLower.includes('android')) os = 'Android'
    else if (uaLower.includes('iphone') || uaLower.includes('ipad')) os = 'iOS'

    if (uaLower.includes('mobile') || uaLower.includes('iphone')) device = 'Mobile'
    else if (uaLower.includes('tablet') || uaLower.includes('ipad')) device = 'Tablet'

    return { browser, os, device }
  }

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'Mobile': return <Smartphone className="w-4 h-4" />
      case 'Tablet': return <Tablet className="w-4 h-4" />
      default: return <Monitor className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            <Shield className="w-7 h-7 text-stone-600" />
            Configuración de Seguridad
          </h2>
          <p className="text-stone-500">Gestiona la seguridad del sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={handleSaveConfig} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </div>

      <Tabs defaultValue="politicas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="politicas">Políticas</TabsTrigger>
          <TabsTrigger value="sesiones">Sesiones Activas</TabsTrigger>
          <TabsTrigger value="bloqueos">Bloqueos</TabsTrigger>
          <TabsTrigger value="intentos">Intentos de Login</TabsTrigger>
        </TabsList>

        {/* Pestaña Políticas */}
        <TabsContent value="politicas" className="space-y-6">
          {/* Políticas de contraseña */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Política de Contraseñas
              </CardTitle>
              <CardDescription>
                Configura los requisitos de seguridad para las contraseñas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Longitud mínima</Label>
                  <Input
                    type="number"
                    min={4}
                    max={32}
                    value={config.passwordMinLength}
                    onChange={(e) => setConfig({ ...config, passwordMinLength: parseInt(e.target.value) || 8 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vencimiento (días)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={365}
                    value={config.passwordMaxAge}
                    onChange={(e) => setConfig({ ...config, passwordMaxAge: parseInt(e.target.value) || 90 })}
                  />
                  <p className="text-xs text-stone-400">0 = sin vencimiento</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div>
                    <Label>Requerir mayúsculas</Label>
                    <p className="text-xs text-stone-400">Al menos una letra mayúscula</p>
                  </div>
                  <Switch
                    checked={config.passwordRequireUppercase}
                    onCheckedChange={(checked) => setConfig({ ...config, passwordRequireUppercase: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div>
                    <Label>Requerir minúsculas</Label>
                    <p className="text-xs text-stone-400">Al menos una letra minúscula</p>
                  </div>
                  <Switch
                    checked={config.passwordRequireLowercase}
                    onCheckedChange={(checked) => setConfig({ ...config, passwordRequireLowercase: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div>
                    <Label>Requerir números</Label>
                    <p className="text-xs text-stone-400">Al menos un dígito</p>
                  </div>
                  <Switch
                    checked={config.passwordRequireNumbers}
                    onCheckedChange={(checked) => setConfig({ ...config, passwordRequireNumbers: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div>
                    <Label>Requerir caracteres especiales</Label>
                    <p className="text-xs text-stone-400">Ej: !@#$%^&*</p>
                  </div>
                  <Switch
                    checked={config.passwordRequireSpecialChars}
                    onCheckedChange={(checked) => setConfig({ ...config, passwordRequireSpecialChars: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración de sesión */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Configuración de Sesión
              </CardTitle>
              <CardDescription>
                Controla el tiempo y cantidad de sesiones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Tiempo de sesión (minutos)</Label>
                  <Input
                    type="number"
                    min={5}
                    max={1440}
                    value={config.sessionTimeout}
                    onChange={(e) => setConfig({ ...config, sessionTimeout: parseInt(e.target.value) || 480 })}
                  />
                  <p className="text-xs text-stone-400">480 = 8 horas</p>
                </div>
                <div className="space-y-2">
                  <Label>Sesiones concurrentes máx.</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={config.maxConcurrentSessions}
                    onChange={(e) => setConfig({ ...config, maxConcurrentSessions: parseInt(e.target.value) || 1 })}
                  />
                  <p className="text-xs text-stone-400">Por usuario</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Control de intentos */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Control de Intentos de Login
              </CardTitle>
              <CardDescription>
                Protección contra ataques de fuerza bruta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Intentos máximos</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={config.maxLoginAttempts}
                    onChange={(e) => setConfig({ ...config, maxLoginAttempts: parseInt(e.target.value) || 5 })}
                  />
                  <p className="text-xs text-stone-400">Antes de bloquear</p>
                </div>
                <div className="space-y-2">
                  <Label>Duración del bloqueo (min)</Label>
                  <Input
                    type="number"
                    min={5}
                    max={1440}
                    value={config.lockoutDuration}
                    onChange={(e) => setConfig({ ...config, lockoutDuration: parseInt(e.target.value) || 30 })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notificaciones */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Alertas de Seguridad
              </CardTitle>
              <CardDescription>
                Configura cuándo recibir notificaciones de seguridad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div>
                    <Label>Login desde IP nueva</Label>
                    <p className="text-xs text-stone-400">Alertar cuando un usuario accede desde una IP desconocida</p>
                  </div>
                  <Switch
                    checked={config.notifyNewIp}
                    onCheckedChange={(checked) => setConfig({ ...config, notifyNewIp: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div>
                    <Label>Intentos fallidos</Label>
                    <p className="text-xs text-stone-400">Alertar múltiples intentos fallidos</p>
                  </div>
                  <Switch
                    checked={config.notifyFailedAttempts}
                    onCheckedChange={(checked) => setConfig({ ...config, notifyFailedAttempts: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div>
                    <Label>Cambio de contraseña</Label>
                    <p className="text-xs text-stone-400">Notificar cuando se cambia la contraseña</p>
                  </div>
                  <Switch
                    checked={config.notifyPasswordChange}
                    onCheckedChange={(checked) => setConfig({ ...config, notifyPasswordChange: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div>
                    <Label>Acceso fuera de horario</Label>
                    <p className="text-xs text-stone-400">Alertar accesos en horarios no laborales</p>
                  </div>
                  <Switch
                    checked={config.notifyOutOfHoursAccess}
                    onCheckedChange={(checked) => setConfig({ ...config, notifyOutOfHoursAccess: checked })}
                  />
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div>
                    <Label>Restringir horario de acceso</Label>
                    <p className="text-xs text-stone-400">Solo permitir acceso en horario laboral</p>
                  </div>
                  <Switch
                    checked={config.restrictedHoursEnabled}
                    onCheckedChange={(checked) => setConfig({ ...config, restrictedHoursEnabled: checked })}
                  />
                </div>

                {config.restrictedHoursEnabled && (
                  <div className="grid grid-cols-2 gap-4 pl-4">
                    <div className="space-y-2">
                      <Label>Hora inicio</Label>
                      <Select
                        value={String(config.allowedHourStart || 8)}
                        onValueChange={(val) => setConfig({ ...config, allowedHourStart: parseInt(val) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={String(i)}>
                              {String(i).padStart(2, '0')}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Hora fin</Label>
                      <Select
                        value={String(config.allowedHourEnd || 18)}
                        onValueChange={(val) => setConfig({ ...config, allowedHourEnd: parseInt(val) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={String(i)}>
                              {String(i).padStart(2, '0')}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña Sesiones */}
        <TabsContent value="sesiones" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Sesiones Activas ({sesiones.filter(s => s.activa).length})
              </CardTitle>
              <CardDescription>
                Usuarios actualmente conectados al sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sesiones.length === 0 ? (
                <div className="text-center py-8 text-stone-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay sesiones activas</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Inicio</TableHead>
                      <TableHead>Última actividad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sesiones.map((sesion) => {
                      const ua = parseUserAgent(sesion.userAgent)
                      return (
                        <TableRow key={sesion.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sesion.operador.nombre}</p>
                              <p className="text-xs text-stone-400">{sesion.operador.usuario}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(ua.device)}
                              <div>
                                <p className="text-sm">{ua.browser}</p>
                                <p className="text-xs text-stone-400">{ua.os}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-mono text-sm">{sesion.ip || '-'}</p>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(sesion.fechaInicio), 'dd/MM/yy HH:mm', { locale: es })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(sesion.ultimaActividad), 'dd/MM/yy HH:mm', { locale: es })}
                          </TableCell>
                          <TableCell>
                            <Badge className={sesion.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                              {sesion.activa ? 'Activa' : (sesion.motivoCierre || 'Cerrada')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sesion.activa && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleCerrarSesion(sesion.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña Bloqueos */}
        <TabsContent value="bloqueos" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Ban className="w-5 h-5" />
                  IPs Bloqueadas
                </CardTitle>
                <CardDescription>
                  Direcciones IP bloqueadas por seguridad o manualmente
                </CardDescription>
              </div>
              <Button onClick={() => setAddIpDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Bloquear IP
              </Button>
            </CardHeader>
            <CardContent>
              {ipsBloqueadas.length === 0 ? (
                <div className="text-center py-8 text-stone-400">
                  <Ban className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay IPs bloqueadas</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Fecha bloqueo</TableHead>
                      <TableHead>Expiración</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ipsBloqueadas.map((ip) => (
                      <TableRow key={ip.id}>
                        <TableCell>
                          <p className="font-mono">{ip.ip}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{ip.motivo}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(ip.fechaBloqueo), 'dd/MM/yy HH:mm', { locale: es })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {ip.fechaExpiracion
                            ? format(new Date(ip.fechaExpiracion), 'dd/MM/yy HH:mm', { locale: es })
                            : 'Permanente'}
                        </TableCell>
                        <TableCell>
                          <Badge className={ip.activo ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}>
                            {ip.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ip.activo && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleRemoveIpBloqueada(ip.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña Intentos de Login */}
        <TabsContent value="intentos" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Historial de Intentos de Login
              </CardTitle>
              <CardDescription>
                Registro de los últimos intentos de acceso al sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {intentosLogin.length === 0 ? (
                <div className="text-center py-8 text-stone-400">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay registros de intentos</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Usuario intentado</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Dispositivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {intentosLogin.slice(0, 50).map((intento) => {
                      const ua = parseUserAgent(intento.userAgent)
                      return (
                        <TableRow key={intento.id}>
                          <TableCell className="text-sm">
                            {format(new Date(intento.fecha), 'dd/MM/yy HH:mm:ss', { locale: es })}
                          </TableCell>
                          <TableCell>
                            <p className="font-mono text-sm">{intento.ip}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{intento.usuario || '-'}</p>
                          </TableCell>
                          <TableCell>
                            <Badge className={intento.exitoso ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                              {intento.exitoso ? 'Exitoso' : 'Fallido'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {intento.motivo || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1">
                              {getDeviceIcon(ua.device)}
                              <span>{ua.browser}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog agregar IP bloqueada */}
      <Dialog open={addIpDialogOpen} onOpenChange={setAddIpDialogOpen}>
        <DialogContent maximizable>
          <DialogHeader>
            <DialogTitle>Bloquear Dirección IP</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Dirección IP</Label>
              <Input
                placeholder="192.168.1.1"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Select value={newIpMotivo} onValueChange={setNewIpMotivo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">Bloqueo manual</SelectItem>
                  <SelectItem value="BRUTE_FORCE">Ataque de fuerza bruta</SelectItem>
                  <SelectItem value="SUSPICIOUS_ACTIVITY">Actividad sospechosa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddIpDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddIpBloqueada}>
              Bloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SeguridadConfig
