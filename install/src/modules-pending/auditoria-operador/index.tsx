'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  History, User, Calendar, Clock, Filter, Download, Search,
  Eye, FileText, AlertTriangle, CheckCircle, XCircle, Activity,
  ChevronLeft, ChevronRight, RefreshCw, TrendingUp, Users, BarChart3
} from 'lucide-react'

// ==================== TYPES ====================
interface AuditoriaItem {
  id: string
  operadorId: string | null
  operador?: {
    id: string
    nombre: string
    usuario: string
    rol: string
  }
  modulo: string
  accion: string
  entidad: string
  entidadId?: string
  descripcion: string
  datosAntes?: string
  datosDespues?: string
  fecha: string
  ip?: string
}

interface OperadorStats {
  operadorId: string
  operadorNombre: string
  totalAcciones: number
  creates: number
  updates: number
  deletes: number
  logins: number
  errores: number
  ultimoAcceso: string
}

interface ModuloStats {
  modulo: string
  cantidad: number
}

interface FiltrosAuditoria {
  operadorId?: string
  modulo?: string
  accion?: string
  fechaDesde?: string
  fechaHasta?: string
  busqueda?: string
}

interface Props {
  operador?: {
    id: string
    nombre: string
    rol: string
  }
}

// ==================== CONSTANTS ====================
const MODULOS = [
  { id: 'PESAJE_CAMIONES', nombre: 'Pesaje Camiones' },
  { id: 'PESAJE_INDIVIDUAL', nombre: 'Pesaje Individual' },
  { id: 'MOVIMIENTO_HACIENDA', nombre: 'Movimiento Hacienda' },
  { id: 'LISTA_FAENA', nombre: 'Lista de Faena' },
  { id: 'ROMANEO', nombre: 'Romaneo' },
  { id: 'MENUDENCIAS', nombre: 'Menudencias' },
  { id: 'CUEROS', nombre: 'Cueros' },
  { id: 'DESPACHOS', nombre: 'Despachos' },
  { id: 'FACTURACION', nombre: 'Facturación' },
  { id: 'CONFIGURACION', nombre: 'Configuración' },
  { id: 'AUTH', nombre: 'Autenticación' },
  { id: 'STOCK', nombre: 'Stock' },
  { id: 'REPORTES', nombre: 'Reportes' },
  { id: 'DESPOSTADA', nombre: 'Despostada' },
  { id: 'CUARTEO', nombre: 'Cuarteo' },
  { id: 'EMPAQUE', nombre: 'Empaque' },
  { id: 'CCIR', nombre: 'CCIR' },
  { id: 'OPERADORES', nombre: 'Operadores' },
  { id: 'CLIENTES', nombre: 'Clientes' },
  { id: 'PRODUCTOS', nombre: 'Productos' },
  { id: 'INSUMOS', nombre: 'Insumos' },
]

const ACCION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700 border-green-300',
  UPDATE: 'bg-blue-100 text-blue-700 border-blue-300',
  DELETE: 'bg-red-100 text-red-700 border-red-300',
  LOGIN: 'bg-purple-100 text-purple-700 border-purple-300',
  LOGOUT: 'bg-gray-100 text-gray-700 border-gray-300',
  ERROR: 'bg-red-100 text-red-700 border-red-300',
  VIEW: 'bg-stone-100 text-stone-700 border-stone-300',
}

const ACCION_ICONS: Record<string, typeof CheckCircle> = {
  CREATE: CheckCircle,
  UPDATE: TrendingUp,
  DELETE: XCircle,
  LOGIN: User,
  LOGOUT: User,
  ERROR: AlertTriangle,
  VIEW: Eye,
}

