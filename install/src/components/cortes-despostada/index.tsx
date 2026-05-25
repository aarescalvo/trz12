'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Scissors } from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  usuario: string
  rol: string
  permisos: Record<string, boolean>
}

interface Props {
  operador: Operador
}

export function CortesDespostadaModule({ operador }: Props) {
  return <CortesDespostadaContent operador={operador} />
}

function CortesDespostadaContent({ operador }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Cortes de Despostada</h1>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            Módulo en Desarrollo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
            <Scissors className="h-8 w-8 text-muted-foreground flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold">Funcionalidad Planeada</h3>
              <p className="text-sm text-muted-foreground">
                Este módulo permitirá registrar variaciones (golpes) en los cortes durante el proceso de despostada.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium mb-2">Registro de Variaciones</h4>
                <p className="text-sm text-muted-foreground">
                  Documentar golpes, lesiones u otras variaciones detectadas en los cortes.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium mb-2">Destino del Corte</h4>
                <p className="text-sm text-muted-foreground">
                  Registrar si el corte se aprovecha, se recorta o se descarta completamente.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium mb-2">Causas</h4>
                <p className="text-sm text-muted-foreground">
                  Clasificar las causas de las variaciones: golpes, abscesos, contusiones, etc.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Objetivo:</strong> Control de calidad y trazabilidad de mermas en el proceso de despostada, 
              permitiendo identificar causas frecuentes de variaciones y tomar acciones correctivas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
