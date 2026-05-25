'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RefreshCw, TrendingUp, Package, Beef, Warehouse, Download, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { ExcelExporter } from '@/lib/export-excel'
import { PDFExporter } from '@/lib/export-pdf'

interface BalanceData {
  totalAnimales: number
  totalPesoVivo: number
  totalPesoCanal: number
  rindePromedio: number
  medias: { enCamara: number; enCuarteo: number; despachadas: number }
  menudencias: { cantidad: number; pesoIngreso: number; pesoElaborado: number }
  cueros: { cantidad: number; pesoKg: number }
  rendering: { cantidad: number; pesoKg: number }
  tropasProcesadas: number
}

export function ReporteBalanceFaena() {
  const [data, setData] = useState<BalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (fecha) params.append('fecha', fecha)
      if (fechaDesde) params.append('fechaDesde', fechaDesde)
      if (fechaHasta) params.append('fechaHasta', fechaHasta)
      const res = await fetch(`/api/reportes/balance-faena?${params.toString()}`)
      const json = await res.json()
      if (json.success) setData(json.data)
      else toast.error('Error al cargar balance de faena')
    } catch (error) {
      console.error(error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const exportarExcel = () => {
    if (!data) return
    const dateStr = new Date().toISOString().split('T')[0]
    ExcelExporter.exportToExcel({
      filename: `balance_faena_${dateStr}`,
      sheets: [
        {
          name: 'Resumen General',
          headers: ['Indicador', 'Valor'],
          data: [
            ['Total Animales', data.totalAnimales.toString()],
            ['Peso Vivo Total (kg)', data.totalPesoVivo.toLocaleString('es-AR')],
            ['Peso Canal Total (kg)', data.totalPesoCanal.toLocaleString('es-AR')],
            ['Rinde Promedio (%)', data.rindePromedio.toString()],
            ['Tropas Procesadas', data.tropasProcesadas.toString()],
          ]
        },
        {
          name: 'Medias Reses',
          headers: ['Estado', 'Cantidad'],
          data: [
            ['En Cámara', data.medias.enCamara.toString()],
            ['En Cuarteo', data.medias.enCuarteo.toString()],
            ['Despachadas', data.medias.despachadas.toString()],
          ]
        },
        {
          name: 'Subproductos',
          headers: ['Categoría', 'Cantidad', 'Peso (kg)'],
          data: [
            ['Menudencias (ingreso)', data.menudencias.cantidad.toString(), data.menudencias.pesoIngreso.toLocaleString('es-AR')],
            ['Menudencias (elaborado)', data.menudencias.cantidad.toString(), data.menudencias.pesoElaborado.toLocaleString('es-AR')],
            ['Cueros', data.cueros.cantidad.toString(), data.cueros.pesoKg.toLocaleString('es-AR')],
            ['Rendering', data.rendering.cantidad.toString(), data.rendering.pesoKg.toLocaleString('es-AR')],
          ]
        }
      ],
      title: 'Balance de Faena - Solemar Alimentaria'
    })
    toast.success('Excel descargado')
  }

  const exportarPDF = () => {
    if (!data) return
    const dateStr = new Date().toISOString().split('T')[0]
    const headers = ['Indicador', 'Valor']
    const rows = [
      ['Total Animales', data.totalAnimales.toString()],
      ['Peso Vivo Total (kg)', data.totalPesoVivo.toLocaleString('es-AR')],
      ['Peso Canal Total (kg)', data.totalPesoCanal.toLocaleString('es-AR')],
      ['Rinde Promedio (%)', data.rindePromedio.toString()],
      ['Tropas Procesadas', data.tropasProcesadas.toString()],
      ['Medias En Cámara', data.medias.enCamara.toString()],
      ['Medias En Cuarteo', data.medias.enCuarteo.toString()],
      ['Medias Despachadas', data.medias.despachadas.toString()],
      ['Menudencias (cantidad)', data.menudencias.cantidad.toString()],
      ['Menudencias Peso Ingreso (kg)', data.menudencias.pesoIngreso.toLocaleString('es-AR')],
      ['Menudencias Peso Elaborado (kg)', data.menudencias.pesoElaborado.toLocaleString('es-AR')],
      ['Cueros (cantidad)', data.cueros.cantidad.toString()],
      ['Cueros Peso (kg)', data.cueros.pesoKg.toLocaleString('es-AR')],
      ['Rendering (cantidad)', data.rendering.cantidad.toString()],
      ['Rendering Peso (kg)', data.rendering.pesoKg.toLocaleString('es-AR')],
    ]
    const doc = PDFExporter.generateReport({ title: 'Balance de Faena - Solemar Alimentaria', headers, data: rows, orientation: 'portrait' })
    PDFExporter.downloadPDF(doc, `balance_faena_${dateStr}.pdf`)
    toast.success('PDF descargado')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 animate-pulse text-amber-500" />
      </div>
    )
  }

  if (!data) {
    return <div className="p-8 text-center text-stone-400">No hay datos disponibles</div>
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label className="text-xs text-stone-500">Fecha</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs text-stone-500">Desde</Label>
              <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs text-stone-500">Hasta</Label>
              <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="h-9" />
            </div>
            <Button onClick={fetchData} size="sm" className="bg-amber-500 hover:bg-amber-600">
              <RefreshCw className="w-4 h-4 mr-1" /> Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={exportarExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar Excel
        </Button>
        <Button variant="outline" size="sm" onClick={exportarPDF}>
          <Download className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 text-center">
            <Beef className="w-6 h-6 mx-auto text-amber-600 mb-1" />
            <p className="text-xs text-amber-600">Total Animales</p>
            <p className="text-2xl font-bold text-amber-800">{data.totalAnimales}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto text-blue-600 mb-1" />
            <p className="text-xs text-blue-600">Rinde Promedio</p>
            <p className="text-2xl font-bold text-blue-800">{data.rindePromedio}%</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <Package className="w-6 h-6 mx-auto text-green-600 mb-1" />
            <p className="text-xs text-green-600">Peso Vivo Total</p>
            <p className="text-2xl font-bold text-green-800">{data.totalPesoVivo.toLocaleString('es-AR')} kg</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Warehouse className="w-6 h-6 mx-auto text-purple-600 mb-1" />
            <p className="text-xs text-purple-600">Peso Canal Total</p>
            <p className="text-2xl font-bold text-purple-800">{data.totalPesoCanal.toLocaleString('es-AR')} kg</p>
          </CardContent>
        </Card>
      </div>

      {/* Detalle por categoría */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 pb-2">
            <CardTitle className="text-sm">Medias Reses</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between"><span className="text-stone-500">En Cámara</span><Badge>{data.medias.enCamara}</Badge></div>
            <div className="flex justify-between"><span className="text-stone-500">En Cuarteo</span><Badge>{data.medias.enCuarteo}</Badge></div>
            <div className="flex justify-between"><span className="text-stone-500">Despachadas</span><Badge>{data.medias.despachadas}</Badge></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 pb-2">
            <CardTitle className="text-sm">Menudencias</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between"><span className="text-stone-500">Cantidad</span><Badge>{data.menudencias.cantidad}</Badge></div>
            <div className="flex justify-between"><span className="text-stone-500">Peso Ingreso</span><Badge>{data.menudencias.pesoIngreso.toLocaleString('es-AR')} kg</Badge></div>
            <div className="flex justify-between"><span className="text-stone-500">Peso Elaborado</span><Badge>{data.menudencias.pesoElaborado.toLocaleString('es-AR')} kg</Badge></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 pb-2">
            <CardTitle className="text-sm">Cueros</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between"><span className="text-stone-500">Cantidad</span><Badge>{data.cueros.cantidad}</Badge></div>
            <div className="flex justify-between"><span className="text-stone-500">Peso Total</span><Badge>{data.cueros.pesoKg.toLocaleString('es-AR')} kg</Badge></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 pb-2">
            <CardTitle className="text-sm">Rendering</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between"><span className="text-stone-500">Cantidad</span><Badge>{data.rendering.cantidad}</Badge></div>
            <div className="flex justify-between"><span className="text-stone-500">Peso Total</span><Badge>{data.rendering.pesoKg.toLocaleString('es-AR')} kg</Badge></div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <p className="text-sm text-stone-500">Tropas procesadas en el período: <span className="font-bold text-stone-800">{data.tropasProcesadas}</span></p>
        </CardContent>
      </Card>
    </div>
  )
}
