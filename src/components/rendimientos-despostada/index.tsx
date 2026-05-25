// NOTA: Componente disponible para uso futuro - verificar antes de eliminar
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, Loader2, RefreshCw, TrendingUp, TrendingDown, 
  Package, Scissors, AlertTriangle, CheckCircle
} from 'lucide-react'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

// Interfaces
interface LoteRendimiento {
  id: string
  numero: number
  anio: number
  fecha: string
  fechaCierre?: string
  estado: string
  kgIngresados: number
  kgProducidos: number
  kgMermas: number
  rendimiento?: number
  tropasCodigos?: string
  operador?: {
    id: string
    nombre: string
  }
}

interface MermaDetalle {
  tipo: string
  pesoKg: number
  porcentaje: number
}

interface StatsRendimiento {
  totalLotes: number
  lotesAbiertos: number
  lotesCerrados: number
  kgTotalIngresados: number
  kgTotalProducidos: number
  kgTotalMermas: number
  rendimientoPromedio: number
  mermaPromedio: number
}

interface Operador {
  id: string
  nombre: string
  rol: string
  permisos?: Record<string, boolean>
}

interface Props {
  operador: Operador
}

const TIPOS_MERMA = [
  { id: 'HUESO', label: 'Hueso', color: 'bg-gray-100 text-gray-700' },
  { id: 'GRASA', label: 'Grasa', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'INCOMESTIBLE', label: 'Incomestible', color: 'bg-red-100 text-red-700' },
  { id: 'RECORTES', label: 'Recortes', color: 'bg-orange-100 text-orange-700' },
  { id: 'OTRO', label: 'Otro', color: 'bg-stone-100 text-stone-700' },
]

