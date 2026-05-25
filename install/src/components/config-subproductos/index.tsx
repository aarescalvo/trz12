'use client'

import { useState, useEffect } from 'react'
import { 
  Package, Recycle, Edit, Plus, Save, X, Loader2, 
  Search, Power, Barcode, Settings, Thermometer, 
  TrendingUp, Copy, Eye, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'

const CATEGORIAS = [
  { id: 'MENUDENCIA', label: 'Menudencia', color: 'bg-green-100 text-green-700 border-green-200', destino: ['Mercado Local', 'Exportación', 'Procesamiento Interno'] },
  { id: 'CUERO', label: 'Cuero', color: 'bg-amber-100 text-amber-700 border-amber-200', destino: ['Curtiembre', 'Exportación'] },
  { id: 'GRASA', label: 'Grasa', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', destino: ['Renderizado', 'Mercado Local', 'Exportación'] },
  { id: 'HUESO', label: 'Hueso', color: 'bg-stone-100 text-stone-700 border-stone-200', destino: ['Harina', 'Gelatina', 'Renderizado'] },
  { id: 'VISCERAS', label: 'Vísceras', color: 'bg-purple-100 text-purple-700 border-purple-200', destino: ['Mercado Local', 'Exportación', 'Renderizado'] },
  { id: 'OTRO', label: 'Otro', color: 'bg-gray-100 text-gray-700 border-gray-200', destino: ['Varios'] },
]

const ESPECIES = [
  { id: 'BOVINO', label: 'Bovino' },
  { id: 'EQUINO', label: 'Equino' },
  { id: 'AMBOS', label: 'Ambos' },
]

const UNIDADES_MEDIDA = ['KG', 'UNIDAD', 'LITRO', 'METRO']

interface Subproducto {
  id: string
  codigo: string
  nombre: string
  categoria: string
  especie: string | null
  requiereFrio: boolean
  temperaturaMax: number | null
  unidadMedida: string
  rendimientoPct: number | null
  generaRotulo: boolean
  codigoRotulo: string | null
  precioReferencia: number | null
  activo: boolean
  observaciones: string | null
  createdAt: string
}

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface FormData {
  codigo: string
  nombre: string
  categoria: string
  especie: string
  requiereFrio: boolean
  temperaturaMax: string
  unidadMedida: string
  rendimientoPct: string
  generaRotulo: boolean
  codigoRotulo: string
  precioReferencia: string
  activo: boolean
  observaciones: string
}

interface CodigoBarrasConfig {
  id: string
  tipo: string
  prefijo: string
  formato: string
}

export function ConfigSubproductosModule({ operador }: { operador: Operador }) {
  const [subproductos, setSubproductos] = useState<Subproducto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [subproductoEditando, setSubproductoEditando] = useState<Subproducto | null>(null)
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [subproductoDetalle, setSubproductoDetalle] = useState<Subproducto | null>(null)
  
  // Configuración de código de barras
  const [configCodigos, setConfigCodigos] = useState<CodigoBarrasConfig[]>([])
  const [previewCodigo, setPreviewCodigo] = useState('')
  
  // Filtros
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODOS')
  const [filtroEspecie, setFiltroEspecie] = useState<string>('TODOS')
  const [busqueda, setBusqueda] = useState('')
  
  // Form
  const [formData, setFormData] = useState<FormData>({
    codigo: '',
    nombre: '',
    categoria: 'MENUDENCIA',
    especie: 'AMBOS',
    requiereFrio: true,
    temperaturaMax: '',
    unidadMedida: 'KG',
    rendimientoPct: '',
    generaRotulo: true,
    codigoRotulo: '',
    precioReferencia: '',
    activo: true,
    observaciones: ''
  })

  useEffect(() => {
    fetchSubproductos()
    fetchConfigCodigos()
  }, [])

  const fetchSubproductos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/subproductos-config')
      const data = await res.json()
      if (data.success) {
        setSubproductos(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching subproductos:', error)
      toast.error('Error al cargar subproductos')
    } finally {
      setLoading(false)
    }
  }

  const fetchConfigCodigos = async () => {
    try {
      const res = await fetch('/api/codigo-barras')
      const data = await res.json()
      if (data.success) {
        setConfigCodigos(data.data || [])
      }
    } catch (error) {
      // Usar configuración por defecto
      setConfigCodigos([
        { id: '1', tipo: 'Subproducto', prefijo: 'SB', formato: 'SB-CODIGO-FECHA' }
      ])
    }
  }

  // Generar código de barras preview
  const generarCodigoBarras = (subproducto: Subproducto | FormData) => {
    const config = configCodigos.find(c => c.tipo === 'Subproducto') || 
                   { prefijo: 'SB', formato: 'SB-CODIGO-FECHA' }
    
    const fecha = new Date().toISOString().split('T')[0].replace(/-/g, '')
    let codigo = config.formato
      .replace('SB', config.prefijo)
      .replace('CODIGO', subproducto.codigo || '000')
      .replace('FECHA', fecha)
      .replace('LOTE', '001')
    
    return codigo
  }

  const stats = {
    total: subproductos.length,
    activos: subproductos.filter(s => s.activo).length,
    menudencias: subproductos.filter(s => s.categoria === 'MENUDENCIA' && s.activo).length,
    cueros: subproductos.filter(s => s.categoria === 'CUERO' && s.activo).length,
    conRotulo: subproductos.filter(s => s.generaRotulo && s.activo).length,
  }

  const handleNuevo = () => {
    setSubproductoEditando(null)
    // Generar código automático
    const nextNum = subproductos.length + 1
    const autoCodigo = `SUB-${nextNum.toString().padStart(3, '0')}`
    
    setFormData({
      codigo: autoCodigo,
      nombre: '',
      categoria: 'MENUDENCIA',
      especie: 'AMBOS',
      requiereFrio: true,
      temperaturaMax: '',
      unidadMedida: 'KG',
      rendimientoPct: '',
      generaRotulo: true,
      codigoRotulo: '',
      precioReferencia: '',
      activo: true,
      observaciones: ''
    })
    setPreviewCodigo(generarCodigoBarras({ ...formData, codigo: autoCodigo }))
    setDialogOpen(true)
  }

  const handleEditar = (subproducto: Subproducto) => {
    setSubproductoEditando(subproducto)
    setFormData({
      codigo: subproducto.codigo,
      nombre: subproducto.nombre,
      categoria: subproducto.categoria,
      especie: subproducto.especie || 'AMBOS',
      requiereFrio: subproducto.requiereFrio,
      temperaturaMax: subproducto.temperaturaMax?.toString() || '',
      unidadMedida: subproducto.unidadMedida,
      rendimientoPct: subproducto.rendimientoPct?.toString() || '',
      generaRotulo: subproducto.generaRotulo,
      codigoRotulo: subproducto.codigoRotulo || '',
      precioReferencia: subproducto.precioReferencia?.toString() || '',
      activo: subproducto.activo,
      observaciones: subproducto.observaciones || ''
    })
    setPreviewCodigo(generarCodigoBarras(subproducto))
    setDialogOpen(true)
  }

  const handleVerDetalle = (subproducto: Subproducto) => {
    setSubproductoDetalle(subproducto)
    setDetalleOpen(true)
  }

  const handleToggleEstado = async (subproducto: Subproducto) => {
    try {
      const res = await fetch('/api/subproductos-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: subproducto.id,
          activo: !subproducto.activo
        })
      })
      
      const data = await res.json()
      if (data.success) {
        setSubproductos(subproductos.map(s => 
          s.id === subproducto.id ? { ...s, activo: !s.activo } : s
        ))
        toast.success(subproducto.activo ? 'Subproducto desactivado' : 'Subproducto activado')
      } else {
        toast.error(data.error || 'Error al actualizar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }

  const handleGuardar = async () => {
    // Validaciones
    if (!formData.codigo.trim()) {
      toast.error('Ingrese el código')
      return
    }
    if (!formData.nombre.trim()) {
      toast.error('Ingrese el nombre')
      return
    }
    if (!formData.categoria) {
      toast.error('Seleccione la categoría')
      return
    }
    
    // Verificar código duplicado
    const codigoDuplicado = subproductos.find(
      s => s.codigo.toLowerCase() === formData.codigo.toLowerCase() && s.id !== subproductoEditando?.id
    )
    if (codigoDuplicado) {
      toast.error('Ya existe un subproducto con ese código')
      return
    }
    
    setSaving(true)
    try {
      const payload = {
        ...(subproductoEditando ? { id: subproductoEditando.id } : {}),
        codigo: formData.codigo.toUpperCase(),
        nombre: formData.nombre,
        categoria: formData.categoria,
        especie: formData.especie,
        requiereFrio: formData.requiereFrio,
        temperaturaMax: formData.temperaturaMax ? parseFloat(formData.temperaturaMax) : null,
        unidadMedida: formData.unidadMedida,
        rendimientoPct: formData.rendimientoPct ? parseFloat(formData.rendimientoPct) : null,
        generaRotulo: formData.generaRotulo,
        codigoRotulo: formData.codigoRotulo || null,
        precioReferencia: formData.precioReferencia ? parseFloat(formData.precioReferencia) : null,
        activo: formData.activo,
        observaciones: formData.observaciones || null
      }
      
      const res = await fetch('/api/subproductos-config', {
        method: subproductoEditando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      if (data.success) {
        if (subproductoEditando) {
          setSubproductos(subproductos.map(s => 
            s.id === subproductoEditando.id ? data.data : s
          ))
          toast.success('Subproducto actualizado correctamente')
        } else {
          setSubproductos([...subproductos, data.data])
          toast.success('Subproducto creado correctamente')
        }
        setDialogOpen(false)
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Actualizar preview de código cuando cambia el formulario
  useEffect(() => {
    if (dialogOpen) {
      setPreviewCodigo(generarCodigoBarras(formData))
    }
  }, [formData.codigo, formData.categoria, dialogOpen])

  // Filtrar subproductos
  const subproductosFiltrados = subproductos.filter(s => {
    if (filtroCategoria !== 'TODOS' && s.categoria !== filtroCategoria) return false
    if (filtroEspecie !== 'TODOS' && s.especie !== filtroEspecie && s.especie !== 'AMBOS') return false
    if (busqueda) {
      const termino = busqueda.toLowerCase()
      return (
        s.codigo.toLowerCase().includes(termino) ||
        s.nombre.toLowerCase().includes(termino)
      )
    }
    return true
  })

  const getCategoriaBadge = (categoria: string) => {
    const cat = CATEGORIAS.find(c => c.id === categoria)
    return (
      <Badge variant="outline" className={cat?.color || 'bg-gray-100'}>
        {cat?.label || categoria}
      </Badge>
    )
  }

  const getEspecieBadge = (especie: string | null) => {
    if (!especie) return <Badge variant="outline" className="bg-gray-50">-</Badge>
    const esp = ESPECIES.find(e => e.id === especie)
    return (
      <Badge variant="outline" className="bg-stone-50">
        {esp?.label || especie}
      </Badge>
    )
  }

  const formatPrecio = (precio: number | null) => {
    if (!precio) return '-'
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(precio)
  }

  const copiarCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo)
    toast.success('Código copiado')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Recycle className="w-8 h-8 text-amber-500" />
              Configuración de Subproductos
            </h1>
            <p className="text-stone-500">Gestión de artículos/subproductos del frigorífico</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchSubproductos}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Subproducto
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-stone-100 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Total</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Power className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Activos</p>
                  <p className="text-xl font-bold text-green-600">{stats.activos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Recycle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Menudencias</p>
                  <p className="text-xl font-bold text-green-600">{stats.menudencias}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Cueros</p>
                  <p className="text-xl font-bold text-amber-600">{stats.cueros}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Barcode className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Con Rótulo</p>
                  <p className="text-xl font-bold text-blue-600">{stats.conRotulo}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label className="text-xs">Buscar</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <Input
                    className="pl-9"
                    placeholder="Código o nombre..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Label className="text-xs">Categoría</Label>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todas</SelectItem>
                    {CATEGORIAS.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Label className="text-xs">Especie</Label>
                <Select value={filtroEspecie} onValueChange={setFiltroEspecie}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todas</SelectItem>
                    {ESPECIES.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Subproductos */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              Subproductos Configurados ({subproductosFiltrados.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                <p className="text-stone-400 mt-2">Cargando subproductos...</p>
              </div>
            ) : subproductosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No se encontraron subproductos</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-stone-50/50">
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Especie</TableHead>
                    <TableHead className="text-right">Precio Ref.</TableHead>
                    <TableHead className="text-center">Rótulo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subproductosFiltrados.map((subproducto) => (
                    <TableRow 
                      key={subproducto.id} 
                      className={!subproducto.activo ? 'opacity-50' : 'cursor-pointer hover:bg-stone-50'}
                      onClick={() => handleVerDetalle(subproducto)}
                    >
                      <TableCell className="font-mono text-sm font-medium">{subproducto.codigo}</TableCell>
                      <TableCell className="font-medium">{subproducto.nombre}</TableCell>
                      <TableCell>{getCategoriaBadge(subproducto.categoria)}</TableCell>
                      <TableCell>{getEspecieBadge(subproducto.especie)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrecio(subproducto.precioReferencia)}
                      </TableCell>
                      <TableCell className="text-center">
                        {subproducto.generaRotulo ? (
                          <Badge className="bg-blue-100 text-blue-700">
                            <Barcode className="w-3 h-3 mr-1" />
                            Sí
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-stone-400">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            subproducto.activo 
                              ? 'bg-green-100 text-green-700 border-green-200' 
                              : 'bg-red-100 text-red-700 border-red-200'
                          }
                        >
                          {subproducto.activo ? 'ACTIVO' : 'INACTIVO'}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditar(subproducto)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleToggleEstado(subproducto)}
                            title={subproducto.activo ? 'Desactivar' : 'Activar'}
                            className={subproducto.activo ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog Nuevo/Editar Subproducto */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Recycle className="w-5 h-5 text-amber-500" />
                {subproductoEditando ? 'Editar Subproducto' : 'Nuevo Subproducto'}
              </DialogTitle>
              <DialogDescription>
                Configure los datos del artículo/subproducto
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Datos básicos */}
              <div className="space-y-4">
                <h4 className="font-semibold text-stone-700 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-500" />
                  Datos Básicos
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Código *</Label>
                    <Input
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase().replace(/\s/g, '') })}
                      placeholder="SUB-001"
                      className="font-mono"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Categoría *</Label>
                    <Select 
                      value={formData.categoria} 
                      onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre del subproducto"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Especie</Label>
                    <Select 
                      value={formData.especie} 
                      onValueChange={(value) => setFormData({ ...formData, especie: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ESPECIES.map(e => (
                          <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Unidad de Medida</Label>
                    <Select 
                      value={formData.unidadMedida} 
                      onValueChange={(value) => setFormData({ ...formData, unidadMedida: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIDADES_MEDIDA.map(u => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Condiciones de almacenamiento */}
              <div className="space-y-4">
                <h4 className="font-semibold text-stone-700 flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-blue-500" />
                  Condiciones de Almacenamiento
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                    <div>
                      <Label>Requiere Frío</Label>
                      <p className="text-xs text-stone-400">¿Necesita refrigeración?</p>
                    </div>
                    <Switch
                      checked={formData.requiereFrio}
                      onCheckedChange={(checked) => setFormData({ ...formData, requiereFrio: checked })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Temperatura Máxima (°C)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.temperaturaMax}
                      onChange={(e) => setFormData({ ...formData, temperaturaMax: e.target.value })}
                      placeholder="Ej: 4"
                      disabled={!formData.requiereFrio}
                    />
                  </div>
                </div>
              </div>

              {/* Producción */}
              <div className="space-y-4">
                <h4 className="font-semibold text-stone-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Datos de Producción
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rendimiento Esperado (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.rendimientoPct}
                      onChange={(e) => setFormData({ ...formData, rendimientoPct: e.target.value })}
                      placeholder="Ej: 3.5"
                    />
                    <p className="text-xs text-stone-400">% del peso vivo del animal</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Precio de Referencia ($/KG)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.precioReferencia}
                      onChange={(e) => setFormData({ ...formData, precioReferencia: e.target.value })}
                      placeholder="Ej: 85.50"
                    />
                  </div>
                </div>
              </div>

              {/* Código de Barras */}
              <div className="space-y-4">
                <h4 className="font-semibold text-stone-700 flex items-center gap-2">
                  <Barcode className="w-4 h-4 text-purple-500" />
                  Código de Barras EAN-128
                </h4>
                
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div>
                    <Label>Genera Rótulo</Label>
                    <p className="text-xs text-stone-400">¿Imprimir código de barras?</p>
                  </div>
                  <Switch
                    checked={formData.generaRotulo}
                    onCheckedChange={(checked) => setFormData({ ...formData, generaRotulo: checked })}
                  />
                </div>
                
                {formData.generaRotulo && (
                  <div className="space-y-2">
                    <Label>Vista Previa del Código</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-stone-100 px-4 py-3 rounded-lg font-mono text-lg">
                        {previewCodigo}
                      </code>
                      <Button variant="outline" size="icon" onClick={() => copiarCodigo(previewCodigo)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-stone-400">
                      Formato: Prefijo-Código-Fecha (EAN-128)
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Código de Rótulo Personalizado (opcional)</Label>
                  <Input
                    value={formData.codigoRotulo}
                    onChange={(e) => setFormData({ ...formData, codigoRotulo: e.target.value })}
                    placeholder="Código alternativo para rótulo"
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Estado y observaciones */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div>
                    <Label>Estado Activo</Label>
                    <p className="text-xs text-stone-400">¿El subproducto está disponible?</p>
                  </div>
                  <Switch
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Observaciones</Label>
                  <Input
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={handleGuardar} 
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Detalle */}
        <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-500" />
                Detalle del Subproducto
              </DialogTitle>
            </DialogHeader>
            
            {subproductoDetalle && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <Badge className={CATEGORIAS.find(c => c.id === subproductoDetalle.categoria)?.color || 'bg-gray-100'}>
                    {CATEGORIAS.find(c => c.id === subproductoDetalle.categoria)?.label}
                  </Badge>
                  <Badge variant="outline" className="font-mono">
                    {subproductoDetalle.codigo}
                  </Badge>
                  {subproductoDetalle.activo ? (
                    <Badge className="bg-green-100 text-green-700">ACTIVO</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700">INACTIVO</Badge>
                  )}
                </div>
                
                <div className="text-xl font-semibold">{subproductoDetalle.nombre}</div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-stone-500">Especie:</span>
                    <span className="ml-2 font-medium">{ESPECIES.find(e => e.id === subproductoDetalle.especie)?.label || '-'}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">Unidad:</span>
                    <span className="ml-2 font-medium">{subproductoDetalle.unidadMedida}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">Precio Ref.:</span>
                    <span className="ml-2 font-medium">{formatPrecio(subproductoDetalle.precioReferencia)}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">Rendimiento:</span>
                    <span className="ml-2 font-medium">{subproductoDetalle.rendimientoPct ? `${subproductoDetalle.rendimientoPct}%` : '-'}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">Requiere Frío:</span>
                    <span className="ml-2 font-medium">{subproductoDetalle.requiereFrio ? 'Sí' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">Temp. Máx:</span>
                    <span className="ml-2 font-medium">{subproductoDetalle.temperaturaMax ? `${subproductoDetalle.temperaturaMax}°C` : '-'}</span>
                  </div>
                </div>
                
                {subproductoDetalle.generaRotulo && (
                  <div className="space-y-2">
                    <Label>Código de Barras</Label>
                    <code className="block bg-stone-100 px-4 py-2 rounded font-mono">
                      {generarCodigoBarras(subproductoDetalle)}
                    </code>
                  </div>
                )}
                
                {subproductoDetalle.observaciones && (
                  <div className="text-sm">
                    <span className="text-stone-500">Observaciones:</span>
                    <p className="mt-1">{subproductoDetalle.observaciones}</p>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetalleOpen(false)}>
                Cerrar
              </Button>
              {subproductoDetalle && (
                <Button 
                  onClick={() => { setDetalleOpen(false); handleEditar(subproductoDetalle); }}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default ConfigSubproductosModule
