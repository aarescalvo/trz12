'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Bell, AlertTriangle, CheckCircle, Package, Settings, RefreshCw,
  TrendingDown, ShieldAlert, Clock, Eye, Trash2, XCircle
} from 'lucide-react'

interface Props {
  operador?: { id: string; nombre: string; rol: string }
}

interface AlertaItem {
  id: string
  tipo: string
  entidad: string
  entidadId?: string
  entidadNombre: string
  stockActual: number
  stockMinimo?: number | null
  stockDeseado?: number | null
  camaraId?: string
  camara?: { nombre: string }
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  estado: 'ACTIVA' | 'DESCARTADA' | 'RESUELTA'
  fechaResolucion?: string
  createdAt: string
  updatedAt: string
}

interface Resumen {
  criticas: number
  altas: number
  medias: number
  bajas: number
  total: number
}

const PRIORIDAD_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  CRITICA: { color: 'bg-red-100 text-red-700 border-red-200', icon: 'ShieldAlert', label: 'Critica' },
  ALTA:    { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: 'AlertTriangle', label: 'Alta' },
  MEDIA:   { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: 'TrendingDown', label: 'Media' },
  BAJA:    { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: 'Clock', label: 'Baja' },
}

const TIPO_LABELS: Record<string, string> = {
  STOCK_BAJO: 'Stock Bajo',
  STOCK_CRITICO: 'Stock Critico',
  VENCIMIENTO_PROXIMO: 'Vencimiento Proximo',
  VENCIMIENTO_VENCIDO: 'Vencido',
}

const ENTIDAD_LABELS: Record<string, string> = {
  PRODUCTO: 'Producto',
  MEDIA_RES: 'Media Res',
  CAJA: 'Caja',
  INSUMO: 'Insumo',
}

