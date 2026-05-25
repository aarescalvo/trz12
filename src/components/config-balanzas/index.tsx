'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  Scale, Plus, Loader2, Trash, Edit, Power, Wifi, Usb, Monitor, Printer, Save
} from 'lucide-react'

interface Operador { id: string; nombre: string; rol: string }

interface Balanza {
  id: string
  nombre: string
  codigo: string | null
  tipoConexion: string
  puerto: string | null
  baudRate: number
  ip: string | null
  puertoTcp: number | null
  protocolo: string
  capacidadMax: number | null
  division: number
  unidad: string
  activa: boolean
  estado: string
  fechaCalibracion: string | null
  puestos?: { id: string; nombre: string; sector: string }[]
}

interface PuestoTrabajo {
  id: string
  nombre: string
  codigo: string | null
  sector: string | null
  ubicacion: string | null
  balanzaId: string | null
  balanza?: { id: string; nombre: string; estado: string; activa: boolean }
  impresoraIp: string | null
  impresoraPuerto: number | null
  impresoraModelo: string | null
  rotuloDefaultId: string | null
  scannerHabilitado: boolean
  activo: boolean
  operativo: boolean
}

interface Props { operador: Operador }

const TIPOS_CONEXION = [
  { value: 'SERIAL', label: 'Puerto Serie (COM)', icon: Usb },
  { value: 'TCP', label: 'TCP/IP (Red)', icon: Wifi },
  { value: 'SIMULADA', label: 'Simulada (Demo)', icon: Monitor },
]

const PROTOCOLOS = [
  { value: 'GENERICO', label: 'Genérico ASCII' },
  { value: 'TOLEDO', label: 'Toledo' },
  { value: 'METTLER', label: 'Mettler Toledo' },
  { value: 'OHAUS', label: 'Ohaus' },
  { value: 'DIGI', label: 'Digi' },
  { value: 'ADAM', label: 'Adam Equipment' },
  { value: 'CUSTOM', label: 'Personalizado' },
]

const SECTORES = [
  { value: 'ROMANEO', label: 'Romaneo' },
  { value: 'FAENA', label: 'Faena' },
  { value: 'PESAJE_CAMIONES', label: 'Pesaje Camiones' },
  { value: 'DESPACHO', label: 'Despacho' },
  { value: 'DEPOSTADA', label: 'Despostada' },
  { value: 'MENUDENCIAS', label: 'Menudencias' },
]

