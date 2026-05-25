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
  Monitor, Plus, Loader2, Edit
} from 'lucide-react'

interface Operador { id: string; nombre: string; rol: string }

interface Terminal {
  id: string
  nombre: string
  ubicacion: string
  ip: string
  activa: boolean
}

interface Props { operador: Operador }

export function ConfigTerminalesModule({ operador }: Props) {
  const [terminales, setTerminales] = useState<Terminal[]>([
    { id: '1', nombre: 'Terminal Recepción', ubicacion: 'Oficina', ip: '192.168.1.10', activa: true },
    { id: '2', nombre: 'Terminal Faena', ubicacion: 'Playa Faena', ip: '192.168.1.11', activa: true },
    { id: '3', nombre: 'Terminal Romaneo', ubicacion: 'Sala Romaneo', ip: '192.168.1.12', activa: true },
    { id: '4', nombre: 'Terminal Desposte', ubicacion: 'Despostada', ip: '192.168.1.13', activa: false },
  ])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Terminal | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState({ nombre: '', ubicacion: '', ip: '' })

  const handleGuardar = async () => {
    if (!formData.nombre) { toast.error('Ingrese el nombre'); return }
    setGuardando(true)
    setTimeout(() => {
      toast.success(editando ? 'Terminal actualizada' : 'Terminal creada')
      setModalOpen(false); setGuardando(false); resetForm()
    }, 500)
  }

  const handleToggleActiva = (id: string, activa: boolean) => {
    setTerminales(terminales.map(t => t.id === id ? { ...t, activa } : t))
    toast.success(activa ? 'Terminal activada' : 'Terminal desactivada')
  }

  const resetForm = () => { setFormData({ nombre: '', ubicacion: '', ip: '' }); setEditando(null) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Monitor className="w-6 h-6 text-amber-500" />
            Configuración de Terminales
          </h2>
          <p className="text-sm text-stone-500">Puntos de operación del sistema</p>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="w-4 h-4 mr-2" />Nueva Terminal
        </Button>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-stone-50">
                <TableHead>Nombre</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Dirección IP</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" /></TableCell></TableRow>
              ) : terminales.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.nombre}</TableCell>
                  <TableCell>{t.ubicacion}</TableCell>
                  <TableCell className="font-mono text-sm">{t.ip}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={t.activa} onCheckedChange={(v) => handleToggleActiva(t.id, v)} />
                      <Badge variant={t.activa ? 'default' : 'secondary'}>{t.activa ? 'Activa' : 'Inactiva'}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => { setEditando(t); setFormData({ nombre: t.nombre, ubicacion: t.ubicacion, ip: t.ip }); setModalOpen(true); }}>
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
          <DialogHeader><DialogTitle>{editando ? 'Editar Terminal' : 'Nueva Terminal'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} placeholder="Terminal Recepción" />
            </div>
            <div className="space-y-2">
              <Label>Ubicación</Label>
              <Input value={formData.ubicacion} onChange={(e) => setFormData({...formData, ubicacion: e.target.value})} placeholder="Oficina principal" />
            </div>
            <div className="space-y-2">
              <Label>Dirección IP</Label>
              <Input value={formData.ip} onChange={(e) => setFormData({...formData, ip: e.target.value})} placeholder="192.168.1.10" />
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

export default ConfigTerminalesModule
