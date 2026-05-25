'use client'
// Sistema Frigorífico - Solemar Alimentaria v2.3.0
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EditableScreenWrapper } from '@/components/ui/editable-screen'
import { ConfiguracionModule } from '@/components/configuracion'
import { PesajeCamionesModule } from '@/components/pesaje-camiones-module'
import { PesajeIndividualModule } from '@/components/pesaje-individual-module'
import { MovimientoHaciendaModule } from '@/components/movimiento-hacienda-module'
import { ListaFaenaModule } from '@/components/lista-faena'
import { RomaneoModule } from '@/components/romaneo'
import { MenudenciasModule } from '@/components/menudencias'
import { IngresoCajonModule } from '@/components/ingreso-cajon'
import { ReportesModule } from '@/components/reportes'
import { Planilla01Module } from '@/components/planilla-01'
import RindesTropaModule from '@/components/rindes-tropa'
import { StocksCorralesModule } from '@/components/stocks-corrales'
import { BusquedaFiltroModule } from '@/components/busqueda-filtro'
import { CortesDespostadaModule } from '@/components/cortes-despostada'
import { ConfigBalanzasModule } from '@/components/config-balanzas'
// config-impresoras y config-terminales eliminados - ahora se usa PuestoTrabajo
import { ConfigCodigobarrasModule } from '@/components/config-codigobarras'
import { StocksInsumosModule } from '@/components/stocks-insumos'
import { RenderingModule } from '@/components/rendering'
import { VBRomaneoModule } from '@/components/vb-romaneo'
import { CuarteoModule } from '@/components/cuarteo'
import { MovimientosDespostadaModule } from '@/components/movimientos-despostada'
import IngresoDesposteUnificado from '@/components/ingreso-desposte-unificado'
import ProduccionUnificada from '@/components/produccion-unificada'
import ExpedicionUnificada from '@/components/expedicion-unificada'
import StockUnificada from '@/components/stock-unificada'
import { CuerosModule } from '@/components/cueros'
import { ReportesSenasaModule } from '@/components/reportes-senasa'
import { FacturacionModule } from '@/components/facturacion'
import { PreciosPage as PreciosModule } from '@/modules/facturacion/components/PreciosPage'
import { ConfigRotulosModule } from '@/components/config-rotulos'
import { ConfigInsumosModule } from '@/components/config-insumos'
import { ConfigUsuariosModule } from '@/components/config-usuarios'
import { ConfigProductosModule } from '@/components/config-productos'
import { ConfigSubproductosModule } from '@/components/config-subproductos'
import { ConfigListadoInsumosModule } from '@/components/config-listado-insumos'
import { ConfigCondicionesEmbalajeModule } from '@/components/config-condiciones-embalaje'
import { ConfigTiposProductoModule } from '@/components/config-tipos-producto'
import C2RubrosModule from '@/components/c2-rubros'
import C2TiposCuartoModule from '@/components/c2-tipos-cuarto'
import C2ProductosDesposteModule from '@/components/c2-productos-desposte'
import C2BOMModule from '@/components/c2-bom'
import C2SubproductosModule from '@/components/c2-subproductos'
import C2PalletsModule from '@/components/c2-pallets'
import C2RendimientoModule from '@/components/c2-rendimiento'
import C2DegradacionModule from '@/components/c2-degradacion'
import C2ReportesModule from '@/components/c2-reportes'
import { CalidadRegistroUsuariosModule } from '@/components/calidad-registro-usuarios'
import { DespachosModule } from '@/components/despachos'
import { ConfigOperadoresModule } from '@/components/config-operadores'
import { MovimientoCamarasModule } from '@/components/movimiento-camaras'
// Módulos integrados desde modules-pending
import { AuditoriaOperadorModule } from '@/modules-pending/auditoria-operador'
import { RotulosMejorasModule } from '@/modules-pending/rotulos-mejoras'
import { DashboardEjecutivoModule } from '@/modules-pending/dashboard-ejecutivo'
import { ReportesGerencialesModule } from '@/modules-pending/reportes-gerenciales'
import { ControlVencimientosModule } from '@/modules-pending/control-vencimientos'
import { AlertasStockModule } from '@/modules-pending/alertas-stock'
import { HistorialPreciosModule } from '@/modules-pending/historial-precios'

// Lucide icons
import { 
  Truck, Beef, Scale, ClipboardList, TrendingUp, Package, Tag, Scissors, 
  Warehouse, FileText, Settings, Calendar, LogOut, Lock, Users,
  Loader2, Search, RefreshCw, BoxSelect, Barcode,
  ChevronDown, ChevronRight, LayoutDashboard, Wifi, WifiOff, CloudUpload, DollarSign,
  AlertTriangle, Clock, Activity, PanelLeftClose, PanelLeftOpen
} from 'lucide-react'

// Resilience imports
import { useOfflineStore } from '@/stores/offlineStore'

// Types
interface Operador {
  id: string
  nombre: string
  usuario: string
  rol: string
  nivel?: string
  email?: string
  permisos: {
    puedePesajeCamiones: boolean
    puedePesajeIndividual: boolean
    puedeMovimientoHacienda: boolean
    puedeListaFaena: boolean
    puedeIngresoCajon: boolean
    puedeRomaneo: boolean
    puedeMenudencias: boolean
    puedeStock: boolean
    puedeReportes: boolean
    puedeCCIR: boolean
    puedeFacturacion: boolean
    puedeConfiguracion: boolean
    puedeDesposte: boolean
    puedeCuarteo: boolean
    puedeEmpaque: boolean
    puedeExpedicionC2: boolean
  }
}

interface Tropa {
  id: string
  numero: number
  codigo: string
  productor?: { nombre: string }
  usuarioFaena: { nombre: string }
  especie: string
  cantidadCabezas: number
  corralId?: string
  corral?: { nombre: string }
  estado: string
  fechaRecepcion: string
  pesoBruto?: number
  pesoTara?: number
  pesoNeto?: number
}

interface Stats {
  tropasActivas: number
  enPesaje: number
  pesajesHoy: number
  enCamara: number
}

