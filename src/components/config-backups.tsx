// NOTA: Componente disponible para uso futuro - verificar antes de eliminar
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Archive,
  Play,
  Clock,
  HardDrive,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Settings,
  Bell,
  Calendar,
  Trash2,
  FileCheck,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

interface Operador {
  id: string
  nombre: string
  rol: string
  permisos: {
    puedeAdminSistema: boolean
    puedeConfiguracion: boolean
  }
}

interface ConfigBackupsProps {
  operador: Operador | null
}

// Interfaces para datos
interface BackupConfig {
  id: string
  enabled: boolean
  frecuencia: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
  hora: number
  minuto: number
  diaSemana: number | null
  diaMes: number | null
  retencionDias: number
  maxBackups: number
  destino: 'LOCAL' | 'GOOGLE_DRIVE' | 'FTP' | 'S3'
  rutaDestino: string | null
  compresion: boolean
  incluirArchivos: boolean
  verificarIntegridad: boolean
  notificarExito: boolean
  notificarFallo: boolean
  emailNotificacion: string | null
  ultimoBackup: string | null
  proximoBackup: string | null
  ultimoEstado: string
  ultimoError: string | null
  totalBackups: number
  espacioUsado: number
}

interface BackupFile {
  name: string
  size: string
  date: string
  type: string
}

interface SchedulerStatus {
  running: boolean
  cronExpression: string | null
}

