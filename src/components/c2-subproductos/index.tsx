'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Package, Loader2, RefreshCw, BarChart3, Bone, Droplets, Trash2 } from 'lucide-react'

interface Operador { id: string; nombre: string; rol: string }

interface SubproductoRegistro {
  id: string
  tipo: string
  pesoKg: number
  tropaCodigo: string | null
  destino: string | null
  observaciones: string | null
  fecha: string
  operador?: { id: string; nombre: string } | null
}

const TIPOS_SUBPRODUCTO = [
  { value: 'HUESO', label: 'Hueso', icon: Bone, color: 'bg-amber-100 text-amber-700' },
  { value: 'GRASA', label: 'Grasa', icon: Droplets, color: 'bg-yellow-100 text-yellow-700' },
  { value: 'INCOMESTIBLE', label: 'Incomestible', icon: Trash2, color: 'bg-red-100 text-red-700' },
  { value: 'RECORTES', label: 'Recortes', icon: Package, color: 'bg-blue-100 text-blue-700' },
  { value: 'OTRO', label: 'Otro', icon: Package, color: 'bg-stone-100 text-stone-700' }
]

export default function C2SubproductosModule({ operador }: { operador: Operador }) {
  const [registros, setRegistros] = useState<SubproductoRegistro[]>([])
  const [resumen, setResumen] = useState<{ tipo: string; pesoTotal: number; cantidad: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form
  const [tipo, setTipo] = useState('HUESO')
  const [pesoKg, setPesoKg] = useState('')
  const [tropaCodigo, setTropaCodigo] = useState('')
  const [destino, setDestino] = useState('')
  const [observaciones, setObservaciones] = useState('')

  useEffect(() => {
    fetchDatos()
  }, [])

  const fetchDatos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/c2-subproductos')
      const data = await res.json()
      if (data.success) {
        setRegistros(data.data || [])
        setResumen(data.resumen || [])
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleRegistrar = async () => {
    if (!pesoKg || parseFloat(pesoKg) <= 0) {
      toast.error('Ingrese un peso válido')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/c2-subproductos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          pesoKg: parseFloat(pesoKg),
          tropaCodigo: tropaCodigo.trim() || null,
          destino: destino.trim() || null,
          operadorId: operador.id,
          observaciones: observaciones.trim() || null
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success(data.message || 'Subproducto registrado')
        setPesoKg('')
        setTropaCodigo('')
        setDestino('')
        setObservaciones('')
        fetchDatos()
      } else {
        toast.error(data.error || 'Error al registrar')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al registrar')
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = async (id: string) => {
    try {
      const res = await fetch(`/api/c2-subproductos?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Registro eliminado')
        fetchDatos()
      }
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const tipoBadge = (t: string) => {
    const config = TIPOS_SUBPRODUCTO.find(ts => ts.value === t)
    return config?.color || 'bg-stone-100 text-stone-700'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-amber-500" />
              Subproductos (C2)
            </h1>
            <p className="text-stone-500">Pesaje de hueso, grasa, incomestibles y recortes</p>
          </div>
          <Button onClick={fetchDatos} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Resumen por tipo */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {TIPOS_SUBPRODUCTO.map(ts => {
            const data = resumen.find(r => r.tipo === ts.value)
            const Icon = ts.icon
            return (
              <Card key={ts.value} className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`${ts.color} p-2 rounded-lg`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">{ts.label}</p>
                      <p className="text-xl font-bold">{data?.pesoTotal?.toFixed(1) || '0'} kg</p>
                      <p className="text-xs text-stone-400">{data?.cantidad || 0} regs.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Formulario de pesaje */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              Registrar Pesaje
            </CardTitle>
            <CardDescription>Seleccione tipo, pese y registre el subproducto</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_SUBPRODUCTO.map(ts => (
                      <SelectItem key={ts.value} value={ts.value}>{ts.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Quick buttons */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {TIPOS_SUBPRODUCTO.map(ts => (
                    <Button
                      key={ts.value}
                      variant={tipo === ts.value ? 'default' : 'outline'}
                      size="sm"
                      className={`h-7 text-xs ${tipo === ts.value ? 'bg-amber-500' : ''}`}
                      onClick={() => setTipo(ts.value)}
                    >
                      {ts.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={pesoKg}
                  onChange={(e) => setPesoKg(e.target.value)}
                  className="text-right text-lg font-bold h-12"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tropa</Label>
                <Input
                  value={tropaCodigo}
                  onChange={(e) => setTropaCodigo(e.target.value)}
                  placeholder="Código tropa..."
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Destino</Label>
                <Input
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  placeholder="Rendering, Venta..."
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleRegistrar}
                  disabled={saving || !pesoKg}
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Package className="w-4 h-4 mr-2" />}
                  {saving ? '...' : 'Registrar'}
                </Button>
              </div>
            </div>
            {observaciones !== '' && (
              <div className="mt-3">
                <Input
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Observaciones (opcional)..."
                />
              </div>
            )}
            {!observaciones && (
              <Button variant="link" size="sm" className="text-stone-400 p-0 mt-1" onClick={() => setObservaciones(' ')}>
                + Agregar observaciones
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Tabla de registros */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Últimos Registros ({registros.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
              </div>
            ) : registros.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay registros de subproductos</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50/50">
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>Tropa</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Operador</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registros.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">
                          {new Date(r.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={tipoBadge(r.tipo)}>
                            {r.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{r.pesoKg.toFixed(1)} kg</TableCell>
                        <TableCell className="text-sm text-stone-500">{r.tropaCodigo || '-'}</TableCell>
                        <TableCell className="text-sm">{r.destino || '-'}</TableCell>
                        <TableCell className="text-sm">{r.operador?.nombre || '-'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleEliminar(r.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
