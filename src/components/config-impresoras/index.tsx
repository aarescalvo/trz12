'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import { 
  Printer, Plus, Loader2, Trash, Edit, RefreshCw, 
  TestTube, Eye, Copy, Download, FileText, Settings
} from 'lucide-react'

interface Operador { id: string; nombre: string; rol: string }

interface Impresora {
  id: string
  nombre: string
  marca: 'ZEBRA' | 'DATAMAX' | 'EPSON' | 'OTRA'
  modelo: string
  tipo: 'ETIQUETA' | 'TICKET' | 'MATRICIAL'
  direccion: string // IP o USB
  puerto: number
  dpi: number
  anchoEtiqueta: number // mm
  altoEtiqueta: number // mm
  activa: boolean
  porDefecto: boolean
  plantillaZPL?: string
}

interface PlantillaRotulo {
  id: string
  nombre: string
  tipo: 'MEDIA_RES' | 'CUARTO' | 'MENUDENCIA' | 'CAJA' | 'PALLET'
  ancho: number
  alto: number
  codigoZPL: string
  variables: string[]
}

interface Props { operador: Operador }

const MARCAS = [
  { id: 'ZEBRA', nombre: 'Zebra Technologies', modelos: ['GK420d', 'GK420t', 'ZD420', 'ZT410', 'ZT420'] },
  { id: 'DATAMAX', nombre: 'Datamax-O\'Neil', modelos: ['I-4208', 'I-4212', 'I-4406', 'W-6208', 'W-6308'] },
  { id: 'NETTIRA', nombre: 'Nettira (Datamax)', modelos: ['NTE-200', 'NTE-300', 'NT-3300'] },
  { id: 'EPSON', nombre: 'Epson', modelos: ['TM-T20', 'TM-T88', 'TM-L90', 'TM-C3500'] },
  { id: 'OTRA', nombre: 'Otra marca', modelos: [] }
]

const PLANTILLAS_PREDEFINIDAS: PlantillaRotulo[] = [
  {
    id: '1',
    nombre: 'Rótulo Media Res (5x10cm)',
    tipo: 'MEDIA_RES',
    ancho: 50,
    alto: 100,
    variables: ['TROPA', 'GARRON', 'PESO', 'FECHA', 'TIPIFICADOR', 'SIGLA', 'LADO'],
    codigoZPL: `^XA
^CI28
^PW480
^LL960
^FO20,20^A0N,30,30^FD{{NOMBRE_FRIGORIFICO}}^FS
^FO20,60^A0N,25,25^FD{{DIRECCION}}^FS
^FO20,100^BCN,60,Y,N,N^FD{{CODIGO_BARRAS}}^FS
^FO20,180^A0N,25,25^FDTropa: {{TROPA}}^FS
^FO20,210^A0N,25,25^FDGarron: {{GARRON}}^FS
^FO20,240^A0N,25,25^FDSigla: {{SIGLA}} - Lado: {{LADO}}^FS
^FO20,270^A0N,30,30^FD{{PESO}} KG^FS
^FO250,180^A0N,20,20^FDFaena: {{FECHA}}^FS
^FO250,210^A0N,20,20^FDVence: {{VENCIMIENTO}}^FS
^FO250,250^A0N,20,20^FDTip.: {{TIPIFICADOR}}^FS
^FO20,320^A0N,18,18^FD{{NOMBRE_ESTABLECIMIENTO}}^FS
^FO20,345^A0N,18,18^FDCUIT: {{CUIT}}^FS
^XZ`
  },
  {
    id: '2',
    nombre: 'Rótulo Cuarto (5x10cm)',
    tipo: 'CUARTO',
    ancho: 50,
    alto: 100,
    variables: ['TROPA', 'GARRON', 'PESO', 'SIGLA', 'FECHA'],
    codigoZPL: `^XA
^CI28
^PW480
^LL960
^FO20,20^A0N,30,30^FD{{NOMBRE_FRIGORIFICO}}^FS
^FO20,60^BCN,60,Y,N,N^FD{{CODIGO_BARRAS}}^FS
^FO20,150^A0N,25,25^FDTropa: {{TROPA}}^FS
^FO20,180^A0N,25,25^FDSigla: {{SIGLA}}^FS
^FO20,220^A0N,35,35^FD{{PESO}} KG^FS
^FO20,280^A0N,20,20^FDFaena: {{FECHA}}^FS
^FO20,310^A0N,18,18^FD{{NOMBRE_ESTABLECIMIENTO}}^FS
^XZ`
  },
  {
    id: '3',
    nombre: 'Etiqueta Caja Empaque (10x7cm)',
    tipo: 'CAJA',
    ancho: 100,
    alto: 70,
    variables: ['PRODUCTO', 'PESO', 'UNIDADES', 'LOTE', 'FECHA', 'VENCIMIENTO'],
    codigoZPL: `^XA
^CI28
^PW800
^LL560
^FO20,20^A0N,35,35^FD{{PRODUCTO}}^FS
^FO20,70^BCN,80,Y,N,N^FD{{CODIGO_BARRAS}}^FS
^FO20,180^A0N,25,25^FDPeso: {{PESO}} KG^FS
^FO200,180^A0N,25,25^FDUnidades: {{UNIDADES}}^FS
^FO20,220^A0N,20,20^FDLote: {{LOTE}}^FS
^FO200,220^A0N,20,20^FDVence: {{VENCIMIENTO}}^FS
^FO400,20^A0N,20,20^FD{{NOMBRE_FRIGORIFICO}}^FS
^FO400,50^A0N,18,18^FD{{NOMBRE_ESTABLECIMIENTO}}^FS
^FO400,80^A0N,18,18^FDCUIT: {{CUIT}}^FS
^XZ`
  }
]

