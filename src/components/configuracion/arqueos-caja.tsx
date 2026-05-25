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
import { Calculator, Plus, Eye, AlertTriangle } from 'lucide-react'

interface ArqueoCaja {
  id: string
  cajaId: string
  caja?: { id: string; nombre: string; moneda: string }
  fecha: string
  saldoSistema: number
  saldoFisico: number
  diferencia: number
  observaciones?: string
  estado: string
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

const ESTADOS_ARQUEO = [
  { value: 'PENDIENTE', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'APROBADO', label: 'Aprobado', color: 'bg-green-100 text-green-800' },
  { value: 'RECHAZADO', label: 'Rechazado', color: 'bg-red-100 text-red-800' },
  { value: 'AJUSTADO', label: 'Ajustado', color: 'bg-blue-100 text-blue-800' },
]

export function ArqueosCaja({ operador }: Props) {
  const [arqueos, setArqueos] = useState<ArqueoCaja[]>([])
  const [cajas, setCajas] = useState<Caja[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedArqueo, setSelectedArqueo] = useState<ArqueoCaja | null>(null)
  const [formData, setFormData] = useState<{
    cajaId: string
    saldoFisico: number
    observaciones: string
  }>({
    cajaId: '',
    saldoFisico: 0,
    observaciones: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [arqueosRes, cajasRes] = await Promise.all([
        fetch('/api/arqueos-caja'),
        fetch('/api/cajas'),
      ])
      
      if (arqueosRes.ok) {
        const data = await arqueosRes.json()
        setArqueos(data)
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
      const selectedCaja = cajas.find(c => c.id === formData.cajaId)
      
      const res = await fetch('/api/arqueos-caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          saldoSistema: selectedCaja?.saldoActual || 0,
          operadorId: operador.id,
        }),
      })

      if (res.ok) {
        fetchData()
        setDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error al guardar arqueo:', error)
    }
  }

  const handleViewDetail = (arqueo: ArqueoCaja) => {
    setSelectedArqueo(arqueo)
    setDetailDialogOpen(true)
  }

