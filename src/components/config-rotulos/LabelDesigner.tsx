'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Type, Barcode, Minus, Plus, Trash2, Move, Download, Eye, RotateCcw
} from 'lucide-react'

// Tipos de elementos
interface LabelElement {
  id: string
  type: 'text' | 'variable' | 'barcode' | 'line'
  x: number
  y: number
  width: number
  height: number
  content: string
  fontSize: number
  fontFamily: string
  bold: boolean
  align: 'left' | 'center' | 'right'
}

// Variables disponibles
const VARIABLES = [
  { id: 'NUMERO', label: 'Número Animal', example: '15' },
  { id: 'TROPA', label: 'Código Tropa', example: 'B 2026 0012' },
  { id: 'TIPO', label: 'Tipo Animal', example: 'VA' },
  { id: 'PESO', label: 'Peso', example: '452' },
  { id: 'CODIGO', label: 'Código', example: 'B20260012-015' },
  { id: 'RAZA', label: 'Raza', example: 'Angus' },
  { id: 'FECHA', label: 'Fecha', example: '20/03/2026' },
  { id: 'FECHA_VENC', label: 'Fecha Venc.', example: '19/04/2026' },
  { id: 'PRODUCTO', label: 'Producto', example: 'MEDIA RES' },
  { id: 'GARRON', label: 'Garrón', example: '001' },
  { id: 'LOTE', label: 'Lote', example: 'L2026001' },
  { id: 'CODIGO_BARRAS', label: 'Cód. Barras', example: '1234567890' },
]

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48]
const FONT_FAMILIES = ['Arial', 'Helvetica', 'Courier', 'Times']

interface Props {
  ancho?: number
  alto?: number
  dpi?: number
  tipoImpresora?: 'ZEBRA' | 'DATAMAX' | 'NETTIRA'
  onGenerate: (zpl: string) => void
  initialElements?: LabelElement[]
}

