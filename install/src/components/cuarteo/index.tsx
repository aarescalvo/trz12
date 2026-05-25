'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  Scissors, Loader2, RefreshCw, Plus, Package, CheckCircle
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Cuarteo {
  id: string
  fecha: string
  tropaCodigo: string
  animalCodigo: string
  cuartos: string[]
  pesoTotal: number
  camaraDestino: string
  estado: 'EN_PROCESO' | 'COMPLETADO'
  operador: string
}

interface Props {
  operador: Operador
}

export function CuarteoModule({ operador }: Props) {
  const [cuarteos, setCuarteos] = useState<Cuarteo[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'TODOS' | 'EN_PROCESO' | 'COMPLETADO'>('EN_PROCESO')
  
  // Form state
  const [tropaCodigo, setTropaCodigo] = useState('')
  const [animalCodigo, setAnimalCodigo] = useState('')
  const [camaraDestino, setCamaraDestino] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCuarteos()
  }, [])

  const fetchCuarteos = async () => {
    setLoading(true)
    try {
      // Simulated data - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))
      setCuarteos([
        {
          id: '1',
          fecha: new Date().toISOString(),
          tropaCodigo: 'B 2026 0008',
          animalCodigo: 'B20260008-001',
          cuartos: ['Cuarto Delantero Izq', 'Cuarto Delantero Der', 'Cuarto Trasero Izq', 'Cuarto Trasero Der'],
          pesoTotal: 245,
          camaraDestino: 'Cámara 1',
          estado: 'EN_PROCESO',
          operador: 'Juan Pérez'
        },
        {
          id: '2',
          fecha: new Date().toISOString(),
          tropaCodigo: 'B 2026 0008',
          animalCodigo: 'B20260008-002',
          cuartos: ['Cuarto Delantero Izq', 'Cuarto Delantero Der', 'Cuarto Trasero Izq', 'Cuarto Trasero Der'],
          pesoTotal: 238,
          camaraDestino: 'Cámara 1',
          estado: 'COMPLETADO',
          operador: 'María García'
        }
      ])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar cuarteos')
    } finally {
      setLoading(false)
    }
  }

  const handleCompletar = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setCuarteos(cuarteos.map(c => 
        c.id === id ? { ...c, estado: 'COMPLETADO' } : c
      ))
      
      toast.success('Cuarteo completado correctamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al completar cuarteo')
    }
  }

  const handleIniciarCuarteo = async () => {
    if (!tropaCodigo || !animalCodigo || !camaraDestino) {
      toast.error('Complete todos los campos obligatorios')
      return
    }

    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const nuevoCuarteo: Cuarteo = {
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        tropaCodigo,
        animalCodigo,
        cuartos: ['Cuarto Delantero Izq', 'Cuarto Delantero Der', 'Cuarto Trasero Izq', 'Cuarto Trasero Der'],
        pesoTotal: 0,
        camaraDestino,
        estado: 'EN_PROCESO',
        operador: operador.nombre
      }
      
      setCuarteos([nuevoCuarteo, ...cuarteos])
      setTropaCodigo('')
      setAnimalCodigo('')
      setCamaraDestino('')
      toast.success('Cuarteo iniciado correctamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al iniciar cuarteo')
    } finally {
      setSaving(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'EN_PROCESO':
        return <Badge className="bg-amber-100 text-amber-700">En Proceso</Badge>
      case 'COMPLETADO':
        return <Badge className="bg-emerald-100 text-emerald-700">Completado</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const cuarteosFiltrados = cuarteos.filter(c => 
    filtro === 'TODOS' || c.estado === filtro
  )

  const enProceso = cuarteos.filter(c => c.estado === 'EN_PROCESO').length
  const completados = cuarteos.filter(c => c.estado === 'COMPLETADO').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Scissors className="w-8 h-8 text-amber-500" />
              Cuarteo
            </h1>
            <p className="text-stone-500 mt-1">División de medias en cuartos</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchCuarteos} variant="outline">
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
              <p className="text-3xl font-bold text-stone-800">{cuarteos.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('EN_PROCESO')}>
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">En Proceso</p>
              <p className="text-3xl font-bold text-amber-600">{enProceso}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('COMPLETADO')}>
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Completados</p>
              <p className="text-3xl font-bold text-emerald-600">{completados}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Cuartos/Animal</p>
              <p className="text-3xl font-bold text-stone-800">4</p>
            </CardContent>
          </Card>
        </div>

        {/* Formulario */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500" />
              Iniciar Cuarteo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Tropa *</Label>
                <Input
                  value={tropaCodigo}
                  onChange={(e) => setTropaCodigo(e.target.value)}
                  placeholder="B 2026 0001"
                />
              </div>
              <div className="space-y-2">
                <Label>Animal *</Label>
                <Input
                  value={animalCodigo}
                  onChange={(e) => setAnimalCodigo(e.target.value)}
                  placeholder="B20260001-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Cámara Destino *</Label>
                <Select value={camaraDestino} onValueChange={setCamaraDestino}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cámara 1">Cámara 1</SelectItem>
                    <SelectItem value="Cámara 2">Cámara 2</SelectItem>
                    <SelectItem value="Cámara 3">Cámara 3</SelectItem>
                    <SelectItem value="Cámara 4">Cámara 4</SelectItem>
                    <SelectItem value="Cámara 5">Cámara 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleIniciarCuarteo} 
                  className="w-full bg-amber-500 hover:bg-amber-600"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Scissors className="w-4 h-4 mr-2" />
                  )}
                  Iniciar Cuarteo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              Cuarteos {filtro !== 'TODOS' ? `- ${filtro === 'EN_PROCESO' ? 'En Proceso' : 'Completados'}` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : cuarteosFiltrados.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <Scissors className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No hay cuarteos {filtro.toLowerCase()}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tropa</TableHead>
                    <TableHead>Animal</TableHead>
                    <TableHead>Cuartos</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Cámara</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuarteosFiltrados.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        {new Date(c.fecha).toLocaleDateString('es-AR')}
                      </TableCell>
                      <TableCell className="font-mono">{c.tropaCodigo}</TableCell>
                      <TableCell className="font-mono">{c.animalCodigo}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {c.cuartos.map((cuarto, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {cuarto.replace('Cuarto ', '').substring(0, 2)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{c.pesoTotal > 0 ? `${c.pesoTotal} kg` : '-'}</TableCell>
                      <TableCell>{c.camaraDestino}</TableCell>
                      <TableCell>{getEstadoBadge(c.estado)}</TableCell>
                      <TableCell>
                        {c.estado === 'EN_PROCESO' && (
                          <Button
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-600"
                            onClick={() => handleCompletar(c.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Completar
                          </Button>
                        )}
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

export default CuarteoModule
