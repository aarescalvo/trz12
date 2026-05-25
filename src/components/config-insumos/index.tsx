'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Package, AlertTriangle, Edit, Plus, Loader2, History, 
  TrendingDown, DollarSign, Search, Trash2
} from 'lucide-react'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ConfigInsumos')

interface Operador { id: string; nombre: string; rol: string }

interface Insumo {
  id: string
  codigo: string
  nombre: string
  categoria: string
  subcategoria?: string | null
  unidadMedida: string
  stockActual: number
  stockMinimo: number
  stockMaximo?: number | null
  precioUnitario?: number | null
  proveedorNombre?: string | null
  activo: boolean
}

interface MovimientoInsumo {
  id: string
  insumoId: string
  tipo: string
  cantidad: number
  observaciones?: string | null
  operador?: { id: string; nombre: string } | null
  fecha: string
}

interface Props { operador: Operador }

const CATEGORIAS = [
  { value: 'EMBALAJE', label: 'Embalaje' },
  { value: 'ETIQUETAS', label: 'Etiquetas' },
  { value: 'HIGIENE', label: 'Higiene' },
  { value: 'PROTECCION', label: 'Protección' },
  { value: 'HERRAMIENTAS', label: 'Herramientas' },
  { value: 'OFICINA', label: 'Oficina' },
  { value: 'OTROS', label: 'Otros' },
]

const CATEGORIA_LABELS: Record<string, string> = Object.fromEntries(CATEGORIAS.map(c => [c.value, c.label]))
const UNIDADES = ['UN', 'KG', 'MT', 'LT', 'CJ', 'ROLLO', 'M']

type EstadoInsumo = 'DISPONIBLE' | 'STOCK_BAJO' | 'SIN_STOCK'

