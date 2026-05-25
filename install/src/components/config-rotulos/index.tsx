'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  Tag, Plus, Loader2, Edit, Eye, Power
} from 'lucide-react'

interface Operador { id: string; nombre: string; rol: string }

interface Rotulo {
  id: string
  nombre: string
  tipo: 'Producto' | 'Caja' | 'Pallet'
  ancho: number
  alto: number
  contenido: string
  activo: boolean
}

interface Props { operador: Operador }

const TIPOS_ROTULO = ['Producto', 'Caja', 'Pallet'] as const

const datosIniciales: Rotulo[] = [
  { 
    id: '1', 
    nombre: 'Etiqueta Producto Individual', 
    tipo: 'Producto', 
    ancho: 50, 
    alto: 25, 
    contenido: '{{NOMBRE_PRODUCTO}}\n{{PESO}} kg\n{{FECHA_FAENA}}\n{{LOTE}}', 
    activo: true 
  },
  { 
    id: '2', 
    nombre: 'Etiqueta Caja Exportación', 
    tipo: 'Caja', 
    ancho: 100, 
    alto: 70, 
    contenido: '{{NOMBRE_PRODUCTO}}\n{{PESO_NETO}} kg\n{{DESTINO}}\n{{FECHA_VENCIMIENTO}}\n{{CODIGO_BARRAS}}', 
    activo: true 
  },
  { 
    id: '3', 
    nombre: 'Etiqueta Pallet Completo', 
    tipo: 'Pallet', 
    ancho: 150, 
    alto: 100, 
    contenido: '{{NUMERO_PALLET}}\n{{PRODUCTO}}\n{{CANTIDAD_CAJAS}}\n{{PESO_TOTAL}} kg\n{{FECHA}}', 
    activo: true 
  },
  { 
    id: '4', 
    nombre: 'Etiqueta Media Res', 
    tipo: 'Producto', 
    ancho: 80, 
    alto: 50, 
    contenido: '{{TROPA}} - {{GARRON}}\n{{LADO}}\n{{PESO}} kg\n{{FECHA}}', 
    activo: false 
  },
  { 
    id: '5', 
    nombre: 'Etiqueta Cuarto', 
    tipo: 'Producto', 
    ancho: 60, 
    alto: 40, 
    contenido: '{{GARRON}} - {{TIPO_CUARTO}}\n{{PESO}} kg\n{{FECHA_FAENA}}', 
    activo: true 
  },
]

