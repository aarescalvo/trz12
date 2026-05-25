'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Scissors } from 'lucide-react'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

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
  const { editMode, getTexto } = useEditor()
  return <CortesDespostadaContent operador={operador} />
}

function CortesDespostadaContent({ operador }: Props) {
  return (
    <div className="space-y-6 p-4 md:p-6 min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      <EditableBlock bloqueId="header" label="Encabezado">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            <TextoEditable id="titulo-cortes-despostada" original="Cortes de Despostada" tag="span" />
          </h1>
        </div>
      </EditableBlock>

      <EditableBlock bloqueId="info" label="Información del Módulo">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              <TextoEditable id="titulo-modulo-desarrollo-cortes" original="Módulo en Desarrollo" tag="span" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
              <Scissors className="h-8 w-8 text-muted-foreground flex-shrink-0" />
              <div className="space-y-2">
                <h3 className="font-semibold">
                  <TextoEditable id="titulo-funcionalidad-cortes" original="Funcionalidad Planeada" tag="span" />
                </h3>
                <p className="text-sm text-muted-foreground">
                  <TextoEditable id="desc-funcionalidad-cortes" original="Este módulo permitirá registrar variaciones (golpes) en los cortes durante el proceso de despostada." tag="span" />
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">
                    <TextoEditable id="titulo-registro-variaciones" original="Registro de Variaciones" tag="span" />
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    <TextoEditable id="desc-registro-variaciones" original="Documentar golpes, lesiones u otras variaciones detectadas en los cortes." tag="span" />
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">
                    <TextoEditable id="titulo-destino-corte" original="Destino del Corte" tag="span" />
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    <TextoEditable id="desc-destino-corte" original="Registrar si el corte se aprovecha, se recorta o se descarta completamente." tag="span" />
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">
                    <TextoEditable id="titulo-causas-corte" original="Causas" tag="span" />
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    <TextoEditable id="desc-causas-corte" original="Clasificar las causas de las variaciones: golpes, abscesos, contusiones, etc." tag="span" />
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong><TextoEditable id="label-objetivo-cortes" original="Objetivo:" tag="span" /></strong>{' '}
                <TextoEditable id="desc-objetivo-cortes" original="Control de calidad y trazabilidad de mermas en el proceso de despostada, permitiendo identificar causas frecuentes de variaciones y tomar acciones correctivas." tag="span" />
              </p>
            </div>
          </CardContent>
        </Card>
      </EditableBlock>
    </div>
  )
}
