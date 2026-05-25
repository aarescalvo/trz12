'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Truck, Package, AlertTriangle, CheckCircle, Clock, XCircle,
  Search, Plus, Eye, ChevronDown, ChevronRight, Loader2, FileText,
  FileDown, FileSpreadsheet, RefreshCw
} from 'lucide-react'
import { ExcelExporter } from '@/lib/export-excel'
import { PDFExporter } from '@/lib/export-pdf'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Cliente {
  id: string
  nombre: string
  cuit?: string
  direccion?: string
}

interface CajaDisponible {
  id: string
  numero: string
  pesoNeto: number
  pesoBruto: number
  tropaCodigo?: string
  fechaFaena?: string
  estado: string
  productoDesposte?: { nombre: string; codigo: string; rubro?: { nombre: string } }
}

interface ExpedicionItem {
  id: string
  caja: {
    id: string
    numero: string
    pesoNeto: number
    pesoBruto: number
    tropaCodigo?: string
    fechaFaena?: string
    estado: string
    productoDesposte?: { nombre: string; codigo: string; rubro?: { nombre: string } }
  }
}

interface ExpedicionOrden {
  id: string
  numero: number
  estado: string
  cantidadCajas: number
  pesoTotal: number
  transporteNombre?: string
  patenteCamion?: string
  choferNombre?: string
  choferDni?: string
  nroRemito?: string
  fechaDespacho?: string
  fecha: string
  observaciones?: string
  cliente: { id: string; nombre: string; cuit?: string; direccion?: string }
  operador?: { id: string; nombre: string }
  items: ExpedicionItem[]
}

