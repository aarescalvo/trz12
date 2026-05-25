'use client'

import { useState, useEffect } from 'react'
import { 
  Package, Beef, Edit, Plus, DollarSign, Search, Filter,
  Save, X, Loader2, Eye
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
import { toast } from 'sonner'

const CATEGORIAS = [
  { id: 'CORTES', label: 'Cortes', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'MENUDENCIAS', label: 'Menudencias', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'SUBPRODUCTOS', label: 'Subproductos', color: 'bg-green-100 text-green-700 border-green-200' },
]

interface Producto {
  id: string
  codigo: string
  nombre: string
  categoria: string
  precioKg: number
  descripcion: string
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
  categoria: string
  precioKg: number
  descripcion: string
  activo: boolean
}

interface Stats {
  total: number
  activos: number
  cortes: number
  menudencias: number
  subproductos: number
  valorPromedio: number
}

// Datos simulados de productos cárnicos
const simulateProductos: Producto[] = [
  // Cortes
  {
    id: '1',
    codigo: 'COR001',
    nombre: 'Vacío',
    categoria: 'CORTES',
    precioKg: 4500,
    descripcion: 'Corte de la región abdominal del bovino',
    activo: true
  },
  {
    id: '2',
    codigo: 'COR002',
    nombre: 'Asado',
    categoria: 'CORTES',
    precioKg: 3800,
    descripcion: 'Corte de las costillas del bovino',
    activo: true
  },
  {
    id: '3',
    codigo: 'COR003',
    nombre: 'Matambre',
    categoria: 'CORTES',
    precioKg: 4200,
    descripcion: 'Corte delgado entre el cuero y la carne',
    activo: true
  },
  {
    id: '4',
    codigo: 'COR004',
    nombre: 'Entraña',
    categoria: 'CORTES',
    precioKg: 4800,
    descripcion: 'Corte del diafragma del bovino',
    activo: true
  },
  {
    id: '5',
    codigo: 'COR005',
    nombre: 'Ojo de Bife',
    categoria: 'CORTES',
    precioKg: 5500,
    descripcion: 'Corte premium del lomo',
    activo: false
  },
  {
    id: '6',
    codigo: 'COR006',
    nombre: 'Bife de Chorizo',
    categoria: 'CORTES',
    precioKg: 5200,
    descripcion: 'Corte del músculo dorsal del bovino',
    activo: true
  },
  // Menudencias
  {
    id: '7',
    codigo: 'MEN001',
    nombre: 'Hígado',
    categoria: 'MENUDENCIAS',
    precioKg: 1500,
    descripcion: 'Órgano digestivo del bovino',
    activo: true
  },
  {
    id: '8',
    codigo: 'MEN002',
    nombre: 'Riñón',
    categoria: 'MENUDENCIAS',
    precioKg: 1200,
    descripcion: 'Órgano excretor del bovino',
    activo: true
  },
  {
    id: '9',
    codigo: 'MEN003',
    nombre: 'Coração',
    categoria: 'MENUDENCIAS',
    precioKg: 1800,
    descripcion: 'Órgano cardiaco del bovino',
    activo: true
  },
  {
    id: '10',
    codigo: 'MEN004',
    nombre: 'Lengua',
    categoria: 'MENUDENCIAS',
    precioKg: 2500,
    descripcion: 'Órgano muscular de la boca',
    activo: true
  },
  {
    id: '11',
    codigo: 'MEN005',
    nombre: 'Mollejas',
    categoria: 'MENUDENCIAS',
    precioKg: 3200,
    descripcion: 'Glándula timo del bovino joven',
    activo: false
  },
  // Subproductos
  {
    id: '12',
    codigo: 'SUB001',
    nombre: 'Hueso para Caldo',
    categoria: 'SUBPRODUCTOS',
    precioKg: 500,
    descripcion: 'Huesos con médula para preparación de caldos',
    activo: true
  },
  {
    id: '13',
    codigo: 'SUB002',
    nombre: 'Grasa Vacuna',
    categoria: 'SUBPRODUCTOS',
    precioKg: 800,
    descripcion: 'Grasa para uso industrial o culinario',
    activo: true
  },
  {
    id: '14',
    codigo: 'SUB003',
    nombre: 'Cuero',
    categoria: 'SUBPRODUCTOS',
    precioKg: 350,
    descripcion: 'Piel curtible del bovino',
    activo: true
  },
  {
    id: '15',
    codigo: 'SUB004',
    nombre: 'Tripas',
    categoria: 'SUBPRODUCTOS',
    precioKg: 600,
    descripcion: 'Intestinos para embutidos',
    activo: true
  },
]

export function ConfigProductosModule({ operador }: { operador: Operador }) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [preciosDialogOpen, setPreciosDialogOpen] = useState(false)
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null)
  const [productoVerPrecios, setProductoVerPrecios] = useState<Producto | null>(null)
  
  // Filtros
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODOS')
  const [busqueda, setBusqueda] = useState('')
  
  // Form
  const [formData, setFormData] = useState<FormData>({
    codigo: '',
    nombre: '',
    categoria: 'CORTES',
    precioKg: 0,
    descripcion: '',
    activo: true
  })

  useEffect(() => {
    fetchProductos()
  }, [])

  const fetchProductos = async () => {
    setLoading(true)
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 500))
      setProductos(simulateProductos)
    } catch (error) {
      console.error('Error fetching productos:', error)
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  const stats: Stats = {
    total: productos.length,
    activos: productos.filter(p => p.activo).length,
    cortes: productos.filter(p => p.categoria === 'CORTES').length,
    menudencias: productos.filter(p => p.categoria === 'MENUDENCIAS').length,
    subproductos: productos.filter(p => p.categoria === 'SUBPRODUCTOS').length,
    valorPromedio: productos.filter(p => p.activo).length > 0 
      ? Math.round(productos.filter(p => p.activo).reduce((sum, p) => sum + p.precioKg, 0) / productos.filter(p => p.activo).length)
      : 0
  }

  const handleNuevo = () => {
    setProductoEditando(null)
    setFormData({
      codigo: '',
      nombre: '',
      categoria: 'CORTES',
      precioKg: 0,
      descripcion: '',
      activo: true
    })
    setDialogOpen(true)
  }

  const handleEditar = (producto: Producto) => {
    setProductoEditando(producto)
    setFormData({
      codigo: producto.codigo,
      nombre: producto.nombre,
      categoria: producto.categoria,
      precioKg: producto.precioKg,
      descripcion: producto.descripcion,
      activo: producto.activo
    })
    setDialogOpen(true)
  }

  const handleToggleEstado = async (producto: Producto) => {
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setProductos(productos.map(p => 
        p.id === producto.id 
          ? { ...p, activo: !p.activo }
          : p
      ))
      
      toast.success(
        producto.activo 
          ? `Producto ${producto.nombre} desactivado` 
          : `Producto ${producto.nombre} activado`
      )
    } catch (error) {
      toast.error('Error al actualizar estado')
    }
  }

  const handleVerPrecios = (producto: Producto) => {
    setProductoVerPrecios(producto)
    setPreciosDialogOpen(true)
  }

  const handleGuardar = async () => {
    // Validaciones
    if (!formData.codigo.trim()) {
      toast.error('Ingrese el código del producto')
      return
    }
    if (!formData.nombre.trim()) {
      toast.error('Ingrese el nombre del producto')
      return
    }
    if (!formData.categoria) {
      toast.error('Seleccione una categoría')
      return
    }
    if (formData.precioKg <= 0) {
      toast.error('El precio debe ser mayor a cero')
      return
    }
    
    // Verificar código duplicado
    const codigoDuplicado = productos.find(
      p => p.codigo.toLowerCase() === formData.codigo.toLowerCase() && p.id !== productoEditando?.id
    )
    if (codigoDuplicado) {
      toast.error('Ya existe un producto con ese código')
      return
    }
    
    setSaving(true)
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (productoEditando) {
        // Actualizar producto existente
        setProductos(productos.map(p => 
          p.id === productoEditando.id 
            ? { 
                ...p, 
                codigo: formData.codigo,
                nombre: formData.nombre,
                categoria: formData.categoria,
                precioKg: formData.precioKg,
                descripcion: formData.descripcion,
                activo: formData.activo
              }
            : p
        ))
        toast.success('Producto actualizado correctamente')
      } else {
        // Crear nuevo producto
        const nuevoProducto: Producto = {
          id: Date.now().toString(),
          codigo: formData.codigo,
          nombre: formData.nombre,
          categoria: formData.categoria,
          precioKg: formData.precioKg,
          descripcion: formData.descripcion,
          activo: formData.activo
        }
        setProductos([...productos, nuevoProducto])
        toast.success('Producto creado correctamente')
      }
      
      setDialogOpen(false)
    } catch (error) {
      toast.error('Error al guardar producto')
    } finally {
      setSaving(false)
    }
  }

  // Filtrar productos
  const productosFiltrados = productos.filter(p => {
    if (filtroCategoria !== 'TODOS' && p.categoria !== filtroCategoria) return false
    if (busqueda) {
      const termino = busqueda.toLowerCase()
      return (
        p.nombre.toLowerCase().includes(termino) ||
        p.codigo.toLowerCase().includes(termino) ||
        p.descripcion.toLowerCase().includes(termino)
      )
    }
    return true
  })

  const getCategoriaBadge = (categoria: string) => {
    const cat = CATEGORIAS.find(c => c.id === categoria)
    return (
      <Badge variant="outline" className={cat?.color || 'bg-gray-100'}>
        {cat?.label || categoria}
      </Badge>
    )
  }

  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(precio)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Beef className="w-8 h-8 text-amber-500" />
              Configuración de Productos
            </h1>
            <p className="text-stone-500">Gestión de productos cárnicos del frigorífico</p>
            <p className="text-xs text-stone-400 mt-1">
              Operador: {operador.nombre} ({operador.rol})
            </p>
          </div>
          <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-stone-100 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Total Productos</p>
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
                <div className="bg-amber-100 p-2 rounded-lg">
                  <Filter className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Por Categoría</p>
                  <p className="text-sm font-semibold">
                    <span className="text-amber-600">{stats.cortes}</span> /
                    <span className="text-blue-600"> {stats.menudencias}</span> /
                    <span className="text-green-600"> {stats.subproductos}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Valor Promedio</p>
                  <p className="text-lg font-bold text-purple-600">{formatPrecio(stats.valorPromedio)}</p>
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
                <Label className="text-xs">Filtrar por Categoría</Label>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todas</SelectItem>
                    {CATEGORIAS.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Productos */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Beef className="w-5 h-5 text-amber-600" />
              Productos Configurados ({productosFiltrados.length})
            </CardTitle>
            <CardDescription>
              Listado de productos cárnicos del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                <p className="text-stone-400 mt-2">Cargando productos...</p>
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No se encontraron productos</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-stone-50/50">
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Precio/Kg</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productosFiltrados.map((producto) => (
                    <TableRow 
                      key={producto.id} 
                      className={!producto.activo ? 'opacity-50' : ''}
                    >
                      <TableCell className="font-mono text-sm">{producto.codigo}</TableCell>
                      <TableCell className="font-medium">{producto.nombre}</TableCell>
                      <TableCell>{getCategoriaBadge(producto.categoria)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatPrecio(producto.precioKg)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            producto.activo 
                              ? 'bg-green-100 text-green-700 border-green-200' 
                              : 'bg-red-100 text-red-700 border-red-200'
                          }
                        >
                          {producto.activo ? 'ACTIVO' : 'INACTIVO'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditar(producto)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleToggleEstado(producto)}
                            title={producto.activo ? 'Desactivar' : 'Activar'}
                            className={producto.activo ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}
                          >
                            <Beef className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleVerPrecios(producto)}
                            title="Ver Precios"
                            className="text-amber-500 hover:text-amber-700"
                          >
                            <DollarSign className="w-4 h-4" />
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

        {/* Dialog Nuevo/Editar Producto */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
              <DialogDescription>
                {productoEditando 
                  ? 'Modifique los datos del producto' 
                  : 'Complete los datos para crear un nuevo producto'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase().replace(/\s/g, '') })}
                    placeholder="COR001"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Vacío"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select 
                  value={formData.categoria} 
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Precio/Kg *</Label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <Input
                    type="number"
                    value={formData.precioKg || ''}
                    onChange={(e) => setFormData({ ...formData, precioKg: parseFloat(e.target.value) || 0 })}
                    placeholder="4500"
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del producto..."
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="activo" 
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked as boolean })}
                />
                <Label htmlFor="activo" className="text-sm cursor-pointer">
                  Producto Activo
                </Label>
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

        {/* Dialog Ver Precios */}
        <Dialog open={preciosDialogOpen} onOpenChange={setPreciosDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-500" />
                Información de Precios
              </DialogTitle>
              <DialogDescription>
                Detalles del producto seleccionado
              </DialogDescription>
            </DialogHeader>
            
            {productoVerPrecios && (
              <div className="space-y-4 py-4">
                <div className="bg-stone-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Código:</span>
                    <span className="font-mono font-semibold">{productoVerPrecios.codigo}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Nombre:</span>
                    <span className="font-semibold">{productoVerPrecios.nombre}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Categoría:</span>
                    {getCategoriaBadge(productoVerPrecios.categoria)}
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-500">Precio por Kg:</span>
                      <span className="text-2xl font-bold text-amber-600">
                        {formatPrecio(productoVerPrecios.precioKg)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {productoVerPrecios.descripcion && (
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                    <p className="text-xs text-amber-600 font-medium mb-1">Descripción:</p>
                    <p className="text-sm text-stone-600">{productoVerPrecios.descripcion}</p>
                  </div>
                )}
                
                <div className="bg-stone-100 rounded-lg p-3">
                  <p className="text-xs text-stone-500 mb-2">Historial de Precios (simulado)</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Precio actual:</span>
                      <span className="font-semibold">{formatPrecio(productoVerPrecios.precioKg)}</span>
                    </div>
                    <div className="flex justify-between text-stone-500">
                      <span>Precio anterior:</span>
                      <span>{formatPrecio(Math.round(productoVerPrecios.precioKg * 0.95))}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Variación:</span>
                      <span>+5.00%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setPreciosDialogOpen(false)}
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default ConfigProductosModule
