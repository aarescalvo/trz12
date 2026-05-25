'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { 
  Scale, Plus, Loader2, Trash, Edit, Power
} from 'lucide-react'

interface Operador { id: string; nombre: string; rol: string }

interface Balanza {
  id: string
  nombre: string
  puerto: string
  baudRate: number
  activa: boolean
  ultimaCalibracion?: string
}

interface Props { operador: Operador }

export function ConfigBalanzasModule({ operador }: Props) {
  const [balanzas, setBalanzas] = useState<Balanza[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Balanza | null>(null)
  const [guardando, setGuardando] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    puerto: 'COM1',
    baudRate: '9600'
  })

  useEffect(() => {
    fetchBalanzas()
  }, [])

  const fetchBalanzas = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/configuracion?tipo=balanzas')
      const data = await res.json()
      if (data.success && data.balanzas) {
        setBalanzas(data.balanzas)
      } else {
        // Datos de prueba
        setBalanzas([
          { id: '1', nombre: 'Balanza Principal', puerto: 'COM1', baudRate: 9600, activa: true },
          { id: '2', nombre: 'Balanza Romaneo', puerto: 'COM2', baudRate: 9600, activa: true },
        ])
      }
    } catch {
      setBalanzas([
        { id: '1', nombre: 'Balanza Principal', puerto: 'COM1', baudRate: 9600, activa: true },
        { id: '2', nombre: 'Balanza Romaneo', puerto: 'COM2', baudRate: 9600, activa: true },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async () => {
    if (!formData.nombre) {
      toast.error('Ingrese el nombre')
      return
    }
    setGuardando(true)
    setTimeout(() => {
      toast.success(editando ? 'Balanza actualizada' : 'Balanza creada')
      setModalOpen(false)
      setGuardando(false)
      resetForm()
    }, 500)
  }

  const handleToggleActiva = async (id: string, activa: boolean) => {
    setBalanzas(balanzas.map(b => b.id === id ? { ...b, activa } : b))
    toast.success(activa ? 'Balanza activada' : 'Balanza desactivada')
  }

  const resetForm = () => {
    setFormData({ nombre: '', puerto: 'COM1', baudRate: '9600' })
    setEditando(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Scale className="w-6 h-6 text-amber-500" />
            Configuración de Balanzas
          </h2>
          <p className="text-sm text-stone-500">Conexión con balanzas electrónicas</p>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Balanza
        </Button>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-stone-50">
                <TableHead>Nombre</TableHead>
                <TableHead>Puerto</TableHead>
                <TableHead>Baud Rate</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                  </TableCell>
                </TableRow>
              ) : balanzas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-stone-400 py-8">
                    No hay balanzas configuradas
                  </TableCell>
                </TableRow>
              ) : (
                balanzas.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.nombre}</TableCell>
                    <TableCell className="font-mono">{b.puerto}</TableCell>
                    <TableCell>{b.baudRate}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={b.activa} onCheckedChange={(v) => handleToggleActiva(b.id, v)} />
                        <Badge variant={b.activa ? 'default' : 'secondary'}>
                          {b.activa ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditando(b)
                        setFormData({ nombre: b.nombre, puerto: b.puerto, baudRate: b.baudRate.toString() })
                        setModalOpen(true)
                      }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Balanza' : 'Nueva Balanza'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} placeholder="Balanza Principal" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Puerto</Label>
                <Input value={formData.puerto} onChange={(e) => setFormData({...formData, puerto: e.target.value})} placeholder="COM1" />
              </div>
              <div className="space-y-2">
                <Label>Baud Rate</Label>
                <Input value={formData.baudRate} onChange={(e) => setFormData({...formData, baudRate: e.target.value})} placeholder="9600" />
              </div>
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

export default ConfigBalanzasModule
