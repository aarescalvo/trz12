'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Edit3, Save, X, Move, Maximize2, Minimize2, Eye, EyeOff, 
  GripVertical, ChevronUp, ChevronDown, RotateCcw, Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Tipos
interface BloqueConfig {
  id: string
  type: string
  label: string
  visible: boolean
  tamano: 'small' | 'medium' | 'large' | 'full'
  orden: number
  locked?: boolean
  props?: Record<string, any>
}

interface BotonConfig {
  id: string
  texto: string
  color: string
  tamano: 'small' | 'medium' | 'large'
  visible: boolean
  orden: number
}

interface LayoutConfig {
  bloques: BloqueConfig[]
  botones?: BotonConfig[]
  colorPrincipal?: string
}

interface EditableLayoutProps {
  modulo: string
  operador: {
    id: string
    rol: string
    permisos: Record<string, boolean>
  }
  bloquesIniciales: BloqueConfig[]
  botonesIniciales?: BotonConfig[]
  onLayoutChange?: (config: LayoutConfig) => void
  children: (props: { 
    bloques: BloqueConfig[]
    botones?: BotonConfig[]
    editMode: boolean
    moveBloque: (id: string, direction: 'up' | 'down') => void
    getBloqueProps: (id: string) => { tamano: string; visible: boolean; orden: number; props: Record<string, unknown> }
  }) => React.ReactNode
}

// Tamaños disponibles
const TAMANOS = [
  { valor: 'small', label: 'Pequeño', cols: 'col-span-12 md:col-span-3' },
  { valor: 'medium', label: 'Mediano', cols: 'col-span-12 md:col-span-6' },
  { valor: 'large', label: 'Grande', cols: 'col-span-12 md:col-span-9' },
  { valor: 'full', label: 'Completo', cols: 'col-span-12' },
]

// Colores disponibles
const COLORES = [
  { valor: 'amber', label: 'Ámbar' },
  { valor: 'emerald', label: 'Verde' },
  { valor: 'blue', label: 'Azul' },
  { valor: 'orange', label: 'Naranja' },
  { valor: 'red', label: 'Rojo' },
  { valor: 'purple', label: 'Púrpura' },
  { valor: 'stone', label: 'Gris' },
]

