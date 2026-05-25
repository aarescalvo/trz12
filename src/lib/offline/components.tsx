'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, CloudOff, CloudUpload, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createLogger } from '@/lib/logger'
const log = createLogger('lib.offline.components')
import { useOffline } from '@/lib/offline/useOffline'
import { cn } from '@/lib/utils'

/**
 * Indicador visual del estado de conexión
 * Se muestra en la barra de navegación
 */
export function ConnectionIndicator() {
  const { online, status, processSyncQueue } = useOffline()
  const [syncing, setSyncing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      const result = await processSyncQueue()
      if (result.success > 0) {
        log.info(`Sincronizados ${result.success} items`)
      }
    } catch (error) {
      console.error('Error sincronizando:', error)
    } finally {
      setSyncing(false)
    }
  }

  // Auto-sincronizar cuando vuelve la conexión
  useEffect(() => {
    if (online && status.pendingItems > 0) {
      handleSync()
    }
  }, [online])

  return (
    <Dialog open={showDetails} onOpenChange={setShowDetails}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
            online 
              ? "bg-green-100 text-green-700 hover:bg-green-200" 
              : "bg-amber-100 text-amber-700 hover:bg-amber-200"
          )}
        >
          {online ? (
            <>
              <Wifi className="w-4 h-4" />
              <span className="hidden sm:inline">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span className="hidden sm:inline">Offline</span>
              {status.pendingItems > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                  {status.pendingItems}
                </Badge>
              )}
            </>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md" maximizable>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {online ? (
              <>
                <Wifi className="w-5 h-5 text-green-500" />
                Sistema Online
              </>
            ) : (
              <>
                <CloudOff className="w-5 h-5 text-amber-500" />
                Modo Offline
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {online 
              ? "El sistema está conectado al servidor."
              : "El sistema está funcionando sin conexión. Los datos se guardarán localmente."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Estado de sincronización */}
          {!online && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-800">Modo Offline Activo</p>
                    <p className="text-sm text-amber-600 mt-1">
                      Los datos que ingrese se guardarán localmente y se sincronizarán 
                      cuando vuelva la conexión a internet.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Items pendientes */}
          {status.pendingItems > 0 && (
            <Card className={online ? "bg-blue-50 border-blue-200" : "bg-stone-50 border-stone-200"}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CloudUpload className={cn(
                      "w-5 h-5",
                      online ? "text-blue-500" : "text-stone-400"
                    )} />
                    <div>
                      <p className="font-medium">
                        {status.pendingItems} {status.pendingItems === 1 ? 'registro pendiente' : 'registros pendientes'}
                      </p>
                      <p className="text-sm text-stone-500">
                        Esperando sincronización
                      </p>
                    </div>
                  </div>
                  {online && (
                    <Button
                      size="sm"
                      onClick={handleSync}
                      disabled={syncing}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {syncing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sincronizar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información adicional */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-stone-500">Última conexión</p>
              <p className="font-medium">
                {status.lastOnline 
                  ? new Date(status.lastOnline).toLocaleString('es-AR')
                  : 'N/A'
                }
              </p>
            </div>
            <div>
              <p className="text-stone-500">Última sincronización</p>
              <p className="font-medium">
                {status.lastSync 
                  ? new Date(status.lastSync).toLocaleString('es-AR')
                  : 'N/A'
                }
              </p>
            </div>
          </div>

          {/* Módulos disponibles offline */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-stone-700 mb-2">Módulos disponibles sin conexión:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-green-50">Pesaje Individual</Badge>
              <Badge variant="outline" className="bg-green-50">Ingreso a Faena</Badge>
              <Badge variant="outline" className="bg-green-50">Romaneo</Badge>
              <Badge variant="outline" className="bg-green-50">Menudencias</Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Banner de alerta cuando está offline
 * Se muestra en la parte superior de la pantalla
 */
export function OfflineBanner() {
  const { online, status } = useOffline()

  if (online) return null

  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span>
          Modo Offline - Los datos se guardarán localmente
        </span>
        {status.pendingItems > 0 && (
          <Badge className="bg-white text-amber-600 ml-2">
            {status.pendingItems} pendientes
          </Badge>
        )}
      </div>
    </div>
  )
}

/**
 * Indicador pequeño para usar en formularios
 */
export function OfflineIndicator({ className }: { className?: string }) {
  const { online } = useOffline()

  if (online) return null

  return (
    <div className={cn(
      "flex items-center gap-1.5 text-xs text-amber-600",
      className
    )}>
      <CloudOff className="w-3.5 h-3.5" />
      <span>Guardado local</span>
    </div>
  )
}

export default ConnectionIndicator
