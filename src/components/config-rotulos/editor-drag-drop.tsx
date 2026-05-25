'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import { 
  Type, Image as ImageIcon, Square, Minus, Circle, Barcode, Move, Trash2, Copy, 
  Lock, Unlock, Eye, EyeOff, Layers, ChevronUp, ChevronDown,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  ZoomIn, ZoomOut, RotateCcw, Plus, Minus as MinusIcon, Download
} from 'lucide-react'
import { TipoRotulo } from '@prisma/client'

// ==================== TIPOS ====================

export type TipoElemento = 'texto' | 'campo_dinamico' | 'imagen' | 'rectangulo' | 'linea' | 'circulo' | 'codigo_barras'

export interface ElementoRotulo {
  id: string
  tipo: TipoElemento
  etiqueta?: string
  campo?: string
  valor?: string
  x: number
  y: number
  ancho: number
  alto: number
  rotacion?: number
  fuente?: string
  tamano?: number
  negrita?: boolean
  cursiva?: boolean
  subrayado?: boolean
  alineacion?: 'izquierda' | 'centro' | 'derecha'
  colorTexto?: string
  colorFondo?: string
  colorBorde?: string
  grosorBorde?: number
  radioBorde?: number
  opacidad?: number
  urlImagen?: string
  ajusteImagen?: 'cover' | 'contain' | 'fill'
  visible?: boolean
  bloqueado?: boolean
  zIndex?: number
}

export interface Rotulo {
  id: string
  nombre: string
  codigo: string
  tipo: TipoRotulo
  categoria?: string
  ancho: number
  alto: number
  orientacion: string
  elementos: ElementoRotulo[]
  fuentePrincipal: string
  tamanoFuenteBase: number
  colorTexto: string
  activo: boolean
  esDefault: boolean
}

interface Props {
  rotulo: Rotulo
  onChange: (rotulo: Rotulo) => void
  onSave: () => void
  guardando?: boolean
}

// ==================== CONSTANTES ====================

