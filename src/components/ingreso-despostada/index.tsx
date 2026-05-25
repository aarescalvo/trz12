'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  Package, Loader2, RefreshCw, Plus, ArrowRight, Undo2
} from 'lucide-react'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

interface Operador {
  id: string
  nombre: string
  rol: string
  permisos?: Record<string, boolean>
}

interface Camara {
  id: string
  nombre: string
  tipo: string
  activo?: boolean
}

interface Lote {
  id: string
  numero: number
  estado: string
}

interface IngresoDespostada {
  id: string
  fecha: string
  tropaCodigo: string | null
  mediaCodigo: string | null
  tipoMedia: string
  pesoKg: number
  estado: string
  camaraOrigen: { id: string; nombre: string } | null
  camaraDestino: { id: string; nombre: string } | null
  lote: { id: string; numero: number } | null
  operador: { id: string; nombre: string } | null
}

interface Props {
  operador: Operador
}

export function IngresoDespostadaModule({ operador }: Props) {
  const { editMode, getTexto, setTexto, getBloque, updateBloque } = useEditor()
  const [ingresos, setIngresos] = useState<IngresoDespostada[]>([])
  const [camaras, setCameras] = useState<Camara[]>([])
  const [lotes, setLotes] = useState<Lote[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'TODOS' | 'PENDIENTE' | 'INGRESADO' | 'EN_PROCESO'>('PENDIENTE')
  
  const [tropaCodigo, setTropaCodigo] = useState('')
  const [mediaCodigo, setMediaCodigo] = useState('')
  const [tipoMedia, setTipoMedia] = useState<string>('DELANTERA')
  const [pesoKg, setPesoKg] = useState('')
  const [camaraOrigenId, setCamaraOrigenId] = useState('')
  const [camaraDestinoId, setCamaraDestinoId] = useState('')
  const [loteId, setLoteId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchIngresos()
    fetchCameras()
    fetchLotes()
  }, [])

  const fetchCameras = async () => {
    try {
      const res = await fetch('/api/camaras')
      const data = await res.json()
      if (data.success) {
        setCameras(data.data.filter((c: Camara) => c.activo !== false))
      }
    } catch (error) {
      console.error('Error fetching cámaras:', error)
    }
  }

  const fetchLotes = async () => {
    try {
      const res = await fetch('/api/lotes-despostada')
      const data = await res.json()
      if (data.success) {
        setLotes(data.data.filter((l: Lote) => l.estado === 'ABIERTO'))
      }
    } catch (error) {
      console.error('Error fetching lotes:', error)
    }
  }

  const fetchIngresos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ingreso-despostada')
      const data = await res.json()
      if (data.success) {
        setIngresos(data.data)
      } else {
        toast.error('Error al cargar ingresos')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar ingresos')
    } finally {
      setLoading(false)
    }
  }

  const handleIngresar = async (id: string) => {
    try {
      const res = await fetch('/api/ingreso-despostada', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, accion: 'ingresar' })
      })
      const data = await res.json()
      if (data.success) {
        setIngresos(ingresos.map(i => i.id === id ? { ...i, estado: 'INGRESADO' } : i))
        toast.success('Media ingresada a despostada')
      } else {
        toast.error('Error al ingresar')
      }
    } catch (error) {
      toast.error('Error al ingresar')
    }
  }

  const handleDevolver = async (id: string) => {
    try {
      const res = await fetch('/api/ingreso-despostada', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, accion: 'devolver' })
      })
      const data = await res.json()
      if (data.success) {
        setIngresos(ingresos.map(i => i.id === id ? { ...i, estado: 'DEVUELTO' } : i))
        toast.success('Media devuelta a cámara')
      } else {
        toast.error('Error al devolver')
      }
    } catch (error) {
      toast.error('Error al devolver')
    }
  }

  const handleNuevoIngreso = async () => {
    if (!pesoKg) {
      toast.error('El peso es obligatorio')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/ingreso-despostada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tropaCodigo: tropaCodigo || null,
          mediaCodigo: mediaCodigo || null,
          tipoMedia,
          pesoKg: parseFloat(pesoKg),
          camaraOrigenId: camaraOrigenId || null,
          camaraDestinoId: camaraDestinoId || null,
          loteId: loteId || null,
          operadorId: operador.id
        })
      })

      const data = await res.json()
      if (data.success) {
        setIngresos([data.data, ...ingresos])
        setTropaCodigo('')
        setMediaCodigo('')
        setPesoKg('')
        setCamaraOrigenId('')
        setCamaraDestinoId('')
        setLoteId('')
        toast.success('Ingreso registrado correctamente')
      } else {
        toast.error(data.error || 'Error al registrar ingreso')
      }
    } catch (error) {
      toast.error('Error al registrar ingreso')
    } finally {
      setSaving(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge className="bg-amber-100 text-amber-700">Pendiente</Badge>
      case 'INGRESADO':
        return <Badge className="bg-blue-100 text-blue-700">Ingresado</Badge>
      case 'EN_PROCESO':
        return <Badge className="bg-purple-100 text-purple-700">En Proceso</Badge>
      case 'PROCESADO':
        return <Badge className="bg-emerald-100 text-emerald-700">Procesado</Badge>
      case 'DEVUELTO':
        return <Badge className="bg-red-100 text-red-700">Devuelto</Badge>
      case 'ANULADO':
        return <Badge className="bg-gray-100 text-gray-700">Anulado</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const getTipoBadge = (tipo: string) => {
    return tipo === 'DELANTERA' 
      ? <Badge variant="outline" className="border-emerald-300 text-emerald-700">Delantera</Badge>
      : tipo === 'TRASERA'
      ? <Badge variant="outline" className="border-purple-300 text-purple-700">Trasera</Badge>
      : <Badge variant="outline" className="border-blue-300 text-blue-700">Entera</Badge>
  }

  const ingresosFiltrados = ingresos.filter(i => filtro === 'TODOS' || i.estado === filtro)
  const pendientes = ingresos.filter(i => i.estado === 'PENDIENTE').length
  const ingresados = ingresos.filter(i => i.estado === 'INGRESADO').length
  const enProceso = ingresos.filter(i => i.estado === 'EN_PROCESO').length
  const pesoTotal = ingresos.reduce((acc, i) => acc + (i.pesoKg || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
                <Package className="w-8 h-8 text-amber-500" />
                <TextoEditable id="ingreso-despostada-titulo" original="Ingreso a Despostada" tag="span" />
              </h1>
              <p className="text-stone-500 mt-1">
                <TextoEditable id="ingreso-despostada-subtitulo" original="Control de medias ingresadas a despostada" tag="span" />
              </p>
            </div>
            <Button onClick={fetchIngresos} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              <TextoEditable id="btn-actualizar" original="Actualizar" tag="span" />
            </Button>
          </div>
        </EditableBlock>

        {/* Resumen */}
        <EditableBlock bloqueId="resumenCards" label="Tarjetas de Resumen">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('TODOS')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-total" original="Total" tag="span" /></p>
                <p className="text-3xl font-bold text-stone-800">{ingresos.length}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('PENDIENTE')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-pendientes" original="Pendientes" tag="span" /></p>
                <p className="text-3xl font-bold text-amber-600">{pendientes}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('INGRESADO')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-ingresados" original="Ingresados" tag="span" /></p>
                <p className="text-3xl font-bold text-blue-600">{ingresados}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('EN_PROCESO')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-en-proceso" original="En Proceso" tag="span" /></p>
                <p className="text-3xl font-bold text-purple-600">{enProceso}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-peso-total" original="Peso Total" tag="span" /></p>
                <p className="text-3xl font-bold text-stone-800">{pesoTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })} kg</p>
              </CardContent>
            </Card>
          </div>
        </EditableBlock>

        {/* Formulario */}
        <EditableBlock bloqueId="formulario" label="Formulario">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" />
                <TextoEditable id="titulo-nuevo-ingreso" original="Nuevo Ingreso" tag="span" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label><TextoEditable id="label-tropa" original="Tropa" tag="span" /></Label>
                  <Input value={tropaCodigo} onChange={(e) => setTropaCodigo(e.target.value)} placeholder="B 2026 0001" />
                </div>
                <div className="space-y-2">
                  <Label><TextoEditable id="label-media" original="Código Media" tag="span" /></Label>
                  <Input value={mediaCodigo} onChange={(e) => setMediaCodigo(e.target.value)} placeholder="MED-001-D" />
                </div>
                <div className="space-y-2">
                  <Label><TextoEditable id="label-tipo" original="Tipo Media" tag="span" /></Label>
                  <Select value={tipoMedia} onValueChange={setTipoMedia}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DELANTERA">Delantera</SelectItem>
                      <SelectItem value="TRASERA">Trasera</SelectItem>
                      <SelectItem value="ENTERA">Entera</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label><TextoEditable id="label-peso-kg" original="Peso (Kg)" tag="span" /> *</Label>
                  <Input type="number" step="0.1" value={pesoKg} onChange={(e) => setPesoKg(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div className="space-y-2">
                  <Label><TextoEditable id="label-camara-origen" original="Cámara Origen" tag="span" /></Label>
                  <Select value={camaraOrigenId} onValueChange={setCamaraOrigenId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {camaras.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label><TextoEditable id="label-camara-destino" original="Cámara Destino" tag="span" /></Label>
                  <Select value={camaraDestinoId} onValueChange={setCamaraDestinoId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {camaras.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label><TextoEditable id="label-lote" original="Lote Despostada" tag="span" /></Label>
                  <Select value={loteId} onValueChange={setLoteId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {lotes.map(l => (
                        <SelectItem key={l.id} value={l.id}>Lote #{l.numero}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleNuevoIngreso} className="w-full bg-amber-500 hover:bg-amber-600" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                    <TextoEditable id="btn-registrar" original="Registrar" tag="span" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </EditableBlock>

        {/* Tabla */}
        <EditableBlock bloqueId="tablaIngresos" label="Tabla de Ingresos">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold">
                <TextoEditable id="titulo-medias" original="Medias" tag="span" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
              ) : ingresosFiltrados.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p><TextoEditable id="msg-no-hay-ingresos" original="No hay ingresos" tag="span" /> {filtro.toLowerCase()}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><TextoEditable id="th-fecha" original="Fecha" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-tropa" original="Tropa" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-media" original="Media" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-tipo" original="Tipo" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-peso" original="Peso" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-origen" original="Origen" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-destino" original="Destino" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-estado" original="Estado" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-acciones" original="Acciones" tag="span" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingresosFiltrados.map((ing) => (
                      <TableRow key={ing.id}>
                        <TableCell>{new Date(ing.fecha).toLocaleDateString('es-AR')}</TableCell>
                        <TableCell className="font-mono">{ing.tropaCodigo || '-'}</TableCell>
                        <TableCell className="font-mono">{ing.mediaCodigo || '-'}</TableCell>
                        <TableCell>{getTipoBadge(ing.tipoMedia)}</TableCell>
                        <TableCell>{ing.pesoKg?.toLocaleString('es-AR', { maximumFractionDigits: 1 })} kg</TableCell>
                        <TableCell>{ing.camaraOrigen?.nombre || '-'}</TableCell>
                        <TableCell>{ing.camaraDestino?.nombre || '-'}</TableCell>
                        <TableCell>{getEstadoBadge(ing.estado)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {ing.estado === 'PENDIENTE' && (
                              <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={() => handleIngresar(ing.id)}>
                                <ArrowRight className="w-4 h-4 mr-1" />
                                Ingresar
                              </Button>
                            )}
                            {ing.estado === 'INGRESADO' && (
                              <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => handleDevolver(ing.id)}>
                                <Undo2 className="w-4 h-4 mr-1" />
                                Devolver
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </EditableBlock>
      </div>
    </div>
  )
}

export default IngresoDespostadaModule