export function EditableLayout({
  modulo,
  operador,
  bloquesIniciales,
  botonesIniciales,
  onLayoutChange,
  children
}: EditableLayoutProps) {
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [bloques, setBloques] = useState<BloqueConfig[]>(bloquesIniciales)
  const [botones, setBotones] = useState<BotonConfig[] | undefined>(botonesIniciales)
  const [colorPrincipal, setColorPrincipal] = useState('amber')
  const [selectedBloque, setSelectedBloque] = useState<string | null>(null)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  
  // Verificar si el usuario es admin
  const isAdmin = operador.rol === 'ADMINISTRADOR' || operador.permisos?.puedeAdminSistema
  
  // Cargar layout guardado
  useEffect(() => {
    const loadLayout = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/layout-modulo?modulo=${modulo}`)
        const data = await res.json()
        
        if (data.success && data.data) {
          const layoutData = data.data
          
          // Mapear bloques del servidor a bloques locales
          if (layoutData.bloques?.items) {
            const bloquesGuardados = layoutData.bloques.items
            setBloques(prev => 
              prev.map(b => {
                const guardado = bloquesGuardados.find((g: { id: string }) => g.id === b.id)
                return guardado ? { ...b, ...guardado } : b
              }).sort((a, b) => a.orden - b.orden)
            )
          }
          
          // Cargar botones si existen
          if (layoutData.botones?.items) {
            setBotones(layoutData.botones.items.sort((a: BotonConfig, b: BotonConfig) => a.orden - b.orden))
          }
          
          setColorPrincipal(layoutData.colorPrincipal || 'amber')
        }
      } catch (error) {
        console.error('Error loading layout:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadLayout()
  }, [modulo])
  
  // Guardar layout
  const saveLayout = async () => {
    try {
      setSaving(true)
      
      const res = await fetch('/api/layout-modulo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modulo,
          bloques: { items: bloques },
          botones: botones ? { items: botones } : null,
          colorPrincipal
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success('Layout guardado correctamente')
        onLayoutChange?.({ bloques, botones, colorPrincipal })
      } else {
        toast.error('Error al guardar layout')
      }
    } catch (error) {
      console.error('Error saving layout:', error)
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }
  
  // Resetear a valores por defecto
  const resetLayout = async () => {
    try {
      const res = await fetch(`/api/layout-modulo?modulo=${modulo}`, {
        method: 'DELETE'
      })
      
      const data = await res.json()
      
      if (data.success) {
        // Restaurar valores por defecto sin recargar la página
        setBloques(bloquesIniciales)
        setBotones(botonesIniciales)
        setColorPrincipal('amber')
        onLayoutChange?.({ bloques: bloquesIniciales, botones: botonesIniciales, colorPrincipal: 'amber' })
      }
    } catch (error) {
      toast.error('Error al resetear layout')
    }
  }
  
  // Mover bloque
  const moveBloque = useCallback((id: string, direction: 'up' | 'down') => {
    setBloques(prev => {
      const sorted = [...prev].sort((a, b) => a.orden - b.orden)
      const index = sorted.findIndex(b => b.id === id)
      
      if (index === -1) return prev
      if (direction === 'up' && index === 0) return prev
      if (direction === 'down' && index === sorted.length - 1) return prev
      
      const newIndex = direction === 'up' ? index - 1 : index + 1
      
      // Intercambiar órdenes
      const temp = sorted[index].orden
      sorted[index] = { ...sorted[index], orden: sorted[newIndex].orden }
      sorted[newIndex] = { ...sorted[newIndex], orden: temp }
      
      return sorted
    })
  }, [])
  
  // Actualizar bloque
  const updateBloque = useCallback((id: string, updates: Partial<BloqueConfig>) => {
    setBloques(prev => prev.map(b => 
      b.id === id ? { ...b, ...updates } : b
    ))
  }, [])
  
  // Actualizar botón
  const updateBoton = useCallback((id: string, updates: Partial<BotonConfig>) => {
    setBotones(prev => prev?.map(b => 
      b.id === id ? { ...b, ...updates } : b
    ))
  }, [])
  
  // Toggle visibilidad bloque
  const toggleBloqueVisible = useCallback((id: string) => {
    setBloques(prev => prev.map(b => 
      b.id === id ? { ...b, visible: !b.visible } : b
    ))
  }, [])
  
  // Toggle visibilidad botón
  const toggleBotonVisible = useCallback((id: string) => {
    setBotones(prev => prev?.map(b => 
      b.id === id ? { ...b, visible: !b.visible } : b
    ))
  }, [])
  
  // Obtener props de un bloque
  const getBloqueProps = useCallback((id: string) => {
    const bloque = bloques.find(b => b.id === id)
    return {
      tamano: bloque?.tamano || 'medium',
      visible: bloque?.visible ?? true,
      orden: bloque?.orden || 0,
      props: bloque?.props || {}
    }
  }, [bloques])
  
  // Obtener clase de tamaño
  const getTamanoClass = (tamano: string) => {
    return TAMANOS.find(t => t.valor === tamano)?.cols || 'col-span-12'
  }

  // Si no es admin, renderizar sin modo edición
  if (!isAdmin) {
    return (
      <>
        {children({ 
          bloques: bloques.filter(b => b.visible), 
          botones: botones?.filter(b => b.visible),
          editMode: false,
          moveBloque: () => {},
          getBloqueProps
        })}
      </>
    )
  }

  return (
    <>
      {/* Barra de herramientas Admin */}
      <div className="fixed top-16 right-4 z-50 flex gap-2 bg-white rounded-lg shadow-lg p-2">
        {!editMode ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditMode(true)}
            className="gap-2 bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            <Edit3 className="w-4 h-4" />
            Editar Layout
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfigDialog(true)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Configurar
            </Button>
            <Button
              variant="outline"
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
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={saveLayout}
              disabled={saving}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        )}
      </div>
      
      {/* Contenido principal */}
      {children({ 
        bloques: bloques.filter(b => b.visible), 
        botones: botones?.filter(b => b.visible),
        editMode,
        moveBloque,
        getBloqueProps
      })}
      
      {/* Panel de edición de bloques */}
      {editMode && (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-white rounded-lg shadow-2xl p-4 max-h-96 overflow-y-auto">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Move className="w-5 h-5 text-amber-500" />
            Editar Bloques
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bloques */}
            <div>
              <h4 className="font-medium text-sm text-stone-500 mb-2">Secciones</h4>
              <div className="space-y-2">
                {bloques.sort((a, b) => a.orden - b.orden).map((bloque, index) => (
                  <div 
                    key={bloque.id}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border",
                      bloque.visible ? "bg-white" : "bg-stone-100 opacity-60"
                    )}
                  >
                    <GripVertical className="w-4 h-4 text-stone-400" />
                    
                    <div className="flex-1">
                      <span className={cn(
                        "font-medium text-sm",
                        !bloque.visible && "line-through text-stone-400"
                      )}>
                        {bloque.label}
                      </span>
                    </div>
                    
                    {/* Controles de orden */}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveBloque(bloque.id, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveBloque(bloque.id, 'down')}
                        disabled={index === bloques.length - 1}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Tamaño */}
                    <Select
                      value={bloque.tamano}
                      onValueChange={(v) => updateBloque(bloque.id, { tamano: v as BloqueConfig['tamano'] })}
                    >
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TAMANOS.map(t => (
                          <SelectItem key={t.valor} value={t.valor} className="text-xs">
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Visibilidad */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleBloqueVisible(bloque.id)}
                    >
                      {bloque.visible ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-stone-400" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Botones */}
            {botones && (
              <div>
                <h4 className="font-medium text-sm text-stone-500 mb-2">Botones</h4>
                <div className="space-y-2">
                  {botones.sort((a, b) => a.orden - b.orden).map((boton, index) => (
                    <div 
                      key={boton.id}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg border",
                        boton.visible ? "bg-white" : "bg-stone-100 opacity-60"
                      )}
                    >
                      <GripVertical className="w-4 h-4 text-stone-400" />
                      
                      {/* Texto del botón */}
                      <Input
                        value={boton.texto}
                        onChange={(e) => updateBoton(boton.id, { texto: e.target.value })}
                        className="flex-1 h-8"
                      />
                      
                      {/* Color */}
                      <Select
                        value={boton.color}
                        onValueChange={(v) => updateBoton(boton.id, { color: v })}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COLORES.map(c => (
                            <SelectItem key={c.valor} value={c.valor} className="text-xs">
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Tamaño */}
                      <Select
                        value={boton.tamano}
                        onValueChange={(v) => updateBoton(boton.id, { tamano: v as BotonConfig['tamano'] })}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TAMANOS.map(t => (
                            <SelectItem key={t.valor} value={t.valor} className="text-xs">
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Visibilidad */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleBotonVisible(boton.id)}
                      >
                        {boton.visible ? (
                          <Eye className="w-4 h-4 text-green-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-stone-400" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Color principal */}
          <div className="mt-4 pt-4 border-t">
            <Label className="text-sm">Color principal del módulo</Label>
            <div className="flex gap-2 mt-2">
              {COLORES.map(c => (
                <button
                  key={c.valor}
                  onClick={() => setColorPrincipal(c.valor)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2",
                    `bg-${c.valor}-500`,
                    colorPrincipal === c.valor ? "border-black" : "border-transparent"
                  )}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EditableLayout
