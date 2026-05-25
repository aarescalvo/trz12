'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Wallet, Plus, Pencil, Trash2 } from 'lucide-react'

interface Caja {
  id: string
  nombre: string
  codigo?: string
  descripcion?: string
  saldoActual: number
  moneda: string
  responsable?: string
  ubicacion?: string
  activo: boolean
}

interface Props {
  operador: { id: string; nombre: string; nivel: string }
}

const MONEDAS = [
  { value: 'ARS', label: 'Peso Argentino (ARS)' },
  { value: 'USD', label: 'Dólar Estadounidense (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
]

export function Cajas({ operador }: Props) {
  const [cajas, setCajas] = useState<Caja[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCaja, setEditingCaja] = useState<Caja | null>(null)
  const [formData, setFormData] = useState<Partial<Caja>>({
    nombre: '',
    codigo: '',
    descripcion: '',
    saldoActual: 0,
    moneda: 'ARS',
    responsable: '',
    ubicacion: '',
    activo: true,
  })

  useEffect(() => {
    fetchCajas()
  }, [])

  const fetchCajas = async () => {
    try {
      const res = await fetch('/api/cajas')
      if (res.ok) {
        const data = await res.json()
        setCajas(data)
      }
    } catch (error) {
      console.error('Error al cargar cajas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = '/api/cajas'
      const method = editingCaja ? 'PUT' : 'POST'
      const body = editingCaja
        ? { ...formData, id: editingCaja.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        fetchCajas()
        setDialogOpen(false)
        setEditingCaja(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error al guardar caja:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta caja?')) return

    try {
      const res = await fetch(`/api/cajas?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchCajas()
      }
    } catch (error) {
      console.error('Error al eliminar caja:', error)
    }
  }

  const handleEdit = (caja: Caja) => {
    setEditingCaja(caja)
    setFormData(caja)
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      codigo: '',
      descripcion: '',
      saldoActual: 0,
      moneda: 'ARS',
      responsable: '',
      ubicacion: '',
      activo: true,
    })
  }

  const handleNew = () => {
    setEditingCaja(null)
    resetForm()
    setDialogOpen(true)
  }

  const formatCurrency = (amount: number, moneda: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda,
    }).format(amount)
  }

  const getMonedaLabel = (moneda: string) => {
    const found = MONEDAS.find(m => m.value === moneda)
    return found ? found.value : moneda
  }

  const totalSaldo = cajas
    .filter(c => c.activo && c.moneda === 'ARS')
    .reduce((sum, c) => sum + (c.saldoActual || 0), 0)

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Cajas
          {totalSaldo > 0 && (
            <Badge variant="secondary" className="ml-2">
              Total ARS: {formatCurrency(totalSaldo, 'ARS')}
            </Badge>
          )}
        </CardTitle>
        <Button onClick={handleNew} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nueva Caja
        </Button>
      </CardHeader>
      <CardContent>
        {cajas.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            No hay cajas registradas
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Moneda</TableHead>
                <TableHead className="text-right">Saldo Actual</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cajas.map((caja) => (
                <TableRow key={caja.id} className={!caja.activo ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{caja.nombre}</TableCell>
                  <TableCell>{caja.codigo || '-'}</TableCell>
                  <TableCell>{caja.responsable || '-'}</TableCell>
                  <TableCell>{caja.ubicacion || '-'}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs bg-stone-100">
                      {getMonedaLabel(caja.moneda)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className={caja.saldoActual >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(caja.saldoActual || 0, caja.moneda)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      caja.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {caja.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(caja)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(caja.id)}>
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
              {editingCaja ? 'Editar Caja' : 'Nueva Caja'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre || ''}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Caja Principal, Caja Chica"
                />
              </div>
              <div>
                <Label>Código</Label>
                <Input
                  value={formData.codigo || ''}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Ej: C01, CP"
                />
              </div>
            </div>

            <div>
              <Label>Descripción</Label>
              <Input
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción de la caja"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Moneda</Label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={formData.moneda || 'ARS'}
                  onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                >
                  {MONEDAS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Saldo Inicial</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.saldoActual || 0}
                  onChange={(e) => setFormData({ ...formData, saldoActual: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Responsable</Label>
                <Input
                  value={formData.responsable || ''}
                  onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                  placeholder="Nombre del responsable"
                />
              </div>
              <div>
                <Label>Ubicación</Label>
                <Input
                  value={formData.ubicacion || ''}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  placeholder="Ej: Sucursal Centro"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.activo ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
              <Label>Activo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formData.nombre}>
              {editingCaja ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default Cajas
