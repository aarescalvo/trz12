'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Tag, Plus, Edit, Trash2, Copy, Eye, Download, Upload,
  Settings, Palette, Layout, QrCode, Printer, Save, RotateCcw,
  Type, Square, ImageIcon, Barcode, BarChart3, FileText, Layers
} from 'lucide-react'

// ==================== TYPES ====================
interface RotuloElement {
  id?: string
  tipo: 'TEXTO' | 'CODIGO_BARRAS' | 'LINEA' | 'RECTANGULO' | 'IMAGEN' | 'QR'
  campo?: string | null
  textoFijo?: string | null
  posX: number
  posY: number
  ancho: number
  alto: number
  fuente?: string | null
  tamano?: number | null
  negrita?: boolean
  alineacion?: string
  tipoCodigo?: string | null
  altoCodigo?: number | null
  mostrarTexto?: boolean | null
  grosorLinea?: number | null
  color?: string | null
  orden: number
}

interface Rotulo {
  id: string
  nombre: string
  codigo: string
  tipo: string
  ancho: number
  alto: number
  dpi: number
  tipoImpresora: string
  modeloImpresora: string
  contenido: string
  elementos: RotuloElement[]
  esDefault: boolean
  activo: boolean
  diasConsumo?: number
  temperaturaMax?: number
  categoria?: string
  renderedPreview?: string
}

interface Props {
  operador?: { id: string; nombre: string; rol: string }
}

// ==================== CONSTANTS ====================
const VARIABLES_DISPONIBLES = [
  { id: 'NUMERO', nombre: 'Número de Animal', ejemplo: '15' },
  { id: 'TROPA', nombre: 'Código de Tropa', ejemplo: 'B 2026 0012' },
  { id: 'TIPO', nombre: 'Tipo de Animal', ejemplo: 'VA' },
  { id: 'PESO', nombre: 'Peso', ejemplo: '452' },
  { id: 'CODIGO', nombre: 'Código Completo', ejemplo: 'B20260012-015' },
  { id: 'RAZA', nombre: 'Raza', ejemplo: 'Angus' },
  { id: 'FECHA', nombre: 'Fecha', ejemplo: '20/03/2026' },
  { id: 'FECHA_VENC', nombre: 'Fecha Vencimiento', ejemplo: '19/04/2026' },
  { id: 'PRODUCTO', nombre: 'Producto', ejemplo: 'MEDIA RES' },
  { id: 'GARRON', nombre: 'Garrón', ejemplo: '42' },
  { id: 'LADO', nombre: 'Lado', ejemplo: 'I' },
  { id: 'SIGLA', nombre: 'Sigla', ejemplo: 'A' },
  { id: 'PESO_NETO', nombre: 'Peso Neto', ejemplo: '118.5' },
  { id: 'USUARIO_FAENA', nombre: 'Usuario Faena', ejemplo: 'Juan Pérez' },
  { id: 'MATRICULA', nombre: 'Matrícula', ejemplo: '12345' },
  { id: 'CODIGO_BARRAS', nombre: 'Código de Barras', ejemplo: 'B202600120151' },
]

const MODELOS_IMPRESORA: Record<string, { id: string; nombre: string; dpi: number }[]> = {
  ZEBRA: [
    { id: 'ZT410', nombre: 'Zebra ZT410', dpi: 300 },
    { id: 'ZT230', nombre: 'Zebra ZT230', dpi: 203 },
    { id: 'ZD420', nombre: 'Zebra ZD420', dpi: 203 },
    { id: 'ZD620', nombre: 'Zebra ZD620', dpi: 300 },
    { id: 'GK420', nombre: 'Zebra GK420', dpi: 203 },
  ],
  DATAMAX: [
    { id: 'MARK_II', nombre: 'Datamax Mark II', dpi: 203 },
    { id: 'I-4208', nombre: 'Datamax I-4208', dpi: 203 },
    { id: 'I-4212', nombre: 'Datamax I-4212', dpi: 203 },
    { id: 'I-4406', nombre: 'Datamax I-4406', dpi: 203 },
  ]
}

