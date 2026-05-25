'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import {
  FileText, Printer, Calendar, Beef, Loader2, FileSpreadsheet,
  FileCheck, ScrollText, ClipboardList, Barcode
} from 'lucide-react'
import { imprimirPlanilla01, convertirRomaneoAPlanilla01, type Planilla01Data } from '@/components/pesaje-individual/planilla01Print'
import { imprimirRomaneoGeneral, type RomaneoItem, type ResumenTropa } from '@/components/lista-faena/romaneoPrint'
import { imprimirControlDenticion, type DenticionControlOptions } from '@/components/lista-faena/denticionPrint'
import { imprimirMenudencias, createEmptyMenudenciasData, type MenudenciasData } from '@/components/lista-faena/menudenciasPrint'
import { CodigoEAN128Dialog } from '@/components/codigo-ean128/CodigoEAN128Dialog'
import { ExportButton } from '@/components/ui/export-button'
import { ExcelExporter } from '@/lib/export-excel'
import { PDFExporter } from '@/lib/export-pdf'

interface Tropa {
  id: string
  numero: number
  codigo: string
  especie: string
  cantidadCabezas: number
  pesoNeto?: number
  pesoTotalIndividual?: number
  dte: string
  guia: string
  productor?: { id: string; nombre: string }
  usuarioFaena?: { id: string; nombre: string; cuit?: string }
  tiposAnimales?: { tipoAnimal: string; cantidad: number }[]
}

interface ListaFaena {
  id: string
  fecha: string
  estado: string
  cantidadTotal: number
  tropas?: { tropa: Tropa; cantidad: number }[]
}

interface RomaneoData {
  id: string
  garron: number
  tropaCodigo?: string
  numeroAnimal?: number
  tipoAnimal?: string
  pesoVivo?: number
  denticion?: string
  pesoMediaIzq?: number
  pesoMediaDer?: number
  pesoTotal?: number
  fecha: string
}

