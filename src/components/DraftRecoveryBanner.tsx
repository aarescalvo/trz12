// NOTA: Componente disponible para uso futuro - verificar antes de eliminar
'use client'

import { AlertTriangle, RotateCcw, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// ============================================================
// DRAFT RECOVERY BANNER - Capa 2: UI de recuperación de borradores
// Se muestra cuando se detecta un borrador activo en la DB
// que puede ser recuperado por el operador
// ============================================================

interface DraftRecoveryBannerProps {
  moduleName: string
  updatedAt?: string
  onRecover: () => void
  onDiscard: () => void
}

export function DraftRecoveryBanner({
  moduleName,
  updatedAt,
  onRecover,
  onDiscard,
}: DraftRecoveryBannerProps) {
  const timeAgo = updatedAt ? getTimeAgo(new Date(updatedAt)) : ''

  return (
    <Card className="border-amber-300 bg-amber-50 shadow-md mb-4 animate-in slide-in-from-top duration-300">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 p-2 bg-amber-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Borrador sin guardar encontrado
              </p>
              <p className="text-xs text-amber-600">
                Se encontraron datos de <span className="font-medium">{moduleName}</span> sin confirmar
                {timeAgo && (
                  <span className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    Guardado {timeAgo}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={onDiscard}
            >
              <X className="w-4 h-4 mr-1" />
              Descartar
            </Button>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={onRecover}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Recuperar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Indicador compacto del estado del auto-save
 * Se puede colocar dentro de cada módulo
 */
export function AutoSaveIndicator({
  lastSavedAt,
  isSaving,
  modulo,
}: {
  lastSavedAt: Date | null
  isSaving?: boolean
  modulo: string
}) {
  if (isSaving) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-stone-500">
        <div className="w-3 h-3 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
        <span>Guardando...</span>
      </div>
    )
  }

  if (!lastSavedAt) {
    return null
  }

  const timeAgo = getTimeAgo(lastSavedAt)

  return (
    <div className="flex items-center gap-1.5 text-xs text-stone-400">
      <div className="w-2 h-2 bg-green-400 rounded-full" />
      <span>Borrador guardado {timeAgo}</span>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)

  if (diffSec < 60) return 'hace un momento'
  if (diffMin < 60) return `hace ${diffMin} min`
  if (diffHour < 24) return `hace ${diffHour} hora${diffHour > 1 ? 's' : ''}`
  return `hace más de un día`
}
