'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { 
  Cloud, CloudOff, RefreshCw, CheckCircle, XCircle, Clock,
  Send, Download, AlertTriangle, Settings, Activity
} from 'lucide-react'

interface Props {
  operador?: { id: string; nombre: string; rol: string }
}

export function SincronizacionSigicaModule({ operador }: Props) {
  const [loading, setLoading] = useState(true)
  const [conectado, setConectado] = useState(false)
  const [ultimaSync, setUltimaSync] = useState<string | null>(null)
  const [pendientes, setPendientes] = useState<any[]>([])
  const [historial, setHistorial] = useState<any[]>([])

  useEffect(() => {
    verificarConexion()
    fetchPendientes()
  }, [])

  const verificarConexion = async () => {
    try {
      const res = await fetch('/api/sigica/status')
      const data = await res.json()
      setConectado(data.conectado)
      setUltimaSync(data.ultimaSync)
    } catch (error) {
      setConectado(false)
    }
  }

  const fetchPendientes = async () => {
    try {
      const res = await fetch('/api/sigica/pendientes')
      const data = await res.json()
      setPendientes(data.pendientes || [])
      setHistorial(data.historial || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSincronizar = async () => {
    toast.info('Iniciando sincronización...')
    try {
      const res = await fetch('/api/sigica/sync', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success('Sincronización completada')
        verificarConexion()
        fetchPendientes()
      } else {
        toast.error(data.error || 'Error en sincronización')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Sincronización SIGICA</h1>
            <p className="text-stone-500 mt-1">Integración con sistema oficial SENASA</p>
          </div>
          <Badge className={conectado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
            {conectado ? <Cloud className="w-3 h-3 mr-1" /> : <CloudOff className="w-3 h-3 mr-1" />}
            {conectado ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>

        {/* Estado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500">Estado</p>
                  <p className="text-lg font-semibold">{conectado ? 'Operativo' : 'Sin conexión'}</p>
                </div>
                {conectado ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500">Última Sync</p>
                  <p className="text-lg font-semibold">{ultimaSync ? new Date(ultimaSync).toLocaleString('es-AR') : 'Nunca'}</p>
                </div>
                <Clock className="w-8 h-8 text-stone-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500">Pendientes</p>
                  <p className="text-lg font-semibold">{pendientes.length} registros</p>
                </div>
                <AlertTriangle className={`w-8 h-8 ${pendientes.length > 0 ? 'text-amber-500' : 'text-stone-400'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acciones */}
        <Card className="border-0 shadow-md mb-6">
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button onClick={handleSincronizar} disabled={!conectado}>
                <Send className="w-4 h-4 mr-2" /> Sincronizar Ahora
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" /> Descargar Datos
              </Button>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" /> Configuración
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pendientes */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Registros Pendientes</CardTitle>
            <CardDescription>Datos que aún no se han enviado a SIGICA</CardDescription>
          </CardHeader>
          <CardContent>
            {pendientes.length === 0 ? (
              <div className="text-center py-8 text-stone-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                <p>No hay registros pendientes</p>
              </div>
            ) : (
              <div className="divide-y">
                {pendientes.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3">
                    <Activity className="w-5 h-5 text-amber-500" />
                    <div className="flex-1">
                      <p className="font-medium">{p.tipo}</p>
                      <p className="text-sm text-stone-500">{p.descripcion}</p>
                    </div>
                    <Badge variant="outline">{p.fecha}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SincronizacionSigicaModule
