'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Settings, GripVertical, Eye, EyeOff, Save, RotateCcw,
  Monitor, Database, Layout, ChevronDown, ChevronRight,
  Truck, Scale, RefreshCw, ClipboardList, TrendingUp, Package, 
  Tag, FileText, Warehouse, Search, Users, DollarSign,
  BoxSelect, Barcode, Printer, Scissors, Mail, Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Icon mapping
const IconMap: Record<string, typeof Settings> = {
  Truck, Scale, RefreshCw, ClipboardList, TrendingUp, Package,
  Tag, FileText, Warehouse, Search, Users, Settings, DollarSign,
  BoxSelect, Barcode, Printer, Monitor, Scissors, Mail, Database
}

interface ModuloConfig {
  id: string
  label: string
  icon: string
  grupo: string
  visible: boolean
  orden: number
}

interface GrupoConfig {
  id: string
  label: string
  icon: string
  visible: boolean
  expandido: boolean
  orden: number
}

interface ConfigSistemaProps {
  operador: {
    id: string
    nombre: string
    rol: string
    permisos: Record<string, boolean>
  }
}

// Definición completa de TODOS los módulos del sistema
const MODULOS_COMPLETOS: { id: string; label: string; icon: string; grupo: string }[] = [
  // Pesaje Camiones (destacado)
  { id: 'pesajeCamiones', label: 'Pesaje Camiones', icon: 'Truck', grupo: 'destacado' },
  
  // CICLO I
  { id: 'pesajeIndividual', label: 'Pesaje Individual', icon: 'Scale', grupo: 'CICLO I' },
  { id: 'movimientoHacienda', label: 'Movimiento de Hacienda', icon: 'RefreshCw', grupo: 'CICLO I' },
  { id: 'listaFaena', label: 'Lista de Faena', icon: 'ClipboardList', grupo: 'CICLO I' },
  { id: 'ingresoCajon', label: 'Ingreso a Cajón', icon: 'BoxSelect', grupo: 'CICLO I' },
  { id: 'romaneo', label: 'Romaneo', icon: 'TrendingUp', grupo: 'CICLO I' },
  { id: 'vbRomaneo', label: 'VB Romaneo', icon: 'FileText', grupo: 'CICLO I' },
  { id: 'expedicion', label: 'Expedición', icon: 'Truck', grupo: 'CICLO I' },
  
  // CICLO II
  { id: 'cuarteo', label: 'Cuarteo', icon: 'Scissors', grupo: 'CICLO II' },
  { id: 'ingresoDespostada', label: 'Ingreso a Despostada', icon: 'Package', grupo: 'CICLO II' },
  { id: 'movimientosDespostada', label: 'Movimientos de Despostada', icon: 'RefreshCw', grupo: 'CICLO II' },
  { id: 'cortesDespostada', label: 'Cortes en Despostada', icon: 'Scissors', grupo: 'CICLO II' },
  { id: 'empaque', label: 'Empaque', icon: 'Package', grupo: 'CICLO II' },
  
  // Subproductos - Consumo
  { id: 'menudencias', label: 'Menudencias', icon: 'Package', grupo: 'Subproductos-Consumo' },
  { id: 'cueros', label: 'Cueros', icon: 'Tag', grupo: 'Subproductos-Consumo' },
  
  // Subproductos - Rendering
  { id: 'grasa', label: 'Grasa', icon: 'TrendingUp', grupo: 'Subproductos-Rendering' },
  { id: 'desperdicios', label: 'Desperdicios', icon: 'Package', grupo: 'Subproductos-Rendering' },
  { id: 'fondoDigestor', label: 'Fondo de Digestor', icon: 'Package', grupo: 'Subproductos-Rendering' },
  
  // Reportes
  { id: 'stocksCorrales', label: 'Stocks Corrales', icon: 'Warehouse', grupo: 'Reportes' },
  { id: 'stock', label: 'Stocks Cámaras', icon: 'Warehouse', grupo: 'Reportes' },
  { id: 'planilla01', label: 'Planilla 01', icon: 'FileText', grupo: 'Reportes' },
  { id: 'rindesTropa', label: 'Rindes por Tropa', icon: 'TrendingUp', grupo: 'Reportes' },
  { id: 'busquedaFiltro', label: 'Búsqueda por Filtro', icon: 'Search', grupo: 'Reportes' },
  { id: 'reportesSenasa', label: 'Reportes SENASA', icon: 'FileText', grupo: 'Reportes' },
  { id: 'reportesAvanzados', label: 'Reportes Avanzados', icon: 'TrendingUp', grupo: 'Reportes' },
  
  // Administración
  { id: 'trazabilidad', label: 'Trazabilidad', icon: 'Search', grupo: 'Administración' },
  { id: 'dashboardFinanciero', label: 'Dashboard Financiero', icon: 'DollarSign', grupo: 'Administración' },
  { id: 'facturacion', label: 'Facturación', icon: 'FileText', grupo: 'Administración' },
  { id: 'autorizacionesReporte', label: 'Autorizaciones Reportes', icon: 'Mail', grupo: 'Administración' },
  { id: 'adminSistema', label: 'Admin Sistema', icon: 'Database', grupo: 'Administración' },
  { id: 'insumos', label: 'Insumos', icon: 'Package', grupo: 'Administración' },
  { id: 'stocksInsumos', label: 'Stocks de Insumos', icon: 'Package', grupo: 'Administración' },
  
  // Configuración
  { id: 'configBackups', label: 'Backups Automáticos', icon: 'Database', grupo: 'Configuración' },
  { id: 'configRotulos', label: 'Rótulos', icon: 'Tag', grupo: 'Configuración' },
  { id: 'configInsumos', label: 'Insumos', icon: 'Package', grupo: 'Configuración' },
  { id: 'configUsuarios', label: 'Usuarios', icon: 'Users', grupo: 'Configuración' },
  { id: 'configCodigobarras', label: 'Código de Barras', icon: 'Barcode', grupo: 'Configuración' },
  { id: 'configImpresoras', label: 'Impresoras', icon: 'Printer', grupo: 'Configuración' },
  { id: 'configBalanzas', label: 'Balanzas', icon: 'Scale', grupo: 'Configuración' },
  { id: 'configTerminales', label: 'Terminales', icon: 'Monitor', grupo: 'Configuración' },
  { id: 'configOperadores', label: 'Operadores', icon: 'Users', grupo: 'Configuración' },
  { id: 'configProductos', label: 'Productos', icon: 'Package', grupo: 'Configuración' },
  { id: 'configSubproductos', label: 'Subproductos', icon: 'Package', grupo: 'Configuración' },
  { id: 'configListadoInsumos', label: 'Listado de Insumos', icon: 'ClipboardList', grupo: 'Configuración' },
  { id: 'configCondicionesEmbalaje', label: 'Condiciones de Embalaje', icon: 'Package', grupo: 'Configuración' },
  { id: 'configTiposProducto', label: 'Tipos de Producto', icon: 'Tag', grupo: 'Configuración' },
  
  // Calidad
  { id: 'calidadRegistroUsuarios', label: 'Registro de Usuarios', icon: 'Users', grupo: 'Calidad' },
]

