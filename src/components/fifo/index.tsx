'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Package, 
  Beef, 
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  Clock
} from 'lucide-react'

interface FIFOResult {
  id: string
  tipo: 'MEDIA_RES' | 'EMPAQUE'
  paqueteId?: string
  codigo?: string
  producto?: string
  pesoKg?: number
  peso?: number
  cantidad?: number
  camara?: string
  fechaIngreso?: Date | string
  fechaFaena?: Date | string
  fechaVencimiento?: Date | string
  diasEnStock?: number | null
  diasParaVencer?: number | null
  prioridadFIFO: number
  estadoVencimiento: 'VENCIDO' | 'URGENTE' | 'OK' | 'SIN_VENCIMIENTO'
  recomendacion: string
}

interface FIFOResponse {
  empaques: FIFOResult[]
  mediasRes: FIFOResult[]
  resumenPorProducto: Array<{
    producto: string
    cantidad: number
    pesoTotal: number
    urgentes: number
    vencidos: number
  }>
  estadisticas: {
    totalEmpaques: number
    totalMedias: number
    urgentes: number
    vencidos: number
  }
}

export function FIFOModule() {
  const [data, setData] = useState<FIFOResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtroProducto, setFiltroProducto] = useState('')
  const [limite, setLimite] = useState(50)
  const [tabActivo, setTabActivo] = useState<'empaques' | 'medias'>('empaques')

  const cargarFIFO = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limite: limite.toString()
      })
      
      if (filtroProducto) {
        params.set('producto', filtroProducto)
      }

      const res = await fetch(`/api/fifo?${params}`)
      const result = await res.json()
      
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Error al cargar FIFO:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarFIFO()
  }, [limite])

  const buscarProducto = () => {
    cargarFIFO()
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'VENCIDO':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'URGENTE':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'OK':
        return 'bg-green-100 text-green-800 border-green-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'VENCIDO':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'URGENTE':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'OK':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default:
        return <Package className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDate = (fecha?: Date | string) => {
    if (!fecha) return '-'
    const f = typeof fecha === 'string' ? new Date(fecha) : fecha
    return f.toLocaleDateString('es-AR')
  }

  const productosActuales = tabActivo === 'empaques' 
    ? (data?.empaques || [])
    : (data?.mediasRes || [])

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sistema FIFO</h2>
          <p className="text-muted-foreground">First In, First Out - Control de rotación de stock</p>
        </div>
        <Button variant="outline" size="sm" onClick={cargarFIFO}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Buscar producto</label>
              <Input
                value={filtroProducto}
                onChange={(e) => setFiltroProducto(e.target.value)}
                placeholder="Nombre del producto..."
                onKeyDown={(e) => e.key === 'Enter' && buscarProducto()}
              />
            </div>
            <div className="w-32">
              <label className="text-sm font-medium mb-1 block">Límite</label>
              <select
                value={limite}
                onChange={(e) => setLimite(Number(e.target.value))}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value={20}>20 items</option>
                <option value={50}>50 items</option>
                <option value={100}>100 items</option>
                <option value={200}>200 items</option>
              </select>
            </div>
            <Button onClick={buscarProducto}>
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-sm text-gray-600">Empaques</p>
                  <p className="text-2xl font-bold">{data.estadisticas.totalEmpaques}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Beef className="h-8 w-8 text-rose-500" />
                <div>
                  <p className="text-sm text-gray-600">Medias Reses</p>
                  <p className="text-2xl font-bold">{data.estadisticas.totalMedias}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm text-orange-600">Urgentes</p>
                  <p className="text-2xl font-bold text-orange-700">{data.estadisticas.urgentes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-sm text-red-600">Vencidos</p>
                  <p className="text-2xl font-bold text-red-700">{data.estadisticas.vencidos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resumen por producto */}
      {data && data.resumenPorProducto.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Resumen por Producto</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Producto</th>
                    <th className="text-right p-2">Cantidad</th>
                    <th className="text-right p-2">Peso Total</th>
                    <th className="text-center p-2">Urgentes</th>
                    <th className="text-center p-2">Vencidos</th>
                  </tr>
                </thead>
                <tbody>
                  {data.resumenPorProducto.slice(0, 10).map((p, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 font-medium">{p.producto}</td>
                      <td className="p-2 text-right">{p.cantidad}</td>
                      <td className="p-2 text-right">{p.pesoTotal.toFixed(2)} kg</td>
                      <td className="p-2 text-center">
                        {p.urgentes > 0 && (
                          <Badge className="bg-orange-100 text-orange-800">{p.urgentes}</Badge>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {p.vencidos > 0 && (
                          <Badge className="bg-red-100 text-red-800">{p.vencidos}</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={tabActivo === 'empaques' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTabActivo('empaques')}
        >
          <Package className="h-4 w-4 mr-2" />
          Empaques
        </Button>
        <Button
          variant={tabActivo === 'medias' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTabActivo('medias')}
        >
          <Beef className="h-4 w-4 mr-2" />
          Medias Reses
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
            <div className="overflow-auto h-full max-h-[calc(100vh-500px)]">
              <table className="w-full">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="text-center p-2 font-medium w-16"># FIFO</th>
                    <th className="text-left p-2 font-medium">Estado</th>
                    <th className="text-left p-2 font-medium">Código/Producto</th>
                    <th className="text-left p-2 font-medium">Peso</th>
                    <th className="text-left p-2 font-medium">Cámara</th>
                    <th className="text-left p-2 font-medium">Ingreso</th>
                    <th className="text-center p-2 font-medium">Días Stock</th>
                    <th className="text-center p-2 font-medium">Vence</th>
                    <th className="text-left p-2 font-medium">Recomendación</th>
                  </tr>
                </thead>
                <tbody>
                  {productosActuales.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center p-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>No hay productos en stock</p>
                      </td>
                    </tr>
                  ) : (
                    productosActuales.map((item) => (
                      <tr key={item.id} className="border-t hover:bg-muted/50">
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <ArrowUpRight className="h-4 w-4 text-amber-500" />
                            <span className="font-bold text-lg">{item.prioridadFIFO}</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge className={`${getEstadoColor(item.estadoVencimiento)} border`}>
                            <span className="flex items-center gap-1">
                              {getEstadoIcon(item.estadoVencimiento)}
                              {item.estadoVencimiento}
                            </span>
                          </Badge>
                        </td>
                        <td className="p-2 font-mono text-sm">
                          {item.tipo === 'MEDIA_RES' ? item.codigo : item.producto}
                        </td>
                        <td className="p-2 text-sm">
                          {item.tipo === 'MEDIA_RES' 
                            ? `${item.peso?.toFixed(2)} kg`
                            : `${item.pesoKg?.toFixed(2)} kg × ${item.cantidad}`
                          }
                        </td>
                        <td className="p-2 text-sm">{item.camara || '-'}</td>
                        <td className="p-2 text-sm">
                          {formatDate(item.tipo === 'MEDIA_RES' ? item.fechaFaena : item.fechaIngreso)}
                        </td>
                        <td className="p-2 text-center">
                          <Badge variant="outline">
                            {item.diasEnStock !== null ? `${item.diasEnStock} días` : '-'}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <span className={`font-medium ${
                            item.diasParaVencer != null && item.diasParaVencer < 0
                              ? 'text-red-600'
                              : item.diasParaVencer != null && item.diasParaVencer <= 3
                                ? 'text-orange-600'
                                : 'text-green-600'
                          }`}>
                            {item.diasParaVencer != null
                              ? (item.diasParaVencer < 0
                                  ? `${Math.abs(item.diasParaVencer)} días`
                                  : `${item.diasParaVencer} días`)
                              : '-'
                            }
                          </span>
                        </td>
                        <td className="p-2 text-xs text-muted-foreground max-w-[200px]">
                          {item.recomendacion}
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
