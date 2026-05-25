'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

// Tipos
export interface WidgetItem {
  id: string
  title: string
  icon?: string
  defaultW: number  // ancho por defecto (1-12)
  defaultH: number  // alto por defecto
  minW?: number
  maxW?: number
  minH?: number
  maxH?: number
  visible: boolean
  minimized: boolean
  order: number
}

export interface WidgetConfig {
  id: string
  title: string
  w: number
  h: number
  x: number
  y: number
  minW?: number
  maxW?: number
  minH?: number
  maxH?: number
  visible: boolean
  minimized: boolean
}

interface UseWidgetLayoutOptions {
  modulo: string
  operadorId: string
  defaultWidgets: WidgetItem[]
}

interface UseWidgetLayoutReturn {
  widgets: WidgetConfig[]
  isLoading: boolean
  editMode: boolean
  setEditMode: (mode: boolean) => void
  updateWidget: (id: string, updates: Partial<WidgetConfig>) => void
  toggleVisibility: (id: string) => void
  toggleMinimize: (id: string) => void
  moveUp: (id: string) => void
  moveDown: (id: string) => void
  changeSize: (id: string, w: number, h: number) => void
  resetLayout: () => void
  saveLayout: () => Promise<void>
  getWidgetProps: (id: string) => WidgetConfig | undefined
}

export function useWidgetLayout({
  modulo,
  operadorId,
  defaultWidgets
}: UseWidgetLayoutOptions): UseWidgetLayoutReturn {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)

  // Convertir defaultWidgets a WidgetConfig
  const defaultConfig: WidgetConfig[] = defaultWidgets.map((w, index) => ({
    id: w.id,
    title: w.title,
    w: w.defaultW,
    h: w.defaultH,
    x: 0,
    y: index,
    minW: w.minW,
    maxW: w.maxW,
    minH: w.minH,
    maxH: w.maxH,
    visible: w.visible,
    minimized: w.minimized
  }))

  // Cargar layout guardado
  const loadLayout = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/layout-modulo?operadorId=${operadorId}&modulo=${modulo}`)
      const data = await res.json()
      
      if (data.success && data.data?.widgets) {
        const savedWidgets = typeof data.data.widgets === 'string'
          ? (() => { try { return JSON.parse(data.data.widgets) } catch { console.error('Error parseando widgets guardados'); return [] } })()
          : data.data.widgets
        
        if (Array.isArray(savedWidgets) && savedWidgets.length > 0) {
          // Merge con defaults para asegurar que todos los widgets existan
          const mergedWidgets = defaultConfig.map(defaultWidget => {
            const saved = savedWidgets.find((s: WidgetConfig) => s.id === defaultWidget.id)
            return saved ? { ...defaultWidget, ...saved } : defaultWidget
          })
          setWidgets(mergedWidgets)
        } else {
          setWidgets(defaultConfig)
        }
      } else {
        setWidgets(defaultConfig)
      }
    } catch (error) {
      console.error('Error cargando layout:', error)
      setWidgets(defaultConfig)
    } finally {
      setIsLoading(false)
    }
  }, [operadorId, modulo])

  // Cargar al montar
  useEffect(() => {
    loadLayout()
  }, [loadLayout])

  // Guardar layout
  const saveLayout = useCallback(async () => {
    try {
      const res = await fetch('/api/layout-modulo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operadorId,
          modulo,
          widgets: JSON.stringify(widgets)
        })
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success('Layout guardado correctamente')
        setEditMode(false)
      } else {
        toast.error('Error al guardar layout')
      }
    } catch (error) {
      console.error('Error guardando layout:', error)
      toast.error('Error al guardar layout')
    }
  }, [operadorId, modulo, widgets])

  // Actualizar widget
  const updateWidget = useCallback((id: string, updates: Partial<WidgetConfig>) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w))
  }, [])

  // Toggle visibilidad
  const toggleVisibility = useCallback((id: string) => {
    setWidgets(prev => prev.map(w =>
      w.id === id ? { ...w, visible: !w.visible } : w
    ))
  }, [])

  // Toggle minimizar
  const toggleMinimize = useCallback((id: string) => {
    setWidgets(prev => prev.map(w =>
      w.id === id ? { ...w, minimized: !w.minimized } : w
    ))
  }, [])

  // Mover arriba
  const moveUp = useCallback((id: string) => {
    setWidgets(prev => {
      const index = prev.findIndex(w => w.id === id)
      if (index <= 0) return prev
      
      const newWidgets = [...prev]
      const temp = newWidgets[index].y
      newWidgets[index] = { ...newWidgets[index], y: newWidgets[index - 1].y }
      newWidgets[index - 1] = { ...newWidgets[index - 1], y: temp }
      
      return newWidgets.sort((a, b) => a.y - b.y)
    })
  }, [])

  // Mover abajo
  const moveDown = useCallback((id: string) => {
    setWidgets(prev => {
      const index = prev.findIndex(w => w.id === id)
      if (index < 0 || index >= prev.length - 1) return prev
      
      const newWidgets = [...prev]
      const temp = newWidgets[index].y
      newWidgets[index] = { ...newWidgets[index], y: newWidgets[index + 1].y }
      newWidgets[index + 1] = { ...newWidgets[index + 1], y: temp }
      
      return newWidgets.sort((a, b) => a.y - b.y)
    })
  }, [])

  // Cambiar tamaño
  const changeSize = useCallback((id: string, w: number, h: number) => {
    updateWidget(id, { w, h })
  }, [updateWidget])

  // Resetear layout
  const resetLayout = useCallback(() => {
    setWidgets(defaultConfig)
    toast.info('Layout reseteado. Guarda para aplicar cambios.')
  }, [defaultConfig])

  // Obtener props de widget
  const getWidgetProps = useCallback((id: string) => {
    return widgets.find(w => w.id === id)
  }, [widgets])

  return {
    widgets,
    isLoading,
    editMode,
    setEditMode,
    updateWidget,
    toggleVisibility,
    toggleMinimize,
    moveUp,
    moveDown,
    changeSize,
    resetLayout,
    saveLayout,
    getWidgetProps
  }
}

export default useWidgetLayout
