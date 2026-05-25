'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  GripVertical, Maximize2, Minimize2, X, Settings, RotateCcw,
  ChevronUp, ChevronDown, Eye, EyeOff, Move
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Tipos para widgets
export interface WidgetConfig {
  id: string
  type?: string
  title: string
  x?: number
  y: number
  w: number  // ancho (1-12 columnas)
  h: number  // alto (en unidades de grid)
  minW?: number
  maxW?: number
  minH?: number
  maxH?: number
  visible: boolean
  minimized: boolean
  collapsible?: boolean
  removable?: boolean
}

interface WidgetLayoutProps {
  modulo: string
  operadorId: string
  widgets: WidgetConfig[]
  onWidgetsChange?: (widgets: WidgetConfig[]) => void
  children: React.ReactNode
  editable?: boolean
}

export function WidgetLayout({
  modulo,
  operadorId,
  widgets: initialWidgets,
  onWidgetsChange,
  children,
  editable = true
}: WidgetLayoutProps) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(initialWidgets)
  const [editMode, setEditMode] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Cargar al montar
  useEffect(() => {
    let mounted = true
    
    const load = async () => {
      try {
        const res = await fetch(`/api/layout-modulo?operadorId=${operadorId}&modulo=${modulo}`)
        const data = await res.json()
        if (mounted && data.success && data.data?.widgets) {
          const savedWidgets = typeof data.data.widgets === 'string'
            ? JSON.parse(data.data.widgets)
            : data.data.widgets
          if (Array.isArray(savedWidgets) && savedWidgets.length > 0) {
            setWidgets(savedWidgets)
          }
        }
      } catch (error) {
        console.error('Error cargando layout:', error)
      }
    }
    
    load()
    
    return () => { mounted = false }
  }, [operadorId, modulo])

  // Guardar configuración
  const guardarLayout = useCallback(async (newWidgets: WidgetConfig[]) => {
    try {
      await fetch('/api/layout-modulo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operadorId,
          modulo,
          widgets: JSON.stringify(newWidgets)
        })
      })
    } catch (error) {
      console.error('Error guardando layout:', error)
    }
  }, [operadorId, modulo])

  // Actualizar widget
  const updateWidget = (id: string, updates: Partial<WidgetConfig>) => {
    const newWidgets = widgets.map(w => 
      w.id === id ? { ...w, ...updates } : w
    )
    setWidgets(newWidgets)
    onWidgetsChange?.(newWidgets)
  }

  // Toggle visibilidad
  const toggleVisibility = (id: string) => {
    const newWidgets = widgets.map(w =>
      w.id === id ? { ...w, visible: !w.visible } : w
    )
    setWidgets(newWidgets)
    onWidgetsChange?.(newWidgets)
    guardarLayout(newWidgets)
  }

  // Toggle minimizar
  const toggleMinimize = (id: string) => {
    const newWidgets = widgets.map(w =>
      w.id === id ? { ...w, minimized: !w.minimized } : w
    )
    setWidgets(newWidgets)
    onWidgetsChange?.(newWidgets)
  }

  // Mover widget
  const moveWidget = (id: string, direction: 'up' | 'down') => {
    const index = widgets.findIndex(w => w.id === id)
    if (index === -1) return
    
    const newWidgets = [...widgets]
    if (direction === 'up' && index > 0) {
      [newWidgets[index - 1], newWidgets[index]] = [newWidgets[index], newWidgets[index - 1]]
    } else if (direction === 'down' && index < widgets.length - 1) {
      [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]]
    }
    
    // Actualizar posiciones Y
    newWidgets.forEach((w, i) => {
      w.y = i
    })
    
    setWidgets(newWidgets)
    onWidgetsChange?.(newWidgets)
    guardarLayout(newWidgets)
  }

  // Cambiar tamaño
  const changeSize = (id: string, size: 'small' | 'medium' | 'large') => {
    const sizes = {
      small: { w: 6, h: 2 },
      medium: { w: 8, h: 3 },
      large: { w: 12, h: 4 }
    }
    updateWidget(id, sizes[size])
    guardarLayout(widgets.map(w => w.id === id ? { ...w, ...sizes[size] } : w))
  }

  // Resetear layout
  const resetLayout = () => {
    setWidgets(initialWidgets)
    onWidgetsChange?.(initialWidgets)
    guardarLayout(initialWidgets)
    toast.success('Layout reseteado')
  }

  // Guardar cambios
  const saveChanges = async () => {
    await guardarLayout(widgets)
    setEditMode(false)
    toast.success('Layout guardado')
  }

  return (
    <div className="space-y-4">
      {/* Barra de herramientas */}
      {editable && (
        <div className="flex items-center justify-between bg-stone-100 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {widgets.filter(w => w.visible).length} de {widgets.length} widgets
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {!editMode ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(true)}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                Personalizar Vista
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetLayout}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Resetear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={saveChanges}
                  className="gap-2 bg-amber-500 hover:bg-amber-600"
                >
                  Guardar Cambios
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Panel de configuración (solo en modo edición) */}
      {editMode && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Move className="w-4 h-4" />
              Configurar Widgets
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {widgets.map((widget) => (
                <div
                  key={widget.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded border bg-white",
                    !widget.visible && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-stone-400 cursor-move" />
                    <span className="text-sm font-medium">{widget.title}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveWidget(widget.id, 'up')}
                    >
                      <ChevronUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveWidget(widget.id, 'down')}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-6 w-6", widget.visible ? "text-emerald-600" : "text-stone-400")}
                      onClick={() => toggleVisibility(widget.id)}
                    >
                      {widget.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 text-xs text-stone-500">
              💡 Usá las flechas para reordenar, el ojo para mostrar/ocultar widgets
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid de widgets */}
      <div ref={containerRef} className="grid grid-cols-12 gap-4">
        {children}
      </div>
    </div>
  )
}

// Componente Widget individual
interface WidgetProps {
  id: string
  config: WidgetConfig
  editMode?: boolean
  onToggleMinimize?: () => void
  onToggleVisibility?: () => void
  children: React.ReactNode
  className?: string
}

export function Widget({
  config,
  editMode = false,
  onToggleMinimize,
  onToggleVisibility,
  children,
  className
}: WidgetProps) {
  const getWidthClass = (w: number) => {
    if (w <= 4) return 'col-span-12 md:col-span-4'
    if (w <= 6) return 'col-span-12 md:col-span-6'
    if (w <= 8) return 'col-span-12 md:col-span-8'
    return 'col-span-12'
  }

  if (!config.visible) return null

  return (
    <div
      className={cn(
        "transition-all duration-200",
        getWidthClass(config.w),
        config.minimized && "h-auto",
        className
      )}
    >
      <Card className={cn(
        "h-full",
        editMode && "ring-2 ring-amber-300 ring-offset-2"
      )}>
        {editMode && (
          <div className="bg-amber-100 px-3 py-1.5 flex items-center justify-between border-b">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-amber-600 cursor-move" />
              <span className="text-xs font-medium text-amber-800">{config.title}</span>
            </div>
            
            <div className="flex items-center gap-1">
              {onToggleMinimize && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggleMinimize}>
                  {config.minimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                </Button>
              )}
              {onToggleVisibility && (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={onToggleVisibility}>
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        )}
        
        {!config.minimized ? (
          children
        ) : (
          <div className="p-3 text-center text-sm text-stone-400">
            {config.title} (minimizado)
          </div>
        )}
      </Card>
    </div>
  )
}

export default WidgetLayout
