'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ArrowRight, Loader2, Search, Warehouse, ArrowLeftRight } from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  permisos: Record<string, boolean>
}

export function MovimientosCamaraModule({ operador }: { operador: Operador }) {
  const [loading, setLoading] = useState(true)
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [camaras, setCamaras] = useState<any[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Form state
  const [camaraOrigenId, setCamaraOrigenId] = useState('')
  const [camaraDestinoId, setCamaraDestinoId] = useState('')
  const [tipoProducto, setTipoProducto] = useState('MEDIA_RES')
  const [cantidad, setCantidad] = useState(1)
  const [peso, setPeso] = useState(0)
  const [observaciones, setObservaciones] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resMov, resCamaras] = await Promise.all([
        fetch('/api/movimientos-camara'),
        fetch('/api/camaras')
      ])
      
      const dataMov = await resMov.json()
      const dataCamaras = await resCamaras.json()
      
      if (dataMov.success) setMovimientos(dataMov.data || [])
      if (dataCamaras.success) setCamaras(dataCamaras.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async () => {
    if (!camaraOrigenId || !camaraDestinoId || camaraOrigenId === camaraDestinoId) {
      toast.error('Seleccione cámaras de origen y destino diferentes')
      return
    }
    
    setProcessing(true)
    try {
      const res = await fetch('/api/movimientos-camara', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camaraOrigenId,
          camaraDestinoId,
          tipoProducto,
          cantidad,
          peso,
          observaciones,
          operadorId: operador.id
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success('Movimiento registrado correctamente')
        setShowDialog(false)
        resetForm()
        fetchData()
      } else {
        toast.error(data.error || 'Error al registrar movimiento')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setProcessing(false)
    }
  }

  const resetForm = () => {
    setCamaraOrigenId('')
    setCamaraDestinoId('')
    setTipoProducto('MEDIA_RES')
    setCantidad(1)
    setPeso(0)
    setObservaciones('')
  }

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'MEDIA_RES': return 'border-amber-300 text-amber-600'
      case 'CUARTO': return 'border-emerald-300 text-emerald-600'
      case 'PRODUCTO_TERMINADO': return 'border-purple-300 text-purple-600'
      default: return 'border-stone-300 text-stone-600'
    }
  }

  const filteredMovimientos = movimientos.filter(m => 
    m.camaraOrigen?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.camaraDestino?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-3">
              <ArrowLeftRight className="w-8 h-8 text-amber-500" />
              Movimientos de Cámara
            </h1>
            <p className="text-stone-500 mt-1">
              Transferencias de mercadería entre cámaras
            </p>
          </div>
          
          <div className="flex gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Buscar cámara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button className="bg-amber-500 hover:bg-amber-600" onClick={() => setShowDialog(true)}>
              <ArrowRight className="w-4 h-4 mr-1" />
              Nuevo Movimiento
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500">Total Movimientos</p>
              <p className="text-2xl font-bold text-stone-800">{movimientos.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500">Cámaras Activas</p>
              <p className="text-2xl font-bold text-stone-800">{camaras.filter(c => c.activo).length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500">Hoy</p>
              <p className="text-2xl font-bold text-stone-800">
                {movimientos.filter(m => new Date(m.fecha).toDateString() === new Date().toDateString()).length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500">Peso Movido Hoy</p>
              <p className="text-2xl font-bold text-stone-800">
                {movimientos
                  .filter(m => new Date(m.fecha).toDateString() === new Date().toDateString())
                  .reduce((acc, m) => acc + (m.peso || 0), 0).toFixed(1)} kg
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de movimientos */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold text-stone-800">
              Historial de Transferencias
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredMovimientos.length === 0 ? (
              <div className="p-12 text-center text-stone-400">
                <Warehouse className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay movimientos registrados</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredMovimientos.map((mov) => (
                  <div key={mov.id} className="p-4 hover:bg-stone-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-stone-100 p-2 rounded-lg">
                        <ArrowRight className="w-5 h-5 text-stone-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-stone-800">{mov.camaraOrigen?.nombre}</span>
                          <ArrowRight className="w-4 h-4 text-amber-500" />
                          <span className="font-medium text-stone-800">{mov.camaraDestino?.nombre}</span>
                        </div>
                        <p className="text-sm text-stone-500">
                          {new Date(mov.fecha).toLocaleString('es-AR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-stone-800">{mov.cantidad} un</p>
                        <p className="text-sm text-stone-500">{mov.peso?.toFixed(2)} kg</p>
                      </div>
                      <Badge variant="outline" className={getTipoBadgeColor(mov.tipoProducto)}>
                        {mov.tipoProducto?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Nuevo Movimiento */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md" maximizable>
          <DialogHeader>
            <DialogTitle>Nueva Transferencia</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cámara Origen</Label>
              <Select value={camaraOrigenId} onValueChange={setCamaraOrigenId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar origen" />
                </SelectTrigger>
                <SelectContent>
                  {camaras.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre} ({c.tipo})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Cámara Destino</Label>
              <Select value={camaraDestinoId} onValueChange={setCamaraDestinoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar destino" />
                </SelectTrigger>
                <SelectContent>
                  {camaras.filter((c: any) => c.id !== camaraOrigenId).map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre} ({c.tipo})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Tipo de Producto</Label>
              <Select value={tipoProducto} onValueChange={setTipoProducto}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEDIA_RES">Media Res</SelectItem>
                  <SelectItem value="CUARTO">Cuarto</SelectItem>
                  <SelectItem value="PRODUCTO_TERMINADO">Producto Terminado</SelectItem>
                  <SelectItem value="MENUDENCIA">Menudencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input type="number" value={cantidad} onChange={(e) => setCantidad(parseInt(e.target.value) || 1)} min={1} />
              </div>
              
              <div className="space-y-2">
                <Label>Peso (kg)</Label>
                <Input type="number" step="0.01" value={peso || ''} onChange={(e) => setPeso(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button className="bg-amber-500 hover:bg-amber-600" onClick={handleGuardar} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar Transferencia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
