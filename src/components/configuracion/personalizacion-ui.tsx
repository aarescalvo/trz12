'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Settings, GripVertical, Eye, EyeOff, Palette, RotateCcw, Save,
  Small, Medium, Large, Monitor, Moon, Sun, Layout, ChevronDown
} from './icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { applyPreferencesToDOM, cachePreferences } from '@/hooks/use-preferencias-ui'

// Icons mapping
const Icons = {
  Settings, GripVertical, Eye, EyeOff, Palette, RotateCcw, Save,
  Small, Medium, Large, Monitor, Moon, Sun, Layout, ChevronDown
}

interface ModuloConfig {
  id: string
  label: string
  visible: boolean
  tamano: 'small' | 'medium' | 'large'
  color: string
}

interface PreferenciasUI {
  id?: string
  operadorId?: string
  moduloOrden: string[]
  moduloTamano: Record<string, string>
  moduloVisible: Record<string, boolean>
  moduloColor: Record<string, string>
  sidebarExpandido?: boolean
  gruposExpandidos?: string[]
  tema?: string
  tamanoFuente?: string
  densidad?: string
  paginaInicio?: string
}

interface PersonalizacionUIProps {
  operadorId: string
  modulosDisponibles: { id: string; label: string; icon: string }[]
  onPreferenciasChange?: (prefs: PreferenciasUI) => void
}

const COLORES_PREDEFINIDOS = [
  { valor: 'bg-amber-500', nombre: 'Ámbar', preview: 'bg-amber-500' },
  { valor: 'bg-emerald-500', nombre: 'Verde', preview: 'bg-emerald-500' },
  { valor: 'bg-blue-500', nombre: 'Azul', preview: 'bg-blue-500' },
  { valor: 'bg-red-500', nombre: 'Rojo', preview: 'bg-red-500' },
  { valor: 'bg-purple-500', nombre: 'Púrpura', preview: 'bg-purple-500' },
  { valor: 'bg-orange-500', nombre: 'Naranja', preview: 'bg-orange-500' },
  { valor: 'bg-teal-500', nombre: 'Teal', preview: 'bg-teal-500' },
  { valor: 'bg-indigo-500', nombre: 'Índigo', preview: 'bg-indigo-500' },
  { valor: 'bg-slate-500', nombre: 'Gris', preview: 'bg-slate-500' },
]

const TAMANOS = [
  { valor: 'small', label: 'Pequeño', icon: 'Small', cols: 'col-span-1' },
  { valor: 'medium', label: 'Mediano', icon: 'Medium', cols: 'col-span-1 md:col-span-2' },
  { valor: 'large', label: 'Grande', icon: 'Large', cols: 'col-span-1 md:col-span-3' },
]

