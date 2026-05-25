'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Barcode, Plus, Loader2, Edit, Copy, Trash2, Star, StarOff
} from 'lucide-react'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ConfigCodigobarras')

interface Operador { id: string; nombre: string; rol: string }

interface CodigoConfig {
  id: string
  tipo: string
  prefijo: string
  formato: string
  descripcion?: string | null
  variables?: string | null
  esDefault: boolean
  activo: boolean
}

interface Props { operador: Operador }

const TIPOS_CODIGO = ['Media Res', 'Cuarto', 'Producto', 'Caja', 'Subproducto', 'Menudencia', 'Otro']
const VARIABLES_DISPONIBLES = ['TROPA', 'GARRON', 'LADO', 'FECHA', 'LOTE', 'CODIGO', 'PESO', 'NUM', 'BOLSA']

export function ConfigCodigobarrasModule({ operador }: Props) {
  const [codigos, setCodigos] = useState<CodigoConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<CodigoConfig | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState({
    tipo: 'Media Res',
    prefijo: '',
    formato: '',
    descripcion: '',
    esDefault: false
  })

  // Cargar configuraciones desde la API
  const fetchCodigos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/codigo-barras')
      const data = await res.json()
      if (data.success) {
        setCodigos(data.data)
        logger.info('Configuraciones cargadas', { count: data.data.length })
      } else {
        toast.error('Error al cargar configuraciones')
      }
    } catch (error) {
      logger.error('Error al cargar configuraciones', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCodigos()
  }, [])

  const handleGuardar = async () => {
    if (!formData.tipo || !formData.formato) {
      toast.error('Complete los campos requeridos')
      return
    }

    setGuardando(true)
    try {
      const res = await fetch('/api/codigo-barras', {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editando ? { id: editando.id } : {}),
          ...formData
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success(editando ? 'Configuración actualizada' : 'Configuración creada')
        setModalOpen(false)
        resetForm()
        fetchCodigos()
        logger.info(editando ? 'Configuración actualizada' : 'Configuración creada', { tipo: formData.tipo })
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      logger.error('Error al guardar configuración', error)
      toast.error('Error de conexión')
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async (codigo: CodigoConfig) => {
    if (!confirm(`¿Eliminar la configuración "${codigo.tipo}"?`)) return

    try {
      const res = await fetch(`/api/codigo-barras?id=${codigo.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Configuración eliminada')
        fetchCodigos()
        logger.info('Configuración eliminada', { tipo: codigo.tipo })
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      logger.error('Error al eliminar configuración', error)
      toast.error('Error de conexión')
    }
  }

  const handleSetDefault = async (codigo: CodigoConfig) => {
    try {
      const res = await fetch('/api/codigo-barras', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: codigo.id,
          esDefault: true
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success(`${codigo.tipo} establecido como predeterminado`)
        fetchCodigos()
      } else {
        toast.error(data.error || 'Error al actualizar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }

  const resetForm = () => {
    setFormData({
      tipo: 'Media Res',
      prefijo: '',
      formato: '',
      descripcion: '',
      esDefault: false
    })
    setEditando(null)
  }

  const handleCopiar = (formato: string) => {
    navigator.clipboard.writeText(formato)
    toast.success('Formato copiado al portapapeles')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Barcode className="w-8 h-8 text-amber-500" />
              Configuración de Código de Barras
            </h1>
            <p className="text-stone-500">Formatos para generación de códigos EAN-128</p>
          </div>
          <Button 
            onClick={() => { resetForm(); setModalOpen(true); }} 
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Formato
          </Button>
        </div>

        {/* Table */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50">
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prefijo</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center">Default</TableHead>
                  <TableHead className="w-36 text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                    </TableCell>
                  </TableRow>
                ) : codigos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-stone-400 py-8">
                      No hay configuraciones de código de barras
                    </TableCell>
                  </TableRow>
                ) : (
                  codigos.map((c) => (
                    <TableRow key={c.id} className={!c.activo ? 'opacity-50' : ''}>
                      <TableCell>
                        <Badge variant="outline" className={c.esDefault ? 'border-amber-300 text-amber-700' : ''}>
                          {c.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-stone-700">
                        {c.prefijo}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-stone-100 px-2 py-1 rounded text-sm font-mono">
                            {c.formato}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleCopiar(c.formato)}
                            title="Copiar formato"
                          >
                            <Copy className="w-4 h-4 text-stone-400" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-stone-500 text-sm">
                        {c.descripcion || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {c.esDefault ? (
                          <Star className="w-5 h-5 text-amber-500 fill-amber-500 mx-auto" />
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(c)}
                            title="Establecer como predeterminado"
                          >
                            <StarOff className="w-5 h-5 text-stone-300" />
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setEditando(c)
                              setFormData({
                                tipo: c.tipo,
                                prefijo: c.prefijo,
                                formato: c.formato,
                                descripcion: c.descripcion || '',
                                esDefault: c.esDefault
                              })
                              setModalOpen(true)
                            }}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4 text-stone-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEliminar(c)}
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
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

        {/* Info Card */}
        <Card className="border-0 shadow-md bg-stone-50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-stone-700 mb-2">Variables disponibles</h3>
            <div className="flex flex-wrap gap-2">
              {VARIABLES_DISPONIBLES.map(v => (
                <code key={v} className="bg-white border px-2 py-1 rounded text-sm font-mono text-stone-600">
                  {v}
                </code>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-3">
              Use estas variables en el formato. Se reemplazarán con los valores reales al generar códigos.
            </p>
          </CardContent>
        </Card>

        {/* Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent maximizable>
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar Formato' : 'Nuevo Formato de Código'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <select 
                    className="w-full border rounded px-3 py-2 bg-background" 
                    value={formData.tipo} 
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  >
                    {TIPOS_CODIGO.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Prefijo (2-3 caracteres)</Label>
                  <Input 
                    value={formData.prefijo} 
                    onChange={(e) => setFormData({...formData, prefijo: e.target.value.toUpperCase()})} 
                    maxLength={3} 
                    placeholder="MR" 
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Formato *</Label>
                <Input 
                  value={formData.formato} 
                  onChange={(e) => setFormData({...formData, formato: e.target.value})} 
                  placeholder="MR-TROPA-GARRON-LADO-FECHA"
                  className="font-mono"
                />
                <p className="text-xs text-stone-400">
                  Variables: TROPA, GARRON, LADO, FECHA, LOTE, CODIGO, PESO, NUM, BOLSA
                </p>
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input 
                  value={formData.descripcion} 
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})} 
                  placeholder="Descripción del formato"
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="esDefault" 
                  checked={formData.esDefault} 
                  onChange={(e) => setFormData({...formData, esDefault: e.target.checked})}
                  className="w-4 h-4"
                />
                <Label htmlFor="esDefault" className="text-sm">
                  Establecer como predeterminado
                </Label>
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
                {guardando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editando ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default ConfigCodigobarrasModule
