'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IngresoDespostadaModule } from '@/components/ingreso-despostada'
import C2IngresoDesposteModule from '@/components/c2-ingreso-desposte'
import { Package, Scissors, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Operador {
  id: string
  nombre: string
  rol: string
  permisos?: Record<string, boolean>
}

interface IngresoDesposteUnificadoProps {
  operador: Operador
}

export default function IngresoDesposteUnificado({ operador }: IngresoDesposteUnificadoProps) {
  const isAdmin = operador.rol === 'ADMINISTRADOR'
  const puedeDesposte = isAdmin || operador.permisos?.puedeDesposte
  // Ambas pestañas usan el mismo permiso puedeDesposte
  // IngresoDespostadaModule y C2IngresoDesposteModule ambos requieren puedeDesposte

  if (!puedeDesposte) {
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

  return (
    <div className="space-y-4">
      <Tabs defaultValue="medias" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="medias" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Medias Res
          </TabsTrigger>
          <TabsTrigger value="cuartos" className="flex items-center gap-2">
            <Scissors className="w-4 h-4" />
            Cuartos C2
          </TabsTrigger>
        </TabsList>
        <TabsContent value="medias">
          <IngresoDespostadaModule operador={operador} />
        </TabsContent>
        <TabsContent value="cuartos">
          <C2IngresoDesposteModule operador={operador} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
