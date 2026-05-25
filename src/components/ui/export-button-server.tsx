'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Download,
  FileText,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Server,
  Monitor,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

type ReportType =
  | 'faena'
  | 'stock'
  | 'tropas'
  | 'rendimiento'
  | 'pesajes'
  | 'cajas'
  | 'cuentas-corrientes'
type ExportFormat = 'pdf' | 'excel'

interface ServerExportResponse {
  success: boolean
  url?: string
  error?: string
  meta?: {
    reportType: string
    format: string
    totalRows: number
    generatedIn: number
  }
}

export interface ExportButtonServerProps {
  /** Report type identifier, used for server-side data fetching */
  reportType: string
  /** Filters to pass to the server endpoint */
  filters?: Record<string, any>
  /** Client-side export handlers (used when dataCount <= 500) */
  clientSideExport?: {
    pdf: () => void | Promise<void>
    excel: () => void | Promise<void>
    print?: () => void | Promise<void>
  }
  /** Number of rows in the current dataset. If > 500, forces server-side */
  dataCount?: number
  /** Threshold for switching to server-side (default: 500) */
  serverSideThreshold?: number
  /** Button label */
  label?: string
  /** Button variant */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /** Disabled state */
  disabled?: boolean
  /** Custom class name */
  className?: string
}

interface ExportProgress {
  type: 'pdf' | 'excel' | 'print'
  mode: 'client' | 'server'
  phase: 'starting' | 'processing' | 'downloading' | 'done' | 'error'
  progress: number
  message: string
  error?: string
}

const PROGRESS_MESSAGES = {
  starting: { client: 'Preparando exportación...', server: 'Enviando solicitud al servidor...' },
  processing: { client: 'Generando archivo...', server: 'Procesando datos en el servidor...' },
  downloading: { client: 'Descargando archivo...', server: 'Descargando archivo generado...' },
  done: { client: '¡Exportación completa!', server: '¡Exportación completa!' },
  error: { client: 'Error en la exportación', server: 'Error en la exportación' },
}

