'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  Warehouse, Loader2, RefreshCw, AlertTriangle, CheckCircle, 
  MinusCircle, PlusCircle
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface CorralStock {
  id: string
  nombre: string
  capacidad: number
  stockBovinos: number
  stockEquinos: number
  activo: boolean
  tropas: Array<{
    id: string
    codigo: string
    especie: string
    cantidadCabezas: number
    estado: string
    productor?: { nombre: string }
    fechaRecepcion: string
  }>
}

interface Props {
  operador: Operador
}

export function StocksCorralesModule({ operador }: Props) {
  const [corrales, setCorrales] = useState<CorralStock[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')

  useEffect(() => {
    fetchStock()
  }, [])

  const fetchStock = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/corrales/stock')
      const data = await res.json()
      if (data.success) {
        setCorrales(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar stock de corrales')
    } finally {
      setLoading(false)
    }
  }

  const getOcupacion = (corral: CorralStock) => {
    const total = corral.stockBovinos + corral.stockEquinos
    const porcentaje = corral.capacidad > 0 ? (total / corral.capacidad) * 100 : 0
    return { total, porcentaje }
  }

  const getEstadoBadge = (corral: CorralStock) => {
    const { porcentaje } = getOcupacion(corral)
    
    if (porcentaje >= 100) {
      return <Badge className="bg-red-100 text-red-700">Lleno</Badge>
    } else if (porcentaje >= 80) {
      return <Badge className="bg-amber-100 text-amber-700">Casi lleno</Badge>
    } else if (porcentaje > 0) {
      return <Badge className="bg-emerald-100 text-emerald-700">Disponible</Badge>
    } else {
      return <Badge className="bg-stone-100 text-stone-500">Vacío</Badge>
    }
  }

  const getBarraColor = (porcentaje: number) => {
    if (porcentaje >= 100) return 'bg-red-500'
    if (porcentaje >= 80) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  const corralesFiltrados = corrales.filter(c => {
    if (filtroEstado === 'todos') return true
    if (filtroEstado === 'vacios') return c.stockBovinos === 0 && c.stockEquinos === 0
    if (filtroEstado === 'disponibles') return getOcupacion(c).porcentaje < 80
    if (filtroEstado === 'llenos') return getOcupacion(c).porcentaje >= 80
    return true
  })

  const totalAnimales = corrales.reduce((acc, c) => acc + c.stockBovinos + c.stockEquinos, 0)
  const totalCapacidad = corrales.reduce((acc, c) => acc + c.capacidad, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Warehouse className="w-8 h-8 text-amber-500" />
              Stocks de Corrales
            </h1>
            <p className="text-stone-500 mt-1">Control de animales en corrales</p>
          </div>
          <Button onClick={fetchStock} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Total Animales</p>
              <p className="text-3xl font-bold text-stone-800">{totalAnimales}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Capacidad Total</p>
              <p className="text-3xl font-bold text-stone-800">{totalCapacidad}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Bovinos</p>
              <p className="text-3xl font-bold text-amber-600">
                {corrales.reduce((acc, c) => acc + c.stockBovinos, 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Equinos</p>
              <p className="text-3xl font-bold text-purple-600">
                {corrales.reduce((acc, c) => acc + c.stockEquinos, 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtro */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-stone-600">Filtrar por estado:</span>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="vacios">Vacíos</SelectItem>
                  <SelectItem value="disponibles">Disponibles</SelectItem>
                  <SelectItem value="llenos">Llenos/Casi llenos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Corrales */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {corralesFiltrados.map((corral) => {
              const { total, porcentaje } = getOcupacion(corral)
              
              return (
                <Card key={corral.id} className="border-0 shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Warehouse className="w-5 h-5 text-amber-500" />
                        {corral.nombre}
                      </CardTitle>
                      {getEstadoBadge(corral)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Barra de progreso */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-500">Ocupación</span>
                        <span className="font-medium">{total}/{corral.capacidad}</span>
                      </div>
                      <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${getBarraColor(porcentaje)}`}
                          style={{ width: `${Math.min(porcentaje, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-stone-400 text-right">{porcentaje.toFixed(0)}%</p>
                    </div>

                    {/* Desglose */}
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-amber-500 rounded-full" />
                        <span className="text-stone-600">Bovinos: <strong>{corral.stockBovinos}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                        <span className="text-stone-600">Equinos: <strong>{corral.stockEquinos}</strong></span>
                      </div>
                    </div>

                    {/* Tropas en el corral */}
                    {corral.tropas && corral.tropas.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-xs text-stone-500 mb-2">Tropas en este corral:</p>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {corral.tropas.map((tropa) => (
                            <div key={tropa.id} className="flex justify-between text-xs">
                              <span className="font-mono text-stone-700">{tropa.codigo}</span>
                              <span className="text-stone-500">
                                {tropa.cantidadCabezas} cab. - {tropa.productor?.nombre || 'S/P'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Alertas */}
                    {porcentaje >= 100 && (
                      <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Capacidad máxima alcanzada</span>
                      </div>
                    )}
                    {porcentaje >= 80 && porcentaje < 100 && (
                      <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-2 rounded">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Capacidad cercana al límite</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Mensaje si no hay resultados */}
        {!loading && corralesFiltrados.length === 0 && (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center text-stone-400">
              <Warehouse className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No hay corrales que coincidan con el filtro</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default StocksCorralesModule
