'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

interface BalanzaReading {
  peso: number
  estable: boolean
  unidad: string
  timestamp: string
}

interface UseBalanzaOptions {
  intervalMs?: number  // polling interval, default 500
  autoStart?: boolean  // start polling immediately, default false
}

interface UseBalanzaReturn {
  peso: number
  estable: boolean
  leyendo: boolean
  ultimaLectura: BalanzaReading | null
  iniciar: () => void
  detener: () => void
  capturarPeso: () => number | null  // returns current stable weight or null
  error: string | null
}

export function useBalanza(options: UseBalanzaOptions = {}): UseBalanzaReturn {
  const { intervalMs = 500, autoStart = false } = options
  const [peso, setPeso] = useState(0)
  const [estable, setEstable] = useState(false)
  const [leyendo, setLeyendo] = useState(autoStart)
  const [ultimaLectura, setUltimaLectura] = useState<BalanzaReading | null>(null)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const leerBalanza = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller
    try {
      const res = await fetch('/api/balanza/lectura', { signal: controller.signal })
      const data = await res.json()
      if (data.success) {
        setPeso(data.data.peso)
        setEstable(data.data.estable)
        setUltimaLectura(data.data)
        setError(null)
      }
    } catch (err) {
      if ((err as DOMException).name !== 'AbortError') {
        setError('Error leyendo balanza')
      }
    }
  }, [])

  const iniciar = useCallback(() => {
    setLeyendo(true)
    setError(null)
    // Trigger an immediate read outside of effect context
    leerBalanza()
  }, [leerBalanza])

  const detener = useCallback(() => {
    setLeyendo(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  // Manage the polling interval based on leyendo state
  useEffect(() => {
    if (leyendo) {
      intervalRef.current = setInterval(leerBalanza, intervalMs)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [leyendo, leerBalanza, intervalMs])

  const capturarPeso = useCallback((): number | null => {
    if (estable && peso > 0) return peso
    return null
  }, [peso, estable])

  return { peso, estable, leyendo, ultimaLectura, iniciar, detener, capturarPeso, error }
}
