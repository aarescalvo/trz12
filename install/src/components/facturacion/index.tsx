'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, DollarSign, CheckCircle, XCircle, Eye, 
  Plus, Search, Loader2, Printer, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Factura {
  id: string
  numero: string
  fecha: string
  cliente: string
  tipoComprobante: 'FACTURA_A' | 'FACTURA_B' | 'FACTURA_C' | 'REMITO'
  monto: number
  estado: 'PENDIENTE' | 'PAGADA' | 'ANULADA'
}

interface Props {
  operador: Operador
}

const TIPOS_COMPROBANTE = [
  { value: 'FACTURA_A', label: 'Factura A' },
  { value: 'FACTURA_B', label: 'Factura B' },
  { value: 'FACTURA_C', label: 'Factura C' },
  { value: 'REMITO', label: 'Remito' },
]

const CLIENTES_SIMULADOS = [
  { id: '1', nombre: 'Carnicería Don José' },
  { id: '2', nombre: 'Supermercados del Valle' },
  { id: '3', nombre: 'Frigorífico Regional' },
  { id: '4', nombre: 'Distribuidora Norte' },
  { id: '5', nombre: 'Market Central' },
]

export function FacturacionModule({ operador }: Props) {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'PENDIENTE' | 'PAGADA' | 'ANULADA'>('TODOS')
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    cliente: '',
    tipoComprobante: 'FACTURA_B' as const,
    numero: '',
    fecha: new Date().toISOString().split('T')[0],
    monto: 0,
  })

  // Simulated data
  const facturasSimuladas: Factura[] = [
    {
      id: '1',
      numero: '0001-00001234',
      fecha: '2025-01-15',
      cliente: 'Carnicería Don José',
      tipoComprobante: 'FACTURA_B',
      monto: 458750.00,
      estado: 'PAGADA',
    },
    {
      id: '2',
      numero: '0001-00001235',
      fecha: '2025-01-16',
      cliente: 'Supermercados del Valle',
      tipoComprobante: 'FACTURA_A',
      monto: 892300.50,
      estado: 'PENDIENTE',
    },
    {
      id: '3',
      numero: '0001-00001236',
      fecha: '2025-01-17',
      cliente: 'Frigorífico Regional',
      tipoComprobante: 'FACTURA_B',
      monto: 1250000.00,
      estado: 'PENDIENTE',
    },
    {
      id: '4',
      numero: 'R-0001-00567',
      fecha: '2025-01-14',
      cliente: 'Distribuidora Norte',
      tipoComprobante: 'REMITO',
      monto: 320000.00,
      estado: 'PAGADA',
    },
    {
      id: '5',
      numero: '0001-00001230',
      fecha: '2025-01-10',
      cliente: 'Market Central',
      tipoComprobante: 'FACTURA_C',
      monto: 185000.00,
      estado: 'ANULADA',
    },
    {
      id: '6',
      numero: '0001-00001237',
      fecha: '2025-01-18',
      cliente: 'Carnicería Don José',
      tipoComprobante: 'FACTURA_B',
      monto: 567800.00,
      estado: 'PENDIENTE',
    },
  ]

  useEffect(() => {
    fetchFacturas()
  }, [])

  const fetchFacturas = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      setFacturas(facturasSimuladas)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar las facturas')
    } finally {
      setLoading(false)
    }
  }

  const handleNuevaFactura = () => {
    setFormData({
      cliente: '',
      tipoComprobante: 'FACTURA_B',
      numero: `0001-${String(facturas.length + 1).padStart(8, '0')}`,
      fecha: new Date().toISOString().split('T')[0],
      monto: 0,
    })
    setDialogOpen(true)
  }

  const handleGuardar = async () => {
    if (!formData.cliente) {
      toast.error('Debe seleccionar un cliente')
      return
    }
    if (!formData.numero) {
      toast.error('Debe ingresar un número de comprobante')
      return
    }
    if (formData.monto <= 0) {
      toast.error('El monto debe ser mayor a cero')
      return
    }

    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const nuevaFactura: Factura = {
        id: String(facturas.length + 1),
        ...formData,
        estado: 'PENDIENTE',
      }
      
      setFacturas([nuevaFactura, ...facturas])
      toast.success(`Factura ${formData.numero} creada exitosamente`)
      setDialogOpen(false)
    } catch (error) {
      toast.error('Error al guardar la factura')
    } finally {
      setSaving(false)
    }
  }

  const handleVerPDF = async (factura: Factura) => {
    setFacturaSeleccionada(factura)
    setViewOpen(true)
    toast.info('Generando vista previa del PDF...')
  }

  const handleMarcarPagada = async (factura: Factura) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      setFacturas(facturas.map(f => 
        f.id === factura.id ? { ...f, estado: 'PAGADA' as const } : f
      ))
      toast.success(`Factura ${factura.numero} marcada como pagada`)
    } catch (error) {
      toast.error('Error al actualizar el estado')
    }
  }

  const handleAnular = (factura: Factura) => {
    setFacturaSeleccionada(factura)
    setDeleteOpen(true)
  }

  const handleConfirmarAnular = async () => {
    if (!facturaSeleccionada) return
    
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      setFacturas(facturas.map(f => 
        f.id === facturaSeleccionada.id ? { ...f, estado: 'ANULADA' as const } : f
      ))
      toast.success(`Factura ${facturaSeleccionada.numero} anulada`)
      setDeleteOpen(false)
    } catch (error) {
      toast.error('Error al anular la factura')
    } finally {
      setSaving(false)
    }
  }

  const handleImprimir = (factura: Factura) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(generatePrintHTML(factura))
      printWindow.document.close()
      printWindow.print()
    }
    toast.success('Enviando a impresión...')
  }

  const generatePrintHTML = (factura: Factura) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprobante ${factura.numero}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; }
          .row { display: flex; margin-bottom: 8px; }
          .label { font-weight: bold; width: 200px; color: #555; }
          .value { flex: 1; }
          .total { font-size: 20px; font-weight: bold; margin-top: 20px; text-align: right; }
          .footer { margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${TIPOS_COMPROBANTE.find(t => t.value === factura.tipoComprobante)?.label || 'Comprobante'}</div>
          <div>N° ${factura.numero}</div>
        </div>
        <div class="row"><span class="label">Fecha:</span><span class="value">${new Date(factura.fecha).toLocaleDateString('es-AR')}</span></div>
        <div class="row"><span class="label">Cliente:</span><span class="value">${factura.cliente}</span></div>
        <div class="row"><span class="label">Estado:</span><span class="value">${factura.estado}</span></div>
        <div class="total">Total: ${formatCurrency(factura.monto)}</div>
        <div class="footer">
          <p>Solemar Alimentaria - Frigorífico</p>
          <p>Documento generado el ${new Date().toLocaleString('es-AR')}</p>
        </div>
      </body>
      </html>
    `
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pendiente</Badge>
      case 'PAGADA':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Pagada</Badge>
      case 'ANULADA':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Anulada</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const getTipoLabel = (tipo: string) => {
    return TIPOS_COMPROBANTE.find(t => t.value === tipo)?.label || tipo
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const facturasFiltradas = facturas.filter(f => {
    const matchEstado = filtroEstado === 'TODOS' || f.estado === filtroEstado
    const matchSearch = !searchTerm || 
      f.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cliente.toLowerCase().includes(searchTerm.toLowerCase())
    return matchEstado && matchSearch
  })

  const totalFacturas = facturas.length
  const pendientes = facturas.filter(f => f.estado === 'PENDIENTE').length
  const pagadas = facturas.filter(f => f.estado === 'PAGADA').length
  const montoTotal = facturas.filter(f => f.estado !== 'ANULADA').reduce((sum, f) => sum + f.monto, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <FileText className="w-8 h-8 text-amber-500" />
              Facturación
            </h1>
            <p className="text-stone-500 mt-1">Gestión de facturas y comprobantes - Frigorífico</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchFacturas} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={handleNuevaFactura} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Factura
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltroEstado('TODOS')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-100 rounded-lg">
                  <FileText className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase">Total Facturas</p>
                  <p className="text-2xl font-bold text-stone-800">{totalFacturas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltroEstado('PENDIENTE')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase">Pendientes</p>
                  <p className="text-2xl font-bold text-amber-600">{pendientes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltroEstado('PAGADA')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase">Pagadas</p>
                  <p className="text-2xl font-bold text-emerald-600">{pagadas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase">Monto Total</p>
                  <p className="text-lg font-bold text-stone-800">{formatCurrency(montoTotal)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  placeholder="Buscar por número o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v as typeof filtroEstado)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los estados</SelectItem>
                  <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                  <SelectItem value="PAGADA">Pagadas</SelectItem>
                  <SelectItem value="ANULADA">Anuladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Facturas */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              Listado de Comprobantes
            </CardTitle>
            <CardDescription>
              Gestión de facturas y remitos del frigorífico
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : facturasFiltradas.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No hay comprobantes que mostrar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Número</TableHead>
                      <TableHead className="font-semibold">Fecha</TableHead>
                      <TableHead className="font-semibold">Cliente</TableHead>
                      <TableHead className="font-semibold">Tipo</TableHead>
                      <TableHead className="font-semibold">Monto</TableHead>
                      <TableHead className="font-semibold">Estado</TableHead>
                      <TableHead className="font-semibold text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturasFiltradas.map((factura) => (
                      <TableRow key={factura.id} className="hover:bg-stone-50">
                        <TableCell className="font-mono font-medium">{factura.numero}</TableCell>
                        <TableCell>{new Date(factura.fecha).toLocaleDateString('es-AR')}</TableCell>
                        <TableCell>{factura.cliente}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getTipoLabel(factura.tipoComprobante)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(factura.monto)}</TableCell>
                        <TableCell>{getEstadoBadge(factura.estado)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleVerPDF(factura)}
                              title="Ver PDF"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleImprimir(factura)}
                              title="Imprimir"
                              disabled={factura.estado === 'ANULADA'}
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                            {factura.estado === 'PENDIENTE' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleMarcarPagada(factura)}
                                title="Marcar como pagada"
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            {factura.estado !== 'ANULADA' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAnular(factura)}
                                title="Anular"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog Nueva Factura */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                Nueva Factura
              </DialogTitle>
              <DialogDescription>
                Complete los datos para crear un nuevo comprobante
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente</Label>
                <Select 
                  value={formData.cliente} 
                  onValueChange={(v) => setFormData({ ...formData, cliente: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENTES_SIMULADOS.map((c) => (
                      <SelectItem key={c.id} value={c.nombre}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoComprobante">Tipo de Comprobante</Label>
                <Select 
                  value={formData.tipoComprobante} 
                  onValueChange={(v) => setFormData({ ...formData, tipoComprobante: v as typeof formData.tipoComprobante })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_COMPROBANTE.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="0001-00000001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monto">Monto</Label>
                <Input
                  id="monto"
                  type="number"
                  value={formData.monto || ''}
                  onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleGuardar} 
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                {saving ? 'Guardando...' : 'Crear Factura'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Ver PDF */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-600" />
                Vista Previa del Comprobante
              </DialogTitle>
              <DialogDescription>
                Detalles del comprobante seleccionado
              </DialogDescription>
            </DialogHeader>
            {facturaSeleccionada && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-stone-500 text-xs uppercase">Número</p>
                    <p className="font-mono font-medium">{facturaSeleccionada.numero}</p>
                  </div>
                  <div>
                    <p className="text-stone-500 text-xs uppercase">Fecha</p>
                    <p>{new Date(facturaSeleccionada.fecha).toLocaleDateString('es-AR')}</p>
                  </div>
                  <div>
                    <p className="text-stone-500 text-xs uppercase">Cliente</p>
                    <p className="font-medium">{facturaSeleccionada.cliente}</p>
                  </div>
                  <div>
                    <p className="text-stone-500 text-xs uppercase">Tipo</p>
                    <p>{getTipoLabel(facturaSeleccionada.tipoComprobante)}</p>
                  </div>
                  <div>
                    <p className="text-stone-500 text-xs uppercase">Estado</p>
                    {getEstadoBadge(facturaSeleccionada.estado)}
                  </div>
                  <div>
                    <p className="text-stone-500 text-xs uppercase">Monto</p>
                    <p className="font-bold text-lg">{formatCurrency(facturaSeleccionada.monto)}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewOpen(false)}>
                Cerrar
              </Button>
              <Button 
                onClick={() => {
                  setViewOpen(false)
                  if (facturaSeleccionada) handleImprimir(facturaSeleccionada)
                }}
                className="bg-amber-500 hover:bg-amber-600"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Anular */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-red-600 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Anular Factura
              </DialogTitle>
              <DialogDescription>
                ¿Está seguro que desea anular la factura &quot;{facturaSeleccionada?.numero}&quot;?
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmarAnular} 
                disabled={saving}
                className="bg-red-600 hover:bg-red-700"
              >
                {saving ? 'Anulando...' : 'Anular Factura'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default FacturacionModule
