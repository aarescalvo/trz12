'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Clock, AlertTriangle, CheckCircle, Package, Calendar,
  Filter, Download, RefreshCw, Trash2, ArrowRight, Search,
  ThermometerSnowflake, Scale
} from 'lucide-react'

// ==================== TYPES ====================
interface ItemStock {
  id: string
  tipo: string
  codigo: string
  lote: string
  producto: string
  peso: number
  cantidad?: number
  fechaIngreso: string
  fechaVencimiento: string
  diasRestantes: number
  camara: string
  camaraId?: string
  estado: 'VENCIDO' | 'PROXIMO' | 'OK'
  usuarioFaena?: string
  pallet?: string
}

interface Resumen {
  vencidos: number
  proximos7: number
  ok: number
  total: number
  pesoVencido: number
  pesoProximo: number
}

interface Props {
  operador?: { id: string; nombre: string; rol: string }
}

// ==================== HELPERS ====================
const formatearFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-AR')
}

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'VENCIDO': return 'bg-red-100 text-red-700 border-red-300'
    case 'PROXIMO': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    default: return 'bg-green-100 text-green-700 border-green-300'
  }
}

const getRowColor = (estado: string) => {
  switch (estado) {
    case 'VENCIDO': return 'bg-red-50 hover:bg-red-100'
    case 'PROXIMO': return 'bg-yellow-50 hover:bg-yellow-100'
    default: return 'hover:bg-stone-50'
  }
}

