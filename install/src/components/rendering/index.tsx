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
  TrendingUp, Package, Loader2, RefreshCw, Plus, Trash2,
  Scale, Factory
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface RenderingRecord {
  id: string
  tipo: 'GRASA' | 'DESPERDICIOS' | 'FONDO_DIGESTOR'
  fecha: string
  tropaId?: string
  tropaCodigo?: string
  pesoKg: number
  destino: string
  observaciones?: string
  operador: string
}

interface Props {
  operador: Operador
  tipoInicial?: 'GRASA' | 'DESPERDICIOS' | 'FONDO_DIGESTOR'
}

export function RenderingModule({ operador, tipoInicial = 'GRASA' }: Props) {
  const [registros, setRegistros] = useState<RenderingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [tipo, setTipo] = useState<'GRASA' | 'DESPERDICIOS' | 'FONDO_DIGESTOR'>(tipoInicial)
  
  // Form state
  const [pesoKg, setPesoKg] = useState('')
  const [destino, setDestino] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchRegistros()
  }, [tipo])

  const fetchRegistros = async () => {
    setLoading(true)
    try {
      // Simulated data - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))
      setRegistros([
        {
          id: '1',
          tipo: tipo,
          fecha: new Date().toISOString(),
          pesoKg: 450,
          destino: 'Proveedor A',
          operador: 'Juan Pérez'
        },
        {
          id: '2',
          tipo: tipo,
          fecha: new Date(Date.now() - 86400000).toISOString(),
          pesoKg: 380,
          destino: 'Proveedor B',
          operador: 'María García'
        }
      ])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar registros')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!pesoKg || !destino) {
      toast.error('Complete todos los campos obligatorios')
      return
    }

    setSaving(true)
    try {
      // Simulated save - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const nuevoRegistro: RenderingRecord = {
        id: Date.now().toString(),
        tipo: tipo,
        fecha: new Date().toISOString(),
        pesoKg: parseFloat(pesoKg),
        destino: destino,
        observaciones: observaciones,
        operador: operador.nombre
      }
      
      setRegistros([nuevoRegistro, ...registros])
      setPesoKg('')
      setDestino('')
      setObservaciones('')
      toast.success('Registro guardado correctamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al guardar registro')
    } finally {
      setSaving(false)
    }
  }

  const getTipoLabel = (t: string) => {
    switch (t) {
      case 'GRASA': return 'Grasa'
      case 'DESPERDICIOS': return 'Desperdicios'
      case 'FONDO_DIGESTOR': return 'Fondo de Digestor'
      default: return t
    }
  }

  const getTipoIcon = (t: string) => {
    switch (t) {
      case 'GRASA': return TrendingUp
      case 'DESPERDICIOS': return Package
      case 'FONDO_DIGESTOR': return Factory
      default: return Package
    }
  }

  const getTipoColor = (t: string) => {
    switch (t) {
      case 'GRASA': return 'bg-amber-100 text-amber-700'
      case 'DESPERDICIOS': return 'bg-red-100 text-red-700'
      case 'FONDO_DIGESTOR': return 'bg-purple-100 text-purple-700'
      default: return 'bg-stone-100 text-stone-700'
    }
  }

  const totalKg = registros.reduce((acc, r) => acc + r.pesoKg, 0)
  const Icon = getTipoIcon(tipo)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Icon className="w-8 h-8 text-amber-500" />
              {getTipoLabel(tipo)}
            </h1>
            <p className="text-stone-500 mt-1">Control de subproductos - Rendering</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchRegistros} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Selector de tipo */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <Label className="text-sm font-medium mb-2 block">Tipo de Registro</Label>
            <div className="flex gap-2">
              {(['GRASA', 'DESPERDICIOS', 'FONDO_DIGESTOR'] as const).map((t) => {
                const TIcon = getTipoIcon(t)
                return (
                  <Button
                    key={t}
                    variant={tipo === t ? 'default' : 'outline'}
                    className={tipo === t ? 'bg-amber-500 hover:bg-amber-600' : ''}
                    onClick={() => setTipo(t)}
                  >
                    <TIcon className="w-4 h-4 mr-2" />
                    {getTipoLabel(t)}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Total Registros</p>
              <p className="text-3xl font-bold text-stone-800">{registros.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Total Kg</p>
              <p className="text-3xl font-bold text-amber-600">{totalKg.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Promedio</p>
              <p className="text-3xl font-bold text-stone-800">
                {registros.length > 0 ? Math.round(totalKg / registros.length) : 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500 uppercase">Tipo</p>
              <Badge className={getTipoColor(tipo)}>{getTipoLabel(tipo)}</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Formulario de registro */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500" />
              Nuevo Registro
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="peso">Peso (Kg) *</Label>
                <Input
                  id="peso"
                  type="number"
                  value={pesoKg}
                  onChange={(e) => setPesoKg(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destino">Destino *</Label>
                <Input
                  id="destino"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  placeholder="Proveedor/Destino"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Input
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas adicionales"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSave} 
                  className="w-full bg-amber-500 hover:bg-amber-600"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Scale className="w-4 h-4 mr-2" />
                  )}
                  Registrar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de registros */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold">
              Registros de {getTipoLabel(tipo)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : registros.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <Icon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No hay registros de {getTipoLabel(tipo).toLowerCase()}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Peso (Kg)</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead>Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros.map((registro) => (
                    <TableRow key={registro.id}>
                      <TableCell>
                        {new Date(registro.fecha).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="font-medium">{registro.pesoKg.toLocaleString()}</TableCell>
                      <TableCell>{registro.destino}</TableCell>
                      <TableCell>{registro.operador}</TableCell>
                      <TableCell className="text-stone-500">{registro.observaciones || '-'}</TableCell>
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

export default RenderingModule