type Page = 'dashboard' | 'pesajeCamiones' | 'pesajeIndividual' | 'movimientoHacienda' | 'listaFaena' | 'ingresoCajon' | 'romaneo' | 'vbRomaneo' | 'movimientoCamaras' | 'expedicionUnificada' | 'despachos' | 'cuarteo' | 'ingresoDesposteUnificado' | 'movimientosDespostada' | 'cortesDespostada' | 'produccionUnificada' | 'menudencias' | 'cueros' | 'grasa' | 'desperdicios' | 'fondoDigestor' | 'stockUnificada' | 'stocksCorrales' | 'planilla01' | 'rindesTropa' | 'busquedaFiltro' | 'reportesSenasa' | 'facturacion' | 'precios' | 'insumos' | 'stocksInsumos' | 'configRotulos' | 'editorRotulos' | 'configInsumos' | 'configUsuarios' | 'configCodigobarras' | 'configBalanzas' | 'configOperadores' | 'configProductos' | 'configSubproductos' | 'configListadoInsumos' | 'configCondicionesEmbalaje' | 'configTiposProducto' | 'configC2Rubros' | 'configC2TiposCuarto' | 'configC2ProductosDesposte' | 'configC2BOM' | 'c2Subproductos' | 'c2Pallets' | 'c2Rendimiento' | 'c2Degradacion' | 'c2Reportes' | 'calidadRegistroUsuarios' | 'reportes' | 'configuracion' | 'auditoriaOperador' | 'rotulosMejoras' | 'dashboardEjecutivo' | 'reportesGerenciales' | 'controlVencimientos' | 'alertasStock' | 'historialPrecios' | 'reportesSIGICA'

// Navigation item
interface NavItem {
  id: Page
  label: string
  icon: typeof Beef
  permiso?: string
  permisoAlt?: string  // Permiso alternativo (OR) — si tiene permiso O permisoAlt, tiene acceso
}

// Sub-group (for nested menus like Consumo/Rendering)
interface NavSubGroup {
  label: string
  items: NavItem[]
}

// Navigation group
interface NavGroup {
  label: string
  icon?: typeof Beef
  items: NavItem[]
  subGroups?: NavSubGroup[]  // For nested submenus
}

