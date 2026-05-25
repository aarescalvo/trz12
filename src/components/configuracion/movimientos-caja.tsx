'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { ArrowLeftRight, Plus, Eye, Filter } from 'lucide-react'

interface MovimientoCaja {
  id: string
  cajaId: string
  caja?: { id: string; nombre: string; moneda: string }
  tipo: string
  concepto: string
  monto: number
  saldoAnterior: number
  saldoPosterior: number
  referencia?: string
  observaciones?: string
  fecha: string
  operadorId?: string
  operador?: { id: string; nombre: string }
}

interface Caja {
  id: string
  nombre: string
  moneda: string
  saldoActual: number
  activo?: boolean
}

interface Props {
  operador: { id: string; nombre: string; nivel: string }
}

const TIPOS_MOVIMIENTO = [
  { value: 'INGRESO', label: 'Ingreso', color: 'bg-green-100 text-green-800' },
  { value: 'EGRESO', label: 'Egreso', color: 'bg-red-100 text-red-800' },
  { value: 'TRANSFERENCIA_IN', label: 'Transferencia Recibida', color: 'bg-blue-100 text-blue-800' },
  { value: 'TRANSFERENCIA_OUT', label: 'Transferencia Enviada', color: 'bg-orange-100 text-orange-800' },
  { value: 'AJUSTE', label: 'Ajuste', color: 'bg-purple-100 text-purple-800' },
  { value: 'APERTURA', label: 'Apertura', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'CIERRE', label: 'Cierre', color: 'bg-stone-100 text-stone-800' },
]

