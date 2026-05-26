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
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

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
  corral?: { id: string; nombre: string }
  productor?: { nombre: string; cuit: string }
  usuarioFaena: { nombre: string; cuit: string }
  pesajeCamion?: {
    id: string
    numeroTicket: number
    tipo: string
    patenteChasis: string
    patenteAcoplado?: string
    choferNombre?: string
    choferDni?: string
    transportista?: { nombre: string; cuit: string }
    precintos?: string
    pesoBruto?: number
    pesoTara?: number
    pesoNeto?: number
    estado: string
  }
  animales: Array<{
    id: string
    numero: number
    codigo?: string
    tipoAnimal: string
    caravana?: string
    pesoVivo?: number
    raza?: string
    estado?: string
  }>
}

interface Props { operador: Operador }

const TIPOS_ANIMAL_LABELS: Record<string, string> = {
  'TO': 'TORO', 'VA': 'VACA', 'VQ': 'VAQUILLONA', 'MEJ': 'MEJ', 'NO': 'NOVILLO', 'NT': 'NOVILLITO',
}

export function Planilla01Module({ operador }: Props) {
  const { editMode, getTexto } = useEditor()
  const [tropas, setTropas] = useState<Tropa[]>([])
  const [tropaSeleccionada, setTropaSeleccionada] = useState<Tropa | null>(null)
  const [loading, setLoading] = useState(true)
  const [buscando, setBuscando] = useState(false)
  const [generando, setGenerando] = useState<'excel' | 'pdf' | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarTodas, setMostrarTodas] = useState(false)

  useEffect(() => { fetchTropas('') }, [])

  const fetchTropas = async (termino: string) => {
    if (termino) setBuscando(true)
    else setLoading(true)
    try {
      const params = new URLSearchParams()
      if (termino) params.set('busqueda', termino)
      const url = `/api/tropas${params.toString() ? '?' + params.toString() : ''}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setTropas(data.data || [])
        setMostrarTodas(false)
        if (!data.data?.length) {
          toast.info(termino ? `No se encontraron tropas para "${termino}"` : 'No hay tropas cargadas. Ejecutá el seed primero.')
        }
      } else {
        console.error('API Error:', data.error)
        toast.error(`Error: ${data.error || 'Sin respuesta del servidor'}`)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión al cargar tropas')
    } finally {
      setLoading(false)
      setBuscando(false)
    }
  }

  const handleBuscar = () => {
    if (busqueda.trim()) {
      fetchTropas(busqueda.trim())
    } else {
      fetchTropas('')
    }
  }

  const handleVerTodas = () => {
    setBusqueda('')
    fetchTropas('')
    setMostrarTodas(true)
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

  // Cálculos de pesaje
  const getDatosPesaje = () => {
    const kgNetoCamion = tropaSeleccionada?.pesajeCamion?.pesoNeto || 0
    const kgBrutoCamion = tropaSeleccionada?.pesajeCamion?.pesoBruto || 0
    const kgTaraCamion = tropaSeleccionada?.pesajeCamion?.pesoTara || 0
    const kgNetoAnimales = (tropaSeleccionada?.animales || []).reduce((sum, a) => sum + (a.pesoVivo || 0), 0)
    const animalesPesados = (tropaSeleccionada?.animales || []).filter(a => a.pesoVivo && a.pesoVivo > 0).length
    const diferencia = kgNetoCamion - kgNetoAnimales
    return { kgNetoCamion, kgBrutoCamion, kgTaraCamion, kgNetoAnimales, animalesPesados, diferencia }
  }

  const handleGenerarPDF = async () => {
    if (!tropaSeleccionada) return
    setGenerando('pdf')
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const datos = getDatosPesaje()

      // Título principal
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('PLANILLA 01 - REGISTRO DE INGRESO DE HACIENDA', pageWidth / 2, 12, { align: 'center' })

      // Fila 1: Establecimiento + Semana/Fecha
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('ESTABLECIMIENTO:', 14, 20)
      doc.setFont('helvetica', 'normal')
      doc.text('Solemar Alimentaria S.A.', 48, 20)
      doc.setFont('helvetica', 'bold')
      doc.text('SENASA:', 120, 20)
      doc.setFont('helvetica', 'normal')
      doc.text('3986', 140, 20)
      doc.setFont('helvetica', 'bold')
      doc.text('MATRÍCULA:', 165, 20)
      doc.setFont('helvetica', 'normal')
      doc.text('300', 192, 20)

      const semana = getSemana(tropaSeleccionada.fechaRecepcion)
      const anio = new Date(tropaSeleccionada.fechaRecepcion).getFullYear()
      doc.setFont('helvetica', 'bold')
      doc.text('SEMANA:', 210, 20)
      doc.setFont('helvetica', 'normal')
      doc.text(`${semana} - AÑO: ${anio}`, 240, 20)
      doc.setFont('helvetica', 'bold')
      doc.text('FECHA:', 268, 20)
      doc.setFont('helvetica', 'normal')
      doc.text(new Date(tropaSeleccionada.fechaRecepcion).toLocaleDateString('es-AR'), 284, 20)

      // Fila 2: Usuario Faena / Productor
      let y = 26
      doc.setFont('helvetica', 'bold')
      doc.text('USUARIO FAENA:', 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(tropaSeleccionada.usuarioFaena?.nombre || '-', 52, y)
      doc.setFont('helvetica', 'bold')
      doc.text('CUIT:', 160, y)
      doc.setFont('helvetica', 'normal')
      doc.text(tropaSeleccionada.usuarioFaena?.cuit || '-', 172, y)
      doc.setFont('helvetica', 'bold')
      doc.text('TROPA:', 230, y)
      doc.setFont('helvetica', 'normal')
      doc.text(tropaSeleccionada.codigo || '-', 252, y)

      // Fila 3: Productor
      y = 31
      doc.setFont('helvetica', 'bold')
      doc.text('PRODUCTOR:', 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(tropaSeleccionada.productor?.nombre || '-', 52, y)
      doc.setFont('helvetica', 'bold')
      doc.text('CUIT:', 160, y)
      doc.setFont('helvetica', 'normal')
      doc.text(tropaSeleccionada.productor?.cuit || '-', 172, y)

      // Fila 4: Transporte
      y = 36
      doc.setFont('helvetica', 'bold')
      doc.text('TRANSPORTISTA:', 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(tropaSeleccionada.pesajeCamion?.transportista?.nombre || '-', 52, y)
      doc.setFont('helvetica', 'bold')
      doc.text('CHOFER:', 160, y)
      doc.setFont('helvetica', 'normal')
      doc.text(tropaSeleccionada.pesajeCamion?.choferNombre || '-', 185, y)
      doc.setFont('helvetica', 'bold')
      doc.text('DNI:', 230, y)
      doc.setFont('helvetica', 'normal')
      doc.text(tropaSeleccionada.pesajeCamion?.choferDni || '-', 244, y)

      // Fila 5: Patentes / Precintos
      y = 41
      doc.setFont('helvetica', 'bold')
      doc.text('PATENTE CHASIS:', 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(tropaSeleccionada.pesajeCamion?.patenteChasis || '-', 52, y)
      doc.setFont('helvetica', 'bold')
      doc.text('ACOPLADO:', 100, y)
      doc.setFont('helvetica', 'normal')
      doc.text(tropaSeleccionada.pesajeCamion?.patenteAcoplado || '-', 126, y)
      doc.setFont('helvetica', 'bold')
      doc.text('PRECINTOS:', 170, y)
      doc.setFont('helvetica', 'normal')
      doc.text(tropaSeleccionada.pesajeCamion?.precintos || '-', 196, y)

      // Fila 6: Documentación
      y = 46
      doc.setFont('helvetica', 'bold')
      doc.text('DTE:', 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(tropaSeleccionada.dte || '-', 30, y)
      doc.setFont('helvetica', 'bold')
      doc.text('GUÍA:', 80, y)
      doc.setFont('helvetica', 'normal')
      doc.text(tropaSeleccionada.guia || '-', 96, y)
      doc.setFont('helvetica', 'bold')
      doc.text('CORRAL:', 140, y)
      doc.setFont('helvetica', 'normal')
      doc.text(tropaSeleccionada.corral?.nombre || '-', 164, y)

      // Sección Comparativo de Pesaje
      y = 50
      doc.setFillColor(230, 240, 250)
      doc.rect(14, y - 2, pageWidth - 28, 14, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('COMPARATIVO DE PESAJE', 14, y + 2)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text(`Ticket: ${tropaSeleccionada.pesajeCamion?.numeroTicket || '-'}`, 90, y + 2)

      // Datos de pesaje en la misma barra
      y = y + 7
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.text('Bruto Camión:', 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(`${datos.kgBrutoCamion.toFixed(0)} kg`, 50, y)
      doc.setFont('helvetica', 'bold')
      doc.text('Tara:', 75, y)
      doc.setFont('helvetica', 'normal')
      doc.text(`${datos.kgTaraCamion.toFixed(0)} kg`, 92, y)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 80, 0)
      doc.text('NETO CAMIÓN:', 120, y)
      doc.setFont('helvetica', 'normal')
      doc.text(`${datos.kgNetoCamion.toFixed(1)} kg`, 164, y)
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'bold')
      doc.text('NETO ANIMALES:', 190, y)
      doc.setFont('helvetica', 'normal')
      doc.text(`${datos.kgNetoAnimales.toFixed(1)} kg (${datos.animalesPesados}/${tropaSeleccionada.animales?.length || 0})`, 248, y)
      doc.setFont('helvetica', 'bold')
      const diffColor = datos.diferencia > 0 ? [0, 80, 0] : datos.diferencia < 0 ? [180, 0, 0] : [100, 100, 100]
      doc.setTextColor(...diffColor)
      doc.text(`DIFERENCIA: ${datos.diferencia > 0 ? '+' : ''}${datos.diferencia.toFixed(1)} kg`, 14, y + 5)
      doc.setTextColor(0, 0, 0)

      // Tabla de animales
      y = y + 10
      const animalesData = (tropaSeleccionada.animales || []).map((a, idx) => [
        idx + 1,
        a.caravana || '-',
        TIPOS_ANIMAL_LABELS[a.tipoAnimal] || a.tipoAnimal || '-',
        a.raza || '-',
        a.pesoVivo?.toFixed(0) || '-',
        ''
      ])

      const totalAnimales = (tropaSeleccionada.animales || []).length

      autoTable(doc, {
        startY: y,
        head: [['N°', 'CARAVANA', 'TIPO', 'RAZA', 'PESO (kg)', 'OBSERVACIONES']],
        body: animalesData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [217, 217, 217], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 22, halign: 'right' },
          5: { cellWidth: '*' }
        },
        foot: [
          [{ content: `TOTAL ANIMALES: ${totalAnimales}`, colSpan: 3, styles: { fontStyle: 'bold' } },
           { content: 'TOTAL KG INDIVIDUALES:', colSpan: 2, styles: { fontStyle: 'bold' } },
           { content: datos.kgNetoAnimales.toFixed(1), styles: { fontStyle: 'bold', halign: 'right' } },
           '']
        ],
        footStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 }
      })

      // Firmas
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('_________________________', 50, finalY)
      doc.text('_________________________', 170, finalY)
      doc.text('FIRMA RESPONSABLE INGRESO', 35, finalY + 5)
      doc.text('FIRMA TRANSPORTISTA', 155, finalY + 5)

      doc.save(`Planilla01_${tropaSeleccionada.codigo?.replace(/\s/g, '_') || tropaSeleccionada.id}.pdf`)
      toast.success('PDF generado correctamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al generar PDF')
    } finally {
      setGenerando(null)
    }
  }

  // Las tropas ya vienen filtradas desde el servidor cuando hay búsqueda

  const getSemana = (fecha: string) => {
    const d = new Date(fecha)
    const start = new Date(d.getFullYear(), 0, 1)
    return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
                <FileText className="w-8 h-8 text-amber-500" />
                <TextoEditable id="planilla01-titulo" original="Planilla 01 - Registro de Ingreso" tag="span" />
              </h1>
              <p className="text-stone-500 mt-1">
                <TextoEditable id="planilla01-subtitulo" original="Planilla SENASA para registro de ingreso de hacienda" tag="span" />
              </p>
            </div>
            {tropaSeleccionada && (
              <div className="flex gap-2">
                <Button onClick={handleGenerarExcel} disabled={generando !== null} className="bg-emerald-600 hover:bg-emerald-700">
                  {generando === 'excel' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
                  <TextoEditable id="btn-excel" original="Excel" tag="span" />
                </Button>
                <Button onClick={handleGenerarPDF} disabled={generando !== null} className="bg-red-600 hover:bg-red-700">
                  {generando === 'pdf' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                  <TextoEditable id="btn-pdf" original="PDF" tag="span" />
                </Button>
              </div>
            )}
          </div>
        </EditableBlock>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <EditableBlock bloqueId="lista-tropas" label="Lista de Tropas">
            <Card className="border-0 shadow-md lg:col-span-1">
              <CardHeader className="bg-stone-50">
                <CardTitle className="text-lg">
                  <TextoEditable id="planilla01-seleccionar-tropa" original="Seleccionar Tropa" tag="span" />
                </CardTitle>
                <div className="flex gap-2 mt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input 
                      placeholder="Código, productor, CUIT..." 
                      value={busqueda} 
                      onChange={(e) => setBusqueda(e.target.value)} 
                      className="pl-9"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleBuscar() }}
                    />
                  </div>
                  <Button onClick={handleBuscar} disabled={buscando} className="bg-amber-600 hover:bg-amber-700 shrink-0">
                    {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <TextoEditable id="planilla01-btn-buscar" original="Buscar" tag="span" />
                  </Button>
                </div>
                {busqueda && !mostrarTodas && (
                  <button 
                    onClick={handleVerTodas} 
                    className="text-xs text-amber-600 hover:text-amber-800 mt-1 underline"
                  >
                    Ver todas las tropas
                  </button>
                )}
              </CardHeader>
              <CardContent className="p-0 max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" /></div>
                ) : tropas.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <TextoEditable id="planilla01-no-hay-tropas" original="No hay tropas" tag="span" />
                  </div>
                ) : (
                  <div className="divide-y">
                    {tropas.map((tropa) => (
                      <button key={tropa.id} onClick={() => handleSeleccionarTropa(tropa.id)}
                        className={`w-full p-4 text-left hover:bg-stone-50 transition-colors ${tropaSeleccionada?.id === tropa.id ? 'bg-amber-50 border-l-4 border-amber-500' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-stone-800">{tropa.codigo}</p>
                            <p className="text-sm text-stone-500">{tropa.usuarioFaena?.nombre || tropa.productor?.nombre}</p>
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
          </EditableBlock>

          <EditableBlock bloqueId="vista-previa" label="Vista Previa">
            <Card className="border-0 shadow-md lg:col-span-2">
              <CardHeader className="bg-stone-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  <TextoEditable id="planilla01-vista-previa" original="Vista Previa" tag="span" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {!tropaSeleccionada ? (
                  <div className="text-center py-12 text-stone-400">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>
                      <TextoEditable id="planilla01-seleccione-tropa" original="Seleccione una tropa para ver la planilla" tag="span" />
                    </p>
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
                          <div className="text-stone-600">
                            <span className="font-medium">
                              <TextoEditable id="planilla01-nro-senasa-label" original="N° SENASA:" tag="span" />
                            </span> 3986
                          </div>
                          <div className="text-stone-600">
                            <span className="font-medium">
                              <TextoEditable id="planilla01-matricula-label" original="Matrícula:" tag="span" />
                            </span> 300
                          </div>
                        </div>
                        <div className="space-y-2 text-right">
                          <Badge className="bg-amber-100 text-amber-800 text-base px-4 py-1">
                            <TextoEditable id="planilla01-badge" original="PLANILLA 01 - BOVINO" tag="span" />
                          </Badge>
                          <div className="text-stone-600">
                            <span className="font-medium">
                              <TextoEditable id="planilla01-semana-label" original="Semana N°:" tag="span" />
                            </span> {getSemana(tropaSeleccionada.fechaRecepcion)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4 bg-white space-y-2">
                        <h4 className="font-semibold text-stone-700 flex items-center gap-2">
                          <User className="w-4 h-4 text-amber-500" />
                          <TextoEditable id="planilla01-productor-title" original="Usuario Faena" tag="span" />
                        </h4>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="font-medium">
                              <TextoEditable id="planilla01-nombre-label" original="Nombre:" tag="span" />
                            </span> {tropaSeleccionada.usuarioFaena?.nombre || tropaSeleccionada.productor?.nombre || '-'}
                          </p>
                          <p>
                            <span className="font-medium">
                              <TextoEditable id="planilla01-cuit-label" original="CUIT:" tag="span" />
                            </span> {tropaSeleccionada.usuarioFaena?.cuit || tropaSeleccionada.productor?.cuit || '-'}
                          </p>
                        </div>
                      </div>
                      <div className="border rounded-lg p-4 bg-white space-y-2">
                        <h4 className="font-semibold text-stone-700 flex items-center gap-2">
                          <User className="w-4 h-4 text-amber-500" />
                          <TextoEditable id="planilla01-usuario-title" original="Productor / Titular" tag="span" />
                        </h4>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="font-medium">
                              <TextoEditable id="planilla01-nombre-label2" original="Nombre:" tag="span" />
                            </span> {tropaSeleccionada.productor?.nombre || '-'}
                          </p>
                          <p>
                            <span className="font-medium">
                              <TextoEditable id="planilla01-cuit-label2" original="CUIT:" tag="span" />
                            </span> {tropaSeleccionada.productor?.cuit || '-'}
                          </p>
                        </div>
                      </div>
                      <div className="border rounded-lg p-4 bg-white space-y-2">
                        <h4 className="font-semibold text-stone-700 flex items-center gap-2">
                          <Truck className="w-4 h-4 text-amber-500" />
                          <TextoEditable id="planilla01-transporte-title" original="Transporte" tag="span" />
                        </h4>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="font-medium">
                              <TextoEditable id="planilla01-transportista-label" original="Transportista:" tag="span" />
                            </span> {tropaSeleccionada.pesajeCamion?.transportista?.nombre || '-'}
                          </p>
                          <p>
                            <span className="font-medium">
                              <TextoEditable id="planilla01-chofer-label" original="Chofer:" tag="span" />
                            </span> {tropaSeleccionada.pesajeCamion?.choferNombre || '-'}
                          </p>
                          <p>
                            <span className="font-medium">
                              <TextoEditable id="planilla01-patente-label" original="Patente Chasis:" tag="span" />
                            </span> {tropaSeleccionada.pesajeCamion?.patenteChasis || '-'}
                          </p>
                        </div>
                      </div>
                      <div className="border rounded-lg p-4 bg-white space-y-2">
                        <h4 className="font-semibold text-stone-700 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-500" />
                          <TextoEditable id="planilla01-documentos-title" original="Documentos" tag="span" />
                        </h4>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="font-medium">
                              <TextoEditable id="planilla01-nro-tropa-label" original="N° Tropa:" tag="span" />
                            </span> {tropaSeleccionada.codigo}
                          </p>
                          <p>
                            <span className="font-medium">DTE:</span> {tropaSeleccionada.dte || '-'}
                          </p>
                          <p>
                            <span className="font-medium">
                              <TextoEditable id="planilla01-guia-label" original="Guía:" tag="span" />
                            </span> {tropaSeleccionada.guia || '-'}
                          </p>
                          <p>
                            <span className="font-medium">
                              <TextoEditable id="planilla01-precintos-label" original="Precintos:" tag="span" />
                            </span> {tropaSeleccionada.pesajeCamion?.precintos || '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Comparativo de Pesaje */}
                    {(() => {
                      const datos = getDatosPesaje()
                      return (
                        <div className="border rounded-lg overflow-hidden bg-white">
                          <div className="bg-blue-50 px-4 py-2 border-b flex items-center justify-between">
                            <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                              <Truck className="w-4 h-4" />
                              Comparativo de Pesaje
                            </h4>
                            {tropaSeleccionada.pesajeCamion?.numeroTicket && (
                              <Badge variant="outline" className="text-xs">Ticket N° {tropaSeleccionada.pesajeCamion.numeroTicket}</Badge>
                            )}
                          </div>
                          <div className="p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {/* Pesaje Camión */}
                              <div className="space-y-1">
                                <p className="text-xs text-stone-500 uppercase font-medium">Pesaje Camión</p>
                                <p className="text-xs text-stone-500">Bruto: <span className="font-mono font-semibold text-stone-700">{datos.kgBrutoCamion.toFixed(0)} kg</span></p>
                                <p className="text-xs text-stone-500">Tara: <span className="font-mono font-semibold text-stone-700">{datos.kgTaraCamion.toFixed(0)} kg</span></p>
                                <p className="text-lg font-bold text-green-700">{datos.kgNetoCamion.toFixed(1)} kg</p>
                                <p className="text-xs text-stone-400">Neto Camión</p>
                              </div>
                              {/* Pesaje Individual */}
                              <div className="space-y-1">
                                <p className="text-xs text-stone-500 uppercase font-medium">Pesaje Individual</p>
                                <p className="text-xs text-stone-500">Animales pesados: <span className="font-mono font-semibold text-stone-700">{datos.animalesPesados} / {tropaSeleccionada.animales?.length || 0}</span></p>
                                <p className="text-xs text-stone-400">Promedio: <span className="font-mono text-stone-700">{datos.animalesPesados > 0 ? (datos.kgNetoAnimales / datos.animalesPesados).toFixed(0) : '-'} kg</span></p>
                                <p className="text-lg font-bold text-blue-700">{datos.kgNetoAnimales.toFixed(1)} kg</p>
                                <p className="text-xs text-stone-400">Suma Individual</p>
                              </div>
                              {/* Diferencia */}
                              <div className="space-y-1">
                                <p className="text-xs text-stone-500 uppercase font-medium">Diferencia</p>
                                <p className="text-xs text-stone-400">Camión - Individual</p>
                                <p className={`text-2xl font-bold ${datos.diferencia > 0 ? 'text-green-600' : datos.diferencia < 0 ? 'text-red-600' : 'text-stone-500'}`}>
                                  {datos.diferencia > 0 ? '+' : ''}{datos.diferencia.toFixed(1)} kg
                                </p>
                                <p className="text-xs text-stone-400">
                                  {datos.diferencia > 5 ? 'Sobra kg en camión' : datos.diferencia < -5 ? 'Falta pesar animales' : 'Dentro de tolerancia'}
                                </p>
                              </div>
                              {/* Estado pesaje */}
                              <div className="space-y-1">
                                <p className="text-xs text-stone-500 uppercase font-medium">Estado</p>
                                <p className="text-xs">Ticket: <span className={`font-semibold ${tropaSeleccionada.pesajeCamion?.estado === 'CERRADO' ? 'text-green-600' : 'text-amber-600'}`}>{tropaSeleccionada.pesajeCamion?.estado === 'CERRADO' ? 'Cerrado' : 'Abierto'}</span></p>
                                <p className="text-xs">Peso vivo cargado: <span className={`font-semibold ${datos.animalesPesados === (tropaSeleccionada.animales?.length || 0) ? 'text-green-600' : 'text-amber-600'}`}>{datos.animalesPesados === (tropaSeleccionada.animales?.length || 0) ? 'Completo' : `Faltan ${((tropaSeleccionada.animales?.length || 0) - datos.animalesPesados)} animales`}</span></p>
                                {datos.kgBrutoCamion === 0 && (
                                  <p className="text-xs text-amber-600 font-medium">Sin pesaje de camión</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    <div className="border rounded-lg overflow-hidden bg-white">
                      <div className="bg-stone-100 px-4 py-2 border-b flex items-center justify-between">
                        <h4 className="font-semibold text-stone-700">
                          <TextoEditable id="planilla01-detalle-animales" original="Detalle de Animales" tag="span" /> ({tropaSeleccionada.animales?.length || 0})
                        </h4>
                        <span className="text-xs text-stone-400">Mostrando {Math.min(tropaSeleccionada.animales?.length || 0, 20)} de {tropaSeleccionada.animales?.length || 0}</span>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-stone-50">
                            <TableHead className="w-16 text-center">N°</TableHead>
                            <TableHead className="text-center">
                              <TextoEditable id="planilla01-th-tipo" original="Tipo" tag="span" />
                            </TableHead>
                            <TableHead>
                              <TextoEditable id="planilla01-th-raza" original="Raza" tag="span" />
                            </TableHead>
                            <TableHead>
                              <TextoEditable id="planilla01-th-caravana" original="Caravana" tag="span" />
                            </TableHead>
                            <TableHead className="text-right">
                              <TextoEditable id="planilla01-th-peso" original="Peso (kg)" tag="span" />
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tropaSeleccionada.animales?.slice(0, 20).map((animal, idx) => (
                            <TableRow key={animal.id}>
                              <TableCell className="text-center font-medium">{animal.numero || idx + 1}</TableCell>
                              <TableCell className="text-center"><Badge variant="outline">{TIPOS_ANIMAL_LABELS[animal.tipoAnimal] || animal.tipoAnimal}</Badge></TableCell>
                              <TableCell>{animal.raza || '-'}</TableCell>
                              <TableCell className="font-mono text-sm">{animal.caravana || '-'}</TableCell>
                              <TableCell className={`text-right font-mono ${!animal.pesoVivo || animal.pesoVivo === 0 ? 'text-stone-300' : 'font-semibold'}`}>{animal.pesoVivo?.toFixed(0) || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </EditableBlock>
        </div>
      </div>
    </div>
  )
}

export default Planilla01Module
