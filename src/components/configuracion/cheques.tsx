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
import { Banknote, Plus, Pencil, Trash2, Eye, Filter } from 'lucide-react'

interface Cheque {
  id: string
  numero: string
  banco: string
  monto: number
  moneda: string
  fechaEmision: string
  fechaVencimiento: string
  librador?: string
  cuitLibrador?: string
  estado: string
  cuentaBancariaId?: string
  cuentaBancaria?: { id: string; banco: string; numeroCuenta: string }
  observaciones?: string
  fechaDeposito?: string
  fechaCobro?: string
}

interface CuentaBancaria {
  id: string
  banco: string
  numeroCuenta: string
  moneda: string
  activo?: boolean
}

interface Props {
  operador: { id: string; nombre: string; nivel: string }
}

const BANCOS = [
  'Banco Nación',
  'Banco Provincia',
  'Banco Ciudad',
  'Banco Santander',
  'Banco Galicia',
  'Banco BBVA',
  'Banco Macro',
  'Banco Credicoop',
  'Banco Hipotecario',
  'Banco Patagonia',
  'Banco Supervielle',
  'Banco Itaú',
  'Otro',
]

const ESTADOS_CHEQUE = [
  { value: 'RECIBIDO', label: 'Recibido', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'DEPOSITADO', label: 'Depositado', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'COBRADO', label: 'Cobrado', color: 'bg-stone-100 text-stone-800 border-stone-200' },
  { value: 'RECHAZADO', label: 'Rechazado', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'DEVUELTO', label: 'Devuelto', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'ANULADO', label: 'Anulado', color: 'bg-gray-100 text-gray-800 border-gray-200' },
]

const MONEDAS = [
  { value: 'ARS', label: 'Peso Argentino (ARS)' },
  { value: 'USD', label: 'Dólar Estadounidense (USD)' },
]

