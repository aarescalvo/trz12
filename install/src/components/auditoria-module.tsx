'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, Search, Filter, Download, Eye, User, Clock, 
  Calendar, ArrowDownToLine, ArrowUpFromLine, Edit, Trash2, 
  LogIn, LogOut, Plus, Save
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
import { toast } from 'sonner'

interface AuditoriaItem {
  id: string
  operadorId: string
  operador: { nombre: string; nivel: string }
  modulo: string
  accion: string
  entidad: string
  entidadId: string | null
  descripcion: string
  datosAntes: string | null
  datosDespues: string | null
  fecha: string
  ip: string | null
}

const MODULOS = [
  { id: 'AUTH', label: 'Autenticación' },
  { id: 'PESAJE_CAMION', label: 'Pesaje Camión' },
  { id: 'PESAJE_INDIVIDUAL', label: 'Pesaje Individual' },
  { id: 'MOVIMIENTO_HACIENDA', label: 'Movimiento de Hacienda' },
  { id: 'TROPAS', label: 'Tropas' },
  { id: 'OPERADORES', label: 'Operadores' },
]

const ACCIONES = [
  { id: 'LOGIN', label: 'Login', icon: LogIn, color: 'text-blue-600' },
  { id: 'LOGOUT', label: 'Logout', icon: LogOut, color: 'text-gray-600' },
  { id: 'CREATE', label: 'Crear', icon: Plus, color: 'text-green-600' },
  { id: 'UPDATE', label: 'Actualizar', icon: Save, color: 'text-amber-600' },
  { id: 'DELETE', label: 'Eliminar', icon: Trash2, color: 'text-red-600' },
]

export function AuditoriaModule() {
  const [auditoria, setAuditoria] = useState<AuditoriaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroModulo, setFiltroModulo] = useState('todos')
  const [filtroAccion, setFiltroAccion] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [itemSeleccionado, setItemSeleccionado] = useState<AuditoriaItem | null>(null)

  useEffect(() => {
    fetchAuditoria()
  }, [])

  const fetchAuditoria = async () => {
    try {
      const res = await fetch('/api/auditoria')
      const data = await res.json()
      if (data.success) {
        setAuditoria(data.data)
      }
    } catch (error) {
      console.error('Error fetching auditoria:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerDetalle = (item: AuditoriaItem) => {
    setItemSeleccionado(item)
    setDetalleOpen(true)
  }

  const exportarCSV = () => {
    const headers = ['Fecha', 'Hora', 'Operador', 'Módulo', 'Acción', 'Entidad', 'Descripción']
    const rows = auditoriaFiltrada.map(item => [
      new Date(item.fecha).toLocaleDateString('es-AR'),
      new Date(item.fecha).toLocaleTimeString('es-AR'),
      item.operador.nombre,
      item.modulo,
      item.accion,
      item.entidad,
      item.descripcion
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exportado')
  }

  // Filtrar auditoría
  const auditoriaFiltrada = auditoria.filter(item => {
    if (filtroModulo !== 'todos' && item.modulo !== filtroModulo) return false
    if (filtroAccion !== 'todos' && item.accion !== filtroAccion) return false
    if (busqueda) {
      const search = busqueda.toLowerCase()
      return (
        item.operador.nombre.toLowerCase().includes(search) ||
        item.descripcion.toLowerCase().includes(search) ||
        item.entidad.toLowerCase().includes(search)
      )
    }
    return true
  })

  const getAccionIcon = (accion: string) => {
    const acc = ACCIONES.find(a => a.id === accion)
    return acc?.icon || FileText
  }

  const getAccionColor = (accion: string) => {
    const acc = ACCIONES.find(a => a.id === accion)
    return acc?.color || 'text-gray-600'
  }

  const getModuloLabel = (modulo: string) => {
    const mod = MODULOS.find(m => m.id === modulo)
    return mod?.label || modulo
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-stone-800">Auditoría del Sistema</h2>
            <p className="text-stone-500">Registro de todas las operaciones</p>
          </div>
          <Button variant="outline" onClick={exportarCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    placeholder="Buscar por operador, descripción..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filtroModulo} onValueChange={setFiltroModulo}>
                <SelectTrigger className="w-[200px]">
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
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Acción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las acciones</SelectItem>
                  {ACCIONES.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {ACCIONES.map((accion) => {
            const count = auditoria.filter(a => a.accion === accion.id).length
            const Icon = accion.icon
            return (
              <Card key={accion.id} className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${accion.color}`} />
                    <div>
                      <p className="text-xs text-stone-500">{accion.label}</p>
                      <p className="text-xl font-bold">{count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Tabla */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Registro de Actividad
            </CardTitle>
            <CardDescription>
              Mostrando {auditoriaFiltrada.length} de {auditoria.length} registros
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-stone-400">
                Cargando...
              </div>
            ) : auditoriaFiltrada.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay registros</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditoriaFiltrada.slice(0, 50).map((item) => {
                    const Icon = getAccionIcon(item.accion)
                    return (
                      <TableRow key={item.id} className="hover:bg-stone-50">
                        <TableCell className="text-sm">
                          <div>
                            <div>{new Date(item.fecha).toLocaleDateString('es-AR')}</div>
                            <div className="text-stone-400 text-xs">
                              {new Date(item.fecha).toLocaleTimeString('es-AR')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-stone-400" />
                            <div>
                              <div className="font-medium">{item.operador.nombre}</div>
                              <div className="text-xs text-stone-400">{item.operador.nivel}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getModuloLabel(item.modulo)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${getAccionColor(item.accion)}`} />
                            <span className="text-sm">{item.accion}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm">
                          {item.descripcion}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleVerDetalle(item)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog Detalle */}
        <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalle de Operación</DialogTitle>
            </DialogHeader>
            {itemSeleccionado && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-stone-500">Fecha:</span>
                    <p className="font-medium">
                      {new Date(itemSeleccionado.fecha).toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div>
                    <span className="text-stone-500">Operador:</span>
                    <p className="font-medium">{itemSeleccionado.operador.nombre}</p>
                  </div>
                  <div>
                    <span className="text-stone-500">Módulo:</span>
                    <p className="font-medium">{getModuloLabel(itemSeleccionado.modulo)}</p>
                  </div>
                  <div>
                    <span className="text-stone-500">Acción:</span>
                    <p className="font-medium">{itemSeleccionado.accion}</p>
                  </div>
                  <div>
                    <span className="text-stone-500">Entidad:</span>
                    <p className="font-medium">{itemSeleccionado.entidad}</p>
                  </div>
                  {itemSeleccionado.entidadId && (
                    <div>
                      <span className="text-stone-500">ID:</span>
                      <p className="font-mono text-xs">{itemSeleccionado.entidadId}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <span className="text-stone-500 text-sm">Descripción:</span>
                  <p className="bg-stone-50 p-3 rounded-lg mt-1">{itemSeleccionado.descripcion}</p>
                </div>

                {itemSeleccionado.datosAntes && (
                  <div>
                    <span className="text-stone-500 text-sm">Datos anteriores:</span>
                    <pre className="bg-red-50 p-3 rounded-lg mt-1 text-xs overflow-auto">
                      {JSON.stringify(JSON.parse(itemSeleccionado.datosAntes), null, 2)}
                    </pre>
                  </div>
                )}

                {itemSeleccionado.datosDespues && (
                  <div>
                    <span className="text-stone-500 text-sm">Datos nuevos:</span>
                    <pre className="bg-green-50 p-3 rounded-lg mt-1 text-xs overflow-auto">
                      {JSON.stringify(JSON.parse(itemSeleccionado.datosDespues), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
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

export default AuditoriaModule