// ==================== HELPERS ====================
const formatearFecha = (fecha: string) => {
  return new Date(fecha).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatearFechaCorta = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const getModuloNombre = (id: string) => {
  return MODULOS.find(m => m.id === id)?.nombre || id
}

// ==================== COMPONENT ====================
export function AuditoriaOperadorModule({ operador }: Props) {
  const [auditorias, setAuditorias] = useState<AuditoriaItem[]>([])
  const [operadores, setOperadores] = useState<{ id: string; nombre: string }[]>([])
  const [stats, setStats] = useState<OperadorStats[]>([])
  const [statsModulo, setStatsModulo] = useState<ModuloStats[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState<FiltrosAuditoria>({})
  const [selectedAuditoria, setSelectedAuditoria] = useState<AuditoriaItem | null>(null)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [tabActivo, setTabActivo] = useState<'historial' | 'estadisticas' | 'modulos'>('historial')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtros.operadorId) params.append('operadorId', filtros.operadorId)
      if (filtros.modulo) params.append('modulo', filtros.modulo)
      if (filtros.accion) params.append('tipoAccion', filtros.accion)
      if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde)
      if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta)
      if (filtros.busqueda) params.append('busqueda', filtros.busqueda)
      params.append('pagina', pagina.toString())
      params.append('limite', '50')

      const res = await fetch(`/api/auditoria-operador?${params}`)
      const data = await res.json()
      if (data.success) {
        setAuditorias(data.data)
        setTotalPaginas(data.paginas || 1)
        setTotalRegistros(data.total || 0)
        if (data.stats) {
          setStats(data.stats.porOperador || [])
          setStatsModulo(data.stats.porModulo || [])
        }
      }
    } catch (error) {
      console.error('Error fetching auditorias:', error)
    } finally {
      setLoading(false)
    }
  }, [filtros, pagina])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchOperadores()
  }, [])

  const fetchOperadores = async () => {
    try {
      const res = await fetch('/api/operadores?simple=true')
      const data = await res.json()
      if (data.success) {
        setOperadores(data.data)
      }
    } catch (error) {
      console.error('Error fetching operadores:', error)
    }
  }

  const exportarCSV = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      params.append('exportar', 'csv')

      const res = await fetch(`/api/auditoria-operador?${params}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `auditoria_operador_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      toast.success('Auditoría exportada correctamente')
    } catch (error) {
      toast.error('Error al exportar')
    }
  }

  const limpiarFiltros = () => {
    setFiltros({})
    setPagina(1)
  }

  const tieneFiltrosActivos = Object.values(filtros).some(v => v && v !== '')

  // ==================== SUB-COMPONENTS ====================

  const VerDetalle = ({ auditoria }: { auditoria: AuditoriaItem }) => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Detalle de Auditoría
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setSelectedAuditoria(null)}>
            Volver al listado
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-stone-500">Operador</Label>
            <p className="font-medium">{auditoria.operador?.nombre || 'Sistema'}</p>
          </div>
          <div>
            <Label className="text-xs text-stone-500">Usuario</Label>
            <p className="font-medium">{auditoria.operador?.usuario || '-'}</p>
          </div>
          <div>
            <Label className="text-xs text-stone-500">Módulo</Label>
            <p className="font-medium">{getModuloNombre(auditoria.modulo)}</p>
          </div>
          <div>
            <Label className="text-xs text-stone-500">Acción</Label>
            <Badge className={ACCION_COLORS[auditoria.accion] || 'bg-stone-100 text-stone-700'}>
              {auditoria.accion}
            </Badge>
          </div>
          <div>
            <Label className="text-xs text-stone-500">Entidad</Label>
            <p className="font-medium">{auditoria.entidad}</p>
          </div>
          <div>
            <Label className="text-xs text-stone-500">ID Entidad</Label>
            <p className="font-mono text-sm">{auditoria.entidadId || '-'}</p>
          </div>
          <div>
            <Label className="text-xs text-stone-500">Fecha</Label>
            <p className="font-medium">{formatearFecha(auditoria.fecha)}</p>
          </div>
          <div>
            <Label className="text-xs text-stone-500">IP</Label>
            <p className="font-mono text-sm">{auditoria.ip || '-'}</p>
          </div>
        </div>

        <div>
          <Label className="text-xs text-stone-500">Descripción</Label>
          <p className="p-3 bg-stone-50 rounded-lg">{auditoria.descripcion}</p>
        </div>

        {auditoria.datosAntes && (
          <div>
            <Label className="text-xs text-stone-500">Datos Antes</Label>
            <pre className="p-3 bg-red-50 rounded-lg text-xs overflow-auto max-h-40 font-mono">
              {(() => { try { return JSON.stringify(JSON.parse(auditoria.datosAntes), null, 2) } catch { return auditoria.datosAntes } })()}
            </pre>
          </div>
        )}
        {auditoria.datosDespues && (
          <div>
            <Label className="text-xs text-stone-500">Datos Después</Label>
            <pre className="p-3 bg-green-50 rounded-lg text-xs overflow-auto max-h-40 font-mono">
              {(() => { try { return JSON.stringify(JSON.parse(auditoria.datosDespues), null, 2) } catch { return auditoria.datosDespues } })()}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )

  // Stats per operator
  const PanelEstadisticas = () => {
    const maxAcciones = Math.max(...stats.map(s => s.totalAcciones), 1)

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-stone-500">Total Acciones</p>
                  <p className="text-2xl font-bold">{stats.reduce((a, s) => a + s.totalAcciones, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-xs text-stone-500">Creaciones</p>
                  <p className="text-2xl font-bold">{stats.reduce((a, s) => a + s.creates, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-stone-500">Actualizaciones</p>
                  <p className="text-2xl font-bold">{stats.reduce((a, s) => a + s.updates, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-xs text-stone-500">Errores</p>
                  <p className="text-2xl font-bold">{stats.reduce((a, s) => a + s.errores, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Actividad por Operador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.sort((a, b) => b.totalAcciones - a.totalAcciones).map((stat, idx) => (
                <div key={stat.operadorId} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-stone-50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{stat.operadorNombre}</p>
                    <div className="mt-1 w-full bg-stone-100 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all"
                        style={{ width: `${(stat.totalAcciones / maxAcciones) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Badge className="bg-green-100 text-green-700 text-xs px-1.5">
                      <CheckCircle className="w-3 h-3 mr-0.5" />{stat.creates}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-700 text-xs px-1.5">
                      <TrendingUp className="w-3 h-3 mr-0.5" />{stat.updates}
                    </Badge>
                    <Badge className="bg-red-100 text-red-700 text-xs px-1.5">
                      <XCircle className="w-3 h-3 mr-0.5" />{stat.deletes}
                    </Badge>
                  </div>
                  <div className="text-right flex-shrink-0 w-16">
                    <p className="text-lg font-bold text-amber-600">{stat.totalAcciones}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Stats per module (simple bar chart)
  const PanelModulos = () => {
    const maxCantidad = Math.max(...statsModulo.map(s => s.cantidad), 1)
    const topModulos = [...statsModulo].sort((a, b) => b.cantidad - a.cantidad).slice(0, 15)

    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Acciones por Módulo
          </CardTitle>
          <CardDescription>Top 15 módulos con más actividad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topModulos.map((stat, idx) => (
              <div key={stat.modulo} className="flex items-center gap-3">
                <div className="w-44 text-sm text-stone-600 truncate font-medium">
                  {getModuloNombre(stat.modulo)}
                </div>
                <div className="flex-1">
                  <div className="w-full bg-stone-100 rounded-full h-6 relative">
                    <div
                      className={`h-6 rounded-full transition-all flex items-center justify-end pr-2 ${
                        idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-amber-400' : idx === 2 ? 'bg-amber-300' : 'bg-stone-300'
                      }`}
                      style={{ width: `${Math.max((stat.cantidad / maxCantidad) * 100, 15)}%` }}
                    >
                      <span className="text-xs font-bold text-white">{stat.cantidad}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Main table
  const TablaAuditoria = () => (
    <Card className="border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historial de Auditoría
          </CardTitle>
          <p className="text-sm text-stone-500 mt-1">
            {totalRegistros} registros encontrados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportarCSV}>
            <Download className="w-4 h-4 mr-1" /> Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <Select
            value={filtros.operadorId || 'all'}
            onValueChange={(v) => setFiltros(prev => ({ ...prev, operadorId: v === 'all' ? undefined : v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Operador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {operadores.map(op => (
                <SelectItem key={op.id} value={op.id}>{op.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filtros.modulo || 'all'}
            onValueChange={(v) => setFiltros(prev => ({ ...prev, modulo: v === 'all' ? undefined : v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {MODULOS.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filtros.accion || 'all'}
            onValueChange={(v) => setFiltros(prev => ({ ...prev, accion: v === 'all' ? undefined : v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Acción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="CREATE">Crear</SelectItem>
              <SelectItem value="UPDATE">Actualizar</SelectItem>
              <SelectItem value="DELETE">Eliminar</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
              <SelectItem value="LOGOUT">Logout</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={filtros.fechaDesde || ''}
            onChange={(e) => setFiltros(prev => ({ ...prev, fechaDesde: e.target.value }))}
            placeholder="Desde"
          />

          <Input
            type="date"
            value={filtros.fechaHasta || ''}
            onChange={(e) => setFiltros(prev => ({ ...prev, fechaHasta: e.target.value }))}
            placeholder="Hasta"
          />
        </div>

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              className="pl-10"
              placeholder="Buscar en descripción, entidad, operador..."
              value={filtros.busqueda || ''}
              onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
            />
          </div>
          {tieneFiltrosActivos && (
            <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
              <Filter className="w-4 h-4 mr-1" /> Limpiar
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-stone-50">
                <TableHead className="w-[180px]">Fecha/Hora</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead className="w-[100px]">Acción</TableHead>
                <TableHead>Detalle</TableHead>
                <TableHead className="w-[120px]">IP</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditorias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-stone-400">
                    <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No hay registros de auditoría con los filtros seleccionados</p>
                  </TableCell>
                </TableRow>
              ) : (
                auditorias.map(item => {
                  const Icon = ACCION_ICONS[item.accion] || Activity
                  return (
                    <TableRow
                      key={item.id}
                      className="hover:bg-stone-50 cursor-pointer"
                      onClick={() => setSelectedAuditoria(item)}
                    >
                      <TableCell className="text-sm text-stone-600">
                        {formatearFecha(item.fecha)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-stone-400" />
                          <span className="font-medium">{item.operador?.nombre || 'Sistema'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getModuloNombre(item.modulo)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={ACCION_COLORS[item.accion] || 'bg-stone-100 text-stone-700'}>
                          <Icon className="w-3 h-3 mr-1" />
                          {item.accion}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-stone-600 max-w-[300px] truncate">
                        {item.descripcion}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-stone-400">
                        {item.ip || '-'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedAuditoria(item) }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-stone-500">
              Página {pagina} de {totalPaginas} ({totalRegistros} registros)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagina <= 1}
                onClick={() => setPagina(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: Math.min(totalPaginas, 7) }, (_, i) => {
                let pageNum: number
                if (totalPaginas <= 7) {
                  pageNum = i + 1
                } else if (pagina <= 4) {
                  pageNum = i + 1
                } else if (pagina >= totalPaginas - 3) {
                  pageNum = totalPaginas - 6 + i
                } else {
                  pageNum = pagina - 3 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pagina === pageNum ? 'default' : 'outline'}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setPagina(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina(p => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">
              Auditoría por Operador
            </h1>
            <p className="text-stone-500 mt-1">
              Registro detallado de todas las acciones del sistema
            </p>
          </div>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-1" /> Actualizar
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={tabActivo} onValueChange={(v) => setTabActivo(v as 'historial' | 'estadisticas' | 'modulos')}>
          <TabsList className="mb-6">
            <TabsTrigger value="historial" className="flex items-center gap-2">
              <History className="w-4 h-4" /> Historial
            </TabsTrigger>
            <TabsTrigger value="estadisticas" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Por Operador
            </TabsTrigger>
            <TabsTrigger value="modulos" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Por Módulo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="historial">
            {selectedAuditoria ? (
              <VerDetalle auditoria={selectedAuditoria} />
            ) : (
              <TablaAuditoria />
            )}
          </TabsContent>

          <TabsContent value="estadisticas">
            <PanelEstadisticas />
          </TabsContent>

          <TabsContent value="modulos">
            <PanelModulos />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default AuditoriaOperadorModule
