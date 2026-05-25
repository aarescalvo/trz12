'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

import { toast } from 'sonner'
import { useBalanza } from '@/hooks/useBalanza'
import { useImpresora } from '@/hooks/useImpresora'
import { Scissors, Loader2, RefreshCw, Search, Package, AlertTriangle, CheckCircle2, BarChart3, Scale, Printer, TestTubes } from 'lucide-react'

interface Operador { id: string; nombre: string; rol: string }

interface C2TipoCuarto {
  id: string
  nombre: string
  codigo: string
  descripcion?: string | null
  orden: number
  activo: boolean
}

interface MediaRes {
  id: string
  codigo: string
  peso: number
  lado: string
  sigla: string
  estado: string
  romaneo?: { tropaCodigo: string; garron: number | null } | null
}

interface CuartoItem {
  id: string
  tipo: string
  peso: number
  codigo: string
  estado: string
  tipoCuarto?: { id: string; nombre: string; codigo: string } | null
  camara?: { id: string; nombre: string } | null
}

interface RegistroCuarteo {
  id: string
  fecha: string
  mediaResId: string | null
  tipoCorte: string
  pesoTotal: number
  pesoDelantero: number | null
  pesoTrasero: number | null
  camara: { id: string; nombre: string } | null
  operador: { id: string; nombre: string } | null
  observaciones: string | null
  cuartos?: CuartoItem[]
  datosPH?: DatosPH | null
}

interface Camara {
  id: string
  nombre: string
  tipo: string
  activo?: boolean
}

interface MedicionPHData {
  id: string
  valorPH: number
  clasificacion: string
  temperatura?: number | null
  numeroMedicion: number
  horaMedicion: string
  medidoPor?: string | null
}

interface DatosPH {
  mediciones: MedicionPHData[]
  clasificacion: string | null
  valorPH: number | null
}

