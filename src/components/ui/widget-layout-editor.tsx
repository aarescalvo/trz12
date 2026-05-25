'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from '@/components/ui/dialog'
import {
  GripVertical, Settings, RotateCcw, Save, ChevronUp, ChevronDown,
  Eye, EyeOff, Maximize2, Minimize2, Layout, Monitor, Tablet, Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WidgetConfig } from '@/hooks/useWidgetLayout'

interface WidgetLayoutEditorProps {
  widgets: WidgetConfig[]
  onUpdateWidget: (id: string, updates: Partial<WidgetConfig>) => void
  onToggleVisibility: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onReset: () => void
  onSave: () => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function WidgetLayoutEditor({
  widgets,
  onUpdateWidget,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onReset,
  onSave,
  isOpen,
  onOpenChange
}: WidgetLayoutEditorProps) {
  const [activeTab, setActiveTab] = useState<'order' | 'size' | 'visibility'>('order')

  const visibleCount = widgets.filter(w => w.visible).length
  const hiddenCount = widgets.filter(w => !w.visible).length

  // Opciones de tamaño predefinidas
  const sizeOptions = [
    { label: 'Pequeño', w: 4, h: 2 },
    { label: 'Mediano', w: 6, h: 3 },
    { label: 'Grande', w: 8, h: 4 },
    { label: 'Completo', w: 12, h: 5 }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" maximizable>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-amber-500" />
            Personalizar Vista
          </DialogTitle>
          <CardDescription>
            Arrastra para reordenar, ajusta tamaños y visibilidad de cada sección
          </CardDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={activeTab === 'order' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('order')}
            className="gap-2"
          >
            <GripVertical className="w-4 h-4" />
            Orden
          </Button>
          <Button
            variant={activeTab === 'size' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('size')}
            className="gap-2"
          >
            <Maximize2 className="w-4 h-4" />
            Tamaño
          </Button>
          <Button
            variant={activeTab === 'visibility' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('visibility')}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Visibilidad
          </Button>
        </div>

        {/* Tab: Orden */}
        {activeTab === 'order' && (
          <div className="space-y-2">
            <p className="text-sm text-stone-500 mb-4">
              Usá las flechas para cambiar el orden de los elementos en la pantalla
            </p>
            {widgets.sort((a, b) => a.y - b.y).map((widget, index) => (
              <div
                key={widget.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border bg-white transition-all",
                  !widget.visible && "opacity-50 bg-stone-50"
                )}
              >
                <div className="text-stone-400 cursor-move">
                  <GripVertical className="w-5 h-5" />
                </div>
                
                <div className="flex-1">
                  <p className="font-medium">{widget.title}</p>
                  <p className="text-xs text-stone-400">
                    Posición {index + 1} • Ancho: {widget.w}/12
                  </p>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onMoveUp(widget.id)}
                    disabled={index === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onMoveDown(widget.id)}
                    disabled={index === widgets.length - 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Tamaño */}
        {activeTab === 'size' && (
          <div className="space-y-4">
            <p className="text-sm text-stone-500 mb-4">
              Ajusta el tamaño de cada elemento en la pantalla
            </p>
            {widgets.filter(w => w.visible).map((widget) => (
              <div key={widget.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">{widget.title}</Label>
                  <Badge variant="outline">{widget.w}/12 columnas</Badge>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {sizeOptions.map((option) => (
                    <Button
                      key={option.label}
                      variant={widget.w === option.w ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onUpdateWidget(widget.id, { w: option.w, h: option.h })}
                      className={cn(
                        "flex-1 min-w-[70px]",
                        widget.w === option.w && "bg-amber-500 hover:bg-amber-600"
                      )}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Visibilidad */}
        {activeTab === 'visibility' && (
          <div className="space-y-2">
            <p className="text-sm text-stone-500 mb-4">
              Muestra u oculta elementos de la pantalla
            </p>
            <div className="flex gap-2 mb-4">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <Eye className="w-3 h-3 mr-1" />
                {visibleCount} visibles
              </Badge>
              <Badge variant="outline" className="bg-stone-50 text-stone-600">
                <EyeOff className="w-3 h-3 mr-1" />
                {hiddenCount} ocultos
              </Badge>
            </div>
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-all",
                  widget.visible ? "bg-white" : "bg-stone-100 opacity-60"
                )}
              >
                <div>
                  <p className={cn("font-medium", !widget.visible && "line-through text-stone-400")}>
                    {widget.title}
                  </p>
                </div>
                <Switch
                  checked={widget.visible}
                  onCheckedChange={() => onToggleVisibility(widget.id)}
                />
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="flex justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Resetear
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={onSave} className="gap-2 bg-amber-500 hover:bg-amber-600">
              <Save className="w-4 h-4" />
              Guardar Cambios
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Componente WidgetCard para envolver cualquier contenido
interface WidgetCardProps {
  title: string
  icon?: React.ReactNode
  config: WidgetConfig
  editMode?: boolean
  children: React.ReactNode
  className?: string
  actions?: React.ReactNode
  onToggleMinimize?: () => void
}

export function WidgetCard({
  title,
  icon,
  config,
  editMode = false,
  children,
  className,
  actions,
  onToggleMinimize
}: WidgetCardProps) {
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
        className
      )}
    >
      <Card className={cn(
        "h-full",
        editMode && "ring-2 ring-amber-300 ring-offset-2"
      )}>
        <CardHeader className={cn(
          "flex flex-row items-center justify-between space-y-0 pb-2",
          editMode && "bg-amber-50"
        )}>
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {actions}
            {editMode && onToggleMinimize && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onToggleMinimize}
              >
                {config.minimized ? (
                  <Maximize2 className="w-3.5 h-3.5" />
                ) : (
                  <Minimize2 className="w-3.5 h-3.5" />
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        
        {!config.minimized && (
          <CardContent>
            {children}
          </CardContent>
        )}
      </Card>
    </div>
  )
}

export default WidgetLayoutEditor
