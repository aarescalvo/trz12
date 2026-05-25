'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Settings, Beef, Scale, Truck, Warehouse, Calendar,
  Layout, RotateCcw, Save, ChevronUp, ChevronDown, Eye, EyeOff,
  ClipboardList, Package, FileText, DollarSign, Menu
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Tipos
interface WidgetConfig {
  id: string
  title: string
  w: number
  h: number
  visible: boolean
  minimized: boolean
  order: number
}

interface DashboardConfigurableProps {
  operadorId: string
  operadorNombre: string
  operadorRol: string
  operadorPermisos: Record<string, boolean>
  stats: {
    tropasActivas: number
    enPesaje: number
    pesajesHoy: number
    enCamara: number
  }
  tropas: Array<{
    id: string
    codigo: string
    usuarioFaena?: { nombre: string }
    cantidadCabezas: number
    especie: string
    estado: string
  }>
  onNavigate: (page: string) => void
  onShowMenuEditor: () => void
}

// Widgets por defecto
const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'stats', title: 'Estadísticas Rápidas', w: 12, h: 1, visible: true, minimized: false, order: 0 },
  { id: 'ciclo1', title: 'CICLO I - Módulos Principales', w: 12, h: 2, visible: true, minimized: false, order: 1 },
  { id: 'subproductosReportes', title: 'Subproductos y Reportes', w: 12, h: 1, visible: true, minimized: false, order: 2 },
  { id: 'administracion', title: 'Administración', w: 12, h: 1, visible: true, minimized: false, order: 3 },
  { id: 'ultimasTropas', title: 'Últimas Tropas', w: 12, h: 2, visible: true, minimized: false, order: 4 },
]

// Módulos del sistema
const MODULOS_CICLO1 = [
  { id: 'pesajeCamiones', label: 'Pesaje Camiones', icon: Truck, color: 'bg-amber-500', desc: 'Pesaje de camiones' },
  { id: 'pesajeIndividual', label: 'Pesaje Individual', icon: Scale, color: 'bg-emerald-600', desc: 'Pesaje de animales' },
  { id: 'movimientoHacienda', label: 'Movimiento', icon: Menu, color: 'bg-blue-600', desc: 'Movimiento de hacienda' },
  { id: 'listaFaena', label: 'Lista de Faena', icon: ClipboardList, color: 'bg-red-600', desc: 'Gestión de faena' },
  { id: 'romaneo', label: 'Romaneo', icon: Package, color: 'bg-orange-500', desc: 'Pesaje de medias' },
  { id: 'ingresoCajon', label: 'Ingreso Cajón', icon: Package, color: 'bg-purple-600', desc: 'Asignación garrones' },
]

const MODULOS_SUBPRODUCTOS = [
  { id: 'menudencias', label: 'Menudencias', icon: Package, color: 'bg-teal-600', desc: 'Menudencias' },
  { id: 'cueros', label: 'Cueros', icon: Package, color: 'bg-yellow-600', desc: 'Cueros' },
]

const MODULOS_REPORTES = [
  { id: 'stocksCorrales', label: 'Stocks Corrales', icon: Warehouse, color: 'bg-indigo-600', desc: 'Stock corrales' },
  { id: 'stock', label: 'Stocks Cámaras', icon: Warehouse, color: 'bg-cyan-600', desc: 'Stock cámaras' },
  { id: 'planilla01', label: 'Planilla 01', icon: FileText, color: 'bg-gray-600', desc: 'Planilla SENASA' },
  { id: 'rindesTropa', label: 'Rindes', icon: FileText, color: 'bg-lime-600', desc: 'Análisis de rindes' },
]

const MODULOS_ADMIN = [
  { id: 'facturacion', label: 'Facturación', icon: DollarSign, color: 'bg-slate-700', desc: 'Facturación' },
  { id: 'configuracion', label: 'Configuración', icon: Settings, color: 'bg-stone-600', desc: 'Configuración' },
]

