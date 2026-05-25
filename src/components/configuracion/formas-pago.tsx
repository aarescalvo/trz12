'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { CreditCard, Plus, Pencil, Trash2 } from 'lucide-react'

interface FormaPago {
  id: string
  nombre: string
  codigo?: string
  tipo: string
  requiereReferencia: boolean
  requiereBanco: boolean
  diasCredito?: number
  comision?: number
  activo: boolean
}

interface Props {
  operador: { id: string; nombre: string; nivel: string }
}

const TIPOS_FORMA_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'TARJETA_DEBITO', label: 'Tarjeta de Débito' },
  { value: 'TARJETA_CREDITO', label: 'Tarjeta de Crédito' },
  { value: 'DEPOSITO', label: 'Depósito Bancario' },
  { value: 'RETENCION', label: 'Retención' },
  { value: 'OTRO', label: 'Otro' },
]

export function FormasPago({ operador }: Props) {
  const [formasPago, setFormasPago] = useState<FormaPago[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFormaPago, setEditingFormaPago] = useState<FormaPago | null>(null)
  const [formData, setFormData] = useState<Partial<FormaPago>>({
    nombre: '',
    codigo: '',
    tipo: 'EFECTIVO',
    requiereReferencia: false,
    requiereBanco: false,
    diasCredito: 0,
    comision: 0,
    activo: true,
  })

  useEffect(() => {
    fetchFormasPago()
  }, [])

  const fetchFormasPago = async () => {
    try {
      const res = await fetch('/api/formas-pago')
      if (res.ok) {
        const data = await res.json()
        setFormasPago(data)
      }
    } catch (error) {
      console.error('Error al cargar formas de pago:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = '/api/formas-pago'
      const method = editingFormaPago ? 'PUT' : 'POST'
      const body = editingFormaPago
        ? { ...formData, id: editingFormaPago.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        fetchFormasPago()
        setDialogOpen(false)
        setEditingFormaPago(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error al guardar forma de pago:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta forma de pago?')) return

    try {
      const res = await fetch(`/api/formas-pago?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchFormasPago()
      }
    } catch (error) {
      console.error('Error al eliminar forma de pago:', error)
    }
  }

  const handleEdit = (formaPago: FormaPago) => {
    setEditingFormaPago(formaPago)
    setFormData(formaPago)
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      codigo: '',
      tipo: 'EFECTIVO',
      requiereReferencia: false,
      requiereBanco: false,
      diasCredito: 0,
      comision: 0,
      activo: true,
    })
  }

  const handleNew = () => {
    setEditingFormaPago(null)
    resetForm()
    setDialogOpen(true)
  }

  const getTipoLabel = (tipo: string) => {
    const found = TIPOS_FORMA_PAGO.find(t => t.value === tipo)
    return found ? found.label : tipo
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Formas de Pago
        </CardTitle>
        <Button onClick={handleNew} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nueva Forma de Pago
        </Button>
      </CardHeader>
      <CardContent>
        {formasPago.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            No hay formas de pago registradas
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Días Crédito</TableHead>
                <TableHead>Comisión %</TableHead>
                <TableHead>Requiere</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formasPago.map((formaPago) => (
                <TableRow key={formaPago.id}>
                  <TableCell className="font-medium">{formaPago.nombre}</TableCell>
                  <TableCell>{formaPago.codigo || '-'}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs bg-stone-100">
                      {getTipoLabel(formaPago.tipo)}
                    </span>
                  </TableCell>
                  <TableCell>{formaPago.diasCredito || 0} días</TableCell>
                  <TableCell>{formaPago.comision ? `${formaPago.comision}%` : '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {formaPago.requiereReferencia && (
                        <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">Ref.</span>
                      )}
                      {formaPago.requiereBanco && (
                        <span className="px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-700">Banco</span>
                      )}
                      {!formaPago.requiereReferencia && !formaPago.requiereBanco && '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      formaPago.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {formaPago.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(formaPago)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(formaPago.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" maximizable>
          <DialogHeader>
            <DialogTitle>
              {editingFormaPago ? 'Editar Forma de Pago' : 'Nueva Forma de Pago'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre || ''}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Efectivo, Visa, etc."
                />
              </div>
              <div>
                <Label>Código</Label>
                <Input
                  value={formData.codigo || ''}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Ej: EF, TC, TR"
                />
              </div>
            </div>

            <div>
              <Label>Tipo *</Label>
              <Select
                value={formData.tipo || 'EFECTIVO'}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_FORMA_PAGO.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Días de Crédito</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.diasCredito || 0}
                  onChange={(e) => setFormData({ ...formData, diasCredito: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Comisión %</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.comision || 0}
                  onChange={(e) => setFormData({ ...formData, comision: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.requiereReferencia ?? false}
                  onCheckedChange={(checked) => setFormData({ ...formData, requiereReferencia: checked })}
                />
                <Label>Requiere número de referencia</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.requiereBanco ?? false}
                  onCheckedChange={(checked) => setFormData({ ...formData, requiereBanco: checked })}
                />
                <Label>Requiere banco</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.activo ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
                <Label>Activo</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formData.nombre}>
              {editingFormaPago ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default FormasPago
