'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Package, Plus, Trash2, ChevronDown, ChevronRight,
  Loader2, Warehouse, CheckCircle, AlertTriangle
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface CajaDisponible {
  id: string
  numero: string
  pesoNeto: number
  pesoBruto: number
  tropaCodigo?: string
  estado: string
  productoDesposte?: { id: string; nombre: string; codigo: string; rubro?: { nombre: string } }
}

interface Pallet {
  id: string
  numero: string
  ssccCode?: string
  estado: string
  esMixto: boolean
  pesoTotal: number
  cantidadCajas: number
  observaciones?: string
  createdAt: string
  camara?: { id: string; nombre: string }
  operador?: { id: string; nombre: string }
  cajas: {
    id: string
    numero: string
    pesoNeto: number
    productoDesposte?: { id: string; nombre: string; codigo: string; rubro?: { nombre: string } }
    producto?: { nombre: string }
  }[]
}

export default function C2PalletsModule({ operador }: { operador: Operador }) {
  const [pallets, setPallets] = useState<Pallet[]>([])
  const [cajasDisponibles, setCajasDisponibles] = useState<CajaDisponible[]>([])
  const [camaras, setCamara] = useState<{ id: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [expandido, setExpandido] = useState<string | null>(null)

  // Form state
  const [cajasSeleccionadas, setCajasSeleccionadas] = useState<string[]>([])
  const [esMixto, setEsMixto] = useState(false)
  const [camaraId, setCamaraId] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [creando, setCreando] = useState(false)
  const [filtroProducto, setFiltroProducto] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    cargarPallets()
  }, [filtroEstado])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      await Promise.all([cargarPallets(), cargarCajasDisponibles(), cargarCamara()])
    } finally {
      setLoading(false)
    }
  }

  const cargarPallets = async () => {
    try {
      const params = new URLSearchParams()
      if (filtroEstado) params.set('estado', filtroEstado)
      const res = await fetch(`/api/c2-pallets?${params}`)
      const data = await res.json()
      if (data.success) setPallets(data.data)
    } catch (error) {
      console.error('Error cargando pallets:', error)
    }
  }

  const cargarCajasDisponibles = async () => {
    try {
      const res = await fetch('/api/c2-produccion-cajas?limit=500')
      const data = await res.json()
      if (data.success) {
        const disponibles = (data.data || []).filter(
          (c: CajaDisponible) => c.estado === 'ARMADA'
        )
        setCajasDisponibles(disponibles)
      }
    } catch (error) {
      console.error('Error cargando cajas:', error)
    }
  }

  const cargarCamara = async () => {
    try {
      const res = await fetch('/api/camaras?limit=50')
      const data = await res.json()
      if (data.success) setCamara(data.data || [])
    } catch (error) {
      console.error('Error cargando cámaras:', error)
    }
  }

  const toggleCaja = (cajaId: string) => {
    if (cajasSeleccionadas.includes(cajaId)) {
      setCajasSeleccionadas(cajasSeleccionadas.filter(id => id !== cajaId))
    } else {
      setCajasSeleccionadas([...cajasSeleccionadas, cajaId])
    }
  }

  const crearPallet = async () => {
    if (cajasSeleccionadas.length === 0) {
      toast.error('Seleccione al menos una caja')
      return
    }

    setCreando(true)
    try {
      const res = await fetch('/api/c2-pallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cajaIds: cajasSeleccionadas,
          esMixto,
          camaraId: camaraId || undefined,
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
        toast.error(data.error || 'Error al crear pallet')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setCreando(false)
    }
  }

  const moverACamara = async (palletId: string, newCamaraId: string) => {
    try {
      const res = await fetch('/api/c2-pallets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: palletId, camaraId: newCamaraId, estado: 'EN_CAMARA' })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Pallet movido a cámara')
        cargarPallets()
      } else {
        toast.error(data.error || 'Error al mover pallet')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }

  const eliminarPallet = async (id: string) => {
    if (!confirm('¿Eliminar este pallet? Las cajas volverán a estado ARMADA.')) return
    try {
      const res = await fetch(`/api/c2-pallets?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        cargarDatos()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }

  const resetForm = () => {
    setCajasSeleccionadas([])
    setEsMixto(false)
    setCamaraId('')
    setObservaciones('')
    setMostrarForm(false)
  }

  const getEstadoBadge = (estado: string) => {
    const config: Record<string, { color: string; icon: typeof Package }> = {
      ARMADO: { color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Package },
      EN_CAMARA: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Warehouse },
      DESPACHADO: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle }
    }
    const c = config[estado] || config.ARMADO
    return (
      <Badge variant="outline" className={`${c.color} text-xs`}>
        <c.icon className="w-3 h-3 mr-1" />
        {estado.replace('_', ' ')}
      </Badge>
    )
  }

  // Filtrar cajas disponibles
  const cajasFiltradas = cajasDisponibles.filter(c => {
    if (!filtroProducto) return true
    return c.productoDesposte?.nombre?.toLowerCase().includes(filtroProducto.toLowerCase())
  })

  // Agrupar por producto
  const cajasPorProducto = cajasFiltradas.reduce((acc, c) => {
    const key = c.productoDesposte?.nombre || 'Sin producto'
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {} as Record<string, CajaDisponible[]>)

  const pesoTotalSeleccionado = cajasDisponibles
    .filter(c => cajasSeleccionadas.includes(c.id))
    .reduce((sum, c) => sum + c.pesoBruto, 0)

  // Stats
  const armados = pallets.filter(p => p.estado === 'ARMADO').length
  const enCamara = pallets.filter(p => p.estado === 'EN_CAMARA').length
  const despachados = pallets.filter(p => p.estado === 'DESPACHADO').length

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
              <Package className="w-8 h-8 text-amber-500" />
              Pallets C2
            </h1>
            <p className="text-stone-500 mt-1">Agrupación de cajas en pallets con código SSCC</p>
          </div>
          <Button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Pallet
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-xs text-stone-500">Armados</p>
                  <p className="text-xl font-bold text-amber-700">{armados}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-stone-500">En Cámara</p>
                  <p className="text-xl font-bold text-blue-700">{enCamara}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-xs text-stone-500">Despachados</p>
                  <p className="text-xl font-bold text-green-700">{despachados}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulario nuevo pallet */}
        {mostrarForm && (
          <Card className="border-0 shadow-md mb-6">
            <CardHeader className="bg-amber-50 rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                Nuevo Pallet
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Cámara (opcional)</Label>
                  <select
                    className="w-full mt-1 p-2 border rounded-md bg-white text-sm"
                    value={camaraId}
                    onChange={e => setCamaraId(e.target.value)}
                  >
                    <option value="">Sin cámara...</option>
                    {camaras.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={esMixto}
                      onChange={e => setEsMixto(e.target.checked)}
                      className="accent-amber-500 w-4 h-4"
                    />
                    <span className="text-sm font-medium">Pallet Mixto</span>
                  </label>
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
                  <Input
                    value={filtroProducto}
                    onChange={e => setFiltroProducto(e.target.value)}
                    placeholder="Filtrar producto..."
                    className="w-40 text-sm"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {Object.entries(cajasPorProducto).map(([producto, cajas]) => (
                    <div key={producto} className="border rounded bg-white">
                      <div className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{producto}</span>
                          <Badge variant="outline" className="text-xs">{cajas.length}</Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          onClick={() => {
                            const ids = cajas.map(c => c.id).filter(id => !cajasSeleccionadas.includes(id))
                            setCajasSeleccionadas(prev => [...prev, ...ids])
                          }}
                        >
                          Seleccionar todas
                        </Button>
                      </div>
                      <div className="border-t p-2 space-y-1 max-h-32 overflow-y-auto">
                        {cajas.map(c => (
                          <div
                            key={c.id}
                            className={`flex items-center justify-between p-1.5 rounded text-sm cursor-pointer transition-colors ${
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
                              <span className="text-stone-500 text-xs">{c.tropaCodigo || ''}</span>
                            </div>
                            <span className="text-xs">{c.pesoNeto.toFixed(2)} kg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {!esMixto && cajasSeleccionadas.length > 0 && (() => {
                  const productosUnicos = new Set(
                    cajasDisponibles.filter(c => cajasSeleccionadas.includes(c.id)).map(c => c.productoDesposte?.id).filter(Boolean)
                  )
                  if (productosUnicos.size > 1) {
                    return (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-amber-50 border border-amber-300 rounded text-sm text-amber-800">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Múltiples productos seleccionados. Active &quot;Pallet Mixto&quot; para continuar.</span>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button
                  className="bg-amber-500 hover:bg-amber-600"
                  onClick={crearPallet}
                  disabled={creando || cajasSeleccionadas.length === 0}
                >
                  {creando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Package className="w-4 h-4 mr-2" />}
                  Crear Pallet ({cajasSeleccionadas.length} cajas)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          {['', 'ARMADO', 'EN_CAMARA', 'DESPACHADO'].map(estado => (
            <Button
              key={estado}
              size="sm"
              variant={filtroEstado === estado ? 'default' : 'outline'}
              className={filtroEstado === estado ? 'bg-amber-500' : ''}
              onClick={() => setFiltroEstado(estado)}
            >
              {estado || 'Todos'}
            </Button>
          ))}
        </div>

        {/* Lista de pallets */}
        <div className="space-y-3">
          {pallets.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="p-8 text-center text-stone-400">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay pallets</p>
              </CardContent>
            </Card>
          ) : (
            pallets.map(pallet => (
              <Card key={pallet.id} className="border-0 shadow-md">
                <CardContent className="p-0">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-stone-50"
                    onClick={() => setExpandido(expandido === pallet.id ? null : pallet.id)}
                  >
                    <div className="flex items-center gap-4">
                      {expandido === pallet.id ? (
                        <ChevronDown className="w-5 h-5 text-stone-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-stone-400" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-800">{pallet.numero}</span>
                          {getEstadoBadge(pallet.estado)}
                          {pallet.esMixto && <Badge className="bg-purple-500 text-xs">Mixto</Badge>}
                        </div>
                        <p className="text-sm text-stone-500 mt-1">
                          {pallet.cantidadCajas} cajas · {pallet.pesoTotal.toFixed(1)} kg
                          {pallet.camara && ` · ${pallet.camara.nombre}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {pallet.ssccCode && (
                        <Badge variant="outline" className="text-xs font-mono">{pallet.ssccCode.slice(-8)}</Badge>
                      )}
                    </div>
                  </div>

                  {expandido === pallet.id && (
                    <div className="border-t p-4 bg-stone-50 space-y-3">
                      {/* SSCC */}
                      {pallet.ssccCode && (
                        <div className="text-sm">
                          <span className="text-stone-400">SSCC: </span>
                          <span className="font-mono">{pallet.ssccCode}</span>
                        </div>
                      )}

                      {/* Cajas */}
                      <div>
                        <h4 className="text-sm font-medium text-stone-600 mb-2">Cajas en pallet:</h4>
                        <div className="space-y-1">
                          {pallet.cajas.map(caja => (
                            <div key={caja.id} className="flex items-center justify-between p-2 bg-white rounded text-sm">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-amber-500" />
                                <span className="font-mono text-xs">{caja.numero}</span>
                                <span>{caja.productoDesposte?.nombre || caja.producto?.nombre || 'Sin producto'}</span>
                              </div>
                              <span className="text-xs text-stone-500">{caja.pesoNeto.toFixed(2)} kg</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-2 pt-2 border-t">
                        {pallet.estado === 'ARMADO' && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-stone-500">Mover a cámara:</span>
                            <select
                              className="p-1.5 border rounded-md bg-white text-sm"
                              onChange={e => {
                                if (e.target.value) moverACamara(pallet.id, e.target.value)
                              }}
                              defaultValue=""
                            >
                              <option value="">Seleccionar...</option>
                              {camaras.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {pallet.estado !== 'DESPACHADO' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => eliminarPallet(pallet.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Eliminar
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
