'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, Beef, Package,
  Calendar, Download, RefreshCw, PieChart, LineChart, Activity
} from 'lucide-react'

interface Props {
  operador?: { id: string; nombre: string; rol: string }
}

export function ReportesGerencialesModule({ operador }: Props) {
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('mes')
  const [datos, setDatos] = useState({
    faena: { total: 0, promedio: 0, tendencia: 0 },
    rinde: { promedio: 0, maximo: 0, minimo: 0 },
    stock: { mediasRes: 0, cuartos: 0, productos: 0 },
    ingresos: { total: 0, pendiente: 0 }
  })

  useEffect(() => {
    fetchDatos()
  }, [periodo])

  const fetchDatos = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reportes/gerenciales?periodo=${periodo}`)
      const data = await res.json()
      if (data.success) {
        setDatos(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const KPICard = ({ titulo, valor, subvalor, icon: Icon, tendencia, color = 'amber' }: {
    titulo: string
    valor: string | number
    subvalor?: string
    icon: typeof Beef
    tendencia?: number
    color?: string
  }) => (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-stone-500">{titulo}</p>
            <p className={`text-2xl font-bold text-${color}-600`}>{valor}</p>
            {subvalor && <p className="text-xs text-stone-400">{subvalor}</p>}
          </div>
          <div className={`p-3 bg-${color}-100 rounded-lg`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
        {tendencia !== undefined && (
          <div className={`flex items-center gap-1 mt-2 ${tendencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {tendencia >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-sm">{tendencia >= 0 ? '+' : ''}{tendencia}% vs período anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Reportes Gerenciales</h1>
            <p className="text-stone-500 mt-1">Indicadores clave del negocio</p>
          </div>
          <div className="flex gap-2">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semana">Esta semana</SelectItem>
                <SelectItem value="mes">Este mes</SelectItem>
                <SelectItem value="trimestre">Trimestre</SelectItem>
                <SelectItem value="anio">Este año</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchDatos}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KPICard
            titulo="Faena Total"
            valor={datos.faena.total}
            subvalor={`Prom: ${datos.faena.promedio}/día`}
            icon={Beef}
            tendencia={datos.faena.tendencia}
            color="red"
          />
          <KPICard
            titulo="Rinde Promedio"
            valor={`${datos.rinde.promedio}%`}
            subvalor={`Max: ${datos.rinde.maximo}% | Min: ${datos.rinde.minimo}%`}
            icon={TrendingUp}
            color="green"
          />
          <KPICard
            titulo="Stock Actual"
            valor={datos.stock.mediasRes}
            subvalor={`${datos.stock.cuartos} cuartos | ${datos.stock.productos} prod`}
            icon={Package}
            color="blue"
          />
          <KPICard
            titulo="Ingresos"
            valor={`$${datos.ingresos.total.toLocaleString()}`}
            subvalor={`Pendiente: $${datos.ingresos.pendiente.toLocaleString()}`}
            icon={DollarSign}
            color="amber"
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                Faena por Día
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-stone-50 rounded-lg">
                <p className="text-stone-400">Gráfico de faena diaria</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Distribución de Rindes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-stone-50 rounded-lg">
                <p className="text-stone-400">Gráfico de distribución</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Stock por Cámara
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-stone-50 rounded-lg">
                <p className="text-stone-400">Gráfico de stock</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Tendencia de Producción
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-stone-50 rounded-lg">
                <p className="text-stone-400">Gráfico de tendencia</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ReportesGerencialesModule
