'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertTriangle, Clock, Package, TrendingUp, AlertCircle, 
  CheckCircle, RefreshCw, ChevronDown, ChevronUp, ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FIFOItem {
  id: string
  codigo: string
  lado: string
  sigla: string
  peso: number
  tropaCodigo: string | null
  garron: number | null
  tipoAnimal: string | null
  fechaFaena: string
  diasEnCamara: number
  diasVencimiento: number
  diasRestantes: number
  fechaVencimiento: string | null
  estadoVencimiento: 'OK' | 'PROXIMO' | 'URGENTE' | 'CRITICO'
  prioridadFIFO: number
  camara?: { id: string; nombre: string } | null
}

interface SugerenciaDespacho {
  camaraId: string
  camaraNombre: string
  medias: Array<{
    id: string
    codigo: string
    tropaCodigo: string | null
    garron: number | null
    peso: number
    diasEnCamara: number
    diasRestantes: number
    estadoVencimiento: string
  }>
  totalKg: number
  prioridad: number
}

interface Alerta {
  tipo: 'CRITICO' | 'URGENTE' | 'PROXIMO'
  diasRestantes: number
  id: string
  codigo: string
  tropaCodigo: string | null
  garron: number | null
  peso: number
  camara: string | null
}

interface FIFOResponse {
  stockFIFO: FIFOItem[]
  resumenPorCamara: Array<{
    camaraId: string
    camaraNombre: string
    totalMedias: number
    totalKg: number
    criticos: number
    urgentes: number
    proximos: number
    ok: number
  }>
  sugerenciasDespacho: SugerenciaDespacho[]
  alertas: Alerta[]
  totales: {
    totalMedias: number
    totalKg: number
    criticos: number
    urgentes: number
    proximos: number
  }
}

interface Props {
  clienteId?: string
  onSelectItems?: (items: FIFOItem[]) => void
}