// Main navigation structure
const NAV_GROUPS: NavGroup[] = [
  // 1. Pesaje Camiones - destacado al inicio (sin agrupar)
  {
    label: '',
    items: [
      { id: 'pesajeCamiones', label: 'Pesaje Camiones', icon: Truck, permiso: 'puedePesajeCamiones' },
    ]
  },
  // 2. CICLO I
  {
    label: 'CICLO I',
    icon: ClipboardList,
    items: [
      { id: 'pesajeIndividual', label: 'Pesaje Individual', icon: Scale, permiso: 'puedePesajeIndividual' },
      { id: 'movimientoHacienda', label: 'Movimiento de Hacienda', icon: RefreshCw, permiso: 'puedeMovimientoHacienda' },
      { id: 'listaFaena', label: 'Lista de Faena', icon: ClipboardList, permiso: 'puedeListaFaena' },
      { id: 'ingresoCajon', label: 'Ingreso a Cajón', icon: BoxSelect, permiso: 'puedeIngresoCajon' },
      { id: 'romaneo', label: 'Romaneo', icon: TrendingUp, permiso: 'puedeRomaneo' },
      { id: 'vbRomaneo', label: 'VB Romaneo', icon: FileText, permiso: 'puedeRomaneo' },
      { id: 'movimientoCamaras', label: 'Movimiento de Cámaras', icon: RefreshCw, permiso: 'puedeStock' },
      { id: 'expedicionUnificada', label: 'Expedición', icon: Truck, permiso: 'puedeStock', permisoAlt: 'puedeExpedicionC2' },
      { id: 'despachos', label: 'Despachos', icon: Truck, permiso: 'puedeStock' },
    ]
  },
  // 3. CICLO II
  {
    label: 'CICLO II',
    icon: Scissors,
    items: [
      { id: 'cuarteo', label: 'Cuarteo', icon: Scissors, permiso: 'puedeCuarteo' },
      { id: 'ingresoDesposteUnificado', label: 'Ingreso a Desposte', icon: Package, permiso: 'puedeDesposte' },
      { id: 'produccionUnificada', label: 'Producción / Empaque', icon: Scissors, permiso: 'puedeDesposte', permisoAlt: 'puedeEmpaque' },
      { id: 'c2Subproductos', label: 'Subproductos C2', icon: Package, permiso: 'puedeDesposte' },
      { id: 'c2Pallets', label: 'Pallets C2', icon: Package, permiso: 'puedeExpedicionC2' },
      { id: 'c2Rendimiento', label: 'Rendimiento C2', icon: TrendingUp, permiso: 'puedeReportes' },
      { id: 'c2Degradacion', label: 'Degradación C2', icon: AlertTriangle, permiso: 'puedeDesposte' },
      { id: 'c2Reportes', label: 'Reportes C2', icon: FileText, permiso: 'puedeReportes' },
      { id: 'movimientosDespostada', label: 'Movimientos de Despostada', icon: RefreshCw, permiso: 'puedeDesposte' },
      { id: 'cortesDespostada', label: 'Cortes en Despostada', icon: Scissors, permiso: 'puedeDesposte' },
      { id: 'configC2Rubros', label: 'Rubros', icon: Tag, permiso: 'puedeConfiguracion' },
      { id: 'configC2TiposCuarto', label: 'Tipos de Cuarto', icon: Scissors, permiso: 'puedeConfiguracion' },
      { id: 'configC2ProductosDesposte', label: 'Productos Desposte', icon: Package, permiso: 'puedeConfiguracion' },
      { id: 'configC2BOM', label: 'BOM (Insumos x Producto)', icon: ClipboardList, permiso: 'puedeConfiguracion' },
    ]
  },
  // 4. Subproductos (con subgrupos)
  {
    label: 'Subproductos',
    icon: Package,
    items: [],
    subGroups: [
      {
        label: 'Consumo',
        items: [
          { id: 'menudencias', label: 'Menudencias', icon: Package, permiso: 'puedeMenudencias' },
          { id: 'cueros', label: 'Cueros', icon: Tag, permiso: 'puedeMenudencias' },
        ]
      },
      {
        label: 'Rendering',
        items: [
          { id: 'grasa', label: 'Grasa', icon: TrendingUp, permiso: 'puedeMenudencias' },
          { id: 'desperdicios', label: 'Desperdicios', icon: Package, permiso: 'puedeMenudencias' },
          { id: 'fondoDigestor', label: 'Fondo de Digestor', icon: Package, permiso: 'puedeMenudencias' },
        ]
      }
    ]
  },
  // 5. Reportes
  {
    label: 'Reportes',
    icon: FileText,
    items: [
      { id: 'stocksCorrales', label: 'Stocks Corrales', icon: Warehouse, permiso: 'puedeReportes' },
      { id: 'stockUnificada', label: 'Stock Cámaras / Cajas', icon: Warehouse, permiso: 'puedeReportes' },
      { id: 'planilla01', label: 'Planilla 01', icon: FileText, permiso: 'puedeReportes' },
      { id: 'rindesTropa', label: 'Rindes por Tropa', icon: TrendingUp, permiso: 'puedeReportes' },
      { id: 'busquedaFiltro', label: 'Búsqueda por Filtro', icon: Search, permiso: 'puedeReportes' },
      { id: 'reportesSenasa', label: 'Reportes SENASA', icon: FileText, permiso: 'puedeReportes' },
      { id: 'reportesSIGICA', label: 'Reportes SIGICA', icon: FileText, permiso: 'puedeReportes' },
      { id: 'reportesGerenciales', label: 'Reportes Gerenciales', icon: TrendingUp, permiso: 'puedeReportes' },
      { id: 'controlVencimientos', label: 'Control Vencimientos', icon: AlertTriangle, permiso: 'puedeStock' },
      { id: 'dashboardEjecutivo', label: 'Dashboard Ejecutivo', icon: LayoutDashboard, permiso: 'puedeReportes' },
    ]
  },
  // 6. Administración
  {
    label: 'Administración',
    icon: FileText,
    items: [
      { id: 'facturacion', label: 'Facturación', icon: FileText, permiso: 'puedeFacturacion' },
      { id: 'precios', label: 'Precios', icon: DollarSign, permiso: 'puedeFacturacion' },
      { id: 'historialPrecios', label: 'Historial de Precios', icon: TrendingUp, permiso: 'puedeFacturacion' },
      { id: 'insumos', label: 'Insumos', icon: Package, permiso: 'puedeConfiguracion' },
      { id: 'stocksInsumos', label: 'Stocks de Insumos', icon: Package, permiso: 'puedeStock' },
      { id: 'alertasStock', label: 'Alertas de Stock', icon: AlertTriangle, permiso: 'puedeStock' },
    ]
  },
  // 7. Configuración
  {
    label: 'Configuración',
    icon: Settings,
    items: [
      { id: 'configRotulos', label: 'Rótulos', icon: Tag, permiso: 'puedeConfiguracion' },
      { id: 'configInsumos', label: 'Insumos', icon: Package, permiso: 'puedeConfiguracion' },
      { id: 'configUsuarios', label: 'Usuarios', icon: Users, permiso: 'puedeConfiguracion' },
      { id: 'configCodigobarras', label: 'Código de Barras', icon: Barcode, permiso: 'puedeConfiguracion' },
      // configImpresoras eliminado - ahora se configura en Puestos de Trabajo
      { id: 'configBalanzas', label: 'Balanzas', icon: Scale, permiso: 'puedeConfiguracion' },
      // configTerminales eliminado - ahora se configura en Puestos de Trabajo
      { id: 'configOperadores', label: 'Operadores', icon: Users, permiso: 'puedeConfiguracion' },
      { id: 'configProductos', label: 'Productos', icon: Package, permiso: 'puedeConfiguracion' },
      { id: 'configSubproductos', label: 'Subproductos', icon: Package, permiso: 'puedeConfiguracion' },
      { id: 'configListadoInsumos', label: 'Listado de Insumos', icon: ClipboardList, permiso: 'puedeConfiguracion' },
      { id: 'configCondicionesEmbalaje', label: 'Condiciones de Embalaje', icon: Package, permiso: 'puedeConfiguracion' },
      { id: 'configTiposProducto', label: 'Tipos de Producto', icon: Tag, permiso: 'puedeConfiguracion' },
    ]
  },
  // 8. Calidad
  {
    label: 'Calidad',
    icon: FileText,
    items: [
      { id: 'calidadRegistroUsuarios', label: 'Registro de Usuarios', icon: Users, permiso: 'puedeConfiguracion' },
      { id: 'auditoriaOperador', label: 'Auditoría Operadores', icon: Users, permiso: 'puedeConfiguracion' },
    ]
  },
  // 9. Diseño de Etiquetas
  {
    label: 'Diseño',
    icon: Tag,
    items: [
      { id: 'rotulosMejoras', label: 'Diseñador Etiquetas', icon: Tag, permiso: 'puedeConfiguracion' },
    ]
  }
]

// ============================================================
// Offline Status Indicator - Capa 3
// Componente que muestra el estado de conexión y la cola de sincronización
// ============================================================
function OfflineStatusIndicator() {
  const isOnline = useOfflineStore((s) => s.isOnline)
  const pendingCount = useOfflineStore((s) => s.pendingCount)
  const isSyncing = useOfflineStore((s) => s.isSyncing)
  const syncAll = useOfflineStore((s) => s.syncAll)

  const pending = pendingCount()

  if (isOnline && pending === 0) {
    return (
      <div className="flex items-center gap-1.5 mt-2 text-xs text-green-600">
        <Wifi className="w-3.5 h-3.5" />
        <span>Conectado</span>
      </div>
    )
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600">
        <WifiOff className="w-3.5 h-3.5" />
        <span>Sin conexión{pending > 0 ? ` · ${pending} pendiente${pending > 1 ? 's' : ''}` : ''}</span>
      </div>
    )
  }

  // Online with pending items
  return (
    <button
      onClick={() => syncAll()}
      className="flex items-center gap-1.5 mt-2 text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
      disabled={isSyncing}
    >
      {isSyncing ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <CloudUpload className="w-3.5 h-3.5" />
      )}
      <span>{isSyncing ? 'Sincronizando...' : `${pending} pendiente${pending > 1 ? 's' : ''} · Sincronizar`}</span>
    </button>
  )
}