export function ConfigInsumosModule({ operador }: Props) {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalStockOpen, setModalStockOpen] = useState(false)
  const [modalMovimientosOpen, setModalMovimientosOpen] = useState(false)
  const [editando, setEditando] = useState<Insumo | null>(null)
  const [insumoSeleccionado, setInsumoSeleccionado] = useState<Insumo | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS')
  const [busqueda, setBusqueda] = useState('')
  const [movimientos, setMovimientos] = useState<MovimientoInsumo[]>([])
  const [loadingMovimientos, setLoadingMovimientos] = useState(false)

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria: 'EMBALAJE',
    subcategoria: '',
    unidadMedida: 'UN',
    stockMinimo: '',
    stockActual: '',
    stockMaximo: '',
    precioUnitario: ''
  })

  const [ajusteStock, setAjusteStock] = useState({
    cantidad: '',
    tipo: 'entrada' as 'entrada' | 'salida',
    observacion: ''
  })

  // Cargar insumos desde la API
  const fetchInsumos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/insumos')
      const data = await res.json()
      if (data.success) {
        setInsumos(data.data)
        logger.info('Insumos cargados', { count: data.data.length })
      } else {
        toast.error('Error al cargar insumos')
      }
    } catch (error) {
      logger.error('Error al cargar insumos', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsumos()
  }, [])

  // Cargar movimientos cuando se abre el modal
  useEffect(() => {
    if (modalMovimientosOpen && insumoSeleccionado) {
      fetchMovimientos(insumoSeleccionado.id)
    } else {
      setMovimientos([])
    }
  }, [modalMovimientosOpen, insumoSeleccionado])

  const fetchMovimientos = async (insumoId: string) => {
    setLoadingMovimientos(true)
    try {
      const res = await fetch(`/api/movimientos-insumos?insumoId=${insumoId}&limit=50`)
      const data = await res.json()
      if (data.success) {
        setMovimientos(data.data)
        logger.info('Movimientos cargados', { insumoId, count: data.data.length })
      } else {
        toast.error('Error al cargar movimientos')
      }
    } catch (error) {
      logger.error('Error al cargar movimientos', error)
      toast.error('Error de conexión')
    } finally {
      setLoadingMovimientos(false)
    }
  }

  // Calcular estadísticas
  const totalInsumos = insumos.length
  const insumosStockBajo = insumos.filter(i => i.stockActual > 0 && i.stockActual <= i.stockMinimo).length
  const insumosSinStock = insumos.filter(i => i.stockActual === 0).length
  const valorTotal = insumos.reduce((acc, i) => acc + ((i.stockActual || 0) * (i.precioUnitario || 0)), 0)

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
      'EMBALAJE': 'bg-blue-100 text-blue-700 border-blue-200',
      'ETIQUETAS': 'bg-purple-100 text-purple-700 border-purple-200',
      'HIGIENE': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      'PROTECCION': 'bg-orange-100 text-orange-700 border-orange-200',
      'HERRAMIENTAS': 'bg-amber-100 text-amber-700 border-amber-200',
      'OFICINA': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'OTROS': 'bg-gray-100 text-gray-700 border-gray-200'
    }
    return (
      <Badge variant="outline" className={colores[categoria] || colores['OTROS']}>
        {CATEGORIA_LABELS[categoria] || categoria}
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
      categoria: 'EMBALAJE',
      subcategoria: '',
      unidadMedida: 'UN',
      stockMinimo: '',
      stockActual: '',
      stockMaximo: '',
      precioUnitario: ''
    })
    setModalOpen(true)
  }

  const handleEditar = (insumo: Insumo) => {
    setEditando(insumo)
    setFormData({
      codigo: insumo.codigo || '',
      nombre: insumo.nombre,
      categoria: insumo.categoria || 'OTROS',
      subcategoria: insumo.subcategoria || '',
      unidadMedida: insumo.unidadMedida || 'UN',
      stockMinimo: insumo.stockMinimo.toString(),
      stockActual: insumo.stockActual.toString(),
      stockMaximo: insumo.stockMaximo?.toString() || '',
      precioUnitario: insumo.precioUnitario?.toString() || ''
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

    setGuardando(true)
    try {
      const payload = {
        ...(editando ? { id: editando.id } : {}),
        codigo: formData.codigo,
        nombre: formData.nombre,
        categoria: formData.categoria,
        subcategoria: formData.subcategoria || null,
        unidadMedida: formData.unidadMedida,
        stockMinimo: parseFloat(formData.stockMinimo) || 0,
        stockActual: parseFloat(formData.stockActual) || 0,
        stockMaximo: formData.stockMaximo ? parseFloat(formData.stockMaximo) : null,
        precioUnitario: formData.precioUnitario ? parseFloat(formData.precioUnitario) : null
      }

      const res = await fetch('/api/insumos', {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.success) {
        toast.success(editando ? 'Insumo actualizado correctamente' : 'Insumo creado correctamente')
        setModalOpen(false)
        fetchInsumos()
        logger.info(editando ? 'Insumo actualizado' : 'Insumo creado', { codigo: formData.codigo })
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      logger.error('Error al guardar insumo', error)
      toast.error('Error de conexión')
    } finally {
      setGuardando(false)
    }
  }

  const handleGuardarAjusteStock = async () => {
    if (!ajusteStock.cantidad || parseFloat(ajusteStock.cantidad) <= 0) {
      toast.error('Ingrese una cantidad válida')
      return
    }

    setGuardando(true)
    try {
      const cantidad = parseFloat(ajusteStock.cantidad)
      const tipoMovimiento = ajusteStock.tipo === 'entrada' ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO'

      // Crear movimiento (el API actualiza Insumo.stockActual automáticamente)
      const res = await fetch('/api/movimientos-insumos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insumoId: insumoSeleccionado?.id,
          tipo: tipoMovimiento,
          cantidad,
          observaciones: ajusteStock.observacion || `Ajuste manual (${ajusteStock.tipo})`,
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(`Stock ${ajusteStock.tipo === 'entrada' ? 'incrementado' : 'decrementado'} correctamente`)
        setModalStockOpen(false)
        fetchInsumos()
        logger.info('Stock ajustado', { 
          insumo: insumoSeleccionado?.codigo, 
          tipo: tipoMovimiento, 
          cantidad 
        })
      } else {
        toast.error(data.error || 'Error al ajustar stock')
      }
    } catch (error) {
      logger.error('Error al ajustar stock', error)
      toast.error('Error de conexión')
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async (insumo: Insumo) => {
    if (!confirm(`¿Eliminar el insumo "${insumo.nombre}"?`)) return

    try {
      const res = await fetch(`/api/insumos?id=${insumo.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Insumo eliminado')
        fetchInsumos()
        logger.info('Insumo eliminado', { codigo: insumo.codigo })
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      logger.error('Error al eliminar insumo', error)
      toast.error('Error de conexión')
    }
  }

  // Formatear tipo de movimiento
  const formatTipoMovimiento = (tipo: string) => {
    const labels: Record<string, { text: string; color: string }> = {
      'INGRESO': { text: 'Ingreso', color: 'bg-green-100 text-green-700' },
      'EGRESO': { text: 'Egreso', color: 'bg-red-100 text-red-700' },
      'AJUSTE_POSITIVO': { text: 'Ajuste +', color: 'bg-blue-100 text-blue-700' },
      'AJUSTE_NEGATIVO': { text: 'Ajuste −', color: 'bg-orange-100 text-orange-700' },
      'TRANSFERENCIA': { text: 'Transferencia', color: 'bg-purple-100 text-purple-700' },
      'PERDIDA': { text: 'Pérdida', color: 'bg-red-100 text-red-800' },
      'DEVOLUCION': { text: 'Devolución', color: 'bg-yellow-100 text-yellow-700' },
    }
    const config = labels[tipo] || { text: tipo, color: 'bg-gray-100 text-gray-700' }
    return <Badge className={config.color}>{config.text}</Badge>
  }

  // Formatear fecha
  const formatFecha = (fecha: string) => {
    const d = new Date(fecha)
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value)
  }

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
                <select 
                  className="w-full border rounded px-3 py-2 bg-background"
                  value={filtroCategoria} 
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                >
                  <option value="TODAS">Todas</option>
                  {CATEGORIAS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
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
                          {insumo.stockActual.toLocaleString()} {insumo.unidadMedida}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-stone-600">
                        {insumo.stockMinimo.toLocaleString()} {insumo.unidadMedida}
                      </TableCell>
                      <TableCell className="text-right text-stone-600">
                        {insumo.precioUnitario ? formatCurrency(insumo.precioUnitario) : '-'}
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
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEliminar(insumo)}
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
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
          <DialogContent className="max-w-lg" maximizable>
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
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  >
                    {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
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
                    value={formData.unidadMedida} 
                    onChange={(e) => setFormData({...formData, unidadMedida: e.target.value})}
                  >
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Stock Mínimo</Label>
                  <Input 
                    type="number"
                    value={formData.stockMinimo} 
                    onChange={(e) => setFormData({...formData, stockMinimo: e.target.value})} 
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock Actual</Label>
                  <Input 
                    type="number"
                    value={formData.stockActual} 
                    onChange={(e) => setFormData({...formData, stockActual: e.target.value})} 
                    placeholder="500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Precio Unitario</Label>
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
          <DialogContent className="max-w-md" maximizable>
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
                <p className="text-sm text-stone-500">Stock Actual: {insumoSeleccionado?.stockActual} {insumoSeleccionado?.unidadMedida}</p>
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
          <DialogContent className="max-w-lg" maximizable>
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
                <p className="text-sm text-stone-500">Código: {insumoSeleccionado?.codigo} · Stock: {insumoSeleccionado?.stockActual} {insumoSeleccionado?.unidadMedida}</p>
              </div>
              {loadingMovimientos ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                  <p className="text-stone-400 mt-2">Cargando movimientos...</p>
                </div>
              ) : movimientos.length === 0 ? (
                <div className="text-center text-stone-400 py-4">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Sin movimientos registrados</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50">
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead>Operador</TableHead>
                        <TableHead>Observación</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movimientos.map((mov) => (
                        <TableRow key={mov.id}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {formatFecha(mov.fecha)}
                          </TableCell>
                          <TableCell>
                            {formatTipoMovimiento(mov.tipo)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            <span className={mov.tipo.includes('NEGATIVO') || mov.tipo === 'EGRESO' || mov.tipo === 'PERDIDA'
                              ? 'text-red-600'
                              : 'text-green-600'
                            }>
                              {mov.tipo.includes('NEGATIVO') || mov.tipo === 'EGRESO' || mov.tipo === 'PERDIDA' ? '−' : '+'}{mov.cantidad.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-stone-600">
                            {mov.operador?.nombre || '-'}
                          </TableCell>
                          <TableCell className="text-xs text-stone-500 max-w-[150px] truncate">
                            {mov.observaciones || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
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