export function ConfigBalanzasModule({ operador }: Props) {
  const [balanzas, setBalanzas] = useState<Balanza[]>([])
  const [puestos, setPuestos] = useState<PuestoTrabajo[]>([])
  const [loading, setLoading] = useState(true)
  const [modalBalanza, setModalBalanza] = useState(false)
  const [modalPuesto, setModalPuesto] = useState(false)
  const [editandoBalanza, setEditandoBalanza] = useState<Balanza | null>(null)
  const [editandoPuesto, setEditandoPuesto] = useState<PuestoTrabajo | null>(null)
  const [guardando, setGuardando] = useState(false)

  const [balanzaForm, setBalanzaForm] = useState({
    nombre: '',
    codigo: '',
    tipoConexion: 'SIMULADA',
    puerto: 'COM1',
    baudRate: '9600',
    ip: '',
    puertoTcp: '',
    protocolo: 'GENERICO',
    capacidadMax: '',
    division: '0.1',
    unidad: 'kg',
    observaciones: ''
  })

  const [puestoForm, setPuestoForm] = useState({
    nombre: '',
    codigo: '',
    sector: '',
    ubicacion: '',
    balanzaId: '',
    impresoraIp: '',
    impresoraPuerto: '9100',
    impresoraModelo: '',
    scannerHabilitado: false
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [balRes, puestoRes] = await Promise.all([
        fetch('/api/balanzas'),
        fetch('/api/puestos-trabajo')
      ])
      
      const balData = await balRes.json()
      const puestoData = await puestoRes.json()
      
      if (balData.success) setBalanzas(balData.data || [])
      if (puestoData.success) setPuestos(puestoData.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // ================ BALANZAS ================

  const handleGuardarBalanza = async () => {
    if (!balanzaForm.nombre) {
      toast.error('Ingrese el nombre')
      return
    }
    
    setGuardando(true)
    try {
      const payload = {
        id: editandoBalanza?.id,
        nombre: balanzaForm.nombre,
        codigo: balanzaForm.codigo || null,
        tipoConexion: balanzaForm.tipoConexion,
        puerto: balanzaForm.tipoConexion === 'SERIAL' ? balanzaForm.puerto : null,
        baudRate: parseInt(balanzaForm.baudRate) || 9600,
        ip: balanzaForm.tipoConexion === 'TCP' ? balanzaForm.ip : null,
        puertoTcp: balanzaForm.tipoConexion === 'TCP' ? parseInt(balanzaForm.puertoTcp) || null : null,
        protocolo: balanzaForm.protocolo,
        capacidadMax: parseFloat(balanzaForm.capacidadMax) || null,
        division: parseFloat(balanzaForm.division) || 0.1,
        unidad: balanzaForm.unidad,
        observaciones: balanzaForm.observaciones || null,
        activa: true
      }

      const res = await fetch('/api/balanzas', {
        method: editandoBalanza ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success(editandoBalanza ? 'Balanza actualizada' : 'Balanza creada')
        setModalBalanza(false)
        resetBalanzaForm()
        fetchData()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setGuardando(false)
    }
  }

  const handleToggleBalanza = async (balanza: Balanza) => {
    try {
      const res = await fetch('/api/balanzas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: balanza.id, activa: !balanza.activa })
      })
      
      if (res.ok) {
        toast.success(balanza.activa ? 'Balanza desactivada' : 'Balanza activada')
        fetchData()
      }
    } catch (error) {
      toast.error('Error al cambiar estado')
    }
  }

  const handleEliminarBalanza = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta balanza?')) return
    
    try {
      const res = await fetch(`/api/balanzas?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        toast.success('Balanza eliminada')
        fetchData()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const resetBalanzaForm = () => {
    setBalanzaForm({
      nombre: '',
      codigo: '',
      tipoConexion: 'SIMULADA',
      puerto: 'COM1',
      baudRate: '9600',
      ip: '',
      puertoTcp: '',
      protocolo: 'GENERICO',
      capacidadMax: '',
      division: '0.1',
      unidad: 'kg',
      observaciones: ''
    })
    setEditandoBalanza(null)
  }

  // ================ PUESTOS ================

  const handleGuardarPuesto = async () => {
    if (!puestoForm.nombre) {
      toast.error('Ingrese el nombre')
      return
    }
    
    setGuardando(true)
    try {
      const payload = {
        id: editandoPuesto?.id,
        nombre: puestoForm.nombre,
        codigo: puestoForm.codigo || null,
        sector: puestoForm.sector || null,
        ubicacion: puestoForm.ubicacion || null,
        balanzaId: (puestoForm.balanzaId && puestoForm.balanzaId !== 'all') ? puestoForm.balanzaId : null,
        impresoraIp: puestoForm.impresoraIp || null,
        impresoraPuerto: parseInt(puestoForm.impresoraPuerto) || 9100,
        impresoraModelo: puestoForm.impresoraModelo || null,
        scannerHabilitado: puestoForm.scannerHabilitado,
        activo: true
      }

      const res = await fetch('/api/puestos-trabajo', {
        method: editandoPuesto ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success(editandoPuesto ? 'Puesto actualizado' : 'Puesto creado')
        setModalPuesto(false)
        resetPuestoForm()
        fetchData()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminarPuesto = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este puesto?')) return
    
    try {
      const res = await fetch(`/api/puestos-trabajo?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        toast.success('Puesto eliminado')
        fetchData()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const resetPuestoForm = () => {
    setPuestoForm({
      nombre: '',
      codigo: '',
      sector: '',
      ubicacion: '',
      balanzaId: '',
      impresoraIp: '',
      impresoraPuerto: '9100',
      impresoraModelo: '',
      scannerHabilitado: false
    })
    setEditandoPuesto(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Scale className="w-6 h-6 text-amber-500" />
            Configuración de Balanzas y Puestos
          </h2>
          <p className="text-sm text-stone-500">Configuración de hardware por puesto de trabajo</p>
        </div>
      </div>

      <Tabs defaultValue="balanzas" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="balanzas">Balanzas</TabsTrigger>
          <TabsTrigger value="puestos">Puestos de Trabajo</TabsTrigger>
        </TabsList>

        {/* TAB BALANZAS */}
        <TabsContent value="balanzas" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { resetBalanzaForm(); setModalBalanza(true); }} className="bg-amber-500 hover:bg-amber-600">
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
                    <TableHead>Conexión</TableHead>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Puestos</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                      </TableCell>
                    </TableRow>
                  ) : balanzas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-stone-400 py-8">
                        No hay balanzas configuradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    balanzas.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{b.nombre}</p>
                            {b.codigo && <p className="text-xs text-stone-400">{b.codigo}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {b.tipoConexion === 'SERIAL' && <><Usb className="w-4 h-4" /> {b.puerto}</>}
                            {b.tipoConexion === 'TCP' && <><Wifi className="w-4 h-4" /> {b.ip}:{b.puertoTcp}</>}
                            {b.tipoConexion === 'SIMULADA' && <><Monitor className="w-4 h-4" /> Simulada</>}
                          </div>
                        </TableCell>
                        <TableCell>{PROTOCOLOS.find(p => p.value === b.protocolo)?.label || b.protocolo}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch checked={b.activa} onCheckedChange={() => handleToggleBalanza(b)} />
                            <Badge variant={b.activa ? 'default' : 'secondary'}>
                              {b.activa ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {b.puestos && b.puestos.length > 0 
                            ? b.puestos.map(p => p.nombre).join(', ')
                            : <span className="text-stone-400">Sin asignar</span>
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => {
                              setEditandoBalanza(b)
                              setBalanzaForm({
                                nombre: b.nombre,
                                codigo: b.codigo || '',
                                tipoConexion: b.tipoConexion,
                                puerto: b.puerto || 'COM1',
                                baudRate: String(b.baudRate),
                                ip: b.ip || '',
                                puertoTcp: b.puertoTcp ? String(b.puertoTcp) : '',
                                protocolo: b.protocolo,
                                capacidadMax: b.capacidadMax ? String(b.capacidadMax) : '',
                                division: String(b.division),
                                unidad: b.unidad,
                                observaciones: ''
                              })
                              setModalBalanza(true)
                            }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEliminarBalanza(b.id)} className="text-red-500">
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB PUESTOS */}
        <TabsContent value="puestos" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { resetPuestoForm(); setModalPuesto(true); }} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Puesto
            </Button>
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-stone-50">
                    <TableHead>Nombre</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Balanza</TableHead>
                    <TableHead>Impresora</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                      </TableCell>
                    </TableRow>
                  ) : puestos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-stone-400 py-8">
                        No hay puestos configurados
                      </TableCell>
                    </TableRow>
                  ) : (
                    puestos.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{p.nombre}</p>
                            {p.codigo && <p className="text-xs text-stone-400">{p.codigo}</p>}
                          </div>
                        </TableCell>
                        <TableCell>{SECTORES.find(s => s.value === p.sector)?.label || p.sector || '-'}</TableCell>
                        <TableCell>
                          {p.balanza 
                            ? <Badge variant={p.balanza.activa ? 'default' : 'secondary'}>{p.balanza.nombre}</Badge>
                            : <span className="text-stone-400">Sin balanza</span>
                          }
                        </TableCell>
                        <TableCell>
                          {p.impresoraIp 
                            ? <div className="flex items-center gap-1"><Printer className="w-4 h-4" /> {p.impresoraIp}</div>
                            : <span className="text-stone-400">Sin configurar</span>
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.activo ? 'default' : 'secondary'}>
                            {p.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => {
                              setEditandoPuesto(p)
                              setPuestoForm({
                                nombre: p.nombre,
                                codigo: p.codigo || '',
                                sector: p.sector || '',
                                ubicacion: p.ubicacion || '',
                                balanzaId: p.balanzaId || '',
                                impresoraIp: p.impresoraIp || '',
                                impresoraPuerto: p.impresoraPuerto ? String(p.impresoraPuerto) : '9100',
                                impresoraModelo: p.impresoraModelo || '',
                                scannerHabilitado: p.scannerHabilitado
                              })
                              setModalPuesto(true)
                            }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEliminarPuesto(p.id)} className="text-red-500">
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Balanza */}
      <Dialog open={modalBalanza} onOpenChange={setModalBalanza}>
        <DialogContent className="max-w-lg" maximizable>
          <DialogHeader>
            <DialogTitle>{editandoBalanza ? 'Editar Balanza' : 'Nueva Balanza'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={balanzaForm.nombre} onChange={(e) => setBalanzaForm({...balanzaForm, nombre: e.target.value})} placeholder="Balanza Principal" />
              </div>
              <div className="space-y-2">
                <Label>Código</Label>
                <Input value={balanzaForm.codigo} onChange={(e) => setBalanzaForm({...balanzaForm, codigo: e.target.value})} placeholder="BAL-001" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Conexión</Label>
              <Select value={balanzaForm.tipoConexion} onValueChange={(v) => setBalanzaForm({...balanzaForm, tipoConexion: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_CONEXION.map(tc => (
                    <SelectItem key={tc.value} value={tc.value}>
                      <div className="flex items-center gap-2">
                        <tc.icon className="w-4 h-4" /> {tc.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {balanzaForm.tipoConexion === 'SERIAL' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Puerto</Label>
                  <Input value={balanzaForm.puerto} onChange={(e) => setBalanzaForm({...balanzaForm, puerto: e.target.value})} placeholder="COM1" />
                </div>
                <div className="space-y-2">
                  <Label>Baud Rate</Label>
                  <Select value={balanzaForm.baudRate} onValueChange={(v) => setBalanzaForm({...balanzaForm, baudRate: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9600">9600</SelectItem>
                      <SelectItem value="19200">19200</SelectItem>
                      <SelectItem value="38400">38400</SelectItem>
                      <SelectItem value="57600">57600</SelectItem>
                      <SelectItem value="115200">115200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {balanzaForm.tipoConexion === 'TCP' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dirección IP</Label>
                  <Input value={balanzaForm.ip} onChange={(e) => setBalanzaForm({...balanzaForm, ip: e.target.value})} placeholder="192.168.1.100" />
                </div>
                <div className="space-y-2">
                  <Label>Puerto TCP</Label>
                  <Input value={balanzaForm.puertoTcp} onChange={(e) => setBalanzaForm({...balanzaForm, puertoTcp: e.target.value})} placeholder="5000" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Protocolo</Label>
                <Select value={balanzaForm.protocolo} onValueChange={(v) => setBalanzaForm({...balanzaForm, protocolo: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROTOCOLOS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unidad</Label>
                <Select value={balanzaForm.unidad} onValueChange={(v) => setBalanzaForm({...balanzaForm, unidad: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                    <SelectItem value="lb">Libras (lb)</SelectItem>
                    <SelectItem value="g">Gramos (g)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capacidad Máx (kg)</Label>
                <Input type="number" value={balanzaForm.capacidadMax} onChange={(e) => setBalanzaForm({...balanzaForm, capacidadMax: e.target.value})} placeholder="1000" />
              </div>
              <div className="space-y-2">
                <Label>División mínima</Label>
                <Input type="number" step="0.01" value={balanzaForm.division} onChange={(e) => setBalanzaForm({...balanzaForm, division: e.target.value})} placeholder="0.1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalBalanza(false)}>Cancelar</Button>
            <Button onClick={handleGuardarBalanza} disabled={guardando} className="bg-amber-500 hover:bg-amber-600">
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Puesto */}
      <Dialog open={modalPuesto} onOpenChange={setModalPuesto}>
        <DialogContent className="max-w-lg" maximizable>
          <DialogHeader>
            <DialogTitle>{editandoPuesto ? 'Editar Puesto' : 'Nuevo Puesto de Trabajo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={puestoForm.nombre} onChange={(e) => setPuestoForm({...puestoForm, nombre: e.target.value})} placeholder="Romaneo 1" />
              </div>
              <div className="space-y-2">
                <Label>Código</Label>
                <Input value={puestoForm.codigo} onChange={(e) => setPuestoForm({...puestoForm, codigo: e.target.value})} placeholder="PUESTO-001" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sector</Label>
                <Select value={puestoForm.sector} onValueChange={(v) => setPuestoForm({...puestoForm, sector: v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {SECTORES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Balanza Asignada</Label>
                <Select value={puestoForm.balanzaId} onValueChange={(v) => setPuestoForm({...puestoForm, balanzaId: v})}>
                  <SelectTrigger><SelectValue placeholder="Sin balanza" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Sin balanza</SelectItem>
                    {balanzas.filter(b => b.activa).map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ubicación</Label>
              <Input value={puestoForm.ubicacion} onChange={(e) => setPuestoForm({...puestoForm, ubicacion: e.target.value})} placeholder="Planta baja, sector A" />
            </div>

            <div className="border-t pt-4">
              <Label className="flex items-center gap-2"><Printer className="w-4 h-4" /> Impresora de Rótulos</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <Label className="text-sm text-stone-500">Dirección IP</Label>
                  <Input value={puestoForm.impresoraIp} onChange={(e) => setPuestoForm({...puestoForm, impresoraIp: e.target.value})} placeholder="192.168.1.50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-stone-500">Puerto</Label>
                  <Input value={puestoForm.impresoraPuerto} onChange={(e) => setPuestoForm({...puestoForm, impresoraPuerto: e.target.value})} placeholder="9100" />
                </div>
              </div>
              <div className="space-y-2 mt-2">
                <Label className="text-sm text-stone-500">Modelo</Label>
                <Input value={puestoForm.impresoraModelo} onChange={(e) => setPuestoForm({...puestoForm, impresoraModelo: e.target.value})} placeholder="Zebra ZT410" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={puestoForm.scannerHabilitado} onCheckedChange={(v) => setPuestoForm({...puestoForm, scannerHabilitado: v})} />
              <Label>Scanner de código de barras habilitado</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalPuesto(false)}>Cancelar</Button>
            <Button onClick={handleGuardarPuesto} disabled={guardando} className="bg-amber-500 hover:bg-amber-600">
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ConfigBalanzasModule
