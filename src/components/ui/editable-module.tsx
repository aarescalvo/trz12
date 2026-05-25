'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'
import { 
  Edit3, Save, X, RefreshCw, Settings2, Move, Eye, Type, Palette,
  ChevronUp, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ==================== TIPOS ====================
export interface BloqueLayout {
  id: string
  label: string
  visible: boolean
  x: number
  y: number
  width: number
  height: number
  minWidth: number
  minHeight: number
  titulo?: string
  subtitulo?: string
}

export interface BotonConfig {
  id: string
  texto: string
  visible: boolean
  color?: string
}

export interface TextoConfig {
  id: string
  label: string
  valor: string
}

export interface LayoutConfig {
  bloques: BloqueLayout[]
  botones: BotonConfig[]
  textos: TextoConfig[]
}

// Contexto para el editor
interface EditorContextType {
  editMode: boolean
  bloques: BloqueLayout[]
  botones: BotonConfig[]
  textos: TextoConfig[]
  updateBloque: (id: string, updates: Partial<BloqueLayout>) => void
  updateBoton: (id: string, updates: Partial<BotonConfig>) => void
  updateTexto: (id: string, valor: string) => void
  getTexto: (id: string, defaultVal?: string) => string
  getBloque: (id: string) => BloqueLayout | undefined
  getBoton: (id: string) => BotonConfig | undefined
}

const EditorContext = createContext<EditorContextType | null>(null)

export function useEditor() {
  const context = useContext(EditorContext)
  if (!context) {
    return {
      editMode: false,
      bloques: [],
      botones: [],
      textos: [],
      updateBloque: () => {},
      updateBoton: () => {},
      updateTexto: () => {},
      getTexto: (id: string, defaultVal = '') => defaultVal,
      getBloque: () => undefined,
      getBoton: () => undefined
    }
  }
  return context
}

// ==================== COMPONENTE BLOQUE EDITABLE ====================
interface EditableBlockProps {
  bloque: BloqueLayout
  children: React.ReactNode
}

export function EditableBlock({ bloque, children }: EditableBlockProps) {
  const { editMode, updateBloque } = useEditor()
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0, width: 0, height: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editMode) return
    if ((e.target as HTMLElement).closest('.resize-handle')) return
    
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialPos({ x: bloque.x, y: bloque.y, width: bloque.width, height: bloque.height })
  }

  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    if (!editMode) return
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeHandle(handle)
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialPos({ x: bloque.x, y: bloque.y, width: bloque.width, height: bloque.height })
  }

  useEffect(() => {
    if (!isDragging && !isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y

      if (isDragging) {
        updateBloque(bloque.id, { x: Math.max(0, initialPos.x + deltaX), y: Math.max(0, initialPos.y + deltaY) })
      } else if (isResizing && resizeHandle) {
        let newX = initialPos.x, newY = initialPos.y
        let newWidth = initialPos.width, newHeight = initialPos.height

        if (resizeHandle.includes('e')) newWidth = Math.max(bloque.minWidth, initialPos.width + deltaX)
        if (resizeHandle.includes('w')) {
          const widthDelta = initialPos.width - deltaX
          if (widthDelta >= bloque.minWidth) { newWidth = widthDelta; newX = initialPos.x + deltaX }
        }
        if (resizeHandle.includes('n')) {
          const heightDelta = initialPos.height - deltaY
          if (heightDelta >= bloque.minHeight) { newHeight = heightDelta; newY = initialPos.y + deltaY }
        }
        if (resizeHandle.includes('s')) newHeight = Math.max(bloque.minHeight, initialPos.height + deltaY)

        updateBloque(bloque.id, { x: Math.max(0, newX), y: Math.max(0, newY), width: newWidth, height: newHeight })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      setResizeHandle(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, dragStart, initialPos, resizeHandle, bloque, updateBloque])

  if (!bloque.visible) return null

  return (
    <div
      className={cn(
        "absolute transition-shadow",
        editMode && "cursor-move",
        isDragging && "z-50 shadow-2xl",
        editMode && !isDragging && "hover:shadow-lg hover:ring-2 hover:ring-amber-400"
      )}
      style={{ left: bloque.x, top: bloque.y, width: bloque.width, height: bloque.height }}
      onMouseDown={handleMouseDown}
    >
      {editMode && (
        <div className="absolute -top-6 left-0 bg-amber-500 text-white text-xs px-2 py-1 rounded-t flex items-center gap-1 z-10">
          <Move className="w-3 h-3" />{bloque.label}
        </div>
      )}
      <div className="w-full h-full overflow-hidden">{children}</div>
      {editMode && (
        <>
          <div className="resize-handle absolute -top-1.5 -left-1.5 w-3 h-3 bg-amber-500 border border-white rounded-sm cursor-nw-resize z-10" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
          <div className="resize-handle absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-500 border border-white rounded-sm cursor-ne-resize z-10" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
          <div className="resize-handle absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-amber-500 border border-white rounded-sm cursor-sw-resize z-10" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
          <div className="resize-handle absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-amber-500 border border-white rounded-sm cursor-se-resize z-10" onMouseDown={(e) => handleResizeStart(e, 'se')} />
          <div className="resize-handle absolute top-1/2 -left-1.5 w-3 h-6 bg-amber-500 border border-white rounded-sm cursor-w-resize z-10 -translate-y-1/2" onMouseDown={(e) => handleResizeStart(e, 'w')} />
          <div className="resize-handle absolute top-1/2 -right-1.5 w-3 h-6 bg-amber-500 border border-white rounded-sm cursor-e-resize z-10 -translate-y-1/2" onMouseDown={(e) => handleResizeStart(e, 'e')} />
          <div className="resize-handle absolute -top-1.5 left-1/2 w-6 h-3 bg-amber-500 border border-white rounded-sm cursor-n-resize z-10 -translate-x-1/2" onMouseDown={(e) => handleResizeStart(e, 'n')} />
          <div className="resize-handle absolute -bottom-1.5 left-1/2 w-6 h-3 bg-amber-500 border border-white rounded-sm cursor-s-resize z-10 -translate-x-1/2" onMouseDown={(e) => handleResizeStart(e, 's')} />
        </>
      )}
    </div>
  )
}

// ==================== WRAPPER PRINCIPAL ====================
interface EditableModuleWrapperProps {
  moduloId: string
  defaultLayout: LayoutConfig
  operador: { rol?: string; permisos?: Record<string, boolean> }
  children: ReactNode
}

export function EditableModuleWrapper({ moduloId, defaultLayout, operador, children }: EditableModuleWrapperProps) {
  const [editMode, setEditMode] = useState(false)
  const [showConfigPanel, setShowConfigPanel] = useState(false)
  const [bloques, setBloques] = useState<BloqueLayout[]>(defaultLayout.bloques)
  const [botones, setBotones] = useState<BotonConfig[]>(defaultLayout.botones)
  const [textos, setTextos] = useState<TextoConfig[]>(defaultLayout.textos)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const isAdmin = operador.rol === 'ADMINISTRADOR' || (operador.permisos?.puedeAdminSistema ?? false)

  useEffect(() => {
    fetchLayout()
  }, [moduloId])

  const fetchLayout = async () => {
    try {
      const res = await fetch(`/api/layout-modulo?modulo=${moduloId}`)
      const data = await res.json()
      
      if (data.success) {
        if (data.data?.layout?.items) setBloques(data.data.layout.items)
        if (data.data?.botones?.items) setBotones(data.data.botones.items)
        if (data.data?.textos) {
          setTextos(prev => prev.map(t => {
            const found = data.data.textos[t.id]
            return found ? { ...t, valor: found } : t
          }))
        }
      }
    } catch (error) {
      console.error('Error loading layout:', error)
    } finally {
      setLoaded(true)
    }
  }

  const updateBloque = useCallback((id: string, updates: Partial<BloqueLayout>) => {
    setBloques(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
  }, [])

  const updateBoton = useCallback((id: string, updates: Partial<BotonConfig>) => {
    setBotones(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
  }, [])

  const updateTexto = useCallback((id: string, valor: string) => {
    setTextos(prev => prev.map(t => t.id === id ? { ...t, valor } : t))
  }, [])

  const getTexto = useCallback((id: string, defaultVal = '') => {
    const found = textos.find(t => t.id === id)
    return found?.valor || defaultVal
  }, [textos])

  const getBloque = useCallback((id: string) => bloques.find(b => b.id === id), [bloques])
  const getBoton = useCallback((id: string) => botones.find(b => b.id === id), [botones])

  const moveBloqueUp = (id: string) => {
    const idx = bloques.findIndex(b => b.id === id)
    if (idx > 0) {
      const newBloques = [...bloques]
      const tempY = newBloques[idx - 1].y
      newBloques[idx - 1] = { ...newBloques[idx - 1], y: newBloques[idx].y }
      newBloques[idx] = { ...newBloques[idx], y: tempY }
      setBloques(newBloques)
    }
  }

  const moveBloqueDown = (id: string) => {
    const idx = bloques.findIndex(b => b.id === id)
    if (idx < bloques.length - 1) {
      const newBloques = [...bloques]
      const tempY = newBloques[idx + 1].y
      newBloques[idx + 1] = { ...newBloques[idx + 1], y: newBloques[idx].y }
      newBloques[idx] = { ...newBloques[idx], y: tempY }
      setBloques(newBloques)
    }
  }

  const handleSaveLayout = async () => {
    setSaving(true)
    try {
      const textosObj = textos.reduce((acc, t) => ({ ...acc, [t.id]: t.valor }), {})
      
      const res = await fetch('/api/layout-modulo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modulo: moduloId,
          layout: { items: bloques },
          botones: { items: botones },
          textos: textosObj
        })
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success('Layout guardado correctamente')
        setEditMode(false)
        setShowConfigPanel(false)
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Error al guardar layout')
    } finally {
      setSaving(false)
    }
  }

  const resetLayout = () => {
    setBloques(defaultLayout.bloques)
    setBotones(defaultLayout.botones)
    setTextos(defaultLayout.textos)
    toast.info('Layout restablecido')
  }

  const contextValue: EditorContextType = {
    editMode,
    bloques,
    botones,
    textos,
    updateBloque,
    updateBoton,
    updateTexto,
    getTexto,
    getBloque,
    getBoton
  }

  if (!loaded) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse">Cargando...</div></div>
  }

  const bloquesVisibles = bloques.filter(b => b.visible)
  const minHeight = editMode ? Math.max(600, ...bloquesVisibles.map(b => b.y + b.height + 80)) : 'auto'

  return (
    <EditorContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 pb-8">
        
        {/* Botón flotante de edición */}
        {isAdmin && (
          <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
            {!editMode ? (
              <Button variant="outline" size="icon" onClick={() => { setEditMode(true); setShowConfigPanel(true) }} className="bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 shadow-lg h-10 w-10" title="Editar Layout">
                <Edit3 className="w-5 h-5" />
              </Button>
            ) : (
              <>
                <Button variant="outline" size="icon" onClick={() => setShowConfigPanel(!showConfigPanel)} className="bg-white border-stone-300 shadow-lg h-10 w-10" title="Configuración"><Settings2 className="w-5 h-5" /></Button>
                <Button variant="outline" size="icon" onClick={resetLayout} className="bg-white border-stone-300 shadow-lg h-10 w-10" title="Resetear"><RefreshCw className="w-5 h-5" /></Button>
                <Button variant="outline" size="icon" onClick={() => { setEditMode(false); setShowConfigPanel(false) }} className="bg-white border-stone-300 shadow-lg h-10 w-10" title="Cancelar"><X className="w-5 h-5" /></Button>
                <Button size="icon" onClick={handleSaveLayout} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white shadow-lg h-10 w-10" title="Guardar"><Save className="w-5 h-5" /></Button>
              </>
            )}
          </div>
        )}

        {/* Panel de configuración lateral */}
        {editMode && showConfigPanel && (
          <div className="fixed top-36 right-4 z-50 w-80 bg-white rounded-lg shadow-2xl border-2 border-amber-200 max-h-[70vh] overflow-hidden">
            <div className="bg-amber-50 px-4 py-3 border-b border-amber-200">
              <h3 className="font-bold text-amber-800 flex items-center gap-2"><Settings2 className="w-4 h-4" /> Personalización</h3>
            </div>
            
            <Tabs defaultValue="secciones" className="w-full">
              <TabsList className="w-full grid grid-cols-3 bg-stone-100">
                <TabsTrigger value="secciones" className="text-xs"><Eye className="w-3 h-3 mr-1" />Ver</TabsTrigger>
                <TabsTrigger value="textos" className="text-xs"><Type className="w-3 h-3 mr-1" />Textos</TabsTrigger>
                <TabsTrigger value="botones" className="text-xs"><Palette className="w-3 h-3 mr-1" />Btns</TabsTrigger>
              </TabsList>
              
              <ScrollArea className="h-[50vh]">
                <TabsContent value="secciones" className="p-3 space-y-1">
                  {bloques.map((bloque) => (
                    <div key={bloque.id} className="flex items-center gap-1 p-1.5 bg-stone-50 rounded text-xs">
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveBloqueUp(bloque.id)}><ChevronUp className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveBloqueDown(bloque.id)}><ChevronDown className="w-3 h-3" /></Button>
                      <span className="flex-1">{bloque.label}</span>
                      <Switch checked={bloque.visible} onCheckedChange={(v) => updateBloque(bloque.id, { visible: v })} />
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="textos" className="p-3 space-y-2">
                  {textos.map((texto) => (
                    <div key={texto.id} className="space-y-1">
                      <Label className="text-xs">{texto.label}</Label>
                      <Input value={texto.valor} onChange={(e) => updateTexto(texto.id, e.target.value)} className="h-7 text-sm" />
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="botones" className="p-3 space-y-2">
                  {botones.map((btn) => (
                    <div key={btn.id} className="p-2 bg-stone-50 rounded space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">{btn.id}</Label>
                        <Switch checked={btn.visible} onCheckedChange={(v) => updateBoton(btn.id, { visible: v })} />
                      </div>
                      <Input value={btn.texto} onChange={(e) => updateBoton(btn.id, { texto: e.target.value })} className="h-7 text-sm" />
                    </div>
                  ))}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        )}

        {/* Área de trabajo WYSIWYG */}
        <div 
          className={cn("relative mt-8 bg-white rounded-lg shadow-inner border-2", editMode ? "border-amber-300 border-dashed" : "border-transparent")}
          style={{ minHeight }}
        >
          {editMode && <div className="absolute inset-0 pointer-events-none rounded-lg" style={{ backgroundImage: 'linear-gradient(to right, #fbbf2420 1px, transparent 1px), linear-gradient(to bottom, #fbbf2420 1px, transparent 1px)', backgroundSize: '50px 50px' }} />}
          
          <EditorContext.Provider value={contextValue}>
            {children}
          </EditorContext.Provider>
        </div>
      </div>
    </EditorContext.Provider>
  )
}
