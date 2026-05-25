'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  TrendingUp, BarChart3, PieChart, Loader2, RefreshCw,
  ArrowUpRight, ArrowDownRight, Minus, FileDown, FileSpreadsheet
} from 'lucide-react'
import { ExcelExporter } from '@/lib/export-excel'
import { PDFExporter } from '@/lib/export-pdf'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface RendimientoProducto {
  productoId: string
  productoNombre: string
  productoCodigo: string
  rubroNombre: string
  cantidadCajas: number
  pesoNetoTotal: number
  porcentajeRendimiento: number
}

interface RendimientoGlobal {
  totalIngresado: number
  totalProducido: number
  totalSubproductos: number
  rendimientoGlobal: number
  mermaTotal: number
  porcentajeMerma: number
}

interface RendimientoIngreso {
  ingresoId: string
  tropaCodigo: string
  pesoIngresado: number
  pesoProducido: number
  rendimiento: number
  cantidadCajas: number
  productos: { nombre: string; peso: number }[]
}

export default function C2RendimientoModule({ operador }: { operador: Operador }) {
  const [rendimientoProductos, setRendimientoProductos] = useState<RendimientoProducto[]>([])
  const [rendimientoGlobal, setRendimientoGlobal] = useState<RendimientoGlobal | null>(null)
  const [rendimientoIngresos, setRendimientoIngresos] = useState<RendimientoIngreso[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'productos' | 'ingresos' | 'global'>('global')
  const [filtroTropa, setFiltroTropa] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [exportOpen, setExportOpen] = useState(false)

  useEffect(() => {
    cargarRendimiento()
  }, [tab, filtroTropa])

  const cargarRendimiento = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroTropa) params.set('tropaCodigo', filtroTropa)
      if (filtroFecha) params.set('fecha', filtroFecha)

      const res = await fetch(`/api/c2-rendimiento?tipo=${tab}&${params}`)
      const data = await res.json()
      if (data.success) {
        if (tab === 'productos') setRendimientoProductos(data.data || [])
        if (tab === 'global') setRendimientoGlobal(data.data || null)
        if (tab === 'ingresos') setRendimientoIngresos(data.data || [])
      }
    } catch (error) {
      console.error('Error cargando rendimiento:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportarExcel = () => {
    const dateStr = new Date().toISOString().split('T')[0]

    if (tab === 'global' && rendimientoGlobal) {
      const rg = rendimientoGlobal
      const headers = ['Ingresado kg', 'Producido kg', 'Subproductos kg', 'Rendimiento %', 'Merma kg', '% Merma']
      const data = [[rg.totalIngresado.toFixed(1), rg.totalProducido.toFixed(1), rg.totalSubproductos.toFixed(1), rg.rendimientoGlobal.toFixed(1), rg.mermaTotal.toFixed(1), rg.porcentajeMerma.toFixed(1)]]
      ExcelExporter.exportToExcel({ filename: `rendimiento_c2_global_${dateStr}`, sheets: [{ name: 'Rendimiento Global', headers, data }], title: 'Rendimiento C2 - Global' })
    } else if (tab === 'productos') {
      const headers = ['Producto', 'Código', 'Rubro', 'Cajas', 'Peso Neto kg', 'Rendimiento %']
      const data = rendimientoProductos.map(rp => [rp.productoNombre, rp.productoCodigo, rp.rubroNombre, rp.cantidadCajas.toString(), rp.pesoNetoTotal.toFixed(1), rp.porcentajeRendimiento.toFixed(1)])
      ExcelExporter.exportToExcel({ filename: `rendimiento_c2_productos_${dateStr}`, sheets: [{ name: 'Por Producto', headers, data }], title: 'Rendimiento C2 - Por Producto' })
    } else if (tab === 'ingresos') {
      const headers = ['Tropa', 'Ingresado kg', 'Producido kg', 'Cajas', 'Rendimiento %']
      const data = rendimientoIngresos.map(ri => [ri.tropaCodigo, ri.pesoIngresado.toFixed(1), ri.pesoProducido.toFixed(1), ri.cantidadCajas.toString(), ri.rendimiento.toFixed(1)])
      ExcelExporter.exportToExcel({ filename: `rendimiento_c2_ingresos_${dateStr}`, sheets: [{ name: 'Por Ingreso', headers, data }], title: 'Rendimiento C2 - Por Ingreso/Tropa' })
    }
    setExportOpen(false)
  }

  const exportarPDF = () => {
    const dateStr = new Date().toISOString().split('T')[0]

    if (tab === 'global' && rendimientoGlobal) {
      const rg = rendimientoGlobal
      const headers = ['Ingresado kg', 'Producido kg', 'Subproductos kg', 'Rendimiento %', 'Merma kg', '% Merma']
      const rows = [[rg.totalIngresado.toFixed(1), rg.totalProducido.toFixed(1), rg.totalSubproductos.toFixed(1), rg.rendimientoGlobal.toFixed(1) + '%', rg.mermaTotal.toFixed(1), rg.porcentajeMerma.toFixed(1) + '%']]
      const doc = PDFExporter.generateReport({ title: 'Rendimiento C2 - Global', headers, data: rows, orientation: 'landscape' })
      PDFExporter.downloadPDF(doc, `rendimiento_c2_global_${dateStr}.pdf`)
    } else if (tab === 'productos') {
      const headers = ['Producto', 'Código', 'Rubro', 'Cajas', 'Peso Neto kg', 'Rendimiento %']
      const rows = rendimientoProductos.map(rp => [rp.productoNombre, rp.productoCodigo, rp.rubroNombre, rp.cantidadCajas.toString(), rp.pesoNetoTotal.toFixed(1), rp.porcentajeRendimiento.toFixed(1) + '%'])
      const doc = PDFExporter.generateReport({ title: 'Rendimiento C2 - Por Producto', headers, data: rows, orientation: 'landscape' })
      PDFExporter.downloadPDF(doc, `rendimiento_c2_productos_${dateStr}.pdf`)
    } else if (tab === 'ingresos') {
      const headers = ['Tropa', 'Ingresado kg', 'Producido kg', 'Cajas', 'Rendimiento %']
      const rows = rendimientoIngresos.map(ri => [ri.tropaCodigo, ri.pesoIngresado.toFixed(1), ri.pesoProducido.toFixed(1), ri.cantidadCajas.toString(), ri.rendimiento.toFixed(1) + '%'])
      const doc = PDFExporter.generateReport({ title: 'Rendimiento C2 - Por Ingreso/Tropa', headers, data: rows, orientation: 'landscape' })
      PDFExporter.downloadPDF(doc, `rendimiento_c2_ingresos_${dateStr}.pdf`)
    }
    setExportOpen(false)
  }

  const getRendimientoColor = (valor: number) => {
    if (valor >= 80) return 'text-green-600'
    if (valor >= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  const getRendimientoIcon = (valor: number) => {
    if (valor >= 80) return <ArrowUpRight className="w-4 h-4 text-green-500" />
    if (valor >= 60) return <Minus className="w-4 h-4 text-amber-500" />
    return <ArrowDownRight className="w-4 h-4 text-red-500" />
  }

  const getRendimientoBg = (valor: number) => {
    if (valor >= 80) return 'bg-green-50 border-green-200'
    if (valor >= 60) return 'bg-amber-50 border-amber-200'
    return 'bg-red-50 border-red-200'
  }

  if (loading && !rendimientoGlobal) {
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
              <TrendingUp className="w-8 h-8 text-amber-500" />
              Rendimiento C2
            </h1>
            <p className="text-stone-500 mt-1">Análisis de rindes de desposte por producto, tropa y global</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button variant="outline" onClick={() => setExportOpen(!exportOpen)}>
                <FileDown className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-[180px]">
                  <button
                    onClick={exportarExcel}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-stone-50 rounded-t-lg"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    Exportar Excel
                  </button>
                  <button
                    onClick={exportarPDF}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-stone-50 rounded-b-lg"
                  >
                    <FileDown className="w-4 h-4 text-red-600" />
                    Exportar PDF
                  </button>
                </div>
              )}
            </div>
            <Button variant="outline" onClick={cargarRendimiento} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'global' as const, label: 'Global', icon: PieChart },
            { key: 'productos' as const, label: 'Por Producto', icon: BarChart3 },
            { key: 'ingresos' as const, label: 'Por Ingreso/Tropa', icon: TrendingUp }
          ].map(t => (
            <Button
              key={t.key}
              variant={tab === t.key ? 'default' : 'outline'}
              className={tab === t.key ? 'bg-amber-500' : ''}
              onClick={() => setTab(t.key)}
            >
              <t.icon className="w-4 h-4 mr-2" />
              {t.label}
            </Button>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-3 mb-4">
          <Input
            value={filtroTropa}
            onChange={e => setFiltroTropa(e.target.value)}
            placeholder="Filtrar por tropa..."
            className="w-48"
          />
          <Input
            type="date"
            value={filtroFecha}
            onChange={e => setFiltroFecha(e.target.value)}
            className="w-48"
          />
        </div>

        {/* TAB: Global */}
        {tab === 'global' && rendimientoGlobal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-stone-500 mb-1">Total Ingresado</p>
                  <p className="text-2xl font-bold text-blue-700">{rendimientoGlobal.totalIngresado.toFixed(1)} kg</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-stone-500 mb-1">Total Producido (Cajas)</p>
                  <p className="text-2xl font-bold text-green-700">{rendimientoGlobal.totalProducido.toFixed(1)} kg</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-stone-500 mb-1">Subproductos</p>
                  <p className="text-2xl font-bold text-purple-700">{rendimientoGlobal.totalSubproductos.toFixed(1)} kg</p>
                </CardContent>
              </Card>
              <Card className={`border ${getRendimientoBg(rendimientoGlobal.rendimientoGlobal)}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    {getRendimientoIcon(rendimientoGlobal.rendimientoGlobal)}
                    <div>
                      <p className="text-xs text-stone-500">Rendimiento Global</p>
                      <p className={`text-2xl font-bold ${getRendimientoColor(rendimientoGlobal.rendimientoGlobal)}`}>
                        {rendimientoGlobal.rendimientoGlobal.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-red-500" />
                  Análisis de Merma
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-stone-50 rounded-lg">
                    <p className="text-sm text-stone-500">Merma Total</p>
                    <p className="text-xl font-bold text-red-600">{rendimientoGlobal.mermaTotal.toFixed(1)} kg</p>
                  </div>
                  <div className="text-center p-4 bg-stone-50 rounded-lg">
                    <p className="text-sm text-stone-500">% Merma</p>
                    <p className="text-xl font-bold text-red-600">{rendimientoGlobal.porcentajeMerma.toFixed(1)}%</p>
                  </div>
                  <div className="text-center p-4 bg-stone-50 rounded-lg">
                    <p className="text-sm text-stone-500">Recuperación (Prod + Sub)</p>
                    <p className="text-xl font-bold text-green-600">
                      {rendimientoGlobal.totalIngresado > 0
                        ? ((rendimientoGlobal.totalProducido + rendimientoGlobal.totalSubproductos) / rendimientoGlobal.totalIngresado * 100).toFixed(1)
                        : '0.0'
                      }%
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span>Distribución de masa</span>
                    <span>{rendimientoGlobal.totalIngresado.toFixed(0)} kg total</span>
                  </div>
                  <div className="w-full h-6 bg-stone-200 rounded-full overflow-hidden flex">
                    {rendimientoGlobal.totalIngresado > 0 && (
                      <>
                        <div
                          className="bg-green-500 h-full flex items-center justify-center text-xs text-white font-medium"
                          style={{ width: `${(rendimientoGlobal.totalProducido / rendimientoGlobal.totalIngresado * 100)}%` }}
                        >
                          {rendimientoGlobal.totalProducido > 0 ? `${(rendimientoGlobal.totalProducido / rendimientoGlobal.totalIngresado * 100).toFixed(0)}%` : ''}
                        </div>
                        <div
                          className="bg-purple-500 h-full flex items-center justify-center text-xs text-white font-medium"
                          style={{ width: `${(rendimientoGlobal.totalSubproductos / rendimientoGlobal.totalIngresado * 100)}%` }}
                        >
                          {rendimientoGlobal.totalSubproductos > 0 ? `${(rendimientoGlobal.totalSubproductos / rendimientoGlobal.totalIngresado * 100).toFixed(0)}%` : ''}
                        </div>
                        <div
                          className="bg-red-400 h-full flex items-center justify-center text-xs text-white font-medium"
                          style={{ width: `${rendimientoGlobal.porcentajeMerma}%` }}
                        >
                          {rendimientoGlobal.porcentajeMerma > 5 ? `${rendimientoGlobal.porcentajeMerma.toFixed(0)}%` : ''}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-sm inline-block"></span> Cajas</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 rounded-sm inline-block"></span> Subproductos</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded-sm inline-block"></span> Merma</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB: Por Producto */}
        {tab === 'productos' && (
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                Rendimiento por Producto de Desposte
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {rendimientoProductos.length === 0 ? (
                <div className="p-8 text-center text-stone-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay datos de rendimiento</p>
                </div>
              ) : (
                <div className="divide-y">
                  <div className="grid grid-cols-6 gap-2 p-3 bg-stone-50 text-xs font-medium text-stone-500">
                    <span>Producto</span>
                    <span>Rubro</span>
                    <span className="text-right">Cajas</span>
                    <span className="text-right">Peso Neto (kg)</span>
                    <span className="text-right">Rendimiento</span>
                    <span className="text-right">Visual</span>
                  </div>
                  {rendimientoProductos.map((rp, i) => (
                    <div key={rp.productoId || i} className="grid grid-cols-6 gap-2 p-3 items-center hover:bg-stone-50">
                      <div>
                        <p className="font-medium text-sm">{rp.productoNombre}</p>
                        <p className="text-xs text-stone-400 font-mono">{rp.productoCodigo}</p>
                      </div>
                      <span className="text-sm text-stone-600">{rp.rubroNombre}</span>
                      <span className="text-sm text-right">{rp.cantidadCajas}</span>
                      <span className="text-sm text-right font-medium">{rp.pesoNetoTotal.toFixed(1)}</span>
                      <div className="flex items-center justify-end gap-1">
                        {getRendimientoIcon(rp.porcentajeRendimiento)}
                        <span className={`text-sm font-bold ${getRendimientoColor(rp.porcentajeRendimiento)}`}>
                          {rp.porcentajeRendimiento.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-stone-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${rp.porcentajeRendimiento >= 80 ? 'bg-green-500' : rp.porcentajeRendimiento >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(rp.porcentajeRendimiento, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB: Por Ingreso/Tropa */}
        {tab === 'ingresos' && (
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                Rendimiento por Ingreso / Tropa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {rendimientoIngresos.length === 0 ? (
                <div className="p-8 text-center text-stone-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay datos de rendimiento por ingreso</p>
                </div>
              ) : (
                <div className="divide-y">
                  {rendimientoIngresos.map((ri, i) => (
                    <div key={ri.ingresoId || i} className="p-4 hover:bg-stone-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-stone-800">{ri.tropaCodigo}</span>
                          <Badge variant="outline" className="text-xs">{ri.cantidadCajas} cajas</Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-stone-400">Ingresado</p>
                            <p className="text-sm font-medium">{ri.pesoIngresado.toFixed(1)} kg</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-stone-400">Producido</p>
                            <p className="text-sm font-medium text-green-700">{ri.pesoProducido.toFixed(1)} kg</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-stone-400">Rendimiento</p>
                            <p className={`text-sm font-bold ${getRendimientoColor(ri.rendimiento)}`}>
                              {ri.rendimiento.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                      {ri.productos.length > 0 && (
                        <div className="ml-4 flex flex-wrap gap-1">
                          {ri.productos.slice(0, 8).map((p, j) => (
                            <Badge key={j} variant="outline" className="text-xs">
                              {p.nombre}: {p.peso.toFixed(1)} kg
                            </Badge>
                          ))}
                          {ri.productos.length > 8 && (
                            <Badge variant="outline" className="text-xs">+{ri.productos.length - 8} más</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
