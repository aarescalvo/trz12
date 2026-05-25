'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileSpreadsheet, Download, RefreshCw, Loader2, Calendar, Search,
  Package, Warehouse, History, Settings, CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

interface Operador { id: string; nombre: string; rol: string }

type ReportType = 'romaneos' | 'stock' | 'historial' | 'configuracion'

interface RomaneoRecord {
  garron: number
  tropa: number
  especie: string
  pesoVivo: number
  pesoTotal: number
  denticion: string
  tipoAnimal: string
  raza: string
  tipificador: string
}

interface StockRecord {
  camara: string
  totalMedias: number
  kg: number
  bovinos: number
  equinos: number
  kgBovinos: number
  kgEquinos: number
}

interface HistorialRecord {
  id: string
  fechaEnvio: string
  tipo: string
  registros: number
  estado: string
  mensaje: string | null
  operador: string
}

interface ConfigRecord {
  parametro: string
  valor: string | boolean | number
  descripcion: string
}

const REPORT_TYPES: { type: ReportType; label: string; icon: React.ReactNode; color: string; bgColor: string }[] = [
  {
    type: 'romaneos',
    label: 'Romaneos',
    icon: <FileSpreadsheet className="w-5 h-5" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    type: 'stock',
    label: 'Stock',
    icon: <Warehouse className="w-5 h-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    type: 'historial',
    label: 'Historial Envíos',
    icon: <History className="w-5 h-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    type: 'configuracion',
    label: 'Configuración',
    icon: <Settings className="w-5 h-5" />,
    color: 'text-stone-600',
    bgColor: 'bg-stone-100',
  },
]

function getDefaultDates() {
  const hoy = new Date()
  const desde = new Date(hoy)
  desde.setDate(desde.getDate() - 30)
  return {
    desde: desde.toISOString().split('T')[0],
    hasta: hoy.toISOString().split('T')[0],
  }
}

export function ReportesSIGICAModule({ operador }: { operador: Operador }) {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null)
  const [loading, setLoading] = useState(false)
  const [fechaDesde, setFechaDesde] = useState(getDefaultDates().desde)
  const [fechaHasta, setFechaHasta] = useState(getDefaultDates().hasta)

  const [romaneos, setRomaneos] = useState<RomaneoRecord[]>([])
  const [stock, setStock] = useState<StockRecord[]>([])
  const [historial, setHistorial] = useState<HistorialRecord[]>([])
  const [configuracion, setConfiguracion] = useState<ConfigRecord[]>([])

  const fetchData = useCallback(async (tipo: ReportType) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ tipo })
      if (tipo === 'romaneos' || tipo === 'stock') {
        if (fechaDesde) params.set('fechaDesde', fechaDesde)
        if (fechaHasta) params.set('fechaHasta', fechaHasta)
      }

      const res = await fetch(`/api/reportes-sigica?${params}`)
      const data = await res.json()

      if (data.success) {
        const d = data.data
        switch (tipo) {
          case 'romaneos':
            setRomaneos((d?.registros || []).map((r: any) => ({
              garron: r.garron,
              tropa: r.tropa,
              especie: r.especie || 'BOVINO',
              pesoVivo: r.pesoVivo || 0,
              pesoTotal: r.pesoTotal || 0,
              denticion: r.denticion || '',
              tipoAnimal: r.tipoAnimal || '',
              raza: r.raza || '',
              tipificador: r.tipificador || '',
            })))
            break
          case 'stock':
            setStock((d?.camaras || []).map((c: any) => ({
              camara: c.camaraNombre || c.camaraId || '',
              totalMedias: c.totalMedias || 0,
              kg: c.totalKg || 0,
              bovinos: c.bovinosMedias || 0,
              equinos: c.equinosMedias || 0,
              kgBovinos: c.bovinosKg || 0,
              kgEquinos: c.equinosKg || 0,
            })))
            break
          case 'historial':
            setHistorial((d?.envios || []).map((e: any) => ({
              id: e.id,
              fechaEnvio: e.ultimoIntento || e.fechaEnvio || '',
              tipo: e.tipo || '',
              registros: e.cantidadRegistros || 0,
              estado: e.estado || '',
              mensaje: e.mensajeError || '',
              operador: e.operador || '',
            })))
            break
          case 'configuracion':
            if (d?.configuracion) {
              const cfg = d.configuracion
              setConfiguracion([
                { parametro: 'Habilitado', valor: cfg.habilitado, descripcion: 'Integración SIGICA activa' },
                { parametro: 'Establecimiento', valor: cfg.establecimiento, descripcion: 'Nombre del establecimiento' },
                { parametro: 'URL Servicio', valor: cfg.urlServicio || 'No configurada', descripcion: 'Endpoint del servicio SIGICA' },
                { parametro: 'Última Sincronización', valor: cfg.ultimaSincronizacion || 'Nunca', descripcion: 'Fecha del último envío exitoso' },
              ])
            }
            break
        }
        toast.success('Datos cargados correctamente')
      } else {
        toast.error(data.error || 'Error al obtener los datos')
      }
    } catch (err) {
      console.error('Error:', err)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [fechaDesde, fechaHasta])

  useEffect(() => {
    if (selectedType) {
      fetchData(selectedType)
    }
  }, [selectedType, fetchData])

  const handleRefresh = () => {
    if (selectedType) {
      fetchData(selectedType)
    }
  }

  const handleSelectType = (tipo: ReportType) => {
    setSelectedType(tipo)
  }

  // --- CSV export ---
  const exportCSV = () => {
    if (!selectedType) return

    let csvContent = ''
    let filename = ''

    switch (selectedType) {
      case 'romaneos': {
        const headers = ['Garrón', 'Tropa', 'Especie', 'Peso Vivo', 'Peso Total', 'Denticion', 'Tipo Animal', 'Raza', 'Tipificador']
        csvContent = [headers.join(';'), ...romaneos.map(r =>
          [r.garron, r.tropa, r.especie, r.pesoVivo, r.pesoTotal, r.denticion, r.tipoAnimal, r.raza, r.tipificador].join(';')
        )].join('\n')
        filename = `romaneos_sigica_${fechaDesde}_${fechaHasta}.csv`
        break
      }
      case 'stock': {
        const headers = ['Cámara', 'Total Medias', 'Kg', 'Bovinos', 'Equinos', 'Kg Bovinos', 'Kg Equinos']
        csvContent = [headers.join(';'), ...stock.map(s =>
          [s.camara, s.totalMedias, s.kg, s.bovinos, s.equinos, s.kgBovinos, s.kgEquinos].join(';')
        )].join('\n')
        filename = `stock_sigica_${fechaDesde}_${fechaHasta}.csv`
        break
      }
      case 'historial': {
        const headers = ['Fecha Envío', 'Tipo', 'Registros', 'Estado', 'Mensaje', 'Operador']
        csvContent = [headers.join(';'), ...historial.map(h =>
          [h.fechaEnvio, h.tipo, h.registros, h.estado, h.mensaje || '', h.operador].join(';')
        )].join('\n')
        filename = `historial_sigica.csv`
        break
      }
      case 'configuracion': {
        const headers = ['Parámetro', 'Valor', 'Descripción']
        csvContent = [headers.join(';'), ...configuracion.map(c =>
          [c.parametro, String(c.valor), c.descripcion].join(';')
        )].join('\n')
        filename = `configuracion_sigica.csv`
        break
      }
    }

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Archivo CSV descargado')
  }

  // --- Summary calculations ---
  const romaneosSummary = {
    total: romaneos.length,
    tropas: new Set(romaneos.map(r => r.tropa)).size,
    pesoTotal: romaneos.reduce((s, r) => s + (r.pesoTotal || 0), 0),
    pesoVivo: romaneos.reduce((s, r) => s + (r.pesoVivo || 0), 0),
    bovinos: romaneos.filter(r => r.especie?.toLowerCase() === 'bovino' || r.especie === '1').length,
    equinos: romaneos.filter(r => r.especie?.toLowerCase() === 'equino' || r.especie === '2').length,
  }

  const stockSummary = {
    totalMedias: stock.reduce((s, r) => s + (r.totalMedias || 0), 0),
    totalKg: stock.reduce((s, r) => s + (r.kg || 0), 0),
    totalBovinos: stock.reduce((s, r) => s + (r.bovinos || 0), 0),
    totalEquinos: stock.reduce((s, r) => s + (r.equinos || 0), 0),
    camarás: stock.length,
  }

  const historialSummary = {
    total: historial.length,
    exitosos: historial.filter(h => h.estado === 'OK' || h.estado === 'EXITOSO').length,
    conError: historial.filter(h => h.estado === 'ERROR' || h.estado === 'FALLIDO').length,
    pendientes: historial.filter(h => h.estado === 'PENDIENTE').length,
    totalRegistros: historial.reduce((s, h) => s + (h.registros || 0), 0),
  }

  // --- Render helpers ---
  const getEstadoBadge = (estado: string) => {
    const normalized = estado?.toUpperCase()
    if (normalized === 'OK' || normalized === 'EXITOSO' || normalized === 'CONFIRMADO') {
      return <Badge className="bg-green-100 text-green-700 border-0"><CheckCircle2 className="w-3 h-3 mr-1" />{estado}</Badge>
    }
    if (normalized === 'ERROR' || normalized === 'FALLIDO') {
      return <Badge className="bg-red-100 text-red-700 border-0">{estado}</Badge>
    }
    if (normalized === 'PENDIENTE') {
      return <Badge className="bg-amber-100 text-amber-700 border-0">{estado}</Badge>
    }
    return <Badge variant="outline">{estado}</Badge>
  }

  const formatNumber = (n: number) => {
    if (n == null) return '0'
    return n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
  }

  // --- Content rendering per type ---
  const renderContent = () => {
    if (!selectedType) {
      return (
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center">
            <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-stone-300" />
            <h3 className="text-lg font-semibold text-stone-600 mb-2">
              Seleccioná un tipo de reporte
            </h3>
            <p className="text-stone-400 text-sm max-w-md mx-auto">
              Elegí una de las opciones arriba para consultar los datos del sistema SIGICA.
            </p>
          </CardContent>
        </Card>
      )
    }

    if (loading) {
      return (
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-amber-500" />
            <p className="text-stone-500">Cargando datos...</p>
          </CardContent>
        </Card>
      )
    }

    switch (selectedType) {
      case 'romaneos':
        return renderRomaneos()
      case 'stock':
        return renderStock()
      case 'historial':
        return renderHistorial()
      case 'configuracion':
        return renderConfiguracion()
      default:
        return null
    }
  }

  const renderRomaneos = () => (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-800">{romaneosSummary.total}</p>
                <p className="text-xs text-stone-500">Romaneos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{romaneosSummary.tropas}</p>
                <p className="text-xs text-stone-500">Tropas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{formatNumber(romaneosSummary.pesoTotal)}</p>
                <p className="text-xs text-stone-500">Kg Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-stone-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-stone-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-700">
                  <span className="text-green-600">{romaneosSummary.bovinos}</span>
                  <span className="text-stone-300 mx-1">/</span>
                  <span className="text-stone-500">{romaneosSummary.equinos}</span>
                </p>
                <p className="text-xs text-stone-500">Bovinos / Equinos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-stone-800 text-base">
            <FileSpreadsheet className="w-5 h-5 text-amber-500" />
            Detalle de Romaneos
            <Badge variant="outline" className="ml-2">{romaneosSummary.total} registros</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {romaneos.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No se encontraron romaneos para el período seleccionado</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-stone-50 z-10">
                  <TableRow>
                    <TableHead className="text-center">Garrón</TableHead>
                    <TableHead className="text-center">Tropa</TableHead>
                    <TableHead>Especie</TableHead>
                    <TableHead className="text-right">Peso Vivo</TableHead>
                    <TableHead className="text-right">Peso Total</TableHead>
                    <TableHead className="text-center">Denticion</TableHead>
                    <TableHead>Tipo Animal</TableHead>
                    <TableHead>Raza</TableHead>
                    <TableHead>Tipificador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {romaneos.map((r, idx) => (
                    <TableRow key={idx} className="text-sm">
                      <TableCell className="text-center font-mono">{r.garron}</TableCell>
                      <TableCell className="text-center font-semibold">{r.tropa}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            r.especie?.toLowerCase() === 'bovino' || r.especie === '1'
                              ? 'text-green-700 border-green-300'
                              : 'text-stone-600'
                          }
                        >
                          {r.especie?.toLowerCase() === 'bovino' || r.especie === '1' ? 'Bovino' : 'Equino'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatNumber(r.pesoVivo)} kg</TableCell>
                      <TableCell className="text-right font-mono font-medium">{formatNumber(r.pesoTotal)} kg</TableCell>
                      <TableCell className="text-center font-mono">{r.denticion || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">{r.tipoAnimal || '-'}</TableCell>
                      <TableCell>{r.raza || '-'}</TableCell>
                      <TableCell className="text-stone-500 text-xs">{r.tipificador || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )

  const renderStock = () => (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Warehouse className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-800">{stockSummary.camarás}</p>
                <p className="text-xs text-stone-500">Cámaras</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{formatNumber(stockSummary.totalMedias)}</p>
                <p className="text-xs text-stone-500">Total Medias</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{formatNumber(stockSummary.totalKg)}</p>
                <p className="text-xs text-stone-500">Kg Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{formatNumber(stockSummary.totalBovinos)}</p>
                <p className="text-xs text-stone-500">Bovinos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-stone-100 rounded-lg">
                <Package className="w-5 h-5 text-stone-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-600">{formatNumber(stockSummary.totalEquinos)}</p>
                <p className="text-xs text-stone-500">Equinos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-stone-800 text-base">
            <Warehouse className="w-5 h-5 text-amber-500" />
            Stock por Cámara
            <Badge variant="outline" className="ml-2">{stock.length} cámaras</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {stock.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <Warehouse className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No se encontró stock para el período seleccionado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cámara</TableHead>
                  <TableHead className="text-center">Total Medias</TableHead>
                  <TableHead className="text-right">Kg Total</TableHead>
                  <TableHead className="text-center">Bovinos</TableHead>
                  <TableHead className="text-center">Equinos</TableHead>
                  <TableHead className="text-right">Kg Bovinos</TableHead>
                  <TableHead className="text-right">Kg Equinos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.map((s, idx) => (
                  <TableRow key={idx} className="text-sm">
                    <TableCell className="font-semibold">{s.camara}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono">{formatNumber(s.totalMedias)}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatNumber(s.kg)} kg</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-100 text-green-700 border-0">{formatNumber(s.bovinos)}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-stone-100 text-stone-600 border-0">{formatNumber(s.equinos)}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-700">{formatNumber(s.kgBovinos)} kg</TableCell>
                    <TableCell className="text-right font-mono text-stone-500">{formatNumber(s.kgEquinos)} kg</TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="bg-stone-50 font-bold text-sm">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-center font-mono">{formatNumber(stockSummary.totalMedias)}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(stockSummary.totalKg)} kg</TableCell>
                  <TableCell className="text-center font-mono text-green-700">{formatNumber(stockSummary.totalBovinos)}</TableCell>
                  <TableCell className="text-center font-mono text-stone-600">{formatNumber(stockSummary.totalEquinos)}</TableCell>
                  <TableCell className="text-right font-mono text-green-700">
                    {formatNumber(stock.reduce((s, r) => s + (r.kgBovinos || 0), 0))} kg
                  </TableCell>
                  <TableCell className="text-right font-mono text-stone-500">
                    {formatNumber(stock.reduce((s, r) => s + (r.kgEquinos || 0), 0))} kg
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )

  const renderHistorial = () => (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <History className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-800">{historialSummary.total}</p>
                <p className="text-xs text-stone-500">Envíos Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{historialSummary.exitosos}</p>
                <p className="text-xs text-stone-500">Exitosos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Settings className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700">{historialSummary.conError}</p>
                <p className="text-xs text-stone-500">Con Error</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{formatNumber(historialSummary.totalRegistros)}</p>
                <p className="text-xs text-stone-500">Registros Enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-stone-800 text-base">
            <History className="w-5 h-5 text-amber-500" />
            Historial de Envíos
            <Badge variant="outline" className="ml-2">{historial.length} envíos</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {historial.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No se encontraron envíos registrados</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-stone-50 z-10">
                  <TableRow>
                    <TableHead>Fecha Envío</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-center">Registros</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Mensaje</TableHead>
                    <TableHead>Operador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historial.map((h, idx) => (
                    <TableRow key={idx} className="text-sm">
                      <TableCell className="font-medium">
                        {h.fechaEnvio
                          ? new Date(h.fechaEnvio).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{h.tipo}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono">{h.registros}</TableCell>
                      <TableCell>{getEstadoBadge(h.estado)}</TableCell>
                      <TableCell className="text-stone-500 text-xs max-w-[200px] truncate" title={h.mensaje || ''}>
                        {h.mensaje || '-'}
                      </TableCell>
                      <TableCell className="text-stone-500 text-xs">{h.operador || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )

  const renderConfiguracion = () => (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-stone-50 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-stone-800 text-base">
          <Settings className="w-5 h-5 text-amber-500" />
          Configuración SIGICA
          <Badge variant="outline" className="ml-2">{configuracion.length} parámetros</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {configuracion.length === 0 ? (
          <div className="p-8 text-center text-stone-400">
            <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No se encontró configuración registrada</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parámetro</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Descripción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configuracion.map((c, idx) => (
                <TableRow key={idx} className="text-sm">
                  <TableCell className="font-mono font-medium text-stone-700">{c.parametro}</TableCell>
                  <TableCell>
                    {typeof c.valor === 'boolean' ? (
                      c.valor
                        ? <Badge className="bg-green-100 text-green-700 border-0"><CheckCircle2 className="w-3 h-3 mr-1" />Sí</Badge>
                        : <Badge className="bg-red-100 text-red-700 border-0">No</Badge>
                    ) : (
                      <span className="font-mono">{String(c.valor)}</span>
                    )
                    }
                  </TableCell>
                  <TableCell className="text-stone-500">{c.descripcion || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )

  const showDateFilters = selectedType === 'romaneos' || selectedType === 'stock'

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">
              Reportes SIGICA
            </h1>
            <p className="text-stone-500">
              Sistema de Información Ganadera - Consultas y reportes
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={!selectedType || loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              disabled={!selectedType || loading}
              className="bg-amber-500 hover:bg-amber-600 text-white border-0"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Type selector cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {REPORT_TYPES.map(({ type, label, icon, color, bgColor }) => (
            <Card
              key={type}
              className={`border-0 shadow-md bg-white cursor-pointer transition-all hover:shadow-lg ${
                selectedType === type ? 'ring-2 ring-amber-500' : ''
              }`}
              onClick={() => handleSelectType(type)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${selectedType === type ? 'bg-amber-100' : bgColor}`}>
                    <span className={selectedType === type ? 'text-amber-600' : color}>
                      {icon}
                    </span>
                  </div>
                  <div>
                    <p className={`font-semibold ${selectedType === type ? 'text-amber-700' : 'text-stone-700'}`}>
                      {label}
                    </p>
                    {selectedType === type && (
                      <p className="text-xs text-amber-500 font-medium">Seleccionado</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Date range filters */}
        {showDateFilters && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="flex-1 w-full sm:w-auto space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-stone-400" />
                    Fecha Desde
                  </Label>
                  <Input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                  />
                </div>
                <div className="flex-1 w-full sm:w-auto space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-stone-400" />
                    Fecha Hasta
                  </Label>
                  <Input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="bg-stone-800 hover:bg-stone-900 w-full sm:w-auto"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Consultar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dynamic content */}
        {renderContent()}

        {/* Footer */}
        <div className="text-center text-xs text-stone-400 pb-4">
          <p>Datos del Sistema de Información Ganadera y Carníca (SIGICA)</p>
          <p className="mt-1">Última consulta: {new Date().toLocaleString('es-AR')}</p>
        </div>
      </div>
    </div>
  )
}

export default ReportesSIGICAModule
