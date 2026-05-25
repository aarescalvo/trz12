'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertTriangle, 
  Clock, 
  Package, 
  Beef, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react'

interface VencimientoItem {
  id: string
  tipo: 'MEDIA_RES' | 'EMPAQUE'
  codigo?: string
  paqueteId?: string
  producto?: string
  peso?: number
  pesoKg?: number
  cantidad?: number
  tropaCodigo?: string
  garron?: number
  camara?: string
  usuarioFaena?: string
  fechaVencimiento?: Date | string
  diasParaVencer?: number | null
  alerta: 'VENCIDO' | 'CRITICO' | 'PROXIMO' | 'SIN_FECHA'
}

interface Resumen {
  totalProximosAVencer: number
  totalVencidos: number
  totalCriticos: number
}

interface VencimientosData {
  mediasRes: VencimientoItem[]
  empaques: VencimientoItem[]
  resumen: Resumen
}

export function ControlVencimientosModule() {
  const [data, setData] = useState<VencimientosData | null>(null)
  const [loading, setLoading] = useState(true)
  const [diasAlerta, setDiasAlerta] = useState(7)
  const [filtro, setFiltro] = useState<'todos' | 'vencidos' | 'proximos'>('todos')

  const cargarVencimientos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        diasAlerta: diasAlerta.toString(),
        tipo: 'todos'
      })
      
      if (filtro === 'vencidos') {
        params.set('vencidos', 'true')
      }

      const res = await fetch(`/api/vencimientos?${params}`)
      const result = await res.json()
      
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Error al cargar vencimientos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarVencimientos()
  }, [diasAlerta, filtro])

  const getAlertIcon = (alerta: string) => {
    switch (alerta) {
      case 'VENCIDO':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'CRITICO':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'PROXIMO':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <CheckCircle2 className="h-4 w-4 text-gray-400" />
    }
  }

  const getAlertColor = (alerta: string) => {
    switch (alerta) {
      case 'VENCIDO':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'CRITICO':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'PROXIMO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const formatDate = (fecha?: Date | string) => {
    if (!fecha) return '-'
    const f = typeof fecha === 'string' ? new Date(fecha) : fecha
    return f.toLocaleDateString('es-AR')
  }

  const todosLosProductos = data ? [
    ...data.mediasRes,
    ...data.empaques
  ].sort((a, b) => {
    // Ordenar por alerta primero (VENCIDO > CRITICO > PROXIMO)
    const ordenAlerta: Record<string, number> = { 'VENCIDO': 0, 'CRITICO': 1, 'PROXIMO': 2, 'SIN_FECHA': 3 }
    return (ordenAlerta[a.alerta] || 4) - (ordenAlerta[b.alerta] || 4)
  }) : []

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Control de Vencimientos</h2>
          <p className="text-muted-foreground">Monitoreo de productos por vencer y vencidos</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={diasAlerta}
            onChange={(e) => setDiasAlerta(Number(e.target.value))}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value={3}>Alertar 3 días antes</option>
            <option value={5}>Alertar 5 días antes</option>
            <option value={7}>Alertar 7 días antes</option>
            <option value={14}>Alertar 14 días antes</option>
            <option value={30}>Alertar 30 días antes</option>
          </select>
          <Button variant="outline" size="sm" onClick={cargarVencimientos}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Resumen */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-sm text-red-600">Vencidos</p>
                  <p className="text-2xl font-bold text-red-700">{data.resumen.totalVencidos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm text-orange-600">Críticos (0-2 días)</p>
                  <p className="text-2xl font-bold text-orange-700">{data.resumen.totalCriticos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-yellow-600">Próximos a vencer</p>
                  <p className="text-2xl font-bold text-yellow-700">{data.resumen.totalProximosAVencer}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Total en alerta</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {data.resumen.totalVencidos + data.resumen.totalCriticos + data.resumen.totalProximosAVencer}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2">
        <Button
          variant={filtro === 'todos' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltro('todos')}
        >
          Todos
        </Button>
        <Button
          variant={filtro === 'vencidos' ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => setFiltro('vencidos')}
        >
          Solo Vencidos
        </Button>
        <Button
          variant={filtro === 'proximos' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltro('proximos')}
        >
          Por Vencer
        </Button>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-auto h-full max-h-[calc(100vh-380px)]">
              <table className="w-full">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Estado</th>
                    <th className="text-left p-3 font-medium">Tipo</th>
                    <th className="text-left p-3 font-medium">Código/Producto</th>
                    <th className="text-left p-3 font-medium">Tropa/Lote</th>
                    <th className="text-left p-3 font-medium">Peso</th>
                    <th className="text-left p-3 font-medium">Cámara</th>
                    <th className="text-left p-3 font-medium">Vencimiento</th>
                    <th className="text-left p-3 font-medium">Días</th>
                  </tr>
                </thead>
                <tbody>
                  {todosLosProductos.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                        <p>No hay productos en alerta de vencimiento</p>
                      </td>
                    </tr>
                  ) : (
                    todosLosProductos.map((item) => (
                      <tr key={item.id} className="border-t hover:bg-muted/50">
                        <td className="p-3">
                          <Badge className={`${getAlertColor(item.alerta)} border`}>
                            <span className="flex items-center gap-1">
                              {getAlertIcon(item.alerta)}
                              {item.alerta}
                            </span>
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className="flex items-center gap-1">
                            {item.tipo === 'MEDIA_RES' ? (
                              <><Beef className="h-4 w-4" /> Media Res</>
                            ) : (
                              <><Package className="h-4 w-4" /> Empaque</>
                            )}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-sm">
                          {item.tipo === 'MEDIA_RES' ? item.codigo : item.producto}
                        </td>
                        <td className="p-3 text-sm">
                          {item.tropaCodigo || '-'}
                          {item.garron ? ` / G:${item.garron}` : ''}
                        </td>
                        <td className="p-3 text-sm">
                          {item.tipo === 'MEDIA_RES' 
                            ? `${item.peso?.toFixed(2)} kg`
                            : `${item.pesoKg?.toFixed(2)} kg × ${item.cantidad}`
                          }
                        </td>
                        <td className="p-3 text-sm">{item.camara || '-'}</td>
                        <td className="p-3 text-sm">{formatDate(item.fechaVencimiento)}</td>
                        <td className="p-3">
                          <span className={`font-bold ${
                            item.diasParaVencer != null && item.diasParaVencer < 0 
                              ? 'text-red-600' 
                              : item.diasParaVencer != null && item.diasParaVencer <= 2 
                                ? 'text-orange-600' 
                                : 'text-yellow-600'
                          }`}>
                            {item.diasParaVencer != null 
                              ? (item.diasParaVencer < 0 
                                  ? `${Math.abs(item.diasParaVencer)} días`
                                  : `${item.diasParaVencer} días`)
                              : '-'
                            }
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
