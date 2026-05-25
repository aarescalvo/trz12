'use client'

import { Plus, Minus, Beef } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TIPOS_ANIMALES } from './constants'
import type { TipoAnimalCounter } from './types'

interface TipoAnimalCounterGridProps {
  especie: string
  tiposAnimales: TipoAnimalCounter[]
  onUpdate: (tipos: TipoAnimalCounter[]) => void
}

export function TipoAnimalCounterGrid({ 
  especie, 
  tiposAnimales, 
  onUpdate 
}: TipoAnimalCounterGridProps) {
  const tiposDisponibles = TIPOS_ANIMALES[especie] || []
  
  const getCantidad = (codigo: string) => {
    const encontrado = tiposAnimales.find(t => t.tipoAnimal === codigo)
    return encontrado?.cantidad || 0
  }
  
  const incrementar = (codigo: string) => {
    const actual = getCantidad(codigo)
    const nuevos = [...tiposAnimales]
    const indice = nuevos.findIndex(t => t.tipoAnimal === codigo)
    
    if (indice >= 0) {
      nuevos[indice].cantidad = actual + 1
    } else {
      nuevos.push({ tipoAnimal: codigo, cantidad: 1 })
    }
    
    onUpdate(nuevos.filter(t => t.cantidad > 0))
  }
  
  const decrementar = (codigo: string) => {
    const actual = getCantidad(codigo)
    if (actual <= 0) return
    
    const nuevos = [...tiposAnimales]
    const indice = nuevos.findIndex(t => t.tipoAnimal === codigo)
    
    if (indice >= 0) {
      nuevos[indice].cantidad = actual - 1
      onUpdate(nuevos.filter(t => t.cantidad > 0))
    }
  }
  
  const setCantidad = (codigo: string, valor: number) => {
    const nuevos = tiposAnimales.filter(t => t.tipoAnimal !== codigo)
    if (valor > 0) {
      nuevos.push({ tipoAnimal: codigo, cantidad: valor })
    }
    onUpdate(nuevos)
  }
  
  const total = tiposAnimales.reduce((acc, t) => acc + t.cantidad, 0)

  return (
    <div className="space-y-4">
      {/* Grid de botones contadores */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {tiposDisponibles.map((tipo) => {
          const cantidad = getCantidad(tipo.codigo)
          const isSelected = cantidad > 0
          
          return (
            <div 
              key={tipo.codigo}
              className={`p-3 rounded-lg border-2 transition-all ${
                isSelected 
                  ? 'border-amber-500 bg-amber-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <Badge variant="outline" className="font-mono text-xs">{tipo.codigo}</Badge>
                  <p className="text-sm font-medium mt-1">{tipo.label}</p>
                </div>
                <div className="text-2xl font-bold text-amber-600">
                  {cantidad}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  size="icon" 
                  className="h-10 w-10"
                  onClick={() => decrementar(tipo.codigo)}
                  disabled={cantidad <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <Input
                  type="number"
                  value={cantidad || ''}
                  onChange={(e) => setCantidad(tipo.codigo, parseInt(e.target.value) || 0)}
                  className="h-10 w-16 text-center font-bold"
                  min="0"
                  placeholder="0"
                />
                
                <Button 
                  type="button"
                  variant="outline" 
                  size="icon" 
                  className="h-10 w-10 bg-amber-50 hover:bg-amber-100 border-amber-300"
                  onClick={() => incrementar(tipo.codigo)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Resumen total */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
        <div className="flex items-center gap-3">
          <Beef className="h-8 w-8 text-amber-600" />
          <div>
            <p className="text-sm text-amber-700">Total de Cabezas</p>
            <p className="text-3xl font-bold text-amber-600">{total}</p>
          </div>
        </div>
        
        {total > 0 && (
          <div className="flex flex-wrap gap-2 justify-end max-w-xs">
            {tiposAnimales.filter(t => t.cantidad > 0).map((t) => {
              const tipo = tiposDisponibles.find(td => td.codigo === t.tipoAnimal)
              return (
                <Badge key={t.tipoAnimal} className="bg-white border-amber-300 text-amber-700">
                  {tipo?.siglas}: {t.cantidad}
                </Badge>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
