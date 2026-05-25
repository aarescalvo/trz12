'use client'

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmpaqueModule } from '@/components/empaque'
import C2ProduccionModule from '@/components/c2-produccion'
import { Package, Scissors, Lock, BoxSelect, Warehouse, Check, ArrowRight, Truck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const ProduccionPipeline = ({ etapaActual }: { etapaActual?: string }) => {
  const etapas = [
    { id: 'ingreso', label: 'Ingreso', icon: Truck },
    { id: 'desposte', label: 'Desposte', icon: Scissors },
    { id: 'produccion', label: 'Producción', icon: BoxSelect },
    { id: 'empaque', label: 'Empaque', icon: Package },
    { id: 'stock', label: 'Stock', icon: Warehouse },
  ]

  // Determine completed/current indices based on etapaActual
  const etapaOrder = etapas.map(e => e.id)
  const currentIndex = etapaActual ? etapaOrder.indexOf(etapaActual) : -1

  const getStepState = (index: number) => {
    if (currentIndex < 0) return 'pending' as const
    if (index < currentIndex) return 'completed' as const
    if (index === currentIndex) return 'active' as const
    return 'pending' as const
  }

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-stone-50 to-stone-100/50 rounded-xl border border-stone-200/60 shadow-sm">
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
        {etapas.map((etapa, i) => {
          const state = getStepState(i)
          const Icon = etapa.icon
          const isLast = i === etapas.length - 1

          return (
            <React.Fragment key={etapa.id}>
              <div className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl transition-all duration-200 shrink-0 ${
                state === 'active'
                  ? 'bg-amber-100 text-amber-800 border-2 border-amber-400 shadow-md shadow-amber-200/50 scale-105'
                  : state === 'completed'
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                  : 'bg-white text-stone-400 border border-stone-200'
              }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  state === 'active'
                    ? 'bg-amber-500 text-white'
                    : state === 'completed'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-stone-100 text-stone-400'
                }`}>
                  {state === 'completed' ? (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${
                  state === 'active' ? 'text-amber-800' : state === 'completed' ? 'text-emerald-700' : 'text-stone-400'
                }`}>
                  {etapa.label}
                </span>
              </div>
              {!isLast && (
                <div className="flex items-center shrink-0 px-0.5 sm:px-1">
                  <ArrowRight className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    state === 'completed' ? 'text-emerald-400' : 'text-stone-300'
                  }`} />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

interface Operador {
  id: string
  nombre: string
  rol: string
  permisos?: Record<string, boolean>
}

interface ProduccionUnificadaProps {
  operador: Operador
}

export default function ProduccionUnificada({ operador }: ProduccionUnificadaProps) {
  const isAdmin = operador.rol === 'ADMINISTRADOR'
  const puedeDesposte = isAdmin || operador.permisos?.puedeDesposte
  const puedeEmpaque = isAdmin || operador.permisos?.puedeEmpaque

  // Si no tiene ningún permiso, mostrar mensaje
  if (!puedeDesposte && !puedeEmpaque) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-8 text-center">
          <Lock className="w-12 h-12 mx-auto mb-4 text-stone-400" />
          <p className="text-lg font-medium text-stone-800">Sin permisos</p>
          <p className="text-sm text-stone-500 mt-2">No tiene permisos para acceder a este módulo</p>
        </CardContent>
      </Card>
    )
  }

  // Si solo tiene un permiso, mostrar directamente ese módulo sin tabs
  if (puedeDesposte && !puedeEmpaque) {
    return (
      <div>
        <ProduccionPipeline etapaActual="desposte" />
        <C2ProduccionModule operador={operador} />
      </div>
    )
  }
  if (!puedeDesposte && puedeEmpaque) {
    return (
      <div>
        <ProduccionPipeline etapaActual="empaque" />
        <EmpaqueModule operador={operador} />
      </div>
    )
  }

  // Tiene ambos permisos, mostrar tabs
  return (
    <div className="space-y-4">
      <ProduccionPipeline />
      <Tabs defaultValue="c2" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="c2" className="flex items-center gap-2">
            <Scissors className="w-4 h-4" />
            Producción C2
          </TabsTrigger>
          <TabsTrigger value="empaque" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Empaque
          </TabsTrigger>
        </TabsList>
        <TabsContent value="c2">
          <C2ProduccionModule operador={operador} />
        </TabsContent>
        <TabsContent value="empaque">
          <EmpaqueModule operador={operador} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
