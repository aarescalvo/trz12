'use client'

import { useState, useEffect, useCallback } from 'react'

interface TarifaVigente {
  id: string
  valor: number
  moneda: string
  vigenciaDesde: string
  tipoTarifa?: { id: string; codigo: string; descripcion: string; unidad: string }
  cliente?: { id: string; nombre: string }
}

export function useTarifaVigente() {
  const [tarifas, setTarifas] = useState<TarifaVigente[]>([])
  const [loading, setLoading] = useState(false)

  const fetchVigentes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tarifas?modo=vigentes')
      const data = await res.json()
      if (data.success) setTarifas(data.data)
    } catch (error) {
      console.error('Error fetching tarifas:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const getTarifaForContext = useCallback(async (params: {
    tipo: string
    fecha?: string
    clienteId?: string
    especie?: string
  }) => {
    try {
      const searchParams = new URLSearchParams({ modo: 'vigente', tipo: params.tipo })
      if (params.fecha) searchParams.set('fecha', params.fecha)
      if (params.clienteId) searchParams.set('clienteId', params.clienteId)
      if (params.especie) searchParams.set('especie', params.especie)
      
      const res = await fetch(`/api/tarifas?${searchParams.toString()}`)
      const data = await res.json()
      if (data.success) return data.data as TarifaVigente
      return null
    } catch {
      return null
    }
  }, [])

  useEffect(() => { fetchVigentes() }, [fetchVigentes])

  return { tarifas, loading, fetchVigentes, getTarifaForContext }
}
