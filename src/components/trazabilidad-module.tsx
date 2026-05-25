// NOTA: Componente disponible para uso futuro - verificar antes de eliminar
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  Search, Loader2, FileText, Truck, User, Package, Beef,
  Calendar, Hash, Scale, ClipboardList, TrendingUp, Warehouse,
  Mail, Download, MapPin, CheckCircle, Circle, ArrowRight,
  Barcode, Building, Phone, FileCheck, Tag, Send
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Props {
  operador: Operador
}

type SearchType = 'tropa' | 'garron' | 'codigoBarras' | 'cliente' | 'productor'

interface TrazabilidadData {
  tropa: {
    id: string
    codigo: string
    numero: number
    especie: string
    estado: string
  }
  ingreso: {
    dte: string
    guia: string
    productor: string | null
    usuarioFaena: string
    fechaRecepcion: string
    especie: string
    cantidadCabezas: number
  }
  pesajeCamion: {
    pesoBruto: number | null
    pesoTara: number | null
    pesoNeto: number | null
    patenteChasis: string
    patenteAcoplado: string | null
    transportista: string | null
    fecha: string | null
  } | null
  pesajeIndividual: {
    animales: Array<{
      numero: number
      codigo: string
      tipoAnimal: string
      raza: string | null
      pesoVivo: number | null
      caravana: string | null
      fecha: string | null
    }>
    totalAnimales: number
    pesoTotal: number | null
  } | null
  listaFaena: {
    numero: number
    fecha: string
    estado: string
    cantidadTotal: number
    tropas: Array<{
      codigo: string
      cantidad: number
      corral: string | null
    }>
  } | null
  garrones: {
    asignaciones: Array<{
      garron: number
      animalNumero: number | null
      tipoAnimal: string | null
      pesoVivo: number | null
      horaIngreso: string
      completado: boolean
    }>
    totalGarrones: number
  } | null
  romaneo: {
    romaneos: Array<{
      garron: number
      pesoMediaIzq: number | null
      pesoMediaDer: number | null
      pesoTotal: number | null
      rinde: number | null
      denticion: string | null
      tipificador: string | null
      estado: string
      fecha: string
    }>
    totalRomaneos: number
    pesoTotalMedias: number | null
    rindePromedio: number | null
  } | null
  ubicacionCamara: {
    medias: Array<{
      codigo: string
      lado: string
      sigla: string
      peso: number
      camara: string | null
      estado: string
    }>
    totalMedias: number
  } | null
  despacho: {
    facturas: Array<{
      numero: string
      cliente: string
      fecha: string
      total: number
      estado: string
      remito: string | null
    }>
    mediasDespachadas: number
  } | null
  timeline: Array<{
    paso: string
    completado: boolean
    fecha: string | null
    datos: string
  }>
}