export function AlertasStockModule({ operador }: Props) {
  const [loading, setLoading] = useState(true)
  const [alertas, setAlertas] = useState<AlertaItem[]>([])
  const [resumen, setResumen] = useState<Resumen>({ criticas: 0, altas: 0, medias: 0, bajas: 0, total: 0 })
  const [filtroPrioridad, setFiltroPrioridad] = useState('todas')
  const [filtroTipo, setFiltroTipo] = useState('todas')
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [alertaSeleccionada, setAlertaSeleccionada] = useState<AlertaItem | null>(null)

  const fetchAlertas = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroPrioridad !== 'todas') params.append('prioridad', filtroPrioridad)
      if (filtroTipo !== 'todas') params.append('tipo', filtroTipo)

      const res = await fetch(`/api/alertas/stock?${params}`)
      const data = await res.json()
      if (data.alertas) setAlertas(data.alertas)
      if (data.resumen) setResumen(data.resumen)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar alertas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAlertas() }, [filtroPrioridad, filtroTipo])

  const handleDescartar = async (alerta: AlertaItem) => {
    try {
      const res = await fetch('/api/alertas/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'descartar', alertaId: alerta.id })
      })
      const data = await res.json()
      if (data.success) { toast.success('Alerta descartada'); fetchAlertas() }
    } catch { toast.error('Error al descartar') }
  }

  const handleResolver = async () => {
    if (!alertaSeleccionada) return
    try {
      const res = await fetch('/api/alertas/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolver', alertaId: alertaSeleccionada.id, operadorId: operador?.id })
      })
      const data = await res.json()
      if (data.success) { toast.success('Alerta resuelta'); setDetalleOpen(false); fetchAlertas() }
    } catch { toast.error('Error al resolver') }
  }

  const handleGenerar = async () => {
    try {
      const res = await fetch('/api/alertas/stock/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullScan: true })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`${data.creadas || 0} alertas generadas, ${data.actualizadas || 0} actualizadas`)
        fetchAlertas()
      }
    } catch { toast.error('Error al generar alertas') }
  }

  const getPrioridadConfig = (p: string) => PRIORIDAD_CONFIG[p] || PRIORIDAD_CONFIG.MEDIA

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Bell className="w-7 h-7 text-stone-600" />
              Alertas de Stock
            </h1>
            <p className="text-stone-500 mt-1">Notificaciones de stock bajo, critico y vencimientos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleGenerar}>
              <RefreshCw className="w-4 h-4 mr-1" /> Generar Alertas
            </Button>
            <Button variant="outline" size="sm" onClick={fetchAlertas}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(Object.entries(PRIORIDAD_CONFIG) as [string, typeof PRIORIDAD_CONFIG.CRITICA][]).map(([key, config]) => {
            const Icon = config.icon === 'ShieldAlert' ? ShieldAlert : config.icon === 'TrendingDown' ? TrendingDown : config.icon === 'AlertTriangle' ? AlertTriangle : Clock
            const count = resumen[key.toLowerCase() as keyof Resumen] || 0
            return (
              <Card key={key} className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.color.split(' ')[0]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">{config.label}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Prioridad" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las prioridades</SelectItem>
                  {Object.entries(PRIORIDAD_CONFIG).map(([k, c]) => (
                    <SelectItem key={k} value={k}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos los tipos</SelectItem>
                  {Object.entries(TIPO_LABELS).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5" /> Alertas Activas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-stone-400">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <p>Cargando...</p>
              </div>
            ) : alertas.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-lg">No hay alertas activas</p>
                <p className="text-sm">El stock esta dentro de los parametros normales</p>
              </div>
            ) : (
              <div className="divide-y">
                {alertas.map((alerta) => {
                  const config = getPrioridadConfig(alerta.prioridad)
                  const Icon = config.icon === 'ShieldAlert' ? ShieldAlert : config.icon === 'TrendingDown' ? TrendingDown : config.icon === 'AlertTriangle' ? AlertTriangle : Clock
                  return (
                    <div key={alerta.id} className="flex items-center gap-4 p-4 hover:bg-stone-50 cursor-pointer transition-colors"
                      onClick={() => { setAlertaSeleccionada(alerta); setDetalleOpen(true) }}>
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{alerta.entidadNombre}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-sm text-stone-500">
                          <span>{ENTIDAD_LABELS[alerta.entidad] || alerta.entidad}</span>
                          {alerta.camara && <span>Camara: {alerta.camara.nombre}</span>}
                          {alerta.stockMinimo != null && <span>Min: {alerta.stockMinimo}</span>}
                        </div>
                      </div>
                      <div className="text-right mr-2">
                        <p className="text-sm text-stone-500">Stock</p>
                        <p className="text-lg font-bold">{alerta.stockActual}</p>
                      </div>
                      <Badge className={`${config.color} shrink-0`}>{config.label}</Badge>
                      <Button variant="ghost" size="sm" className="shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleDescartar(alerta) }}>
                        <XCircle className="w-4 h-4 text-stone-400 hover:text-red-500" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Detalle */}
      <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Eye className="w-5 h-5" /> Detalle de Alerta</DialogTitle>
          </DialogHeader>
          {alertaSeleccionada && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-stone-500">Tipo:</span><p className="font-medium">{TIPO_LABELS[alertaSeleccionada.tipo] || alertaSeleccionada.tipo}</p></div>
                <div><span className="text-stone-500">Entidad:</span><p className="font-medium">{ENTIDAD_LABELS[alertaSeleccionada.entidad] || alertaSeleccionada.entidad}</p></div>
                <div><span className="text-stone-500">Producto:</span><p className="font-medium">{alertaSeleccionada.entidadNombre}</p></div>
                <div><span className="text-stone-500">Prioridad:</span><Badge className={getPrioridadConfig(alertaSeleccionada.prioridad).color}>{getPrioridadConfig(alertaSeleccionada.prioridad).label}</Badge></div>
                <div><span className="text-stone-500">Stock Actual:</span><p className="text-xl font-bold">{alertaSeleccionada.stockActual}</p></div>
                {alertaSeleccionada.stockMinimo != null && <div><span className="text-stone-500">Stock Minimo:</span><p className="font-medium">{alertaSeleccionada.stockMinimo}</p></div>}
                {alertaSeleccionada.camara && <div><span className="text-stone-500">Camara:</span><p className="font-medium">{alertaSeleccionada.camara.nombre}</p></div>}
                <div><span className="text-stone-500">Creada:</span><p className="font-medium">{new Date(alertaSeleccionada.createdAt).toLocaleString('es-AR')}</p></div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => handleDescartar(alertaSeleccionada)}><Trash2 className="w-4 h-4 mr-1" /> Descartar</Button>
                <Button onClick={handleResolver}><CheckCircle className="w-4 h-4 mr-1" /> Marcar Resuelta</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AlertasStockModule
