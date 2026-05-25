'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  Truck, Loader2, RefreshCw, Plus, Send, Package
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Expedicion {
  id: string
  fecha: string
  tropaCodigo: string
  destino: string
  cantidadCajones: number
  pesoTotal: number
  estado: 'PREPARANDO' | 'LISTO' | 'DESPACHADO'
  transportista: string
  patente: string
  operador: string
}

interface Props {
  operador: Operador
}

export function ExpedicionModule({ operador }: Props) {
  const [expediciones, setExpediciones] = useState<Expedicion[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'TODOS' | 'PREPARANDO' | 'LISTO' | 'DESPACHADO'>('TODOS')
  
  // Form state
  const [destino, setDestino] = useState('')
  const [transportista, setTransportista] = useState('')
  const [patente, setPatente] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchExpediciones()
  }, [])

  const fetchExpediciones = async () => {
    setLoading(true)
    try {
      // Simulated data - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))
      setExpediciones([
        {
          id: '1',
          fecha: new Date().toISOString(),
          tropaCodigo: 'B 2026 0008',
          destino: 'Carnicería Don José',
          cantidadCajones: 24,
          pesoTotal: 1200,
          estado: 'LISTO',
          transportista: 'Transportes López',
          patente: 'AB 123 CD',
          operador: 'Juan Pérez'
        },
        {
          id: '2',
          fecha: new Date().toISOString(),
          tropaCodigo: 'B 2026 0007',
          destino: 'Supermercados del Valle',
          cantidadCajones: 36,
          pesoTotal: 1800,
          estado: 'PREPARANDO',
          transportista: 'Logística Norte',
          patente: 'CD 456 EF',
          operador: 'María García'
        },
        {
          id: '3',
          fecha: new Date(Date.now() - 86400000).toISOString(),
          tropaCodigo: 'B 2026 0006',
          destino: 'Frigorífico Regional',
          cantidadCajones: 18,
          pesoTotal: 900,
          estado: 'DESPACHADO',
          transportista: 'Transportes López',
          patente: 'GH 789 IJ',
          operador: 'Carlos López'
        }
      ])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar expediciones')
    } finally {
      setLoading(false)
    }
  }

  const handleDespachar = async (id: string) => {
    try {
      // Simulated update - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setExpediciones(expediciones.map(e => 
        e.id === id ? { ...e, estado: 'DESPACHADO' } : e
      ))
      
      toast.success('Expedición despachada correctamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al despachar')
    }
  }

  const handleMarcarListo = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setExpediciones(expediciones.map(e => 
        e.id === id ? { ...e, estado: 'LISTO' } : e
      ))
      
      toast.success('Expedición marcada como lista')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar')
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PREPARANDO':
        return <Badge className="bg-amber-100 text-amber-700">Preparando</Badge>
      case 'LISTO':
        return <Badge className="bg-blue-100 text-blue-700">Listo para despachar</Badge>
      case 'DESPACHADO':
        return <Badge className="bg-emerald-100 text-emerald-700">Despachado</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const expedicionesFiltradas = expediciones.filter(e => 
    filtro === 'TODOS' || e.estado === filtro
  )

  const preparando = expediciones.filter(e => e.estado === 'PREPARANDO').length
  const listos = expediciones.filter(e => e.estado === 'LISTO').length
  const despachados = expediciones.filter(e => e.estado === 'DESPACHADO').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Truck className="w-8 h-8 text-amber-500" />
              Expedición
            </h1>
            <p className="text-stone-500 mt-1">Gestión de expediciones y despachos</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchExpediciones} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Button className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Expedición
            </Button>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('TODOS')}>
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Total</p>
              <p className="text-3xl font-bold text-stone-800">{expediciones.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('PREPARANDO')}>
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Preparando</p>
              <p className="text-3xl font-bold text-amber-600">{preparando}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('LISTO')}>
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Listos</p>
              <p className="text-3xl font-bold text-blue-600">{listos}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('DESPACHADO')}>
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Despachados</p>
              <p className="text-3xl font-bold text-emerald-600">{despachados}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-stone-600">Filtrar:</span>
              <div className="flex gap-2">
                {(['TODOS', 'PREPARANDO', 'LISTO', 'DESPACHADO'] as const).map((f) => (
                  <Button
                    key={f}
                    variant={filtro === f ? 'default' : 'outline'}
                    size="sm"
                    className={filtro === f ? 'bg-amber-500 hover:bg-amber-600' : ''}
                    onClick={() => setFiltro(f)}
                  >
                    {f === 'TODOS' ? 'Todos' : f === 'LISTO' ? 'Listos' : f === 'PREPARANDO' ? 'Preparando' : 'Despachados'}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de expediciones */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              Expediciones
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : expedicionesFiltradas.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <Truck className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No hay expediciones</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tropa</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Cajones</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Transportista</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expedicionesFiltradas.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell>
                        {new Date(exp.fecha).toLocaleDateString('es-AR')}
                      </TableCell>
                      <TableCell className="font-mono font-medium">{exp.tropaCodigo}</TableCell>
                      <TableCell>{exp.destino}</TableCell>
                      <TableCell>{exp.cantidadCajones}</TableCell>
                      <TableCell>{exp.pesoTotal.toLocaleString()} kg</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{exp.transportista}</p>
                          <p className="text-xs text-stone-400">{exp.patente}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getEstadoBadge(exp.estado)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {exp.estado === 'PREPARANDO' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarcarListo(exp.id)}
                            >
                              Listo
                            </Button>
                          )}
                          {exp.estado === 'LISTO' && (
                            <Button
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600"
                              onClick={() => handleDespachar(exp.id)}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Despachar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ExpedicionModule
