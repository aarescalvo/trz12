'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useOperador } from '@/components/providers/auth-provider'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Save, RotateCcw, ShieldAlert, Loader2, Columns3, FileSpreadsheet, Eye, Ruler,
  GripVertical
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

interface ReportConfig {
  excel: {
    pagina: { orientacion: string; ajustarAncho: boolean }
    margenes: { izquierdo: number; derecho: number; superior: number; inferior: number }
    anchoColumnas: Record<string, number>
    fuentes: {
      familia: string
      tamanoEncabezado: number
      tamanoDatos: number
      tamanoInfo: number
      tamanoMenudencia: number
    }
    formatosNumericos: {
      kgEntero: string
      kgDecimal: string
      porcentaje: string
      fecha: string
      hora: string
    }
    separacion: { filasAntesMenudencia: number }
  }
  pdf: Record<string, unknown>
}

type ZoneId = 'header' | 'operator' | 'summary' | 'animalTable' | 'menudencia'

interface ZoneMeta {
  id: ZoneId
  label: string
  fontKey: 'tamanoEncabezado' | 'tamanoInfo' | 'tamanoDatos' | 'tamanoMenudencia'
}

const ZONES: ZoneMeta[] = [
  { id: 'header', label: 'Encabezado', fontKey: 'tamanoEncabezado' },
  { id: 'operator', label: 'Info Operador', fontKey: 'tamanoInfo' },
  { id: 'summary', label: 'Resumen', fontKey: 'tamanoDatos' },
  { id: 'animalTable', label: 'Tabla Animales', fontKey: 'tamanoDatos' },
  { id: 'menudencia', label: 'Menudencia', fontKey: 'tamanoMenudencia' },
]

const COLUMN_MAP: Record<string, { label: string; key: string }> = {
  A: { label: '(margen)', key: 'A' },
  B: { label: '(margen)', key: 'B' },
  C_garron: { label: 'N\u00b0 Garr\u00f3n', key: 'C_garron' },
  D_animal: { label: 'N\u00b0 Animal', key: 'D_animal' },
  E_raza: { label: 'Raza', key: 'E_raza' },
  F_G_clasif: { label: 'Clasificaci\u00f3n', key: 'F_G_clasif' },
  H_caravana: { label: 'Caravana', key: 'H_caravana' },
  I_kgEntrada: { label: 'Kg Entrada', key: 'I_kgEntrada' },
  J_mediaA: { label: 'Kg 1/2 A', key: 'J_mediaA' },
  K_mediaB: { label: 'Kg 1/2 B', key: 'K_mediaB' },
  L_totalKg: { label: 'Total Kg', key: 'L_totalKg' },
  M_rinde: { label: 'Rinde', key: 'M_rinde' },
  N: { label: '(margen)', key: 'N' },
}

const FONT_OPTIONS = ['Calibri', 'Arial', 'Times New Roman', 'Verdana', 'Tahoma']

// 1 Excel column unit ≈ 7 pixels
const EXCEL_TO_PX = 7

// Sample data
const ANIMAL_DATA = [
  { garron: 1, animal: 1, raza: 'Hereford', clasif: '0-2 TO', caravana: '1234ABC', kgEntrada: 420, mediaA: 107.5, mediaB: 108.3, totalKg: 215.8, rinde: '51.38%' },
  { garron: 2, animal: 2, raza: 'Angus', clasif: '2-4 VQ', caravana: '5678DEF', kgEntrada: 395, mediaA: 102.1, mediaB: 103.7, totalKg: 205.8, rinde: '52.10%' },
  { garron: 3, animal: 3, raza: 'Bradford', clasif: '4-6 NT', caravana: '9012GHI', kgEntrada: 410, mediaA: 105.8, mediaB: 106.2, totalKg: 212.0, rinde: '51.71%' },
]

