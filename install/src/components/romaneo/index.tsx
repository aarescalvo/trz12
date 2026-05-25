'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Scale, Printer, RefreshCw, User, Warehouse, ChevronUp, ChevronDown,
  CheckCircle, AlertTriangle, RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

const DIENTES = ['0', '2', '4', '6', '8']
const SIGLAS = ['A', 'T', 'D']

interface Tipificador {
  id: string
  nombre: string
  apellido: string
  matricula: string
}

interface Camara {
  id: string
  nombre: string
  capacidad: number
}

interface MediaPesada {
  id: string
  garron: number
  lado: string
  peso: number
  siglas: string[]
  fecha: Date
  tropaCodigo: string | null
  tipoAnimal: string | null
}

interface AsignacionGarron {
  garron: number
  animalId: string | null
  animalCodigo: string | null
  tropaCodigo: string | null
  tipoAnimal: string | null
  pesoVivo: number | null
  tieneMediaDer: boolean
  tieneMediaIzq: boolean
}

interface Operador {
  id: string
  nombre: string
  nivel: string
}

export function RomaneoModule({ operador }: { operador: Operador }) {
  // Configuración del turno
  const [tipificadorId, setTipificadorId] = useState('')
  const [camaraId, setCamaraId] = useState('')
  const [configOpen, setConfigOpen] = useState(false)
  
  // Estado del pesaje
  const [garronActual, setGarronActual] = useState(1)
  const [ladoActual, setLadoActual] = useState<'DERECHA' | 'IZQUIERDA'>('DERECHA')
  const [pesoBalanza, setPesoBalanza] = useState('')
  const [denticion, setDenticion] = useState('')
  const [asignacionActual, setAsignacionActual] = useState<AsignacionGarron | null>(null)
  
  // Historial
  const [mediasPesadas, setMediasPesadas] = useState<MediaPesada[]>([])
  
  // Último rótulo para reimprimir
  const [ultimoRotulo, setUltimoRotulo] = useState<MediaPesada | null>(null)
  
  // Datos maestros
  const [tipificadores, setTipificadores] = useState<Tipificador[]>([])
  const [camaras, setCamaras] = useState<Camara[]>([])
  const [garronesAsignados, setGarronesAsignados] = useState<AsignacionGarron[]>([])
  
  // UI
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tipRes, camRes, garronesRes] = await Promise.all([
        fetch('/api/tipificadores'),
        fetch('/api/camaras'),
        fetch('/api/garrones-asignados')
      ])
      
      const tipData = await tipRes.json()
      const camData = await camRes.json()
      const garronesData = await garronesRes.json()
      
      if (tipData.success) {
        setTipificadores(tipData.data || [])
        if (tipData.data?.length > 0) {
          setTipificadorId(tipData.data[0].id)
        }
      }
      
      if (camData.success) {
        const camarasFaena = (camData.data || []).filter((c: Camara) => c.tipo === 'FAENA')
        setCamaras(camarasFaena)
        if (camarasFaena.length > 0) {
          setCamaraId(camarasFaena[0].id)
        }
      }
      
      if (garronesData.success) {
        setGarronesAsignados(garronesData.data || [])
        
        // Encontrar el primer garrón pendiente
        const pendientes = (garronesData.data || []).filter((g: AsignacionGarron) => 
          !g.tieneMediaDer || !g.tieneMediaIzq
        )
        
        if (pendientes.length > 0) {
          const primero = pendientes[0]
          setGarronActual(primero.garron)
          setAsignacionActual(primero)
          setLadoActual(primero.tieneMediaDer ? 'IZQUIERDA' : 'DERECHA')
        } else if (garronesData.data?.length > 0) {
          const ultimo = garronesData.data[garronesData.data.length - 1]
          setGarronActual(ultimo.garron + 1)
          setAsignacionActual(null)
          setLadoActual('DERECHA')
        }
      }
      
      // Si no hay configuración, mostrar diálogo
      if (!tipificadorId || !camaraId) {
        setConfigOpen(true)
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleCapturarPeso = useCallback(() => {
    // Simular captura de balanza (en producción conectaría por RS232)
    const peso = pesoBalanza || (Math.random() * 50 + 100).toFixed(1)
    setPesoBalanza(peso)
  }, [pesoBalanza])

  const handleAceptarPeso = async () => {
    if (!pesoBalanza || parseFloat(pesoBalanza) <= 0) {
      toast.error('Ingrese un peso válido')
      return
    }
    
    if (!tipificadorId || !camaraId) {
      setConfigOpen(true)
      toast.error('Configure tipificador y cámara primero')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/romaneo/pesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garron: garronActual,
          lado: ladoActual,
          peso: parseFloat(pesoBalanza),
          siglas: SIGLAS,
          denticion: denticion,
          tipificadorId,
          camaraId,
          operadorId: operador.id
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        // Imprimir los 3 rótulos
        handleImprimirRotulos(garronActual, ladoActual, parseFloat(pesoBalanza))
        
        // Agregar al historial
        const nuevaMedia: MediaPesada = {
          id: data.data.id,
          garron: garronActual,
          lado: ladoActual,
          peso: parseFloat(pesoBalanza),
          siglas: SIGLAS,
          fecha: new Date(),
          tropaCodigo: asignacionActual?.tropaCodigo || null,
          tipoAnimal: asignacionActual?.tipoAnimal || null
        }
        setMediasPesadas(prev => [...prev, nuevaMedia])
        setUltimoRotulo(nuevaMedia)
        
        toast.success(`Media ${ladoActual === 'DERECHA' ? 'derecha' : 'izquierda'} registrada - 3 rótulos impresos`)
        
        // Limpiar peso
        setPesoBalanza('')
        
        // Actualizar estado del garrón actual
        if (asignacionActual) {
          const actualizado = { ...asignacionActual }
          if (ladoActual === 'DERECHA') {
            actualizado.tieneMediaDer = true
          } else {
            actualizado.tieneMediaIzq = true
          }
          setAsignacionActual(actualizado)
        }
        
        // Determinar siguiente paso
        if (ladoActual === 'DERECHA') {
          // Pasar a izquierda del mismo garrón
          setLadoActual('IZQUIERDA')
        } else {
          // Buscar siguiente garrón pendiente
          const nuevosGarrones = [...garronesAsignados]
          if (asignacionActual) {
            const idx = nuevosGarrones.findIndex(g => g.garron === garronActual)
            if (idx >= 0) {
              nuevosGarrones[idx] = {
                ...nuevosGarrones[idx],
                tieneMediaDer: true,
                tieneMediaIzq: true
              }
            }
          }
          
          // Buscar siguiente pendiente
          const siguientePendiente = nuevosGarrones.find(g => 
            !g.tieneMediaDer || !g.tieneMediaIzq
          )
          
          if (siguientePendiente) {
            setGarronActual(siguientePendiente.garron)
            setAsignacionActual(siguientePendiente)
            setLadoActual(siguientePendiente.tieneMediaDer ? 'IZQUIERDA' : 'DERECHA')
          } else {
            // No hay más pendientes
            const nuevoGarron = Math.max(...nuevosGarrones.map(g => g.garron), 0) + 1
            setGarronActual(nuevoGarron)
            setLadoActual('DERECHA')
            setAsignacionActual(null)
            toast.info('No hay más garrones pendientes')
          }
          
          setDenticion('') // Limpiar dentición para nuevo animal
          setGarronesAsignados(nuevosGarrones)
        }
      } else {
        toast.error(data.error || 'Error al registrar peso')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleImprimirRotulos = (garron: number, lado: 'DERECHA' | 'IZQUIERDA', peso: number) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    if (!printWindow) {
      toast.error('No se pudo abrir ventana de impresión')
      return
    }
    
    const tipificador = tipificadores.find(t => t.id === tipificadorId)
    const camara = camaras.find(c => c.id === camaraId)
    const fecha = new Date()
    const fechaStr = fecha.toLocaleDateString('es-AR')
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rótulos Garrón ${garron} - ${lado}</title>
        <style>
          @page { size: 100mm 70mm; margin: 3mm; }
          body { font-family: Arial, sans-serif; padding: 5px; margin: 0; }
          .rotulo { 
            border: 2px solid black; 
            padding: 5px; 
            margin-bottom: 3mm;
            page-break-after: always;
            width: 94mm;
            height: 64mm;
            box-sizing: border-box;
          }
          .header { text-align: center; border-bottom: 1px solid black; padding-bottom: 3px; margin-bottom: 3px; }
          .empresa { font-size: 14px; font-weight: bold; }
          .campo { display: flex; justify-content: space-between; padding: 1px 0; font-size: 11px; }
          .sigla { font-size: 28px; font-weight: bold; text-align: center; background: #f0f0f0; padding: 3px; margin: 3px 0; }
          .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 18px; text-align: center; margin-top: 3px; }
          .lado { font-size: 12px; text-align: center; font-weight: bold; background: ${lado === 'DERECHA' ? '#e3f2fd' : '#fce4ec'}; padding: 2px; }
        </style>
      </head>
      <body>
        ${SIGLAS.map(sigla => `
          <div class="rotulo">
            <div class="header">
              <div class="empresa">SOLEMAR ALIMENTARIA</div>
              <div style="font-size: 9px;">Media Res - Faena</div>
            </div>
            <div class="lado">${lado === 'DERECHA' ? 'MEDIA DERECHA' : 'MEDIA IZQUIERDA'}</div>
            <div class="campo"><span>Garrón:</span><span style="font-weight: bold; font-size: 14px;">${garron}</span></div>
            <div class="campo"><span>Tropa:</span><span>${asignacionActual?.tropaCodigo || '-'}</span></div>
            <div class="campo"><span>Tipo:</span><span>${asignacionActual?.tipoAnimal || '-'}</span></div>
            <div class="campo"><span>Peso:</span><span style="font-weight: bold;">${peso.toFixed(1)} kg</span></div>
            <div class="campo"><span>Cámara:</span><span>${camara?.nombre || '-'}</span></div>
            ${denticion ? `<div class="campo"><span>Dentición:</span><span>${denticion} dientes</span></div>` : ''}
            <div class="sigla">${sigla}</div>
            <div style="text-align: center; font-size: 10px;">${sigla === 'A' ? 'Asado' : sigla === 'T' ? 'Trasero' : 'Delantero'}</div>
            <div class="barcode">*${fecha.getFullYear().toString().slice(-2)}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${garron.toString().padStart(4, '0')}-${lado.charAt(0)}-${sigla}*</div>
            ${tipificador ? `<div style="text-align: center; font-size: 8px; margin-top: 2px;">Tip.: ${tipificador.nombre} ${tipificador.apellido} - Mat. ${tipificador.matricula}</div>` : ''}
          </div>
        `).join('')}
        <script>
          window.onload = function() { 
            window.print(); 
            window.onafterprint = function() { window.close(); } 
          }
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleReimprimirUltimo = () => {
    if (ultimoRotulo) {
      handleImprimirRotulos(ultimoRotulo.garron, ultimoRotulo.lado as 'DERECHA' | 'IZQUIERDA', ultimoRotulo.peso)
      toast.success('Reimprimiendo últimos rótulos')
    } else {
      toast.error('No hay rótulos para reimprimir')
    }
  }

  const handleCambiarGarron = (delta: number) => {
    const nuevoGarron = Math.max(1, garronActual + delta)
    const asignacion = garronesAsignados.find(g => g.garron === nuevoGarron)
    setGarronActual(nuevoGarron)
    setAsignacionActual(asignacion || null)
    
    // Determinar lado según si ya tiene medias
    if (asignacion?.tieneMediaDer && !asignacion?.tieneMediaIzq) {
      setLadoActual('IZQUIERDA')
    } else {
      setLadoActual('DERECHA')
    }
    
    setPesoBalanza('')
  }

  const getTotalKg = () => {
    return mediasPesadas.reduce((acc, m) => acc + m.peso, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
        <Scale className="w-8 h-8 animate-pulse text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">Romaneo - Pesaje de Medias</h1>
            <p className="text-stone-500">Pesaje y rotulado de medias reses</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>
              <User className="w-4 h-4 mr-2" />
              Configurar
            </Button>
            <Button variant="outline" size="sm" onClick={handleReimprimirUltimo} disabled={!ultimoRotulo}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reimprimir
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Configuración activa */}
        <Card className="border-0 shadow-sm bg-amber-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4 text-amber-600" />
                  <strong>Tipificador:</strong> {tipificadores.find(t => t.id === tipificadorId)?.nombre || 'Sin asignar'}
                </span>
                <span className="flex items-center gap-1">
                  <Warehouse className="w-4 h-4 text-amber-600" />
                  <strong>Cámara:</strong> {camaras.find(c => c.id === camaraId)?.nombre || 'Sin asignar'}
                </span>
              </div>
              <Badge variant="outline">
                {mediasPesadas.length} medias pesadas - {getTotalKg().toFixed(1)} kg
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Panel principal de pesaje */}
          <Card className="lg:col-span-2 border-0 shadow-md">
            <CardHeader className="bg-stone-50 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pesaje Actual</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCambiarGarron(-1)}>
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <span className="text-2xl font-bold text-amber-600 min-w-[60px] text-center">
                    #{garronActual}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => handleCambiarGarron(1)}>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Datos del animal */}
              {asignacionActual ? (
                <div className="grid grid-cols-4 gap-2 p-3 bg-stone-50 rounded-lg text-sm">
                  <div>
                    <span className="text-stone-500 block">Tropa</span>
                    <span className="font-medium">{asignacionActual.tropaCodigo || '-'}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Tipo</span>
                    <span className="font-medium">{asignacionActual.tipoAnimal || '-'}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">P. Vivo</span>
                    <span className="font-medium">{asignacionActual.pesoVivo?.toFixed(0) || '-'} kg</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Estado</span>
                    <span className="font-medium">
                      {asignacionActual.tieneMediaDer && asignacionActual.tieneMediaIzq ? '✓ Completo' : 
                       asignacionActual.tieneMediaDer ? 'Falta Izq' : 'Falta Der'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  No hay animal asignado al garrón {garronActual}
                </div>
              )}

              <Separator />

              {/* Lado actual */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant={ladoActual === 'DERECHA' ? 'default' : 'outline'}
                  className={`h-12 px-8 ${ladoActual === 'DERECHA' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  onClick={() => setLadoActual('DERECHA')}
                  disabled={asignacionActual?.tieneMediaDer}
                >
                  DERECHA {asignacionActual?.tieneMediaDer && <CheckCircle className="w-4 h-4 ml-2" />}
                </Button>
                <Button
                  variant={ladoActual === 'IZQUIERDA' ? 'default' : 'outline'}
                  className={`h-12 px-8 ${ladoActual === 'IZQUIERDA' ? 'bg-pink-600 hover:bg-pink-700' : ''}`}
                  onClick={() => setLadoActual('IZQUIERDA')}
                  disabled={!asignacionActual?.tieneMediaDer || asignacionActual?.tieneMediaIzq}
                >
                  IZQUIERDA {asignacionActual?.tieneMediaIzq && <CheckCircle className="w-4 h-4 ml-2" />}
                </Button>
              </div>

              {/* Peso */}
              <div className="text-center">
                <Label className="text-lg">Peso (kg)</Label>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Input
                    type="number"
                    value={pesoBalanza}
                    onChange={(e) => setPesoBalanza(e.target.value)}
                    className="text-4xl font-bold text-center h-20 w-48"
                    placeholder="0"
                    step="0.1"
                  />
                  <Button variant="outline" size="lg" onClick={handleCapturarPeso}>
                    <Scale className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Dentición */}
              <div className="space-y-2">
                <Label>Dentición</Label>
                <div className="flex gap-2">
                  {DIENTES.map((d) => (
                    <Button
                      key={d}
                      variant={denticion === d ? 'default' : 'outline'}
                      className={`flex-1 h-12 ${denticion === d ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                      onClick={() => setDenticion(d)}
                    >
                      {d}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Botón principal */}
              <Button
                onClick={handleAceptarPeso}
                disabled={saving || !pesoBalanza || parseFloat(pesoBalanza) <= 0}
                className="w-full h-16 text-xl bg-green-600 hover:bg-green-700"
              >
                <Printer className="w-6 h-6 mr-3" />
                {saving ? 'Guardando...' : 'ACEPTAR PESO E IMPRIMIR RÓTULOS'}
              </Button>
            </CardContent>
          </Card>

          {/* Panel lateral - Historial */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 py-3">
              <CardTitle className="text-base">Medias Pesadas Hoy</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {mediasPesadas.length === 0 ? (
                  <div className="p-4 text-center text-stone-400">
                    <Scale className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hay medias pesadas</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {mediasPesadas.slice().reverse().map((media, idx) => (
                      <div 
                        key={media.id || idx} 
                        className={`p-3 flex items-center justify-between ${
                          ultimoRotulo?.id === media.id ? 'bg-green-50' : ''
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">#{media.garron}</span>
                            <Badge variant={media.lado === 'DERECHA' ? 'default' : 'secondary'} className="text-xs">
                              {media.lado === 'DERECHA' ? 'DER' : 'IZQ'}
                            </Badge>
                          </div>
                          <span className="text-xs text-stone-500">
                            {media.siglas.join(', ')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-green-600">{media.peso.toFixed(1)} kg</span>
                          <div className="text-xs text-stone-400">
                            {new Date(media.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="p-3 border-t bg-stone-50">
                <div className="flex justify-between text-sm">
                  <span>Total: {mediasPesadas.length} medias</span>
                  <span className="font-bold">{getTotalKg().toFixed(1)} kg</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de configuración */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configuración del Turno</DialogTitle>
            <DialogDescription>
              Configure el tipificador y cámara para el romaneo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipificador</Label>
              <Select value={tipificadorId} onValueChange={setTipificadorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipificador" />
                </SelectTrigger>
                <SelectContent>
                  {tipificadores.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nombre} {t.apellido} - Mat. {t.matricula}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cámara Destino</Label>
              <Select value={camaraId} onValueChange={setCamaraId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cámara" />
                </SelectTrigger>
                <SelectContent>
                  {camaras.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setConfigOpen(false)} className="bg-green-600 hover:bg-green-700">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RomaneoModule
