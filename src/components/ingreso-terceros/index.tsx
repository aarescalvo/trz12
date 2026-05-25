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
import { LogIn, Loader2, Search, Plus, Building2 } from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  permisos: Record<string, boolean>
}

interface Cliente {
  id: string
  nombre: string
  cuit: string
}

interface Camara {
  id: string
  nombre: string
  tipo: string
}

export function IngresoTercerosModule({ operador }: { operador: Operador }) {
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [camaras, setCamaras] = useState<Camara[]>([])
  const [ingresos, setIngresos] = useState<any[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Form state
  const [terceroId, setTerceroId] = useState('')
  const [tipoCuarto, setTipoCuarto] = useState<'A' | 'D' | 'T'>('A')
  const [tipificacion, setTipificacion] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [pesoTotal, setPesoTotal] = useState(0)
  const [camaraDestinoId, setCamaraDestinoId] = useState('')
  const [dte, setDte] = useState('')
  const [guia, setGuia] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resClientes, resCamaras, resIngresos] = await Promise.all([
        fetch('/api/clientes'),
        fetch('/api/camaras'),
        fetch('/api/ingreso-terceros')
      ])
      
      const dataClientes = await resClientes.json()
      const dataCamaras = await resCamaras.json()
      const dataIngresos = await resIngresos.json()
      
      if (dataClientes.success) setClientes(dataClientes.data || [])
      if (dataCamaras.success) setCamaras((dataCamaras.data || []).filter((c: Camara) => c.tipo === 'CUARTEO'))
      if (dataIngresos.success) setIngresos(dataIngresos.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async () => {
    if (!terceroId || cantidad <= 0 || pesoTotal <= 0) {
      toast.error('Complete todos los campos obligatorios')
      return
    }
    
    setProcessing(true)
    try {
      const res = await fetch('/api/ingreso-terceros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terceroId,
          tipoCuarto,
          tipificacion,
          cantidad,
          pesoTotal,
          camaraDestinoId,
          dte,
          guia,
          operadorId: operador.id
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success('Ingreso de terceros registrado correctamente')
        setShowDialog(false)
        resetForm()
        fetchData()
      } else {
        toast.error(data.error || 'Error al registrar ingreso')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setProcessing(false)
    }
  }

  const resetForm = () => {
    setTerceroId('')
    setTipoCuarto('A')
    setTipificacion('')
    setCantidad(1)
    setPesoTotal(0)
    setCamaraDestinoId('')
    setDte('')
    setGuia('')
  }

  const filteredIngresos = ingresos.filter(i => 
    i.tercero?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
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
              <LogIn className="w-8 h-8 text-amber-500" />
              Ingreso Terceros
            </h1>
            <p className="text-stone-500 mt-1">
              Ingreso de cuartos de equino de proveedores externos
            </p>
          </div>
          
          <div className="flex gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button className="bg-amber-500 hover:bg-amber-600" onClick={() => setShowDialog(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Nuevo Ingreso
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500">Total Ingresos</p>
              <p className="text-2xl font-bold text-stone-800">{ingresos.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500">Cuartos Ingresados</p>
              <p className="text-2xl font-bold text-stone-800">
                {ingresos.reduce((acc, i) => acc + (i.cantidad || 0), 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500">Peso Total</p>
              <p className="text-2xl font-bold text-stone-800">
                {ingresos.reduce((acc, i) => acc + (i.pesoTotal || 0), 0).toFixed(1)} kg
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de ingresos */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold text-stone-800">
              Historial de Ingresos (Solo Equino)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredIngresos.length === 0 ? (
              <div className="p-12 text-center text-stone-400">
                <LogIn className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay ingresos de terceros registrados</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredIngresos.map((ingreso) => (
                  <div key={ingreso.id} className="p-4 hover:bg-stone-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-100 p-2 rounded-lg">
                        <Building2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-mono font-bold text-stone-800">{ingreso.codigo}</p>
                        <p className="text-sm text-stone-500">{ingreso.tercero?.nombre}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-stone-800">{ingreso.cantidad} cuartos</p>
                        <p className="text-sm text-stone-500">{ingreso.pesoTotal?.toFixed(2)} kg</p>
                      </div>
                      <Badge variant="outline" className="border-emerald-300 text-emerald-600">
                        {ingreso.tipoCuarto} - {ingreso.especie}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Nuevo Ingreso */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg" maximizable>
          <DialogHeader>
            <DialogTitle>Nuevo Ingreso de Terceros</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label>Proveedor (Equino)</Label>
              <Select value={terceroId} onValueChange={setTerceroId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tercero" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Tipo de Cuarto</Label>
              <Select value={tipoCuarto} onValueChange={(v) => setTipoCuarto(v as 'A' | 'D' | 'T')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Asado (A)</SelectItem>
                  <SelectItem value="D">Delantero (D)</SelectItem>
                  <SelectItem value="T">Trasero (T)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Tipificación</Label>
              <Input value={tipificacion} onChange={(e) => setTipificacion(e.target.value)} placeholder="Ej: A" />
            </div>
            
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input type="number" value={cantidad} onChange={(e) => setCantidad(parseInt(e.target.value) || 0)} min={1} />
            </div>
            
            <div className="space-y-2">
              <Label>Peso Total (kg)</Label>
              <Input type="number" step="0.01" value={pesoTotal || ''} onChange={(e) => setPesoTotal(parseFloat(e.target.value) || 0)} />
            </div>
            
            <div className="space-y-2">
              <Label>Cámara Destino</Label>
              <Select value={camaraDestinoId} onValueChange={setCamaraDestinoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {camaras.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>DTE (Opcional)</Label>
              <Input value={dte} onChange={(e) => setDte(e.target.value)} />
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label>Guía de Tránsito (Opcional)</Label>
              <Input value={guia} onChange={(e) => setGuia(e.target.value)} />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button className="bg-amber-500 hover:bg-amber-600" onClick={handleGuardar} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar Ingreso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
