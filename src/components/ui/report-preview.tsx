'use client'

import { FileText, FileSpreadsheet, X, Database } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface ReportPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  columns: { key: string; label: string }[]
  data: Record<string, any>[]
  onExportPDF: () => void
  onExportExcel: () => void
}

export function ReportPreview({
  open,
  onOpenChange,
  title,
  columns,
  data,
  onExportPDF,
  onExportExcel,
}: ReportPreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col p-0" maximizable>
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">{title}</DialogTitle>
                <DialogDescription className="mt-1">
                  {data.length} registro{data.length !== 1 ? 's' : ''} encontrado{data.length !== 1 ? 's' : ''}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="hidden sm:flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                {data.length} registros
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={onExportExcel}
                disabled={data.length === 0}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onExportPDF}
                disabled={data.length === 0}
              >
                <FileText className="w-4 h-4 mr-2 text-red-500" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Table Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {data.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-stone-400 p-8">
              <div className="text-center">
                <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay datos para mostrar</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="bg-stone-50 hover:bg-stone-50">
                    {columns.map((col) => (
                      <TableHead
                        key={col.key}
                        className="text-xs font-semibold text-stone-600 whitespace-nowrap px-3 py-2.5"
                      >
                        {col.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, rowIndex) => (
                    <TableRow
                      key={rowIndex}
                      className={
                        rowIndex % 2 === 0
                          ? 'bg-white hover:bg-stone-50'
                          : 'bg-stone-50/60 hover:bg-stone-100/60'
                      }
                    >
                      {columns.map((col) => (
                        <TableCell
                          key={col.key}
                          className="text-sm whitespace-nowrap px-3 py-2"
                        >
                          {formatCellValue(row[col.key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t shrink-0 flex items-center justify-between bg-stone-50/50 rounded-b-lg">
          <p className="text-xs text-stone-400">
            Mostrando {data.length} registro{data.length !== 1 ? 's' : ''} de {data.length}
          </p>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-1.5" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Format a cell value for display in the preview table
 */
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'

  if (typeof value === 'number') {
    // Format numbers with locale
    return new Intl.NumberFormat('es-AR').format(value)
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No'
  }

  // Check for date strings (YYYY-MM-DD format)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    try {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-AR')
      }
    } catch {
      // Not a valid date, fall through
    }
  }

  return String(value)
}

export default ReportPreview
