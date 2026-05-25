'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Building2, Warehouse, UserCheck, Package, Users, Truck, Beef } from 'lucide-react'
import { ConfigFrigorifico } from './config-frigorifico'
import { Corrales } from './corrales'
import { Camaras } from './camaras'
import { Tipificadores } from './tipificadores'
import { Productos } from './productos'
import { Operadores } from './operadores'
import { Transportistas } from './transportistas'
import { Clientes } from './clientes'

interface Operador {
  id: string
  nombre: string
  nivel: string
}

export function ConfiguracionModule({ operador }: { operador: Operador }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Configuración</h1>
          <p className="text-stone-500">Gestión del sistema Solemar Alimentaria</p>
        </div>

        <Tabs defaultValue="frigorifico" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1 h-auto">
            <TabsTrigger value="frigorifico" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3">
              <Building2 className="w-4 h-4" />
              <span className="hidden lg:inline">Frigorífico</span>
            </TabsTrigger>
            <TabsTrigger value="corrales" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3">
              <Warehouse className="w-4 h-4" />
              <span className="hidden lg:inline">Corrales</span>
            </TabsTrigger>
            <TabsTrigger value="camaras" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3">
              <Warehouse className="w-4 h-4" />
              <span className="hidden lg:inline">Cámaras</span>
            </TabsTrigger>
            <TabsTrigger value="tipificadores" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3">
              <UserCheck className="w-4 h-4" />
              <span className="hidden lg:inline">Tipific.</span>
            </TabsTrigger>
            <TabsTrigger value="productos" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3">
              <Package className="w-4 h-4" />
              <span className="hidden lg:inline">Productos</span>
            </TabsTrigger>
            <TabsTrigger value="clientes" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3">
              <Beef className="w-4 h-4" />
              <span className="hidden lg:inline">Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="transportistas" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3">
              <Truck className="w-4 h-4" />
              <span className="hidden lg:inline">Transp.</span>
            </TabsTrigger>
            <TabsTrigger value="operadores" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3">
              <Users className="w-4 h-4" />
              <span className="hidden lg:inline">Operadores</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="frigorifico">
            <ConfigFrigorifico operador={operador} />
          </TabsContent>
          <TabsContent value="corrales">
            <Corrales operador={operador} />
          </TabsContent>
          <TabsContent value="camaras">
            <Camaras operador={operador} />
          </TabsContent>
          <TabsContent value="tipificadores">
            <Tipificadores operador={operador} />
          </TabsContent>
          <TabsContent value="productos">
            <Productos operador={operador} />
          </TabsContent>
          <TabsContent value="clientes">
            <Clientes operador={operador} />
          </TabsContent>
          <TabsContent value="transportistas">
            <Transportistas operador={operador} />
          </TabsContent>
          <TabsContent value="operadores">
            <Operadores operador={operador} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default ConfiguracionModule
