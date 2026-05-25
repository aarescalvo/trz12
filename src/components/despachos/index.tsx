'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Truck, Loader2, RefreshCw, Plus, Package, Send, CheckCircle, Printer
} from 'lucide-react'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Despacho {
  id: string
  numero: number
  fecha: string
  destino: string
  direccionDestino?: string
  patenteCamion?: string
  patenteAcoplado?: string
  chofer?: string
  choferDni?: string
  transportista?: string
  remito?: string
  kgTotal: number
  cantidadMedias: number
  estado: string
  observaciones?: string
  operador?: { nombre: string }
  ticketPesaje?: { 
    numeroTicket: string
    pesoBruto: number
    pesoTara: number
    pesoNeto: number 
  }
  items?: Array<{
    id: string
    mediaResId: string
    tropaCodigo?: string
    garron?: number
    peso: number
  }>
}

interface Props {
  operador: Operador
}

export function DespachosModule({ operador }: Props) {
  const { editMode, getTexto } = useEditor()
  const [despachos, setDespachos] = useState<Despacho[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<string>('TODOS')
  
  // Form state
  const [destino, setDestino] = useState('')
  const [transportista, setTransportista] = useState('')
  const [patente, setPatente] = useState('')
  const [remito, setRemito] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDespachos()
  }, [])

  const fetchDespachos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/despachos')
      const data = await res.json()
      if (data.success) {
        setDespachos(data.data)
      } else {
        toast.error(data.error || 'Error al cargar despachos')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar despachos')
    } finally {
      setLoading(false)
    }
  }

  const handleCambiarEstado = async (id: string, accion: 'confirmar' | 'entregar' | 'anular') => {
    setSaving(true)
    try {
      const res = await fetch('/api/despachos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, accion })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Despacho ${accion === 'confirmar' ? 'despachado' : accion === 'entregar' ? 'entregado' : 'anulado'} correctamente`)
        fetchDespachos()
      } else {
        toast.error(data.error || 'Error al actualizar')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar despacho')
    } finally {
      setSaving(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge className="bg-amber-100 text-amber-700">Pendiente</Badge>
      case 'EN_CARGA':
        return <Badge className="bg-purple-100 text-purple-700">En Carga</Badge>
      case 'DESPACHADO':
        return <Badge className="bg-blue-100 text-blue-700">Despachado</Badge>
      case 'ENTREGADO':
        return <Badge className="bg-emerald-100 text-emerald-700">Entregado</Badge>
      case 'ANULADO':
        return <Badge className="bg-red-100 text-red-700">Anulado</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const despachosFiltrados = despachos.filter(d => 
    filtro === 'TODOS' || d.estado === filtro
  )

  const pendientes = despachos.filter(d => d.estado === 'PENDIENTE').length
  const despachados = despachos.filter(d => d.estado === 'DESPACHADO').length
  const entregados = despachos.filter(d => d.estado === 'ENTREGADO').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
                <Truck className="w-8 h-8 text-amber-500" />
                <TextoEditable id="titulo-despachos" original="Despachos" tag="span" />
              </h1>
              <p className="text-stone-500 mt-1">
                <TextoEditable id="subtitulo-despachos" original="Control de despachos y entregas" tag="span" />
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchDespachos} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                <TextoEditable id="btn-actualizar-desp" original="Actualizar" tag="span" />
              </Button>
            </div>
          </div>
        </EditableBlock>

        {/* Resumen */}
        <EditableBlock bloqueId="resumen" label="Tarjetas de Resumen">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('TODOS')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-total-desp" original="Total" tag="span" /></p>
                <p className="text-3xl font-bold text-stone-800">{despachos.length}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('PENDIENTE')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-pendientes-desp" original="Pendientes" tag="span" /></p>
                <p className="text-3xl font-bold text-amber-600">{pendientes}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('DESPACHADO')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-en-camino-desp" original="En Camino" tag="span" /></p>
                <p className="text-3xl font-bold text-blue-600">{despachados}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('ENTREGADO')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-entregados-desp" original="Entregados" tag="span" /></p>
                <p className="text-3xl font-bold text-emerald-600">{entregados}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-kg-total-desp" original="Kg Total" tag="span" /></p>
                <p className="text-3xl font-bold text-stone-800">{despachos.reduce((acc, d) => acc + (d.kgTotal || 0), 0).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        </EditableBlock>

        {/* Filtros */}
        <EditableBlock bloqueId="filtros" label="Filtros">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-stone-600"><TextoEditable id="label-filtrar-desp" original="Filtrar:" tag="span" /></span>
                <div className="flex gap-2 flex-wrap">
                  {['TODOS', 'PENDIENTE', 'DESPACHADO', 'ENTREGADO'].map((f) => (
                    <Button
                      key={f}
                      variant={filtro === f ? 'default' : 'outline'}
                      size="sm"
                      className={filtro === f ? 'bg-amber-500 hover:bg-amber-600' : ''}
                      onClick={() => setFiltro(f)}
                    >
                      {f === 'TODOS' ? 'Todos' : f === 'PENDIENTE' ? 'Pendientes' : f === 'DESPACHADO' ? 'En Camino' : 'Entregados'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </EditableBlock>

        {/* Tabla */}
        <EditableBlock bloqueId="tabla" label="Tabla de Despachos">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                <TextoEditable id="titulo-tabla-desp" original="Despachos" tag="span" />
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
                  <p><TextoEditable id="msg-sin-despachos" original="No hay despachos" tag="span" /></p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><TextoEditable id="th-numero-desp" original="N°" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-fecha-desp" original="Fecha" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-destino-desp" original="Destino" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-camion-desp" original="Camión" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-medias-desp" original="Medias" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-kg-desp" original="Kg" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-estado-desp" original="Estado" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-acciones-desp" original="Acciones" tag="span" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {despachosFiltrados.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-bold">#{d.numero}</TableCell>
                        <TableCell>
                          {new Date(d.fecha).toLocaleDateString('es-AR')}
                        </TableCell>
                        <TableCell>{d.destino}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{d.transportista || '-'}</p>
                            <p className="text-xs text-stone-400">{d.patenteCamion || '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell>{d.cantidadMedias}</TableCell>
                        <TableCell className="font-medium">{(d.kgTotal || 0).toLocaleString()} kg</TableCell>
                        <TableCell>{getEstadoBadge(d.estado)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {d.estado === 'PENDIENTE' && (
                              <Button
                                size="sm"
                                className="bg-blue-500 hover:bg-blue-600"
                                onClick={() => handleCambiarEstado(d.id, 'confirmar')}
                                disabled={saving}
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Despachar
                              </Button>
                            )}
                            {d.estado === 'DESPACHADO' && (
                              <Button
                                size="sm"
                                className="bg-emerald-500 hover:bg-emerald-600"
                                onClick={() => handleCambiarEstado(d.id, 'entregar')}
                                disabled={saving}
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
        </EditableBlock>
      </div>
    </div>
  )
}

export default DespachosModule