export default function FrigorificoApp() {
  const [operador, setOperador] = useState<Operador | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [tropas, setTropas] = useState<Tropa[]>([])
  const [stats, setStats] = useState<Stats>({ tropasActivas: 0, enPesaje: 0, pesajesHoy: 0, enCamara: 0 })
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['CICLO I', 'Subproductos'])
  const [expandedSubGroups, setExpandedSubGroups] = useState<string[]>(['Subproductos-Consumo', 'Subproductos-Rendering'])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [actividadReciente, setActividadReciente] = useState<Array<{id: string; tipo: string; descripcion: string; fecha: string}>>([])
  
  // Login state
  const [loginTab, setLoginTab] = useState<'usuario' | 'pin'>('usuario')
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  // Check for existing session via JWT cookie (no more localStorage)
  useEffect(() => {
    const validateSession = async () => {
      try {
        // The GET /api/auth endpoint now reads the JWT from httpOnly cookie
        const res = await fetch('/api/auth')
        const data = await res.json()
        if (data.success && data.data) {
          setOperador(data.data)
        }
      } catch {
        // No valid session cookie
      }
      setLoading(false)
    }
    validateSession()
  }, [])

  // Fetch data
  useEffect(() => {
    if (operador) {
      fetchTropas()
      fetchStats()
      fetchActividad()
    }
  }, [operador])

  // Listen for production mode changes from child modules
  useEffect(() => {
    const handleProductionMode = (e: CustomEvent) => {
      setSidebarCollapsed(e.detail.active)
    }
    window.addEventListener('production-mode-change', handleProductionMode as EventListener)
    return () => window.removeEventListener('production-mode-change', handleProductionMode as EventListener)
  }, [])

  const fetchTropas = async () => {
    try {
      const res = await fetch('/api/tropas')
      const data = await res.json()
      if (data.success) {
        setTropas(data.data)
      }
    } catch (error) {
      console.error('Error fetching tropas:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard')
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchActividad = async () => {
    try {
      const res = await fetch('/api/actividad-operador?limite=10')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setActividadReciente(data.data)
      }
    } catch (error) {
      console.error('Error fetching actividad:', error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoggingIn(true)
    
    try {
      const body = loginTab === 'usuario' 
        ? { usuario, password }
        : { pin }
      
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const data = await res.json()
      
      if (data.success) {
        setOperador(data.data)
        // JWT is already set as httpOnly cookie by the backend
        setUsuario('')
        setPassword('')
        setPin('')
      } else {
        setLoginError(data.error || 'Error de autenticación')
      }
    } catch {
      setLoginError('Error de conexión')
    } finally {
      setLoggingIn(false)
    }
  }

  const handleLogout = async () => {
    try {
      // DELETE /api/auth clears the JWT cookie server-side
      await fetch('/api/auth', { method: 'DELETE' })
    } catch {
      // Ignore logout errors
    }
    setOperador(null)
    setCurrentPage('pesajeCamiones')
  }

  // Check if user has permission (ADMINISTRADOR has all permissions automatically)
  const hasPermission = (permiso: string | undefined): boolean => {
    if (!permiso) return true
    // ADMINISTRADOR tiene todos los permisos automáticamente
    if (operador?.rol === 'ADMINISTRADOR') return true
    return operador?.permisos[permiso as keyof typeof operador.permisos] === true
  }

  // Check if user has ANY of two permissions (OR logic for unified modules)
  const hasPermissionOr = (permiso: string | undefined, permisoAlt: string | undefined): boolean => {
    if (operador?.rol === 'ADMINISTRADOR') return true
    return hasPermission(permiso) || hasPermission(permisoAlt)
  }

  // Check permission - recorre items y subgrupos
  const canAccess = (page: Page): boolean => {
    if (!operador) return false
    for (const group of NAV_GROUPS) {
      // Buscar en items directos
      const item = group.items.find(n => n.id === page)
      if (item) {
        return hasPermissionOr(item.permiso, item.permisoAlt)
      }
      // Buscar en subgrupos
      if (group.subGroups) {
        for (const subGroup of group.subGroups) {
          const subItem = subGroup.items.find(n => n.id === page)
          if (subItem) {
            return hasPermissionOr(subItem.permiso, subItem.permisoAlt)
          }
        }
      }
    }
    return true
  }

  // Toggle group expansion
  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupLabel) 
        ? prev.filter(g => g !== groupLabel)
        : [...prev, groupLabel]
    )
  }

  // Toggle subgroup expansion
  const toggleSubGroup = (parentLabel: string, subLabel: string) => {
    const key = `${parentLabel}-${subLabel}`
    setExpandedSubGroups(prev => 
      prev.includes(key) 
        ? prev.filter(g => g !== key)
        : [...prev, key]
    )
  }

  // Filter nav groups by permission (incluye subgrupos)
  const visibleNavGroups = NAV_GROUPS.map(group => {
    // Filtrar items directos
    const filteredItems = group.items.filter(item => {
      return hasPermissionOr(item.permiso, item.permisoAlt)
    })
    
    // Filtrar subgrupos
    const filteredSubGroups = group.subGroups?.map(subGroup => ({
      ...subGroup,
      items: subGroup.items.filter(item => hasPermissionOr(item.permiso, item.permisoAlt))
    })).filter(subGroup => subGroup.items.length > 0)
    
    return {
      ...group,
      items: filteredItems,
      subGroups: filteredSubGroups
    }
  }).filter(group => group.items.length > 0 || (group.subGroups && group.subGroups.length > 0))

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  // Login screen
  if (!operador) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="relative w-64 h-64 mx-auto mb-4">
              <Image 
                src="/logo.png" 
                alt="Solemar Alimentaria" 
                fill
                className="object-contain"
                priority
              />
            </div>
            <CardTitle className="text-2xl">Solemar Alimentaria</CardTitle>
            <CardDescription>Sistema de Gestión Frigorífica</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={loginTab} onValueChange={(v) => setLoginTab(v as 'usuario' | 'pin')}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="usuario">Usuario</TabsTrigger>
                <TabsTrigger value="pin">PIN</TabsTrigger>
              </TabsList>
              
              <form onSubmit={handleLogin} className="space-y-4">
                {loginTab === 'usuario' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="usuario">Usuario</Label>
                      <Input
                        id="usuario"
                        type="text"
                        value={usuario}
                        onChange={(e) => setUsuario(e.target.value)}
                        placeholder="Ingrese su usuario"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="pin">PIN</Label>
                    <Input
                      id="pin"
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="••••••"
                      className="text-center text-2xl tracking-widest h-14"
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                )}
                
                {loginError && (
                  <p className="text-red-500 text-sm text-center">{loginError}</p>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600"
                  disabled={(loginTab === 'usuario' && (!usuario || !password)) || (loginTab === 'pin' && pin.length < 4) || loggingIn}
                >
                  {loggingIn ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Ingresar
                    </>
                  )}
                </Button>
              </form>
            </Tabs>
            
            <div className="mt-6 pt-4 border-t text-center text-xs text-stone-400">
              {process.env.NODE_ENV === 'development' && (
                <>
                  <p>Credenciales de prueba:</p>
                  <p>Usuario: <span className="font-mono">admin</span> / Password: <span className="font-mono">admin123</span></p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Dashboard content - Menú navegable de módulos
  const DashboardContent = () => {
    // Agrupar módulos para el menú principal
    const modulosPrincipales = [
      { id: 'pesajeCamiones' as Page, label: 'Pesaje Camiones', icon: Truck, color: 'bg-amber-500', desc: 'Pesaje de camiones de hacienda', permiso: 'puedePesajeCamiones' },
      { id: 'pesajeIndividual' as Page, label: 'Pesaje Individual', icon: Scale, color: 'bg-emerald-600', desc: 'Pesaje individual de animales', permiso: 'puedePesajeIndividual' },
      { id: 'movimientoHacienda' as Page, label: 'Movimiento de Hacienda', icon: RefreshCw, color: 'bg-blue-600', desc: 'Movimiento entre corrales', permiso: 'puedeMovimientoHacienda' },
      { id: 'listaFaena' as Page, label: 'Lista de Faena', icon: ClipboardList, color: 'bg-red-600', desc: 'Gestión de lista de faena', permiso: 'puedeListaFaena' },
      { id: 'ingresoCajon' as Page, label: 'Ingreso a Cajón', icon: BoxSelect, color: 'bg-purple-600', desc: 'Asignación de garrones', permiso: 'puedeIngresoCajon' },
      { id: 'romaneo' as Page, label: 'Romaneo', icon: TrendingUp, color: 'bg-orange-500', desc: 'Pesaje de medias reses', permiso: 'puedeRomaneo' },
    ]
    
    const modulosSubproductos = [
      { id: 'menudencias' as Page, label: 'Menudencias', icon: Package, color: 'bg-teal-600', desc: 'Procesamiento de menudencias', permiso: 'puedeMenudencias' },
      { id: 'cueros' as Page, label: 'Cueros', icon: Tag, color: 'bg-yellow-600', desc: 'Gestión de cueros', permiso: 'puedeMenudencias' },
    ]
    
    const modulosReportes = [
      { id: 'stocksCorrales' as Page, label: 'Stocks Corrales', icon: Warehouse, color: 'bg-indigo-600', desc: 'Stock en corrales', permiso: 'puedeReportes' },
      { id: 'stockUnificada' as Page, label: 'Stock Cámaras / Cajas', icon: Warehouse, color: 'bg-cyan-600', desc: 'Stock en cámaras y cajas C2', permiso: 'puedeReportes' },
      { id: 'planilla01' as Page, label: 'Planilla 01', icon: FileText, color: 'bg-gray-600', desc: 'Planilla oficial SENASA', permiso: 'puedeReportes' },
      { id: 'rindesTropa' as Page, label: 'Rindes por Tropa', icon: TrendingUp, color: 'bg-lime-600', desc: 'Análisis de rindes', permiso: 'puedeReportes' },
    ]
    
    const modulosAdmin = [
      { id: 'facturacion' as Page, label: 'Facturación', icon: FileText, color: 'bg-slate-700', desc: 'Gestión de facturación', permiso: 'puedeFacturacion' },
      { id: 'configuracion' as Page, label: 'Configuración', icon: Settings, color: 'bg-stone-600', desc: 'Configuración del sistema', permiso: 'puedeConfiguracion' },
    ]

    const renderModuleCard = (modulo: { id: Page; label: string; icon: typeof Beef; color: string; desc: string; permiso: string }) => {
      const hasAccess = operador?.permisos[modulo.permiso as keyof typeof operador.permisos] === true
      return (
        <Card 
          key={modulo.id}
          className={`border-0 shadow-md cursor-pointer transition-all duration-200 ${hasAccess ? 'hover:shadow-lg hover:scale-105' : 'opacity-50 cursor-not-allowed'}`}
          onClick={() => hasAccess && setCurrentPage(modulo.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`${modulo.color} p-3 rounded-lg`}>
                <modulo.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-stone-800">{modulo.label}</p>
                <p className="text-xs text-stone-500">{modulo.desc}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Sistema Frigorífico - Solemar Alimentaria</h1>
            <p className="text-stone-500 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Quick Stats - Clickable */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card className="border-0 shadow-sm bg-amber-50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentPage('pesajeCamiones')}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Beef className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-xs text-stone-500">Tropas Activas</p>
                      <p className="text-xl font-bold text-amber-700">{stats.tropasActivas}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-emerald-50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentPage('pesajeIndividual')}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-xs text-stone-500">En Pesaje</p>
                      <p className="text-xl font-bold text-emerald-700">{stats.enPesaje}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-blue-50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentPage('pesajeCamiones')}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-stone-500">Pesajes Hoy</p>
                      <p className="text-xl font-bold text-blue-700">{stats.pesajesHoy}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-purple-50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentPage('stockUnificada')}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-stone-500">En Cámara</p>
                      <p className="text-xl font-bold text-purple-700">{stats.enCamara}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Menú de Módulos - CICLO I */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-stone-700 mb-3 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-600" />
              CICLO I - Módulos Principales
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {modulosPrincipales.map(renderModuleCard)}
            </div>
          </div>

          {/* Subproductos y Reportes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Subproductos */}
            <div>
              <h2 className="text-lg font-semibold text-stone-700 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-600" />
                Subproductos
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {modulosSubproductos.map(renderModuleCard)}
              </div>
            </div>
            
            {/* Reportes */}
            <div>
              <h2 className="text-lg font-semibold text-stone-700 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Reportes
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {modulosReportes.map(renderModuleCard)}
              </div>
            </div>
          </div>

          {/* Administración */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-stone-700 mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-600" />
              Administración
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {modulosAdmin.map(renderModuleCard)}
            </div>
          </div>

          {/* Últimas Tropas */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg py-3">
              <CardTitle className="text-base font-semibold text-stone-800 flex items-center gap-2">
                <Beef className="w-5 h-5" />
                Últimas Tropas Registradas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {tropas.length === 0 ? (
                <div className="p-6 text-center text-stone-400">
                  <Beef className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No hay tropas registradas</p>
                </div>
              ) : (
                <div className="divide-y max-h-64 overflow-y-auto">
                  {tropas.slice(0, 5).map((tropa) => (
                    <div key={tropa.id} className="p-3 hover:bg-stone-50">
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
              )}
            </CardContent>
          </Card>

          {/* Últimos Movimientos */}
          <Card className="border-0 shadow-md mt-4">
            <CardHeader className="bg-stone-50 rounded-t-lg py-3">
              <CardTitle className="text-base font-semibold text-stone-800 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Últimos Movimientos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {actividadReciente.length === 0 ? (
                <div className="p-6 text-center text-stone-400">
                  <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No hay movimientos recientes</p>
                </div>
              ) : (
                <div className="divide-y max-h-64 overflow-y-auto">
                  {actividadReciente.slice(0, 10).map((mov) => (
                    <div key={mov.id} className="p-3 hover:bg-stone-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs border-stone-200 text-stone-500 capitalize">
                          {mov.tipo}
                        </Badge>
                        <span className="text-sm text-stone-700">{mov.descripcion}</span>
                      </div>
                      <span className="text-xs text-stone-400">{new Date(mov.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Render current page
  const renderPage = () => {
    if (!canAccess(currentPage)) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6 flex items-center justify-center">
          <Card className="border-0 shadow-md max-w-md">
            <CardContent className="p-8 text-center">
              <Lock className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <p className="text-lg font-medium text-stone-800">Acceso Denegado</p>
              <p className="text-sm text-stone-500 mt-2">No tiene permisos para acceder a este módulo</p>
              <Button className="mt-4" onClick={() => setCurrentPage('dashboard')}>
                Volver al Inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Módulos que NO necesitan el wrapper de edición
    const noWrapperPages = ['dashboard', 'configuracion']
    
    // Wrapper para agregar botón de edición a cualquier módulo
    const wrapModule = (moduleId: string, content: React.ReactNode) => {
      if (noWrapperPages.includes(moduleId)) {
        return content
      }
      return (
        <EditableScreenWrapper moduloId={moduleId} operador={operador}>
          {content}
        </EditableScreenWrapper>
      )
    }

    switch (currentPage) {
      case 'dashboard':
        return <DashboardContent />
      case 'pesajeCamiones':
        return wrapModule('pesajeCamiones', <PesajeCamionesModule operador={operador} onTropaCreada={fetchTropas} />)
      case 'pesajeIndividual':
        return wrapModule('pesajeIndividual', <PesajeIndividualModule operador={operador} />)
      case 'movimientoHacienda':
        return wrapModule('movimientoHacienda', <MovimientoHaciendaModule operador={operador} />)
      case 'listaFaena':
        return wrapModule('listaFaena', <ListaFaenaModule operador={operador} />)
      case 'romaneo':
        return wrapModule('romaneo', <RomaneoModule operador={operador} />)
      case 'ingresoCajon':
        return wrapModule('ingresoCajon', <IngresoCajonModule operador={operador} />)
      case 'menudencias':
        return wrapModule('menudencias', <MenudenciasModule operador={operador} />)
      case 'stockUnificada':
        return wrapModule('stockUnificada', <StockUnificada operador={operador} />)
      case 'stocksCorrales':
        return wrapModule('stocksCorrales', <StocksCorralesModule operador={operador} />)
      case 'reportes':
        return wrapModule('reportes', <ReportesModule operador={operador} />)
      case 'planilla01':
        return wrapModule('planilla01', <Planilla01Module operador={operador} />)
      case 'rindesTropa':
        return wrapModule('rindesTropa', <RindesTropaModule operador={operador} />)
      case 'busquedaFiltro':
        return wrapModule('busquedaFiltro', <BusquedaFiltroModule operador={operador} />)
      case 'cortesDespostada':
        return wrapModule('cortesDespostada', <CortesDespostadaModule operador={operador} />)
      case 'stocksInsumos':
        return wrapModule('stocksInsumos', <StocksInsumosModule operador={operador} />)
      case 'configuracion':
        return <ConfiguracionModule operador={operador} />
      case 'configBalanzas':
        return wrapModule('configBalanzas', <ConfigBalanzasModule operador={operador} />)
      // configImpresoras y configTerminales eliminados
      case 'configCodigobarras':
        return wrapModule('configCodigobarras', <ConfigCodigobarrasModule operador={operador} />)
      case 'vbRomaneo':
        return wrapModule('vbRomaneo', <VBRomaneoModule operador={operador} />)
      case 'movimientoCamaras':
        return wrapModule('movimientoCamaras', <MovimientoCamarasModule operador={operador} />)
      case 'expedicionUnificada':
        return wrapModule('expedicionUnificada', <ExpedicionUnificada operador={operador} />)
      case 'despachos':
        return wrapModule('despachos', <DespachosModule operador={operador} />)
      case 'cuarteo':
        return wrapModule('cuarteo', <CuarteoModule operador={operador} />)
      case 'ingresoDesposteUnificado':
        return wrapModule('ingresoDesposteUnificado', <IngresoDesposteUnificado operador={operador} />)
      case 'produccionUnificada':
        return wrapModule('produccionUnificada', <ProduccionUnificada operador={operador} />)
      case 'c2Subproductos':
        return wrapModule('c2Subproductos', <C2SubproductosModule operador={operador} />)
      case 'c2Pallets':
        return wrapModule('c2Pallets', <C2PalletsModule operador={operador} />)
      case 'c2Rendimiento':
        return wrapModule('c2Rendimiento', <C2RendimientoModule operador={operador} />)
      case 'c2Degradacion':
        return wrapModule('c2Degradacion', <C2DegradacionModule operador={operador} />)
      case 'c2Reportes':
        return wrapModule('c2Reportes', <C2ReportesModule operador={operador} />)
      case 'movimientosDespostada':
        return wrapModule('movimientosDespostada', <MovimientosDespostadaModule operador={operador} />)
      case 'cueros':
        return wrapModule('cueros', <CuerosModule operador={operador} />)
      case 'grasa':
        return wrapModule('grasa', <RenderingModule operador={operador} tipoInicial="GRASA" />)
      case 'desperdicios':
        return wrapModule('desperdicios', <RenderingModule operador={operador} tipoInicial="DESPERDICIOS" />)
      case 'fondoDigestor':
        return wrapModule('fondoDigestor', <RenderingModule operador={operador} tipoInicial="FONDO_DIGESTOR" />)
      case 'reportesSenasa':
        return wrapModule('reportesSenasa', <ReportesSenasaModule operador={operador} />)
      case 'facturacion':
        return wrapModule('facturacion', <FacturacionModule operador={operador} />)
      case 'precios':
        return wrapModule('precios', <PreciosModule operador={operador} />)
      case 'insumos':
        return wrapModule('insumos', <ConfigInsumosModule operador={operador} />)
      case 'configRotulos':
        return wrapModule('configRotulos', <ConfigRotulosModule operador={operador} />)
      case 'editorRotulos':
        return <ConfigRotulosModule operador={operador} modoEditor={true} onVolverDeEditor={() => setCurrentPage('configRotulos')} />
      case 'configInsumos':
        return wrapModule('configInsumos', <ConfigInsumosModule operador={operador} />)
      case 'configUsuarios':
        return wrapModule('configUsuarios', <ConfigUsuariosModule operador={operador} />)
      case 'configOperadores':
        return wrapModule('configOperadores', <ConfigOperadoresModule operador={operador} />)
      case 'configProductos':
        return wrapModule('configProductos', <ConfigProductosModule operador={operador} />)
      case 'configSubproductos':
        return wrapModule('configSubproductos', <ConfigSubproductosModule operador={operador} />)
      case 'configListadoInsumos':
        return wrapModule('configListadoInsumos', <ConfigListadoInsumosModule operador={operador} />)
      case 'configCondicionesEmbalaje':
        return wrapModule('configCondicionesEmbalaje', <ConfigCondicionesEmbalajeModule operador={operador} />)
      case 'configTiposProducto':
        return wrapModule('configTiposProducto', <ConfigTiposProductoModule operador={operador} />)
      case 'configC2Rubros':
        return wrapModule('configC2Rubros', <C2RubrosModule operador={operador} />)
      case 'configC2TiposCuarto':
        return wrapModule('configC2TiposCuarto', <C2TiposCuartoModule operador={operador} />)
      case 'configC2ProductosDesposte':
        return wrapModule('configC2ProductosDesposte', <C2ProductosDesposteModule operador={operador} />)
      case 'configC2BOM':
        return wrapModule('configC2BOM', <C2BOMModule operador={operador} />)
      case 'calidadRegistroUsuarios':
        return wrapModule('calidadRegistroUsuarios', <CalidadRegistroUsuariosModule operador={operador} />)
      // Módulos integrados desde modules-pending
      case 'auditoriaOperador':
        return wrapModule('auditoriaOperador', <AuditoriaOperadorModule operador={operador} />)
      case 'rotulosMejoras':
        return wrapModule('rotulosMejoras', <RotulosMejorasModule operador={operador} />)
      case 'dashboardEjecutivo':
        return wrapModule('dashboardEjecutivo', <DashboardEjecutivoModule operador={operador} />)
      case 'reportesGerenciales':
        return wrapModule('reportesGerenciales', <ReportesGerencialesModule operador={operador} />)
      case 'controlVencimientos':
        return wrapModule('controlVencimientos', <ControlVencimientosModule operador={operador} />)
      case 'alertasStock':
        return wrapModule('alertasStock', <AlertasStockModule operador={operador} />)
      case 'historialPrecios':
        return wrapModule('historialPrecios', <HistorialPreciosModule operador={operador} />)
      case 'reportesSIGICA':
        return wrapModule('reportesSIGICA', <ReportesSenasaModule operador={operador} />)
      default:
        return wrapModule('pesajeCamiones', <PesajeCamionesModule operador={operador} onTropaCreada={fetchTropas} />)
    }
  }

  return (
    <div className="min-h-screen bg-stone-100 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 bg-white border-r flex flex-col shadow-lg transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        {/* Collapse Toggle */}
        <div className="absolute top-2 right-2 z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-7 w-7 text-stone-400 hover:text-stone-600"
          >
            {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </Button>
        </div>
        {/* Logo */}
        <div className={`h-28 flex items-center gap-3 px-4 border-b bg-gradient-to-r from-amber-50 to-white ${sidebarCollapsed ? 'justify-center px-2' : ''}`}>
          <div className={`relative flex-shrink-0 ${sidebarCollapsed ? 'w-10 h-10' : 'w-20 h-20'}`}>
            <Image src="/logo.png" alt="Solemar" fill className="object-contain" priority />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <h1 className="font-bold text-stone-800 text-sm leading-tight">Solemar Alimentaria</h1>
              <p className="text-xs text-amber-600 font-medium">CICLO I</p>
            </div>
          )}
        </div>
        
        {/* Operator info */}
        <div className={`p-3 border-b bg-stone-50 ${sidebarCollapsed ? 'px-2' : ''}`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
              <Users className="w-4 h-4 text-stone-400 flex-shrink-0" />
              {!sidebarCollapsed && (
                <div>
                  <p className="text-sm font-medium text-stone-700">{operador.nombre}</p>
                  <p className="text-xs text-stone-400">{operador.rol}</p>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-stone-400 hover:text-red-500">
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
          {!sidebarCollapsed && <OfflineStatusIndicator />}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {/* Botón Inicio/Dashboard */}
          <button
            onClick={() => setCurrentPage('dashboard')}
            title={sidebarCollapsed ? 'Inicio' : undefined}
            className={`
              flex items-center gap-3 rounded-lg w-full text-left transition-all duration-150 mb-2
              ${sidebarCollapsed ? 'px-0 py-3 justify-center' : 'px-4 py-3'}
              ${currentPage === 'dashboard'
                ? 'bg-stone-800 text-white font-medium shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }
            `}
          >
            <LayoutDashboard className={`w-5 h-5 flex-shrink-0 ${currentPage === 'dashboard' ? 'text-white' : 'text-stone-500'}`} />
            {!sidebarCollapsed && <span className="text-sm font-semibold">Inicio</span>}
          </button>

          {visibleNavGroups.map((group, index) => {
            // Grupo sin label = botón destacado (Pesaje Camiones)
            if (!group.label) {
              const item = group.items[0]
              if (!item) return null
              const isActive = currentPage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`
                    flex items-center gap-3 rounded-lg w-full text-left transition-all duration-150 mb-2
                    ${sidebarCollapsed ? 'px-0 py-3 justify-center' : 'px-4 py-3'}
                    ${isActive 
                      ? 'bg-amber-500 text-white font-medium shadow-md' 
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }
                  `}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-amber-600'}`} />
                  {!sidebarCollapsed && <span className="text-sm font-semibold">{item.label}</span>}
                </button>
              )
            }
            
            // Grupos normales con items y subgrupos
            const isExpanded = expandedGroups.includes(group.label)
            const hasActiveItem = group.items.some(item => currentPage === item.id) ||
              (group.subGroups?.some(sg => sg.items.some(item => currentPage === item.id)) ?? false)
            
            return (
              <div key={group.label} className="mb-1">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  title={sidebarCollapsed ? group.label : undefined}
                  className={`
                    flex items-center justify-between rounded-lg w-full text-left transition-all duration-150
                    ${sidebarCollapsed ? 'px-0 py-2 justify-center' : 'px-3 py-2'}
                    ${hasActiveItem 
                      ? 'bg-amber-50 text-amber-700' 
                      : 'text-stone-600 hover:bg-stone-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    {group.icon && <group.icon className={`w-4 h-4 flex-shrink-0 ${hasActiveItem ? 'text-amber-600' : ''}`} />}
                    {!sidebarCollapsed && <span className="text-xs font-semibold uppercase tracking-wider">{group.label}</span>}
                  </div>
                  {!sidebarCollapsed && (isExpanded ? (
                    <ChevronDown className={`w-4 h-4 ${hasActiveItem ? 'text-amber-500' : 'text-stone-400'}`} />
                  ) : (
                    <ChevronRight className={`w-4 h-4 ${hasActiveItem ? 'text-amber-500' : 'text-stone-400'}`} />
                  ))}
                </button>
                
                {/* Group Items */}
                {isExpanded && (
                  <div className="ml-2 mt-1 space-y-0.5 border-l-2 border-stone-100 pl-2">
                    {group.items.map((item) => {
                      const isActive = currentPage === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => setCurrentPage(item.id)}
                          title={sidebarCollapsed ? item.label : undefined}
                          className={`
                            flex items-center gap-3 rounded-lg transition-all duration-150 w-full text-left
                            ${sidebarCollapsed ? 'px-0 py-2 justify-center' : 'px-3 py-2'}
                            ${isActive 
                              ? 'bg-amber-100 text-amber-800 font-medium shadow-sm' 
                              : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
                            }
                          `}
                        >
                          <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-600' : ''}`} />
                          {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
                        </button>
                      )
                    })}
                    
                    {/* SubGroups */}
                    {group.subGroups?.map((subGroup) => {
                      const subKey = `${group.label}-${subGroup.label}`
                      const isSubExpanded = expandedSubGroups.includes(subKey)
                      const hasActiveSubItem = subGroup.items.some(item => currentPage === item.id)
                      
                      return (
                        <div key={subGroup.label} className="mt-1">
                          {/* SubGroup Header */}
                          <button
                            onClick={() => toggleSubGroup(group.label, subGroup.label)}
                            title={sidebarCollapsed ? subGroup.label : undefined}
                            className={`
                              flex items-center justify-between rounded w-full text-left
                              transition-all duration-150
                              ${sidebarCollapsed ? 'px-0 py-1.5 justify-center' : 'px-3 py-1.5'}
                              ${hasActiveSubItem 
                                ? 'text-amber-600' 
                                : 'text-stone-500 hover:text-stone-700'
                              }
                            `}
                          >
                            {!sidebarCollapsed && <span className="text-xs font-medium">{subGroup.label}</span>}
                            {!sidebarCollapsed && (isSubExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            ))}
                          </button>
                          
                          {/* SubGroup Items */}
                          {isSubExpanded && (
                            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-stone-200 pl-2">
                              {subGroup.items.map((item) => {
                                const isActive = currentPage === item.id
                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => setCurrentPage(item.id)}
                                    title={sidebarCollapsed ? item.label : undefined}
                                    className={`
                                      flex items-center gap-2 rounded w-full text-left
                                      transition-all duration-150
                                      ${sidebarCollapsed ? 'px-0 py-1.5 justify-center' : 'px-2 py-1.5'}
                                      ${isActive 
                                        ? 'bg-amber-50 text-amber-700 font-medium' 
                                        : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'
                                      }
                                    `}
                                  >
                                    <item.icon className={`w-3 h-3 flex-shrink-0 ${isActive ? 'text-amber-500' : ''}`} />
                                    {!sidebarCollapsed && <span className="text-xs">{item.label}</span>}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t bg-stone-50 ${sidebarCollapsed ? 'px-2 text-center' : ''}`}>
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2'} text-xs text-stone-500`}>
            <Beef className="w-4 h-4 text-amber-500 flex-shrink-0" />
            {!sidebarCollapsed && <span>Frigorífico Solemar Alimentaria</span>}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {renderPage()}
      </main>
    </div>
  )
}
