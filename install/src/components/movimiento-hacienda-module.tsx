'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Beef, Search, Eye, Edit, Warehouse, Skull,
  Move, AlertTriangle, CheckCircle, RefreshCw, ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

const ESTADOS = [
  { id: 'RECIBIDO', label: 'Recibido', color: 'bg-amber-100 text-amber-700' },
  { id: 'EN_CORRAL', label: 'En Corral', color: 'bg-blue-100 text-blue-700' },
  { id: 'EN_PESAJE', label: 'En Pesaje', color: 'bg-purple-100 text-purple-700' },
  { id: 'PESADO', label: 'Pesado', color: 'bg-green-100 text-green-700' },
  { id: 'LISTO_FAENA', label: 'Listo Faena', color: 'bg-cyan-100 text-cyan-700' },
  { id: 'EN_FAENA', label: 'En Faena', color: 'bg-orange-100 text-orange-700' },
  { id: 'FAENADO', label: 'Faenado', color: 'bg-gray-100 text-gray-700' },
  { id: 'DESPACHADO', label: 'Despachado', color: 'bg-stone-100 text-stone-500' },
]

interface Tropa {
  id: string
  numero: number
  codigo: string
  productor?: { id: string; nombre: string }
  usuarioFaena: { id: string; nombre: string }
  especie: string
  cantidadCabezas: number
  corral?: { id: string; nombre: string } | string
  corralId?: string
  estado: string
  fechaRecepcion: string
  pesoBruto?: number
  pesoTara?: number
  pesoNeto?: number
  pesoTotalIndividual?: number
  dte?: string
  guia?: string
  observaciones?: string
  tiposAnimales?: { tipoAnimal: string; cantidad: number }[]
  animales?: Animal[]
}

interface Animal {
  id: string
  numero: number
  codigo: string
  tipoAnimal: string
  caravana?: string
  raza?: string
  pesoVivo?: number
  estado: string
  corral?: string
  fechaBaja?: string
  motivoBaja?: string
}

interface CorralDB {
  id: string
  nombre: string
  capacidad: number
  stockBovinos: number
  stockEquinos: number
  observaciones?: string
  disponible?: number
  puedeRecibir?: boolean
  stockActual?: number
}

interface Operador {
  id: string
  nombre: string
  rol: string
}

