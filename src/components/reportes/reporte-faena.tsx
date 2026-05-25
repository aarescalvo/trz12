'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Calendar, Download, Beef, Loader2, FileSpreadsheet, Eye } from 'lucide-react'
import { exportReport } from '@/lib/reportes-api'
import { ExportButton } from '@/components/ui/export-button'
import { ColumnSelector, type ColumnDef } from '@/components/ui/column-selector'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { usePagination } from '@/hooks/use-pagination'
import { PDFExporter } from '@/lib/export-pdf'
import { ReportPreview } from '@/components/ui/report-preview'
import { ReportFavorites } from '@/components/ui/report-favorites'

interface FaenaData {
  fecha: string
  garron: number
  tropa: string
  numeroAnimal: number
  especie: string
  tipoAnimal: string
  pesoVivo: number | null
  pesoMediaIzq: number | null
  pesoMediaDer: number | null
  pesoTotal: number | null
  rinde: number | null
  tipificacion: string | null
  tipificador: string | null
}

const FAENA_COLUMNS: ColumnDef[] = [
  { key: 'fecha', label: 'Fecha', fixed: true, order: 0 },
  { key: 'garron', label: 'Garrón', fixed: true, order: 1 },
  { key: 'tropa', label: 'Tropa', order: 2 },
  { key: 'numeroAnimal', label: 'Nº Animal', order: 3 },
  { key: 'especie', label: 'Especie', order: 4 },
  { key: 'tipoAnimal', label: 'Tipo', order: 5 },
  { key: 'pesoVivo', label: 'P. Vivo', order: 6 },
  { key: 'pesoMediaIzq', label: 'M. Izq', order: 7 },
  { key: 'pesoMediaDer', label: 'M. Der', order: 8 },
  { key: 'pesoTotal', label: 'P. Total', order: 9 },
  { key: 'rinde', label: 'Rinde %', order: 10 },
  { key: 'tipificacion', label: 'Tipif.', order: 11 },
]

