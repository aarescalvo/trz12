'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ClipboardList, Package, Edit, Plus, Save, X, Loader2, Search, Trash2 } from 'lucide-react'

interface Operador { id: string; nombre: string; rol: string }

interface ProductoSimple { id: string; nombre: string; codigo: string; activo: boolean }
interface InsumoSimple { id: string; nombre: string; codigo: string; unidadMedida: string }

interface BOMItem {
  id: string
  productoDesposteId: string
  insumoId: string
  cantidadPorCaja: number
  observaciones?: string | null
  productoDesposte: ProductoSimple
  insumo: InsumoSimple
}

export default function C2BOMModule({ operador }: { operador: Operador }) {
  const [bomItems, setBomItems] = useState<BOMItem[]>([])
  const [productos, setProductos] = useState<ProductoSimple[]>([])
  const [insumos, setInsumos] = useState<InsumoSimple[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [bomEditando, setBomEditando] = useState<BOMItem | null>(null)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroProducto, setFiltroProducto] = useState<string>('TODOS')

  // Form
  const [formData, setFormData] = useState({
    productoDesposteId: '',
    insumoId: '',
    cantidadPorCaja: '1',
    observaciones: ''
  })

  useEffect(() => {
    fetchBOM()
    fetchProductos()
    fetchInsumos()
  }, [])

  const fetchBOM = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/c2-bom')
      const data = await res.json()
      if (data.success) {
        setBomItems(data.data || [])
      } else {
        toast.error('Error al cargar BOM')
      }
    } catch (error) {
      console.error('Error fetching BOM:', error)
      toast.error('Error al cargar BOM')
    } finally {
      setLoading(false)
    }
  }

  const fetchProductos = async () => {
    try {
      const res = await fetch('/api/c2-productos-desposte')
      const data = await res.json()
      if (data.success) {
        setProductos((data.data || []).map((p: { id: string; nombre: string; codigo: string; activo: boolean }) => ({
          id: p.id,
          nombre: p.nombre,
          codigo: p.codigo,
          activo: p.activo
        })))
      }
    } catch (error) {
      console.error('Error fetching productos:', error)
    }
  }

  const fetchInsumos = async () => {
    try {
      const res = await fetch('/api/insumos')
      const data = await res.json()
      if (data.success) {
        setInsumos((data.data || []).map((i: { id: string; nombre: string; codigo: string; unidadMedida: string }) => ({
          id: i.id,
          nombre: i.nombre,
          codigo: i.codigo,
          unidadMedida: i.unidadMedida || 'UN'
        })))
      }
    } catch (error) {
      console.error('Error fetching insumos:', error)
    }
  }

  const stats = {
    total: bomItems.length,
    productosConBOM: [...new Set(bomItems.map(b => b.productoDesposteId))].length,
    insumosUsados: [...new Set(bomItems.map(b => b.insumoId))].length,
  }

  const handleNuevo = () => {
    setBomEditando(null)
    setFormData({
      productoDesposteId: productos.find(p => p.activo)?.id || '',
      insumoId: insumos[0]?.id || '',
      cantidadPorCaja: '1',
      observaciones: ''
    })
    setDialogOpen(true)
  }

  const handleEditar = (item: BOMItem) => {
    setBomEditando(item)
    setFormData({
      productoDesposteId: item.productoDesposteId,
      insumoId: item.insumoId,
      cantidadPorCaja: item.cantidadPorCaja.toString(),
      observaciones: item.observaciones || ''
    })
    setDialogOpen(true)
  }

  const handleEliminar = async (item: BOMItem) => {
    if (!confirm(`¿Está seguro de eliminar el insumo "${item.insumo.nombre}" del producto "${item.productoDesposte.nombre}"?`)) return

    try {
      const res = await fetch(`/api/c2-bom?id=${item.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        setBomItems(bomItems.filter(b => b.id !== item.id))
        toast.success('Item BOM eliminado')
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleGuardar = async () => {
    if (!formData.productoDesposteId) {
      toast.error('Seleccione un producto')
      return
    }
    if (!formData.insumoId) {
      toast.error('Seleccione un insumo')
      return
    }
    if (!formData.cantidadPorCaja || parseFloat(formData.cantidadPorCaja) <= 0) {
      toast.error('Ingrese una cantidad válida')
      return
    }

    setSaving(true)
    try {
      const payload = {
        id: bomEditando?.id,
        productoDesposteId: formData.productoDesposteId,
        insumoId: formData.insumoId,
        cantidadPorCaja: parseFloat(formData.cantidadPorCaja),
        observaciones: formData.observaciones.trim() || null,
      }

      const res = await fetch('/api/c2-bom', {
        method: bomEditando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.success) {
        toast.success(bomEditando ? 'Item BOM actualizado' : 'Item BOM creado')
        setDialogOpen(false)
        fetchBOM()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar item BOM')
    } finally {
      setSaving(false)
    }
  }

  // Filtrar BOM items
  const bomFiltrados = bomItems.filter(b => {
    if (filtroProducto !== 'TODOS' && b.productoDesposteId !== filtroProducto) return false
    if (busqueda) {
      const termino = busqueda.toLowerCase()
      return b.productoDesposte.nombre.toLowerCase().includes(termino) ||
        b.productoDesposte.codigo.toLowerCase().includes(termino) ||
        b.insumo.nombre.toLowerCase().includes(termino)
    }
    return true
  })

  // Group by product for display
  const productosConBOM = [...new Set(bomFiltrados.map(b => b.productoDesposteId))]
    .map(productoId => {
      const producto = bomFiltrados.find(b => b.productoDesposteId === productoId)?.productoDesposte
      const items = bomFiltrados.filter(b => b.productoDesposteId === productoId)
      return { producto, items }
    })
    .filter(p => p.producto)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <ClipboardList className="w-8 h-8 text-amber-500" />
              BOM - Insumos por Producto (C2)
            </h1>
            <p className="text-stone-500">Bill of Materials: insumos necesarios para producir cada caja de producto</p>
          </div>
          <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Item BOM
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-stone-100 p-2 rounded-lg">
                  <ClipboardList className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Total Items</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Productos con BOM</p>
                  <p className="text-xl font-bold text-amber-600">{stats.productosConBOM}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-teal-100 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Insumos Usados</p>
                  <p className="text-xl font-bold text-teal-600">{stats.insumosUsados}</p>
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
                    placeholder="Producto o insumo..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full md:w-64">
                <Label className="text-xs">Filtrar por Producto</Label>
                <Select value={filtroProducto} onValueChange={setFiltroProducto}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    {productos.filter(p => p.activo).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nombre} ({p.codigo})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de BOM */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-600" />
              Items BOM ({bomFiltrados.length})
            </CardTitle>
            <CardDescription>
              Insumos necesarios por cada caja de producto
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                <p className="text-stone-400 mt-2">Cargando BOM...</p>
              </div>
            ) : bomFiltrados.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No se encontraron items BOM</p>
              </div>
            ) : filtroProducto === 'TODOS' && !busqueda ? (
              // Grouped display when no filter
              <div className="max-h-[500px] overflow-y-auto">
                {productosConBOM.map(({ producto, items }) => (
                  <div key={producto!.id} className="border-b last:border-b-0">
                    <div className="px-4 py-2 bg-stone-50 flex items-center gap-2">
                      <Package className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold text-stone-800">{producto!.nombre}</span>
                      <Badge variant="outline" className="font-mono text-xs bg-stone-100">
                        {producto!.codigo}
                      </Badge>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                        {items.length} insumo{items.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-stone-50/30">
                          <TableHead>Insumo</TableHead>
                          <TableHead>Código</TableHead>
                          <TableHead className="text-center">Cantidad/Caja</TableHead>
                          <TableHead>Observaciones</TableHead>
                          <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.insumo.nombre}</TableCell>
                            <TableCell className="font-mono text-sm text-stone-500">{item.insumo.codigo}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                                {item.cantidadPorCaja} {item.insumo.unidadMedida}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-stone-500 text-sm">{item.observaciones || '-'}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEditar(item)} title="Editar">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEliminar(item)}
                                  title="Eliminar"
                                  className="text-red-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            ) : (
              // Flat table when filter is active
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50/50">
                      <TableHead>Producto</TableHead>
                      <TableHead>Insumo</TableHead>
                      <TableHead className="text-center">Cantidad/Caja</TableHead>
                      <TableHead>Observaciones</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bomFiltrados.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{item.productoDesposte.nombre}</span>
                            <span className="text-xs text-stone-400 ml-1">({item.productoDesposte.codigo})</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium">{item.insumo.nombre}</span>
                            <span className="text-xs text-stone-400 ml-1">({item.insumo.codigo})</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                            {item.cantidadPorCaja} {item.insumo.unidadMedida}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-stone-500 text-sm">{item.observaciones || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditar(item)} title="Editar">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEliminar(item)}
                              title="Eliminar"
                              className="text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog Nuevo/Editar BOM Item */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md" maximizable>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-500" />
                {bomEditando ? 'Editar Item BOM' : 'Nuevo Item BOM'}
              </DialogTitle>
              <DialogDescription>
                {bomEditando
                  ? 'Modifique los datos del item BOM'
                  : 'Asigne un insumo a un producto de desposte'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Producto de Desposte *</Label>
                <Select
                  value={formData.productoDesposteId}
                  onValueChange={(value) => setFormData({ ...formData, productoDesposteId: value })}
                  disabled={!!bomEditando}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                  <SelectContent>
                    {productos.filter(p => p.activo).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nombre} ({p.codigo})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Insumo *</Label>
                <Select
                  value={formData.insumoId}
                  onValueChange={(value) => setFormData({ ...formData, insumoId: value })}
                  disabled={!!bomEditando}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccionar insumo" /></SelectTrigger>
                  <SelectContent>
                    {insumos.map(i => (
                      <SelectItem key={i.id} value={i.id}>{i.nombre} ({i.codigo})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cantidad por Caja *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cantidadPorCaja}
                  onChange={(e) => setFormData({ ...formData, cantidadPorCaja: e.target.value })}
                  placeholder="1"
                />
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Observaciones..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleGuardar} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
