'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { 
  FileText, Download, Search, Loader2, Truck, User, Building2,
  Eye, FileSpreadsheet, FileDown
} from 'lucide-react'

interface Operador { id: string; nombre: string; rol: string }

interface Tropa {
  id: string
  numero: number
  codigo: string
  cantidadCabezas: number
  especie: string
  dte: string
  guia: string
  fechaRecepcion: string
  corral?: { nombre: string }
  productor?: { nombre: string; cuit: string }
  usuarioFaena: { nombre: string; cuit: string }
  pesajeCamion?: {
    patenteChasis: string
    patenteAcoplado?: string
    choferNombre?: string
    choferDni?: string
    transportista?: { nombre: string; cuit: string }
    precintos?: string
  }
  animales: Array<{
    id: string
    numero: number
    tipoAnimal: string
    caravana?: string
    pesoVivo?: number
    raza?: string
  }>
}

interface Props { operador: Operador }

const TIPOS_ANIMAL_LABELS: Record<string, string> = {
  'TO': 'TORO', 'VA': 'VACA', 'VQ': 'VAQUILLONA', 'MEJ': 'MEJ', 'NO': 'NOVILLO', 'NT': 'NOVILLITO',
}

export function Planilla01Module({ operador }: Props) {
  const [tropas, setTropas] = useState<Tropa[]>([])
  const [tropaSeleccionada, setTropaSeleccionada] = useState<Tropa | null>(null)
  const [loading, setLoading] = useState(true)
  const [generando, setGenerando] = useState<'excel' | 'pdf' | null>(null)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => { fetchTropas() }, [])

  const fetchTropas = async () => {
    try {
      const res = await fetch('/api/tropas')
      const data = await res.json()
      if (data.success) setTropas(data.data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar tropas')
    } finally {
      setLoading(false)
    }
  }

  const handleSeleccionarTropa = async (tropaId: string) => {
    try {
      const res = await fetch(`/api/tropas/${tropaId}`)
      const data = await res.json()
      if (data.success) setTropaSeleccionada(data.data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar tropa')
    }
  }

  const handleGenerarExcel = async () => {
    if (!tropaSeleccionada) return
    setGenerando('excel')
    try {
      const res = await fetch('/api/planilla01', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tropaId: tropaSeleccionada.id })
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al generar Excel')
      }
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Planilla01_${tropaSeleccionada.codigo?.replace(/\s/g, '_') || tropaSeleccionada.id}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Excel generado correctamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al generar Excel')
    } finally {
      setGenerando(null)
    }
  }

  const handleGenerarPDF = async () => {
    if (!tropaSeleccionada) return
    setGenerando('pdf')
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      
      // Título principal
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('PLANILLA 01 - REGISTRO DE INGRESO DE HACIENDA', pageWidth / 2, 15, { align: 'center' })
      
      // Datos del establecimiento
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('ESTABLECIMIENTO: SOLEMAR ALIMENTARIA S.A.', 14, 28)
      doc.setFont('helvetica', 'normal')
      doc.text(`N° SENASA: 3986`, 120, 28)
      doc.text(`MATRÍCULA: 300`, 180, 28)
      
      // Semana y fecha
      const getSemana = (fecha: string) => {
        const d = new Date(fecha)
        const start = new Date(d.getFullYear(), 0, 1)
        return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7)
      }
      
      doc.text(`SEMANA N°: ${getSemana(tropaSeleccionada.fechaRecepcion)}`, 14, 35)
      doc.text(`AÑO: ${new Date(tropaSeleccionada.fechaRecepcion).getFullYear()}`, 80, 35)
      doc.text(`FECHA: ${new Date(tropaSeleccionada.fechaRecepcion).toLocaleDateString('es-AR')}`, 140, 35)
      
      // Datos del productor
      doc.setFont('helvetica', 'bold')
      doc.text('DATOS DEL PRODUCTOR / USUARIO FAENA', 14, 45)
      doc.setFont('helvetica', 'normal')
      doc.text(`Productor: ${tropaSeleccionada.productor?.nombre || tropaSeleccionada.usuarioFaena?.nombre || '-'}`, 14, 52)
      doc.text(`CUIT: ${tropaSeleccionada.productor?.cuit || tropaSeleccionada.usuarioFaena?.cuit || '-'}`, 120, 52)
      doc.text(`Tropa N°: ${tropaSeleccionada.codigo || '-'}`, 200, 52)
      
      // Datos del transporte
      doc.setFont('helvetica', 'bold')
      doc.text('DATOS DEL TRANSPORTE', 14, 62)
      doc.setFont('helvetica', 'normal')
      doc.text(`Transportista: ${tropaSeleccionada.pesajeCamion?.transportista?.nombre || '-'}`, 14, 69)
      doc.text(`Chofer: ${tropaSeleccionada.pesajeCamion?.choferNombre || '-'}`, 120, 69)
      doc.text(`DNI: ${tropaSeleccionada.pesajeCamion?.choferDni || '-'}`, 200, 69)
      doc.text(`Patente Chasis: ${tropaSeleccionada.pesajeCamion?.patenteChasis || '-'}`, 14, 76)
      doc.text(`Patente Acoplado: ${tropaSeleccionada.pesajeCamion?.patenteAcoplado || '-'}`, 80, 76)
      doc.text(`Precintos: ${tropaSeleccionada.pesajeCamion?.precintos || '-'}`, 160, 76)
      
      // Documentación
      doc.setFont('helvetica', 'bold')
      doc.text('DOCUMENTACIÓN', 14, 86)
      doc.setFont('helvetica', 'normal')
      doc.text(`DTE: ${tropaSeleccionada.dte || '-'}`, 14, 93)
      doc.text(`Guía: ${tropaSeleccionada.guia || '-'}`, 80, 93)
      doc.text(`Corral: ${tropaSeleccionada.corral?.nombre || '-'}`, 160, 93)
      
      // Tabla de animales
      const animalesData = (tropaSeleccionada.animales || []).map((a, idx) => [
        idx + 1,
        a.caravana || '-',
        TIPOS_ANIMAL_LABELS[a.tipoAnimal] || a.tipoAnimal || '-',
        a.raza || '-',
        a.pesoVivo?.toFixed(0) || '-',
        ''
      ])
      
      const totalKg = (tropaSeleccionada.animales || []).reduce((sum, a) => sum + (a.pesoVivo || 0), 0)
      const totalAnimales = (tropaSeleccionada.animales || []).length
      
      autoTable(doc, {
        startY: 100,
        head: [['N°', 'CARAVANA', 'TIPO', 'RAZA', 'PESO (kg)', 'OBSERVACIONES']],
        body: animalesData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [217, 217, 217], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 30, halign: 'center' },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 50 }
        },
        foot: [
          [{ content: 'TOTAL ANIMALES:', colSpan: 2, styles: { fontStyle: 'bold' } }, 
           { content: totalAnimales, styles: { fontStyle: 'bold' } },
           { content: 'TOTAL KG:', colSpan: 2, styles: { fontStyle: 'bold' } },
           { content: totalKg.toFixed(0), styles: { fontStyle: 'bold', halign: 'right' } },
           '']
        ],
        footStyles: { fillColor: [245, 245, 245] }
      })
      
      // Firmas
      const finalY = (doc as any).lastAutoTable.finalY + 20
      doc.text('_________________________', 50, finalY)
      doc.text('_________________________', 170, finalY)
      doc.setFontSize(8)
      doc.text('FIRMA RESPONSABLE INGRESO', 35, finalY + 5)
      doc.text('FIRMA TRANSPORTISTA', 155, finalY + 5)
      
      // Guardar
      doc.save(`Planilla01_${tropaSeleccionada.codigo?.replace(/\s/g, '_') || tropaSeleccionada.id}.pdf`)
      toast.success('PDF generado correctamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al generar PDF')
    } finally {
      setGenerando(null)
    }
  }

  const tropasFiltradas = tropas.filter(t => {
    if (!busqueda) return true
    const search = busqueda.toLowerCase()
    return t.codigo.toLowerCase().includes(search) || 
           t.productor?.nombre?.toLowerCase().includes(search) ||
           t.usuarioFaena?.nombre?.toLowerCase().includes(search)
  })

  const getSemana = (fecha: string) => {
    const d = new Date(fecha)
    const start = new Date(d.getFullYear(), 0, 1)
    return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <FileText className="w-8 h-8 text-amber-500" />
              Planilla 01 - Registro de Ingreso
            </h1>
            <p className="text-stone-500 mt-1">Planilla SENASA para registro de ingreso de hacienda</p>
          </div>
          {tropaSeleccionada && (
            <div className="flex gap-2">
              <Button onClick={handleGenerarExcel} disabled={generando !== null} className="bg-emerald-600 hover:bg-emerald-700">
                {generando === 'excel' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
                Excel
              </Button>
              <Button onClick={handleGenerarPDF} disabled={generando !== null} className="bg-red-600 hover:bg-red-700">
                {generando === 'pdf' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                PDF
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-md lg:col-span-1">
            <CardHeader className="bg-stone-50">
              <CardTitle className="text-lg">Seleccionar Tropa</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-9" />
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" /></div>
              ) : tropasFiltradas.length === 0 ? (
                <div className="p-8 text-center text-stone-400">No hay tropas</div>
              ) : (
                <div className="divide-y">
                  {tropasFiltradas.map((tropa) => (
                    <button key={tropa.id} onClick={() => handleSeleccionarTropa(tropa.id)}
                      className={`w-full p-4 text-left hover:bg-stone-50 transition-colors ${tropaSeleccionada?.id === tropa.id ? 'bg-amber-50 border-l-4 border-amber-500' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-stone-800">{tropa.codigo}</p>
                          <p className="text-sm text-stone-500">{tropa.productor?.nombre || tropa.usuarioFaena?.nombre}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{tropa.cantidadCabezas} cab.</Badge>
                          <p className="text-xs text-stone-400 mt-1">{new Date(tropa.fechaRecepcion).toLocaleDateString('es-AR')}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md lg:col-span-2">
            <CardHeader className="bg-stone-50">
              <CardTitle className="text-lg flex items-center gap-2"><Eye className="w-5 h-5" />Vista Previa</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!tropaSeleccionada ? (
                <div className="text-center py-12 text-stone-400">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Seleccione una tropa para ver la planilla</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="border-2 border-stone-300 rounded-lg p-4 bg-white">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-500" />
                          <span className="font-semibold">Solemar Alimentaria S.A.</span>
                        </div>
                        <div className="text-stone-600"><span className="font-medium">N° SENASA:</span> 3986</div>
                        <div className="text-stone-600"><span className="font-medium">Matrícula:</span> 300</div>
                      </div>
                      <div className="space-y-2 text-right">
                        <Badge className="bg-amber-100 text-amber-800 text-base px-4 py-1">PLANILLA 01 - BOVINO</Badge>
                        <div className="text-stone-600"><span className="font-medium">Semana N°:</span> {getSemana(tropaSeleccionada.fechaRecepcion)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4 bg-white space-y-2">
                      <h4 className="font-semibold text-stone-700 flex items-center gap-2"><User className="w-4 h-4 text-amber-500" />Productor</h4>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Nombre:</span> {tropaSeleccionada.productor?.nombre || '-'}</p>
                        <p><span className="font-medium">CUIT:</span> {tropaSeleccionada.productor?.cuit || '-'}</p>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 bg-white space-y-2">
                      <h4 className="font-semibold text-stone-700 flex items-center gap-2"><User className="w-4 h-4 text-amber-500" />Usuario/Matarife</h4>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Nombre:</span> {tropaSeleccionada.usuarioFaena?.nombre || '-'}</p>
                        <p><span className="font-medium">CUIT:</span> {tropaSeleccionada.usuarioFaena?.cuit || '-'}</p>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 bg-white space-y-2">
                      <h4 className="font-semibold text-stone-700 flex items-center gap-2"><Truck className="w-4 h-4 text-amber-500" />Transporte</h4>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Transportista:</span> {tropaSeleccionada.pesajeCamion?.transportista?.nombre || '-'}</p>
                        <p><span className="font-medium">Chofer:</span> {tropaSeleccionada.pesajeCamion?.choferNombre || '-'}</p>
                        <p><span className="font-medium">Patente Chasis:</span> {tropaSeleccionada.pesajeCamion?.patenteChasis || '-'}</p>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 bg-white space-y-2">
                      <h4 className="font-semibold text-stone-700 flex items-center gap-2"><FileText className="w-4 h-4 text-amber-500" />Documentos</h4>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">N° Tropa:</span> {tropaSeleccionada.codigo}</p>
                        <p><span className="font-medium">DTE:</span> {tropaSeleccionada.dte || '-'}</p>
                        <p><span className="font-medium">Guía:</span> {tropaSeleccionada.guia || '-'}</p>
                        <p><span className="font-medium">Precintos:</span> {tropaSeleccionada.pesajeCamion?.precintos || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden bg-white">
                    <div className="bg-stone-100 px-4 py-2 border-b">
                      <h4 className="font-semibold text-stone-700">Detalle de Animales ({tropaSeleccionada.animales?.length || 0})</h4>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-stone-50">
                          <TableHead className="w-16 text-center">N°</TableHead>
                          <TableHead className="text-center">Tipo</TableHead>
                          <TableHead>Raza</TableHead>
                          <TableHead>Caravana</TableHead>
                          <TableHead className="text-right">Peso (kg)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tropaSeleccionada.animales?.slice(0, 20).map((animal, idx) => (
                          <TableRow key={animal.id}>
                            <TableCell className="text-center font-medium">{animal.numero || idx + 1}</TableCell>
                            <TableCell className="text-center"><Badge variant="outline">{TIPOS_ANIMAL_LABELS[animal.tipoAnimal] || animal.tipoAnimal}</Badge></TableCell>
                            <TableCell>{animal.raza || '-'}</TableCell>
                            <TableCell className="font-mono text-sm">{animal.caravana || '-'}</TableCell>
                            <TableCell className="text-right">{animal.pesoVivo?.toFixed(0) || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Planilla01Module
