'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  TrendingUp, Package, Loader2, RefreshCw, Plus, Trash2,
  Scale, Factory, Droplets
} from 'lucide-react'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface RenderingRecord {
  id: string
  tipo: string
  createdAt: string
  fechaFaena: string | null
  tropaCodigo: string | null
  pesoKg: number
  destino: string | null
  remito: string | null
  estado: string
  observaciones: string | null
  operador: { id: string; nombre: string } | null
}

interface Props {
  operador: Operador
  tipoInicial?: 'GRASA' | 'DESPERDICIOS' | 'FONDO_DIGESTOR' | 'SANGRE'
}

const TIPOS_RENDERING = [
  { id: 'GRASA', label: 'Grasa', icon: TrendingUp, color: 'bg-amber-100 text-amber-700' },
  { id: 'DESPERDICIOS', label: 'Desperdicios', icon: Package, color: 'bg-red-100 text-red-700' },
  { id: 'FONDO_DIGESTOR', label: 'Fondo Digestor', icon: Factory, color: 'bg-purple-100 text-purple-700' },
  { id: 'SANGRE', label: 'Sangre', icon: Droplets, color: 'bg-red-200 text-red-800' },
]

export function RenderingModule({ operador, tipoInicial = 'GRASA' }: Props) {
  const { getTexto } = useEditor()
  const [registros, setRegistros] = useState<RenderingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [tipo, setTipo] = useState<string>(tipoInicial)
  const [stats, setStats] = useState<any>({})
  
  // Form state
  const [tropaCodigo, setTropaCodigo] = useState('')
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
      const res = await fetch(`/api/rendering?tipo=${tipo}`)
      const data = await res.json()
      if (data.success) {
        setRegistros(data.data)
        setStats(data.stats || {})
      } else {
        toast.error('Error al cargar registros')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar registros')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!pesoKg) {
      toast.error('El peso es obligatorio')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/rendering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          tropaCodigo: tropaCodigo || null,
          pesoKg: parseFloat(pesoKg),
          destino: destino || null,
          observaciones: observaciones || null,
          operadorId: operador.id
        })
      })

      const data = await res.json()
      if (data.success) {
        setRegistros([data.data, ...registros])
        setTropaCodigo('')
        setPesoKg('')
        setDestino('')
        setObservaciones('')
        toast.success('Registro guardado correctamente')
        fetchRegistros()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al guardar registro')
    } finally {
      setSaving(false)
    }
  }

  const handleDespachar = async (id: string) => {
    try {
      const res = await fetch('/api/rendering', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado: 'DESPACHADO' })
      })

      const data = await res.json()
      if (data.success) {
        setRegistros(registros.map(r => r.id === id ? { ...r, estado: 'DESPACHADO' } : r))
        toast.success('Registro despachado correctamente')
      } else {
        toast.error(data.error || 'Error al despachar')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al despachar')
    }
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return

    try {
      const res = await fetch(`/api/rendering?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setRegistros(registros.filter(r => r.id !== id))
        toast.success('Registro eliminado')
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const getTipoInfo = (t: string) => {
    return TIPOS_RENDERING.find(item => item.id === t) || TIPOS_RENDERING[0]
  }

  const totalKg = registros.reduce((acc, r) => acc + r.pesoKg, 0)
  const tipoInfo = getTipoInfo(tipo)
  const Icon = tipoInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
                <Icon className="w-8 h-8 text-amber-500" />
                <TextoEditable id={`rendering-titulo-${tipo.toLowerCase()}`} original={tipoInfo.label} tag="span" />
              </h1>
              <p className="text-stone-500 mt-1">
                <TextoEditable id="rendering-subtitulo" original="Control de subproductos - Rendering" tag="span" />
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchRegistros} variant="outline" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                <TextoEditable id="btn-actualizar" original="Actualizar" tag="span" />
              </Button>
            </div>
          </div>
        </EditableBlock>

        {/* Selector de tipo */}
        <EditableBlock bloqueId="selector-tipo" label="Selector de Tipo">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <Label className="text-sm font-medium mb-2 block">
                <TextoEditable id="rendering-tipo-label" original="Tipo de Registro" tag="span" />
              </Label>
              <div className="flex flex-wrap gap-2">
                {TIPOS_RENDERING.map((t) => {
                  const TIcon = t.icon
                  return (
                    <Button
                      key={t.id}
                      variant={tipo === t.id ? 'default' : 'outline'}
                      className={tipo === t.id ? 'bg-amber-500 hover:bg-amber-600' : ''}
                      onClick={() => setTipo(t.id)}
                    >
                      <TIcon className="w-4 h-4 mr-2" />
                      <TextoEditable id={`rendering-tipo-${t.id.toLowerCase()}`} original={t.label} tag="span" />
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </EditableBlock>

        {/* Resumen */}
        <EditableBlock bloqueId="resumen" label="Resumen">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase">
                  <TextoEditable id="rendering-total-registros" original="Total Registros" tag="span" />
                </p>
                <p className="text-3xl font-bold text-stone-800">{registros.length}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase">
                  <TextoEditable id="rendering-total-kg" original="Total Kg" tag="span" />
                </p>
                <p className="text-3xl font-bold text-amber-600">{totalKg.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase">
                  <TextoEditable id="rendering-promedio" original="Promedio" tag="span" />
                </p>
                <p className="text-3xl font-bold text-stone-800">
                  {registros.length > 0 ? Math.round(totalKg / registros.length) : 0}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase">
                  <TextoEditable id="rendering-tipo-actual" original="Tipo" tag="span" />
                </p>
                <Badge className={tipoInfo.color}>
                  <TextoEditable id={`rendering-badge-${tipo.toLowerCase()}`} original={tipoInfo.label} tag="span" />
                </Badge>
              </CardContent>
            </Card>
          </div>
        </EditableBlock>

        {/* Formulario de registro */}
        <EditableBlock bloqueId="formulario" label="Formulario de Registro">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" />
                <TextoEditable id="rendering-nuevo-registro" original="Nuevo Registro" tag="span" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tropa">
                    <TextoEditable id="rendering-tropa-label" original="Tropa" tag="span" />
                  </Label>
                  <Input
                    id="tropa"
                    value={tropaCodigo}
                    onChange={(e) => setTropaCodigo(e.target.value)}
                    placeholder="B 2026 0001"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="peso">
                    <TextoEditable id="rendering-peso-label" original="Peso (Kg) *" tag="span" />
                  </Label>
                  <Input
                    id="peso"
                    type="number"
                    step="0.1"
                    value={pesoKg}
                    onChange={(e) => setPesoKg(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destino">
                    <TextoEditable id="rendering-destino-label" original="Destino" tag="span" />
                  </Label>
                  <Input
                    id="destino"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    placeholder="Proveedor/Destino"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observaciones">
                    <TextoEditable id="rendering-observaciones-label" original="Observaciones" tag="span" />
                  </Label>
                  <Input
                    id="observaciones"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Notas"
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
                    <TextoEditable id="btn-registrar" original="Registrar" tag="span" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </EditableBlock>

        {/* Tabla de registros */}
        <EditableBlock bloqueId="tabla-registros" label="Tabla de Registros">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold">
                <TextoEditable id="rendering-registros-title" original="Registros de" tag="span" /> {tipoInfo.label}
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
                  <p>
                    <TextoEditable id="rendering-no-registros" original="No hay registros" tag="span" />
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><TextoEditable id="rendering-th-fecha" original="Fecha" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="rendering-th-tropa" original="Tropa" tag="span" /></TableHead>
                      <TableHead className="text-right"><TextoEditable id="rendering-th-peso" original="Peso (Kg)" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="rendering-th-destino" original="Destino" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="rendering-th-estado" original="Estado" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="rendering-th-operador" original="Operador" tag="span" /></TableHead>
                      <TableHead className="text-center"><TextoEditable id="th-acciones" original="Acciones" tag="span" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registros.map((registro) => (
                      <TableRow key={registro.id}>
                        <TableCell>
                          {new Date(registro.createdAt).toLocaleDateString('es-AR')}
                        </TableCell>
                        <TableCell className="font-mono">{registro.tropaCodigo || '-'}</TableCell>
                        <TableCell className="text-right font-bold text-amber-600">
                          {registro.pesoKg.toLocaleString('es-AR', { maximumFractionDigits: 1 })}
                        </TableCell>
                        <TableCell>{registro.destino || '-'}</TableCell>
                        <TableCell>
                          <Badge className={registro.estado === 'REGISTRADO' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}>
                            {registro.estado === 'REGISTRADO' ? 'Pendiente' : 'Despachado'}
                          </Badge>
                        </TableCell>
                        <TableCell>{registro.operador?.nombre || '-'}</TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            {registro.estado === 'REGISTRADO' && (
                              <Button size="sm" variant="outline" className="border-green-300 text-green-600" onClick={() => handleDespachar(registro.id)}>
                                Despachar
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleEliminar(registro.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
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
        </EditableBlock>
      </div>
    </div>
  )
}

export default RenderingModule
