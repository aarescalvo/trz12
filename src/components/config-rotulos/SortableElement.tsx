'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { RotuloElement } from './VisualEditor'
import { Move, Trash2, Copy, Barcode, QrCode, Image, Minus, Square, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SortableElementProps {
  elemento: RotuloElement
  zoom: number
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
  onMove: (x: number, y: number) => void
}

export function SortableElement({
  elemento,
  zoom,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: SortableElementProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: elemento.id,
  })

  const style = {
    position: 'absolute' as const,
    left: `${elemento.posX * zoom}px`,
    top: `${elemento.posY * zoom}px`,
    width: `${elemento.ancho * zoom}px`,
    height: elemento.tipo === 'LINEA' 
      ? `${(elemento.grosorLinea || 2) * zoom}px`
      : `${elemento.alto * zoom}px`,
    fontSize: `${elemento.tamano * zoom}px`,
    fontWeight: elemento.negrita ? 'bold' : 'normal',
    textAlign: elemento.alineacion.toLowerCase() as 'left' | 'center' | 'right',
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 1000 : isSelected ? 100 : elemento.orden,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'move',
  }

  const renderContent = () => {
    switch (elemento.tipo) {
      case 'TEXTO':
        return (
          <div 
            className="w-full h-full flex items-center overflow-hidden"
            style={{ 
              justifyContent: elemento.alineacion === 'CENTER' ? 'center' : 
                            elemento.alineacion === 'RIGHT' ? 'flex-end' : 'flex-start'
            }}
          >
            <span className="truncate">
              {elemento.textoFijo || (elemento.campo ? `{{${elemento.campo}}}` : 'Texto')}
            </span>
          </div>
        )
      
      case 'CODIGO_BARRAS':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center gap-0.5">
            <Barcode className="w-full h-3/4" />
            {elemento.mostrarTexto && (
              <span className="text-[6px]">{elemento.campo || 'CODIGO'}</span>
            )}
          </div>
        )
      
      case 'QR':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <QrCode className="w-full h-full p-1" />
          </div>
        )
      
      case 'LINEA':
        return (
          <div className="w-full h-full bg-black" />
        )
      
      case 'RECTANGULO':
        return (
          <div 
            className="w-full h-full border-2 border-black"
            style={{ borderWidth: `${(elemento.grosorLinea || 2) * zoom}px` }}
          />
        )
      
      case 'IMAGEN':
        return elemento.imagenBase64 ? (
          <img 
            src={elemento.imagenBase64} 
            alt="Imagen del rótulo" 
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-stone-100">
            <Image className="w-1/2 h-1/2 text-stone-400" />
          </div>
        )
      
      default:
        return null
    }
  }

  const getBorderClass = () => {
    if (isSelected) return 'border-2 border-amber-500 bg-amber-50/80'
    return 'border border-dashed border-stone-300 hover:border-stone-500 bg-white/80'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${getBorderClass()} group relative transition-colors`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      {...attributes}
    >
      {/* Contenido */}
      {renderContent()}

      {/* Handle para arrastrar */}
      <div
        {...listeners}
        className="absolute -top-2 -left-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        style={{ zIndex: 1001 }}
      >
        <Move className="w-3 h-3 text-white" />
      </div>

      {/* Botones de acción (solo cuando está seleccionado) */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 flex gap-0.5" style={{ zIndex: 1001 }}>
          <Button
            variant="ghost"
            size="sm"
            className="w-5 h-5 p-0 bg-stone-200 hover:bg-stone-300"
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate()
            }}
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-5 h-5 p-0 bg-red-100 hover:bg-red-200 text-red-600"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Handles de redimensionamiento */}
      {isSelected && elemento.tipo !== 'LINEA' && (
        <>
          {/* Esquinas */}
          {['nw', 'ne', 'sw', 'se'].map(corner => (
            <div
              key={corner}
              className="absolute w-2 h-2 bg-amber-500 border border-white"
              style={{
                top: corner.includes('n') ? -4 : 'auto',
                bottom: corner.includes('s') ? -4 : 'auto',
                left: corner.includes('w') ? -4 : 'auto',
                right: corner.includes('e') ? -4 : 'auto',
                cursor: `${corner}-resize`,
              }}
            />
          ))}
        </>
      )}
    </div>
  )
}
