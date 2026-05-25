'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  Package, Thermometer, Snowflake, Sun, Edit, Plus, Loader2, RefreshCw, Save, X, Search
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface CondicionEmbalaje {
  id: string
  codigo: string
  nombre: string
  tipo: 'REFRIGERADO' | 'CONGELADO' | 'AMBIENTE'
  temperaturaMin: number
  temperaturaMax: number
  humedadMax: number
  descripcion?: string
  activo: boolean
}

interface Props {
  operador: Operador
}

export function ConfigCondicionesEmbalajeModule({ operador }: Props) {
  const [condiciones, setCondiciones] = useState<CondicionEmbalaje[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS')
  const [busqueda, setBusqueda] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<CondicionEmbalaje | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<'REFRIGERADO' | 'CONGELADO' | 'AMBIENTE'>('REFRIGERADO')
  const [tempMin, setTempMin] = useState('0')
  const [tempMax, setTempMax] = useState('4')
  const [humedad, setHumedad] = useState('85')
  const [descripcion, setDescripcion] = useState('')
  const [activo, setActivo] = useState(true)

  useEffect(() => {
    fetchCondiciones()
  }, [])

  const fetchCondiciones = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setCondiciones([
        { id: '1', codigo: 'REF-001', nombre: 'Refrigeración Estándar', tipo: 'REFRIGERADO', temperaturaMin: 0, temperaturaMax: 4, humedadMax: 85, activo: true },
        { id: '2', codigo: 'REF-002', nombre: 'Refrigeración Media Res', tipo: 'REFRIGERADO', temperaturaMin: -1, temperaturaMax: 2, humedadMax: 90, activo: true },
        { id: '3', codigo: 'CON-001', nombre: 'Congelación Estándar', tipo: 'CONGELADO', temperaturaMin: -25, temperaturaMax: -18, humedadMax: 95, activo: true },
        { id: '4', codigo: 'CON-002', nombre: 'Congelación Exportación', tipo: 'CONGELADO', temperaturaMin: -30, temperaturaMax: -25, humedadMax: 95, activo: true },
        { id: '5', codigo: 'AMB-001', nombre: 'Ambiente Seco', tipo: 'AMBIENTE', temperaturaMin: 15, temperaturaMax: 25, humedadMax: 60, activo: true },
        { id: '6', codigo: 'AMB-002', nombre: 'Ambiente Controlado', tipo: 'AMBIENTE', temperaturaMin: 18, temperaturaMax: 22, humedadMax: 50, activo: false },
      ])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar condiciones')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (condicion?: CondicionEmbalaje) => {
    if (condicion) {
      setEditando(condicion)
      setCodigo(condicion.codigo)
      setNombre(condicion.nombre)
      setTipo(condicion.tipo)
      setTempMin(condicion.temperaturaMin.toString())
      setTempMax(condicion.temperaturaMax.toString())
      setHumedad(condicion.humedadMax.toString())
      setDescripcion(condicion.descripcion || '')
      setActivo(condicion.activo)
    } else {
      setEditando(null)
      setCodigo('')
      setNombre('')
      setTipo('REFRIGERADO')
      setTempMin('0')
      setTempMax('4')
      setHumedad('85')
      setDescripcion('')
      setActivo(true)
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!codigo || !nombre) {
      toast.error('Complete los campos obligatorios')
      return
    }

    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (editando) {
        setCondiciones(condiciones.map(c => 
          c.id === editando.id 
            ? { ...c, codigo, nombre, tipo, temperaturaMin: parseFloat(tempMin), temperaturaMax: parseFloat(tempMax), humedadMax: parseFloat(humedad), descripcion, activo }
            : c
        ))
        toast.success('Condición actualizada correctamente')
      } else {
        const nueva: CondicionEmbalaje = {
          id: Date.now().toString(),
          codigo,
          nombre,
          tipo,
          temperaturaMin: parseFloat(tempMin),
          temperaturaMax: parseFloat(tempMax),
          humedadMax: parseFloat(humedad),
          descripcion,
          activo
        }
        setCondiciones([nueva, ...condiciones])
        toast.success('Condición creada correctamente')
      }
      setDialogOpen(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActivo = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      setCondiciones(condiciones.map(c => 
        c.id === id ? { ...c, activo: !c.activo } : c
      ))
      toast.success('Estado actualizado')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar')
    }
  }

  const getTipoBadge = (t: string) => {
    switch (t) {
      case 'REFRIGERADO':
        return <Badge className="bg-blue-100 text-blue-700"><Thermometer className="w-3 h-3 mr-1" />Refrigerado</Badge>
      case 'CONGELADO':
        return <Badge className="bg-purple-100 text-purple-700"><Snowflake className="w-3 h-3 mr-1" />Congelado</Badge>
      case 'AMBIENTE':
        return <Badge className="bg-amber-100 text-amber-700"><Sun className="w-3 h-3 mr-1" />Ambiente</Badge>
      default:
        return <Badge>{t}</Badge>
    }
  }

  const condicionesFiltradas = condiciones.filter(c => {
    const matchTipo = filtroTipo === 'TODOS' || c.tipo === filtroTipo
    const matchBusqueda = !busqueda || 
      c.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.nombre.toLowerCase().includes(busqueda.toLowerCase())
    return matchTipo && matchBusqueda
  })

  const activos = condiciones.filter(c => c.activo).length
  const refrigerados = condiciones.filter(c => c.tipo === 'REFRIGERADO').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Package className="w-8 h-8 text-amber-500" />
              Condiciones de Embalaje
            </h1>
            <p className="text-stone-500 mt-1">Configuración de condiciones de almacenamiento y transporte</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchCondiciones} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={() => handleOpenDialog()} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Condición
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Total Condiciones</p>
              <p className="text-3xl font-bold text-stone-800">{condiciones.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Activas</p>
              <p className="text-3xl font-bold text-emerald-600">{activos}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Refrigerados</p>
              <p className="text-3xl font-bold text-blue-600">{refrigerados}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Congelados</p>
              <p className="text-3xl font-bold text-purple-600">{condiciones.filter(c => c.tipo === 'CONGELADO').length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por código o nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="REFRIGERADO">Refrigerado</SelectItem>
                  <SelectItem value="CONGELADO">Congelado</SelectItem>
                  <SelectItem value="AMBIENTE">Ambiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : condicionesFiltradas.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No hay condiciones registradas</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Temp. Rango</TableHead>
                    <TableHead>Humedad Max</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {condicionesFiltradas.map((c) => (
                    <TableRow key={c.id} className={!c.activo ? 'opacity-50' : ''}>
                      <TableCell className="font-mono">{c.codigo}</TableCell>
                      <TableCell>{c.nombre}</TableCell>
                      <TableCell>{getTipoBadge(c.tipo)}</TableCell>
                      <TableCell>{c.temperaturaMin}°C a {c.temperaturaMax}°C</TableCell>
                      <TableCell>{c.humedadMax}%</TableCell>
                      <TableCell>
                        {c.activo 
                          ? <Badge className="bg-emerald-100 text-emerald-700">Activo</Badge>
                          : <Badge className="bg-stone-100 text-stone-500">Inactivo</Badge>
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleOpenDialog(c)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant={c.activo ? "destructive" : "outline"}
                            onClick={() => handleToggleActivo(c.id)}
                          >
                            {c.activo ? 'Desactivar' : 'Activar'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar Condición' : 'Nueva Condición de Embalaje'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="REF-001" />
                </div>
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as 'REFRIGERADO' | 'CONGELADO' | 'AMBIENTE')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REFRIGERADO">Refrigerado</SelectItem>
                    <SelectItem value="CONGELADO">Congelado</SelectItem>
                    <SelectItem value="AMBIENTE">Ambiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Temp. Min (°C)</Label>
                  <Input type="number" value={tempMin} onChange={(e) => setTempMin(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Temp. Max (°C)</Label>
                  <Input type="number" value={tempMax} onChange={(e) => setTempMax(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Humedad Max (%)</Label>
                  <Input type="number" value={humedad} onChange={(e) => setHumedad(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción opcional" />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={activo ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActivo(!activo)}
                  className={activo ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                >
                  {activo ? 'Activo' : 'Inactivo'}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default ConfigCondicionesEmbalajeModule
