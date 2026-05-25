'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tag, DollarSign, History } from 'lucide-react'
import { HistoricoPrecios } from '@/modules/facturacion/components/HistoricoPrecios'
import { PreciosServicioManager } from '@/modules/facturacion/components/PreciosServicioManager'

interface Props { operador: { id: string; nombre: string; rol: string } }

export function PreciosPage({ operador }: Props) {
  const [tab, setTab] = useState('servicios')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
          <Tag className="w-8 h-8 text-amber-500" />
          Gestión de Precios
        </h1>
        <p className="text-stone-500 mt-1">Tarifas de faena, precios por cliente y servicio, historial de cambios</p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="servicios" className="gap-1">
            <DollarSign className="w-4 h-4" />
            Precios por Cliente
          </TabsTrigger>
          <TabsTrigger value="tarifas" className="gap-1">
            <Tag className="w-4 h-4" />
            Tarifas Generales
          </TabsTrigger>
        </TabsList>

        <TabsContent value="servicios">
          <PreciosServicioManager operador={operador} />
        </TabsContent>

        <TabsContent value="tarifas">
          <HistoricoPrecios operador={operador} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
