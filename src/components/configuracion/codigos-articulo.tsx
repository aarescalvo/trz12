'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileSpreadsheet,
  Download,
  Upload
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CodigoArticulo {
  id: string
  codigo: string
  nombre: string
  nombreCorto: string | null
  especie: string | null
  categoria: string | null
  tara: number | null
  diasConservacion: number | null
  temperaturaConservacion: string | null
  precioKg: number | null
  apareceRendimiento: boolean
  apareceStock: boolean
  activo: boolean
}

const CATEGORIAS = [
  { value: 'CORTE', label: 'Corte' },
  { value: 'MENUDENCIA', label: 'Menudencia' },
  { value: 'SUBPRODUCTO', label: 'Subproducto' },
  { value: 'MEDIARES', label: 'Media Res' },
  { value: 'CUARTO', label: 'Cuarto' },
  { value: 'ESPECIAL', label: 'Especial' },
]

const ESPECIES = [
  { value: '', label: 'Todas' },
  { value: 'BOVINO', label: 'Bovino' },
  { value: 'EQUINO', label: 'Equino' },
]

export function CodigosArticulo() {
  const { toast } = useToast()
  const [codigos, setCodigos] = useState<CodigoArticulo[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('all')
  const [filtroEspecie, setFiltroEspecie] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<CodigoArticulo | null>(null)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    nombreCorto: '',
    especie: '',
    categoria: '',
    tara: '',
    diasConservacion: '',
    temperaturaConservacion: '',
    precioKg: '',
    apareceRendimiento: false,
    apareceStock: true
  })

  useEffect(() => {
    fetchCodigos()
  }, [])

  const fetchCodigos = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (busqueda) params.append('busqueda', busqueda)
      if (filtroCategoria && filtroCategoria !== 'all') params.append('categoria', filtroCategoria)
      if (filtroEspecie) params.append('especie', filtroEspecie)

      const response = await fetch(`/api/codigos-articulo?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCodigos(data)
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los códigos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async () => {
    try {
      const method = editando ? 'PUT' : 'POST'
      const body = editando 
        ? { ...formData, id: editando.id }
        : formData

      const response = await fetch('/api/codigos-articulo', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        toast({
          title: editando ? 'Actualizado' : 'Creado',
          description: `Código ${editando ? 'actualizado' : 'creado'} correctamente`
        })
        setDialogOpen(false)
        resetForm()
        fetchCodigos()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Error al guardar',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'Error al guardar',
        variant: 'destructive'
      })
    }
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Desactivar este código?')) return

    try {
      const response = await fetch(`/api/codigos-articulo?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Eliminado',
          description: 'Código desactivado'
        })
        fetchCodigos()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleEditar = (codigo: CodigoArticulo) => {
    setEditando(codigo)
    setFormData({
      codigo: codigo.codigo,
      nombre: codigo.nombre,
      nombreCorto: codigo.nombreCorto || '',
      especie: codigo.especie || '',
      categoria: codigo.categoria || '',
      tara: codigo.tara?.toString() || '',
      diasConservacion: codigo.diasConservacion?.toString() || '',
      temperaturaConservacion: codigo.temperaturaConservacion || '',
      precioKg: codigo.precioKg?.toString() || '',
      apareceRendimiento: codigo.apareceRendimiento,
      apareceStock: codigo.apareceStock
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      nombreCorto: '',
      especie: '',
      categoria: '',
      tara: '',
      diasConservacion: '',
      temperaturaConservacion: '',
      precioKg: '',
      apareceRendimiento: false,
      apareceStock: true
    })
    setEditando(null)
  }

  // Importar códigos desde archivo Excel
  const handleImportar = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      // Aquí iría la lógica de importación
      toast({
        title: 'Importar',
        description: 'Función de importación pendiente de implementar'
      })
    }
    input.click()
  }

  const handleExportar = () => {
    // Generar CSV
    const headers = ['Código', 'Nombre', 'Especie', 'Categoría', 'Tara', 'Días Conserv.']
    const rows = codigos.map(c => [
      c.codigo,
      c.nombre,
      c.especie || 'Todas',
      c.categoria || '-',
      c.tara || '-',
      c.diasConservacion || '-'
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `codigos_articulo_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Agrupar por categoría
  const codigosAgrupados = codigos.reduce((acc, c) => {
    const cat = c.categoria || 'Sin categoría'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(c)
    return acc
  }, {} as Record<string, CodigoArticulo[]>)

  return (
    <div className="space-y-4">
      {/* Header con acciones */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar código o nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CATEGORIAS.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroEspecie} onValueChange={setFiltroEspecie}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Especie" />
            </SelectTrigger>
            <SelectContent>
              {ESPECIES.map(e => (
                <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportar}>
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportar}>
            <Upload className="h-4 w-4 mr-1" />
            Importar
          </Button>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo
          </Button>
        </div>
      </div>

      {/* Tabla de códigos */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando...</div>
          ) : codigos.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No hay códigos registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="w-24">Especie</TableHead>
                  <TableHead className="w-28">Categoría</TableHead>
                  <TableHead className="w-24">Tara (kg)</TableHead>
                  <TableHead className="w-28">Conservación</TableHead>
                  <TableHead className="w-20 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(codigosAgrupados).map(([categoria, items]) => (
                  <>
                    <TableRow key={categoria} className="bg-muted/50">
                      <TableCell colSpan={7} className="font-semibold text-sm">
                        {categoria} ({items.length} items)
                      </TableCell>
                    </TableRow>
                    {items.map((codigo) => (
                      <TableRow key={codigo.id}>
                        <TableCell className="font-mono font-medium">
                          .{codigo.codigo}
                        </TableCell>
                        <TableCell>{codigo.nombre}</TableCell>
                        <TableCell>
                          {codigo.especie ? (
                            <Badge variant="outline" className={
                              codigo.especie === 'BOVINO' ? 'border-amber-500 text-amber-700' : 
                              'border-purple-500 text-purple-700'
                            }>
                              {codigo.especie === 'BOVINO' ? 'Bov' : 'Equ'}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">Todas</span>
                          )}
                        </TableCell>
                        <TableCell>{codigo.categoria || '-'}</TableCell>
                        <TableCell>{codigo.tara || '-'}</TableCell>
                        <TableCell>{codigo.diasConservacion ? `${codigo.diasConservacion} días` : '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditar(codigo)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleEliminar(codigo.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-lg" maximizable>
          <DialogHeader>
            <DialogTitle>
              {editando ? 'Editar Código' : 'Nuevo Código de Artículo'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="001"
                  maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Especie</Label>
                <Select
                  value={formData.especie}
                  onValueChange={(v) => setFormData({ ...formData, especie: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESPECIES.map(e => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
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
                placeholder="Nombre del artículo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre Corto</Label>
                <Input
                  value={formData.nombreCorto}
                  onChange={(e) => setFormData({ ...formData, nombreCorto: e.target.value })}
                  placeholder="Para rótulos"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(v) => setFormData({ ...formData, categoria: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tara (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.tara}
                  onChange={(e) => setFormData({ ...formData, tara: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Días Conserv.</Label>
                <Input
                  type="number"
                  value={formData.diasConservacion}
                  onChange={(e) => setFormData({ ...formData, diasConservacion: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Precio/kg</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.precioKg}
                  onChange={(e) => setFormData({ ...formData, precioKg: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardar}>
              {editando ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
