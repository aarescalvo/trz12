'use client'

import { useState, useEffect } from 'react'
import { 
  Package, ArrowUpDown, AlertTriangle, Clock, TrendingDown,
  RefreshCw, Filter, CheckCircle, XCircle, Loader2, ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

interface ProductoFIFO {
  id: string
  paqueteId: string
  producto: string
  pesoKg: number
  cantidad: number
  estado: string
  fechaIngreso: string
  fechaVencimiento: string | null
  diasEnStock: number
  diasRestantes: number | null
  prioridadFIFO: 'CRITICO' | 'ALTA' | 'MEDIA' | 'BAJA'
  razonFIFO: string
  camara?: { nombre: string } | null
}

interface Stats {
  totalProductos: number
  totalKg: number
  criticos: number
  kgCriticos: number
  altaPrioridad: number
  productosSinVencimiento: number
}

interface ResumenProducto {
  producto: string
  totalUnidades: number
  totalKg: number
  critico: number
  alta: number
  media: number
  baja: number
  kgCritico: number
}

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Props {
  operador: Operador
}

export function FIFOStockModule({ operador }: Props) {
  const [productos, setProductos] = useState<ProductoFIFO[]>([])
  const [resumen, setResumen] = useState<ResumenProducto[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [camaraId, setCamaraId] = useState<string>('')
  const [seleccionados, setSeleccionados] = useState<string[]>([])

  useEffect(() => {
    fetchFIFO()
  }, [busqueda, camaraId])

  const fetchFIFO = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (busqueda) params.append('producto', busqueda)
      if (camaraId) params.append('camaraId', camaraId)
      params.append('limit', '50')

      const res = await fetch(`/api/fifo?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setProductos(data.data)
        setResumen(data.resumenPorProducto)
        setStats(data.stats)
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar FIFO')
    } finally {
      setLoading(false)
    }
  }

  const toggleSeleccion = (id: string) => {
    setSeleccionados(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    )
  }

  const seleccionarCriticos = () => {
    const criticos = productos
      .filter(p => p.prioridadFIFO === 'CRITICO')
      .map(p => p.id)
    setSeleccionados(criticos)
    toast.info(`${criticos.length} productos críticos seleccionados`)
  }

  const seleccionarAltos = () => {
    const altos = productos
      .filter(p => p.prioridadFIFO === 'CRITICO' || p.prioridadFIFO === 'ALTA')
      .map(p => p.id)
    setSeleccionados(altos)
    toast.info(`${altos.length} productos de alta prioridad seleccionados`)
  }

  const despacharSeleccionados = async () => {
    if (seleccionados.length === 0) {
      toast.error('No hay productos seleccionados')
      return
    }

    try {
      const res = await fetch('/api/fifo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paqueteIds: seleccionados,
          observaciones: `Despachado por ${operador.nombre}`
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setSeleccionados([])
        fetchFIFO()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Error al despachar')
    }
  }

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  const getPrioridadBadge = (prioridad: string) => {
    switch (prioridad) {
      case 'CRITICO':
        return <Badge className="bg-red-500 text-white animate-pulse">CRÍTICO</Badge>
      case 'ALTA':
        return <Badge className="bg-amber-500 text-white">ALTA</Badge>
      case 'MEDIA':
        return <Badge className="bg-blue-500 text-white">MEDIA</Badge>
      default:
        return <Badge variant="outline">BAJA</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <ArrowUpDown className="w-8 h-8 text-amber-500" />
              Sistema FIFO
            </h1>
            <p className="text-stone-500">First In, First Out - Gestión de rotación de stock</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchFIFO}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className={`border-0 shadow-md ${stats.criticos > 0 ? 'ring-2 ring-red-500' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Críticos</p>
                    <p className="text-2xl font-bold text-red-600">{stats.criticos}</p>
                    <p className="text-xs text-stone-400">{stats.kgCriticos.toFixed(1)} kg</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Alta Prioridad</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.altaPrioridad}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Total en Stock</p>
                    <p className="text-2xl font-bold">{stats.totalProductos}</p>
                    <p className="text-xs text-stone-400">{stats.totalKg.toFixed(1)} kg</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-stone-100 p-2 rounded-lg">
                    <Clock className="w-5 h-5 text-stone-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Sin Vencimiento</p>
                    <p className="text-2xl font-bold">{stats.productosSinVencimiento}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros y acciones */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-64">
                <Input
                  placeholder="Buscar producto..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={seleccionarCriticos}>
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Críticos
                </Button>
                <Button variant="outline" size="sm" onClick={seleccionarAltos}>
                  <TrendingDown className="w-4 h-4 mr-1" />
                  Alta Prioridad
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen por producto */}
        {resumen.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg">Resumen por Producto</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-48">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Unidades</TableHead>
                      <TableHead className="text-right">Kg</TableHead>
                      <TableHead className="text-center">Críticos</TableHead>
                      <TableHead className="text-center">Alta</TableHead>
                      <TableHead className="text-center">Media</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumen.map((r, i) => (
                      <TableRow key={i} className={r.critico > 0 ? 'bg-red-50' : ''}>
                        <TableCell className="font-medium">{r.producto}</TableCell>
                        <TableCell className="text-right">{r.totalUnidades}</TableCell>
                        <TableCell className="text-right">{r.totalKg.toFixed(1)}</TableCell>
                        <TableCell className="text-center">
                          {r.critico > 0 && (
                            <Badge className="bg-red-500 text-white">{r.critico}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {r.alta > 0 && (
                            <Badge className="bg-amber-500 text-white">{r.alta}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {r.media > 0 && (
                            <Badge className="bg-blue-500 text-white">{r.media}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Tabla de productos FIFO */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Orden FIFO de Despacho</CardTitle>
                <CardDescription>
                  Selecciona productos para despachar en orden de prioridad
                </CardDescription>
              </div>
              {seleccionados.length > 0 && (
                <Button onClick={despacharSeleccionados} className="bg-amber-500 hover:bg-amber-600">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Despachar ({seleccionados.length})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                <p className="mt-2 text-stone-500">Calculando FIFO...</p>
              </div>
            ) : productos.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay productos en stock</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50/50">
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Paquete</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Kg</TableHead>
                      <TableHead>Cámara</TableHead>
                      <TableHead>Ingreso</TableHead>
                      <TableHead>Vence</TableHead>
                      <TableHead className="text-center">Días Stock</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productos.map((p) => (
                      <TableRow 
                        key={p.id}
                        className={`cursor-pointer ${
                          p.prioridadFIFO === 'CRITICO' 
                            ? 'bg-red-50 hover:bg-red-100' 
                            : p.prioridadFIFO === 'ALTA' 
                              ? 'bg-amber-50 hover:bg-amber-100' 
                              : ''
                        } ${seleccionados.includes(p.id) ? 'ring-2 ring-amber-500' : ''}`}
                        onClick={() => toggleSeleccion(p.id)}
                      >
                        <TableCell>
                          <Checkbox 
                            checked={seleccionados.includes(p.id)}
                            onCheckedChange={() => toggleSeleccion(p.id)}
                          />
                        </TableCell>
                        <TableCell>{getPrioridadBadge(p.prioridadFIFO)}</TableCell>
                        <TableCell className="font-mono text-sm">{p.paqueteId}</TableCell>
                        <TableCell className="font-medium">{p.producto}</TableCell>
                        <TableCell className="text-right">{p.pesoKg.toFixed(1)}</TableCell>
                        <TableCell>{p.camara?.nombre || '-'}</TableCell>
                        <TableCell>{formatFecha(p.fechaIngreso)}</TableCell>
                        <TableCell>
                          <span className={p.prioridadFIFO === 'CRITICO' ? 'text-red-600 font-semibold' : ''}>
                            {formatFecha(p.fechaVencimiento)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{p.diasEnStock}d</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-stone-500">{p.razonFIFO}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
