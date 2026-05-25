'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import {
  Package, Loader2, RefreshCw, Plus, CheckCircle,
  Truck, Scale, Archive
} from 'lucide-react'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Cuero {
  id: string
  fecha: string
  tropaCodigo: string | null
  cantidad: number
  pesoKg: number
  conservacion: string
  destino: string | null
  estado: string
  remito: string | null
  fechaDespacho: string | null
  operador: { id: string; nombre: string } | null
}

interface Props {
  operador: Operador
}

export function CuerosModule({ operador }: Props) {
  const { getTexto } = useEditor()
  const [cueros, setCueros] = useState<Cuero[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState<any>({})

  // Form state
  const [tropaCodigo, setTropaCodigo] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [pesoKg, setPesoKg] = useState('')
  const [conservacion, setConservacion] = useState<string>('SALADO')
  const [destino, setDestino] = useState('')

  useEffect(() => {
    fetchCueros()
  }, [])

  const fetchCueros = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cueros')
      const data = await res.json()
      if (data.success) {
        setCueros(data.data)
        setStats(data.stats || {})
      } else {
        toast.error('Error al cargar cueros')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar cueros')
    } finally {
      setLoading(false)
    }
  }

  const handleRegistrar = async () => {
    if (!cantidad || !pesoKg || !destino) {
      toast.error('Complete todos los campos obligatorios')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/cueros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tropaCodigo: tropaCodigo || null,
          cantidad: parseInt(cantidad),
          pesoKg: parseFloat(pesoKg),
          conservacion,
          destino,
          operadorId: operador.id
        })
      })

      const data = await res.json()
      if (data.success) {
        setCueros([data.data, ...cueros])
        setTropaCodigo('')
        setCantidad('')
        setPesoKg('')
        setDestino('')
        toast.success('Cuero registrado correctamente')
        fetchCueros()
      } else {
        toast.error(data.error || 'Error al registrar')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al registrar cuero')
    } finally {
      setSaving(false)
    }
  }

  const handleDespachar = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/cueros', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado: 'DESPACHADO' })
      })

      const data = await res.json()
      if (data.success) {
        setCueros(cueros.map(c => c.id === id ? { ...c, estado: 'DESPACHADO' } : c))
        toast.success('Cuero despachado correctamente')
      } else {
        toast.error(data.error || 'Error al despachar')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al despachar')
    } finally {
      setSaving(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge className="bg-amber-100 text-amber-700">Pendiente</Badge>
      case 'DESPACHADO':
        return <Badge className="bg-green-100 text-green-700">Despachado</Badge>
      case 'ANULADO':
        return <Badge className="bg-red-100 text-red-700">Anulado</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const getConservacionBadge = (conservacion: string) => {
    switch (conservacion) {
      case 'SALADO':
        return <Badge variant="outline" className="border-amber-300 text-amber-700">Salado</Badge>
      case 'FRESCO':
        return <Badge variant="outline" className="border-stone-300 text-stone-700">Fresco</Badge>
      case 'CORTADO':
        return <Badge variant="outline" className="border-blue-300 text-blue-700">Cortado</Badge>
      default:
        return <Badge variant="outline">{conservacion}</Badge>
    }
  }

  const pendientes = cueros.filter(c => c.estado === 'PENDIENTE')
  const despachados = cueros.filter(c => c.estado === 'DESPACHADO')
  const totalCueros = cueros.reduce((acc, c) => acc + c.cantidad, 0)
  const totalPeso = cueros.reduce((acc, c) => acc + c.pesoKg, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
                <Package className="w-8 h-8 text-amber-500" />
                <TextoEditable id="titulo-cueros" original="Control de Cueros" tag="span" />
              </h1>
              <p className="text-stone-500 mt-1">
                <TextoEditable id="subtitulo-cueros" original="Seguimiento de cueros como subproducto del frigorífico" tag="span" />
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchCueros} variant="outline" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                <TextoEditable id="btn-actualizar-cueros" original="Actualizar" tag="span" />
              </Button>
            </div>
          </div>
        </EditableBlock>

        {/* Summary Cards */}
        <EditableBlock bloqueId="resumen" label="Tarjetas de Resumen">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-total-cueros" original="Total Cueros" tag="span" /></p>
                    <p className="text-3xl font-bold text-stone-800">{totalCueros}</p>
                  </div>
                  <Package className="w-8 h-8 text-stone-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-pendientes-cueros" original="Pendientes" tag="span" /></p>
                    <p className="text-3xl font-bold text-amber-600">{pendientes.length}</p>
                  </div>
                  <Archive className="w-8 h-8 text-amber-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-despachados-cueros" original="Despachados" tag="span" /></p>
                    <p className="text-3xl font-bold text-green-600">{despachados.length}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-peso-total-cueros" original="Peso Total" tag="span" /></p>
                    <p className="text-3xl font-bold text-stone-800">{totalPeso.toLocaleString('es-AR', { maximumFractionDigits: 1 })}</p>
                    <p className="text-xs text-stone-400">kg</p>
                  </div>
                  <Scale className="w-8 h-8 text-stone-300" />
                </div>
              </CardContent>
            </Card>
          </div>
        </EditableBlock>

        {/* Registration Form */}
        <EditableBlock bloqueId="formulario" label="Formulario de Registro">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" />
                <TextoEditable id="titulo-form-cueros" original="Registro de Cueros" tag="span" />
              </CardTitle>
              <CardDescription>
                <TextoEditable id="desc-form-cueros" original="Registre los cueros provenientes de la faena" tag="span" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tropa"><TextoEditable id="label-codigo-tropa-cuero" original="Código Tropa" tag="span" /></Label>
                  <Input
                    id="tropa"
                    value={tropaCodigo}
                    onChange={(e) => setTropaCodigo(e.target.value)}
                    placeholder="B 2026 0001"
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cantidad"><TextoEditable id="label-cantidad-cuero" original="Cantidad *" tag="span" /></Label>
                  <Input
                    id="cantidad"
                    type="number"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="peso"><TextoEditable id="label-peso-cuero" original="Peso (kg) *" tag="span" /></Label>
                  <Input
                    id="peso"
                    type="number"
                    step="0.1"
                    value={pesoKg}
                    onChange={(e) => setPesoKg(e.target.value)}
                    placeholder="0.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conservacion"><TextoEditable id="label-conservacion-cuero" original="Conservación *" tag="span" /></Label>
                  <Select value={conservacion} onValueChange={setConservacion}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SALADO">Salado</SelectItem>
                      <SelectItem value="FRESCO">Fresco</SelectItem>
                      <SelectItem value="CORTADO">Cortado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destino"><TextoEditable id="label-destino-cuero" original="Destino *" tag="span" /></Label>
                  <Input
                    id="destino"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    placeholder="Curtiembre / Cliente"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleRegistrar}
                    className="w-full bg-amber-500 hover:bg-amber-600"
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    <TextoEditable id="btn-registrar-cuero" original="Registrar" tag="span" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </EditableBlock>

        {/* Data Table */}
        <EditableBlock bloqueId="tabla" label="Tabla de Cueros">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold">
                <TextoEditable id="titulo-historial-cueros" original="Historial de Cueros" tag="span" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : cueros.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p><TextoEditable id="msg-sin-cueros" original="No hay cueros registrados" tag="span" /></p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><TextoEditable id="th-fecha-cuero" original="Fecha" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-tropa-cuero" original="Tropa" tag="span" /></TableHead>
                      <TableHead className="text-center"><TextoEditable id="th-cantidad-cuero" original="Cantidad" tag="span" /></TableHead>
                      <TableHead className="text-right"><TextoEditable id="th-peso-tabla-cuero" original="Peso (kg)" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-conservacion-tabla" original="Conservación" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-destino-tabla" original="Destino" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-estado-cuero" original="Estado" tag="span" /></TableHead>
                      <TableHead className="text-center"><TextoEditable id="th-acciones-cuero" original="Acciones" tag="span" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cueros.map((cuero) => (
                      <TableRow key={cuero.id}>
                        <TableCell className="font-medium">
                          {new Date(cuero.fecha).toLocaleDateString('es-AR')}
                        </TableCell>
                        <TableCell className="font-mono">{cuero.tropaCodigo || '-'}</TableCell>
                        <TableCell className="text-center font-bold">{cuero.cantidad}</TableCell>
                        <TableCell className="text-right font-bold text-amber-600">
                          {cuero.pesoKg.toLocaleString('es-AR', { maximumFractionDigits: 1 })}
                        </TableCell>
                        <TableCell>{getConservacionBadge(cuero.conservacion)}</TableCell>
                        <TableCell>{cuero.destino || '-'}</TableCell>
                        <TableCell>{getEstadoBadge(cuero.estado)}</TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            {cuero.estado === 'PENDIENTE' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDespachar(cuero.id)}
                                disabled={saving}
                                className="border-green-300 text-green-600 hover:bg-green-50"
                              >
                                <Truck className="w-4 h-4 mr-1" />
                                Despachar
                              </Button>
                            )}
                            {cuero.estado === 'DESPACHADO' && (
                              <span className="text-xs text-green-600 italic px-2">Completado</span>
                            )}
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

        {/* Info Footer */}
        <div className="text-center text-sm text-stone-400 py-4">
          <p>Módulo de Control de Cueros - Frigorífico</p>
          <p className="text-xs mt-1">Operador: {operador.nombre} | Rol: {operador.rol}</p>
        </div>
      </div>
    </div>
  )
}

export default CuerosModule