export function ConfigImpresorasModule({ operador }: Props) {
  const [impresoras, setImpresoras] = useState<Impresora[]>([
    { id: '1', nombre: 'Zebra GK420d - Rotulos', marca: 'ZEBRA', modelo: 'GK420d', tipo: 'ETIQUETA', direccion: '192.168.1.100', puerto: 9100, dpi: 203, anchoEtiqueta: 50, altoEtiqueta: 100, activa: true, porDefecto: true },
    { id: '2', nombre: 'Datamax I-4208 - Cajas', marca: 'DATAMAX', modelo: 'I-4208', tipo: 'ETIQUETA', direccion: '192.168.1.101', puerto: 9100, dpi: 203, anchoEtiqueta: 100, altoEtiqueta: 70, activa: true, porDefecto: false },
    { id: '3', nombre: 'Epson TM-T20 - Tickets', marca: 'EPSON', modelo: 'TM-T20', tipo: 'TICKET', direccion: 'USB001', puerto: 0, dpi: 180, anchoEtiqueta: 80, altoEtiqueta: 0, activa: true, porDefecto: false },
  ])
  const [plantillas, setPlantillas] = useState<PlantillaRotulo[]>(PLANTILLAS_PREDEFINIDAS)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalPlantillaOpen, setModalPlantillaOpen] = useState(false)
  const [modalPruebaOpen, setModalPruebaOpen] = useState(false)
  const [modalPreviewOpen, setModalPreviewOpen] = useState(false)
  const [editando, setEditando] = useState<Impresora | null>(null)
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<PlantillaRotulo | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [probando, setProbando] = useState(false)

  const [formData, setFormData] = useState<Partial<Impresora>>({
    nombre: '', marca: 'ZEBRA', modelo: '', tipo: 'ETIQUETA', direccion: '', puerto: 9100, dpi: 203, anchoEtiqueta: 50, altoEtiqueta: 100
  })

  const [datosPrueba, setDatosPrueba] = useState({
    tropa: 'B20260001',
    garron: '1',
    peso: '125.50',
    fecha: new Date().toLocaleDateString('es-AR'),
    tipificador: 'T-1234',
    sigla: 'A',
    lado: 'IZQ'
  })

  // Obtener modelos según marca
  const getModelos = () => {
    const marca = MARCAS.find(m => m.id === formData.marca)
    return marca?.modelos || []
  }

  const handleGuardar = async () => {
    if (!formData.nombre) { toast.error('Ingrese el nombre'); return }
    if (!formData.direccion) { toast.error('Ingrese la dirección IP o puerto'); return }
    
    setGuardando(true)
    setTimeout(() => {
      if (editando) {
        setImpresoras(impresoras.map(i => i.id === editando.id ? { ...i, ...formData } as Impresora : i))
        toast.success('Impresora actualizada')
      } else {
        const nueva: Impresora = {
          id: Date.now().toString(),
          nombre: formData.nombre || '',
          marca: formData.marca || 'ZEBRA',
          modelo: formData.modelo || '',
          tipo: formData.tipo || 'ETIQUETA',
          direccion: formData.direccion || '',
          puerto: formData.puerto || 9100,
          dpi: formData.dpi || 203,
          anchoEtiqueta: formData.anchoEtiqueta || 50,
          altoEtiqueta: formData.altoEtiqueta || 100,
          activa: true,
          porDefecto: false
        }
        setImpresoras([...impresoras, nueva])
        toast.success('Impresora creada')
      }
      setModalOpen(false)
      setGuardando(false)
      resetForm()
    }, 500)
  }

  const handleProbarImpresion = async () => {
    if (!plantillaSeleccionada) return
    
    setProbando(true)
    // Simular envío a impresora
    await new Promise(r => setTimeout(r, 1500))
    toast.success('Comando de impresión enviado correctamente')
    setProbando(false)
    setModalPruebaOpen(false)
  }

  const handleToggleActiva = (id: string, activa: boolean) => {
    setImpresoras(impresoras.map(i => i.id === id ? { ...i, activa } : i))
    toast.success(activa ? 'Impresora activada' : 'Impresora desactivada')
  }

  const handleSetPorDefecto = (id: string) => {
    setImpresoras(impresoras.map(i => ({ ...i, porDefecto: i.id === id })))
    toast.success('Impresora establecida como predeterminada')
  }

  const resetForm = () => {
    setFormData({ nombre: '', marca: 'ZEBRA', modelo: '', tipo: 'ETIQUETA', direccion: '', puerto: 9100, dpi: 203, anchoEtiqueta: 50, altoEtiqueta: 100 })
    setEditando(null)
  }

  const copiarZPL = (codigo: string) => {
    navigator.clipboard.writeText(codigo)
    toast.success('Código ZPL copiado al portapapeles')
  }

  const getBadgeColor = (marca: string) => {
    switch (marca) {
      case 'ZEBRA': return 'bg-blue-100 text-blue-700'
      case 'DATAMAX': return 'bg-purple-100 text-purple-700'
      case 'EPSON': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Printer className="w-8 h-8 text-amber-500" />
              Configuración de Impresoras
            </h1>
            <p className="text-stone-500 mt-1">Gestión de impresoras Zebra, Datamax y tickets</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" />Nueva Impresora
            </Button>
          </div>
        </div>

        <Tabs defaultValue="impresoras" className="space-y-4">
          <TabsList className="bg-stone-100">
            <TabsTrigger value="impresoras">Impresoras</TabsTrigger>
            <TabsTrigger value="plantillas">Plantillas ZPL</TabsTrigger>
            <TabsTrigger value="pruebas">Pruebas</TabsTrigger>
          </TabsList>

          {/* Tab Impresoras */}
          <TabsContent value="impresoras" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50">
                      <TableHead>Nombre</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead>Etiqueta</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-32"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" /></TableCell></TableRow>
                    ) : impresoras.map((i) => (
                      <TableRow key={i.id} className={i.porDefecto ? 'bg-amber-50' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{i.nombre}</span>
                            {i.porDefecto && <Badge className="bg-amber-500 text-xs">Default</Badge>}
                          </div>
                        </TableCell>
                        <TableCell><Badge className={getBadgeColor(i.marca)}>{i.marca}</Badge></TableCell>
                        <TableCell>{i.tipo}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {i.direccion}{i.puerto ? `:${i.puerto}` : ''}
                        </TableCell>
                        <TableCell className="text-sm">{i.anchoEtiqueta}x{i.altoEtiqueta}mm</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch checked={i.activa} onCheckedChange={(v) => handleToggleActiva(i.id, v)} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setEditando(i); setFormData(i); setModalOpen(true); }} title="Editar">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleSetPorDefecto(i.id)} title="Establecer como predeterminada">
                              <TestTube className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Plantillas */}
          <TabsContent value="plantillas" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plantillas.map((plantilla) => (
                <Card key={plantilla.id} className="border-0 shadow-md">
                  <CardHeader className="bg-stone-50 rounded-t-lg pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{plantilla.nombre}</CardTitle>
                      <Badge variant="outline">{plantilla.tipo}</Badge>
                    </div>
                    <CardDescription>{plantilla.ancho}x{plantilla.alto}mm</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <p className="text-xs text-stone-500 mb-1">Variables disponibles:</p>
                      <div className="flex flex-wrap gap-1">
                        {plantilla.variables.map(v => (
                          <Badge key={v} variant="secondary" className="text-xs">{String(v)}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setPlantillaSeleccionada(plantilla); setModalPreviewOpen(true); }}>
                        <Eye className="w-4 h-4 mr-1" /> Vista Previa
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => copiarZPL(plantilla.codigoZPL)}>
                        <Copy className="w-4 h-4 mr-1" /> Copiar ZPL
                      </Button>
                      <Button size="sm" onClick={() => { setPlantillaSeleccionada(plantilla); setModalPruebaOpen(true); }}>
                        <Printer className="w-4 h-4 mr-1" /> Probar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab Pruebas */}
          <TabsContent value="pruebas" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle>Prueba de Impresión</CardTitle>
                <CardDescription>Ingrese datos de prueba para verificar la impresión</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Tropa</Label>
                    <Input value={datosPrueba.tropa} onChange={(e) => setDatosPrueba({...datosPrueba, tropa: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Garrón</Label>
                    <Input value={datosPrueba.garron} onChange={(e) => setDatosPrueba({...datosPrueba, garron: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Peso (KG)</Label>
                    <Input value={datosPrueba.peso} onChange={(e) => setDatosPrueba({...datosPrueba, peso: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipificador</Label>
                    <Input value={datosPrueba.tipificador} onChange={(e) => setDatosPrueba({...datosPrueba, tipificador: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Sigla</Label>
                    <Select value={datosPrueba.sigla} onValueChange={(v) => setDatosPrueba({...datosPrueba, sigla: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A - Asado</SelectItem>
                        <SelectItem value="T">T - Trasero</SelectItem>
                        <SelectItem value="D">D - Delantero</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Lado</Label>
                    <Select value={datosPrueba.lado} onValueChange={(v) => setDatosPrueba({...datosPrueba, lado: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IZQ">Izquierda</SelectItem>
                        <SelectItem value="DER">Derecha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Plantilla</Label>
                    <Select value={plantillaSeleccionada?.id} onValueChange={(v) => setPlantillaSeleccionada(plantillas.find(p => p.id === v) || null)}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {plantillas.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="flex gap-4">
                  <Button onClick={() => setModalPruebaOpen(true)} disabled={!plantillaSeleccionada} className="bg-amber-500 hover:bg-amber-600">
                    <Printer className="w-4 h-4 mr-2" />Imprimir Prueba
                  </Button>
                  <Button variant="outline" onClick={() => setModalPreviewOpen(true)} disabled={!plantillaSeleccionada}>
                    <Eye className="w-4 h-4 mr-2" />Vista Previa
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal: Nueva/Editar Impresora */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg" maximizable>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Impresora' : 'Nueva Impresora'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Zebra GK420d - Rótulos" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Select value={formData.marca} onValueChange={(v) => setFormData({...formData, marca: v as Impresora['marca'], modelo: ''})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MARCAS.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Select value={formData.modelo} onValueChange={(v) => setFormData({...formData, modelo: v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {getModelos().map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({...formData, tipo: v as Impresora['tipo']})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ETIQUETA">Etiqueta</SelectItem>
                    <SelectItem value="TICKET">Ticket</SelectItem>
                    <SelectItem value="MATRICIAL">Matricial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>DPI</Label>
                <Select value={formData.dpi?.toString()} onValueChange={(v) => setFormData({...formData, dpi: parseInt(v)})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="203">203 dpi</SelectItem>
                    <SelectItem value="300">300 dpi</SelectItem>
                    <SelectItem value="600">600 dpi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dirección IP / Puerto</Label>
                <Input value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} placeholder="192.168.1.100 o USB001" />
              </div>
              <div className="space-y-2">
                <Label>Puerto TCP</Label>
                <Input type="number" value={formData.puerto} onChange={(e) => setFormData({...formData, puerto: parseInt(e.target.value) || 0})} placeholder="9100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ancho Etiqueta (mm)</Label>
                <Input type="number" value={formData.anchoEtiqueta} onChange={(e) => setFormData({...formData, anchoEtiqueta: parseInt(e.target.value) || 0})} />
              </div>
              <div className="space-y-2">
                <Label>Alto Etiqueta (mm)</Label>
                <Input type="number" value={formData.altoEtiqueta} onChange={(e) => setFormData({...formData, altoEtiqueta: parseInt(e.target.value) || 0})} />
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

      {/* Modal: Vista Previa ZPL */}
      <Dialog open={modalPreviewOpen} onOpenChange={setModalPreviewOpen}>
        <DialogContent className="max-w-2xl" maximizable>
          <DialogHeader>
            <DialogTitle>Vista Previa - {plantillaSeleccionada?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-stone-900 p-4 rounded-lg font-mono text-sm text-green-400 overflow-x-auto">
              <pre>{plantillaSeleccionada?.codigoZPL}</pre>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => copiarZPL(plantillaSeleccionada?.codigoZPL || '')}>
                <Copy className="w-4 h-4 mr-2" />Copiar
              </Button>
              <Button onClick={() => { setModalPreviewOpen(false); setModalPruebaOpen(true); }} className="bg-amber-500 hover:bg-amber-600">
                <Printer className="w-4 h-4 mr-2" />Imprimir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Prueba de Impresión */}
      <Dialog open={modalPruebaOpen} onOpenChange={setModalPruebaOpen}>
        <DialogContent maximizable>
          <DialogHeader>
            <DialogTitle>Enviar a Imprimir</DialogTitle>
            <DialogDescription>
              Se enviará una etiqueta de prueba a la impresora predeterminada
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-stone-50 rounded-lg space-y-2">
              <p className="text-sm"><strong>Plantilla:</strong> {plantillaSeleccionada?.nombre}</p>
              <p className="text-sm"><strong>Tamaño:</strong> {plantillaSeleccionada?.ancho}x{plantillaSeleccionada?.alto}mm</p>
              <p className="text-sm"><strong>Datos:</strong> Tropa {datosPrueba.tropa}, Garrón {datosPrueba.garron}, {datosPrueba.peso}KG</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalPruebaOpen(false)}>Cancelar</Button>
            <Button onClick={handleProbarImpresion} disabled={probando} className="bg-amber-500 hover:bg-amber-600">
              {probando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Printer className="w-4 h-4 mr-2" />}
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ConfigImpresorasModule
