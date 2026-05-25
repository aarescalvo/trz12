'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Barcode, Plus, Loader2, Edit, Copy
} from 'lucide-react'

interface Operador { id: string; nombre: string; rol: string }

interface CodigoConfig {
  id: string
  tipo: string
  prefijo: string
  formato: string
  descripcion: string
}

interface Props { operador: Operador }

const TIPOS_CODIGO = ['Media Res', 'Cuarto', 'Producto', 'Caja', 'Subproducto']

export function ConfigCodigobarrasModule({ operador }: Props) {
  const [codigos, setCodigos] = useState<CodigoConfig[]>([
    { id: '1', tipo: 'Media Res', prefijo: 'MR', formato: 'MR-TROPA-GARRON-LADO-FECHA', descripcion: 'Media res individual' },
    { id: '2', tipo: 'Cuarto', prefijo: 'CD', formato: 'CD-TROPA-GARRON-TIPO', descripcion: 'Cuarto delantero/trasero' },
    { id: '3', tipo: 'Producto', prefijo: 'PR', formato: 'PR-CODIGO-LOTE-FECHA', descripcion: 'Producto terminado' },
    { id: '4', tipo: 'Caja', prefijo: 'CJ', formato: 'CJ-CODIGO-PESO-NUM', descripcion: 'Caja de producto' },
  ])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<CodigoConfig | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState({ tipo: 'Media Res', prefijo: '', formato: '', descripcion: '' })

  const handleGuardar = async () => {
    if (!formData.tipo || !formData.formato) { toast.error('Complete los campos'); return }
    setGuardando(true)
    setTimeout(() => {
      toast.success(editando ? 'Configuración actualizada' : 'Configuración creada')
      setModalOpen(false); setGuardando(false); resetForm()
    }, 500)
  }

  const resetForm = () => { setFormData({ tipo: 'Media Res', prefijo: '', formato: '', descripcion: '' }); setEditando(null) }

  const handleCopiar = (formato: string) => {
    navigator.clipboard.writeText(formato)
    toast.success('Formato copiado')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Barcode className="w-6 h-6 text-amber-500" />
            Configuración de Código de Barras
          </h2>
          <p className="text-sm text-stone-500">Formatos para generación de códigos</p>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="w-4 h-4 mr-2" />Nuevo Formato
        </Button>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-stone-50">
                <TableHead>Tipo</TableHead>
                <TableHead>Prefijo</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" /></TableCell></TableRow>
              ) : codigos.map((c) => (
                <TableRow key={c.id}>
                  <TableCell><Badge variant="outline">{c.tipo}</Badge></TableCell>
                  <TableCell className="font-mono font-bold">{c.prefijo}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-stone-100 px-2 py-1 rounded text-sm">{c.formato}</code>
                      <Button variant="ghost" size="sm" onClick={() => handleCopiar(c.formato)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-stone-500">{c.descripcion}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => { setEditando(c); setFormData({ tipo: c.tipo, prefijo: c.prefijo, formato: c.formato, descripcion: c.descripcion }); setModalOpen(true); }}>
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
          <DialogHeader><DialogTitle>{editando ? 'Editar Formato' : 'Nuevo Formato'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <select className="w-full border rounded px-3 py-2" value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value})}>
                  {TIPOS_CODIGO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Prefijo (2-3 caracteres)</Label>
                <Input value={formData.prefijo} onChange={(e) => setFormData({...formData, prefijo: e.target.value.toUpperCase()})} maxLength={3} placeholder="MR" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Formato *</Label>
              <Input value={formData.formato} onChange={(e) => setFormData({...formData, formato: e.target.value})} placeholder="MR-TROPA-GARRON-LADO" />
              <p className="text-xs text-stone-400">Variables: TROPA, GARRON, LADO, FECHA, LOTE, CODIGO, PESO, NUM</p>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} placeholder="Descripción del formato" />
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

export default ConfigCodigobarrasModule
