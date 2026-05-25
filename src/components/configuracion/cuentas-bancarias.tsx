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
import { Building, Plus, Pencil, Trash2 } from 'lucide-react'

interface CuentaBancaria {
  id: string
  banco: string
  tipoCuenta: string
  numeroCuenta: string
  cbu?: string
  alias?: string
  titular?: string
  cuitTitular?: string
  saldoActual: number
  moneda: string
  sucursal?: string
  observaciones?: string
  activo: boolean
}

interface Props {
  operador: { id: string; nombre: string; nivel: string }
}

const BANCOS = [
  'CMF',
  'Macro',
  'Patagonia',
]

const TIPOS_CUENTA = [
  { value: 'CAJA_AHORRO', label: 'Caja de Ahorro' },
  { value: 'CUENTA_CORRIENTE', label: 'Cuenta Corriente' },
  { value: 'CUENTA_SUELDO', label: 'Cuenta Sueldo' },
]

const MONEDAS = [
  { value: 'ARS', label: 'Peso Argentino (ARS)' },
  { value: 'USD', label: 'Dólar Estadounidense (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
]

export function CuentasBancarias({ operador }: Props) {
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCuenta, setEditingCuenta] = useState<CuentaBancaria | null>(null)
  const [formData, setFormData] = useState<Partial<CuentaBancaria>>({
    banco: '',
    tipoCuenta: 'CAJA_AHORRO',
    numeroCuenta: '',
    cbu: '',
    alias: '',
    titular: '',
    cuitTitular: '',
    saldoActual: 0,
    moneda: 'ARS',
    sucursal: '',
    observaciones: '',
    activo: true,
  })

  useEffect(() => {
    fetchCuentas()
  }, [])

  const fetchCuentas = async () => {
    try {
      const res = await fetch('/api/cuentas-bancarias')
      if (res.ok) {
        const data = await res.json()
        setCuentas(data)
      }
    } catch (error) {
      console.error('Error al cargar cuentas bancarias:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = '/api/cuentas-bancarias'
      const method = editingCuenta ? 'PUT' : 'POST'
      const body = editingCuenta
        ? { ...formData, id: editingCuenta.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        fetchCuentas()
        setDialogOpen(false)
        setEditingCuenta(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error al guardar cuenta bancaria:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta cuenta bancaria?')) return

    try {
      const res = await fetch(`/api/cuentas-bancarias?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchCuentas()
      }
    } catch (error) {
      console.error('Error al eliminar cuenta bancaria:', error)
    }
  }

  const handleEdit = (cuenta: CuentaBancaria) => {
    setEditingCuenta(cuenta)
    setFormData(cuenta)
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      banco: '',
      tipoCuenta: 'CAJA_AHORRO',
      numeroCuenta: '',
      cbu: '',
      alias: '',
      titular: '',
      cuitTitular: '',
      saldoActual: 0,
      moneda: 'ARS',
      sucursal: '',
      observaciones: '',
      activo: true,
    })
  }

  const handleNew = () => {
    setEditingCuenta(null)
    resetForm()
    setDialogOpen(true)
  }

  const formatCurrency = (amount: number, moneda: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda,
    }).format(amount)
  }

  const getTipoCuentaLabel = (tipo: string) => {
    const found = TIPOS_CUENTA.find(t => t.value === tipo)
    return found ? found.label : tipo
  }

  const getMonedaLabel = (moneda: string) => {
    const found = MONEDAS.find(m => m.value === moneda)
    return found ? found.value : moneda
  }

  const maskCbu = (cbu: string) => {
    if (!cbu || cbu.length < 8) return cbu
    return cbu.slice(0, 4) + '*****' + cbu.slice(-4)
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          Cuentas Bancarias
        </CardTitle>
        <Button onClick={handleNew} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nueva Cuenta
        </Button>
      </CardHeader>
      <CardContent>
        {cuentas.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            No hay cuentas bancarias registradas
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banco</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>N° Cuenta</TableHead>
                <TableHead>CBU</TableHead>
                <TableHead>Titular</TableHead>
                <TableHead>Moneda</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cuentas.map((cuenta) => (
                <TableRow key={cuenta.id} className={!cuenta.activo ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{cuenta.banco}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs bg-stone-100">
                      {getTipoCuentaLabel(cuenta.tipoCuenta)}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{cuenta.numeroCuenta || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">{maskCbu(cuenta.cbu || '')}</TableCell>
                  <TableCell>{cuenta.titular || '-'}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs bg-stone-100">
                      {getMonedaLabel(cuenta.moneda)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className={cuenta.saldoActual >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(cuenta.saldoActual || 0, cuenta.moneda)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      cuenta.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {cuenta.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(cuenta)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(cuenta.id)}>
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
        <DialogContent className="max-w-2xl" maximizable>
          <DialogHeader>
            <DialogTitle>
              {editingCuenta ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Banco *</Label>
                <Select
                  value={formData.banco || ''}
                  onValueChange={(value) => setFormData({ ...formData, banco: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANCOS.map((banco) => (
                      <SelectItem key={banco} value={banco}>{banco}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Cuenta *</Label>
                <Select
                  value={formData.tipoCuenta || 'CAJA_AHORRO'}
                  onValueChange={(value) => setFormData({ ...formData, tipoCuenta: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CUENTA.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Número de Cuenta</Label>
                <Input
                  value={formData.numeroCuenta || ''}
                  onChange={(e) => setFormData({ ...formData, numeroCuenta: e.target.value })}
                  placeholder="Número de cuenta"
                />
              </div>
              <div>
                <Label>Sucursal</Label>
                <Input
                  value={formData.sucursal || ''}
                  onChange={(e) => setFormData({ ...formData, sucursal: e.target.value })}
                  placeholder="Sucursal bancaria"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CBU</Label>
                <Input
                  value={formData.cbu || ''}
                  onChange={(e) => setFormData({ ...formData, cbu: e.target.value })}
                  placeholder="22 dígitos"
                  maxLength={22}
                />
              </div>
              <div>
                <Label>Alias CVU/CBU</Label>
                <Input
                  value={formData.alias || ''}
                  onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                  placeholder="Alias bancario"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Titular</Label>
                <Input
                  value={formData.titular || ''}
                  onChange={(e) => setFormData({ ...formData, titular: e.target.value })}
                  placeholder="Nombre del titular"
                />
              </div>
              <div>
                <Label>CUIT Titular</Label>
                <Input
                  value={formData.cuitTitular || ''}
                  onChange={(e) => setFormData({ ...formData, cuitTitular: e.target.value })}
                  placeholder="00-00000000-0"
                />
              </div>
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

            <div>
              <Label>Observaciones</Label>
              <Input
                value={formData.observaciones || ''}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas adicionales"
              />
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
            <Button onClick={handleSave} disabled={!formData.banco}>
              {editingCuenta ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default CuentasBancarias
