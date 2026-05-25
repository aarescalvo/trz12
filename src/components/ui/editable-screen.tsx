'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef } from 'react'
import { 
  Edit3, Save, X, RefreshCw, Settings2, Move, Type,
  ChevronUp, ChevronDown, Maximize2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
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
}

// Contexto global para el editor
interface EditorContextType {
  editMode: boolean
  textos: Record<string, string>
  bloques: BloqueLayout[]
  getTexto: (id: string, original: string) => string
  setTexto: (id: string, valor: string) => void
  updateBloque: (id: string, updates: Partial<BloqueLayout>) => void
  getBloque: (id: string) => BloqueLayout | undefined
}

const EditorContext = createContext<EditorContextType | null>(null)

export function useEditor() {
  const context = useContext(EditorContext)
  if (!context) {
    // Valores por defecto cuando no hay contexto
    return {
      editMode: false,
      textos: {},
      bloques: [],
      getTexto: (_id: string, original: string) => original,
      setTexto: () => {},
      updateBloque: () => {},
      getBloque: () => undefined
    }
  }
  return context
}

// ==================== TEXTO EDITABLE - Inline, simple ====================
interface TextoEditableProps {
  id: string
  original: string
  className?: string
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'label' | 'div'
}

export function TextoEditable({ id, original, className, tag = 'span' }: TextoEditableProps) {
  const { editMode, textos, getTexto, setTexto } = useEditor()
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const textoActual = getTexto(id, original)
  const Tag = tag
  
  const handleClick = (e: React.MouseEvent) => {
    if (!editMode) return
    e.stopPropagation()
    e.preventDefault()
    setIsEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  if (isEditing && editMode) {
    return (
      <input
        ref={inputRef}
        value={textoActual}
        onChange={(e) => setTexto(id, e.target.value)}
        onBlur={() => setIsEditing(false)}
        autoFocus
        className={cn(
          "bg-amber-100 border-2 border-amber-500 rounded px-1 outline-none text-inherit font-inherit inline",
          className
        )}
        style={{ minWidth: 60 }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') setIsEditing(false)
          if (e.key === 'Escape') {
            setTexto(id, original)
            setIsEditing(false)
          }
        }}
      />
    )
  }
  
  return (
    <Tag
      className={cn(
        className,
        editMode && "cursor-pointer hover:bg-amber-200 hover:ring-2 hover:ring-amber-400 rounded px-1 transition-all"
      )}
      onClick={handleClick}
      title={editMode ? `Click para editar` : undefined}
    >
      {textoActual}
    </Tag>
  )
}

// ==================== BLOQUE EDITABLE - Secciones arrastrables ====================
interface EditableBlockProps {
  bloqueId: string
  label: string
  children: React.ReactNode
  className?: string
}

