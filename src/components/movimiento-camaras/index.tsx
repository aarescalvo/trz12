'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Warehouse, Package, Move, RefreshCw, Search,
  X, ArrowRight, Scale
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

interface MediaRes {
  id: string
  codigo: string
  lado: string
  peso: number
  sigla: string
  estado: string
  camaraId?: string
  romaneo?: {
    garron: number
    tropaCodigo?: string
    pesoVivo?: number | null
  }
}

interface Camara {
  id: string
  nombre: string
  tipo: string
  capacidad: number
  stockTotal: number
  pesoTotal: number
  disponible: number
  medias: {
    tropaCodigo?: string
    cantidad: number
    peso: number
  }[]
}

interface Operador {
  id: string
  nombre: string
  rol: string
  permisos?: Record<string, boolean>
}

export function MovimientoCamarasModule({ operador }: { operador: Operador }) {
  const { editMode, getTexto, setTexto, getBloque, updateBloque } = useEditor()
  const [camaras, setCamaras] = useState<Camara[]>([])
  const [loading, setLoading] = useState(true)
  
  // Cámara seleccionada
  const [camaraSeleccionada, setCamaraSeleccionada] = useState<Camara | null>(null)
  const [mediasEnCamara, setMediasEnCamara] = useState<MediaRes[]>([])
  const [loadingMedias, setLoadingMedias] = useState(false)
  
  // Medias seleccionadas para movimiento
  const [mediasSeleccionadas, setMediasSeleccionadas] = useState<MediaRes[]>([])
  
  // Dialogs
  const [moverOpen, setMoverOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Movimiento
  const [camaraDestinoId, setCamaraDestinoId] = useState('')
  const [observaciones, setObservaciones] = useState('')
  
  // Búsqueda
  const [busqueda, setBusqueda] = useState('')
  const [resultadosBusqueda, setResultadosBusqueda] = useState<MediaRes[]>([])

  // Fetch cámaras
  const fetchCamaras = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/camaras')
      const data = await res.json()
      if (data.success) {
        setCamaras(data.data)
      }
    } catch (error) {
      console.error('Error fetching cámaras:', error)
      toast.error('Error al cargar cámaras')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCamaras()
  }, [fetchCamaras])

  // Fetch medias de la cámara seleccionada
  const fetchMediasCamara = async (camaraId: string) => {
    setLoadingMedias(true)
    setMediasSeleccionadas([])
    try {
      const res = await fetch(`/api/stock-camaras?camaraId=${camaraId}`)
      const data = await res.json()
      if (data.success) {
        setMediasEnCamara(data.data.medias || [])
      } else {
        setMediasEnCamara([])
      }
    } catch (error) {
      console.error('Error fetching medias:', error)
      toast.error('Error al cargar medias')
      setMediasEnCamara([])
    } finally {
      setLoadingMedias(false)
    }
  }

  const handleSeleccionarCamara = (camara: Camara) => {
    if (camaraSeleccionada?.id === camara.id) {
      setCamaraSeleccionada(null)
      setMediasEnCamara([])
      setMediasSeleccionadas([])
    } else {
      setCamaraSeleccionada(camara)
      fetchMediasCamara(camara.id)
    }
  }

  // Toggle selección de media
  const toggleSeleccionMedia = (media: MediaRes) => {
    const isSelected = mediasSeleccionadas.some(m => m.id === media.id)
    if (isSelected) {
      setMediasSeleccionadas(prev => prev.filter(m => m.id !== media.id))
    } else {
      setMediasSeleccionadas(prev => [...prev, media])
    }
  }

  // Seleccionar todas las medias de una tropa
  const seleccionarTropa = (tropaCodigo: string) => {
    const mediasTropa = mediasEnCamara.filter(m => m.romaneo?.tropaCodigo === tropaCodigo)
    const todasSeleccionadas = mediasTropa.every(m => mediasSeleccionadas.some(s => s.id === m.id))
    
    if (todasSeleccionadas) {
      // Deseleccionar todas de esta tropa
      setMediasSeleccionadas(prev => prev.filter(m => m.romaneo?.tropaCodigo !== tropaCodigo))
    } else {
      // Seleccionar todas de esta tropa que no estén seleccionadas
      const nuevasSeleccionadas = [...mediasSeleccionadas]
      mediasTropa.forEach(m => {
        if (!nuevasSeleccionadas.some(s => s.id === m.id)) {
          nuevasSeleccionadas.push(m)
        }
      })
      setMediasSeleccionadas(nuevasSeleccionadas)
    }
  }

  // Abrir dialog de movimiento
  const handleAbrirMover = () => {
    if (mediasSeleccionadas.length === 0) {
      toast.error('Seleccione al menos una media para mover')
      return
    }
    setCamaraDestinoId('')
    setObservaciones('')
    setMoverOpen(true)
  }

  // Ejecutar movimiento
  const handleMoverMedias = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!camaraDestinoId) {
      toast.error('Seleccione la cámara destino')
      return
    }

    if (camaraDestinoId === camaraSeleccionada?.id) {
      toast.error('La cámara destino debe ser diferente a la de origen')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/movimiento-camaras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camaraOrigenId: camaraSeleccionada?.id,
          camaraDestinoId,
          mediaResIds: mediasSeleccionadas.map(m => m.id),
          observaciones,
          operadorId: operador.id
        })
      })

      const data = await res.json()
      
      if (data.success) {
        const camaraDestino = camaras.find(c => c.id === camaraDestinoId)
        toast.success(`✅ ${mediasSeleccionadas.length} media(s) movida(s) a ${camaraDestino?.nombre}`)
        setMoverOpen(false)
        setMediasSeleccionadas([])
        // Recargar datos
        await fetchCamaras()
        if (camaraSeleccionada) {
          await fetchMediasCamara(camaraSeleccionada.id)
        }
      } else {
        toast.error(data.error || 'Error al mover medias')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Búsqueda de medias
  const handleBuscar = async () => {
    if (!busqueda.trim()) return
    
    try {
      const res = await fetch(`/api/stock-camaras?busqueda=${encodeURIComponent(busqueda)}`)
      const data = await res.json()
      if (data.success) {
        setResultadosBusqueda(data.data.medias || [])
      }
    } catch {
      toast.error('Error en búsqueda')
    }
  }

  // Agrupar medias por tropa
  const mediasPorTropa = mediasEnCamara.reduce((acc, media) => {
    const tropa = media.romaneo?.tropaCodigo || 'Sin tropa'
    if (!acc[tropa]) {
      acc[tropa] = []
    }
    acc[tropa].push(media)
    return acc
  }, {} as Record<string, MediaRes[]>)

  // Totales
  const totalMedias = camaras.reduce((acc, c) => acc + c.stockTotal, 0)
  const totalPeso = camaras.reduce((acc, c) => acc + c.pesoTotal, 0)
  const camarasOcupadas = camaras.filter(c => c.stockTotal > 0).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-800">
                <TextoEditable id="movcam-titulo" original="Movimiento de Cámaras" tag="span" />
              </h1>
              <p className="text-stone-500">
                <TextoEditable id="movcam-subtitulo" original="Control de stock y movimientos de medias reses entre cámaras" tag="span" />
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => { fetchCamaras(); setCamaraSeleccionada(null); }}>
                <RefreshCw className="w-4 h-4 mr-2" />
                <TextoEditable id="movcam-btn-actualizar" original="Actualizar" tag="span" />
              </Button>
              <Badge variant="outline" className="text-lg px-4 py-2">
                <Package className="h-4 w-4 mr-2 text-purple-500" />
                {totalMedias} <TextoEditable id="movcam-label-medias" original="medias" tag="span" /> ({totalPeso.toFixed(0)} kg) en {camarasOcupadas} <TextoEditable id="movcam-label-camaras" original="cámaras" tag="span" />
              </Badge>
            </div>
          </div>
        </EditableBlock>

        {/* Búsqueda */}
        <EditableBlock bloqueId="busqueda" label="Búsqueda">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por código de barras, tropa o garrón..."
                    className="pl-10"
                    onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                  />
                </div>
                <Button onClick={handleBuscar}>
                  <Search className="w-4 h-4 mr-2" />
                  <TextoEditable id="movcam-btn-buscar" original="Buscar" tag="span" />
                </Button>
              </div>
              
              {resultadosBusqueda.length > 0 && (
                <div className="mt-4 p-3 bg-stone-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Resultados ({resultadosBusqueda.length})</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {resultadosBusqueda.map((media) => (
                      <div key={media.id} className="flex items-center justify-between bg-white p-2 rounded text-sm">
                        <div>
                          <span className="font-mono">{media.codigo}</span>
                          <span className="text-stone-400 ml-2">
                            {media.romaneo?.tropaCodigo} - G{media.romaneo?.garron}
                          </span>
                        </div>
                        <Badge variant="outline">{media.peso} kg</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </EditableBlock>

        {/* Layout principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Grid de cámaras */}
          <div className={camaraSeleccionada ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <EditableBlock bloqueId="gridCamaras" label="Stock de Cámaras">
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-stone-50 rounded-t-lg pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-purple-500" />
                    <TextoEditable id="movcam-titulo-stock" original="Stock de Cámaras" tag="span" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {loading ? (
                    <div className="py-12 text-center text-stone-400">
                      <TextoEditable id="movcam-msg-cargando" original="Cargando..." tag="span" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {camaras.map((camara) => {
                        const isSelected = camaraSeleccionada?.id === camara.id
                        const isEmpty = camara.stockTotal === 0
                        const ocupacion = camara.capacidad > 0 
                          ? Math.round((camara.stockTotal / camara.capacidad) * 100) 
                          : 0

                        return (
                          <div
                            key={camara.id}
                            onClick={() => handleSeleccionarCamara(camara)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-purple-500 bg-purple-50 shadow-md'
                                : isEmpty
                                  ? 'border-gray-100 bg-gray-50 opacity-50 hover:opacity-75'
                                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <span className="font-bold text-stone-800">{camara.nombre}</span>
                                <Badge variant="outline" className="ml-2 text-xs">{camara.tipo}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={isEmpty ? 'secondary' : 'default'} 
                                  className={isEmpty ? '' : 'bg-purple-600'}
                                >
                                  {camara.stockTotal} <TextoEditable id="movcam-label-med" original="med." tag="span" />
                                </Badge>
                              </div>
                            </div>
                            
                            {isEmpty ? (
                              <div className="text-center py-2 text-stone-400 text-sm">
                                <p><TextoEditable id="movcam-msg-sin-medias" original="Sin medias" tag="span" /></p>
                                <p className="text-xs"><TextoEditable id="movcam-label-cap" original="Capacidad" tag="span" />: {camara.capacidad} <TextoEditable id="movcam-label-ganchos" original="ganchos" tag="span" /></p>
                              </div>
                            ) : (
                              <>
                                {/* Peso total */}
                                <div className="mb-3 p-2 bg-white rounded text-center">
                                  <Scale className="w-4 h-4 inline mr-2 text-stone-400" />
                                  <span className="font-bold text-stone-700">{camara.pesoTotal.toFixed(1)} kg</span>
                                </div>
                                
                                {/* Lista de tropas en la cámara */}
                                <div className="space-y-1 mb-3 max-h-24 overflow-y-auto">
                                  {camara.medias.slice(0, 4).map((grupo, idx) => (
                                    <div 
                                      key={`${camara.id}-${grupo.tropaCodigo || idx}`}
                                      className="flex items-center justify-between bg-white rounded px-2 py-1 text-xs"
                                    >
                                      <span className="font-mono text-stone-600 truncate">
                                        {grupo.tropaCodigo || 'Sin tropa'}
                                      </span>
                                      <div className="flex gap-2">
                                        <Badge variant="outline" className="text-xs">{grupo.cantidad}</Badge>
                                        <span className="text-stone-400">{grupo.peso.toFixed(0)}kg</span>
                                      </div>
                                    </div>
                                  ))}
                                  {camara.medias.length > 4 && (
                                    <p className="text-xs text-stone-400 text-center">+{camara.medias.length - 4} más...</p>
                                  )}
                                </div>
                                
                                {/* Barra de ocupación */}
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                                  <div 
                                    className={`h-1.5 rounded-full ${
                                      ocupacion >= 90 ? 'bg-red-500' : 
                                      ocupacion >= 70 ? 'bg-amber-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(ocupacion, 100)}%` }}
                                  />
                                </div>
                                
                                <p className="text-xs text-stone-400 text-center">
                                  {camara.disponible} <TextoEditable id="movcam-label-disp" original="disponibles" tag="span" /> de {camara.capacidad}
                                </p>
                              </>
                            )}
                            
                            {isSelected && (
                              <div className="mt-3 pt-2 border-t border-purple-200 flex items-center justify-center text-purple-600 text-sm">
                                <ArrowRight className="w-4 h-4 mr-1" />
                                <TextoEditable id="movcam-msg-ver" original="Ver detalles" tag="span" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </EditableBlock>
          </div>

          {/* Panel de medias de la cámara seleccionada */}
          {camaraSeleccionada && (
            <div className="lg:col-span-1">
              <EditableBlock bloqueId="panelMedias" label="Detalle de Cámara">
                <Card className="border-0 shadow-md sticky top-4">
                  <CardHeader className="bg-purple-50 rounded-t-lg pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="w-5 h-5 text-purple-600" />
                        {camaraSeleccionada.nombre}
                      </CardTitle>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => { setCamaraSeleccionada(null); setMediasEnCamara([]); setMediasSeleccionadas([]); }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-stone-500">
                      {mediasEnCamara.length} <TextoEditable id="movcam-label-medias-en" original="medias en cámara" tag="span" />
                      {mediasSeleccionadas.length > 0 && (
                        <span className="ml-2 text-purple-600 font-medium">
                          ({mediasSeleccionadas.length} <TextoEditable id="movcam-label-selec" original="seleccionadas" tag="span" />)
                        </span>
                      )}
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loadingMedias ? (
                      <div className="py-8 text-center text-stone-400">
                        <TextoEditable id="movcam-msg-cargando-med" original="Cargando medias..." tag="span" />
                      </div>
                    ) : mediasEnCamara.length === 0 ? (
                      <div className="py-8 text-center text-stone-400">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p><TextoEditable id="movcam-msg-sin-medias-cam" original="Sin medias en esta cámara" tag="span" /></p>
                      </div>
                    ) : (
                      <div className="divide-y max-h-96 overflow-y-auto">
                        {Object.entries(mediasPorTropa).map(([tropaCodigo, medias]) => (
                          <div key={tropaCodigo} className="p-3">
                            {/* Header de tropa */}
                            <div 
                              className="flex items-center justify-between mb-2 cursor-pointer hover:bg-stone-50 p-1 rounded"
                              onClick={() => seleccionarTropa(tropaCodigo)}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={medias.every(m => mediasSeleccionadas.some(s => s.id === m.id))}
                                  onChange={() => seleccionarTropa(tropaCodigo)}
                                  className="w-4 h-4"
                                />
                                <span className="font-mono font-bold text-stone-800">{tropaCodigo}</span>
                              </div>
                              <Badge variant="outline">{medias.length} medias</Badge>
                            </div>
                            
                            {/* Lista de medias */}
                            <div className="space-y-1 pl-6">
                              {medias.map((media) => {
                                const isSelected = mediasSeleccionadas.some(m => m.id === media.id)
                                return (
                                  <div 
                                    key={media.id}
                                    onClick={(e) => { e.stopPropagation(); toggleSeleccionMedia(media); }}
                                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                                      isSelected ? 'bg-purple-100 border border-purple-300' : 'bg-stone-50 hover:bg-stone-100'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleSeleccionMedia(media)}
                                        className="w-3 h-3"
                                      />
                                      <div className="text-xs">
                                        <span className="font-mono">G{media.romaneo?.garron}</span>
                                        <span className="text-stone-400 ml-1">({media.lado?.charAt(0)})</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium">{media.peso} kg</span>
                                      <Badge variant="outline" className="text-xs">{media.sigla}</Badge>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Botón de mover */}
                    {mediasSeleccionadas.length > 0 && (
                      <div className="p-4 border-t bg-stone-50">
                        <Button 
                          onClick={handleAbrirMover}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          <Move className="w-4 h-4 mr-2" />
                          <TextoEditable id="movcam-btn-mover" original="Mover" tag="span" /> {mediasSeleccionadas.length} <TextoEditable id="movcam-label-medias2" original="medias" tag="span" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </EditableBlock>
            </div>
          )}
        </div>
      </div>

      {/* Dialog Mover Medias */}
      <Dialog open={moverOpen} onOpenChange={setMoverOpen}>
        <DialogContent className="max-w-md" maximizable>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Move className="w-5 h-5" />
              <TextoEditable id="movcam-dialog-titulo" original="Mover Medias Reses" tag="span" />
            </DialogTitle>
            <DialogDescription>
              {mediasSeleccionadas.length} <TextoEditable id="movcam-dialog-medias" original="medias seleccionadas" tag="span" /> ({mediasSeleccionadas.reduce((sum, m) => sum + m.peso, 0).toFixed(1)} kg)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMoverMedias}>
            <div className="space-y-4 py-4">
              <div className="bg-stone-50 p-3 rounded-lg grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-stone-500"><TextoEditable id="movcam-label-origen" original="Origen" tag="span" />:</span>
                  <p className="font-medium">{camaraSeleccionada?.nombre}</p>
                </div>
                <div>
                  <span className="text-stone-500"><TextoEditable id="movcam-label-peso" original="Peso total" tag="span" />:</span>
                  <p className="font-bold text-lg">{mediasSeleccionadas.reduce((sum, m) => sum + m.peso, 0).toFixed(1)} kg</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label><TextoEditable id="movcam-label-destino" original="Cámara Destino" tag="span" /> *</Label>
                <Select value={camaraDestinoId} onValueChange={setCamaraDestinoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cámara destino..." />
                  </SelectTrigger>
                  <SelectContent>
                    {camaras
                      .filter(c => c.id !== camaraSeleccionada?.id)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre} ({c.disponible} <TextoEditable id="movcam-label-disp2" original="disponibles" tag="span" />)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label><TextoEditable id="movcam-label-obs" original="Observaciones" tag="span" /></Label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Observaciones del movimiento..."
                  rows={2}
                />
              </div>

              {camaraDestinoId && (
                <div className="bg-purple-50 p-3 rounded-lg flex items-center gap-3">
                  <ArrowRight className="w-5 h-5 text-purple-600" />
                  <div className="text-sm">
                    <TextoEditable id="movcam-msg-moviendo" original="Moviendo" tag="span" /> <span className="font-medium">{mediasSeleccionadas.length}</span> <TextoEditable id="movcam-msg-medias-de" original="medias de" tag="span" />
                    <span className="font-medium"> {camaraSeleccionada?.nombre}</span> <TextoEditable id="movcam-msg-a" original="a" tag="span" /> 
                    <span className="font-medium"> {camaras.find(c => c.id === camaraDestinoId)?.nombre}</span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMoverOpen(false)}>
                <TextoEditable id="movcam-btn-cancelar" original="Cancelar" tag="span" />
              </Button>
              <Button 
                type="submit"
                disabled={saving || !camaraDestinoId} 
                className="bg-purple-600 hover:bg-purple-700"
              >
                {saving ? <TextoEditable id="movcam-msg-moviendo2" original="Moviendo..." tag="span" /> : <TextoEditable id="movcam-btn-mover-medias" original="Mover Medias" tag="span" />}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MovimientoCamarasModule
