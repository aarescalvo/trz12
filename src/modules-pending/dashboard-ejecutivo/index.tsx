'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { 
  LayoutDashboard, AlertTriangle, CheckCircle, Clock, TrendingUp,
  Users, Beef, DollarSign, Package, Activity, Bell
} from 'lucide-react'

interface Props {
  operador?: { id: string; nombre: string; rol: string }
}

export function DashboardEjecutivoModule({ operador }: Props) {
  const [loading, setLoading] = useState(true)
  const [alertas, setAlertas] = useState<any[]>([])
  const [kpis, setKpis] = useState({
    tropasActivas: 0,
    faenaHoy: 0,
    stockCritico: 0,
    pendientesCobro: 0
  })

  useEffect(() => {
    fetchDatos()
  }, [])

  const fetchDatos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/ejecutivo')
      const data = await res.json()
      if (data.success) {
        setAlertas(data.data.alertas || [])
        setKpis(data.data.kpis || kpis)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Dashboard Ejecutivo</h1>
            <p className="text-stone-500 mt-1">Vista general del estado del negocio</p>
          </div>
          <Badge className="bg-red-100 text-red-700">
            <Bell className="w-3 h-3 mr-1" />
            {alertas.length} alertas
          </Badge>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Beef className="w-8 h-8 text-amber-600" />
                <div>
                  <p className="text-sm text-stone-500">Tropas Activas</p>
                  <p className="text-2xl font-bold text-amber-700">{kpis.tropasActivas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-sm text-stone-500">Faena Hoy</p>
                  <p className="text-2xl font-bold text-red-700">{kpis.faenaHoy}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm text-stone-500">Stock Crítico</p>
                  <p className="text-2xl font-bold text-orange-700">{kpis.stockCritico}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-stone-500">Pend. Cobro</p>
                  <p className="text-2xl font-bold text-green-700">${kpis.pendientesCobro.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas */}
        <Card className="border-0 shadow-md mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Alertas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertas.length === 0 ? (
              <div className="text-center py-8 text-stone-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                <p>No hay alertas activas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alertas.map((alerta, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                    <AlertTriangle className={`w-5 h-5 ${
                      alerta.prioridad === 'ALTA' ? 'text-red-500' : 
                      alerta.prioridad === 'MEDIA' ? 'text-amber-500' : 'text-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium">{alerta.titulo}</p>
                      <p className="text-sm text-stone-500">{alerta.descripcion}</p>
                    </div>
                    <Badge variant="outline">{alerta.tipo}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardEjecutivoModule
