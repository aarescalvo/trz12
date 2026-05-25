'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  PieChart, TrendingUp, TrendingDown, Calendar, Search, Loader2, 
  Download, BarChart3, ArrowUpRight, ArrowDownRight, Target
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface RindeData {
  resumen: {
    totalAnimales: number
    totalPesoVivo: number
    totalPesoCanal: number
    rindeGeneral: number
    promedioPesoVivo: number
    promedioPesoCanal: number
  }
  porTropa: Array<{
    tropaCodigo: string
    cantidad: number
    pesoVivo: number
    pesoCanal: number
    rinde: number
  }>
  porTipoAnimal: Array<{
    tipoAnimal: string
    cantidad: number
    pesoVivo: number
    pesoCanal: number
    rinde: number
  }>
  porFecha: Array<{
    fecha: string
    cantidad: number
    pesoVivo: number
    pesoCanal: number
    rinde: number
  }>
  mejores: Array<{
    garron: number
    tropaCodigo: string
    tipoAnimal: string
    pesoVivo: number
    pesoCanal: number
    rinde: number
  }>
  peores: Array<{
    garron: number
    tropaCodigo: string
    tipoAnimal: string
    pesoVivo: number
    pesoCanal: number
    rinde: number
  }>
}

interface Props {
  operador: Operador
}

const TIPOS_ANIMAL_LABELS: Record<string, string> = {
  'TO': 'TORO',
  'VA': 'VACA',
  'VQ': 'VAQUILLONA',
  'MEJ': 'MEJ',
  'NO': 'NOVILLO',
  'NT': 'NOVILLITO',
}

