'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  Upload, FileText, Loader2, Eye, Check, X, Info, Variable
} from 'lucide-react'
import { TipoRotulo } from '@prisma/client'

interface Props {
  onImportSuccess: () => void
}

const TIPOS_ROTULO: { value: TipoRotulo; label: string }[] = [
  { value: 'MEDIA_RES', label: 'Media Res' },
  { value: 'CUARTO', label: 'Cuarto' },
  { value: 'MENUDENCIA', label: 'Menudencia' },
  { value: 'PRODUCTO_TERMINADO_ENVASE_PRIMARIO', label: 'Envase Primario' },
  { value: 'PRODUCTO_TERMINADO_ENVASE_SECUNDARIO', label: 'Envase Secundario' },
  { value: 'PRODUCTO_TERMINADO_UN_ENVASE', label: 'Un Envase' },
]

interface VariableDetectada {
  variable: string
  campo: string
  descripcion: string
}

export function ImportadorZPL({ onImportSuccess }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [contenidoPreview, setContenidoPreview] = useState('')
  const [variablesDetectadas, setVariablesDetectadas] = useState<VariableDetectada[]>([])
  const [subiendo, setSubiendo] = useState(false)
  
  // Campos del formulario
  const [nombre, setNombre] = useState('')
  const [codigo, setCodigo] = useState('')
  const [tipo, setTipo] = useState<TipoRotulo>('MEDIA_RES')
  const [ancho, setAncho] = useState(80)
  const [alto, setAlto] = useState(50)
  const [diasConsumo, setDiasConsumo] = useState(30)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Verificar extensión
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!['zpl', 'prn', 'txt'].includes(extension || '')) {
      toast.error('El archivo debe ser .zpl, .prn o .txt')
      return
    }

    setArchivo(file)
    
    // Leer contenido para preview
    const contenido = await file.text()
    setContenidoPreview(contenido)
    
    // Detectar variables
    const variables = detectarVariables(contenido)
    setVariablesDetectadas(variables)
    
    // Sugerir nombre y código basado en el nombre del archivo
    const nombreBase = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
    setNombre(nombreBase)
    setCodigo(file.name.replace(/\.[^/.]+$/, '').toUpperCase().replace(/\s+/g, '_'))
  }

  const detectarVariables = (contenido: string): VariableDetectada[] => {
    const variables: VariableDetectada[] = []
    const encontradas = new Set<string>()
    
    // Buscar variables en formato {{VARIABLE}} y &VARIABLE&
    const regexDobleLlave = /\{\{([A-Z_0-9]+)\}\}/g
    const regexAmpersand = /&([A-Z_0-9]+)&/g
    
    let match
    while ((match = regexDobleLlave.exec(contenido)) !== null) {
      encontradas.add(match[1])
    }
    while ((match = regexAmpersand.exec(contenido)) !== null) {
      encontradas.add(match[1])
    }

    // Mapeo de variables
    const mapeoCampos: Record<string, { campo: string; descripcion: string }> = {
      'FECHA': { campo: 'fechaFaena', descripcion: 'Fecha de faena' },
      'FECHA_FAENA': { campo: 'fechaFaena', descripcion: 'Fecha de faena' },
      'FECHA_VENC': { campo: 'fechaVencimiento', descripcion: 'Fecha de vencimiento' },
      'FECHA_VENCIMIENTO': { campo: 'fechaVencimiento', descripcion: 'Fecha de vencimiento' },
      'TROPA': { campo: 'tropa', descripcion: 'Código de tropa' },
      'GARRON': { campo: 'garron', descripcion: 'Número de garrón' },
      'PESO': { campo: 'peso', descripcion: 'Peso' },
      'PRODUCTO': { campo: 'nombreProducto', descripcion: 'Nombre del producto' },
      'ESTABLECIMIENTO': { campo: 'establecimiento', descripcion: 'Establecimiento' },
      'NRO_ESTABLECIMIENTO': { campo: 'nroEstablecimiento', descripcion: 'N° Establecimiento' },
      'SENASA': { campo: 'nroSenasa', descripcion: 'Número SENASA' },
      'USUARIO_FAENA': { campo: 'nombreUsuarioFaena', descripcion: 'Usuario de faena' },
      'CUIT_USUARIO': { campo: 'cuitUsuarioFaena', descripcion: 'CUIT usuario' },
      'MATRICULA': { campo: 'matriculaUsuarioFaena', descripcion: 'Matrícula' },
      'CODIGO_BARRAS': { campo: 'codigoBarras', descripcion: 'Código de barras' },
      'LOTE': { campo: 'lote', descripcion: 'Número de lote' },
    }

    encontradas.forEach(variable => {
      const mapeo = mapeoCampos[variable] || { campo: variable.toLowerCase(), descripcion: variable }
      variables.push({
        variable: `{{${variable}}}`,
        campo: mapeo.campo,
        descripcion: mapeo.descripcion
      })
    })

    return variables
  }

  const handleSubir = async () => {
    if (!archivo) {
      toast.error('Seleccione un archivo ZPL')
      return
    }
    if (!nombre || !codigo) {
      toast.error('Complete el nombre y código del rótulo')
      return
    }

    setSubiendo(true)
    try {
      const formData = new FormData()
      formData.append('file', archivo)
      formData.append('nombre', nombre)
      formData.append('codigo', codigo)
      formData.append('tipo', tipo)
      formData.append('ancho', String(ancho))
      formData.append('alto', String(alto))
      formData.append('diasConsumo', String(diasConsumo))

      const response = await fetch('/api/rotulos/upload-zpl', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast.success('Plantilla ZPL importada correctamente')
        setModalOpen(false)
        resetForm()
        onImportSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al subir plantilla')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al subir plantilla ZPL')
    } finally {
      setSubiendo(false)
    }
  }

  const resetForm = () => {
    setArchivo(null)
    setContenidoPreview('')
    setVariablesDetectadas([])
    setNombre('')
    setCodigo('')
    setTipo('MEDIA_RES')
    setAncho(80)
    setAlto(50)
    setDiasConsumo(30)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <Button 
        onClick={() => setModalOpen(true)} 
        variant="outline"
        className="border-blue-500 text-blue-600 hover:bg-blue-50"
      >
        <Upload className="w-4 h-4 mr-2" />
        Importar ZPL
      </Button>

      <Dialog open={modalOpen} onOpenChange={(open) => {
        setModalOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh]" maximizable>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Importar Plantilla ZPL desde Zebra Designer
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 overflow-hidden">
            {/* Panel izquierdo - Formulario */}
            <div className="space-y-4">
              {/* Selector de archivo */}
              <div>
                <Label>Archivo ZPL / PRN</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".zpl,.prn,.txt"
                    onChange={handleFileSelect}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Archivos generados desde Zebra Designer (.zpl, .prn, .txt)
                </p>
              </div>

              {/* Datos del rótulo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nombre del Rótulo</Label>
                  <Input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Media Res Bovino"
                  />
                </div>
                <div>
                  <Label>Código</Label>
                  <Input
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Ej: MEDIA_RES_ZPL"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo de Rótulo</Label>
                  <Select value={tipo} onValueChange={(v) => setTipo(v as TipoRotulo)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_ROTULO.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Días de Consumo</Label>
                  <Input
                    type="number"
                    value={diasConsumo}
                    onChange={(e) => setDiasConsumo(parseInt(e.target.value) || 30)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ancho (mm)</Label>
                  <Input
                    type="number"
                    value={ancho}
                    onChange={(e) => setAncho(parseInt(e.target.value) || 80)}
                  />
                </div>
                <div>
                  <Label>Alto (mm)</Label>
                  <Input
                    type="number"
                    value={alto}
                    onChange={(e) => setAlto(parseInt(e.target.value) || 50)}
                  />
                </div>
              </div>

              {/* Variables detectadas */}
              {variablesDetectadas.length > 0 && (
                <div>
                  <Label className="flex items-center gap-2">
                    <Variable className="w-4 h-4" />
                    Variables Detectadas ({variablesDetectadas.length})
                  </Label>
                  <ScrollArea className="h-32 mt-1 border rounded-md p-2 bg-stone-50">
                    <div className="space-y-1">
                      {variablesDetectadas.map((v, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <code className="bg-blue-100 text-blue-800 px-1 rounded text-xs">
                            {v.variable}
                          </code>
                          <span className="text-stone-600 text-xs">{v.descripcion}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            {/* Panel derecho - Preview del ZPL */}
            <div className="flex flex-col">
              <Label>Contenido del Archivo ZPL</Label>
              <ScrollArea className="flex-1 mt-1 border rounded-md">
                <Textarea
                  value={contenidoPreview}
                  readOnly
                  className="min-h-[300px] font-mono text-xs bg-stone-900 text-green-400 border-0 resize-none"
                  placeholder="El contenido del archivo ZPL aparecerá aquí..."
                />
              </ScrollArea>
              
              {/* Info sobre formato */}
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div className="text-xs text-blue-700">
                    <p className="font-medium mb-1">Formato de Variables:</p>
                    <p>Use <code className="bg-blue-100 px-1 rounded">{'{{VARIABLE}}'}</code> o <code className="bg-blue-100 px-1 rounded">&VARIABLE&</code> en su plantilla ZPL</p>
                    <p className="mt-1">Ejemplo: <code className="bg-blue-100 px-1 rounded">{'{{FECHA}}'}</code>, <code className="bg-blue-100 px-1 rounded">{'{{TROPA}}'}</code>, <code className="bg-blue-100 px-1 rounded">{'{{GARRON}}'}</code></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={handleSubir} 
              disabled={subiendo || !archivo}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {subiendo ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Importar Plantilla
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