export function EditableBlock({ bloqueId, label, children, className }: EditableBlockProps) {
  const { editMode, bloques, updateBloque, getBloque } = useEditor()
  const bloque = getBloque(bloqueId)
  
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const blockRef = useRef<HTMLDivElement>(null)

  // Inicializar bloque si no existe
  useEffect(() => {
    if (editMode && bloque && blockRef.current) {
      const rect = blockRef.current.getBoundingClientRect()
      if (bloque.width === 0 || bloque.height === 0) {
        updateBloque(bloqueId, { width: rect.width, height: rect.height })
      }
    }
  }, [editMode, bloqueId])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editMode || !bloque) return
    if ((e.target as HTMLElement).closest('.resize-handle, input, button, [data-no-drag]')) return
    
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialPos({ x: bloque.x, y: bloque.y, width: bloque.width, height: bloque.height })
  }

  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    if (!editMode || !bloque) return
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeHandle(handle)
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialPos({ x: bloque.x, y: bloque.y, width: bloque.width, height: bloque.height })
  }

  useEffect(() => {
    if ((!isDragging && !isResizing) || !bloque) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y

      if (isDragging) {
        updateBloque(bloqueId, { 
          x: Math.max(0, initialPos.x + deltaX), 
          y: Math.max(0, initialPos.y + deltaY) 
        })
      } else if (isResizing && resizeHandle) {
        let newWidth = initialPos.width
        let newHeight = initialPos.height
        
        if (resizeHandle.includes('e')) newWidth = Math.max(bloque.minWidth || 100, initialPos.width + deltaX)
        if (resizeHandle.includes('w')) newWidth = Math.max(bloque.minWidth || 100, initialPos.width - deltaX)
        if (resizeHandle.includes('s')) newHeight = Math.max(bloque.minHeight || 50, initialPos.height + deltaY)
        if (resizeHandle.includes('n')) newHeight = Math.max(bloque.minHeight || 50, initialPos.height - deltaY)
        
        updateBloque(bloqueId, { width: newWidth, height: newHeight })
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
  }, [isDragging, isResizing, dragStart, initialPos, resizeHandle, bloque, bloqueId, updateBloque])

  // En modo normal (sin edición), siempre mostrar el contenido
  if (!editMode) {
    return <div className={className}>{children}</div>
  }
  
  // En modo edición:
  // Si no existe el bloque, mostrarlo normalmente (para que se pueda agregar)
  if (!bloque) {
    return (
      <div className={cn("ring-2 ring-dashed ring-amber-400 rounded-lg p-1", className)}>
        <div className="text-xs text-amber-600 mb-1">Bloque: {bloqueId}</div>
        {children}
      </div>
    )
  }
  
  // Si el bloque está oculto, mostrarlo con opacidad reducida
  if (!bloque.visible) {
    return (
      <div className={cn("opacity-30 pointer-events-none", className)}>
        {children}
      </div>
    )
  }

  const hasPosition = bloque.x !== 0 || bloque.y !== 0

  return (
    <div
      ref={blockRef}
      className={cn(
        "relative transition-all",
        editMode && "ring-2 ring-blue-400/50 rounded-lg cursor-move",
        isDragging && "z-50 shadow-2xl ring-blue-500",
        className
      )}
      style={hasPosition ? {
        position: 'absolute',
        left: bloque.x,
        top: bloque.y,
        width: bloque.width > 0 ? bloque.width : 'auto',
        height: bloque.height > 0 ? bloque.height : 'auto'
      } : {}}
      onMouseDown={handleMouseDown}
    >
      {editMode && (
        <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-t flex items-center gap-1 z-10 whitespace-nowrap">
          <Move className="w-3 h-3" />
          {label}
        </div>
      )}
      <div className="w-full h-full">{children}</div>
      {editMode && (
        <>
          <div className="resize-handle absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-nw-resize z-10" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
          <div className="resize-handle absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-ne-resize z-10" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
          <div className="resize-handle absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-sw-resize z-10" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
          <div className="resize-handle absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-se-resize z-10" onMouseDown={(e) => handleResizeStart(e, 'se')} />
        </>
      )}
    </div>
  )
}

// ==================== CACHE CLIENTE PARA LAYOUT ====================
const layoutCache = new Map<string, { data: unknown; timestamp: number }>()
const LAYOUT_CACHE_TTL = 10 * 60 * 1000 // 10 minutos

// ==================== WRAPPER PRINCIPAL ====================
interface EditableScreenWrapperProps {
  moduloId: string
  operador: { rol?: string; permisos?: Record<string, boolean> }
  children: ReactNode
  bloquesIniciales?: BloqueLayout[]
}

