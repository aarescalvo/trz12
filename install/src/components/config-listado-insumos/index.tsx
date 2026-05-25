'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  AlertTriangle, TrendingDown, Loader2, FileSpreadsheet
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
  unidad: string
  stockActual: number
  stockMinimo: number
  precioUnitario: number
  ubicacion: string
}

const CATEGORIAS = [
  'Bolsas',
  'Láminas',
  'Cajas',
  'Fajas',
  'Etiquetas',
  'Productos de Limpieza',
  'Herramientas',
  'Insumos de Oficina'
]

// Datos simulados - 18 items
const INSUMOS_SIMULADOS: Insumo[] = [
  {
    id: '1',
    codigo: 'BOL-001',
    nombre: 'Bolsa Vacío 5kg',
    categoria: 'Bolsas',
    unidad: 'UN',
    stockActual: 2500,
    stockMinimo: 500,
    precioUnitario: 45.50,
    ubicacion: 'Depósito A - Estante 3'
  },
  {
    id: '2',
    codigo: 'BOL-002',
    nombre: 'Bolsa Media Res',
    categoria: 'Bolsas',
    unidad: 'UN',
    stockActual: 150,
    stockMinimo: 200,
    precioUnitario: 120.00,
    ubicacion: 'Depósito A - Estante 3'
  },
  {
    id: '3',
    codigo: 'BOL-003',
    nombre: 'Bolsa Cuarto Trasero',
    categoria: 'Bolsas',
    unidad: 'UN',
    stockActual: 890,
    stockMinimo: 300,
    precioUnitario: 85.00,
    ubicacion: 'Depósito A - Estante 4'
  },
  {
    id: '4',
    codigo: 'LAM-001',
    nombre: 'Lámina Paletizable',
    categoria: 'Láminas',
    unidad: 'MT',
    stockActual: 450,
    stockMinimo: 100,
    precioUnitario: 28.00,
    ubicacion: 'Depósito A - Estante 1'
  },
  {
    id: '5',
    codigo: 'LAM-002',
    nombre: 'Lámina Termoencogible',
    categoria: 'Láminas',
    unidad: 'MT',
    stockActual: 85,
    stockMinimo: 150,
    precioUnitario: 35.00,
    ubicacion: 'Depósito A - Estante 1'
  },
  {
    id: '6',
    codigo: 'CAJ-001',
    nombre: 'Caja Exportación',
    categoria: 'Cajas',
    unidad: 'UN',
    stockActual: 800,
    stockMinimo: 300,
    precioUnitario: 150.00,
    ubicacion: 'Depósito B - Sector 1'
  },
  {
    id: '7',
    codigo: 'CAJ-002',
    nombre: 'Caja Mercado Interno',
    categoria: 'Cajas',
    unidad: 'UN',
    stockActual: 0,
    stockMinimo: 400,
    precioUnitario: 95.00,
    ubicacion: 'Depósito B - Sector 1'
  },
  {
    id: '8',
    codigo: 'CAJ-003',
    nombre: 'Caja Menudencias',
    categoria: 'Cajas',
    unidad: 'UN',
    stockActual: 1200,
    stockMinimo: 500,
    precioUnitario: 65.00,
    ubicacion: 'Depósito B - Sector 2'
  },
  {
    id: '9',
    codigo: 'FAJ-001',
    nombre: 'Faja 20cm',
    categoria: 'Fajas',
    unidad: 'UN',
    stockActual: 1200,
    stockMinimo: 500,
    precioUnitario: 12.50,
    ubicacion: 'Depósito A - Estante 2'
  },
  {
    id: '10',
    codigo: 'FAJ-002',
    nombre: 'Faja 15cm',
    categoria: 'Fajas',
    unidad: 'UN',
    stockActual: 320,
    stockMinimo: 400,
    precioUnitario: 10.00,
    ubicacion: 'Depósito A - Estante 2'
  },
  {
    id: '11',
    codigo: 'ETQ-001',
    nombre: 'Etiqueta Media Res',
    categoria: 'Etiquetas',
    unidad: 'UN',
    stockActual: 5000,
    stockMinimo: 1000,
    precioUnitario: 2.50,
    ubicacion: 'Oficina - Archivador'
  },
  {
    id: '12',
    codigo: 'ETQ-002',
    nombre: 'Etiqueta Exportación',
    categoria: 'Etiquetas',
    unidad: 'UN',
    stockActual: 850,
    stockMinimo: 500,
    precioUnitario: 4.00,
    ubicacion: 'Oficina - Archivador'
  },
  {
    id: '13',
    codigo: 'LIM-001',
    nombre: 'Desinfectante Industrial',
    categoria: 'Productos de Limpieza',
    unidad: 'LT',
    stockActual: 45,
    stockMinimo: 50,
    precioUnitario: 280.00,
    ubicacion: 'Área Limpieza'
  },
  {
    id: '14',
    codigo: 'LIM-002',
    nombre: 'Jabón Antibacterial',
    categoria: 'Productos de Limpieza',
    unidad: 'LT',
    stockActual: 0,
    stockMinimo: 20,
    precioUnitario: 150.00,
    ubicacion: 'Área Limpieza'
  },
  {
    id: '15',
    codigo: 'HER-001',
    nombre: 'Cuchillo Desposte',
    categoria: 'Herramientas',
    unidad: 'UN',
    stockActual: 35,
    stockMinimo: 10,
    precioUnitario: 850.00,
    ubicacion: 'Depósito Herramientas'
  },
  {
    id: '16',
    codigo: 'HER-002',
    nombre: 'Afilador Cuchillos',
    categoria: 'Herramientas',
    unidad: 'UN',
    stockActual: 8,
    stockMinimo: 5,
    precioUnitario: 450.00,
    ubicacion: 'Depósito Herramientas'
  },
  {
    id: '17',
    codigo: 'OFI-001',
    nombre: 'Papel Térmico 80mm',
    categoria: 'Insumos de Oficina',
    unidad: 'UN',
    stockActual: 24,
    stockMinimo: 10,
    precioUnitario: 85.00,
    ubicacion: 'Oficina'
  },
  {
    id: '18',
    codigo: 'OFI-002',
    nombre: 'Etiqueta Adhesiva A4',
    categoria: 'Insumos de Oficina',
    unidad: 'UN',
    stockActual: 3,
    stockMinimo: 10,
    precioUnitario: 120.00,
    ubicacion: 'Oficina'
  }
]

