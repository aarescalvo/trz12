'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Truck, Loader2, RefreshCw, Plus, Package, Send, Eye, CheckCircle, Printer
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Despacho {
  id: string
  fecha: string
  numeroRemito: string
  destino: string
  transportista: string
  patente: string
  cantidadBultos: number
  pesoTotal: number
  estado: 'PREPARADO' | 'DESPACHADO' | 'ENTREGADO'
  observaciones?: string
  operador: string
}

interface Props {
  operador: Operador
}

export function DespachosModule({ operador }: Props) {
  const [despachos, setDespachos] = useState<Despacho[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'TODOS' | 'PREPARADO' | 'DESPACHADO' | 'ENTREGADO'>('PREPARADO')
  
  // Form state
  const [destino, setDestino] = useState('')
  const [transportista, setTransportista] = useState('')
  const [patente, setPatente] = useState('')
  const [cantidadBultos, setCantidadBultos] = useState('')
  const [pesoTotal, setPesoTotal] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDespachos()
  }, [])

  const fetchDespachos = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setDespachos([
        {
          id: '1',
          fecha: new Date().toISOString(),
          numeroRemito: 'REM-0001',
          destino: 'Carnicería Don José',
          transportista: 'Transportes López',
          patente: 'AB 123 CD',
          cantidadBultos: 24,
          pesoTotal: 1200,
          estado: 'PREPARADO',
          operador: 'Juan Pérez'
        },
        {
          id: '2',
          fecha: new Date().toISOString(),
          numeroRemito: 'REM-0002',
          destino: 'Supermercados del Valle',
          transportista: 'Logística Norte',
          patente: 'CD 456 EF',
          cantidadBultos: 36,
          pesoTotal: 1800,
          estado: 'DESPACHADO',
          operador: 'María García'
        },
        {
          id: '3',
          fecha: new Date(Date.now() - 86400000).toISOString(),
          numeroRemito: 'REM-0003',
          destino: 'Frigorífico Regional',
          transportista: 'Transportes López',
          patente: 'GH 789 IJ',
          cantidadBultos: 18,
          pesoTotal: 900,
          estado: 'ENTREGADO',
          operador: 'Carlos López'
        }
      ])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar despachos')
    } finally {
      setLoading(false)
    }
  }

  const handleDespachar = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      setDespachos(despachos.map(d => 
        d.id === id ? { ...d, estado: 'DESPACHADO' } : d
      ))
      toast.success('Despacho realizado correctamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al despachar')
    }
  }

  const handleConfirmarEntrega = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      setDespachos(despachos.map(d => 
        d.id === id ? { ...d, estado: 'ENTREGADO' } : d
      ))
      toast.success('Entrega confirmada')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al confirmar entrega')
    }
  }

  const handleNuevoDespacho = async () => {
    if (!destino || !transportista || !cantidadBultos) {
      toast.error('Complete todos los campos obligatorios')
      return
    }

    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const nuevoDespacho: Despacho = {
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        numeroRemito: `REM-${String(despachos.length + 1).padStart(4, '0')}`,
        destino,
        transportista,
        patente,
        cantidadBultos: parseInt(cantidadBultos),
        pesoTotal: parseFloat(pesoTotal) || 0,
        observaciones,
        estado: 'PREPARADO',
        operador: operador.nombre
      }
      
      setDespachos([nuevoDespacho, ...despachos])
      setDestino('')
      setTransportista('')
      setPatente('')
      setCantidadBultos('')
      setPesoTotal('')
      setObservaciones('')
      setDialogOpen(false)
      toast.success('Despacho creado correctamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al crear despacho')
    } finally {
      setSaving(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PREPARADO':
        return <Badge className="bg-amber-100 text-amber-700">Preparado</Badge>
      case 'DESPACHADO':
        return <Badge className="bg-blue-100 text-blue-700">Despachado</Badge>
      case 'ENTREGADO':
        return <Badge className="bg-emerald-100 text-emerald-700">Entregado</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const despachosFiltrados = despachos.filter(d => 
    filtro === 'TODOS' || d.estado === filtro
  )

  const preparados = despachos.filter(d => d.estado === 'PREPARADO').length
  const despachados = despachos.filter(d => d.estado === 'DESPACHADO').length
  const entregados = despachos.filter(d => d.estado === 'ENTREGADO').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Truck className="w-8 h-8 text-amber-500" />
              Despachos
            </h1>
            <p className="text-stone-500 mt-1">Control de despachos y entregas</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchDespachos} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Despacho
            </Button>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('TODOS')}>
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Total</p>
              <p className="text-3xl font-bold text-stone-800">{despachos.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('PREPARADO')}>
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Preparados</p>
              <p className="text-3xl font-bold text-amber-600">{preparados}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('DESPACHADO')}>
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">En Camino</p>
              <p className="text-3xl font-bold text-blue-600">{despachados}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('ENTREGADO')}>
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Entregados</p>
              <p className="text-3xl font-bold text-emerald-600">{entregados}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Peso Total</p>
              <p className="text-3xl font-bold text-stone-800">{despachos.reduce((acc, d) => acc + d.pesoTotal, 0).toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-stone-600">Filtrar:</span>
              <div className="flex gap-2">
                {(['TODOS', 'PREPARADO', 'DESPACHADO', 'ENTREGADO'] as const).map((f) => (
                  <Button
                    key={f}
                    variant={filtro === f ? 'default' : 'outline'}
                    size="sm"
                    className={filtro === f ? 'bg-amber-500 hover:bg-amber-600' : ''}
                    onClick={() => setFiltro(f)}
                  >
                    {f === 'TODOS' ? 'Todos' : f === 'PREPARADO' ? 'Preparados' : f === 'DESPACHADO' ? 'En Camino' : 'Entregados'}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              Despachos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : despachosFiltrados.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <Truck className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No hay despachos</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Remito</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Transportista</TableHead>
                    <TableHead>Bultos</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {despachosFiltrados.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        {new Date(d.fecha).toLocaleDateString('es-AR')}
                      </TableCell>
                      <TableCell className="font-mono">{d.numeroRemito}</TableCell>
                      <TableCell>{d.destino}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{d.transportista}</p>
                          <p className="text-xs text-stone-400">{d.patente}</p>
                        </div>
                      </TableCell>
                      <TableCell>{d.cantidadBultos}</TableCell>
                      <TableCell>{d.pesoTotal.toLocaleString()} kg</TableCell>
                      <TableCell>{getEstadoBadge(d.estado)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {d.estado === 'PREPARADO' && (
                            <Button
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600"
                              onClick={() => handleDespachar(d.id)}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Despachar
                            </Button>
                          )}
                          {d.estado === 'DESPACHADO' && (
                            <Button
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600"
                              onClick={() => handleConfirmarEntrega(d.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Confirmar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toast.info('Imprimir remito - En desarrollo')}
                          >
                            <Printer className="w-4 h-4" />
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

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nuevo Despacho</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Destino *</Label>
                <Input value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Cliente/Destino" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Transportista *</Label>
                  <Input value={transportista} onChange={(e) => setTransportista(e.target.value)} placeholder="Nombre" />
                </div>
                <div className="space-y-2">
                  <Label>Patente</Label>
                  <Input value={patente} onChange={(e) => setPatente(e.target.value.toUpperCase())} placeholder="AB 123 CD" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cantidad Bultos *</Label>
                  <Input type="number" value={cantidadBultos} onChange={(e) => setCantidadBultos(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Peso Total (kg)</Label>
                  <Input type="number" value={pesoTotal} onChange={(e) => setPesoTotal(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Notas adicionales" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleNuevoDespacho} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Crear Despacho
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default DespachosModule