export function ExportButtonServer({
  reportType,
  filters = {},
  clientSideExport,
  dataCount,
  serverSideThreshold = 500,
  label = 'Exportar',
  variant = 'outline',
  size = 'default',
  disabled = false,
  className = '',
}: ExportButtonServerProps) {
  const [progress, setProgress] = useState<ExportProgress | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const shouldUseServer = !clientSideExport || (dataCount !== undefined && dataCount > serverSideThreshold)

  const simulateClientProgress = useCallback(
    async (type: 'pdf' | 'excel' | 'print', handler: () => void | Promise<void>) => {
      setProgress({ type, mode: 'client', phase: 'starting', progress: 10, message: PROGRESS_MESSAGES.starting.client })

      try {
        // Small delay to show the starting phase
        await new Promise(r => setTimeout(r, 200))
        setProgress(prev => prev ? { ...prev, phase: 'processing', progress: 30, message: PROGRESS_MESSAGES.processing.client } : null)

        await handler()

        setProgress(prev => prev ? { ...prev, phase: 'done', progress: 100, message: PROGRESS_MESSAGES.done.client } : null)

        if (type === 'pdf') toast.success('PDF generado correctamente')
        else if (type === 'excel') toast.success('Excel generado correctamente')
      } catch (error) {
        console.error(`Error al exportar ${type} (client):`, error)
        setProgress(prev => prev ? { ...prev, phase: 'error', progress: 0, message: PROGRESS_MESSAGES.error.client, error: error instanceof Error ? error.message : 'Error desconocido' } : null)
        toast.error(`Error al generar ${type.toUpperCase()}`)
      }
    },
    []
  )

  const exportServerSide = useCallback(
    async (format: ExportFormat) => {
      abortRef.current?.abort()
      abortRef.current = new AbortController()

      setProgress({ type: format, mode: 'server', phase: 'starting', progress: 5, message: PROGRESS_MESSAGES.starting.server })

      try {
        setProgress(prev => prev ? { ...prev, phase: 'processing', progress: 20, message: PROGRESS_MESSAGES.processing.server } : null)

        const res = await fetch('/api/reportes/exportar-server', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportType,
            format,
            filters,
          }),
          signal: abortRef.current.signal,
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Error de conexión' }))
          throw new Error(errorData.error || `Error HTTP ${res.status}`)
        }

        const data: ServerExportResponse = await res.json()

        if (!data.success || !data.url) {
          throw new Error(data.error || 'El servidor no devolvió un archivo')
        }

        setProgress(prev => prev ? { ...prev, phase: 'downloading', progress: 80, message: PROGRESS_MESSAGES.downloading.server } : null)

        // Trigger download
        const link = document.createElement('a')
        link.href = data.url
        link.download = data.url.split('/').pop() || `export_${reportType}.${format}`
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setProgress(prev => prev ? { ...prev, phase: 'done', progress: 100, message: PROGRESS_MESSAGES.done.server } : null)

        const meta = data.meta
        const metaMsg = meta
          ? ` (${meta.totalRows} filas en ${(meta.generatedIn / 1000).toFixed(1)}s)`
          : ''
        toast.success(`${format.toUpperCase()} generado correctamente${metaMsg}`)
      } catch (error: any) {
        if (error.name === 'AbortError') {
          setProgress(null)
          toast.info('Exportación cancelada')
          return
        }
        console.error(`Error al exportar ${format} (server):`, error)
        setProgress(prev => prev
          ? { ...prev, phase: 'error', progress: 0, message: PROGRESS_MESSAGES.error.server, error: error instanceof Error ? error.message : 'Error desconocido' }
          : null
        )
        toast.error(`Error al generar ${format.toUpperCase()}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      } finally {
        abortRef.current = null
      }
    },
    [reportType, filters]
  )

  const handleExport = useCallback(
    async (type: 'pdf' | 'excel' | 'print') => {
      if (progress && progress.phase === 'processing') return

      if (type === 'print') {
        if (clientSideExport?.print) {
          await simulateClientProgress('print', clientSideExport.print)
        } else {
          toast.info('Impresión solo disponible en exportación local')
        }
        return
      }

      // For PDF/Excel: decide server-side vs client-side
      if (shouldUseServer) {
        await exportServerSide(type)
      } else if (clientSideExport) {
        const handler = type === 'pdf' ? clientSideExport.pdf : clientSideExport.excel
        await simulateClientProgress(type, handler)
      }
    },
    [progress, shouldUseServer, clientSideExport, exportServerSide, simulateClientProgress]
  )

  const isLoading = progress !== null && progress.phase !== 'done' && progress.phase !== 'error'

  // Determine which options to show
  const hasPdf = shouldUseServer || !!clientSideExport?.pdf
  const hasExcel = shouldUseServer || !!clientSideExport?.excel
  const hasPrint = !!clientSideExport?.print

  const options: Array<{
    type: 'pdf' | 'excel' | 'print'
    icon: typeof FileText
    label: string
    colorClass: string
    mode: 'client' | 'server'
  }> = []

  if (hasPdf) {
    options.push({
      type: 'pdf',
      icon: FileText,
      label: 'Exportar PDF',
      colorClass: 'text-red-500',
      mode: shouldUseServer ? 'server' : 'client',
    })
  }

  if (hasExcel) {
    options.push({
      type: 'excel',
      icon: FileSpreadsheet,
      label: 'Exportar Excel',
      colorClass: 'text-green-600',
      mode: shouldUseServer ? 'server' : 'client',
    })
  }

  if (hasPrint) {
    options.push({
      type: 'print',
      icon: Printer,
      label: 'Imprimir',
      colorClass: 'text-blue-500',
      mode: 'client',
    })
  }

  if (options.length === 0) return null

  // Single option: render as a plain button
  if (options.length === 1) {
    const opt = options[0]
    const Icon = opt.icon
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleExport(opt.type)}
        disabled={disabled || isLoading}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Icon className={`w-4 h-4 ${opt.colorClass}`} />
        )}
        {size !== 'icon' && <span className="ml-2">{opt.label}</span>}
      </Button>
    )
  }

  // Progress overlay (shown during server-side export)
  const renderProgress = () => {
    if (!progress) return null
    if (progress.phase === 'done' || progress.phase === 'error') return null

    return (
      <div className="px-3 py-2 border-t border-border">
        <div className="flex items-center gap-2 mb-1.5">
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{progress.message}</span>
        </div>
        <Progress value={progress.progress} className="h-1.5" />
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isLoading}
          className={className}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {size !== 'icon' && (
            <>
              <span className="ml-2">{label}</span>
              {!isLoading && <ChevronDown className="w-3 h-3 ml-1 opacity-50" />}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {shouldUseServer && dataCount !== undefined && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Server className="w-3 h-3" />
              Exportación en servidor ({dataCount.toLocaleString('es-AR')} filas)
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}

        {options.map((opt, idx) => (
          <DropdownMenuItem
            key={opt.type}
            onClick={() => handleExport(opt.type)}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <opt.icon className={`w-4 h-4 ${opt.colorClass}`} />
            <span className="flex-1">{opt.label}</span>
            {opt.mode === 'server' && (
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                SERVER
              </span>
            )}
          </DropdownMenuItem>
        ))}

        {/* Progress section at the bottom */}
        {renderProgress()}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ExportButtonServer
