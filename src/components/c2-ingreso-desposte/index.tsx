'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Package, ArrowRight, Loader2, RefreshCw, Search, Scissors, CheckCircle2 } from 'lucide-react'

interface Operador { id: string; nombre: string; rol: string }

interface Cuarto {
  id: string
  tipo: string
  peso: number
  codigo: string
  estado: string
  tipoCuarto?: { id: string; nombre: string; codigo: string } | null
  camara?: { id: string; nombre: string } | null
  mediaRes?: { id: string; codigo: string; peso: number; lado: string; romaneo?: { tropaCodigo: string; garron: number | null } | null } | null
}

// Interface que coincide con el modelo IngresoDespostada del schema
interface IngresoDespostada {
  id: string
  mediaResId: string | null
  tropaCodigo: string | null
  mediaCodigo: string | null
  tipoMedia: 'DELANTERA' | 'TRASERA' | 'ENTERA'
  pesoKg: number
  estado: string
  fecha: string
  observaciones?: string | null
  camaraOrigen?: { id: string; nombre: string } | null
  camaraDestino?: { id: string; nombre: string } | null
  operador?: { id: string; nombre: string } | null
}

interface Camara {
  id: string
  nombre: string
  tipo: string
  activo?: boolean
}

export default function C2IngresoDesposteModule({ operador }: { operador: Operador }) {
  const [cuartos, setCuartos] = useState<Cuarto[]>([])
  const [ingresos, setIngresos] = useState<IngresoDespostada[]>([])
  const [camaras, setCameras] = useState<Camara[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipoCuarto, setFiltroTipoCuarto] = useState<string>('TODOS')

  // Selección
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [camaraDestinoId, setCamaraDestinoId] = useState('')
  const [observaciones, setObservaciones] = useState('')

  useEffect(() => {
    fetchDatos()
  }, [])

  const fetchDatos = async () => {
    setLoading(true)
    try {
      const [resCuartos, resIngresos, resCamaras] = await Promise.all([
        fetch('/api/cuartos?estado=EN_CAMARA'),
        fetch('/api/c2-ingreso-desposte'),
        fetch('/api/camaras')
      ])

      const dataCuartos = await resCuartos.json()
      const dataIngresos = await resIngresos.json()
      const dataCamaras = await resCamaras.json()

      if (dataCuartos.success) setCuartos(dataCuartos.data || [])
      if (dataIngresos.success) setIngresos(dataIngresos.data || [])
      if (dataCamaras.success) setCameras((dataCamaras.data || []).filter((c: Camara) => c.activo !== false))
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const toggleSeleccion = (id: string) => {
    const newSet = new Set(seleccionados)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSeleccionados(newSet)
  }

  const toggleSeleccionTodos = () => {
    if (seleccionados.size === cuartosFiltrados.length) {
      setSeleccionados(new Set())
    } else {
      setSeleccionados(new Set(cuartosFiltrados.map(c => c.id)))
    }
  }

  // Filtrar cuartos
  const cuartosFiltrados = cuartos.filter(c => {
    if (filtroTipoCuarto !== 'TODOS' && (c.tipoCuarto?.id || c.tipo) !== filtroTipoCuarto) return false
    if (busqueda) {
      const termino = busqueda.toLowerCase()
      return c.codigo.toLowerCase().includes(termino) ||
        (c.tipoCuarto?.nombre || c.tipo).toLowerCase().includes(termino) ||
        (c.mediaRes?.codigo || '').toLowerCase().includes(termino) ||
        (c.mediaRes?.romaneo?.tropaCodigo || '').toLowerCase().includes(termino)
    }
    return true
  })

  const pesoTotalSeleccionado = cuartos
    .filter(c => seleccionados.has(c.id))
    .reduce((sum, c) => sum + (c.peso || 0), 0)

  // Tipos de cuarto únicos para filtro
  const tiposUnicos = [...new Set(cuartos.map(c => c.tipoCuarto?.id || c.tipo))]
    .map(tipo => {
      const cuarto = cuartos.find(c => (c.tipoCuarto?.id || c.tipo) === tipo)
      return { id: tipo, nombre: cuarto?.tipoCuarto?.nombre || cuarto?.tipo || tipo }
    })

  // Registrar ingreso
  const handleRegistrar = async () => {
    if (seleccionados.size === 0) {
      toast.error('Seleccione al menos un cuarto')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/c2-ingreso-desposte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuartoIds: Array.from(seleccionados),
          camaraDestinoId: camaraDestinoId || null,
          operadorId: operador.id,
          observaciones: observaciones.trim() || null
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success(data.message || `${data.data.cuartosIngresados} cuarto(s) ingresados a desposte`)
        setSeleccionados(new Set())
        setCamaraDestinoId('')
        setObservaciones('')
        fetchDatos()
      } else {
        toast.error(data.error || 'Error al registrar ingreso')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al registrar ingreso')
    } finally {
      setSaving(false)
    }
  }

  // Badge color por tipo de media
  const tipoMediaBadge = (tipo: string) => {
    switch (tipo) {
      case 'DELANTERA': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'TRASERA': return 'bg-amber-50 text-amber-700 border-amber-200'
      default: return 'bg-stone-50 text-stone-700 border-stone-200'
    }
  }

  const estadoBadge = (estado: string) => {
    switch (estado) {
      case 'INGRESADO': return 'bg-green-50 text-green-700 border-green-200'
      case 'EN_PROCESO': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'PROCESADO': return 'bg-blue-50 text-blue-700 border-blue-200'
      default: return 'bg-stone-50 text-stone-700 border-stone-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <ArrowRight className="w-8 h-8 text-amber-500" />
              Ingreso a Desposte (C2)
            </h1>
            <p className="text-stone-500">Mover cuartos desde cámara a sala de desposte</p>
          </div>
          <Button onClick={fetchDatos} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-stone-100 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">En Cámara</p>
                  <p className="text-xl font-bold">{cuartos.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <Scissors className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Seleccionados</p>
                  <p className="text-xl font-bold text-amber-600">{seleccionados.size}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-teal-100 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Peso Seleccionado</p>
                  <p className="text-xl font-bold text-teal-600">{pesoTotalSeleccionado.toFixed(1)} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Ingresos Hoy</p>
                  <p className="text-xl font-bold text-green-600">
                    {ingresos.filter(i => new Date(i.fecha).toDateString() === new Date().toDateString()).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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
                    placeholder="Código, tropa, tipo de cuarto..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Label className="text-xs">Tipo de Cuarto</Label>
                <Select value={filtroTipoCuarto} onValueChange={setFiltroTipoCuarto}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    {tiposUnicos.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cuartos Disponibles */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                Cuartos en Cámara ({cuartosFiltrados.length})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={toggleSeleccionTodos}>
                {seleccionados.size === cuartosFiltrados.length ? 'Deseleccionar' : 'Seleccionar'} Todos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                <p className="text-stone-400 mt-2">Cargando cuartos...</p>
              </div>
            ) : cuartosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay cuartos disponibles en cámara</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50/50">
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>Media Res</TableHead>
                      <TableHead>Tropa</TableHead>
                      <TableHead>Cámara</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuartosFiltrados.map((c) => (
                      <TableRow
                        key={c.id}
                        className={`cursor-pointer ${seleccionados.has(c.id) ? 'bg-amber-50' : ''}`}
                        onClick={() => toggleSeleccion(c.id)}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={seleccionados.has(c.id)}
                            onChange={() => toggleSeleccion(c.id)}
                            className="rounded border-stone-300"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{c.codigo}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-stone-50">
                            {c.tipoCuarto?.nombre || c.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{(c.peso ?? 0).toFixed(1)} kg</TableCell>
                        <TableCell className="text-stone-500 text-sm">{c.mediaRes?.codigo || '-'}</TableCell>
                        <TableCell className="text-stone-500 text-sm">{c.mediaRes?.romaneo?.tropaCodigo || '-'}</TableCell>
                        <TableCell>{c.camara?.nombre || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulario de ingreso */}
        {seleccionados.size > 0 && (
          <Card className="border-2 border-amber-300 bg-amber-50/50">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-stone-800">
                    Ingresar {seleccionados.size} cuarto(s) — {pesoTotalSeleccionado.toFixed(1)} kg total
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Cámara Desposte (Destino)</Label>
                    <Select value={camaraDestinoId} onValueChange={setCamaraDestinoId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {camaras.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Observaciones</Label>
                    <Input
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Observaciones..."
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleRegistrar}
                      disabled={saving}
                      className="w-full bg-amber-500 hover:bg-amber-600"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                      {saving ? 'Procesando...' : 'Ingresar a Desposte'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historial de Ingresos */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Últimos Ingresos ({ingresos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ingresos.length === 0 ? (
              <div className="p-6 text-center text-stone-400">
                <p>No hay ingresos registrados</p>
              </div>
            ) : (
              <div className="max-h-[250px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50/50">
                      <TableHead>Fecha</TableHead>
                      <TableHead>Media Res</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Operador</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingresos.slice(0, 20).map((ing) => (
                      <TableRow key={ing.id}>
                        <TableCell className="text-sm">
                          {new Date(ing.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{ing.mediaCodigo || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={tipoMediaBadge(ing.tipoMedia)}>
                            {ing.tipoMedia}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{ing.pesoKg?.toFixed(1)} kg</TableCell>
                        <TableCell className="text-sm">{ing.camaraOrigen?.nombre || '-'}</TableCell>
                        <TableCell className="text-sm">{ing.camaraDestino?.nombre || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={estadoBadge(ing.estado)}>
                            {ing.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{ing.operador?.nombre || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
