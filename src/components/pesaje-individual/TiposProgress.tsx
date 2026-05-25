'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { TIPOS_ANIMALES } from './constants'

interface TipoAnimalConfig {
  tipoAnimal: string
  cantidad: number
}

interface Animal {
  id: string
  numero: number
  tipoAnimal: string
  estado: string
}

interface TiposProgressProps {
  tiposConfirmados: TipoAnimalConfig[]
  animales: Animal[]
  especie: string
  onSelectTipo?: (tipo: string) => void
  tipoSeleccionado?: string
}

export function TiposProgress({ tiposConfirmados, animales, especie, onSelectTipo, tipoSeleccionado }: TiposProgressProps) {
  const tiposInfo = TIPOS_ANIMALES[especie] || []
  
  // Calcular cuántos animales se han pesado por tipo
  const conteoPorTipo: Record<string, { pesados: number; total: number }> = {}
  
  for (const tipo of tiposConfirmados) {
    conteoPorTipo[tipo.tipoAnimal] = {
      total: tipo.cantidad,
      pesados: animales.filter(a => a.estado === 'PESADO' && a.tipoAnimal === tipo.tipoAnimal).length
    }
  }
  
  const totalPesados = animales.filter(a => a.estado === 'PESADO').length
  const totalConfirmados = tiposConfirmados.reduce((acc, t) => acc + t.cantidad, 0)
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-stone-600">Progreso por Tipo (DTE)</span>
        <span className="text-sm font-bold">
          {totalPesados} / {totalConfirmados} animales
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {tiposConfirmados.map((tipo) => {
          const info = tiposInfo.find(t => t.codigo === tipo.tipoAnimal)
          const conteo = conteoPorTipo[tipo.tipoAnimal]
          const completado = conteo.pesados >= conteo.total
          const disponible = conteo.pesados < conteo.total
          const isSelected = tipoSeleccionado === tipo.tipoAnimal
          
          return (
            <button
              key={tipo.tipoAnimal}
              type="button"
              onClick={() => disponible && onSelectTipo?.(tipo.tipoAnimal)}
              disabled={!disponible}
              className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                completado
                  ? 'bg-green-50 border-green-300 text-green-700 cursor-default'
                  : isSelected
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                    : disponible
                      ? 'bg-white border-gray-200 hover:border-amber-300 hover:bg-amber-50 cursor-pointer'
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2">
                {completado ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className={`w-4 h-4 ${disponible ? 'text-amber-500' : 'text-gray-400'}`} />
                )}
                <span className="font-mono">{tipo.tipoAnimal}</span>
                <span className="text-xs">
                  ({conteo.pesados}/{conteo.total})
                </span>
              </div>
              <div className="text-xs opacity-75 mt-0.5">
                {info?.label || tipo.tipoAnimal}
              </div>
            </button>
          )
        })}
      </div>
      
      {/* Barra de progreso general */}
      <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
        <div 
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${(totalPesados / totalConfirmados) * 100}%` }}
        />
      </div>
      
      {/* Resumen de tipos disponibles */}
      <div className="text-xs text-stone-500">
        {tiposConfirmados
          .filter(tipo => {
            const conteo = conteoPorTipo[tipo.tipoAnimal]
            return conteo.pesados < conteo.total
          })
          .map(tipo => {
            const conteo = conteoPorTipo[tipo.tipoAnimal]
            const restantes = conteo.total - conteo.pesados
            return `${tipo.tipoAnimal}: ${restantes} pendiente${restantes > 1 ? 's' : ''}`
          })
          .join(' | ') || 'Todos los animales han sido pesados'}
      </div>
    </div>
  )
}