export function MovimientoHaciendaModule({ operador }: { operador: Operador }) {
  const [tropas, setTropas] = useState<Tropa[]>([])
  const [corrales, setCorrales] = useState<CorralDB[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [activeTab, setActiveTab] = useState('pendientes')
  
  // Dialogs
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [moverOpen, setMoverOpen] = useState(false)
  const [bajaOpen, setBajaOpen] = useState(false)
  const [tropaSeleccionada, setTropaSeleccionada] = useState<Tropa | null>(null)
  const [animalSeleccionado, setAnimalSeleccionado] = useState<Animal | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Mover corral
  const [corralDestinoId, setCorralDestinoId] = useState('')
  
  // Baja
  const [motivoBaja, setMotivoBaja] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [tropasRes, corralesRes] = await Promise.all([
        fetch('/api/tropas'),
        fetch('/api/tropas/mover?especie=BOVINO')
      ])
      
      const tropasData = await tropasRes.json()
      const corralesData = await corralesRes.json()
      
      if (tropasData.success) {
        setTropas(tropasData.data)
      }
      
      if (corralesData.success) {
        setCorrales(corralesData.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleVerDetalle = async (tropa: Tropa) => {
    try {
      const res = await fetch(`/api/tropas/${tropa.id}`)
      const data = await res.json()
      if (data.success) {
        setTropaSeleccionada(data.data)
        setDetalleOpen(true)
      }
    } catch (error) {
      toast.error('Error al cargar detalle')
    }
  }

  const handleMoverCorral = async () => {
    if (!tropaSeleccionada || !corralDestinoId) {
      toast.error('Seleccione el corral destino')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/tropas/mover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tropaId: tropaSeleccionada.id,
          corralDestinoId,
          operadorId: operador.id
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        const corralDestino = corrales.find(c => c.id === corralDestinoId)
        toast.success(`✅ Tropa ${tropaSeleccionada.codigo} movida a ${corralDestino?.nombre}`, { duration: 5000 })
        setMoverOpen(false)
        setCorralDestinoId('')
        fetchData()
      } else {
        toast.error(data.error || 'Error al mover tropa')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleBajaAnimal = async () => {
    if (!animalSeleccionado || !motivoBaja) {
      toast.error('Ingrese el motivo de la baja')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/animales/baja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animalId: animalSeleccionado.id,
          motivoBaja
        })
      })
      
      if (res.ok) {
        toast.success('Baja registrada')
        setBajaOpen(false)
        setMotivoBaja('')
        fetchData()
      } else {
        toast.error('Error al registrar baja')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Filtrar tropas
  const tropasFiltradas = tropas.filter(tropa => {
    if (filtroEstado !== 'todos' && tropa.estado !== filtroEstado) return false
    if (busqueda) {
      const search = busqueda.toLowerCase()
      return (
        tropa.codigo.toLowerCase().includes(search) ||
        tropa.usuarioFaena.nombre.toLowerCase().includes(search) ||
        tropa.productor?.nombre?.toLowerCase().includes(search)
      )
    }
    return true
  })

  // Tropas pendientes de asignar a corral
  const tropasSinCorral = tropas.filter(t => !t.corralId && t.estado === 'RECIBIDO')

  const getEstadoBadge = (estado: string) => {
    const est = ESTADOS.find(e => e.id === estado)
    return (
      <Badge className={est?.color || 'bg-gray-100'}>
        {est?.label || estado}
      </Badge>
    )
  }

  // Calcular totales
  const totalEnCorrales = corrales.reduce((acc, c) => acc + c.stockBovinos + c.stockEquinos, 0)
  const corralesOcupados = corrales.filter(c => c.stockBovinos > 0 || c.stockEquinos > 0).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-stone-800">Movimiento de Hacienda</h2>
            <p className="text-stone-500">Control y asignación de tropas a corrales</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Beef className="h-4 w-4 mr-2 text-amber-500" />
              {totalEnCorrales} animales en {corralesOcupados} corrales
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pendientes" className="relative">
              Pendientes de Asignación
              {tropasSinCorral.length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">{tropasSinCorral.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="corrales">Stock por Corral</TabsTrigger>
            <TabsTrigger value="tropas">Todas las Tropas</TabsTrigger>
          </TabsList>

          {/* TROPAS PENDIENTES DE ASIGNACIÓN */}
          <TabsContent value="pendientes" className="space-y-6">
            {tropasSinCorral.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500 opacity-50" />
                  <p className="text-lg text-stone-600">No hay tropas pendientes de asignación</p>
                  <p className="text-sm text-stone-400 mt-1">Todas las tropas tienen corral asignado</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lista de tropas pendientes */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-amber-50 rounded-t-lg">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Beef className="w-5 h-5 text-amber-600" />
                      Tropas Sin Corral Asignado
                    </CardTitle>
                    <CardDescription>
                      Seleccione una tropa para asignarle corral
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {tropasSinCorral.map((tropa) => (
                        <div 
                          key={tropa.id} 
                          className={`p-4 cursor-pointer hover:bg-stone-50 transition-colors ${
                            tropaSeleccionada?.id === tropa.id ? 'bg-amber-50 border-l-4 border-amber-500' : ''
                          }`}
                          onClick={() => setTropaSeleccionada(tropa)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-mono font-bold text-stone-800">{tropa.codigo}</p>
                              <p className="text-sm text-stone-500">{tropa.usuarioFaena.nombre}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-lg">
                                {tropa.cantidadCabezas} animales
                              </Badge>
                              <p className="text-xs text-stone-400 mt-1">
                                {tropa.especie}
                              </p>
                            </div>
                          </div>
                          {tropa.tiposAnimales && tropa.tiposAnimales.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {tropa.tiposAnimales.map((t, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {t.tipoAnimal}: {t.cantidad}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Selector de corral */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-blue-50 rounded-t-lg">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Warehouse className="w-5 h-5 text-blue-600" />
                      Asignar a Corral
                    </CardTitle>
                    <CardDescription>
                      {tropaSeleccionada 
                        ? `Tropa ${tropaSeleccionada.codigo} - ${tropaSeleccionada.cantidadCabezas} animales`
                        : 'Seleccione una tropa primero'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    {!tropaSeleccionada ? (
                      <div className="py-8 text-center text-stone-400">
                        <ArrowRight className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Seleccione una tropa de la izquierda</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {corrales.map((corral) => {
                          const isSelected = corralDestinoId === corral.id
                          const canReceive = (corral.disponible || 0) >= tropaSeleccionada.cantidadCabezas
                          
                          return (
                            <div
                              key={corral.id}
                              onClick={() => canReceive && setCorralDestinoId(corral.id)}
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                isSelected 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : canReceive 
                                    ? 'border-gray-200 hover:border-gray-300 hover:bg-stone-50' 
                                    : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-stone-800">{corral.nombre}</span>
                                {canReceive ? (
                                  <Badge className="bg-green-100 text-green-700">Disponible</Badge>
                                ) : (
                                  <Badge variant="destructive">Sin capacidad</Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div>
                                  <p className="text-stone-400">Capacidad</p>
                                  <p className="font-bold">{corral.capacidad}</p>
                                </div>
                                <div>
                                  <p className="text-stone-400">Ocupado</p>
                                  <p className="font-bold">{corral.stockActual || 0}</p>
                                </div>
                                <div>
                                  <p className="text-stone-400">Disponible</p>
                                  <p className={`font-bold ${canReceive ? 'text-green-600' : 'text-red-600'}`}>
                                    {corral.disponible || 0}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        
                        <Button
                          onClick={handleMoverCorral}
                          disabled={saving || !corralDestinoId}
                          className="w-full h-12 bg-blue-600 hover:bg-blue-700 mt-4"
                        >
                          {saving ? 'Asignando...' : (
                            <>
                              <Move className="w-4 h-4 mr-2" />
                              Asignar Corral
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* STOCK POR CORRAL */}
          <TabsContent value="corrales" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {corrales.map((corral) => {
                const isEmpty = corral.stockBovinos === 0 && corral.stockEquinos === 0
                const ocupacion = corral.capacidad > 0 
                  ? Math.round(((corral.stockActual || 0) / corral.capacidad) * 100) 
                  : 0
                
                return (
                  <Card 
                    key={corral.id} 
                    className={`border-0 shadow-md cursor-pointer transition-all hover:shadow-lg ${
                      isEmpty ? 'opacity-60' : ''
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Warehouse className={`w-5 h-5 ${isEmpty ? 'text-stone-400' : 'text-amber-500'}`} />
                          {corral.nombre}
                        </CardTitle>
                        <Badge 
                          variant={isEmpty ? 'secondary' : 'default'} 
                          className={isEmpty ? '' : 'bg-green-600'}
                        >
                          {isEmpty ? 'Vacío' : `${ocupacion}%`}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isEmpty ? (
                        <div className="text-center py-4 text-stone-400">
                          <Warehouse className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Sin animales</p>
                          <p className="text-xs">Capacidad: {corral.capacidad}</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-stone-800">{corral.stockBovinos}</p>
                              <p className="text-xs text-stone-500">Bovinos</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-stone-800">{corral.stockEquinos}</p>
                              <p className="text-xs text-stone-500">Equinos</p>
                            </div>
                          </div>
                          
                          {/* Barra de ocupación */}
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div 
                              className={`h-2 rounded-full ${
                                ocupacion >= 90 ? 'bg-red-500' : 
                                ocupacion >= 70 ? 'bg-amber-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(ocupacion, 100)}%` }}
                            />
                          </div>
                          
                          <p className="text-xs text-stone-500 text-center">
                            {corral.disponible} disponibles de {corral.capacidad}
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Resumen general */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-amber-50 rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Beef className="w-5 h-5 text-amber-600" />
                  Resumen de Stock
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-stone-800">{totalEnCorrales}</p>
                    <p className="text-sm text-stone-500">Total Animales</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{corralesOcupados}</p>
                    <p className="text-sm text-stone-500">Corrales Ocupados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-stone-400">{corrales.length - corralesOcupados}</p>
                    <p className="text-sm text-stone-500">Corrales Vacíos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">{tropasSinCorral.length}</p>
                    <p className="text-sm text-stone-500">Sin Asignar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TODAS LAS TROPAS */}
          <TabsContent value="tropas" className="space-y-6">
            {/* Filtros */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        placeholder="Buscar por tropa, cliente, productor..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      {ESTADOS.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de tropas */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                  <Beef className="w-5 h-5" />
                  Tropas Registradas
                </CardTitle>
                <CardDescription>
                  Mostrando {tropasFiltradas.length} de {tropas.length} tropas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">Cargando...</div>
                ) : tropasFiltradas.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <Beef className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay tropas que mostrar</p>
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white">
                        <TableRow>
                          <TableHead>Tropa</TableHead>
                          <TableHead>Usuario Faena</TableHead>
                          <TableHead>Especie</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Corral</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tropasFiltradas.map((tropa) => (
                          <TableRow key={tropa.id} className="hover:bg-stone-50">
                            <TableCell>
                              <div>
                                <span className="font-mono font-bold">{tropa.codigo}</span>
                                <div className="text-xs text-stone-400">
                                  {new Date(tropa.fechaRecepcion).toLocaleDateString('es-AR')}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{tropa.usuarioFaena.nombre}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{tropa.especie}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold">{tropa.cantidadCabezas}</span>
                              <span className="text-stone-400 text-sm ml-1">cab.</span>
                            </TableCell>
                            <TableCell>
                              {tropa.corralId ? (
                                <Badge className="bg-blue-100 text-blue-700">
                                  {typeof tropa.corral === 'object' ? tropa.corral?.nombre : tropa.corral}
                                </Badge>
                              ) : (
                                <Badge variant="destructive">Sin asignar</Badge>
                              )}
                            </TableCell>
                            <TableCell>{getEstadoBadge(tropa.estado)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleVerDetalle(tropa)}
                                  title="Ver detalle"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setTropaSeleccionada(tropa)
                                    setMoverOpen(true)
                                  }}
                                  title="Mover de corral"
                                  className="text-blue-600"
                                >
                                  <Move className="w-4 h-4" />
                                </Button>
                              </div>
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
        </Tabs>

        {/* Dialog Detalle */}
        <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalle de Tropa</DialogTitle>
            </DialogHeader>
            {tropaSeleccionada && (
              <div className="space-y-4 py-4">
                <div className="bg-amber-50 p-4 rounded-lg">
                  <div className="text-center">
                    <p className="text-3xl font-mono font-bold">{tropaSeleccionada.codigo}</p>
                    <p className="text-sm text-stone-500">Código de tropa</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-stone-500">Usuario Faena:</span>
                    <p className="font-medium">{tropaSeleccionada.usuarioFaena.nombre}</p>
                  </div>
                  <div>
                    <span className="text-stone-500">Productor:</span>
                    <p className="font-medium">{tropaSeleccionada.productor?.nombre || '-'}</p>
                  </div>
                  <div>
                    <span className="text-stone-500">Especie:</span>
                    <p className="font-medium">{tropaSeleccionada.especie}</p>
                  </div>
                  <div>
                    <span className="text-stone-500">Corral:</span>
                    <p className="font-medium">
                      {tropaSeleccionada.corralId 
                        ? (typeof tropaSeleccionada.corral === 'object' ? tropaSeleccionada.corral?.nombre : tropaSeleccionada.corral)
                        : 'Sin asignar'
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-stone-500">DTE:</span>
                    <p className="font-medium">{tropaSeleccionada.dte || '-'}</p>
                  </div>
                  <div>
                    <span className="text-stone-500">Guía:</span>
                    <p className="font-medium">{tropaSeleccionada.guia || '-'}</p>
                  </div>
                </div>

                {tropaSeleccionada.tiposAnimales && tropaSeleccionada.tiposAnimales.length > 0 && (
                  <div>
                    <span className="text-stone-500 text-sm">Tipos de Animales:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tropaSeleccionada.tiposAnimales.map((t, i) => (
                        <Badge key={i} variant="outline">
                          {t.tipoAnimal}: {t.cantidad}
                        </Badge>
                      ))}
                    </div>
                    <p className="font-bold mt-2">Total: {tropaSeleccionada.cantidadCabezas} cabezas</p>
                  </div>
                )}

                {/* Animales individuales */}
                {tropaSeleccionada.animales && tropaSeleccionada.animales.length > 0 && (
                  <div>
                    <span className="text-stone-500 text-sm">Animales Individuales ({tropaSeleccionada.animales.length}):</span>
                    <div className="max-h-40 overflow-y-auto mt-2 border rounded-lg p-2">
                      <Table size="sm">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tropaSeleccionada.animales.map((a) => (
                            <TableRow key={a.id}>
                              <TableCell>{a.numero}</TableCell>
                              <TableCell className="font-mono text-xs">{a.codigo}</TableCell>
                              <TableCell><Badge variant="outline" className="text-xs">{a.tipoAnimal}</Badge></TableCell>
                              <TableCell>
                                {a.estado === 'FALLECIDO' ? (
                                  <Badge className="bg-red-100 text-red-700 text-xs">
                                    <Skull className="w-3 h-3 mr-1" />
                                    Fallecido
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">{a.estado}</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-stone-500 text-sm">Estado actual:</span>
                  <div className="mt-2">{getEstadoBadge(tropaSeleccionada.estado)}</div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetalleOpen(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Mover Corral */}
        <Dialog open={moverOpen} onOpenChange={setMoverOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Mover Tropa de Corral</DialogTitle>
              <DialogDescription>
                Seleccione el corral destino para la tropa {tropaSeleccionada?.codigo}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-stone-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-stone-500">Corral Actual:</span>
                  <span className="font-medium">
                    {tropaSeleccionada?.corralId 
                      ? (typeof tropaSeleccionada?.corral === 'object' ? tropaSeleccionada?.corral?.nombre : tropaSeleccionada?.corral)
                      : 'Sin asignar'
                    }
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-stone-500">Cabezas:</span>
                  <span className="font-medium">{tropaSeleccionada?.cantidadCabezas}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Corral Destino *</Label>
                <Select value={corralDestinoId} onValueChange={setCorralDestinoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {corrales
                      .filter(c => c.id !== tropaSeleccionada?.corralId)
                      .map((c) => (
                        <SelectItem 
                          key={c.id} 
                          value={c.id}
                          disabled={!c.puedeRecibir}
                        >
                          {c.nombre} ({c.disponible} disponibles)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMoverOpen(false)}>Cancelar</Button>
              <Button onClick={handleMoverCorral} disabled={saving || !corralDestinoId} className="bg-blue-600 hover:bg-blue-700">
                <Move className="w-4 h-4 mr-2" />
                Mover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Baja Animal */}
        <Dialog open={bajaOpen} onOpenChange={setBajaOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Baja de Animal</DialogTitle>
              <DialogDescription>
                Registre el fallecimiento o decomiso del animal
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-700">Esta acción es irreversible</span>
                </div>
                <p className="text-sm text-red-600">
                  Animal: {animalSeleccionado?.codigo} - {animalSeleccionado?.tipoAnimal}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Motivo de la Baja *</Label>
                <Select value={motivoBaja} onValueChange={setMotivoBaja}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MUERTE_NATURAL">Muerte Natural</SelectItem>
                    <SelectItem value="MUERTE_ENFERMEDAD">Muerte por Enfermedad</SelectItem>
                    <SelectItem value="DECOMISO">Decomiso Sanitario</SelectItem>
                    <SelectItem value="ACCIDENTE">Accidente</SelectItem>
                    <SelectItem value="OTRO">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBajaOpen(false)}>Cancelar</Button>
              <Button onClick={handleBajaAnimal} disabled={saving || !motivoBaja} className="bg-red-600 hover:bg-red-700">
                <Skull className="w-4 h-4 mr-2" />
                Registrar Baja
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default MovimientoHaciendaModule
