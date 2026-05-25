// NOTA: Componente disponible para uso futuro - verificar antes de eliminar
/**
 * Componente de vista previa visual del rótulo MEDIA RES
 * Simula cómo se verá el rótulo impreso
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DatosRotulo {
  nombreCliente: string
  cuitCliente: string
  matriculaCliente: string
  fechaFaena: string
  tropa: string
  garron: string
  lado: 'DER' | 'IZQ'
  clasificacion: 'A' | 'T' | 'D'
  kg: string
}

export default function VistaPreviaRotulo() {
  const [datos, setDatos] = useState<DatosRotulo>({
    nombreCliente: 'JUAN PEREZ',
    cuitCliente: '20-12345678-9',
    matriculaCliente: '1234',
    fechaFaena: '08/04/2025',
    tropa: 'B 2026 0100',
    garron: '0015',
    lado: 'DER',
    clasificacion: 'A',
    kg: '125.5'
  })

  const [showZpl, setShowZpl] = useState(false)
  const [zpl, setZpl] = useState('')

  // Calcular fecha vencimiento
  const calcularVencimiento = () => {
    const partes = datos.fechaFaena.split('/')
    if (partes.length === 3) {
      const fecha = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]))
      fecha.setDate(fecha.getDate() + 13)
      return fecha.toLocaleDateString('es-AR')
    }
    return ''
  }

  // Generar código de barras
  const generarCodigoBarras = () => {
    return `${datos.tropa.replace(/\s/g, '')}-${datos.garron}-${datos.lado}-${datos.clasificacion}`
  }

  // Obtener ZPL del servidor
  useEffect(() => {
    const fetchZpl = async () => {
      try {
        const res = await fetch('/api/rotulos/preview-media-res', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...datos,
            vencimiento: calcularVencimiento(),
            codigoBarras: generarCodigoBarras()
          })
        })
        const data = await res.json()
        if (data.zpl) setZpl(data.zpl)
      } catch (e) {
        console.error('Error fetching ZPL:', e)
      }
    }
    fetchZpl()
  }, [datos])

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Vista Previa - Rótulo Media Res</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de datos */}
        <Card>
          <CardHeader>
            <CardTitle>Datos del Rótulo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre Cliente</Label>
                <Input 
                  value={datos.nombreCliente} 
                  onChange={e => setDatos({...datos, nombreCliente: e.target.value.toUpperCase()})}
                />
              </div>
              <div>
                <Label>CUIT</Label>
                <Input 
                  value={datos.cuitCliente}
                  onChange={e => setDatos({...datos, cuitCliente: e.target.value})}
                />
              </div>
              <div>
                <Label>Matrícula</Label>
                <Input 
                  value={datos.matriculaCliente}
                  onChange={e => setDatos({...datos, matriculaCliente: e.target.value})}
                />
              </div>
              <div>
                <Label>Fecha Faena</Label>
                <Input 
                  value={datos.fechaFaena}
                  onChange={e => setDatos({...datos, fechaFaena: e.target.value})}
                  placeholder="DD/MM/YYYY"
                />
              </div>
              <div>
                <Label>Tropa</Label>
                <Input 
                  value={datos.tropa}
                  onChange={e => setDatos({...datos, tropa: e.target.value.toUpperCase()})}
                />
              </div>
              <div>
                <Label>Garrón</Label>
                <Input 
                  value={datos.garron}
                  onChange={e => setDatos({...datos, garron: e.target.value})}
                />
              </div>
              <div>
                <Label>Lado</Label>
                <div className="flex gap-2 mt-1">
                  <Button 
                    variant={datos.lado === 'DER' ? 'default' : 'outline'}
                    onClick={() => setDatos({...datos, lado: 'DER'})}
                    className={datos.lado === 'DER' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                  >DER</Button>
                  <Button 
                    variant={datos.lado === 'IZQ' ? 'default' : 'outline'}
                    onClick={() => setDatos({...datos, lado: 'IZQ'})}
                    className={datos.lado === 'IZQ' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                  >IZQ</Button>
                </div>
              </div>
              <div>
                <Label>Clasificación</Label>
                <div className="flex gap-2 mt-1">
                  {(['A', 'T', 'D'] as const).map(c => (
                    <Button 
                      key={c}
                      variant={datos.clasificacion === c ? 'default' : 'outline'}
                      onClick={() => setDatos({...datos, clasificacion: c})}
                      className={datos.clasificacion === c ? 'bg-amber-500 hover:bg-amber-600' : ''}
                    >{c}</Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Peso (KG)</Label>
                <Input 
                  value={datos.kg}
                  onChange={e => setDatos({...datos, kg: e.target.value})}
                />
              </div>
            </div>
            
            <Button 
              onClick={() => setShowZpl(!showZpl)}
              variant="outline"
              className="w-full mt-4"
            >
              {showZpl ? 'Ocultar ZPL' : 'Ver Código ZPL'}
            </Button>
            
            {showZpl && (
              <pre className="mt-4 p-4 bg-gray-900 text-green-400 text-xs overflow-auto rounded max-h-64">
                {zpl}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Vista previa del rótulo */}
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa (10cm × 15cm)</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="bg-white border-2 border-gray-300 mx-auto relative"
              style={{ 
                width: '300px',  // Escala aproximada
                minHeight: '450px',
                padding: '10px',
                fontSize: '9px',
                fontFamily: 'Arial, sans-serif'
              }}
            >
              {/* Logo Solemar placeholder */}
              <div className="flex justify-center mb-1">
                <div className="bg-gray-200 px-4 py-1 text-xs font-bold text-gray-600 border border-gray-300">
                  [LOGO SOLEMAR]
                </div>
              </div>
              
              {/* Encabezado */}
              <div className="text-center text-[8px] leading-tight">
                <div className="font-bold">ESTABLECIMIENTO FAENADOR SOLEMAR ALIMENTARIA S.A</div>
                <div>EST. OFICIAL N° 3986</div>
                <div>CUIT: 30-70919450-6</div>
                <div>MATRICULA N°: 300</div>
                <div className="text-[7px]">RUTA NAC. N° 22, KM 1043 - CHIMPAY - RIO NEGRO</div>
              </div>
              
              {/* Línea */}
              <div className="border-t border-black my-1"></div>
              
              {/* Datos cliente */}
              <div className="text-[8px]">
                <div><span className="font-bold">TITULAR DE FAENA:</span> {datos.nombreCliente}</div>
                <div><span className="font-bold">CUIT N°:</span> {datos.cuitCliente}</div>
                <div><span className="font-bold">MATRICULA N°:</span> {datos.matriculaCliente}</div>
              </div>
              
              {/* Línea */}
              <div className="border-t border-black my-1"></div>
              
              {/* Tipo producto */}
              <div className="text-center font-bold text-[9px] my-1">
                CARNE VACUNA CON HUESO ENFRIADA
              </div>
              
              {/* Logo SENASA */}
              <div className="flex items-center gap-2 my-1">
                <div className="bg-gray-200 px-2 py-1 text-[7px] border border-gray-300 w-12 text-center">
                  [SENASA]
                </div>
                <div className="text-[8px]">
                  <div>SENASA N° 3986/141334/1</div>
                  <div>INDUSTRIA ARGENTINA</div>
                </div>
              </div>
              
              {/* MEDIA RES destacado */}
              <div className="bg-black text-white text-center py-1 my-2 font-bold text-sm">
                MEDIA RES
              </div>
              
              {/* Línea */}
              <div className="border-t border-black my-1"></div>
              
              {/* Datos variables */}
              <div className="grid grid-cols-2 gap-x-2 text-[8px]">
                <div><span className="font-bold">FECHA FAENA:</span> {datos.fechaFaena}</div>
                <div><span className="font-bold">TROPA N°:</span> {datos.tropa}</div>
                <div><span className="font-bold">GARRON N°:</span> {datos.garron} {datos.lado}</div>
                <div><span className="font-bold">CLASIF:</span> {datos.clasificacion}</div>
              </div>
              
              <div className="text-center font-bold text-[9px] mt-1">
                VENTA AL PESO: {datos.kg} KG
              </div>
              
              {/* Mensajes */}
              <div className="text-center text-[8px] mt-1">
                <div className="font-bold">MANTENER REFRIGERADO A MENOS DE 5°C</div>
                <div>CONSUMIR PREFERENTEMENTE ANTES DEL DIA: {calcularVencimiento()}</div>
              </div>
              
              {/* Línea */}
              <div className="border-t border-black my-1"></div>
              
              {/* Código de barras */}
              <div className="text-center">
                <div className="bg-black h-8 mb-1" style={{
                  background: 'repeating-linear-gradient(90deg, black 0px, black 1px, white 1px, white 2px)'
                }}></div>
                <div className="text-[8px] font-mono">{generarCodigoBarras()}</div>
              </div>
            </div>
            
            {/* Info dimensiones */}
            <div className="text-center text-xs text-gray-500 mt-4">
              Tamaño real: 100mm × 150mm (10cm × 15cm)<br/>
              Impresora: Zebra ZT230 (203 DPI)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