// ==================== COMPONENT ====================
export function ControlVencimientosModule({ operador }: Props) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ItemStock[]>([])
  const [resumen, setResumen] = useState<Resumen>({ vencidos: 0, proximos7: 0, ok: 0, total: 0, pesoVencido: 0, pesoProximo: 0 })
  const [tabActivo, setTabActivo] = useState<'criticos' | 'proximos' | 'todos'>('criticos')
  const [filtroTipo, setFiltroTipo] = useState<string>('all')
  const [busqueda, setBusqueda] = useState('')
  const [camaras, setCamaras] = useState<{ id: string; nombre: string }[]>([])

  // Dialog states
  const [descartarDialog, setDescartarDialog] = useState<ItemStock | null>(null)
  const [extenderDialog, setExtenderDialog] = useState<ItemStock | null>(null)
  const [motivoDescarte, setMotivoDescarte] = useState('')
  const [diasExtension, setDiasExtension] = useState('7')
  const [motivoExtension, setMotivoExtension] = useState('')
  const [procesando, setProcesando] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (tabActivo === 'criticos') params.append('estado', 'PROXIMO')
      if (tabActivo === 'proximos') params.append('estado', 'VENCIDO')
      if (filtroTipo !== 'all') params.append('tipo', filtroTipo)

      const res = await fetch(`/api/vencimientos-control?${params}`)
      const data = await res.json()
      if (data.success) {
        setItems(data.data || [])
        setResumen(data.resumen || { vencidos: 0, proximos7: 0, ok: 0, total: 0, pesoVencido: 0, pesoProximo: 0 })
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [tabActivo, filtroTipo])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useEffect(() => {
    const fetchCamaras = async () => {
      try {
        const res = await fetch('/api/camaras?activo=true')
        const data = await res.json()
        if (data.success) {
          setCamaras(data.data || [])
        }
      } catch (e) {
        // ignore
      }
    }
    fetchCamaras()
  }, [])

  // Filter items by search
  const itemsFiltrados = busqueda
    ? items.filter(i =>
        i.producto.toLowerCase().includes(busqueda.toLowerCase()) ||
        i.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
        i.lote.toLowerCase().includes(busqueda.toLowerCase()) ||
        i.camara.toLowerCase().includes(busqueda.toLowerCase())
      )
    : items

  // Handle discard
  const handleDescartar = async () => {
    if (!descartarDialog || !motivoDescarte.trim()) {
      toast.error('Ingrese un motivo para el descarte')
      return
    }
    setProcesando(true)
    try {
      const res = await fetch('/api/vencimientos-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: descartarDialog.id,
          tipo: descartarDialog.tipo,
          motivo: motivoDescarte,
          operadorId: operador?.id
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Producto descartado correctamente')
        setDescartarDialog(null)
        setMotivoDescarte('')
        fetchItems()
      } else {
        toast.error(data.error || 'Error al descartar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setProcesando(false)
    }
  }

  // Handle extend
  const handleExtender = async () => {
    if (!extenderDialog || !diasExtension) {
      toast.error('Ingrese los días de extensión')
      return
    }
    setProcesando(true)
    try {
      const res = await fetch('/api/vencimientos-control', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: extenderDialog.id,
          tipo: extenderDialog.tipo,
          diasExtension: parseInt(diasExtension),
          motivo: motivoExtension,
          operadorId: operador?.id
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Vencimiento extendido ${diasExtension} días`)
        setExtenderDialog(null)
        setDiasExtension('7')
        setMotivoExtension('')
        fetchItems()
      } else {
        toast.error(data.error || 'Error al extender')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setProcesando(false)
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    const header = 'Tipo,Código,Lote,Producto,Peso (kg),Cámara,Fecha Ingreso,Fecha Vencimiento,Días Restantes,Estado\n'
    const rows = itemsFiltrados.map(i =>
      `"${i.tipo}","${i.codigo}","${i.lote}","${i.producto}",${i.peso},"${i.camara}","${formatearFecha(i.fechaIngreso)}","${formatearFecha(i.fechaVencimiento)}",${i.diasRestantes},"${i.estado}"`
    ).join('\n')

    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `control_vencimientos_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Exportado correctamente')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Control de Vencimientos</h1>
            <p className="text-stone-500 mt-1">Gestión FIFO y alertas de vencimiento de productos en cámara</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchItems}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-1" /> CSV
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className={`border-l-4 ${resumen.vencidos > 0 ? 'border-l-red-500' : 'border-l-green-500'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Vencidos</p>
                  <p className="text-2xl font-bold text-red-600">{resumen.vencidos}</p>
                  <p className="text-xs text-stone-400">{resumen.pesoVencido.toFixed(0)} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Próximos (≤7d)</p>
                  <p className="text-2xl font-bold text-yellow-600">{resumen.proximos7}</p>
                  <p className="text-xs text-stone-400">{resumen.pesoProximo.toFixed(0)} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">OK</p>
                  <p className="text-2xl font-bold text-green-600">{resumen.ok}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Total en Stock</p>
                  <p className="text-2xl font-bold text-blue-600">{resumen.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={tabActivo} onValueChange={(v) => setTabActivo(v as 'criticos' | 'proximos' | 'todos')}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="criticos" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Próximos a vencer
                {resumen.proximos7 > 0 && (
                  <Badge className="bg-yellow-500 text-white ml-1">{resumen.proximos7}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="proximos" className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                Vencidos
                {resumen.vencidos > 0 && (
                  <Badge className="bg-red-500 text-white ml-1">{resumen.vencidos}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="todos" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Todos
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={tabActivo}>
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <CardTitle className="text-lg">
                    {tabActivo === 'criticos' && 'Productos próximos a vencer (≤7 días)'}
                    {tabActivo === 'proximos' && 'Productos vencidos'}
                    {tabActivo === 'todos' && 'Todos los productos en stock'}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        <SelectItem value="MEDIA_RES">Medias Res</SelectItem>
                        <SelectItem value="CAJA">Cajas</SelectItem>
                        <SelectItem value="PRODUCTO">Productos</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        className="pl-10 w-[200px]"
                        placeholder="Buscar..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50">
                        <TableHead>Estado</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead className="text-right">Peso</TableHead>
                        <TableHead>Cámara</TableHead>
                        <TableHead>Ingreso</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead className="text-right">Días</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itemsFiltrados.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8 text-stone-400">
                            <CheckCircle className="w-10 h-10 mx-auto mb-2" />
                            <p>No hay items en esta categoría</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        itemsFiltrados.map(item => (
                          <TableRow key={item.id} className={getRowColor(item.estado)}>
                            <TableCell>
                              <Badge className={getEstadoColor(item.estado)}>
                                {item.estado}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{item.tipo}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{item.producto}</TableCell>
                            <TableCell className="font-mono text-sm text-stone-600">{item.lote}</TableCell>
                            <TableCell className="text-right">
                              <span className="font-medium">{item.peso.toFixed(1)}</span>
                              <span className="text-xs text-stone-400 ml-1">kg</span>
                            </TableCell>
                            <TableCell className="text-sm">{item.camara}</TableCell>
                            <TableCell className="text-sm text-stone-500">{formatearFecha(item.fechaIngreso)}</TableCell>
                            <TableCell className="text-sm">{formatearFecha(item.fechaVencimiento)}</TableCell>
                            <TableCell className="text-right">
                              <span className={`text-lg font-bold ${
                                item.estado === 'VENCIDO' ? 'text-red-600' :
                                item.estado === 'PROXIMO' ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {item.diasRestantes}
                              </span>
                              <span className="text-xs text-stone-400 ml-0.5">d</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setDescartarDialog(item)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => setExtenderDialog(item)}
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-3 border-t bg-stone-50 text-sm text-stone-500">
                  Mostrando {itemsFiltrados.length} de {items.length} productos
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Discard Dialog */}
        <Dialog open={!!descartarDialog} onOpenChange={() => setDescartarDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Descartar Producto
              </DialogTitle>
              <DialogDescription>
                Esta acción registrará el descarte del producto. El stock será actualizado.
              </DialogDescription>
            </DialogHeader>
            {descartarDialog && (
              <div className="space-y-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-medium">{descartarDialog.producto}</p>
                  <p className="text-sm text-stone-600">
                    {descartarDialog.tipo} | {descartarDialog.codigo} | {descartarDialog.peso.toFixed(1)} kg
                  </p>
                  <p className="text-sm text-red-600">
                    Vencido: {formatearFecha(descartarDialog.fechaVencimiento)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Motivo del descarte *</Label>
                  <Input
                    value={motivoDescarte}
                    onChange={(e) => setMotivoDescarte(e.target.value)}
                    placeholder="Ej: Vencimiento de fecha, deterioro..."
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDescartarDialog(null)}>
                Cancelar
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDescartar}
                disabled={procesando || !motivoDescarte.trim()}
              >
                {procesando ? 'Procesando...' : 'Confirmar Descarte'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Extend Dialog */}
        <Dialog open={!!extenderDialog} onOpenChange={() => setExtenderDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-600">
                <ArrowRight className="w-5 h-5" />
                Extender Fecha de Vencimiento
              </DialogTitle>
              <DialogDescription>
                Extienda la fecha de vencimiento del producto. Se registrará la modificación en auditoría.
              </DialogDescription>
            </DialogHeader>
            {extenderDialog && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-medium">{extenderDialog.producto}</p>
                  <p className="text-sm text-stone-600">
                    {extenderDialog.tipo} | {extenderDialog.codigo} | {extenderDialog.peso.toFixed(1)} kg
                  </p>
                  <p className="text-sm text-stone-500">
                    Vencimiento actual: {formatearFecha(extenderDialog.fechaVencimiento)}
                    <span className="ml-2 text-yellow-600 font-medium">({extenderDialog.diasRestantes} días restantes)</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Días a extender *</Label>
                  <Select value={diasExtension} onValueChange={setDiasExtension}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 días</SelectItem>
                      <SelectItem value="7">7 días</SelectItem>
                      <SelectItem value="15">15 días</SelectItem>
                      <SelectItem value="30">30 días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Motivo</Label>
                  <Input
                    value={motivoExtension}
                    onChange={(e) => setMotivoExtension(e.target.value)}
                    placeholder="Ej: Producto en buen estado, reinspección..."
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setExtenderDialog(null)}>
                Cancelar
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleExtender}
                disabled={procesando}
              >
                {procesando ? 'Procesando...' : 'Extender Vencimiento'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default ControlVencimientosModule
