'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  TrendingUp, TrendingDown, Package, Calendar, AlertTriangle,
  BarChart3, RefreshCw, Download, Brain
} from 'lucide-react'

interface Props {
  operador?: { id: string; nombre: string; rol: string }
}

interface Prediccion {
  producto: string
  stockActual: number
  consumoPromedio: number
  diasCobertura: number
  sugerenciaCompra: number
  probabilidadAgotamiento: number
  tendencia: 'SUBIENDO' | 'BAJANDO' | 'ESTABLE'
}

export function PredictivoStockModule({ operador }: Props) {
  const [loading, setLoading] = useState(true)
  const [predicciones, setPredicciones] = useState<Prediccion[]>([])
  const [periodo, setPeriodo] = useState('30')

  useEffect(() => {
    fetchPredicciones()
  }, [periodo])

  const fetchPredicciones = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/stock/predictivo?dias=${periodo}`)
      const data = await res.json()
      setPredicciones(data.predicciones || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProbabilidadColor = (prob: number) => {
    if (prob >= 70) return 'text-red-600 bg-red-100'
    if (prob >= 40) return 'text-amber-600 bg-amber-100'
    return 'text-green-600 bg-green-100'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Stock Predictivo</h1>
            <p className="text-stone-500 mt-1">Predicciones basadas en consumo histórico</p>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Próximos 7 días</SelectItem>
                <SelectItem value="15">Próximos 15 días</SelectItem>
                <SelectItem value="30">Próximos 30 días</SelectItem>
                <SelectItem value="60">Próximos 60 días</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchPredicciones}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-xs text-stone-500">Productos Analizados</p>
                  <p className="text-xl font-bold">{predicciones.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-xs text-stone-500">Riesgo Alto</p>
                  <p className="text-xl font-bold text-red-600">
                    {predicciones.filter(p => p.probabilidadAgotamiento >= 70).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-xs text-stone-500">Riesgo Medio</p>
                  <p className="text-xl font-bold text-amber-600">
                    {predicciones.filter(p => p.probabilidadAgotamiento >= 40 && p.probabilidadAgotamiento < 70).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-xs text-stone-500">Stock OK</p>
                  <p className="text-xl font-bold text-green-600">
                    {predicciones.filter(p => p.probabilidadAgotamiento < 40).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Predicciones */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Análisis Predictivo
            </CardTitle>
            <CardDescription>
              Proyecciones basadas en consumo promedio diario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {predicciones.length === 0 ? (
                <div className="text-center py-8 text-stone-400">
                  <Brain className="w-12 h-12 mx-auto mb-2" />
                  <p>No hay datos suficientes para predicciones</p>
                </div>
              ) : (
                predicciones.sort((a, b) => b.probabilidadAgotamiento - a.probabilidadAgotamiento).map((p, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 hover:bg-stone-50">
                    <div className={`p-2 rounded-lg ${
                      p.tendencia === 'SUBIENDO' ? 'bg-green-100' :
                      p.tendencia === 'BAJANDO' ? 'bg-red-100' : 'bg-stone-100'
                    }`}>
                      {p.tendencia === 'SUBIENDO' ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : p.tendencia === 'BAJANDO' ? (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      ) : (
                        <Package className="w-5 h-5 text-stone-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{p.producto}</p>
                      <p className="text-sm text-stone-500">
                        Stock: {p.stockActual} | Consumo/día: {p.consumoPromedio.toFixed(1)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-stone-500">Días cobertura</p>
                      <p className={`text-lg font-bold ${
                        p.diasCobertura <= 7 ? 'text-red-600' :
                        p.diasCobertura <= 15 ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        {p.diasCobertura.toFixed(0)} días
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-stone-500">Prob. agotamiento</p>
                      <Badge className={getProbabilidadColor(p.probabilidadAgotamiento)}>
                        {p.probabilidadAgotamiento.toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="text-right min-w-24">
                      <p className="text-sm text-stone-500">Sugerido</p>
                      <p className="text-lg font-bold text-blue-600">
                        +{p.sugerenciaCompra}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PredictivoStockModule
