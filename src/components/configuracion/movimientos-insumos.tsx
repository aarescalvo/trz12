'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowRightLeft, Plus, ArrowDownCircle, ArrowUpCircle, ArrowRight } from 'lucide-react'

interface MovimientoInsumo {
  id: string
  tipo: 'INGRESO' | 'EGRESO' | 'TRANSFERENCIA'
  insumoId: string
  depositoOrigenId?: string
  depositoDestinoId?: string
  cantidad: number
  observaciones?: string
  createdAt: string
  insumo: {
    id: string
    nombre: string
    codigo?: string
    unidadMedida: string
  }
  depositoOrigen?: {
    id: string
    nombre: string
  }
  depositoDestino?: {
    id: string
    nombre: string
  }
}

interface Insumo {
  id: string
  nombre: string
  codigo?: string
  unidadMedida: string
}

interface Deposito {
  id: string
  nombre: string
  codigo?: string
}

interface Props {
  operador: { id: string; nombre: string; nivel: string }
}

const TIPOS_MOVIMIENTO = [
  { value: 'INGRESO', label: 'Ingreso', icon: ArrowDownCircle, color: 'text-green-600' },
  { value: 'EGRESO', label: 'Egreso', icon: ArrowUpCircle, color: 'text-red-600' },
  { value: 'TRANSFERENCIA', label: 'Transferencia', icon: ArrowRight, color: 'text-blue-600' },
]