export function ConfigListadoInsumosModule({ operador }: { operador: Operador }) {
  const [insumos] = useState<Insumo[]>(INSUMOS_SIMULADOS)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODOS')
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
  const [exportando, setExportando] = useState(false)

  // Función para determinar estado del stock
  const getStockStatus = (insumo: Insumo): 'ok' | 'bajo' | 'critico' => {
    if (insumo.stockActual === 0) return 'critico'
    if (insumo.stockActual <= insumo.stockMinimo) return 'critico'
    if (insumo.stockActual <= insumo.stockMinimo * 1.5) return 'bajo'
    return 'ok'
  }

  // Filtrar insumos
  const insumosFiltrados = useMemo(() => {
    return insumos.filter(insumo => {
      // Filtro por categoría
      if (filtroCategoria !== 'TODOS' && insumo.categoria !== filtroCategoria) return false
      
      // Filtro por estado
      if (filtroEstado) {
        const status = getStockStatus(insumo)
        if (filtroEstado === 'ok' && status !== 'ok') return false
        if (filtroEstado === 'bajo' && status !== 'bajo') return false
        if (filtroEstado === 'critico' && status !== 'critico') return false
      }
      
      // Búsqueda
      if (busqueda) {
        const termino = busqueda.toLowerCase()
        return (
          insumo.codigo.toLowerCase().includes(termino) ||
          insumo.nombre.toLowerCase().includes(termino) ||
          insumo.ubicacion.toLowerCase().includes(termino)
        )
      }
      
      return true
    })
  }, [insumos, busqueda, filtroCategoria, filtroEstado])

  // Agrupar por categoría
  const insumosAgrupados = useMemo(() => {
    const grupos: Record<string, Insumo[]> = {}
    insumosFiltrados.forEach(insumo => {
      if (!grupos[insumo.categoria]) {
        grupos[insumo.categoria] = []
      }
      grupos[insumo.categoria].push(insumo)
    })
    return grupos
  }, [insumosFiltrados])

  // Cálculos de resumen
  const resumen = useMemo(() => {
    const totalItems = insumos.length
    const valorTotalStock = insumos.reduce((acc, i) => acc + (i.stockActual * i.precioUnitario), 0)
    const itemsBajoStock = insumos.filter(i => getStockStatus(i) !== 'ok').length
    const itemsCriticos = insumos.filter(i => getStockStatus(i) === 'critico').length
    
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
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
            Sin Stock
          </Badge>
        )
      case 'bajo':
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
            Bajo
          </Badge>
        )
      default:
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
            OK
          </Badge>
        )
    }
  }

  // Exportar a Excel (simulado)
  const handleExportExcel = async () => {
    setExportando(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Crear CSV simulado
      const headers = ['Código', 'Nombre', 'Categoría', 'Unidad', 'Stock Actual', 'Stock Mínimo', 'Precio Unit.', 'Valor Total', 'Ubicación', 'Estado']
      const rows = insumosFiltrados.map(i => [
        i.codigo,
        i.nombre,
        i.categoria,
        i.unidad,
        i.stockActual.toString(),
        i.stockMinimo.toString(),
        i.precioUnitario.toString(),
        (i.stockActual * i.precioUnitario).toString(),
        i.ubicacion,
        getStockStatus(i).toUpperCase()
      ])
      
      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\n')
      
      // Simular descarga
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `listado_insumos_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
      
      toast.success('Listado de insumos exportado correctamente')
    } catch (error) {
      toast.error('Error al exportar el listado')
    } finally {
      setExportando(false)
    }
  }

  // Color de fondo según estado
  const getRowClassName = (insumo: Insumo) => {
    const status = getStockStatus(insumo)
    if (status === 'critico') return 'bg-red-50 hover:bg-red-100/50'
    if (status === 'bajo') return 'bg-amber-50 hover:bg-amber-100/50'
    return 'hover:bg-stone-50'
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
              Inventario completo de insumos del frigorífico
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
                    {Object.keys(insumosAgrupados).length} categorías
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
                    {resumen.itemsCriticos} críticos
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <TrendingDown className="w-8 h-8 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Búsqueda */}
              <div className="flex-1">
                <Label className="text-xs text-stone-500 mb-1 block">Buscar</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <Input
                    className="pl-9"
                    placeholder="Código, nombre o ubicación..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>

              {/* Filtro Categoría */}
              <div className="w-full md:w-48">
                <Label className="text-xs text-stone-500 mb-1 block">Categoría</Label>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todas</SelectItem>
                    {CATEGORIAS.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
                        Crítico
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botón Exportar */}
              <div className="flex items-end">
                <Button 
                  onClick={handleExportExcel}
                  disabled={exportando}
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
          </CardContent>
        </Card>

        {/* Tabla por categorías */}
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
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50/50">
                        <TableHead className="w-24 font-semibold">Código</TableHead>
                        <TableHead className="font-semibold">Nombre</TableHead>
                        <TableHead className="w-20 text-center font-semibold">Unidad</TableHead>
                        <TableHead className="text-right font-semibold">Stock Actual</TableHead>
                        <TableHead className="text-right font-semibold">Stock Mínimo</TableHead>
                        <TableHead className="text-right font-semibold">Precio Unit.</TableHead>
                        <TableHead className="text-right font-semibold">Valor Total</TableHead>
                        <TableHead className="font-semibold">Ubicación</TableHead>
                        <TableHead className="w-24 text-center font-semibold">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itemsCategoria.map((insumo) => (
                        <TableRow key={insumo.id} className={getRowClassName(insumo)}>
                          <TableCell className="font-mono text-sm font-medium">
                            {insumo.codigo}
                          </TableCell>
                          <TableCell className="font-medium">
                            {insumo.nombre}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-xs">
                              {insumo.unidad}
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
                            {formatCurrency(insumo.precioUnitario)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(insumo.stockActual * insumo.precioUnitario)}
                          </TableCell>
                          <TableCell className="text-sm text-stone-500">
                            {insumo.ubicacion}
                          </TableCell>
                          <TableCell className="text-center">
                            {getStockBadge(insumo)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                <span>Bajo - Stock entre mínimo y 1.5x mínimo</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span>Crítico - Sin stock o bajo mínimo</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center text-xs text-stone-400 pb-4">
          <p>
            Mostrando {insumosFiltrados.length} de {insumos.length} insumos
            {filtroCategoria && ` en categoría "${filtroCategoria}"`}
            {filtroEstado && ` con estado "${filtroEstado}"`}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ConfigListadoInsumosModule
