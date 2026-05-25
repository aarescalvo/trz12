'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  FileText, Loader2, RefreshCw, CheckCircle, XCircle, Clock,
  Eye, CheckSquare
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface RomaneoPendiente {
  id: string
  tropaCodigo: string
  fecha: string
  cantidadAnimales: number
  pesoTotal: number
  estado: 'PENDIENTE' | 'VERIFICADO' | 'OBSERVADO'
  operador: string
  observaciones?: string
}

interface Props {
  operador: Operador
}

export function VBRomaneoModule({ operador }: Props) {
  const [romaneos, setRomaneos] = useState<RomaneoPendiente[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'TODOS' | 'PENDIENTE' | 'VERIFICADO'>('PENDIENTE')

  useEffect(() => {
    fetchRomaneos()
  }, [filtro])

  const fetchRomaneos = async () => {
    setLoading(true)
    try {
      // Simulated data - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))
      setRomaneos([
        {
          id: '1',
          tropaCodigo: 'B 2026 0008',
          fecha: new Date().toISOString(),
          cantidadAnimales: 8,
          pesoTotal: 4240,
          estado: 'PENDIENTE',
          operador: 'Juan Pérez'
        },
        {
          id: '2',
          tropaCodigo: 'B 2026 0007',
          fecha: new Date(Date.now() - 86400000).toISOString(),
          cantidadAnimales: 12,
          pesoTotal: 6120,
          estado: 'VERIFICADO',
          operador: 'María García',
          observaciones: 'Todo correcto'
        },
        {
          id: '3',
          tropaCodigo: 'B 2026 0006',
          fecha: new Date(Date.now() - 172800000).toISOString(),
          cantidadAnimales: 5,
          pesoTotal: 2519,
          estado: 'OBSERVADO',
          operador: 'Carlos López',
          observaciones: 'Revisar peso animal #3'
        }
      ])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar romaneos')
    } finally {
      setLoading(false)
    }
  }

  const handleVerificar = async (id: string, aprobar: boolean) => {
    try {
      // Simulated update - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setRomaneos(romaneos.map(r => 
        r.id === id 
          ? { ...r, estado: aprobar ? 'VERIFICADO' : 'OBSERVADO' } 
          : r
      ))
      
      toast.success(aprobar ? 'Romaneo verificado correctamente' : 'Romaneo marcado con observaciones')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar romaneo')
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge className="bg-amber-100 text-amber-700">Pendiente</Badge>
      case 'VERIFICADO':
        return <Badge className="bg-emerald-100 text-emerald-700">Verificado</Badge>
      case 'OBSERVADO':
        return <Badge className="bg-red-100 text-red-700">Observado</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const romaneosFiltrados = romaneos.filter(r => 
    filtro === 'TODOS' || r.estado === filtro
  )

  const pendientes = romaneos.filter(r => r.estado === 'PENDIENTE').length
  const verificados = romaneos.filter(r => r.estado === 'VERIFICADO').length
  const observados = romaneos.filter(r => r.estado === 'OBSERVADO').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <FileText className="w-8 h-8 text-amber-500" />
              VB Romaneo
            </h1>
            <p className="text-stone-500 mt-1">Verificación de Romaneos</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchRomaneos} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('TODOS')}>
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Total</p>
              <p className="text-3xl font-bold text-stone-800">{romaneos.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('PENDIENTE')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <p className="text-xs text-stone-500 uppercase">Pendientes</p>
              </div>
              <p className="text-3xl font-bold text-amber-600">{pendientes}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('VERIFICADO')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <p className="text-xs text-stone-500 uppercase">Verificados</p>
              </div>
              <p className="text-3xl font-bold text-emerald-600">{verificados}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <p className="text-xs text-stone-500 uppercase">Observados</p>
              </div>
              <p className="text-3xl font-bold text-red-600">{observados}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-stone-600">Filtrar:</span>
              <div className="flex gap-2">
                {(['PENDIENTE', 'VERIFICADO', 'TODOS'] as const).map((f) => (
                  <Button
                    key={f}
                    variant={filtro === f ? 'default' : 'outline'}
                    size="sm"
                    className={filtro === f ? 'bg-amber-500 hover:bg-amber-600' : ''}
                    onClick={() => setFiltro(f)}
                  >
                    {f === 'TODOS' ? 'Todos' : f === 'PENDIENTE' ? 'Pendientes' : 'Verificados'}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de romaneos */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-500" />
              Romaneos Pendientes de Verificación
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : romaneosFiltrados.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No hay romaneos {filtro.toLowerCase()}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tropa</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Animales</TableHead>
                    <TableHead>Peso Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {romaneosFiltrados.map((romaneo) => (
                    <TableRow key={romaneo.id}>
                      <TableCell className="font-mono font-medium">{romaneo.tropaCodigo}</TableCell>
                      <TableCell>
                        {new Date(romaneo.fecha).toLocaleDateString('es-AR')}
                      </TableCell>
                      <TableCell>{romaneo.cantidadAnimales}</TableCell>
                      <TableCell>{romaneo.pesoTotal.toLocaleString()} kg</TableCell>
                      <TableCell>{getEstadoBadge(romaneo.estado)}</TableCell>
                      <TableCell>{romaneo.operador}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {romaneo.estado === 'PENDIENTE' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-emerald-500 hover:bg-emerald-600"
                                onClick={() => handleVerificar(romaneo.id, true)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleVerificar(romaneo.id, false)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toast.info('Ver detalle - En desarrollo')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default VBRomaneoModule
