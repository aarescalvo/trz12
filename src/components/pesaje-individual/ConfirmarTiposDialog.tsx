'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import { TIPOS_ANIMALES } from './constants'
import type { Tropa } from './types'

interface TipoAnimalConfig {
  tipoAnimal: string
  cantidad: number
}

interface ConfirmarTiposDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tropa: Tropa | null
  onConfirm: (tipos: TipoAnimalConfig[]) => void
  loading?: boolean
}

function ConfirmarTiposDialogContent({ tropa, onConfirm, loading, onClose }: {
  tropa: Tropa
  onConfirm: (tipos: TipoAnimalConfig[]) => void
  loading?: boolean
  onClose: () => void
}) {
  // Initialize state directly from tropa.tiposAnimales
  const [tiposAnimales, setTiposAnimales] = useState<TipoAnimalConfig[]>(() => 
    tropa.tiposAnimales?.map(t => ({ ...t })) || []
  )
  const [nuevoTipo, setNuevoTipo] = useState('')
  const [nuevaCantidad, setNuevaCantidad] = useState('')

  const tiposDisponibles = TIPOS_ANIMALES[tropa?.especie || 'BOVINO'] || []
  const tiposUsados = tiposAnimales.map(t => t.tipoAnimal)
  const tiposRestantes = tiposDisponibles.filter(t => !tiposUsados.includes(t.codigo))

  const totalCabezas = tiposAnimales.reduce((acc, t) => acc + t.cantidad, 0)
  const cantidadOriginal = tropa?.tiposAnimales?.reduce((acc, t) => acc + t.cantidad, 0) || 0
  const hayCambios = JSON.stringify(tiposAnimales) !== JSON.stringify(tropa?.tiposAnimales || [])

  const handleAgregarTipo = () => {
    if (!nuevoTipo || !nuevaCantidad) return
    const cantidad = parseInt(nuevaCantidad)
    if (isNaN(cantidad) || cantidad <= 0) return

    setTiposAnimales([...tiposAnimales, { tipoAnimal: nuevoTipo, cantidad }])
    setNuevoTipo('')
    setNuevaCantidad('')
  }

  const handleEliminarTipo = (index: number) => {
    setTiposAnimales(tiposAnimales.filter((_, i) => i !== index))
  }

  const handleModificarCantidad = (index: number, cantidad: number) => {
    if (cantidad < 1) return
    const updated = [...tiposAnimales]
    updated[index] = { ...updated[index], cantidad }
    setTiposAnimales(updated)
  }

  const handleConfirm = () => {
    if (totalCabezas === 0) return
    onConfirm(tiposAnimales)
  }

  return (
    <DialogContent className="max-w-lg" maximizable>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-500" />
          Confirmar Animales DTE
        </DialogTitle>
        <DialogDescription>
          Verifique o edite los tipos y cantidades de animales amparados por el DTE
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Info de la tropa */}
        <div className="bg-stone-50 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-stone-500">Tropa:</span>
            <span className="font-mono font-bold">{tropa?.codigo}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-stone-500">Especie:</span>
            <Badge variant="outline">{tropa?.especie}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-stone-500">DTE:</span>
            <span className="font-mono">{(tropa as unknown as { dte?: string })?.dte || '-'}</span>
          </div>
        </div>

        {/* Lista de tipos */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Tipos y Cantidades (amparados por DTE)</Label>
          
          {tiposAnimales.length === 0 ? (
            <div className="text-center py-4 text-stone-400 border-2 border-dashed rounded-lg">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay animales configurados</p>
              <p className="text-xs">Agregue tipos de animales para continuar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tiposAnimales.map((tipo, index) => {
                const tipoInfo = tiposDisponibles.find(t => t.codigo === tipo.tipoAnimal)
                const originalCantidad = tropa?.tiposAnimales?.find(t => t.tipoAnimal === tipo.tipoAnimal)?.cantidad
                const fueModificado = originalCantidad !== tipo.cantidad
                
                return (
                  <div 
                    key={index} 
                    className={`flex items-center gap-2 p-2 rounded-lg border ${fueModificado ? 'bg-amber-50 border-amber-200' : 'bg-white border-stone-200'}`}
                  >
                    <Badge variant="outline" className="font-mono min-w-[60px] justify-center">
                      {tipo.tipoAnimal}
                    </Badge>
                    <span className="flex-1 text-sm">{tipoInfo?.label || tipo.tipoAnimal}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleModificarCantidad(index, tipo.cantidad - 1)}
                        disabled={tipo.cantidad <= 1}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        value={tipo.cantidad}
                        onChange={(e) => handleModificarCantidad(index, parseInt(e.target.value) || 1)}
                        className="w-16 h-7 text-center font-bold"
                        min={1}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleModificarCantidad(index, tipo.cantidad + 1)}
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleEliminarTipo(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Agregar nuevo tipo */}
        {tiposRestantes.length > 0 && (
          <div className="flex gap-2 items-end pt-2 border-t">
            <div className="flex-1">
              <Label className="text-xs text-stone-500">Agregar tipo</Label>
              <Select value={nuevoTipo} onValueChange={setNuevoTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {tiposRestantes.map((t) => (
                    <SelectItem key={t.codigo} value={t.codigo}>
                      {t.codigo} - {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-20">
              <Label className="text-xs text-stone-500">Cantidad</Label>
              <Input
                type="number"
                value={nuevaCantidad}
                onChange={(e) => setNuevaCantidad(e.target.value)}
                placeholder="0"
                min={1}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleAgregarTipo}
              disabled={!nuevoTipo || !nuevaCantidad}
              className="mb-0.5"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Resumen */}
        <div className="bg-stone-100 p-3 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total animales a pesar:</span>
            <span className="text-xl font-bold text-amber-600">{totalCabezas}</span>
          </div>
          {hayCambios && (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>
                Original: {cantidadOriginal} cabezas. 
                {totalCabezas > cantidadOriginal ? `(+${totalCabezas - cantidadOriginal} más)` : 
                 totalCabezas < cantidadOriginal ? `(${cantidadOriginal - totalCabezas} menos)` : ''}
              </span>
            </div>
          )}
          {totalCabezas !== tropa?.cantidadCabezas && (
            <div className="flex items-center gap-2 text-blue-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>
                El total difiere de las {tropa?.cantidadCabezas} cabezas declaradas en el ingreso
              </span>
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={totalCabezas === 0 || loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            'Guardando...'
          ) : hayCambios ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar y Actualizar ({totalCabezas} animales)
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar ({totalCabezas} animales)
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export function ConfirmarTiposDialog({ open, onOpenChange, tropa, onConfirm, loading }: ConfirmarTiposDialogProps) {
  if (!tropa) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Use key to force remount when tropa changes */}
      <ConfirmarTiposDialogContent
        key={tropa.id}
        tropa={tropa}
        onConfirm={onConfirm}
        loading={loading}
        onClose={() => onOpenChange(false)}
      />
    </Dialog>
  )
}