export function LabelDesigner({ 
  ancho = 80, 
  alto = 50, 
  dpi = 203,
  tipoImpresora = 'ZEBRA',
  onGenerate,
  initialElements = []
}: Props) {
  const [elements, setElements] = useState<LabelElement[]>(initialElements)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [previewOpen, setPreviewOpen] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  
  const canvasRef = useRef<HTMLDivElement>(null)
  
  // Escala: píxeles por mm según DPI
  const scale = dpi / 25.4
  const canvasWidth = ancho * scale / 4 // Reducido para visualización
  const canvasHeight = alto * scale / 4
  
  // Copiar contenido (safe para SSR)
  const handleCopiar = async (contenido: string) => {
    try {
      if (typeof window !== 'undefined' && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(contenido)
      } else {
        // Fallback para navegadores sin clipboard API
        const textarea = document.createElement('textarea')
        textarea.value = contenido
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      toast.success('Código copiado')
    } catch (error) {
      console.error('Error al copiar:', error)
      toast.error('No se pudo copiar')
    }
  }
  
  // Agregar elemento
  const addElement = (type: LabelElement['type']) => {
    const newElement: LabelElement = {
      id: `el_${Date.now()}`,
      type,
      x: 20,
      y: 20,
      width: type === 'line' ? 100 : 80,
      height: type === 'line' ? 2 : 20,
      content: type === 'text' ? 'Texto' : 
               type === 'variable' ? '{{NUMERO}}' : 
               type === 'barcode' ? '{{CODIGO_BARRAS}}' : '',
      fontSize: 12,
      fontFamily: 'Arial',
      bold: false,
      align: 'left'
    }
    setElements([...elements, newElement])
    setSelectedId(newElement.id)
  }
  
  // Eliminar elemento seleccionado
  const deleteSelected = () => {
    if (selectedId) {
      setElements(elements.filter(e => e.id !== selectedId))
      setSelectedId(null)
    }
  }
  
  // Actualizar elemento seleccionado
  const updateSelected = (updates: Partial<LabelElement>) => {
    setElements(elements.map(e => 
      e.id === selectedId ? { ...e, ...updates } : e
    ))
  }
  
  // Manejar drag
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const element = elements.find(el => el.id === id)
    if (!element) return
    
    setSelectedId(id)
    setDragging(true)
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left - element.x,
        y: e.clientY - rect.top - element.y
      })
    }
  }
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !selectedId) return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = Math.max(0, Math.min(canvasWidth - 20, e.clientX - rect.left - dragOffset.x))
    const y = Math.max(0, Math.min(canvasHeight - 10, e.clientY - rect.top - dragOffset.y))
    
    updateSelected({ x, y })
  }
  
  const handleMouseUp = () => {
    setDragging(false)
  }
  
  // Generar código ZPL o DPL
  const generateCode = () => {
    if (tipoImpresora === 'ZEBRA') {
      return generateZPL()
    } else {
      return generateDPL()
    }
  }
  
  // Generar ZPL para Zebra
  const generateZPL = (): string => {
    let zpl = `^XA
^PW${Math.round(ancho * dpi / 25.4)}
^LL${Math.round(alto * dpi / 25.4)}
`
    
    // Convertir coordenadas de canvas a puntos ZPL
    const convertX = (x: number) => Math.round(x * 4 * 25.4 / dpi)
    const convertY = (y: number) => Math.round(y * 4 * 25.4 / dpi)
    
    elements.forEach(el => {
      const x = convertX(el.x)
      const y = convertY(el.y)
      
      if (el.type === 'text' || el.type === 'variable') {
        const fontWidth = Math.round(el.fontSize * 0.7)
        const fontHeight = el.fontSize
        zpl += `^FO${x},${y}^A0N,${fontHeight},${fontWidth}^FD${el.content}^FS\n`
      } else if (el.type === 'barcode') {
        const bcHeight = 50
        zpl += `^FO${x},${y}^BY2,3,${bcHeight}^BCN,${bcHeight},Y,N,N^FD${el.content}^FS\n`
      } else if (el.type === 'line') {
        zpl += `^FO${x},${y}^GB${Math.round(el.width * 4)},1,1^FS\n`
      }
    })
    
    zpl += '^XZ'
    return zpl
  }
  
  // Generar DPL para Datamax
  const generateDPL = (): string => {
    let dpl = `\x02n\n\x02M0500\n` // STX n, STX M0500
    
    const convertX = (x: number) => Math.round(x * 4 * 25.4 / dpi)
    const convertY = (y: number) => Math.round(y * 4 * 25.4 / dpi)
    
    elements.forEach(el => {
      const x = convertX(el.x)
      const y = convertY(el.y)
      
      if (el.type === 'text' || el.type === 'variable') {
        // Formato: 1 pX pY h w f data
        dpl += `1 ${x} ${y} ${el.fontSize} ${Math.round(el.fontSize * 0.7)} 0 ${el.content}\n`
      } else if (el.type === 'barcode') {
        // Código de barras Code 128
        dpl += `B ${x} ${y} 0 1 2 50 0 ${el.content}\n`
      } else if (el.type === 'line') {
        // Línea horizontal
        dpl += `L ${x} ${y} ${Math.round(el.width * 4)} 1\n`
      }
    })
    
    dpl += 'E\n' // End
    return dpl
  }
  
  // Vista previa
  const handlePreview = () => {
    const code = generateCode()
    setGeneratedCode(code)
    setPreviewOpen(true)
  }
  
  // Usar código
  const handleUse = () => {
    const code = generateCode()
    onGenerate(code)
    toast.success('Código generado correctamente')
  }
  
  // Limpiar todo
  const clearAll = () => {
    setElements([])
    setSelectedId(null)
  }
  
  const selected = elements.find(e => e.id === selectedId)
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Panel izquierdo - Herramientas */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm">Agregar Elementos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => addElement('text')}>
              <Type className="w-4 h-4 mr-2" /> Texto Fijo
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => addElement('variable')}>
              <Type className="w-4 h-4 mr-2 text-blue-500" /> Variable
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => addElement('barcode')}>
              <Barcode className="w-4 h-4 mr-2" /> Código Barras
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => addElement('line')}>
              <Minus className="w-4 h-4 mr-2" /> Línea
            </Button>
          </CardContent>
        </Card>
        
        {/* Variables */}
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm">Variables</CardTitle>
          </CardHeader>
          <CardContent className="max-h-48 overflow-auto space-y-1">
            {VARIABLES.map(v => (
              <Button 
                key={v.id}
                variant="ghost" 
                size="sm" 
                className="w-full justify-between"
                onClick={() => {
                  if (selectedId) {
                    updateSelected({ content: `{{${v.id}}}` })
                  }
                }}
              >
                <span>{v.label}</span>
                <code className="text-xs text-blue-500">{'{{' + v.id + '}}'}</code>
              </Button>
            ))}
          </CardContent>
        </Card>
        
        {/* Propiedades del elemento seleccionado */}
        {selected && (
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Propiedades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Contenido</Label>
                <Input 
                  value={selected.content} 
                  onChange={e => updateSelected({ content: e.target.value })}
                  className="h-8"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Tamaño</Label>
                  <Select value={String(selected.fontSize)} onValueChange={v => updateSelected({ fontSize: parseInt(v) })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONT_SIZES.map(s => <SelectItem key={s} value={String(s)}>{s}pt</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Fuente</Label>
                  <Select value={selected.fontFamily} onValueChange={v => updateSelected({ fontFamily: v })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONT_FAMILIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label className="text-xs">Alineación</Label>
                <Select value={selected.align} onValueChange={v => updateSelected({ align: v as 'left' | 'center' | 'right' })}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Izquierda</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="right">Derecha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="destructive" size="sm" className="w-full" onClick={deleteSelected}>
                <Trash2 className="w-4 h-4 mr-2" /> Eliminar
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Panel central - Canvas */}
      <div className="col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-stone-500">
            Canvas: {ancho} x {alto} mm | {dpi} DPI | {tipoImpresora}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearAll}>
              <RotateCcw className="w-4 h-4 mr-2" /> Limpiar
            </Button>
            <Button variant="outline" size="sm" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" /> Vista Previa
            </Button>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={handleUse}>
              <Download className="w-4 h-4 mr-2" /> Generar Código
            </Button>
          </div>
        </div>
        
        {/* Canvas */}
        <div 
          ref={canvasRef}
          className="relative border-2 border-dashed border-stone-300 bg-white cursor-crosshair"
          style={{ 
            width: canvasWidth, 
            height: canvasHeight,
            backgroundImage: 'linear-gradient(#f0f0f0 1px, transparent 1px), linear-gradient(90deg, #f0f0f0 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={() => setSelectedId(null)}
        >
          {elements.map(el => (
            <div
              key={el.id}
              className={`absolute cursor-move select-none ${selectedId === el.id ? 'ring-2 ring-amber-400' : ''}`}
              style={{
                left: el.x,
                top: el.y,
                width: el.type === 'line' ? el.width : 'auto',
                height: el.type === 'line' ? el.height : 'auto',
                fontSize: el.fontSize,
                fontFamily: el.fontFamily,
                fontWeight: el.bold ? 'bold' : 'normal',
                textAlign: el.align,
                minWidth: el.type !== 'line' ? 20 : undefined,
                whiteSpace: 'nowrap',
                borderBottom: el.type === 'line' ? '2px solid black' : undefined,
              }}
              onMouseDown={e => handleMouseDown(e, el.id)}
            >
              {el.type === 'barcode' && (
                <div className="flex items-center gap-1">
                  <Barcode className="w-4 h-4" />
                  <span className="text-xs font-mono">{el.content}</span>
                </div>
              )}
              {el.type !== 'barcode' && el.type !== 'line' && el.content}
            </div>
          ))}
        </div>
        
        <div className="text-xs text-stone-400">
          💡 Hacé click en un elemento para seleccionarlo. Arrastralo para moverlo.
        </div>
      </div>
      
      {/* Modal Vista Previa */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl" maximizable>
          <DialogHeader>
            <DialogTitle>Vista Previa del Código</DialogTitle>
          </DialogHeader>
          <pre className="bg-stone-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-96 font-mono">
            {generatedCode}
          </pre>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCopiar(generatedCode)}>
              Copiar
            </Button>
            <Button onClick={() => {
              setPreviewOpen(false)
              handleUse()
            }}>
              Usar este código
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default LabelDesigner
