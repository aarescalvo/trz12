'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  FileText, Search, Filter, Download, Eye, User, Clock, 
  Calendar, ArrowDownToLine, ArrowUpFromLine, Edit, Trash2, 
  LogIn, LogOut, Plus, Save, RefreshCw, ChevronLeft, ChevronRight,
  Activity, AlertTriangle, Shield, BarChart3, TrendingUp,
  Monitor, Smartphone, Tablet, X, Printer, Key
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

interface AuditoriaItem {
  id: string
  operadorId: string | null
  operador: { 
    id: string
    nombre: string
    usuario: string
    rol: string
  } | null
  modulo: string
  submodulo: string | null
  accion: string
  entidad: string
  entidadId: string | null
  entidadNombre: string | null
  descripcion: string
  datosAntes: string | null
  datosDespues: string | null
  cambios: string | null
  fecha: string
  ip: string | null
  userAgent: string | null
  sessionId: string | null
  dispositivo: string | null
}

interface Estadisticas {
  porAccion: { accion: string; count: number }[]
  porModulo: { modulo: string; count: number }[]
  porOperador: { operadorId: string; nombre: string; usuario: string; count: number }[]
  actividadPorHora: { hora: number; count: number }[]
  conteos: {
    hoy: number
    ultimos7dias: number
    ultimos30dias: number
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const MODULOS = [
  { id: 'AUTH', label: 'Autenticación' },
  { id: 'PESAJE_CAMION', label: 'Pesaje Camión' },
  { id: 'PESAJE_INDIVIDUAL', label: 'Pesaje Individual' },
  { id: 'MOVIMIENTO_HACIENDA', label: 'Movimiento de Hacienda' },
  { id: 'TROPAS', label: 'Tropas' },
  { id: 'ANIMALES', label: 'Animales' },
  { id: 'FAENA', label: 'Faena' },
  { id: 'ROMANEO', label: 'Romaneo' },
  { id: 'STOCK', label: 'Stock' },
  { id: 'CAMARAS', label: 'Cámaras' },
  { id: 'MENUDENCIAS', label: 'Menudencias' },
  { id: 'FACTURACION', label: 'Facturación' },
  { id: 'PAGOS', label: 'Pagos' },
  { id: 'CLIENTES', label: 'Clientes' },
  { id: 'PROVEEDORES', label: 'Proveedores' },
  { id: 'OPERADORES', label: 'Operadores' },
  { id: 'CONFIGURACION', label: 'Configuración' },
  { id: 'REPORTES', label: 'Reportes' },
  { id: 'SEGURIDAD', label: 'Seguridad' },
  { id: 'CCIR', label: 'CCIR' },
  { id: 'INSUMOS', label: 'Insumos' },
]

const ACCIONES = [
  { id: 'LOGIN', label: 'Login', icon: LogIn, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'LOGOUT', label: 'Logout', icon: LogOut, color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { id: 'LOGIN_PIN', label: 'Login PIN', icon: Key, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'LOGIN_FAILED', label: 'Login Fallido', icon: AlertTriangle, color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'CREATE', label: 'Crear', icon: Plus, color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'UPDATE', label: 'Actualizar', icon: Save, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'DELETE', label: 'Eliminar', icon: Trash2, color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'READ', label: 'Leer', icon: Eye, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'EXPORT', label: 'Exportar', icon: Download, color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { id: 'PRINT', label: 'Imprimir', icon: Printer, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { id: 'PASSWORD_CHANGE', label: 'Cambio Password', icon: Key, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'PERMISSION_CHANGE', label: 'Cambio Permisos', icon: Shield, color: 'bg-violet-100 text-violet-700 border-violet-200' },
]

export function AuditoriaViewer() {
  const [auditoria, setAuditoria] = useState<AuditoriaItem[]>([])
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [filtroModulo, setFiltroModulo] = useState('todos')
  const [filtroAccion, setFiltroAccion] = useState('todos')
  const [filtroOperador, setFiltroOperador] = useState('')
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
  const [busqueda, setBusqueda] = useState('')
  
  // Diálogos
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [itemSeleccionado, setItemSeleccionado] = useState<AuditoriaItem | null>(null)

  const fetchAuditoria = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroModulo !== 'todos') params.append('modulo', filtroModulo)
      if (filtroAccion !== 'todos') params.append('accion', filtroAccion)
      if (filtroOperador) params.append('operadorId', filtroOperador)
      if (filtroFechaDesde) params.append('fechaDesde', filtroFechaDesde)
      if (filtroFechaHasta) params.append('fechaHasta', filtroFechaHasta)
      if (busqueda) params.append('q', busqueda)
      params.append('page', String(pagination.page))
      params.append('limit', String(pagination.limit))
      
      const res = await fetch(`/api/auditoria/buscar?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setAuditoria(data.data)
        setPagination(data.pagination)
        setEstadisticas(data.estadisticas)
      }
    } catch (error) {
      console.error('Error fetching auditoria:', error)
      toast.error('Error al cargar auditoría')
    } finally {
      setLoading(false)
    }
  }, [filtroModulo, filtroAccion, filtroOperador, filtroFechaDesde, filtroFechaHasta, busqueda, pagination.page, pagination.limit])

  useEffect(() => {
    fetchAuditoria()
  }, [fetchAuditoria])

  const handleVerDetalle = (item: AuditoriaItem) => {
    setItemSeleccionado(item)
    setDetalleOpen(true)
  }

  const exportarCSV = async () => {
    try {
      const params = new URLSearchParams()
      if (filtroModulo !== 'todos') params.append('modulo', filtroModulo)
      if (filtroAccion !== 'todos') params.append('accion', filtroAccion)
      if (filtroFechaDesde) params.append('fechaDesde', filtroFechaDesde)
      if (filtroFechaHasta) params.append('fechaHasta', filtroFechaHasta)
      params.append('limit', '10000')  // Exportar todos
      
      const res = await fetch(`/api/auditoria/buscar?${params}`)
      const data = await res.json()
      
      if (data.success) {
        const headers = ['Fecha', 'Hora', 'Operador', 'Usuario', 'Módulo', 'Acción', 'Entidad', 'Descripción', 'IP']
        const rows = data.data.map((item: AuditoriaItem) => [
          format(new Date(item.fecha), 'dd/MM/yyyy', { locale: es }),
          format(new Date(item.fecha), 'HH:mm:ss', { locale: es }),
          item.operador?.nombre || 'Sistema',
          item.operador?.usuario || '-',
          item.modulo,
          item.accion,
          item.entidad,
          `"${item.descripcion.replace(/"/g, '""')}"`,
          item.ip || '-'
        ])

        const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `auditoria_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('CSV exportado correctamente')
      }
    } catch (error) {
      console.error('Error exportando:', error)
      toast.error('Error al exportar')
    }
  }

  const limpiarFiltros = () => {
    setFiltroModulo('todos')
    setFiltroAccion('todos')
    setFiltroOperador('')
    setFiltroFechaDesde('')
    setFiltroFechaHasta('')
    setBusqueda('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const setRangoFecha = (dias: number) => {
    const hoy = new Date()
    const desde = subDays(hoy, dias)
    setFiltroFechaDesde(format(desde, 'yyyy-MM-dd'))
    setFiltroFechaHasta(format(hoy, 'yyyy-MM-dd'))
  }

  const getAccionInfo = (accion: string) => {
    return ACCIONES.find(a => a.id === accion) || { label: accion, icon: FileText, color: 'bg-gray-100 text-gray-700 border-gray-200' }
  }

  const getModuloLabel = (modulo: string) => {
    return MODULOS.find(m => m.id === modulo)?.label || modulo
  }

  const parseUserAgent = (ua: string | null) => {
    if (!ua) return { browser: 'Desconocido', os: 'Desconocido', device: 'Desktop' }
    
    let browser = 'Desconocido'
    let os = 'Desconocido'
    let device = 'Desktop'
    
    const uaLower = ua.toLowerCase()
    
    if (uaLower.includes('firefox')) browser = 'Firefox'
    else if (uaLower.includes('edg')) browser = 'Edge'
    else if (uaLower.includes('chrome')) browser = 'Chrome'
    else if (uaLower.includes('safari')) browser = 'Safari'
    
    if (uaLower.includes('windows')) os = 'Windows'
    else if (uaLower.includes('mac')) os = 'macOS'
    else if (uaLower.includes('linux')) os = 'Linux'
    else if (uaLower.includes('android')) os = 'Android'
    else if (uaLower.includes('iphone') || uaLower.includes('ipad')) os = 'iOS'
    
    if (uaLower.includes('mobile') || uaLower.includes('iphone')) device = 'Mobile'
    else if (uaLower.includes('tablet') || uaLower.includes('ipad')) device = 'Tablet'
    
    return { browser, os, device }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
              <Shield className="w-7 h-7 text-stone-600" />
              Auditoría del Sistema
            </h2>
            <p className="text-stone-500">Registro completo de todas las operaciones</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchAuditoria()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Button variant="outline" onClick={exportarCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        {estadisticas && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Hoy</p>
                    <p className="text-2xl font-bold">{estadisticas.conteos.hoy}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Últimos 7 días</p>
                    <p className="text-2xl font-bold">{estadisticas.conteos.ultimos7dias}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Últimos 30 días</p>
                    <p className="text-2xl font-bold">{estadisticas.conteos.ultimos30dias}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Usuarios Activos</p>
                    <p className="text-2xl font-bold">{estadisticas.porOperador.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Búsqueda y filtros rápidos */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input
                      placeholder="Buscar por operador, descripción, entidad..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setRangoFecha(0)}>Hoy</Button>
                  <Button variant="outline" size="sm" onClick={() => setRangoFecha(7)}>7 días</Button>
                  <Button variant="outline" size="sm" onClick={() => setRangoFecha(30)}>30 días</Button>
                  <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                    <X className="w-4 h-4 mr-1" />
                    Limpiar
                  </Button>
                </div>
              </div>
              
              {/* Filtros avanzados */}
              <div className="flex flex-wrap gap-4 items-center">
                <Select value={filtroModulo} onValueChange={setFiltroModulo}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los módulos</SelectItem>
                    {MODULOS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtroAccion} onValueChange={setFiltroAccion}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Acción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas las acciones</SelectItem>
                    {ACCIONES.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-stone-500">Desde:</Label>
                  <Input
                    type="date"
                    value={filtroFechaDesde}
                    onChange={(e) => setFiltroFechaDesde(e.target.value)}
                    className="w-[150px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-stone-500">Hasta:</Label>
                  <Input
                    type="date"
                    value={filtroFechaHasta}
                    onChange={(e) => setFiltroFechaHasta(e.target.value)}
                    className="w-[150px]"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tabla principal */}
          <div className="lg:col-span-3">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Registro de Actividad
                </CardTitle>
                <CardDescription>
                  Mostrando {auditoria.length} de {pagination.total} registros
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center text-stone-400">
                    <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />
                    <p>Cargando...</p>
                  </div>
                ) : auditoria.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay registros con los filtros seleccionados</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha/Hora</TableHead>
                          <TableHead>Operador</TableHead>
                          <TableHead>Módulo</TableHead>
                          <TableHead>Acción</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditoria.map((item) => {
                          const accionInfo = getAccionInfo(item.accion)
                          return (
                            <TableRow key={item.id} className="hover:bg-stone-50 cursor-pointer" onClick={() => handleVerDetalle(item)}>
                              <TableCell className="text-sm">
                                <div>
                                  <div className="font-medium">
                                    {format(new Date(item.fecha), 'dd/MM/yy', { locale: es })}
                                  </div>
                                  <div className="text-stone-400 text-xs">
                                    {format(new Date(item.fecha), 'HH:mm:ss', { locale: es })}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-stone-400" />
                                  <div>
                                    <div className="font-medium">{item.operador?.nombre || 'Sistema'}</div>
                                    <div className="text-xs text-stone-400">{item.operador?.usuario || '-'}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {getModuloLabel(item.modulo)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${accionInfo.color} text-xs`}>
                                  {accionInfo.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xs">
                                <p className="text-sm truncate">{item.descripcion}</p>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              
              {/* Paginación */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-stone-500">
                    Página {pagination.page} de {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
          
          {/* Panel lateral de estadísticas */}
          <div className="space-y-4">
            {/* Por Acción */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Por Acción (7 días)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {estadisticas?.porAccion.slice(0, 6).map((item) => {
                    const accionInfo = getAccionInfo(item.accion)
                    return (
                      <div key={item.accion} className="flex items-center justify-between">
                        <Badge className={`${accionInfo.color} text-xs`}>
                          {accionInfo.label}
                        </Badge>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* Por Módulo */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Por Módulo (7 días)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {estadisticas?.porModulo.slice(0, 6).map((item) => (
                    <div key={item.modulo} className="flex items-center justify-between text-sm">
                      <span className="text-stone-600">{getModuloLabel(item.modulo)}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Top Operadores */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Top Operadores (7 días)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {estadisticas?.porOperador.slice(0, 5).map((item, index) => (
                    <div key={item.operadorId} className="flex items-center gap-2">
                      <span className="text-xs text-stone-400 w-4">{index + 1}.</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.nombre}</p>
                        <p className="text-xs text-stone-400">{item.usuario}</p>
                      </div>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog Detalle */}
        <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" maximizable>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Detalle de Operación
              </DialogTitle>
            </DialogHeader>
            {itemSeleccionado && (
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-6 py-4">
                  {/* Info general */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-stone-500 text-xs">Fecha y Hora</Label>
                      <p className="font-medium">
                        {format(new Date(itemSeleccionado.fecha), "dd/MM/yyyy 'a las' HH:mm:ss", { locale: es })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-stone-500 text-xs">Operador</Label>
                      <p className="font-medium">{itemSeleccionado.operador?.nombre || 'Sistema'}</p>
                      <p className="text-xs text-stone-400">{itemSeleccionado.operador?.usuario || '-'} • {itemSeleccionado.operador?.rol || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-stone-500 text-xs">Módulo</Label>
                      <p className="font-medium">{getModuloLabel(itemSeleccionado.modulo)}</p>
                      {itemSeleccionado.submodulo && (
                        <p className="text-xs text-stone-400">{itemSeleccionado.submodulo}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-stone-500 text-xs">Acción</Label>
                      <Badge className={getAccionInfo(itemSeleccionado.accion).color}>
                        {getAccionInfo(itemSeleccionado.accion).label}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-stone-500 text-xs">Entidad</Label>
                      <p className="font-medium">{itemSeleccionado.entidad}</p>
                      {itemSeleccionado.entidadNombre && (
                        <p className="text-xs text-stone-400">{itemSeleccionado.entidadNombre}</p>
                      )}
                    </div>
                    {itemSeleccionado.entidadId && (
                      <div>
                        <Label className="text-stone-500 text-xs">ID</Label>
                        <p className="font-mono text-xs">{itemSeleccionado.entidadId}</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Ubicación y dispositivo */}
                  <div>
                    <Label className="text-stone-500 text-xs mb-2 block">Información de Conexión</Label>
                    <div className="grid grid-cols-2 gap-4 bg-stone-50 p-3 rounded-lg">
                      <div>
                        <p className="text-xs text-stone-400">Dirección IP</p>
                        <p className="font-mono">{itemSeleccionado.ip || 'No registrada'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-400">Sesión</p>
                        <p className="font-mono text-xs">{itemSeleccionado.sessionId || '-'}</p>
                      </div>
                      {itemSeleccionado.userAgent && (
                        <>
                          <div>
                            <p className="text-xs text-stone-400">Navegador</p>
                            <p className="text-sm">{parseUserAgent(itemSeleccionado.userAgent).browser}</p>
                          </div>
                          <div>
                            <p className="text-xs text-stone-400">Sistema Operativo</p>
                            <p className="text-sm">{parseUserAgent(itemSeleccionado.userAgent).os}</p>
                          </div>
                          <div>
                            <p className="text-xs text-stone-400">Dispositivo</p>
                            <p className="text-sm">{parseUserAgent(itemSeleccionado.userAgent).device}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Descripción */}
                  <div>
                    <Label className="text-stone-500 text-xs mb-2 block">Descripción</Label>
                    <div className="bg-stone-50 p-3 rounded-lg">
                      {itemSeleccionado.descripcion}
                    </div>
                  </div>

                  {/* Datos anteriores */}
                  {itemSeleccionado.datosAntes && (
                    <div>
                      <Label className="text-red-600 text-xs mb-2 flex items-center gap-1">
                        <ArrowDownToLine className="w-3 h-3" />
                        Datos Anteriores
                      </Label>
                      <pre className="bg-red-50 border border-red-100 p-3 rounded-lg text-xs overflow-auto max-h-48">
                        {JSON.stringify(JSON.parse(itemSeleccionado.datosAntes), null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Datos nuevos */}
                  {itemSeleccionado.datosDespues && (
                    <div>
                      <Label className="text-green-600 text-xs mb-2 flex items-center gap-1">
                        <ArrowUpFromLine className="w-3 h-3" />
                        Datos Nuevos
                      </Label>
                      <pre className="bg-green-50 border border-green-100 p-3 rounded-lg text-xs overflow-auto max-h-48">
                        {JSON.stringify(JSON.parse(itemSeleccionado.datosDespues), null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Cambios */}
                  {itemSeleccionado.cambios && (
                    <div>
                      <Label className="text-amber-600 text-xs mb-2 flex items-center gap-1">
                        <Edit className="w-3 h-3" />
                        Campos Modificados
                      </Label>
                      <pre className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-xs overflow-auto max-h-48">
                        {JSON.stringify(JSON.parse(itemSeleccionado.cambios), null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetalleOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default AuditoriaViewer
