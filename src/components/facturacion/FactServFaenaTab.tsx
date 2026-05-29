'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Beef, DollarSign, CreditCard, AlertTriangle, Filter,
  FileDown, RefreshCw, Loader2, Pencil, Users, Search,
  FileSpreadsheet, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

// ==================== TYPES ====================
interface TropaRel {
  id: string
  numero: number
  codigo: string
  estado: string
}

interface UsuarioFaena {
  id: string
  nombre: string
  razonSocial: string | null
  cuit: string | null
}

interface PlanillaServicioFaena {
  id: string
  tropaId?: string | null
  tropa?: TropaRel | null
  usuarioFaenaId?: string | null
  usuarioFaena?: UsuarioFaena | null
  numeroTropa: number
  usuario: string
  cantidadAnimales: number
  kgPie: number
  fechaFaena: string
  kgGancho: number
  rindePorcentaje: number
  precioServicioKg: number
  precioServicioKgConRecupero: number | null
  totalServicioIva: number
  tasaInspeccionVet: number
  arancelIpcva: number
  totalFacturaImp: number
  numeroFactura: string | null
  fechaFactura: string | null
  fechaPago: string | null
  diasPago: number | null
  montoDepositado: number | null
  estadoPago: number
  observaciones: string | null
}

interface Resumen {
  totalFacturado: number
  totalDepositado: number
  saldoPendiente: number
  totalTropas: number
  totalCabezas: number
  totalKgGancho: number
  pagadas: number
  pendientes: number
  promPrecioKg: number
}

interface PorClienteEntry {
  tropas: number
  cabezas: number
  totalFacturado: number
  totalDepositado: number
  saldo: number
}

type PorCliente = Record<string, PorClienteEntry>

interface EditFormData {
  numeroTropa: number
  usuario: string
  cantidadAnimales: number
  kgPie: number
  kgGancho: number
  fechaFaena: string
  precioServicioKg: number
  precioServicioKgConRecupero: string
  totalServicioIva: number
  tasaInspeccionVet: number
  arancelIpcva: number
  totalFacturaImp: number
  numeroFactura: string
  fechaFactura: string
  fechaPago: string
  diasPago: number
  montoDepositado: number
  estadoPago: number
  observaciones: string
}

interface Props { operador?: { id: string; nombre: string; rol: string } }

const ESTADO_PAGO_OPTIONS = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'PAGADO', label: 'Pagado' },
  { value: 'PENDIENTE', label: 'Pendiente' },
]

// ==================== HELPERS ====================
const currencyFmt = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)

const numberFmt = (amount: number, decimals: number = 0) =>
  new Intl.NumberFormat('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount)

const dateFmt = (dateStr: string | null) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-AR')
}

const toDateInput = (dateStr: string | null) => {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().split('T')[0]
}

