'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, Plus, Printer, Search, Eye, Trash2, 
  Save, X, Loader2, User, MapPin, Beef, FileCheck
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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

interface DeclaracionJurada {
  id: string
  numeroDeclaracion: string
  fecha: string
  productorId?: string | null
  productor?: { id: string; nombre: string; cuit?: string | null; direccion?: string | null } | null
  nombreProductor: string
  cuitProductor?: string | null
  direccionProductor?: string | null
  procedencia?: string | null
  especie: string
  cantidadCabezas: number
  numeroTropa?: string | null
  numeroLote?: string | null
  numeroDTE?: string | null
  numeroGuia?: string | null
  declaracionSanidad?: string | null
  procedenciaLibre: boolean
  observaciones?: string | null
  estado: string
  operador?: { id: string; nombre: string } | null
  fechaImpresion?: string | null
  vecesImpreso: number
}

interface Cliente {
  id: string
  nombre: string
  cuit?: string | null
  direccion?: string | null
}

interface Operador {
  id: string
  nombre: string
  rol: string
}

export function DeclaracionJuradaModule({ operador }: { operador: Operador }) {
  const [declaraciones, setDeclaraciones] = useState<DeclaracionJurada[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [declaracionSeleccionada, setDeclaracionSeleccionada] = useState<DeclaracionJurada | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [filtroEspecie, setFiltroEspecie] = useState('TODOS')

  const [formData, setFormData] = useState({
    productorId: '',
    nombreProductor: '',
    cuitProductor: '',
    direccionProductor: '',
    procedencia: '',
    especie: 'BOVINO',
    cantidadCabezas: '',
    numeroTropa: '',
    numeroLote: '',
    numeroDTE: '',
    numeroGuia: '',
    declaracionSanidad: '',
    procedenciaLibre: true,
    observaciones: ''
  })

  useEffect(() => {
    fetchDeclaraciones()
    fetchClientes()
  }, [filtroEstado, filtroEspecie])

  const fetchDeclaraciones = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado !== 'TODOS') params.append('estado', filtroEstado)
      if (filtroEspecie !== 'TODOS') params.append('especie', filtroEspecie)
      if (searchTerm) params.append('search', searchTerm)
      
      const res = await fetch(`/api/declaracion-jurada?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setDeclaraciones(data.data)
      }
    } catch (error) {
      console.error('Error fetching Declaraciones:', error)
      toast.error('Error al cargar las declaraciones')
    } finally {
      setLoading(false)
    }
  }

  const fetchClientes = async () => {
    try {
      const res = await fetch('/api/clientes')
      const data = await res.json()
      if (data.success) {
        // Filtrar solo productores
        const productores = data.data.filter((c: Cliente & { esProductor?: boolean }) => c.esProductor)
        setClientes(productores)
      }
    } catch (error) {
      console.error('Error fetching clientes:', error)
    }
  }

  const handleNuevo = () => {
    setFormData({
      productorId: '',
      nombreProductor: '',
      cuitProductor: '',
      direccionProductor: '',
      procedencia: '',
      especie: 'BOVINO',
      cantidadCabezas: '',
      numeroTropa: '',
      numeroLote: '',
      numeroDTE: '',
      numeroGuia: '',
      declaracionSanidad: 'Declaro bajo juramento que los animales mencionados provienen de establecimientos libres de enfermedades declarables y han sido criados y manejados de acuerdo con las normativas sanitarias vigentes.',
      procedenciaLibre: true,
      observaciones: ''
    })
    setDialogOpen(true)
  }

  const handleProductorChange = (productorId: string) => {
    const productor = clientes.find(c => c.id === productorId)
    if (productor) {
      setFormData({
        ...formData,
        productorId,
        nombreProductor: productor.nombre,
        cuitProductor: productor.cuit || '',
        direccionProductor: productor.direccion || ''
      })
    }
  }

  const handleVer = (declaracion: DeclaracionJurada) => {
    setDeclaracionSeleccionada(declaracion)
    setViewOpen(true)
  }

  const handleEliminar = (declaracion: DeclaracionJurada) => {
    setDeclaracionSeleccionada(declaracion)
    setDeleteOpen(true)
  }

  const handleGuardar = async () => {
    if (!formData.nombreProductor || !formData.cantidadCabezas) {
      toast.error('Complete los campos obligatorios: Productor y Cantidad de Cabezas')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/declaracion-jurada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          operadorId: operador.id
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Declaración ${data.data.numeroDeclaracion} creada exitosamente`)
        setDialogOpen(false)
        fetchDeclaraciones()
      } else {
        toast.error(data.error || 'Error al crear la declaración')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleImprimir = async (declaracion: DeclaracionJurada) => {
    try {
      // Marcar como impreso
      await fetch('/api/declaracion-jurada', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: declaracion.id,
          marcarImpreso: true
        })
      })

      // Abrir ventana de impresión
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(generatePrintHTML(declaracion))
        printWindow.document.close()
        printWindow.print()
      }
      
      toast.success('Declaración enviada a impresión')
      fetchDeclaraciones()
    } catch (error) {
      toast.error('Error al imprimir')
    }
  }

  const handleConfirmarEliminar = async () => {
    if (!declaracionSeleccionada) return

    setSaving(true)
    try {
      const res = await fetch(`/api/declaracion-jurada?id=${declaracionSeleccionada.id}&operadorId=${operador.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Declaración anulada')
        setDeleteOpen(false)
        fetchDeclaraciones()
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
      'ACTIVA': 'bg-green-100 text-green-700',
      'ANULADA': 'bg-red-100 text-red-700',
      'UTILIZADA': 'bg-blue-100 text-blue-700'
    }
    return estilos[estado] || 'bg-gray-100 text-gray-700'
  }

  const generatePrintHTML = (dj: DeclaracionJurada) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Declaración Jurada - ${dj.numeroDeclaracion}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 22px; font-weight: bold; color: #1a1a1a; }
          .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 14px; font-weight: bold; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
          .row { display: flex; margin-bottom: 8px; }
          .label { font-weight: bold; width: 200px; color: #555; }
          .value { flex: 1; }
          .declaration { background: #f9f9f9; padding: 15px; border: 1px solid #ddd; margin: 20px 0; font-style: italic; }
          .signature { margin-top: 50px; display: flex; justify-content: space-between; }
          .signature-box { text-align: center; width: 45%; }
          .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; }
          .footer { margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #666; }
          .stamp { margin: 30px 0; text-align: center; }
          .stamp-box { border: 2px solid #333; padding: 15px 30px; display: inline-block; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">DECLARACIÓN JURADA DE ORIGEN</div>
          <div class="subtitle">N° ${dj.numeroDeclaracion}</div>
        </div>

        <div class="section">
          <div class="section-title">DATOS DEL PRODUCTOR</div>
          <div class="row"><span class="label">Nombre/Razón Social:</span><span class="value">${dj.nombreProductor}</span></div>
          ${dj.cuitProductor ? `<div class="row"><span class="label">CUIT:</span><span class="value">${dj.cuitProductor}</span></div>` : ''}
          ${dj.direccionProductor ? `<div class="row"><span class="label">Dirección:</span><span class="value">${dj.direccionProductor}</span></div>` : ''}
          ${dj.procedencia ? `<div class="row"><span class="label">Procedencia:</span><span class="value">${dj.procedencia}</span></div>` : ''}
        </div>

        <div class="section">
          <div class="section-title">DATOS DE LOS ANIMALES</div>
          <div class="row"><span class="label">Especie:</span><span class="value">${dj.especie === 'BOVINO' ? 'Bovino' : 'Equino'}</span></div>
          <div class="row"><span class="label">Cantidad de Cabezas:</span><span class="value">${dj.cantidadCabezas}</span></div>
          ${dj.numeroTropa ? `<div class="row"><span class="label">N° Tropa:</span><span class="value">${dj.numeroTropa}</span></div>` : ''}
          ${dj.numeroLote ? `<div class="row"><span class="label">N° Lote:</span><span class="value">${dj.numeroLote}</span></div>` : ''}
        </div>

        <div class="section">
          <div class="section-title">DOCUMENTOS DE TRÁNSITO</div>
          ${dj.numeroDTE ? `<div class="row"><span class="label">N° DTE:</span><span class="value">${dj.numeroDTE}</span></div>` : ''}
          ${dj.numeroGuia ? `<div class="row"><span class="label">N° Guía:</span><span class="value">${dj.numeroGuia}</span></div>` : ''}
        </div>

        <div class="declaration">
          <p><strong>DECLARACIÓN JURADA:</strong></p>
          <p>${dj.declaracionSanidad || 'Declaro bajo juramento que los animales mencionados en el presente documento provienen de establecimientos libres de enfermedades declarables, han sido criados y manejados de acuerdo con las normativas sanitarias vigentes, y su origen puede ser plenamente identificado y documentado.'}</p>
          <p style="margin-top: 10px;"><strong>Procedencia de zona libre:</strong> ${dj.procedenciaLibre ? 'SÍ' : 'NO'}</p>
        </div>

        ${dj.observaciones ? `
        <div class="section">
          <div class="section-title">OBSERVACIONES</div>
          <p>${dj.observaciones}</p>
        </div>
        ` : ''}

        <div class="stamp">
          <div class="stamp-box">
            <p style="margin: 0; font-weight: bold;">DOCUMENTO VÁLIDO</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">Para uso oficial</p>
          </div>
        </div>

        <div class="signature">
          <div class="signature-box">
            <div class="signature-line">Firma del Productor</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Firma del Responsable</div>
          </div>
        </div>

        <div class="footer">
          <p>Documento generado el ${new Date().toLocaleString('es-AR')}</p>
          <p>Solemar Alimentaria - Frigorífico</p>
          <p>Fecha de emisión: ${new Date(dj.fecha).toLocaleDateString('es-AR')}</p>
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
                <FileText className="w-5 h-5 text-amber-600" />
                Declaraciones Juradas de Origen
              </CardTitle>
              <CardDescription>
                Declaraciones juradas de origen de los productos
              </CardDescription>
            </div>
            <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Declaración
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Buscar por número, productor, DTE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchDeclaraciones()}
                className="pl-10"
              />
            </div>
            <Select value={filtroEspecie} onValueChange={setFiltroEspecie}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Especie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todas</SelectItem>
                <SelectItem value="BOVINO">Bovino</SelectItem>
                <SelectItem value="EQUINO">Equino</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="ACTIVA">Activas</SelectItem>
                <SelectItem value="UTILIZADA">Utilizadas</SelectItem>
                <SelectItem value="ANULADA">Anuladas</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchDeclaraciones}>
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Declaraciones */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
              <p className="mt-2 text-stone-500">Cargando declaraciones...</p>
            </div>
          ) : declaraciones.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay declaraciones juradas</p>
              <Button onClick={handleNuevo} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Crear primera declaración
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Declaración</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Productor</TableHead>
                    <TableHead>Especie</TableHead>
                    <TableHead>Cabezas</TableHead>
                    <TableHead>Tropa/DTE</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Impreso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {declaraciones.map((dj) => (
                    <TableRow key={dj.id}>
                      <TableCell className="font-mono font-medium">{dj.numeroDeclaracion}</TableCell>
                      <TableCell>{new Date(dj.fecha).toLocaleDateString('es-AR')}</TableCell>
                      <TableCell>{dj.nombreProductor}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {dj.especie === 'BOVINO' ? 'Bovino' : 'Equino'}
                        </Badge>
                      </TableCell>
                      <TableCell>{dj.cantidadCabezas}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {dj.numeroTropa && <div>Tropa: {dj.numeroTropa}</div>}
                          {dj.numeroDTE && <div className="text-stone-500">DTE: {dj.numeroDTE}</div>}
                          {!dj.numeroTropa && !dj.numeroDTE && '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getEstadoBadge(dj.estado)}>
                          {dj.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {dj.vecesImpreso > 0 ? (
                          <span className="text-green-600 text-sm">{dj.vecesImpreso}x</span>
                        ) : (
                          <span className="text-stone-400 text-sm">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleVer(dj)} title="Ver detalles">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleImprimir(dj)} title="Imprimir" disabled={dj.estado === 'ANULADA'}>
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEliminar(dj)} title="Anular" className="text-red-500" disabled={dj.estado === 'ANULADA'}>
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

      {/* Dialog Nueva Declaración */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              Nueva Declaración Jurada
            </DialogTitle>
            <DialogDescription>
              Complete los datos para generar una nueva declaración jurada de origen
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Productor */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-sm font-medium text-stone-700">
                <User className="w-4 h-4" />
                Datos del Productor
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Seleccionar Productor (opcional)</Label>
              <Select value={formData.productorId} onValueChange={handleProductorChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un productor registrado" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map(cliente => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre} {cliente.cuit ? `- ${cliente.cuit}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-stone-500">O complete los datos manualmente</p>
            </div>
            <div className="space-y-2">
              <Label>Nombre/Razón Social *</Label>
              <Input
                value={formData.nombreProductor}
                onChange={(e) => setFormData({ ...formData, nombreProductor: e.target.value })}
                placeholder="Nombre del productor"
              />
            </div>
            <div className="space-y-2">
              <Label>CUIT</Label>
              <Input
                value={formData.cuitProductor}
                onChange={(e) => setFormData({ ...formData, cuitProductor: e.target.value })}
                placeholder="XX-XXXXXXXX-X"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Dirección</Label>
              <Input
                value={formData.direccionProductor}
                onChange={(e) => setFormData({ ...formData, direccionProductor: e.target.value })}
                placeholder="Dirección del establecimiento"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Procedencia</Label>
              <Input
                value={formData.procedencia}
                onChange={(e) => setFormData({ ...formData, procedencia: e.target.value })}
                placeholder="Lugar de procedencia de los animales"
              />
            </div>

            {/* Animales */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-sm font-medium text-stone-700 pt-2">
                <Beef className="w-4 h-4" />
                Datos de los Animales
              </div>
            </div>
            <div className="space-y-2">
              <Label>Especie</Label>
              <Select value={formData.especie} onValueChange={(v) => setFormData({ ...formData, especie: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOVINO">Bovino</SelectItem>
                  <SelectItem value="EQUINO">Equino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cantidad de Cabezas *</Label>
              <Input
                type="number"
                value={formData.cantidadCabezas}
                onChange={(e) => setFormData({ ...formData, cantidadCabezas: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>N° Tropa</Label>
              <Input
                value={formData.numeroTropa}
                onChange={(e) => setFormData({ ...formData, numeroTropa: e.target.value })}
                placeholder="Ej: B2026-0001"
              />
            </div>
            <div className="space-y-2">
              <Label>N° Lote</Label>
              <Input
                value={formData.numeroLote}
                onChange={(e) => setFormData({ ...formData, numeroLote: e.target.value })}
                placeholder="Número de lote"
              />
            </div>

            {/* Documentos */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-sm font-medium text-stone-700 pt-2">
                <FileCheck className="w-4 h-4" />
                Documentos de Tránsito
              </div>
            </div>
            <div className="space-y-2">
              <Label>N° DTE</Label>
              <Input
                value={formData.numeroDTE}
                onChange={(e) => setFormData({ ...formData, numeroDTE: e.target.value })}
                placeholder="Documento de Tránsito Electrónico"
              />
            </div>
            <div className="space-y-2">
              <Label>N° Guía</Label>
              <Input
                value={formData.numeroGuia}
                onChange={(e) => setFormData({ ...formData, numeroGuia: e.target.value })}
                placeholder="Guía de tránsito"
              />
            </div>

            {/* Declaración */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-sm font-medium text-stone-700 pt-2">
                <FileText className="w-4 h-4" />
                Declaración de Sanidad
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Texto de la Declaración</Label>
              <Textarea
                value={formData.declaracionSanidad}
                onChange={(e) => setFormData({ ...formData, declaracionSanidad: e.target.value })}
                placeholder="Declaración jurada de sanidad..."
                rows={4}
              />
            </div>
            <div className="space-y-2 md:col-span-2 flex items-center gap-2">
              <Checkbox
                id="procedenciaLibre"
                checked={formData.procedenciaLibre}
                onCheckedChange={(checked) => setFormData({ ...formData, procedenciaLibre: checked as boolean })}
              />
              <Label htmlFor="procedenciaLibre" className="cursor-pointer">
                Los animales provienen de zona libre de enfermedades declarables
              </Label>
            </div>

            {/* Observaciones */}
            <div className="space-y-2 md:col-span-2">
              <Label>Observaciones</Label>
              <Textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas adicionales..."
                rows={2}
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
              {saving ? 'Guardando...' : 'Crear Declaración'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Ver Detalles */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              Detalles de la Declaración Jurada
            </DialogTitle>
            <DialogDescription>
              {declaracionSeleccionada?.numeroDeclaracion}
            </DialogDescription>
          </DialogHeader>
          {declaracionSeleccionada && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-stone-500 text-xs">N° Declaración</Label>
                  <p className="font-mono font-medium">{declaracionSeleccionada.numeroDeclaracion}</p>
                </div>
                <div>
                  <Label className="text-stone-500 text-xs">Fecha</Label>
                  <p>{new Date(declaracionSeleccionada.fecha).toLocaleDateString('es-AR')}</p>
                </div>
                <div>
                  <Label className="text-stone-500 text-xs">Estado</Label>
                  <Badge className={getEstadoBadge(declaracionSeleccionada.estado)}>
                    {declaracionSeleccionada.estado}
                  </Badge>
                </div>
                <div>
                  <Label className="text-stone-500 text-xs">Veces Impreso</Label>
                  <p>{declaracionSeleccionada.vecesImpreso}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-stone-700 mb-2">Productor</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-stone-500 text-xs">Nombre</Label>
                    <p>{declaracionSeleccionada.nombreProductor}</p>
                  </div>
                  <div>
                    <Label className="text-stone-500 text-xs">CUIT</Label>
                    <p>{declaracionSeleccionada.cuitProductor || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-stone-700 mb-2">Animales</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-stone-500 text-xs">Especie</Label>
                    <p>{declaracionSeleccionada.especie === 'BOVINO' ? 'Bovino' : 'Equino'}</p>
                  </div>
                  <div>
                    <Label className="text-stone-500 text-xs">Cantidad</Label>
                    <p>{declaracionSeleccionada.cantidadCabezas} cabezas</p>
                  </div>
                  <div>
                    <Label className="text-stone-500 text-xs">Tropa</Label>
                    <p>{declaracionSeleccionada.numeroTropa || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-stone-700 mb-2">Documentos</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-stone-500 text-xs">DTE</Label>
                    <p>{declaracionSeleccionada.numeroDTE || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-stone-500 text-xs">Guía</Label>
                    <p>{declaracionSeleccionada.numeroGuia || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-stone-700 mb-2">Declaración</h4>
                <p className="text-sm text-stone-600 bg-stone-50 p-3 rounded">
                  {declaracionSeleccionada.declaracionSanidad}
                </p>
                <p className="text-sm mt-2">
                  <strong>Zona libre:</strong> {declaracionSeleccionada.procedenciaLibre ? 'Sí' : 'No'}
                </p>
              </div>

              {declaracionSeleccionada.observaciones && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-stone-700 mb-2">Observaciones</h4>
                  <p className="text-sm text-stone-600">{declaracionSeleccionada.observaciones}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setViewOpen(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => { setViewOpen(false); handleImprimir(declaracionSeleccionada); }} className="bg-amber-500 hover:bg-amber-600">
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
            <DialogTitle className="text-red-600">Anular Declaración Jurada</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea anular la declaración &quot;{declaracionSeleccionada?.numeroDeclaracion}&quot;?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarEliminar} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'Anulando...' : 'Anular Declaración'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DeclaracionJuradaModule
