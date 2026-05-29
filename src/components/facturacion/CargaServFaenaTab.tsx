'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FileCheck, Clock, Calendar, Upload, FileJson, Trash2,
  Loader2, FileSpreadsheet, Eraser, Save, ChevronDown,
  RefreshCw, AlertCircle, Info, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { toast } from 'sonner'

// ==================== TYPES ====================
interface PlanillaServicioFaena {
  id: string
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
  createdAt?: string
  updatedAt?: string
}

interface ImportResult {
  creados: number
  actualizados: number
  cantidadErrores: number
  errores?: string[]
  mensaje?: string
}

interface Props { operador?: { id: string; nombre: string; rol: string } }

// ==================== HELPERS ====================
const currencyFmt = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)

const numberFmt = (amount: number, decimals: number = 0) =>
  new Intl.NumberFormat('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount)

const dateFmt = (dateStr: string | null) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-AR')
}

const INITIAL_FORM = {
  numeroTropa: '',
  usuario: '',
  cantidadAnimales: '',
  kgPie: '',
  fechaFaena: '',
  kgGancho: '',
  precioServicioKg: '',
  precioServicioKgConRecupero: '',
  tasaInspeccionVet: '',
  arancelIpcva: '',
  numeroFactura: '',
  fechaFactura: '',
  fechaPago: '',
  montoDepositado: '',
  estadoPago: '0',
  observaciones: '',
}

