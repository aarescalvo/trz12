'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Activity, 
  User, 
  Clock, 
  Filter, 
  RefreshCw,
  Eye,
  Calendar,
  Monitor,
  LogIn,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Printer,
  FileText,
  Package
} from 'lucide-react'

interface Actividad {
  id: string
  operadorId: string
  tipo: string
  modulo: string
  descripcion: string
  entidad?: string | null
  entidadId?: string | null
  datos?: string | null
  ip?: string | null
  fecha: string
  operador: {
    id: string
    nombre: string
    usuario: string
    rol: string
  }
}

interface Estadisticas {
  porOperador: Array<{
    operador: {
      id: string
      nombre: string
      usuario: string
      rol: string
    }
    totalActividades: number
  }>
  porModulo: Array<{
    modulo: string
    total: number
  }>
  porTipo: Array<{
    tipo: string
    total: number
  }>
}

const TIPOS_ACTIVIDAD: Record<string, { label: string; icon: typeof Activity; color: string }> = {
  'LOGIN': { label: 'Inicio Sesión', icon: LogIn, color: 'bg-green-100 text-green-700' },
  'LOGOUT': { label: 'Cierre Sesión', icon: LogOut, color: 'bg-gray-100 text-gray-700' },
  'CREAR': { label: 'Crear', icon: Plus, color: 'bg-blue-100 text-blue-700' },
  'MODIFICAR': { label: 'Modificar', icon: Edit, color: 'bg-yellow-100 text-yellow-700' },
  'ELIMINAR': { label: 'Eliminar', icon: Trash2, color: 'bg-red-100 text-red-700' },
  'VER': { label: 'Ver', icon: Eye, color: 'bg-slate-100 text-slate-700' },
  'IMPRIMIR': { label: 'Imprimir', icon: Printer, color: 'bg-purple-100 text-purple-700' },
  'DESPACHAR': { label: 'Despachar', icon: Package, color: 'bg-orange-100 text-orange-700' },
  'FACTURAR': { label: 'Facturar', icon: FileText, color: 'bg-indigo-100 text-indigo-700' },
  'ANULAR': { label: 'Anular', icon: Trash2, color: 'bg-red-200 text-red-800' },
}

const MODULOS_NOMBRES: Record<string, string> = {
  'auth': 'Autenticación',
  'dashboard': 'Dashboard',
  'pesajeCamiones': 'Pesaje Camiones',
  'pesajeIndividual': 'Pesaje Individual',
  'movimientoHacienda': 'Movimiento Hacienda',
  'listaFaena': 'Lista Faena',
  'romaneo': 'Romaneo',
  'despachos': 'Despachos',
  'facturacion': 'Facturación',
  'stock': 'Stock',
  'configuracion': 'Configuración',
  'configOperadores': 'Config. Operadores',
  'configRotulos': 'Config. Rótulos',
}

interface Props {
  operadorId?: string // Si se pasa, muestra solo actividades de ese operador
}

