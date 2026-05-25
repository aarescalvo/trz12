'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface QuickAddDialogProps {
  tipo: 'transportista' | 'productor' | 'usuarioFaena'
  onAdd: (data: { id: string; nombre: string; esProductor?: boolean; esUsuarioFaena?: boolean }) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickAddDialog({ 
  tipo, 
  onAdd, 
  open, 
  onOpenChange 
}: QuickAddDialogProps) {
  const [nombre, setNombre] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!nombre.trim()) {
      toast.error('Ingrese un nombre')
      return
    }

    setSaving(true)
    try {
      let url = ''
      let body: { nombre: string; esProductor?: boolean; esUsuarioFaena?: boolean } = { nombre }
      
      if (tipo === 'transportista') {
        url = '/api/transportistas'
      } else {
        url = '/api/clientes'
        body = { 
          nombre, 
          esProductor: tipo === 'productor',
          esUsuarioFaena: tipo === 'usuarioFaena'
        }
      }
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success(`${tipo === 'transportista' ? 'Transportista' : 'Cliente'} creado`)
        onAdd(data.data)
        setNombre('')
        onOpenChange(false)
      } else {
        toast.error(data.error || 'Error al crear')
      }
    } catch (error) {
      console.error('Error creating:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const labels = {
    transportista: 'Transportista',
    productor: 'Productor',
    usuarioFaena: 'Usuario de Faena'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar {labels[tipo]}</DialogTitle>
          <DialogDescription>
            Ingrese el nombre para agregarlo rápidamente
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label>Nombre / Razón Social</Label>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={`Nombre del ${labels[tipo].toLowerCase()}`}
            className="mt-2"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
            {saving ? 'Guardando...' : 'Agregar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Componente para el botón que abre el diálogo
interface QuickAddButtonProps {
  tipo: 'transportista' | 'productor' | 'usuarioFaena'
  onAdd: (data: { id: string; nombre: string; esProductor?: boolean; esUsuarioFaena?: boolean }) => void
}

export function QuickAddButton({ tipo, onAdd }: QuickAddButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button 
        type="button" 
        variant="ghost" 
        size="sm" 
        className="h-7 text-amber-600 hover:text-amber-700"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4 mr-1" />
        Nuevo
      </Button>
      <QuickAddDialog
        tipo={tipo}
        onAdd={onAdd}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