// ==================== COMPONENT ====================
export function CargaServFaenaTab({ operador }: Props) {
  // Recent records
  const [records, setRecords] = useState<PlanillaServicioFaena[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [form, setForm] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [jsonHintOpen, setJsonHintOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Drag & drop
  const [dragOver, setDragOver] = useState(false)

  // ==================== CALCULATED VALUES ====================
  const kgPie = parseFloat(form.kgPie) || 0
  const kgGancho = parseFloat(form.kgGancho) || 0
  const precioServicioKg = parseFloat(form.precioServicioKg) || 0
  const tasaInspeccionVet = parseFloat(form.tasaInspeccionVet) || 0
  const arancelIpcva = parseFloat(form.arancelIpcva) || 0
  const cantidadAnimales = parseInt(form.cantidadAnimales) || 0

  const rindePorcentaje = kgPie > 0 ? (kgGancho / kgPie) * 100 : 0
  const totalServicioIva = kgGancho * precioServicioKg * 1.21
  const totalFacturaImp = totalServicioIva + (tasaInspeccionVet * cantidadAnimales) + (arancelIpcva * cantidadAnimales)

  // Auto-calc days
  const diasPago = (() => {
    if (form.fechaFactura && form.fechaPago) {
      const fechaFact = new Date(form.fechaFactura)
      const fechaPag = new Date(form.fechaPago)
      const diff = Math.floor((fechaPag.getTime() - fechaFact.getTime()) / (1000 * 60 * 60 * 24))
      return diff >= 0 ? diff : null
    }
    return null
  })()

  // ==================== KPIs ====================
  const totalCargados = records.length
  const pendientesFacturar = records.filter(r => !r.numeroFactura).length
  const ultimaCarga = records.length > 0
    ? records.reduce((latest, r) => {
        const d = new Date(r.fechaFaena)
        return d > latest ? d : latest
      }, new Date(0))
    : null

  // ==================== DATA FETCHING ====================
  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('limite', '20')
      const res = await fetch(`/api/facturacion/planilla-servicio-faena?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        const sorted = (data.data || []).sort((a: PlanillaServicioFaena, b: PlanillaServicioFaena) =>
          new Date(b.createdAt || b.fechaFaena).getTime() - new Date(a.createdAt || a.fechaFaena).getTime()
        )
        setRecords(sorted.slice(0, 20))
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  // ==================== FORM HANDLERS ====================
  const handleFormChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const clearForm = () => {
    setForm(INITIAL_FORM)
    toast.info('Formulario limpiado')
  }

  const handleSave = async () => {
    // Validate required fields
    if (!form.numeroTropa || !form.usuario || !form.fechaFaena || !form.precioServicioKg) {
      toast.error('Complete los campos obligatorios: N° Tropa, Usuario, Fecha Faena y Precio $/kg')
      return
    }

    setSaving(true)
    try {
      const payload = {
        numeroTropa: parseInt(form.numeroTropa),
        usuario: form.usuario.trim(),
        cantidadAnimales: parseInt(form.cantidadAnimales) || 0,
        kgPie: parseFloat(form.kgPie) || 0,
        fechaFaena: form.fechaFaena,
        kgGancho: parseFloat(form.kgGancho) || 0,
        precioServicioKg: parseFloat(form.precioServicioKg) || 0,
        precioServicioKgConRecupero: form.precioServicioKgConRecupero ? parseFloat(form.precioServicioKgConRecupero) : null,
        totalServicioIva: totalServicioIva,
        tasaInspeccionVet: tasaInspeccionVet,
        arancelIpcva: arancelIpcva,
        totalFacturaImp: totalFacturaImp,
        numeroFactura: form.numeroFactura || null,
        fechaFactura: form.fechaFactura || null,
        fechaPago: form.fechaPago || null,
        diasPago,
        montoDepositado: form.montoDepositado ? parseFloat(form.montoDepositado) : null,
        estadoPago: parseFloat(form.estadoPago) || 0,
        observaciones: form.observaciones || null,
        operadorId: operador?.id,
      }

      const res = await fetch('/api/facturacion/planilla-servicio-faena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Registro de Tropa N° ${form.numeroTropa} creado exitosamente`)
        clearForm()
        fetchRecords()
      } else {
        toast.error(data.error || 'Error al crear registro')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión al guardar')
    } finally {
      setSaving(false)
    }
  }

  // ==================== IMPORT HANDLERS ====================
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/json') {
      setImportFile(file)
      setImportResult(null)
    } else {
      toast.error('Solo se permiten archivos JSON')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
      setImportResult(null)
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Seleccione un archivo JSON para importar')
      return
    }
    setImporting(true)
    setImportResult(null)
    try {
      const text = await importFile.text()
      let jsonData: any[]
      try {
        jsonData = JSON.parse(text)
      } catch {
        toast.error('El archivo no contiene JSON válido')
        setImporting(false)
        return
      }
      if (!Array.isArray(jsonData)) {
        toast.error('El JSON debe ser un array de registros')
        setImporting(false)
        return
      }

      const res = await fetch('/api/facturacion/planilla-servicio-faena/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registros: jsonData, operadorId: operador?.id }),
      })
      const data = await res.json()
      if (data.success) {
        const result: ImportResult = {
          creados: data.creados || 0,
          actualizados: data.actualizados || 0,
          cantidadErrores: data.cantidadErrores || (Array.isArray(data.errores) ? data.errores.length : 0),
          errores: Array.isArray(data.errores) ? data.errores : [],
          mensaje: data.mensaje,
        }
        setImportResult(result)
        toast.success(`Importación finalizada: ${result.creados} creados, ${result.actualizados} actualizados`)
        fetchRecords()
      } else {
        toast.error(data.error || 'Error al importar registros')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión al importar')
    } finally {
      setImporting(false)
    }
  }

  const handleLoadSample = async () => {
    setImporting(true)
    try {
      const res = await fetch('/download/planilla_servicio_faena.json')
      if (!res.ok) {
        toast.error('No se pudo obtener el archivo de ejemplo')
        return
      }
      const jsonData = await res.json()
      if (!Array.isArray(jsonData)) {
        toast.error('El archivo de ejemplo no tiene el formato esperado')
        return
      }

      const importRes = await fetch('/api/facturacion/planilla-servicio-faena/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registros: jsonData, operadorId: operador?.id }),
      })
      const data = await importRes.json()
      if (data.success) {
        const result: ImportResult = {
          creados: data.creados || 0,
          actualizados: data.actualizados || 0,
          cantidadErrores: data.cantidadErrores || (Array.isArray(data.errores) ? data.errores.length : 0),
          errores: Array.isArray(data.errores) ? data.errores : [],
          mensaje: data.mensaje,
        }
        setImportResult(result)
        toast.success(`Ejemplo cargado: ${result.creados} creados, ${result.actualizados} actualizados`)
        fetchRecords()
      } else {
        toast.error(data.error || 'Error al cargar datos de ejemplo')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión al cargar datos de ejemplo')
    } finally {
      setImporting(false)
    }
  }

  // ==================== RENDER ====================
  return (
    <div className="space-y-4">
      {/* KPIs Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Total Cargados */}
        <Card className="border-0 shadow-sm bg-emerald-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-200/60 rounded-lg">
                <FileCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold">Total Cargados</p>
                <p className="text-lg font-bold text-emerald-800">{totalCargados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pendientes de Facturar */}
        <Card className="border-0 shadow-sm bg-amber-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-200/60 rounded-lg">
                <Clock className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold">Pendientes Facturar</p>
                <p className="text-lg font-bold text-amber-800">{pendientesFacturar}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ultima Carga */}
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-200/60 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-700" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-blue-600 font-semibold">Ultima Carga</p>
                <p className="text-lg font-bold text-blue-800">
                  {ultimaCarga && ultimaCarga.getTime() > 0
                    ? dateFmt(ultimaCarga.toISOString())
                    : '-'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two main sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ==================== SECTION 1: CARGA MANUAL ==================== */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              CARGA MANUAL
            </CardTitle>
            <CardDescription>
              Ingrese los datos de la tropa para registrar el servicio de faena
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Datos de Tropa */}
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                Datos de Tropa
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    Nº Tropa <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="Ej: 123"
                    value={form.numeroTropa}
                    onChange={e => handleFormChange('numeroTropa', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    Usuario <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Nombre del usuario"
                    value={form.usuario}
                    onChange={e => handleFormChange('usuario', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Cantidad Animales</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.cantidadAnimales}
                    onChange={e => handleFormChange('cantidadAnimales', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Kg Pie</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={form.kgPie}
                    onChange={e => handleFormChange('kgPie', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-semibold">
                    Fecha Faena <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={form.fechaFaena}
                    onChange={e => handleFormChange('fechaFaena', e.target.value)}
                    className="h-9 w-full"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Datos de Faena */}
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                Datos de Faena
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Kg Gancho</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={form.kgGancho}
                    onChange={e => handleFormChange('kgGancho', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Rinde %</Label>
                  <Input
                    type="text"
                    value={rindePorcentaje > 0 ? rindePorcentaje.toFixed(1) + '%' : ''}
                    readOnly
                    className="h-9 bg-stone-50 text-stone-500"
                    placeholder="Auto-calculado"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Precios */}
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                Precios
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    Precio $/kg S/Recupero <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.precioServicioKg}
                    onChange={e => handleFormChange('precioServicioKg', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Precio $/kg C/Recupero</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Opcional"
                    value={form.precioServicioKgConRecupero}
                    onChange={e => handleFormChange('precioServicioKgConRecupero', e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Impuestos */}
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                Impuestos x Cabeza
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tasa Inspección Vet. x Cabeza</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.tasaInspeccionVet}
                    onChange={e => handleFormChange('tasaInspeccionVet', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Arancel IPCVA x Cabeza</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.arancelIpcva}
                    onChange={e => handleFormChange('arancelIpcva', e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Totales auto-calculated */}
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                Totales (Vista Previa)
              </p>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                  <span className="text-xs font-semibold text-stone-600">Total Serv. + 21% IVA</span>
                  <span className="text-sm font-bold text-emerald-700 font-mono">
                    {currencyFmt(totalServicioIva)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 border border-emerald-200">
                  <span className="text-xs font-semibold text-stone-700">Total Factura c/Imp.</span>
                  <span className="text-base font-bold text-emerald-800 font-mono">
                    {currencyFmt(totalFacturaImp)}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Facturación */}
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                Facturación
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Nº Factura</Label>
                  <Input
                    placeholder="00004-00000388"
                    value={form.numeroFactura}
                    onChange={e => handleFormChange('numeroFactura', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Fecha Factura</Label>
                  <Input
                    type="date"
                    value={form.fechaFactura}
                    onChange={e => handleFormChange('fechaFactura', e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Pago */}
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                Pago
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Fecha Pago</Label>
                  <Input
                    type="date"
                    value={form.fechaPago}
                    onChange={e => handleFormChange('fechaPago', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Días Pago</Label>
                  <Input
                    type="text"
                    value={diasPago !== null ? String(diasPago) : ''}
                    readOnly
                    className="h-9 bg-stone-50 text-stone-500"
                    placeholder="Auto"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Monto Depositado</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.montoDepositado}
                    onChange={e => handleFormChange('montoDepositado', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Estado Pago / Saldo</Label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="0"
                    value={form.estadoPago}
                    onChange={e => handleFormChange('estadoPago', e.target.value)}
                    className="h-9"
                  />
                  <p className="text-[10px] text-stone-400">0 = pagado</p>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Observaciones</Label>
              <Textarea
                placeholder="Notas adicionales..."
                value={form.observaciones}
                onChange={e => handleFormChange('observaciones', e.target.value)}
                className="min-h-[60px] text-xs"
                rows={2}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={clearForm}
                disabled={saving}
                className="h-9"
              >
                <Eraser className="w-3.5 h-3.5 mr-1" />
                Limpiar Formulario
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-1" />
                )}
                Guardar Registro
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ==================== SECTION 2: IMPORTAR MASIVO ==================== */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-500" />
              IMPORTAR MASIVO
            </CardTitle>
            <CardDescription>
              Importe múltiples registros desde un archivo JSON
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop Zone */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                dragOver
                  ? 'border-blue-400 bg-blue-50'
                  : importFile
                    ? 'border-emerald-300 bg-emerald-50/50'
                    : 'border-stone-300 bg-stone-50/50 hover:border-stone-400 hover:bg-stone-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="hidden"
              />
              {importFile ? (
                <div className="space-y-2">
                  <FileJson className="w-10 h-10 mx-auto text-emerald-500" />
                  <p className="text-sm font-medium text-stone-700">{importFile.name}</p>
                  <p className="text-xs text-stone-500">
                    {(importFile.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-stone-400 hover:text-red-500"
                    onClick={e => {
                      e.stopPropagation()
                      setImportFile(null)
                      setImportResult(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                  >
                    <X className="w-3 h-3 mr-1" /> Quitar archivo
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-10 h-10 mx-auto text-stone-400" />
                  <p className="text-sm text-stone-600">
                    Arrastre un archivo JSON aquí o <span className="text-blue-600 font-semibold">haga clic para seleccionar</span>
                  </p>
                  <p className="text-xs text-stone-400">Solo archivos .json</p>
                </div>
              )}
            </div>

            {/* Import button */}
            <Button
              size="sm"
              onClick={handleImport}
              disabled={!importFile || importing}
              className="h-9 w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Importar desde JSON
            </Button>

            {/* Import Result */}
            {importResult && (
              <div className="rounded-lg bg-stone-50 border p-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-700">
                  <Info className="w-3.5 h-3.5" />
                  Resultado de la importación:
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-emerald-50 rounded">
                    <p className="font-bold text-emerald-700 text-lg">{importResult.creados}</p>
                    <p className="text-emerald-600">Creados</p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <p className="font-bold text-blue-700 text-lg">{importResult.actualizados}</p>
                    <p className="text-blue-600">Actualizados</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <p className="font-bold text-red-700 text-lg">{importResult.cantidadErrores}</p>
                    <p className="text-red-600">Errores</p>
                  </div>
                </div>
                {importResult.mensaje && (
                  <p className="text-xs text-stone-500 mt-1">{importResult.mensaje}</p>
                )}
              </div>
            )}

            {/* Sample data button */}
            <Separator />
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadSample}
                disabled={importing}
                className="h-9 w-full"
              >
                {importing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileJson className="w-4 h-4 mr-2" />
                )}
                Cargar Datos de Ejemplo
              </Button>
            </div>

            {/* JSON Format Hint */}
            <Collapsible open={jsonHintOpen} onOpenChange={setJsonHintOpen}>
              <CollapsibleTrigger className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 w-full">
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${jsonHintOpen ? 'rotate-180' : ''}`} />
                Formato JSON esperado
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="mt-2 rounded-lg bg-stone-900 text-stone-100 p-3 text-[10px] overflow-x-auto max-h-48 overflow-y-auto">
{`[
  {
    "numeroTropa": 123,
    "usuario": "Juan Pérez",
    "cantidadAnimales": 30,
    "kgPie": 14500,
    "fechaFaena": "2026-01-15",
    "kgGancho": 7800,
    "precioServicioKg": 150,
    "tasaInspeccionVet": 120,
    "arancelIpcva": 45,
    "observaciones": "Tropa especial"
  }
]`}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </div>

      {/* ==================== RECENTLY LOADED TABLE ==================== */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-stone-500" />
                Últimos Registros Cargados
              </CardTitle>
              <CardDescription>
                {loading
                  ? 'Cargando...'
                  : `${records.length} registros más recientes`
                }
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchRecords} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-stone-50 hover:bg-stone-50">
                  <TableHead className="min-w-[60px] text-xs font-semibold text-center">Nº Tropa</TableHead>
                  <TableHead className="min-w-[160px] text-xs font-semibold">Usuario</TableHead>
                  <TableHead className="min-w-[80px] text-xs font-semibold">Fecha Faena</TableHead>
                  <TableHead className="min-w-[45px] text-xs font-semibold text-center">Cant.</TableHead>
                  <TableHead className="min-w-[70px] text-xs font-semibold text-right">Kg Gancho</TableHead>
                  <TableHead className="min-w-[60px] text-xs font-semibold text-right">Precio/kg</TableHead>
                  <TableHead className="min-w-[100px] text-xs font-semibold text-right">Total Fact.</TableHead>
                  <TableHead className="min-w-[110px] text-xs font-semibold">Nº Factura</TableHead>
                  <TableHead className="min-w-[70px] text-xs font-semibold text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <Loader2 className="w-8 h-8 mx-auto animate-spin text-amber-500" />
                      <p className="mt-2 text-stone-400 text-sm">Cargando datos...</p>
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-stone-400">
                      <AlertCircle className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                      <p className="text-sm">No hay registros cargados</p>
                      <p className="text-xs text-stone-400 mt-1">Use el formulario manual o importe un archivo JSON</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map(r => {
                    const isPagado = r.estadoPago === 0
                    const tieneFactura = !!r.numeroFactura
                    return (
                      <TableRow key={r.id} className="hover:bg-stone-50">
                        <TableCell className="font-mono font-bold text-center">
                          {r.numeroTropa}
                        </TableCell>
                        <TableCell className="font-medium">{r.usuario}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {dateFmt(r.fechaFaena)}
                        </TableCell>
                        <TableCell className="text-center">{r.cantidadAnimales || '-'}</TableCell>
                        <TableCell className="text-right font-mono">
                          {numberFmt(r.kgGancho, 1)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${numberFmt(r.precioServicioKg)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-emerald-700">
                          {currencyFmt(r.totalFacturaImp)}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] whitespace-nowrap">
                          {r.numeroFactura || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {tieneFactura && isPagado ? (
                            <Badge className="bg-emerald-100 text-emerald-700 text-[10px] py-0 px-1.5">
                              Pagado
                            </Badge>
                          ) : tieneFactura ? (
                            <Badge className="bg-blue-100 text-blue-700 text-[10px] py-0 px-1.5">
                              Facturado
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 text-[10px] py-0 px-1.5">
                              Pendiente
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer totals */}
          {!loading && records.length > 0 && (
            <div className="border-t px-3 py-2 bg-stone-50 text-xs">
              <div className="flex flex-wrap gap-4 items-center">
                <span className="font-semibold text-stone-600">
                  {records.length} registros
                </span>
                <span className="text-stone-500">
                  Kg Gancho: <strong>{numberFmt(records.reduce((s, r) => s + r.kgGancho, 0), 1)}</strong>
                </span>
                <span className="text-emerald-700 font-bold">
                  Total Fact.: {currencyFmt(records.reduce((s, r) => s + r.totalFacturaImp, 0))}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CargaServFaenaTab
