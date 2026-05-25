'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StockCamarasModule } from '@/components/stock-camaras'
import C2StockModule from '@/components/c2-stock'
import { Beef, Package, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Operador {
  id: string
  nombre: string
  rol: string
  nivel?: string
  permisos?: Record<string, boolean>
}

interface StockUnificadaProps {
  operador: Operador
}

export default function StockUnificada({ operador }: StockUnificadaProps) {
  const isAdmin = operador.rol === 'ADMINISTRADOR'
  const puedeStock = isAdmin || operador.permisos?.puedeStock
  const puedeReportes = isAdmin || operador.permisos?.puedeReportes

  // Si no tiene ningún permiso, mostrar mensaje
  if (!puedeStock && !puedeReportes) {
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
  if (puedeStock && !puedeReportes) {
    return <StockCamarasModule operador={operador as any} />
  }
  if (!puedeStock && puedeReportes) {
    return <C2StockModule operador={operador as any} />
  }

  // Tiene ambos permisos, mostrar tabs
  return (
    <div className="space-y-4">
      <Tabs defaultValue="medias" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="medias" className="flex items-center gap-2">
            <Beef className="w-4 h-4" />
            Medias Res
          </TabsTrigger>
          <TabsTrigger value="cajas" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Cajas C2
          </TabsTrigger>
        </TabsList>
        <TabsContent value="medias">
          <StockCamarasModule operador={operador as any} />
        </TabsContent>
        <TabsContent value="cajas">
          <C2StockModule operador={operador as any} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