export function ReportesDocumentos() {
  const [loading, setLoading] = useState(false)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [tropas, setTropas] = useState<Tropa[]>([])
  const [listaFaena, setListaFaena] = useState<ListaFaena | null>(null)
  const [romaneos, setRomaneos] = useState<RomaneoData[]>([])
  
  // Selected items
  const [selectedTropa, setSelectedTropa] = useState<string>('')
  const [selectedLote, setSelectedLote] = useState<string>('')
  
  // EAN-128 Dialog
  const [codigoDialogOpen, setCodigoDialogOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [fecha])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch lista faena for the selected date
      const listaRes = await fetch(`/api/lista-faena?fecha=${fecha}`)
      const listaData = await listaRes.json()
      
      if (listaData.success) {
        const lista = listaData.data.find((l: ListaFaena) => l.estado === 'CERRADA' || l.estado === 'EN_PROCESO')
        setListaFaena(lista || null)
      }
      
      // Fetch romaneos for the date
      const romaneosRes = await fetch(`/api/romaneo?fecha=${fecha}`)
      const romaneosData = await romaneosRes.json()
      
      if (romaneosData.success) {
        setRomaneos(romaneosData.data)
      }
      
      // Fetch tropas
      const tropasRes = await fetch('/api/tropas')
      const tropasData = await tropasRes.json()
      
      if (tropasData.success) {
        setTropas(tropasData.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Exportar datos a Excel
  const handleExportarExcel = () => {
    if (romaneos.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    // Hoja 1: Romaneos
    const romaneoHeaders = ['Garrón', 'Tropa', 'Tipo Animal', 'Peso Vivo', 'Dentición', 'Peso Media Izq', 'Peso Media Der', 'Peso Total', 'Fecha']
    const romaneoRows = romaneos.map(r => [
      r.garron, r.tropaCodigo || '', r.tipoAnimal || '', r.pesoVivo || '',
      r.denticion || '', r.pesoMediaIzq || '', r.pesoMediaDer || '',
      r.pesoTotal || '', r.fecha
    ])

    // Hoja 2: Tropas
    const tropaHeaders = ['Número', 'Código', 'Especie', 'Cabezas', 'DTE', 'Guía', 'Productor', 'Usuario Faena']
    const tropaRows = tropas.map(t => [
      t.numero, t.codigo, t.especie, t.cantidadCabezas,
      t.dte, t.guia, t.productor?.nombre || '', t.usuarioFaena?.nombre || ''
    ])

    ExcelExporter.exportToExcel({
      filename: `documentos_faena_${fecha}`,
      sheets: [
        { name: 'Romaneos', headers: romaneoHeaders, data: romaneoRows },
        { name: 'Tropas', headers: tropaHeaders, data: tropaRows },
      ],
      title: 'Documentos de Faena - Solemar Alimentaria',
    })
  }

  // Exportar datos a PDF
  const handleExportarPDF = () => {
    if (romaneos.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    const headers = ['Garrón', 'Tropa', 'Tipo', 'P. Vivo', 'Dent.', 'P. Media Izq', 'P. Media Der', 'P. Total']
    const rows = romaneos.map(r => [
      r.garron, r.tropaCodigo || '', r.tipoAnimal || '', r.pesoVivo || '-',
      r.denticion || '-', r.pesoMediaIzq || '-', r.pesoMediaDer || '-',
      r.pesoTotal || '-'
    ])

    const doc = PDFExporter.generateReport({
      title: 'Documentos de Faena',
      subtitle: `Fecha: ${new Date(fecha).toLocaleDateString('es-AR')}`,
      headers,
      data: rows,
      orientation: 'landscape',
    })
    PDFExporter.downloadPDF(doc, `documentos_faena_${fecha}.pdf`)
  }

  // Imprimir Planilla 01 por Tropa
  const handleImprimirPlanilla01 = (tropaNumero: number) => {
    const tropa = tropas.find(t => t.numero === tropaNumero)
    if (!tropa) {
      toast.error('Tropa no encontrada')
      return
    }

    // Filtrar romaneos de esta tropa
    const romaneosTropa = romaneos.filter(r => {
      const codigo = r.tropaCodigo || ''
      return codigo.includes(tropa.numero.toString()) || codigo === tropa.codigo
    })

    if (romaneosTropa.length === 0) {
      toast.error('No hay datos de romaneo para esta tropa')
      return
    }

    // Convertir datos
    const planillaData = convertirRomaneoAPlanilla01(
      {
        numero: tropa.numero,
        productor: tropa.productor,
        usuarioFaena: tropa.usuarioFaena,
        dte: tropa.dte,
        guia: tropa.guia
      },
      romaneosTropa.map(r => ({
        garron: r.garron,
        tropaNumero: tropa.numero,
        tipoAnimal: r.tipoAnimal || '',
        pesoMediaIzq: r.pesoMediaIzq || 0,
        pesoMediaDer: r.pesoMediaDer || 0,
        pesoVivo: r.pesoVivo,
        denticion: r.denticion
      })),
      fecha
    )

    imprimirPlanilla01(planillaData)
  }

  // Imprimir Romaneo General
  const handleImprimirRomaneoGeneral = () => {
    if (romaneos.length === 0) {
      toast.error('No hay datos de romaneo para esta fecha')
      return
    }

    // Agrupar por tropa para resumen
    const resumenPorTropa: ResumenTropa[] = []
    const tropasMap = new Map<number, { tipos: Map<string, number> }>()

    romaneos.forEach(r => {
      const tropaNum = parseInt(r.tropaCodigo?.replace(/\D/g, '') || '0')
      if (!tropasMap.has(tropaNum)) {
        tropasMap.set(tropaNum, { tipos: new Map() })
      }
      const tropaData = tropasMap.get(tropaNum)!
      const tipo = r.tipoAnimal || 'SIN'
      tropaData.tipos.set(tipo, (tropaData.tipos.get(tipo) || 0) + 1)
    })

    tropasMap.forEach((data, tropaNum) => {
      resumenPorTropa.push({
        tropaNumero: tropaNum,
        cantidad: Array.from(data.tipos.values()).reduce((a, b) => a + b, 0),
        tipos: Array.from(data.tipos.entries()).map(([tipo, cantidad]) => ({ tipo, cantidad }))
      })
    })

    const romaneoItems: RomaneoItem[] = romaneos.map(r => ({
      garron: r.garron,
      tropaCodigo: r.tropaCodigo || '',
      tropaNumero: parseInt(r.tropaCodigo?.replace(/\D/g, '') || '0'),
      tipificacion: `${r.denticion || '2'}D - ${r.tipoAnimal || 'SIN'}`,
      pesoMediaIzq: r.pesoMediaIzq || 0,
      pesoMediaDer: r.pesoMediaDer || 0
    }))

    imprimirRomaneoGeneral({
      fecha: new Date(fecha),
      romaneos: romaneoItems,
      resumenPorTropa
    })
  }

  // Imprimir Control de Dentición
  const handleImprimirDenticion = () => {
    if (romaneos.length === 0) {
      toast.error('No hay datos para el control de dentición')
      return
    }

    const animales = romaneos.map((r, index) => ({
      numeroCabeza: r.garron,
      tropaNumero: parseInt(r.tropaCodigo?.replace(/\D/g, '') || '0'),
      tipificacion: `${r.denticion || '2'}D - ${r.tipoAnimal || 'SIN'}`,
      denticion: parseInt(r.denticion || '2')
    }))

    imprimirControlDenticion({
      fecha: new Date(fecha),
      animales
    })
  }

  // Imprimir Control de Menudencias
  const handleImprimirMenudencias = () => {
    // Crear datos vacíos para que el usuario complete
    const data = createEmptyMenudenciasData(
      fecha,
      selectedTropa || 'Todas',
      selectedLote || '1',
      listaFaena?.tropas?.[0]?.tropa?.usuarioFaena?.nombre || 'Usuario'
    )
    
    imprimirMenudencias(data)
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            Documentos de Faena
          </CardTitle>
          <CardDescription>
            Imprima los documentos oficiales según formatos establecidos
          </CardDescription>
          <ExportButton
            onExportExcel={handleExportarExcel}
            onExportPDF={handleExportarPDF}
            onPrint={() => window.print()}
            disabled={romaneos.length === 0}
            size="sm"
          />
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tropa (para Planilla 01)</Label>
              <Select value={selectedTropa} onValueChange={setSelectedTropa}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tropa" />
                </SelectTrigger>
                <SelectContent>
                  {tropas.map(t => (
                    <SelectItem key={t.id} value={t.numero.toString()}>
                      Tropa {t.numero} - {t.usuarioFaena?.nombre || 'Sin usuario'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lote (para Menudencias)</Label>
              <Input
                type="text"
                value={selectedLote}
                onChange={(e) => setSelectedLote(e.target.value)}
                placeholder="Ej: 22"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchData} disabled={loading} variant="outline">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                <span className="ml-2">Actualizar</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentos disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Planilla 01 */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-amber-50 rounded-t-lg">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-600" />
              Planilla 01
            </CardTitle>
            <CardDescription>
              Romaneo individual por tropa
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm text-stone-600 mb-4">
              Incluye: datos del productor, usuario faena, cantidad de cabezas, kg vivo, kg media res, rinde, promedio, detalle de animales.
            </p>
            <div className="flex gap-2">
              <Select value={selectedTropa} onValueChange={setSelectedTropa}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Tropa" />
                </SelectTrigger>
                <SelectContent>
                  {tropas.map(t => (
                    <SelectItem key={t.id} value={t.numero.toString()}>
                      {t.numero}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => handleImprimirPlanilla01(parseInt(selectedTropa))}
                disabled={!selectedTropa}
                className="bg-amber-500 hover:bg-amber-600"
              >
                <Printer className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Romaneo General */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-blue-50 rounded-t-lg">
            <CardTitle className="text-base flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-blue-600" />
              Romaneo General
            </CardTitle>
            <CardDescription>
              Listado completo de faena diaria
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm text-stone-600 mb-4">
              Incluye: N° garrón, tropa, tipificación, kg 1/2 der, kg 1/2 izq, resumen por tropa y totales.
            </p>
            <Button 
              onClick={handleImprimirRomaneoGeneral}
              disabled={romaneos.length === 0}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Romaneo General
            </Button>
          </CardContent>
        </Card>

        {/* Control de Dentición */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-green-50 rounded-t-lg">
            <CardTitle className="text-base flex items-center gap-2">
              <Beef className="w-5 h-5 text-green-600" />
              Control de Dentición
            </CardTitle>
            <CardDescription>
              Registro de dientes por animal
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm text-stone-600 mb-4">
              Incluye: N° cabeza, tropa, tipificación, cantidad de dientes y resumen por dentición.
            </p>
            <Button 
              onClick={handleImprimirDenticion}
              disabled={romaneos.length === 0}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Dentición
            </Button>
          </CardContent>
        </Card>

        {/* Control de Menudencias */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-purple-50 rounded-t-lg">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-purple-600" />
              Control de Menudencias
            </CardTitle>
            <CardDescription>
              Registro de menudencias por tropa
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm text-stone-600 mb-4">
              Incluye: artículo, guardado en cámara, kg elaborado, bolsas, pesaje interno y báscula.
            </p>
            <Button 
              onClick={handleImprimirMenudencias}
              className="w-full bg-purple-500 hover:bg-purple-600"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Menudencias
            </Button>
          </CardContent>
        </Card>

        {/* Código EAN-128 */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-stone-100 rounded-t-lg">
            <CardTitle className="text-base flex items-center gap-2">
              <Barcode className="w-5 h-5 text-stone-600" />
              Código EAN-128
            </CardTitle>
            <CardDescription>
              Generador de códigos de barras
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm text-stone-600 mb-4">
              Estructura: Artículo(3) + Especie(1) + Tipif.(2) + Trabajo(1) + Transp.(1) + Destino(2) + Fecha(6) + Lote(6) + Unid.(2) + P.Net(5) + Caja(4) + P.Bru(5)
            </p>
            <Button 
              onClick={() => setCodigoDialogOpen(true)}
              variant="outline"
              className="w-full"
            >
              <Barcode className="w-4 h-4 mr-2" />
              Generar Código
            </Button>
          </CardContent>
        </Card>

        {/* Info adicional */}
        <Card className="border-0 shadow-md bg-stone-50">
          <CardContent className="p-4">
            <div className="text-center">
              <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-stone-400" />
              <p className="text-sm text-stone-600">
                Los documentos se generan según los formatos establecidos en las planillas oficiales del frigorífico.
              </p>
              {listaFaena && (
                <Badge variant="outline" className="mt-2">
                  Lista de faena: {listaFaena.cantidadTotal} animales
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen de datos disponibles */}
      {romaneos.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg">Resumen de Datos Disponibles</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Registros</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Romaneos</TableCell>
                  <TableCell>{romaneos.length} animales</TableCell>
                  <TableCell>
                    <Button size="sm" onClick={handleImprimirRomaneoGeneral}>
                      <Printer className="w-4 h-4 mr-1" /> Imprimir
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Dentición</TableCell>
                  <TableCell>{romaneos.filter(r => r.denticion).length} con dato</TableCell>
                  <TableCell>
                    <Button size="sm" onClick={handleImprimirDenticion}>
                      <Printer className="w-4 h-4 mr-1" /> Imprimir
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* EAN-128 Dialog */}
      <CodigoEAN128Dialog
        open={codigoDialogOpen}
        onOpenChange={setCodigoDialogOpen}
      />
    </div>
  )
}

export default ReportesDocumentos
