'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Scale, Settings, Keyboard, Wifi, WifiOff } from 'lucide-react'
import { toast } from 'sonner'

interface BalanzaConfigButtonProps {
  onPesoManualChange?: (peso: number) => void
  showManualInput?: boolean
  className?: string
}

export function BalanzaConfigButton({
  onPesoManualChange,
  showManualInput = true,
  className
}: BalanzaConfigButtonProps) {
  const [open, setOpen] = useState(false)
  const [pesoManual, setPesoManual] = useState('')
  const [modoManual, setModoManual] = useState(false)
  const [balanzaStatus, setBalanzaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')

  const checkBalanza = async () => {
    setBalanzaStatus('checking')
    try {
      const res = await fetch('/api/balanza/lectura?simular=true')
      const data = await res.json()
      setBalanzaStatus(data.estable ? 'connected' : 'disconnected')
    } catch {
      setBalanzaStatus('disconnected')
    }
  }

  const handleOpen = () => {
    checkBalanza()
    setOpen(true)
  }

  const handleApplyManual = () => {
    const peso = parseFloat(pesoManual)
    if (isNaN(peso) || peso <= 0) {
      toast.error('Ingrese un peso valido')
      return
    }
    onPesoManualChange?.(peso)
    toast.success(`Peso manual aplicado: ${peso} kg`)
    setPesoManual('')
    setOpen(false)
  }

  const handleNavigateConfig = () => {
    window.dispatchEvent(new CustomEvent('navigate-to-page', { detail: { page: 'configBalanzas' } }))
    setOpen(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" maximizable>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5" />
              Configuracion de Balanza
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Estado de conexion */}
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
              <div className="flex items-center gap-2">
                {balanzaStatus === 'connected' ? (
                  <Wifi className="w-5 h-5 text-green-600" />
                ) : balanzaStatus === 'disconnected' ? (
                  <WifiOff className="w-5 h-5 text-red-500" />
                ) : (
                  <Wifi className="w-5 h-5 text-stone-400 animate-pulse" />
                )}
                <div>
                  <p className="font-medium text-sm">Estado</p>
                  <p className="text-xs text-stone-500">
                    {balanzaStatus === 'checking' ? 'Verificando...' :
                     balanzaStatus === 'connected' ? 'Conectada' : 'Desconectada / Simulacion'}
                  </p>
                </div>
              </div>
              <Badge variant={balanzaStatus === 'connected' ? 'default' : 'destructive'}>
                {balanzaStatus === 'checking' ? '...' :
                 balanzaStatus === 'connected' ? 'OK' : 'OFF'}
              </Badge>
            </div>

            {/* Pesaje Manual */}
            {showManualInput && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-stone-600" />
                    <Label className="text-sm font-medium">Pesaje Manual</Label>
                  </div>
                  <Switch
                    checked={modoManual}
                    onCheckedChange={setModoManual}
                  />
                </div>
                {modoManual && (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Peso (kg)"
                      value={pesoManual}
                      onChange={(e) => setPesoManual(e.target.value)}
                      className="flex-1"
                      step="0.5"
                      min="0"
                    />
                    <Button onClick={handleApplyManual} size="sm" disabled={!pesoManual}>
                      Aplicar
                    </Button>
                  </div>
                )}
                <p className="text-xs text-stone-400">
                  Activar para ingresar peso manualmente sin balanza conectada
                </p>
              </div>
            )}

            {/* Navegar a configuracion completa */}
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleNavigateConfig}
              >
                <Settings className="w-4 h-4 mr-2" />
                Ir a Configuracion Completa de Balanzas
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating button */}
      <Button
        variant="outline"
        size="sm"
        className={`fixed top-4 right-4 z-50 shadow-lg rounded-full h-10 w-10 p-0 flex items-center justify-center bg-white hover:bg-stone-50 transition-colors ${className || ''}`}
        onClick={handleOpen}
        title="Configurar balanza"
      >
        <Scale className="w-5 h-5" />
      </Button>
    </>
  )
}

export default BalanzaConfigButton
