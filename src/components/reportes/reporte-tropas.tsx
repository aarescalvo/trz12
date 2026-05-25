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
import { Calendar, Download, Truck, Loader2, FileSpreadsheet } from 'lucide-react'
import { exportReport } from '@/lib/reportes-api'
import { ExportButton } from '@/components/ui/export-button'
import { PDFExporter } from '@/lib/export-pdf'

interface TropaData {
  id: string
  codigo: string
  especie: string
  estado: string
  cantidadCabezas: number
  pesoBruto: number | null
  pesoTara: number | null
  pesoNeto: number | null
  pesoPromedioAnimal: number | null
  productor: string | null
  usuarioFaena: string
  corral: string | null
  dte: string
  guia: string
  fechaRecepcion: string
  animalesPesados: number
  animalesFaenados: number
}

export function ReporteTropas() {
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [especie, setEspecie] = useState<string>('todas')
  const [estado, setEstado] = useState<string>('todas')
  const [datos, setDatos] = useState<TropaData[]>([])
  const [resumen, setResumen] = useState({
    totalTropas: 0,
    totalCabezas: 0,
    totalPesoNeto: 0,
    pesoPromedio: 0,
    recibidas: 0,
    enProceso: 0,
    finalizadas: 0
  })

  useEffect(() => {
    const today = new Date()
    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    
    setFechaHasta(today.toISOString().split('T')[0])
    setFechaDesde(monthAgo.toISOString().split('T')[0])
  }, [])

  const handleBuscar = async () => {
    if (!fechaDesde || !fechaHasta) {
      toast.error('Seleccione un rango de fechas')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/reportes/tropas?desde=${fechaDesde}&hasta=${fechaHasta}&especie=${especie}&estado=${estado}`)
      const data = await res.json()
      
      if (data.success) {
        setDatos(data.data)
        setResumen(data.resumen)
      } else {
        toast.error(data.error || 'Error al obtener datos')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleExportar = async () => {
    if (datos.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    setExporting(true)
    try {
      const archivo = await exportReport({
        tipo: 'tropas',
        datos: datos as unknown as Record<string, unknown>[],
        resumen,
        fechaDesde,
        fechaHasta
      })

      window.open(archivo, '_blank')
      toast.success('Reporte exportado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al exportar')
    } finally {
      setExporting(false)
    }
  }

  const handleExportarPDF = () => {
    if (datos.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    const headers = ['Código', 'Especie', 'Estado', 'Cabezas', 'P. Bruto', 'P. Tara', 'P. Neto', 'P. Promedio', 'Usuario Faena', 'Corral', 'Fecha']
    const rows = datos.map(d => [
      d.codigo, d.especie, d.estado, d.cantidadCabezas.toString(),
      d.pesoBruto?.toFixed(0) || '-', d.pesoTara?.toFixed(0) || '-',
      d.pesoNeto?.toFixed(0) || '-', d.pesoPromedioAnimal?.toFixed(0) || '-',
      d.usuarioFaena, d.corral || '-', d.fechaRecepcion
    ])
    const doc = PDFExporter.generateReport({
      title: 'Reporte de Tropas',
      subtitle: `Período: ${fechaDesde} - ${fechaHasta}`,
      headers,
      data: rows,
      orientation: 'landscape',
    })
    PDFExporter.downloadPDF(doc, `reporte_tropas_${fechaDesde}_${fechaHasta}.pdf`)
  }

  const getEstadoBadge = (estado: string) => {
    const config: Record<string, { color: string; label: string }> = {
      RECIBIDO: { color: 'bg-blue-100 text-blue-700', label: 'Recibido' },
      EN_CORRAL: { color: 'bg-amber-100 text-amber-700', label: 'En Corral' },
      EN_PESAJE: { color: 'bg-purple-100 text-purple-700', label: 'Pesaje' },
      PESADO: { color: 'bg-indigo-100 text-indigo-700', label: 'Pesado' },
      LISTO_FAENA: { color: 'bg-orange-100 text-orange-700', label: 'Listo Faena' },
      EN_FAENA: { color: 'bg-red-100 text-red-700', label: 'En Faena' },
      FAENADO: { color: 'bg-green-100 text-green-700', label: 'Faenado' },
      DESPACHADO: { color: 'bg-gray-100 text-gray-700', label: 'Despachado' }
    }
    const c = config[estado] || { color: 'bg-gray-100 text-gray-700', label: estado }
    return <Badge className={c.color}>{c.label}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Fecha Desde</Label>
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Hasta</Label>
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Especie</Label>
              <Select value={especie} onValueChange={setEspecie}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="BOVINO">Bovino</SelectItem>
                  <SelectItem value="EQUINO">Equino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos</SelectItem>
                  <SelectItem value="RECIBIDO">Recibido</SelectItem>
                  <SelectItem value="EN_CORRAL">En Corral</SelectItem>
                  <SelectItem value="EN_PESAJE">En Pesaje</SelectItem>
                  <SelectItem value="PESADO">Pesado</SelectItem>
                  <SelectItem value="LISTO_FAENA">Listo Faena</SelectItem>
                  <SelectItem value="EN_FAENA">En Faena</SelectItem>
                  <SelectItem value="FAENADO">Faenado</SelectItem>
                  <SelectItem value="DESPACHADO">Despachado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleBuscar} disabled={loading} className="bg-amber-500 hover:bg-amber-600">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                <span className="ml-2">Buscar</span>
              </Button>
              <ExportButton
                onExportExcel={handleExportar}
                onExportPDF={handleExportarPDF}
                onPrint={() => window.print()}
                disabled={exporting || datos.length === 0}
                size="default"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      {datos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">Total Tropas</p>
              <p className="text-2xl font-bold text-stone-800">{resumen.totalTropas}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">Total Cabezas</p>
              <p className="text-2xl font-bold text-stone-800">{resumen.totalCabezas}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">Peso Neto</p>
              <p className="text-2xl font-bold text-stone-800">{resumen.totalPesoNeto.toLocaleString()} kg</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">P. Promedio</p>
              <p className="text-2xl font-bold text-blue-600">{resumen.pesoPromedio.toFixed(0)} kg</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">Recibidas</p>
              <p className="text-2xl font-bold text-blue-600">{resumen.recibidas}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">En Proceso</p>
              <p className="text-2xl font-bold text-amber-600">{resumen.enProceso}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">Finalizadas</p>
              <p className="text-2xl font-bold text-green-600">{resumen.finalizadas}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <CardTitle className="text-lg">Detalle de Tropas</CardTitle>
          <CardDescription>
            {datos.length > 0 ? `${datos.length} tropas encontradas` : 'Realice una búsqueda para ver datos'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {datos.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Seleccione un rango de fechas y presione Buscar</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Especie</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Cabezas</TableHead>
                    <TableHead className="text-right">P. Bruto</TableHead>
                    <TableHead className="text-right">P. Tara</TableHead>
                    <TableHead className="text-right">P. Neto</TableHead>
                    <TableHead className="text-right">P. Prom.</TableHead>
                    <TableHead>Usuario Faena</TableHead>
                    <TableHead>Corral</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datos.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono font-medium">{row.codigo}</TableCell>
                      <TableCell>
                        <Badge variant={row.especie === 'BOVINO' ? 'default' : 'secondary'}>
                          {row.especie === 'BOVINO' ? 'B' : 'E'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getEstadoBadge(row.estado)}</TableCell>
                      <TableCell className="text-center">{row.cantidadCabezas}</TableCell>
                      <TableCell className="text-right">{row.pesoBruto?.toFixed(0) || '-'}</TableCell>
                      <TableCell className="text-right">{row.pesoTara?.toFixed(0) || '-'}</TableCell>
                      <TableCell className="text-right font-medium">{row.pesoNeto?.toFixed(0) || '-'}</TableCell>
                      <TableCell className="text-right">{row.pesoPromedioAnimal?.toFixed(0) || '-'}</TableCell>
                      <TableCell>{row.usuarioFaena}</TableCell>
                      <TableCell>{row.corral || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">{row.fechaRecepcion}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ReporteTropas
