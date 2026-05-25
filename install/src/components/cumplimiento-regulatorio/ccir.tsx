'use client'

import { useState, useEffect } from 'react'
import { 
  FileCheck, Plus, Printer, Search, Eye, Trash2, 
  Save, X, Loader2, ExternalLink, Building2, MapPin, 
  Package, FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface CCIR {
  id: string
  numeroCertificado: string
  fechaEmision: string
  producto: string
  cantidad: number
  lote?: string | null
  paisDestino: string
  puertoDestino?: string | null
  numeroEstablecimiento?: string | null
  nombreEstablecimiento?: string | null
  cuitEstablecimiento?: string | null
  nombreImportador?: string | null
  direccionImportador?: string | null
  numeroContenedor?: string | null
  matriculaTransporte?: string | null
  numeroPrecintos?: string | null
  observaciones?: string | null
  estado: string
  operador?: { id: string; nombre: string } | null
  fechaImpresion?: string | null
  vecesImpreso: number
}

interface Operador {
  id: string
  nombre: string
  rol: string
}

const PAISES_DESTINO = [
  'Italia', 'Francia', 'España', 'Alemania', 'Países Bajos', 'Bélgica',
  'Reino Unido', 'Estados Unidos', 'China', 'Japón', 'Corea del Sur',
  'Rusia', 'Brasil', 'Chile', 'Uruguay', 'Paraguay', 'Otro'
]

export function CCIRModule({ operador }: { operador: Operador }) {
  const [ccirs, setCCIRs] = useState<CCIR[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [ccirSeleccionado, setCcirSeleccionado] = useState<CCIR | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')

  const [formData, setFormData] = useState({
    producto: '',
    cantidad: '',
    lote: '',
    paisDestino: '',
    puertoDestino: '',
    numeroEstablecimiento: '',
    nombreEstablecimiento: '',
    cuitEstablecimiento: '',
    nombreImportador: '',
    direccionImportador: '',
    numeroContenedor: '',
    matriculaTransporte: '',
    numeroPrecintos: '',
    observaciones: ''
  })

  useEffect(() => {
    fetchCCIRs()
  }, [filtroEstado])

  const fetchCCIRs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado !== 'TODOS') params.append('estado', filtroEstado)
      if (searchTerm) params.append('search', searchTerm)
      
      const res = await fetch(`/api/ccir?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setCCIRs(data.data)
      }
    } catch (error) {
      console.error('Error fetching CCIR:', error)
      toast.error('Error al cargar los certificados')
    } finally {
      setLoading(false)
    }
  }

  const handleNuevo = () => {
    setFormData({
      producto: '',
      cantidad: '',
      lote: '',
      paisDestino: '',
      puertoDestino: '',
      numeroEstablecimiento: '',
      nombreEstablecimiento: 'Solemar Alimentaria',
      cuitEstablecimiento: '',
      numeroContenedor: '',
      matriculaTransporte: '',
      nombreImportador: '',
      direccionImportador: '',
      numeroPrecintos: '',
      observaciones: ''
    })
    setDialogOpen(true)
  }

  const handleVer = (ccir: CCIR) => {
    setCcirSeleccionado(ccir)
    setViewOpen(true)
  }

  const handleEliminar = (ccir: CCIR) => {
    setCcirSeleccionado(ccir)
    setDeleteOpen(true)
  }

  const handleGuardar = async () => {
    if (!formData.producto || !formData.cantidad || !formData.paisDestino) {
      toast.error('Complete los campos obligatorios: Producto, Cantidad y País de Destino')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/ccir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          operadorId: operador.id
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Certificado ${data.data.numeroCertificado} creado exitosamente`)
        setDialogOpen(false)
        fetchCCIRs()
      } else {
        toast.error(data.error || 'Error al crear el certificado')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleImprimir = async (ccir: CCIR) => {
    try {
      // Marcar como impreso
      await fetch('/api/ccir', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ccir.id,
          marcarImpreso: true
        })
      })

      // Abrir ventana de impresión
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(generatePrintHTML(ccir))
        printWindow.document.close()
        printWindow.print()
      }
      
      toast.success('Certificado enviado a impresión')
      fetchCCIRs()
    } catch (error) {
      toast.error('Error al imprimir')
    }
  }

  const handleConfirmarEliminar = async () => {
    if (!ccirSeleccionado) return

    setSaving(true)
    try {
      const res = await fetch(`/api/ccir?id=${ccirSeleccionado.id}&operadorId=${operador.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Certificado anulado')
        setDeleteOpen(false)
        fetchCCIRs()
      } else {
        toast.error(data.error || 'Error al anular')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const estilos: Record<string, string> = {
      'EMITIDO': 'bg-green-100 text-green-700',
      'ANULADO': 'bg-red-100 text-red-700',
      'EXPORTADO': 'bg-blue-100 text-blue-700'
    }
    return estilos[estado] || 'bg-gray-100 text-gray-700'
  }

  const generatePrintHTML = (ccir: CCIR) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CCIR - ${ccir.numeroCertificado}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; color: #1a1a1a; }
          .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 14px; font-weight: bold; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
          .row { display: flex; margin-bottom: 8px; }
          .label { font-weight: bold; width: 200px; color: #555; }
          .value { flex: 1; }
          .footer { margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #666; }
          .stamp { margin-top: 30px; text-align: center; }
          .stamp-box { border: 2px solid #333; padding: 20px; display: inline-block; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">CERTIFICADO DE CALIDAD E INSPECCIÓN RETIRADA</div>
          <div class="subtitle">CCIR - ${ccir.numeroCertificado}</div>
        </div>

        <div class="section">
          <div class="section-title">DATOS DEL CERTIFICADO</div>
          <div class="row"><span class="label">N° Certificado:</span><span class="value">${ccir.numeroCertificado}</span></div>
          <div class="row"><span class="label">Fecha de Emisión:</span><span class="value">${new Date(ccir.fechaEmision).toLocaleDateString('es-AR')}</span></div>
        </div>

        <div class="section">
          <div class="section-title">DATOS DEL PRODUCTO</div>
          <div class="row"><span class="label">Producto:</span><span class="value">${ccir.producto}</span></div>
          <div class="row"><span class="label">Cantidad:</span><span class="value">${ccir.cantidad} KG</span></div>
          ${ccir.lote ? `<div class="row"><span class="label">Lote/Tropa:</span><span class="value">${ccir.lote}</span></div>` : ''}
        </div>

        <div class="section">
          <div class="section-title">DESTINO</div>
          <div class="row"><span class="label">País de Destino:</span><span class="value">${ccir.paisDestino}</span></div>
          ${ccir.puertoDestino ? `<div class="row"><span class="label">Puerto de Destino:</span><span class="value">${ccir.puertoDestino}</span></div>` : ''}
        </div>

        <div class="section">
          <div class="section-title">ESTABLECIMIENTO</div>
          <div class="row"><span class="label">Nombre:</span><span class="value">${ccir.nombreEstablecimiento || 'Solemar Alimentaria'}</span></div>
          ${ccir.numeroEstablecimiento ? `<div class="row"><span class="label">N° Establecimiento:</span><span class="value">${ccir.numeroEstablecimiento}</span></div>` : ''}
          ${ccir.cuitEstablecimiento ? `<div class="row"><span class="label">CUIT:</span><span class="value">${ccir.cuitEstablecimiento}</span></div>` : ''}
        </div>

        ${ccir.nombreImportador ? `
        <div class="section">
          <div class="section-title">IMPORTADOR</div>
          <div class="row"><span class="label">Nombre:</span><span class="value">${ccir.nombreImportador}</span></div>
          ${ccir.direccionImportador ? `<div class="row"><span class="label">Dirección:</span><span class="value">${ccir.direccionImportador}</span></div>` : ''}
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">TRANSPORTE</div>
          ${ccir.numeroContenedor ? `<div class="row"><span class="label">N° Contenedor:</span><span class="value">${ccir.numeroContenedor}</span></div>` : ''}
          ${ccir.matriculaTransporte ? `<div class="row"><span class="label">Matrícula:</span><span class="value">${ccir.matriculaTransporte}</span></div>` : ''}
          ${ccir.numeroPrecintos ? `<div class="row"><span class="label">Precintos:</span><span class="value">${ccir.numeroPrecintos}</span></div>` : ''}
        </div>

        ${ccir.observaciones ? `
        <div class="section">
          <div class="section-title">OBSERVACIONES</div>
          <p>${ccir.observaciones}</p>
        </div>
        ` : ''}

        <div class="stamp">
          <div class="stamp-box">
            <p style="margin: 0; font-weight: bold;">CERTIFICACIÓN OFICIAL</p>
            <p style="margin: 10px 0 0 0; font-size: 12px;">Documento válido para exportación</p>
          </div>
        </div>

        <div class="footer">
          <p>Documento generado el ${new Date().toLocaleString('es-AR')}</p>
          <p>Solemar Alimentaria - Frigorífico</p>
        </div>
      </body>
      </html>
    `
  }

  return (
    <div className="space-y-6">
      {/* Barra de herramientas */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-600" />
                Certificados CCIR
              </CardTitle>
              <CardDescription>
                Certificados de Calidad e Inspección Retirada para exportación
              </CardDescription>
            </div>
            <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo CCIR
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Buscar por número, producto, destino..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCCIRs()}
                className="pl-10"
              />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="EMITIDO">Emitidos</SelectItem>
                <SelectItem value="EXPORTADO">Exportados</SelectItem>
                <SelectItem value="ANULADO">Anulados</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchCCIRs}>
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de CCIR */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
              <p className="mt-2 text-stone-500">Cargando certificados...</p>
            </div>
          ) : ccirs.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay certificados CCIR</p>
              <Button onClick={handleNuevo} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Crear primer certificado
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Certificado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Impreso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ccirs.map((ccir) => (
                    <TableRow key={ccir.id}>
                      <TableCell className="font-mono font-medium">{ccir.numeroCertificado}</TableCell>
                      <TableCell>{new Date(ccir.fechaEmision).toLocaleDateString('es-AR')}</TableCell>
                      <TableCell>{ccir.producto}</TableCell>
                      <TableCell>{ccir.cantidad} KG</TableCell>
                      <TableCell>{ccir.paisDestino}</TableCell>
                      <TableCell>
                        <Badge className={getEstadoBadge(ccir.estado)}>
                          {ccir.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ccir.vecesImpreso > 0 ? (
                          <span className="text-green-600 text-sm">{ccir.vecesImpreso}x</span>
                        ) : (
                          <span className="text-stone-400 text-sm">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleVer(ccir)} title="Ver detalles">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleImprimir(ccir)} title="Imprimir" disabled={ccir.estado === 'ANULADO'}>
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEliminar(ccir)} title="Anular" className="text-red-500" disabled={ccir.estado === 'ANULADO'}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      {/* Dialog Nuevo CCIR */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-600" />
              Nuevo Certificado CCIR
            </DialogTitle>
            <DialogDescription>
              Complete los datos para generar un nuevo certificado de exportación
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Producto */}
            <div className="space-y-2 md:col-span-2">
              <Label>Producto *</Label>
              <Input
                value={formData.producto}
                onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
                placeholder="Ej: Media res bovina congelada"
              />
            </div>
            <div className="space-y-2">
              <Label>Cantidad (KG) *</Label>
              <Input
                type="number"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Lote/Tropa</Label>
              <Input
                value={formData.lote}
                onChange={(e) => setFormData({ ...formData, lote: e.target.value })}
                placeholder="Ej: B2026-0001"
              />
            </div>

            {/* Destino */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-sm font-medium text-stone-700 pt-2">
                <MapPin className="w-4 h-4" />
                Destino
              </div>
            </div>
            <div className="space-y-2">
              <Label>País de Destino *</Label>
              <Select value={formData.paisDestino} onValueChange={(v) => setFormData({ ...formData, paisDestino: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar país" />
                </SelectTrigger>
                <SelectContent>
                  {PAISES_DESTINO.map(pais => (
                    <SelectItem key={pais} value={pais}>{pais}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Puerto de Destino</Label>
              <Input
                value={formData.puertoDestino}
                onChange={(e) => setFormData({ ...formData, puertoDestino: e.target.value })}
                placeholder="Ej: Génova"
              />
            </div>

            {/* Establecimiento */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-sm font-medium text-stone-700 pt-2">
                <Building2 className="w-4 h-4" />
                Establecimiento
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={formData.nombreEstablecimiento}
                onChange={(e) => setFormData({ ...formData, nombreEstablecimiento: e.target.value })}
                placeholder="Solemar Alimentaria"
              />
            </div>
            <div className="space-y-2">
              <Label>N° Establecimiento</Label>
              <Input
                value={formData.numeroEstablecimiento}
                onChange={(e) => setFormData({ ...formData, numeroEstablecimiento: e.target.value })}
                placeholder="N° de habilitación"
              />
            </div>
            <div className="space-y-2">
              <Label>CUIT</Label>
              <Input
                value={formData.cuitEstablecimiento}
                onChange={(e) => setFormData({ ...formData, cuitEstablecimiento: e.target.value })}
                placeholder="XX-XXXXXXXX-X"
              />
            </div>

            {/* Importador */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-sm font-medium text-stone-700 pt-2">
                <ExternalLink className="w-4 h-4" />
                Importador (opcional)
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={formData.nombreImportador}
                onChange={(e) => setFormData({ ...formData, nombreImportador: e.target.value })}
                placeholder="Nombre de la empresa"
              />
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                value={formData.direccionImportador}
                onChange={(e) => setFormData({ ...formData, direccionImportador: e.target.value })}
                placeholder="Dirección del importador"
              />
            </div>

            {/* Transporte */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-sm font-medium text-stone-700 pt-2">
                <Package className="w-4 h-4" />
                Transporte y Contenedor
              </div>
            </div>
            <div className="space-y-2">
              <Label>N° Contenedor</Label>
              <Input
                value={formData.numeroContenedor}
                onChange={(e) => setFormData({ ...formData, numeroContenedor: e.target.value })}
                placeholder="Número de contenedor"
              />
            </div>
            <div className="space-y-2">
              <Label>Matrícula</Label>
              <Input
                value={formData.matriculaTransporte}
                onChange={(e) => setFormData({ ...formData, matriculaTransporte: e.target.value })}
                placeholder="Patente del transporte"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Números de Precintos</Label>
              <Input
                value={formData.numeroPrecintos}
                onChange={(e) => setFormData({ ...formData, numeroPrecintos: e.target.value })}
                placeholder="Separados por coma: 12345, 12346, 12347"
              />
            </div>

            {/* Observaciones */}
            <div className="space-y-2 md:col-span-2">
              <Label>Observaciones</Label>
              <Textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas adicionales..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleGuardar} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Guardando...' : 'Crear Certificado'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Ver Detalles */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-600" />
              Detalles del CCIR
            </DialogTitle>
            <DialogDescription>
              {ccirSeleccionado?.numeroCertificado}
            </DialogDescription>
          </DialogHeader>
          {ccirSeleccionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-stone-500 text-xs">N° Certificado</Label>
                  <p className="font-mono font-medium">{ccirSeleccionado.numeroCertificado}</p>
                </div>
                <div>
                  <Label className="text-stone-500 text-xs">Fecha de Emisión</Label>
                  <p>{new Date(ccirSeleccionado.fechaEmision).toLocaleDateString('es-AR')}</p>
                </div>
                <div>
                  <Label className="text-stone-500 text-xs">Estado</Label>
                  <Badge className={getEstadoBadge(ccirSeleccionado.estado)}>
                    {ccirSeleccionado.estado}
                  </Badge>
                </div>
                <div>
                  <Label className="text-stone-500 text-xs">Veces Impreso</Label>
                  <p>{ccirSeleccionado.vecesImpreso}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-stone-700 mb-2">Producto</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-stone-500 text-xs">Descripción</Label>
                    <p>{ccirSeleccionado.producto}</p>
                  </div>
                  <div>
                    <Label className="text-stone-500 text-xs">Cantidad</Label>
                    <p>{ccirSeleccionado.cantidad} KG</p>
                  </div>
                  <div>
                    <Label className="text-stone-500 text-xs">Lote</Label>
                    <p>{ccirSeleccionado.lote || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-stone-700 mb-2">Destino</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-stone-500 text-xs">País</Label>
                    <p>{ccirSeleccionado.paisDestino}</p>
                  </div>
                  <div>
                    <Label className="text-stone-500 text-xs">Puerto</Label>
                    <p>{ccirSeleccionado.puertoDestino || '-'}</p>
                  </div>
                </div>
              </div>

              {ccirSeleccionado.observaciones && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-stone-700 mb-2">Observaciones</h4>
                  <p className="text-sm text-stone-600">{ccirSeleccionado.observaciones}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setViewOpen(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => { setViewOpen(false); handleImprimir(ccirSeleccionado); }} className="bg-amber-500 hover:bg-amber-600">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar/Anular */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Anular Certificado CCIR</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea anular el certificado &quot;{ccirSeleccionado?.numeroCertificado}&quot;?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarEliminar} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'Anulando...' : 'Anular Certificado'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CCIRModule
