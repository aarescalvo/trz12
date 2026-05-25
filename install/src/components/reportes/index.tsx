'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, TrendingUp, Package, Calendar, Download, Filter, Printer, RefreshCw,
  Search, Truck, User, Building2, Eye, FileSpreadsheet, FileDown, Beef,
  Warehouse, ClipboardList, ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Operador {
  id: string
  nombre: string
  rol: string
  permisos: Record<string, boolean>
}

interface FaenaDiaria {
  fecha: string
  totalAnimales: number
  totalMedias: number
  pesoTotal: number
}

interface Rendimiento {
  tropaCodigo: string
  productor?: { nombre: string }
  cantidad: number
  pesoVivoTotal: number
  pesoMediaTotal: number
  rinde: number
}

interface StockCamaras {
  camara: string
  tipo: string
  totalMedias: number
  pesoTotal: number
}

interface Tropa {
  id: string
  numero: number
  codigo: string
  cantidadCabezas: number
  especie: string
  dte: string
  guia: string
  fechaRecepcion: string
  corral?: { nombre: string }
  productor?: { nombre: string; cuit: string }
  usuarioFaena: { nombre: string; cuit: string }
  pesajeCamion?: {
    patenteChasis: string
    patenteAcoplado?: string
    choferNombre?: string
    choferDni?: string
    transportista?: { nombre: string; cuit: string }
    precintos?: string
  }
  animales: Array<{
    id: string
    numero: number
    tipoAnimal: string
    caravana?: string
    pesoVivo?: number
    raza?: string
  }>
}

interface Romaneo {
  id: string
  garron: number
  tropaCodigo: string
  fecha: string
  tipoAnimal?: string
  pesoVivo?: number
  pesoTotal?: number
  pesoMediaIzq?: number
  pesoMediaDer?: number
  rinde?: number
  denticion?: string
  tipificador?: { nombre: string }
}

interface SearchResult {
  tipo: string
  id: string
  codigo: string
  descripcion: string
  fecha?: string
  datos: Record<string, unknown>
}

const TIPOS_ANIMAL_LABELS: Record<string, string> = {
  'TO': 'TORO', 'VA': 'VACA', 'VQ': 'VAQUILLONA', 'MEJ': 'MEJ', 'NO': 'NOVILLO', 'NT': 'NOVILLITO',
}

