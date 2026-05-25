'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  Package, AlertTriangle, Edit, Plus, Loader2, History, 
  TrendingDown, DollarSign, Search
} from 'lucide-react'

interface Operador { id: string; nombre: string; rol: string }

interface Insumo {
  id: string
  codigo: string
  nombre: string
  categoria: 'Envases' | 'Etiquetas' | 'Insumos Faena' | 'Limpieza'
  unidad: string
  stockMinimo: number
  stockActual: number
  precioUnitario: number
}

interface Props { operador: Operador }

const CATEGORIAS = ['Envases', 'Etiquetas', 'Insumos Faena', 'Limpieza'] as const
const UNIDADES = ['UN', 'KG', 'MT', 'LT', 'CJ']

type EstadoInsumo = 'DISPONIBLE' | 'STOCK_BAJO' | 'SIN_STOCK'

const datosIniciales: Insumo[] = [
  { 
    id: '1', 
    codigo: 'ENV-001', 
    nombre: 'Bolsa Vacío 5kg', 
    categoria: 'Envases', 
    unidad: 'UN', 
    stockMinimo: 500, 
    stockActual: 2500, 
    precioUnitario: 45.50 
  },
  { 
    id: '2', 
    codigo: 'ENV-002', 
    nombre: 'Bolsa Media Res', 
    categoria: 'Envases', 
    unidad: 'UN', 
    stockMinimo: 200, 
    stockActual: 150, 
    precioUnitario: 125.00 
  },
  { 
    id: '3', 
    codigo: 'ENV-003', 
    nombre: 'Caja Exportación 15kg', 
    categoria: 'Envases', 
    unidad: 'UN', 
    stockMinimo: 300, 
    stockActual: 800, 
    precioUnitario: 280.00 
  },
  { 
    id: '4', 
    codigo: 'ETQ-001', 
    nombre: 'Etiqueta Media Res', 
    categoria: 'Etiquetas', 
    unidad: 'UN', 
    stockMinimo: 1000, 
    stockActual: 5000, 
    precioUnitario: 8.50 
  },
  { 
    id: '5', 
    codigo: 'ETQ-002', 
    nombre: 'Etiqueta Corte Vacío', 
    categoria: 'Etiquetas', 
    unidad: 'UN', 
    stockMinimo: 500, 
    stockActual: 0, 
    precioUnitario: 12.00 
  },
  { 
    id: '6', 
    codigo: 'FAE-001', 
    nombre: 'Cuchillo Faena', 
    categoria: 'Insumos Faena', 
    unidad: 'UN', 
    stockMinimo: 20, 
    stockActual: 35, 
    precioUnitario: 1500.00 
  },
  { 
    id: '7', 
    codigo: 'FAE-002', 
    nombre: 'Cinta Motadora', 
    categoria: 'Insumos Faena', 
    unidad: 'MT', 
    stockMinimo: 100, 
    stockActual: 250, 
    precioUnitario: 85.00 
  },
  { 
    id: '8', 
    codigo: 'LIM-001', 
    nombre: 'Desinfectante Industrial', 
    categoria: 'Limpieza', 
    unidad: 'LT', 
    stockMinimo: 50, 
    stockActual: 120, 
    precioUnitario: 350.00 
  },
  { 
    id: '9', 
    codigo: 'LIM-002', 
    nombre: 'Guantes Desechables', 
    categoria: 'Limpieza', 
    unidad: 'CJ', 
    stockMinimo: 30, 
    stockActual: 15, 
    precioUnitario: 450.00 
  },
  { 
    id: '10', 
    codigo: 'ENV-004', 
    nombre: 'Bolsa Paletizable', 
    categoria: 'Envases', 
    unidad: 'UN', 
    stockMinimo: 200, 
    stockActual: 450, 
    precioUnitario: 95.00 
  },
]

export function ConfigInsumosModule({ operador }: Props) {
  const [insumos, setInsumos] = useState<Insumo[]>(datosIniciales)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalStockOpen, setModalStockOpen] = useState(false)
  const [modalMovimientosOpen, setModalMovimientosOpen] = useState(false)
  const [editando, setEditando] = useState<Insumo | null>(null)
  const [insumoSeleccionado, setInsumoSeleccionado] = useState<Insumo | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS')
  const [busqueda, setBusqueda] = useState('')

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria: 'Envases' as 'Envases' | 'Etiquetas' | 'Insumos Faena' | 'Limpieza',
    unidad: 'UN',
    stockMinimo: '',
    stockActual: '',
    precioUnitario: ''
  })

  const [ajusteStock, setAjusteStock] = useState({
    cantidad: '',
    tipo: 'entrada' as 'entrada' | 'salida',
    observacion: ''
  })

  // Calcular estadísticas
  const totalInsumos = insumos.length
  const insumosStockBajo = insumos.filter(i => i.stockActual > 0 && i.stockActual <= i.stockMinimo).length
  const insumosSinStock = insumos.filter(i => i.stockActual === 0).length
  const valorTotal = insumos.reduce((acc, i) => acc + (i.stockActual * i.precioUnitario), 0)

  // Obtener estado del insumo
  const getEstado = (insumo: Insumo): EstadoInsumo => {
    if (insumo.stockActual === 0) return 'SIN_STOCK'
    if (insumo.stockActual <= insumo.stockMinimo) return 'STOCK_BAJO'
    return 'DISPONIBLE'
  }

  // Badge de estado
  const getEstadoBadge = (insumo: Insumo) => {
    const estado = getEstado(insumo)
    switch (estado) {
      case 'SIN_STOCK':
        return <Badge className="bg-red-100 text-red-700 border-red-200">SIN STOCK</Badge>
      case 'STOCK_BAJO':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">STOCK BAJO</Badge>
      default:
        return <Badge className="bg-green-100 text-green-700 border-green-200">DISPONIBLE</Badge>
    }
  }

  // Badge de categoría
  const getCategoriaBadge = (categoria: string) => {
    const colores: Record<string, string> = {
      'Envases': 'bg-blue-100 text-blue-700 border-blue-200',
      'Etiquetas': 'bg-purple-100 text-purple-700 border-purple-200',
      'Insumos Faena': 'bg-orange-100 text-orange-700 border-orange-200',
      'Limpieza': 'bg-cyan-100 text-cyan-700 border-cyan-200'
    }
    return (
      <Badge variant="outline" className={colores[categoria] || ''}>
        {categoria}
      </Badge>
    )
  }

  // Filtrar insumos
  const insumosFiltrados = insumos.filter(i => {
    if (filtroCategoria !== 'TODAS' && i.categoria !== filtroCategoria) return false
    if (busqueda) {
      const termino = busqueda.toLowerCase()
      return (
        i.codigo.toLowerCase().includes(termino) ||
        i.nombre.toLowerCase().includes(termino)
      )
    }
    return true
  })

  // Handlers
  const handleNuevo = () => {
    setEditando(null)
    setFormData({
      codigo: '',
      nombre: '',
      categoria: 'Envases',
      unidad: 'UN',
      stockMinimo: '',
      stockActual: '',
      precioUnitario: ''
    })
    setModalOpen(true)
  }

  const handleEditar = (insumo: Insumo) => {
    setEditando(insumo)
    setFormData({
      codigo: insumo.codigo,
      nombre: insumo.nombre,
      categoria: insumo.categoria,
      unidad: insumo.unidad,
      stockMinimo: insumo.stockMinimo.toString(),
      stockActual: insumo.stockActual.toString(),
      precioUnitario: insumo.precioUnitario.toString()
    })
    setModalOpen(true)
  }

  const handleAjustarStock = (insumo: Insumo) => {
    setInsumoSeleccionado(insumo)
    setAjusteStock({ cantidad: '', tipo: 'entrada', observacion: '' })
    setModalStockOpen(true)
  }

  const handleVerMovimientos = (insumo: Insumo) => {
    setInsumoSeleccionado(insumo)
    setModalMovimientosOpen(true)
  }

  const handleGuardar = async () => {
    if (!formData.codigo) {
      toast.error('Ingrese el código del insumo')
      return
    }
    if (!formData.nombre) {
      toast.error('Ingrese el nombre del insumo')
      return
    }
    if (!formData.stockMinimo || !formData.stockActual || !formData.precioUnitario) {
      toast.error('Complete todos los campos numéricos')
      return
    }

    setGuardando(true)
    setTimeout(() => {
      if (editando) {
        setInsumos(insumos.map(i => 
          i.id === editando.id 
            ? { 
                ...i, 
                codigo: formData.codigo,
                nombre: formData.nombre,
                categoria: formData.categoria,
                unidad: formData.unidad,
                stockMinimo: parseInt(formData.stockMinimo),
                stockActual: parseInt(formData.stockActual),
                precioUnitario: parseFloat(formData.precioUnitario)
              } 
            : i
        ))
        toast.success('Insumo actualizado correctamente')
      } else {
        // Verificar código duplicado
        if (insumos.some(i => i.codigo === formData.codigo)) {
          toast.error('Ya existe un insumo con ese código')
          setGuardando(false)
          return
        }
        const nuevoInsumo: Insumo = {
          id: Date.now().toString(),
          codigo: formData.codigo,
          nombre: formData.nombre,
          categoria: formData.categoria,
          unidad: formData.unidad,
          stockMinimo: parseInt(formData.stockMinimo),
          stockActual: parseInt(formData.stockActual),
          precioUnitario: parseFloat(formData.precioUnitario)
        }
        setInsumos([...insumos, nuevoInsumo])
        toast.success('Insumo creado correctamente')
      }
      setModalOpen(false)
      setGuardando(false)
      resetForm()
    }, 500)
  }

  const handleGuardarAjusteStock = async () => {
    if (!ajusteStock.cantidad || parseInt(ajusteStock.cantidad) <= 0) {
      toast.error('Ingrese una cantidad válida')
      return
    }

    setGuardando(true)
    setTimeout(() => {
      if (insumoSeleccionado) {
        const cantidad = parseInt(ajusteStock.cantidad)
        const nuevoStock = ajusteStock.tipo === 'entrada' 
          ? insumoSeleccionado.stockActual + cantidad
          : Math.max(0, insumoSeleccionado.stockActual - cantidad)
        
        setInsumos(insumos.map(i => 
          i.id === insumoSeleccionado.id 
            ? { ...i, stockActual: nuevoStock }
            : i
        ))
        toast.success(`Stock ${ajusteStock.tipo === 'entrada' ? 'incrementado' : 'decrementado'} correctamente`)
      }
      setModalStockOpen(false)
      setGuardando(false)
      setInsumoSeleccionado(null)
    }, 500)
  }

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      categoria: 'Envases',
      unidad: 'UN',
      stockMinimo: '',
      stockActual: '',
      precioUnitario: ''
    })
    setEditando(null)
  }

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value)
  }

  // Movimientos simulados
  const movimientosSimulados = insumoSeleccionado ? [
    { id: '1', fecha: '2024-01-15', tipo: 'Entrada', cantidad: 500, usuario: 'María López' },
    { id: '2', fecha: '2024-01-14', tipo: 'Salida', cantidad: 150, usuario: 'Carlos García' },
    { id: '3', fecha: '2024-01-12', tipo: 'Entrada', cantidad: 300, usuario: 'Pedro Sánchez' },
    { id: '4', fecha: '2024-01-10', tipo: 'Salida', cantidad: 200, usuario: 'Ana Torres' },
  ] : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Package className="w-8 h-8 text-amber-500" />
              Configuración de Insumos
            </h1>
            <p className="text-stone-500">Gestión de insumos y materiales del frigorífico</p>
          </div>
          <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Insumo
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-stone-50 to-stone-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-stone-600">Total Insumos</CardTitle>
              <Package className="h-4 w-4 text-stone-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-stone-800">{totalInsumos}</div>
              <p className="text-xs text-stone-500 mt-1">Insumos registrados</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-700">Stock Bajo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-700">{insumosStockBajo}</div>
              <p className="text-xs text-amber-600 mt-1">Requieren reposición</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700">Sin Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-700">{insumosSinStock}</div>
              <p className="text-xs text-red-600 mt-1">Agotados</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-700">{formatCurrency(valorTotal)}</div>
              <p className="text-xs text-green-600 mt-1">En inventario</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label className="text-xs text-stone-500">Buscar</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <Input
                    className="pl-9"
                    placeholder="Código o nombre..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Label className="text-xs text-stone-500">Filtrar por Categoría</Label>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODAS">Todas</SelectItem>
                    {CATEGORIAS.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50">
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Stock Mín</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-40 text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                    </TableCell>
                  </TableRow>
                ) : insumosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-stone-400 py-8">
                      No se encontraron insumos
                    </TableCell>
                  </TableRow>
                ) : (
                  insumosFiltrados.map((insumo) => (
                    <TableRow 
                      key={insumo.id} 
                      className={getEstado(insumo) === 'SIN_STOCK' ? 'bg-red-50' : getEstado(insumo) === 'STOCK_BAJO' ? 'bg-amber-50' : ''}
                    >
                      <TableCell className="font-mono font-medium">{insumo.codigo}</TableCell>
                      <TableCell className="font-medium">{insumo.nombre}</TableCell>
                      <TableCell>{getCategoriaBadge(insumo.categoria)}</TableCell>
                      <TableCell className="text-right">
                        <span className={insumo.stockActual <= insumo.stockMinimo ? 'text-red-600 font-bold' : ''}>
                          {insumo.stockActual.toLocaleString()} {insumo.unidad}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-stone-600">
                        {insumo.stockMinimo.toLocaleString()} {insumo.unidad}
                      </TableCell>
                      <TableCell className="text-right text-stone-600">
                        {formatCurrency(insumo.precioUnitario)}
                      </TableCell>
                      <TableCell>{getEstadoBadge(insumo)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditar(insumo)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4 text-stone-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleAjustarStock(insumo)}
                            title="Ajustar Stock"
                          >
                            <Package className="w-4 h-4 text-amber-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleVerMovimientos(insumo)}
                            title="Ver Movimientos"
                          >
                            <History className="w-4 h-4 text-blue-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Modal Crear/Editar */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar Insumo' : 'Nuevo Insumo'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input 
                    value={formData.codigo} 
                    onChange={(e) => setFormData({...formData, codigo: e.target.value.toUpperCase()})} 
                    placeholder="ENV-001"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <select 
                    className="w-full border rounded px-3 py-2 bg-background" 
                    value={formData.categoria} 
                    onChange={(e) => setFormData({...formData, categoria: e.target.value as typeof formData.categoria})}
                  >
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input 
                  value={formData.nombre} 
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                  placeholder="Bolsa Vacío 5kg"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Unidad</Label>
                  <select 
                    className="w-full border rounded px-3 py-2 bg-background" 
                    value={formData.unidad} 
                    onChange={(e) => setFormData({...formData, unidad: e.target.value})}
                  >
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Stock Mínimo *</Label>
                  <Input 
                    type="number"
                    value={formData.stockMinimo} 
                    onChange={(e) => setFormData({...formData, stockMinimo: e.target.value})} 
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock Actual *</Label>
                  <Input 
                    type="number"
                    value={formData.stockActual} 
                    onChange={(e) => setFormData({...formData, stockActual: e.target.value})} 
                    placeholder="500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Precio Unitario *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={formData.precioUnitario} 
                  onChange={(e) => setFormData({...formData, precioUnitario: e.target.value})} 
                  placeholder="45.50"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button 
                onClick={handleGuardar} 
                disabled={guardando} 
                className="bg-amber-500 hover:bg-amber-600"
              >
                {guardando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editando ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Ajustar Stock */}
        <Dialog open={modalStockOpen} onOpenChange={setModalStockOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                Ajustar Stock
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-stone-50 rounded-lg p-3">
                <p className="text-sm text-stone-500">Insumo</p>
                <p className="font-medium">{insumoSeleccionado?.nombre}</p>
                <p className="text-sm text-stone-500">Stock Actual: {insumoSeleccionado?.stockActual} {insumoSeleccionado?.unidad}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Movimiento</Label>
                  <select 
                    className="w-full border rounded px-3 py-2 bg-background" 
                    value={ajusteStock.tipo} 
                    onChange={(e) => setAjusteStock({...ajusteStock, tipo: e.target.value as 'entrada' | 'salida'})}
                  >
                    <option value="entrada">Entrada (+)</option>
                    <option value="salida">Salida (-)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Cantidad *</Label>
                  <Input 
                    type="number"
                    value={ajusteStock.cantidad} 
                    onChange={(e) => setAjusteStock({...ajusteStock, cantidad: e.target.value})} 
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observación</Label>
                <Input 
                  value={ajusteStock.observacion} 
                  onChange={(e) => setAjusteStock({...ajusteStock, observacion: e.target.value})} 
                  placeholder="Motivo del ajuste..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalStockOpen(false)}>Cancelar</Button>
              <Button 
                onClick={handleGuardarAjusteStock} 
                disabled={guardando} 
                className="bg-amber-500 hover:bg-amber-600"
              >
                {guardando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Ver Movimientos */}
        <Dialog open={modalMovimientosOpen} onOpenChange={setModalMovimientosOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" />
                Movimientos de Stock
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-stone-50 rounded-lg p-3">
                <p className="text-sm text-stone-500">Insumo</p>
                <p className="font-medium">{insumoSeleccionado?.nombre}</p>
                <p className="text-sm text-stone-500">Código: {insumoSeleccionado?.codigo}</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-stone-50">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead>Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientosSimulados.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell className="text-sm">{mov.fecha}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={mov.tipo === 'Entrada' 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'bg-red-100 text-red-700 border-red-200'
                          }
                        >
                          {mov.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={mov.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600'}>
                          {mov.tipo === 'Entrada' ? '+' : '-'}{mov.cantidad}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{mov.usuario}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalMovimientosOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default ConfigInsumosModule
