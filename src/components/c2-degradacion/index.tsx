'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  AlertTriangle, Plus, Package, Loader2, ChevronDown, ChevronRight,
  ArrowDownRight, Scissors, FileDown, FileSpreadsheet, RefreshCw
} from 'lucide-react'
import { ExcelExporter } from '@/lib/export-excel'
import { PDFExporter } from '@/lib/export-pdf'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface ProductoDesposte {
  id: string
  nombre: string
  codigo: string
}

interface Degradacion {
  id: string
  tipo: string
  pesoDegradado: number
  pesoAprovechamiento: number | null
  pesoDescarte: number | null
  motivo: string
  observaciones?: string
  fecha: string
  cajaOriginal: {
    id: string
    numero: string
    pesoNeto: number
    productoDesposte?: { nombre: string; codigo: string }
  }
  nuevoProducto?: { id: string; nombre: string; codigo: string }
  operador?: { id: string; nombre: string }
}

interface CajaDisponible {
  id: string
  numero: string
  pesoNeto: number
  estado: string
  productoDesposte?: { nombre: string; codigo: string }
}

export default function C2DegradacionModule({ operador }: { operador: Operador }) {
  const [degradaciones, setDegradaciones] = useState<Degradacion[]>([])
  const [cajasDisponibles, setCajasDisponibles] = useState<CajaDisponible[]>([])
  const [productos, setProductos] = useState<ProductoDesposte[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [expandida, setExpandida] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  // Form state
  const [cajaIdOriginal, setCajaIdOriginal] = useState('')
  const [tipo, setTipo] = useState('TRIMMING')
  const [pesoDegradado, setPesoDegradado] = useState('')
  const [pesoAprovechamiento, setPesoAprovechamiento] = useState('')
  const [pesoDescarte, setPesoDescarte] = useState('')
  const [nuevoProductoId, setNuevoProductoId] = useState('')
  const [motivo, setMotivo] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [creando, setCreando] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    cargarDegradaciones()
  }, [filtroTipo])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      await Promise.all([cargarDegradaciones(), cargarCajas(), cargarProductos()])
    } finally {
      setLoading(false)
    }
  }

  const cargarDegradaciones = async () => {
    try {
      const params = new URLSearchParams()
      if (filtroTipo) params.set('tipo', filtroTipo)
      params.set('limit', '100')
      const res = await fetch(`/api/c2-degradacion?${params}`)
      const data = await res.json()
      if (data.success) setDegradaciones(data.data || [])
    } catch (error) {
      console.error('Error cargando degradaciones:', error)
    }
  }

  const cargarCajas = async () => {
    try {
      const res = await fetch('/api/c2-produccion-cajas?limit=500')
      const data = await res.json()
      if (data.success) {
        setCajasDisponibles((data.data || []).filter((c: CajaDisponible) =>
          c.estado === 'ARMADA' || c.estado === 'EN_PALLETS' || c.estado === 'EN_CAMARA'
        ))
      }
    } catch (error) {
      console.error('Error cargando cajas:', error)
    }
  }

  const cargarProductos = async () => {
    try {
      const res = await fetch('/api/c2-productos-desposte?limit=200')
      const data = await res.json()
      if (data.success) setProductos(data.data || [])
    } catch (error) {
      console.error('Error cargando productos:', error)
    }
  }

  const crearDegradacion = async () => {
    if (!cajaIdOriginal) { toast.error('Seleccione una caja'); return }
    if (!pesoDegradado || parseFloat(pesoDegradado) <= 0) { toast.error('Ingrese peso degradado'); return }
    if (!motivo) { toast.error('Ingrese un motivo'); return }

    setCreando(true)
    try {
      const res = await fetch('/api/c2-degradacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cajaIdOriginal,
          tipo,
          pesoDegradado: parseFloat(pesoDegradado),
          pesoAprovechamiento: pesoAprovechamiento ? parseFloat(pesoAprovechamiento) : undefined,
          pesoDescarte: pesoDescarte ? parseFloat(pesoDescarte) : undefined,
          nuevoProductoId: nuevoProductoId || undefined,
          motivo,
          operadorId: operador.id,
          observaciones: observaciones || undefined
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        resetForm()
        cargarDatos()
      } else {
        toast.error(data.error || 'Error al registrar degradación')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setCreando(false)
    }
  }

  const resetForm = () => {
    setCajaIdOriginal('')
    setTipo('TRIMMING')
    setPesoDegradado('')
    setPesoAprovechamiento('')
    setPesoDescarte('')
    setNuevoProductoId('')
    setMotivo('')
    setObservaciones('')
    setMostrarForm(false)
  }

  const exportarExcel = () => {
    const dateStr = new Date().toISOString().split('T')[0]
    if (degradaciones.length === 0) return

    const data = degradaciones.map(d => ({
      Fecha: new Date(d.fecha).toLocaleDateString('es-AR'),
      'Caja Nro': d.cajaOriginal.numero,
      Producto: d.cajaOriginal.productoDesposte?.nombre || '-',
      Tipo: d.tipo,
      'Peso Degradado (kg)': d.pesoDegradado.toFixed(2),
      'Peso Aprovechado (kg)': d.pesoAprovechamiento?.toFixed(2) || '0.00',
      'Peso Descarte (kg)': d.pesoDescarte?.toFixed(2) || '0.00',
      'Nuevo Producto': d.nuevoProducto?.nombre || 'Sin reasignar',
      Motivo: d.motivo,
      Observaciones: d.observaciones || '',
      Operador: d.operador?.nombre || '-'
    }))
    ExcelExporter.exportFromObjects(data, `degradacion_c2_${dateStr}`, 'Degradaciones')
    setExportOpen(false)
  }

  const exportarPDF = () => {
    const dateStr = new Date().toISOString().split('T')[0]
    const headers = ['Fecha', 'Caja', 'Producto', 'Tipo', 'Degradado (kg)', 'Aprovechado (kg)', 'Descarte (kg)', 'Motivo']
    const rows = degradaciones.map(d => [
      new Date(d.fecha).toLocaleDateString('es-AR'),
      d.cajaOriginal.numero,
      d.cajaOriginal.productoDesposte?.nombre || '-',
      d.tipo,
      d.pesoDegradado.toFixed(2),
      d.pesoAprovechamiento?.toFixed(2) || '0.00',
      d.pesoDescarte?.toFixed(2) || '0.00',
      d.motivo
    ])
    const doc = PDFExporter.generateReport({ title: 'Reporte de Degradaciones C2', subtitle: `Total: ${degradaciones.length} registros - ${totalPesoDegradado.toFixed(1)} kg degradado`, headers, data: rows, orientation: 'landscape' })
    PDFExporter.downloadPDF(doc, `degradacion_c2_${dateStr}.pdf`)
    setExportOpen(false)
  }

  const getTipoBadge = (t: string) => {
    const config: Record<string, { color: string; label: string }> = {
      TRIMMING: { color: 'bg-amber-100 text-amber-800', label: 'Trimming' },
      DECOMISO: { color: 'bg-red-100 text-red-800', label: 'Decomiso' },
      APROVECHAMIENTO: { color: 'bg-green-100 text-green-800', label: 'Aprovechamiento' }
    }
    const c = config[t] || { color: 'bg-stone-100 text-stone-800', label: t }
    return <Badge className={`${c.color} text-xs`}>{c.label}</Badge>
  }

  // Stats
  const totalPesoDegradado = degradaciones.reduce((s, d) => s + d.pesoDegradado, 0)
  const totalAprovechado = degradaciones.reduce((s, d) => s + (d.pesoAprovechamiento || 0), 0)
  const totalDescarte = degradaciones.reduce((s, d) => s + (d.pesoDescarte || 0), 0)

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
              <AlertTriangle className="w-8 h-8 text-red-500" />
              Degradación C2
            </h1>
            <p className="text-stone-500 mt-1">Registro de trimming, decomisos y aprovechamientos de cajas</p>
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
              className="bg-red-500 hover:bg-red-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar Degradación
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-xs text-stone-500">Total Degradado</p>
                  <p className="text-xl font-bold text-red-700">{totalPesoDegradado.toFixed(1)} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-xs text-stone-500">Aprovechado</p>
                  <p className="text-xl font-bold text-green-700">{totalAprovechado.toFixed(1)} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-stone-500" />
                <div>
                  <p className="text-xs text-stone-500">Descarte</p>
                  <p className="text-xl font-bold text-stone-700">{totalDescarte.toFixed(1)} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-xs text-stone-500">Registros</p>
                  <p className="text-xl font-bold text-purple-700">{degradaciones.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulario */}
        {mostrarForm && (
          <Card className="border-0 shadow-md mb-6">
            <CardHeader className="bg-red-50 rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Registrar Degradación de Caja
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Caja Original *</Label>
                  <select
                    className="w-full mt-1 p-2 border rounded-md bg-white text-sm"
                    value={cajaIdOriginal}
                    onChange={e => setCajaIdOriginal(e.target.value)}
                  >
                    <option value="">Seleccionar caja...</option>
                    {cajasDisponibles.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.numero} - {c.productoDesposte?.nombre || 'Sin producto'} ({c.pesoNeto.toFixed(2)} kg)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tipo de Degradación *</Label>
                  <div className="flex gap-2 mt-1">
                    {['TRIMMING', 'DECOMISO', 'APROVECHAMIENTO'].map(t => (
                      <Button
                        key={t}
                        size="sm"
                        variant={tipo === t ? 'default' : 'outline'}
                        className={tipo === t ? 'bg-red-500' : ''}
                        onClick={() => setTipo(t)}
                      >
                        {t === 'TRIMMING' ? 'Trimming' : t === 'DECOMISO' ? 'Decomiso' : 'Aprovechamiento'}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Peso Degradado (kg) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pesoDegradado}
                    onChange={e => setPesoDegradado(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Peso Aprovechamiento (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pesoAprovechamiento}
                    onChange={e => setPesoAprovechamiento(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Peso Descarte (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pesoDescarte}
                    onChange={e => setPesoDescarte(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Reasignar a Producto</Label>
                  <select
                    className="w-full mt-1 p-2 border rounded-md bg-white text-sm"
                    value={nuevoProductoId}
                    onChange={e => setNuevoProductoId(e.target.value)}
                  >
                    <option value="">Sin reasignar...</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} ({p.codigo})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Motivo *</Label>
                  <Input
                    value={motivo}
                    onChange={e => setMotivo(e.target.value)}
                    placeholder="Ej: Golpeado, Contaminación, Vencimiento..."
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Observaciones</Label>
                <Input
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  placeholder="Observaciones adicionales..."
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button
                  className="bg-red-500 hover:bg-red-600"
                  onClick={crearDegradacion}
                  disabled={creando || !cajaIdOriginal || !pesoDegradado || !motivo}
                >
                  {creando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                  Registrar Degradación
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          {['', 'TRIMMING', 'DECOMISO', 'APROVECHAMIENTO'].map(t => (
            <Button
              key={t}
              size="sm"
              variant={filtroTipo === t ? 'default' : 'outline'}
              className={filtroTipo === t ? 'bg-red-500' : ''}
              onClick={() => setFiltroTipo(t)}
            >
              {t || 'Todos'}
            </Button>
          ))}
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {degradaciones.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="p-8 text-center text-stone-400">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay registros de degradación</p>
              </CardContent>
            </Card>
          ) : (
            degradaciones.map(d => (
              <Card key={d.id} className="border-0 shadow-md">
                <CardContent className="p-0">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-stone-50"
                    onClick={() => setExpandida(expandida === d.id ? null : d.id)}
                  >
                    <div className="flex items-center gap-4">
                      {expandida === d.id ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronRight className="w-4 h-4 text-stone-400" />}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{d.cajaOriginal.numero}</span>
                          {getTipoBadge(d.tipo)}
                          <span className="text-sm text-stone-600">{d.cajaOriginal.productoDesposte?.nombre || '-'}</span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1">
                          {d.motivo} · {d.pesoDegradado.toFixed(2)} kg degradado
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-stone-400">
                        {new Date(d.fecha).toLocaleDateString('es-AR')}
                      </p>
                      {d.operador && <p className="text-xs text-stone-400">{d.operador.nombre}</p>}
                    </div>
                  </div>

                  {expandida === d.id && (
                    <div className="border-t p-4 bg-stone-50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-stone-400 text-xs">Peso Degradado</p>
                          <p className="font-medium text-red-600">{d.pesoDegradado.toFixed(2)} kg</p>
                        </div>
                        <div>
                          <p className="text-stone-400 text-xs">Aprovechado</p>
                          <p className="font-medium text-green-600">{d.pesoAprovechamiento?.toFixed(2) || '0.00'} kg</p>
                        </div>
                        <div>
                          <p className="text-stone-400 text-xs">Descarte</p>
                          <p className="font-medium text-stone-600">{d.pesoDescarte?.toFixed(2) || '0.00'} kg</p>
                        </div>
                        <div>
                          <p className="text-stone-400 text-xs">Reasignado a</p>
                          <p className="font-medium">{d.nuevoProducto?.nombre || 'Sin reasignar'}</p>
                        </div>
                      </div>
                      {d.observaciones && (
                        <p className="mt-2 text-sm text-stone-500">Obs: {d.observaciones}</p>
                      )}
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