export function EditableScreenWrapper({ moduloId, operador, children, bloquesIniciales }: EditableScreenWrapperProps) {
  const [editMode, setEditMode] = useState(false)
  const [showConfigPanel, setShowConfigPanel] = useState(false)
  const [bloques, setBloques] = useState<BloqueLayout[]>(bloquesIniciales || [])
  const [textos, setTextos] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const isAdmin = operador.rol === 'ADMINISTRADOR' || (operador.permisos?.puedeAdminSistema ?? false)

  useEffect(() => {
    fetchLayout()
  }, [moduloId])

  const fetchLayout = async () => {
    try {
      // Revisar cache cliente primero
      const cached = layoutCache.get(moduloId)
      if (cached && (Date.now() - cached.timestamp) < LAYOUT_CACHE_TTL) {
        const data = cached.data as { success: boolean; data?: { bloques?: BloqueLayout[]; layout?: { items?: BloqueLayout[] }; textos?: Record<string, string> } }
        if (data.data?.bloques?.length) setBloques(data.data.bloques)
        else if (data.data?.layout?.items?.length) setBloques(data.data.layout.items)
        if (data.data?.textos) setTextos(data.data.textos)
        setLoaded(true)
        return
      }

      const res = await fetch(`/api/layout-modulo?modulo=${moduloId}`)
      const data = await res.json()
      
      // Guardar en cache cliente
      layoutCache.set(moduloId, { data, timestamp: Date.now() })
      
      if (data.success) {
        if (data.data?.bloques?.length) setBloques(data.data.bloques)
        else if (data.data?.layout?.items?.length) setBloques(data.data.layout.items)
        if (data.data?.textos) setTextos(data.data.textos)
      }
    } catch (error) {
      console.error('Error loading layout:', error)
    } finally {
      setLoaded(true)
    }
  }

  const getTexto = useCallback((id: string, original: string) => {
    return textos[id] ?? original
  }, [textos])

  const setTexto = useCallback((id: string, valor: string) => {
    setTextos(prev => ({ ...prev, [id]: valor }))
  }, [])

  const updateBloque = useCallback((id: string, updates: Partial<BloqueLayout>) => {
    setBloques(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
  }, [])

  const getBloque = useCallback((id: string) => bloques.find(b => b.id === id), [bloques])

  // Agregar nuevo bloque si se referencia uno que no existe
  const ensureBloque = useCallback((id: string, label: string) => {
    if (!bloques.find(b => b.id === id)) {
      setBloques(prev => [...prev, {
        id,
        label,
        visible: true,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        minWidth: 100,
        minHeight: 50
      }])
    }
  }, [bloques])

  const handleSaveLayout = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/layout-modulo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modulo: moduloId,
          bloques,
          textos
        })
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success('Layout guardado correctamente')
        setEditMode(false)
        setShowConfigPanel(false)
        // Invalidar cache cliente al guardar
        layoutCache.delete(moduloId)
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const resetLayout = () => {
    setBloques(bloquesIniciales || [])
    setTextos({})
    toast.info('Layout restablecido')
  }

  const contextValue: EditorContextType = {
    editMode,
    textos,
    bloques,
    getTexto,
    setTexto,
    updateBloque,
    getBloque
  }

  if (!loaded) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse">Cargando...</div></div>
  }

  const cantidadTextos = Object.keys(textos).length

  return (
    <EditorContext.Provider value={contextValue}>
      <div className="min-h-screen relative">
        
        {/* Botón flotante de edición */}
        {isAdmin && (
          <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
            {!editMode ? (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => { setEditMode(true); setShowConfigPanel(true) }} 
                className="bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 shadow-lg h-10 w-10" 
                title="Editar Layout"
              >
                <Edit3 className="w-5 h-5" />
              </Button>
            ) : (
              <>
                <Button variant="outline" size="icon" onClick={() => setShowConfigPanel(!showConfigPanel)} className="bg-white border-stone-300 shadow-lg h-10 w-10" title="Panel"><Settings2 className="w-5 h-5" /></Button>
                <Button variant="outline" size="icon" onClick={resetLayout} className="bg-white border-stone-300 shadow-lg h-10 w-10" title="Resetear"><RefreshCw className="w-5 h-5" /></Button>
                <Button variant="outline" size="icon" onClick={() => { setEditMode(false); setShowConfigPanel(false) }} className="bg-white border-stone-300 shadow-lg h-10 w-10" title="Cancelar"><X className="w-5 h-5" /></Button>
                <Button size="icon" onClick={handleSaveLayout} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white shadow-lg h-10 w-10" title="Guardar"><Save className="w-5 h-5" /></Button>
              </>
            )}
          </div>
        )}

        {/* Indicador de modo edición */}
        {editMode && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Arrastra secciones azules • Clic en textos amarillos
          </div>
        )}

        {/* Panel de configuración */}
        {editMode && showConfigPanel && (
          <div className="fixed top-36 right-4 z-50 w-80 bg-white rounded-lg shadow-2xl border-2 border-blue-200 max-h-[70vh] overflow-hidden">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
              <h3 className="font-bold text-blue-800 flex items-center gap-2"><Settings2 className="w-4 h-4" /> Editor de Layout</h3>
            </div>
            
            <Tabs defaultValue="textos" className="w-full">
              <TabsList className="w-full grid grid-cols-2 bg-stone-100">
                <TabsTrigger value="textos" className="text-xs"><Type className="w-3 h-3 mr-1" />Textos ({cantidadTextos})</TabsTrigger>
                <TabsTrigger value="bloques" className="text-xs"><Maximize2 className="w-3 h-3 mr-1" />Bloques ({bloques.length})</TabsTrigger>
              </TabsList>
              
              <ScrollArea className="h-[50vh]">
                <TabsContent value="textos" className="p-3 space-y-2">
                  {cantidadTextos === 0 ? (
                    <div className="text-center py-8 text-stone-400">
                      <Type className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay textos editados</p>
                      <p className="text-xs mt-1">Clic en textos amarillos</p>
                    </div>
                  ) : (
                    Object.entries(textos).map(([id, valor]) => (
                      <div key={id} className="p-2 bg-stone-50 rounded space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-mono">{id}</Label>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-stone-400 hover:text-red-500" onClick={() => setTextos(prev => { const n = { ...prev }; delete n[id]; return n })}><X className="w-3 h-3" /></Button>
                        </div>
                        <Input value={valor} onChange={(e) => setTexto(id, e.target.value)} className="h-8 text-sm" />
                      </div>
                    ))
                  )}
                </TabsContent>
                
                <TabsContent value="bloques" className="p-3 space-y-2">
                  {bloques.length === 0 ? (
                    <p className="text-xs text-stone-400 text-center py-4">No hay bloques configurados</p>
                  ) : (
                    bloques.map((bloque) => (
                      <div key={bloque.id} className="p-2 bg-stone-50 rounded space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{bloque.label}</span>
                          <Switch checked={bloque.visible} onCheckedChange={(v) => updateBloque(bloque.id, { visible: v })} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <Label className="text-stone-400">X</Label>
                            <Input type="number" value={bloque.x} onChange={(e) => updateBloque(bloque.id, { x: parseInt(e.target.value) || 0 })} className="h-7" />
                          </div>
                          <div>
                            <Label className="text-stone-400">Y</Label>
                            <Input type="number" value={bloque.y} onChange={(e) => updateBloque(bloque.id, { y: parseInt(e.target.value) || 0 })} className="h-7" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        )}

        {/* Contenido */}
        {editMode ? (
          <div 
            className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4"
            style={{ 
              backgroundImage: 'linear-gradient(to right, #3b82f610 1px, transparent 1px), linear-gradient(to bottom, #3b82f610 1px, transparent 1px)', 
              backgroundSize: '50px 50px' 
            }}
          >
            <EditorContext.Provider value={contextValue}>
              {children}
            </EditorContext.Provider>
          </div>
        ) : (
          children
        )}
      </div>
    </EditorContext.Provider>
  )
}

export default EditableScreenWrapper
