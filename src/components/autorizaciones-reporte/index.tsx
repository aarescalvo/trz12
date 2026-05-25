'use client'

import { useState, useEffect } from 'react'
import { 
  Mail, Check, X, Clock, User, FileText, Send, RefreshCw,
  Loader2, Search, Calendar, AlertCircle, CheckCircle, XCircle,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

interface Autorizacion {
  id: string
  tipoReporte: string
  resumenReporte?: string
  solicitadoPor: string
  fechaSolicitud: string
  autorizadoPor?: string
  fechaAutorizacion?: string
  estado: string
  destinatarios: string
  motivoSolicitud?: string
  motivoRechazo?: string
  enviado: boolean
  fechaEnvio?: string
}

interface Operador {
  id: string
  nombre: string
  rol: string
  puedeAutorizarReportes?: boolean
}

interface Props {
  operador: Operador
}

const TIPOS_REPORTE = [
  { value: 'FAENA_DIARIO', label: 'Resumen Diario de Faena' },
  { value: 'FAENA_SEMANAL', label: 'Resumen Semanal de Faena' },
  { value: 'STOCK_DIARIO', label: 'Stock Diario' },
  { value: 'STOCK_SEMANAL', label: 'Stock Semanal' },
  { value: 'RENDIMIENTO_DIARIO', label: 'Rendimiento Diario' },
  { value: 'RENDIMIENTO_SEMANAL', label: 'Rendimiento Semanal' },
  { value: 'RESUMEN_MENSUAL', label: 'Resumen Mensual' },
  { value: 'PERSONALIZADO', label: 'Reporte Personalizado' }
]

export function AutorizacionesReportesModule({ operador }: Props) {
  const [autorizaciones, setAutorizaciones] = useState<Autorizacion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('PENDIENTE')
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [rechazoOpen, setRechazoOpen] = useState(false)
  const [autorizacionSeleccionada, setAutorizacionSeleccionada] = useState<Autorizacion | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')

  const puedeAutorizar = operador.puedeAutorizarReportes === true

  useEffect(() => {
    fetchAutorizaciones()
  }, [filtroEstado])

  const fetchAutorizaciones = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ estado: filtroEstado })
      const res = await fetch(`/api/autorizaciones-reporte?${params}`)
      const data = await res.json()
      if (data.success) {
        setAutorizaciones(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar autorizaciones')
    } finally {
      setLoading(false)
    }
  }

  const handleVerDetalle = (aut: Autorizacion) => {
    setAutorizacionSeleccionada(aut)
    setDetalleOpen(true)
  }

  const handleAutorizar = async (aut: Autorizacion) => {
    if (!puedeAutorizar) {
      toast.error('No tiene permisos para autorizar reportes')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/autorizaciones-reporte', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: aut.id,
          accion: 'AUTORIZAR',
          autorizadoPorId: operador.id,
          autorizadoPor: operador.nombre
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Reporte autorizado correctamente')
        fetchAutorizaciones()
      } else {
        toast.error(data.error || 'Error al autorizar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleRechazar = async () => {
    if (!autorizacionSeleccionada || !motivoRechazo.trim()) {
      toast.error('Ingrese el motivo del rechazo')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/autorizaciones-reporte', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: autorizacionSeleccionada.id,
          accion: 'RECHAZAR',
          autorizadoPorId: operador.id,
          autorizadoPor: operador.nombre,
          motivoRechazo
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Reporte rechazado')
        setRechazoOpen(false)
        setMotivoRechazo('')
        fetchAutorizaciones()
      } else {
        toast.error(data.error || 'Error al rechazar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pendiente</Badge>
      case 'AUTORIZADO':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Autorizado</Badge>
      case 'RECHAZADO':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rechazado</Badge>
      case 'ENVIADO':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Enviado</Badge>
      case 'VENCIDO':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Vencido</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const getTipoReporteLabel = (tipo: string) => {
    return TIPOS_REPORTE.find(t => t.value === tipo)?.label || tipo
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const autorizacionesFiltradas = autorizaciones.filter(aut => {
    if (!searchTerm) return true
    return (
      aut.solicitadoPor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aut.tipoReporte.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aut.destinatarios.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const stats = {
    pendientes: autorizaciones.filter(a => a.estado === 'PENDIENTE').length,
    autorizados: autorizaciones.filter(a => a.estado === 'AUTORIZADO').length,
    rechazados: autorizaciones.filter(a => a.estado === 'RECHAZADO').length,
    enviados: autorizaciones.filter(a => a.estado === 'ENVIADO').length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Mail className="w-8 h-8 text-amber-500" />
              Autorizaciones de Reportes
            </h1>
            <p className="text-stone-500 mt-1">
              {puedeAutorizar 
                ? 'Autorice el envío de reportes por email' 
                : 'Solicitudes de envío de reportes'}
            </p>
          </div>
          <Button onClick={fetchAutorizaciones} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card 
            className={`border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow ${filtroEstado === 'PENDIENTE' ? 'ring-2 ring-amber-400' : ''}`}
            onClick={() => setFiltroEstado('PENDIENTE')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase">Pendientes</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.pendientes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow ${filtroEstado === 'AUTORIZADO' ? 'ring-2 ring-emerald-400' : ''}`}
            onClick={() => setFiltroEstado('AUTORIZADO')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase">Autorizados</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.autorizados}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow ${filtroEstado === 'RECHAZADO' ? 'ring-2 ring-red-400' : ''}`}
            onClick={() => setFiltroEstado('RECHAZADO')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase">Rechazados</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rechazados}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow ${filtroEstado === 'TODOS' ? 'ring-2 ring-blue-400' : ''}`}
            onClick={() => setFiltroEstado('TODOS')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Send className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{autorizaciones.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  placeholder="Buscar por solicitante, tipo o destinatario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              Solicitudes ({autorizacionesFiltradas.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : autorizacionesFiltradas.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No hay solicitudes que mostrar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Fecha</TableHead>
                      <TableHead className="font-semibold">Tipo Reporte</TableHead>
                      <TableHead className="font-semibold">Solicitante</TableHead>
                      <TableHead className="font-semibold">Destinatarios</TableHead>
                      <TableHead className="font-semibold">Estado</TableHead>
                      <TableHead className="font-semibold text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {autorizacionesFiltradas.map((aut) => (
                      <TableRow key={aut.id} className="hover:bg-stone-50">
                        <TableCell className="text-sm">
                          {formatFecha(aut.fechaSolicitud)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">
                            {getTipoReporteLabel(aut.tipoReporte)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{aut.solicitadoPor}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {aut.destinatarios}
                        </TableCell>
                        <TableCell>{getEstadoBadge(aut.estado)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleVerDetalle(aut)}
                              title="Ver detalle"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {puedeAutorizar && aut.estado === 'PENDIENTE' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleAutorizar(aut)}
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  title="Autorizar"
                                  disabled={saving}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setAutorizacionSeleccionada(aut)
                                    setRechazoOpen(true)
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Rechazar"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog Ver Detalle */}
        <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
          <DialogContent className="max-w-lg" maximizable>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-600" />
                Detalle de la Solicitud
              </DialogTitle>
            </DialogHeader>
            {autorizacionSeleccionada && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-stone-400 text-xs uppercase">Tipo Reporte</p>
                    <p className="font-medium">{getTipoReporteLabel(autorizacionSeleccionada.tipoReporte)}</p>
                  </div>
                  <div>
                    <p className="text-stone-400 text-xs uppercase">Estado</p>
                    {getEstadoBadge(autorizacionSeleccionada.estado)}
                  </div>
                  <div>
                    <p className="text-stone-400 text-xs uppercase">Solicitante</p>
                    <p className="font-medium">{autorizacionSeleccionada.solicitadoPor}</p>
                  </div>
                  <div>
                    <p className="text-stone-400 text-xs uppercase">Fecha Solicitud</p>
                    <p>{formatFecha(autorizacionSeleccionada.fechaSolicitud)}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-stone-400 text-xs uppercase mb-1">Destinatarios</p>
                  <p className="text-sm bg-stone-50 p-2 rounded">{autorizacionSeleccionada.destinatarios}</p>
                </div>

                {autorizacionSeleccionada.resumenReporte && (
                  <div>
                    <p className="text-stone-400 text-xs uppercase mb-1">Resumen del Reporte</p>
                    <p className="text-sm bg-stone-50 p-2 rounded">{autorizacionSeleccionada.resumenReporte}</p>
                  </div>
                )}

                {autorizacionSeleccionada.motivoSolicitud && (
                  <div>
                    <p className="text-stone-400 text-xs uppercase mb-1">Motivo de la Solicitud</p>
                    <p className="text-sm bg-stone-50 p-2 rounded">{autorizacionSeleccionada.motivoSolicitud}</p>
                  </div>
                )}

                {autorizacionSeleccionada.autorizadoPor && (
                  <div className="border-t pt-4">
                    <p className="text-stone-400 text-xs uppercase mb-1">Autorizado por</p>
                    <p className="font-medium">{autorizacionSeleccionada.autorizadoPor}</p>
                    {autorizacionSeleccionada.fechaAutorizacion && (
                      <p className="text-xs text-stone-400">{formatFecha(autorizacionSeleccionada.fechaAutorizacion)}</p>
                    )}
                  </div>
                )}

                {autorizacionSeleccionada.motivoRechazo && (
                  <div className="border-t pt-4">
                    <p className="text-red-600 text-xs uppercase mb-1">Motivo del Rechazo</p>
                    <p className="text-sm bg-red-50 p-2 rounded text-red-700">{autorizacionSeleccionada.motivoRechazo}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetalleOpen(false)}>
                Cerrar
              </Button>
              {puedeAutorizar && autorizacionSeleccionada?.estado === 'PENDIENTE' && (
                <Button 
                  onClick={() => {
                    setDetalleOpen(false)
                    handleAutorizar(autorizacionSeleccionada)
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Autorizar
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Rechazo */}
        <Dialog open={rechazoOpen} onOpenChange={setRechazoOpen}>
          <DialogContent className="max-w-md" maximizable>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" />
                Rechazar Solicitud
              </DialogTitle>
              <DialogDescription>
                Ingrese el motivo del rechazo. Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo del Rechazo *</Label>
                <Textarea
                  id="motivo"
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Ej: El reporte contiene información incorrecta..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRechazoOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleRechazar} 
                disabled={saving || !motivoRechazo.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {saving ? 'Rechazando...' : 'Rechazar Solicitud'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default AutorizacionesReportesModule
