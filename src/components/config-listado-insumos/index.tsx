'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { 
  ClipboardList, Download, Search, Package, DollarSign, 
  AlertTriangle, TrendingDown, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface Operador {
  id: string
  nombre: string
  rol: string
}

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
  puntoReposicion?: number | null
  precioUnitario?: number | null
  moneda?: string
  proveedorNombre?: string | null
  codigoProveedor?: string | null
  ubicacion?: string | null
  activo: boolean
}

const CATEGORIAS = [
  { value: 'EMBALAJE', label: 'Embalaje' },
  { value: 'ETIQUETAS', label: 'Etiquetas' },
  { value: 'HIGIENE', label: 'Higiene' },
  { value: 'PROTECCION', label: 'Proteccion' },
  { value: 'HERRAMIENTAS', label: 'Herramientas' },
  { value: 'OFICINA', label: 'Oficina' },
  { value: 'OTROS', label: 'Otros' },
]

const CATEGORIA_LABELS: Record<string, string> = Object.fromEntries(CATEGORIAS.map(c => [c.value, c.label]))

export function ConfigListadoInsumosModule({ operador }: { operador: Operador }) {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODOS')
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
  const [exportando, setExportando] = useState(false)
  const [mostrarInactivos, setMostrarInactivos] = useState(false)

  // Cargar insumos desde la API
  useEffect(() => {
    const fetchInsumos = async () => {
      try {
        const res = await fetch('/api/insumos')
        const data = await res.json()
        if (data.success) {
          setInsumos(data.data)
        }
      } catch (error) {
        console.error('Error fetching insumos:', error)
        toast.error('Error al cargar insumos')
      } finally {
        setLoading(false)
      }
    }
    fetchInsumos()
  }, [])

  // Funcion para determinar estado del stock
  const getStockStatus = (insumo: Insumo): 'ok' | 'bajo' | 'critico' => {
    if (insumo.stockActual === 0) return 'critico'
    if (insumo.stockActual <= insumo.stockMinimo) return 'critico'
    if (insumo.stockMinimo > 0 && insumo.stockActual <= insumo.stockMinimo * 1.5) return 'bajo'
    return 'ok'
  }

  // Filtrar insumos
  const insumosFiltrados = useMemo(() => {
    return insumos.filter(insumo => {
      // Excluir inactivos (opcional)
      if (!mostrarInactivos && !insumo.activo) return false

      // Filtro por categoria
      if (filtroCategoria !== 'TODOS' && insumo.categoria !== filtroCategoria) return false

      // Filtro por estado
      if (filtroEstado !== 'TODOS') {
        const status = getStockStatus(insumo)
        if (filtroEstado !== status) return false
      }

      // Busqueda
      if (busqueda) {
        const termino = busqueda.toLowerCase()
        return (
          (insumo.codigo || '').toLowerCase().includes(termino) ||
          insumo.nombre.toLowerCase().includes(termino) ||
          (insumo.proveedorNombre || '').toLowerCase().includes(termino) ||
          (insumo.ubicacion || '').toLowerCase().includes(termino)
        )
      }

      return true
    })
  }, [insumos, busqueda, filtroCategoria, filtroEstado, mostrarInactivos])

  // Agrupar por categoria
  const insumosAgrupados = useMemo(() => {
    const grupos: Record<string, Insumo[]> = {}
    insumosFiltrados.forEach(insumo => {
      const catLabel = CATEGORIA_LABELS[insumo.categoria] || insumo.categoria
      if (!grupos[catLabel]) {
        grupos[catLabel] = []
      }
      grupos[catLabel].push(insumo)
    })
    return grupos
  }, [insumosFiltrados])

  // Calculos de resumen
  const resumen = useMemo(() => {
    const activos = insumos.filter(i => i.activo)
    const totalItems = activos.length
    const valorTotalStock = activos.reduce((acc, i) => acc + (i.stockActual * (i.precioUnitario || 0)), 0)
    const itemsBajoStock = activos.filter(i => getStockStatus(i) !== 'ok').length
    const itemsCriticos = activos.filter(i => getStockStatus(i) === 'critico').length

    return { totalItems, valorTotalStock, itemsBajoStock, itemsCriticos }
  }, [insumos])

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value)
  }

  // Badge de estado
  const getStockBadge = (insumo: Insumo) => {
    const status = getStockStatus(insumo)
    switch (status) {
      case 'critico':
        return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Sin Stock</Badge>
      case 'bajo':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Bajo</Badge>
      default:
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">OK</Badge>
    }
  }

  // Escapar campo CSV (entre comillas y doblar comillas internas)
  const csvEscape = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""'
    const s = String(val)
    return `"${s.replace(/"/g, '""')}"`
  }

  // Exportar a Excel (CSV con BOM UTF-8 para compatibilidad con Excel)
  const handleExportExcel = async () => {
    setExportando(true)
    try {
      const headers = [
        'Codigo',
        'Nombre',
        'Categoria',
        'Subcategoria',
        'Unidad Medida',
        'Stock Actual',
        'Stock Minimo',
        'Stock Maximo',
        'Punto Reposicion',
        'Precio Unitario',
        'Moneda',
        'Valor Total',
        'Proveedor',
        'Cod. Proveedor',
        'Ubicacion',
        'Estado',
        'Activo',
      ]

      const rows = insumosFiltrados.map(i => {
        const status = getStockStatus(i)
        const estadoLabel = status === 'critico' ? 'CRITICO' : status === 'bajo' ? 'BAJO' : 'OK'
        return [
          csvEscape(i.codigo),
          csvEscape(i.nombre),
          csvEscape(CATEGORIA_LABELS[i.categoria] || i.categoria),
          csvEscape(i.subcategoria),
          csvEscape(i.unidadMedida),
          i.stockActual,
          i.stockMinimo,
          csvEscape(i.stockMaximo),
          csvEscape(i.puntoReposicion),
          csvEscape(i.precioUnitario),
          csvEscape(i.moneda || 'ARS'),
          i.stockActual * (i.precioUnitario || 0),
          csvEscape(i.proveedorNombre),
          csvEscape(i.codigoProveedor),
          csvEscape(i.ubicacion),
          estadoLabel,
          i.activo ? 'Si' : 'No',
        ]
      })

      // Agregar fila de totales
      const totalStock = insumosFiltrados.reduce((a, i) => a + i.stockActual, 0)
      const totalValor = insumosFiltrados.reduce((a, i) => a + i.stockActual * (i.precioUnitario || 0), 0)
      rows.push([
        '', '', '', '', '', totalStock, '', '', '', '', '', totalValor, '', '', '', '', ''
      ])

      const csvContent = [
        headers.join(';'),
        ...rows.map(r => r.join(';')),
        '',
        `Total items: ${insumosFiltrados.length}`,
        `Valor total stock: ${formatCurrency(totalValor)}`,
        `Fecha exportacion: ${new Date().toLocaleString('es-AR')}`,
      ].join('\n')

      // BOM UTF-8 para que Excel reconozca caracteres especiales
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `listado_insumos_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)

      toast.success(`${insumosFiltrados.length} insumos exportados correctamente`)
    } catch (error) {
      console.error('Error exporting:', error)
      toast.error('Error al exportar el listado')
    } finally {
      setExportando(false)
    }
  }

  // Color de fondo segun estado
  const getRowClassName = (insumo: Insumo) => {
    const status = getStockStatus(insumo)
    if (status === 'critico') return 'bg-red-50 hover:bg-red-100/50'
    if (status === 'bajo') return 'bg-amber-50 hover:bg-amber-100/50'
    return 'hover:bg-stone-50'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <ClipboardList className="w-8 h-8 text-amber-500" />
              Listado de Insumos
            </h1>
            <p className="text-stone-500 mt-1">
              Inventario completo de insumos del frigorifico
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400">
              Operador: {operador.nombre}
            </span>
          </div>
        </div>

        {/* Resumen Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500 mb-1">Total Items</p>
                  <p className="text-3xl font-bold text-stone-800">{resumen.totalItems}</p>
                  <p className="text-xs text-stone-400 mt-1">
                    {Object.keys(insumosAgrupados).length} categorias
                  </p>
                </div>
                <div className="bg-stone-100 p-3 rounded-lg">
                  <Package className="w-8 h-8 text-stone-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500 mb-1">Valor Total Stock</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(resumen.valorTotalStock)}
                  </p>
                </div>
                <div className="bg-emerald-100 p-3 rounded-lg">
                  <DollarSign className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500 mb-1">Items Bajo Stock</p>
                  <p className="text-3xl font-bold text-red-600">{resumen.itemsBajoStock}</p>
                  <p className="text-xs text-red-400 mt-1">
                    {resumen.itemsCriticos} criticos
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <TrendingDown className="w-8 h-8 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y busqueda */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Busqueda */}
              <div className="flex-1">
                <Label className="text-xs text-stone-500 mb-1 block">Buscar</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <Input
                    className="pl-9"
                    placeholder="Codigo, nombre, proveedor o ubicacion..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>

              {/* Filtro Categoria */}
              <div className="w-full md:w-48">
                <Label className="text-xs text-stone-500 mb-1 block">Categoria</Label>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todas</SelectItem>
                    {CATEGORIAS.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro Estado */}
              <div className="w-full md:w-40">
                <Label className="text-xs text-stone-500 mb-1 block">Estado Stock</Label>
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="ok">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        OK
                      </span>
                    </SelectItem>
                    <SelectItem value="bajo">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Bajo
                      </span>
                    </SelectItem>
                    <SelectItem value="critico">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Critico
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Boton Exportar */}
              <div className="flex items-end">
                <Button
                  onClick={handleExportExcel}
                  disabled={exportando || insumosFiltrados.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {exportando ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {exportando ? 'Exportando...' : 'Exportar Excel'}
                </Button>
              </div>
            </div>

            {/* Toggle inactivos */}
            <div className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                id="mostrar-inactivos"
                checked={mostrarInactivos}
                onChange={(e) => setMostrarInactivos(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="mostrar-inactivos" className="text-xs text-stone-500 cursor-pointer">
                Mostrar inactivos ({insumos.filter(i => !i.activo).length} ocultos)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Tabla por categorias */}
        {Object.keys(insumosAgrupados).length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-stone-300" />
              <p className="text-stone-500">No se encontraron insumos con los filtros aplicados</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(insumosAgrupados)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([categoria, itemsCategoria]) => (
              <Card key={categoria} className="border-0 shadow-md overflow-hidden">
                <CardHeader className="bg-stone-100 py-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-stone-700 flex items-center gap-2">
                      <Package className="w-4 h-4 text-amber-500" />
                      {categoria}
                    </CardTitle>
                    <Badge variant="outline" className="bg-white">
                      {itemsCategoria.length} items
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-stone-50/50">
                          <TableHead className="w-24 font-semibold">Codigo</TableHead>
                          <TableHead className="font-semibold">Nombre</TableHead>
                          <TableHead className="w-20 text-center font-semibold">Unidad</TableHead>
                          <TableHead className="text-right font-semibold">Stock Actual</TableHead>
                          <TableHead className="text-right font-semibold">Stock Min.</TableHead>
                          <TableHead className="text-right font-semibold">Precio Unit.</TableHead>
                          <TableHead className="text-right font-semibold">Valor Total</TableHead>
                          <TableHead className="font-semibold">Proveedor</TableHead>
                          <TableHead className="font-semibold">Ubicacion</TableHead>
                          <TableHead className="w-24 text-center font-semibold">Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itemsCategoria.map((insumo) => (
                          <TableRow key={insumo.id} className={`${getRowClassName(insumo)} ${!insumo.activo ? 'opacity-50' : ''}`}>
                            <TableCell className="font-mono text-sm font-medium">
                              {insumo.codigo}
                            </TableCell>
                            <TableCell className="font-medium">
                              {insumo.nombre}
                              {!insumo.activo && (
                                <Badge variant="outline" className="ml-2 text-xs bg-stone-200">Inactivo</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-xs">
                                {insumo.unidadMedida}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              <span className={
                                getStockStatus(insumo) === 'critico'
                                  ? 'text-red-600'
                                  : getStockStatus(insumo) === 'bajo'
                                    ? 'text-amber-600'
                                    : ''
                              }>
                                {insumo.stockActual.toLocaleString('es-AR')}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-stone-500">
                              {insumo.stockMinimo.toLocaleString('es-AR')}
                            </TableCell>
                            <TableCell className="text-right text-stone-600">
                              {insumo.precioUnitario != null ? formatCurrency(insumo.precioUnitario) : '-'}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {insumo.precioUnitario != null ? formatCurrency(insumo.stockActual * insumo.precioUnitario) : '-'}
                            </TableCell>
                            <TableCell className="text-sm text-stone-500">
                              {insumo.proveedorNombre || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-stone-500">
                              {insumo.ubicacion || '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              {getStockBadge(insumo)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))
        )}

        {/* Leyenda de estados */}
        <Card className="border-0 shadow-sm bg-stone-50">
          <CardContent className="py-3 px-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
              <span className="font-medium">Leyenda:</span>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>OK - Stock normal</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Bajo - Stock entre minimo y 1.5x minimo</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span>Critico - Sin stock o bajo minimo</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center text-xs text-stone-400 pb-4">
          <p>
            Mostrando {insumosFiltrados.length} de {insumos.filter(i => i.activo).length} insumos activos
            {filtroCategoria !== 'TODOS' && ` en categoria "${CATEGORIA_LABELS[filtroCategoria] || filtroCategoria}"`}
            {filtroEstado !== 'TODOS' && ` con estado "${filtroEstado}"`}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ConfigListadoInsumosModule