export function RindesTropaModule({ operador }: Props) {
  const [data, setData] = useState<RindeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fechaDesde, setFechaDesde] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [fechaHasta, setFechaHasta] = useState(() => new Date().toISOString().split('T')[0])
  const [tropaFiltro, setTropaFiltro] = useState('')
  const [tropas, setTropas] = useState<Array<{codigo: string}>>([])

  useEffect(() => {
    fetchTropas()
    fetchData()
  }, [])

  const fetchTropas = async () => {
    try {
      const res = await fetch('/api/tropas')
      const result = await res.json()
      if (result.success) {
        setTropas(result.data.map((t: {codigo: string}) => ({ codigo: t.codigo })))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('fechaDesde', fechaDesde)
      params.append('fechaHasta', fechaHasta)
      if (tropaFiltro) params.append('tropaCodigo', tropaFiltro)

      const res = await fetch(`/api/reportes/rendimiento?${params}`)
      const result = await res.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos de rindes')
    } finally {
      setLoading(false)
    }
  }

  const handleBuscar = () => {
    fetchData()
  }

  const exportarCSV = () => {
    if (!data) return
    
    let csv = 'Análisis de Rindes por Tropa\n\n'
    csv += 'RESUMEN GENERAL\n'
    csv += `Total Animales,${data.resumen.totalAnimales}\n`
    csv += `Total Peso Vivo (kg),${data.resumen.totalPesoVivo.toFixed(1)}\n`
    csv += `Total Peso Canal (kg),${data.resumen.totalPesoCanal.toFixed(1)}\n`
    csv += `Rinde General (%),${data.resumen.rindeGeneral.toFixed(2)}\n\n`
    
    csv += 'RINDE POR TROPA\n'
    csv += 'Tropa,Cantidad,Peso Vivo,Peso Canal,Rinde %\n'
    data.porTropa.forEach(t => {
      csv += `${t.tropaCodigo},${t.cantidad},${t.pesoVivo.toFixed(1)},${t.pesoCanal.toFixed(1)},${t.rinde.toFixed(2)}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rindes_${fechaDesde}_${fechaHasta}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getRindeColor = (rinde: number) => {
    if (rinde >= 57) return 'text-emerald-600'
    if (rinde >= 54) return 'text-amber-600'
    return 'text-red-600'
  }

  const getRindeBadge = (rinde: number) => {
    if (rinde >= 57) return 'bg-emerald-100 text-emerald-700'
    if (rinde >= 54) return 'bg-amber-100 text-amber-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <PieChart className="w-8 h-8 text-amber-500" />
              Rindes por Tropa
            </h1>
            <p className="text-stone-500 mt-1">Análisis de rendimiento de faena por tropa</p>
          </div>
          <Button onClick={exportarCSV} disabled={!data} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="space-y-2">
                <Label>Fecha Desde</Label>
                <Input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Hasta</Label>
                <Input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label>Tropa (opcional)</Label>
                <Select value={tropaFiltro} onValueChange={setTropaFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las tropas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todas las tropas</SelectItem>
                    {tropas.map((t) => (
                      <SelectItem key={t.codigo} value={t.codigo}>{t.codigo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleBuscar} className="bg-amber-500 hover:bg-amber-600">
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : !data ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center text-stone-400">
              <PieChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No hay datos disponibles</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Resumen General */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <p className="text-xs text-stone-500 uppercase">Total Animales</p>
                  <p className="text-2xl font-bold text-stone-800">{data.resumen.totalAnimales}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <p className="text-xs text-stone-500 uppercase">Peso Vivo Total</p>
                  <p className="text-2xl font-bold text-stone-800">{data.resumen.totalPesoVivo.toFixed(0)} kg</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <p className="text-xs text-stone-500 uppercase">Peso Canal Total</p>
                  <p className="text-2xl font-bold text-stone-800">{data.resumen.totalPesoCanal.toFixed(0)} kg</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <p className="text-xs text-stone-500 uppercase">Rinde General</p>
                  <p className={`text-2xl font-bold ${getRindeColor(data.resumen.rindeGeneral)}`}>
                    {data.resumen.rindeGeneral.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <p className="text-xs text-stone-500 uppercase">Promedio/Animal</p>
                  <p className="text-2xl font-bold text-stone-800">{data.resumen.promedioPesoCanal.toFixed(1)} kg</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs de análisis */}
            <Tabs defaultValue="tropas" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 gap-1">
                <TabsTrigger value="tropas">Por Tropa</TabsTrigger>
                <TabsTrigger value="tipos">Por Tipo</TabsTrigger>
                <TabsTrigger value="fechas">Por Fecha</TabsTrigger>
                <TabsTrigger value="ranking">Ranking</TabsTrigger>
              </TabsList>

              {/* Por Tropa */}
              <TabsContent value="tropas">
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-stone-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-amber-500" />
                      Rinde por Tropa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-stone-50">
                          <TableHead>Tropa</TableHead>
                          <TableHead className="text-center">Cantidad</TableHead>
                          <TableHead className="text-right">Peso Vivo (kg)</TableHead>
                          <TableHead className="text-right">Peso Canal (kg)</TableHead>
                          <TableHead className="text-right">Rinde %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.porTropa.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-stone-400 py-8">
                              Sin datos
                            </TableCell>
                          </TableRow>
                        ) : (
                          data.porTropa.map((t) => (
                            <TableRow key={t.tropaCodigo}>
                              <TableCell className="font-medium">{t.tropaCodigo}</TableCell>
                              <TableCell className="text-center">{t.cantidad}</TableCell>
                              <TableCell className="text-right">{t.pesoVivo.toFixed(1)}</TableCell>
                              <TableCell className="text-right">{t.pesoCanal.toFixed(1)}</TableCell>
                              <TableCell className="text-right">
                                <Badge className={getRindeBadge(t.rinde)}>
                                  {t.rinde.toFixed(2)}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Por Tipo Animal */}
              <TabsContent value="tipos">
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-stone-50">
                    <CardTitle className="text-lg">Rinde por Tipo de Animal</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-stone-50">
                          <TableHead>Tipo Animal</TableHead>
                          <TableHead className="text-center">Cantidad</TableHead>
                          <TableHead className="text-right">Peso Vivo (kg)</TableHead>
                          <TableHead className="text-right">Peso Canal (kg)</TableHead>
                          <TableHead className="text-right">Rinde %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.porTipoAnimal.map((t) => (
                          <TableRow key={t.tipoAnimal}>
                            <TableCell className="font-medium">
                              {TIPOS_ANIMAL_LABELS[t.tipoAnimal] || t.tipoAnimal}
                            </TableCell>
                            <TableCell className="text-center">{t.cantidad}</TableCell>
                            <TableCell className="text-right">{t.pesoVivo.toFixed(1)}</TableCell>
                            <TableCell className="text-right">{t.pesoCanal.toFixed(1)}</TableCell>
                            <TableCell className="text-right">
                              <Badge className={getRindeBadge(t.rinde)}>
                                {t.rinde.toFixed(2)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Por Fecha */}
              <TabsContent value="fechas">
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-stone-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-500" />
                      Rinde por Fecha
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-stone-50 sticky top-0">
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-center">Cantidad</TableHead>
                            <TableHead className="text-right">Peso Vivo (kg)</TableHead>
                            <TableHead className="text-right">Peso Canal (kg)</TableHead>
                            <TableHead className="text-right">Rinde %</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.porFecha.map((f) => (
                            <TableRow key={f.fecha}>
                              <TableCell className="font-medium">
                                {new Date(f.fecha + 'T12:00:00').toLocaleDateString('es-AR')}
                              </TableCell>
                              <TableCell className="text-center">{f.cantidad}</TableCell>
                              <TableCell className="text-right">{f.pesoVivo.toFixed(1)}</TableCell>
                              <TableCell className="text-right">{f.pesoCanal.toFixed(1)}</TableCell>
                              <TableCell className="text-right">
                                <Badge className={getRindeBadge(f.rinde)}>
                                  {f.rinde.toFixed(2)}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Ranking */}
              <TabsContent value="ranking">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mejores */}
                  <Card className="border-0 shadow-md">
                    <CardHeader className="bg-emerald-50">
                      <CardTitle className="text-lg flex items-center gap-2 text-emerald-700">
                        <ArrowUpRight className="w-5 h-5" />
                        Top 10 Mejores Rindes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Garrón</TableHead>
                            <TableHead>Tropa</TableHead>
                            <TableHead className="text-right">Rinde</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.mejores.map((m, i) => (
                            <TableRow key={i}>
                              <TableCell>{m.garron}</TableCell>
                              <TableCell>{m.tropaCodigo}</TableCell>
                              <TableCell className="text-right">
                                <Badge className="bg-emerald-100 text-emerald-700">
                                  {m.rinde.toFixed(2)}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Peores */}
                  <Card className="border-0 shadow-md">
                    <CardHeader className="bg-red-50">
                      <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                        <ArrowDownRight className="w-5 h-5" />
                        Top 10 Peores Rindes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Garrón</TableHead>
                            <TableHead>Tropa</TableHead>
                            <TableHead className="text-right">Rinde</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.peores.map((p, i) => (
                            <TableRow key={i}>
                              <TableCell>{p.garron}</TableCell>
                              <TableCell>{p.tropaCodigo}</TableCell>
                              <TableCell className="text-right">
                                <Badge className="bg-red-100 text-red-700">
                                  {p.rinde.toFixed(2)}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}

export default RindesTropaModule
