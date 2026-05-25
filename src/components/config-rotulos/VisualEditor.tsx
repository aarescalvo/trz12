'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
} from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  Type, Barcode, QrCode, Square, Minus, Image, Trash2, 
  Move, Copy, Download, Upload, ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react'
import { SortableElement } from './SortableElement'
import { ElementEditor } from './ElementEditor'

// Variables disponibles
const VARIABLES_DISPONIBLES = [
  { id: 'NUMERO', nombre: 'Número de Animal (interno)', ejemplo: '15' },
  { id: 'NUMERO_ANIMAL', nombre: 'N° Animal dentro de la Tropa', ejemplo: '015' },
  { id: 'TROPA', nombre: 'Código de Tropa', ejemplo: 'B 2026 0012' },
  { id: 'TROPA_CODIGO', nombre: 'Código Tropa (sin espacios)', ejemplo: 'B20260012' },
  { id: 'NUMERO_CARAVANA', nombre: 'N° Caravana / Arete', ejemplo: '1234567890' },
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
  { id: 'CODIGO_ITF', nombre: 'Código ITF (Tropa+N°Animal+Caravana)', ejemplo: 'B202600010151234567890' },
  { id: 'CUIT', nombre: 'CUIT', ejemplo: '20-12345678-9' },
  { id: 'ESTABLECIMIENTO', nombre: 'Establecimiento', ejemplo: 'FRIGORIFICO' },
]

// Tipos de elementos disponibles
const TIPOS_ELEMENTOS = [
  { tipo: 'TEXTO', nombre: 'Texto', icon: Type, color: 'bg-blue-500' },
  { tipo: 'CODIGO_BARRAS', nombre: 'Cód. Barras', icon: Barcode, color: 'bg-green-500' },
  { tipo: 'QR', nombre: 'QR Code', icon: QrCode, color: 'bg-purple-500' },
  { tipo: 'LINEA', nombre: 'Línea', icon: Minus, color: 'bg-gray-500' },
  { tipo: 'RECTANGULO', nombre: 'Rectángulo', icon: Square, color: 'bg-orange-500' },
  { tipo: 'IMAGEN', nombre: 'Imagen', icon: Image, color: 'bg-pink-500' },
]

export interface RotuloElement {
  id: string
  tipo: 'TEXTO' | 'CODIGO_BARRAS' | 'QR' | 'LINEA' | 'RECTANGULO' | 'IMAGEN'
  campo?: string
  textoFijo?: string
  posX: number
  posY: number
  ancho: number
  alto: number
  fuente: string
  tamano: number
  negrita: boolean
  alineacion: 'LEFT' | 'CENTER' | 'RIGHT'
  tipoCodigo?: string
  altoCodigo?: number
  mostrarTexto?: boolean
  grosorLinea?: number
  imagenBase64?: string
  orden: number
}

interface VisualEditorProps {
  elementos: RotuloElement[]
  onChange: (elementos: RotuloElement[]) => void
  ancho: number
  alto: number
  tipoImpresora: 'ZEBRA' | 'DATAMAX' | 'NETTIRA'
  dpi: number
}

