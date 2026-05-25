'use client'

import { useState, useEffect } from 'react'
import { 
  Beef, RefreshCw, Barcode, Tag, Scan, CheckCircle, AlertTriangle,
  Clock, List
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface ListaFaena {
  id: string
  fecha: string
  estado: string
  cantidadTotal: number
  tropas?: { tropaId: string; cantidad: number; tropa: { codigo: string; usuarioFaena?: { nombre: string } } }[]
}

interface Animal {
  id: string
  codigo: string
  numero: number
  tipoAnimal: string
  caravana?: string
  pesoVivo?: number
  tropaId: string
  tropaCodigo: string
}

interface Asignacion {
  id: string
  garron: number | null
  numeroAnimal: number
  horaIngreso: string
  animal: Animal
}

export function AsignacionGarronesModule({ operador }: { operador: Operador }) {
  const [listaActual, setListaActual] = useState<ListaFaena | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Inputs
  const [garronInput, setGarronInput] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [animalNumeroInput, setAnimalNumeroInput] = useState('')
  const [caravanaInput, setCaravanaInput] = useState('')
  const [selectedTropa, setSelectedTropa] = useState('')
  const [permitirPendiente, setPermitirPendiente] = useState(false)
  
  // Data
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [pendientes, setPendientes] = useState<Asignacion[]>([])
  const [animalesSinAsignar, setAnimalesSinAsignar] = useState<Animal[]>([])
  
  // Tab
  const [activeTab, setActiveTab] = useState('asignar')

  useEffect(() => {
    fetchListaActual()
  }, [])

  useEffect(() => {
    if (listaActual) {
      fetchAsignaciones()
    }
  }, [listaActual])

  const fetchListaActual = async () => {
    try {
      const res = await fetch('/api/lista-faena')
      const data = await res.json()
      
      if (data.success) {
        // Solo listas ACEPTADAS o EN_PROCESO permiten asignación de garrones
        const lista = data.data.find((l: ListaFaena) => l.estado === 'ACEPTADA' || l.estado === 'EN_PROCESO')
        setListaActual(lista || null)
      }
    } catch (error) {
      console.error('Error fetching lista:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAsignaciones = async () => {
    if (!listaActual) return
    
    try {
      const res = await fetch(`/api/lista-faena/asignar?listaFaenaId=${listaActual.id}`)
      const data = await res.json()
      
      if (data.success) {
        setAsignaciones(data.data.asignaciones || [])
        setPendientes(data.data.pendientes || [])
        setAnimalesSinAsignar(data.data.animalesSinAsignar || [])
        
        // Set next garron
        const maxGarron = (data.data.asignaciones || []).reduce(
          (max: number, a: Asignacion) => a.garron ? Math.max(max, a.garron) : max, 
          0
        )
        setGarronInput(String(maxGarron + 1))
      }
    } catch (error) {
      console.error('Error fetching asignaciones:', error)
    }
  }

  const handleAsignar = async (method: 'barcode' | 'animal' | 'caravana') => {
    if (!listaActual) {
      toast.error('No hay lista de faena activa')
      return
    }

    if (!garronInput && !permitirPendiente) {
      toast.error('Ingrese número de garrón o marque "Asignar después"')
      return
    }

    const garronNum = garronInput ? parseInt(garronInput) : null

    if (garronNum && garronNum <= 0) {
      toast.error('El garrón debe ser mayor a 0')
      return
    }

    // Validate garron doesn't exceed total animals in lista-faena
    if (garronNum && garronNum > listaActual.cantidadTotal) {
      toast.error(`El garrón no puede ser mayor al total de animales (${listaActual.cantidadTotal})`)
      return
    }

    setSaving(true)
    try {
      let animalCodigo = ''

      if (method === 'barcode') {
        if (!barcodeInput) {
          toast.error('Ingrese el código de barras')
          setSaving(false)
          return
        }
        animalCodigo = barcodeInput
      } else if (method === 'animal') {
        if (!selectedTropa || !animalNumeroInput) {
          toast.error('Seleccione tropa e ingrese número de animal')
          setSaving(false)
          return
        }
        const tropa = listaActual.tropas?.find(t => t.tropaId === selectedTropa)?.tropa
        if (tropa) {
          animalCodigo = `${tropa.codigo}-${String(animalNumeroInput).padStart(3, '0')}`
        }
      } else if (method === 'caravana') {
        if (!caravanaInput) {
          toast.error('Ingrese la caravana')
          setSaving(false)
          return
        }
        animalCodigo = caravanaInput
      }

      const res = await fetch('/api/lista-faena/asignar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listaFaenaId: listaActual.id,
          garron: garronNum,
          animalCodigo,
          permitirPendiente
        })
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success(data.message)
        setBarcodeInput('')
        setAnimalNumeroInput('')
        setCaravanaInput('')
        if (garronNum) {
          setGarronInput(String(garronNum + 1))
        }
        fetchAsignaciones()
      } else {
        toast.error(data.error || 'Error al asignar')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleAsignarPendiente = async (asignacionId: string, garron: number) => {
    if (!garron || garron <= 0) {
      toast.error('Ingrese un garrón válido')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/lista-faena/asignar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asignacionId, garron })
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success(data.message)
        fetchAsignaciones()
      } else {
        toast.error(data.error || 'Error al actualizar')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
        <Beef className="w-8 h-8 animate-pulse text-amber-500" />
      </div>
    )
  }

  if (!listaActual) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <Beef className="w-16 h-16 mx-auto mb-4 text-stone-300" />
              <p className="text-lg text-stone-600 mb-2">No hay lista de faena aceptada</p>
              <p className="text-stone-400">El supervisor debe aceptar la lista de faena para habilitar la asignación de garrones</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const totalAsignados = asignaciones.filter(a => a.garron !== null).length
  const totalPendientes = pendientes.length
  const totalSinAsignar = animalesSinAsignar.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Beef className="w-8 h-8 text-amber-500" />
              Asignación de Garrones
            </h1>
            <p className="text-stone-500">
              Lista del {new Date(listaActual.fecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAsignaciones}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-0 shadow-md bg-green-50">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{totalAsignados}</div>
              <div className="text-sm text-green-700">Asignados</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-amber-50">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-amber-600">{totalPendientes}</div>
              <div className="text-sm text-amber-700">Pendientes</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-blue-50">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{totalSinAsignar}</div>
              <div className="text-sm text-blue-700">Sin Asignar</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-stone-50">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-stone-600">{listaActual.cantidadTotal}</div>
              <div className="text-sm text-stone-700">Total Faena</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="asignar">Asignar Garrón</TabsTrigger>
            <TabsTrigger value="pendientes">
              Pendientes {pendientes.length > 0 && `(${pendientes.length})`}
            </TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          {/* ASIGNAR */}
          <TabsContent value="asignar" className="space-y-6">
            <Card className="border-0 shadow-md border-l-4 border-l-amber-500">
              <CardHeader className="bg-amber-50 rounded-t-lg">
                <CardTitle className="text-lg">Ingreso de Animal al Cajón</CardTitle>
                <CardDescription>
                  Identifique el animal mediante código de barras, número o caravana
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Garrón y opción pendiente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div>
                    <Label className="font-semibold">N° de Garrón</Label>
                    <Input
                      type="number"
                      value={garronInput}
                      onChange={(e) => setGarronInput(e.target.value)}
                      placeholder="Se auto-incrementa"
                      className="text-xl font-bold text-center h-14"
                    />
                    <p className="text-xs text-stone-500 mt-1 text-center">Se incrementa automáticamente al asignar</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => {
                        setPermitirPendiente(true)
                        setGarronInput('')
                      }}
                      disabled={permitirPendiente}
                      variant="outline"
                      className="h-14 border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold"
                    >
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Asignar Luego (Garrón 0)
                    </Button>
                    {permitirPendiente && (
                      <div className="flex items-center gap-2 justify-center">
                        <Checkbox
                          id="pendiente"
                          checked={permitirPendiente}
                          onCheckedChange={(checked) => {
                            setPermitirPendiente(checked as boolean)
                            if (!checked) {
                              const maxGarron = asignaciones.reduce(
                                (max, a) => a.garron ? Math.max(max, a.garron) : max,
                                0
                              )
                              setGarronInput(String(maxGarron + 1))
                            }
                          }}
                        />
                        <Label htmlFor="pendiente" className="text-sm cursor-pointer">
                          Modo pendiente activo
                        </Label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Métodos de identificación */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Código de Barras */}
                  <Card className="border">
                    <CardHeader className="py-3 px-4 bg-blue-50">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Barcode className="w-4 h-4 text-blue-600" />
                        Código de Barras
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <Input
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value.toUpperCase())}
                        placeholder="Escanee o ingrese..."
                        className="font-mono h-12 text-lg"
                        autoFocus
                      />
                      <Button
                        onClick={() => handleAsignar('barcode')}
                        disabled={saving || (!garronInput && !permitirPendiente) || !barcodeInput}
                        className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                      >
                        <Scan className="w-5 h-5 mr-2" />
                        Asignar
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Por Tropa y Número */}
                  <Card className="border">
                    <CardHeader className="py-3 px-4 bg-green-50">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Tag className="w-4 h-4 text-green-600" />
                        Tropa + N° Animal
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <Select value={selectedTropa} onValueChange={setSelectedTropa}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione tropa..." />
                        </SelectTrigger>
                        <SelectContent>
                          {listaActual.tropas?.map((t, i) => (
                            <SelectItem key={i} value={t.tropaId}>
                              {t.tropa.codigo} - {t.tropa.usuarioFaena?.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={animalNumeroInput}
                        onChange={(e) => setAnimalNumeroInput(e.target.value)}
                        placeholder="N° de animal"
                        className="font-mono h-12 text-lg"
                      />
                      <Button
                        onClick={() => handleAsignar('animal')}
                        disabled={saving || (!garronInput && !permitirPendiente) || !selectedTropa || !animalNumeroInput}
                        className="w-full bg-green-600 hover:bg-green-700 h-12"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Asignar
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Caravana */}
                  <Card className="border">
                    <CardHeader className="py-3 px-4 bg-purple-50">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Scan className="w-4 h-4 text-purple-600" />
                        Caravana Electrónica
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <Input
                        value={caravanaInput}
                        onChange={(e) => setCaravanaInput(e.target.value.toUpperCase())}
                        placeholder="Escanee caravana..."
                        className="font-mono h-12 text-lg"
                      />
                      <Button
                        onClick={() => handleAsignar('caravana')}
                        disabled={saving || (!garronInput && !permitirPendiente) || !caravanaInput}
                        className="w-full bg-purple-600 hover:bg-purple-700 h-12"
                      >
                        <Scan className="w-5 h-5 mr-2" />
                        Asignar
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* No auto-assign button - users must identify animals manually */}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PENDIENTES */}
          <TabsContent value="pendientes" className="space-y-6">
            {pendientes.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-300" />
                  <p className="text-lg text-stone-600">No hay garrones pendientes</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-md border-l-4 border-l-amber-500">
                <CardHeader className="bg-amber-50 rounded-t-lg">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    Garrones Pendientes de Asignación
                  </CardTitle>
                  <CardDescription>
                    Estos animales fueron registrados sin número de garrón. Asigne un número para continuar.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Animal</TableHead>
                        <TableHead>Tropa</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Hora Ingreso</TableHead>
                        <TableHead className="w-40">Asignar Garrón</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendientes.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono font-bold">{p.animal.codigo}</TableCell>
                          <TableCell>{p.animal.tropaCodigo}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{p.animal.tipoAnimal}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-stone-500">
                              <Clock className="w-4 h-4" />
                              {new Date(p.horaIngreso).toLocaleTimeString('es-AR')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="N°"
                                className="w-20"
                                id={`garron-${p.id}`}
                              />
                              <Button
                                size="sm"
                                onClick={() => {
                                  const input = document.getElementById(`garron-${p.id}`) as HTMLInputElement
                                  const garron = parseInt(input?.value)
                                  if (garron > 0) {
                                    handleAsignarPendiente(p.id, garron)
                                  }
                                }}
                                disabled={saving}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                OK
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* HISTORIAL */}
          <TabsContent value="historial" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <List className="w-5 h-5 text-stone-600" />
                  Asignaciones del Día
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {asignaciones.filter(a => a.garron !== null).length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <Beef className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay asignaciones</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Garrón</TableHead>
                        <TableHead>Animal</TableHead>
                        <TableHead>Tropa</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Caravana</TableHead>
                        <TableHead>Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asignaciones
                        .filter(a => a.garron !== null)
                        .sort((a, b) => (a.garron || 0) - (b.garron || 0))
                        .map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-bold text-2xl text-amber-600">
                              {a.garron}
                            </TableCell>
                            <TableCell className="font-mono">{a.animal.codigo}</TableCell>
                            <TableCell>{a.animal.tropaCodigo}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{a.animal.tipoAnimal}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-stone-500">
                              {a.animal.caravana || '-'}
                            </TableCell>
                            <TableCell className="text-stone-500">
                              {new Date(a.horaIngreso).toLocaleTimeString('es-AR')}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default AsignacionGarronesModule
