// NOTA: Componente disponible para uso futuro - verificar antes de eliminar
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  Warehouse, Loader2, RefreshCw, Plus, Search, Eye, CheckCircle, 
  Package, AlertCircle, ArrowRight, Scissors, TrendingDown,
  BarChart3, Filter, Download
} from 'lucide-react'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

// Interfaces
interface Cuarto {
  id: string
  codigo: string
  sigla: 'A' | 'D' | 'T'
  pesoOriginal: number
  pesoCuarto: number
  merma: number
  estado: string
  fechaCuarteo: string
  fechaIngresoDespostada?: string
  mediaRes: {
    romaneo?: {
      tropaCodigo: string
      garron: number
      fecha: string
      tipoAnimal?: string
      denticion?: string
    }
    usuarioFaena?: {
      id: string
      nombre: string
    }
  }
  camara?: {
    id: string
    nombre: string
    tipo: string
  }
  propietario?: {
    id: string
    nombre: string
    cuit?: string
  }
}

interface Camara {
  id: string
  nombre: string
  tipo: string
  capacidad: number
}

interface Stats {
  totalCuartos: number
  enCamara: number
  enDespostada: number
  despostados: number
  pesoTotal: number
  porSigla: { A: number; D: number; T: number }
  pesoPorSigla: { A: number; D: number; T: number }
  alertasVencimiento: any[]
}

interface Operador {
  id: string
  nombre: string
  rol: string
  permisos?: Record<string, boolean>
}

interface Props {
  operador: Operador
}

const ESTADOS_CUARTO = [
  { id: 'EN_CAMARA', label: 'En Cámara', color: 'bg-blue-100 text-blue-700' },
  { id: 'EN_DESPOSTADA', label: 'En Despostada', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'DESPOSTADO', label: 'Despostado', color: 'bg-green-100 text-green-700' },
  { id: 'ANULADO', label: 'Anulado', color: 'bg-red-100 text-red-700' },
]

const SIGLAS = [
  { id: 'A', label: 'Asado', descripcion: 'Cuarto trasero con asado' },
  { id: 'D', label: 'Delantero', descripcion: 'Cuarto delantero' },
  { id: 'T', label: 'Trasero', descripcion: 'Cuarto trasero sin asado' },
]