// ==================== COMPONENT ====================
export function FactServFaenaTab({ operador }: Props) {
  // Data state
  const [planillas, setPlanillas] = useState<PlanillaServicioFaena[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [porCliente, setPorCliente] = useState<PorCliente>({})
  const [loading, setLoading] = useState(true)

  // Filter state
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [filtroTropaDesde, setFiltroTropaDesde] = useState('')
  const [filtroTropaHasta, setFiltroTropaHasta] = useState('')
  const [filtroEstadoPago, setFiltroEstadoPago] = useState('TODOS')
  const [searchTerm, setSearchTerm] = useState('')

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false)
  const [editData, setEditData] = useState<EditFormData | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // ==================== DATA FETCHING ====================
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroDesde) params.append('desde', filtroDesde)
      if (filtroHasta) params.append('hasta', filtroHasta)
      if (filtroTropaDesde) params.append('tropaDesde', filtroTropaDesde)
      if (filtroTropaHasta) params.append('tropaHasta', filtroTropaHasta)
      if (filtroEstadoPago !== 'TODOS') params.append('estadoPago', filtroEstadoPago)

      const res = await fetch(`/api/facturacion/planilla-servicio-faena?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setPlanillas(data.data || [])
        setResumen(data.resumen || null)
        setPorCliente(data.porCliente || {})
      } else {
        toast.error(data.error || 'Error al cargar datos')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos del servicio faena')
    } finally {
      setLoading(false)
    }
  }, [filtroDesde, filtroHasta, filtroTropaDesde, filtroTropaHasta, filtroEstadoPago])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ==================== CLIENT-SIDE FILTERING ====================
  const filtered = planillas.filter(p => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      p.usuario.toLowerCase().includes(term) ||
      String(p.numeroTropa).includes(term) ||
      (p.numeroFactura || '').toLowerCase().includes(term) ||
      (p.observaciones || '').toLowerCase().includes(term)
    )
  })

  // ==================== CLEAR FILTERS ====================
  const handleClearFilters = () => {
    setFiltroDesde('')
    setFiltroHasta('')
    setFiltroTropaDesde('')
    setFiltroTropaHasta('')
    setFiltroEstadoPago('TODOS')
    setSearchTerm('')
  }

  // ==================== EXPORT CSV ====================
  const handleExportCSV = () => {
    if (!filtered.length) {
      toast.error('No hay datos para exportar')
      return
    }
    const headers = [
      'N° Tropa', 'Usuario', 'Cant.', 'Kg Pie', 'Fecha Faena',
      'Kg Gancho', 'Rinde %', '$/kg', 'Total +IVA', 'Tasa Insp.',
      'Arancel', 'Total Fact.', 'N° Factura', 'Fecha Fact.',
      'Fecha Pago', 'Días', 'Depositado', 'Estado Pago', 'Obs.'
    ]
    const rows = filtered.map(p => [
      p.numeroTropa,
      p.usuario,
      p.cantidadAnimales,
      p.kgPie.toFixed(1),
      dateFmt(p.fechaFaena),
      p.kgGancho.toFixed(1),
      p.rindePorcentaje.toFixed(1),
      p.precioServicioKg,
      p.totalServicioIva.toFixed(2),
      p.tasaInspeccionVet.toFixed(2),
      p.arancelIpcva.toFixed(2),
      p.totalFacturaImp.toFixed(2),
      p.numeroFactura || '',
      dateFmt(p.fechaFactura),
      dateFmt(p.fechaPago),
      p.diasPago ?? '',
      p.montoDepositado?.toFixed(2) ?? '',
      p.estadoPago,
      p.observaciones || '',
    ])
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `planilla_servicio_faena_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Archivo CSV descargado')
  }

  // ==================== EDIT DIALOG ====================
  const handleOpenEdit = (record: PlanillaServicioFaena) => {
    setEditId(record.id)
    setEditData({
      numeroTropa: record.numeroTropa,
      usuario: record.usuario,
      cantidadAnimales: record.cantidadAnimales,
      kgPie: record.kgPie,
      kgGancho: record.kgGancho,
      fechaFaena: toDateInput(record.fechaFaena),
      precioServicioKg: record.precioServicioKg,
      precioServicioKgConRecupero: record.precioServicioKgConRecupero != null ? String(record.precioServicioKgConRecupero) : '',
      totalServicioIva: record.totalServicioIva,
      tasaInspeccionVet: record.tasaInspeccionVet,
      arancelIpcva: record.arancelIpcva,
      totalFacturaImp: record.totalFacturaImp,
      numeroFactura: record.numeroFactura || '',
      fechaFactura: toDateInput(record.fechaFactura),
      fechaPago: toDateInput(record.fechaPago),
      diasPago: record.diasPago ?? 0,
      montoDepositado: record.montoDepositado ?? 0,
      estadoPago: record.estadoPago,
      observaciones: record.observaciones || '',
    })
    setEditOpen(true)
  }

  const handleEditChange = (field: keyof EditFormData, value: string | number) => {
    if (!editData) return
    setEditData({ ...editData, [field]: value })
  }

  const handleSaveEdit = async () => {
    if (!editId || !editData) return
    setSaving(true)
    try {
      const payload: Record<string, any> = {
        usuario: editData.usuario,
        cantidadAnimales: Number(editData.cantidadAnimales) || 0,
        kgPie: Number(editData.kgPie) || 0,
        kgGancho: Number(editData.kgGancho) || 0,
        fechaFaena: editData.fechaFaena || null,
        precioServicioKg: Number(editData.precioServicioKg) || 0,
        precioServicioKgConRecupero: editData.precioServicioKgConRecupero ? Number(editData.precioServicioKgConRecupero) : null,
        totalServicioIva: Number(editData.totalServicioIva) || 0,
        tasaInspeccionVet: Number(editData.tasaInspeccionVet) || 0,
        arancelIpcva: Number(editData.arancelIpcva) || 0,
        totalFacturaImp: Number(editData.totalFacturaImp) || 0,
        numeroFactura: editData.numeroFactura || null,
        fechaFactura: editData.fechaFactura || null,
        fechaPago: editData.fechaPago || null,
        diasPago: editData.diasPago != null ? Number(editData.diasPago) : null,
        montoDepositado: editData.montoDepositado != null ? Number(editData.montoDepositado) : null,
        estadoPago: Number(editData.estadoPago),
        observaciones: editData.observaciones || null,
      }

      const res = await fetch(`/api/facturacion/planilla-servicio-faena/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Registro actualizado exitosamente')
        setEditOpen(false)
        setEditId(null)
        setEditData(null)
        fetchData()
      } else {
        toast.error(data.error || 'Error al actualizar registro')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al guardar cambios')
    } finally {
      setSaving(false)
    }
  }

  // ==================== RENDER ====================
  return (
    <div className="space-y-4">
      {/* KPIs Row */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Total Facturado */}
          <Card className="border-0 shadow-sm bg-emerald-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-200/60 rounded-lg">
                  <DollarSign className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold">Total Facturado</p>
                  <p className="text-lg font-bold text-emerald-800">{currencyFmt(resumen.totalFacturado)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Depositado */}
          <Card className="border-0 shadow-sm bg-blue-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-200/60 rounded-lg">
                  <CreditCard className="w-4 h-4 text-blue-700" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-blue-600 font-semibold">Total Depositado</p>
                  <p className="text-lg font-bold text-blue-800">{currencyFmt(resumen.totalDepositado)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Saldo Pendiente */}
          <Card className={`border-0 shadow-sm ${resumen.saldoPendiente < 0 ? 'bg-red-50' : 'bg-amber-50'}`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${resumen.saldoPendiente < 0 ? 'bg-red-200/60' : 'bg-amber-200/60'}`}>
                  <AlertTriangle className={`w-4 h-4 ${resumen.saldoPendiente < 0 ? 'text-red-700' : 'text-amber-700'}`} />
                </div>
                <div>
                  <p className={`text-[10px] uppercase tracking-wider font-semibold ${resumen.saldoPendiente < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                    Saldo Pendiente
                  </p>
                  <p className={`text-lg font-bold ${resumen.saldoPendiente < 0 ? 'text-red-800' : 'text-amber-800'}`}>
                    {currencyFmt(resumen.saldoPendiente)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tropas */}
          <Card className="border-0 shadow-sm bg-amber-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-200/60 rounded-lg">
                  <Beef className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold">Tropas Facturadas</p>
                  <p className="text-lg font-bold text-amber-800">{numberFmt(resumen.totalTropas)}</p>
                  <p className="text-[10px] text-amber-600">
                    <span className="text-emerald-600">{resumen.pagadas} pag.</span>
                    {' / '}
                    <span className="text-red-600">{resumen.pendientes} pend.</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-stone-500" />
            <span className="text-sm font-semibold text-stone-700">Filtros</span>
            <div className="flex-1" />
          </div>

          <div className="flex flex-wrap gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Fecha desde</Label>
              <Input
                type="date"
                value={filtroDesde}
                onChange={e => setFiltroDesde(e.target.value)}
                className="h-9 w-36"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fecha hasta</Label>
              <Input
                type="date"
                value={filtroHasta}
                onChange={e => setFiltroHasta(e.target.value)}
                className="h-9 w-36"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tropa desde</Label>
              <Input
                type="number"
                placeholder="N°"
                value={filtroTropaDesde}
                onChange={e => setFiltroTropaDesde(e.target.value)}
                className="h-9 w-24"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tropa hasta</Label>
              <Input
                type="number"
                placeholder="N°"
                value={filtroTropaHasta}
                onChange={e => setFiltroTropaHasta(e.target.value)}
                className="h-9 w-24"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Estado Pago</Label>
              <Select value={filtroEstadoPago} onValueChange={setFiltroEstadoPago}>
                <SelectTrigger className="h-9 w-32">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADO_PAGO_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <Input
                  placeholder="Usuario, tropa..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="h-9 pl-8 w-44"
                />
              </div>
            </div>

            <Button
              size="sm"
              className="h-9 bg-amber-500 hover:bg-amber-600"
              onClick={fetchData}
              disabled={loading}
            >
              <Search className="w-3.5 h-3.5 mr-1" /> Buscar
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={handleClearFilters}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Limpiar
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={handleExportCSV} disabled={!filtered.length}>
              <FileDown className="w-3.5 h-3.5 mr-1" /> Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-500" />
                Planilla Servicio Faena
              </CardTitle>
              <CardDescription>
                {loading
                  ? 'Cargando...'
                  : `${filtered.length} registros${searchTerm ? ` (filtrados de ${planillas.length})` : ''}`
                }
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!filtered.length}>
                <FileDown className="w-4 h-4 mr-1" /> CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
            <Table className="text-xs">
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-stone-50 hover:bg-stone-50">
                  <TableHead className="sticky left-0 bg-stone-50 z-20 min-w-[60px] text-xs font-semibold text-center">
                    N° Tropa
                  </TableHead>
                  <TableHead className="min-w-[160px] text-xs font-semibold">Usuario</TableHead>
                  <TableHead className="min-w-[45px] text-xs font-semibold text-center">Cant.</TableHead>
                  <TableHead className="min-w-[65px] text-xs font-semibold text-right">Kg Pie</TableHead>
                  <TableHead className="min-w-[80px] text-xs font-semibold">Fecha Faena</TableHead>
                  <TableHead className="min-w-[70px] text-xs font-semibold text-right">Kg Gancho</TableHead>
                  <TableHead className="min-w-[55px] text-xs font-semibold text-right">Rinde %</TableHead>
                  <TableHead className="min-w-[50px] text-xs font-semibold text-right">$/kg</TableHead>
                  <TableHead className="min-w-[90px] text-xs font-semibold text-right">Total +IVA</TableHead>
                  <TableHead className="min-w-[70px] text-xs font-semibold text-right">Tasa Insp.</TableHead>
                  <TableHead className="min-w-[65px] text-xs font-semibold text-right">Arancel</TableHead>
                  <TableHead className="min-w-[100px] text-xs font-semibold text-right bg-emerald-50/50">Total Fact.</TableHead>
                  <TableHead className="min-w-[110px] text-xs font-semibold">N° Factura</TableHead>
                  <TableHead className="min-w-[80px] text-xs font-semibold">Fecha Fact.</TableHead>
                  <TableHead className="min-w-[80px] text-xs font-semibold">Fecha Pago</TableHead>
                  <TableHead className="min-w-[40px] text-xs font-semibold text-center">Días</TableHead>
                  <TableHead className="min-w-[90px] text-xs font-semibold text-right">Depositado</TableHead>
                  <TableHead className="min-w-[55px] text-xs font-semibold text-center">Est. Pago</TableHead>
                  <TableHead className="min-w-[60px] text-xs font-semibold">Obs.</TableHead>
                  <TableHead className="min-w-[40px] text-xs font-semibold text-center">Acc.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={20} className="text-center py-12">
                      <Loader2 className="w-8 h-8 mx-auto animate-spin text-amber-500" />
                      <p className="mt-2 text-stone-400 text-sm">Cargando datos...</p>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={20} className="text-center py-12 text-stone-400">
                      <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                      No se encontraron registros con los filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(p => {
                    const isPagado = p.estadoPago === 0
                    return (
                      <TableRow key={p.id} className={`hover:bg-stone-50 ${!isPagado ? 'bg-amber-50/30' : ''}`}>
                        {/* Sticky N° Tropa */}
                        <TableCell className="sticky left-0 bg-white z-10 font-mono font-bold text-center">
                          {p.numeroTropa}
                        </TableCell>
                        <TableCell className="font-medium">{p.usuario}</TableCell>
                        <TableCell className="text-center">{p.cantidadAnimales}</TableCell>
                        <TableCell className="text-right font-mono">{numberFmt(p.kgPie, 0)}</TableCell>
                        <TableCell className="whitespace-nowrap">{dateFmt(p.fechaFaena)}</TableCell>
                        <TableCell className="text-right font-mono">{numberFmt(p.kgGancho, 1)}</TableCell>
                        <TableCell className="text-right font-mono">{p.rindePorcentaje.toFixed(1)}%</TableCell>
                        <TableCell className="text-right font-mono">${numberFmt(p.precioServicioKg)}</TableCell>
                        <TableCell className="text-right font-mono">{currencyFmt(p.totalServicioIva)}</TableCell>
                        <TableCell className="text-right font-mono">{currencyFmt(p.tasaInspeccionVet)}</TableCell>
                        <TableCell className="text-right font-mono">{currencyFmt(p.arancelIpcva)}</TableCell>
                        <TableCell className="text-right font-mono font-bold bg-emerald-50/50 text-emerald-800">
                          {currencyFmt(p.totalFacturaImp)}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] whitespace-nowrap">{p.numeroFactura || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">{dateFmt(p.fechaFactura)}</TableCell>
                        <TableCell className="whitespace-nowrap">{dateFmt(p.fechaPago)}</TableCell>
                        <TableCell className="text-center">{p.diasPago ?? '-'}</TableCell>
                        <TableCell className="text-right font-mono">{p.montoDepositado != null ? currencyFmt(p.montoDepositado) : '-'}</TableCell>
                        <TableCell className="text-center">
                          {isPagado ? (
                            <Badge className="bg-emerald-100 text-emerald-700 text-[10px] py-0 px-1.5">OK</Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 text-[10px] py-0 px-1.5">{p.estadoPago}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[80px] truncate text-[10px]" title={p.observaciones || ''}>
                          {p.observaciones || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleOpenEdit(p)}
                          >
                            <Pencil className="w-3.5 h-3.5 text-stone-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Totals Footer */}
          {!loading && filtered.length > 0 && (
            <div className="border-t px-3 py-2 bg-stone-50 text-xs">
              <div className="flex flex-wrap gap-4 items-center">
                <span className="font-semibold text-stone-600">
                  {filtered.length} tropas | {filtered.reduce((s, p) => s + p.cantidadAnimales, 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })} cabezas
                </span>
                <span className="text-stone-500">
                  Kg Gancho: <strong>{numberFmt(filtered.reduce((s, p) => s + p.kgGancho, 0), 1)}</strong>
                </span>
                <span className="text-stone-500">
                  Total +IVA: <strong>{currencyFmt(filtered.reduce((s, p) => s + p.totalServicioIva, 0))}</strong>
                </span>
                <span className="text-emerald-700 font-bold">
                  Total Fact.: {currencyFmt(filtered.reduce((s, p) => s + p.totalFacturaImp, 0))}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen por Cliente Card */}
      {porCliente && Object.keys(porCliente).length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Resumen por Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
              <Table className="text-xs">
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="bg-blue-50 hover:bg-blue-50">
                    <TableHead className="text-xs font-semibold">Usuario</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Tropas</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Cabezas</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Total Facturado</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Total Depositado</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(porCliente).map(([cliente, data]) => (
                    <TableRow key={cliente} className="hover:bg-stone-50">
                      <TableCell className="font-medium">{cliente}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-[10px]">{data.tropas}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{numberFmt(data.cabezas)}</TableCell>
                      <TableCell className="text-right font-mono">{currencyFmt(data.totalFacturado)}</TableCell>
                      <TableCell className="text-right font-mono text-blue-600">{currencyFmt(data.totalDepositado)}</TableCell>
                      <TableCell className={`text-right font-mono font-semibold ${data.saldo < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {currencyFmt(data.saldo)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================== EDIT DIALOG ==================== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-amber-500" />
              Editar Planilla — Tropa N° {editData?.numeroTropa}
            </DialogTitle>
            <DialogDescription>
              Modifique los campos deseados y guarde los cambios.
            </DialogDescription>
          </DialogHeader>

          {editData && (
            <div className="space-y-4">
              {/* Row 1: Tropa + Usuario */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">N° Tropa</Label>
                  <Input value={editData.numeroTropa} readOnly className="h-9 bg-stone-50" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Usuario</Label>
                  <Input
                    value={editData.usuario}
                    onChange={e => handleEditChange('usuario', e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Row 2: Cant + Kg Pie + Kg Gancho + Fecha Faena */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Cantidad Animales</Label>
                  <Input
                    type="number"
                    value={editData.cantidadAnimales}
                    onChange={e => handleEditChange('cantidadAnimales', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Kg Pie</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editData.kgPie}
                    onChange={e => handleEditChange('kgPie', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Kg Gancho</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editData.kgGancho}
                    onChange={e => handleEditChange('kgGancho', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Fecha Faena</Label>
                  <Input
                    type="date"
                    value={editData.fechaFaena}
                    onChange={e => handleEditChange('fechaFaena', e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Row 3: Precio servicio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Precio Servicio $/kg</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editData.precioServicioKg}
                    onChange={e => handleEditChange('precioServicioKg', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Precio $/kg con Recupero</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editData.precioServicioKgConRecupero}
                    onChange={e => handleEditChange('precioServicioKgConRecupero', e.target.value)}
                    className="h-9"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              {/* Row 4: Importes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Total Servicio +IVA</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editData.totalServicioIva}
                    onChange={e => handleEditChange('totalServicioIva', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tasa Inspección Vet.</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editData.tasaInspeccionVet}
                    onChange={e => handleEditChange('tasaInspeccionVet', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Arancel IPCVA</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editData.arancelIpcva}
                    onChange={e => handleEditChange('arancelIpcva', e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Row 5: Total factura */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Total Factura (Imp.)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.totalFacturaImp}
                  onChange={e => handleEditChange('totalFacturaImp', e.target.value)}
                  className="h-9 font-bold text-emerald-700"
                />
              </div>

              {/* Separator: Facturación */}
              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  Datos de Facturación y Pago
                </p>

                {/* Row 6: Factura + fechas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">N° Factura</Label>
                    <Input
                      value={editData.numeroFactura}
                      onChange={e => handleEditChange('numeroFactura', e.target.value)}
                      className="h-9"
                      placeholder="00004-00000388"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Fecha Factura</Label>
                    <Input
                      type="date"
                      value={editData.fechaFactura}
                      onChange={e => handleEditChange('fechaFactura', e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Row 7: Pago */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Fecha Pago</Label>
                    <Input
                      type="date"
                      value={editData.fechaPago}
                      onChange={e => handleEditChange('fechaPago', e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Días Pago</Label>
                    <Input
                      type="number"
                      value={editData.diasPago}
                      onChange={e => handleEditChange('diasPago', e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Monto Depositado</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.montoDepositado}
                      onChange={e => handleEditChange('montoDepositado', e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Estado Pago</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={editData.estadoPago}
                      onChange={e => handleEditChange('estadoPago', e.target.value)}
                      className="h-9"
                    />
                    <p className="text-[10px] text-stone-400">0 = pagado, otro = saldo pendiente</p>
                  </div>
                </div>
              </div>

              {/* Row 8: Observaciones */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Observaciones</Label>
                <Textarea
                  value={editData.observaciones}
                  onChange={e => handleEditChange('observaciones', e.target.value)}
                  className="min-h-[60px]"
                  placeholder="E-CHEQ, transferencia, etc."
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              <X className="w-4 h-4 mr-1" /> Cancelar
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600"
              onClick={handleSaveEdit}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Pencil className="w-4 h-4 mr-1" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FactServFaenaTab