  const handleAprobar = async (arqueo: ArqueoCaja) => {
    if (!confirm('¿Aprobar este arqueo?')) return
    
    try {
      const res = await fetch('/api/arqueos-caja', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: arqueo.id, estado: 'APROBADO' }),
      })
      
      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error al aprobar arqueo:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      cajaId: '',
      saldoFisico: 0,
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

  const getEstadoInfo = (estado: string) => {
    return ESTADOS_ARQUEO.find(e => e.value === estado) || { label: estado, color: 'bg-stone-100' }
  }

  const selectedCaja = cajas.find(c => c.id === formData.cajaId)

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Arqueos de Caja
        </CardTitle>
        <Button onClick={handleNew} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Arqueo
        </Button>
      </CardHeader>
      <CardContent>
        {arqueos.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            No hay arqueos registrados
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Caja</TableHead>
                  <TableHead className="text-right">Saldo Sistema</TableHead>
                  <TableHead className="text-right">Saldo Físico</TableHead>
                  <TableHead className="text-right">Diferencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arqueos.map((arqueo) => {
                  const estadoInfo = getEstadoInfo(arqueo.estado)
                  return (
                    <TableRow key={arqueo.id}>
                      <TableCell className="text-sm">
                        {formatDate(arqueo.fecha)}
                      </TableCell>
                      <TableCell>{arqueo.caja?.nombre || '-'}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(arqueo.saldoSistema, arqueo.caja?.moneda)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(arqueo.saldoFisico, arqueo.caja?.moneda)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={`flex items-center justify-end gap-1 ${arqueo.diferencia === 0 ? 'text-green-600' : arqueo.diferencia > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {arqueo.diferencia !== 0 && (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          {formatCurrency(arqueo.diferencia, arqueo.caja?.moneda)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${estadoInfo.color}`}>
                          {estadoInfo.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetail(arqueo)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {arqueo.estado === 'PENDIENTE' && operador.nivel === 'ADMIN' && (
                          <Button variant="ghost" size="sm" onClick={() => handleAprobar(arqueo)}>
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Aprobar</Badge>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Dialog Nuevo Arqueo */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" maximizable>
          <DialogHeader>
            <DialogTitle>Nuevo Arqueo de Caja</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
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
                      {caja.nombre} - Saldo: {formatCurrency(caja.saldoActual, caja.moneda)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCaja && (
              <div className="p-4 bg-stone-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-stone-500 text-sm">Saldo en Sistema</Label>
                    <p className="font-mono font-bold text-lg">
                      {formatCurrency(selectedCaja.saldoActual, selectedCaja.moneda)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-stone-500 text-sm">Moneda</Label>
                    <p className="font-medium">{selectedCaja.moneda}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label>Saldo Físico (Conteo Real) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.saldoFisico}
                onChange={(e) => setFormData({ ...formData, saldoFisico: parseFloat(e.target.value) || 0 })}
                placeholder="Ingrese el monto contado físicamente"
              />
            </div>

            {selectedCaja && formData.saldoFisico !== 0 && (
              <div className={`p-4 rounded-lg ${formData.saldoFisico - selectedCaja.saldoActual === 0 ? 'bg-green-50' : formData.saldoFisico - selectedCaja.saldoActual > 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                <Label className="text-stone-500 text-sm">Diferencia Calculada</Label>
                <p className={`font-mono font-bold text-xl ${formData.saldoFisico - selectedCaja.saldoActual === 0 ? 'text-green-600' : formData.saldoFisico - selectedCaja.saldoActual > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(formData.saldoFisico - selectedCaja.saldoActual, selectedCaja.moneda)}
                </p>
                <p className="text-sm text-stone-500 mt-1">
                  {formData.saldoFisico - selectedCaja.saldoActual === 0 
                    ? '✓ Sin diferencia' 
                    : formData.saldoFisico - selectedCaja.saldoActual > 0 
                      ? '↑ Sobrante' 
                      : '↓ Faltante'}
                </p>
              </div>
            )}

            <div>
              <Label>Observaciones</Label>
              <Input
                value={formData.observaciones || ''}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas sobre el arqueo"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formData.cajaId}>
              Registrar Arqueo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalle */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg" maximizable>
          <DialogHeader>
            <DialogTitle>Detalle del Arqueo</DialogTitle>
          </DialogHeader>
          
          {selectedArqueo && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-stone-500">Fecha</Label>
                  <p className="font-medium">{formatDate(selectedArqueo.fecha)}</p>
                </div>
                <div>
                  <Label className="text-stone-500">Caja</Label>
                  <p className="font-medium">{selectedArqueo.caja?.nombre}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-stone-500">Estado</Label>
                  <p>
                    <Badge className={getEstadoInfo(selectedArqueo.estado).color}>
                      {getEstadoInfo(selectedArqueo.estado).label}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-stone-500">Operador</Label>
                  <p className="font-medium">{selectedArqueo.operador?.nombre || '-'}</p>
                </div>
              </div>

              <div className="p-4 bg-stone-50 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-stone-500">Saldo del Sistema</Label>
                  <span className="font-mono font-medium">
                    {formatCurrency(selectedArqueo.saldoSistema, selectedArqueo.caja?.moneda)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <Label className="text-stone-500">Saldo Físico</Label>
                  <span className="font-mono font-medium">
                    {formatCurrency(selectedArqueo.saldoFisico, selectedArqueo.caja?.moneda)}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <Label className="font-medium">Diferencia</Label>
                  <span className={`font-mono font-bold text-lg ${selectedArqueo.diferencia === 0 ? 'text-green-600' : selectedArqueo.diferencia > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(selectedArqueo.diferencia, selectedArqueo.caja?.moneda)}
                  </span>
                </div>
              </div>

              {selectedArqueo.observaciones && (
                <div>
                  <Label className="text-stone-500">Observaciones</Label>
                  <p className="font-medium">{selectedArqueo.observaciones}</p>
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

export default ArqueosCaja
