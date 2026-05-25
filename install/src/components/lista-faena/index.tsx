'use client'

import { useState, useEffect } from 'react'
import { 
  ClipboardList, Plus, Calendar, Trash2, Save, Eye, Edit, 
  CheckCircle, Clock, Beef, AlertTriangle, Play, Lock, RefreshCw,
  Hash, BoxSelect, Scale, Printer
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

const ESTADOS_LISTA = [
  { id: 'ABIERTA', label: 'Abierta', color: 'bg-green-100 text-green-700' },
  { id: 'EN_PROCESO', label: 'En Proceso', color: 'bg-blue-100 text-blue-700' },
  { id: 'CERRADA', label: 'Cerrada', color: 'bg-gray-100 text-gray-700' },
  { id: 'ANULADA', label: 'Anulada', color: 'bg-red-100 text-red-700' },
]

interface Tropa {
  id: string
  codigo: string
  especie: string
  cantidadCabezas: number
  estado: string
  usuarioFaena?: { nombre: string }
  corral?: { nombre: string }
  tiposAnimales?: { tipoAnimal: string; cantidad: number }[]
}

interface AnimalLista {
  id: string
  codigo: string
  tropaCodigo: string | null
  tipoAnimal: string | null
  pesoVivo: number | null
  numero: number
  garronAsignado: number | null
  estado: string
}

interface ListaFaena {
  id: string
  fecha: string
  estado: string
  cantidadTotal: number
  supervisor?: { nombre: string }
  fechaCierre?: string
  observaciones?: string
  tropas?: { tropa: Tropa; cantidad: number }[]
}

interface Operador {
  id: string
  nombre: string
  nivel: string
}

export function ListaFaenaModule({ operador }: { operador: Operador }) {
  const [listas, setListas] = useState<ListaFaena[]>([])
  const [tropasDisponibles, setTropasDisponibles] = useState<Tropa[]>([])
  const [animalesLista, setAnimalesLista] = useState<AnimalLista[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [activeTab, setActiveTab] = useState('actual')
  const [listaActual, setListaActual] = useState<ListaFaena | null>(null)
  
  // Dialogs
  const [nuevaListaOpen, setNuevaListaOpen] = useState(false)
  const [cerrarListaOpen, setCerrarListaOpen] = useState(false)
  const [claveSupervisor, setClaveSupervisor] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [listasRes, tropasRes, animalesRes] = await Promise.all([
        fetch('/api/lista-faena'),
        fetch('/api/tropas?estado=PESADO,LISTO_FAENA'),
        fetch('/api/lista-faena/animales-hoy')
      ])
      
      const listasData = await listasRes.json()
      const tropasData = await tropasRes.json()
      const animalesData = await animalesRes.json()
      
      if (listasData.success) {
        setListas(listasData.data)
        const abierta = listasData.data.find((l: ListaFaena) => l.estado === 'ABIERTA' || l.estado === 'EN_PROCESO')
        setListaActual(abierta || null)
      }
      
      if (tropasData.success) {
        setTropasDisponibles(tropasData.data)
      }

      if (animalesData.success) {
        setAnimalesLista(animalesData.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleCrearLista = async () => {
    const hoy = new Date().toDateString()
    const listaHoy = listas.find(l => new Date(l.fecha).toDateString() === hoy && l.estado === 'ABIERTA')
    
    if (listaHoy) {
      toast.error('Ya existe una lista de faena abierta para hoy')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/lista-faena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operadorId: operador.id })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Lista de faena creada')
        setNuevaListaOpen(false)
        fetchData()
      } else {
        toast.error(data.error || 'Error al crear lista')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleAgregarTropa = async (tropaId: string, cantidad: number) => {
    if (!listaActual) return

    try {
      const res = await fetch('/api/lista-faena/tropas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listaFaenaId: listaActual.id,
          tropaId,
          cantidad
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Tropa agregada a la lista')
        fetchData()
      } else {
        toast.error(data.error || 'Error al agregar tropa')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }

  const handleCerrarLista = async () => {
    if (!claveSupervisor) {
      toast.error('Ingrese la clave de supervisor')
      return
    }

    try {
      const authRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: claveSupervisor })
      })
      
      const authData = await authRes.json()
      
      if (!authData.success || (authData.data.rol !== 'SUPERVISOR' && authData.data.rol !== 'ADMINISTRADOR')) {
        toast.error('Clave de supervisor inválida')
        return
      }
    } catch {
      toast.error('Error al verificar clave')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/lista-faena/cerrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listaFaenaId: listaActual?.id,
          supervisorId: operador.id
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Lista de faena cerrada')
        setCerrarListaOpen(false)
        setClaveSupervisor('')
        fetchData()
      } else {
        toast.error(data.error || 'Error al cerrar lista')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const est = ESTADOS_LISTA.find(e => e.id === estado)
    return (
      <Badge className={est?.color || 'bg-gray-100'}>
        {est?.label || estado}
      </Badge>
    )
  }

  // Calcular estadísticas
  const totalAnimales = animalesLista.length
  const conGarron = animalesLista.filter(a => a.garronAsignado).length
  const sinGarron = totalAnimales - conGarron

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
        <ClipboardList className="w-8 h-8 animate-pulse text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Lista de Faena</h1>
            <p className="text-stone-500">Gestión diaria de faena con asignación de garrones</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            {operador.nivel !== 'OPERADOR' && (
              <Button onClick={() => setNuevaListaOpen(true)} className="bg-amber-500 hover:bg-amber-600">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Lista
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="actual">Lista Actual</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          {/* LISTA ACTUAL */}
          <TabsContent value="actual" className="space-y-6">
            {!listaActual ? (
              <Card className="border-0 shadow-md">
                <CardContent className="p-12 text-center">
                  <ClipboardList className="w-16 h-16 mx-auto mb-4 text-stone-300" />
                  <p className="text-lg text-stone-600 mb-2">No hay lista de faena activa</p>
                  <p className="text-stone-400 mb-4">Cree una nueva lista para comenzar</p>
                  {operador.nivel !== 'OPERADOR' && (
                    <Button onClick={() => setNuevaListaOpen(true)} className="bg-amber-500 hover:bg-amber-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Lista de Faena
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Info de la lista */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-stone-50 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-amber-600" />
                          Lista del {new Date(listaActual.fecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </CardTitle>
                        <CardDescription>
                          Total: {listaActual.cantidadTotal} animales
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getEstadoBadge(listaActual.estado)}
                        {listaActual.estado === 'ABIERTA' && operador.nivel !== 'OPERADOR' && (
                          <Button onClick={() => setCerrarListaOpen(true)} className="bg-green-600 hover:bg-green-700">
                            <Lock className="w-4 h-4 mr-2" />
                            Cerrar Lista
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Tropas en la lista */}
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">Tropas Asignadas</h4>
                      {listaActual.tropas && listaActual.tropas.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {listaActual.tropas.map((t, i) => (
                            <div key={i} className="p-3 bg-stone-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold">{t.tropa.codigo}</span>
                                <Badge variant="outline">{t.cantidad} cab.</Badge>
                              </div>
                              <p className="text-sm text-stone-500 mt-1">{t.tropa.usuarioFaena?.nombre}</p>
                              <p className="text-xs text-stone-400">{t.tropa.corral?.nombre || '-'}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-stone-400">No hay tropas asignadas</p>
                      )}
                    </div>

                    {/* Agregar tropas */}
                    {listaActual.estado === 'ABIERTA' && tropasDisponibles.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Agregar Tropas Disponibles</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {tropasDisponibles
                            .filter(t => !listaActual.tropas?.some(lt => lt.tropa.id === t.id))
                            .slice(0, 6)
                            .map((tropa) => (
                            <div key={tropa.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono font-bold">{tropa.codigo}</span>
                                <Badge variant="outline">{tropa.especie}</Badge>
                              </div>
                              <p className="text-sm text-stone-500">{tropa.usuarioFaena?.nombre}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Input
                                  type="number"
                                  placeholder="Cant."
                                  className="w-20"
                                  min="1"
                                  max={tropa.cantidadCabezas}
                                  defaultValue={tropa.cantidadCabezas}
                                  id={`cant-${tropa.id}`}
                                />
                                <Button 
                                  size="sm"
                                  onClick={() => {
                                    const input = document.getElementById(`cant-${tropa.id}`) as HTMLInputElement
                                    handleAgregarTropa(tropa.id, parseInt(input?.value) || tropa.cantidadCabezas)
                                  }}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Animales y Garrones */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-amber-50 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Beef className="w-5 h-5 text-amber-600" />
                          Animales en Lista de Faena
                        </CardTitle>
                        <CardDescription>
                          Estado de asignación de garrones
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Hash className="w-4 h-4 text-amber-600" />
                          <span className="font-medium">{totalAnimales}</span>
                          <span className="text-stone-500">total</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-600">{conGarron}</span>
                          <span className="text-stone-500">con garrón</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span className="font-medium text-orange-500">{sinGarron}</span>
                          <span className="text-stone-500">pendientes</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {animalesLista.length === 0 ? (
                      <div className="p-8 text-center text-stone-400">
                        <Beef className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No hay animales en la lista</p>
                        <p className="text-sm">Agregue tropas a la lista para ver los animales</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[500px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-24">Garrón</TableHead>
                              <TableHead>Código</TableHead>
                              <TableHead>Tropa</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead className="text-right">Peso Vivo</TableHead>
                              <TableHead className="text-center">Estado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {animalesLista.map((animal) => (
                              <TableRow key={animal.id} className={animal.garronAsignado ? '' : 'bg-orange-50'}>
                                <TableCell>
                                  {animal.garronAsignado ? (
                                    <span className="text-xl font-bold text-amber-600">
                                      #{animal.garronAsignado}
                                    </span>
                                  ) : (
                                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                                      Sin asignar
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="font-mono">{animal.codigo}</TableCell>
                                <TableCell className="text-stone-500">{animal.tropaCodigo}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{animal.tipoAnimal || '-'}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {animal.pesoVivo ? `${animal.pesoVivo.toFixed(0)} kg` : '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                  {animal.garronAsignado ? (
                                    <Badge className="bg-green-100 text-green-700">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Asignado
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-orange-600">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Pendiente
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>

                {/* Instrucciones */}
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium mb-1">Flujo de trabajo:</p>
                        <ol className="list-decimal list-inside space-y-1 text-amber-700">
                          <li>Agregue tropas a la lista de faena (los animales ya deben tener pesaje individual)</li>
                          <li>Vaya a <strong>Ingreso a Cajón</strong> para asignar garrones a cada animal</li>
                          <li>En <strong>Romaneo</strong> registre el peso de las medias reses</li>
                          <li>Finalmente, en <strong>VB Faena</strong> verifique y corrija si es necesario</li>
                        </ol>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* HISTORIAL */}
          <TabsContent value="historial">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg">Listas de Faena Anteriores</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {listas.filter(l => l.estado === 'CERRADA').length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay listas cerradas</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Supervisor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listas.filter(l => l.estado === 'CERRADA').map((lista) => (
                        <TableRow key={lista.id}>
                          <TableCell>
                            {new Date(lista.fecha).toLocaleDateString('es-AR')}
                          </TableCell>
                          <TableCell>{lista.cantidadTotal} animales</TableCell>
                          <TableCell>{getEstadoBadge(lista.estado)}</TableCell>
                          <TableCell>{lista.supervisor?.nombre || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Nueva Lista */}
        <Dialog open={nuevaListaOpen} onOpenChange={setNuevaListaOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Lista de Faena</DialogTitle>
              <DialogDescription>
                Se creará una nueva lista para el día de hoy
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-stone-600">
                Esta acción creará una lista de faena con fecha {new Date().toLocaleDateString('es-AR')}.
                Solo puede haber una lista abierta por día.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNuevaListaOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCrearLista} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
                {saving ? 'Creando...' : 'Crear Lista'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Cerrar Lista */}
        <Dialog open={cerrarListaOpen} onOpenChange={setCerrarListaOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <Lock className="w-5 h-5" />
                Cerrar Lista de Faena
              </DialogTitle>
              <DialogDescription>
                Se requiere autorización de supervisor para cerrar la lista
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 mb-2" />
                <p className="text-sm text-amber-700">
                  Una vez cerrada la lista, no se podrán agregar más animales ni modificar asignaciones.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Clave de Supervisor</Label>
                <Input
                  type="password"
                  value={claveSupervisor}
                  onChange={(e) => setClaveSupervisor(e.target.value)}
                  placeholder="••••••"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCerrarListaOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCerrarLista} disabled={saving} className="bg-green-600 hover:bg-green-700">
                {saving ? 'Cerrando...' : 'Cerrar Lista'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default ListaFaenaModule
