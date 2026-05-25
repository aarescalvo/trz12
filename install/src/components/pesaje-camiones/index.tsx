'use client'

import { Truck, Scale, Save, CheckCircle, Clock, Printer, FileText, Beef, AlertCircle, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { usePesajeCamiones } from './usePesajeCamiones'
import { TipoAnimalCounterGrid } from './TipoAnimalCounterGrid'
import { QuickAddDialog, QuickAddButton } from './QuickAddDialog'
import { TIPOS_PESAJE, ESPECIES } from './constants'
import type { Operador } from './types'

interface PesajeCamionesModuleProps {
  operador: Operador
  onTropaCreada?: () => void
}

export function PesajeCamionesModule({ operador, onTropaCreada }: PesajeCamionesModuleProps) {
  const {
    // Data
    transportistas, corrales, pesajesAbiertos, pesajesFiltrados,
    nextTicket, nextTropaCode, productores, usuariosFaena,
    
    // UI State
    saving, activeTab, setActiveTab, tipoPesaje, setTipoPesaje,
    
    // Form State
    patenteChasis, setPatenteChasis,
    patenteAcoplado, setPatenteAcoplado,
    chofer, setChofer,
    dniChofer, setDniChofer,
    transportistaId, setTransportistaId,
    dte, setDte,
    guia, setGuia,
    productorId, setProductorId,
    usuarioFaenaId, setUsuarioFaenaId,
    especie, setEspecie,
    corralId, setCorralId,
    pesoBruto, setPesoBruto,
    pesoTara, setPesoTara,
    pesoNeto,
    observaciones, setObservaciones,
    destino, setDestino,
    remito, setRemito,
    tiposAnimales, setTiposAnimales,
    totalCabezas,
    
    // History filters
    fechaDesde, setFechaDesde,
    fechaHasta, setFechaHasta,
    
    // Dialogs
    cerrarOpen, setCerrarOpen,
    pesajeSeleccionado, setPesajeSeleccionado,
    taraForm, setTaraForm,
    deleteDialogOpen, setDeleteDialogOpen,
    supervisorPin, setSupervisorPin,
    pesajeAccion, setPesajeAccion,
    quickAddOpen, setQuickAddOpen,
    
    // Actions
    handleQuickAdd, handleGuardar, handleCerrarPesaje, handleDeletePesaje,
    handleImprimirReporte, imprimirTicket
  } = usePesajeCamiones({ operadorId: operador.id, onTropaCreada })

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-stone-800">Pesaje de Camiones</h2>
            <p className="text-stone-500">Balanza Portería</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Clock className="h-4 w-4 mr-2 text-orange-500" />
              {pesajesAbiertos.length} abiertos
            </Badge>
            <Badge className="text-lg px-4 py-2 bg-amber-100 text-amber-700 border-amber-300">
              Ticket #${String(nextTicket).padStart(6, '0')}
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="nuevo">Nuevo Pesaje</TabsTrigger>
            <TabsTrigger value="abiertos">Pesajes Abiertos ({pesajesAbiertos.length})</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          {/* NUEVO PESAJE */}
          <TabsContent value="nuevo" className="space-y-6">
            {/* Tipo de pesaje */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Tipo de Pesaje</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {TIPOS_PESAJE.map((tipo) => (
                    <button
                      key={tipo.id}
                      type="button"
                      onClick={() => { setTipoPesaje(tipo.id); if (tipo.id === 'INGRESO_HACIENDA') setTiposAnimales([]); }}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        tipoPesaje === tipo.id
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <tipo.icon className={`h-6 w-6 mb-2 ${tipo.color}`} />
                      <div className="font-medium">{tipo.label}</div>
                      <div className="text-xs text-stone-500">{tipo.desc}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* INGRESO DE HACIENDA */}
            {tipoPesaje === 'INGRESO_HACIENDA' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Datos del vehículo */}
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">Datos del Vehículo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Patente Chasis *</Label>
                        <Input
                          value={patenteChasis}
                          onChange={(e) => setPatenteChasis(e.target.value.toUpperCase())}
                          placeholder="AB123CD"
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Patente Acoplado</Label>
                        <Input
                          value={patenteAcoplado}
                          onChange={(e) => setPatenteAcoplado(e.target.value.toUpperCase())}
                          placeholder="AB123CD"
                          className="font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Chofer</Label>
                        <Input value={chofer} onChange={(e) => setChofer(e.target.value)} placeholder="Nombre del chofer" />
                      </div>
                      <div className="space-y-2">
                        <Label>DNI Chofer</Label>
                        <Input value={dniChofer} onChange={(e) => setDniChofer(e.target.value)} placeholder="12345678" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Transportista</Label>
                        <QuickAddButton tipo="transportista" onAdd={(data) => handleQuickAdd('transportista', data)} />
                      </div>
                      <Select value={transportistaId} onValueChange={setTransportistaId}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          {transportistas.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>DTE</Label>
                        <Input value={dte} onChange={(e) => setDte(e.target.value)} placeholder="Documento de tránsito" />
                      </div>
                      <div className="space-y-2">
                        <Label>Guía</Label>
                        <Input value={guia} onChange={(e) => setGuia(e.target.value)} placeholder="Número de guía" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Datos de la tropa */}
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">Datos de la Tropa</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {nextTropaCode && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <p className="text-sm text-green-600">Número de Tropa a Asignar</p>
                        <p className="text-3xl font-mono font-bold text-green-700">{nextTropaCode.codigo}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Productor</Label>
                          <QuickAddButton tipo="productor" onAdd={(data) => handleQuickAdd('productor', data)} />
                        </div>
                        <Select value={productorId} onValueChange={setProductorId}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                          <SelectContent>
                            {productores.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Usuario Faena *</Label>
                          <QuickAddButton tipo="usuarioFaena" onAdd={(data) => handleQuickAdd('usuarioFaena', data)} />
                        </div>
                        <Select value={usuarioFaenaId} onValueChange={setUsuarioFaenaId}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                          <SelectContent>
                            {usuariosFaena.map((u) => (
                              <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Especie</Label>
                        <Select value={especie} onValueChange={(v) => { setEspecie(v); setTiposAnimales([]); }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ESPECIES.map((e) => (
                              <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Corral *</Label>
                        <Select value={corralId} onValueChange={setCorralId}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                          <SelectContent>
                            {corrales.map((c) => {
                              const stockActual = especie === 'BOVINO' ? c.stockBovinos : c.stockEquinos
                              const disponible = c.capacidad - stockActual
                              return (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.nombre} ({disponible} disponibles)
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Observaciones</Label>
                      <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Notas adicionales..." rows={2} />
                    </div>
                  </CardContent>
                </Card>

                {/* Tipos de Animales */}
                <Card className="border-0 shadow-md lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Tipos de Animales</CardTitle>
                    <CardDescription>Use los botones +/- o ingrese directamente la cantidad de cada tipo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TipoAnimalCounterGrid especie={especie} tiposAnimales={tiposAnimales} onUpdate={setTiposAnimales} />
                  </CardContent>
                </Card>

                {/* Pesos */}
                <Card className="border-0 shadow-md lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Peso Bruto</CardTitle>
                    <CardDescription>El peso tara se registrará cuando el camión regrese vacío</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Peso Bruto (kg) *</Label>
                        <Input
                          type="number"
                          value={pesoBruto || ''}
                          onChange={(e) => setPesoBruto(parseFloat(e.target.value) || 0)}
                          className="text-2xl font-bold text-center h-16"
                          placeholder="0"
                        />
                        <p className="text-xs text-stone-500 text-center">Camión con carga</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-blue-700">Flujo de Pesaje</span>
                        </div>
                        <ol className="text-sm text-blue-600 space-y-1">
                          <li>1. Registre el peso bruto ahora</li>
                          <li>2. El ticket queda ABIERTO</li>
                          <li>3. Registre la tara cuando el camión descargue</li>
                          <li>4. Se imprime el ticket completo</li>
                        </ol>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleGuardar}
                      disabled={saving}
                      className="w-full h-14 text-lg bg-amber-500 hover:bg-amber-600 mt-6"
                    >
                      {saving ? 'Guardando...' : (
                        <>
                          <Save className="h-5 w-5 mr-2" />
                          Registrar Peso Bruto
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* PESAJE PARTICULAR */}
            {tipoPesaje === 'PESAJE_PARTICULAR' && (
              <Card className="border-0 shadow-md">
                <CardHeader><CardTitle className="text-lg">Pesaje Particular</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Patente Chasis *</Label>
                      <Input value={patenteChasis} onChange={(e) => setPatenteChasis(e.target.value.toUpperCase())} placeholder="AB123CD" className="font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label>Patente Acoplado</Label>
                      <Input value={patenteAcoplado} onChange={(e) => setPatenteAcoplado(e.target.value.toUpperCase())} placeholder="AB123CD" className="font-mono" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Descripción del pesaje..." rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Peso Bruto (kg)</Label>
                      <Input type="number" value={pesoBruto || ''} onChange={(e) => setPesoBruto(parseFloat(e.target.value) || 0)} className="text-2xl font-bold text-center h-16" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Peso Tara (kg)</Label>
                      <Input type="number" value={pesoTara || ''} onChange={(e) => setPesoTara(parseFloat(e.target.value) || 0)} className="text-2xl font-bold text-center h-16" placeholder="0" />
                    </div>
                  </div>
                  {pesoNeto > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-600 text-sm text-center">Peso Neto</p>
                      <p className="text-3xl font-bold text-blue-700 text-center">{pesoNeto.toLocaleString()} kg</p>
                    </div>
                  )}
                  <Button onClick={handleGuardar} disabled={saving} className="w-full h-14 text-lg bg-amber-500 hover:bg-amber-600">
                    <Save className="h-5 w-5 mr-2" /> Guardar
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* SALIDA MERCADERÍA */}
            {tipoPesaje === 'SALIDA_MERCADERIA' && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Salida de Mercadería</CardTitle>
                  <CardDescription>Tara → Carga → Peso Bruto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Patente Chasis *</Label>
                      <Input value={patenteChasis} onChange={(e) => setPatenteChasis(e.target.value.toUpperCase())} placeholder="AB123CD" className="font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label>Patente Acoplado</Label>
                      <Input value={patenteAcoplado} onChange={(e) => setPatenteAcoplado(e.target.value.toUpperCase())} placeholder="AB123CD" className="font-mono" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Chofer</Label>
                      <Input value={chofer} onChange={(e) => setChofer(e.target.value)} placeholder="Nombre del chofer" />
                    </div>
                    <div className="space-y-2">
                      <Label>Transportista</Label>
                      <Select value={transportistaId} onValueChange={setTransportistaId}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          {transportistas.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Destino *</Label>
                      <Input value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Destino de la mercadería" />
                    </div>
                    <div className="space-y-2">
                      <Label>Remito</Label>
                      <Input value={remito} onChange={(e) => setRemito(e.target.value)} placeholder="N° de remito" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Observaciones / Tipo de Mercadería</Label>
                    <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Descripción del tipo de mercadería..." rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Peso Tara (kg) - Vacío</Label>
                      <Input type="number" value={pesoTara || ''} onChange={(e) => setPesoTara(parseFloat(e.target.value) || 0)} className="text-2xl font-bold text-center h-16" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Peso Bruto (kg) - Cargado *</Label>
                      <Input type="number" value={pesoBruto || ''} onChange={(e) => setPesoBruto(parseFloat(e.target.value) || 0)} className="text-2xl font-bold text-center h-16" placeholder="0" />
                    </div>
                  </div>
                  {pesoNeto > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-600 text-sm text-center">Peso Neto de Mercadería</p>
                      <p className="text-3xl font-bold text-green-700 text-center">{pesoNeto.toLocaleString()} kg</p>
                    </div>
                  )}
                  <Button onClick={handleGuardar} disabled={saving} className="w-full h-14 text-lg bg-amber-500 hover:bg-amber-600">
                    <Save className="h-5 w-5 mr-2" /> Registrar Salida
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* PESAJES ABIERTOS */}
          <TabsContent value="abiertos">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-orange-50 rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  Pesajes Abiertos - Pendientes de Tara
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {pesajesAbiertos.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay pesajes abiertos</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Patente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Tropa</TableHead>
                        <TableHead>Peso Bruto</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pesajesAbiertos.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono font-bold">#{String(p.numeroTicket).padStart(6, '0')}</TableCell>
                          <TableCell>{new Date(p.fecha).toLocaleDateString('es-AR')}</TableCell>
                          <TableCell className="font-mono">{p.patenteChasis}</TableCell>
                          <TableCell><Badge variant="outline">{TIPOS_PESAJE.find(t => t.id === p.tipo)?.label || p.tipo}</Badge></TableCell>
                          <TableCell>
                            {p.tropa && (
                              <div>
                                <Badge className="bg-green-100 text-green-700">{p.tropa.codigo}</Badge>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-bold">{p.pesoBruto?.toLocaleString()} kg</TableCell>
                          <TableCell>
                            <Button
                              onClick={() => { setPesajeSeleccionado(p); setTaraForm(0); setCerrarOpen(true); }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Scale className="h-4 w-4 mr-1" /> Registrar Tara
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* HISTORIAL */}
          <TabsContent value="historial">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-green-50 rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Historial de Pesajes Cerrados
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {/* Filtros */}
                <div className="flex flex-wrap items-end gap-4 mb-4 pb-4 border-b">
                  <div className="space-y-2">
                    <Label className="text-sm">Desde</Label>
                    <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-40" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Hasta</Label>
                    <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-40" />
                  </div>
                  <Button variant="outline" onClick={() => { setFechaDesde(''); setFechaHasta(''); }}>Limpiar</Button>
                  <Button onClick={handleImprimirReporte} className="bg-amber-500 hover:bg-amber-600" disabled={pesajesFiltrados.length === 0}>
                    <Printer className="h-4 w-4 mr-2" /> Imprimir Reporte
                  </Button>
                </div>
                
                {/* Resumen */}
                {pesajesFiltrados.length > 0 && (
                  <div className="grid grid-cols-4 gap-4 mb-4 p-3 bg-stone-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-xs text-stone-500">Total Pesajes</p>
                      <p className="text-lg font-bold">{pesajesFiltrados.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-stone-500">Total Bruto</p>
                      <p className="text-lg font-bold">{pesajesFiltrados.reduce((acc, p) => acc + (p.pesoBruto || 0), 0).toLocaleString()} kg</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-stone-500">Total Tara</p>
                      <p className="text-lg font-bold">{pesajesFiltrados.reduce((acc, p) => acc + (p.pesoTara || 0), 0).toLocaleString()} kg</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-stone-500">Total Neto</p>
                      <p className="text-lg font-bold text-green-600">{pesajesFiltrados.reduce((acc, p) => acc + (p.pesoNeto || 0), 0).toLocaleString()} kg</p>
                    </div>
                  </div>
                )}
                
                {pesajesFiltrados.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay pesajes en el rango seleccionado</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ticket</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Patente</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Tropa</TableHead>
                          <TableHead>Bruto</TableHead>
                          <TableHead>Tara</TableHead>
                          <TableHead>Neto</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pesajesFiltrados.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-mono font-bold">#{String(p.numeroTicket).padStart(6, '0')}</TableCell>
                            <TableCell>{new Date(p.fecha).toLocaleDateString('es-AR')}</TableCell>
                            <TableCell className="font-mono">{p.patenteChasis}</TableCell>
                            <TableCell><Badge variant="outline">{TIPOS_PESAJE.find(t => t.id === p.tipo)?.label || p.tipo}</Badge></TableCell>
                            <TableCell>{p.tropa && <Badge className="bg-green-100 text-green-700">{p.tropa.codigo}</Badge>}</TableCell>
                            <TableCell>{p.pesoBruto?.toLocaleString()} kg</TableCell>
                            <TableCell>{p.pesoTara?.toLocaleString()} kg</TableCell>
                            <TableCell className="font-bold text-green-600">{p.pesoNeto?.toLocaleString()} kg</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => imprimirTicket(p, false)} title="Reimprimir">
                                  <Printer className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => { setPesajeAccion(p); setDeleteDialogOpen(true); }} title="Eliminar">
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Registrar Tara */}
      <Dialog open={cerrarOpen} onOpenChange={setCerrarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Peso Tara</DialogTitle>
            <DialogDescription>Ingrese el peso del camión vacío para cerrar el pesaje</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {pesajeSeleccionado && (
              <div className="bg-stone-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-600">Ticket:</span>
                  <span className="font-bold">#{String(pesajeSeleccionado.numeroTicket).padStart(6, '0')}</span>
                </div>
                {pesajeSeleccionado.tropa && (
                  <div className="flex justify-between">
                    <span className="text-stone-600">Tropa:</span>
                    <span className="font-bold text-green-600">{pesajeSeleccionado.tropa.codigo}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-600">Peso Bruto:</span>
                  <span className="font-bold">{pesajeSeleccionado.pesoBruto?.toLocaleString()} kg</span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Peso Tara (kg) *</Label>
              <Input
                type="number"
                value={taraForm || ''}
                onChange={(e) => setTaraForm(parseFloat(e.target.value) || 0)}
                className="text-2xl font-bold text-center h-16"
                placeholder="0"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCerrarOpen(false)}>Cancelar</Button>
            <Button onClick={handleCerrarPesaje} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? 'Guardando...' : 'Cerrar Pesaje'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Pesaje</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer. Se requiere PIN de supervisor.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>PIN de Supervisor</Label>
              <Input
                type="password"
                value={supervisorPin}
                onChange={(e) => setSupervisorPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className="text-center text-2xl tracking-widest h-14"
                maxLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setSupervisorPin(''); }}>Cancelar</Button>
            <Button onClick={handleDeletePesaje} variant="destructive">Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Dialog */}
      {quickAddOpen && (
        <QuickAddDialog
          tipo={quickAddOpen}
          onAdd={(data) => handleQuickAdd(quickAddOpen, data)}
          open={!!quickAddOpen}
          onOpenChange={(open) => setQuickAddOpen(open ? quickAddOpen : null)}
        />
      )}
    </div>
  )
}

export default PesajeCamionesModule
