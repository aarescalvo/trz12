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
  Package, Loader2, RefreshCw, Plus, CheckCircle, Truck, Scale, Printer
} from 'lucide-react'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'
import { useBalanza } from '@/hooks/useBalanza'
import { useImpresora } from '@/hooks/useImpresora'

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

interface Empaque {
  id: string
  paqueteId: string
  fecha: string
  producto: string
  pesoKg: number
  cantidad: number
  destino: string | null
  estado: string
  camara: { id: string; nombre: string } | null
  lote: { id: string; numero: number } | null
  operador: { id: string; nombre: string } | null
}

interface Props {
  operador: Operador
}

const PRODUCTOS = [
  'Carne Molida', 'Bola de Lomo', 'Nalga', 'Cuadril', 'Colita de Cuadril',
  'Bife de Chorizo', 'Bife Angosto', 'Osobuco', 'Costilla', 'Falda',
  'Vacío', 'Matambre', 'Asado', 'Hígado', 'Riñón', 'Corazón'
]

const DESTINOS = [
  'Cámara Frigorífica 1', 'Cámara Frigorífica 2', 'Expedición Local', 'Exportación',
  'Cadena de Supermercados A', 'Cadena de Supermercados B', 'Distribuidora Regional'
]

export function EmpaqueModule({ operador }: Props) {
  const { editMode, getTexto, setTexto, getBloque, updateBloque } = useEditor()
  const balanza = useBalanza()
  const impresora = useImpresora()
  const [empaques, setEmpaques] = useState<Empaque[]>([])
  const [camaras, setCameras] = useState<Camara[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'TODOS' | 'PENDIENTE' | 'EMPACADO' | 'DESPACHADO'>('TODOS')
  const [stats, setStats] = useState<any>({})
  
  const [producto, setProducto] = useState('')
  const [pesoKg, setPesoKg] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [destino, setDestino] = useState('')
  const [camaraId, setCamaraId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchEmpaques()
    fetchCameras()
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

  const fetchEmpaques = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/empaque')
      const data = await res.json()
      if (data.success) {
        setEmpaques(data.data)
        setStats(data.stats || {})
      } else {
        toast.error('Error al cargar empaques')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar empaques')
    } finally {
      setLoading(false)
    }
  }

  const handleEmpacar = async (id: string) => {
    try {
      const res = await fetch('/api/empaque', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, accion: 'empacar' })
      })
      const data = await res.json()
      if (data.success) {
        setEmpaques(empaques.map(e => e.id === id ? { ...e, estado: 'EMPACADO' } : e))
        toast.success('Paquete marcado como empacado')
      } else {
        toast.error('Error al actualizar estado')
      }
    } catch (error) {
      toast.error('Error al actualizar estado')
    }
  }

  const handleDespachar = async (id: string) => {
    try {
      const res = await fetch('/api/empaque', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, accion: 'despachar' })
      })
      const data = await res.json()
      if (data.success) {
        setEmpaques(empaques.map(e => e.id === id ? { ...e, estado: 'DESPACHADO' } : e))
        toast.success('Paquete despachado correctamente')
      } else {
        toast.error('Error al despachar')
      }
    } catch (error) {
      toast.error('Error al despachar')
    }
  }

  const handleNuevoEmpaque = async () => {
    if (!producto || !pesoKg || !cantidad) {
      toast.error('Complete todos los campos obligatorios')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/empaque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto,
          pesoKg: parseFloat(pesoKg),
          cantidad: parseInt(cantidad),
          destino,
          camaraId: camaraId || null,
          operadorId: operador.id
        })
      })

      const data = await res.json()
      if (data.success) {
        setEmpaques([data.data, ...empaques])
        // Auto-print rótulo
        impresora.imprimirRotulo({
          producto,
          peso: pesoKg,
          lote: data.data.lote?.numero?.toString(),
          fecha: new Date().toLocaleDateString('es-AR'),
          codigoBarras: data.data.paqueteId,
        }, 'caja')
        setProducto('')
        setPesoKg('')
        setCantidad('')
        setDestino('')
        setCamaraId('')
        toast.success('Paquete creado correctamente')
      } else {
        toast.error(data.error || 'Error al crear paquete')
      }
    } catch (error) {
      toast.error('Error al crear paquete')
    } finally {
      setSaving(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge className="bg-amber-100 text-amber-700">Pendiente</Badge>
      case 'EMPACADO':
        return <Badge className="bg-emerald-100 text-emerald-700">Empacado</Badge>
      case 'DESPACHADO':
        return <Badge className="bg-blue-100 text-blue-700">Despachado</Badge>
      case 'ANULADO':
        return <Badge className="bg-red-100 text-red-700">Anulado</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const empaquesFiltrados = empaques.filter(e => filtro === 'TODOS' || e.estado === filtro)
  const pendientes = empaques.filter(e => e.estado === 'PENDIENTE').length
  const empacados = empaques.filter(e => e.estado === 'EMPACADO').length
  const pesoTotal = empaques.reduce((acc, e) => acc + (e.pesoKg * e.cantidad), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
                <Package className="w-8 h-8 text-amber-500" />
                <TextoEditable id="empaque-titulo" original="Empaque de Productos" tag="span" />
              </h1>
              <p className="text-stone-500 mt-1">
                <TextoEditable id="empaque-subtitulo" original="Control de empaquetado de productos cárnicos" tag="span" />
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-stone-500">
                <TextoEditable id="label-operador" original="Operador" tag="span" />: <span className="font-medium text-stone-700">{operador.nombre}</span>
              </span>
              <Button onClick={fetchEmpaques} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                <TextoEditable id="btn-actualizar" original="Actualizar" tag="span" />
              </Button>
            </div>
          </div>
        </EditableBlock>

        {/* Resumen */}
        <EditableBlock bloqueId="resumenCards" label="Tarjetas de Resumen">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow bg-white" onClick={() => setFiltro('TODOS')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-total-paquetes" original="Total Paquetes" tag="span" /></p>
                    <p className="text-3xl font-bold text-stone-800 mt-1">{empaques.length}</p>
                  </div>
                  <Package className="w-8 h-8 text-stone-300" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow bg-white" onClick={() => setFiltro('PENDIENTE')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-pendientes" original="Pendientes" tag="span" /></p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">{pendientes}</p>
                  </div>
                  <Package className="w-8 h-8 text-amber-300" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow bg-white" onClick={() => setFiltro('EMPACADO')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-empacados" original="Empacados" tag="span" /></p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">{empacados}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-emerald-300" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-peso-total" original="Peso Total" tag="span" /></p>
                    <p className="text-3xl font-bold text-stone-800 mt-1">{pesoTotal.toLocaleString('es-AR', { maximumFractionDigits: 1 })} kg</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-stone-500">KG</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </EditableBlock>

        {/* Formulario */}
        <EditableBlock bloqueId="formulario" label="Formulario">
          <Card className="border-0 shadow-md bg-white">
            <CardHeader className="bg-stone-50 rounded-t-lg border-b border-stone-100">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-stone-800">
                <Plus className="w-5 h-5 text-amber-500" />
                <TextoEditable id="titulo-nuevo-paquete" original="Nuevo Paquete" tag="span" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label className="text-stone-600"><TextoEditable id="label-producto" original="Producto" tag="span" /> *</Label>
                  <Select value={producto} onValueChange={setProducto}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                    <SelectContent>
                      {PRODUCTOS.map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-stone-600"><TextoEditable id="label-peso-unidad" original="Peso por Unidad (Kg)" tag="span" /> *</Label>
                  {/* Balanza Integration */}
                  <div className="flex items-center gap-2 mb-1">
                    <Button 
                      type="button" 
                      variant={balanza.leyendo ? "destructive" : "outline"} 
                      size="sm"
                      onClick={() => balanza.leyendo ? balanza.detener() : balanza.iniciar()}
                    >
                      <Scale className="w-4 h-4 mr-1" />
                      {balanza.leyendo ? 'Detener' : 'Balanza'}
                    </Button>
                    {balanza.leyendo && (
                      <>
                        <span className={`text-lg font-mono ${balanza.estable ? 'text-green-600' : 'text-amber-500'}`}>
                          {balanza.peso.toFixed(2)} kg
                        </span>
                        <Button 
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!balanza.estable || balanza.peso <= 0}
                          onClick={() => {
                            const captured = balanza.capturarPeso()
                            if (captured) setPesoKg(captured.toString())
                          }}
                        >
                          Capturar
                        </Button>
                      </>
                    )}
                    {balanza.error && <span className="text-xs text-red-500">{balanza.error}</span>}
                  </div>
                  <Input type="number" step="0.1" value={pesoKg} onChange={(e) => setPesoKg(e.target.value)} placeholder="0.0" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-stone-600"><TextoEditable id="label-cantidad" original="Cantidad" tag="span" /> *</Label>
                  <Input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="0" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-stone-600"><TextoEditable id="label-destino" original="Destino" tag="span" /></Label>
                  <Select value={destino} onValueChange={setDestino}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar destino" /></SelectTrigger>
                    <SelectContent>
                      {DESTINOS.map(d => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleNuevoEmpaque} className="w-full bg-amber-500 hover:bg-amber-600 text-white" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Package className="w-4 h-4 mr-2" />}
                    <TextoEditable id="btn-crear-paquete" original="Crear Paquete" tag="span" />
                  </Button>
                </div>
              </div>
              {producto && pesoKg && cantidad && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-sm text-amber-700">
                    <span className="font-medium"><TextoEditable id="label-resumen" original="Resumen" tag="span" />:</span> {cantidad} <TextoEditable id="label-unidades" original="unidades" tag="span" /> × {pesoKg} kg = 
                    <span className="font-bold"> {(parseFloat(pesoKg) * parseInt(cantidad || '0')).toLocaleString('es-AR', { maximumFractionDigits: 1 })} kg <TextoEditable id="label-totales" original="totales" tag="span" /></span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </EditableBlock>

        {/* Tabla */}
        <EditableBlock bloqueId="tablaEmpaques" label="Tabla de Paquetes">
          <Card className="border-0 shadow-md bg-white">
            <CardHeader className="bg-stone-50 rounded-t-lg border-b border-stone-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-stone-800">
                  <TextoEditable id="titulo-paquetes" original="Paquetes" tag="span" />
                </CardTitle>
                <div className="flex gap-2">
                  {(['TODOS', 'PENDIENTE', 'EMPACADO'] as const).map((f) => (
                    <Button key={f} variant={filtro === f ? 'default' : 'outline'} size="sm" onClick={() => setFiltro(f)}
                      className={filtro === f ? 'bg-amber-500 hover:bg-amber-600' : ''}>
                      {f === 'TODOS' ? 'Todos' : f === 'PENDIENTE' ? 'Pendientes' : 'Empacados'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
              ) : empaquesFiltrados.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No hay paquetes {filtro.toLowerCase()}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50/50 hover:bg-stone-50/50">
                        <TableHead className="font-semibold text-stone-600">ID Paquete</TableHead>
                        <TableHead className="font-semibold text-stone-600">Producto</TableHead>
                        <TableHead className="font-semibold text-stone-600">Peso</TableHead>
                        <TableHead className="font-semibold text-stone-600">Cantidad</TableHead>
                        <TableHead className="font-semibold text-stone-600">Destino</TableHead>
                        <TableHead className="font-semibold text-stone-600">Estado</TableHead>
                        <TableHead className="font-semibold text-stone-600">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {empaquesFiltrados.map((emp) => (
                        <TableRow key={emp.id} className="hover:bg-stone-50/50">
                          <TableCell className="font-mono font-medium text-stone-800">{emp.paqueteId}</TableCell>
                          <TableCell className="font-medium text-stone-800">{emp.producto}</TableCell>
                          <TableCell className="text-stone-600">{emp.pesoKg.toLocaleString('es-AR')} kg</TableCell>
                          <TableCell className="text-stone-600">{emp.cantidad} uds</TableCell>
                          <TableCell className="text-stone-600 max-w-[150px] truncate">{emp.destino || '-'}</TableCell>
                          <TableCell>{getEstadoBadge(emp.estado)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {emp.estado === 'PENDIENTE' && (
                                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleEmpacar(emp.id)}>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Empacar
                                </Button>
                              )}
                              {emp.estado === 'EMPACADO' && (
                                <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleDespachar(emp.id)}>
                                  <Truck className="w-4 h-4 mr-1" />
                                  Despachar
                                </Button>
                              )}
                              {(emp.estado === 'EMPACADO' || emp.estado === 'PENDIENTE') && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  disabled={impresora.imprimiendo}
                                  onClick={() => {
                                    impresora.imprimirRotulo({
                                      producto: emp.producto,
                                      peso: emp.pesoKg.toString(),
                                      lote: emp.lote?.numero?.toString(),
                                      fecha: new Date(emp.fecha).toLocaleDateString('es-AR'),
                                      codigoBarras: emp.paqueteId,
                                    }, 'caja')
                                  }}
                                >
                                  <Printer className="w-4 h-4 mr-1" />
                                  Reimprimir
                                </Button>
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
        </EditableBlock>
      </div>
    </div>
  )
}

export default EmpaqueModule
