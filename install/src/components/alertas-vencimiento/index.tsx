'use client'

import { useState, useEffect } from 'react'
import { 
  AlertTriangle, Clock, XCircle, AlertCircle, Package, 
  RefreshCw, Filter, Calendar, TrendingDown, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

interface MediaResVencimiento {
  id: string
  codigo: string
  peso: number
  lado: string
  sigla: string
  estado: string
  diasVencimiento: number
  fechaVencimiento: string | null
  diasRestantes: number | null
  estadoVencimiento: 'VENCIDO' | 'PROXIMO' | 'OK' | 'SIN_FECHA'
  createdAt: string
  romaneo?: {
    garron: number
    tropaCodigo?: string
    tipificador?: {
      nombre: string
      apellido: string
    }
  }
  camara?: {
    nombre: string
  } | null
  usuarioFaena?: {
    nombre: string
  } | null
}

interface Stats {
  total: number
  vencidos: number
  proximos: number
  sinFecha: number
  pesoTotalVencidos: number
  pesoTotalProximos: number
}

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Props {
  operador: Operador
}

export function AlertasVencimientoModule({ operador }: Props) {
  const [mediasRes, setMediasRes] = useState<MediaResVencimiento[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'vencidos' | 'proximos'>('todos')
  const [diasAlerta, setDiasAlerta] = useState(7)

  useEffect(() => {
    fetchVencimientos()
  }, [diasAlerta, filtro])

  const fetchVencimientos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('diasAlerta', diasAlerta.toString())
      if (filtro !== 'todos') {
        params.append('estado', filtro)
      }

      const res = await fetch(`/api/vencimientos?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setMediasRes(data.data)
        setStats(data.stats)
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar vencimientos')
    } finally {
      setLoading(false)
    }
  }

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatPeso = (peso: number) => {
    return `${peso.toFixed(1)} kg`
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'VENCIDO':
        return <Badge className="bg-red-500 text-white">VENCIDO</Badge>
      case 'PROXIMO':
        return <Badge className="bg-amber-500 text-white">PRÓXIMO</Badge>
      case 'SIN_FECHA':
        return <Badge variant="outline">SIN FECHA</Badge>
      default:
        return <Badge variant="outline">OK</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              Control de Vencimientos
            </h1>
            <p className="text-stone-500">Monitoreo de medias reses por vencer y vencidas</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchVencimientos}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-stone-500" />
                <span className="text-sm font-medium">Días de alerta:</span>
                <Select 
                  value={diasAlerta.toString()} 
                  onValueChange={(v) => setDiasAlerta(parseInt(v))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 días</SelectItem>
                    <SelectItem value="5">5 días</SelectItem>
                    <SelectItem value="7">7 días</SelectItem>
                    <SelectItem value="10">10 días</SelectItem>
                    <SelectItem value="14">14 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-stone-500" />
                <span className="text-sm font-medium">Filtro:</span>
                <Select value={filtro} onValueChange={(v: any) => setFiltro(v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="vencidos">Vencidos</SelectItem>
                    <SelectItem value="proximos">Próximos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className={`border-0 shadow-md ${stats.vencidos > 0 ? 'ring-2 ring-red-500' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Vencidos</p>
                    <p className="text-2xl font-bold text-red-600">{stats.vencidos}</p>
                    <p className="text-xs text-stone-400">{formatPeso(stats.pesoTotalVencidos)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-0 shadow-md ${stats.proximos > 0 ? 'ring-2 ring-amber-500' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Próximos a Vencer</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.proximos}</p>
                    <p className="text-xs text-stone-400">{formatPeso(stats.pesoTotalProximos)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Total en Alerta</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-stone-100 p-2 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-stone-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Sin Fecha</p>
                    <p className="text-2xl font-bold">{stats.sinFecha}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabla */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Medias Reses ({mediasRes.length})
            </CardTitle>
            <CardDescription>
              {filtro === 'todos' 
                ? `Mostrando vencidos y próximos a vencer (dentro de ${diasAlerta} días)`
                : filtro === 'vencidos'
                  ? 'Solo medias reses vencidas'
                  : `Solo medias reses que vencen en ${diasAlerta} días`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                <p className="mt-2 text-stone-500">Cargando vencimientos...</p>
              </div>
            ) : mediasRes.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay medias reses en esta categoría</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50/50">
                      <TableHead>Estado</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Tropa / Garrón</TableHead>
                      <TableHead>Lado</TableHead>
                      <TableHead className="text-right">Peso</TableHead>
                      <TableHead>Cámara</TableHead>
                      <TableHead>Dueño</TableHead>
                      <TableHead>F. Faena</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead className="text-center">Días</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mediasRes.map((mr) => (
                      <TableRow 
                        key={mr.id} 
                        className={
                          mr.estadoVencimiento === 'VENCIDO' 
                            ? 'bg-red-50' 
                            : mr.estadoVencimiento === 'PROXIMO' 
                              ? 'bg-amber-50' 
                              : ''
                        }
                      >
                        <TableCell>{getEstadoBadge(mr.estadoVencimiento)}</TableCell>
                        <TableCell className="font-mono text-sm">{mr.codigo}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="font-medium">{mr.romaneo?.tropaCodigo || '-'}</span>
                            <span className="text-stone-400 ml-1">#{mr.romaneo?.garron || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {mr.lado === 'IZQUIERDA' ? 'IZQ' : 'DER'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatPeso(mr.peso)}
                        </TableCell>
                        <TableCell>{mr.camara?.nombre || '-'}</TableCell>
                        <TableCell>{mr.usuarioFaena?.nombre || '-'}</TableCell>
                        <TableCell>{formatFecha(mr.createdAt)}</TableCell>
                        <TableCell>
                          <span className={
                            mr.estadoVencimiento === 'VENCIDO' 
                              ? 'text-red-600 font-semibold' 
                              : mr.estadoVencimiento === 'PROXIMO' 
                                ? 'text-amber-600 font-semibold' 
                                : ''
                          }>
                            {formatFecha(mr.fechaVencimiento)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {mr.diasRestantes !== null ? (
                            <span className={`font-bold ${
                              mr.diasRestantes < 0 
                                ? 'text-red-600' 
                                : mr.diasRestantes <= 3 
                                  ? 'text-amber-600' 
                                  : 'text-stone-600'
                            }`}>
                              {mr.diasRestantes < 0 
                                ? mr.diasRestantes 
                                : `+${mr.diasRestantes}`
                              }
                            </span>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