const CAMPOS_DINAMICOS = [
  // === DATOS DE FAENA ===
  { campo: 'fechaFaena', etiqueta: 'Fecha de Faena', ejemplo: '15/03/2026', categoria: 'Faena' },
  { campo: 'fechaVencimiento', etiqueta: 'Fecha Vencimiento (calculada)', ejemplo: '14/04/2026', categoria: 'Faena', calculado: true, descripcion: 'Fecha actual + días de conservación' },
  { campo: 'tropa', etiqueta: 'Tropa N°', ejemplo: 'B0001', categoria: 'Faena' },
  { campo: 'garron', etiqueta: 'Garrón N°', ejemplo: '001', categoria: 'Faena' },
  { campo: 'tipificador', etiqueta: 'Tipificador', ejemplo: 'JUAN PEREZ', categoria: 'Faena' },
  { campo: 'clasificacion', etiqueta: 'Clasificación', ejemplo: 'A', categoria: 'Faena' },
  { campo: 'peso', etiqueta: 'Peso (KG)', ejemplo: '125.5', categoria: 'Faena' },
  { campo: 'lado', etiqueta: 'Lado', ejemplo: 'IZQUIERDA', categoria: 'Faena' },
  { campo: 'nombreProducto', etiqueta: 'Nombre Producto', ejemplo: 'MEDIA RES', categoria: 'Faena' },
  { campo: 'especie', etiqueta: 'Especie', ejemplo: 'BOVINO', categoria: 'Faena' },
  
  // === DATOS DEL ESTABLECIMIENTO FAENADOR ===
  { campo: 'establecimiento', etiqueta: 'Establecimiento Faenador', ejemplo: 'SOLEMAR ALIMENTARIA S.A.', categoria: 'Establecimiento' },
  { campo: 'nroEstablecimiento', etiqueta: 'N° Establecimiento', ejemplo: '3986', categoria: 'Establecimiento' },
  { campo: 'cuitEstablecimiento', etiqueta: 'CUIT Establecimiento', ejemplo: '30-70919450-6', categoria: 'Establecimiento' },
  { campo: 'matriculaEstablecimiento', etiqueta: 'Matrícula Establecimiento', ejemplo: '300', categoria: 'Establecimiento' },
  { campo: 'direccionEstablecimiento', etiqueta: 'Dirección Establecimiento', ejemplo: 'RUTA N° 22 - KM 1043', categoria: 'Establecimiento' },
  { campo: 'localidadEstablecimiento', etiqueta: 'Localidad Establecimiento', ejemplo: 'CHIMPAY', categoria: 'Establecimiento' },
  { campo: 'provinciaEstablecimiento', etiqueta: 'Provincia Establecimiento', ejemplo: 'RÍO NEGRO', categoria: 'Establecimiento' },
  
  // === DATOS DEL USUARIO DE FAENA (CLIENTE) ===
  { campo: 'usuarioFaenaNombre', etiqueta: 'Usuario de Faena - Nombre', ejemplo: 'FRIGORÍFICO EL NORTE S.R.L.', categoria: 'Usuario Faena' },
  { campo: 'usuarioFaenaCuit', etiqueta: 'Usuario de Faena - CUIT', ejemplo: '20-12345678-9', categoria: 'Usuario Faena' },
  { campo: 'usuarioFaenaMatricula', etiqueta: 'Usuario de Faena - Matrícula', ejemplo: '450', categoria: 'Usuario Faena' },
  { campo: 'usuarioFaenaDireccion', etiqueta: 'Usuario de Faena - Dirección', ejemplo: 'AV. INDUSTRIA 1234', categoria: 'Usuario Faena' },
  { campo: 'usuarioFaenaLocalidad', etiqueta: 'Usuario de Faena - Localidad', ejemplo: 'NEUQUÉN', categoria: 'Usuario Faena' },
  { campo: 'usuarioFaenaProvincia', etiqueta: 'Usuario de Faena - Provincia', ejemplo: 'NEUQUÉN', categoria: 'Usuario Faena' },
  { campo: 'usuarioFaenaTelefono', etiqueta: 'Usuario de Faena - Teléfono', ejemplo: '0299-4445566', categoria: 'Usuario Faena' },
  
  // === DATOS DEL PRODUCTOR (si aplica) ===
  { campo: 'productorNombre', etiqueta: 'Productor - Nombre', ejemplo: 'ESTANCIA LA ESPERANZA', categoria: 'Productor' },
  { campo: 'productorCuit', etiqueta: 'Productor - CUIT', ejemplo: '23-98765432-1', categoria: 'Productor' },
  
  // === OTROS ===
  { campo: 'codigoBarras', etiqueta: 'Código de Barras', ejemplo: '123456789012', categoria: 'Otros' },
  { campo: 'lote', etiqueta: 'Lote', ejemplo: 'L-2026-001', categoria: 'Otros' },
  { campo: 'numeroSenasa', etiqueta: 'N° SENASA', ejemplo: '3986', categoria: 'Otros' },
  { campo: 'diasConsumo', etiqueta: 'Días de Consumo', ejemplo: '30', categoria: 'Otros' },
  { campo: 'temperaturaMax', etiqueta: 'Temperatura Máxima', ejemplo: '5°C', categoria: 'Otros' },
]

const FUENTES = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia']

const COLORES_PREDEFINIDOS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
  '#FF00FF', '#00FFFF', '#808080', '#C0C0C0', '#800000', '#008000',
  '#000080', '#808000', '#800080', '#008080', '#FFA500', '#A52A2A'
]

const generarId = () => Math.random().toString(36).substr(2, 9)

// ==================== COMPONENTE PRINCIPAL ====================

