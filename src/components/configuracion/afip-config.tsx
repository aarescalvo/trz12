'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  FileKey,
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Shield,
  Building2,
  Hash,
  Calendar
} from 'lucide-react'

interface AFIPConfig {
  cuit: string
  razonSocial: string
  domicilio: string
  puntoVenta: number
  inicioActividades: string
  certificadoConfigurado: boolean
  clavePrivadaConfigurada: boolean
}

interface Props {
  operador: { id: string; nombre: string; nivel: string }
}

export function AFIPConfig({ operador }: Props) {
  const [config, setConfig] = useState<AFIPConfig>({
    cuit: '',
    razonSocial: '',
    domicilio: '',
    puntoVenta: 1,
    inicioActividades: '',
    certificadoConfigurado: false,
    clavePrivadaConfigurada: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [certFile, setCertFile] = useState<File | null>(null)
  const [keyFile, setKeyFile] = useState<File | null>(null)
  const [certContent, setCertContent] = useState<string | null>(null)
  const [keyContent, setKeyContent] = useState<string | null>(null)
  const [uploadingCert, setUploadingCert] = useState(false)
  const [uploadingKey, setUploadingKey] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/afip/config')
      if (res.ok) {
        const data = await res.json()
        setConfig(data.data)
      }
    } catch (error) {
      console.error('Error al cargar configuración AFIP:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/afip/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (res.ok) {
        setTestResult({ ok: true, message: 'Configuración guardada correctamente' })
      } else {
        const error = await res.json()
        setTestResult({ ok: false, message: error.error || 'Error al guardar' })
      }
    } catch (error) {
      setTestResult({ ok: false, message: 'Error de conexión' })
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/afip/config', {
        method: 'PUT'
      })
      const data = await res.json()
      setTestResult({ ok: data.success, message: data.message || data.error })
    } catch (error) {
      setTestResult({ ok: false, message: 'Error al probar conexión' })
    } finally {
      setTesting(false)
    }
  }

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Error al leer el archivo'))
      reader.readAsText(file)
    })
  }

  const submitCertificates = async (cert: string, key: string) => {
    const res = await fetch('/api/afip/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...config,
        certificado: cert,
        clavePrivada: key
      })
    })
    return res
  }

  const handleCertUpload = async () => {
    if (!certFile) return
    setUploadingCert(true)
    try {
      const content = await readFileAsText(certFile)
      setCertContent(content)

      if (keyContent) {
        const res = await submitCertificates(content, keyContent)
        if (res.ok) {
          setCertFile(null)
          setKeyFile(null)
          setCertContent(null)
          setKeyContent(null)
          setTestResult({ ok: true, message: 'Certificado y clave privada actualizados correctamente' })
          fetchConfig()
        } else {
          const error = await res.json()
          setTestResult({ ok: false, message: error.error || error.errors?.join(', ') || 'Error al guardar certificado' })
        }
      } else {
        setTestResult({ ok: true, message: 'Certificado cargado. Ahora cargue la clave privada para completar la configuración.' })
      }
    } catch (error) {
      setTestResult({ ok: false, message: 'Error al leer el archivo de certificado' })
    } finally {
      setUploadingCert(false)
    }
  }

  const handleKeyUpload = async () => {
    if (!keyFile) return
    setUploadingKey(true)
    try {
      const content = await readFileAsText(keyFile)
      setKeyContent(content)

      if (certContent) {
        const res = await submitCertificates(certContent, content)
        if (res.ok) {
          setCertFile(null)
          setKeyFile(null)
          setCertContent(null)
          setKeyContent(null)
          setTestResult({ ok: true, message: 'Certificado y clave privada actualizados correctamente' })
          fetchConfig()
        } else {
          const error = await res.json()
          setTestResult({ ok: false, message: error.error || error.errors?.join(', ') || 'Error al guardar clave privada' })
        }
      } else {
        setTestResult({ ok: true, message: 'Clave privada cargada. Ahora cargue el certificado para completar la configuración.' })
      }
    } catch (error) {
      setTestResult({ ok: false, message: 'Error al leer el archivo de clave privada' })
    } finally {
      setUploadingKey(false)
    }
  }

  const formatCUIT = (value: string) => {
    // Formatear CUIT: XX-XXXXXXXX-X
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) return cleaned
    if (cleaned.length <= 10) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10, 11)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Cargando configuración...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estado del servicio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Estado del Servicio AFIP
          </CardTitle>
          <CardDescription>
            Verifica la disponibilidad de los web services de AFIP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                WSFE (Facturación)
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                WSAA (Autenticación)
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testing}
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Probar Conexión
            </Button>
          </div>

          {testResult && (
            <Alert className={`mt-4 ${testResult.ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              {testResult.ok ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertTitle>{testResult.ok ? 'Éxito' : 'Error'}</AlertTitle>
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Datos del contribuyente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Datos del Contribuyente
          </CardTitle>
          <CardDescription>
            Información fiscal del emisor de facturas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cuit">CUIT *</Label>
              <Input
                id="cuit"
                value={config.cuit}
                onChange={(e) => setConfig({ ...config, cuit: formatCUIT(e.target.value) })}
                placeholder="20-12345678-9"
                maxLength={13}
              />
              <p className="text-xs text-muted-foreground">
                CUIT del contribuyente (sin guiones también es válido)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="razonSocial">Razón Social *</Label>
              <Input
                id="razonSocial"
                value={config.razonSocial}
                onChange={(e) => setConfig({ ...config, razonSocial: e.target.value })}
                placeholder="Nombre de la empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domicilio">Domicilio Comercial</Label>
              <Input
                id="domicilio"
                value={config.domicilio}
                onChange={(e) => setConfig({ ...config, domicilio: e.target.value })}
                placeholder="Dirección fiscal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="puntoVenta">Punto de Venta</Label>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="puntoVenta"
                  type="number"
                  value={config.puntoVenta}
                  onChange={(e) => setConfig({ ...config, puntoVenta: parseInt(e.target.value) || 1 })}
                  min={1}
                  max={9999}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Número de punto de venta habilitado en AFIP
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="inicioActividades">Inicio de Actividades</Label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="inicioActividades"
                  type="date"
                  value={config.inicioActividades}
                  onChange={(e) => setConfig({ ...config, inicioActividades: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={fetchConfig}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !config.cuit || !config.razonSocial}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Guardar Configuración
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Certificados digitales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileKey className="w-5 h-5" />
            Certificados Digitales
          </CardTitle>
          <CardDescription>
            Certificado y clave privada para autenticación con AFIP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Importante</AlertTitle>
            <AlertDescription>
              Los certificados deben ser generados desde el portal de AFIP y estar asociados al CUIT configurado.
              El certificado debe estar en formato .pem o .crt, y la clave privada en formato .key.
            </AlertDescription>
          </Alert>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Certificado */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Certificado (.pem / .crt)</Label>
                {config.certificadoConfigurado ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Configurado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    Pendiente
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".pem,.crt,.cer"
                  onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleCertUpload}
                  disabled={!certFile || uploadingCert}
                >
                  {uploadingCert ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {uploadingCert ? 'Subiendo...' : 'Subir'}
                </Button>
              </div>
            </div>

            {/* Clave privada */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Clave Privada (.key)</Label>
                {config.clavePrivadaConfigurada ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Configurada
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    Pendiente
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".key,.pem"
                  onChange={(e) => setKeyFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleKeyUpload}
                  disabled={!keyFile || uploadingKey}
                >
                  {uploadingKey ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {uploadingKey ? 'Subiendo...' : 'Subir'}
                </Button>
              </div>
            </div>
          </div>

          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Seguridad</AlertTitle>
            <AlertDescription>
              Los archivos de certificado y clave privada se almacenan de forma segura.
              Nunca comparta estos archivos ni la contraseña de la clave privada.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Comprobante Soportados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="p-2 bg-muted rounded">
              <span className="font-medium">FA</span> - Factura A
            </div>
            <div className="p-2 bg-muted rounded">
              <span className="font-medium">FB</span> - Factura B
            </div>
            <div className="p-2 bg-muted rounded">
              <span className="font-medium">FC</span> - Factura C
            </div>
            <div className="p-2 bg-muted rounded">
              <span className="font-medium">NDA</span> - Nota Débito A
            </div>
            <div className="p-2 bg-muted rounded">
              <span className="font-medium">NDB</span> - Nota Débito B
            </div>
            <div className="p-2 bg-muted rounded">
              <span className="font-medium">NCA</span> - Nota Crédito A
            </div>
            <div className="p-2 bg-muted rounded">
              <span className="font-medium">NCB</span> - Nota Crédito B
            </div>
            <div className="p-2 bg-muted rounded">
              <span className="font-medium">NCC</span> - Nota Crédito C
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AFIPConfig