export function PersonalizacionUI({ 
  operadorId, 
  modulosDisponibles,
  onPreferenciasChange 
}: PersonalizacionUIProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  
  // Estado local de preferencias
  const [modulos, setModulos] = useState<ModuloConfig[]>([])
  const [tema, setTema] = useState('light')
  const [tamanoFuente, setTamanoFuente] = useState('normal')
  const [densidad, setDensidad] = useState('normal')
  
  // Cargar preferencias
  const cargarPreferencias = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/preferencias-ui?operadorId=${operadorId}`)
      const data = await res.json()
      
      if (data.success) {
        const prefs = data.data
        
        // Construir array de módulos ordenados
        const orden = Array.isArray(prefs.moduloOrden) && prefs.moduloOrden.length > 0
          ? prefs.moduloOrden 
          : modulosDisponibles.map(m => m.id)
        const tamanos = prefs.moduloTamano || {}
        const visibles = prefs.moduloVisible || {}
        const colores = prefs.moduloColor || {}
        
        const modulosConfig = orden.map((id: string) => {
          const modulo = modulosDisponibles.find(m => m.id === id) || { id, label: id, icon: 'Settings' }
          return {
            id,
            label: modulo.label,
            visible: visibles[id] !== false,
            tamano: tamanos[id] || 'medium',
            color: colores[id] || 'bg-amber-500'
          }
        })
        
        setModulos(modulosConfig)
        setTema(prefs.tema || 'light')
        setTamanoFuente(prefs.tamanoFuente || 'normal')
        setDensidad(prefs.densidad || 'normal')

        // Apply preferences to DOM immediately after loading
        applyPreferencesToDOM({
          tamanoFuente: prefs.tamanoFuente || 'normal',
          densidad: prefs.densidad || 'normal',
          tema: prefs.tema || 'light',
        })
      }
    } catch (error) {
      console.error('Error cargando preferencias:', error)
    } finally {
      setLoading(false)
    }
  }, [operadorId, modulosDisponibles])
  
  // Cargar al abrir
  useEffect(() => {
    if (open) {
      cargarPreferencias()
    }
  }, [open, cargarPreferencias])
  
  // Guardar preferencias
  const guardarPreferencias = async () => {
    try {
      setSaving(true)
      
      const moduloOrden = modulos.map(m => m.id)
      const moduloTamano: Record<string, string> = {}
      const moduloVisible: Record<string, boolean> = {}
      const moduloColor: Record<string, string> = {}
      
      modulos.forEach(m => {
        moduloTamano[m.id] = m.tamano
        moduloVisible[m.id] = m.visible
        moduloColor[m.id] = m.color
      })
      
      const res = await fetch('/api/preferencias-ui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operadorId,
          moduloOrden,
          moduloTamano,
          moduloVisible,
          moduloColor,
          tema,
          tamanoFuente,
          densidad
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success('Preferencias guardadas')

        // Apply preferences to DOM immediately after saving
        applyPreferencesToDOM({ tema, tamanoFuente, densidad } as Parameters<typeof applyPreferencesToDOM>[0])
        cachePreferences({ tema, tamanoFuente, densidad } as Parameters<typeof cachePreferences>[0])

        onPreferenciasChange?.({
          moduloOrden,
          moduloTamano,
          moduloVisible,
          moduloColor,
          tema,
          tamanoFuente,
          densidad
        })
      } else {
        toast.error('Error al guardar preferencias')
      }
    } catch (error) {
      console.error('Error guardando:', error)
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }
  
  // Drag & Drop handlers
  const handleDragStart = (id: string) => {
    setDraggedItem(id)
  }
  
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedItem || draggedItem === targetId) return
    
    const newModulos = [...modulos]
    const draggedIndex = newModulos.findIndex(m => m.id === draggedItem)
    const targetIndex = newModulos.findIndex(m => m.id === targetId)
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [removed] = newModulos.splice(draggedIndex, 1)
      newModulos.splice(targetIndex, 0, removed)
      setModulos(newModulos)
    }
  }
  
  const handleDragEnd = () => {
    setDraggedItem(null)
  }
  
  // Toggle visibilidad
  const toggleVisible = (id: string) => {
    setModulos(prev => prev.map(m => 
      m.id === id ? { ...m, visible: !m.visible } : m
    ))
  }
  
  // Cambiar tamaño
  const cambiarTamano = (id: string, tamano: 'small' | 'medium' | 'large') => {
    setModulos(prev => prev.map(m =>
      m.id === id ? { ...m, tamano } : m
    ))
  }
  
  // Cambiar color
  const cambiarColor = (id: string, color: string) => {
    setModulos(prev => prev.map(m =>
      m.id === id ? { ...m, color } : m
    ))
  }
  
  // Resetear a valores por defecto
  const resetearPreferencias = async () => {
    const modulosDefault = modulosDisponibles.map(m => ({
      id: m.id,
      label: m.label,
      visible: true,
      tamano: 'medium' as const,
      color: 'bg-amber-500'
    }))
    
    setModulos(modulosDefault)
    setTema('light')
    setTamanoFuente('normal')
    setDensidad('normal')
    
    toast.info('Preferencias reseteadas. Guarda para aplicar.')
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          Personalizar UI
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" maximizable>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-500" />
            Personalizar Interfaz
          </DialogTitle>
          <CardDescription>
            Arrastra para reordenar, cambia tamaños y colores de los módulos
          </CardDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          </div>
        ) : (
          <Tabs defaultValue="modulos" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="modulos">Módulos</TabsTrigger>
              <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>
            
            {/* TAB: Módulos */}
            <TabsContent value="modulos" className="space-y-4 mt-4">
              <div className="bg-stone-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-stone-600">
                  <strong>💡 Instrucciones:</strong> Arrastra los módulos para reordenarlos. 
                  Usa los botones para cambiar tamaño, visibilidad y color.
                </p>
              </div>
              
              <div className="space-y-2">
                {modulos.map((modulo) => (
                  <div
                    key={modulo.id}
                    draggable
                    onDragStart={() => handleDragStart(modulo.id)}
                    onDragOver={(e) => handleDragOver(e, modulo.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "bg-white border rounded-lg p-3 cursor-move transition-all",
                      draggedItem === modulo.id && "opacity-50 scale-95",
                      !modulo.visible && "opacity-60 bg-stone-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Drag Handle */}
                      <div className="text-stone-400 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      
                      {/* Nombre */}
                      <div className={cn(
                        "flex-1 font-medium",
                        !modulo.visible && "text-stone-400 line-through"
                      )}>
                        {modulo.label}
                      </div>
                      
                      {/* Tamaño */}
                      <Select
                        value={modulo.tamano}
                        onValueChange={(v) => cambiarTamano(modulo.id, v as 'small' | 'medium' | 'large')}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TAMANOS.map(t => (
                            <SelectItem key={t.valor} value={t.valor}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Color */}
                      <Select
                        value={modulo.color}
                        onValueChange={(v) => cambiarColor(modulo.id, v)}
                      >
                        <SelectTrigger className="w-10 h-10 p-0">
                          <div className={cn("w-6 h-6 rounded-md mx-auto", modulo.color)} />
                        </SelectTrigger>
                        <SelectContent>
                          {COLORES_PREDEFINIDOS.map(c => (
                            <SelectItem key={c.valor} value={c.valor}>
                              <div className="flex items-center gap-2">
                                <div className={cn("w-4 h-4 rounded", c.preview)} />
                                {c.nombre}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Visibilidad */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleVisible(modulo.id)}
                        className={cn(
                          modulo.visible ? "text-emerald-600" : "text-stone-400"
                        )}
                      >
                        {modulo.visible ? (
                          <Eye className="w-5 h-5" />
                        ) : (
                          <EyeOff className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            {/* TAB: Apariencia */}
            <TabsContent value="apariencia" className="space-y-6 mt-4">
              {/* Tema */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Tema de la Interfaz</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { valor: 'light', label: 'Claro', icon: Sun },
                    { valor: 'dark', label: 'Oscuro', icon: Moon },
                    { valor: 'system', label: 'Sistema', icon: Monitor },
                  ].map(t => (
                    <button
                      key={t.valor}
                      type="button"
                      onClick={() => setTema(t.valor)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                        tema === t.valor
                          ? "border-amber-500 bg-amber-50"
                          : "border-stone-200 hover:border-stone-300"
                      )}
                    >
                      <t.icon className="w-6 h-6" />
                      <span className="text-sm">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Tamaño de fuente */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Tamaño de Fuente</Label>
                <Select value={tamanoFuente} onValueChange={setTamanoFuente}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeño</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Densidad */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Densidad del Layout</Label>
                <Select value={densidad} onValueChange={setDensidad}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compacto</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="comfortable">Confortable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            {/* TAB: Layout */}
            <TabsContent value="layout" className="space-y-6 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Vista Previa de Tamaños</CardTitle>
                  <CardDescription>
                    Así se verán los módulos con cada tamaño
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {TAMANOS.map(t => (
                      <div 
                        key={t.valor}
                        className={cn(
                          "bg-stone-100 rounded-lg p-4 text-center",
                          t.cols
                        )}
                      >
                        <div className="h-16 bg-stone-200 rounded flex items-center justify-center mb-2">
                          <span className="text-stone-500 text-sm">{t.label}</span>
                        </div>
                        <p className="text-xs text-stone-400">
                          {t.valor === 'small' && '1 columna'}
                          {t.valor === 'medium' && '2 columnas'}
                          {t.valor === 'large' && '3 columnas'}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-700">
                  <strong>💡 Tip:</strong> Los módulos grandes son ideales para los que más usás. 
                  Los pequeños ocupan menos espacio y son perfectos para accesos rápidos.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        )}
        
        <DialogFooter className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={resetearPreferencias}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Resetear
          </Button>
          
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={guardarPreferencias}
              disabled={saving}
              className="gap-2 bg-amber-500 hover:bg-amber-600"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PersonalizacionUI
