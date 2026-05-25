'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Truck, Package, Loader2, RefreshCw, CheckCircle, Plus,
  Warehouse, Users, Scale, FileText, ArrowRight, X
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface StockData {
  stock: StockCamara[]
  totalMedias: number
  totalKg: number
}

interface StockCamara {
  id: string
  nombre: string
  totalMedias: number
  totalKg: number
  porTropa: StockTropa[]
}

interface StockTropa {
  tropaCodigo: string
  cantidad: number
  pesoTotal: number
  porUsuario: StockUsuario[]
}

interface StockUsuario {
  usuarioId: string | null
  usuarioNombre: string
  cantidad: number
  pesoTotal: number
  medias: MediaItem[]
}

interface MediaItem {
  id: string
  codigo: string
  lado: string
  peso: number
  garron: number
  selected?: boolean
}

interface Despacho {
  id: string
  numero: number
  fecha: Date
  destino: string
  patenteCamion: string | null
  chofer: string | null
  remito: string | null
  kgTotal: number
  cantidadMedias: number
  estado: string
  operador?: string
  facturado?: boolean
  fechaFacturacion?: Date | null
}

interface Props {
  operador: Operador
}

export function ExpedicionModule({ operador }: Props) {
  const [activeTab, setActiveTab] = useState('stock')
  
  // Stock
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [loadingStock, setLoadingStock] = useState(true)
  const [expandedCamara, setExpandedCamara] = useState<string | null>(null)
  const [expandedTropa, setExpandedTropa] = useState<string | null>(null)
  
  // Selección
  const [selectedMedias, setSelectedMedias] = useState<MediaItem[]>([])
  
  // Despachos
  const [despachos, setDespachos] = useState<Despacho[]>([])
  const [loadingDespachos, setLoadingDespachos] = useState(false)
  
  // Dialog nuevo despacho
  const [showNewDespacho, setShowNewDespacho] = useState(false)
  const [savingDespacho, setSavingDespacho] = useState(false)
  const [formData, setFormData] = useState({
    destino: '',
    direccionDestino: '',
    patenteCamion: '',
    patenteAcoplado: '',
    chofer: '',
    choferDni: '',
    transportista: '',
    remito: '',
    observaciones: ''
  })

  // Cargar stock al iniciar
  useEffect(() => {
    fetchStock()
  }, [])

  const fetchStock = async () => {
    setLoadingStock(true)
    try {
      const res = await fetch('/api/expedicion?tipo=stock')
      const data = await res.json()
      if (data.success) {
        setStockData(data.data)
      } else {
        toast.error(data.error || 'Error al cargar stock')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoadingStock(false)
    }
  }

  const fetchDespachos = async () => {
    setLoadingDespachos(true)
    try {
      const res = await fetch('/api/expedicion?tipo=despachos')
      const data = await res.json()
      if (data.success) {
        setDespachos(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar despachos')
    } finally {
      setLoadingDespachos(false)
    }
  }

  // Seleccionar/deseleccionar media
  const toggleMediaSelection = (media: MediaItem) => {
    setSelectedMedias(prev => {
      const exists = prev.find(m => m.id === media.id)
      if (exists) {
        return prev.filter(m => m.id !== media.id)
      }
      return [...prev, media]
    })
  }

  // Seleccionar todas las medias de un usuario
  const selectAllFromUsuario = (medias: MediaItem[]) => {
    setSelectedMedias(prev => {
      const notSelected = medias.filter(m => !prev.find(p => p.id === m.id))
      return [...prev, ...notSelected]
    })
  }

  // Crear despacho
  const handleCrearDespacho = async () => {
    if (!formData.destino) {
      toast.error('El destino es obligatorio')
      return
    }

    if (selectedMedias.length === 0) {
      toast.error('Debe seleccionar al menos una media res')
      return
    }

    setSavingDespacho(true)
    try {
      const res = await fetch('/api/expedicion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'crear',
          ...formData,
          operadorId: operador.id,
          mediasIds: selectedMedias.map(m => m.id)
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setShowNewDespacho(false)
        setSelectedMedias([])
        setFormData({
          destino: '',
          direccionDestino: '',
          patenteCamion: '',
          patenteAcoplado: '',
          chofer: '',
          choferDni: '',
          transportista: '',
          remito: '',
          observaciones: ''
        })
        fetchStock()
        fetchDespachos()
      } else {
        toast.error(data.error || 'Error al crear despacho')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSavingDespacho(false)
    }
  }

  // Calcular totales de selección
  const seleccionTotal = selectedMedias.length
  const seleccionKg = selectedMedias.reduce((sum, m) => sum + m.peso, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Truck className="w-8 h-8 text-amber-500" />
              Expedición 1/2 Res
            </h1>
            <p className="text-stone-500 mt-1">
              Despacho de medias reses - {operador.nombre}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchStock} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            {seleccionTotal > 0 && (
              <Button 
                onClick={() => setShowNewDespacho(true)}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Despacho ({seleccionTotal} medias)
              </Button>
            )}
          </div>
        </div>

        {/* Resumen de selección */}
        {seleccionTotal > 0 && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Badge className="bg-emerald-100 text-emerald-700 text-base px-4 py-2">
                    <Package className="w-4 h-4 mr-2" />
                    {seleccionTotal} medias seleccionadas
                  </Badge>
                  <Badge className="bg-amber-100 text-amber-700 text-base px-4 py-2">
                    <Scale className="w-4 h-4 mr-2" />
                    {seleccionKg.toFixed(1)} kg
                  </Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedMedias([])}
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpiar selección
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <Warehouse className="w-4 h-4" />
              Stock por Cámara
            </TabsTrigger>
            <TabsTrigger value="despachos" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Despachos
            </TabsTrigger>
          </TabsList>

          {/* Tab Stock */}
          <TabsContent value="stock" className="space-y-4">
            {loadingStock ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : !stockData || stockData.totalMedias === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="py-12 text-center">
                  <Warehouse className="w-16 h-16 mx-auto mb-4 text-stone-300" />
                  <p className="text-lg text-stone-600">No hay stock en cámaras</p>
                  <p className="text-sm text-stone-400 mt-1">
                    Las medias reses aparecerán aquí después del romaneo
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Resumen general */}
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-6">
                      <div>
                        <p className="text-sm text-stone-500">Total Medias</p>
                        <p className="text-2xl font-bold text-stone-800">{stockData.totalMedias}</p>
                      </div>
                      <div>
                        <p className="text-sm text-stone-500">Total Kg</p>
                        <p className="text-2xl font-bold text-stone-800">{stockData.totalKg.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-stone-500">Cámaras</p>
                        <p className="text-2xl font-bold text-stone-800">{stockData.stock.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stock por cámara */}
                <div className="space-y-3">
                  {stockData.stock.map((camara) => (
                    <Card key={camara.id} className="border-0 shadow-md">
                      <CardHeader 
                        className="cursor-pointer hover:bg-stone-50 py-3"
                        onClick={() => setExpandedCamara(expandedCamara === camara.id ? null : camara.id)}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Warehouse className="w-5 h-5 text-amber-500" />
                            {camara.nombre}
                          </CardTitle>
                          <div className="flex items-center gap-4">
                            <Badge variant="outline">{camara.totalMedias} medias</Badge>
                            <Badge variant="outline">{camara.totalKg.toFixed(1)} kg</Badge>
                            <span className="text-stone-400">
                              {expandedCamara === camara.id ? '▼' : '▶'}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {expandedCamara === camara.id && (
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {camara.porTropa.map((tropa, idx) => (
                              <div key={idx} className="border rounded-lg">
                                <div 
                                  className="flex items-center justify-between p-3 bg-stone-50 cursor-pointer"
                                  onClick={() => setExpandedTropa(
                                    expandedTropa === `${camara.id}-${tropa.tropaCodigo}` 
                                      ? null 
                                      : `${camara.id}-${tropa.tropaCodigo}`
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-blue-100 text-blue-700">
                                      Tropa: {tropa.tropaCodigo}
                                    </Badge>
                                    <span className="text-sm text-stone-500">
                                      {tropa.cantidad} medias • {tropa.pesoTotal.toFixed(1)} kg
                                    </span>
                                  </div>
                                  <span className="text-stone-400">
                                    {expandedTropa === `${camara.id}-${tropa.tropaCodigo}` ? '▼' : '▶'}
                                  </span>
                                </div>
                                
                                {expandedTropa === `${camara.id}-${tropa.tropaCodigo}` && (
                                  <div className="p-3">
                                    {tropa.porUsuario.map((usuario, uIdx) => (
                                      <div key={uIdx} className="mb-4 last:mb-0">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-stone-400" />
                                            <span className="font-medium">{usuario.usuarioNombre}</span>
                                            <Badge variant="outline" className="text-xs">
                                              {usuario.cantidad} medias • {usuario.pesoTotal.toFixed(1)} kg
                                            </Badge>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => selectAllFromUsuario(usuario.medias)}
                                          >
                                            Seleccionar todas
                                          </Button>
                                        </div>
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead className="w-10"></TableHead>
                                              <TableHead>Código</TableHead>
                                              <TableHead>Lado</TableHead>
                                              <TableHead>Garrón</TableHead>
                                              <TableHead className="text-right">Peso</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {usuario.medias.map((media) => {
                                              const isSelected = selectedMedias.find(m => m.id === media.id)
                                              return (
                                                <TableRow 
                                                  key={media.id}
                                                  className={`cursor-pointer hover:bg-stone-50 ${isSelected ? 'bg-emerald-50' : ''}`}
                                                  onClick={() => toggleMediaSelection(media)}
                                                >
                                                  <TableCell>
                                                    <Checkbox 
                                                      checked={!!isSelected}
                                                      onCheckedChange={() => toggleMediaSelection(media)}
                                                    />
                                                  </TableCell>
                                                  <TableCell className="font-mono">{media.codigo}</TableCell>
                                                  <TableCell>{media.lado}</TableCell>
                                                  <TableCell>{media.garron}</TableCell>
                                                  <TableCell className="text-right">{media.peso.toFixed(1)} kg</TableCell>
                                                </TableRow>
                                              )
                                            })}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Tab Despachos */}
          <TabsContent value="despachos" className="space-y-4">
            <Button onClick={fetchDespachos} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>

            {loadingDespachos ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : despachos.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="py-12 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-stone-300" />
                  <p className="text-lg text-stone-600">No hay despachos registrados</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N°</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Camión</TableHead>
                      <TableHead>Chofer</TableHead>
                      <TableHead className="text-right">Kg</TableHead>
                      <TableHead className="text-right">Medias</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Facturación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {despachos.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-bold">#{d.numero}</TableCell>
                        <TableCell>{new Date(d.fecha).toLocaleDateString('es-AR')}</TableCell>
                        <TableCell>{d.destino}</TableCell>
                        <TableCell>{d.patenteCamion || '-'}</TableCell>
                        <TableCell>{d.chofer || '-'}</TableCell>
                        <TableCell className="text-right">{d.kgTotal.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{d.cantidadMedias}</TableCell>
                        <TableCell>
                          <Badge className={
                            d.estado === 'DESPACHADO' ? 'bg-emerald-100 text-emerald-700' :
                            d.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' :
                            d.estado === 'ANULADO' ? 'bg-red-100 text-red-700' :
                            'bg-stone-100 text-stone-700'
                          }>
                            {d.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {d.facturado ? (
                            <Badge className="bg-emerald-100 text-emerald-700 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Facturado
                            </Badge>
                          ) : d.estado === 'DESPACHADO' ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-7 text-xs bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                              onClick={async () => {
                                try {
                                  const res = await fetch('/api/facturacion/despacho', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ despachoId: d.id, operadorId: operador.id })
                                  })
                                  const data = await res.json()
                                  if (data.success) {
                                    toast.success('Factura generada correctamente')
                                    fetchDespachos()
                                  } else {
                                    toast.error(data.error || 'Error al generar factura')
                                  }
                                } catch (error) {
                                  console.error('Error:', error)
                                  toast.error('Error de conexión al facturar')
                                }
                              }}
                            >
                              Facturar
                            </Button>
                          ) : (
                            <span className="text-xs text-stone-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Nuevo Despacho */}
      <Dialog open={showNewDespacho} onOpenChange={setShowNewDespacho}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" maximizable>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              Nuevo Despacho
            </DialogTitle>
            <DialogDescription>
              Complete los datos del despacho para {seleccionTotal} medias ({seleccionKg.toFixed(1)} kg)
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2">
              <Label>Destino *</Label>
              <Input 
                value={formData.destino}
                onChange={(e) => setFormData({...formData, destino: e.target.value})}
                placeholder="Destino del despacho"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Dirección de entrega</Label>
              <Input 
                value={formData.direccionDestino}
                onChange={(e) => setFormData({...formData, direccionDestino: e.target.value})}
                placeholder="Dirección completa"
              />
            </div>
            <div>
              <Label>Patente Camión</Label>
              <Input 
                value={formData.patenteCamion}
                onChange={(e) => setFormData({...formData, patenteCamion: e.target.value.toUpperCase()})}
                placeholder="AB123CD"
                maxLength={10}
              />
            </div>
            <div>
              <Label>Patente Acoplado</Label>
              <Input 
                value={formData.patenteAcoplado}
                onChange={(e) => setFormData({...formData, patenteAcoplado: e.target.value.toUpperCase()})}
                placeholder="AB123CD"
                maxLength={10}
              />
            </div>
            <div>
              <Label>Chofer</Label>
              <Input 
                value={formData.chofer}
                onChange={(e) => setFormData({...formData, chofer: e.target.value})}
                placeholder="Nombre del chofer"
              />
            </div>
            <div>
              <Label>DNI Chofer</Label>
              <Input 
                value={formData.choferDni}
                onChange={(e) => setFormData({...formData, choferDni: e.target.value})}
                placeholder="12345678"
              />
            </div>
            <div>
              <Label>Transportista</Label>
              <Input 
                value={formData.transportista}
                onChange={(e) => setFormData({...formData, transportista: e.target.value})}
                placeholder="Empresa de transporte"
              />
            </div>
            <div>
              <Label>N° Remito</Label>
              <Input 
                value={formData.remito}
                onChange={(e) => setFormData({...formData, remito: e.target.value})}
                placeholder="Número de remito"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Observaciones</Label>
              <Input 
                value={formData.observaciones}
                onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                placeholder="Observaciones adicionales"
              />
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-stone-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-stone-500">Medias a despachar</p>
                <p className="text-xl font-bold">{seleccionTotal}</p>
              </div>
              <div>
                <p className="text-sm text-stone-500">Kg totales</p>
                <p className="text-xl font-bold">{seleccionKg.toFixed(1)}</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDespacho(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCrearDespacho}
              disabled={savingDespacho || !formData.destino}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {savingDespacho ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Crear Despacho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ExpedicionModule
