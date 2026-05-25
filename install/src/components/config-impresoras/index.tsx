'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { 
  Printer, Plus, Loader2, Trash, Edit
} from 'lucide-react'

interface Operador { id: string; nombre: string; rol: string }

interface Impresora {
  id: string
  nombre: string
  tipo: string
  direccion: string
  activa: boolean
}

interface Props { operador: Operador }

const TIPOS = ['Etiqueta', 'Ticket', 'Matricial', 'Láser']

export function ConfigImpresorasModule({ operador }: Props) {
  const [impresoras, setImpresoras] = useState<Impresora[]>([
    { id: '1', nombre: 'Zebra GK420d', tipo: 'Etiqueta', direccion: '192.168.1.100', activa: true },
    { id: '2', nombre: 'Epson TM-T20', tipo: 'Ticket', direccion: 'USB001', activa: true },
    { id: '3', nombre: 'Datamax I-4208', tipo: 'Etiqueta', direccion: '192.168.1.101', activa: false },
  ])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Impresora | null>(null)
  const [guardando, setGuardando] = useState(false)

  const [formData, setFormData] = useState({ nombre: '', tipo: 'Etiqueta', direccion: '' })

  const handleGuardar = async () => {
    if (!formData.nombre) { toast.error('Ingrese el nombre'); return }
    setGuardando(true)
    setTimeout(() => {
      toast.success(editando ? 'Impresora actualizada' : 'Impresora creada')
      setModalOpen(false); setGuardando(false); resetForm()
    }, 500)
  }

  const handleToggleActiva = (id: string, activa: boolean) => {
    setImpresoras(impresoras.map(i => i.id === id ? { ...i, activa } : i))
    toast.success(activa ? 'Impresora activada' : 'Impresora desactivada')
  }

  const resetForm = () => {
    setFormData({ nombre: '', tipo: 'Etiqueta', direccion: '' })
    setEditando(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Printer className="w-6 h-6 text-amber-500" />
            Configuración de Impresoras
          </h2>
          <p className="text-sm text-stone-500">Gestión de impresoras de etiquetas y tickets</p>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="w-4 h-4 mr-2" />Nueva Impresora
        </Button>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-stone-50">
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Dirección/Puerto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" /></TableCell></TableRow>
              ) : impresoras.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.nombre}</TableCell>
                  <TableCell><Badge variant="outline">{i.tipo}</Badge></TableCell>
                  <TableCell className="font-mono text-sm">{i.direccion}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={i.activa} onCheckedChange={(v) => handleToggleActiva(i.id, v)} />
                      <Badge variant={i.activa ? 'default' : 'secondary'}>{i.activa ? 'Activa' : 'Inactiva'}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => { setEditando(i); setFormData({ nombre: i.nombre, tipo: i.tipo, direccion: i.direccion }); setModalOpen(true); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editando ? 'Editar Impresora' : 'Nueva Impresora'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select className="w-full border rounded px-3 py-2" value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value})}>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Dirección/Puerto</Label>
              <Input value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} placeholder="192.168.1.100 o USB001" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleGuardar} disabled={guardando} className="bg-amber-500 hover:bg-amber-600">
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ConfigImpresorasModule
