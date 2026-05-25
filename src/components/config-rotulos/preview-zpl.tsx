'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  Eye, Loader2, FileText, Variable, Copy, Download
} from 'lucide-react'

interface Props {
  rotuloId: string | null
  rotuloNombre: string
  tipoPlantilla: string
}

interface VariableInfo {
  variable: string
  campo: string
  descripcion: string
}

export function PreviewZPL({ rotuloId, rotuloNombre, tipoPlantilla }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [zplOriginal, setZplOriginal] = useState('')
  const [zplProcesado, setZplProcesado] = useState('')
  const [variables, setVariables] = useState<VariableInfo[]>([])
  const [dimensiones, setDimensiones] = useState({ ancho: 80, alto: 50 })

  const cargarPreview = async () => {
    if (!rotuloId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/rotulos/procesar-zpl?rotuloId=${rotuloId}`)
      if (response.ok) {
        const data = await response.json()
        setZplOriginal(data.zplOriginal || '')
        setZplProcesado(data.zpl || '')
        setVariables(data.variables || [])
        setDimensiones({
          ancho: data.rotulo?.ancho || 80,
          alto: data.rotulo?.alto || 50
        })
      } else {
        toast.error('Error al cargar preview')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar preview')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (modalOpen && rotuloId) {
      cargarPreview()
    }
  }, [modalOpen, rotuloId])

  const handleCopyZPL = () => {
    navigator.clipboard.writeText(zplProcesado)
    toast.success('ZPL copiado al portapapeles')
  }

  const handleDownloadZPL = () => {
    const blob = new Blob([zplProcesado], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${rotuloNombre.replace(/\s+/g, '_')}.zpl`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Archivo ZPL descargado')
  }

  if (tipoPlantilla !== 'ZPL') {
    return null
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={() => setModalOpen(true)}
        title="Ver ZPL"
      >
        <Eye className="w-3 h-3 text-blue-500" />
      </Button>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh]" maximizable>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Vista Previa ZPL: {rotuloNombre}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* Panel izquierdo - ZPL Original */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">ZPL Original (Plantilla)</h3>
                  <Badge variant="outline">{dimensiones.ancho}×{dimensiones.alto} mm</Badge>
                </div>
                <ScrollArea className="h-[400px] border rounded-md">
                  <Textarea
                    value={zplOriginal}
                    readOnly
                    className="min-h-[400px] font-mono text-xs bg-stone-900 text-green-400 border-0 resize-none"
                  />
                </ScrollArea>
              </div>

              {/* Panel derecho - ZPL Procesado */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">ZPL Procesado (con datos de prueba)</h3>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={handleCopyZPL}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleDownloadZPL}>
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-[400px] border rounded-md">
                  <Textarea
                    value={zplProcesado}
                    readOnly
                    className="min-h-[400px] font-mono text-xs bg-stone-900 text-yellow-400 border-0 resize-none"
                  />
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Variables disponibles */}
          {variables.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Variable className="w-4 h-4" />
                Variables Disponibles
              </h3>
              <div className="flex flex-wrap gap-2">
                {variables.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 bg-stone-100 px-2 py-1 rounded text-xs">
                    <code className="text-blue-600">{v.variable}</code>
                    <span className="text-stone-500">→</span>
                    <span className="text-stone-600">{v.descripcion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instrucciones */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-sm text-blue-800 mb-1">Cómo usar:</h4>
            <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
              <li>En Zebra Designer, diseñe su etiqueta usando variables como {'{{FECHA}}'}, {'{{TROPA}}'}, etc.</li>
              <li>Exporte el diseño como archivo .zpl o .prn</li>
              <li>Importe el archivo usando el botón "Importar ZPL"</li>
              <li>Al imprimir, el sistema reemplazará automáticamente las variables con los datos reales</li>
            </ol>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