export function DashboardConfigurable({
  operadorId,
  operadorNombre,
  operadorRol,
  operadorPermisos,
  stats,
  tropas,
  onNavigate,
  onShowMenuEditor
}: DashboardConfigurableProps) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS)
  const [editMode, setEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Cargar configuración
  useEffect(() => {
    let mounted = true
    
    const load = async () => {
      try {
        const res = await fetch(`/api/layout-modulo?operadorId=${operadorId}&modulo=dashboard`)
        const data = await res.json()
        
        if (mounted && data.success && data.data?.widgets) {
          const savedWidgets = typeof data.data.widgets === 'string'
            ? JSON.parse(data.data.widgets)
            : data.data.widgets
          
          if (Array.isArray(savedWidgets) && savedWidgets.length > 0) {
            // Merge con defaults para asegurar que todos existan
            const merged = DEFAULT_WIDGETS.map(d => {
              const saved = savedWidgets.find((s: WidgetConfig) => s.id === d.id)
              return saved || d
            })
            setWidgets(merged)
          }
        }
      } catch (error) {
        console.error('Error cargando layout:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    load()
    return () => { mounted = false }
  }, [operadorId])

  // Guardar configuración
  const saveLayout = async () => {
    try {
      await fetch('/api/layout-modulo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operadorId,
          modulo: 'dashboard',
          widgets: JSON.stringify(widgets)
        })
      })
      setEditMode(false)
      toast.success('Layout guardado correctamente')
    } catch (error) {
      console.error('Error guardando:', error)
      toast.error('Error al guardar')
    }
  }

  // Toggle visibilidad
  const toggleVisibility = (id: string) => {
    setWidgets(prev => prev.map(w =>
      w.id === id ? { ...w, visible: !w.visible } : w
    ))
  }

  // Mover widget
  const moveWidget = (id: string, direction: 'up' | 'down') => {
    setWidgets(prev => {
      const index = prev.findIndex(w => w.id === id)
      if (index === -1) return prev
      
      const newWidgets = [...prev]
      if (direction === 'up' && index > 0) {
        [newWidgets[index], newWidgets[index - 1]] = [newWidgets[index - 1], newWidgets[index]]
      } else if (direction === 'down' && index < prev.length - 1) {
        [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]]
      }
      
      return newWidgets.map((w, i) => ({ ...w, order: i }))
    })
  }

  // Toggle minimizar
  const toggleMinimize = (id: string) => {
    setWidgets(prev => prev.map(w =>
      w.id === id ? { ...w, minimized: !w.minimized } : w
    ))
  }

  // Resetear
  const resetLayout = () => {
    setWidgets(DEFAULT_WIDGETS)
    toast.info('Layout reseteado. Guarda para aplicar.')
  }

  // Renderizar módulo card
  const renderModuleCard = (modulo: typeof MODULOS_CICLO1[0]) => (
    <Card
      key={modulo.id}
      className="border-0 shadow-md cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
      onClick={() => onNavigate(modulo.id)}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", modulo.color)}>
            <modulo.icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-sm text-stone-800">{modulo.label}</p>
            <p className="text-xs text-stone-500">{modulo.desc}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Renderizar widget
  const renderWidget = (widget: WidgetConfig, content: React.ReactNode) => {
    if (!widget.visible) return null

    return (
      <div
        key={widget.id}
        className={cn(
          "col-span-12 transition-all duration-200",
          editMode && "ring-2 ring-amber-300 ring-offset-2 rounded-lg"
        )}
      >
        <Card className="border-0 shadow-md">
          <CardHeader className={cn(
            "flex flex-row items-center justify-between py-3",
            editMode && "bg-amber-50 rounded-t-lg"
          )}>
            <CardTitle className="text-base font-semibold">{widget.title}</CardTitle>
            
            {editMode && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveWidget(widget.id, 'up')}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveWidget(widget.id, 'down')}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleMinimize(widget.id)}>
                  {widget.minimized ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-stone-400" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => toggleVisibility(widget.id)}>
                  <EyeOff className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardHeader>
          
          {!widget.minimized && (
            <CardContent>
              {content}
            </CardContent>
          )}
        </Card>
      </div>
    )
  }

  // Widgets ordenados
  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">
              Sistema Frigorífico - Solemar Alimentaria
            </h1>
            <p className="text-stone-500 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {!editMode ? (
              <>
                {(operadorRol === 'SUPERVISOR' || operadorRol === 'ADMINISTRADOR' || operadorPermisos.puedeConfiguracion) && (
                  <Button variant="outline" size="sm" onClick={onShowMenuEditor} className="gap-2">
                    <Settings className="w-4 h-4" />
                    Menús
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setEditMode(true)} className="gap-2">
                  <Layout className="w-4 h-4" />
                  Personalizar Vista
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={resetLayout} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Resetear
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={saveLayout} className="gap-2 bg-amber-500 hover:bg-amber-600">
                  <Save className="w-4 h-4" />
                  Guardar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Panel de edición */}
        {editMode && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-3">
              <p className="text-sm text-amber-800">
                <strong>💡 Modo edición:</strong> Reordená las secciones con las flechas, ocultá las que no necesites. 
                Los cambios se guardan al hacer clic en "Guardar".
              </p>
            </CardContent>
          </Card>
        )}

        {/* Grid de widgets */}
        <div className="grid grid-cols-12 gap-4">
          {sortedWidgets.map((widget) => {
            let content: React.ReactNode = null
            
            switch (widget.id) {
              case 'stats':
                content = (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-amber-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Beef className="w-5 h-5 text-amber-600" />
                        <div>
                          <p className="text-xs text-stone-500">Tropas Activas</p>
                          <p className="text-xl font-bold text-amber-700">{stats.tropasActivas}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Scale className="w-5 h-5 text-emerald-600" />
                        <div>
                          <p className="text-xs text-stone-500">En Pesaje</p>
                          <p className="text-xl font-bold text-emerald-700">{stats.enPesaje}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-xs text-stone-500">Pesajes Hoy</p>
                          <p className="text-xl font-bold text-blue-700">{stats.pesajesHoy}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="text-xs text-stone-500">En Cámara</p>
                          <p className="text-xl font-bold text-purple-700">{stats.enCamara}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
                break
              
              case 'ciclo1':
                content = (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {MODULOS_CICLO1.map(renderModuleCard)}
                  </div>
                )
                break
              
              case 'subproductosReportes':
                content = (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-stone-700 mb-2">Subproductos</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {MODULOS_SUBPRODUCTOS.map(renderModuleCard)}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-stone-700 mb-2">Reportes</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {MODULOS_REPORTES.map(renderModuleCard)}
                      </div>
                    </div>
                  </div>
                )
                break
              
              case 'administracion':
                content = (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {MODULOS_ADMIN.map(renderModuleCard)}
                  </div>
                )
                break
              
              case 'ultimasTropas':
                content = tropas.length === 0 ? (
                  <div className="p-6 text-center text-stone-400">
                    <Beef className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No hay tropas registradas</p>
                  </div>
                ) : (
                  <div className="divide-y max-h-64 overflow-y-auto">
                    {tropas.slice(0, 5).map((tropa) => (
                      <div key={tropa.id} className="p-3 hover:bg-stone-50 cursor-pointer" onClick={() => onNavigate('pesajeIndividual')}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono font-bold text-stone-800">{tropa.codigo}</p>
                            <p className="text-sm text-stone-500">
                              {tropa.usuarioFaena?.nombre} • {tropa.cantidadCabezas} cabezas • {tropa.especie}
                            </p>
                          </div>
                          <Badge variant="outline" className="border-amber-300 text-amber-600">
                            {tropa.estado}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )
                break
            }
            
            return renderWidget(widget, content)
          })}
        </div>
      </div>
    </div>
  )
}

export default DashboardConfigurable
