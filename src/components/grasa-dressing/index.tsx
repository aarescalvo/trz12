// NOTA: Componente disponible para uso futuro - verificar antes de eliminar
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Loader2, Plus, Search, Droplets, Scale, TrendingDown, CheckCircle,
  Edit, Calendar, Package
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface GrasaDressing {
  id: string
  fechaFaena: string
  tropaCodigo: string | null
  pesoTotal: number
  observaciones: string | null
  enStock: boolean
  destino: string | null
  precioKg: number | null
  vendido: boolean
  fechaIngreso: string
}

interface Props {
  operador: Operador
}

export function GrasaDressingModule({ operador }: Props) {
  const [grasas, setGrasas] = useState<GrasaDressing[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pesoTotal: 0,
    enStock: 0,
    pesoEnStock: 0
  })
  
  // Filtros
  const [filtroStock, setFiltroStock] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<GrasaDressing | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState({
    fechaFaena: new Date().toISOString().split('T')[0],
    tropaCodigo: '',
    pesoTotal: '',
    observaciones: '',
    destino: '',
    precioKg: ''
  })

  useEffect(() => {
    fetchGrasas()
  }, [filtroStock])

  const fetchGrasas = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroStock === 'enStock') params.append('enStock', 'true')
      
      const res = await fetch(`/api/grasa-dressing?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setGrasas(data.data)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar grasa dressing')
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async () => {
    if (!formData.pesoTotal || parseFloat(formData.pesoTotal) <= 0) {
      toast.error('Ingrese el peso total')
      return
    }

    setGuardando(true)
    try {
      const payload = {
        ...formData,
        operadorId: operador.id
      }

      if (editando) {
        const res = await fetch('/api/grasa-dressing', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editando.id, ...payload })
        })
        const data = await res.json()
        if (data.success) {
          toast.success('Registro actualizado')
          fetchGrasas()
        } else {
          toast.error(data.error || 'Error al actualizar')
        }
      } else {
        const res = await fetch('/api/grasa-dressing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (data.success) {
          toast.success('Grasa dressing registrada')
          fetchGrasas()
        } else {
          toast.error(data.error || 'Error al crear')
        }
      }
      
      setModalOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setGuardando(false)
    }
  }

  const handleEditar = (grasa: GrasaDressing) => {
    setEditando(grasa)
    setFormData({
      fechaFaena: grasa.fechaFaena.split('T')[0],
      tropaCodigo: grasa.tropaCodigo || '',
      pesoTotal: grasa.pesoTotal.toString(),
      observaciones: grasa.observaciones || '',
      destino: grasa.destino || '',
      precioKg: grasa.precioKg?.toString() || ''
    })
    setModalOpen(true)
  }

  const handleMarcarVendido = async (grasa: GrasaDressing) => {
    try {
      const res = await fetch('/api/grasa-dressing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: grasa.id,
          vendido: true,
          enStock: false,
          fechaSalida: new Date().toISOString()
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Marcado como vendido')
        fetchGrasas()
      }
    } catch (error) {
      toast.error('Error al actualizar')
    }
  }

  const resetForm = () => {
    setEditando(null)
    setFormData({
      fechaFaena: new Date().toISOString().split('T')[0],
      tropaCodigo: '',
      pesoTotal: '',
      observaciones: '',
      destino: '',
      precioKg: ''
    })
  }

  const grasasFiltradas = grasas.filter(g => {
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase()
      return (
        g.tropaCodigo?.toLowerCase().includes(busquedaLower) ||
        g.destino?.toLowerCase().includes(busquedaLower)
      )
    }
    return true
  })

  // Agrupar por fecha
  const grasasPorFecha = grasasFiltradas.reduce((acc, g) => {
    const fecha = g.fechaFaena.split('T')[0]
    if (!acc[fecha]) {
      acc[fecha] = []
    }
    acc[fecha].push(g)
    return acc
  }, {} as Record<string, GrasaDressing[]>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Droplets className="w-8 h-8 text-amber-500" />
              Grasa Dressing
            </h1>
            <p className="text-stone-500 mt-1">Pesaje de grasa por fecha de faena</p>
          </div>
          <Button 
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Pesaje
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Total Registros</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 p-2 rounded-lg">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Peso Total</p>
                  <p className="text-xl font-bold">{stats.pesoTotal.toFixed(1)} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">En Stock</p>
                  <p className="text-xl font-bold">{stats.enStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Peso Stock</p>
                  <p className="text-xl font-bold">{stats.pesoEnStock.toFixed(1)} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-md mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    placeholder="Buscar por tropa o destino..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filtroStock === 'todos' ? 'default' : 'outline'}
                  onClick={() => setFiltroStock('todos')}
                  size="sm"
                >
                  Todos
                </Button>
                <Button
                  variant={filtroStock === 'enStock' ? 'default' : 'outline'}
                  onClick={() => setFiltroStock('enStock')}
                  size="sm"
                >
                  En Stock
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista por fecha */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : Object.keys(grasasPorFecha).length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center text-stone-400">
              <Droplets className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No hay registros de grasa dressing</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(grasasPorFecha)
              .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
              .map(([fecha, items]) => {
                const pesoDia = items.reduce((sum, g) => sum + g.pesoTotal, 0)
                return (
                  <Card key={fecha} className="border-0 shadow-md">
                    <CardHeader className="bg-stone-50 py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-500" />
                          {new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </CardTitle>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                          {items.length} registros • {pesoDia.toFixed(1)} kg
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {items.map((grasa) => (
                          <div key={grasa.id} className="p-4 hover:bg-stone-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-stone-800">{grasa.pesoTotal.toFixed(1)}</p>
                                  <p className="text-xs text-stone-500">kg</p>
                                </div>
                                <div>
                                  {grasa.tropaCodigo && (
                                    <p className="font-mono text-sm text-stone-600">{grasa.tropaCodigo}</p>
                                  )}
                                  {grasa.destino && (
                                    <p className="text-sm text-stone-500">{grasa.destino}</p>
                                  )}
                                  {grasa.observaciones && (
                                    <p className="text-xs text-stone-400">{grasa.observaciones}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {grasa.enStock ? (
                                  <Badge className="bg-emerald-100 text-emerald-700">En Stock</Badge>
                                ) : grasa.vendido ? (
                                  <Badge className="bg-blue-100 text-blue-700">Vendido</Badge>
                                ) : (
                                  <Badge className="bg-stone-100 text-stone-700">Salida</Badge>
                                )}
                                {grasa.precioKg && (
                                  <span className="text-sm text-stone-500">${grasa.precioKg}/kg</span>
                                )}
                                {grasa.enStock && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleMarcarVendido(grasa)}
                                    className="text-emerald-600"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditar(grasa)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        )}

        {/* Modal Nuevo/Editar */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md" maximizable>
            <DialogHeader>
              <DialogTitle>
                {editando ? 'Editar Registro' : 'Registrar Grasa Dressing'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Faena</Label>
                  <Input
                    type="date"
                    value={formData.fechaFaena}
                    onChange={(e) => setFormData({...formData, fechaFaena: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Código Tropa (opcional)</Label>
                  <Input
                    value={formData.tropaCodigo}
                    onChange={(e) => setFormData({...formData, tropaCodigo: e.target.value})}
                    placeholder="B20260001"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Peso Total (kg) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.pesoTotal}
                  onChange={(e) => setFormData({...formData, pesoTotal: e.target.value})}
                  placeholder="0.0"
                  className="text-2xl font-bold text-center h-14"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Destino</Label>
                <Input
                  value={formData.destino}
                  onChange={(e) => setFormData({...formData, destino: e.target.value})}
                  placeholder="Cliente o destino"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Precio por kg ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.precioKg}
                  onChange={(e) => setFormData({...formData, precioKg: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Input
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  placeholder="Notas adicionales"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleGuardar}
                disabled={guardando}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {guardando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Guardar'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
