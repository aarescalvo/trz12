'use client'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface DatosRotulo {
  producto: string
  peso: string
  unidades?: string
  lote?: string
  fecha: string
  vencimiento?: string
  codigoBarras?: string
  codigo?: string
  [key: string]: string | undefined
}

interface UseImpresoraReturn {
  imprimiendo: boolean
  imprimirRotulo: (datos: DatosRotulo, tipo: 'caja' | 'cuarto' | 'producto') => Promise<boolean>
  error: string | null
}

export function useImpresora(): UseImpresoraReturn {
  const [imprimiendo, setImprimiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const imprimirRotulo = useCallback(async (datos: DatosRotulo, tipo: 'caja' | 'cuarto' | 'producto'): Promise<boolean> => {
    setImprimiendo(true)
    setError(null)
    try {
      const res = await fetch('/api/rotulos/imprimir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datos, tipo })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Rótulo enviado a impresora')
        return true
      } else {
        setError(data.error || 'Error al imprimir')
        toast.error('Error al imprimir rótulo')
        return false
      }
    } catch {
      setError('Error de conexión con impresora')
      toast.error('Error de conexión con impresora')
      return false
    } finally {
      setImprimiendo(false)
    }
  }, [])

  return { imprimiendo, imprimirRotulo, error }
}
