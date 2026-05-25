'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  Loader2, Plus, Search, Trash, Package, AlertTriangle,
  Edit, TrendingDown, TrendingUp, Box, History, Printer,
  ArrowUpDown, BarChart3, Calendar, ArrowRightLeft, FileText,
  DollarSign, ShoppingCart, Activity, Layers, ChevronDown, ChevronUp
} from 'lucide-react'

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Insumo {
  id: string
  codigo: string
  nombre: string
  categoria: string
  subcategoria: string | null
  unidadMedida: string
  stockActual: number
  stockMinimo: number
  stockMaximo: number | null
  puntoReposicion: number | null
  proveedorNombre: string | null
  codigoProveedor: string | null
  precioUnitario: number | null
  moneda: string
  ubicacion: string | null
  activo: boolean
  observaciones: string | null
}

interface HistorialPrecio {
  id: string
  insumoId: string
  insumo: { nombre: string; codigo: string }
  precioAnterior: number
  precioNuevo: number
  moneda: string
  motivo: string | null
  operador: { nombre: string }
  fecha: string
}

interface Movimiento {
  id: string
  tipo: string
  cantidad: number
  precioUnitario: number | null
  costoTotal: number | null
  depositoOrigen: { nombre: string } | null
  depositoDestino: { nombre: string } | null
  operador: { nombre: string }
  fecha: string
  observaciones: string | null
  documentoTipo: string | null
  documentoNumero: string | null
}

interface Consumo {
  id: string
  insumoId: string
  insumo: { nombre: string; codigo: string }
  cantidad: number
  fecha: string
  centroCosto?: string
}

interface ResumenReporte {
  totalInsumos: number
  alertas: number
  valorTotal: number
}

interface Props {
  operador: Operador
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { value: 'EMBALAJE', label: 'Embalaje' },
  { value: 'ETIQUETAS', label: 'Etiquetas' },
  { value: 'HIGIENE', label: 'Higiene y Limpieza' },
  { value: 'PROTECCION', label: 'Proteccion (EPP)' },
  { value: 'HERRAMIENTAS', label: 'Herramientas' },
  { value: 'OFICINA', label: 'Oficina' },
  { value: 'OTROS', label: 'Otros' }
]

const UNIDADES = [
  { value: 'UN', label: 'Unidad (UN)' },
  { value: 'KG', label: 'Kilogramo (KG)' },
  { value: 'L', label: 'Litro (L)' },
  { value: 'M', label: 'Metro (M)' },
  { value: 'ROLLO', label: 'Rollo' },
  { value: 'CAJA', label: 'Caja' }
]

const MONEDAS = [
  { value: 'ARS', label: 'ARS' },
  { value: 'USD', label: 'USD' }
]