export function MovimientosInsumos({ operador }: Props) {
  const [movimientos, setMovimientos] = useState<MovimientoInsumo[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [depositos, setDepositos] = useState<Deposito[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    tipo: 'INGRESO' as 'INGRESO' | 'EGRESO' | 'TRANSFERENCIA',
    insumoId: '',
    depositoOrigenId: '',
    depositoDestinoId: '',
    cantidad: 0,
    observaciones: '',
  })

  useEffect(() => {
    fetchMovimientos()
    fetchInsumos()
    fetchDepositos()
  }, [])

  const fetchMovimientos = async () => {
    try {
      const res = await fetch('/api/movimientos-insumos')
      if (res.ok) {
        const data = await res.json()
        setMovimientos(data)
      }
    } catch (error) {
      console.error('Error al cargar movimientos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInsumos = async () => {
    try {
      const res = await fetch('/api/insumos')
      if (res.ok) {
        const data = await res.json()
        setInsumos(data.filter((i: Insumo & { activo: boolean }) => i.activo))
      }
    } catch (error) {
      console.error('Error al cargar insumos:', error)
    }
  }

  const fetchDepositos = async () => {
    try {
      const res = await fetch('/api/depositos')
      if (res.ok) {
        const data = await res.json()
        setDepositos(data.filter((d: Deposito & { activo: boolean }) => d.activo))
      }
    } catch (error) {
      console.error('Error al cargar depósitos:', error)
    }
  }

  const handleSave = async () => {
    try {
      const body = {
        ...formData,
        operadorId: operador.id,
        // Limpiar depósitos según el tipo
        depositoOrigenId: formData.tipo === 'INGRESO' ? null : formData.depositoOrigenId,
        depositoDestinoId: formData.tipo === 'EGRESO' ? null : formData.depositoDestinoId,
      }

      const res = await fetch('/api/movimientos-insumos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        fetchMovimientos()
        setDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error al registrar movimiento:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      tipo: 'INGRESO',
      insumoId: '',
      depositoOrigenId: '',
      depositoDestinoId: '',
      cantidad: 0,
      observaciones: '',
    })
  }

  const handleNew = () => {
    resetForm()
    setDialogOpen(true)
  }

  const getInsumoUnidad = (insumoId: string) => {
    const insumo = insumos.find(i => i.id === insumoId)
    return insumo?.unidadMedida || ''
  }

  const renderTipoBadge = (tipo: string) => {
    const config = TIPOS_MOVIMIENTO.find(t => t.value === tipo)
    if (!config) return null

    const bgColors = {
      INGRESO: 'bg-green-100 text-green-800',
      EGRESO: 'bg-red-100 text-red-800',
      TRANSFERENCIA: 'bg-blue-100 text-blue-800',
    }

    return (
      <Badge className={bgColors[tipo as keyof typeof bgColors]}>
        {config.label}
      </Badge>
    )
  }

  const validarFormulario = () => {
    if (!formData.insumoId || formData.cantidad <= 0) return false
    
    if (formData.tipo === 'INGRESO' && !formData.depositoDestinoId) return false
    if (formData.tipo === 'EGRESO' && !formData.depositoOrigenId) return false
    if (formData.tipo === 'TRANSFERENCIA' && (!formData.depositoOrigenId || !formData.depositoDestinoId)) return false
    
    return true
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5" />
          Movimientos de Insumos
        </CardTitle>
        <Button onClick={handleNew} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Movimiento
        </Button>
      </CardHeader>
      <CardContent>
        {movimientos.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            No hay movimientos registrados
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Insumo</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead>Observaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell className="text-sm">
                      {new Date(mov.createdAt).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>{renderTipoBadge(mov.tipo)}</TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{mov.insumo.nombre}</span>
                        {mov.insumo.codigo && (
                          <span className="text-stone-500 text-xs ml-1">
                            ({mov.insumo.codigo})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {mov.tipo === 'INGRESO' ? (
                        <span className="text-stone-400">-</span>
                      ) : (
                        mov.depositoOrigen?.nombre || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {mov.tipo === 'EGRESO' ? (
                        <span className="text-stone-400">-</span>
                      ) : (
                        mov.depositoDestino?.nombre || '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {mov.cantidad} {mov.insumo.unidadMedida}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {mov.observaciones || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" maximizable>
          <DialogHeader>
            <DialogTitle>Registrar Movimiento</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label>Tipo de Movimiento *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: 'INGRESO' | 'EGRESO' | 'TRANSFERENCIA') => {
                  setFormData({
                    ...formData,
                    tipo: value,
                    depositoOrigenId: '',
                    depositoDestinoId: '',
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_MOVIMIENTO.map((tipo) => {
                    const Icon = tipo.icon
                    return (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        <span className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${tipo.color}`} />
                          {tipo.label}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Insumo *</Label>
              <Select
                value={formData.insumoId}
                onValueChange={(value) => setFormData({ ...formData, insumoId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar insumo" />
                </SelectTrigger>
                <SelectContent>
                  {insumos.map((ins) => (
                    <SelectItem key={ins.id} value={ins.id}>
                      {ins.codigo ? `${ins.codigo} - ` : ''}{ins.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Depósito Origen - Solo para EGRESO y TRANSFERENCIA */}
            {(formData.tipo === 'EGRESO' || formData.tipo === 'TRANSFERENCIA') && (
              <div>
                <Label>Depósito Origen *</Label>
                <Select
                  value={formData.depositoOrigenId}
                  onValueChange={(value) => setFormData({ ...formData, depositoOrigenId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar depósito origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {depositos
                      .filter(d => d.id !== formData.depositoDestinoId)
                      .map((dep) => (
                        <SelectItem key={dep.id} value={dep.id}>
                          {dep.codigo ? `${dep.codigo} - ` : ''}{dep.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Depósito Destino - Solo para INGRESO y TRANSFERENCIA */}
            {(formData.tipo === 'INGRESO' || formData.tipo === 'TRANSFERENCIA') && (
              <div>
                <Label>Depósito Destino *</Label>
                <Select
                  value={formData.depositoDestinoId}
                  onValueChange={(value) => setFormData({ ...formData, depositoDestinoId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar depósito destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {depositos
                      .filter(d => d.id !== formData.depositoOrigenId)
                      .map((dep) => (
                        <SelectItem key={dep.id} value={dep.id}>
                          {dep.codigo ? `${dep.codigo} - ` : ''}{dep.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Cantidad *</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.cantidad || ''}
                  onChange={(e) => setFormData({ ...formData, cantidad: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
                {formData.insumoId && (
                  <span className="text-sm text-stone-500 min-w-[80px]">
                    {getInsumoUnidad(formData.insumoId)}
                  </span>
                )}
              </div>
            </div>

            <div>
              <Label>Observaciones</Label>
              <Textarea
                value={formData.observaciones || ''}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas adicionales (opcional)"
                rows={2}
              />
            </div>

            {/* Resumen visual del movimiento */}
            <div className="p-3 bg-stone-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm">
                {formData.tipo === 'INGRESO' && (
                  <>
                    <span className="text-green-600 font-medium">Ingreso</span>
                    <ArrowRight className="w-4 h-4" />
                    <span>{formData.depositoDestinoId ? depositos.find(d => d.id === formData.depositoDestinoId)?.nombre : 'Depósito'}</span>
                  </>
                )}
                {formData.tipo === 'EGRESO' && (
                  <>
                    <span>{formData.depositoOrigenId ? depositos.find(d => d.id === formData.depositoOrigenId)?.nombre : 'Depósito'}</span>
                    <ArrowRight className="w-4 h-4" />
                    <span className="text-red-600 font-medium">Egreso</span>
                  </>
                )}
                {formData.tipo === 'TRANSFERENCIA' && (
                  <>
                    <span>{formData.depositoOrigenId ? depositos.find(d => d.id === formData.depositoOrigenId)?.nombre : 'Origen'}</span>
                    <ArrowRight className="w-4 h-4" />
                    <span>{formData.depositoDestinoId ? depositos.find(d => d.id === formData.depositoDestinoId)?.nombre : 'Destino'}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!validarFormulario()}>
              Registrar Movimiento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default MovimientosInsumos
