'use client'

import { useState, useEffect } from 'react'
import { 
  Tag, Beef, Package, Edit, Plus, Save, X, Loader2, 
  Search, Power
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const FAMILIAS = [
  { id: 'BOVINO', label: 'Bovino', color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'PORCINO', label: 'Porcino', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { id: 'OVINO', label: 'Ovino', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'SUBPRODUCTO', label: 'Subproducto', color: 'bg-amber-100 text-amber-700 border-amber-200' },
]

interface TipoProducto {
  id: string
  codigo: string
  nombre: string
  familia: string
  descripcion: string
  requiereTrazabilidad: boolean
  activo: boolean
}

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface FormData {
  codigo: string
  nombre: string
  familia: string
  descripcion: string
  requiereTrazabilidad: boolean
  activo: boolean
}

interface Stats {
  total: number
  activos: number
  porFamilia: {
    bovino: number
    porcino: number
    ovino: number
    subproducto: number
  }
}

// Datos simulados
const simulateTiposProducto: TipoProducto[] = [
  {
    id: '1',
    codigo: 'TIP-001',
    nombre: 'Media Res',
    familia: 'BOVINO',
    descripcion: 'Media res bovina para distribución',
    requiereTrazabilidad: true,
    activo: true
  },
  {
    id: '2',
    codigo: 'TIP-002',
    nombre: 'Cuarto Delantero',
    familia: 'BOVINO',
    descripcion: 'Cuarto delantero de bovino',
    requiereTrazabilidad: true,
    activo: true
  },
  {
    id: '3',
    codigo: 'TIP-003',
    nombre: 'Cuarto Trasero',
    familia: 'BOVINO',
    descripcion: 'Cuarto trasero de bovino',
    requiereTrazabilidad: true,
    activo: true
  },
  {
    id: '4',
    codigo: 'TIP-004',
    nombre: 'Corte Vacío',
    familia: 'BOVINO',
    descripcion: 'Corte especial vacío',
    requiereTrazabilidad: true,
    activo: true
  },
  {
    id: '5',
    codigo: 'TIP-005',
    nombre: 'Cerdo Entero',
    familia: 'PORCINO',
    descripcion: 'Cerdo entero para procesamiento',
    requiereTrazabilidad: true,
    activo: true
  },
  {
    id: '6',
    codigo: 'TIP-006',
    nombre: 'Jamón Fresco',
    familia: 'PORCINO',
    descripcion: 'Jamón fresco de cerdo',
    requiereTrazabilidad: true,
    activo: true
  },
  {
    id: '7',
    codigo: 'TIP-007',
    nombre: 'Panceta',
    familia: 'PORCINO',
    descripcion: 'Panceta de cerdo',
    requiereTrazabilidad: false,
    activo: true
  },
  {
    id: '8',
    codigo: 'TIP-008',
    nombre: 'Cordero Entero',
    familia: 'OVINO',
    descripcion: 'Cordero entero para faena',
    requiereTrazabilidad: true,
    activo: true
  },
  {
    id: '9',
    codigo: 'TIP-009',
    nombre: 'Pierna de Cordero',
    familia: 'OVINO',
    descripcion: 'Pierna de cordero despostada',
    requiereTrazabilidad: true,
    activo: true
  },
  {
    id: '10',
    codigo: 'TIP-010',
    nombre: 'Carne Picada',
    familia: 'SUBPRODUCTO',
    descripcion: 'Carne picada para elaboración',
    requiereTrazabilidad: false,
    activo: true
  },
  {
    id: '11',
    codigo: 'TIP-011',
    nombre: 'Hamburguesa',
    familia: 'SUBPRODUCTO',
    descripcion: 'Hamburguesa elaborada',
    requiereTrazabilidad: false,
    activo: true
  },
  {
    id: '12',
    codigo: 'TIP-012',
    nombre: 'Chorizo Fresco',
    familia: 'SUBPRODUCTO',
    descripcion: 'Chorizo fresco para venta',
    requiereTrazabilidad: false,
    activo: false
  },
]

export function ConfigTiposProductoModule({ operador }: { operador: Operador }) {
  const [tiposProducto, setTiposProducto] = useState<TipoProducto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tipoEditando, setTipoEditando] = useState<TipoProducto | null>(null)
  
  // Filtros
  const [filtroFamilia, setFiltroFamilia] = useState<string>('TODOS')
  const [busqueda, setBusqueda] = useState('')
  
  // Form
  const [formData, setFormData] = useState<FormData>({
    codigo: '',
    nombre: '',
    familia: 'BOVINO',
    descripcion: '',
    requiereTrazabilidad: true,
    activo: true
  })

  useEffect(() => {
    fetchTiposProducto()
  }, [])

  const fetchTiposProducto = async () => {
    setLoading(true)
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 500))
      setTiposProducto(simulateTiposProducto)
    } catch (error) {
      console.error('Error fetching tipos producto:', error)
      toast.error('Error al cargar tipos de producto')
    } finally {
      setLoading(false)
    }
  }

  const stats: Stats = {
    total: tiposProducto.length,
    activos: tiposProducto.filter(t => t.activo).length,
    porFamilia: {
      bovino: tiposProducto.filter(t => t.familia === 'BOVINO' && t.activo).length,
      porcino: tiposProducto.filter(t => t.familia === 'PORCINO' && t.activo).length,
      ovino: tiposProducto.filter(t => t.familia === 'OVINO' && t.activo).length,
      subproducto: tiposProducto.filter(t => t.familia === 'SUBPRODUCTO' && t.activo).length,
    }
  }

  const handleNuevo = () => {
    setTipoEditando(null)
    setFormData({
      codigo: '',
      nombre: '',
      familia: 'BOVINO',
      descripcion: '',
      requiereTrazabilidad: true,
      activo: true
    })
    setDialogOpen(true)
  }

  const handleEditar = (tipo: TipoProducto) => {
    setTipoEditando(tipo)
    setFormData({
      codigo: tipo.codigo,
      nombre: tipo.nombre,
      familia: tipo.familia,
      descripcion: tipo.descripcion,
      requiereTrazabilidad: tipo.requiereTrazabilidad,
      activo: tipo.activo
    })
    setDialogOpen(true)
  }

  const handleToggleEstado = async (tipo: TipoProducto) => {
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setTiposProducto(tiposProducto.map(t => 
        t.id === tipo.id 
          ? { ...t, activo: !t.activo }
          : t
      ))
      
      toast.success(
        tipo.activo 
          ? `Tipo de producto ${tipo.nombre} desactivado` 
          : `Tipo de producto ${tipo.nombre} activado`
      )
    } catch (error) {
      toast.error('Error al actualizar estado')
    }
  }

  const handleGuardar = async () => {
    // Validaciones
    if (!formData.codigo.trim()) {
      toast.error('Ingrese el código')
      return
    }
    if (!formData.nombre.trim()) {
      toast.error('Ingrese el nombre')
      return
    }
    if (!formData.familia) {
      toast.error('Seleccione la familia')
      return
    }
    
    // Verificar código duplicado
    const codigoDuplicado = tiposProducto.find(
      t => t.codigo.toLowerCase() === formData.codigo.toLowerCase() && t.id !== tipoEditando?.id
    )
    if (codigoDuplicado) {
      toast.error('Ya existe un tipo de producto con ese código')
      return
    }
    
    setSaving(true)
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (tipoEditando) {
        // Actualizar tipo existente
        setTiposProducto(tiposProducto.map(t => 
          t.id === tipoEditando.id 
            ? { 
                ...t, 
                codigo: formData.codigo.toUpperCase(),
                nombre: formData.nombre,
                familia: formData.familia,
                descripcion: formData.descripcion,
                requiereTrazabilidad: formData.requiereTrazabilidad,
                activo: formData.activo
              }
            : t
        ))
        toast.success('Tipo de producto actualizado correctamente')
      } else {
        // Crear nuevo tipo
        const nuevoTipo: TipoProducto = {
          id: Date.now().toString(),
          codigo: formData.codigo.toUpperCase(),
          nombre: formData.nombre,
          familia: formData.familia,
          descripcion: formData.descripcion,
          requiereTrazabilidad: formData.requiereTrazabilidad,
          activo: true
        }
        setTiposProducto([...tiposProducto, nuevoTipo])
        toast.success('Tipo de producto creado correctamente')
      }
      
      setDialogOpen(false)
    } catch (error) {
      toast.error('Error al guardar tipo de producto')
    } finally {
      setSaving(false)
    }
  }

  // Filtrar tipos de producto
  const tiposFiltrados = tiposProducto.filter(t => {
    if (filtroFamilia !== 'TODOS' && t.familia !== filtroFamilia) return false
    if (busqueda) {
      const termino = busqueda.toLowerCase()
      return (
        t.codigo.toLowerCase().includes(termino) ||
        t.nombre.toLowerCase().includes(termino) ||
        t.descripcion.toLowerCase().includes(termino)
      )
    }
    return true
  })

  const getFamiliaBadge = (familia: string) => {
    const familiaInfo = FAMILIAS.find(f => f.id === familia)
    return (
      <Badge variant="outline" className={familiaInfo?.color || 'bg-gray-100'}>
        {familiaInfo?.label || familia}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Tag className="w-8 h-8 text-amber-500" />
              Configuración de Tipos de Producto
            </h1>
            <p className="text-stone-500">Gestión de tipos y categorías de productos del frigorífico</p>
          </div>
          <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Tipo
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-stone-100 p-2 rounded-lg">
                  <Tag className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Total Tipos</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Beef className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Activos</p>
                  <p className="text-xl font-bold text-green-600">{stats.activos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <Beef className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Bovinos</p>
                  <p className="text-xl font-bold text-red-600">{stats.porFamilia.bovino}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-pink-100 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Porcinos/Ovinos/Subp.</p>
                  <div className="flex gap-2 text-sm">
                    <span className="font-bold text-pink-600">{stats.porFamilia.porcino}</span>
                    <span className="font-bold text-purple-600">{stats.porFamilia.ovino}</span>
                    <span className="font-bold text-amber-600">{stats.porFamilia.subproducto}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label className="text-xs">Buscar</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <Input
                    className="pl-9"
                    placeholder="Código, nombre o descripción..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Label className="text-xs">Filtrar por Familia</Label>
                <Select value={filtroFamilia} onValueChange={setFiltroFamilia}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todas</SelectItem>
                    {FAMILIAS.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Tipos de Producto */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-600" />
              Tipos de Producto Configurados ({tiposFiltrados.length})
            </CardTitle>
            <CardDescription>
              Listado de tipos y categorías de productos del frigorífico
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                <p className="text-stone-400 mt-2">Cargando tipos de producto...</p>
              </div>
            ) : tiposFiltrados.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No se encontraron tipos de producto</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-stone-50/50">
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Familia</TableHead>
                    <TableHead>Trazabilidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiposFiltrados.map((tipo) => (
                    <TableRow 
                      key={tipo.id} 
                      className={!tipo.activo ? 'opacity-50' : ''}
                    >
                      <TableCell className="font-mono text-sm font-medium">{tipo.codigo}</TableCell>
                      <TableCell className="font-medium">{tipo.nombre}</TableCell>
                      <TableCell>{getFamiliaBadge(tipo.familia)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            tipo.requiereTrazabilidad 
                              ? 'bg-blue-100 text-blue-700 border-blue-200' 
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                          }
                        >
                          {tipo.requiereTrazabilidad ? 'Requiere' : 'No requiere'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            tipo.activo 
                              ? 'bg-green-100 text-green-700 border-green-200' 
                              : 'bg-red-100 text-red-700 border-red-200'
                          }
                        >
                          {tipo.activo ? 'ACTIVO' : 'INACTIVO'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditar(tipo)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleToggleEstado(tipo)}
                            title={tipo.activo ? 'Desactivar' : 'Activar'}
                            className={tipo.activo ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}
                          >
                            <Power className="w-4 h-4" />
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

        {/* Dialog Nuevo/Editar Tipo de Producto */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-500" />
                {tipoEditando ? 'Editar Tipo de Producto' : 'Nuevo Tipo de Producto'}
              </DialogTitle>
              <DialogDescription>
                {tipoEditando 
                  ? 'Modifique los datos del tipo de producto' 
                  : 'Complete los datos para crear un nuevo tipo de producto'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase().replace(/\s/g, '') })}
                    placeholder="TIP-001"
                    className="font-mono"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Familia *</Label>
                  <Select 
                    value={formData.familia} 
                    onValueChange={(value) => setFormData({ ...formData, familia: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FAMILIAS.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Media Res"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del tipo de producto..."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="trazabilidad"
                    checked={formData.requiereTrazabilidad}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, requiereTrazabilidad: checked as boolean })
                    }
                  />
                  <Label htmlFor="trazabilidad" className="cursor-pointer">
                    Requiere Trazabilidad
                  </Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label>Activo</Label>
                  <Button
                    type="button"
                    variant={formData.activo ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                    className={formData.activo ? 'bg-green-500 hover:bg-green-600' : ''}
                  >
                    {formData.activo ? 'Sí' : 'No'}
                  </Button>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={handleGuardar} 
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default ConfigTiposProductoModule
