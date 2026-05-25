'use client'

import { useState, useEffect } from 'react'
import {
  FileText, Download, Send, AlertCircle, CheckCircle, Clock, FileBarChart, RefreshCw, Eye, Trash2, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'
import { generateSenasaPDF, type SenasaReportData } from '@/lib/senasa-pdf-generator'

interface Operador { id: string; nombre: string; rol: string }

interface ReporteSenasa {
  id: string
  tipoReporte: string
  periodo: string
  fechaDesde: string
  fechaHasta: string
  estado: 'PENDIENTE' | 'ENVIADO' | 'CONFIRMADO' | 'ERROR' | 'ANULADO'
  mensajeError?: string | null
  fechaEnvio?: string | null
  fechaConfirmacion?: string | null
  archivoNombre?: string | null
  archivoUrl?: string | null
  observaciones?: string | null
  operador?: { id: string; nombre: string } | null
  createdAt: string
}

const TIPOS_REPORTE = [
  { value: 'FAENA_MENSUAL', label: 'Faena Mensual' },
  { value: 'EXISTENCIAS', label: 'Existencias' },
  { value: 'MOVIMIENTOS', label: 'Movimientos' },
  { value: 'DECOMISOS', label: 'Decomisos' },
  { value: 'PRODUCCION', label: 'Producción' },
  { value: 'STOCK', label: 'Stock' }
]

export function ReportesSenasaModule({ operador }: { operador: Operador }) {
  const { editMode, getTexto } = useEditor()
  const [reportes, setReportes] = useState<ReporteSenasa[]>([])
  const [loading, setLoading] = useState(true)
  const [generando, setGenerando] = useState(false)
  const [tipoReporte, setTipoReporte] = useState<string>('')
  const [fechaDesde, setFechaDesde] = useState<string>('')
  const [fechaHasta, setFechaHasta] = useState<string>('')
  const [observaciones, setObservaciones] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detalleOpen, setDetalleOpen] = useState<ReporteSenasa | null>(null)
  const [descargandoId, setDescargandoId] = useState<string | null>(null)

  useEffect(() => {
    fetchReportes()
  }, [])

  const fetchReportes = async () => {
    setLoading(true)
    try {
    const res = await fetch('/api/reportes-senasa')
    const data = await res.json()
    if (data.success) {
      setReportes(data.data || [])
    }
  } catch (error) {
    console.error('Error fetching reportes:', error)
    toast.error('Error al cargar reportes')
  } finally {
    setLoading(false)
  }
  }

  const totalReportes = reportes.length
  const enviados = reportes.filter(r => r.estado === 'ENVIADO' || r.estado === 'CONFIRMADO').length
  const pendientes = reportes.filter(r => r.estado === 'PENDIENTE').length
  const conError = reportes.filter(r => r.estado === 'ERROR').length

  const generarReporte = async () => {
    if (!tipoReporte) { toast.error('Seleccione un tipo de reporte'); return }
    if (!fechaDesde || !fechaHasta) { toast.error('Seleccione el rango de fechas'); return }

    setGenerando(true)
    try {
    const tipoSeleccionado = TIPOS_REPORTE.find(t => t.value === tipoReporte)
    
    const res = await fetch('/api/reportes-senasa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipoReporte: tipoReporte,
        fechaDesde,
        fechaHasta,
        periodo: `${fechaDesde} - ${fechaHasta}`,
        observaciones: observaciones || null,
        operadorId: operador.id
      })
    })

    const data = await res.json()
    
    if (data.success) {
      toast.success('Reporte generado exitosamente')
      setReportes([data.data, ...reportes])
      setTipoReporte('')
      setFechaDesde('')
      setFechaHasta('')
      setObservaciones('')
      setDialogOpen(false)
    } else {
      toast.error(data.error || 'Error al generar reporte')
    }
  } catch (error) {
    console.error('Error:', error)
    toast.error('Error de conexión')
  } finally {
    setGenerando(false)
  }
  }

  const handleDescargar = async (reporte: ReporteSenasa) => {
    if (reporte.archivoUrl) {
      window.open(reporte.archivoUrl, '_blank')
      toast.success('Descargando archivo...')
      return
    }

    setDescargandoId(reporte.id)
    toast.info('Generando PDF para SENASA...')

    try {
      const reportData: SenasaReportData = {
        tipo: reporte.tipoReporte,
        periodo: reporte.periodo,
        datos: [],
        establecimiento: {
          nombre: 'Solemar Alimentaria',
          numero: '12345',
          cuit: '30-12345678-9',
          direccion: 'Ruta 2 Km 45, San Cayetano, Buenos Aires',
        },
      }

      const blob = await generateSenasaPDF(reportData)

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_senasa_${reporte.tipoReporte.toLowerCase()}_${reporte.id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('PDF de SENASA generado correctamente')
    } catch (error) {
      console.error('Error generando PDF SENASA:', error)
      toast.error('Error al generar el PDF de SENASA')
    } finally {
      setDescargandoId(null)
    }
  }

  const handleReenviar = async (reporte: ReporteSenasa) => {
    toast.info(`Reenviando reporte...`)
    
    try {
    const res = await fetch('/api/reportes-senasa', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: reporte.id,
        estado: 'ENVIADO'
      })
    })

    const data = await res.json()
    
    if (data.success) {
      setReportes(reportes.map(r => 
        r.id === reporte.id ? { ...r, estado: 'ENVIADO', fechaEnvio: new Date().toISOString() } : r
      ))
      toast.success('Reporte reenviado exitosamente a SENASA')
    } else {
      toast.error(data.error || 'Error al reenviar')
    }
  } catch (error) {
    toast.error('Error de conexión')
  }
  }

  const handleEliminar = async (reporte: ReporteSenasa) => {
    if (!confirm('¿Está seguro de eliminar este reporte?')) return
    
    try {
      const res = await fetch(`/api/reportes-senasa?id=${reporte.id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        setReportes(reportes.filter(r => r.id !== reporte.id))
        toast.success('Reporte eliminado')
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      toast.error('Error al eliminar reporte')
    }
  }

  const getEstadoBadge = (estado: ReporteSenasa['estado']) => {
    switch (estado) {
      case 'CONFIRMADO':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />CONFIRMADO</Badge>
      case 'ENVIADO':
        return <Badge className="bg-blue-100 text-blue-700"><Send className="w-3 h-3 mr-1" />ENVIADO</Badge>
      case 'PENDIENTE':
        return <Badge className="bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1" />PENDIENTE</Badge>
      case 'ERROR':
        return <Badge className="bg-red-100 text-red-700"><AlertCircle className="w-3 h-3 mr-1" />ERROR</Badge>
      case 'ANULADO':
        return <Badge className="bg-gray-100 text-gray-700">ANULADO</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800">
                <TextoEditable id="titulo-reportes-senasa" original="Reportes SENASA" tag="span" />
              </h1>
              <p className="text-stone-500">
                <TextoEditable id="subtitulo-reportes-senasa" original="Generación y envío de reportes al Servicio Nacional de Sanidad y Calidad Agroalimentaria" tag="span" />
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchReportes}>
                <RefreshCw className="w-4 h-4 mr-2" />
                <TextoEditable id="btn-actualizar-senasa" original="Actualizar" tag="span" />
              </Button>
              <Button onClick={() => setDialogOpen(true)} className="bg-amber-500 hover:bg-amber-600">
                <FileText className="w-4 h-4 mr-2" />
                Nuevo Reporte
              </Button>
            </div>
          </div>
        </EditableBlock>

        {/* Summary Cards */}
        <EditableBlock bloqueId="resumen" label="Tarjetas de Resumen">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-stone-100 rounded-lg">
                    <FileBarChart className="w-5 h-5 text-stone-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-stone-800">{totalReportes}</p>
                    <p className="text-xs text-stone-500">
                      <TextoEditable id="label-total-reportes-senasa" original="Total Reportes" tag="span" />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-700">{enviados}</p>
                    <p className="text-xs text-stone-500">
                      <TextoEditable id="label-enviados-senasa" original="Enviados" tag="span" />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-700">{pendientes}</p>
                    <p className="text-xs text-stone-500">
                      <TextoEditable id="label-pendientes-senasa" original="Pendientes" tag="span" />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-700">{conError}</p>
                    <p className="text-xs text-stone-500">
                      <TextoEditable id="label-con-error-senasa" original="Con Error" tag="span" />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </EditableBlock>

        {/* Tabla de Reportes */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-stone-800">
              <FileBarChart className="w-5 h-5 text-amber-500" />
              <TextoEditable id="titulo-historial-senasa" original="Historial de Reportes" tag="span" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                <p className="text-stone-400 mt-2">Cargando reportes...</p>
              </div>
            ) : reportes.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay reportes generados</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo Reporte</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportes.map((reporte) => (
                    <TableRow key={reporte.id}>
                      <TableCell className="font-medium">
                        {new Date(reporte.createdAt).toLocaleDateString('es-AR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-stone-400" />
                          {TIPOS_REPORTE.find(t => t.value === reporte.tipoReporte)?.label || reporte.tipoReporte}
                        </div>
                      </TableCell>
                      <TableCell className="text-stone-600">{reporte.periodo}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getEstadoBadge(reporte.estado)}
                          {reporte.mensajeError && (
                            <span className="text-xs text-red-500">{reporte.mensajeError}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setDetalleOpen(reporte)} title="Ver detalle">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDescargar(reporte)} title="Descargar PDF" disabled={descargandoId === reporte.id}>
                            {descargandoId === reporte.id ? (
                              <Loader2 className="w-4 h-4 text-stone-500 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 text-stone-500" />
                            )}
                          </Button>
                          {(reporte.estado === 'PENDIENTE' || reporte.estado === 'ERROR') && (
                            <Button variant="ghost" size="sm" onClick={() => handleReenviar(reporte)} title="Reenviar a SENASA">
                              <Send className="w-4 h-4 text-amber-500" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleEliminar(reporte)} title="Eliminar" className="text-red-500">
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

        {/* Footer Info */}
        <div className="text-center text-xs text-stone-400">
          <p>Los reportes son enviados automáticamente al sistema de SENASA</p>
          <p className="mt-1">Última sincronización: {new Date().toLocaleString('es-AR')}</p>
        </div>

        {/* Dialog Nuevo Reporte */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent maximizable>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                Generar Nuevo Reporte
              </DialogTitle>
              <DialogDescription>
                Complete los datos para generar un nuevo reporte SENASA
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Reporte</Label>
                <Select value={tipoReporte} onValueChange={setTipoReporte}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_REPORTE.map(tipo => (
                      <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Desde</Label>
                  <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Hasta</Label>
                  <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea 
                  value={observaciones} 
                  onChange={(e) => setObservaciones(e.target.value)} 
                  placeholder="Observaciones adicionales..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={generarReporte} disabled={generando} className="bg-amber-500 hover:bg-amber-600">
                {generando ? 'Generando...' : 'Generar Reporte'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Detalle */}
        <Dialog open={!!detalleOpen} onOpenChange={() => setDetalleOpen(null)}>
          <DialogContent maximizable>
            <DialogHeader>
              <DialogTitle>Detalle del Reporte</DialogTitle>
            </DialogHeader>
            {detalleOpen && (
              <div className="space-y-3 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-stone-400">ID:</span><br/>{detalleOpen.id}</div>
                  <div><span className="text-stone-400">Tipo:</span><br/>{detalleOpen.tipoReporte}</div>
                  <div><span className="text-stone-400">Período:</span><br/>{detalleOpen.periodo}</div>
                  <div><span className="text-stone-400">Estado:</span><br/>{getEstadoBadge(detalleOpen.estado)}</div>
                </div>
                {detalleOpen.archivoNombre && (
                  <div className="text-sm">
                    <span className="text-stone-400">Archivo:</span> {detalleOpen.archivoNombre}
                  </div>
                )}
                {detalleOpen.observaciones && (
                  <div className="text-sm">
                    <span className="text-stone-400">Observaciones:</span><br/>{detalleOpen.observaciones}
                  </div>
                )}
                {detalleOpen.fechaEnvio && (
                  <div className="text-sm">
                    <span className="text-stone-400">Fecha Envío:</span>{' '}
                    {new Date(detalleOpen.fechaEnvio).toLocaleString('es-AR')}
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetalleOpen(null)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default ReportesSenasaModule
