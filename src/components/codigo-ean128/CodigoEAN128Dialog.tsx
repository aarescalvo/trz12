'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QrCode, Copy, Printer, Check } from 'lucide-react'
import {
  generarCodigoEAN128,
  formatearCodigoVisual,
  getNombreArticulo,
  getNombreDestino,
  CODIGOS_ARTICULO,
  CODIGOS_ESPECIE,
  CODIGOS_TIPIFICACION,
  CODIGOS_TIPO_TRABAJO,
  CODIGOS_TRANSPORTE,
  CODIGOS_DESTINO,
  type CodigoEAN128Data
} from '@/lib/codigo-ean128'

interface CodigoEAN128DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Partial<CodigoEAN128Data>
  onGenerate?: (codigo: string) => void
}

export function CodigoEAN128Dialog({
  open,
  onOpenChange,
  initialData,
  onGenerate
}: CodigoEAN128DialogProps) {
  const [articulo, setArticulo] = useState(initialData?.articulo || '001')
  const [especie, setEspecie] = useState(initialData?.especie || '0')
  const [tipificacion, setTipificacion] = useState(initialData?.tipificacion || '02')
  const [tipoTrabajo, setTipoTrabajo] = useState(initialData?.tipoTrabajo || '0')
  const [transporte, setTransporte] = useState(initialData?.transporte || '6')
  const [destino, setDestino] = useState(initialData?.destino || '01')
  const [fechaProduccion, setFechaProduccion] = useState(
    initialData?.fechaProduccion || new Date()
  )
  const [lote, setLote] = useState(initialData?.lote || 1)
  const [unidades, setUnidades] = useState(initialData?.unidades || 1)
  const [pesoNeto, setPesoNeto] = useState(initialData?.pesoNeto || 0)
  const [numCaja, setNumCaja] = useState(initialData?.numCaja || 1)
  const [pesoBruto, setPesoBruto] = useState(initialData?.pesoBruto || 0)
  
  const [codigoGenerado, setCodigoGenerado] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const handleGenerar = () => {
    const data: CodigoEAN128Data = {
      articulo,
      especie,
      tipificacion,
      tipoTrabajo,
      transporte,
      destino,
      fechaProduccion,
      lote,
      unidades,
      pesoNeto,
      numCaja,
      pesoBruto
    }
    
    const codigo = generarCodigoEAN128(data)
    setCodigoGenerado(codigo)
    onGenerate?.(codigo)
  }

  const handleCopy = async () => {
    if (codigoGenerado) {
      await navigator.clipboard.writeText(codigoGenerado)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePrint = () => {
    if (!codigoGenerado) return
    
    const printWindow = window.open('', '_blank', 'width=400,height=200')
    if (!printWindow) return
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Código EAN-128</title>
        <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+128+Text&display=swap" rel="stylesheet">
        <style>
          @page { size: 100mm 50mm landscape; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            width: 100mm;
            height: 50mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 5mm;
          }
          .barcode {
            font-family: 'Libre Barcode 128 Text', cursive;
            font-size: 48px;
          }
          .codigo-text {
            font-family: 'Courier New', monospace;
            font-size: 10px;
            margin-top: 5px;
          }
          .info {
            font-size: 8px;
            margin-top: 5px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="barcode">${codigoGenerado}</div>
        <div class="codigo-text">${formatearCodigoVisual(codigoGenerado)}</div>
        <div class="info">
          ${getNombreArticulo(articulo)} | Lote: ${lote} | ${pesoNeto.toFixed(2)}kg
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }, 300);
          }
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" maximizable>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Generador de Código EAN-128
          </DialogTitle>
          <DialogDescription>
            Configure los parámetros para generar el código de barras EAN-128
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Datos Fijos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Datos Fijos (10 dígitos)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Artículo (3 dígitos)</Label>
                <Select value={articulo} onValueChange={setArticulo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CODIGOS_ARTICULO).map(([codigo, info]) => (
                      <SelectItem key={codigo} value={codigo}>
                        {codigo} - {info.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs">Especie (1 dígito)</Label>
                <Select value={especie} onValueChange={setEspecie}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CODIGOS_ESPECIE).map(([codigo, info]) => (
                      <SelectItem key={codigo} value={codigo}>
                        {codigo} - {info.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs">Tipificación (2 dígitos)</Label>
                <Select value={tipificacion} onValueChange={setTipificacion}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CODIGOS_TIPIFICACION).map(([codigo, info]) => (
                      <SelectItem key={codigo} value={codigo}>
                        {codigo} - {info.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Tipo Trab.</Label>
                  <Select value={tipoTrabajo} onValueChange={setTipoTrabajo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CODIGOS_TIPO_TRABAJO).map(([codigo, info]) => (
                        <SelectItem key={codigo} value={codigo}>
                          {codigo} - {info.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs">Transporte</Label>
                  <Select value={transporte} onValueChange={setTransporte}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CODIGOS_TRANSPORTE).map(([codigo, info]) => (
                        <SelectItem key={codigo} value={codigo}>
                          {codigo} - {info.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs">Destino</Label>
                  <Select value={destino} onValueChange={setDestino}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CODIGOS_DESTINO).map(([codigo, info]) => (
                        <SelectItem key={codigo} value={codigo}>
                          {codigo} - {info.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Datos Variables */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Datos Variables (28 dígitos)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Fecha Producción</Label>
                <Input
                  type="date"
                  value={fechaProduccion.toISOString().split('T')[0]}
                  onChange={(e) => setFechaProduccion(new Date(e.target.value))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Lote (6 dígitos)</Label>
                  <Input
                    type="number"
                    value={lote}
                    onChange={(e) => setLote(parseInt(e.target.value) || 0)}
                    min={0}
                    max={999999}
                  />
                </div>
                
                <div>
                  <Label className="text-xs">Unidades (2 dígitos)</Label>
                  <Input
                    type="number"
                    value={unidades}
                    onChange={(e) => setUnidades(parseInt(e.target.value) || 0)}
                    min={0}
                    max={99}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Peso Neto (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pesoNeto}
                    onChange={(e) => setPesoNeto(parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div>
                  <Label className="text-xs">N° Caja</Label>
                  <Input
                    type="number"
                    value={numCaja}
                    onChange={(e) => setNumCaja(parseInt(e.target.value) || 0)}
                    min={0}
                    max={9999}
                  />
                </div>
                
                <div>
                  <Label className="text-xs">Peso Bruto (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pesoBruto}
                    onChange={(e) => setPesoBruto(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Código Generado */}
        {codigoGenerado && (
          <Card className="mt-4">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs">
                  EAN-128 ({codigoGenerado.length} dígitos)
                </Badge>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="h-7"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="h-7"
                  >
                    <Printer className="h-3 w-3 mr-1" />
                    Imprimir
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div
                  className="text-2xl mb-2"
                  style={{ fontFamily: "'Libre Barcode 128 Text', cursive" }}
                >
                  {codigoGenerado}
                </div>
                <div className="font-mono text-xs text-gray-600 break-all">
                  {formatearCodigoVisual(codigoGenerado)}
                </div>
              </div>
              
              <div className="mt-3 text-xs text-gray-500 grid grid-cols-2 gap-2">
                <div><strong>Artículo:</strong> {getNombreArticulo(articulo)}</div>
                <div><strong>Destino:</strong> {getNombreDestino(destino)}</div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={handleGenerar}>
            <QrCode className="h-4 w-4 mr-2" />
            Generar Código
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { CODIGOS_ARTICULO, CODIGOS_ESPECIE, CODIGOS_TIPIFICACION, CODIGOS_TIPO_TRABAJO, CODIGOS_TRANSPORTE, CODIGOS_DESTINO }