const formatCurrency = (value: number, moneda: string = 'ARS') => {
  return `${moneda} ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InsumosModule({ operador }: Props) {
  // ── Existing State ──
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(true)
  const [alertas, setAlertas] = useState<{ id: string; nombre: string; stockActual: number; stockMinimo: number }[]>([])
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Insumo | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria: 'EMBALAJE',
    subcategoria: '',
    unidadMedida: 'UN',
    stockActual: '',
    stockMinimo: '',
    stockMaximo: '',
    puntoReposicion: '',
    proveedorNombre: '',
    codigoProveedor: '',
    precioUnitario: '',
    moneda: 'ARS',
    ubicacion: '',
    observaciones: ''
  })

  // ── Feature 1: Valorizado State ──
  const [resumenReporte, setResumenReporte] = useState<ResumenReporte | null>(null)
  const [resumenLoading, setResumenLoading] = useState(false)

  // ── Feature 2: Historial State ──
  const [historialOpen, setHistorialOpen] = useState(false)
  const [historialData, setHistorialData] = useState<HistorialPrecio[]>([])
  const [historialLoading, setHistorialLoading] = useState(false)
  const [historialInsumo, setHistorialInsumo] = useState<Insumo | null>(null)

  // ── Feature 3: Imprimir State ──
  const [imprimirOpen, setImprimirOpen] = useState(false)
  const imprimirRef = useRef<HTMLDivElement>(null)

  // ── Feature 4: Kardex State ──
  const [kardexOpen, setKardexOpen] = useState(false)
  const [kardexData, setKardexData] = useState<Movimiento[]>([])
  const [kardexLoading, setKardexLoading] = useState(false)
  const [kardexInsumo, setKardexInsumo] = useState<Insumo | null>(null)
  const [kardexFechaDesde, setKardexFechaDesde] = useState('')
  const [kardexFechaHasta, setKardexFechaHasta] = useState('')

  // ── Feature 5: Dashboard State ──
  const [dashboardTab, setDashboardTab] = useState('general')
  const [topConsumos, setTopConsumos] = useState<Consumo[]>([])
  const [ultimosMovimientos, setUltimosMovimientos] = useState<Movimiento[]>([])
  const [dashboardLoading, setDashboardLoading] = useState(false)

  // ── Effects ──
  useEffect(() => {
    fetchInsumos()
    fetchResumen()
  }, [])

  // ── Feature 1: Fetch Resumen ──
  const fetchResumen = async () => {
    setResumenLoading(true)
    try {
      const res = await fetch('/api/reportes/insumos')
      const data = await res.json()
      if (data.success) {
        setResumenReporte(data.data.resumen)
      }
    } catch (error) {
      console.error('Error cargando resumen:', error)
    } finally {
      setResumenLoading(false)
    }
  }

  // ── Existing: Fetch Insumos ──
  const fetchInsumos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/insumos')
      const data = await res.json()

      if (data.success) {
        setInsumos(data.data)
        const alertasStock = data.data.filter((i: Insumo) =>
          i.activo && i.stockActual <= i.stockMinimo
        )
        setAlertas(alertasStock)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar insumos')
    } finally {
      setLoading(false)
    }
  }

  // ── Feature 2: Fetch Historial ──
  const fetchHistorial = async (insumoId: string, insumo: Insumo) => {
    setHistorialInsumo(insumo)
    setHistorialLoading(true)
    setHistorialOpen(true)
    setHistorialData([])
    try {
      const res = await fetch(`/api/historial-precios-insumos?insumoId=${insumoId}`)
      const data = await res.json()
      if (data.success) {
        setHistorialData(data.data)
      } else {
        toast.error('Error al cargar historial de precios')
      }
    } catch {
      toast.error('Error de conexión al cargar historial')
    } finally {
      setHistorialLoading(false)
    }
  }

  // ── Feature 4: Fetch Kardex ──
  const fetchKardex = async (insumoId: string, insumo: Insumo) => {
    setKardexInsumo(insumo)
    setKardexLoading(true)
    setKardexOpen(true)
    setKardexData([])
    try {
      let url = `/api/movimientos-insumos?insumoId=${insumoId}&limit=100`
      if (kardexFechaDesde) url += `&desde=${kardexFechaDesde}`
      if (kardexFechaHasta) url += `&hasta=${kardexFechaHasta}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setKardexData(data.data)
      } else {
        toast.error('Error al cargar kardex')
      }
    } catch {
      toast.error('Error de conexión al cargar kardex')
    } finally {
      setKardexLoading(false)
    }
  }

  const refetchKardex = () => {
    if (kardexInsumo) {
      fetchKardex(kardexInsumo.id, kardexInsumo)
    }
  }

  // ── Feature 5: Fetch Dashboard ──
  const fetchDashboard = async () => {
    setDashboardLoading(true)
    try {
      const desde = new Date()
      desde.setDate(desde.getDate() - 30)
      const desdeStr = desde.toISOString().split('T')[0]
      const hoyStr = new Date().toISOString().split('T')[0]

      const activos = insumos.filter(i => i.activo)

      // Fetch consumos for top 5
      const consumoPromises = activos.slice(0, 20).map(async (insumo) => {
        try {
          const res = await fetch(`/api/consumos-insumo?insumoId=${insumo.id}&desde=${desdeStr}&hasta=${hoyStr}`)
          const data = await res.json()
          if (data.success && data.data.length > 0) {
            const total = data.data.reduce((acc: number, c: Consumo) => acc + (c.cantidad || 0), 0)
            return { ...data.data[0], totalConsumido: total, insumo: { nombre: insumo.nombre, codigo: insumo.codigo } }
          }
          return null
        } catch {
          return null
        }
      })

      const consumosResults = await Promise.all(consumoPromises)
      const validConsumos = consumosResults.filter((c): c is Consumo & { totalConsumido: number } => c !== null && c.totalConsumido > 0)
      validConsumos.sort((a, b) => (b.totalConsumido || 0) - (a.totalConsumido || 0))
      setTopConsumos(validConsumos.slice(0, 5))

      // Fetch last 10 movements from multiple insumos
      const movPromises = activos.slice(0, 10).map(async (insumo) => {
        try {
          const res = await fetch(`/api/movimientos-insumos?insumoId=${insumo.id}&limit=5`)
          const data = await res.json()
          if (data.success && data.data.length > 0) {
            return data.data.map((m: Movimiento) => ({
              ...m,
              insumoNombre: insumo.nombre,
              insumoCodigo: insumo.codigo
            }))
          }
          return []
        } catch {
          return []
        }
      })

      const movResults = await Promise.all(movPromises)
      const allMovs = movResults.flat().sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      setUltimosMovimientos(allMovs.slice(0, 10))
    } catch (error) {
      console.error('Error cargando dashboard:', error)
    } finally {
      setDashboardLoading(false)
    }
  }

  // ── Existing: Handle Guardar ──
  const handleGuardar = async () => {
    if (!formData.codigo || !formData.nombre) {
      toast.error('Complete código y nombre')
      return
    }
    if (!formData.categoria) {
      toast.error('Seleccione una categoría')
      return
    }

    setGuardando(true)
    try {
      const payload = {
        codigo: formData.codigo.trim(),
        nombre: formData.nombre.trim(),
        categoria: formData.categoria,
        subcategoria: formData.subcategoria.trim() || null,
        unidadMedida: formData.unidadMedida,
        stockActual: parseFloat(formData.stockActual) || 0,
        stockMinimo: parseFloat(formData.stockMinimo) || 0,
        stockMaximo: formData.stockMaximo ? parseFloat(formData.stockMaximo) : null,
        puntoReposicion: formData.puntoReposicion ? parseFloat(formData.puntoReposicion) : null,
        proveedorNombre: formData.proveedorNombre.trim() || null,
        codigoProveedor: formData.codigoProveedor.trim() || null,
        precioUnitario: formData.precioUnitario ? parseFloat(formData.precioUnitario) : null,
        moneda: formData.moneda,
        ubicacion: formData.ubicacion.trim() || null,
        observaciones: formData.observaciones.trim() || null,
      }

      if (editando) {
        const res = await fetch('/api/insumos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editando.id, ...payload })
        })
        const data = await res.json()
        if (data.success) {
          toast.success('Insumo actualizado')
          fetchInsumos()
          fetchResumen()
        } else {
          toast.error(data.error || 'Error al actualizar')
        }
      } else {
        const res = await fetch('/api/insumos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (data.success) {
          toast.success('Insumo creado')
          fetchInsumos()
          fetchResumen()
        } else {
          toast.error(data.error || 'Error al crear')
        }
      }

      setModalOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setGuardando(false)
    }
  }

  // ── Existing: Handle Editar ──
  const handleEditar = (insumo: Insumo) => {
    setEditando(insumo)
    setFormData({
      codigo: insumo.codigo,
      nombre: insumo.nombre,
      categoria: insumo.categoria,
      subcategoria: insumo.subcategoria || '',
      unidadMedida: insumo.unidadMedida,
      stockActual: insumo.stockActual.toString(),
      stockMinimo: insumo.stockMinimo.toString(),
      stockMaximo: insumo.stockMaximo?.toString() || '',
      puntoReposicion: insumo.puntoReposicion?.toString() || '',
      proveedorNombre: insumo.proveedorNombre || '',
      codigoProveedor: insumo.codigoProveedor || '',
      precioUnitario: insumo.precioUnitario?.toString() || '',
      moneda: insumo.moneda || 'ARS',
      ubicacion: insumo.ubicacion || '',
      observaciones: insumo.observaciones || ''
    })
    setModalOpen(true)
  }

  // ── Existing: Handle Eliminar ──
  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este insumo?')) return

    try {
      const res = await fetch(`/api/insumos?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Insumo eliminado')
        fetchInsumos()
        fetchResumen()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error al eliminar')
    }
  }

  // ── Existing: Handle Toggle Activo ──
  const handleToggleActivo = async (insumo: Insumo) => {
    try {
      const res = await fetch('/api/insumos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: insumo.id,
          activo: !insumo.activo
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(insumo.activo ? 'Insumo desactivado' : 'Insumo activado')
        fetchInsumos()
        fetchResumen()
      } else {
        toast.error(data.error || 'Error al actualizar')
      }
    } catch {
      toast.error('Error al actualizar')
    }
  }

  // ── Existing: Reset Form ──
  const resetForm = () => {
    setEditando(null)
    setFormData({
      codigo: '',
      nombre: '',
      categoria: 'EMBALAJE',
      subcategoria: '',
      unidadMedida: 'UN',
      stockActual: '',
      stockMinimo: '',
      stockMaximo: '',
      puntoReposicion: '',
      proveedorNombre: '',
      codigoProveedor: '',
      precioUnitario: '',
      moneda: 'ARS',
      ubicacion: '',
      observaciones: ''
    })
  }

  // ── Feature 3: Handle Imprimir ──
  const handleImprimir = () => {
    setImprimirOpen(true)
  }

  const ejecutarImpresion = () => {
    window.print()
  }

  // ── Computed Values ──
  const insumosFiltrados = insumos.filter(i => {
    if (filtroCategoria !== 'todos' && i.categoria !== filtroCategoria) return false
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase()
      return (
        i.codigo.toLowerCase().includes(busquedaLower) ||
        i.nombre.toLowerCase().includes(busquedaLower) ||
        (i.proveedorNombre || '').toLowerCase().includes(busquedaLower)
      )
    }
    return true
  })

  const totalInsumos = insumos.filter(i => i.activo).length
  const insumosAlerta = alertas.length

  const getCategoriaBadge = (categoria: string) => {
    const colores: Record<string, string> = {
      EMBALAJE: 'bg-blue-100 text-blue-700',
      ETIQUETAS: 'bg-purple-100 text-purple-700',
      LIMPIEZA: 'bg-cyan-100 text-cyan-700',
      EPP: 'bg-orange-100 text-orange-700',
      REPUESTOS: 'bg-amber-100 text-amber-700',
      OTRO: 'bg-gray-100 text-gray-700'
    }
    return colores[categoria] || 'bg-gray-100 text-gray-700'
  }

  // ── Feature 1: Valorizado calculations ──
  const valorizadoTotal = useMemo(() => {
    return insumos
      .filter(i => i.activo)
      .reduce((acc, i) => acc + (i.stockActual * (i.precioUnitario || 0)), 0)
  }, [insumos])

  const categoriasCount = useMemo(() => {
    const counts: Record<string, number> = {}
    insumos.filter(i => i.activo).forEach(i => {
      counts[i.categoria] = (counts[i.categoria] || 0) + 1
    })
    return counts
  }, [insumos])

  // ── Feature 4: Kardex running balance ──
  const kardexConBalance = useMemo(() => {
    if (!kardexData.length || !kardexInsumo) return []
    const sorted = [...kardexData].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    let balance = kardexInsumo.stockActual
    // Calculate total deltas going backwards, then re-apply forward
    // Instead, we go forward and accumulate from 0, then adjust
    let runningBalance = 0
    return sorted.map((mov) => {
      const delta = mov.tipo === 'EGRESO' || mov.tipo === 'SALIDA' ? -Math.abs(mov.cantidad) : Math.abs(mov.cantidad)
      runningBalance += delta
      return { ...mov, balance: runningBalance }
    })
  }, [kardexData, kardexInsumo])

  // ── Feature 3: Print data grouped by category ──
  const printData = useMemo(() => {
    const activos = insumos.filter(i => i.activo)
    const grouped: Record<string, Insumo[]> = {}
    activos.forEach(i => {
      const cat = i.categoria || 'OTROS'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(i)
    })
    return grouped
  }, [insumos])

  const printTotalValorizado = useMemo(() => {
    return insumos
      .filter(i => i.activo)
      .reduce((acc, i) => acc + (i.stockActual * (i.precioUnitario || 0)), 0)
  }, [insumos])

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Box className="w-8 h-8 text-amber-500" />
              Insumos
            </h1>
            <p className="text-stone-500 mt-1">Gestión de insumos y materiales</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleImprimir}
              className="border-stone-300 text-stone-700 hover:bg-stone-50"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Stock
            </Button>
            <Button
              onClick={() => { resetForm(); setModalOpen(true); }}
              className="bg-amber-500 hover:bg-amber-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Insumo
            </Button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            FEATURE 1: VALORIZADO DEL STOCK - Summary Cards
        ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium text-stone-500 uppercase">Total Insumos</span>
              </div>
              {resumenLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-stone-800">{resumenReporte?.totalInsumos ?? totalInsumos}</p>
                  <p className="text-xs text-stone-400">items activos</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-stone-500 uppercase">Valorizado Total</span>
              </div>
              {resumenLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-stone-800">
                    {(resumenReporte?.valorTotal ?? valorizadoTotal).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-stone-400">en stock</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium text-stone-500 uppercase">Stock Bajo</span>
              </div>
              {resumenLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-red-600">{resumenReporte?.alertas ?? insumosAlerta}</p>
                  <p className="text-xs text-stone-400">alertas activas</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium text-stone-500 uppercase">Categorías</span>
              </div>
              <p className="text-2xl font-bold text-stone-800">{Object.keys(categoriasCount).length}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(categoriasCount).slice(0, 3).map(([cat, count]) => (
                  <Badge key={cat} className={`text-[10px] px-1 py-0 ${getCategoriaBadge(cat)}`}>
                    {count}
                  </Badge>
                ))}
                {Object.keys(categoriasCount).length > 3 && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    +{Object.keys(categoriasCount).length - 3}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category breakdown cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {CATEGORIAS.map(cat => {
            const count = categoriasCount[cat.value] || 0
            return (
              <Card key={cat.value} className="border-0 shadow-sm">
                <CardContent className="p-3 text-center">
                  <Badge className={`${getCategoriaBadge(cat.value)} text-xs`}>{cat.label}</Badge>
                  <p className="text-xl font-bold mt-1 text-stone-700">{count}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* ── Alertas de stock bajo ── */}
        {alertas.length > 0 && (
          <Card className="border-0 shadow-md mb-6 border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Alertas de Stock Bajo ({alertas.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {alertas.map(a => (
                  <Badge key={a.id} variant="outline" className="border-red-300 text-red-600">
                    {a.nombre}: {a.stockActual} / {a.stockMinimo}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            FEATURE 5: DASHBOARD SECTION
        ══════════════════════════════════════════════════════════════════ */}
        <Card className="border-0 shadow-md mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-500" />
                  Dashboard
                </CardTitle>
                <CardDescription className="mt-1">Actividad reciente y estadísticas</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDashboard}
                disabled={dashboardLoading}
                className="border-stone-300"
              >
                {dashboardLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUpDown className="w-4 h-4" />
                )}
                <span className="ml-1">Actualizar</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={dashboardTab} onValueChange={setDashboardTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="consumos">
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Más Consumidos
                </TabsTrigger>
                <TabsTrigger value="movimientos">
                  <ArrowRightLeft className="w-4 h-4 mr-1" />
                  Últimos Movimientos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="consumos">
                {dashboardLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  </div>
                ) : topConsumos.length === 0 ? (
                  <div className="text-center py-8 text-stone-400">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No hay datos de consumo en los últimos 30 días</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-stone-200">
                          <th className="px-3 py-2 text-left font-medium text-stone-500">#</th>
                          <th className="px-3 py-2 text-left font-medium text-stone-500">Código</th>
                          <th className="px-3 py-2 text-left font-medium text-stone-500">Insumo</th>
                          <th className="px-3 py-2 text-right font-medium text-stone-500">Cantidad Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {topConsumos.map((c, idx) => (
                          <tr key={c.id} className="hover:bg-stone-50">
                            <td className="px-3 py-2">
                              <Badge variant="outline" className="text-xs">
                                {idx + 1}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">{c.insumo?.codigo || '-'}</td>
                            <td className="px-3 py-2 font-medium">{c.insumo?.nombre || '-'}</td>
                            <td className="px-3 py-2 text-right font-bold text-amber-700">
                              {(c as unknown as { totalConsumido: number }).totalConsumido.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="movimientos">
                {dashboardLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  </div>
                ) : ultimosMovimientos.length === 0 ? (
                  <div className="text-center py-8 text-stone-400">
                    <ArrowRightLeft className="w-12 h-12 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No hay movimientos registrados</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b border-stone-200">
                          <th className="px-3 py-2 text-left font-medium text-stone-500">Fecha</th>
                          <th className="px-3 py-2 text-left font-medium text-stone-500">Insumo</th>
                          <th className="px-3 py-2 text-left font-medium text-stone-500">Tipo</th>
                          <th className="px-3 py-2 text-right font-medium text-stone-500">Cantidad</th>
                          <th className="px-3 py-2 text-left font-medium text-stone-500">Depósito</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {ultimosMovimientos.map((mov) => {
                          const movExt = mov as unknown as Movimiento & { insumoNombre: string; insumoCodigo: string }
                          const isEgreso = mov.tipo === 'EGRESO' || mov.tipo === 'SALIDA'
                          return (
                            <tr key={mov.id} className="hover:bg-stone-50">
                              <td className="px-3 py-2 text-xs text-stone-600">{formatDateTime(mov.fecha)}</td>
                              <td className="px-3 py-2">
                                <span className="font-medium">{movExt.insumoNombre || '-'}</span>
                                <p className="text-xs text-stone-400 font-mono">{movExt.insumoCodigo}</p>
                              </td>
                              <td className="px-3 py-2">
                                <Badge
                                  className={`text-xs ${isEgreso
                                    ? 'bg-red-100 text-red-700'
                                    : mov.tipo === 'TRANSFERENCIA'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-green-100 text-green-700'
                                    }`}
                                >
                                  {mov.tipo}
                                </Badge>
                              </td>
                              <td className={`px-3 py-2 text-right font-bold ${isEgreso ? 'text-red-600' : 'text-green-600'}`}>
                                {isEgreso ? '-' : '+'}{mov.cantidad.toLocaleString('es-AR')}
                              </td>
                              <td className="px-3 py-2 text-xs text-stone-500">
                                {mov.depositoDestino?.nombre || mov.depositoOrigen?.nombre || '-'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* ── Filtros ── */}
        <Card className="border-0 shadow-md mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    placeholder="Buscar por código, nombre o proveedor..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las categorías</SelectItem>
                  {CATEGORIAS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════════════════════════
            TABLE - with Historial and Kardex buttons (Feature 2 & 4)
        ══════════════════════════════════════════════════════════════════ */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Insumos ({insumosFiltrados.length})</span>
              <span className="text-sm font-normal text-stone-500">Total activos: {totalInsumos}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : insumosFiltrados.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No hay insumos registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">Nombre</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">Categoría</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-stone-500 uppercase">Unidad</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-stone-500 uppercase">Stock</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-stone-500 uppercase">Mínimo</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 uppercase">Precio</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {insumosFiltrados.map((insumo) => (
                      <tr key={insumo.id} className={`hover:bg-stone-50 ${!insumo.activo ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3">
                          <span className="font-mono font-medium">{insumo.codigo}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">{insumo.nombre}</span>
                          {insumo.proveedorNombre && (
                            <p className="text-xs text-stone-400">{insumo.proveedorNombre}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getCategoriaBadge(insumo.categoria)}>
                            {CATEGORIAS.find(c => c.value === insumo.categoria)?.label || insumo.categoria}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center text-stone-600">{insumo.unidadMedida}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold ${insumo.stockActual <= insumo.stockMinimo ? 'text-red-500' : 'text-stone-700'}`}>
                            {insumo.stockActual}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-stone-500">{insumo.stockMinimo}</td>
                        <td className="px-4 py-3 text-right text-stone-600">
                          {insumo.precioUnitario
                            ? `${insumo.moneda} ${insumo.precioUnitario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                            : '-'
                          }
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {/* Feature 2: Historial Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => fetchHistorial(insumo.id, insumo)}
                              title="Historial de Precios"
                            >
                              <History className="w-4 h-4 text-stone-500" />
                            </Button>
                            {/* Feature 4: Kardex Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => fetchKardex(insumo.id, insumo)}
                              title="Kardex de Movimientos"
                            >
                              <FileText className="w-4 h-4 text-stone-500" />
                            </Button>
                            {/* Existing: Edit */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditar(insumo)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {/* Existing: Toggle Activo */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActivo(insumo)}
                              title={insumo.activo ? 'Desactivar' : 'Activar'}
                            >
                              {insumo.activo
                                ? <Package className="w-4 h-4 text-stone-400" />
                                : <Package className="w-4 h-4 text-green-500" />
                              }
                            </Button>
                            {/* Existing: Delete */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEliminar(insumo.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════════════════════════
            MODAL: Nuevo/Editar Insumo (Existing)
        ══════════════════════════════════════════════════════════════════ */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" maximizable>
            <DialogHeader>
              <DialogTitle>
                {editando ? 'Editar Insumo' : 'Nuevo Insumo'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Fila 1: Código y Nombre */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    placeholder="BOL001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Bolsa vacía 10kg"
                  />
                </div>
              </div>

              {/* Fila 2: Categoría y Unidad */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(v) => setFormData({ ...formData, categoria: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unidad de Medida</Label>
                  <Select
                    value={formData.unidadMedida}
                    onValueChange={(v) => setFormData({ ...formData, unidadMedida: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNIDADES.map(u => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fila 3: Subcategoría */}
              <div className="space-y-2">
                <Label>Subcategoría</Label>
                <Input
                  value={formData.subcategoria}
                  onChange={(e) => setFormData({ ...formData, subcategoria: e.target.value })}
                  placeholder="Ej: Bolsas de camara, Bolsas de consigna..."
                />
              </div>

              {/* Fila 4: Stock */}
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Stock Actual</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.stockActual}
                    onChange={(e) => setFormData({ ...formData, stockActual: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock Mínimo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.stockMinimo}
                    onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock Máximo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.stockMaximo}
                    onChange={(e) => setFormData({ ...formData, stockMaximo: e.target.value })}
                    placeholder="Opcional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Punto Reposición</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.puntoReposicion}
                    onChange={(e) => setFormData({ ...formData, puntoReposicion: e.target.value })}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              {/* Fila 5: Precio */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Precio Unitario</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.precioUnitario}
                    onChange={(e) => setFormData({ ...formData, precioUnitario: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <Select
                    value={formData.moneda}
                    onValueChange={(v) => setFormData({ ...formData, moneda: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONEDAS.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fila 6: Proveedor */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Input
                    value={formData.proveedorNombre}
                    onChange={(e) => setFormData({ ...formData, proveedorNombre: e.target.value })}
                    placeholder="Nombre del proveedor"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Código Proveedor</Label>
                  <Input
                    value={formData.codigoProveedor}
                    onChange={(e) => setFormData({ ...formData, codigoProveedor: e.target.value })}
                    placeholder="Código interno del proveedor"
                  />
                </div>
              </div>

              {/* Fila 7: Ubicación y Observaciones */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ubicación</Label>
                  <Input
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    placeholder="Depósito, estantería..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Observaciones</Label>
                  <Input
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    placeholder="Notas adicionales"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleGuardar}
                disabled={guardando}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {guardando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Guardar'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ══════════════════════════════════════════════════════════════════
            FEATURE 2: HISTORIAL DE PRECIOS Dialog
        ══════════════════════════════════════════════════════════════════ */}
        <Dialog open={historialOpen} onOpenChange={setHistorialOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" maximizable>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                Historial de Precios
              </DialogTitle>
              {historialInsumo && (
                <p className="text-sm text-stone-500 mt-1">
                  {historialInsumo.codigo} — {historialInsumo.nombre}
                </p>
              )}
            </DialogHeader>

            {historialLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : historialData.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <History className="w-16 h-16 mx-auto mb-4 opacity-40" />
                <p>No hay historial de precios para este insumo</p>
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-stone-500">Fecha</th>
                      <th className="px-4 py-3 text-right font-medium text-stone-500">Precio Anterior</th>
                      <th className="px-4 py-3 text-right font-medium text-stone-500">Precio Nuevo</th>
                      <th className="px-4 py-3 text-center font-medium text-stone-500">Variación</th>
                      <th className="px-4 py-3 text-left font-medium text-stone-500">Moneda</th>
                      <th className="px-4 py-3 text-left font-medium text-stone-500">Motivo</th>
                      <th className="px-4 py-3 text-left font-medium text-stone-500">Operador</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {historialData.map((h) => {
                      const precioAnt = h.precioAnterior || 0
                      const precioNuevo = h.precioNuevo || 0
                      const variacion = precioAnt > 0 ? ((precioNuevo - precioAnt) / precioAnt) * 100 : 0
                      const sube = variacion > 0
                      const baja = variacion < 0
                      return (
                        <tr key={h.id} className="hover:bg-stone-50">
                          <td className="px-4 py-3 text-stone-600">{formatDateTime(h.fecha)}</td>
                          <td className="px-4 py-3 text-right font-mono text-stone-600">
                            {precioAnt.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-stone-800">
                            {precioNuevo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              className={`text-xs ${sube
                                ? 'bg-green-100 text-green-700'
                                : baja
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-stone-100 text-stone-600'
                                }`}
                            >
                              {sube && <TrendingUp className="w-3 h-3 mr-1" />}
                              {baja && <TrendingDown className="w-3 h-3 mr-1" />}
                              {variacion === 0 ? '0%' : `${variacion > 0 ? '+' : ''}${variacion.toFixed(1)}%`}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-stone-500">{h.moneda}</td>
                          <td className="px-4 py-3 text-stone-500 text-xs max-w-[120px] truncate">
                            {h.motivo || '-'}
                          </td>
                          <td className="px-4 py-3 text-stone-500">{h.operador?.nombre || '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ══════════════════════════════════════════════════════════════════
            FEATURE 4: KARDEX Dialog
        ══════════════════════════════════════════════════════════════════ */}
        <Dialog open={kardexOpen} onOpenChange={setKardexOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" maximizable>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                Kardex de Movimientos
              </DialogTitle>
              {kardexInsumo && (
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-stone-500">
                    <span className="font-mono font-bold">{kardexInsumo.codigo}</span> — {kardexInsumo.nombre}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Stock actual: <span className="font-bold ml-1">{kardexInsumo.stockActual}</span>
                  </Badge>
                </div>
              )}
            </DialogHeader>

            {/* Date range filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 pb-2">
              <div className="space-y-1">
                <Label className="text-xs text-stone-500">Desde</Label>
                <Input
                  type="date"
                  value={kardexFechaDesde}
                  onChange={(e) => setKardexFechaDesde(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-stone-500">Hasta</Label>
                <Input
                  type="date"
                  value={kardexFechaHasta}
                  onChange={(e) => setKardexFechaHasta(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refetchKardex}
                disabled={kardexLoading}
                className="border-stone-300"
              >
                {kardexLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpDown className="w-4 h-4" />}
                <span className="ml-1">Filtrar</span>
              </Button>
            </div>

            <Separator />

            {kardexLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : kardexData.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-40" />
                <p>No hay movimientos registrados para este insumo</p>
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white border-b">
                    <tr>
                      <th className="px-3 py-3 text-left font-medium text-stone-500">Fecha</th>
                      <th className="px-3 py-3 text-left font-medium text-stone-500">Tipo</th>
                      <th className="px-3 py-3 text-right font-medium text-stone-500">Cantidad</th>
                      <th className="px-3 py-3 text-right font-medium text-stone-500">Saldo</th>
                      <th className="px-3 py-3 text-left font-medium text-stone-500">Origen/Destino</th>
                      <th className="px-3 py-3 text-right font-medium text-stone-500">P.U.</th>
                      <th className="px-3 py-3 text-right font-medium text-stone-500">Costo Total</th>
                      <th className="px-3 py-3 text-left font-medium text-stone-500">Documento</th>
                      <th className="px-3 py-3 text-left font-medium text-stone-500">Operador</th>
                      <th className="px-3 py-3 text-left font-medium text-stone-500">Obs.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {kardexConBalance.map((mov) => {
                      const isEgreso = mov.tipo === 'EGRESO' || mov.tipo === 'SALIDA'
                      const isTransferencia = mov.tipo === 'TRANSFERENCIA'
                      return (
                        <tr key={mov.id} className="hover:bg-stone-50">
                          <td className="px-3 py-2 text-xs text-stone-600 whitespace-nowrap">
                            {formatDateTime(mov.fecha)}
                          </td>
                          <td className="px-3 py-2">
                            <Badge
                              className={`text-xs ${isEgreso
                                ? 'bg-red-100 text-red-700'
                                : isTransferencia
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-green-100 text-green-700'
                                }`}
                            >
                              {mov.tipo}
                            </Badge>
                          </td>
                          <td className={`px-3 py-2 text-right font-bold whitespace-nowrap ${isEgreso ? 'text-red-600' : 'text-green-600'}`}>
                            {isEgreso ? '-' : '+'}{mov.cantidad.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-medium text-stone-700 whitespace-nowrap">
                            {(mov as unknown as { balance: number }).balance.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2 text-xs text-stone-500 max-w-[100px] truncate">
                            {mov.depositoDestino?.nombre || mov.depositoOrigen?.nombre || '-'}
                          </td>
                          <td className="px-3 py-2 text-right text-stone-500 whitespace-nowrap">
                            {mov.precioUnitario != null
                              ? mov.precioUnitario.toLocaleString('es-AR', { minimumFractionDigits: 2 })
                              : '-'}
                          </td>
                          <td className="px-3 py-2 text-right text-stone-600 whitespace-nowrap">
                            {mov.costoTotal != null
                              ? mov.costoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })
                              : '-'}
                          </td>
                          <td className="px-3 py-2 text-xs text-stone-500 whitespace-nowrap">
                            {mov.documentoTipo && mov.documentoNumero
                              ? `${mov.documentoTipo} ${mov.documentoNumero}`
                              : '-'}
                          </td>
                          <td className="px-3 py-2 text-xs text-stone-500 max-w-[80px] truncate">
                            {mov.operador?.nombre || '-'}
                          </td>
                          <td className="px-3 py-2 text-xs text-stone-400 max-w-[100px] truncate">
                            {mov.observaciones || '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ══════════════════════════════════════════════════════════════════
            FEATURE 3: IMPRIMIR REPORTE Dialog
        ══════════════════════════════════════════════════════════════════ */}
        <Dialog open={imprimirOpen} onOpenChange={setImprimirOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" maximizable>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-500" />
                Reporte de Stock de Insumos
              </DialogTitle>
            </DialogHeader>

            <div className="flex justify-end mb-4 print:hidden">
              <Button onClick={ejecutarImpresion} className="bg-amber-500 hover:bg-amber-600">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </div>

            {/* Print-friendly content */}
            <div ref={imprimirRef} className="print-area bg-white text-black text-xs">
              {/* Header */}
              <div className="text-center mb-6 print:mb-4">
                <h2 className="text-xl font-bold">Reporte de Stock de Insumos</h2>
                <p className="text-sm text-stone-600 mt-1">
                  Fecha: {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  &nbsp;|&nbsp; Generado por: {operador.nombre}
                </p>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6 print:mb-4 print:gap-2">
                <div className="border rounded p-3 print:p-2">
                  <p className="text-xs text-stone-500">Total Insumos</p>
                  <p className="text-lg font-bold">{totalInsumos}</p>
                </div>
                <div className="border rounded p-3 print:p-2">
                  <p className="text-xs text-stone-500">Valorizado Total</p>
                  <p className="text-lg font-bold">
                    {printTotalValorizado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="border rounded p-3 print:p-2">
                  <p className="text-xs text-stone-500">Alertas de Stock Bajo</p>
                  <p className="text-lg font-bold text-red-600">{insumosAlerta}</p>
                </div>
              </div>

              {/* Low stock alert items */}
              {alertas.length > 0 && (
                <div className="mb-6 print:mb-4 p-3 border border-red-200 bg-red-50 rounded print:bg-white">
                  <p className="font-bold text-red-600 mb-2">⚠ Alertas de Stock Bajo:</p>
                  <div className="flex flex-wrap gap-2">
                    {alertas.map(a => (
                      <span key={a.id} className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
                        {a.nombre}: {a.stockActual}/{a.stockMinimo}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Table by category */}
              {Object.entries(printData).map(([categoria, items]) => {
                const catTotal = items.reduce((acc, i) => acc + (i.stockActual * (i.precioUnitario || 0)), 0)
                return (
                  <div key={categoria} className="mb-6 print:mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-sm">
                        {CATEGORIAS.find(c => c.value === categoria)?.label || categoria}
                      </h3>
                      <span className="text-xs text-stone-500">
                        {items.length} items | Valorizado: {catTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <table className="w-full border-collapse text-[11px]">
                      <thead>
                        <tr className="border-b-2 border-stone-300">
                          <th className="text-left px-2 py-1 border-b border-stone-300">Código</th>
                          <th className="text-left px-2 py-1 border-b border-stone-300">Nombre</th>
                          <th className="text-left px-2 py-1 border-b border-stone-300">Categoría</th>
                          <th className="text-center px-2 py-1 border-b border-stone-300">Unidad</th>
                          <th className="text-center px-2 py-1 border-b border-stone-300">Stock</th>
                          <th className="text-center px-2 py-1 border-b border-stone-300">Mínimo</th>
                          <th className="text-right px-2 py-1 border-b border-stone-300">Precio</th>
                          <th className="text-right px-2 py-1 border-b border-stone-300">Valorizado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => {
                          const isLowStock = item.stockActual <= item.stockMinimo
                          const valorizado = item.stockActual * (item.precioUnitario || 0)
                          return (
                            <tr key={item.id} className={`border-b border-stone-100 ${isLowStock ? 'bg-red-50 print:bg-red-50' : ''}`}>
                              <td className="px-2 py-1 font-mono">{item.codigo}</td>
                              <td className="px-2 py-1">{item.nombre}</td>
                              <td className="px-2 py-1">{CATEGORIAS.find(c => c.value === item.categoria)?.label || item.categoria}</td>
                              <td className="px-2 py-1 text-center">{item.unidadMedida}</td>
                              <td className={`px-2 py-1 text-center font-bold ${isLowStock ? 'text-red-600' : ''}`}>
                                {item.stockActual} {isLowStock && '⚠'}
                              </td>
                              <td className="px-2 py-1 text-center">{item.stockMinimo}</td>
                              <td className="px-2 py-1 text-right">
                                {item.precioUnitario
                                  ? `${item.moneda} ${item.precioUnitario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                                  : '-'}
                              </td>
                              <td className="px-2 py-1 text-right font-medium">
                                {valorizado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-stone-300 font-bold">
                          <td colSpan={7} className="px-2 py-1 text-right">Subtotal:</td>
                          <td className="px-2 py-1 text-right">
                            {catTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )
              })}

              {/* Grand total */}
              <div className="border-t-2 border-stone-800 pt-3 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold">TOTAL GENERAL VALORIZADO:</span>
                  <span className="text-lg font-bold">
                    {printTotalValorizado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1 text-right">
                  {totalInsumos} insumos activos | {Object.keys(printData).length} categorías
                </p>
              </div>
            </div>

            <DialogFooter className="print:hidden">
              <Button variant="outline" onClick={() => setImprimirOpen(false)}>
                Cerrar
              </Button>
              <Button onClick={ejecutarImpresion} className="bg-amber-500 hover:bg-amber-600">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Print-only CSS styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          .print-area,
          .print-area * {
            visibility: visible !important;
          }
          .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 10mm !important;
            background: white !important;
            color: black !important;
          }
          .print-area table {
            page-break-inside: auto !important;
          }
          .print-area tr {
            page-break-inside: avoid !important;
          }
        }
      ` }} />
    </div>
  )
}