export function EditorDragDrop({ rotulo, onChange, onSave, guardando }: Props) {
  const [elementoSeleccionado, setElementoSeleccionado] = useState<ElementoRotulo | null>(null)
  const [zoom, setZoom] = useState(3) // Zoom inicial 3x para ver bien el rótulo
  const [arrastrando, setArrastrando] = useState(false)
  const [resizeando, setResizeando] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, ancho: 0, alto: 0 })
  const [historial, setHistorial] = useState<ElementoRotulo[][]>([])
  const [indiceHistorial, setIndiceHistorial] = useState(-1)
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Guardar en historial para undo/redo
  const guardarHistorial = useCallback((elementos: ElementoRotulo[]) => {
    const nuevoHistorial = historial.slice(0, indiceHistorial + 1)
    nuevoHistorial.push(JSON.parse(JSON.stringify(elementos)))
    setHistorial(nuevoHistorial)
    setIndiceHistorial(nuevoHistorial.length - 1)
  }, [historial, indiceHistorial])

  // Undo
  const handleUndo = useCallback(() => {
    if (indiceHistorial > 0) {
      setIndiceHistorial(indiceHistorial - 1)
      onChange({ ...rotulo, elementos: JSON.parse(JSON.stringify(historial[indiceHistorial - 1])) })
    }
  }, [indiceHistorial, historial, rotulo, onChange])

  // Redo
  const handleRedo = useCallback(() => {
    if (indiceHistorial < historial.length - 1) {
      setIndiceHistorial(indiceHistorial + 1)
      onChange({ ...rotulo, elementos: JSON.parse(JSON.stringify(historial[indiceHistorial + 1])) })
    }
  }, [indiceHistorial, historial, rotulo, onChange])

  // Añadir nuevo elemento
  const handleAgregarElemento = (tipo: TipoElemento) => {
    const nuevoElemento: ElementoRotulo = {
      id: generarId(),
      tipo,
      x: 10,
      y: 10,
      ancho: tipo === 'linea' ? 100 : tipo === 'circulo' ? 50 : 150,
      alto: tipo === 'linea' ? 2 : tipo === 'circulo' ? 50 : 40,
      valor: tipo === 'texto' ? 'Nuevo texto' : undefined,
      campo: tipo === 'campo_dinamico' ? 'fechaFaena' : undefined,
      fuente: rotulo.fuentePrincipal,
      tamano: rotulo.tamanoFuenteBase,
      colorTexto: rotulo.colorTexto,
      colorFondo: tipo === 'rectangulo' || tipo === 'circulo' ? '#FFFFFF' : undefined,
      colorBorde: tipo === 'rectangulo' || tipo === 'circulo' || tipo === 'linea' ? '#000000' : undefined,
      grosorBorde: tipo === 'rectangulo' || tipo === 'circulo' || tipo === 'linea' ? 1 : 0,
      visible: true,
      bloqueado: false,
      zIndex: rotulo.elementos.length,
      alineacion: 'izquierda',
      opacidad: 1
    }
    
    const nuevosElementos = [...rotulo.elementos, nuevoElemento]
    onChange({ ...rotulo, elementos: nuevosElementos })
    guardarHistorial(nuevosElementos)
    setElementoSeleccionado(nuevoElemento)
  }

  // Subir imagen
  const handleSubirImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/rotulos/upload-logo', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        const nuevoElemento: ElementoRotulo = {
          id: generarId(),
          tipo: 'imagen',
          x: 10,
          y: 10,
          ancho: 100,
          alto: 60,
          urlImagen: data.url,
          ajusteImagen: 'contain',
          visible: true,
          bloqueado: false,
          zIndex: rotulo.elementos.length,
          opacidad: 1
        }
        const nuevosElementos = [...rotulo.elementos, nuevoElemento]
        onChange({ ...rotulo, elementos: nuevosElementos })
        guardarHistorial(nuevosElementos)
        setElementoSeleccionado(nuevoElemento)
        toast.success('Imagen subida correctamente')
      } else {
        toast.error('Error al subir imagen')
      }
    } catch (error) {
      toast.error('Error al subir imagen')
    }
  }

  // Seleccionar elemento
  const handleSeleccionarElemento = (elemento: ElementoRotulo, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!elemento.bloqueado) {
      setElementoSeleccionado(elemento)
    }
  }

  // Iniciar arrastre
  const handleMouseDown = (e: React.MouseEvent, elemento: ElementoRotulo) => {
    if (elemento.bloqueado) return
    e.preventDefault()
    setArrastrando(true)
    setElementoSeleccionado(elemento)
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      setOffset({
        x: e.clientX - rect.left - (elemento.x * zoom),
        y: e.clientY - rect.top - (elemento.y * zoom)
      })
    }
  }

  // Mover elemento
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!arrastrando || !elementoSeleccionado || !canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(rotulo.ancho, (e.clientX - rect.left - offset.x) / zoom))
    const y = Math.max(0, Math.min(rotulo.alto, (e.clientY - rect.top - offset.y) / zoom))
    
    const elementosActualizados = rotulo.elementos.map(el =>
      el.id === elementoSeleccionado.id ? { ...el, x: Math.round(x), y: Math.round(y) } : el
    )
    onChange({ ...rotulo, elementos: elementosActualizados })
    setElementoSeleccionado(prev => prev ? { ...prev, x: Math.round(x), y: Math.round(y) } : null)
  }, [arrastrando, elementoSeleccionado, offset, rotulo, zoom, onChange])

  // Finalizar arrastre
  const handleMouseUp = useCallback(() => {
    if (arrastrando && elementoSeleccionado) {
      guardarHistorial(rotulo.elementos)
    }
    setArrastrando(false)
  }, [arrastrando, elementoSeleccionado, rotulo.elementos, guardarHistorial])

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, direccion: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!elementoSeleccionado || elementoSeleccionado.bloqueado) return
    
    setResizeando(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      ancho: elementoSeleccionado.ancho,
      alto: elementoSeleccionado.alto
    })
  }

  // Actualizar elemento
  const handleActualizarElemento = (actualizaciones: Partial<ElementoRotulo>) => {
    if (!elementoSeleccionado) return
    
    const elementosActualizados = rotulo.elementos.map(el =>
      el.id === elementoSeleccionado.id ? { ...el, ...actualizaciones } : el
    )
    onChange({ ...rotulo, elementos: elementosActualizados })
    setElementoSeleccionado(prev => prev ? { ...prev, ...actualizaciones } : null)
  }

  // Eliminar elemento
  const handleEliminarElemento = () => {
    if (!elementoSeleccionado) return
    
    const nuevosElementos = rotulo.elementos.filter(el => el.id !== elementoSeleccionado.id)
    onChange({ ...rotulo, elementos: nuevosElementos })
    guardarHistorial(nuevosElementos)
    setElementoSeleccionado(null)
  }

  // Duplicar elemento
  const handleDuplicarElemento = () => {
    if (!elementoSeleccionado) return
    
    const nuevoElemento = {
      ...JSON.parse(JSON.stringify(elementoSeleccionado)),
      id: generarId(),
      x: elementoSeleccionado.x + 10,
      y: elementoSeleccionado.y + 10,
      zIndex: rotulo.elementos.length
    }
    const nuevosElementos = [...rotulo.elementos, nuevoElemento]
    onChange({ ...rotulo, elementos: nuevosElementos })
    guardarHistorial(nuevosElementos)
    setElementoSeleccionado(nuevoElemento)
  }

  // Cambiar orden (zIndex)
  const handleCambiarOrden = (direccion: 'arriba' | 'abajo') => {
    if (!elementoSeleccionado) return
    
    const elementos = [...rotulo.elementos].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
    const idx = elementos.findIndex(el => el.id === elementoSeleccionado.id)
    
    if (direccion === 'arriba' && idx < elementos.length - 1) {
      [elementos[idx], elementos[idx + 1]] = [elementos[idx + 1], elementos[idx]]
    } else if (direccion === 'abajo' && idx > 0) {
      [elementos[idx], elementos[idx - 1]] = [elementos[idx - 1], elementos[idx]]
    }
    
    const elementosReordenados = elementos.map((el, i) => ({ ...el, zIndex: i }))
    onChange({ ...rotulo, elementos: elementosReordenados })
    guardarHistorial(elementosReordenados)
  }

  // Event listeners globales
  useEffect(() => {
    if (arrastrando) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [arrastrando, handleMouseMove, handleMouseUp])

  // Click fuera para deseleccionar
  const handleCanvasClick = () => {
    setElementoSeleccionado(null)
  }

  // Renderizar elemento
  const renderElemento = (elemento: ElementoRotulo) => {
    if (!elemento.visible) return null
    
    const estaSeleccionado = elementoSeleccionado?.id === elemento.id
    const estiloBase: React.CSSProperties = {
      position: 'absolute',
      left: elemento.x * zoom,
      top: elemento.y * zoom,
      width: elemento.ancho * zoom,
      height: elemento.alto * zoom,
      cursor: elemento.bloqueado ? 'default' : estaSeleccionado ? 'move' : 'pointer',
      border: estaSeleccionado ? '2px dashed #f59e0b' : elemento.grosorBorde ? `${elemento.grosorBorde}px solid ${elemento.colorBorde || '#000'}` : 'none',
      borderRadius: elemento.radioBorde ? elemento.radioBorde * zoom : (elemento.tipo === 'circulo' ? '50%' : 0),
      backgroundColor: elemento.colorFondo || 'transparent',
      opacity: elemento.opacidad ?? 1,
      transform: `rotate(${elemento.rotacion || 0}deg)`,
      zIndex: elemento.zIndex || 0,
      boxSizing: 'border-box',
      overflow: 'hidden',
      userSelect: 'none'
    }

    const contenido = () => {
      switch (elemento.tipo) {
        case 'texto':
          return (
            <div style={{
              fontFamily: elemento.fuente || rotulo.fuentePrincipal,
              fontSize: (elemento.tamano || rotulo.tamanoFuenteBase) * zoom,
              fontWeight: elemento.negrita ? 'bold' : 'normal',
              fontStyle: elemento.cursiva ? 'italic' : 'normal',
              textDecoration: elemento.subrayado ? 'underline' : 'none',
              textAlign: (elemento.alineacion || 'izquierda') as React.CSSProperties['textAlign'],
              color: elemento.colorTexto || rotulo.colorTexto,
              padding: '2px 4px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              width: '100%',
              height: '100%'
            }}>
              {elemento.valor || ''}
            </div>
          )
        
        case 'campo_dinamico':
          const campoInfo = CAMPOS_DINAMICOS.find(c => c.campo === elemento.campo)
          const textoMostrar = elemento.etiqueta 
            ? `${elemento.etiqueta} ${campoInfo?.ejemplo || ''}` 
            : (campoInfo?.ejemplo || '')
          return (
            <div style={{
              fontFamily: elemento.fuente || rotulo.fuentePrincipal,
              fontSize: (elemento.tamano || rotulo.tamanoFuenteBase) * zoom,
              fontWeight: elemento.negrita ? 'bold' : 'normal',
              fontStyle: elemento.cursiva ? 'italic' : 'normal',
              textDecoration: elemento.subrayado ? 'underline' : 'none',
              textAlign: (elemento.alineacion || 'izquierda') as React.CSSProperties['textAlign'],
              color: elemento.colorTexto || rotulo.colorTexto,
              padding: '2px 4px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              width: '100%',
              height: '100%'
            }}>
              {textoMostrar}
            </div>
          )
        
        case 'imagen':
          return elemento.urlImagen ? (
            <img 
              src={elemento.urlImagen} 
              alt="Imagen"
              style={{
                width: '100%',
                height: '100%',
                objectFit: elemento.ajusteImagen || 'contain'
              }}
              draggable={false}
            />
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: 10 * zoom,
              color: '#999'
            }}>
              [Imagen]
            </div>
          )
        
        case 'rectangulo':
          return null
        
        case 'linea':
          return null
        
        case 'circulo':
          return null
        
        case 'codigo_barras':
          return (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              padding: '4px'
            }}>
              <div style={{
                display: 'flex',
                height: '70%',
                width: '100%',
                gap: '1px'
              }}>
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} style={{
                    flex: 1,
                    backgroundColor: i % 3 === 0 ? '#000' : i % 2 === 0 ? '#000' : '#fff',
                    minWidth: i % 4 === 0 ? 2 : 1
                  }} />
                ))}
              </div>
              <div style={{ fontSize: 6 * zoom, marginTop: 2 }}>1234567890</div>
            </div>
          )
      }
    }

    return (
      <div
        key={elemento.id}
        style={estiloBase}
        onMouseDown={(e) => handleMouseDown(e, elemento)}
        onClick={(e) => handleSeleccionarElemento(elemento, e)}
      >
        {contenido()}
        
        {/* Handles de resize cuando está seleccionado */}
        {estaSeleccionado && !elemento.bloqueado && (
          <>
            {/* Esquinas */}
            <div style={{ position: 'absolute', top: -4, left: -4, width: 8, height: 8, background: '#f59e0b', cursor: 'nwse-resize' }}
              onMouseDown={(e) => handleResizeStart(e, 'nw')} />
            <div style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, background: '#f59e0b', cursor: 'nesw-resize' }}
              onMouseDown={(e) => handleResizeStart(e, 'ne')} />
            <div style={{ position: 'absolute', bottom: -4, left: -4, width: 8, height: 8, background: '#f59e0b', cursor: 'nesw-resize' }}
              onMouseDown={(e) => handleResizeStart(e, 'sw')} />
            <div style={{ position: 'absolute', bottom: -4, right: -4, width: 8, height: 8, background: '#f59e0b', cursor: 'nwse-resize' }}
              onMouseDown={(e) => handleResizeStart(e, 'se')} />
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Panel izquierdo - Toolbar de elementos */}
      <div className="w-16 bg-stone-100 border-r flex flex-col items-center py-4 gap-2">
        <div className="text-xs font-medium text-stone-500 mb-2">Herramientas</div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10" title="Texto">
              <Type className="w-5 h-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="right" className="w-48">
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" onClick={() => handleAgregarElemento('texto')}>
                <Type className="w-4 h-4 mr-2" /> Texto estático
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => handleAgregarElemento('campo_dinamico')}>
                <Move className="w-4 h-4 mr-2" /> Campo dinámico
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10" 
          title="Imagen"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-5 h-5" />
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleSubirImagen} />

        <Separator className="w-10 my-2" />

        <Button variant="ghost" size="icon" className="h-10 w-10" title="Rectángulo" onClick={() => handleAgregarElemento('rectangulo')}>
          <Square className="w-5 h-5" />
        </Button>
        
        <Button variant="ghost" size="icon" className="h-10 w-10" title="Círculo" onClick={() => handleAgregarElemento('circulo')}>
          <Circle className="w-5 h-5" />
        </Button>
        
        <Button variant="ghost" size="icon" className="h-10 w-10" title="Línea" onClick={() => handleAgregarElemento('linea')}>
          <Minus className="w-5 h-5" />
        </Button>

        <Button variant="ghost" size="icon" className="h-10 w-10" title="Código de barras" onClick={() => handleAgregarElemento('codigo_barras')}>
          <Barcode className="w-5 h-5" />
        </Button>

        <Separator className="w-10 my-2" />

        <div className="text-xs font-medium text-stone-500 mb-1">Zoom</div>
        <div className="flex flex-col items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.min(6, z + 0.5))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <span className="text-xs">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.max(1, z - 0.5))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(3)}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas central */}
      <div className="flex-1 overflow-auto bg-stone-200 p-4 flex items-center justify-center">
        <div
          ref={canvasRef}
          className="bg-white shadow-xl relative"
          style={{
            width: rotulo.ancho * zoom,
            height: rotulo.alto * zoom,
            minWidth: rotulo.ancho * zoom,
            minHeight: rotulo.alto * zoom,
            transform: `scale(1)`,
            transformOrigin: 'center center'
          }}
          onClick={handleCanvasClick}
        >
          {/* Grid de fondo */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: 'linear-gradient(to right, #ccc 1px, transparent 1px), linear-gradient(to bottom, #ccc 1px, transparent 1px)',
              backgroundSize: 10 * zoom
            }}
          />
          
          {/* Elementos */}
          {rotulo.elementos.map(renderElemento)}
        </div>
      </div>

      {/* Panel derecho - Propiedades */}
      <div className="w-72 bg-white border-l overflow-hidden flex flex-col">
        <div className="p-3 border-b bg-stone-50">
          <h3 className="font-medium text-sm">
            {elementoSeleccionado ? 'Propiedades del elemento' : 'Configuración del rótulo'}
          </h3>
        </div>
        
        <ScrollArea className="flex-1">
          {elementoSeleccionado ? (
            <div className="p-4 space-y-4">
              {/* Tipo */}
              <div className="flex items-center gap-2">
                <Badge variant="outline">{elementoSeleccionado.tipo}</Badge>
                {elementoSeleccionado.bloqueado && <Lock className="w-4 h-4 text-stone-400" />}
              </div>

              {/* Contenido según tipo */}
              {elementoSeleccionado.tipo === 'texto' && (
                <div>
                  <Label className="text-xs">Texto</Label>
                  <Input
                    value={elementoSeleccionado.valor || ''}
                    onChange={(e) => handleActualizarElemento({ valor: e.target.value })}
                    className="mt-1"
                  />
                </div>
              )}

              {elementoSeleccionado.tipo === 'campo_dinamico' && (
                <>
                  <div>
                    <Label className="text-xs">Campo Dinámico</Label>
                    <Select
                      value={elementoSeleccionado.campo}
                      onValueChange={(v) => handleActualizarElemento({ campo: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seleccionar campo..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        {/* Agrupar por categoría */}
                        {['Faena', 'Establecimiento', 'Usuario Faena', 'Productor', 'Otros'].map(categoria => (
                          <SelectGroup key={categoria}>
                            <SelectLabel className="text-xs font-semibold text-stone-500">
                              {categoria}
                            </SelectLabel>
                            {CAMPOS_DINAMICOS.filter(c => c.categoria === categoria).map(c => (
                              <SelectItem key={c.campo} value={c.campo}>
                                <div className="flex flex-col">
                                  <span>{c.etiqueta}</span>
                                  {c.calculado && (
                                    <span className="text-xs text-amber-600">⚡ Calculado</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Mostrar descripción si es un campo calculado */}
                  {CAMPOS_DINAMICOS.find(c => c.campo === elementoSeleccionado.campo)?.calculado && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                      ⚡ <strong>Campo calculado:</strong> {CAMPOS_DINAMICOS.find(c => c.campo === elementoSeleccionado.campo)?.descripcion}
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-xs">Etiqueta (opcional)</Label>
                    <Input
                      value={elementoSeleccionado.etiqueta || ''}
                      onChange={(e) => handleActualizarElemento({ etiqueta: e.target.value })}
                      placeholder="ej: FECHA:"
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              {elementoSeleccionado.tipo === 'imagen' && (
                <>
                  <div>
                    <Label className="text-xs">Ajuste de imagen</Label>
                    <Select
                      value={elementoSeleccionado.ajusteImagen || 'contain'}
                      onValueChange={(v) => handleActualizarElemento({ ajusteImagen: v as 'cover' | 'contain' | 'fill' })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contain">Contener</SelectItem>
                        <SelectItem value="cover">Cubrir</SelectItem>
                        <SelectItem value="fill">Rellenar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()}>
                    Cambiar imagen
                  </Button>
                </>
              )}

              {(elementoSeleccionado.tipo === 'rectangulo' || elementoSeleccionado.tipo === 'circulo' || elementoSeleccionado.tipo === 'linea') && (
                <>
                  <div>
                    <Label className="text-xs">Color de fondo</Label>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {COLORES_PREDEFINIDOS.map(color => (
                        <button
                          key={color}
                          className={`w-6 h-6 rounded border-2 ${elementoSeleccionado.colorFondo === color ? 'border-amber-500' : 'border-stone-200'}`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleActualizarElemento({ colorFondo: color })}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Color de borde</Label>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {COLORES_PREDEFINIDOS.map(color => (
                        <button
                          key={color}
                          className={`w-6 h-6 rounded border-2 ${elementoSeleccionado.colorBorde === color ? 'border-amber-500' : 'border-stone-200'}`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleActualizarElemento({ colorBorde: color })}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Grosor del borde: {elementoSeleccionado.grosorBorde || 0}px</Label>
                    <Slider
                      value={[elementoSeleccionado.grosorBorde || 0]}
                      onValueChange={([v]) => handleActualizarElemento({ grosorBorde: v })}
                      max={10}
                      step={1}
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              {/* Posición y tamaño */}
              <Separator />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">X</Label>
                  <Input
                    type="number"
                    value={elementoSeleccionado.x}
                    onChange={(e) => handleActualizarElemento({ x: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Y</Label>
                  <Input
                    type="number"
                    value={elementoSeleccionado.y}
                    onChange={(e) => handleActualizarElemento({ y: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Ancho</Label>
                  <Input
                    type="number"
                    value={elementoSeleccionado.ancho}
                    onChange={(e) => handleActualizarElemento({ ancho: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Alto</Label>
                  <Input
                    type="number"
                    value={elementoSeleccionado.alto}
                    onChange={(e) => handleActualizarElemento({ alto: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Rotación */}
              <div>
                <Label className="text-xs">Rotación: {elementoSeleccionado.rotacion || 0}°</Label>
                <Slider
                  value={[elementoSeleccionado.rotacion || 0]}
                  onValueChange={([v]) => handleActualizarElemento({ rotacion: v })}
                  min={0}
                  max={360}
                  step={1}
                  className="mt-1"
                />
              </div>

              {/* Opacidad */}
              <div>
                <Label className="text-xs">Opacidad: {Math.round((elementoSeleccionado.opacidad ?? 1) * 100)}%</Label>
                <Slider
                  value={[(elementoSeleccionado.opacidad ?? 1) * 100]}
                  onValueChange={([v]) => handleActualizarElemento({ opacidad: v / 100 })}
                  min={0}
                  max={100}
                  step={1}
                  className="mt-1"
                />
              </div>

              {/* Formato de texto */}
              {(elementoSeleccionado.tipo === 'texto' || elementoSeleccionado.tipo === 'campo_dinamico') && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-xs">Fuente</Label>
                    <Select
                      value={elementoSeleccionado.fuente || rotulo.fuentePrincipal}
                      onValueChange={(v) => handleActualizarElemento({ fuente: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FUENTES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Tamaño: {elementoSeleccionado.tamano || rotulo.tamanoFuenteBase}px</Label>
                    <Slider
                      value={[elementoSeleccionado.tamano || rotulo.tamanoFuenteBase]}
                      onValueChange={([v]) => handleActualizarElemento({ tamano: v })}
                      min={6}
                      max={32}
                      step={1}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Color de texto</Label>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {COLORES_PREDEFINIDOS.map(color => (
                        <button
                          key={color}
                          className={`w-6 h-6 rounded border-2 ${(elementoSeleccionado.colorTexto || rotulo.colorTexto) === color ? 'border-amber-500' : 'border-stone-200'}`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleActualizarElemento({ colorTexto: color })}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Alineación</Label>
                    <div className="flex gap-1 mt-1">
                      <Button 
                        variant={elementoSeleccionado.alineacion === 'izquierda' ? 'default' : 'outline'} 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleActualizarElemento({ alineacion: 'izquierda' })}
                      >
                        <AlignLeft className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant={elementoSeleccionado.alineacion === 'centro' ? 'default' : 'outline'} 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleActualizarElemento({ alineacion: 'centro' })}
                      >
                        <AlignCenter className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant={elementoSeleccionado.alineacion === 'derecha' ? 'default' : 'outline'} 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleActualizarElemento({ alineacion: 'derecha' })}
                      >
                        <AlignRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant={elementoSeleccionado.negrita ? 'default' : 'outline'} 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleActualizarElemento({ negrita: !elementoSeleccionado.negrita })}
                    >
                      <Bold className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant={elementoSeleccionado.cursiva ? 'default' : 'outline'} 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleActualizarElemento({ cursiva: !elementoSeleccionado.cursiva })}
                    >
                      <Italic className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant={elementoSeleccionado.subrayado ? 'default' : 'outline'} 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleActualizarElemento({ subrayado: !elementoSeleccionado.subrayado })}
                    >
                      <Underline className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}

              {/* Opciones adicionales */}
              <Separator />
              <div className="flex items-center justify-between">
                <Label className="text-xs">Visible</Label>
                <Switch
                  checked={elementoSeleccionado.visible}
                  onCheckedChange={(v) => handleActualizarElemento({ visible: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Bloqueado</Label>
                <Switch
                  checked={elementoSeleccionado.bloqueado}
                  onCheckedChange={(v) => handleActualizarElemento({ bloqueado: v })}
                />
              </div>

              {/* Orden de capas */}
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleCambiarOrden('arriba')}>
                  <ChevronUp className="w-4 h-4 mr-1" /> Subir
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleCambiarOrden('abajo')}>
                  <ChevronDown className="w-4 h-4 mr-1" /> Bajar
                </Button>
              </div>

              {/* Acciones */}
              <Separator />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={handleDuplicarElemento}>
                  <Copy className="w-4 h-4 mr-1" /> Duplicar
                </Button>
                <Button variant="destructive" size="sm" className="flex-1" onClick={handleEliminarElemento}>
                  <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Configuración del rótulo */}
              <div>
                <Label className="text-xs">Nombre</Label>
                <Input
                  value={rotulo.nombre}
                  onChange={(e) => onChange({ ...rotulo, nombre: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Código</Label>
                <Input
                  value={rotulo.codigo}
                  onChange={(e) => onChange({ ...rotulo, codigo: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Ancho (mm)</Label>
                  <Input
                    type="number"
                    value={rotulo.ancho}
                    onChange={(e) => onChange({ ...rotulo, ancho: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Alto (mm)</Label>
                  <Input
                    type="number"
                    value={rotulo.alto}
                    onChange={(e) => onChange({ ...rotulo, alto: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Fuente principal</Label>
                <Select
                  value={rotulo.fuentePrincipal}
                  onValueChange={(v) => onChange({ ...rotulo, fuentePrincipal: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FUENTES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tamaño base: {rotulo.tamanoFuenteBase}px</Label>
                <Slider
                  value={[rotulo.tamanoFuenteBase]}
                  onValueChange={([v]) => onChange({ ...rotulo, tamanoFuenteBase: v })}
                  min={6}
                  max={16}
                  step={1}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Color de texto</Label>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {COLORES_PREDEFINIDOS.map(color => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded border-2 ${rotulo.colorTexto === color ? 'border-amber-500' : 'border-stone-200'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => onChange({ ...rotulo, colorTexto: color })}
                    />
                  ))}
                </div>
              </div>

              <Separator />
              
              {/* Lista de elementos */}
              <div>
                <Label className="text-xs mb-2 block">Elementos ({rotulo.elementos.length})</Label>
                <ScrollArea className="h-48">
                  <div className="space-y-1">
                    {(rotulo.elementos as ElementoRotulo[]).map((el: ElementoRotulo, i) => (
                      <div
                        key={el.id}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-stone-100 ${elementoSeleccionado ? 'selected' : ''}`}
                        onClick={() => setElementoSeleccionado(el)}
                      >
                        <div className="flex items-center gap-2">
                          {el.tipo === 'texto' && <Type className="w-4 h-4" />}
                          {el.tipo === 'campo_dinamico' && <Move className="w-4 h-4" />}
                          {el.tipo === 'imagen' && <ImageIcon className="w-4 h-4" />}
                          {el.tipo === 'rectangulo' && <Square className="w-4 h-4" />}
                          {el.tipo === 'circulo' && <Circle className="w-4 h-4" />}
                          {el.tipo === 'linea' && <Minus className="w-4 h-4" />}
                          {el.tipo === 'codigo_barras' && <Barcode className="w-4 h-4" />}
                          <span className="text-xs truncate">
                            {el.tipo === 'texto' ? el.valor?.substring(0, 15) : 
                             el.tipo === 'campo_dinamico' ? el.campo : 
                             el.tipo}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {!el.visible && <EyeOff className="w-3 h-3 text-stone-400" />}
                          {el.bloqueado && <Lock className="w-3 h-3 text-stone-400" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <Separator />
              
              <Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={onSave} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar Rótulo'}
              </Button>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