export function FIFOSugerencias({ clienteId, onSelectItems }: Props) {
  const [data, setData] = useState<FIFOResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedCamara, setExpandedCamara] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchFIFO()
  }, [clienteId])

  const fetchFIFO = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (clienteId) params.set('clienteId', clienteId)
      params.set('alertas', 'true')
      
      const res = await fetch(`/api/fifo?${params.toString()}`)
      const result = await res.json()
      if (result.success) {
        setData(result.data)
      } else {
        toast.error(result.error || 'Error al cargar FIFO')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar FIFO')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'CRITICO':
        return <Badge className="bg-red-500 text-white animate-pulse">VENCIDO</Badge>
      case 'URGENTE':
        return <Badge className="bg-orange-500 text-white">Urgente</Badge>
      case 'PROXIMO':
        return <Badge className="bg-amber-500 text-white">Próximo</Badge>
      default:
        return <Badge className="bg-emerald-500 text-white">OK</Badge>
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'CRITICO': return 'bg-red-50 border-red-200'
      case 'URGENTE': return 'bg-orange-50 border-orange-200'
      case 'PROXIMO': return 'bg-amber-50 border-amber-200'
      default: return 'bg-white'
    }
  }

  const toggleItemSelection = (id: string) => {
    const newSelection = new Set(selectedItems)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedItems(newSelection)
    
    if (onSelectItems && data) {
      const items = data.stockFIFO.filter(item => newSelection.has(item.id))
      onSelectItems(items)
    }
  }

  const selectAllPrioritarios = () => {
    if (!data) return
    const prioritarios = data.stockFIFO
      .filter(item => item.estadoVencimiento === 'CRITICO' || item.estadoVencimiento === 'URGENTE')
      .map(item => item.id)
    setSelectedItems(new Set(prioritarios))
    
    if (onSelectItems) {
      const items = data.stockFIFO.filter(item => prioritarios.includes(item.id))
      onSelectItems(items)
    }
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-8 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      {/* Alertas críticas */}
      {data.alertas.length > 0 && (
        <Card className="border-0 shadow-md border-l-4 border-l-red-500 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Alertas de Vencimiento ({data.alertas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {data.alertas.slice(0, 10).map((alerta) => (
                <div key={alerta.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    {alerta.tipo === 'CRITICO' ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : alerta.tipo === 'URGENTE' ? (
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="font-medium text-sm">{alerta.codigo}</span>
                    <span className="text-xs text-stone-500">
                      {alerta.tropaCodigo} - Garrón {alerta.garron}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500">{alerta.peso.toFixed(1)} kg</span>
                    <Badge variant="destructive" className="text-xs">
                      {alerta.diasRestantes < 0 ? `Vencido hace ${Math.abs(alerta.diasRestantes)} días` : `${alerta.diasRestantes} días`}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen general */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              Stock FIFO
            </span>
            <Button variant="outline" size="sm" onClick={fetchFIFO}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 mb-4">
            <div className="text-center p-3 bg-stone-50 rounded-lg">
              <p className="text-2xl font-bold text-stone-800">{data.totales.totalMedias}</p>
              <p className="text-xs text-stone-500">Total Medias</p>
            </div>
            <div className="text-center p-3 bg-stone-50 rounded-lg">
              <p className="text-2xl font-bold text-stone-800">{data.totales.totalKg.toFixed(0)}</p>
              <p className="text-xs text-stone-500">Kg Total</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100" onClick={selectAllPrioritarios}>
              <p className="text-2xl font-bold text-red-600">{data.totales.criticos}</p>
              <p className="text-xs text-red-500">Críticos</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{data.totales.urgentes}</p>
              <p className="text-xs text-orange-500">Urgentes</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <p className="text-2xl font-bold text-amber-600">{data.totales.proximos}</p>
              <p className="text-xs text-amber-500">Próximos</p>
            </div>
          </div>

          {/* Acción rápida */}
          {(data.totales.criticos > 0 || data.totales.urgentes > 0) && (
            <Button 
              className="w-full bg-red-500 hover:bg-red-600"
              onClick={selectAllPrioritarios}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Seleccionar {data.totales.criticos + data.totales.urgentes} productos prioritarios
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Sugerencias de despacho por cámara */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            Sugerencias de Despacho por Cámara
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-stone-100">
            {data.sugerenciasDespacho.map((sugerencia) => (
              <div key={sugerencia.camaraId} className="p-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedCamara(
                    expandedCamara === sugerencia.camaraId ? null : sugerencia.camaraId
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      sugerencia.medias.some(m => m.estadoVencimiento === 'CRITICO') ? "bg-red-500" :
                      sugerencia.medias.some(m => m.estadoVencimiento === 'URGENTE') ? "bg-orange-500" :
                      sugerencia.medias.some(m => m.estadoVencimiento === 'PROXIMO') ? "bg-amber-500" : "bg-emerald-500"
                    )} />
                    <div>
                      <p className="font-medium">{sugerencia.camaraNombre}</p>
                      <p className="text-xs text-stone-500">
                        {sugerencia.medias.length} medias · {sugerencia.totalKg.toFixed(1)} kg
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sugerencia.medias.filter(m => m.estadoVencimiento === 'CRITICO').length > 0 && (
                      <Badge className="bg-red-100 text-red-700">
                        {sugerencia.medias.filter(m => m.estadoVencimiento === 'CRITICO').length} críticos
                      </Badge>
                    )}
                    {expandedCamara === sugerencia.camaraId ? (
                      <ChevronUp className="w-4 h-4 text-stone-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-400" />
                    )}
                  </div>
                </div>

                {expandedCamara === sugerencia.camaraId && (
                  <div className="mt-3 space-y-1 max-h-60 overflow-y-auto">
                    {sugerencia.medias.map((media) => (
                      <div 
                        key={media.id} 
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all",
                          getEstadoColor(media.estadoVencimiento),
                          selectedItems.has(media.id) ? "ring-2 ring-amber-500" : ""
                        )}
                        onClick={() => toggleItemSelection(media.id)}
                      >
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={selectedItems.has(media.id)}
                            onChange={() => {}}
                            className="rounded border-stone-300"
                          />
                          <span className="text-sm font-medium">{media.codigo}</span>
                          <span className="text-xs text-stone-500">
                            {media.tropaCodigo} · G{media.garron}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{media.peso.toFixed(1)} kg</span>
                          <span className="text-xs text-stone-500">{media.diasEnCamara} días</span>
                          {getEstadoBadge(media.estadoVencimiento)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resumen por cámara */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Estado por Cámara</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.resumenPorCamara.map((camara) => (
              <div key={camara.camaraId} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                <span className="font-medium">{camara.camaraNombre}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span>{camara.totalMedias} medias</span>
                  <span>{camara.totalKg.toFixed(0)} kg</span>
                  <div className="flex gap-1">
                    {camara.criticos > 0 && (
                      <Badge className="bg-red-500">{camara.criticos}</Badge>
                    )}
                    {camara.urgentes > 0 && (
                      <Badge className="bg-orange-500">{camara.urgentes}</Badge>
                    )}
                    {camara.proximos > 0 && (
                      <Badge className="bg-amber-500">{camara.proximos}</Badge>
                    )}
                    {camara.ok > 0 && (
                      <Badge className="bg-emerald-500">{camara.ok}</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FIFOSugerencias
