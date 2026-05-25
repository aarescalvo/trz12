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
  Package, Loader2, RefreshCw, Plus, CheckCircle
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Empaque {
  id: string
  fecha: string
  paqueteId: string
  producto: string
  pesoKg: number
  cantidad: number
  destino: string
  estado: 'PENDIENTE' | 'EMPACADO' | 'DESPACHADO'
  operador: string
}

interface Props {
  operador: Operador
}

const PRODUCTOS = [
  'Carne Molida',
  'Bola de Lomo',
  'Nalga',
  'Cuadril',
  'Colita de Cuadril',
  'Bife de Chorizo',
  'Bife Angosto',
  'Osobuco',
  'Costilla',
  'Falda',
  'Vacío',
  'Matambre',
  'Asado',
  'Hígado',
  'Riñón',
  'Corazón'
]

const DESTINOS = [
  'Cámara Frigorífica 1',
  'Cámara Frigorífica 2',
  'Expedición Local',
  'Exportación',
  'Cadena de Supermercados A',
  'Cadena de Supermercados B',
  'Distribuidora Regional'
]

export function EmpaqueModule({ operador }: Props) {
  const [empaques, setEmpaques] = useState<Empaque[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'TODOS' | 'PENDIENTE' | 'EMPACADO' | 'DESPACHADO'>('TODOS')
  
  // Form state
  const [producto, setProducto] = useState('')
  const [pesoKg, setPesoKg] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [destino, setDestino] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchEmpaques()
  }, [])

  const fetchEmpaques = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setEmpaques([
        {
          id: '1',
          fecha: new Date().toISOString(),
          paqueteId: 'EMP-2024-0001',
          producto: 'Bola de Lomo',
          pesoKg: 25.5,
          cantidad: 10,
          destino: 'Cámara Frigorífica 1',
          estado: 'EMPACADO',
          operador: 'Juan Pérez'
        },
        {
          id: '2',
          fecha: new Date().toISOString(),
          paqueteId: 'EMP-2024-0002',
          producto: 'Carne Molida',
          pesoKg: 15.0,
          cantidad: 20,
          destino: 'Cadena de Supermercados A',
          estado: 'PENDIENTE',
          operador: 'María García'
        },
        {
          id: '3',
          fecha: new Date(Date.now() - 3600000).toISOString(),
          paqueteId: 'EMP-2024-0003',
          producto: 'Bife de Chorizo',
          pesoKg: 35.0,
          cantidad: 15,
          destino: 'Exportación',
          estado: 'DESPACHADO',
          operador: 'Carlos López'
        },
        {
          id: '4',
          fecha: new Date(Date.now() - 7200000).toISOString(),
          paqueteId: 'EMP-2024-0004',
          producto: 'Nalga',
          pesoKg: 42.0,
          cantidad: 8,
          destino: 'Cámara Frigorífica 2',
          estado: 'PENDIENTE',
          operador: 'Ana Martínez'
        },
        {
          id: '5',
          fecha: new Date(Date.now() - 10800000).toISOString(),
          paqueteId: 'EMP-2024-0005',
          producto: 'Vacío',
          pesoKg: 18.5,
          cantidad: 12,
          destino: 'Expedición Local',
          estado: 'EMPACADO',
          operador: 'Pedro Sánchez'
        },
        {
          id: '6',
          fecha: new Date(Date.now() - 14400000).toISOString(),
          paqueteId: 'EMP-2024-0006',
          producto: 'Costilla',
          pesoKg: 28.0,
          cantidad: 6,
          destino: 'Distribuidora Regional',
          estado: 'PENDIENTE',
          operador: 'Laura Torres'
        }
      ])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar empaques')
    } finally {
      setLoading(false)
    }
  }

  const handleEmpacar = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setEmpaques(empaques.map(e => 
        e.id === id ? { ...e, estado: 'EMPACADO' } : e
      ))
      
      toast.success('Paquete marcado como empacado')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar estado')
    }
  }

  const handleNuevoEmpaque = async () => {
    if (!producto || !pesoKg || !cantidad || !destino) {
      toast.error('Complete todos los campos obligatorios')
      return
    }

    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const nextId = empaques.length + 1
      const nuevoEmpaque: Empaque = {
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        paqueteId: `EMP-2024-${String(nextId).padStart(4, '0')}`,
        producto,
        pesoKg: parseFloat(pesoKg),
        cantidad: parseInt(cantidad),
        destino,
        estado: 'PENDIENTE',
        operador: operador.nombre
      }
      
      setEmpaques([nuevoEmpaque, ...empaques])
      setProducto('')
      setPesoKg('')
      setCantidad('')
      setDestino('')
      toast.success('Paquete creado correctamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al crear paquete')
    } finally {
      setSaving(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pendiente</Badge>
      case 'EMPACADO':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Empacado</Badge>
      case 'DESPACHADO':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Despachado</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const empaquesFiltrados = empaques.filter(e => 
    filtro === 'TODOS' || e.estado === filtro
  )

  const totalPaquetes = empaques.length
  const pendientes = empaques.filter(e => e.estado === 'PENDIENTE').length
  const empacados = empaques.filter(e => e.estado === 'EMPACADO').length
  const pesoTotal = empaques.reduce((acc, e) => acc + (e.pesoKg * e.cantidad), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Package className="w-8 h-8 text-amber-500" />
              Empaque de Productos
            </h1>
            <p className="text-stone-500 mt-1">Control de empaquetado de productos cárnicos</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-500">
              Operador: <span className="font-medium text-stone-700">{operador.nombre}</span>
            </span>
            <Button onClick={fetchEmpaques} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card 
            className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow bg-white" 
            onClick={() => setFiltro('TODOS')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wide">Total Paquetes</p>
                  <p className="text-3xl font-bold text-stone-800 mt-1">{totalPaquetes}</p>
                </div>
                <Package className="w-8 h-8 text-stone-300" />
              </div>
            </CardContent>
          </Card>
          <Card 
            className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow bg-white" 
            onClick={() => setFiltro('PENDIENTE')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wide">Pendientes</p>
                  <p className="text-3xl font-bold text-amber-600 mt-1">{pendientes}</p>
                </div>
                <Package className="w-8 h-8 text-amber-300" />
              </div>
            </CardContent>
          </Card>
          <Card 
            className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow bg-white" 
            onClick={() => setFiltro('EMPACADO')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wide">Empacados</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">{empacados}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-300" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wide">Peso Total</p>
                  <p className="text-3xl font-bold text-stone-800 mt-1">{pesoTotal.toLocaleString('es-AR', { maximumFractionDigits: 1 })} kg</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-stone-500">KG</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulario */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="bg-stone-50 rounded-t-lg border-b border-stone-100">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-stone-800">
              <Plus className="w-5 h-5 text-amber-500" />
              Nuevo Paquete
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label className="text-stone-600">Producto *</Label>
                <Select value={producto} onValueChange={setProducto}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCTOS.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-stone-600">Peso por Unidad (Kg) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={pesoKg}
                  onChange={(e) => setPesoKg(e.target.value)}
                  placeholder="0.0"
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-stone-600">Cantidad *</Label>
                <Input
                  type="number"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="0"
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-stone-600">Destino *</Label>
                <Select value={destino} onValueChange={setDestino}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Seleccionar destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {DESTINOS.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleNuevoEmpaque} 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Package className="w-4 h-4 mr-2" />
                  )}
                  Crear Paquete
                </Button>
              </div>
            </div>
            {producto && pesoKg && cantidad && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-sm text-amber-700">
                  <span className="font-medium">Resumen:</span> {cantidad} unidades × {pesoKg} kg = 
                  <span className="font-bold"> {(parseFloat(pesoKg) * parseInt(cantidad || '0')).toLocaleString('es-AR', { maximumFractionDigits: 1 })} kg totales</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="bg-stone-50 rounded-t-lg border-b border-stone-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-stone-800">
                Paquetes {filtro !== 'TODOS' ? `- ${filtro.charAt(0) + filtro.slice(1).toLowerCase()}` : ''}
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant={filtro === 'TODOS' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFiltro('TODOS')}
                  className={filtro === 'TODOS' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                >
                  Todos
                </Button>
                <Button 
                  variant={filtro === 'PENDIENTE' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFiltro('PENDIENTE')}
                  className={filtro === 'PENDIENTE' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                >
                  Pendientes
                </Button>
                <Button 
                  variant={filtro === 'EMPACADO' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFiltro('EMPACADO')}
                  className={filtro === 'EMPACADO' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                >
                  Empacados
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : empaquesFiltrados.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No hay paquetes {filtro.toLowerCase()}</p>
                <p className="text-sm mt-1">Cree un nuevo paquete usando el formulario superior</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50/50 hover:bg-stone-50/50">
                      <TableHead className="font-semibold text-stone-600">Fecha</TableHead>
                      <TableHead className="font-semibold text-stone-600">ID Paquete</TableHead>
                      <TableHead className="font-semibold text-stone-600">Producto</TableHead>
                      <TableHead className="font-semibold text-stone-600">Peso</TableHead>
                      <TableHead className="font-semibold text-stone-600">Cantidad</TableHead>
                      <TableHead className="font-semibold text-stone-600">Destino</TableHead>
                      <TableHead className="font-semibold text-stone-600">Estado</TableHead>
                      <TableHead className="font-semibold text-stone-600">Operador</TableHead>
                      <TableHead className="font-semibold text-stone-600 text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empaquesFiltrados.map((emp) => (
                      <TableRow key={emp.id} className="hover:bg-stone-50/50">
                        <TableCell className="text-stone-600">
                          {new Date(emp.fecha).toLocaleDateString('es-AR')}
                        </TableCell>
                        <TableCell className="font-mono font-medium text-stone-800">{emp.paqueteId}</TableCell>
                        <TableCell className="font-medium text-stone-800">{emp.producto}</TableCell>
                        <TableCell className="text-stone-600">{emp.pesoKg.toLocaleString('es-AR')} kg</TableCell>
                        <TableCell className="text-stone-600">{emp.cantidad} uds</TableCell>
                        <TableCell className="text-stone-600 max-w-[150px] truncate">{emp.destino}</TableCell>
                        <TableCell>{getEstadoBadge(emp.estado)}</TableCell>
                        <TableCell className="text-stone-600">{emp.operador}</TableCell>
                        <TableCell className="text-center">
                          {emp.estado === 'PENDIENTE' && (
                            <Button
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600 text-white"
                              onClick={() => handleEmpacar(emp.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Empacar
                            </Button>
                          )}
                          {emp.estado === 'EMPACADO' && (
                            <span className="text-sm text-emerald-600 flex items-center justify-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Listo
                            </span>
                          )}
                          {emp.estado === 'DESPACHADO' && (
                            <span className="text-sm text-blue-600">En tránsito</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center text-sm text-stone-400 py-4">
          <p>Módulo de Empaque • Frigorífico • {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
    </div>
  )
}

export default EmpaqueModule
