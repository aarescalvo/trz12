'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  FileText, CheckCircle, XCircle, Send, Download, RefreshCw,
  Settings, Key, Building2, AlertTriangle
} from 'lucide-react'

interface Props {
  operador?: { id: string; nombre: string; rol: string }
}

export function IntegracionAfipModule({ operador }: Props) {
  const [loading, setLoading] = useState(true)
  const [conectado, setConectado] = useState(false)
  const [config, setConfig] = useState({
    cuit: '',
    razonSocial: '',
    puntoVenta: '',
    certificado: false,
    modoTest: true
  })

  useEffect(() => {
    verificarConexion()
  }, [])

  const verificarConexion = async () => {
    try {
      const res = await fetch('/api/afip/status')
      const data = await res.json()
      setConectado(data.conectado)
      setConfig(data.config || config)
    } catch (error) {
      setConectado(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Integración AFIP</h1>
            <p className="text-stone-500 mt-1">Facturación electrónica y servicios web</p>
          </div>
          <Badge className={conectado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
            {conectado ? 'Conectado' : 'Sin configurar'}
          </Badge>
        </div>

        {/* Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Datos del Contribuyente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>CUIT</Label>
                <Input value={config.cuit || 'No configurado'} disabled />
              </div>
              <div>
                <Label>Razón Social</Label>
                <Input value={config.razonSocial || 'No configurado'} disabled />
              </div>
              <div>
                <Label>Punto de Venta</Label>
                <Input value={config.puntoVenta || 'No configurado'} disabled />
              </div>
              <div className="flex items-center gap-2">
                <Label>Certificado:</Label>
                {config.certificado ? (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" /> Instalado
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700">
                    <XCircle className="w-3 h-3 mr-1" /> No instalado
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Label>Modo:</Label>
                <Badge className={config.modoTest ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}>
                  {config.modoTest ? 'Testing' : 'Producción'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Certificado Digital
              </CardTitle>
              <CardDescription>Configure su certificado para facturación electrónica</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-stone-500 mb-2">
                  Suba su certificado .p12 o .pem proporcionado por AFIP
                </p>
                <Input type="file" accept=".p12,.pem,.crt" />
              </div>
              <div>
                <Label>Contraseña del certificado</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <Button className="w-full">
                <Send className="w-4 h-4 mr-2" /> Guardar Certificado
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Acciones */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" /> Verificar Conexión
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" /> Descargar CAE
              </Button>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" /> Configuración Avanzada
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default IntegracionAfipModule
