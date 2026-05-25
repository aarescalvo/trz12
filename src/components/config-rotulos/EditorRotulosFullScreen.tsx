'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
} from '@dnd-kit/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  Type, Barcode, QrCode, Square, Minus, Image, Trash2, 
  Copy, ZoomIn, ZoomOut, Save, ArrowLeft, Palette
} from 'lucide-react'
import { SortableElement } from './SortableElement'
import { RotuloElement } from './VisualEditor'
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

// Tipos de elementos
const TIPOS_ELEMENTOS = [
  { tipo: 'TEXTO', nombre: 'Texto', icon: Type, color: 'bg-blue-500' },
  { tipo: 'CODIGO_BARRAS', nombre: 'Cód. Barras', icon: Barcode, color: 'bg-green-500' },
  { tipo: 'QR', nombre: 'QR Code', icon: QrCode, color: 'bg-purple-500' },
  { tipo: 'LINEA', nombre: 'Línea', icon: Minus, color: 'bg-gray-500' },
  { tipo: 'RECTANGULO', nombre: 'Rectángulo', icon: Square, color: 'bg-orange-500' },
  { tipo: 'IMAGEN', nombre: 'Imagen', icon: Image, color: 'bg-pink-500' },
]

// Modelos de impresora
const MODELOS_IMPRESORA = {
  ZEBRA: [
    { value: 'ZT410', label: 'Zebra ZT410 (300 DPI)', dpi: 300 },
    { value: 'ZT230', label: 'Zebra ZT230 (203 DPI)', dpi: 203 },
    { value: 'ZT411', label: 'Zebra ZT411 (300 DPI)', dpi: 300 },
    { value: 'ZD420', label: 'Zebra ZD420 (203 DPI)', dpi: 203 },
  ],
  DATAMAX: [
    { value: 'MARK_II', label: 'Datamax Mark II (203 DPI)', dpi: 203 },
    { value: 'I-4208', label: 'Datamax I-4208 (203 DPI)', dpi: 203 },
    { value: 'I-4210', label: 'Datamax I-4210 (203 DPI)', dpi: 203 },
  ],
  NETTIRA: [
    { value: 'NTE-200', label: 'Nettira NTE-200 (203 DPI)', dpi: 203 },
    { value: 'NTE-300', label: 'Nettira NTE-300 (300 DPI)', dpi: 300 },
    { value: 'NT-3300', label: 'Nettira NT-3300 (300 DPI)', dpi: 300 },
  ]
}

interface Props {
  rotuloInicial?: {
    id?: string
    nombre: string
    ancho: number
    alto: number
    tipoImpresora: string
    modeloImpresora?: string
    dpi: number
    elementos?: RotuloElement[]
  }
  onGuardar: (rotulo: {
    id?: string
    nombre: string
    ancho: number
    alto: number
    tipoImpresora: string
    modeloImpresora: string
    dpi: number
    elementos: RotuloElement[]
    contenido: string
  }) => Promise<void>
  onVolver: () => void
}