export function ConfigBackupsModule({ operador }: ConfigBackupsProps) {
  // Estados principales
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [runningBackup, setRunningBackup] = useState(false)
  
  // Configuración
  const [config, setConfig] = useState<BackupConfig | null>(null)
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null)
  
  // Form state
  const [enabled, setEnabled] = useState(false)
  const [frecuencia, setFrecuencia] = useState<string>('DAILY')
  const [hora, setHora] = useState(3)
  const [minuto, setMinuto] = useState(0)
  const [diaSemana, setDiaSemana] = useState<number | null>(null)
  const [diaMes, setDiaMes] = useState<number | null>(null)
  const [retencionDias, setRetencionDias] = useState(30)
  const [maxBackups, setMaxBackups] = useState(10)
  const [destino, setDestino] = useState<string>('LOCAL')
  const [compresion, setCompresion] = useState(true)
  const [verificarIntegridad, setVerificarIntegridad] = useState(true)
  const [notificarExito, setNotificarExito] = useState(false)
  const [notificarFallo, setNotificarFallo] = useState(true)
  const [emailNotificacion, setEmailNotificacion] = useState('')
  
  // Backups disponibles
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [loadingBackups, setLoadingBackups] = useState(false)

  // Cargar configuración al inicio
  useEffect(() => {
    loadConfig()
    loadBackups()
  }, [])

  // Actualizar form cuando cambia la configuración
  useEffect(() => {
    if (config) {
      setEnabled(config.enabled)
      setFrecuencia(config.frecuencia)
      setHora(config.hora)
      setMinuto(config.minuto)
      setDiaSemana(config.diaSemana)
      setDiaMes(config.diaMes)
      setRetencionDias(config.retencionDias)
      setMaxBackups(config.maxBackups)
      setDestino(config.destino)
      setCompresion(config.compresion)
      setVerificarIntegridad(config.verificarIntegridad)
      setNotificarExito(config.notificarExito)
      setNotificarFallo(config.notificarFallo)
      setEmailNotificacion(config.emailNotificacion || '')
    }
  }, [config])

  // ==================== CARGA DE DATOS ====================

  const loadConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/backups-config')
      const data = await response.json()

      if (data.success) {
        setConfig(data.data.config)
        setSchedulerStatus(data.data.scheduler)
      } else {
        toast.error('Error al cargar configuración')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const loadBackups = async () => {
    setLoadingBackups(true)
    try {
      const response = await fetch('/api/admin/backups')
      const data = await response.json()

      if (data.success) {
        setBackups(data.data.backups)
      }
    } catch (error) {
      console.error('Error cargando backups:', error)
    } finally {
      setLoadingBackups(false)
    }
  }

  // ==================== ACCIONES ====================

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/backups-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          frecuencia,
          hora,
          minuto,
          diaSemana: frecuencia === 'WEEKLY' ? diaSemana : null,
          diaMes: frecuencia === 'MONTHLY' ? diaMes : null,
          retencionDias,
          maxBackups,
          destino,
          compresion,
          verificarIntegridad,
          notificarExito,
          notificarFallo,
          emailNotificacion: emailNotificacion || null
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Configuración guardada')
        setConfig(data.data.config)
        setSchedulerStatus(data.data.scheduler)
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleRunBackup = async () => {
    setRunningBackup(true)
    try {
      const response = await fetch('/api/admin/backups-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'runNow' })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Backup ejecutado correctamente')
        loadBackups()
        loadConfig()
      } else {
        toast.error(data.error || 'Error al ejecutar backup')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setRunningBackup(false)
    }
  }

  const handleCleanup = async () => {
    try {
      const response = await fetch('/api/admin/backups-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup' })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        loadBackups()
        loadConfig()
      } else {
        toast.error(data.error || 'Error al limpiar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }

  const handleVerifyBackup = async (fileName: string) => {
    try {
      const response = await fetch('/api/admin/backups-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', fileName })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Backup verificado correctamente')
      } else {
        toast.error(data.message || 'Error en verificación')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }

  const handleDeleteBackup = async (fileName: string) => {
    try {
      const response = await fetch(`/api/admin/backups?file=${encodeURIComponent(fileName)}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Backup eliminado')
        loadBackups()
        loadConfig()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }

  // ==================== HELPERS ====================

  const formatFrequency = (freq: string): string => {
    const frequencies: Record<string, string> = {
      'HOURLY': 'Cada hora',
      'DAILY': 'Diario',
      'WEEKLY': 'Semanal',
      'MONTHLY': 'Mensual'
    }
    return frequencies[freq] || freq
  }

  const formatDayOfWeek = (day: number | null): string => {
    if (day === null) return '-'
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return days[day]
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusBadge = (estado: string) => {
    const variants: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline'; icon: typeof CheckCircle; label: string }> = {
      'PENDIENTE': { variant: 'secondary', icon: Clock, label: 'Pendiente' },
      'EN_PROGRESO': { variant: 'default', icon: Loader2, label: 'En progreso' },
      'COMPLETADO': { variant: 'default', icon: CheckCircle, label: 'Completado' },
      'FALLIDO': { variant: 'destructive', icon: XCircle, label: 'Fallido' },
      'VERIFICANDO': { variant: 'secondary', icon: FileCheck, label: 'Verificando' }
    }
    const status = variants[estado] || variants['PENDIENTE']
    const Icon = status.icon
    
    return (
      <Badge variant={status.variant} className="flex items-center gap-1">
        <Icon className={`w-3 h-3 ${estado === 'EN_PROGRESO' || estado === 'VERIFICANDO' ? 'animate-spin' : ''}`} />
        {status.label}
      </Badge>
    )
  }

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-3">
            <Archive className="w-8 h-8 text-amber-500" />
            Configuración de Backups Automáticos
          </h1>
          <p className="text-stone-500 mt-1">
            Configure los backups automáticos de la base de datos
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Panel izquierdo - Configuración */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Estado del Scheduler */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Estado del Programador
                  </span>
                  <div className="flex items-center gap-2">
                    {schedulerStatus?.running ? (
                      <Badge className="bg-green-500 text-white flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Inactivo
                      </Badge>
                    )}
                    <Switch
                      checked={enabled}
                      onCheckedChange={setEnabled}
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {config && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 bg-stone-100 rounded-lg">
                      <p className="text-sm text-stone-500">Último Backup</p>
                      <p className="font-medium">
                        {config.ultimoBackup 
                          ? new Date(config.ultimoBackup).toLocaleString('es-AR')
                          : 'Nunca'}
                      </p>
                    </div>
                    <div className="p-3 bg-stone-100 rounded-lg">
                      <p className="text-sm text-stone-500">Próximo Backup</p>
                      <p className="font-medium">
                        {config.proximoBackup && enabled
                          ? new Date(config.proximoBackup).toLocaleString('es-AR')
                          : 'No programado'}
                      </p>
                    </div>
                    <div className="p-3 bg-stone-100 rounded-lg">
                      <p className="text-sm text-stone-500">Estado</p>
                      {getStatusBadge(config.ultimoEstado)}
                    </div>
                    <div className="p-3 bg-stone-100 rounded-lg">
                      <p className="text-sm text-stone-500">Total de Backups</p>
                      <p className="font-medium">{config.totalBackups}</p>
                    </div>
                  </div>
                )}

                {config?.ultimoError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Último Error</p>
                        <p className="text-sm text-red-600">{config.ultimoError}</p>
                      </div>
                    </div>
                  </div>
                )}

                {schedulerStatus?.cronExpression && (
                  <div className="text-xs text-stone-400">
                    Cron: {schedulerStatus.cronExpression}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configuración de Programación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Programación
                </CardTitle>
                <CardDescription>
                  Configure cuándo se ejecutarán los backups automáticos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Frecuencia */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frecuencia">Frecuencia</Label>
                    <Select value={frecuencia} onValueChange={setFrecuencia}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HOURLY">Cada hora</SelectItem>
                        <SelectItem value="DAILY">Diario</SelectItem>
                        <SelectItem value="WEEKLY">Semanal</SelectItem>
                        <SelectItem value="MONTHLY">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Hora de ejecución</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Select value={hora.toString()} onValueChange={(v) => setHora(Number(v))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {i.toString().padStart(2, '0')}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Select value={minuto.toString()} onValueChange={(v) => setMinuto(Number(v))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[0, 15, 30, 45].map(m => (
                              <SelectItem key={m} value={m.toString()}>
                                :{m.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Día de la semana (solo si es semanal) */}
                {frecuencia === 'WEEKLY' && (
                  <div className="space-y-2">
                    <Label>Día de la semana</Label>
                    <Select 
                      value={diaSemana?.toString() ?? '0'} 
                      onValueChange={(v) => setDiaSemana(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((day, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Día del mes (solo si es mensual) */}
                {frecuencia === 'MONTHLY' && (
                  <div className="space-y-2">
                    <Label>Día del mes</Label>
                    <Select 
                      value={diaMes?.toString() ?? '1'} 
                      onValueChange={(v) => setDiaMes(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            Día {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Retención */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="retencion">Días de retención</Label>
                    <Input
                      id="retencion"
                      type="number"
                      min={1}
                      max={365}
                      value={retencionDias}
                      onChange={(e) => setRetencionDias(Number(e.target.value))}
                    />
                    <p className="text-xs text-stone-400">Backups más antiguos se eliminarán</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxBackups">Máximo de backups</Label>
                    <Input
                      id="maxBackups"
                      type="number"
                      min={1}
                      max={100}
                      value={maxBackups}
                      onChange={(e) => setMaxBackups(Number(e.target.value))}
                    />
                    <p className="text-xs text-stone-400">Límite máximo de archivos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Opciones avanzadas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Opciones Avanzadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Destino */}
                <div className="space-y-2">
                  <Label htmlFor="destino">Destino</Label>
                  <Select value={destino} onValueChange={setDestino}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOCAL">Local (disco del servidor)</SelectItem>
                      <SelectItem value="GOOGLE_DRIVE" disabled>Google Drive (próximamente)</SelectItem>
                      <SelectItem value="FTP" disabled>FTP (próximamente)</SelectItem>
                      <SelectItem value="S3" disabled>Amazon S3 (próximamente)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Opciones */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Compresión</Label>
                      <p className="text-xs text-stone-400">Comprimir backups para ahorrar espacio</p>
                    </div>
                    <Switch checked={compresion} onCheckedChange={setCompresion} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Verificar integridad</Label>
                      <p className="text-xs text-stone-400">Verificar backup después de crearlo</p>
                    </div>
                    <Switch checked={verificarIntegridad} onCheckedChange={setVerificarIntegridad} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notificaciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notificaciones
                </CardTitle>
                <CardDescription>
                  Configure notificaciones por email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificar éxitos</Label>
                    <p className="text-xs text-stone-400">Enviar email cuando backup sea exitoso</p>
                  </div>
                  <Switch checked={notificarExito} onCheckedChange={setNotificarExito} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificar fallos</Label>
                    <p className="text-xs text-stone-400">Enviar email cuando backup falle</p>
                  </div>
                  <Switch checked={notificarFallo} onCheckedChange={setNotificarFallo} />
                </div>

                {(notificarExito || notificarFallo) && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de notificación</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@ejemplo.com"
                      value={emailNotificacion}
                      onChange={(e) => setEmailNotificacion(e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleSaveConfig}
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Archive className="w-4 h-4 mr-2" />
                )}
                Guardar Configuración
              </Button>

              <Button
                variant="outline"
                onClick={handleRunBackup}
                disabled={runningBackup}
              >
                {runningBackup ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Ejecutar Ahora
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpiar Antiguos
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Limpiar backups antiguos?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se eliminarán los backups que excedan el límite configurado ({maxBackups}) 
                      o sean más antiguos de {retencionDias} días.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCleanup}>
                      Limpiar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Panel derecho - Lista de backups */}
          <div className="space-y-6">
            
            {/* Estadísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  Espacio Utilizado
                </CardTitle>
              </CardHeader>
              <CardContent>
                {config && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Total:</span>
                      <span className="font-medium">{formatBytes(config.espacioUsado * 1024 * 1024)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Archivos:</span>
                      <span className="font-medium">{backups.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Reserva:</span>
                      <span className="font-medium">{retencionDias} días</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lista de backups */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Archive className="w-5 h-5" />
                    Backups Disponibles
                  </span>
                  <Button variant="ghost" size="sm" onClick={loadBackups}>
                    <RefreshCw className={`w-4 h-4 ${loadingBackups ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingBackups ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                  </div>
                ) : backups.length === 0 ? (
                  <div className="text-center py-8 text-stone-400">
                    <Archive className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hay backups</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {backups.map((backup, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-sm truncate">{backup.name}</p>
                            <p className="text-xs text-stone-500">
                              {backup.size} • {new Date(backup.date).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVerifyBackup(backup.name)}
                              title="Verificar"
                            >
                              <FileCheck className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-600"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar backup?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El archivo "{backup.name}" será eliminado permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteBackup(backup.name)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info adicional */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Información</p>
                    <ul className="text-xs space-y-1">
                      <li>• Los backups se almacenan en el servidor</li>
                      <li>• Se recomienda programar backups nocturnos</li>
                      <li>• Verifique periódicamente la integridad</li>
                      <li>• Configure notificaciones para fallos</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfigBackupsModule
