'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-0 shadow-lg">
        <CardHeader className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
          <CardTitle>Algo salió mal</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-stone-600 text-sm">
            Ha ocurrido un error inesperado. Por favor, intente nuevamente.
          </p>
          <details className="text-left bg-stone-50 p-3 rounded-lg text-xs">
            <summary className="cursor-pointer font-medium text-stone-700">
              Detalles del error
            </summary>
            <pre className="mt-2 whitespace-pre-wrap text-red-600 break-words">
              {error.message}
            </pre>
          </details>
          <Button onClick={reset} className="w-full bg-amber-500 hover:bg-amber-600">
            Intentar nuevamente
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