export function Cheques({ operador }: Props) {
  const [cheques, setCheques] = useState<Cheque[]>([])
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null)
  const [editingCheque, setEditingCheque] = useState<Cheque | null>(null)
  const [filterEstado, setFilterEstado] = useState<string>('all')
  const [filterBanco, setFilterBanco] = useState<string>('all')
  const [formData, setFormData] = useState<Partial<Cheque>>({
    numero: '',
    banco: '',
    monto: 0,
    moneda: 'ARS',
    fechaEmision: '',
    fechaVencimiento: '',
    librador: '',
    cuitLibrador: '',
    estado: 'RECIBIDO',
    cuentaBancariaId: '',
    observaciones: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [chequesRes, cuentasRes] = await Promise.all([
        fetch('/api/cheques'),
        fetch('/api/cuentas-bancarias'),
      ])
      
      if (chequesRes.ok) {
        const data = await chequesRes.json()
        setCheques(data)
      }
      if (cuentasRes.ok) {
        const data = await cuentasRes.json()
        setCuentasBancarias(data.filter((c: CuentaBancaria) => c.activo !== false))
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = '/api/cheques'
      const method = editingCheque ? 'PUT' : 'POST'
      const body = editingCheque
        ? { ...formData, id: editingCheque.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        fetchData()
        setDialogOpen(false)
        setEditingCheque(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error al guardar cheque:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cheque?')) return

    try {
      const res = await fetch(`/api/cheques?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error al eliminar cheque:', error)
    }
  }

  const handleEdit = (cheque: Cheque) => {
    setEditingCheque(cheque)
    setFormData({
      ...cheque,
      fechaEmision: cheque.fechaEmision?.split('T')[0] || '',
      fechaVencimiento: cheque.fechaVencimiento?.split('T')[0] || '',
      fechaDeposito: cheque.fechaDeposito?.split('T')[0] || '',
      fechaCobro: cheque.fechaCobro?.split('T')[0] || '',
    })
    setDialogOpen(true)
  }

  const handleViewDetail = (cheque: Cheque) => {
    setSelectedCheque(cheque)
    setDetailDialogOpen(true)
  }

  const handleCambiarEstado = async (cheque: Cheque, nuevoEstado: string) => {
    const confirmacion = confirm(`¿Cambiar estado a "${ESTADOS_CHEQUE.find(e => e.value === nuevoEstado)?.label}"?`)
    if (!confirmacion) return

    try {
      const updateData: any = { id: cheque.id, estado: nuevoEstado }
      
      if (nuevoEstado === 'DEPOSITADO') {
        updateData.fechaDeposito = new Date().toISOString()
      } else if (nuevoEstado === 'COBRADO') {
        updateData.fechaCobro = new Date().toISOString()
      }

      const res = await fetch('/api/cheques', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      numero: '',
      banco: '',
      monto: 0,
      moneda: 'ARS',
      fechaEmision: '',
      fechaVencimiento: '',
      librador: '',
      cuitLibrador: '',
      estado: 'RECIBIDO',
      cuentaBancariaId: '',
      observaciones: '',
    })
  }

  const handleNew = () => {
    setEditingCheque(null)
    resetForm()
    setDialogOpen(true)
  }

  const formatCurrency = (amount: number, moneda: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getEstadoInfo = (estado: string) => {
    return ESTADOS_CHEQUE.find(e => e.value === estado) || { label: estado, color: 'bg-stone-100' }
  }

  const filteredCheques = cheques.filter(c => {
    if (filterEstado !== 'all' && c.estado !== filterEstado) return false
    if (filterBanco !== 'all' && c.banco !== filterBanco) return false
    return true
  })

  const totalPendiente = filteredCheques
    .filter(c => c.estado === 'RECIBIDO' || c.estado === 'DEPOSITADO')
    .reduce((sum, c) => sum + (c.monto || 0), 0)

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Banknote className="w-5 h-5" />
          Cheques
          {totalPendiente > 0 && (
            <Badge variant="secondary" className="ml-2">
              Pendientes: {formatCurrency(totalPendiente, 'ARS')}
            </Badge>
          )}
        </CardTitle>
        <Button onClick={handleNew} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Cheque
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex gap-4 mb-4 p-4 bg-stone-50 rounded-lg">
          <Filter className="w-4 h-4 text-stone-500 self-center" />
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-stone-600">Estado:</Label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
              >
                <option value="all">Todos</option>
                {ESTADOS_CHEQUE.map((estado) => (
                  <option key={estado.value} value={estado.value}>{estado.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-stone-600">Banco:</Label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={filterBanco}
                onChange={(e) => setFilterBanco(e.target.value)}
              >
                <option value="all">Todos</option>
                {BANCOS.map((banco) => (
                  <option key={banco} value={banco}>{banco}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredCheques.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            No hay cheques registrados
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Emisión</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCheques.map((cheque) => {
                  const estadoInfo = getEstadoInfo(cheque.estado)
                  const diasRestantes = cheque.fechaVencimiento 
                    ? Math.ceil((new Date(cheque.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : null
                  
                  return (
                    <TableRow key={cheque.id} className={cheque.estado === 'RECHAZADO' ? 'bg-red-50' : ''}>
                      <TableCell className="font-mono font-medium">{cheque.numero}</TableCell>
                      <TableCell>{cheque.banco}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(cheque.monto, cheque.moneda)}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(cheque.fechaEmision)}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(cheque.fechaVencimiento)}
                        {diasRestantes !== null && diasRestantes <= 7 && diasRestantes > 0 && cheque.estado === 'RECIBIDO' && (
                          <span className="ml-1 text-xs text-orange-600">({diasRestantes}d)</span>
                        )}
                        {diasRestantes !== null && diasRestantes < 0 && cheque.estado === 'RECIBIDO' && (
                          <span className="ml-1 text-xs text-red-600">(vencido)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs border ${estadoInfo.color}`}>
                          {estadoInfo.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetail(cheque)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(cheque)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(cheque.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
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

      {/* Dialog Nuevo/Editar Cheque */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" maximizable>
          <DialogHeader>
            <DialogTitle>
              {editingCheque ? 'Editar Cheque' : 'Nuevo Cheque'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Número de Cheque *</Label>
                <Input
                  value={formData.numero || ''}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="00000000"
                />
              </div>
              <div>
                <Label>Banco *</Label>
                <Select
                  value={formData.banco || ''}
                  onValueChange={(value) => setFormData({ ...formData, banco: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANCOS.map((banco) => (
                      <SelectItem key={banco} value={banco}>{banco}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Moneda</Label>
                <Select
                  value={formData.moneda || 'ARS'}
                  onValueChange={(value) => setFormData({ ...formData, moneda: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONEDAS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                <Label>Estado</Label>
                <Select
                  value={formData.estado || 'RECIBIDO'}
                  onValueChange={(value) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_CHEQUE.map((estado) => (
                      <SelectItem key={estado.value} value={estado.value}>{estado.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha de Emisión *</Label>
                <Input
                  type="date"
                  value={formData.fechaEmision || ''}
                  onChange={(e) => setFormData({ ...formData, fechaEmision: e.target.value })}
                />
              </div>
              <div>
                <Label>Fecha de Vencimiento *</Label>
                <Input
                  type="date"
                  value={formData.fechaVencimiento || ''}
                  onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Librador</Label>
                <Input
                  value={formData.librador || ''}
                  onChange={(e) => setFormData({ ...formData, librador: e.target.value })}
                  placeholder="Nombre del librador"
                />
              </div>
              <div>
                <Label>CUIT Librador</Label>
                <Input
                  value={formData.cuitLibrador || ''}
                  onChange={(e) => setFormData({ ...formData, cuitLibrador: e.target.value })}
                  placeholder="00-00000000-0"
                />
              </div>
            </div>

            {(formData.estado === 'DEPOSITADO' || formData.estado === 'COBRADO') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cuenta de Depósito</Label>
                  <Select
                    value={formData.cuentaBancariaId || ''}
                    onValueChange={(value) => setFormData({ ...formData, cuentaBancariaId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {cuentasBancarias.map((cuenta) => (
                        <SelectItem key={cuenta.id} value={cuenta.id}>
                          {cuenta.banco} - {cuenta.numeroCuenta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fecha de {formData.estado === 'DEPOSITADO' ? 'Depósito' : 'Cobro'}</Label>
                  <Input
                    type="date"
                    value={formData.estado === 'DEPOSITADO' 
                      ? (formData.fechaDeposito || '').split('T')[0]
                      : (formData.fechaCobro || '').split('T')[0]
                    }
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      [formData.estado === 'DEPOSITADO' ? 'fechaDeposito' : 'fechaCobro']: e.target.value 
                    })}
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Observaciones</Label>
              <Input
                value={formData.observaciones || ''}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas adicionales"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formData.numero || !formData.banco || !formData.monto}>
              {editingCheque ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalle */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg" maximizable>
          <DialogHeader>
            <DialogTitle>Detalle del Cheque</DialogTitle>
          </DialogHeader>
          
          {selectedCheque && (
            <div className="grid gap-4 py-4">
              <div className="p-4 bg-stone-50 rounded-lg flex justify-between items-center">
                <div>
                  <Label className="text-stone-500 text-sm">Número</Label>
                  <p className="font-mono font-bold text-xl">{selectedCheque.numero}</p>
                </div>
                <Badge className={`${getEstadoInfo(selectedCheque.estado).color} text-sm px-3 py-1`}>
                  {getEstadoInfo(selectedCheque.estado).label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-stone-500 text-sm">Banco</Label>
                  <p className="font-medium">{selectedCheque.banco}</p>
                </div>
                <div>
                  <Label className="text-stone-500 text-sm">Monto</Label>
                  <p className="font-mono font-bold text-lg">
                    {formatCurrency(selectedCheque.monto, selectedCheque.moneda)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-stone-500 text-sm">Fecha Emisión</Label>
                  <p className="font-medium">{formatDate(selectedCheque.fechaEmision)}</p>
                </div>
                <div>
                  <Label className="text-stone-500 text-sm">Fecha Vencimiento</Label>
                  <p className="font-medium">{formatDate(selectedCheque.fechaVencimiento)}</p>
                </div>
              </div>

              {(selectedCheque.librador || selectedCheque.cuitLibrador) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-stone-500 text-sm">Librador</Label>
                    <p className="font-medium">{selectedCheque.librador || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-stone-500 text-sm">CUIT Librador</Label>
                    <p className="font-medium">{selectedCheque.cuitLibrador || '-'}</p>
                  </div>
                </div>
              )}

              {selectedCheque.cuentaBancaria && (
                <div>
                  <Label className="text-stone-500 text-sm">Cuenta de Depósito</Label>
                  <p className="font-medium">{selectedCheque.cuentaBancaria.banco} - {selectedCheque.cuentaBancaria.numeroCuenta}</p>
                </div>
              )}

              {selectedCheque.fechaDeposito && (
                <div>
                  <Label className="text-stone-500 text-sm">Fecha de Depósito</Label>
                  <p className="font-medium">{formatDate(selectedCheque.fechaDeposito)}</p>
                </div>
              )}

              {selectedCheque.fechaCobro && (
                <div>
                  <Label className="text-stone-500 text-sm">Fecha de Cobro</Label>
                  <p className="font-medium">{formatDate(selectedCheque.fechaCobro)}</p>
                </div>
              )}

              {selectedCheque.observaciones && (
                <div>
                  <Label className="text-stone-500 text-sm">Observaciones</Label>
                  <p className="font-medium">{selectedCheque.observaciones}</p>
                </div>
              )}

              {/* Acciones rápidas de estado */}
              {selectedCheque.estado === 'RECIBIDO' && (
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      handleCambiarEstado(selectedCheque, 'DEPOSITADO')
                      setDetailDialogOpen(false)
                    }}
                  >
                    Depositar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      handleCambiarEstado(selectedCheque, 'RECHAZADO')
                      setDetailDialogOpen(false)
                    }}
                  >
                    Rechazar
                  </Button>
                </div>
              )}

              {selectedCheque.estado === 'DEPOSITADO' && (
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      handleCambiarEstado(selectedCheque, 'COBRADO')
                      setDetailDialogOpen(false)
                    }}
                  >
                    Marcar Cobrado
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      handleCambiarEstado(selectedCheque, 'RECHAZADO')
                      setDetailDialogOpen(false)
                    }}
                  >
                    Rechazar
                  </Button>
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

export default Cheques