export function EditorRotulosFullScreen({ rotuloInicial, onGuardar, onVolver }: Props) {
  const [nombre, setNombre] = useState(rotuloInicial?.nombre || 'Nuevo Rótulo')
  const [ancho, setAncho] = useState(rotuloInicial?.ancho || 80)
  const [alto, setAlto] = useState(rotuloInicial?.alto || 50)
  const [tipoImpresora, setTipoImpresora] = useState(rotuloInicial?.tipoImpresora || 'ZEBRA')
  const [modeloImpresora, setModeloImpresora] = useState(rotuloInicial?.modeloImpresora || 'ZT410')
  const [dpi, setDpi] = useState(rotuloInicial?.dpi || 300)
  const [elementos, setElementos] = useState<RotuloElement[]>(rotuloInicial?.elementos || [])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [zoom, setZoom] = useState(2)
  const [guardando, setGuardando] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
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
    setElementos([...elementos, nuevoElemento])
    setSelectedElement(nuevoElemento.id)
    toast.success(`${TIPOS_ELEMENTOS.find(t => t.tipo === tipo)?.nombre} agregado`)
  }

  // Actualizar elemento
  const actualizarElemento = (id: string, cambios: Partial<RotuloElement>) => {
    setElementos(elementos.map(el => el.id === id ? { ...el, ...cambios } : el))
  }

  // Eliminar elemento
  const eliminarElemento = (id: string) => {
    setElementos(elementos.filter(el => el.id !== id))
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
    setElementos([...elementos, nuevo])
    toast.success('Elemento duplicado')
  }

  // Cargar imagen
  const cargarImagen = (id: string, file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      actualizarElemento(id, { imagenBase64: e.target?.result as string })
    }
    reader.readAsDataURL(file)
  }

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    // setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event
    const elemento = elementos.find(el => el.id === active.id)
    if (!elemento) return
    
    const canvasWidth = ancho * dpi / 25.4
    const canvasHeight = alto * dpi / 25.4
    const nuevoX = Math.max(0, Math.min(elemento.posX + delta.x / zoom, canvasWidth - elemento.ancho))
    const nuevoY = Math.max(0, Math.min(elemento.posY + delta.y / zoom, canvasHeight - elemento.alto))
    
    actualizarElemento(elemento.id, { posX: Math.round(nuevoX), posY: Math.round(nuevoY) })
  }

  // Generar ZPL
  const generarZPL = (): string => {
    let zpl = '^XA\n'
    zpl += `^PW${Math.round(ancho * dpi / 25.4)}\n`
    zpl += `^LL${Math.round(alto * dpi / 25.4)}\n`
    
    for (const el of elementos.sort((a, b) => a.orden - b.orden)) {
      switch (el.tipo) {
        case 'TEXTO':
          zpl += `^FO${el.posX},${el.posY}\n`
          zpl += `^A${el.fuente}N,${el.tamano},${el.tamano}\n`
          zpl += `^FD${el.textoFijo || `{{${el.campo}}}`}\n`
          zpl += `^FS\n`
          break
        case 'CODIGO_BARRAS':
          zpl += `^FO${el.posX},${el.posY}\n`
          zpl += `^BY2,3,${el.altoCodigo || 60}\n`
          zpl += `^BCN,${el.altoCodigo || 60},${el.mostrarTexto ? 'N' : 'Y'}\n`
          zpl += `^FD${el.textoFijo || `{{${el.campo}}}`}\n`
          zpl += `^FS\n`
          break
        case 'LINEA':
          zpl += `^FO${el.posX},${el.posY}\n`
          zpl += `^GB${el.ancho},${el.grosorLinea || 2},${el.grosorLinea || 2}^FD^FS\n`
          break
        case 'RECTANGULO':
          zpl += `^FO${el.posX},${el.posY}\n`
          zpl += `^GB${el.ancho},${el.alto},${el.grosorLinea || 2}^FD^FS\n`
          break
        case 'QR':
          zpl += `^FO${el.posX},${el.posY}\n`
          zpl += `^BQN,2,${Math.round(el.tamano / 5)}\n`
          zpl += `^FD${el.textoFijo || `{{${el.campo}}}`}\n`
          zpl += `^FS\n`
          break
        case 'IMAGEN':
          if (el.imagenBase64) {
            zpl += `~DYR:IMG${el.id},P,P,${el.ancho},${el.alto},${el.imagenBase64.length}\n`
            zpl += `^FO${el.posX},${el.posY}\n`
            zpl += `^XGR:IMG${el.id},1,1^FS\n`
          }
          break
      }
    }
    zpl += '^XZ'
    return zpl
  }

  // Generar DPL
  const generarDPL = (): string => {
    let dpl = 'STX ESC A\n'
    dpl += `ESC Q ${Math.round(ancho * dpi / 25.4)}\n`
    dpl += `ESC q ${Math.round(alto * dpi / 25.4)}\n`
    
    for (const el of elementos.sort((a, b) => a.orden - b.orden)) {
      switch (el.tipo) {
        case 'TEXTO':
          dpl += `ESC T ${el.fuente};${el.posX};${el.posY};${el.tamano};${el.tamano}\n`
          dpl += `${el.textoFijo || `{{${el.campo}}}`}\n`
          break
        case 'CODIGO_BARRAS':
          dpl += `ESC B ${el.posX};${el.posY};0;CODE128;${el.altoCodigo || 60}\n`
          dpl += `${el.textoFijo || `{{${el.campo}}}`}\n`
          break
        case 'LINEA':
          dpl += `ESC L ${el.posX};${el.posY};${el.posX + el.ancho};${el.posY};${el.grosorLinea || 2}\n`
          break
        case 'RECTANGULO':
          dpl += `ESC R ${el.posX};${el.posY};${el.posX + el.ancho};${el.posY + el.alto};${el.grosorLinea || 2}\n`
          break
        case 'QR':
          dpl += `ESC Q ${el.posX};${el.posY};${el.tamano}\n`
          dpl += `${el.textoFijo || `{{${el.campo}}}`}\n`
          break
        case 'IMAGEN':
          if (el.imagenBase64) {
            dpl += `ESC I ${el.posX};${el.posY};${el.ancho};${el.alto}\n`
          }
          break
      }
    }
    dpl += 'ETX'
    return dpl
  }

  // Guardar
  const handleGuardar = async () => {
    if (!nombre.trim()) {
      toast.error('Ingrese un nombre para el rótulo')
      return
    }
    
    setGuardando(true)
    try {
      const contenido = tipoImpresora === 'DATAMAX' || tipoImpresora === 'NETTIRA' ? generarDPL() : generarZPL()
      await onGuardar({
        id: rotuloInicial?.id,
        nombre,
        ancho,
        alto,
        tipoImpresora,
        modeloImpresora,
        dpi,
        elementos,
        contenido,
      })
      toast.success('Rótulo guardado correctamente')
    } catch (error) {
      toast.error('Error al guardar el rótulo')
    } finally {
      setGuardando(false)
    }
  }

  // Canvas dimensions
  const canvasWidth = ancho * dpi / 25.4
  const canvasHeight = alto * dpi / 25.4
  const selectedElementData = elementos.find(el => el.id === selectedElement)

  return (
    <div className="h-full flex flex-col bg-stone-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onVolver}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold">Editor Visual de Rótulos</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Nombre */}
          <div className="flex items-center gap-1">
            <Label className="text-xs text-stone-500">Nombre:</Label>
            <Input 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-40 h-8"
            />
          </div>
          
          {/* Tipo Impresora */}
          <div className="flex items-center gap-1">
            <Label className="text-xs text-stone-500">Impresora:</Label>
            <Select 
              value={tipoImpresora}
              onValueChange={(v) => {
                setTipoImpresora(v)
                const modelos = MODELOS_IMPRESORA[v as keyof typeof MODELOS_IMPRESORA]
                if (modelos?.length > 0) {
                  setModeloImpresora(modelos[0].value)
                  setDpi(modelos[0].dpi)
                }
              }}
            >
              <SelectTrigger className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ZEBRA">Zebra</SelectItem>
                <SelectItem value="DATAMAX">Datamax</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Modelo */}
          <div className="flex items-center gap-1">
            <Label className="text-xs text-stone-500">Modelo:</Label>
            <Select 
              value={modeloImpresora}
              onValueChange={(v) => {
                setModeloImpresora(v)
                const modelo = MODELOS_IMPRESORA[tipoImpresora as keyof typeof MODELOS_IMPRESORA]?.find(m => m.value === v)
                if (modelo) setDpi(modelo.dpi)
              }}
            >
              <SelectTrigger className="w-36 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELOS_IMPRESORA[tipoImpresora as keyof typeof MODELOS_IMPRESORA]?.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Ancho */}
          <div className="flex items-center gap-1">
            <Label className="text-xs text-stone-500">Ancho:</Label>
            <Input 
              type="number"
              value={ancho}
              onChange={(e) => setAncho(parseInt(e.target.value) || 80)}
              className="w-16 h-8"
            />
            <span className="text-xs text-stone-400">mm</span>
          </div>
          
          {/* Alto */}
          <div className="flex items-center gap-1">
            <Label className="text-xs text-stone-500">Alto:</Label>
            <Input 
              type="number"
              value={alto}
              onChange={(e) => setAlto(parseInt(e.target.value) || 50)}
              className="w-16 h-8"
            />
            <span className="text-xs text-stone-400">mm</span>
          </div>
          
          {/* DPI */}
          <span className="text-xs text-stone-500">{dpi} DPI</span>
          
          {/* Guardar */}
          <Button 
            onClick={handleGuardar}
            disabled={guardando}
            className="bg-amber-500 hover:bg-amber-600 h-8"
          >
            {guardando ? 'Guardando...' : <><Save className="w-4 h-4 mr-1" /> Guardar</>}
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel izquierdo: Herramientas y Variables */}
        <div className="w-64 border-r bg-white p-3 flex flex-col gap-3 overflow-y-auto">
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
                  className="justify-start text-xs h-8"
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
              <Label className="text-xs">Zoom:</Label>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(Math.max(1, zoom - 0.5))}>
                  <ZoomOut className="w-3 h-3" />
                </Button>
                <span className="text-sm font-medium w-8 text-center">{zoom}x</span>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(Math.min(4, zoom + 0.5))}>
                  <ZoomIn className="w-3 h-3" />
                </Button>
              </div>
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
                Para el código de barras ITF usá la variable compuesta:
              </p>
              <div className="bg-green-50 border border-green-200 rounded p-1.5">
                <code className="text-green-700 font-mono font-bold">{'{{CODIGO_ITF}}'}</code>
                <p className="text-[9px] text-green-600 mt-0.5">
                  = Tropa + N°Animal + Caravana (automático)
                </p>
              </div>
              <p className="text-[10px] text-blue-600 leading-tight">
                O armalo con variables individuales:
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
              <p className="text-[10px] text-blue-500 leading-tight">
                Seleccioná tipo <strong>ITF-14</strong> o <strong>Interleaved 2of5</strong> en las propiedades del código de barras.
              </p>
            </CardContent>
          </Card>

          {/* Variables */}
          <Card className="border shadow-sm flex-1 overflow-hidden">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm">Variables (click para asignar)</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-auto flex-1">
              <div className="p-2 space-y-1">
                {VARIABLES_DISPONIBLES.map(v => (
                  <div
                    key={v.id}
                    className="text-xs p-2 hover:bg-amber-50 border border-transparent hover:border-amber-200 rounded cursor-pointer transition-colors"
                    onClick={() => {
                      if (selectedElementData) {
                        actualizarElemento(selectedElement!, { campo: v.id, textoFijo: undefined })
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
        <div className="flex-1 flex flex-col p-3 overflow-hidden">
          <Card className="flex-1 overflow-auto border shadow-sm">
            <CardContent className="p-4 h-full bg-stone-100">
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
                    minWidth: '200px',
                    minHeight: '150px',
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
            <span>Canvas: {ancho}x{alto}mm ({Math.round(canvasWidth)}x{Math.round(canvasHeight)} pts)</span>
            <span>Elementos: {elementos.length}</span>
          </div>
        </div>

        {/* Panel derecho: Propiedades */}
        <div className="w-72 border-l bg-white p-3 flex flex-col overflow-y-auto">
          <Card className="border shadow-sm flex-1">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm flex items-center justify-between">
                Propiedades
                {selectedElementData && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => duplicarElemento(selectedElement!)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => eliminarElemento(selectedElement!)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              {selectedElementData ? (
                <ElementEditor
                  elemento={selectedElementData}
                  onChange={(cambios) => actualizarElemento(selectedElement!, cambios)}
                  onImageLoad={(file) => cargarImagen(selectedElement!, file)}
                  variables={VARIABLES_DISPONIBLES}
                />
              ) : (
                <p className="text-sm text-stone-400 text-center py-8">
                  Seleccione un elemento para editar
                </p>
              )}
            </CardContent>
          </Card>

          {/* Código generado */}
          <Card className="border shadow-sm mt-3">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm">Código {(tipoImpresora === 'DATAMAX' || tipoImpresora === 'NETTIRA') ? 'DPL' : 'ZPL'}</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <Textarea
                value={(tipoImpresora === 'DATAMAX' || tipoImpresora === 'NETTIRA') ? generarDPL() : generarZPL()}
                readOnly
                className="font-mono text-xs h-32 bg-stone-50"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