export function ReporteFaena() {
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [especie, setEspecie] = useState<string>('todas')
  const [operadorId, setOperadorId] = useState('')
  const [datos, setDatos] = useState<FaenaData[]>([])
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    FAENA_COLUMNS.filter((c) => c.visible !== false).map((c) => c.key),
  )
  const {
    currentPage,
    pageSize,
    totalPages,
    paginatedData,
    setPage,
    setPageSize,
  } = usePagination(datos)

  const [resumen, setResumen] = useState({
    totalAnimales: 0,
    totalPesoVivo: 0,
    totalPesoFaena: 0,
    rindePromedio: 0,
    bovinos: 0,
    equinos: 0
  })

  useEffect(() => {
    // Set default dates
    const today = new Date()
    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    
    setFechaHasta(today.toISOString().split('T')[0])
    setFechaDesde(monthAgo.toISOString().split('T')[0])

    // Fetch current operador
    fetch('/api/auth')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.id) {
          setOperadorId(data.data.id)
        }
      })
      .catch(() => {})
  }, [])

  const handleBuscar = async () => {
    if (!fechaDesde || !fechaHasta) {
      toast.error('Seleccione un rango de fechas')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/reportes/faena?desde=${fechaDesde}&hasta=${fechaHasta}&especie=${especie}`)
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
        tipo: 'faena',
        datos: datos as unknown as Array<Record<string, unknown>>,
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

  const handleLoadFilters = useCallback((filters: Record<string, unknown>) => {
    if (filters.fechaDesde) setFechaDesde(String(filters.fechaDesde))
    if (filters.fechaHasta) setFechaHasta(String(filters.fechaHasta))
    if (filters.especie) setEspecie(String(filters.especie))
  }, [])

  const handleExportarPDF = () => {
    if (datos.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    const headers = ['Fecha', 'Garrón', 'Tropa', 'Nº Animal', 'Especie', 'Tipo', 'P. Vivo', 'M. Izq', 'M. Der', 'P. Total', 'Rinde %', 'Tipif.']
    const rows = datos.map(d => [
      d.fecha, d.garron.toString(), d.tropa, d.numeroAnimal.toString(),
      d.especie, d.tipoAnimal, d.pesoVivo?.toFixed(1) || '-',
      d.pesoMediaIzq?.toFixed(1) || '-', d.pesoMediaDer?.toFixed(1) || '-',
      d.pesoTotal?.toFixed(1) || '-', d.rinde?.toFixed(1) + '%' || '-', d.tipificacion || '-'
    ])
    const doc = PDFExporter.generateReport({
      title: 'Reporte de Faena',
      subtitle: `Período: ${fechaDesde} - ${fechaHasta}`,
      headers,
      data: rows,
      orientation: 'landscape',
    })
    PDFExporter.downloadPDF(doc, `reporte_faena_${fechaDesde}_${fechaHasta}.pdf`)
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="flex items-end gap-2">
              <Button onClick={handleBuscar} disabled={loading} className="bg-amber-500 hover:bg-amber-600">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Beef className="w-4 h-4" />}
                <span className="ml-2">Buscar</span>
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={() => setPreviewOpen(true)}
                disabled={datos.length === 0}
                title="Vista Previa"
              >
                <Eye className="w-4 h-4" />
                <span className="ml-2 hidden sm:inline">Vista Previa</span>
              </Button>
              <ExportButton
                onExportExcel={handleExportar}
                onExportPDF={handleExportarPDF}
                onPrint={() => window.print()}
                disabled={exporting || datos.length === 0}
                size="default"
              />
              <ColumnSelector
                reportId="reporte-faena"
                columns={FAENA_COLUMNS}
                onColumnsChange={setVisibleColumns}
              />
              {operadorId && (
                <ReportFavorites
                  reportType="faena"
                  currentFilters={{ fechaDesde, fechaHasta, especie }}
                  onLoadFilters={handleLoadFilters}
                  operadorId={operadorId}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      {datos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">Total Animales</p>
              <p className="text-2xl font-bold text-stone-800">{resumen.totalAnimales}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">Bovinos</p>
              <p className="text-2xl font-bold text-amber-600">{resumen.bovinos}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">Equinos</p>
              <p className="text-2xl font-bold text-emerald-600">{resumen.equinos}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">Peso Vivo Total</p>
              <p className="text-2xl font-bold text-stone-800">{resumen.totalPesoVivo.toLocaleString()} kg</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">Peso Faena Total</p>
              <p className="text-2xl font-bold text-stone-800">{resumen.totalPesoFaena.toLocaleString()} kg</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">Rinde Promedio</p>
              <p className="text-2xl font-bold text-blue-600">{resumen.rindePromedio.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de datos */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <CardTitle className="text-lg">Detalle de Faena</CardTitle>
          <CardDescription>
            {datos.length > 0 ? `${datos.length} registros encontrados` : 'Realice una búsqueda para ver datos'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {datos.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <Beef className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Seleccione un rango de fechas y presione Buscar</p>
            </div>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {visibleColumns.map((key) => {
                        const col = FAENA_COLUMNS.find((c) => c.key === key)
                        if (!col) return null
                        const isRight = ['pesoVivo', 'pesoMediaIzq', 'pesoMediaDer', 'pesoTotal', 'rinde'].includes(key)
                        return (
                          <TableHead key={key} className={isRight ? 'text-right' : ''}>
                            {col.label}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((row, i) => (
                      <TableRow key={i}>
                        {visibleColumns.map((key) => {
                          switch (key) {
                            case 'fecha':
                              return <TableCell key={key} className="font-mono text-xs">{row.fecha}</TableCell>
                            case 'garron':
                              return <TableCell key={key} className="font-mono">{row.garron}</TableCell>
                            case 'tropa':
                              return <TableCell key={key} className="font-mono">{row.tropa}</TableCell>
                            case 'numeroAnimal':
                              return <TableCell key={key}>{row.numeroAnimal}</TableCell>
                            case 'especie':
                              return (
                                <TableCell key={key}>
                                  <Badge variant={row.especie === 'BOVINO' ? 'default' : 'secondary'}>
                                    {row.especie === 'BOVINO' ? 'B' : 'E'}
                                  </Badge>
                                </TableCell>
                              )
                            case 'tipoAnimal':
                              return <TableCell key={key}>{row.tipoAnimal}</TableCell>
                            case 'pesoVivo':
                              return <TableCell key={key} className="text-right">{row.pesoVivo?.toFixed(1) || '-'}</TableCell>
                            case 'pesoMediaIzq':
                              return <TableCell key={key} className="text-right">{row.pesoMediaIzq?.toFixed(1) || '-'}</TableCell>
                            case 'pesoMediaDer':
                              return <TableCell key={key} className="text-right">{row.pesoMediaDer?.toFixed(1) || '-'}</TableCell>
                            case 'pesoTotal':
                              return <TableCell key={key} className="text-right font-medium">{row.pesoTotal?.toFixed(1) || '-'}</TableCell>
                            case 'rinde':
                              return (
                                <TableCell key={key} className="text-right">
                                  {row.rinde ? (
                                    <span className={row.rinde >= 50 ? 'text-green-600 font-medium' : ''}>
                                      {row.rinde.toFixed(1)}%
                                    </span>
                                  ) : '-'}
                                </TableCell>
                              )
                            case 'tipificacion':
                              return <TableCell key={key}>{row.tipificacion || '-'}</TableCell>
                            default:
                              return null
                          }
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <DataTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={datos.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Report Preview Dialog */}
      <ReportPreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="Reporte de Faena - Vista Previa"
        columns={FAENA_COLUMNS.map(c => ({ key: c.key, label: c.label }))}
        data={datos as unknown as Record<string, any>[]}
        onExportPDF={() => {
          handleExportarPDF()
          setPreviewOpen(false)
        }}
        onExportExcel={() => {
          handleExportar()
          setPreviewOpen(false)
        }}
      />
    </div>
  )
}

export default ReporteFaena
