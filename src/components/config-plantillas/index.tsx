// NOTA: Componente disponible para uso futuro - verificar antes de eliminar
'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  FileSpreadsheet, Upload, Download, Trash2, Eye, Loader2, 
  FileText, Info, Check, Plus
} from 'lucide-react'

interface Plantilla {
  id: string
  nombre: string
  codigo: string
  descripcion?: string | null
  archivoNombre: string
  categoria?: string | null
  activo: boolean
  hojaDatos?: string | null
  filaInicio?: number | null
  rangoDatos?: string | null
  columnas?: string | null
  createdAt: string
}

const CATEGORIAS = [
  { value: 'FAENA', label: 'Faena', descripcion: 'Reportes de faena diaria' },
  { value: 'STOCK', label: 'Stock', descripcion: 'Reportes de inventario' },
  { value: 'DESPOSTADA', label: 'Despostada', descripcion: 'Reportes de rendimiento' },
  { value: 'SENASA', label: 'SENASA', descripcion: 'Reportes oficiales' },
  { value: 'GENERAL', label: 'General', descripcion: 'Otros reportes' }
]

interface Props {
  operador: { id: string; nombre: string; rol: string }
}

export function ConfigPlantillasModule({ operador }: Props) {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [loading, setLoading] = useState(true)
  const [modalSubir, setModalSubir] = useState(false)
  const [modalPreview, setModalPreview] = useState(false)
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<Plantilla | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  
  // Formulario
  const [nombre, setNombre] = useState('')
  const [codigo, setCodigo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState('GENERAL')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [hojaDatos, setHojaDatos] = useState('Datos')
  const [filaInicio, setFilaInicio] = useState('7')
  const [rangoDatos, setRangoDatos] = useState('')
  const [columnasMapping, setColumnasMapping] = useState('')
  const [marcadores, setMarcadores] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar plantillas
  const cargarPlantillas = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/plantillas-reporte')
      const data = await response.json()
      if (data.success) {
        setPlantillas(data.data)
      }
    } catch (error) {
      console.error('Error al cargar plantillas:', error)
      toast.error('Error al cargar plantillas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarPlantillas()
  }, [])

  // Seleccionar archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (extension !== 'xlsx' && extension !== 'xlsm') {
      toast.error('El archivo debe ser .xlsx o .xlsm')
      return
    }

    setArchivo(file)
    const nombreBase = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
    setNombre(nombreBase)
    setCodigo(file.name.replace(/\.[^/.]+$/, '').toUpperCase().replace(/\s+/g, '_'))
  }

  // Subir plantilla
  const handleSubir = async () => {
    if (!archivo || !nombre || !codigo) {
      toast.error('Complete todos los campos requeridos')
      return
    }

    setSubiendo(true)
    try {
      const formData = new FormData()
      formData.append('nombre', nombre)
      formData.append('codigo', codigo)
      formData.append('descripcion', descripcion)
      formData.append('categoria', categoria)
      formData.append('archivo', archivo)
      formData.append('hojaDatos', hojaDatos)
      formData.append('filaInicio', filaInicio)
      formData.append('rangoDatos', rangoDatos)
      formData.append('columnas', columnasMapping)
      formData.append('marcadores', marcadores)

      const response = await fetch('/api/plantillas-reporte', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Plantilla guardada correctamente')
        setModalSubir(false)
        resetForm()
        cargarPlantillas()
      } else {
        toast.error(data.error || 'Error al guardar plantilla')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al subir plantilla')
    } finally {
      setSubiendo(false)
    }
  }

  // Eliminar plantilla
  const handleEliminar = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta plantilla?')) return

    try {
      const response = await fetch(`/api/plantillas-reporte?id=${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Plantilla eliminada')
        cargarPlantillas()
      }
    } catch (error) {
      toast.error('Error al eliminar plantilla')
    }
  }

  // Descargar plantilla original
  const handleDescargar = async (plantilla: Plantilla) => {
    try {
      // Obtener contenido completo
      const response = await fetch(`/api/plantillas-reporte/descargar?id=${plantilla.id}`)
      
      if (!response.ok) {
        toast.error('Error al descargar plantilla')
        return
      }
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = plantilla.archivoNombre
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Error al descargar')
    }
  }

  // Reset formulario
  const resetForm = () => {
    setArchivo(null)
    setNombre('')
    setCodigo('')
    setDescripcion('')
    setCategoria('GENERAL')
    setHojaDatos('Datos')
    setFilaInicio('7')
    setRangoDatos('')
    setColumnasMapping('')
    setMarcadores('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Agrupar por categoría
  const plantillasPorCategoria = plantillas.reduce((acc, p) => {
    const cat = p.categoria || 'SIN_CATEGORIA'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {} as Record<string, Plantilla[]>)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 pt-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-green-500" />
            Plantillas de Reportes
          </h2>
          <p className="text-sm text-stone-500">
            Gestione plantillas Excel para reportes personalizados
          </p>
        </div>
        <Button 
          onClick={() => setModalSubir(true)} 
          className="bg-green-600 hover:bg-green-700"
        >
          <Upload className="w-4 h-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Info */}
      <div className="px-4 mb-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-green-500 mt-0.5" />
              <div className="text-xs text-green-700">
                <strong>Cómo funciona:</strong> Diseñe su planilla en Excel con el formato deseado. 
                Use marcadores como <code className="bg-green-100 px-1 rounded">{'{{FECHA}}'}</code>, 
                <code className="bg-green-100 px-1 rounded">{'{{TROPA}}'}</code> donde quiera que aparezcan datos dinámicos. 
                El sistema reemplazará los marcadores al generar el reporte.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de plantillas */}
      <div className="flex-1 px-4 overflow-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-green-500" />
          </div>
        ) : plantillas.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-stone-300 mb-3" />
              <p className="text-stone-500">No hay plantillas configuradas</p>
              <p className="text-xs text-stone-400 mt-1">
                Suba una plantilla Excel para empezar
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(plantillasPorCategoria).map(([categoria, plantillasCat]) => (
              <Card key={categoria} className="border-0 shadow-md">
                <CardHeader className="py-3 px-4 bg-stone-50 border-b">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {CATEGORIAS.find(c => c.value === categoria)?.label || categoria}
                    <Badge variant="outline" className="font-normal">{plantillasCat.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {plantillasCat.map((plantilla) => (
                      <div key={plantilla.id} className="p-3 hover:bg-stone-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-green-100 text-green-700">
                              .xlsx
                            </Badge>
                            <div>
                              <p className="font-medium">{plantilla.nombre}</p>
                              <p className="text-xs text-stone-500">
                                {plantilla.archivoNombre} • {plantilla.descripcion || 'Sin descripción'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPlantillaSeleccionada(plantilla)
                                setModalPreview(true)
                              }}
                              title="Ver configuración"
                            >
                              <Eye className="w-4 h-4 text-stone-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDescargar(plantilla)}
                              title="Descargar plantilla original"
                            >
                              <Download className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEliminar(plantilla.id)}
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Subir Plantilla */}
      <Dialog open={modalSubir} onOpenChange={(open) => {
        setModalSubir(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh]" maximizable>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-500" />
              Nueva Plantilla de Reporte
            </DialogTitle>
            <DialogDescription>
              Suba un archivo Excel con el formato deseado. Use marcadores para datos dinámicos.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              {/* Archivo */}
              <div>
                <Label>Archivo Excel (.xlsx, .xlsm)</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xlsm"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
              </div>

              {/* Nombre y código */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nombre de la Plantilla</Label>
                  <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
                </div>
                <div>
                  <Label>Código (identificador único)</Label>
                  <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} />
                </div>
              </div>

              {/* Categoría */}
              <div>
                <Label>Categoría</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        <div>
                          <span>{c.label}</span>
                          <span className="text-xs text-stone-400 ml-2">{c.descripcion}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Descripción */}
              <div>
                <Label>Descripción</Label>
                <Input 
                  value={descripcion} 
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción del uso de esta plantilla"
                />
              </div>

              {/* Configuración de datos */}
              <Card className="bg-stone-50">
                <CardHeader className="py-2">
                  <CardTitle className="text-sm">Configuración de Datos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Nombre de la Hoja</Label>
                      <Input 
                        value={hojaDatos} 
                        onChange={(e) => setHojaDatos(e.target.value)}
                        placeholder="Datos"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Fila Inicio de Datos</Label>
                      <Input 
                        type="number"
                        value={filaInicio} 
                        onChange={(e) => setFilaInicio(e.target.value)}
                        placeholder="7"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Rango de Datos (ej: A7:F50)</Label>
                    <Input 
                      value={rangoDatos} 
                      onChange={(e) => setRangoDatos(e.target.value)}
                      placeholder="A7:F50"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Mapeo de Columnas (JSON)</Label>
                    <Input 
                      value={columnasMapping} 
                      onChange={(e) => setColumnasMapping(e.target.value)}
                      placeholder='["fecha", "tropa", "cabezas", "peso"]'
                    />
                    <p className="text-xs text-stone-400 mt-1">
                      Orden de las columnas de datos
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Marcadores */}
              <div>
                <Label>Marcadores Personalizados (JSON)</Label>
                <Textarea
                  value={marcadores}
                  onChange={(e) => setMarcadores(e.target.value)}
                  placeholder='{"A3": "{{EMPRESA}}", "A4": "{{FECHA}}", "B5": "{{TITULO}}"}'
                  rows={3}
                />
                <p className="text-xs text-stone-400 mt-1">
                  Mapeo de celdas a variables. Ej: {`{"A3": "{{FECHA}}"}`}
                </p>
              </div>

              {/* Variables disponibles */}
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-3">
                  <p className="text-xs font-medium text-amber-800 mb-2">Variables Disponibles:</p>
                  <div className="flex flex-wrap gap-1">
                    {['FECHA', 'TROPA', 'PRODUCTOR', 'CABEZAS', 'PESO', 'ESPECIE', 'CORRAL', 'ESTADO', 'OBSERVACIONES'].map(v => (
                      <code key={v} className="text-xs bg-amber-100 px-1.5 py-0.5 rounded text-amber-700">
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModalSubir(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubir} 
              disabled={subiendo || !archivo}
              className="bg-green-600 hover:bg-green-700"
            >
              {subiendo ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Guardar Plantilla
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Preview */}
      <Dialog open={modalPreview} onOpenChange={setModalPreview}>
        <DialogContent className="max-w-md" maximizable>
          <DialogHeader>
            <DialogTitle>Configuración de Plantilla</DialogTitle>
          </DialogHeader>
          
          {plantillaSeleccionada && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-stone-500">Nombre</Label>
                <p className="font-medium">{plantillaSeleccionada.nombre}</p>
              </div>
              <div>
                <Label className="text-xs text-stone-500">Código</Label>
                <p className="font-mono">{plantillaSeleccionada.codigo}</p>
              </div>
              <div>
                <Label className="text-xs text-stone-500">Archivo Original</Label>
                <p>{plantillaSeleccionada.archivoNombre}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-stone-500">Hoja de Datos</Label>
                  <p>{plantillaSeleccionada.hojaDatos || 'Datos'}</p>
                </div>
                <div>
                  <Label className="text-xs text-stone-500">Fila Inicio</Label>
                  <p>{plantillaSeleccionada.filaInicio || 1}</p>
                </div>
              </div>
              {plantillaSeleccionada.rangoDatos && (
                <div>
                  <Label className="text-xs text-stone-500">Rango de Datos</Label>
                  <p>{plantillaSeleccionada.rangoDatos}</p>
                </div>
              )}
              {plantillaSeleccionada.columnas && (
                <div>
                  <Label className="text-xs text-stone-500">Columnas</Label>
                  <p className="font-mono text-sm">{plantillaSeleccionada.columnas}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalPreview(false)}>
              Cerrar
            </Button>
            <Button onClick={() => plantillaSeleccionada && handleDescargar(plantillaSeleccionada)}>
              <Download className="w-4 h-4 mr-2" />
              Descargar Original
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ConfigPlantillasModule