export function VisualEditor({ 
  elementos, 
  onChange, 
  ancho, 
  alto, 
  tipoImpresora, 
  dpi 
}: VisualEditorProps) {
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [zoom, setZoom] = useState(2) // Escala de visualización
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  // Agregar elemento
  const agregarElemento = (tipo: RotuloElement['tipo']) => {
    const nuevoElemento: RotuloElement = {
      id: `el-${Date.now()}`,
      tipo,
      posX: 20,
      posY: 20 + elementos.length * 25,
      ancho: tipo === 'LINEA' ? 150 : tipo === 'IMAGEN' ? 80 : 100,
      alto: tipo === 'CODIGO_BARRAS' ? 50 : tipo === 'IMAGEN' ? 80 : 30,
      fuente: '0',
      tamano: 10,
      negrita: false,
      alineacion: 'LEFT',
      tipoCodigo: 'CODE128',
      altoCodigo: 50,
      mostrarTexto: true,
      grosorLinea: 2,
      orden: elementos.length,
    }
    onChange([...elementos, nuevoElemento])
    setSelectedElement(nuevoElemento.id)
    toast.success(`${TIPOS_ELEMENTOS.find(t => t.tipo === tipo)?.nombre} agregado`)
  }

  // Actualizar elemento
  const actualizarElemento = (id: string, cambios: Partial<RotuloElement>) => {
    onChange(elementos.map(el => el.id === id ? { ...el, ...cambios } : el))
  }

  // Eliminar elemento
  const eliminarElemento = (id: string) => {
    onChange(elementos.filter(el => el.id !== id))
    if (selectedElement === id) setSelectedElement(null)
    toast.success('Elemento eliminado')
  }

  // Duplicar elemento
  const duplicarElemento = (id: string) => {
    const elemento = elementos.find(el => el.id === id)
    if (!elemento) return
    
    const nuevo: RotuloElement = {
      ...elemento,
      id: `el-${Date.now()}`,
      posX: elemento.posX + 20,
      posY: elemento.posY + 20,
    }
    onChange([...elementos, nuevo])
    toast.success('Elemento duplicado')
  }

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event
    setActiveId(null)
    
    const elemento = elementos.find(el => el.id === active.id)
    if (!elemento) return
    
    // Actualizar posición
    const nuevoX = Math.max(0, Math.min(elemento.posX + delta.x / zoom, ancho * dpi / 25.4 - elemento.ancho))
    const nuevoY = Math.max(0, Math.min(elemento.posY + delta.y / zoom, alto * dpi / 25.4 - elemento.alto))
    
    actualizarElemento(elemento.id, { posX: Math.round(nuevoX), posY: Math.round(nuevoY) })
  }

  // Cargar imagen
  const cargarImagen = (id: string, file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      actualizarElemento(id, { imagenBase64: e.target?.result as string })
    }
    reader.readAsDataURL(file)
  }

  // Canvas dimensions in points
  const canvasWidth = ancho * dpi / 25.4
  const canvasHeight = alto * dpi / 25.4

  const selectedElementData = elementos.find(el => el.id === selectedElement)

  return (
    <div className="flex gap-2 h-full p-2">
      {/* Panel izquierdo: Herramientas y Variables */}
      <div className="w-56 flex flex-col gap-2">
        {/* Herramientas */}
        <Card className="border shadow-sm">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm">Agregar Elementos</CardTitle>
          </CardHeader>
          <CardContent className="p-2 grid grid-cols-2 gap-1">
            {TIPOS_ELEMENTOS.map(t => (
              <Button
                key={t.tipo}
                variant="outline"
                size="sm"
                className="justify-start text-xs"
                onClick={() => agregarElemento(t.tipo as RotuloElement['tipo'])}
              >
                <t.icon className={`w-3 h-3 mr-1 ${t.color} text-white p-0.5 rounded`} />
                {t.nombre}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Zoom */}
        <Card className="border shadow-sm">
          <CardContent className="p-2 flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(1, zoom - 0.5))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">{zoom}x</span>
            <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(4, zoom + 0.5))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Ayuda ITF Datamax */}
        <Card className="border shadow-sm bg-blue-50/50">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs font-semibold text-blue-700 flex items-center gap-1">
              <Barcode className="w-3 h-3" />
              Código ITF Datamax
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-1.5">
            <p className="text-[10px] text-blue-600 leading-tight">
              Para conformar el código ITF con los datos del animal:
            </p>
            <div className="bg-white rounded p-1.5 space-y-1 border border-blue-100">
              <div className="text-[10px]">
                <span className="text-stone-500">Tropa:</span>{' '}
                <code className="text-amber-600 font-mono">{'{{TROPA_CODIGO}}'}</code>
              </div>
              <div className="text-[10px]">
                <span className="text-stone-500">N° Animal:</span>{' '}
                <code className="text-amber-600 font-mono">{'{{NUMERO_ANIMAL}}'}</code>
              </div>
              <div className="text-[10px]">
                <span className="text-stone-500">Caravana:</span>{' '}
                <code className="text-amber-600 font-mono">{'{{NUMERO_CARAVANA}}'}</code>
              </div>
            </div>
            <div className="bg-white rounded p-1.5 border border-blue-100">
              <code className="text-[9px] font-mono text-stone-700 break-all">
                TROPA + N°ANIMAL + CARAVANA
              </code>
              <p className="text-[9px] text-stone-400 mt-0.5">
                Ej: B20260001 + 015 + 1234567890
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Variables - Drag & Drop */}
        <Card className="border shadow-sm flex-1 overflow-hidden">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span>Variables</span>
              <span className="text-xs text-stone-400 font-normal">(arrastrar o click)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-auto flex-1">
            <div className="p-2 space-y-1">
              {VARIABLES_DISPONIBLES.map(v => (
                <div
                  key={v.id}
                  className="text-xs p-2 hover:bg-amber-50 border border-transparent hover:border-amber-200 rounded cursor-grab active:cursor-grabbing transition-colors"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('variable', v.id)
                    e.dataTransfer.effectAllowed = 'copy'
                  }}
                  onClick={() => {
                    if (selectedElementData) {
                      actualizarElemento(selectedElement!, { campo: v.id || '', textoFijo: undefined })
                      toast.success(`Variable {{${v.id}}} asignada`)
                    } else {
                      toast.info('Seleccione un elemento primero')
                    }
                  }}
                >
                  <code className="text-amber-600 font-mono font-medium">{'{{' + v.id + '}}'}</code>
                  <p className="text-stone-500 truncate text-[11px]">{v.nombre}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Centro: Canvas */}
      <div className="flex-1 flex flex-col">
        <Card className="border-0 shadow-md flex-1 overflow-hidden">
          <CardContent className="p-4 h-full overflow-auto bg-stone-100">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div
                className="relative bg-white shadow-lg mx-auto"
                style={{
                  width: `${canvasWidth * zoom}px`,
                  height: `${canvasHeight * zoom}px`,
                  minWidth: '300px',
                  minHeight: '200px',
                }}
                onClick={() => setSelectedElement(null)}
              >
                {/* Grid de fondo */}
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
                    backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                  }}
                />

                {/* Elementos */}
                {elementos.map((elemento) => (
                  <SortableElement
                    key={elemento.id}
                    elemento={elemento}
                    zoom={zoom}
                    isSelected={selectedElement === elemento.id}
                    onSelect={() => setSelectedElement(elemento.id)}
                    onDelete={() => eliminarElemento(elemento.id)}
                    onDuplicate={() => duplicarElemento(elemento.id)}
                    onMove={(x, y) => actualizarElemento(elemento.id, { posX: x, posY: y })}
                  />
                ))}
              </div>
            </DndContext>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="mt-2 text-xs text-stone-500 flex justify-between">
          <span>Canvas: {ancho}x{alto}mm ({Math.round(canvasWidth)}x{Math.round(canvasHeight)} pts @ {dpi} DPI)</span>
          <span>Elementos: {elementos.length}</span>
        </div>
      </div>

      {/* Panel derecho: Propiedades */}
      <div className="w-72">
        <Card className="border-0 shadow-md h-full">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Propiedades
              {selectedElementData && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => duplicarElemento(selectedElement!)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => eliminarElemento(selectedElement!)} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 overflow-auto">
            {selectedElementData ? (
              <ElementEditor
                elemento={selectedElementData}
                onChange={(cambios) => actualizarElemento(selectedElement!, cambios)}
                onImageLoad={(file) => cargarImagen(selectedElement!, file)}
                variables={VARIABLES_DISPONIBLES}
              />
            ) : (
              <p className="text-sm text-stone-400 text-center py-8">
                Seleccione un elemento para editar sus propiedades
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