export function HistorialActividadModule({ operadorId }: Props) {
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtroModulo, setFiltroModulo] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [operadorSeleccionado, setOperadorSeleccionado] = useState<string | null>(operadorId || null)

  const cargarActividades = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (operadorSeleccionado) {
        params.set('operadorId', operadorSeleccionado)
      }
      if (filtroModulo) {
        params.set('modulo', filtroModulo)
      }
      if (filtroTipo) {
        params.set('tipo', filtroTipo)
      }
      if (fechaDesde) {
        params.set('fechaDesde', fechaDesde)
      }
      if (fechaHasta) {
        params.set('fechaHasta', fechaHasta)
      }
      params.set('limite', '200')

      const res = await fetch(`/api/actividad-operador?${params}`)
      const result = await res.json()
      
      if (result.success) {
        setActividades(result.data)
        setEstadisticas(result.estadisticas)
      }
    } catch (error) {
      console.error('Error al cargar actividades:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarActividades()
  }, [operadorSeleccionado, filtroModulo, filtroTipo, fechaDesde, fechaHasta])

  const formatFecha = (fecha: string) => {
    const f = new Date(fecha)
    return f.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTipoInfo = (tipo: string) => {
    return TIPOS_ACTIVIDAD[tipo] || { label: tipo, icon: Activity, color: 'bg-gray-100 text-gray-700' }
  }

  const limpiarFiltros = () => {
    setFiltroModulo('')
    setFiltroTipo('')
    setFechaDesde('')
    setFechaHasta('')
    if (!operadorId) {
      setOperadorSeleccionado(null)
    }
  }

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Historial de Actividad</h2>
          <p className="text-muted-foreground">Registro de movimientos por operador</p>
        </div>
        <Button variant="outline" size="sm" onClick={cargarActividades}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      {estadisticas && !operadorId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top operadores */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Top Operadores
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {estadisticas.porOperador.slice(0, 5).map((op, i) => (
                  <div 
                    key={op.operador?.id || i} 
                    className="flex items-center justify-between p-2 hover:bg-muted/50 cursor-pointer"
                    onClick={() => setOperadorSeleccionado(op.operador?.id || null)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium">{op.operador?.nombre}</p>
                        <p className="text-xs text-muted-foreground">{op.operador?.rol}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{op.totalActividades}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Por módulo */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Por Módulo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {estadisticas.porModulo.slice(0, 5).map((m, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-2 hover:bg-muted/50 cursor-pointer"
                    onClick={() => setFiltroModulo(m.modulo)}
                  >
                    <span className="text-sm">{MODULOS_NOMBRES[m.modulo] || m.modulo}</span>
                    <Badge variant="outline">{m.total}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Por tipo */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {estadisticas.porTipo.slice(0, 5).map((t, i) => {
                  const info = getTipoInfo(t.tipo)
                  return (
                    <div 
                      key={i} 
                      className="flex items-center justify-between p-2 hover:bg-muted/50 cursor-pointer"
                      onClick={() => setFiltroTipo(t.tipo)}
                    >
                      <span className="text-sm">{info.label}</span>
                      <Badge variant="outline">{t.total}</Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            
            {!operadorId && (
              <select
                value={operadorSeleccionado || ''}
                onChange={(e) => setOperadorSeleccionado(e.target.value || null)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">Todos los operadores</option>
                {estadisticas?.porOperador.map(op => (
                  <option key={op.operador?.id} value={op.operador?.id}>
                    {op.operador?.nombre}
                  </option>
                ))}
              </select>
            )}

            <select
              value={filtroModulo}
              onChange={(e) => setFiltroModulo(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">Todos los módulos</option>
              {estadisticas?.porModulo.map(m => (
                <option key={m.modulo} value={m.modulo}>
                  {MODULOS_NOMBRES[m.modulo] || m.modulo}
                </option>
              ))}
            </select>

            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">Todos los tipos</option>
              {Object.entries(TIPOS_ACTIVIDAD).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-32 h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">a</span>
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-32 h-8 text-xs"
              />
            </div>

            <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de actividades */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-auto h-full max-h-[calc(100vh-450px)]">
              <table className="w-full">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Fecha/Hora</th>
                    <th className="text-left p-3 font-medium">Operador</th>
                    <th className="text-left p-3 font-medium">Tipo</th>
                    <th className="text-left p-3 font-medium">Módulo</th>
                    <th className="text-left p-3 font-medium">Descripción</th>
                    <th className="text-left p-3 font-medium">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {actividades.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No hay actividades registradas</p>
                      </td>
                    </tr>
                  ) : (
                    actividades.map((act) => {
                      const tipoInfo = getTipoInfo(act.tipo)
                      const TipoIcon = tipoInfo.icon
                      
                      return (
                        <tr key={act.id} className="border-t hover:bg-muted/50">
                          <td className="p-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {formatFecha(act.fecha)}
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="font-medium text-sm">{act.operador?.nombre}</p>
                              <p className="text-xs text-muted-foreground">{act.operador?.rol}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={`${tipoInfo.color} border text-xs`}>
                              <TipoIcon className="h-3 w-3 mr-1" />
                              {tipoInfo.label}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">
                            {MODULOS_NOMBRES[act.modulo] || act.modulo}
                          </td>
                          <td className="p-3">
                            <p className="text-sm">{act.descripcion}</p>
                            {act.entidad && (
                              <p className="text-xs text-muted-foreground">
                                {act.entidad} {act.entidadId && `(${act.entidadId.slice(0, 8)}...)`}
                              </p>
                            )}
                          </td>
                          <td className="p-3 text-xs text-muted-foreground font-mono">
                            {act.ip || '-'}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer con total */}
      <div className="text-sm text-muted-foreground text-center">
        Total: {actividades.length} actividades
      </div>
    </div>
  )
}
