'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExpedicionModule } from '@/components/expedicion'
import C2ExpedicionModule from '@/components/c2-expedicion'
import { Beef, Package, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Operador {
  id: string
  nombre: string
  rol: string
  permisos?: Record<string, boolean>
}

interface ExpedicionUnificadaProps {
  operador: Operador
}

export default function ExpedicionUnificada({ operador }: ExpedicionUnificadaProps) {
  const isAdmin = operador.rol === 'ADMINISTRADOR'
  const puedeStock = isAdmin || operador.permisos?.puedeStock
  const puedeExpedicionC2 = isAdmin || operador.permisos?.puedeExpedicionC2

  // Si no tiene ningún permiso, mostrar mensaje
  if (!puedeStock && !puedeExpedicionC2) {
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
  if (puedeStock && !puedeExpedicionC2) {
    return <ExpedicionModule operador={operador} />
  }
  if (!puedeStock && puedeExpedicionC2) {
    return <C2ExpedicionModule operador={operador} />
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
          <ExpedicionModule operador={operador} />
        </TabsContent>
        <TabsContent value="cajas">
          <C2ExpedicionModule operador={operador} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