const TIPOS_ROTULO = [
  'PESAJE_INDIVIDUAL',
  'MEDIA_RES',
  'CUARTO',
  'MENUDENCIA',
  'PRODUCTO_TERMINADO_ENVASE_PRIMARIO',
  'PRODUCTO_TERMINADO_ENVASE_SECUNDARIO',
  'PRODUCTO_TERMINADO_UN_ENVASE',
]

// ==================== COMPONENT ====================
export function RotulosMejorasModule({ operador }: Props) {
  const [rotulos, setRotulos] = useState<Rotulo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRotulo, setSelectedRotulo] = useState<Rotulo | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [stats, setStats] = useState<{ total: number; porTipo: { tipo: string; _count: { id: number } }[]; porImpresora: { tipoImpresora: string; _count: { id: number } }[] } | null>(null)
  const [printQueue, setPrintQueue] = useState<string[]>([])

  // Search/filter
  const [filtroTipo, setFiltroTipo] = useState<string>('all')
  const [busqueda, setBusqueda] = useState('')

  const fetchRotulos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroTipo && filtroTipo !== 'all') params.append('tipo', filtroTipo)

      const res = await fetch(`/api/rotulos-mejoras?${params}`)
      const data = await res.json()
      if (data.success) {
        setRotulos(data.data)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching rotulos:', error)
    } finally {
      setLoading(false)
    }
  }, [filtroTipo])

  useEffect(() => {
    fetchRotulos()
  }, [fetchRotulos])

  const filteredRotulos = busqueda
    ? rotulos.filter(r =>
        r.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.codigo.toLowerCase().includes(busqueda.toLowerCase())
      )
    : rotulos

  // Preview
  const fetchPreview = async () => {
    try {
      const res = await fetch('/api/rotulos-mejoras?preview=true')
      const data = await res.json()
      if (data.success) {
        setRotulos(prev => prev.map(r => {
          const preview = data.data.find((p: Rotulo) => p.id === r.id)
          return preview ? { ...r, renderedPreview: preview.renderedPreview } : r
        }))
      }
    } catch (e) {
      console.error('Error fetching preview:', e)
    }
  }

  // Save rotulo
  const handleGuardarRotulo = async () => {
    if (!selectedRotulo) return

    try {
      const isNew = !selectedRotulo.id
      const res = await fetch('/api/rotulos-mejoras', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedRotulo)
      })
      const data = await res.json()
      if (data.success) {
        toast.success(isNew ? 'Plantilla creada correctamente' : 'Plantilla actualizada')
        fetchRotulos()
        setEditMode(false)
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }

  // Duplicate
  const handleDuplicar = async (rotulo: Rotulo) => {
    try {
      const nuevo = {
        ...rotulo,
        id: '',
        nombre: `${rotulo.nombre} (copia)`,
        codigo: `${rotulo.codigo}-copia-${Date.now()}`,
        esDefault: false,
        elementos: rotulo.elementos.map((el, idx) => ({ ...el, id: undefined }))
      }
      const res = await fetch('/api/rotulos-mejoras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevo)
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Rótulo duplicado')
        fetchRotulos()
      }
    } catch (error) {
      toast.error('Error al duplicar')
    }
  }

  // Add element
  const agregarElemento = (tipo: RotuloElement['tipo']) => {
    if (!selectedRotulo) return
    const newEl: RotuloElement = {
      tipo,
      posX: 10,
      posY: 10 + selectedRotulo.elementos.length * 30,
      ancho: tipo === 'LINEA' ? 200 : 100,
      alto: tipo === 'CODIGO_BARRAS' ? 60 : tipo === 'QR' ? 60 : 30,
      fuente: '0',
      tamano: 10,
      negrita: false,
      alineacion: 'LEFT',
      tipoCodigo: 'CODE128',
      altoCodigo: 60,
      mostrarTexto: true,
      grosorLinea: 2,
      color: null,
      orden: selectedRotulo.elementos.length
    }
    setSelectedRotulo({
      ...selectedRotulo,
      elementos: [...selectedRotulo.elementos, newEl]
    })
    toast.success('Elemento agregado')
  }

  // Remove element
  const eliminarElemento = (idx: number) => {
    if (!selectedRotulo) return
    setSelectedRotulo({
      ...selectedRotulo,
      elementos: selectedRotulo.elementos.filter((_, i) => i !== idx).map((el, i) => ({ ...el, orden: i }))
    })
  }

  // Update element
  const updateElemento = (idx: number, updates: Partial<RotuloElement>) => {
    if (!selectedRotulo) return
    setSelectedRotulo({
      ...selectedRotulo,
      elementos: selectedRotulo.elementos.map((el, i) => i === idx ? { ...el, ...updates } : el)
    })
  }

  // Create new template
  const crearNuevo = () => {
    setSelectedRotulo({
      id: '',
      nombre: 'Nueva Plantilla',
      codigo: `ROT-${Date.now()}`,
      tipo: 'MEDIA_RES',
      ancho: 80,
      alto: 50,
      dpi: 203,
      tipoImpresora: 'ZEBRA',
      modeloImpresora: 'ZT410',
      contenido: '',
      elementos: [],
      esDefault: false,
      activo: true,
      diasConsumo: 30,
      temperaturaMax: 5.0
    })
    setEditMode(true)
  }

  // Export format
  const handleExportFormat = async (formato: 'ZPL' | 'DPL') => {
    try {
      const res = await fetch(`/api/rotulos-mejoras?formato=${formato}`)
      const data = await res.json()
      if (data.success && data.exportData) {
        const content = JSON.stringify(data.exportData, null, 2)
        const blob = new Blob([content], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `rotulos_${formato.toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`
        a.click()
        toast.success(`Exportadas ${data.exportData.length} plantillas ${formato}`)
      }
    } catch (e) {
      toast.error('Error al exportar')
    }
  }

  // ==================== RENDER ELEMENT ====================
  const renderElementPreview = (el: RotuloElement) => {
    switch (el.tipo) {
      case 'TEXTO':
        return (
          <div
            style={{
              position: 'absolute',
              left: `${el.posX}pt`,
              top: `${el.posY}pt`,
              width: `${el.ancho}pt`,
              fontSize: `${el.tamano || 10}pt`,
              fontWeight: el.negrita ? 'bold' : 'normal',
              textAlign: (el.alineacion || 'LEFT').toLowerCase() as any,
            }}
            className="truncate text-stone-800"
          >
            {el.textoFijo || `{{${el.campo || 'CAMPO'}}}`}
          </div>
        )
      case 'CODIGO_BARRAS':
        return (
          <div
            style={{
              position: 'absolute',
              left: `${el.posX}pt`,
              top: `${el.posY}pt`,
              width: `${el.ancho}pt`,
              height: `${el.alto || 60}pt`,
            }}
            className="flex flex-col items-center justify-center"
          >
            <div className="w-full h-8 bg-stone-800 rounded-sm" />
            {(el.mostrarTexto !== false) && (
              <span className="text-[8pt] font-mono mt-0.5">{`{{${el.campo || 'CODIGO'}}}`}</span>
            )}
          </div>
        )
      case 'QR':
        return (
          <div
            style={{
              position: 'absolute',
              left: `${el.posX}pt`,
              top: `${el.posY}pt`,
              width: `${Math.min(el.ancho, 60)}pt`,
              height: `${el.alto || 60}pt`,
            }}
            className="flex items-center justify-center"
          >
            <QrCode className="w-full h-full text-stone-400" />
          </div>
        )
      case 'LINEA':
        return (
          <div
            style={{
              position: 'absolute',
              left: `${el.posX}pt`,
              top: `${el.posY}pt`,
              width: `${el.ancho}pt`,
              height: `${el.grosorLinea || 2}pt`,
            }}
            className="bg-black"
          />
        )
      case 'RECTANGULO':
        return (
          <div
            style={{
              position: 'absolute',
              left: `${el.posX}pt`,
              top: `${el.posY}pt`,
              width: `${el.ancho}pt`,
              height: `${el.alto || 30}pt`,
              border: `${el.grosorLinea || 1}px solid black`,
            }}
          />
        )
      case 'IMAGEN':
        return (
          <div
            style={{
              position: 'absolute',
              left: `${el.posX}pt`,
              top: `${el.posY}pt`,
              width: `${el.ancho}pt`,
              height: `${el.alto || 30}pt`,
            }}
            className="flex items-center justify-center border border-dashed border-stone-300"
          >
            <ImageIcon className="w-6 h-6 text-stone-300" />
          </div>
        )
      default:
        return null
    }
  }

  // ==================== EDITOR VISUAL ====================
  const EditorVisual = () => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layout className="w-5 h-5" />
          Editor Visual
        </CardTitle>
        <CardDescription>
          Arrastra elementos y configura las propiedades para diseñar la etiqueta
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Canvas */}
        <div className="overflow-auto bg-stone-200 p-6 rounded-lg">
          <div
            className="relative border-2 border-stone-400 bg-white mx-auto shadow-inner"
            style={{
              width: `${Math.max(selectedRotulo?.ancho || 80, 60)}mm`,
              height: `${Math.max(selectedRotulo?.alto || 50, 30)}mm`,
              minWidth: '250px',
              minHeight: '120px'
            }}
          >
            {selectedRotulo?.elementos.map((el, idx) => (
              <div key={idx} className="group relative">
                {renderElementPreview(el)}
                {/* Hover overlay */}
                <div
                  className="absolute inset-0 border border-transparent hover:border-amber-500 hover:bg-amber-50/30 cursor-pointer transition-colors"
                  style={{
                    left: `${el.posX}pt`,
                    top: `${el.posY}pt`,
                    width: `${el.ancho}pt`,
                    height: `${el.tipo === 'LINEA' ? (el.grosorLinea || 2) + 8 : (el.alto || 30)}pt`,
                  }}
                  title={`${el.tipo} - ${el.campo || el.textoFijo || ''}`}
                />
                {/* Delete button on hover */}
                <button
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => eliminarElemento(idx)}
                >
                  x
                </button>
              </div>
            ))}

            {/* Empty state */}
            {selectedRotulo?.elementos.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-stone-300">
                <div className="text-center">
                  <Layers className="w-8 h-8 mx-auto mb-1" />
                  <p className="text-sm">Agregue elementos con los botones de abajo</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Element toolbar */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => agregarElemento('TEXTO')}>
            <Type className="w-4 h-4 mr-1" /> Texto
          </Button>
          <Button variant="outline" size="sm" onClick={() => agregarElemento('CODIGO_BARRAS')}>
            <Barcode className="w-4 h-4 mr-1" /> Cód. Barras
          </Button>
          <Button variant="outline" size="sm" onClick={() => agregarElemento('QR')}>
            <QrCode className="w-4 h-4 mr-1" /> QR
          </Button>
          <Button variant="outline" size="sm" onClick={() => agregarElemento('LINEA')}>
            <Square className="w-4 h-4 mr-1" /> Línea
          </Button>
          <Button variant="outline" size="sm" onClick={() => agregarElemento('RECTANGULO')}>
            <Square className="w-4 h-4 mr-1" /> Rectángulo
          </Button>
          <Button variant="outline" size="sm" onClick={() => agregarElemento('IMAGEN')}>
            <ImageIcon className="w-4 h-4 mr-1" /> Imagen
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // ==================== PROPERTIES PANEL ====================
  const PanelPropiedades = () => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Propiedades
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Nombre</Label>
            <Input
              value={selectedRotulo?.nombre || ''}
              onChange={(e) => setSelectedRotulo(prev => prev ? { ...prev, nombre: e.target.value } : null)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Código</Label>
            <Input
              value={selectedRotulo?.codigo || ''}
              onChange={(e) => setSelectedRotulo(prev => prev ? { ...prev, codigo: e.target.value } : null)}
              className="h-8 text-sm font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tipo</Label>
            <Select
              value={selectedRotulo?.tipo || 'MEDIA_RES'}
              onValueChange={(v) => setSelectedRotulo(prev => prev ? { ...prev, tipo: v } : null)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_ROTULO.map(t => (
                  <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Impresora</Label>
            <Select
              value={selectedRotulo?.tipoImpresora || 'ZEBRA'}
              onValueChange={(v) => setSelectedRotulo(prev => prev ? { ...prev, tipoImpresora: v } : null)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ZEBRA">Zebra (ZPL)</SelectItem>
                <SelectItem value="DATAMAX">Datamax (DPL)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ancho (mm)</Label>
            <Input
              type="number"
              value={selectedRotulo?.ancho || 80}
              onChange={(e) => setSelectedRotulo(prev => prev ? { ...prev, ancho: parseInt(e.target.value) } : null)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Alto (mm)</Label>
            <Input
              type="number"
              value={selectedRotulo?.alto || 50}
              onChange={(e) => setSelectedRotulo(prev => prev ? { ...prev, alto: parseInt(e.target.value) } : null)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Modelo</Label>
            <Select
              value={selectedRotulo?.modeloImpresora || 'ZT410'}
              onValueChange={(v) => {
                const allModels = [...(MODELOS_IMPRESORA.ZEBRA || []), ...(MODELOS_IMPRESORA.DATAMAX || [])]
                const modelo = allModels.find(m => m.id === v)
                setSelectedRotulo(prev => prev ? { ...prev, modeloImpresora: v, dpi: modelo?.dpi || 203 } : null)
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(MODELOS_IMPRESORA.ZEBRA || []).map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.nombre} ({m.dpi} DPI)</SelectItem>
                ))}
                {(MODELOS_IMPRESORA.DATAMAX || []).map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.nombre} ({m.dpi} DPI)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Días Consumo</Label>
            <Input
              type="number"
              value={selectedRotulo?.diasConsumo || 30}
              onChange={(e) => setSelectedRotulo(prev => prev ? { ...prev, diasConsumo: parseInt(e.target.value) } : null)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={selectedRotulo?.esDefault || false}
            onCheckedChange={(v) => setSelectedRotulo(prev => prev ? { ...prev, esDefault: v } : null)}
          />
          <Label className="text-xs">Plantilla por defecto</Label>
        </div>

        {/* Variables */}
        <div>
          <Label className="mb-1.5 block text-xs font-medium">Variables Disponibles</Label>
          <div className="max-h-36 overflow-y-auto border rounded p-1.5 space-y-0.5">
            {VARIABLES_DISPONIBLES.map(v => (
              <div
                key={v.id}
                className="flex justify-between text-xs p-1.5 hover:bg-stone-100 rounded cursor-pointer transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(`{{${v.id}}}`)
                  toast.success(`{{${v.id}}} copiada`)
                }}
              >
                <span className="font-mono text-amber-600">{'{{' + v.id + '}}'}</span>
                <span className="text-stone-500">{v.nombre}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button className="flex-1 h-9" onClick={handleGuardarRotulo}>
            <Save className="w-4 h-4 mr-1" /> Guardar
          </Button>
          <Button variant="outline" onClick={() => { setEditMode(false); setSelectedRotulo(null) }}>
            <RotateCcw className="w-4 h-4 mr-1" /> Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // ==================== GALLERY ====================
  const GalleryView = () => (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Tag className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Total Plantillas</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {(stats.porTipo || []).slice(0, 3).map((pt, idx) => (
            <Card key={pt.tipo} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${['bg-blue-100', 'bg-green-100', 'bg-purple-100'][idx]}`}>
                    <FileText className={`w-5 h-5 ${['text-blue-600', 'text-green-600', 'text-purple-600'][idx]}`} />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 truncate">{pt.tipo.replace(/_/g, ' ')}</p>
                    <p className="text-2xl font-bold">{pt._count.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Template list */}
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Plantillas de Rótulos
            </CardTitle>
            <CardDescription className="mt-1">
              {filteredRotulos.length} plantilla{filteredRotulos.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={crearNuevo}>
              <Plus className="w-4 h-4 mr-1" /> Nueva
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExportFormat('ZPL')}>
              <Download className="w-4 h-4 mr-1" /> ZPL
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExportFormat('DPL')}>
              <Download className="w-4 h-4 mr-1" /> DPL
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-2 mb-4">
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {TIPOS_ROTULO.map(t => (
                  <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="flex-1"
              placeholder="Buscar plantilla..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRotulos.map(rotulo => (
              <div
                key={rotulo.id}
                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => { setSelectedRotulo(rotulo); setEditMode(true) }}
              >
                {/* Visual Preview */}
                <div className="bg-white border-b p-4">
                  <div
                    className="border border-stone-200 bg-stone-50 mx-auto relative overflow-hidden"
                    style={{
                      width: '100%',
                      height: `${(rotulo.alto / rotulo.ancho) * 100}%`,
                      minHeight: '60px',
                      maxHeight: '120px'
                    }}
                  >
                    {rotulo.elementos.map((el, idx) => renderElementPreview(el))}
                    {rotulo.elementos.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-stone-300 text-xs">
                        Sin elementos
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Tag className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <p className="font-medium truncate">{rotulo.nombre}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {rotulo.esDefault && (
                        <Badge className="bg-amber-500 text-white text-[10px] px-1.5">DEFAULT</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <Badge variant="outline" className="text-[10px]">{rotulo.tipoImpresora}</Badge>
                      <span>{rotulo.ancho}x{rotulo.alto}mm</span>
                      <span>{rotulo.dpi} DPI</span>
                      <span>{rotulo.elementos.length} el</span>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={(e) => { e.stopPropagation(); handleDuplicar(rotulo) }}
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copiar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={(e) => { e.stopPropagation(); setSelectedRotulo(rotulo); setEditMode(true) }}
                    >
                      <Edit className="w-3 h-3 mr-1" /> Editar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredRotulos.length === 0 && (
            <div className="text-center py-12 text-stone-400">
              <Tag className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No se encontraron plantillas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // ==================== BULK PRINT QUEUE ====================
  const PrintQueue = () => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="w-5 h-5" />
          Cola de Impresión
        </CardTitle>
        <CardDescription>
          Gestione la cola de impresión masiva de rótulos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {printQueue.length === 0 ? (
          <div className="text-center py-8 text-stone-400">
            <Printer className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="mb-2">La cola de impresión está vacía</p>
            <p className="text-sm">Seleccione plantillas para agregar a la cola</p>
          </div>
        ) : (
          <div className="space-y-2">
            {printQueue.map((id, idx) => {
              const rotulo = rotulos.find(r => r.id === id)
              return (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{idx + 1}</span>
                    <span className="text-sm">{rotulo?.nombre || id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{rotulo?.tipoImpresora}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => setPrintQueue(prev => prev.filter((_, i) => i !== idx))}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
            <div className="flex gap-2 pt-4 border-t">
              <Button className="flex-1">
                <Printer className="w-4 h-4 mr-1" /> Imprimir Cola ({printQueue.length})
              </Button>
              <Button variant="outline" onClick={() => setPrintQueue([])}>
                Limpiar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">
              Diseñador de Etiquetas
            </h1>
            <p className="text-stone-500 mt-1">
              Editor visual avanzado para rótulos ZPL/DPL/PDF con cola de impresión
            </p>
          </div>
        </div>

        {/* Main content */}
        {editMode && selectedRotulo ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <EditorVisual />
            </div>
            <div className="space-y-4">
              <PanelPropiedades />
            </div>
          </div>
        ) : (
          <Tabs defaultValue="galeria">
            <TabsList className="mb-6">
              <TabsTrigger value="galeria" className="flex items-center gap-2">
                <Tag className="w-4 h-4" /> Galería
              </TabsTrigger>
              <TabsTrigger value="cola" className="flex items-center gap-2">
                <Printer className="w-4 h-4" /> Cola de Impresión
                {printQueue.length > 0 && (
                  <Badge className="bg-amber-500 text-white ml-1">{printQueue.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="galeria">
              <GalleryView />
            </TabsContent>
            <TabsContent value="cola">
              <PrintQueue />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}

export default RotulosMejorasModule