// Timeline step configuration
const TIMELINE_STEPS = [
  { key: 'INGRESO', label: 'Ingreso', icon: Truck, color: 'text-amber-600', bg: 'bg-amber-100' },
  { key: 'PESAJE_CAMION', label: 'Pesaje Camión', icon: Scale, color: 'text-blue-600', bg: 'bg-blue-100' },
  { key: 'PESAJE_IND', label: 'Pesaje Individual', icon: Beef, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { key: 'FAENA', label: 'Faena', icon: ClipboardList, color: 'text-red-600', bg: 'bg-red-100' },
  { key: 'ROMANEO', label: 'Romaneo', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  { key: 'CAMARA', label: 'Cámara', icon: Warehouse, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  { key: 'DESPACHO', label: 'Despacho', icon: Package, color: 'text-green-600', bg: 'bg-green-100' },
]

export function TrazabilidadModule({ operador }: Props) {
  const [searchType, setSearchType] = useState<SearchType>('tropa')
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TrazabilidadData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error('Ingrese un valor de búsqueda')
      return
    }

    setLoading(true)
    setError(null)
    setData(null)

    try {
      const params = new URLSearchParams()
      params.append(searchType, searchValue.trim())
      
      const res = await fetch(`/api/trazabilidad?${params.toString()}`)
      const result = await res.json()

      if (result.success) {
        setData(result.data)
        toast.success('Trazabilidad encontrada')
      } else {
        setError(result.error || 'No se encontraron resultados')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error al realizar la búsqueda')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleExportPDF = () => {
    if (!data) return
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      let y = 15

      // Company header
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(51, 51, 51)
      doc.text('Solemar Alimentaria', pageWidth / 2, y, { align: 'center' })
      y += 5
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(120, 120, 120)
      doc.text('Ruta 2 Km 45, San Cayetano | CUIT: 30-12345678-9', pageWidth / 2, y, { align: 'center' })
      y += 8
      doc.setDrawColor(200, 200, 200)
      doc.line(14, y, pageWidth - 14, y)
      y += 8

      // Report title
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(51, 51, 51)
      doc.text('Reporte de Trazabilidad', pageWidth / 2, y, { align: 'center' })
      y += 6
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text(`Tropa: ${data.tropa.codigo} | ${data.tropa.estado.replace(/_/g, ' ')}`, pageWidth / 2, y, { align: 'center' })
      y += 5
      doc.setDrawColor(200, 200, 200)
      doc.line(14, y, pageWidth - 14, y)
      y += 8

      // Helper for section titles
      const addSectionTitle = (title: string) => {
        if (y > pageHeight - 40) { doc.addPage(); y = 15 }
        y += 4
        doc.setFillColor(245, 245, 245)
        doc.rect(14, y - 4, pageWidth - 28, 8, 'F')
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(80, 80, 80)
        doc.text(title, 16, y + 1)
        y += 10
      }

      // Ingreso section
      addSectionTitle('DATOS DE INGRESO')
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      const ingresoData = [
        ['DTE', data.ingreso.dte || '-'],
        ['Guía', data.ingreso.guia || '-'],
        ['Productor', data.ingreso.productor || '-'],
        ['Usuario Faena', data.ingreso.usuarioFaena || '-'],
        ['Especie', data.ingreso.especie || '-'],
        ['Cantidad Cabezas', String(data.ingreso.cantidadCabezas)],
        ['Fecha Recepción', formatDate(data.ingreso.fechaRecepcion)],
      ]
      autoTable(doc, {
        startY: y,
        body: ingresoData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 }, 1: { cellWidth: 120 } },
        margin: { left: 20 },
      })
      y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0) + 6 || y + 30

      // Pesaje Camion
      if (data.pesajeCamion) {
        addSectionTitle('PESAJE DE CAMIÓN')
        const pc = data.pesajeCamion
        autoTable(doc, {
          startY: y,
          body: [
            ['Peso Bruto', `${pc.pesoBruto?.toFixed(0) || '-'} kg`],
            ['Peso Tara', `${pc.pesoTara?.toFixed(0) || '-'} kg`],
            ['Peso Neto', `${pc.pesoNeto?.toFixed(0) || '-'} kg`],
            ['Patente Chasis', pc.patenteChasis || '-'],
            ['Patente Acoplado', pc.patenteAcoplado || '-'],
            ['Transportista', pc.transportista || '-'],
            ['Fecha', formatDate(pc.fecha)],
          ],
          theme: 'plain',
          styles: { fontSize: 9, cellPadding: 2 },
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
          margin: { left: 20 },
        })
        y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0) + 6 || y + 30
      }

      // Pesaje Individual
      if (data.pesajeIndividual && data.pesajeIndividual.animales.length > 0) {
        addSectionTitle(`PESAJE INDIVIDUAL (${data.pesajeIndividual.totalAnimales} animales)`)
        autoTable(doc, {
          startY: y,
          head: [['N°', 'Código', 'Tipo', 'Raza', 'Caravana', 'Peso (kg)', 'Fecha']],
          body: data.pesajeIndividual.animales.map(a => [
            String(a.numero), a.codigo, a.tipoAnimal, a.raza || '-',
            a.caravana || '-', a.pesoVivo?.toFixed(0) || '-', formatDate(a.fecha),
          ]),
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          margin: { left: 14, right: 14 },
        })
        y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0) + 6 || y + 30
      }

      // Lista de Faena
      if (data.listaFaena) {
        addSectionTitle('LISTA DE FAENA')
        const lf = data.listaFaena
        autoTable(doc, {
          startY: y,
          body: [
            ['Número', `#${lf.numero}`],
            ['Fecha', formatDate(lf.fecha)],
            ['Estado', lf.estado],
            ['Cantidad Total', `${lf.cantidadTotal} animales`],
            ['Tropas', lf.tropas.map(t => `${t.codigo} (${t.cantidad})`).join(', ')],
          ],
          theme: 'plain',
          styles: { fontSize: 9, cellPadding: 2 },
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
          margin: { left: 20 },
        })
        y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0) + 6 || y + 30
      }

      // Garrones
      if (data.garrones && data.garrones.asignaciones.length > 0) {
        addSectionTitle(`ASIGNACIÓN DE GARRONES (${data.garrones.totalGarrones})`)
        autoTable(doc, {
          startY: y,
          head: [['Garrón', 'Animal N°', 'Tipo', 'Peso Vivo (kg)', 'Hora', 'Estado']],
          body: data.garrones.asignaciones.map(g => [
            `G-${g.garron}`, String(g.animalNumero || '-'), g.tipoAnimal || '-',
            g.pesoVivo?.toFixed(0) || '-', formatDate(g.horaIngreso),
            g.completado ? 'Completado' : 'Pendiente',
          ]),
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          margin: { left: 14, right: 14 },
        })
        y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0) + 6 || y + 30
      }

      // Romaneo
      if (data.romaneo && data.romaneo.romaneos.length > 0) {
        addSectionTitle(`ROMANEO (Rinde Prom: ${data.romaneo.rindePromedio?.toFixed(1) || '-'}%)`)
        autoTable(doc, {
          startY: y,
          head: [['Garrón', 'Med. Izq (kg)', 'Med. Der (kg)', 'Total (kg)', 'Rinde %', 'Denticion', 'Tipif.', 'Estado']],
          body: data.romaneo.romaneos.map(r => [
            `G-${r.garron}`, r.pesoMediaIzq?.toFixed(1) || '-', r.pesoMediaDer?.toFixed(1) || '-',
            r.pesoTotal?.toFixed(1) || '-', r.rinde?.toFixed(1) || '-',
            r.denticion || '-', r.tipificador || '-', r.estado,
          ]),
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          margin: { left: 14, right: 14 },
        })
        y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0) + 6 || y + 30
      }

      // Camara
      if (data.ubicacionCamara && data.ubicacionCamara.medias.length > 0) {
        addSectionTitle(`UBICACIÓN EN CÁMARA (${data.ubicacionCamara.totalMedias} medias)`)
        autoTable(doc, {
          startY: y,
          head: [['Código Barras', 'Lado', 'Sigla', 'Peso (kg)', 'Cámara', 'Estado']],
          body: data.ubicacionCamara.medias.map(m => [
            m.codigo, m.lado === 'IZQUIERDA' ? 'Izq' : 'Der', m.sigla,
            m.peso.toFixed(1), m.camara || '-', m.estado,
          ]),
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          margin: { left: 14, right: 14 },
        })
        y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0) + 6 || y + 30
      }

      // Despacho
      if (data.despacho && data.despacho.facturas.length > 0) {
        addSectionTitle(`DESPACHO (${data.despacho.mediasDespachadas} medias despachadas)`)
        autoTable(doc, {
          startY: y,
          head: [['Factura N°', 'Cliente', 'Fecha', 'Total', 'Remito', 'Estado']],
          body: data.despacho.facturas.map(f => [
            f.numero, f.cliente, formatDate(f.fecha), `$${f.total.toFixed(2)}`,
            f.remito || '-', f.estado,
          ]),
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          margin: { left: 14, right: 14 },
        })
      }

      // Footer on all pages
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(150, 150, 150)
        doc.text(`Generado el ${new Date().toLocaleString('es-AR')}`, 14, pageHeight - 8)
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' })
      }

      doc.save(`trazabilidad_${data.tropa.codigo}_${new Date().toISOString().slice(0, 10)}.pdf`)
      toast.success('PDF exportado correctamente')
    } catch (err) {
      console.error('Error exportando PDF:', err)
      toast.error('Error al exportar PDF')
    }
  }

  const buildEmailBody = () => {
    if (!data) return ''
    const lines: string[] = []
    lines.push('=== TRAZABILIDAD ===')
    lines.push(`Tropa: ${data.tropa.codigo} | Estado: ${data.tropa.estado.replace(/_/g, ' ')}`)
    lines.push('')
    lines.push('--- INGRESO ---')
    lines.push(`DTE: ${data.ingreso.dte || '-'}`)
    lines.push(`Guía: ${data.ingreso.guia || '-'}`)
    lines.push(`Productor: ${data.ingreso.productor || '-'}`)
    lines.push(`Especie: ${data.ingreso.especie} | Cabezas: ${data.ingreso.cantidadCabezas}`)
    lines.push(`Fecha Recepción: ${formatDate(data.ingreso.fechaRecepcion)}`)
    if (data.pesajeCamion) {
      lines.push('')
      lines.push('--- PESAJE CAMIÓN ---')
      lines.push(`Bruto: ${data.pesajeCamion.pesoBruto?.toFixed(0) || '-'} kg | Tara: ${data.pesajeCamion.pesoTara?.toFixed(0) || '-'} kg | Neto: ${data.pesajeCamion.pesoNeto?.toFixed(0) || '-'} kg`)
      lines.push(`Patente: ${data.pesajeCamion.patenteChasis}${data.pesajeCamion.patenteAcoplado ? ' / ' + data.pesajeCamion.patenteAcoplado : ''}`)
    }
    if (data.pesajeIndividual && data.pesajeIndividual.animales.length > 0) {
      lines.push('')
      lines.push(`--- PESAJE INDIVIDUAL (${data.pesajeIndividual.totalAnimales} animales) ---`)
      data.pesajeIndividual.animales.forEach(a => {
        lines.push(`  N°${a.numero} | ${a.codigo} | ${a.tipoAnimal} | ${a.raza || '-'} | Peso: ${a.pesoVivo?.toFixed(0) || '-'} kg`)
      })
    }
    if (data.listaFaena) {
      lines.push('')
      lines.push('--- LISTA DE FAENA ---')
      lines.push(`Lista N°${data.listaFaena.numero} | Estado: ${data.listaFaena.estado} | ${data.listaFaena.cantidadTotal} animales`)
    }
    if (data.romaneo && data.romaneo.romaneos.length > 0) {
      lines.push('')
      lines.push(`--- ROMANEO (Rinde Prom: ${data.romaneo.rindePromedio?.toFixed(1) || '-'}%) ---`)
      data.romaneo.romaneos.forEach(r => {
        lines.push(`  G-${r.garron} | Izq: ${r.pesoMediaIzq?.toFixed(1) || '-'} kg | Der: ${r.pesoMediaDer?.toFixed(1) || '-'} kg | Total: ${r.pesoTotal?.toFixed(1) || '-'} kg | Rinde: ${r.rinde?.toFixed(1) || '-'}%`)
      })
    }
    if (data.ubicacionCamara && data.ubicacionCamara.medias.length > 0) {
      lines.push('')
      lines.push(`--- CÁMARA (${data.ubicacionCamara.totalMedias} medias) ---`)
    }
    if (data.despacho && data.despacho.facturas.length > 0) {
      lines.push('')
      lines.push(`--- DESPACHO (${data.despacho.mediasDespachadas} medias despachadas) ---`)
      data.despacho.facturas.forEach(f => {
        lines.push(`  Factura: ${f.numero} | Cliente: ${f.cliente} | Total: $${f.total.toFixed(2)} | Estado: ${f.estado}`)
      })
    }
    lines.push('')
    lines.push('--- LÍNEA DE TIEMPO ---')
    data.timeline.forEach(s => {
      const mark = s.completado ? '[OK]' : '[  ]'
      lines.push(`  ${mark} ${s.datos}${s.fecha ? ' (' + formatDate(s.fecha) + ')' : ''}`)
    })
    return lines.join('\n')
  }

  const handleSendEmail = () => {
    if (!data) return
    setEmailTo('')
    setEmailDialogOpen(true)
  }

  const handleConfirmSendEmail = async () => {
    if (!data || !emailTo.trim()) {
      toast.error('Ingrese un email válido')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailTo.trim())) {
      toast.error('El formato del email no es válido')
      return
    }
    setSendingEmail(true)
    try {
      const body = buildEmailBody()
      const subject = `Trazabilidad - Tropa ${data.tropa.codigo} - ${data.tropa.estado.replace(/_/g, ' ')}`
      const mailtoLink = `mailto:${encodeURIComponent(emailTo.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      window.open(mailtoLink, '_blank')
      setEmailDialogOpen(false)
      toast.success('Se abrió el cliente de email con los datos pre-cargados')
    } catch (err) {
      console.error('Error enviando email:', err)
      toast.error('Error al abrir el cliente de email')
    } finally {
      setSendingEmail(false)
    }
  }

  const formatDate = (date: string | Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimelineStepConfig = (paso: string) => {
    return TIMELINE_STEPS.find(s => s.key === paso) || TIMELINE_STEPS[0]
  }

  const getEstadoBadge = (estado: string) => {
    const colors: Record<string, string> = {
      'RECIBIDO': 'bg-blue-100 text-blue-700',
      'EN_CORRAL': 'bg-amber-100 text-amber-700',
      'EN_PESAJE': 'bg-yellow-100 text-yellow-700',
      'PESADO': 'bg-emerald-100 text-emerald-700',
      'LISTO_FAENA': 'bg-orange-100 text-orange-700',
      'EN_FAENA': 'bg-red-100 text-red-700',
      'FAENADO': 'bg-purple-100 text-purple-700',
      'DESPACHADO': 'bg-green-100 text-green-700',
      'PENDIENTE': 'bg-stone-100 text-stone-700',
      'CONFIRMADO': 'bg-emerald-100 text-emerald-700',
    }
    return colors[estado] || 'bg-stone-100 text-stone-700'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Search className="w-8 h-8 text-amber-500" />
              Trazabilidad
            </h1>
            <p className="text-stone-500 mt-1">Seguimiento completo del recorrido de animales y productos</p>
          </div>
          {data && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportPDF} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Exportar PDF
              </Button>
              <Button variant="outline" onClick={handleSendEmail} className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Enviar Email
              </Button>
            </div>
          )}
        </div>

        {/* Search Card */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={searchType} onValueChange={(v) => setSearchType(v as SearchType)}>
                <SelectTrigger className="w-full md:w-48 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tropa">
                    <span className="flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Tropa
                    </span>
                  </SelectItem>
                  <SelectItem value="garron">
                    <span className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Garrón
                    </span>
                  </SelectItem>
                  <SelectItem value="codigoBarras">
                    <span className="flex items-center gap-2">
                      <Barcode className="w-4 h-4" />
                      Código Barras
                    </span>
                  </SelectItem>
                  <SelectItem value="cliente">
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Cliente
                    </span>
                  </SelectItem>
                  <SelectItem value="productor">
                    <span className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Productor
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder={
                  searchType === 'tropa' ? 'Ej: B20260001 o 1' :
                  searchType === 'garron' ? 'Ej: 15' :
                  searchType === 'codigoBarras' ? 'Escanear código de barras...' :
                  searchType === 'cliente' ? 'Nombre o CUIT del cliente...' :
                  'Nombre o CUIT del productor...'
                }
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 h-12 text-lg"
              />
              <Button 
                onClick={handleSearch}
                className="h-12 bg-amber-500 hover:bg-amber-600 px-8"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="border-0 shadow-md border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-600">
                <Circle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {data && (
          <div className="space-y-6">
            {/* Tropa Info Header */}
            <Card className="border-0 shadow-md bg-gradient-to-r from-amber-50 to-orange-50">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-amber-500 text-white text-lg px-3 py-1">
                        {data.tropa.codigo}
                      </Badge>
                      <Badge className={getEstadoBadge(data.tropa.estado)}>
                        {data.tropa.estado.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-stone-600 mt-2">
                      {data.ingreso.cantidadCabezas} cabezas • {data.ingreso.especie.toLowerCase()} • 
                      Usuario Faena: {data.ingreso.usuarioFaena}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-stone-500">Fecha de Recepción</p>
                    <p className="font-semibold text-stone-800">{formatDate(data.ingreso.fechaRecepcion)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  Línea de Tiempo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-start justify-between overflow-x-auto pb-4">
                  {data.timeline.map((step, index) => {
                    const config = getTimelineStepConfig(step.paso)
                    const IconComponent = config.icon
                    return (
                      <div key={step.paso} className="flex items-center">
                        <div className="flex flex-col items-center min-w-[100px]">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            step.completado ? config.bg : 'bg-stone-100'
                          }`}>
                            {step.completado ? (
                              <IconComponent className={`w-6 h-6 ${config.color}`} />
                            ) : (
                              <Circle className="w-6 h-6 text-stone-300" />
                            )}
                          </div>
                          <p className={`text-xs mt-2 text-center font-medium ${
                            step.completado ? 'text-stone-700' : 'text-stone-400'
                          }`}>
                            {config.label}
                          </p>
                          {step.completado && step.fecha && (
                            <p className="text-xs text-stone-400 mt-1">
                              {formatDate(step.fecha)}
                            </p>
                          )}
                          <p className="text-xs text-stone-400 mt-1 text-center max-w-[80px] truncate">
                            {step.datos}
                          </p>
                        </div>
                        {index < data.timeline.length - 1 && (
                          <ArrowRight className={`w-6 h-6 mx-2 ${
                            step.completado ? 'text-amber-400' : 'text-stone-200'
                          }`} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Detail Tabs */}
            <Tabs defaultValue="ingreso" className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto">
                <TabsTrigger value="ingreso" className="text-xs">Ingreso</TabsTrigger>
                <TabsTrigger value="pesaje" className="text-xs">Pesaje</TabsTrigger>
                <TabsTrigger value="animales" className="text-xs">Animales</TabsTrigger>
                <TabsTrigger value="faena" className="text-xs">Faena</TabsTrigger>
                <TabsTrigger value="garrones" className="text-xs">Garrones</TabsTrigger>
                <TabsTrigger value="romaneo" className="text-xs">Romaneo</TabsTrigger>
                <TabsTrigger value="camara" className="text-xs">Cámara</TabsTrigger>
                <TabsTrigger value="despacho" className="text-xs">Despacho</TabsTrigger>
              </TabsList>

              {/* Ingreso Tab */}
              <TabsContent value="ingreso">
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-stone-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Truck className="w-5 h-5 text-amber-500" />
                      Datos de Ingreso
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-stone-500">DTE</p>
                        <p className="font-semibold text-stone-800">{data.ingreso.dte}</p>
                      </div>
                      <div>
                        <p className="text-sm text-stone-500">Guía</p>
                        <p className="font-semibold text-stone-800">{data.ingreso.guia}</p>
                      </div>
                      <div>
                        <p className="text-sm text-stone-500">Productor</p>
                        <p className="font-semibold text-stone-800">{data.ingreso.productor || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-stone-500">Usuario Faena</p>
                        <p className="font-semibold text-stone-800">{data.ingreso.usuarioFaena}</p>
                      </div>
                      <div>
                        <p className="text-sm text-stone-500">Especie</p>
                        <p className="font-semibold text-stone-800">{data.ingreso.especie}</p>
                      </div>
                      <div>
                        <p className="text-sm text-stone-500">Cantidad Cabezas</p>
                        <p className="font-semibold text-stone-800">{data.ingreso.cantidadCabezas}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pesaje Tab */}
              <TabsContent value="pesaje">
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-stone-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Scale className="w-5 h-5 text-blue-500" />
                      Pesaje de Camión
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {data.pesajeCamion ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                          <p className="text-sm text-stone-500">Peso Bruto</p>
                          <p className="font-semibold text-stone-800">{data.pesajeCamion.pesoBruto?.toFixed(0) || '-'} kg</p>
                        </div>
                        <div>
                          <p className="text-sm text-stone-500">Tara</p>
                          <p className="font-semibold text-stone-800">{data.pesajeCamion.pesoTara?.toFixed(0) || '-'} kg</p>
                        </div>
                        <div>
                          <p className="text-sm text-stone-500">Peso Neto</p>
                          <p className="font-semibold text-2xl text-amber-600">{data.pesajeCamion.pesoNeto?.toFixed(0) || '-'} kg</p>
                        </div>
                        <div>
                          <p className="text-sm text-stone-500">Fecha</p>
                          <p className="font-semibold text-stone-800">{formatDate(data.pesajeCamion.fecha)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-stone-500">Patente Chasis</p>
                          <p className="font-semibold text-stone-800">{data.pesajeCamion.patenteChasis}</p>
                        </div>
                        <div>
                          <p className="text-sm text-stone-500">Patente Acoplado</p>
                          <p className="font-semibold text-stone-800">{data.pesajeCamion.patenteAcoplado || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-stone-500">Transportista</p>
                          <p className="font-semibold text-stone-800">{data.pesajeCamion.transportista || '-'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-stone-400">
                        <Scale className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Sin datos de pesaje de camión</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Animales Tab */}
              <TabsContent value="animales">
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-stone-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Beef className="w-5 h-5 text-emerald-500" />
                      Pesaje Individual
                      {data.pesajeIndividual && (
                        <Badge variant="outline" className="ml-2">
                          {data.pesajeIndividual.totalAnimales} animales | {data.pesajeIndividual.pesoTotal?.toFixed(0) || '-'} kg total
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {data.pesajeIndividual && data.pesajeIndividual.animales.length > 0 ? (
                      <ScrollArea className="h-96">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-stone-50">
                              <TableHead className="w-20">N°</TableHead>
                              <TableHead>Código</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Raza</TableHead>
                              <TableHead>Caravana</TableHead>
                              <TableHead className="text-right">Peso (kg)</TableHead>
                              <TableHead>Fecha</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.pesajeIndividual.animales.map((animal) => (
                              <TableRow key={animal.codigo} className="hover:bg-stone-50">
                                <TableCell className="font-mono font-bold">{animal.numero}</TableCell>
                                <TableCell className="font-mono">{animal.codigo}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{animal.tipoAnimal}</Badge>
                                </TableCell>
                                <TableCell>{animal.raza || '-'}</TableCell>
                                <TableCell>{animal.caravana || '-'}</TableCell>
                                <TableCell className="text-right font-semibold text-emerald-600">
                                  {animal.pesoVivo?.toFixed(0) || '-'}
                                </TableCell>
                                <TableCell className="text-sm text-stone-500">
                                  {formatDate(animal.fecha)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    ) : (
                      <div className="py-12 text-center text-stone-400">
                        <Beef className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Sin datos de pesaje individual</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Faena Tab */}
              <TabsContent value="faena">
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-stone-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-red-500" />
                      Lista de Faena
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {data.listaFaena ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div>
                            <p className="text-sm text-stone-500">Número de Lista</p>
                            <p className="font-semibold text-2xl text-amber-600">#{data.listaFaena.numero}</p>
                          </div>
                          <div>
                            <p className="text-sm text-stone-500">Fecha</p>
                            <p className="font-semibold text-stone-800">{formatDate(data.listaFaena.fecha)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-stone-500">Estado</p>
                            <Badge className={getEstadoBadge(data.listaFaena.estado)}>
                              {data.listaFaena.estado}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm text-stone-500">Cantidad Total</p>
                            <p className="font-semibold text-stone-800">{data.listaFaena.cantidadTotal} animales</p>
                          </div>
                        </div>
                        {data.listaFaena.tropas.length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <p className="text-sm font-medium text-stone-600 mb-2">Tropas en la lista:</p>
                              <div className="flex flex-wrap gap-2">
                                {data.listaFaena.tropas.map((t, i) => (
                                  <Badge key={i} variant="outline">
                                    {t.codigo} ({t.cantidad}) - {t.corral || 'Sin corral'}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-stone-400">
                        <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Sin lista de faena asignada</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Garrones Tab */}
              <TabsContent value="garrones">
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-stone-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Tag className="w-5 h-5 text-purple-500" />
                      Asignación de Garrones
                      {data.garrones && (
                        <Badge variant="outline" className="ml-2">
                          {data.garrones.totalGarrones} garrones
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {data.garrones && data.garrones.asignaciones.length > 0 ? (
                      <ScrollArea className="h-96">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-stone-50">
                              <TableHead>Garrón</TableHead>
                              <TableHead>Animal N°</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead className="text-right">Peso Vivo (kg)</TableHead>
                              <TableHead>Hora Ingreso</TableHead>
                              <TableHead>Estado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.garrones.asignaciones.map((g) => (
                              <TableRow key={g.garron} className="hover:bg-stone-50">
                                <TableCell className="font-mono font-bold text-purple-600">G-{g.garron}</TableCell>
                                <TableCell>{g.animalNumero || '-'}</TableCell>
                                <TableCell>
                                  {g.tipoAnimal && <Badge variant="outline">{g.tipoAnimal}</Badge>}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {g.pesoVivo?.toFixed(0) || '-'}
                                </TableCell>
                                <TableCell className="text-sm text-stone-500">
                                  {formatDate(g.horaIngreso)}
                                </TableCell>
                                <TableCell>
                                  {g.completado ? (
                                    <Badge className="bg-green-100 text-green-700">Completado</Badge>
                                  ) : (
                                    <Badge className="bg-amber-100 text-amber-700">Pendiente</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    ) : (
                      <div className="py-12 text-center text-stone-400">
                        <Tag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Sin garrones asignados</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Romaneo Tab */}
              <TabsContent value="romaneo">
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-stone-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-orange-500" />
                      Romaneo
                      {data.romaneo && (
                        <Badge variant="outline" className="ml-2">
                          {data.romaneo.totalRomaneos} medias | Rinde: {data.romaneo.rindePromedio?.toFixed(1) || '-'}%
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {data.romaneo && data.romaneo.romaneos.length > 0 ? (
                      <ScrollArea className="h-96">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-stone-50">
                              <TableHead>Garrón</TableHead>
                              <TableHead className="text-right">Media Izq (kg)</TableHead>
                              <TableHead className="text-right">Media Der (kg)</TableHead>
                              <TableHead className="text-right">Total (kg)</TableHead>
                              <TableHead className="text-right">Rinde %</TableHead>
                              <TableHead>Denticion</TableHead>
                              <TableHead>Tipificador</TableHead>
                              <TableHead>Estado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.romaneo.romaneos.map((r) => (
                              <TableRow key={r.garron} className="hover:bg-stone-50">
                                <TableCell className="font-mono font-bold text-purple-600">G-{r.garron}</TableCell>
                                <TableCell className="text-right">{r.pesoMediaIzq?.toFixed(1) || '-'}</TableCell>
                                <TableCell className="text-right">{r.pesoMediaDer?.toFixed(1) || '-'}</TableCell>
                                <TableCell className="text-right font-semibold text-orange-600">
                                  {r.pesoTotal?.toFixed(1) || '-'}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-emerald-600">
                                  {r.rinde?.toFixed(1) || '-'}%
                                </TableCell>
                                <TableCell>{r.denticion || '-'}</TableCell>
                                <TableCell>{r.tipificador || '-'}</TableCell>
                                <TableCell>
                                  <Badge className={getEstadoBadge(r.estado)}>
                                    {r.estado}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    ) : (
                      <div className="py-12 text-center text-stone-400">
                        <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Sin datos de romaneo</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Cámara Tab */}
              <TabsContent value="camara">
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-stone-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Warehouse className="w-5 h-5 text-cyan-500" />
                      Ubicación en Cámara
                      {data.ubicacionCamara && (
                        <Badge variant="outline" className="ml-2">
                          {data.ubicacionCamara.totalMedias} medias
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {data.ubicacionCamara && data.ubicacionCamara.medias.length > 0 ? (
                      <ScrollArea className="h-96">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-stone-50">
                              <TableHead>Código de Barras</TableHead>
                              <TableHead>Lado</TableHead>
                              <TableHead>Sigla</TableHead>
                              <TableHead className="text-right">Peso (kg)</TableHead>
                              <TableHead>Cámara</TableHead>
                              <TableHead>Estado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.ubicacionCamara.medias.map((m) => (
                              <TableRow key={m.codigo} className="hover:bg-stone-50">
                                <TableCell className="font-mono text-xs">{m.codigo}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={
                                    m.lado === 'IZQUIERDA' ? 'border-blue-300 text-blue-600' : 'border-red-300 text-red-600'
                                  }>
                                    {m.lado === 'IZQUIERDA' ? 'Izq' : 'Der'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{m.sigla}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-semibold">{m.peso.toFixed(1)}</TableCell>
                                <TableCell>{m.camara || '-'}</TableCell>
                                <TableCell>
                                  <Badge className={getEstadoBadge(m.estado)}>
                                    {m.estado}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    ) : (
                      <div className="py-12 text-center text-stone-400">
                        <Warehouse className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Sin medias en cámara</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Despacho Tab */}
              <TabsContent value="despacho">
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-stone-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="w-5 h-5 text-green-500" />
                      Despacho
                      {data.despacho && (
                        <Badge variant="outline" className="ml-2">
                          {data.despacho.mediasDespachadas} medias despachadas
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {data.despacho && data.despacho.facturas.length > 0 ? (
                      <ScrollArea className="h-96">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-stone-50">
                              <TableHead>Factura N°</TableHead>
                              <TableHead>Cliente</TableHead>
                              <TableHead>Fecha</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead>Remito</TableHead>
                              <TableHead>Estado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.despacho.facturas.map((f) => (
                              <TableRow key={f.numero} className="hover:bg-stone-50">
                                <TableCell className="font-mono font-bold text-green-600">{f.numero}</TableCell>
                                <TableCell>{f.cliente}</TableCell>
                                <TableCell>{formatDate(f.fecha)}</TableCell>
                                <TableCell className="text-right font-semibold">
                                  ${f.total.toFixed(2)}
                                </TableCell>
                                <TableCell>{f.remito || '-'}</TableCell>
                                <TableCell>
                                  <Badge className={getEstadoBadge(f.estado)}>
                                    {f.estado}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    ) : (
                      <div className="py-12 text-center text-stone-400">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Sin datos de despacho</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Email Dialog */}
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogContent className="sm:max-w-md" maximizable>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-500" />
                Enviar Trazabilidad por Email
              </DialogTitle>
              <DialogDescription>
                Se abrirá su cliente de correo con un resumen de la trazabilidad de la tropa {data?.tropa.codigo}. Complete el destinatario.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label htmlFor="email-to" className="text-sm font-medium text-stone-700">
                  Destinatario
                </label>
                <Input
                  id="email-to"
                  type="email"
                  placeholder="destinatario@ejemplo.com"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmSendEmail() }}
                />
              </div>
              <div className="rounded-md bg-stone-50 border p-3 text-xs text-stone-600 max-h-32 overflow-y-auto">
                <p className="font-medium text-stone-700 mb-1">Vista previa del contenido:</p>
                <pre className="whitespace-pre-wrap font-mono">{data ? buildEmailBody().slice(0, 500) : ''}...</pre>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEmailDialogOpen(false)} disabled={sendingEmail}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmSendEmail}
                disabled={sendingEmail || !emailTo.trim()}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {sendingEmail ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Abrir Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Initial State */}
        {!data && !error && (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12">
              <div className="text-center text-stone-400">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Buscar Trazabilidad</p>
                <p className="text-sm">Ingrese un código de tropa, garrón, código de barras, cliente o productor</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default TrazabilidadModule