export function ReportesModule({ operador }: { operador: Operador }) {
  const [loading, setLoading] = useState(true)
  const [faenaDiaria, setFaenaDiaria] = useState<FaenaDiaria[]>([])
  const [rendimientos, setRendimientos] = useState<Rendimiento[]>([])
  const [stockCamaras, setStockCamaras] = useState<StockCamaras[]>([])
  const [romaneos, setRomaneos] = useState<Romaneo[]>([])
  
  // Filtros
  const [fechaDesde, setFechaDesde] = useState<string>('')
  const [fechaHasta, setFechaHasta] = useState<string>('')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroTropa, setFiltroTropa] = useState<string>('')
  
  // Búsqueda
  const [busqueda, setBusqueda] = useState('')
  const [tipoBusqueda, setTipoBusqueda] = useState<string>('tropas')
  const [resultados, setResultados] = useState<SearchResult[]>([])
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)
  const [loadingBusqueda, setLoadingBusqueda] = useState(false)
  
  // Planilla 01
  const [tropas, setTropas] = useState<Tropa[]>([])
  const [tropaSeleccionada, setTropaSeleccionada] = useState<Tropa | null>(null)
  const [busquedaTropa, setBusquedaTropa] = useState('')
  const [generando, setGenerando] = useState<'excel' | 'pdf' | null>(null)
  
  // Vista detalle
  const [vistaDetalle, setVistaDetalle] = useState<'romaneo' | 'tropa' | null>(null)
  const [detalleData, setDetalleData] = useState<Romaneo[] | Tropa | null>(null)

  useEffect(() => {
    fetchAllData()
    fetchTropas()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (fechaDesde) params.append('fechaDesde', fechaDesde)
      if (fechaHasta) params.append('fechaHasta', fechaHasta)
      if (filtroTipo !== 'todos') params.append('tipo', filtroTipo)

      const [reportesRes, romaneosRes] = await Promise.all([
        fetch('/api/reportes?' + params.toString()),
        fetch('/api/romaneos?' + params.toString())
      ])
      
      const reportesData = await reportesRes.json()
      const romaneosData = await romaneosRes.json()

      if (reportesData.success) {
        setFaenaDiaria(reportesData.data.faenaDiaria || [])
        setRendimientos(reportesData.data.rendimientos || [])
        setStockCamaras(reportesData.data.stockCamaras || [])
      }
      
      if (romaneosData.success) {
        setRomaneos(romaneosData.data || [])
      }
    } catch (error) {
      console.error('Error fetching reportes:', error)
      toast.error('Error al cargar reportes')
    } finally {
      setLoading(false)
    }
  }

  const fetchTropas = async () => {
    try {
      const res = await fetch('/api/tropas')
      const data = await res.json()
      if (data.success) setTropas(data.data)
    } catch (error) {
      console.error('Error fetching tropas:', error)
    }
  }

  const handleSeleccionarTropa = async (tropaId: string) => {
    try {
      const res = await fetch(`/api/tropas/${tropaId}`)
      const data = await res.json()
      if (data.success) setTropaSeleccionada(data.data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar tropa')
    }
  }

  const handleBuscar = async () => {
    if (!busqueda.trim()) {
      toast.error('Ingrese un término de búsqueda')
      return
    }
    setLoadingBusqueda(true)
    setBusquedaRealizada(true)
    
    try {
      const res = await fetch(`/api/busqueda?q=${encodeURIComponent(busqueda)}&tipo=${tipoBusqueda}`)
      const data = await res.json()
      
      if (data.success) {
        setResultados(data.data)
      } else {
        setResultados([])
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error en la búsqueda')
      setResultados([])
    } finally {
      setLoadingBusqueda(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBuscar()
  }

  const exportarCSV = (tipo: string) => {
    let csvContent = ''
    
    if (tipo === 'faena') {
      csvContent = 'Fecha,Animales,Medias,Peso Total (kg)\n'
      faenaDiaria.forEach(d => {
        csvContent += `${new Date(d.fecha).toLocaleDateString('es-AR')},${d.totalAnimales},${d.totalMedias},${d.pesoTotal}\n`
      })
    } else if (tipo === 'rendimiento') {
      csvContent = 'Tropa,Productor,Cabezas,Peso Vivo (kg),Peso Media (kg),Rinde %\n'
      rendimientos.forEach(r => {
        csvContent += `${r.tropaCodigo},"${r.productor?.nombre || '-'}",${r.cantidad},${r.pesoVivoTotal},${r.pesoMediaTotal},${r.rinde.toFixed(1)}\n`
      })
    } else if (tipo === 'stock') {
      csvContent = 'Cámara,Tipo,Medias,Peso (kg)\n'
      stockCamaras.forEach(s => {
        csvContent += `${s.camara},${s.tipo},${s.totalMedias},${s.pesoTotal}\n`
      })
    } else if (tipo === 'romaneos') {
      csvContent = 'Fecha,Tropa,Garrón,Tipo Animal,Peso Vivo,Peso Total,Rinde %\n'
      romaneos.forEach(r => {
        csvContent += `${new Date(r.fecha).toLocaleDateString('es-AR')},${r.tropaCodigo},${r.garron},${r.tipoAnimal || '-'},${r.pesoVivo || 0},${r.pesoTotal || 0},${r.rinde?.toFixed(1) || 0}\n`
      })
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('CSV descargado')
  }

  const handleGenerarPDF = async () => {
    if (!tropaSeleccionada) return
    setGenerando('pdf')
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('PLANILLA 01 - REGISTRO DE INGRESO DE HACIENDA', pageWidth / 2, 15, { align: 'center' })
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('ESTABLECIMIENTO: SOLEMAR ALIMENTARIA S.A.', 14, 28)
      doc.setFont('helvetica', 'normal')
      doc.text(`N° SENASA: 3986`, 120, 28)
      doc.text(`MATRÍCULA: 300`, 180, 28)
      
      const getSemana = (fecha: string) => {
        const d = new Date(fecha)
        const start = new Date(d.getFullYear(), 0, 1)
        return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7)
      }
      
      doc.text(`SEMANA N°: ${getSemana(tropaSeleccionada.fechaRecepcion)}`, 14, 35)
      doc.text(`AÑO: ${new Date(tropaSeleccionada.fechaRecepcion).getFullYear()}`, 80, 35)
      doc.text(`FECHA: ${new Date(tropaSeleccionada.fechaRecepcion).toLocaleDateString('es-AR')}`, 140, 35)
      
      doc.setFont('helvetica', 'bold')
      doc.text('DATOS DEL PRODUCTOR / USUARIO FAENA', 14, 45)
      doc.setFont('helvetica', 'normal')
      doc.text(`Productor: ${tropaSeleccionada.productor?.nombre || tropaSeleccionada.usuarioFaena?.nombre || '-'}`, 14, 52)
      doc.text(`CUIT: ${tropaSeleccionada.productor?.cuit || tropaSeleccionada.usuarioFaena?.cuit || '-'}`, 120, 52)
      doc.text(`Tropa N°: ${tropaSeleccionada.codigo || '-'}`, 200, 52)
      
      doc.setFont('helvetica', 'bold')
      doc.text('DATOS DEL TRANSPORTE', 14, 62)
      doc.setFont('helvetica', 'normal')
      doc.text(`Transportista: ${tropaSeleccionada.pesajeCamion?.transportista?.nombre || '-'}`, 14, 69)
      doc.text(`Chofer: ${tropaSeleccionada.pesajeCamion?.choferNombre || '-'}`, 120, 69)
      doc.text(`DNI: ${tropaSeleccionada.pesajeCamion?.choferDni || '-'}`, 200, 69)
      doc.text(`Patente Chasis: ${tropaSeleccionada.pesajeCamion?.patenteChasis || '-'}`, 14, 76)
      doc.text(`Patente Acoplado: ${tropaSeleccionada.pesajeCamion?.patenteAcoplado || '-'}`, 80, 76)
      doc.text(`Precintos: ${tropaSeleccionada.pesajeCamion?.precintos || '-'}`, 160, 76)
      
      doc.setFont('helvetica', 'bold')
      doc.text('DOCUMENTACIÓN', 14, 86)
      doc.setFont('helvetica', 'normal')
      doc.text(`DTE: ${tropaSeleccionada.dte || '-'}`, 14, 93)
      doc.text(`Guía: ${tropaSeleccionada.guia || '-'}`, 80, 93)
      doc.text(`Corral: ${tropaSeleccionada.corral?.nombre || '-'}`, 160, 93)
      
      const animalesData = (tropaSeleccionada.animales || []).map((a, idx) => [
        idx + 1, a.caravana || '-', TIPOS_ANIMAL_LABELS[a.tipoAnimal] || a.tipoAnimal || '-', a.raza || '-', a.pesoVivo?.toFixed(0) || '-', ''
      ])
      
      const totalKg = (tropaSeleccionada.animales || []).reduce((sum, a) => sum + (a.pesoVivo || 0), 0)
      const totalAnimales = (tropaSeleccionada.animales || []).length
      
      autoTable(doc, {
        startY: 100,
        head: [['N°', 'CARAVANA', 'TIPO', 'RAZA', 'PESO (kg)', 'OBSERVACIONES']],
        body: animalesData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [217, 217, 217], textColor: [0, 0, 0], fontStyle: 'bold' },
        foot: [
          [{ content: 'TOTAL ANIMALES:', colSpan: 2, styles: { fontStyle: 'bold' } }, 
           { content: totalAnimales, styles: { fontStyle: 'bold' } },
           { content: 'TOTAL KG:', colSpan: 2, styles: { fontStyle: 'bold' } },
           { content: totalKg.toFixed(0), styles: { fontStyle: 'bold', halign: 'right' } },
           '']
        ]
      })
      
      const finalY = (doc as any).lastAutoTable.finalY + 20
      doc.text('_________________________', 50, finalY)
      doc.text('_________________________', 170, finalY)
      doc.setFontSize(8)
      doc.text('FIRMA RESPONSABLE INGRESO', 35, finalY + 5)
      doc.text('FIRMA TRANSPORTISTA', 155, finalY + 5)
      
      doc.save(`Planilla01_${tropaSeleccionada.codigo?.replace(/\s/g, '_') || tropaSeleccionada.id}.pdf`)
      toast.success('PDF generado correctamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al generar PDF')
    } finally {
      setGenerando(null)
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'tropa': return <Truck className="w-4 h-4" />
      case 'animal': return <Beef className="w-4 h-4" />
      case 'romaneo': return <FileText className="w-4 h-4" />
      case 'media': return <Package className="w-4 h-4" />
      case 'expedicion': return <Truck className="w-4 h-4" />
      default: return <Search className="w-4 h-4" />
    }
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      tropa: 'Tropa', animal: 'Animal', romaneo: 'Romaneo', media: 'Media Res', expedicion: 'Expedición'
    }
    return labels[tipo] || tipo
  }

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      tropa: 'bg-amber-100 text-amber-700',
      animal: 'bg-purple-100 text-purple-700',
      romaneo: 'bg-blue-100 text-blue-700',
      media: 'bg-emerald-100 text-emerald-700',
      expedicion: 'bg-red-100 text-red-700'
    }
    return colors[tipo] || 'bg-stone-100 text-stone-700'
  }

  const getSemana = (fecha: string) => {
    const d = new Date(fecha)
    const start = new Date(d.getFullYear(), 0, 1)
    return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7)
  }

  const romaneosFiltrados = romaneos.filter(r => {
    if (filtroTropa && !r.tropaCodigo?.toLowerCase().includes(filtroTropa.toLowerCase())) return false
    if (fechaDesde && new Date(r.fecha) < new Date(fechaDesde)) return false
    if (fechaHasta) {
      const hasta = new Date(fechaHasta)
      hasta.setHours(23, 59, 59)
      if (new Date(r.fecha) > hasta) return false
    }
    return true
  })

  const tropasFiltradas = tropas.filter(t => {
    if (!busquedaTropa) return true
    const search = busquedaTropa.toLowerCase()
    return t.codigo.toLowerCase().includes(search) || 
           t.productor?.nombre?.toLowerCase().includes(search) ||
           t.usuarioFaena?.nombre?.toLowerCase().includes(search)
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
        <FileText className="w-8 h-8 animate-pulse text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <FileText className="w-8 h-8 text-amber-500" />
              Centro de Reportes
            </h1>
            <p className="text-stone-500">Informes, estadísticas y búsqueda de datos</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAllData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Filtros globales */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label className="text-xs text-stone-500">Desde</Label>
                <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-stone-500">Hasta</Label>
                <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
              </div>
              <div className="w-full md:w-48">
                <Label className="text-xs text-stone-500">Especie</Label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="bovino">Bovinos</SelectItem>
                    <SelectItem value="equino">Equinos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={fetchAllData} className="bg-amber-500 hover:bg-amber-600">
                <Filter className="w-4 h-4 mr-2" />
                Aplicar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Reportes */}
        <Tabs defaultValue="busqueda" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="busqueda" className="py-2">
              <Search className="w-4 h-4 mr-2" />
              Búsqueda
            </TabsTrigger>
            <TabsTrigger value="stocks" className="py-2">
              <Warehouse className="w-4 h-4 mr-2" />
              Stocks
            </TabsTrigger>
            <TabsTrigger value="movimientos" className="py-2">
              <TrendingUp className="w-4 h-4 mr-2" />
              Movimientos
            </TabsTrigger>
            <TabsTrigger value="planilla01" className="py-2">
              <ClipboardList className="w-4 h-4 mr-2" />
              Planilla 01
            </TabsTrigger>
            <TabsTrigger value="romaneos" className="py-2">
              <FileText className="w-4 h-4 mr-2" />
              Romaneos
            </TabsTrigger>
          </TabsList>

          {/* TAB: BÚSQUEDA POR FILTRO */}
          <TabsContent value="busqueda">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50">
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-amber-500" />
                  Búsqueda por Filtro
                </CardTitle>
                <CardDescription>Búsqueda avanzada en todo el sistema</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar por código, tropa, garrón, caravana, cliente..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="h-12 text-lg"
                    />
                  </div>
                  <Select value={tipoBusqueda} onValueChange={setTipoBusqueda}>
                    <SelectTrigger className="w-48 h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tropas">Tropas</SelectItem>
                      <SelectItem value="animales">Animales</SelectItem>
                      <SelectItem value="romaneos">Romaneos</SelectItem>
                      <SelectItem value="medias">Medias Res</SelectItem>
                      <SelectItem value="expediciones">Expediciones</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleBuscar} className="h-12 bg-amber-500 hover:bg-amber-600 px-8" disabled={loadingBusqueda}>
                    {loadingBusqueda ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 mr-2" />}
                    Buscar
                  </Button>
                </div>

                {/* Tips */}
                <div className="flex flex-wrap gap-2 text-sm text-stone-400">
                  <span>Sugerencias:</span>
                  <button onClick={() => setBusqueda('B2026')} className="hover:text-amber-600">B2026</button>
                  <span>•</span>
                  <button onClick={() => setBusqueda('G-CHO')} className="hover:text-amber-600">G-CHO</button>
                  <span>•</span>
                  <button onClick={() => setBusqueda('garron:15')} className="hover:text-amber-600">garron:15</button>
                </div>

                {/* Resultados */}
                {busquedaRealizada && (
                  <div className="mt-4">
                    {resultados.length === 0 ? (
                      <div className="py-12 text-center text-stone-400">
                        <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No se encontraron resultados para "{busqueda}"</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-stone-50">
                            <TableHead className="w-24">Tipo</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Fecha</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {resultados.map((r, idx) => (
                            <TableRow key={`${r.tipo}-${r.id}-${idx}`} className="hover:bg-stone-50 cursor-pointer">
                              <TableCell>
                                <Badge className={getTipoColor(r.tipo)}>
                                  <span className="flex items-center gap-1">
                                    {getTipoIcon(r.tipo)}
                                    {getTipoLabel(r.tipo)}
                                  </span>
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono font-medium">{r.codigo}</TableCell>
                              <TableCell>
                                <p className="font-medium text-stone-800">{r.descripcion}</p>
                                {r.datos && Object.keys(r.datos).length > 0 && (
                                  <p className="text-xs text-stone-400 mt-1">
                                    {Object.entries(r.datos).slice(0, 3).map(([k, v]) => (
                                      <span key={k} className="mr-3">{k}: {String(v)}</span>
                                    ))}
                                  </p>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-stone-500">
                                {r.fecha ? new Date(r.fecha).toLocaleDateString('es-AR') : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: STOCKS */}
          <TabsContent value="stocks">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-stone-50 flex flex-row items-center justify-between">
                  <CardTitle>Stock por Cámara</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportarCSV('stock')}>
                    <Download className="w-4 h-4 mr-1" /> CSV
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {stockCamaras.length === 0 ? (
                    <div className="p-8 text-center text-stone-400">
                      <Warehouse className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No hay datos de stock</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cámara</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Medias</TableHead>
                          <TableHead className="text-right">Peso (kg)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockCamaras.map((s, i) => (
                          <TableRow key={i}>
                            <TableCell>{s.camara}</TableCell>
                            <TableCell><Badge variant="outline">{s.tipo}</Badge></TableCell>
                            <TableCell className="text-right">{s.totalMedias}</TableCell>
                            <TableCell className="text-right">{s.pesoTotal.toLocaleString('es-AR')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader className="bg-stone-50">
                  <CardTitle>Faena Diaria</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {faenaDiaria.length === 0 ? (
                    <div className="p-8 text-center text-stone-400">
                      <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No hay datos de faena</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-right">Animales</TableHead>
                          <TableHead className="text-right">Medias</TableHead>
                          <TableHead className="text-right">Peso (kg)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {faenaDiaria.slice(0, 10).map((dia, i) => (
                          <TableRow key={i}>
                            <TableCell>{new Date(dia.fecha).toLocaleDateString('es-AR')}</TableCell>
                            <TableCell className="text-right font-bold">{dia.totalAnimales}</TableCell>
                            <TableCell className="text-right">{dia.totalMedias}</TableCell>
                            <TableCell className="text-right">{dia.pesoTotal.toLocaleString('es-AR')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: MOVIMIENTOS */}
          <TabsContent value="movimientos">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 flex flex-row items-center justify-between">
                <CardTitle>Rendimiento por Tropa</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportarCSV('rendimiento')}>
                  <Download className="w-4 h-4 mr-1" /> CSV
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {rendimientos.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay datos de rendimiento</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tropa</TableHead>
                        <TableHead>Productor</TableHead>
                        <TableHead className="text-right">Cabezas</TableHead>
                        <TableHead className="text-right">Peso Vivo (kg)</TableHead>
                        <TableHead className="text-right">Peso Media (kg)</TableHead>
                        <TableHead className="text-right">Rinde %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rendimientos.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono">{r.tropaCodigo}</TableCell>
                          <TableCell>{r.productor?.nombre || '-'}</TableCell>
                          <TableCell className="text-right">{r.cantidad}</TableCell>
                          <TableCell className="text-right">{r.pesoVivoTotal.toLocaleString('es-AR')}</TableCell>
                          <TableCell className="text-right">{r.pesoMediaTotal.toLocaleString('es-AR')}</TableCell>
                          <TableCell className="text-right">
                            <Badge className={r.rinde >= 55 ? 'bg-green-100 text-green-700' : r.rinde >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                              {r.rinde.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: PLANILLA 01 */}
          <TabsContent value="planilla01">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-0 shadow-md lg:col-span-1">
                <CardHeader className="bg-stone-50">
                  <CardTitle className="text-lg">Seleccionar Tropa</CardTitle>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input placeholder="Buscar..." value={busquedaTropa} onChange={(e) => setBusquedaTropa(e.target.value)} className="pl-9" />
                  </div>
                </CardHeader>
                <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                  {tropasFiltradas.length === 0 ? (
                    <div className="p-8 text-center text-stone-400">No hay tropas</div>
                  ) : (
                    <div className="divide-y">
                      {tropasFiltradas.slice(0, 20).map((tropa) => (
                        <button key={tropa.id} onClick={() => handleSeleccionarTropa(tropa.id)}
                          className={`w-full p-4 text-left hover:bg-stone-50 transition-colors ${tropaSeleccionada?.id === tropa.id ? 'bg-amber-50 border-l-4 border-amber-500' : ''}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-stone-800">{tropa.codigo}</p>
                              <p className="text-sm text-stone-500">{tropa.productor?.nombre || tropa.usuarioFaena?.nombre}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline">{tropa.cantidadCabezas} cab.</Badge>
                              <p className="text-xs text-stone-400 mt-1">{new Date(tropa.fechaRecepcion).toLocaleDateString('es-AR')}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md lg:col-span-2">
                <CardHeader className="bg-stone-50 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2"><Eye className="w-5 h-5" />Vista Previa Planilla 01</CardTitle>
                  {tropaSeleccionada && (
                    <Button onClick={handleGenerarPDF} disabled={generando !== null} className="bg-red-600 hover:bg-red-700">
                      {generando === 'pdf' ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                      Generar PDF
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-6">
                  {!tropaSeleccionada ? (
                    <div className="text-center py-12 text-stone-400">
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Seleccione una tropa para ver la planilla</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="border-2 border-stone-300 rounded-lg p-4 bg-white">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-amber-500" />
                              <span className="font-semibold">Solemar Alimentaria S.A.</span>
                            </div>
                            <div className="text-stone-600"><span className="font-medium">N° SENASA:</span> 3986</div>
                            <div className="text-stone-600"><span className="font-medium">Matrícula:</span> 300</div>
                          </div>
                          <div className="space-y-1 text-right">
                            <Badge className="bg-amber-100 text-amber-800">PLANILLA 01 - BOVINO</Badge>
                            <div className="text-stone-600"><span className="font-medium">Semana:</span> {getSemana(tropaSeleccionada.fechaRecepcion)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded-lg p-3 bg-white space-y-1">
                          <h4 className="font-semibold text-stone-700 text-sm"><User className="w-4 h-4 text-amber-500 inline mr-1" />Productor</h4>
                          <p className="text-sm">{tropaSeleccionada.productor?.nombre || '-'}</p>
                          <p className="text-xs text-stone-500">CUIT: {tropaSeleccionada.productor?.cuit || '-'}</p>
                        </div>
                        <div className="border rounded-lg p-3 bg-white space-y-1">
                          <h4 className="font-semibold text-stone-700 text-sm"><Truck className="w-4 h-4 text-amber-500 inline mr-1" />Transporte</h4>
                          <p className="text-sm">{tropaSeleccionada.pesajeCamion?.transportista?.nombre || '-'}</p>
                          <p className="text-xs text-stone-500">Patente: {tropaSeleccionada.pesajeCamion?.patenteChasis || '-'}</p>
                        </div>
                      </div>

                      <div className="border rounded-lg overflow-hidden bg-white">
                        <div className="bg-stone-100 px-4 py-2 border-b">
                          <h4 className="font-semibold text-stone-700 text-sm">Animales ({tropaSeleccionada.animales?.length || 0})</h4>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-stone-50">
                              <TableHead className="w-12 text-center">N°</TableHead>
                              <TableHead className="text-center">Tipo</TableHead>
                              <TableHead>Caravana</TableHead>
                              <TableHead className="text-right">Peso (kg)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tropaSeleccionada.animales?.slice(0, 10).map((animal, idx) => (
                              <TableRow key={animal.id}>
                                <TableCell className="text-center">{animal.numero || idx + 1}</TableCell>
                                <TableCell className="text-center"><Badge variant="outline" className="text-xs">{TIPOS_ANIMAL_LABELS[animal.tipoAnimal] || animal.tipoAnimal}</Badge></TableCell>
                                <TableCell className="font-mono text-sm">{animal.caravana || '-'}</TableCell>
                                <TableCell className="text-right">{animal.pesoVivo?.toFixed(0) || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: ROMANEOS DE FAENA */}
          <TabsContent value="romaneos">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 flex flex-row items-center justify-between">
                <CardTitle>Romaneos de Faena</CardTitle>
                <div className="flex gap-2 items-center">
                  <Input placeholder="Filtrar por tropa..." value={filtroTropa} onChange={(e) => setFiltroTropa(e.target.value)} className="w-40" />
                  <Button variant="outline" size="sm" onClick={() => exportarCSV('romaneos')}>
                    <Download className="w-4 h-4 mr-1" /> CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {romaneosFiltrados.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay romaneos registrados</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tropa</TableHead>
                        <TableHead className="text-center">Garrón</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Peso Vivo</TableHead>
                        <TableHead className="text-right">Peso Total</TableHead>
                        <TableHead className="text-right">Rinde %</TableHead>
                        <TableHead>Tipificador</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {romaneosFiltrados.slice(0, 50).map((r) => (
                        <TableRow key={r.id} className="hover:bg-stone-50">
                          <TableCell>{new Date(r.fecha).toLocaleDateString('es-AR')}</TableCell>
                          <TableCell className="font-mono">{r.tropaCodigo}</TableCell>
                          <TableCell className="text-center font-bold">{r.garron}</TableCell>
                          <TableCell><Badge variant="outline">{TIPOS_ANIMAL_LABELS[r.tipoAnimal || ''] || r.tipoAnimal || '-'}</Badge></TableCell>
                          <TableCell className="text-right">{r.pesoVivo?.toFixed(0) || '-'}</TableCell>
                          <TableCell className="text-right">{r.pesoTotal?.toFixed(1) || '-'}</TableCell>
                          <TableCell className="text-right">
                            {r.rinde ? (
                              <Badge className={r.rinde >= 55 ? 'bg-green-100 text-green-700' : r.rinde >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                                {r.rinde.toFixed(1)}%
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>{r.tipificador?.nombre || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default ReportesModule