export function StockCuartosModule({ operador }: Props) {
  const { editMode, getTexto } = useEditor()
  const [loading, setLoading] = useState(true)
  const [cuartos, setCuartos] = useState<Cuarto[]>([])
  const [camaras, setCamaras] = useState<Camara[]>([])
  const [porCamara, setPorCamara] = useState<Record<string, { cantidad: number; peso: number }>>({})
  const [porTropa, setPorTropa] = useState<Record<string, { cantidad: number; peso: number; propietario?: string }>>({})
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('EN_CAMARA')
  const [filtroSigla, setFiltroSigla] = useState('TODOS')
  const [filtroCamara, setFiltroCamara] = useState('TODOS')
  const [busqueda, setBusqueda] = useState('')
  
  // Stats
  const [stats, setStats] = useState<Stats>({
    totalCuartos: 0,
    enCamara: 0,
    enDespostada: 0,
    despostados: 0,
    pesoTotal: 0,
    porSigla: { A: 0, D: 0, T: 0 },
    pesoPorSigla: { A: 0, D: 0, T: 0 },
    alertasVencimiento: []
  })
  
  // Dialogs
  const [dialogMoverOpen, setDialogMoverOpen] = useState(false)
  const [dialogEnviarOpen, setDialogEnviarOpen] = useState(false)
  const [dialogDetalleOpen, setDialogDetalleOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Forms
  const [selectedCuarto, setSelectedCuarto] = useState<Cuarto | null>(null)
  const [nuevaCamaraId, setNuevaCamaraId] = useState('')
  const [nuevoPeso, setNuevoPeso] = useState('')
  const [observaciones, setObservaciones] = useState('')
  
  // Selección múltiple
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modoSeleccion, setModoSeleccion] = useState(false)

  // Cargar datos
  useEffect(() => {
    fetchData()
  }, [filtroEstado, filtroSigla, filtroCamara])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Construir parámetros de filtro
      const params = new URLSearchParams()
      if (filtroEstado !== 'TODOS') params.append('estado', filtroEstado)
      if (filtroSigla !== 'TODOS') params.append('sigla', filtroSigla)
      if (filtroCamara !== 'TODOS') params.append('camaraId', filtroCamara)
      
      const res = await fetch(`/api/stock-cuartos?${params.toString()}`)
      const data = await res.json()
      
      if (data.success) {
        setCuartos(data.data)
        setStats(data.stats)
        setPorCamara(data.porCamara)
        setPorTropa(data.porTropa)
      }

      // Cargar cámaras de cuarteo
      const resCamaras = await fetch('/api/camaras')
      const dataCamaras = await resCamaras.json()
      if (dataCamaras.success) {
        setCamaras(dataCamaras.data.filter((c: Camara) => c.tipo === 'CUARTEO' || c.tipo === 'FAENA'))
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Mover a otra cámara
  const handleMoverCamara = async () => {
    if (!selectedCuarto || !nuevaCamaraId) {
      toast.error('Seleccione una cámara')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/stock-cuartos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCuarto.id,
          camaraId: nuevaCamaraId,
          operadorId: operador.id
        })
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success('Cuarto movido correctamente')
        setDialogMoverOpen(false)
        setNuevaCamaraId('')
        fetchData()
      } else {
        toast.error(data.error || 'Error al mover')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Enviar a despostada
  const handleEnviarDespostada = async () => {
    if (!selectedCuarto) return

    setSaving(true)
    try {
      const res = await fetch('/api/stock-cuartos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCuarto.id,
          estado: 'EN_DESPOSTADA',
          camaraId: null,
          operadorId: operador.id
        })
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success('Cuarto enviado a despostada')
        setDialogEnviarOpen(false)
        fetchData()
      } else {
        toast.error(data.error || 'Error al enviar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Repesar cuarto
  const handleRepesar = async () => {
    if (!selectedCuarto || !nuevoPeso) return

    setSaving(true)
    try {
      const res = await fetch('/api/stock-cuartos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCuarto.id,
          pesoCuarto: parseFloat(nuevoPeso),
          operadorId: operador.id
        })
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success('Peso actualizado')
        setDialogDetalleOpen(false)
        setNuevoPeso('')
        fetchData()
      } else {
        toast.error(data.error || 'Error al actualizar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Enviar múltiples a despostada
  const handleEnviarSeleccionados = async () => {
    if (selectedIds.length === 0) return

    setSaving(true)
    try {
      let exitosos = 0
      for (const id of selectedIds) {
        const res = await fetch('/api/stock-cuartos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            estado: 'EN_DESPOSTADA',
            camaraId: null,
            operadorId: operador.id
          })
        })
        if (res.ok) exitosos++
      }
      
      toast.success(`${exitosos} cuartos enviados a despostada`)
      setSelectedIds([])
      setModoSeleccion(false)
      fetchData()
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Toggle selección
  const toggleSeleccion = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  // Seleccionar todos
  const toggleSeleccionarTodos = () => {
    if (selectedIds.length === cuartosFiltrados.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(cuartosFiltrados.map(c => c.id))
    }
  }

  // Badge de estado
  const getEstadoBadge = (estado: string) => {
    const info = ESTADOS_CUARTO.find(e => e.id === estado)
    return (
      <Badge className={info?.color || 'bg-gray-100'}>
        {info?.label || estado}
      </Badge>
    )
  }

  // Badge de sigla
  const getSiglaBadge = (sigla: string) => {
    const info = SIGLAS.find(s => s.id === sigla)
    const colores: Record<string, string> = {
      'A': 'bg-purple-100 text-purple-700',
      'D': 'bg-blue-100 text-blue-700',
      'T': 'bg-green-100 text-green-700'
    }
    return (
      <Badge className={colores[sigla] || 'bg-gray-100'} title={info?.descripcion}>
        {sigla}
      </Badge>
    )
  }

  // Filtrar cuartos
  const cuartosFiltrados = cuartos.filter(c => {
    if (!busqueda) return true
    const busquedaLower = busqueda.toLowerCase()
    return (
      c.codigo.toLowerCase().includes(busquedaLower) ||
      c.mediaRes.romaneo?.tropaCodigo?.toLowerCase().includes(busquedaLower) ||
      c.propietario?.nombre?.toLowerCase().includes(busquedaLower) ||
      c.camara?.nombre?.toLowerCase().includes(busquedaLower)
    )
  })

  // Formatear peso
  const formatPeso = (kg: number) => `${kg.toFixed(2)} kg`

  // Formatear fecha
  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR')
  }

  // Calcular peso seleccionado
  const pesoSeleccionado = cuartos.filter(c => selectedIds.includes(c.id)).reduce((acc, c) => acc + c.pesoCuarto, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
                <Warehouse className="w-8 h-8 text-amber-500" />
                <TextoEditable id="stock-cuartos-titulo" original="Stock Cuartos / Cámara Desposte" tag="span" />
              </h1>
              <p className="text-stone-500 mt-1">
                <TextoEditable id="stock-cuartos-subtitulo" original="Control de cuartos en cámaras de desposte" tag="span" />
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setModoSeleccion(!modoSeleccion)} 
                variant={modoSeleccion ? "default" : "outline"}
                className={modoSeleccion ? "bg-amber-500 hover:bg-amber-600" : ""}
              >
                {modoSeleccion ? 'Cancelar Selección' : 'Selección Múltiple'}
              </Button>
              <Button onClick={fetchData} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>
        </EditableBlock>

        {/* Stats principales */}
        <EditableBlock bloqueId="stats" label="Estadísticas">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">En Cámara</p>
                    <p className="text-xl font-bold">{stats.enCamara}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <Scissors className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">En Despostada</p>
                    <p className="text-xl font-bold">{stats.enDespostada}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Despostados</p>
                    <p className="text-xl font-bold">{stats.despostados}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Peso Total</p>
                    <p className="text-lg font-bold">{formatPeso(stats.pesoTotal)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Merma Total</p>
                    <p className="text-lg font-bold">
                      {formatPeso(cuartos.reduce((acc, c) => acc + c.merma, 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </EditableBlock>

        {/* Por Sigla */}
        <div className="grid grid-cols-3 gap-4">
          {SIGLAS.map(sigla => (
            <Card key={sigla.id} className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setFiltroSigla(filtroSigla === sigla.id ? 'TODOS' : sigla.id)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className={`text-lg px-3 py-1 ${sigla.id === 'A' ? 'bg-purple-100 text-purple-700' : sigla.id === 'D' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {sigla.id}
                    </Badge>
                    <p className="text-xs text-stone-500 mt-1">{sigla.descripcion}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{stats.porSigla[sigla.id as keyof typeof stats.porSigla]}</p>
                    <p className="text-xs text-stone-500">{formatPeso(stats.pesoPorSigla[sigla.id as keyof typeof stats.pesoPorSigla])}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
                    placeholder="Código, tropa, propietario, cámara..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-40">
                <Label className="text-xs">Estado</Label>
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    {ESTADOS_CUARTO.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <Label className="text-xs">Sigla</Label>
                <Select value={filtroSigla} onValueChange={setFiltroSigla}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todas</SelectItem>
                    {SIGLAS.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.id} - {s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Label className="text-xs">Cámara</Label>
                <Select value={filtroCamara} onValueChange={setFiltroCamara}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todas</SelectItem>
                    {camaras.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acciones de selección múltiple */}
        {modoSeleccion && (
          <Card className="border-0 shadow-md bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-medium">{selectedIds.length} cuartos seleccionados</span>
                  <span className="text-stone-500">{formatPeso(pesoSeleccionado)}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={toggleSeleccionarTodos}>
                    {selectedIds.length === cuartosFiltrados.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleEnviarSeleccionados}
                    disabled={selectedIds.length === 0 || saving}
                    className="bg-yellow-500 hover:bg-yellow-600"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                    Enviar a Despostada
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="detalle" className="space-y-4">
          <TabsList className="bg-stone-100">
            <TabsTrigger value="detalle">Detalle</TabsTrigger>
            <TabsTrigger value="porCamara">Por Cámara</TabsTrigger>
            <TabsTrigger value="porTropa">Por Tropa</TabsTrigger>
          </TabsList>

          <TabsContent value="detalle" className="space-y-4">
            {/* Tabla de cuartos */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-500" />
                  Cuartos en Stock
                </CardTitle>
                <CardDescription>
                  {cuartosFiltrados.length} de {cuartos.length} cuartos
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  </div>
                ) : cuartosFiltrados.length === 0 ? (
                  <div className="py-12 text-center text-stone-400">
                    <Warehouse className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No hay cuartos para mostrar</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-stone-50/50">
                          {modoSeleccion && <TableHead className="w-10"></TableHead>}
                          <TableHead>Código</TableHead>
                          <TableHead>Sigla</TableHead>
                          <TableHead>Tropa</TableHead>
                          <TableHead>Propietario</TableHead>
                          <TableHead>Cámara</TableHead>
                          <TableHead className="text-right">Peso Orig.</TableHead>
                          <TableHead className="text-right">Peso Cuarto</TableHead>
                          <TableHead className="text-right">Merma</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="w-32"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cuartosFiltrados.map((cuarto) => (
                          <TableRow key={cuarto.id} className="hover:bg-stone-50">
                            {modoSeleccion && (
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(cuarto.id)}
                                  onChange={() => toggleSeleccion(cuarto.id)}
                                  className="w-4 h-4"
                                />
                              </TableCell>
                            )}
                            <TableCell className="font-mono font-medium">{cuarto.codigo}</TableCell>
                            <TableCell>{getSiglaBadge(cuarto.sigla)}</TableCell>
                            <TableCell>{cuarto.mediaRes.romaneo?.tropaCodigo || '-'}</TableCell>
                            <TableCell>{cuarto.propietario?.nombre || cuarto.mediaRes.usuarioFaena?.nombre || '-'}</TableCell>
                            <TableCell>{cuarto.camara?.nombre || '-'}</TableCell>
                            <TableCell className="text-right">{formatPeso(cuarto.pesoOriginal)}</TableCell>
                            <TableCell className="text-right font-medium">{formatPeso(cuarto.pesoCuarto)}</TableCell>
                            <TableCell className="text-right text-orange-600">{formatPeso(cuarto.merma)}</TableCell>
                            <TableCell>{getEstadoBadge(cuarto.estado)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedCuarto(cuarto)
                                    setDialogDetalleOpen(true)
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {cuarto.estado === 'EN_CAMARA' && !modoSeleccion && (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => {
                                        setSelectedCuarto(cuarto)
                                        setDialogMoverOpen(true)
                                      }}
                                      title="Mover a otra cámara"
                                    >
                                      <ArrowRight className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => {
                                        setSelectedCuarto(cuarto)
                                        setDialogEnviarOpen(true)
                                      }}
                                      className="text-yellow-600"
                                      title="Enviar a despostada"
                                    >
                                      <Scissors className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
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

          <TabsContent value="porCamara" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg">Distribución por Cámara</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50/50">
                      <TableHead>Cámara</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Peso Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(porCamara).map(([camara, data]) => (
                      <TableRow key={camara}>
                        <TableCell className="font-medium">{camara}</TableCell>
                        <TableCell className="text-right">{data.cantidad}</TableCell>
                        <TableCell className="text-right">{formatPeso(data.peso)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="porTropa" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg">Agrupado por Tropa</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50/50">
                      <TableHead>Tropa</TableHead>
                      <TableHead>Propietario</TableHead>
                      <TableHead className="text-right">Cuartos</TableHead>
                      <TableHead className="text-right">Peso Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(porTropa).map(([tropa, data]) => (
                      <TableRow key={tropa}>
                        <TableCell className="font-mono font-medium">{tropa}</TableCell>
                        <TableCell>{data.propietario || '-'}</TableCell>
                        <TableCell className="text-right">{data.cantidad}</TableCell>
                        <TableCell className="text-right">{formatPeso(data.peso)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Mover a otra cámara */}
      <Dialog open={dialogMoverOpen} onOpenChange={setDialogMoverOpen}>
        <DialogContent maximizable>
          <DialogHeader>
            <DialogTitle>Mover Cuarto a Otra Cámara</DialogTitle>
            <DialogDescription>
              Seleccione la cámara de destino
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-3 bg-stone-50 rounded-lg">
              <p className="text-sm text-stone-500">Cuarto</p>
              <p className="font-bold">{selectedCuarto?.codigo}</p>
              <p className="text-sm">Tropa: {selectedCuarto?.mediaRes.romaneo?.tropaCodigo}</p>
            </div>

            <div className="space-y-2">
              <Label>Cámara de Destino</Label>
              <Select value={nuevaCamaraId} onValueChange={setNuevaCamaraId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cámara" /></SelectTrigger>
                <SelectContent>
                  {camaras.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMoverOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleMoverCamara}
              disabled={saving || !nuevaCamaraId}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Mover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Enviar a despostada */}
      <Dialog open={dialogEnviarOpen} onOpenChange={setDialogEnviarOpen}>
        <DialogContent maximizable>
          <DialogHeader>
            <DialogTitle>Enviar a Despostada</DialogTitle>
            <DialogDescription>
              El cuarto será marcado como "En Despostada" y removido de la cámara
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-3 bg-stone-50 rounded-lg">
              <p className="text-sm text-stone-500">Cuarto</p>
              <p className="font-bold">{selectedCuarto?.codigo}</p>
              <p className="text-sm">Tropa: {selectedCuarto?.mediaRes.romaneo?.tropaCodigo}</p>
              <p className="text-sm">Peso: {selectedCuarto && formatPeso(selectedCuarto.pesoCuarto)}</p>
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-700">
                Al confirmar, el cuarto será removido de la cámara actual y quedará disponible para procesar en despostada.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogEnviarOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEnviarDespostada}
              disabled={saving}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
              Enviar a Despostada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalle del cuarto */}
      <Dialog open={dialogDetalleOpen} onOpenChange={setDialogDetalleOpen}>
        <DialogContent className="max-w-lg" maximizable>
          <DialogHeader>
            <DialogTitle>Detalle del Cuarto</DialogTitle>
          </DialogHeader>
          
          {selectedCuarto && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-stone-50 rounded-lg">
                  <p className="text-xs text-stone-500">Código</p>
                  <p className="font-mono font-bold">{selectedCuarto.codigo}</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-lg">
                  <p className="text-xs text-stone-500">Sigla</p>
                  <p>{getSiglaBadge(selectedCuarto.sigla)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-stone-400">Tropa:</p>
                  <p className="font-medium">{selectedCuarto.mediaRes.romaneo?.tropaCodigo || '-'}</p>
                </div>
                <div>
                  <p className="text-stone-400">Garrón:</p>
                  <p className="font-medium">{selectedCuarto.mediaRes.romaneo?.garron || '-'}</p>
                </div>
                <div>
                  <p className="text-stone-400">Propietario:</p>
                  <p className="font-medium">{selectedCuarto.propietario?.nombre || selectedCuarto.mediaRes.usuarioFaena?.nombre || '-'}</p>
                </div>
                <div>
                  <p className="text-stone-400">Cámara:</p>
                  <p className="font-medium">{selectedCuarto.camara?.nombre || '-'}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-stone-50 rounded-lg">
                  <p className="text-xs text-stone-500">Peso Original</p>
                  <p className="text-xl font-bold">{formatPeso(selectedCuarto.pesoOriginal)}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-stone-500">Peso Cuarto</p>
                  <p className="text-xl font-bold">{formatPeso(selectedCuarto.pesoCuarto)}</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-xs text-stone-500">Merma</p>
                  <p className="text-xl font-bold text-orange-600">{formatPeso(selectedCuarto.merma)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-stone-400">Fecha Cuarteo:</p>
                  <p>{formatFecha(selectedCuarto.fechaCuarteo)}</p>
                </div>
                <div>
                  <p className="text-stone-400">Estado:</p>
                  <p>{getEstadoBadge(selectedCuarto.estado)}</p>
                </div>
              </div>

              {selectedCuarto.estado === 'EN_CAMARA' && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Nuevo Peso (Repesaje)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={nuevoPeso}
                        onChange={(e) => setNuevoPeso(e.target.value)}
                        placeholder={selectedCuarto.pesoCuarto.toString()}
                      />
                      <Button onClick={handleRepesar} disabled={saving || !nuevoPeso}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Actualizar'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogDetalleOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StockCuartosModule
