'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileCheck, FileText } from 'lucide-react'
import { CCIRModule } from './ccir'
import { DeclaracionJuradaModule } from './declaracion-jurada'

interface Operador {
  id: string
  nombre: string
  rol: string
}

export function CumplimientoRegulatorioModule({ operador }: { operador: Operador }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Cumplimiento Regulatorio</h1>
          <p className="text-stone-500">Gestión de CCIR y Declaraciones Juradas - Solemar Alimentaria</p>
        </div>

        <Tabs defaultValue="ccir" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 gap-1 h-auto">
            <TabsTrigger value="ccir" className="flex items-center gap-2 text-sm md:text-base py-3">
              <FileCheck className="w-4 h-4" />
              CCIR - Certificados
            </TabsTrigger>
            <TabsTrigger value="declaracion" className="flex items-center gap-2 text-sm md:text-base py-3">
              <FileText className="w-4 h-4" />
              Declaración Jurada
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ccir">
            <CCIRModule operador={operador} />
          </TabsContent>
          <TabsContent value="declaracion">
            <DeclaracionJuradaModule operador={operador} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default CumplimientoRegulatorioModule