export function ConfigRotulosModule({ operador }: Props) {
  const [rotulos, setRotulos] = useState<Rotulo[]>(datosIniciales)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalPreviewOpen, setModalPreviewOpen] = useState(false)
  const [editando, setEditando] = useState<Rotulo | null>(null)
  const [previewRotulo, setPreviewRotulo] = useState<Rotulo | null>(null)
  const [guardando, setGuardando] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'Producto' as 'Producto' | 'Caja' | 'Pallet',
    ancho: '',
    alto: '',
    contenido: ''
  })

  // Calcular estadísticas
  const totalRotulos = rotulos.length
  const rotulosActivos = rotulos.filter(r => r.activo).length
  const rotulosInactivos = rotulos.filter(r => !r.activo).length

  const handleGuardar = async () => {
    if (!formData.nombre) {
      toast.error('Ingrese el nombre del rótulo')
      return
    }
    if (!formData.ancho || !formData.alto) {
      toast.error('Ingrese las dimensiones del rótulo')
      return
    }
    if (!formData.contenido) {
      toast.error('Ingrese el contenido del rótulo')
      return
    }

    setGuardando(true)
    setTimeout(() => {
      if (editando) {
        setRotulos(rotulos.map(r => 
          r.id === editando.id 
            ? { 
                ...r, 
                nombre: formData.nombre,
                tipo: formData.tipo,
                ancho: parseInt(formData.ancho),
                alto: parseInt(formData.alto),
                contenido: formData.contenido
              } 
            : r
        ))
        toast.success('Rótulo actualizado correctamente')
      } else {
        const nuevoRotulo: Rotulo = {
          id: Date.now().toString(),
          nombre: formData.nombre,
          tipo: formData.tipo,
          ancho: parseInt(formData.ancho),
          alto: parseInt(formData.alto),
          contenido: formData.contenido,
          activo: true
        }
        setRotulos([...rotulos, nuevoRotulo])
        toast.success('Rótulo creado correctamente')
      }
      setModalOpen(false)
      setGuardando(false)
      resetForm()
    }, 500)
  }

  const handleToggleActivo = (id: string, activo: boolean) => {
    setRotulos(rotulos.map(r => r.id === id ? { ...r, activo } : r))
    toast.success(activo ? 'Rótulo activado' : 'Rótulo desactivado')
  }

  const handleEditar = (rotulo: Rotulo) => {
    setEditando(rotulo)
    setFormData({
      nombre: rotulo.nombre,
      tipo: rotulo.tipo,
      ancho: rotulo.ancho.toString(),
      alto: rotulo.alto.toString(),
      contenido: rotulo.contenido
    })
    setModalOpen(true)
  }

  const handlePreview = (rotulo: Rotulo) => {
    setPreviewRotulo(rotulo)
    setModalPreviewOpen(true)
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: 'Producto',
      ancho: '',
      alto: '',
      contenido: ''
    })
    setEditando(null)
  }

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'Producto': return 'default'
      case 'Caja': return 'secondary'
      case 'Pallet': return 'outline'
      default: return 'default'
    }
  }

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'Producto': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'Caja': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Pallet': return 'bg-green-100 text-green-800 border-green-200'
      default: return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Tag className="w-6 h-6 text-amber-500" />
            Configuración de Rótulos
          </h2>
          <p className="text-sm text-stone-500">Gestión de plantillas de etiquetas y rótulos</p>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Rótulo
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-stone-50 to-stone-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-stone-600">Total Rótulos</CardTitle>
            <Tag className="h-4 w-4 text-stone-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-stone-800">{totalRotulos}</div>
            <p className="text-xs text-stone-500 mt-1">Plantillas configuradas</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Activos</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{rotulosActivos}</div>
            <p className="text-xs text-green-600 mt-1">Rótulos en uso</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-stone-50 to-stone-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-stone-500">Inactivos</CardTitle>
            <div className="h-2 w-2 rounded-full bg-stone-300" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-stone-500">{rotulosInactivos}</div>
            <p className="text-xs text-stone-400 mt-1">Rótulos desactivados</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-stone-50">
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Dimensiones</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-32 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                  </TableCell>
                </TableRow>
              ) : rotulos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-stone-400 py-8">
                    No hay rótulos configurados
                  </TableCell>
                </TableRow>
              ) : (
                rotulos.map((rotulo) => (
                  <TableRow key={rotulo.id} className={!rotulo.activo ? 'bg-stone-50' : ''}>
                    <TableCell className="font-medium">{rotulo.nombre}</TableCell>
                    <TableCell>
                      <Badge variant={getTipoBadgeVariant(rotulo.tipo)} className={getTipoBadgeColor(rotulo.tipo)}>
                        {rotulo.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-stone-600">
                      {rotulo.ancho} × {rotulo.alto} mm
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={rotulo.activo ? 'default' : 'secondary'}
                        className={rotulo.activo ? 'bg-green-500 hover:bg-green-600' : 'bg-stone-300'}
                      >
                        {rotulo.activo ? 'ACTIVO' : 'INACTIVO'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditar(rotulo)}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4 text-stone-500" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleToggleActivo(rotulo.id, !rotulo.activo)}
                          title={rotulo.activo ? 'Desactivar' : 'Activar'}
                        >
                          <Power className={`w-4 h-4 ${rotulo.activo ? 'text-green-500' : 'text-stone-400'}`} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handlePreview(rotulo)}
                          title="Vista Previa"
                        >
                          <Eye className="w-4 h-4 text-amber-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Crear/Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Rótulo' : 'Nuevo Rótulo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input 
                  value={formData.nombre} 
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                  placeholder="Etiqueta Producto Individual"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <select 
                  className="w-full border rounded px-3 py-2 bg-background" 
                  value={formData.tipo} 
                  onChange={(e) => setFormData({...formData, tipo: e.target.value as 'Producto' | 'Caja' | 'Pallet'})}
                >
                  {TIPOS_ROTULO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ancho (mm) *</Label>
                <Input 
                  type="number"
                  value={formData.ancho} 
                  onChange={(e) => setFormData({...formData, ancho: e.target.value})} 
                  placeholder="50"
                />
              </div>
              <div className="space-y-2">
                <Label>Alto (mm) *</Label>
                <Input 
                  type="number"
                  value={formData.alto} 
                  onChange={(e) => setFormData({...formData, alto: e.target.value})} 
                  placeholder="25"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contenido *</Label>
              <Textarea 
                value={formData.contenido} 
                onChange={(e) => setFormData({...formData, contenido: e.target.value})} 
                placeholder="{{NOMBRE_PRODUCTO}}&#10;{{PESO}} kg&#10;{{FECHA_FAENA}}"
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-stone-400">
                Variables disponibles: {'{{NOMBRE_PRODUCTO}}'}, {'{{PESO}}'}, {'{{FECHA_FAENA}}'}, {'{{LOTE}}'}, 
                {'{{CODIGO_BARRAS}}'}, {'{{DESTINO}}'}, {'{{TROPA}}'}, {'{{GARRON}}'}, {'{{LADO}}'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleGuardar} 
              disabled={guardando} 
              className="bg-amber-500 hover:bg-amber-600"
            >
              {guardando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editando ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Vista Previa */}
      <Dialog open={modalPreviewOpen} onOpenChange={setModalPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-500" />
              Vista Previa - {previewRotulo?.nombre}
            </DialogTitle>
          </DialogHeader>
          {previewRotulo && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-stone-500">Tipo:</span>
                  <Badge variant="outline" className="ml-2">{previewRotulo.tipo}</Badge>
                </div>
                <div>
                  <span className="text-stone-500">Dimensiones:</span>
                  <span className="ml-2 font-medium">{previewRotulo.ancho} × {previewRotulo.alto} mm</span>
                </div>
              </div>
              <div className="border-2 border-dashed border-stone-200 rounded-lg p-6 bg-white">
                <div 
                  className="border border-stone-300 bg-stone-50 mx-auto flex items-center justify-center"
                  style={{ 
                    width: Math.min(previewRotulo.ancho, 200), 
                    height: Math.min(previewRotulo.alto, 150),
                    aspectRatio: `${previewRotulo.ancho}/${previewRotulo.alto}`
                  }}
                >
                  <div className="text-center text-xs text-stone-600 whitespace-pre-line font-mono p-2">
                    {previewRotulo.contenido}
                  </div>
                </div>
              </div>
              <div className="bg-stone-50 rounded-lg p-4">
                <p className="text-xs font-medium text-stone-500 mb-2">Contenido de la plantilla:</p>
                <pre className="text-xs text-stone-700 whitespace-pre-wrap font-mono">
                  {previewRotulo.contenido}
                </pre>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setModalPreviewOpen(false)}
            >
              Cerrar
            </Button>
            <Button 
              onClick={() => {
                setModalPreviewOpen(false)
                if (previewRotulo) handleEditar(previewRotulo)
              }}
              className="bg-amber-500 hover:bg-amber-600"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ConfigRotulosModule