const MENUDENCIA_DATA = [
  { tipo: 'HIGADO', cant: 5, kg: 45.2, unidad: '-', kgDec: 1.0 },
  { tipo: 'CORAZON', cant: 4, kg: 12.8, unidad: '-', kgDec: 0.5 },
  { tipo: 'LENGUA', cant: 3, kg: 15.0, unidad: '-', kgDec: null },
]

const MENUDENCIA_COLS = ['tipo', 'cantidades', 'kg', 'unidad', 'kgDec']

// ============================================================
// DEFAULT CONFIG (for restore)
// ============================================================

const DEFAULT_CONFIG: ReportConfig = {
  excel: {
    pagina: { orientacion: 'landscape', ajustarAncho: true },
    margenes: { izquierdo: 0.4, derecho: 0.4, superior: 0.3, inferior: 0.3 },
    anchoColumnas: {
      A: 4, B: 3.7, C_garron: 10, D_animal: 10, E_raza: 7,
      F_G_clasif: 14, H_caravana: 18, I_kgEntrada: 13,
      J_mediaA: 15, K_mediaB: 13, L_totalKg: 13, M_rinde: 13, N: 3.7,
    },
    fuentes: {
      familia: 'Calibri',
      tamanoEncabezado: 10,
      tamanoDatos: 10,
      tamanoInfo: 12,
      tamanoMenudencia: 12,
    },
    formatosNumericos: {
      kgEntero: '#,##0',
      kgDecimal: '#,##0.0',
      porcentaje: '0.00%',
      fecha: 'DD/MM/YYYY',
      hora: 'HH:MM',
    },
    separacion: { filasAntesMenudencia: 4 },
  },
  pdf: {},
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function FormatoReportesPage() {
  const operador = useOperador()
  const [config, setConfig] = useState<ReportConfig | null>(null)
  const [savedConfig, setSavedConfig] = useState<ReportConfig | null>(null)
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hoveredZone, setHoveredZone] = useState<ZoneId | null>(null)

  // Column resize state
  const [resizingCol, setResizingCol] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)
  const [resizeTooltipX, setResizeTooltipX] = useState(0)
  const [resizeTooltipY, setResizeTooltipY] = useState(0)
  const [currentResizeWidth, setCurrentResizeWidth] = useState(0)
  const resizeRef = useRef<HTMLDivElement>(null)

  // Load config
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/config/reporte-rinde-tropa')
        const data = await res.json()
        if (data.success) {
          const c = data.data as ReportConfig
          setConfig(c)
          setSavedConfig(JSON.parse(JSON.stringify(c)))
        }
      } catch {
        toast.error('Error al cargar configuraci\u00f3n')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Permission check
  if (operador && !operador.permisos.puedeConfiguracion) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <ShieldAlert className="h-12 w-12 text-red-500" />
            <h2 className="text-lg font-semibold">Acceso denegado</h2>
            <p className="text-sm text-muted-foreground text-center">
              No ten\u00e9s permisos para acceder al dise\u00f1o de formatos de reportes.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ---- Helpers ----
  const excel = config.excel
  const colPx = (key: string) => (excel.anchoColumnas[key] || 8) * EXCEL_TO_PX
  const zoneFont = (zone: ZoneId) => {
    const z = ZONES.find(zz => zz.id === zone)
    return z ? excel.fuentes[z.fontKey] : 10
  }

  function updateConfig(partial: Partial<ReportConfig['excel']>) {
    setConfig(prev => prev ? { ...prev, excel: { ...prev.excel, ...partial } } : prev)
  }

  function updateNested<K extends keyof ReportConfig['excel']>(
    key: K,
    value: ReportConfig['excel'][K]
  ) {
    setConfig(prev => prev ? { ...prev, excel: { ...prev.excel, [key]: value } } : prev)
  }

  function updateColumnWidth(colKey: string, width: number) {
    setConfig(prev => {
      if (!prev) return prev
      return {
        ...prev,
        excel: {
          ...prev.excel,
          anchoColumnas: { ...prev.excel.anchoColumnas, [colKey]: width },
        },
      }
    })
  }

  // Save
  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/config/reporte-rinde-tropa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (data.success) {
        setSavedConfig(JSON.parse(JSON.stringify(config)))
        toast.success('Configuraci\u00f3n guardada')
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error de conexi\u00f3n')
    } finally {
      setSaving(false)
    }
  }

  // Restore
  function handleRestore() {
    if (savedConfig) {
      setConfig(JSON.parse(JSON.stringify(savedConfig)))
      toast.info('Configuraci\u00f3n restaurada')
    }
  }

  // ---- Column Resize handlers ----
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, colKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    const currentWidth = excel.anchoColumnas[colKey] || 8
    setResizingCol(colKey)
    setResizeStartX(e.clientX)
    setResizeStartWidth(currentWidth)
    setCurrentResizeWidth(currentWidth)
    setResizeTooltipX(e.clientX)
    setResizeTooltipY(e.clientY)
  }, [excel.anchoColumnas])

  useEffect(() => {
    if (!resizingCol) return

    function handleMouseMove(e: MouseEvent) {
      const delta = (e.clientX - resizeStartX) / EXCEL_TO_PX
      const newWidth = Math.max(2, Math.round((resizeStartWidth + delta) * 10) / 10)
      setCurrentResizeWidth(newWidth)
      setResizeTooltipX(e.clientX)
      setResizeTooltipY(e.clientY)
    }

    function handleMouseUp() {
      if (resizingCol) {
        updateColumnWidth(resizingCol, currentResizeWidth)
      }
      setResizingCol(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingCol, resizeStartX, resizeStartWidth, currentResizeWidth])

  // Prevent text selection during resize
  useEffect(() => {
    if (resizingCol) {
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
    } else {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
    return () => {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [resizingCol])

  // ============================================================
  // CANVAS RENDERING
  // ============================================================

  const selectedZoneMeta = selectedZone ? ZONES.find(z => z.id === selectedZone) : null

  // Build the animal table column keys (non-margin)
  const animalColKeys = Object.keys(COLUMN_MAP).filter(k => !k.match(/^[ABN]$/))

  // Menudencia column widths (fixed for canvas)
  const menColWidths: Record<string, number> = {
    tipo: 70,
    cantidades: 50,
    kg: 60,
    unidad: 50,
    kgDec: 60,
  }

  function ZoneWrapper({
    zone,
    children,
  }: {
    zone: ZoneId
    children: React.ReactNode
  }) {
    const isSelected = selectedZone === zone
    const isHovered = hoveredZone === zone
    const meta = ZONES.find(z => z.id === zone)

    return (
      <div
        className="relative transition-all duration-150"
        style={{
          border: isSelected
            ? '2px solid #3b82f6'
            : isHovered
              ? '2px dashed #93c5fd'
              : '2px solid transparent',
          borderRadius: '4px',
          background: isSelected ? 'rgba(59,130,246,0.05)' : 'transparent',
          cursor: 'pointer',
        }}
        onClick={(e) => {
          e.stopPropagation()
          setSelectedZone(zone)
        }}
        onMouseEnter={() => setHoveredZone(zone)}
        onMouseLeave={() => setHoveredZone(null)}
      >
        {meta && (isSelected || isHovered) && (
          <Badge
            variant="secondary"
            className="absolute -top-2.5 left-2 z-10 text-[10px] px-1.5 py-0"
            style={{ background: isSelected ? '#3b82f6' : '#93c5fd', color: '#fff' }}
          >
            {meta.label}
          </Badge>
        )}
        {children}
      </div>
    )
  }

  // Resize handle between columns
  function ResizeHandle({ colKey }: { colKey: string }) {
    const isResizing = resizingCol === colKey
    const displayWidth = isResizing ? currentResizeWidth : (excel.anchoColumnas[colKey] || 8)

    return (
      <div
        className="absolute top-0 bottom-0 z-20 flex items-center justify-center"
        style={{
          right: 0,
          width: '8px',
          cursor: 'col-resize',
          transform: 'translateX(50%)',
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, colKey)}
      >
        <div
          className="w-[1px] transition-colors duration-100"
          style={{
            height: '100%',
            background: isResizing ? '#3b82f6' : 'transparent',
          }}
          onMouseEnter={(e) => {
            if (!resizingCol) {
              (e.currentTarget as HTMLElement).style.background = '#93c5fd'
            }
          }}
          onMouseLeave={(e) => {
            if (!resizingCol) {
              (e.currentTarget as HTMLElement).style.background = 'transparent'
            }
          }}
        />
        {isResizing && (
          <div
            className="fixed z-50 pointer-events-none bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg"
            style={{
              left: resizeTooltipX + 12,
              top: resizeTooltipY - 30,
            }}
          >
            {displayWidth.toFixed(1)} ({Math.round(displayWidth * EXCEL_TO_PX)}px)
          </div>
        )}
      </div>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white shrink-0">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-lg font-semibold">Formato de Reportes</h1>
            <p className="text-xs text-muted-foreground">Dise\u00f1o visual \u2014 Rinde por Tropa</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRestore} disabled={!savedConfig}>
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Restaurar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        {/* LEFT: Canvas */}
        <div className="flex-1 min-w-0 overflow-auto bg-gray-100 p-4 lg:p-6" onClick={() => setSelectedZone(null)}>
          <div className="mx-auto bg-white shadow-lg border rounded" style={{
            width: excel.pagina.orientacion === 'landscape' ? '1056px' : '756px',
            minWidth: excel.pagina.orientacion === 'landscape' ? '1056px' : '756px',
            padding: `${excel.margenes.superior * 40}px ${excel.margenes.derecho * 40}px ${excel.margenes.inferior * 40}px ${excel.margenes.izquierdo * 40}px`,
            fontFamily: excel.fuentes.familia,
            fontSize: '10px',
          }}>
            {/* Zone 1: Header */}
            <ZoneWrapper zone="header">
              <div style={{ fontSize: `${zoneFont('header')}px`, marginBottom: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td colSpan={4} style={{ fontWeight: 'bold', fontSize: '13px', borderBottom: '2px solid #333', paddingBottom: '2px' }}>
                        RINDE POR TROPA
                      </td>
                      <td colSpan={2} style={{ textAlign: 'right' }}>
                        <div style={{ border: '1px solid #000', padding: '2px 8px', fontWeight: 'bold' }}>RINDE</div>
                      </td>
                    </tr>
                    <tr style={{ fontSize: '11px' }}>
                      <td colSpan={2}>Estab. Faenador: <strong>Solemar Alimentaria S.A.</strong></td>
                      <td colSpan={2} rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle', border: '1px solid #ccc', background: '#f9f9f9' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#1a1a1a' }}>RINDE</div>
                      </td>
                      <td colSpan={2} style={{ textAlign: 'center' }}>
                        <div style={{ border: '1px solid #000', padding: '2px 8px' }}>PROM.</div>
                      </td>
                    </tr>
                    <tr style={{ fontSize: '11px' }}>
                      <td>Matr\u00edcula: <strong>300</strong></td>
                      <td></td>
                      <td colSpan={2} style={{ textAlign: 'center' }}>
                        <div style={{ border: '1px solid #000', padding: '2px 8px' }}></div>
                      </td>
                    </tr>
                    <tr style={{ fontSize: '11px' }}>
                      <td>N\u00b0 SENASA: <strong>3986</strong></td>
                      <td></td>
                      <td colSpan={4}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ZoneWrapper>

            {/* Spacer */}
            <div style={{ height: '24px' }} />

            {/* Zone 2: Operator Info */}
            <ZoneWrapper zone="operator">
              <div style={{ fontSize: `${zoneFont('operator')}px`, marginBottom: '4px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td colSpan={2} style={{ fontWeight: 'bold' }}>Usuario/Matarife:</td>
                      <td colSpan={3}>Juan P\u00e9rez</td>
                      <td style={{ fontWeight: 'bold' }}>Productor:</td>
                      <td>Ganadera del Sur S.R.L.</td>
                    </tr>
                    <tr>
                      <td colSpan={2} style={{ fontWeight: 'bold' }}>Matr\u00edcula:</td>
                      <td colSpan={3}>12345</td>
                      <td style={{ fontWeight: 'bold' }}>N\u00b0 DTE:</td>
                      <td>001-12345678-9</td>
                    </tr>
                    <tr>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td style={{ fontWeight: 'bold' }}>N\u00b0 Guia:</td>
                      <td colSpan={3}>0001-00234567</td>
                    </tr>
                    <tr>
                      <td colSpan={5}></td>
                      <td style={{ fontWeight: 'bold' }}>Fecha Ing.:</td>
                      <td>27/05/2026</td>
                    </tr>
                    <tr>
                      <td colSpan={5}></td>
                      <td style={{ fontWeight: 'bold' }}>Hora:</td>
                      <td>14:30</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ZoneWrapper>

            {/* Spacer */}
            <div style={{ height: '16px' }} />

            {/* Zone 3: Summary */}
            <ZoneWrapper zone="summary">
              <div style={{ fontSize: `${zoneFont('summary')}px` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {/* Fecha Faena header */}
                    <tr>
                      <td colSpan={6} style={{ fontWeight: 'bold', fontSize: '12px' }}>
                        Fecha Faena: <span style={{ color: 'red' }}>27/05/2026</span>
                      </td>
                      <td style={{ fontWeight: 'bold', textAlign: 'center' }}>Cuartos</td>
                      <td style={{ fontWeight: 'bold', textAlign: 'center' }}>Kg</td>
                    </tr>
                    {/* Summary header row */}
                    <tr style={{ background: '#e0e0e0', fontWeight: 'bold' }}>
                      <td>N\u00b0 Tropa</td>
                      <td>Cabezas</td>
                      <td>Kg Vivo</td>
                      <td>Kg 1/2</td>
                      <td>Rinde</td>
                      <td>Promedio</td>
                      <td style={{ textAlign: 'center' }}>VQ</td>
                      <td style={{ textAlign: 'center' }}>NT</td>
                    </tr>
                    {/* Sample data row */}
                    <tr>
                      <td>001</td>
                      <td>3</td>
                      <td>1,225</td>
                      <td>633.6</td>
                      <td>51.71%</td>
                      <td>51.73%</td>
                      <td style={{ textAlign: 'center' }}>2</td>
                      <td style={{ textAlign: 'center' }}>1</td>
                    </tr>
                    {/* Totals */}
                    <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                      <td colSpan={2}>TOTALES</td>
                      <td>1,225</td>
                      <td>633.6</td>
                      <td></td>
                      <td></td>
                      <td style={{ textAlign: 'center' }}>2</td>
                      <td style={{ textAlign: 'center' }}>1</td>
                    </tr>
                    {/* Second row of tipo breakdown */}
                    <tr style={{ background: '#e0e0e0', fontWeight: 'bold' }}>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td style={{ textAlign: 'center' }}>NO</td>
                      <td style={{ textAlign: 'center' }}>TO</td>
                    </tr>
                    <tr>
                      <td colSpan={6}></td>
                      <td style={{ textAlign: 'center' }}>0</td>
                      <td style={{ textAlign: 'center' }}>0</td>
                    </tr>
                    <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                      <td colSpan={6}></td>
                      <td style={{ textAlign: 'center' }}>0</td>
                      <td style={{ textAlign: 'center' }}>0</td>
                    </tr>
                    {/* Third row tipo */}
                    <tr style={{ background: '#e0e0e0', fontWeight: 'bold' }}>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td style={{ textAlign: 'center' }}>VA</td>
                      <td style={{ textAlign: 'center' }}>MEJ</td>
                    </tr>
                    <tr>
                      <td colSpan={6}></td>
                      <td style={{ textAlign: 'center' }}>0</td>
                      <td style={{ textAlign: 'center' }}>0</td>
                    </tr>
                    <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                      <td colSpan={6}></td>
                      <td style={{ textAlign: 'center' }}>0</td>
                      <td style={{ textAlign: 'center' }}>0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ZoneWrapper>

            {/* Spacer */}
            <div style={{ height: '16px' }} />

            {/* Zone 4: Animal Table */}
            <ZoneWrapper zone="animalTable">
              <div style={{ fontSize: `${zoneFont('animalTable')}px` }} ref={resizeRef}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    {/* Header row 1 */}
                    <tr style={{ background: '#d9d9d9', fontWeight: 'bold' }}>
                      <th style={{ width: `${colPx('C_garron')}px`, border: '1px solid #999', padding: '3px 2px', textAlign: 'center', position: 'relative', fontSize: '9px' }}>
                        N\u00b0 GARRON
                        <ResizeHandle colKey="C_garron" />
                      </th>
                      <th style={{ width: `${colPx('D_animal')}px`, border: '1px solid #999', padding: '3px 2px', textAlign: 'center', position: 'relative', fontSize: '9px' }}>
                        N\u00b0 ANIMAL
                        <ResizeHandle colKey="D_animal" />
                      </th>
                      <th style={{ width: `${colPx('E_raza')}px`, border: '1px solid #999', padding: '3px 2px', textAlign: 'center', position: 'relative', fontSize: '9px' }}>
                        RAZA
                        <ResizeHandle colKey="E_raza" />
                      </th>
                      <th style={{ width: `${colPx('F_G_clasif')}px`, border: '1px solid #999', padding: '3px 2px', textAlign: 'center', position: 'relative', fontSize: '9px' }}>
                        CLASIFICACION
                        <ResizeHandle colKey="F_G_clasif" />
                      </th>
                      <th style={{ width: `${colPx('H_caravana')}px`, border: '1px solid #999', padding: '3px 2px', textAlign: 'center', position: 'relative', fontSize: '9px' }}>
                        N\u00b0 CARAVANA
                        <ResizeHandle colKey="H_caravana" />
                      </th>
                      <th style={{ width: `${colPx('I_kgEntrada')}px`, border: '1px solid #999', padding: '3px 2px', textAlign: 'center', position: 'relative', fontSize: '9px' }}>
                        KG ENTRADA
                        <ResizeHandle colKey="I_kgEntrada" />
                      </th>
                      <th style={{ width: `${colPx('J_mediaA')}px`, border: '1px solid #999', padding: '3px 2px', textAlign: 'center', position: 'relative', fontSize: '9px' }}>
                        KG 1/2 A
                        <ResizeHandle colKey="J_mediaA" />
                      </th>
                      <th style={{ width: `${colPx('K_mediaB')}px`, border: '1px solid #999', padding: '3px 2px', textAlign: 'center', position: 'relative', fontSize: '9px' }}>
                        KG 1/2 B
                        <ResizeHandle colKey="K_mediaB" />
                      </th>
                      <th style={{ width: `${colPx('L_totalKg')}px`, border: '1px solid #999', padding: '3px 2px', textAlign: 'center', position: 'relative', fontSize: '9px' }}>
                        TOTAL KG
                        <ResizeHandle colKey="L_totalKg" />
                      </th>
                      <th style={{ width: `${colPx('M_rinde')}px`, border: '1px solid #999', padding: '3px 2px', textAlign: 'center', position: 'relative', fontSize: '9px' }}>
                        RINDE FAENA
                        <ResizeHandle colKey="M_rinde" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ANIMAL_DATA.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #ccc' }}>
                        <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'center' }}>{row.garron}</td>
                        <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'center' }}>{row.animal}</td>
                        <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'center' }}>{row.raza}</td>
                        <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'center' }}>{row.clasif}</td>
                        <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'center' }}>{row.caravana}</td>
                        <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'right' }}>{row.kgEntrada.toLocaleString()}</td>
                        <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'right' }}>{row.mediaA.toFixed(1)}</td>
                        <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'right' }}>{row.mediaB.toFixed(1)}</td>
                        <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'right' }}>{row.totalKg.toFixed(1)}</td>
                        <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'right' }}>{row.rinde}</td>
                      </tr>
                    ))}
                    {/* Totals */}
                    <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                      <td style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'center' }} colSpan={2}>TOTALES</td>
                      <td style={{ border: '1px solid #ccc', padding: '2px 4px' }} colSpan={3}></td>
                      <td style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'right' }}>1,225</td>
                      <td style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'right' }}>315.4</td>
                      <td style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'right' }}>318.2</td>
                      <td style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'right' }}>633.6</td>
                      <td style={{ border: '1px solid #ccc', padding: '2px 4px' }}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ZoneWrapper>

            {/* Spacer (menudencia rows) */}
            <div style={{ height: `${excel.separacion.filasAntesMenudencia * 20}px` }} />

            {/* Zone 5: Menudencia */}
            <ZoneWrapper zone="menudencia">
              <div style={{ fontSize: `${zoneFont('menudencia')}px` }}>
                <table style={{ width: '60%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#d9d9d9', fontWeight: 'bold' }}>
                      <th colSpan={4} style={{ border: '1px solid #999', padding: '4px 6px', textAlign: 'center' }}>MENUDENCIA</th>
                    </tr>
                    <tr style={{ background: '#d9d9d9', fontWeight: 'bold' }}>
                      <th style={{ border: '1px solid #999', padding: '3px 4px', width: `${menColWidths.tipo}px`, textAlign: 'center' }}>Tipo</th>
                      <th style={{ border: '1px solid #999', padding: '3px 4px', width: `${menColWidths.cantidades}px`, textAlign: 'center' }}>Cantidades</th>
                      <th style={{ border: '1px solid #999', padding: '3px 4px', width: `${menColWidths.kg}px`, textAlign: 'center' }}>Kg</th>
                      <th style={{ border: '1px solid #999', padding: '3px 4px', width: `${menColWidths.unidad}px`, textAlign: 'center' }}>Unidad</th>
                      <th style={{ border: '1px solid #999', padding: '3px 4px', width: `${menColWidths.kgDec}px`, textAlign: 'center' }}>Kg Dec.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MENUDENCIA_DATA.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #ccc' }}>
                        <td style={{ border: '1px solid #ddd', padding: '2px 4px', fontWeight: 'bold' }}>{row.tipo}</td>
                        <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'center' }}>{row.cant}</td>
                        <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'right' }}>{row.kg.toFixed(1)}</td>
                        <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'center' }}>{row.unidad}</td>
                        <td style={{ border: '1px solid #ddd', padding: '2px 4px', textAlign: 'right' }}>{row.kgDec != null ? row.kgDec.toFixed(1) : '-'}</td>
                      </tr>
                    ))}
                    {/* Totals */}
                    <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                      <td style={{ border: '1px solid #ccc', padding: '2px 4px' }}>TOTALES</td>
                      <td style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'center' }}>12</td>
                      <td style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'right' }}>73.0</td>
                      <td style={{ border: '1px solid #ccc', padding: '2px 4px' }}></td>
                      <td style={{ border: '1px solid #ccc', padding: '2px 4px' }}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ZoneWrapper>
          </div>
        </div>

        {/* RIGHT: Properties Panel */}
        <div className="w-full lg:w-[360px] shrink-0 border-l bg-white flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Propiedades</h2>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4">
              {!selectedZone ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Eye className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Hac\u00e9 click en una secci\u00f3n del reporte para editar sus propiedades.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Zone Label */}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{selectedZoneMeta?.label}</Badge>
                  </div>

                  <Separator />

                  {/* Font family */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Fuente</Label>
                    <Select
                      value={excel.fuentes.familia}
                      onValueChange={(val) => updateNested('fuentes', { ...excel.fuentes, familia: val })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map(f => (
                          <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Font size for this zone */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">
                      Tama\u00f1o de fuente (px)
                    </Label>
                    <Input
                      type="number"
                      min={6}
                      max={24}
                      value={selectedZoneMeta ? excel.fuentes[selectedZoneMeta.fontKey] : 10}
                      onChange={(e) => {
                        if (!selectedZoneMeta) return
                        const val = parseInt(e.target.value) || 10
                        updateNested('fuentes', { ...excel.fuentes, [selectedZoneMeta.fontKey]: val })
                      }}
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Animal Table: Column widths */}
                  {selectedZone === 'animalTable' && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Columns3 className="h-4 w-4 text-muted-foreground" />
                          <Label className="text-xs font-medium">Anchos de Columna</Label>
                        </div>
                        <div className="space-y-2">
                          {animalColKeys.map(colKey => (
                            <div key={colKey} className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground w-28 truncate" title={COLUMN_MAP[colKey]?.label}>
                                {COLUMN_MAP[colKey]?.label}
                              </Label>
                              <Input
                                type="number"
                                min={2}
                                max={50}
                                step={0.5}
                                value={excel.anchoColumnas[colKey] || 8}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 8
                                  updateColumnWidth(colKey, val)
                                }}
                                className="h-7 text-xs w-20"
                              />
                              <span className="text-[10px] text-muted-foreground w-10">
                                {Math.round((excel.anchoColumnas[colKey] || 8) * EXCEL_TO_PX)}px
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Number formats */}
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <Label className="text-xs font-medium">Formatos Num\u00e9ricos</Label>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(excel.formatosNumericos).map(([key, val]) => (
                            <div key={key} className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground w-28 capitalize">
                                {key === 'kgEntero' ? 'Kg Entero' :
                                 key === 'kgDecimal' ? 'Kg Decimal' :
                                 key === 'porcentaje' ? 'Porcentaje' :
                                 key === 'fecha' ? 'Fecha' : 'Hora'}
                              </Label>
                              <Input
                                value={val}
                                onChange={(e) =>
                                  updateNested('formatosNumericos', { ...excel.formatosNumericos, [key]: e.target.value })
                                }
                                className="h-7 text-xs flex-1"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Menudencia: spacing */}
                  {selectedZone === 'menudencia' && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <Label className="text-xs font-medium">Separaci\u00f3n</Label>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">Filas antes de Menudencia</Label>
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            value={excel.separacion.filasAntesMenudencia}
                            onChange={(e) =>
                              updateNested('separacion', { filasAntesMenudencia: parseInt(e.target.value) || 4 })
                            }
                            className="h-7 text-xs w-20"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* General settings (always visible at bottom) */}
              <Separator className="my-4" />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-xs font-semibold">Configuraci\u00f3n General</Label>
                </div>

                {/* Orientation */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Orientaci\u00f3n de P\u00e1gina</Label>
                  <Select
                    value={excel.pagina.orientacion}
                    onValueChange={(val) =>
                      updateNested('pagina', { ...excel.pagina, orientacion: val })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landscape" className="text-xs">Horizontal (Apaisado)</SelectItem>
                      <SelectItem value="portrait" className="text-xs">Vertical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Fit to width */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Ajustar al ancho</Label>
                  <Switch
                    checked={excel.pagina.ajustarAncho}
                    onCheckedChange={(checked) =>
                      updateNested('pagina', { ...excel.pagina, ajustarAncho: checked })
                    }
                  />
                </div>

                {/* Margins */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">M\u00e1rgenes (cm)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['izquierdo', 'derecho', 'superior', 'inferior'] as const).map(m => (
                      <div key={m} className="flex items-center gap-1.5">
                        <Label className="text-[10px] text-muted-foreground capitalize w-16">{m}</Label>
                        <Input
                          type="number"
                          min={0}
                          max={5}
                          step={0.1}
                          value={excel.margenes[m]}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0
                            updateNested('margenes', { ...excel.margenes, [m]: val })
                          }}
                          className="h-7 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