export function MovimientosCaja({ operador }: Props) {
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([])
  const [cajas, setCajas] = useState<Caja[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedMovimiento, setSelectedMovimiento] = useState<MovimientoCaja | null>(null)
  const [filterCaja, setFilterCaja] = useState<string>('all')
  const [filterTipo, setFilterTipo] = useState<string>('all')
  const [formData, setFormData] = useState<Partial<MovimientoCaja>>({
    cajaId: '',
    tipo: 'INGRESO',
    concepto: '',
    monto: 0,
    referencia: '',
    observaciones: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [movRes, cajasRes] = await Promise.all([
        fetch('/api/movimientos-caja'),
        fetch('/api/cajas'),
      ])
      
      if (movRes.ok) {
        const data = await movRes.json()
        setMovimientos(data)
      }
      if (cajasRes.ok) {
        const data = await cajasRes.json()
        setCajas(data.filter((c: Caja) => c.activo !== false))
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const res = await fetch('/api/movimientos-caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          operadorId: operador.id,
        }),
      })

      if (res.ok) {
        fetchData()
        setDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error al guardar movimiento:', error)
    }
  }

  const handleViewDetail = (movimiento: MovimientoCaja) => {
    setSelectedMovimiento(movimiento)
    setDetailDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      cajaId: '',
      tipo: 'INGRESO',
      concepto: '',
      monto: 0,
      referencia: '',
      observaciones: '',
    })
  }

  const handleNew = () => {
    resetForm()
    setDialogOpen(true)
  }

  const formatCurrency = (amount: number, moneda: string = 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTipoInfo = (tipo: string) => {
    return TIPOS_MOVIMIENTO.find(t => t.value === tipo) || { label: tipo, color: 'bg-stone-100' }
  }

  const filteredMovimientos = movimientos.filter(m => {
    if (filterCaja !== 'all' && m.cajaId !== filterCaja) return false
    if (filterTipo !== 'all' && m.tipo !== filterTipo) return false
    return true
  })

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5" />
          Movimientos de Caja
        </CardTitle>
        <Button onClick={handleNew} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Movimiento
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex gap-4 mb-4 p-4 bg-stone-50 rounded-lg">
          <Filter className="w-4 h-4 text-stone-500 self-center" />
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-stone-600">Caja:</Label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={filterCaja}
                onChange={(e) => setFilterCaja(e.target.value)}
              >
                <option value="all">Todas</option>
                {cajas.map((caja) => (
                  <option key={caja.id} value={caja.id}>{caja.nombre}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-stone-600">Tipo:</Label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
              >
                <option value="all">Todos</option>
                {TIPOS_MOVIMIENTO.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredMovimientos.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            No hay movimientos registrados
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Caja</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Saldo Post.</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovimientos.map((movimiento) => {
                  const tipoInfo = getTipoInfo(movimiento.tipo)
                  return (
                    <TableRow key={movimiento.id}>
                      <TableCell className="text-sm">
                        {formatDate(movimiento.fecha)}
                      </TableCell>
                      <TableCell>{movimiento.caja?.nombre || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${tipoInfo.color}`}>
                          {tipoInfo.label}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {movimiento.concepto}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={movimiento.tipo.includes('EGRESO') || movimiento.tipo.includes('OUT') ? 'text-red-600' : 'text-green-600'}>
                          {movimiento.tipo.includes('EGRESO') || movimiento.tipo.includes('OUT') ? '-' : '+'}
                          {formatCurrency(movimiento.monto, movimiento.caja?.moneda)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(movimiento.saldoPosterior, movimiento.caja?.moneda)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetail(movimiento)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Dialog Nuevo Movimiento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" maximizable>
          <DialogHeader>
            <DialogTitle>Nuevo Movimiento de Caja</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Caja *</Label>
                <Select
                  value={formData.cajaId || ''}
                  onValueChange={(value) => setFormData({ ...formData, cajaId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar caja" />
                  </SelectTrigger>
                  <SelectContent>
                    {cajas.map((caja) => (
                      <SelectItem key={caja.id} value={caja.id}>
                        {caja.nombre} ({formatCurrency(caja.saldoActual, caja.moneda)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select
                  value={formData.tipo || 'INGRESO'}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_MOVIMIENTO.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Concepto *</Label>
              <Input
                value={formData.concepto || ''}
                onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                placeholder="Descripción del movimiento"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Monto *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monto || 0}
                  onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Referencia</Label>
                <Input
                  value={formData.referencia || ''}
                  onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                  placeholder="Nº de comprobante, etc."
                />
              </div>
            </div>

            <div>
              <Label>Observaciones</Label>
              <Input
                value={formData.observaciones || ''}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formData.cajaId || !formData.concepto || !formData.monto}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalle */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg" maximizable>
          <DialogHeader>
            <DialogTitle>Detalle del Movimiento</DialogTitle>
          </DialogHeader>
          
          {selectedMovimiento && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-stone-500">Fecha</Label>
                  <p className="font-medium">{formatDate(selectedMovimiento.fecha)}</p>
                </div>
                <div>
                  <Label className="text-stone-500">Caja</Label>
                  <p className="font-medium">{selectedMovimiento.caja?.nombre}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-stone-500">Tipo</Label>
                  <p>
                    <Badge className={getTipoInfo(selectedMovimiento.tipo).color}>
                      {getTipoInfo(selectedMovimiento.tipo).label}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-stone-500">Operador</Label>
                  <p className="font-medium">{selectedMovimiento.operador?.nombre || '-'}</p>
                </div>
              </div>

              <div>
                <Label className="text-stone-500">Concepto</Label>
                <p className="font-medium">{selectedMovimiento.concepto}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-stone-50 rounded-lg">
                <div>
                  <Label className="text-stone-500 text-sm">Saldo Anterior</Label>
                  <p className="font-mono font-medium">
                    {formatCurrency(selectedMovimiento.saldoAnterior, selectedMovimiento.caja?.moneda)}
                  </p>
                </div>
                <div>
                  <Label className="text-stone-500 text-sm">Monto</Label>
                  <p className={`font-mono font-medium ${selectedMovimiento.tipo.includes('EGRESO') || selectedMovimiento.tipo.includes('OUT') ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedMovimiento.tipo.includes('EGRESO') || selectedMovimiento.tipo.includes('OUT') ? '-' : '+'}
                    {formatCurrency(selectedMovimiento.monto, selectedMovimiento.caja?.moneda)}
                  </p>
                </div>
                <div>
                  <Label className="text-stone-500 text-sm">Saldo Posterior</Label>
                  <p className="font-mono font-medium">
                    {formatCurrency(selectedMovimiento.saldoPosterior, selectedMovimiento.caja?.moneda)}
                  </p>
                </div>
              </div>

              {selectedMovimiento.referencia && (
                <div>
                  <Label className="text-stone-500">Referencia</Label>
                  <p className="font-medium">{selectedMovimiento.referencia}</p>
                </div>
              )}

              {selectedMovimiento.observaciones && (
                <div>
                  <Label className="text-stone-500">Observaciones</Label>
                  <p className="font-medium">{selectedMovimiento.observaciones}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default MovimientosCaja