// Grupos disponibles
const GRUPOS_ORIGINALES = [
  { id: 'destacado', label: 'Destacado', icon: 'Truck' },
  { id: 'CICLO I', label: 'CICLO I', icon: 'ClipboardList' },
  { id: 'CICLO II', label: 'CICLO II', icon: 'Scissors' },
  { id: 'Subproductos-Consumo', label: 'Subproductos - Consumo', icon: 'Package' },
  { id: 'Subproductos-Rendering', label: 'Subproductos - Rendering', icon: 'Package' },
  { id: 'Reportes', label: 'Reportes', icon: 'FileText' },
  { id: 'Administración', label: 'Administración', icon: 'Settings' },
  { id: 'Configuración', label: 'Configuración', icon: 'Settings' },
  { id: 'Calidad', label: 'Calidad', icon: 'Users' },
]

export function ConfigSistema({ operador }: ConfigSistemaProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modulos, setModulos] = useState<ModuloConfig[]>([])
  const [grupos, setGrupos] = useState<GrupoConfig[]>([])
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  
  // Cargar configuración
  const cargarConfig = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/preferencias-ui?operadorId=${operador.id}`)
      const data = await res.json()
      
      if (data.success && data.data) {
        const prefs = data.data
        
        // Parsear configuración de módulos
        const moduloOrden = Array.isArray(prefs.moduloOrden) ? prefs.moduloOrden : []
        const moduloVisible = prefs.moduloVisible || {}
        const gruposExpandidos = prefs.gruposExpandidos || ['CICLO I', 'Subproductos-Consumo', 'Subproductos-Rendering']
        
        // Construir lista de módulos
        const modulosConfig = MODULOS_COMPLETOS.map((m, index) => ({
          id: m.id,
          label: m.label,
          icon: m.icon,
          grupo: m.grupo,
          visible: moduloVisible[m.id] !== false,
          orden: moduloOrden.indexOf(m.id) >= 0 ? moduloOrden.indexOf(m.id) : index
        }))
        
        setModulos(modulosConfig)
        
        // Construir grupos
        const gruposConfig = GRUPOS_ORIGINALES.map((g, index) => ({
          id: g.id,
          label: g.label,
          icon: g.icon,
          visible: true,
          expandido: gruposExpandidos.includes(g.id),
          orden: index
        }))
        
        setGrupos(gruposConfig)
      } else {
        // Valores por defecto
        setModulos(MODULOS_COMPLETOS.map((m, index) => ({
          id: m.id,
          label: m.label,
          icon: m.icon,
          grupo: m.grupo,
          visible: true,
          orden: index
        })))
        setGrupos(GRUPOS_ORIGINALES.map((g, index) => ({
          id: g.id,
          label: g.label,
          icon: g.icon,
          visible: true,
          expandido: ['CICLO I', 'Subproductos-Consumo', 'Subproductos-Rendering'].includes(g.id),
          orden: index
        })))
      }
    } catch (error) {
      console.error('Error cargando configuración:', error)
    } finally {
      setLoading(false)
    }
  }, [operador.id])
  
  useEffect(() => {
    cargarConfig()
  }, [cargarConfig])
  
  // Guardar configuración
  const guardarConfig = async () => {
    try {
      setSaving(true)
      
      const moduloOrden = modulos.sort((a, b) => a.orden - b.orden).map(m => m.id)
      const moduloVisible: Record<string, boolean> = {}
      modulos.forEach(m => {
        moduloVisible[m.id] = m.visible
      })
      
      const gruposExpandidos = grupos.filter(g => g.expandido).map(g => g.id)
      
      const res = await fetch('/api/preferencias-ui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operadorId: operador.id,
          moduloOrden,
          moduloVisible,
          gruposExpandidos
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success('Configuración guardada correctamente')
      } else {
        toast.error('Error al guardar configuración')
      }
    } catch (error) {
      console.error('Error guardando:', error)
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }
  
  // Drag & Drop
  const handleDragStart = (id: string, grupoId: string) => {
    setDraggedItem(id)
    setActiveGroup(grupoId)
  }
  
  const handleDragOver = (e: React.DragEvent, targetId: string, grupoId: string) => {
    e.preventDefault()
    if (!draggedItem || draggedItem === targetId || activeGroup !== grupoId) return
    
    const grupoModulos = modulos.filter(m => m.grupo === grupoId)
    const otrosModulos = modulos.filter(m => m.grupo !== grupoId)
    
    const draggedIndex = grupoModulos.findIndex(m => m.id === draggedItem)
    const targetIndex = grupoModulos.findIndex(m => m.id === targetId)
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newGrupoModulos = [...grupoModulos]
      const [removed] = newGrupoModulos.splice(draggedIndex, 1)
      newGrupoModulos.splice(targetIndex, 0, removed)
      
      // Reasignar órdenes
      const reorderedGroup = newGrupoModulos.map((m, i) => ({ ...m, orden: i }))
      setModulos([...otrosModulos, ...reorderedGroup])
    }
  }
  
  const handleDragEnd = () => {
    setDraggedItem(null)
    setActiveGroup(null)
  }
  
  // Toggle visibilidad
  const toggleModuloVisible = (id: string) => {
    setModulos(prev => prev.map(m => 
      m.id === id ? { ...m, visible: !m.visible } : m
    ))
  }
  
  // Toggle grupo expandido
  const toggleGrupoExpandido = (id: string) => {
    setGrupos(prev => prev.map(g =>
      g.id === id ? { ...g, expandido: !g.expandido } : g
    ))
  }
  
  // Mover módulo a otro grupo
  const moverAGrupo = (moduloId: string, nuevoGrupo: string) => {
    setModulos(prev => prev.map(m =>
      m.id === moduloId ? { ...m, grupo: nuevoGrupo } : m
    ))
    toast.success('Módulo movido. Guarda para aplicar cambios.')
  }
  
  // Resetear
  const resetear = () => {
    setModulos(MODULOS_COMPLETOS.map((m, index) => ({
      id: m.id,
      label: m.label,
      icon: m.icon,
      grupo: m.grupo,
      visible: true,
      orden: index
    })))
    setGrupos(GRUPOS_ORIGINALES.map((g, index) => ({
      id: g.id,
      label: g.label,
      icon: g.icon,
      visible: true,
      expandido: ['CICLO I', 'Subproductos-Consumo', 'Subproductos-Rendering'].includes(g.id),
      orden: index
    })))
    toast.info('Configuración reseteada. Guarda para aplicar.')
  }
  
  // Obtener icono
  const getIcon = (iconName: string) => {
    return IconMap[iconName] || Settings
  }
  
  // Renderizar módulos por grupo
  const renderModulosPorGrupo = (grupoId: string) => {
    const modulosGrupo = modulos
      .filter(m => m.grupo === grupoId)
      .sort((a, b) => a.orden - b.orden)
    
    if (modulosGrupo.length === 0) return null
    
    const grupo = grupos.find(g => g.id === grupoId)
    
    return (
      <Card key={grupoId} className="border-0 shadow-sm">
        <CardHeader className="bg-stone-50 py-3 cursor-pointer" onClick={() => toggleGrupoExpandido(grupoId)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {grupo?.icon && (() => { 
                const IconComp = getIcon(grupo.icon)
                return <IconComp className="w-4 h-4 text-amber-600" />
              })()}
              <CardTitle className="text-sm font-semibold">{grupo?.label || grupoId}</CardTitle>
              <Badge variant="outline" className="text-xs">{modulosGrupo.length}</Badge>
            </div>
            {grupo?.expandido ? (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-stone-400" />
            )}
          </div>
        </CardHeader>
        
        {grupo?.expandido && (
          <CardContent className="p-3">
            <div className="space-y-1">
              {modulosGrupo.map((modulo) => {
                const IconComp = getIcon(modulo.icon)
                return (
                  <div
                    key={modulo.id}
                    draggable
                    onDragStart={() => handleDragStart(modulo.id, grupoId)}
                    onDragOver={(e) => handleDragOver(e, modulo.id, grupoId)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg border transition-all cursor-move",
                      draggedItem === modulo.id && "opacity-50 scale-95",
                      modulo.visible ? "bg-white border-stone-200" : "bg-stone-100 border-stone-300"
                    )}
                  >
                    <GripVertical className="w-4 h-4 text-stone-400" />
                    <IconComp className={cn("w-4 h-4", modulo.visible ? "text-amber-500" : "text-stone-300")} />
                    <span className={cn(
                      "flex-1 text-sm",
                      !modulo.visible && "text-stone-400 line-through"
                    )}>
                      {modulo.label}
                    </span>
                    
                    {/* Selector de grupo */}
                    <Select value={modulo.grupo} onValueChange={(v) => moverAGrupo(modulo.id, v)}>
                      <SelectTrigger className="w-32 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GRUPOS_ORIGINALES.map(g => (
                          <SelectItem key={g.id} value={g.id} className="text-xs">
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Toggle visibilidad */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => toggleModuloVisible(modulo.id)}
                    >
                      {modulo.visible ? (
                        <Eye className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-stone-400" />
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        )}
      </Card>
    )
  }
  
  // Import Badge
  const Badge = ({ children, className, variant }: { children: React.ReactNode; className?: string; variant?: string }) => (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
      variant === 'outline' ? "border border-stone-300 text-stone-600" : "bg-amber-100 text-amber-700",
      className
    )}>
      {children}
    </span>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Settings className="w-7 h-7 text-amber-500" />
              Configuración de Sistema
            </h1>
            <p className="text-stone-500 mt-1">
              Administra y personaliza todos los módulos del sistema
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetear} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Resetear
            </Button>
            <Button 
              onClick={guardarConfig} 
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
                  Guardar
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="modulos" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="modulos">Todos los Módulos</TabsTrigger>
            <TabsTrigger value="dashboard">Orden del Dashboard</TabsTrigger>
            <TabsTrigger value="menu">Orden del Menú</TabsTrigger>
          </TabsList>
          
          {/* TAB: Todos los Módulos */}
          <TabsContent value="modulos" className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-700">
                <strong>💡 Instrucciones:</strong> Arrastra los módulos para reordenarlos dentro de cada grupo. 
                Usa el selector para moverlos a otro grupo. Click en el ojo para mostrar/ocultar.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {grupos.sort((a, b) => a.orden - b.orden).map(g => renderModulosPorGrupo(g.id))}
            </div>
            
            {/* Estadísticas */}
            <Card className="border-0 shadow-sm mt-6">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{modulos.length}</p>
                    <p className="text-xs text-stone-500">Módulos Totales</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{modulos.filter(m => m.visible).length}</p>
                    <p className="text-xs text-stone-500">Visibles</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-stone-400">{modulos.filter(m => !m.visible).length}</p>
                    <p className="text-xs text-stone-500">Ocultos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* TAB: Orden del Dashboard */}
          <TabsContent value="dashboard" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Orden de Cards en el Dashboard</CardTitle>
                <CardDescription>
                  Los módulos destacados y de CICLO I aparecerán primero en el dashboard principal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-stone-50 rounded-lg p-6 text-center text-stone-500">
                  <Layout className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>El orden del dashboard se configura desde la pestaña "Todos los Módulos"</p>
                  <p className="text-xs mt-2">Los módulos marcados como visibles aparecerán en el dashboard</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* TAB: Orden del Menú */}
          <TabsContent value="menu" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Orden de Grupos en el Menú Lateral</CardTitle>
                <CardDescription>
                  Arrastra los grupos para cambiar el orden en el menú lateral
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {grupos.sort((a, b) => a.orden - b.orden).map((grupo, index) => {
                    const IconComp = getIcon(grupo.icon)
                    return (
                      <div
                        key={grupo.id}
                        draggable
                        className="flex items-center gap-3 p-3 bg-white rounded-lg border cursor-move hover:shadow-sm transition-all"
                      >
                        <GripVertical className="w-4 h-4 text-stone-400" />
                        <IconComp className="w-4 h-4 text-amber-500" />
                        <span className="flex-1 font-medium text-sm">{grupo.label}</span>
                        <Badge variant="outline">{index + 1}°</Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default ConfigSistema