export function RendimientosDespostadaModule({ operador }: Props) {
  const { editMode, getTexto } = useEditor()
  const [loading, setLoading] = useState(true)
  const [lotes, setLotes] = useState<LoteRendimiento[]>([])
  
  // Filtros
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear().toString())
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  
  // Stats
  const [stats, setStats] = useState<StatsRendimiento>({
    totalLotes: 0,
    lotesAbiertos: 0,
    lotesCerrados: 0,
    kgTotalIngresados: 0,
    kgTotalProducidos: 0,
    kgTotalMermas: 0,
    rendimientoPromedio: 0,
    mermaPromedio: 0
  })

  // Mermas desglose
  const [mermasDesglose, setMermasDesglose] = useState<MermaDetalle[]>([])

  // Años disponibles
  const anios = [
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
    new Date().getFullYear() - 2
  ]

  // Cargar datos
  useEffect(() => {
    fetchData()
  }, [filtroAnio])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Cargar lotes
      const resLotes = await fetch('/api/lote-despostada')
      const dataLotes = await resLotes.json()
      
      if (dataLotes.success) {
        // Filtrar por año si se especifica
        const lotesFiltrados = filtroAnio 
          ? dataLotes.data.filter((l: LoteRendimiento) => l.anio === parseInt(filtroAnio))
          : dataLotes.data
        
        setLotes(lotesFiltrados)
        
        // Calcular stats
        const cerrados = lotesFiltrados.filter((l: LoteRendimiento) => l.estado === 'CERRADO')
        const abiertos = lotesFiltrados.filter((l: LoteRendimiento) => l.estado === 'ABIERTO')
        
        const kgIngresados = lotesFiltrados.reduce((acc: number, l: LoteRendimiento) => acc + l.kgIngresados, 0)
        const kgProducidos = lotesFiltrados.reduce((acc: number, l: LoteRendimiento) => acc + l.kgProducidos, 0)
        const kgMermas = lotesFiltrados.reduce((acc: number, l: LoteRendimiento) => acc + l.kgMermas, 0)
        
        const rendimientoPromedio = kgIngresados > 0 
          ? (kgProducidos / kgIngresados) * 100 
          : 0
        
        const mermaPromedio = kgIngresados > 0 
          ? (kgMermas / kgIngresados) * 100 
          : 0
        
        setStats({
          totalLotes: lotesFiltrados.length,
          lotesAbiertos: abiertos.length,
          lotesCerrados: cerrados.length,
          kgTotalIngresados: kgIngresados,
          kgTotalProducidos: kgProducidos,
          kgTotalMermas: kgMermas,
          rendimientoPromedio,
          mermaPromedio
        })
      }

      // Cargar mermas
      const resMermas = await fetch('/api/merma-despostada')
      const dataMermas = await resMermas.json()
      
      if (dataMermas.success) {
        const mermasAgrupadas: Record<string, number> = {}
        let totalMermas = 0
        
        dataMermas.data.forEach((m: { tipo: string; pesoKg: number }) => {
          if (!mermasAgrupadas[m.tipo]) mermasAgrupadas[m.tipo] = 0
          mermasAgrupadas[m.tipo] += m.pesoKg
          totalMermas += m.pesoKg
        })
        
        const desglose = Object.entries(mermasAgrupadas).map(([tipo, peso]) => ({
          tipo,
          pesoKg: peso,
          porcentaje: totalMermas > 0 ? (peso / totalMermas) * 100 : 0
        })).sort((a, b) => b.pesoKg - a.pesoKg)
        
        setMermasDesglose(desglose)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Formatear peso
  const formatPeso = (kg: number) => `${kg.toFixed(2)} kg`

  // Formatear porcentaje
  const formatPorcentaje = (pct: number) => `${pct.toFixed(1)}%`

  // Badge de estado
  const getEstadoBadge = (estado: string) => {
    if (estado === 'ABIERTO') {
      return <Badge className="bg-blue-100 text-blue-700">Abierto</Badge>
    }
    if (estado === 'CERRADO') {
      return <Badge className="bg-green-100 text-green-700">Cerrado</Badge>
    }
    return <Badge className="bg-red-100 text-red-700">Anulado</Badge>
  }

  // Badge de rendimiento
  const getRendimientoBadge = (rendimiento?: number) => {
    if (!rendimiento) return '-'
    
    if (rendimiento >= 70) {
      return (
        <div className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="font-medium text-green-600">{formatPorcentaje(rendimiento)}</span>
        </div>
      )
    }
    if (rendimiento >= 60) {
      return (
        <div className="flex items-center gap-1">
          <span className="font-medium text-yellow-600">{formatPorcentaje(rendimiento)}</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1">
        <TrendingDown className="w-4 h-4 text-red-500" />
        <span className="font-medium text-red-600">{formatPorcentaje(rendimiento)}</span>
      </div>
    )
  }

  // Badge de tipo de merma
  const getMermaBadge = (tipo: string) => {
    const info = TIPOS_MERMA.find(t => t.id === tipo)
    return (
      <Badge className={info?.color || 'bg-gray-100'}>
        {info?.label || tipo}
      </Badge>
    )
  }

  // Filtrar lotes
  const lotesFiltrados = lotes.filter(l => {
    if (filtroEstado !== 'TODOS' && l.estado !== filtroEstado) return false
    return true
  })

  // Calcular color de barra de rendimiento
  const getRendimientoColor = (pct: number) => {
    if (pct >= 70) return 'bg-green-500'
    if (pct >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-amber-500" />
                <TextoEditable id="rendimientos-titulo" original="Rendimientos Despostada" tag="span" />
              </h1>
              <p className="text-stone-500 mt-1">
                <TextoEditable id="rendimientos-subtitulo" original="Análisis de rendimiento y mermas por lote" tag="span" />
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchData} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>
        </EditableBlock>

        {/* Stats principales */}
        <EditableBlock bloqueId="stats" label="Estadísticas">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Total Lotes</p>
                    <p className="text-xl font-bold">{stats.totalLotes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <Scissors className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">KG Ingresados</p>
                    <p className="text-xl font-bold">{formatPeso(stats.kgTotalIngresados)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">KG Producidos</p>
                    <p className="text-xl font-bold">{formatPeso(stats.kgTotalProducidos)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">KG Mermas</p>
                    <p className="text-xl font-bold">{formatPeso(stats.kgTotalMermas)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </EditableBlock>

        {/* Rendimiento y Merma promedio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg pb-2">
              <CardTitle className="text-lg">Rendimiento Promedio</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-green-600">
                  {formatPorcentaje(stats.rendimientoPromedio)}
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getRendimientoColor(stats.rendimientoPromedio)} transition-all`}
                      style={{ width: `${Math.min(stats.rendimientoPromedio, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-stone-400 mt-1">
                    <span>0%</span>
                    <span>Meta: 70%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-stone-500 mt-2">
                {stats.rendimientoPromedio >= 70 
                  ? '✓ Rendimiento excelente' 
                  : stats.rendimientoPromedio >= 60 
                    ? '⚠ Rendimiento aceptable'
                    : '✗ Rendimiento bajo - revisar mermas'
                }
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg pb-2">
              <CardTitle className="text-lg">Merma Promedio</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-orange-600">
                  {formatPorcentaje(stats.mermaPromedio)}
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-400 transition-all"
                      style={{ width: `${Math.min(stats.mermaPromedio, 50)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-stone-400 mt-1">
                    <span>0%</span>
                    <span>Aceptable: &lt;25%</span>
                    <span>50%</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-stone-500 mt-2">
                {stats.mermaPromedio <= 25 
                  ? '✓ Merma dentro de parámetros normales' 
                  : '⚠ Merma elevada - revisar proceso'
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="lotes" className="space-y-4">
          <TabsList className="bg-stone-100">
            <TabsTrigger value="lotes">Por Lote</TabsTrigger>
            <TabsTrigger value="mermas">Desglose Mermas</TabsTrigger>
          </TabsList>

          <TabsContent value="lotes" className="space-y-4">
            {/* Filtros */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-40">
                    <Label className="text-xs">Año</Label>
                    <Select value={filtroAnio} onValueChange={(v) => { setFiltroAnio(v); fetchData(); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {anios.map(a => (
                          <SelectItem key={a} value={a.toString()}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-40">
                    <Label className="text-xs">Estado</Label>
                    <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODOS">Todos</SelectItem>
                        <SelectItem value="ABIERTO">Abiertos</SelectItem>
                        <SelectItem value="CERRADO">Cerrados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de lotes */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-500" />
                  Rendimiento por Lote
                </CardTitle>
                <CardDescription>
                  {lotesFiltrados.length} lotes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  </div>
                ) : lotesFiltrados.length === 0 ? (
                  <div className="py-12 text-center text-stone-400">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No hay lotes para mostrar</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-stone-50/50">
                          <TableHead>Lote</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-right">KG Ingresados</TableHead>
                          <TableHead className="text-right">KG Producidos</TableHead>
                          <TableHead className="text-right">KG Mermas</TableHead>
                          <TableHead className="text-right">Rendimiento</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lotesFiltrados.map((lote) => (
                          <TableRow key={lote.id} className="hover:bg-stone-50">
                            <TableCell className="font-bold">
                              {lote.numero}/{lote.anio}
                            </TableCell>
                            <TableCell>{new Date(lote.fecha).toLocaleDateString('es-AR')}</TableCell>
                            <TableCell className="text-right">{formatPeso(lote.kgIngresados)}</TableCell>
                            <TableCell className="text-right font-medium">{formatPeso(lote.kgProducidos)}</TableCell>
                            <TableCell className="text-right text-orange-600">{formatPeso(lote.kgMermas)}</TableCell>
                            <TableCell className="text-right">
                              {getRendimientoBadge(lote.rendimiento)}
                            </TableCell>
                            <TableCell>{getEstadoBadge(lote.estado)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mermas" className="space-y-4">
            {/* Desglose de mermas */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-orange-500" />
                  Desglose de Mermas por Tipo
                </CardTitle>
                <CardDescription>
                  Distribución del peso perdido en el proceso
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {mermasDesglose.length === 0 ? (
                  <div className="py-12 text-center text-stone-400">
                    <TrendingDown className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No hay mermas registradas</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50/50">
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Peso (KG)</TableHead>
                        <TableHead className="text-right">Porcentaje</TableHead>
                        <TableHead className="w-48">Distribución</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mermasDesglose.map((merma, index) => (
                        <TableRow key={index}>
                          <TableCell>{getMermaBadge(merma.tipo)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatPeso(merma.pesoKg)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPorcentaje(merma.porcentaje)}
                          </TableCell>
                          <TableCell>
                            <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-orange-400 transition-all"
                                style={{ width: `${merma.porcentaje}%` }}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Resumen visual */}
            {mermasDesglose.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-stone-50 rounded-t-lg pb-2">
                  <CardTitle className="text-lg">Resumen de Pérdidas</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {mermasDesglose.slice(0, 4).map((merma, index) => (
                      <div key={index} className="p-3 bg-stone-50 rounded-lg">
                        {getMermaBadge(merma.tipo)}
                        <p className="text-2xl font-bold mt-2">{formatPeso(merma.pesoKg)}</p>
                        <p className="text-xs text-stone-500">{formatPorcentaje(merma.porcentaje)} del total</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default RendimientosDespostadaModule
