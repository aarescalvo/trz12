'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import {
  Package, Loader2, RefreshCw, Plus, CheckCircle,
  Truck, Scale, Archive
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Cuero {
  id: string
  fecha: string
  tropaCodigo: string
  cantidad: number
  pesoKg: number
  conservacion: 'SALADO' | 'FRESCO'
  destino: string
  estado: 'PENDIENTE' | 'PROCESADO' | 'DESPACHADO'
  operador: string
  fechaProcesado?: string
  fechaDespachado?: string
}

interface Props {
  operador: Operador
}

export function CuerosModule({ operador }: Props) {
  // Simulated data with hardcoded examples
  const [cueros, setCueros] = useState<Cuero[]>([
    {
      id: '1',
      fecha: new Date().toISOString(),
      tropaCodigo: 'T-2024-001',
      cantidad: 45,
      pesoKg: 1850.5,
      conservacion: 'SALADO',
      destino: 'Curtiembre San Martín',
      estado: 'PENDIENTE',
      operador: 'Carlos Rodríguez'
    },
    {
      id: '2',
      fecha: new Date(Date.now() - 86400000).toISOString(),
      tropaCodigo: 'T-2024-002',
      cantidad: 38,
      pesoKg: 1620.0,
      conservacion: 'FRESCO',
      destino: 'Frigorífico Norte',
      estado: 'PROCESADO',
      operador: 'María García',
      fechaProcesado: new Date(Date.now() - 43200000).toISOString()
    },
    {
      id: '3',
      fecha: new Date(Date.now() - 172800000).toISOString(),
      tropaCodigo: 'T-2024-003',
      cantidad: 52,
      pesoKg: 2100.0,
      conservacion: 'SALADO',
      destino: 'Exportación Brasil',
      estado: 'DESPACHADO',
      operador: 'Juan Pérez',
      fechaProcesado: new Date(Date.now() - 129600000).toISOString(),
      fechaDespachado: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '4',
      fecha: new Date(Date.now() - 259200000).toISOString(),
      tropaCodigo: 'T-2024-004',
      cantidad: 30,
      pesoKg: 1250.0,
      conservacion: 'SALADO',
      destino: 'Curtiembre del Valle',
      estado: 'PROCESADO',
      operador: 'Ana Martínez',
      fechaProcesado: new Date(Date.now() - 216000000).toISOString()
    },
    {
      id: '5',
      fecha: new Date(Date.now() - 345600000).toISOString(),
      tropaCodigo: 'T-2024-005',
      cantidad: 48,
      pesoKg: 1920.5,
      conservacion: 'FRESCO',
      destino: 'Mercado Local',
      estado: 'PENDIENTE',
      operador: 'Pedro Sánchez'
    }
  ])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [tropaCodigo, setTropaCodigo] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [pesoKg, setPesoKg] = useState('')
  const [conservacion, setConservacion] = useState<'SALADO' | 'FRESCO'>('SALADO')
  const [destino, setDestino] = useState('')

  // Summary calculations
  const totalCueros = cueros.reduce((acc, c) => acc + c.cantidad, 0)
  const pendientes = cueros.filter(c => c.estado === 'PENDIENTE')
  const procesados = cueros.filter(c => c.estado === 'PROCESADO')
  const totalPeso = cueros.reduce((acc, c) => acc + c.pesoKg, 0)

  const handleRefresh = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setLoading(false)
    toast.success('Datos actualizados')
  }

  const handleRegistrar = async () => {
    if (!tropaCodigo || !cantidad || !pesoKg || !destino) {
      toast.error('Complete todos los campos obligatorios')
      return
    }

    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 500))

    const nuevoCuero: Cuero = {
      id: Date.now().toString(),
      fecha: new Date().toISOString(),
      tropaCodigo,
      cantidad: parseInt(cantidad),
      pesoKg: parseFloat(pesoKg),
      conservacion,
      destino,
      estado: 'PENDIENTE',
      operador: operador.nombre
    }

    setCueros([nuevoCuero, ...cueros])
    setTropaCodigo('')
    setCantidad('')
    setPesoKg('')
    setDestino('')
    setSaving(false)
    toast.success('Cuero registrado correctamente')
  }

  const handleProcesar = async (id: string) => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 300))

    setCueros(cueros.map(c => 
      c.id === id 
        ? { ...c, estado: 'PROCESADO' as const, fechaProcesado: new Date().toISOString() }
        : c
    ))
    setSaving(false)
    toast.success('Cuero procesado correctamente')
  }

  const handleDespachar = async (id: string) => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 300))

    setCueros(cueros.map(c => 
      c.id === id 
        ? { ...c, estado: 'DESPACHADO' as const, fechaDespachado: new Date().toISOString() }
        : c
    ))
    setSaving(false)
    toast.success('Cuero despachado correctamente')
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">PENDIENTE</Badge>
      case 'PROCESADO':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">PROCESADO</Badge>
      case 'DESPACHADO':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">DESPACHADO</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const getConservacionBadge = (conservacion: string) => {
    return conservacion === 'SALADO' 
      ? <Badge variant="outline" className="border-amber-300 text-amber-700">Salado</Badge>
      : <Badge variant="outline" className="border-stone-300 text-stone-700">Fresco</Badge>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Package className="w-8 h-8 text-amber-500" />
              Control de Cueros
            </h1>
            <p className="text-stone-500 mt-1">Seguimiento de cueros como subproducto del frigorífico</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Actualizar
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500 uppercase">Total Cueros</p>
                  <p className="text-3xl font-bold text-stone-800">{totalCueros}</p>
                </div>
                <Package className="w-8 h-8 text-stone-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500 uppercase">Pendientes</p>
                  <p className="text-3xl font-bold text-amber-600">{pendientes.length}</p>
                </div>
                <Archive className="w-8 h-8 text-amber-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500 uppercase">Procesados</p>
                  <p className="text-3xl font-bold text-blue-600">{procesados.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500 uppercase">Peso Total</p>
                  <p className="text-3xl font-bold text-stone-800">{totalPeso.toLocaleString('es-AR', { maximumFractionDigits: 1 })}</p>
                  <p className="text-xs text-stone-400">kg</p>
                </div>
                <Scale className="w-8 h-8 text-stone-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Registration Form */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500" />
              Registro de Cueros
            </CardTitle>
            <CardDescription>
              Registre los cueros provenientes de la faena
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tropa">Código Tropa *</Label>
                <Input
                  id="tropa"
                  value={tropaCodigo}
                  onChange={(e) => setTropaCodigo(e.target.value)}
                  placeholder="T-2024-XXX"
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad *</Label>
                <Input
                  id="cantidad"
                  type="number"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="peso">Peso (kg) *</Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.1"
                  value={pesoKg}
                  onChange={(e) => setPesoKg(e.target.value)}
                  placeholder="0.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conservacion">Conservación *</Label>
                <Select value={conservacion} onValueChange={(v: 'SALADO' | 'FRESCO') => setConservacion(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALADO">Salado</SelectItem>
                    <SelectItem value="FRESCO">Fresco</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destino">Destino *</Label>
                <Input
                  id="destino"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  placeholder="Curtiembre / Cliente"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleRegistrar}
                  className="w-full bg-amber-500 hover:bg-amber-600"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Registrar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold">
              Historial de Cueros
            </CardTitle>
            <CardDescription>
              Listado completo de cueros registrados
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : cueros.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No hay cueros registrados</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tropa</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Peso (kg)</TableHead>
                    <TableHead>Conservación</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cueros.map((cuero) => (
                    <TableRow key={cuero.id}>
                      <TableCell className="font-medium">
                        {new Date(cuero.fecha).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="font-mono">{cuero.tropaCodigo}</TableCell>
                      <TableCell className="text-center font-bold">{cuero.cantidad}</TableCell>
                      <TableCell className="text-right font-bold text-amber-600">
                        {cuero.pesoKg.toLocaleString('es-AR', { maximumFractionDigits: 1 })}
                      </TableCell>
                      <TableCell>{getConservacionBadge(cuero.conservacion)}</TableCell>
                      <TableCell>{cuero.destino}</TableCell>
                      <TableCell>{getEstadoBadge(cuero.estado)}</TableCell>
                      <TableCell>{cuero.operador}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          {cuero.estado === 'PENDIENTE' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleProcesar(cuero.id)}
                              disabled={saving}
                              className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Procesar
                            </Button>
                          )}
                          {cuero.estado === 'PROCESADO' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDespachar(cuero.id)}
                              disabled={saving}
                              className="border-green-300 text-green-600 hover:bg-green-50"
                            >
                              <Truck className="w-4 h-4 mr-1" />
                              Despachar
                            </Button>
                          )}
                          {cuero.estado === 'DESPACHADO' && (
                            <span className="text-xs text-stone-400 italic px-2">
                              Completado
                            </span>
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

        {/* Info Footer */}
        <div className="text-center text-sm text-stone-400 py-4">
          <p>Módulo de Control de Cueros - Frigorífico</p>
          <p className="text-xs mt-1">Operador: {operador.nombre} | Rol: {operador.rol}</p>
        </div>
      </div>
    </div>
  )
}

export default CuerosModule
