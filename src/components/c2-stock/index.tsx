'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Warehouse, Package, TrendingUp, Loader2, RefreshCw,
  ChevronDown, ChevronRight, Search, BarChart3, FileDown, FileSpreadsheet, ChevronUp
} from 'lucide-react'
import { ExcelExporter } from '@/lib/export-excel'
import { PDFExporter } from '@/lib/export-pdf'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface StockProducto {
  productoId: string
  productoNombre: string
  productoCodigo: string
  rubroNombre: string
  cantidadCajas: number
  pesoNetoTotal: number
  porEstado: Record<string, { cantidad: number; peso: number }>
}

interface StockEstado {
  estado: string
  cantidadCajas: number
  pesoNetoTotal: number
}

interface StockCamara {
  camaraId: string
  camaraNombre: string
  cantidadCajas: number
  pesoNetoTotal: number
}

interface StockTropa {
  tropaCodigo: string
  cantidadCajas: number
  pesoNetoTotal: number
  productosDistintos: number
  productos: Record<string, number>
}

export default function C2StockModule({ operador }: { operador: Operador }) {
  const [stockData, setStockData] = useState<any>([])
  const [resumen, setResumen] = useState({ totalCajas: 0, totalPesoNeto: 0, productosDistintos: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'producto' | 'estado' | 'camara' | 'tropa'>('producto')
  const [filtroProducto, setFiltroProducto] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  useEffect(() => {
    cargarStock()
  }, [tab])

  const cargarStock = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/c2-stock?agrupar=${tab}`)
      const data = await res.json()
      if (data.success) {
        setStockData(data.data || [])
        if (data.resumen) setResumen(data.resumen)
      }
    } catch (error) {
      console.error('Error cargando stock:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportarExcel = () => {
    const dateStr = new Date().toISOString().split('T')[0]
    const tabLabels: Record<string, string> = { producto: 'Producto', estado: 'Estado', camara: 'Cámara', tropa: 'Tropa' }

    if (tab === 'producto') {
      const data = (stockData as StockProducto[]).map(sp => ({
        Producto: sp.productoNombre,
        Código: sp.productoCodigo,
        Rubro: sp.rubroNombre,
        Cajas: sp.cantidadCajas,
        'Peso Neto kg': sp.pesoNetoTotal.toFixed(1),
        '% del Total': resumen.totalPesoNeto > 0 ? ((sp.pesoNetoTotal / resumen.totalPesoNeto) * 100).toFixed(1) : '0.0'
      }))
      ExcelExporter.exportToExcel({ filename: `stock_c2_producto_${dateStr}`, sheets: [{ name: 'Por Producto', headers: ['Producto', 'Código', 'Rubro', 'Cajas', 'Peso Neto kg', '% del Total'], data: data.map(d => Object.values(d)) }], title: 'Stock C2 - Por Producto' })
    } else if (tab === 'estado') {
      const data = (stockData as StockEstado[]).map(se => ({
        Estado: se.estado,
        Cajas: se.cantidadCajas,
        'Peso Neto kg': se.pesoNetoTotal.toFixed(1),
        '% del Total': resumen.totalPesoNeto > 0 ? ((se.pesoNetoTotal / resumen.totalPesoNeto) * 100).toFixed(1) : '0.0'
      }))
      ExcelExporter.exportToExcel({ filename: `stock_c2_estado_${dateStr}`, sheets: [{ name: 'Por Estado', headers: ['Estado', 'Cajas', 'Peso Neto kg', '% del Total'], data: data.map(d => Object.values(d)) }], title: 'Stock C2 - Por Estado' })
    } else if (tab === 'camara') {
      const data = (stockData as StockCamara[]).map(sc => ({
        Cámara: sc.camaraNombre,
        Cajas: sc.cantidadCajas,
        'Peso Neto kg': sc.pesoNetoTotal.toFixed(1),
        '% del Total': resumen.totalPesoNeto > 0 ? ((sc.pesoNetoTotal / resumen.totalPesoNeto) * 100).toFixed(1) : '0.0'
      }))
      ExcelExporter.exportToExcel({ filename: `stock_c2_camara_${dateStr}`, sheets: [{ name: 'Por Cámara', headers: ['Cámara', 'Cajas', 'Peso Neto kg', '% del Total'], data: data.map(d => Object.values(d)) }], title: 'Stock C2 - Por Cámara' })
    } else if (tab === 'tropa') {
      const data = (stockData as StockTropa[]).map(st => ({
        Tropa: st.tropaCodigo,
        Cajas: st.cantidadCajas,
        'Peso Neto kg': st.pesoNetoTotal.toFixed(1),
        Productos: st.productosDistintos
      }))
      ExcelExporter.exportToExcel({ filename: `stock_c2_tropa_${dateStr}`, sheets: [{ name: 'Por Tropa', headers: ['Tropa', 'Cajas', 'Peso Neto kg', 'Productos'], data: data.map(d => Object.values(d)) }], title: 'Stock C2 - Por Tropa' })
    }
    setExportOpen(false)
  }

  const exportarPDF = () => {
    const dateStr = new Date().toISOString().split('T')[0]

    if (tab === 'producto') {
      const headers = ['Producto', 'Código', 'Rubro', 'Cajas', 'Peso Neto kg', '% del Total']
      const rows = (stockData as StockProducto[]).map(sp => [sp.productoNombre, sp.productoCodigo, sp.rubroNombre, sp.cantidadCajas.toString(), sp.pesoNetoTotal.toFixed(1), resumen.totalPesoNeto > 0 ? ((sp.pesoNetoTotal / resumen.totalPesoNeto) * 100).toFixed(1) + '%' : '0.0%'])
      const doc = PDFExporter.generateReport({ title: 'Stock C2 - Por Producto', headers, data: rows, orientation: 'landscape' })
      PDFExporter.downloadPDF(doc, `stock_c2_producto_${dateStr}.pdf`)
    } else if (tab === 'estado') {
      const headers = ['Estado', 'Cajas', 'Peso Neto kg', '% del Total']
      const rows = (stockData as StockEstado[]).map(se => [se.estado, se.cantidadCajas.toString(), se.pesoNetoTotal.toFixed(1), resumen.totalPesoNeto > 0 ? ((se.pesoNetoTotal / resumen.totalPesoNeto) * 100).toFixed(1) + '%' : '0.0%'])
      const doc = PDFExporter.generateReport({ title: 'Stock C2 - Por Estado', headers, data: rows, orientation: 'landscape' })
      PDFExporter.downloadPDF(doc, `stock_c2_estado_${dateStr}.pdf`)
    } else if (tab === 'camara') {
      const headers = ['Cámara', 'Cajas', 'Peso Neto kg', '% del Total']
      const rows = (stockData as StockCamara[]).map(sc => [sc.camaraNombre, sc.cantidadCajas.toString(), sc.pesoNetoTotal.toFixed(1), resumen.totalPesoNeto > 0 ? ((sc.pesoNetoTotal / resumen.totalPesoNeto) * 100).toFixed(1) + '%' : '0.0%'])
      const doc = PDFExporter.generateReport({ title: 'Stock C2 - Por Cámara', headers, data: rows, orientation: 'landscape' })
      PDFExporter.downloadPDF(doc, `stock_c2_camara_${dateStr}.pdf`)
    } else if (tab === 'tropa') {
      const headers = ['Tropa', 'Cajas', 'Peso Neto kg', 'Productos']
      const rows = (stockData as StockTropa[]).map(st => [st.tropaCodigo, st.cantidadCajas.toString(), st.pesoNetoTotal.toFixed(1), st.productosDistintos.toString()])
      const doc = PDFExporter.generateReport({ title: 'Stock C2 - Por Tropa', headers, data: rows, orientation: 'landscape' })
      PDFExporter.downloadPDF(doc, `stock_c2_tropa_${dateStr}.pdf`)
    }
    setExportOpen(false)
  }

  const getEstadoBadge = (estado: string) => {
    const colors: Record<string, string> = {
      ARMADA: 'bg-amber-100 text-amber-800',
      EN_PALLETS: 'bg-blue-100 text-blue-800',
      EN_CAMARA: 'bg-indigo-100 text-indigo-800',
      DESPACHADA: 'bg-green-100 text-green-800'
    }
    return colors[estado] || 'bg-stone-100 text-stone-800'
  }

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      ARMADA: 'Armada',
      EN_PALLETS: 'En Pallet',
      EN_CAMARA: 'En Cámara',
      DESPACHADA: 'Despachada'
    }
    return labels[estado] || estado
  }

  if (loading) {
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
              <Warehouse className="w-8 h-8 text-amber-500" />
              Stock C2
            </h1>
            <p className="text-stone-500 mt-1">Inventario de cajas de desposte por producto, estado, cámara y tropa</p>
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
            <Button variant="outline" onClick={cargarStock}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 mb-1">Total Cajas</p>
              <p className="text-2xl font-bold text-amber-700">{resumen.totalCajas}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 mb-1">Peso Total Neto</p>
              <p className="text-2xl font-bold text-green-700">{resumen.totalPesoNeto.toFixed(1)} kg</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 mb-1">Productos Distintos</p>
              <p className="text-2xl font-bold text-blue-700">{resumen.productosDistintos}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'producto' as const, label: 'Por Producto', icon: Package },
            { key: 'estado' as const, label: 'Por Estado', icon: BarChart3 },
            { key: 'camara' as const, label: 'Por Cámara', icon: Warehouse },
            { key: 'tropa' as const, label: 'Por Tropa', icon: TrendingUp }
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

        {/* Filtro */}
        <div className="mb-4">
          <Input
            value={filtroProducto}
            onChange={e => setFiltroProducto(e.target.value)}
            placeholder="Filtrar..."
            className="w-64"
          />
        </div>

        {/* TAB: Por Producto */}
        {tab === 'producto' && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="divide-y">
                <div className="grid grid-cols-12 gap-2 p-3 bg-stone-50 text-xs font-medium text-stone-500">
                  <span className="col-span-3">Producto</span>
                  <span className="col-span-2">Rubro</span>
                  <span className="col-span-1 text-right">Cajas</span>
                  <span className="col-span-2 text-right">Peso Neto (kg)</span>
                  <span className="col-span-4">Estados</span>
                </div>
                {(stockData as StockProducto[])
                  .filter(s => !filtroProducto || s.productoNombre.toLowerCase().includes(filtroProducto.toLowerCase()))
                  .map(sp => (
                  <div key={sp.productoId} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-stone-50">
                    <div className="col-span-3">
                      <p className="font-medium text-sm">{sp.productoNombre}</p>
                      <p className="text-xs text-stone-400 font-mono">{sp.productoCodigo}</p>
                    </div>
                    <span className="col-span-2 text-sm text-stone-600">{sp.rubroNombre}</span>
                    <span className="col-span-1 text-sm text-right font-medium">{sp.cantidadCajas}</span>
                    <span className="col-span-2 text-sm text-right font-bold">{sp.pesoNetoTotal.toFixed(1)}</span>
                    <div className="col-span-4 flex flex-wrap gap-1">
                      {Object.entries(sp.porEstado).map(([estado, data]) => (
                        <Badge key={estado} className={`${getEstadoBadge(estado)} text-xs`}>
                          {getEstadoLabel(estado)}: {data.cantidad} ({data.peso.toFixed(1)}kg)
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB: Por Estado */}
        {tab === 'estado' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(stockData as StockEstado[]).map(se => (
              <Card key={se.estado} className={`border-0 shadow-md ${getEstadoBadge(se.estado).split(' ')[0]}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">{getEstadoLabel(se.estado)}</h3>
                    <Badge className={getEstadoBadge(se.estado)}>{se.estado}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-stone-500">Cajas</p>
                      <p className="text-2xl font-bold">{se.cantidadCajas}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Peso Neto</p>
                      <p className="text-2xl font-bold">{se.pesoNetoTotal.toFixed(1)} kg</p>
                    </div>
                  </div>
                  {resumen.totalPesoNeto > 0 && (
                    <div className="mt-3">
                      <div className="w-full bg-stone-200 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full"
                          style={{ width: `${(se.pesoNetoTotal / resumen.totalPesoNeto * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        {(se.pesoNetoTotal / resumen.totalPesoNeto * 100).toFixed(1)}% del total
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* TAB: Por Cámara */}
        {tab === 'camara' && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="divide-y">
                {(stockData as StockCamara[]).map(sc => (
                  <div key={sc.camaraId} className="flex items-center justify-between p-4 hover:bg-stone-50">
                    <div className="flex items-center gap-3">
                      <Warehouse className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">{sc.camaraNombre}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-stone-400">Cajas</p>
                        <p className="font-bold">{sc.cantidadCajas}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-stone-400">Peso Neto</p>
                        <p className="font-bold text-green-700">{sc.pesoNetoTotal.toFixed(1)} kg</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB: Por Tropa */}
        {tab === 'tropa' && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="divide-y">
                {(stockData as StockTropa[])
                  .filter(s => !filtroProducto || s.tropaCodigo.toLowerCase().includes(filtroProducto.toLowerCase()))
                  .map(st => (
                  <div key={st.tropaCodigo} className="p-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandido(expandido === st.tropaCodigo ? null : st.tropaCodigo)}
                    >
                      <div className="flex items-center gap-3">
                        {expandido === st.tropaCodigo ? (
                          <ChevronDown className="w-4 h-4 text-stone-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-stone-400" />
                        )}
                        <span className="font-mono font-bold">{st.tropaCodigo}</span>
                        <Badge variant="outline" className="text-xs">{st.productosDistintos} productos</Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">{st.cantidadCajas} cajas</span>
                        <span className="font-bold text-green-700">{st.pesoNetoTotal.toFixed(1)} kg</span>
                      </div>
                    </div>
                    {expandido === st.tropaCodigo && st.productos && (
                      <div className="ml-7 mt-2 flex flex-wrap gap-1">
                        {Object.entries(st.productos).map(([nombre, peso]) => (
                          <Badge key={nombre} variant="outline" className="text-xs">
                            {nombre}: {(peso as number).toFixed(1)} kg
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {stockData.length === 0 && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-8 text-center text-stone-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay stock de cajas C2</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