export function CuarteoModule({ operador }: { operador: Operador }) {
  const balanza = useBalanza()
  const impresora = useImpresora()
  const [registros, setRegistros] = useState<RegistroCuarteo[]>([])
  const [tiposCuarto, setTiposCuarto] = useState<C2TipoCuarto[]>([])
  const [camaras, setCameras] = useState<Camara[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [codigoBusqueda, setCodigoBusqueda] = useState('')
  const [mediaResEncontrada, setMediaResEncontrada] = useState<MediaRes | null>(null)
  const [buscandoMR, setBuscandoMR] = useState(false)
  const [pesosCuartos, setPesosCuartos] = useState<Record<string, string>>({})
  const [camaraDestino, setCamaraDestino] = useState('')
  const [observaciones, setObservaciones] = useState('')

  // pH data for selected MediaRes
  const [medicionesPHActuales, setMedicionesPHActuales] = useState<DatosPH | null>(null)

  // Detalle dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [registroDetalle, setRegistroDetalle] = useState<RegistroCuarteo | null>(null)

  useEffect(() => {
    fetchDatos()
  }, [])

  const fetchDatos = async () => {
    setLoading(true)
    try {
      const [resReg, resTipos, resCamaras] = await Promise.all([
        fetch('/api/cuarteo?includeCuartos=true&limit=30'),
        fetch('/api/c2-tipos-cuarto'),
        fetch('/api/camaras')
      ])

      const dataReg = await resReg.json()
      const dataTipos = await resTipos.json()
      const dataCamaras = await resCamaras.json()

      if (dataReg.success) setRegistros(dataReg.data || [])
      if (dataTipos.success) setTiposCuarto((dataTipos.data || []).filter((t: C2TipoCuarto) => t.activo))
      if (dataCamaras.success) setCameras((dataCamaras.data || []).filter((c: Camara) => c.activo !== false))
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Buscar MediaRes por código
  const buscarMediaRes = async () => {
    if (!codigoBusqueda.trim()) {
      toast.error('Ingrese un código de Media Res')
      return
    }

    setBuscandoMR(true)
    try {
      const res = await fetch(`/api/stock/medias?codigo=${encodeURIComponent(codigoBusqueda.trim())}`)
      const data = await res.json()

      if (data.success && data.data && data.data.length > 0) {
        const mr = data.data[0]
        if (mr.estado !== 'EN_CAMARA') {
          toast.warning(`Media Res en estado ${mr.estado}, no disponible para cuarteo`)
          setBuscandoMR(false)
          return
        }
        setMediaResEncontrada(mr)
        setPesosCuartos({})
        setMedicionesPHActuales(null)
        toast.success(`Media Res encontrada: ${mr.peso} kg`)
        // Fetch pH measurements for this MediaRes
        fetchPHByMediaRes(mr.id)
      } else {
        // Fallback: buscar directamente por ID
        try {
          const res2 = await fetch(`/api/medias-res?search=${encodeURIComponent(codigoBusqueda.trim())}`)
          const data2 = await res2.json()
          if (data2.success && data2.data && data2.data.length > 0) {
            const mr = data2.data[0]
            setMediaResEncontrada(mr)
            setPesosCuartos({})
            setMedicionesPHActuales(null)
            toast.success(`Media Res encontrada: ${mr.peso} kg`)
            fetchPHByMediaRes(mr.id)
          } else {
            toast.error('Media Res no encontrada')
            setMediaResEncontrada(null)
            setMedicionesPHActuales(null)
          }
        } catch {
          toast.error('Media Res no encontrada')
          setMediaResEncontrada(null)
          setMedicionesPHActuales(null)
        }
      }
    } catch (error) {
      console.error('Error buscando MR:', error)
      toast.error('Error al buscar Media Res')
      setMediaResEncontrada(null)
    } finally {
      setBuscandoMR(false)
    }
  }

  // Fetch pH measurements for a MediaRes
  const fetchPHByMediaRes = async (mediaResId: string) => {
    try {
      const res = await fetch(`/api/calidad-ph?mediaResId=${mediaResId}`)
      const data = await res.json()
      if (data.success && data.data && data.data.length > 0) {
        const meds = data.data as MedicionPHData[]
        const primera = meds.find(m => m.numeroMedicion === 1)
        setMedicionesPHActuales({
          mediciones: meds.sort((a, b) => a.numeroMedicion - b.numeroMedicion),
          clasificacion: primera?.clasificacion || meds[0]?.clasificacion || null,
          valorPH: primera?.valorPH || meds[0]?.valorPH || null
        })
      } else {
        setMedicionesPHActuales(null)
      }
    } catch {
      setMedicionesPHActuales(null)
    }
  }

  // Color badge for pH classification
  const colorClasificacionPH = (clasif: string | null | undefined) => {
    if (!clasif) return 'bg-stone-100 text-stone-500 border-stone-300'
    switch (clasif) {
      case 'NORMAL': return 'bg-green-100 text-green-700 border-green-300'
      case 'INTERMEDIO': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'DFD': return 'bg-red-100 text-red-700 border-red-300'
      case 'ALTO': return 'bg-orange-100 text-orange-700 border-orange-300'
      default: return 'bg-stone-100 text-stone-500 border-stone-300'
    }
  }

  // Calcular peso total de los cuartos ingresados
  const pesoTotalCuartos = tiposCuarto.reduce((sum, tipo) => {
    const peso = parseFloat(pesosCuartos[tipo.id] || '0') || 0
    return sum + peso
  }, 0)

  // Merma de oreo
  const mermaKg = mediaResEncontrada ? mediaResEncontrada.peso - pesoTotalCuartos : 0
  const mermaPorcentaje = mediaResEncontrada && mediaResEncontrada.peso > 0
    ? ((mermaKg / mediaResEncontrada.peso) * 100)
    : 0

  // Registrar cuarteo
  const handleRegistrar = async () => {
    if (!mediaResEncontrada) {
      toast.error('Debe buscar una Media Res primero')
      return
    }

    const cuartosConPeso = tiposCuarto.filter(t => parseFloat(pesosCuartos[t.id] || '0') > 0)
    if (cuartosConPeso.length === 0) {
      toast.error('Debe ingresar al menos un peso de cuarto')
      return
    }

    setSaving(true)
    try {
      const payload = {
        mediaResId: mediaResEncontrada.id,
        pesoTotal: pesoTotalCuartos,
        pesoDelantero: tiposCuarto.find(t => t.codigo.toUpperCase().includes('DEL')) ? parseFloat(pesosCuartos[tiposCuarto.find(t => t.codigo.toUpperCase().includes('DEL'))!.id] || '0') || null : null,
        pesoTrasero: tiposCuarto.find(t => t.codigo.toUpperCase().includes('TRA')) ? parseFloat(pesosCuartos[tiposCuarto.find(t => t.codigo.toUpperCase().includes('TRA'))!.id] || '0') || null : null,
        camaraId: camaraDestino || null,
        operadorId: operador.id,
        observaciones: observaciones.trim() || null,
        cuartos: cuartosConPeso.map(t => ({
          tipoCuartoId: t.id,
          codigo: t.codigo,
          nombre: t.nombre,
          peso: parseFloat(pesosCuartos[t.id] || '0')
        }))
      }

      const res = await fetch('/api/cuarteo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Cuarteo registrado correctamente')
        // Print cuarto labels
        cuartosConPeso.forEach((tipo) => {
          impresora.imprimirRotulo({
            producto: tipo.nombre,
            peso: pesosCuartos[tipo.id] || '0',
            codigo: tipo.codigo,
            lote: mediaResEncontrada.codigo,
            fecha: new Date().toLocaleDateString('es-AR'),
          }, 'cuarto')
        })
        // Reset form
        setCodigoBusqueda('')
        setMediaResEncontrada(null)
        setPesosCuartos({})
        setMedicionesPHActuales(null)
        setCamaraDestino('')
        setObservaciones('')
        fetchDatos()
      } else {
        toast.error(data.error || 'Error al registrar cuarteo')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al registrar cuarteo')
    } finally {
      setSaving(false)
    }
  }

  // Ver detalle de un registro
  const handleVerDetalle = (registro: RegistroCuarteo) => {
    setRegistroDetalle(registro)
    setDialogOpen(true)
  }

  // Stats
  const stats = {
    totalRegistros: registros.length,
    pesoTotal: registros.reduce((acc, r) => acc + (r.pesoTotal || 0), 0),
    conCuartos: registros.filter(r => r.cuartos && r.cuartos.length > 0).length,
    mermaPromedio: registros.length > 0
      ? (registros.reduce((acc, r) => {
          if (r.cuartos && r.cuartos.length > 0 && r.pesoTotal > 0) {
            const pesoOriginal = r.pesoDelantero && r.pesoTrasero
              ? r.pesoDelantero + r.pesoTrasero : r.pesoTotal
            return acc + ((pesoOriginal - r.pesoTotal) / pesoOriginal * 100)
          }
          return acc
        }, 0) / registros.length).toFixed(1)
      : '0'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Scissors className="w-8 h-8 text-amber-500" />
              Cuarteo (C2)
            </h1>
            <p className="text-stone-500">Pesaje dinámico de cuartos por tipo configurado</p>
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
                  <Scissors className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Total Registros</p>
                  <p className="text-xl font-bold">{stats.totalRegistros}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Peso Total</p>
                  <p className="text-xl font-bold text-amber-600">{stats.pesoTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })} kg</p>
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
                  <p className="text-xs text-stone-500">Con Cuartos C2</p>
                  <p className="text-xl font-bold text-green-600">{stats.conCuartos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Merma Prom.</p>
                  <p className="text-xl font-bold text-blue-600">{stats.mermaPromedio}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulario de Cuarteo */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Scissors className="w-5 h-5 text-amber-500" />
              Registrar Cuarteo
            </CardTitle>
            <CardDescription>
              Escanee la Media Res y registre el peso de cada tipo de cuarto
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Búsqueda de Media Res */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Buscar Media Res</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <Input
                    className="pl-9"
                    placeholder="Escanear código o ingresar ID..."
                    value={codigoBusqueda}
                    onChange={(e) => setCodigoBusqueda(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && buscarMediaRes()}
                  />
                </div>
                <Button onClick={buscarMediaRes} disabled={buscandoMR} variant="outline">
                  {buscandoMR ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Buscar
                </Button>
              </div>
            </div>

            {/* Info Media Res encontrada */}
            {mediaResEncontrada && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-4">
                      <Badge className="bg-amber-500 text-white">{mediaResEncontrada.lado}</Badge>
                      <div>
                        <p className="font-medium text-stone-800">Código: {mediaResEncontrada.codigo}</p>
                        <p className="text-sm text-stone-500">
                          Peso: <span className="font-semibold text-amber-700">{mediaResEncontrada.peso} kg</span>
                          {mediaResEncontrada.romaneo?.tropaCodigo && (
                            <> · Tropa: {mediaResEncontrada.romaneo.tropaCodigo}</>
                          )}
                          {mediaResEncontrada.romaneo?.garron && (
                            <> · Garrón: {mediaResEncontrada.romaneo.garron}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {medicionesPHActuales?.clasificacion && (
                        <Badge variant="outline" className={`${colorClasificacionPH(medicionesPHActuales.clasificacion)} flex items-center gap-1`}>
                          <TestTubes className="w-3 h-3" />
                          pH {medicionesPHActuales.valorPH?.toFixed(1) || '-'} ({medicionesPHActuales.clasificacion})
                        </Badge>
                      )}
                      {medicionesPHActuales && medicionesPHActuales.mediciones.length > 1 && (
                        <span className="text-xs text-stone-400">
                          {medicionesPHActuales.mediciones.length} mediciones
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setMediaResEncontrada(null); setCodigoBusqueda(''); setPesosCuartos({}); setMedicionesPHActuales(null) }}>
                      Limpiar
                    </Button>
                  </div>
                  {/* Detalle de mediciones de pH */}
                  {medicionesPHActuales && medicionesPHActuales.mediciones.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-amber-200/50">
                      <div className="flex flex-wrap gap-2">
                        {medicionesPHActuales.mediciones.map((m) => (
                          <div key={m.id} className="flex items-center gap-1.5 text-xs bg-white/70 rounded-md px-2 py-1 border border-amber-100">
                            <span className="font-medium text-stone-500">#{m.numeroMedicion}</span>
                            <span className="font-semibold text-stone-800">{m.valorPH.toFixed(1)}</span>
                            <Badge variant="outline" className={`${colorClasificacionPH(m.clasificacion)} text-[10px] px-1 py-0`}>{m.clasificacion}</Badge>
                            {m.temperatura && <span className="text-stone-400">{m.temperatura}°C</span>}
                            <span className="text-stone-400">{m.horaMedicion}</span>
                            {m.medidoPor && <span className="text-stone-400">({m.medidoPor})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Pesaje dinámico por tipo de cuarto */}
            {mediaResEncontrada && tiposCuarto.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Label className="text-sm font-semibold">Pesaje por Tipo de Cuarto</Label>
                  {/* Balanza Integration */}
                  <div className="flex items-center gap-2">
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
                            if (captured) {
                              // Fill the first empty cuarto weight
                              const emptyTipo = tiposCuarto.find(t => !pesosCuartos[t.id] || parseFloat(pesosCuartos[t.id]) === 0)
                              if (emptyTipo) {
                                setPesosCuartos({ ...pesosCuartos, [emptyTipo.id]: captured.toFixed(1) })
                              }
                            }
                          }}
                        >
                          Capturar
                        </Button>
                      </>
                    )}
                    {balanza.error && <span className="text-xs text-red-500">{balanza.error}</span>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {tiposCuarto.sort((a, b) => a.orden - b.orden).map((tipo) => (
                    <Card key={tipo.id} className="border-stone-200">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Scissors className="w-4 h-4 text-amber-500" />
                              <span className="font-medium text-stone-800">{tipo.nombre}</span>
                            </div>
                            <Badge variant="outline" className="font-mono text-xs bg-stone-50">
                              {tipo.codigo}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <div className="relative flex-1">
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="0.0"
                                value={pesosCuartos[tipo.id] || ''}
                                onChange={(e) => setPesosCuartos({ ...pesosCuartos, [tipo.id]: e.target.value })}
                                className="text-right pr-8"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">kg</span>
                            </div>
                            {balanza.leyendo && (
                              <Button 
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9 px-2"
                                disabled={!balanza.estable || balanza.peso <= 0}
                                onClick={() => {
                                  const captured = balanza.capturarPeso()
                                  if (captured) setPesosCuartos({ ...pesosCuartos, [tipo.id]: captured.toFixed(1) })
                                }}
                              >
                                <Scale className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          {tipo.descripcion && (
                            <p className="text-xs text-stone-400">{tipo.descripcion}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Merma de oreo */}
                {pesoTotalCuartos > 0 && (
                  <Card className={`border-2 ${mermaPorcentaje > 5 ? 'border-red-300 bg-red-50' : mermaPorcentaje > 3 ? 'border-amber-300 bg-amber-50' : 'border-green-300 bg-green-50'}`}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          {mermaPorcentaje > 5 ? (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          ) : (
                            <BarChart3 className="w-5 h-5 text-green-500" />
                          )}
                          <div>
                            <p className="font-medium text-stone-800">
                              Merma de Oreo: {mermaKg.toFixed(1)} kg ({mermaPorcentaje.toFixed(1)}%)
                            </p>
                            <p className="text-xs text-stone-500">
                              MR: {mediaResEncontrada.peso} kg → Cuartos: {pesoTotalCuartos.toFixed(1)} kg
                            </p>
                          </div>
                        </div>
                        {mermaPorcentaje > 5 && (
                          <Badge className="bg-red-500 text-white">Merma alta</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Cámara destino y observaciones */}
            {mediaResEncontrada && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cámara Destino</Label>
                  <Select value={camaraDestino} onValueChange={setCamaraDestino}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cámara" />
                    </SelectTrigger>
                    <SelectContent>
                      {camaras.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Observaciones</Label>
                  <Input
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Observaciones..."
                  />
                </div>
              </div>
            )}

            {/* Botón registrar */}
            {mediaResEncontrada && (
              <div className="flex justify-end">
                <Button
                  onClick={handleRegistrar}
                  disabled={saving || pesoTotalCuartos <= 0}
                  className="bg-amber-500 hover:bg-amber-600 min-w-[200px]"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Scissors className="w-4 h-4 mr-2" />}
                  {saving ? 'Registrando...' : 'Registrar Cuarteo'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabla de Registros */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              Registros de Cuarteo ({registros.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                <p className="text-stone-400 mt-2">Cargando registros...</p>
              </div>
            ) : registros.length === 0 ? (
              <div className="p-12 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center">
                    <Scissors className="w-10 h-10 text-stone-300" />
                  </div>
                </div>
                <p className="text-lg font-medium text-stone-400 mb-1">No hay medias reses pendientes de cuarteo</p>
                <p className="text-sm text-stone-300 max-w-md mx-auto">Las medias reses aparecerán aquí una vez finalizado el romaneo</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50/50">
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo Corte</TableHead>
                      <TableHead>Peso Total</TableHead>
                      <TableHead>Cuartos</TableHead>
                      <TableHead>pH</TableHead>
                      <TableHead>Cámara</TableHead>
                      <TableHead>Operador</TableHead>
                      <TableHead className="text-center">Detalle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registros.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{new Date(r.fecha).toLocaleDateString('es-AR')}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-stone-50">
                            {r.tipoCorte === 'DELANTERO_TRASERO' ? 'Del./Tras.' : r.tipoCorte}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{r.pesoTotal?.toLocaleString('es-AR', { maximumFractionDigits: 1 })} kg</TableCell>
                        <TableCell>
                          {r.cuartos && r.cuartos.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {r.cuartos.map((c, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                                  {c.tipoCuarto?.nombre || c.tipo}: {c.peso ?? 0}kg
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-stone-300 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {r.datosPH?.clasificacion ? (
                            <Badge variant="outline" className={`${colorClasificacionPH(r.datosPH.clasificacion)} flex items-center gap-1 w-fit`}>
                              <TestTubes className="w-3 h-3" />
                              {r.datosPH.valorPH?.toFixed(1)}
                            </Badge>
                          ) : (
                            <span className="text-stone-300 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>{r.camara?.nombre || '-'}</TableCell>
                        <TableCell>{r.operador?.nombre || '-'}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleVerDetalle(r)}>
                              Ver
                            </Button>
                            {r.cuartos && r.cuartos.length > 0 && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-stone-500"
                                disabled={impresora.imprimiendo}
                                onClick={() => {
                                  r.cuartos!.forEach((c) => {
                                    impresora.imprimirRotulo({
                                      producto: c.tipoCuarto?.nombre || c.tipo,
                                      peso: (c.peso ?? 0).toString(),
                                      codigo: c.codigo,
                                      fecha: new Date(r.fecha).toLocaleDateString('es-AR'),
                                    }, 'cuarto')
                                  })
                                }}
                              >
                                <Printer className="w-4 h-4" />
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

        {/* Dialog Detalle */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg" maximizable>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-amber-500" />
                Detalle de Cuarteo
              </DialogTitle>
              <DialogDescription>
                {registroDetalle && new Date(registroDetalle.fecha).toLocaleString('es-AR')}
              </DialogDescription>
            </DialogHeader>
            {registroDetalle && (
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-stone-500">Peso Total:</span> <span className="font-semibold">{registroDetalle.pesoTotal} kg</span></div>
                  <div><span className="text-stone-500">Cámara:</span> {registroDetalle.camara?.nombre || '-'}</div>
                  <div><span className="text-stone-500">Operador:</span> {registroDetalle.operador?.nombre || '-'}</div>
                  <div><span className="text-stone-500">Tipo:</span> {registroDetalle.tipoCorte}</div>
                </div>
                {registroDetalle.cuartos && registroDetalle.cuartos.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold mb-2">Cuartos Generados:</p>
                    <div className="space-y-1">
                      {registroDetalle.cuartos.map((c, i) => (
                        <div key={i} className="flex items-center justify-between bg-stone-50 rounded-md px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Scissors className="w-3 h-3 text-amber-500" />
                            <span className="font-medium text-sm">{c.tipoCuarto?.nombre || c.tipo}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-stone-400">{c.codigo}</span>
                            <Badge variant="outline" className="bg-teal-50 text-teal-700">
                              {c.peso ?? 0} kg
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {registroDetalle.datosPH && registroDetalle.datosPH.mediciones.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <TestTubes className="w-4 h-4 text-stone-500" />
                      Mediciones de pH
                    </p>
                    <div className="space-y-1">
                      {registroDetalle.datosPH.mediciones.map((m, i) => (
                        <div key={i} className="flex items-center justify-between bg-stone-50 rounded-md px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-stone-500">#{m.numeroMedicion}</span>
                            <span className="font-semibold">{m.valorPH.toFixed(1)}</span>
                            <Badge variant="outline" className={`${colorClasificacionPH(m.clasificacion)} text-xs`}>
                              {m.clasificacion}
                            </Badge>
                            {m.temperatura && <span className="text-xs text-stone-400">{m.temperatura}°C</span>}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-stone-400">
                            <span>{m.horaMedicion}</span>
                            {m.medidoPor && <span>({m.medidoPor})</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {registroDetalle.observaciones && (
                  <div className="text-sm text-stone-500 mt-2">
                    <span className="font-semibold">Obs:</span> {registroDetalle.observaciones}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default CuarteoModule