export default function C2ExpedicionModule({ operador }: { operador: Operador }) {
  const [ordenes, setOrdenes] = useState<ExpedicionOrden[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cajasDisponibles, setCajasDisponibles] = useState<CajaDisponible[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [expandida, setExpandida] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  // Form state
  const [clienteId, setClienteId] = useState('')
  const [transporteNombre, setTransporteNombre] = useState('')
  const [patenteCamion, setPatenteCamion] = useState('')
  const [choferNombre, setChoferNombre] = useState('')
  const [choferDni, setChoferDni] = useState('')
  const [nroRemito, setNroRemito] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [cajasSeleccionadas, setCajasSeleccionadas] = useState<string[]>([])
  const [filtroProducto, setFiltroProducto] = useState('')
  const [filtroTropa, setFiltroTropa] = useState('')
  const [creando, setCreando] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    cargarOrdenes()
  }, [filtroEstado])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      await Promise.all([cargarOrdenes(), cargarClientes(), cargarCajasDisponibles()])
    } finally {
      setLoading(false)
    }
  }

  const cargarOrdenes = async () => {
    try {
      const params = new URLSearchParams()
      if (filtroEstado) params.set('estado', filtroEstado)
      const res = await fetch(`/api/c2-expedicion?${params}`)
      const data = await res.json()
      if (data.success) setOrdenes(data.data)
    } catch (error) {
      console.error('Error cargando órdenes:', error)
    }
  }

  const cargarClientes = async () => {
    try {
      const res = await fetch('/api/clientes?limit=200')
      const data = await res.json()
      if (data.success) setClientes(data.data || [])
    } catch (error) {
      console.error('Error cargando clientes:', error)
    }
  }

  const cargarCajasDisponibles = async () => {
    try {
      const res = await fetch('/api/c2-produccion-cajas?limit=500')
      const data = await res.json()
      if (data.success) {
        const disponibles = (data.data || []).filter(
          (c: CajaDisponible) => c.estado === 'ARMADA' || c.estado === 'EN_PALLETS' || c.estado === 'EN_CAMARA'
        )
        setCajasDisponibles(disponibles)
      }
    } catch (error) {
      console.error('Error cargando cajas:', error)
    }
  }

  const toggleCaja = (cajaId: string) => {
    if (cajasSeleccionadas.includes(cajaId)) {
      setCajasSeleccionadas(cajasSeleccionadas.filter(id => id !== cajaId))
    } else {
      setCajasSeleccionadas([...cajasSeleccionadas, cajaId])
    }
  }

  const seleccionarPorProducto = (productoNombre: string) => {
    const cajasProducto = cajasDisponibles
      .filter(c => c.productoDesposte?.nombre === productoNombre && !cajasSeleccionadas.includes(c.id))
      .map(c => c.id)
    setCajasSeleccionadas([...cajasSeleccionadas, ...cajasProducto])
  }

  const crearOrden = async () => {
    if (!clienteId) {
      toast.error('Seleccione un cliente')
      return
    }
    if (cajasSeleccionadas.length === 0) {
      toast.error('Seleccione al menos una caja')
      return
    }

    setCreando(true)
    try {
      const res = await fetch('/api/c2-expedicion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId,
          transporteNombre: transporteNombre || undefined,
          patenteCamion: patenteCamion || undefined,
          choferNombre: choferNombre || undefined,
          choferDni: choferDni || undefined,
          nroRemito: nroRemito || undefined,
          cajaIds: cajasSeleccionadas,
          operadorId: operador.id,
          observaciones: observaciones || undefined
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        if (data.fifoAlerts && data.fifoAlerts.length > 0) {
          toast.warning(`Alerta FIFO: Existen cajas del mismo producto con fecha de faena más antigua`, {
            duration: 8000
          })
        }
        resetForm()
        cargarDatos()
      } else {
        toast.error(data.error || 'Error al crear orden')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setCreando(false)
    }
  }

  const cambiarEstado = async (id: string, estado: string) => {
    try {
      const res = await fetch('/api/c2-expedicion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Orden actualizada a ${estado}`)
        cargarOrdenes()
      } else {
        toast.error(data.error || 'Error al actualizar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }

  const resetForm = () => {
    setClienteId('')
    setTransporteNombre('')
    setPatenteCamion('')
    setChoferNombre('')
    setChoferDni('')
    setNroRemito('')
    setObservaciones('')
    setCajasSeleccionadas([])
    setMostrarForm(false)
  }

  const exportarExcel = () => {
    const dateStr = new Date().toISOString().split('T')[0]
    if (ordenes.length === 0) return

    const data = ordenes.map(o => ({
      'Nro Orden': o.numero,
      Estado: o.estado.replace('_', ' '),
      Cliente: o.cliente.nombre,
      'Cajas': o.cantidadCajas,
      'Peso Total (kg)': o.pesoTotal.toFixed(1),
      Transporte: o.transporteNombre || '-',
      Patente: o.patenteCamion || '-',
      Chofer: o.choferNombre || '-',
      'DNI Chofer': o.choferDni || '-',
      'Nro Remito': o.nroRemito || '-',
      Fecha: new Date(o.fecha).toLocaleDateString('es-AR'),
      'Fecha Despacho': o.fechaDespacho ? new Date(o.fechaDespacho).toLocaleDateString('es-AR') : '-',
      Observaciones: o.observaciones || '',
      Operador: o.operador?.nombre || '-'
    }))
    ExcelExporter.exportFromObjects(data, `expedicion_c2_${dateStr}`, 'Expediciones')
    setExportOpen(false)
  }

  const exportarPDF = () => {
    const dateStr = new Date().toISOString().split('T')[0]
    const headers = ['Orden', 'Estado', 'Cliente', 'Cajas', 'Peso (kg)', 'Transporte', 'Chofer', 'Remito', 'Fecha']
    const rows = ordenes.map(o => [
      `#${o.numero}`,
      o.estado.replace('_', ' '),
      o.cliente.nombre,
      o.cantidadCajas.toString(),
      o.pesoTotal.toFixed(1),
      o.transporteNombre || '-',
      o.choferNombre || '-',
      o.nroRemito || '-',
      new Date(o.fecha).toLocaleDateString('es-AR')
    ])
    const doc = PDFExporter.generateReport({ title: 'Reporte de Expediciones C2', subtitle: `Total: ${ordenes.length} órdenes`, headers, data: rows, orientation: 'landscape' })
    PDFExporter.downloadPDF(doc, `expedicion_c2_${dateStr}.pdf`)
    setExportOpen(false)
  }

  const getEstadoBadge = (estado: string) => {
    const config: Record<string, { color: string; icon: typeof Clock }> = {
      PENDIENTE: { color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
      EN_PREPARACION: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Package },
      DESPACHADO: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      ANULADO: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle }
    }
    const c = config[estado] || config.PENDIENTE
    return (
      <Badge variant="outline" className={`${c.color} text-xs`}>
        <c.icon className="w-3 h-3 mr-1" />
        {estado.replace('_', ' ')}
      </Badge>
    )
  }

  // Filtrar cajas disponibles
  const cajasFiltradas = cajasDisponibles.filter(c => {
    const matchProducto = !filtroProducto ||
      c.productoDesposte?.nombre?.toLowerCase().includes(filtroProducto.toLowerCase())
    const matchTropa = !filtroTropa ||
      c.tropaCodigo?.toLowerCase().includes(filtroTropa.toLowerCase())
    return matchProducto && matchTropa
  })

  // Agrupar cajas por producto
  const cajasPorProducto = cajasFiltradas.reduce((acc, c) => {
    const key = c.productoDesposte?.nombre || 'Sin producto'
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {} as Record<string, CajaDisponible[]>)

  const pesoTotalSeleccionado = cajasDisponibles
    .filter(c => cajasSeleccionadas.includes(c.id))
    .reduce((sum, c) => sum + c.pesoNeto, 0)

  // Stats
  const pendientes = ordenes.filter(o => o.estado === 'PENDIENTE').length
  const enPreparacion = ordenes.filter(o => o.estado === 'EN_PREPARACION').length
  const despachadas = ordenes.filter(o => o.estado === 'DESPACHADO').length

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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Truck className="w-8 h-8 text-amber-500" />
              Expedición C2
            </h1>
            <p className="text-stone-500 mt-1">Despacho de cajas y pallets con control FIFO</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button variant="outline" onClick={() => setExportOpen(!exportOpen)}>
                <FileDown className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-[180px]">
                  <button
                    onClick={exportarExcel}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-stone-50 rounded-t-lg"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    Exportar Excel
                  </button>
                  <button
                    onClick={exportarPDF}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-stone-50 rounded-b-lg"
                  >
                    <FileDown className="w-4 h-4 text-red-600" />
                    Exportar PDF
                  </button>
                </div>
              )}
            </div>
            <Button
              onClick={() => setMostrarForm(!mostrarForm)}
              className="bg-amber-500 hover:bg-amber-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Orden
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-xs text-stone-500">Pendientes</p>
                  <p className="text-xl font-bold text-amber-700">{pendientes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-stone-500">En Preparación</p>
                  <p className="text-xl font-bold text-blue-700">{enPreparacion}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-xs text-stone-500">Despachadas</p>
                  <p className="text-xl font-bold text-green-700">{despachadas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-xs text-stone-500">Cajas Disponibles</p>
                  <p className="text-xl font-bold text-purple-700">{cajasDisponibles.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulario nueva orden */}
        {mostrarForm && (
          <Card className="border-0 shadow-md mb-6">
            <CardHeader className="bg-amber-50 rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                Nueva Orden de Expedición
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Cliente y transporte */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Cliente *</Label>
                  <select
                    className="w-full mt-1 p-2 border rounded-md bg-white text-sm"
                    value={clienteId}
                    onChange={e => setClienteId(e.target.value)}
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}{c.cuit ? ` - CUIT: ${c.cuit}` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Transporte</Label>
                  <Input
                    value={transporteNombre}
                    onChange={e => setTransporteNombre(e.target.value)}
                    placeholder="Nombre del transporte"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Patente Camión</Label>
                  <Input
                    value={patenteCamion}
                    onChange={e => setPatenteCamion(e.target.value)}
                    placeholder="AB 123 CD"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Chofer</Label>
                  <Input
                    value={choferNombre}
                    onChange={e => setChoferNombre(e.target.value)}
                    placeholder="Nombre del chofer"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">DNI Chofer</Label>
                  <Input
                    value={choferDni}
                    onChange={e => setChoferDni(e.target.value)}
                    placeholder="12345678"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">N° Remito</Label>
                  <Input
                    value={nroRemito}
                    onChange={e => setNroRemito(e.target.value)}
                    placeholder="Número de remito"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Observaciones</Label>
                  <Input
                    value={observaciones}
                    onChange={e => setObservaciones(e.target.value)}
                    placeholder="Observaciones..."
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Selección de cajas */}
              <div className="border rounded-lg p-4 bg-stone-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-stone-800">
                    Seleccionar Cajas ({cajasSeleccionadas.length} seleccionadas - {pesoTotalSeleccionado.toFixed(1)} kg)
                  </h3>
                  <div className="flex gap-2">
                    <Input
                      value={filtroProducto}
                      onChange={e => setFiltroProducto(e.target.value)}
                      placeholder="Filtrar producto..."
                      className="w-40 text-sm"
                    />
                    <Input
                      value={filtroTropa}
                      onChange={e => setFiltroTropa(e.target.value)}
                      placeholder="Filtrar tropa..."
                      className="w-32 text-sm"
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {Object.entries(cajasPorProducto).map(([producto, cajas]) => {
                    const seleccionadasProducto = cajas.filter(c => cajasSeleccionadas.includes(c.id)).length
                    return (
                      <div key={producto} className="border rounded bg-white">
                        <div
                          className="flex items-center justify-between p-2 cursor-pointer hover:bg-stone-50"
                          onClick={() => {
                            const el = document.getElementById(`prod-${producto.replace(/\s/g, '-')}`)
                            if (el) el.classList.toggle('hidden')
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <ChevronRight className="w-4 h-4 text-stone-400" />
                            <span className="font-medium text-sm">{producto}</span>
                            <Badge variant="outline" className="text-xs">{cajas.length} cajas</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {seleccionadasProducto > 0 && (
                              <Badge className="bg-amber-500 text-xs">{seleccionadasProducto} sel.</Badge>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                seleccionarPorProducto(producto)
                              }}
                            >
                              Seleccionar todas
                            </Button>
                          </div>
                        </div>
                        <div id={`prod-${producto.replace(/\s/g, '-')}`} className="hidden border-t p-2 space-y-1">
                          {cajas.map(c => (
                            <div
                              key={c.id}
                              className={`flex items-center justify-between p-2 rounded text-sm cursor-pointer transition-colors ${
                                cajasSeleccionadas.includes(c.id) ? 'bg-amber-50 border border-amber-300' : 'hover:bg-stone-50'
                              }`}
                              onClick={() => toggleCaja(c.id)}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={cajasSeleccionadas.includes(c.id)}
                                  onChange={() => toggleCaja(c.id)}
                                  className="accent-amber-500"
                                />
                                <span className="font-mono text-xs">{c.numero}</span>
                                <span className="text-stone-500">{c.tropaCodigo || '-'}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span>{c.pesoNeto.toFixed(2)} kg</span>
                                {c.fechaFaena && (
                                  <span className="text-stone-400">
                                    Faena: {new Date(c.fechaFaena).toLocaleDateString('es-AR')}
                                  </span>
                                )}
                                <Badge variant="outline" className="text-xs">{c.estado}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {cajasFiltradas.length === 0 && (
                  <p className="text-center text-stone-400 py-4">No hay cajas disponibles</p>
                )}
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button
                  className="bg-amber-500 hover:bg-amber-600"
                  onClick={crearOrden}
                  disabled={creando || !clienteId || cajasSeleccionadas.length === 0}
                >
                  {creando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
                  Crear Orden ({cajasSeleccionadas.length} cajas)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          {['', 'PENDIENTE', 'EN_PREPARACION', 'DESPACHADO', 'ANULADO'].map(estado => (
            <Button
              key={estado}
              size="sm"
              variant={filtroEstado === estado ? 'default' : 'outline'}
              className={filtroEstado === estado ? 'bg-amber-500' : ''}
              onClick={() => setFiltroEstado(estado)}
            >
              {estado || 'Todas'}
            </Button>
          ))}
        </div>

        {/* Lista de órdenes */}
        <div className="space-y-3">
          {ordenes.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="p-8 text-center text-stone-400">
                <Truck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay órdenes de expedición</p>
              </CardContent>
            </Card>
          ) : (
            ordenes.map(orden => (
              <Card key={orden.id} className="border-0 shadow-md">
                <CardContent className="p-0">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-stone-50"
                    onClick={() => setExpandida(expandida === orden.id ? null : orden.id)}
                  >
                    <div className="flex items-center gap-4">
                      {expandida === orden.id ? (
                        <ChevronDown className="w-5 h-5 text-stone-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-stone-400" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-800">#{orden.numero}</span>
                          {getEstadoBadge(orden.estado)}
                        </div>
                        <p className="text-sm text-stone-500 mt-1">
                          {orden.cliente.nombre} · {orden.cantidadCajas} cajas · {orden.pesoTotal.toFixed(1)} kg
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-stone-400">
                        {new Date(orden.fecha).toLocaleDateString('es-AR')}
                      </p>
                      {orden.transporteNombre && (
                        <Badge variant="outline" className="text-xs">{orden.transporteNombre}</Badge>
                      )}
                    </div>
                  </div>

                  {expandida === orden.id && (
                    <div className="border-t p-4 bg-stone-50 space-y-3">
                      {/* Datos del transporte */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-stone-400 text-xs">Transporte</p>
                          <p className="font-medium">{orden.transporteNombre || '-'}</p>
                        </div>
                        <div>
                          <p className="text-stone-400 text-xs">Patente</p>
                          <p className="font-medium">{orden.patenteCamion || '-'}</p>
                        </div>
                        <div>
                          <p className="text-stone-400 text-xs">Chofer</p>
                          <p className="font-medium">{orden.choferNombre || '-'}</p>
                        </div>
                        <div>
                          <p className="text-stone-400 text-xs">Remito</p>
                          <p className="font-medium">{orden.nroRemito || '-'}</p>
                        </div>
                      </div>

                      {/* Items */}
                      <div>
                        <h4 className="text-sm font-medium text-stone-600 mb-2">Cajas despachadas:</h4>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {orden.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded text-sm">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-amber-500" />
                                <span className="font-mono text-xs">{item.caja.numero}</span>
                                <span>{item.caja.productoDesposte?.nombre || 'Sin producto'}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-stone-500">
                                <span>{item.caja.pesoNeto.toFixed(2)} kg</span>
                                {item.caja.tropaCodigo && <span>Tropa: {item.caja.tropaCodigo}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-2 pt-2 border-t">
                        {orden.estado === 'PENDIENTE' && (
                          <Button
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600"
                            onClick={() => cambiarEstado(orden.id, 'EN_PREPARACION')}
                          >
                            <Package className="w-4 h-4 mr-1" />
                            En Preparación
                          </Button>
                        )}
                        {(orden.estado === 'PENDIENTE' || orden.estado === 'EN_PREPARACION') && (
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => cambiarEstado(orden.id, 'DESPACHADO')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Despachar
                          </Button>
                        )}
                        {orden.estado !== 'ANULADO' && orden.estado !== 'DESPACHADO' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => cambiarEstado(orden.id, 'ANULADO')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Anular
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
