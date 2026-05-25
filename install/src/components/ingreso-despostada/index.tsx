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
  Package, Loader2, RefreshCw, Plus, ArrowRight, Scale
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface IngresoDespostada {
  id: string
  fecha: string
  tropaCodigo: string
  mediaCodigo: string
  tipoMedia: 'DELANTERA' | 'TRASERA'
  pesoKg: number
  origen: string
  destino: string
  estado: 'PENDIENTE' | 'INGRESADO' | 'EN_PROCESO'
  operador: string
}

interface Props {
  operador: Operador
}

export function IngresoDespostadaModule({ operador }: Props) {
  const [ingresos, setIngresos] = useState<IngresoDespostada[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'TODOS' | 'PENDIENTE' | 'INGRESADO' | 'EN_PROCESO'>('PENDIENTE')
  
  // Form state
  const [tropaCodigo, setTropaCodigo] = useState('')
  const [mediaCodigo, setMediaCodigo] = useState('')
  const [tipoMedia, setTipoMedia] = useState<'DELANTERA' | 'TRASERA'>('DELANTERA')
  const [pesoKg, setPesoKg] = useState('')
  const [destino, setDestino] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchIngresos()
  }, [])

  const fetchIngresos = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setIngresos([
        {
          id: '1',
          fecha: new Date().toISOString(),
          tropaCodigo: 'B 2026 0008',
          mediaCodigo: 'MED-001-D',
          tipoMedia: 'DELANTERA',
          pesoKg: 85,
          origen: 'Cámara 1',
          destino: 'Despostada 1',
          estado: 'PENDIENTE',
          operador: 'Juan Pérez'
        },
        {
          id: '2',
          fecha: new Date().toISOString(),
          tropaCodigo: 'B 2026 0008',
          mediaCodigo: 'MED-001-T',
          tipoMedia: 'TRASERA',
          pesoKg: 95,
          origen: 'Cámara 1',
          destino: 'Despostada 1',
          estado: 'INGRESADO',
          operador: 'María García'
        },
        {
          id: '3',
          fecha: new Date(Date.now() - 3600000).toISOString(),
          tropaCodigo: 'B 2026 0007',
          mediaCodigo: 'MED-002-D',
          tipoMedia: 'DELANTERA',
          pesoKg: 82,
          origen: 'Cámara 2',
          destino: 'Despostada 2',
          estado: 'EN_PROCESO',
          operador: 'Carlos López'
        }
      ])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar ingresos')
    } finally {
      setLoading(false)
    }
  }

  const handleIngresar = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setIngresos(ingresos.map(i => 
        i.id === id ? { ...i, estado: 'INGRESADO' } : i
      ))
      
      toast.success('Media ingresada a despostada')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al ingresar')
    }
  }

  const handleNuevoIngreso = async () => {
    if (!tropaCodigo || !mediaCodigo || !pesoKg || !destino) {
      toast.error('Complete todos los campos obligatorios')
      return
    }

    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const nuevoIngreso: IngresoDespostada = {
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        tropaCodigo,
        mediaCodigo,
        tipoMedia,
        pesoKg: parseFloat(pesoKg),
        origen: 'Cámara 1',
        destino,
        estado: 'PENDIENTE',
        operador: operador.nombre
      }
      
      setIngresos([nuevoIngreso, ...ingresos])
      setTropaCodigo('')
      setMediaCodigo('')
      setPesoKg('')
      setDestino('')
      toast.success('Ingreso registrado correctamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al registrar ingreso')
    } finally {
      setSaving(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge className="bg-amber-100 text-amber-700">Pendiente</Badge>
      case 'INGRESADO':
        return <Badge className="bg-blue-100 text-blue-700">Ingresado</Badge>
      case 'EN_PROCESO':
        return <Badge className="bg-purple-100 text-purple-700">En Proceso</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const getTipoBadge = (tipo: string) => {
    return tipo === 'DELANTERA' 
      ? <Badge variant="outline" className="border-emerald-300 text-emerald-700">Delantera</Badge>
      : <Badge variant="outline" className="border-purple-300 text-purple-700">Trasera</Badge>
  }

  const ingresosFiltrados = ingresos.filter(i => 
    filtro === 'TODOS' || i.estado === filtro
  )

  const pendientes = ingresos.filter(i => i.estado === 'PENDIENTE').length
  const ingresados = ingresos.filter(i => i.estado === 'INGRESADO').length
  const enProceso = ingresos.filter(i => i.estado === 'EN_PROCESO').length
  const pesoTotal = ingresos.reduce((acc, i) => acc + i.pesoKg, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Package className="w-8 h-8 text-amber-500" />
              Ingreso a Despostada
            </h1>
            <p className="text-stone-500 mt-1">Control de medias ingresadas a despostada</p>
          </div>
          <Button onClick={fetchIngresos} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('TODOS')}>
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Total</p>
              <p className="text-3xl font-bold text-stone-800">{ingresos.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('PENDIENTE')}>
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Pendientes</p>
              <p className="text-3xl font-bold text-amber-600">{pendientes}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('INGRESADO')}>
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Ingresados</p>
              <p className="text-3xl font-bold text-blue-600">{ingresados}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('EN_PROCESO')}>
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">En Proceso</p>
              <p className="text-3xl font-bold text-purple-600">{enProceso}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Peso Total</p>
              <p className="text-3xl font-bold text-stone-800">{pesoTotal.toLocaleString()} kg</p>
            </CardContent>
          </Card>
        </div>

        {/* Formulario */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500" />
              Nuevo Ingreso
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label>Tropa *</Label>
                <Input
                  value={tropaCodigo}
                  onChange={(e) => setTropaCodigo(e.target.value)}
                  placeholder="B 2026 0001"
                />
              </div>
              <div className="space-y-2">
                <Label>Media *</Label>
                <Input
                  value={mediaCodigo}
                  onChange={(e) => setMediaCodigo(e.target.value)}
                  placeholder="MED-001-D"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={tipoMedia} onValueChange={(v) => setTipoMedia(v as 'DELANTERA' | 'TRASERA')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DELANTERA">Delantera</SelectItem>
                    <SelectItem value="TRASERA">Trasera</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Peso (Kg) *</Label>
                <Input
                  type="number"
                  value={pesoKg}
                  onChange={(e) => setPesoKg(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Destino *</Label>
                <Select value={destino} onValueChange={setDestino}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Despostada 1">Despostada 1</SelectItem>
                    <SelectItem value="Despostada 2">Despostada 2</SelectItem>
                    <SelectItem value="Despostada 3">Despostada 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleNuevoIngreso} 
                  className="w-full bg-amber-500 hover:bg-amber-600"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  Registrar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold">
              Medias {filtro !== 'TODOS' ? `- ${filtro}` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : ingresosFiltrados.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No hay ingresos {filtro.toLowerCase()}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tropa</TableHead>
                    <TableHead>Media</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingresosFiltrados.map((ing) => (
                    <TableRow key={ing.id}>
                      <TableCell>
                        {new Date(ing.fecha).toLocaleDateString('es-AR')}
                      </TableCell>
                      <TableCell className="font-mono">{ing.tropaCodigo}</TableCell>
                      <TableCell className="font-mono">{ing.mediaCodigo}</TableCell>
                      <TableCell>{getTipoBadge(ing.tipoMedia)}</TableCell>
                      <TableCell>{ing.pesoKg} kg</TableCell>
                      <TableCell>{ing.origen}</TableCell>
                      <TableCell>{ing.destino}</TableCell>
                      <TableCell>{getEstadoBadge(ing.estado)}</TableCell>
                      <TableCell>
                        {ing.estado === 'PENDIENTE' && (
                          <Button
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600"
                            onClick={() => handleIngresar(ing.id)}
                          >
                            <ArrowRight className="w-4 h-4 mr-1" />
                            Ingresar
                          </Button>
                        )}
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

export default IngresoDespostadaModule
