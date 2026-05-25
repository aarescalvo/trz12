'use client'

import { RotuloElement } from './VisualEditor'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Upload, Trash2 } from 'lucide-react'
import { useRef } from 'react'

interface Variable {
  id: string
  nombre: string
  ejemplo: string
}

interface ElementEditorProps {
  elemento: RotuloElement
  onChange: (cambios: Partial<RotuloElement>) => void
  onImageLoad: (file: File) => void
  variables: Variable[]
}

export function ElementEditor({
  elemento,
  onChange,
  onImageLoad,
  variables,
}: ElementEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 500000) {
        alert('La imagen no puede superar 500KB')
        return
      }
      onImageLoad(file)
    }
  }

  return (
    <div className="space-y-3">
      {/* Tipo */}
      <div className="p-2 bg-stone-50 rounded text-center">
        <span className="text-xs font-medium text-stone-600">
          {elemento.tipo}
        </span>
      </div>

      {/* Posición */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">X (pts)</Label>
          <Input
            type="number"
            value={elemento.posX}
            onChange={(e) => onChange({ posX: parseInt(e.target.value) || 0 })}
            className="h-7 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Y (pts)</Label>
          <Input
            type="number"
            value={elemento.posY}
            onChange={(e) => onChange({ posY: parseInt(e.target.value) || 0 })}
            className="h-7 text-sm"
          />
        </div>
      </div>

      {/* Tamaño */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Ancho</Label>
          <Input
            type="number"
            value={elemento.ancho}
            onChange={(e) => onChange({ ancho: parseInt(e.target.value) || 10 })}
            className="h-7 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Alto</Label>
          <Input
            type="number"
            value={elemento.alto}
            onChange={(e) => onChange({ alto: parseInt(e.target.value) || 10 })}
            className="h-7 text-sm"
            disabled={elemento.tipo === 'LINEA'}
          />
        </div>
      </div>

      {/* Configuración específica por tipo */}
      {elemento.tipo === 'TEXTO' && (
        <>
          {/* Campo o texto fijo */}
          <div>
            <Label className="text-xs">Contenido</Label>
            <Select
              value={elemento.campo || 'FIJO'}
              onValueChange={(v) => onChange({
                campo: v === 'FIJO' ? undefined : v,
                textoFijo: v === 'FIJO' ? (elemento.textoFijo || 'Texto') : undefined
              })}
            >
              <SelectTrigger className="h-7 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIJO">Texto fijo</SelectItem>
                {variables.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.nombre} ({`{{${v.id}}}`})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Texto fijo */}
          {!elemento.campo && (
            <div>
              <Label className="text-xs">Texto</Label>
              <Input
                value={elemento.textoFijo || ''}
                onChange={(e) => onChange({ textoFijo: e.target.value })}
                className="h-7 text-sm"
              />
            </div>
          )}

          {/* Fuente */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Fuente</Label>
              <Select
                value={elemento.fuente}
                onValueChange={(v) => onChange({ fuente: v })}
              >
                <SelectTrigger className="h-7 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Font 0 (10pt)</SelectItem>
                  <SelectItem value="1">Font 1 (8pt)</SelectItem>
                  <SelectItem value="2">Font 2 (10pt)</SelectItem>
                  <SelectItem value="3">Font 3 (12pt)</SelectItem>
                  <SelectItem value="4">Font 4 (14pt)</SelectItem>
                  <SelectItem value="5">Font 5 (20pt)</SelectItem>
                  <SelectItem value="A">Font A (5pt)</SelectItem>
                  <SelectItem value="B">Font B (8pt)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tamaño</Label>
              <Input
                type="number"
                value={elemento.tamano}
                onChange={(e) => onChange({ tamano: parseInt(e.target.value) || 10 })}
                className="h-7 text-sm"
                min={6}
                max={72}
              />
            </div>
          </div>

          {/* Negrita y alineación */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={elemento.negrita}
                onCheckedChange={(v) => onChange({ negrita: v })}
              />
              <Label className="text-xs">Negrita</Label>
            </div>
            <div>
              <Label className="text-xs">Alineación</Label>
              <Select
                value={elemento.alineacion}
                onValueChange={(v) => onChange({ alineacion: v as 'LEFT' | 'CENTER' | 'RIGHT' })}
              >
                <SelectTrigger className="h-7 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEFT">Izquierda</SelectItem>
                  <SelectItem value="CENTER">Centro</SelectItem>
                  <SelectItem value="RIGHT">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

      {/* Configuración código de barras */}
      {elemento.tipo === 'CODIGO_BARRAS' && (
        <>
          <div>
            <Label className="text-xs">Variable</Label>
            <Select
              value={elemento.campo || 'CODIGO_BARRAS'}
              onValueChange={(v) => onChange({ campo: v })}
            >
              <SelectTrigger className="h-7 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {variables.filter(v => 
                  v.id.includes('CODIGO') || 
                  v.id.includes('GARRON') || 
                  v.id.includes('TROPA') ||
                  v.id.includes('CUIT') ||
                  v.id.includes('NUMERO') ||
                  v.id.includes('CARAVANA')
                ).map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select
                value={elemento.tipoCodigo || 'CODE128'}
                onValueChange={(v) => onChange({ tipoCodigo: v })}
              >
                <SelectTrigger className="h-7 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CODE128">Code 128</SelectItem>
                  <SelectItem value="CODE39">Code 39</SelectItem>
                  <SelectItem value="ITF14">ITF-14 (Interleaved 2of5)</SelectItem>
                  <SelectItem value="I25">Interleaved 2 of 5</SelectItem>
                  <SelectItem value="EAN13">EAN-13</SelectItem>
                  <SelectItem value="EAN8">EAN-8</SelectItem>
                  <SelectItem value="UPC">UPC-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Alto</Label>
              <Input
                type="number"
                value={elemento.altoCodigo || 50}
                onChange={(e) => onChange({ altoCodigo: parseInt(e.target.value) || 50 })}
                className="h-7 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={elemento.mostrarTexto !== false}
              onCheckedChange={(v) => onChange({ mostrarTexto: v })}
            />
            <Label className="text-xs">Mostrar texto</Label>
          </div>
        </>
      )}

      {/* Configuración QR */}
      {elemento.tipo === 'QR' && (
        <div>
          <Label className="text-xs">Variable/Texto</Label>
          <Select
            value={elemento.campo || 'CODIGO'}
            onValueChange={(v) => onChange({ campo: v })}
          >
            <SelectTrigger className="h-7 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {variables.map(v => (
                <SelectItem key={v.id} value={v.id}>
                  {v.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Configuración línea */}
      {elemento.tipo === 'LINEA' && (
        <div>
          <Label className="text-xs">Grosor</Label>
          <Input
            type="number"
            value={elemento.grosorLinea || 2}
            onChange={(e) => onChange({ grosorLinea: parseInt(e.target.value) || 2 })}
            className="h-7 text-sm"
            min={1}
            max={10}
          />
        </div>
      )}

      {/* Configuración rectángulo */}
      {elemento.tipo === 'RECTANGULO' && (
        <div>
          <Label className="text-xs">Grosor borde</Label>
          <Input
            type="number"
            value={elemento.grosorLinea || 2}
            onChange={(e) => onChange({ grosorLinea: parseInt(e.target.value) || 2 })}
            className="h-7 text-sm"
            min={1}
            max={10}
          />
        </div>
      )}

      {/* Configuración imagen */}
      {elemento.tipo === 'IMAGEN' && (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {elemento.imagenBase64 ? (
            <div className="space-y-2">
              <img
                src={elemento.imagenBase64}
                alt="Preview"
                className="w-full h-24 object-contain border rounded"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Cambiar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChange({ imagenBase64: undefined })}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-24 border-dashed"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Cargar imagen
            </Button>
          )}
          
          <p className="text-[10px] text-stone-400">
            Formatos: PNG, JPG, BMP (máx. 500KB)
          </p>
        </div>
      )}
    </div>
  )
}
