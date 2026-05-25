'use client'

import { useState, useEffect } from 'react'
import { 
  Warehouse, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, 
  Package, Search, Filter, ArrowRightLeft, Download, Plus, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface Camara {
  id: string
  nombre: string
  tipo: string
  capacidad: number
  totalMedias: number
  pesoTotal: number
  ocupacion: number
  alertaStockBajo: boolean
  stockPorEspecie: Record<string, { cantidad: number; peso: number }>
  movimientosRecientes: number
}

interface Movimiento {
  id: string
  fecha: string
  camaraOrigen: string | null
  camaraDestino: string | null
  producto: string | null
  cantidad: number | null
  peso: number | null
  tropaCodigo: string | null
  observaciones: string | null
  operador: string | null
}

interface MediaEnStock {
  id: string
  codigo: string
  lado: string
  peso: number
  sigla: string
  camara: string | null
  tropaCodigo: string | null
  garron: number | null
  fechaIngreso: string
}

interface Stats {
  totalCamaras: number
  totalMedias: number
  pesoTotal: number
  movimientosHoy: number
  alertas: number
}

interface Operador {
  id: string
  nombre: string
  nivel: string
}

export function StockCamarasModule({ operador }: { operador: Operador }) {
  const [loading, setLoading] = useState(true)
  const [camaras, setCamaras] = useState<Camara[]>([])
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [mediasEnStock, setMediasEnStock] = useState<MediaEnStock[]>([])
  const [stats, setStats] = useState<Stats>({
    totalCamaras: 0,
    totalMedias: 0,
    pesoTotal: 0,
    movimientosHoy: 0,
    alertas: 0
  })

  // Filtros
  const [filtroCamara, setFiltroCamara] = useState<string>('TODOS')
  const [filtroTropa, setFiltroTropa] = useState<string>('TODOS')
  const [busqueda, setBusqueda] = useState('')

  // Modal de movimiento
  const [showMovimientoModal, setShowMovimientoModal] = useState(false)
  const [movimientoTipo, setMovimientoTipo] = useState<'INGRESO' | 'EGRESO' | 'TRANSFERENCIA'>('INGRESO')
  const [movimientoCamaraOrigen, setMovimientoCamaraOrigen] = useState('')
  const [movimientoCamaraDestino, setMovimientoCamaraDestino] = useState('')
  const [movimientoProducto, setMovimientoProducto] = useState('')
  const [movimientoCantidad, setMovimientoCantidad] = useState('')
  const [movimientoPeso, setMovimientoPeso] = useState('')
  const [movimientoTropa, setMovimientoTropa] = useState('')
  const [movimientoObservaciones, setMovimientoObservaciones] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stock-camaras')
      const data = await res.json()
      
      if (data.success) {
        setCamaras(data.data.resumenCamaras)
        setMovimientos(data.data.movimientos)
        setMediasEnStock(data.data.mediasEnStock)
        setStats(data.data.stats)
      } else {
        toast.error('Error al cargar stock')
      }
    } catch (error) {
      console.error('Error fetching stock:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleCrearMovimiento = async () => {
    if (!movimientoProducto) {
      toast.error('Complete el producto')
      return
    }

    if (movimientoTipo === 'TRANSFERENCIA' && (!movimientoCamaraOrigen || !movimientoCamaraDestino)) {
      toast.error('Seleccione cámaras de origen y destino')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/stock-camaras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: movimientoTipo,
          camaraOrigenId: movimientoCamaraOrigen || null,
          camaraDestinoId: movimientoCamaraDestino || null,
          producto: movimientoProducto,
          cantidad: parseInt(movimientoCantidad) || null,
          peso: parseFloat(movimientoPeso) || null,
          tropaCodigo: movimientoTropa || null,
          observaciones: movimientoObservaciones || null,
          operadorId: operador.id
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Movimiento registrado')
        setShowMovimientoModal(false)
        resetMovimientoForm()
        fetchData()
      } else {
        toast.error(data.error || 'Error al registrar movimiento')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const resetMovimientoForm = () => {
    setMovimientoTipo('INGRESO')
    setMovimientoCamaraOrigen('')
    setMovimientoCamaraDestino('')
    setMovimientoProducto('')
    setMovimientoCantidad('')
    setMovimientoPeso('')
    setMovimientoTropa('')
    setMovimientoObservaciones('')
  }

  // Filtrar medias
  const mediasFiltradas = mediasEnStock.filter(m => {
    if (filtroCamara !== 'TODOS' && m.camara !== filtroCamara) return false
    if (filtroTropa !== 'TODOS' && m.tropaCodigo !== filtroTropa) return false
    if (busqueda && !m.codigo.toLowerCase().includes(busqueda.toLowerCase()) &&
        !m.tropaCodigo?.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  })

  // Filtrar movimientos
  const movimientosFiltrados = movimientos.filter(m => {
    if (busqueda && !m.producto?.toLowerCase().includes(busqueda.toLowerCase()) &&
        !m.tropaCodigo?.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  })

  // Exportar a CSV
  const exportarCSV = () => {
    const headers = ['Código', 'Lado', 'Peso', 'Sigla', 'Cámara', 'Tropa', 'Garrón', 'Fecha Ingreso']
    const rows = mediasFiltradas.map(m => [
      m.codigo,
      m.lado,
      m.peso?.toString() || '0',
      m.sigla,
      m.camara || '',
      m.tropaCodigo || '',
      m.garron?.toString() || '',
      new Date(m.fechaIngreso).toLocaleDateString('es-AR')
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `stock_camaras_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('CSV descargado')
  }

  // Obtener tropas únicas
  const tropasUnicas = [...new Set(mediasEnStock.map(m => m.tropaCodigo).filter(Boolean))] as string[]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
        <Warehouse className="w-8 h-8 animate-pulse text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Stock de Cámaras</h1>
            <p className="text-stone-500">Control de inventario y movimientos</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Button variant="outline" size="sm" onClick={exportarCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button 
              size="sm" 
              className="bg-amber-500 hover:bg-amber-600"
              onClick={() => setShowMovimientoModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Movimiento
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Warehouse className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Cámaras Activas</p>
                  <p className="text-xl font-bold">{stats.totalCamaras}</p>
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
                  <p className="text-xs text-stone-500">Total Medias</p>
                  <p className="text-xl font-bold">{stats.totalMedias}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Peso Total (kg)</p>
                  <p className="text-xl font-bold">{stats.pesoTotal.toLocaleString('es-AR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <ArrowRightLeft className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Movimientos Hoy</p>
                  <p className="text-xl font-bold">{stats.movimientosHoy}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="camaras" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="camaras">Por Cámara</TabsTrigger>
            <TabsTrigger value="stock">Stock Detalle</TabsTrigger>
            <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          </TabsList>

          {/* Tab: Por Cámara */}
          <TabsContent value="camaras" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {camaras.map(camara => (
                <Card key={camara.id} className={`border-0 shadow-md ${camara.alertaStockBajo ? 'ring-2 ring-red-400' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{camara.nombre}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {camara.tipo}
                      </Badge>
                    </div>
                    <CardDescription>
                      Capacidad: {camara.capacidad} ganchos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Ocupación</span>
                        <span className={camara.ocupacion >= 90 ? 'text-red-500 font-bold' : ''}>
                          {camara.ocupacion}%
                        </span>
                      </div>
                      <Progress 
                        value={camara.ocupacion} 
                        className={camara.ocupacion >= 90 ? 'bg-red-100' : camara.ocupacion >= 70 ? 'bg-amber-100' : ''}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-stone-50 p-2 rounded">
                        <p className="text-stone-500 text-xs">Medias</p>
                        <p className="font-bold">{camara.totalMedias}</p>
                      </div>
                      <div className="bg-stone-50 p-2 rounded">
                        <p className="text-stone-500 text-xs">Peso (kg)</p>
                        <p className="font-bold">{camara.pesoTotal.toLocaleString('es-AR')}</p>
                      </div>
                    </div>

                    {camara.alertaStockBajo && (
                      <div className="flex items-center gap-2 text-red-500 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Stock bajo mínimo</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab: Stock Detalle */}
          <TabsContent value="stock" className="space-y-4">
            {/* Filtros */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label className="text-xs">Buscar</Label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <Input
                        className="pl-9"
                        placeholder="Código o tropa..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-48">
                    <Label className="text-xs">Cámara</Label>
                    <Select value={filtroCamara} onValueChange={setFiltroCamara}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODOS">Todas</SelectItem>
                        {camaras.map(c => (
                          <SelectItem key={c.id} value={c.nombre}>{c.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-48">
                    <Label className="text-xs">Tropa</Label>
                    <Select value={filtroTropa} onValueChange={setFiltroTropa}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODOS">Todas</SelectItem>
                        {tropasUnicas.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de stock */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg">
                  Medias en Stock ({mediasFiltradas.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {mediasFiltradas.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay medias con esos filtros</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Cámara</TableHead>
                          <TableHead>Tropa</TableHead>
                          <TableHead>Lado</TableHead>
                          <TableHead>Sigla</TableHead>
                          <TableHead className="text-right">Peso (kg)</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mediasFiltradas.slice(0, 100).map(m => (
                          <TableRow key={m.id}>
                            <TableCell className="font-mono text-xs">{m.codigo}</TableCell>
                            <TableCell>{m.camara || '-'}</TableCell>
                            <TableCell className="font-mono">{m.tropaCodigo || '-'}</TableCell>
                            <TableCell>{m.lado === 'IZQUIERDA' ? 'Izq' : 'Der'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{m.sigla}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold">{m.peso?.toLocaleString('es-AR') || '0'}</TableCell>
                            <TableCell className="text-xs text-stone-500">
                              {new Date(m.fechaIngreso).toLocaleDateString('es-AR')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Movimientos */}
          <TabsContent value="movimientos" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg">Últimos Movimientos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {movimientosFiltrados.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay movimientos registrados</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Origen</TableHead>
                          <TableHead>Destino</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cant.</TableHead>
                          <TableHead>Peso</TableHead>
                          <TableHead>Tropa</TableHead>
                          <TableHead>Operador</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movimientosFiltrados.map(m => (
                          <TableRow key={m.id}>
                            <TableCell className="text-xs">
                              {new Date(m.fecha).toLocaleString('es-AR', { 
                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
                              })}
                            </TableCell>
                            <TableCell>
                              {m.camaraOrigen ? (
                                <span className="text-red-600">{m.camaraOrigen}</span>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              {m.camaraDestino ? (
                                <span className="text-green-600">{m.camaraDestino}</span>
                              ) : '-'}
                            </TableCell>
                            <TableCell>{m.producto || '-'}</TableCell>
                            <TableCell>{m.cantidad || '-'}</TableCell>
                            <TableCell className="font-bold">
                              {m.peso ? m.peso.toLocaleString('es-AR') + ' kg' : '-'}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{m.tropaCodigo || '-'}</TableCell>
                            <TableCell className="text-xs">{m.operador || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Movimiento */}
        <Dialog open={showMovimientoModal} onOpenChange={setShowMovimientoModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Movimiento</DialogTitle>
              <DialogDescription>
                Registre un ingreso, egreso o transferencia de stock
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Movimiento</Label>
                <Select value={movimientoTipo} onValueChange={(v) => setMovimientoTipo(v as typeof movimientoTipo)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INGRESO">Ingreso</SelectItem>
                    <SelectItem value="EGRESO">Egreso</SelectItem>
                    <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {movimientoTipo === 'TRANSFERENCIA' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cámara Origen</Label>
                    <Select value={movimientoCamaraOrigen} onValueChange={setMovimientoCamaraOrigen}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {camaras.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cámara Destino</Label>
                    <Select value={movimientoCamaraDestino} onValueChange={setMovimientoCamaraDestino}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {camaras.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {movimientoTipo === 'INGRESO' && (
                <div className="space-y-2">
                  <Label>Cámara Destino</Label>
                  <Select value={movimientoCamaraDestino} onValueChange={setMovimientoCamaraDestino}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {camaras.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {movimientoTipo === 'EGRESO' && (
                <div className="space-y-2">
                  <Label>Cámara Origen</Label>
                  <Select value={movimientoCamaraOrigen} onValueChange={setMovimientoCamaraOrigen}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {camaras.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Producto *</Label>
                <Input
                  value={movimientoProducto}
                  onChange={(e) => setMovimientoProducto(e.target.value)}
                  placeholder="Ej: Media Res, Cuarto, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    value={movimientoCantidad}
                    onChange={(e) => setMovimientoCantidad(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={movimientoPeso}
                    onChange={(e) => setMovimientoPeso(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Código de Tropa</Label>
                <Input
                  value={movimientoTropa}
                  onChange={(e) => setMovimientoTropa(e.target.value)}
                  placeholder="Ej: B20260001"
                />
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Input
                  value={movimientoObservaciones}
                  onChange={(e) => setMovimientoObservaciones(e.target.value)}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMovimientoModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCrearMovimiento}
                disabled={saving || !movimientoProducto}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {saving ? 'Guardando...' : 'Registrar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default StockCamarasModule
