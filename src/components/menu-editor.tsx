// NOTA: Componente disponible para uso futuro - verificar antes de eliminar
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  GripVertical, X, RotateCcw, Save, Eye, EyeOff, 
  Move, Maximize2, Minimize2, Square, Check, Loader2
} from 'lucide-react'

// Tipos
type ModuleSize = 'small' | 'medium' | 'large'

interface ModuleConfig {
  id: string
  label: string
  size: ModuleSize
  visible: boolean
  order: number
  color?: string
}

interface MenuEditorProps {
  operadorId: string
  modules: { id: string; label: string; color: string }[]
  onClose: () => void
  onSave: (config: { orden: string[]; tamanos: Record<string, ModuleSize>; visibles: Record<string, boolean> }) => void
}

// Colores disponibles para los módulos
const COLORS = [
  { name: 'Amber', value: 'bg-amber-500' },
  { name: 'Emerald', value: 'bg-emerald-600' },
  { name: 'Blue', value: 'bg-blue-600' },
  { name: 'Red', value: 'bg-red-600' },
  { name: 'Purple', value: 'bg-purple-600' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Teal', value: 'bg-teal-600' },
  { name: 'Yellow', value: 'bg-yellow-600' },
  { name: 'Indigo', value: 'bg-indigo-600' },
  { name: 'Cyan', value: 'bg-cyan-600' },
  { name: 'Slate', value: 'bg-slate-700' },
  { name: 'Stone', value: 'bg-stone-600' },
]

export function MenuEditor({ operadorId, modules, onClose, onSave }: MenuEditorProps) {
  const [moduleConfigs, setModuleConfigs] = useState<ModuleConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [selectedModule, setSelectedModule] = useState<string | null>(null)

  // Cargar configuración guardada
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch(`/api/preferencias-ui?operadorId=${operadorId}`)
        const data = await res.json()
        
        if (data.success) {
          const orden = data.data.moduloOrden ? JSON.parse(data.data.moduloOrden) : null
          const tamanos = data.data.moduloTamano ? JSON.parse(data.data.moduloTamano) : {}
          const visibles = data.data.moduloVisible ? JSON.parse(data.data.moduloVisible) : {}
          
          // Crear configuración de módulos
          let configs: ModuleConfig[] = modules.map((mod, index) => ({
            id: mod.id,
            label: mod.label,
            size: (tamanos[mod.id] as ModuleSize) || 'medium',
            visible: visibles[mod.id] !== false, // Por defecto visible
            order: orden ? orden.indexOf(mod.id) : index,
            color: mod.color
          }))
          
          // Ordenar si hay orden guardado
          if (orden) {
            configs = configs.sort((a, b) => {
              const orderA = orden.indexOf(a.id)
              const orderB = orden.indexOf(b.id)
              if (orderA === -1) return 1
              if (orderB === -1) return -1
              return orderA - orderB
            })
          }
          
          setModuleConfigs(configs.map((c, i) => ({ ...c, order: i })))
        }
      } catch (error) {
        console.error('Error cargando configuración:', error)
        // Usar valores por defecto
        setModuleConfigs(modules.map((mod, index) => ({
          id: mod.id,
          label: mod.label,
          size: 'medium' as ModuleSize,
          visible: true,
          order: index,
          color: mod.color
        })))
      } finally {
        setLoading(false)
      }
    }
    
    loadConfig()
  }, [operadorId, modules])

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null) {
      const newConfigs = [...moduleConfigs]
      const [draggedItem] = newConfigs.splice(draggedIndex, 1)
      newConfigs.splice(dragOverIndex, 0, draggedItem)
      
      // Actualizar orden
      setModuleConfigs(newConfigs.map((c, i) => ({ ...c, order: i })))
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Cambiar tamaño de módulo
  const handleSizeChange = (moduleId: string, size: ModuleSize) => {
    setModuleConfigs(prev => prev.map(c => 
      c.id === moduleId ? { ...c, size } : c
    ))
  }

  // Cambiar visibilidad
  const handleVisibilityChange = (moduleId: string, visible: boolean) => {
    setModuleConfigs(prev => prev.map(c => 
      c.id === moduleId ? { ...c, visible } : c
    ))
  }

  // Guardar configuración
  const handleSave = async () => {
    setSaving(true)
    try {
      const orden = moduleConfigs.map(c => c.id)
      const tamanos: Record<string, ModuleSize> = {}
      const visibles: Record<string, boolean> = {}
      
      moduleConfigs.forEach(c => {
        tamanos[c.id] = c.size
        visibles[c.id] = c.visible
      })

      const res = await fetch('/api/preferencias-ui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operadorId,
          moduloOrden: orden,
          moduloTamano: tamanos,
          moduloVisible: visibles
        })
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success('Configuración guardada')
        onSave({ orden, tamanos, visibles })
      } else {
        toast.error('Error al guardar configuración')
      }
    } catch (error) {
      console.error('Error guardando:', error)
      toast.error('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  // Resetear a valores por defecto
  const handleReset = async () => {
    try {
      await fetch(`/api/preferencias-ui?operadorId=${operadorId}`, { method: 'DELETE' })
      
      setModuleConfigs(modules.map((mod, index) => ({
        id: mod.id,
        label: mod.label,
        size: 'medium' as ModuleSize,
        visible: true,
        order: index,
        color: mod.color
      })))
      
      toast.success('Configuración reseteada')
    } catch (error) {
      console.error('Error reseteando:', error)
      toast.error('Error al resetear configuración')
    }
  }

  // Obtener icono de tamaño
  const getSizeIcon = (size: ModuleSize) => {
    switch (size) {
      case 'small': return <Minimize2 className="w-4 h-4" />
      case 'large': return <Maximize2 className="w-4 h-4" />
      default: return <Square className="w-4 h-4" />
    }
  }

  // Obtener clases de tamaño para preview
  const getSizeClasses = (size: ModuleSize) => {
    switch (size) {
      case 'small': return 'col-span-1'
      case 'large': return 'col-span-2 md:col-span-3'
      default: return 'col-span-1 md:col-span-1'
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden border-0 shadow-2xl">
        <CardHeader className="bg-stone-800 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Move className="w-5 h-5" />
                Configurar Menús
              </CardTitle>
              <CardDescription className="text-stone-300">
                Arrastra para reordenar • Click para cambiar tamaño • Toggle para ocultar/mostrar
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-stone-700">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-2">
            {moduleConfigs.map((config, index) => (
              <div
                key={config.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => setSelectedModule(selectedModule === config.id ? null : config.id)}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer
                  transition-all duration-200
                  ${draggedIndex === index ? 'opacity-50 border-amber-500' : 'border-transparent'}
                  ${dragOverIndex === index ? 'border-amber-500 bg-amber-50' : 'bg-stone-50 hover:bg-stone-100'}
                  ${selectedModule === config.id ? 'ring-2 ring-amber-500' : ''}
                `}
              >
                {/* Drag Handle */}
                <div className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600">
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* Color Preview */}
                <div className={`${config.color || 'bg-stone-500'} w-10 h-10 rounded-lg flex items-center justify-center`}>
                  <span className="text-white text-xs font-bold">{index + 1}</span>
                </div>

                {/* Module Info */}
                <div className="flex-1">
                  <p className="font-medium text-stone-800">{config.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {config.size === 'small' ? 'Chico' : config.size === 'large' ? 'Grande' : 'Mediano'}
                    </Badge>
                    {!config.visible && (
                      <Badge variant="outline" className="text-xs border-red-300 text-red-600">
                        Oculto
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  {/* Size Toggle */}
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 px-2 rounded-none ${config.size === 'small' ? 'bg-amber-100' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleSizeChange(config.id, 'small'); }}
                    >
                      <Minimize2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 px-2 rounded-none ${config.size === 'medium' ? 'bg-amber-100' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleSizeChange(config.id, 'medium'); }}
                    >
                      <Square className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 px-2 rounded-none ${config.size === 'large' ? 'bg-amber-100' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleSizeChange(config.id, 'large'); }}
                    >
                      <Maximize2 className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Visibility Toggle */}
                  <Switch
                    checked={config.visible}
                    onCheckedChange={(checked) => handleVisibilityChange(config.id, checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Preview Section */}
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-sm font-semibold text-stone-600 mb-3">Vista Previa</h3>
            <div className="grid grid-cols-4 gap-2">
              {moduleConfigs.filter(c => c.visible).map((config) => (
                <div
                  key={config.id}
                  className={`
                    ${getSizeClasses(config.size)}
                    ${config.color || 'bg-stone-500'}
                    p-2 rounded-lg text-white text-xs text-center
                    transition-all
                  `}
                >
                  {config.label}
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        {/* Footer */}
        <div className="p-4 border-t bg-stone-50 flex items-center justify-between">
          <div className="text-sm text-stone-500">
            {moduleConfigs.filter(c => c.visible).length} módulos visibles de {moduleConfigs.length}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Resetear
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar Cambios
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default MenuEditor
