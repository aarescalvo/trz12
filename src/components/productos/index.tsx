'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Save, 
  X, 
  Package,
  FileText,
  Globe,
  Truck,
  UtensilsCrossed,
  Tag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Producto {
  id: string;
  codigo: string;
  codigoSecundario: string | null;
  nombre: string;
  tara: number | null;
  vencimiento: number | null;
  nroSenasa: string | null;
  unidad: string | null;
  cantidadEtiquetas: number | null;
  tieneTipificacion: boolean;
  tipificacion: string | null;
  tipificacionSecundaria: string | null;
  tipo: string | null;
  tipoGeneral: string | null;
  descripcionCircular: string | null;
  precioDolar: number | null;
  precioEuro: number | null;
  producidoParaCliente: string | null;
  producidoDePieza: string | null;
  productoGeneral: string | null;
  productoRepoRinde: string | null;
  tipoTrabajo: string;
  idiomaEtiqueta: string;
  temperaturaTransporte: string;
  tipoConsumo: string;
  empresa: string;
  jaslo: boolean;
  formatoEtiqueta: string | null;
  textoTipoTrabajo: string | null;
  textoTipoCarne: string | null;
  textoEspanol: string | null;
  textoIngles: string | null;
  textoTercerIdioma: string | null;
  especie: string | null;
  activo: boolean;
}

const formularioInicial = {
  codigo: '',
  codigoSecundario: '',
  nombre: '',
  tara: '',
  vencimiento: '',
  nroSenasa: '',
  unidad: '',
  cantidadEtiquetas: '',
  tieneTipificacion: false,
  tipificacion: '',
  tipificacionSecundaria: '',
  tipo: '',
  tipoGeneral: '',
  descripcionCircular: '',
  precioDolar: '',
  precioEuro: '',
  producidoParaCliente: '',
  producidoDePieza: '',
  productoGeneral: '',
  productoRepoRinde: '',
  tipoTrabajo: 'NINGUNO',
  idiomaEtiqueta: 'ESPAÑOL',
  temperaturaTransporte: 'CONGELADA',
  tipoConsumo: 'HUMANO',
  empresa: 'PROPIA',
  jaslo: false,
  formatoEtiqueta: '',
  textoTipoTrabajo: '',
  textoTipoCarne: '',
  textoEspanol: '',
  textoIngles: '',
  textoTercerIdioma: '',
};

export default function ProductosModule() {
  const { toast } = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [confirmarEliminar, setConfirmarEliminar] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  // Cargar productos
  const cargarProductos = async () => {
    try {
      const params = new URLSearchParams();
      if (busqueda) params.append('buscar', busqueda);
      
      const response = await fetch(`/api/productos-vendibles?${params}`);
      const data = await response.json();
      if (data.success) {
        setProductos(data.data);
      } else {
        toast({ title: 'Error', description: data.error || 'Error al cargar productos', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    cargarProductos();
  }, [busqueda]);

  // Obtener próximo código libre
  const obtenerProximoCodigo = async () => {
    try {
      const response = await fetch('/api/productos-vendibles?limit=1&offset=0');
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        const maxCode = Math.max(...data.data.map((p: any) => parseInt(p.codigo) || 0));
        const nextCode = String(maxCode + 1).padStart(3, '0');
        setFormulario(prev => ({ ...prev, codigo: nextCode }));
      }
    } catch (error) {
      console.error('Error al obtener próximo código:', error);
    }
  };

  // Abrir modal para nuevo producto
  const abrirNuevo = async () => {
    setProductoEditando(null);
    setFormulario(formularioInicial);
    await obtenerProximoCodigo();
    setModalAbierto(true);
  };

  // Abrir modal para editar
  const abrirEditar = (producto: Producto) => {
    setProductoEditando(producto);
    setFormulario({
      codigo: producto.codigo,
      codigoSecundario: producto.codigoSecundario || '',
      nombre: producto.nombre,
      tara: producto.tara?.toString() || '',
      vencimiento: producto.vencimiento?.toString() || '',
      nroSenasa: producto.nroSenasa || '',
      unidad: producto.unidad || '',
      cantidadEtiquetas: producto.cantidadEtiquetas?.toString() || '',
      tieneTipificacion: producto.tieneTipificacion,
      tipificacion: producto.tipificacion || '',
      tipificacionSecundaria: producto.tipificacionSecundaria || '',
      tipo: producto.tipo || '',
      tipoGeneral: producto.tipoGeneral || '',
      descripcionCircular: producto.descripcionCircular || '',
      precioDolar: producto.precioDolar?.toString() || '',
      precioEuro: producto.precioEuro?.toString() || '',
      producidoParaCliente: producto.producidoParaCliente || '',
      producidoDePieza: producto.producidoDePieza || '',
      productoGeneral: producto.productoGeneral || '',
      productoRepoRinde: producto.productoRepoRinde || '',
      tipoTrabajo: producto.tipoTrabajo,
      idiomaEtiqueta: producto.idiomaEtiqueta,
      temperaturaTransporte: producto.temperaturaTransporte,
      tipoConsumo: producto.tipoConsumo,
      empresa: producto.empresa,
      jaslo: producto.jaslo,
      formatoEtiqueta: producto.formatoEtiqueta || '',
      textoTipoTrabajo: producto.textoTipoTrabajo || '',
      textoTipoCarne: producto.textoTipoCarne || '',
      textoEspanol: producto.textoEspanol || '',
      textoIngles: producto.textoIngles || '',
      textoTercerIdioma: producto.textoTercerIdioma || '',
    });
    setModalAbierto(true);
  };

  // Guardar producto
  const guardar = async () => {
    if (!formulario.codigo || !formulario.nombre) {
      toast({
        title: 'Error',
        description: 'El código y nombre son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    setCargando(true);
    try {
      const url = '/api/productos-vendibles';
      const method = productoEditando ? 'PUT' : 'POST';
      const body = productoEditando 
        ? { ...formulario, id: productoEditando.id, vencimientoDias: formulario.vencimiento ? parseInt(formulario.vencimiento) : 0, numeroRegistroSenasa: formulario.nroSenasa, unidadMedida: formulario.unidad || 'KG' }
        : { ...formulario, vencimientoDias: formulario.vencimiento ? parseInt(formulario.vencimiento) : 0, numeroRegistroSenasa: formulario.nroSenasa, unidadMedida: formulario.unidad || 'KG' };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar');
      }

      toast({
        title: productoEditando ? 'Producto actualizado' : 'Producto creado',
        description: 'Los cambios se guardaron correctamente',
      });

      setModalAbierto(false);
      cargarProductos();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCargando(false);
    }
  };

  // Eliminar producto
  const eliminar = async (id: string) => {
    try {
      const response = await fetch(`/api/productos-vendibles?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar');

      toast({
        title: 'Producto eliminado',
        description: 'El producto fue eliminado correctamente',
      });

      setConfirmarEliminar(null);
      cargarProductos();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el producto',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8" />
            <h1 className="text-2xl font-bold">PRODUCTOS</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por código o nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10 w-64 bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
            <Button onClick={abrirNuevo} className="bg-white text-emerald-800 hover:bg-white/90">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="flex-1 p-4 overflow-hidden">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <ScrollArea className="h-full">
              <Table>
                <TableHeader className="sticky top-0 bg-muted">
                  <TableRow>
                    <TableHead className="w-24">CÓDIGO</TableHead>
                    <TableHead>NOMBRE</TableHead>
                    <TableHead className="w-32">TIPO</TableHead>
                    <TableHead className="w-28">TIPO TRAB.</TableHead>
                    <TableHead className="w-28">IDOMA</TableHead>
                    <TableHead className="w-24">ESTADO</TableHead>
                    <TableHead className="w-28 text-right">ACCIONES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No hay productos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    productos.map((producto) => (
                      <TableRow key={producto.id} className={!producto.activo ? 'opacity-50' : ''}>
                        <TableCell className="font-mono font-bold">
                          {producto.codigo}
                          {producto.codigoSecundario && (
                            <span className="ml-1 text-blue-500">({producto.codigoSecundario})</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{producto.nombre}</TableCell>
                        <TableCell>{producto.tipoGeneral || producto.tipo || '-'}</TableCell>
                        <TableCell>{producto.tipoTrabajo}</TableCell>
                        <TableCell>{producto.idiomaEtiqueta}</TableCell>
                        <TableCell>
                          <Badge variant={producto.activo ? 'default' : 'secondary'}>
                            {producto.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => abrirEditar(producto)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setConfirmarEliminar(producto.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Modal de edición/creación */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden" maximizable>
          <DialogHeader className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-4">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Package className="h-5 w-5" />
              {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[calc(95vh-120px)]">
            <div className="p-4">
              <Tabs defaultValue="identificacion" className="w-full">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="identificacion">
                    <Tag className="h-4 w-4 mr-2" />
                    Identificación
                  </TabsTrigger>
                  <TabsTrigger value="tipificacion">
                    <FileText className="h-4 w-4 mr-2" />
                    Tipificación
                  </TabsTrigger>
                  <TabsTrigger value="produccion">
                    <Package className="h-4 w-4 mr-2" />
                    Producción
                  </TabsTrigger>
                  <TabsTrigger value="etiqueta">
                    <Globe className="h-4 w-4 mr-2" />
                    Etiqueta
                  </TabsTrigger>
                  <TabsTrigger value="transporte">
                    <Truck className="h-4 w-4 mr-2" />
                    Transporte
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Identificación */}
                <TabsContent value="identificacion" className="mt-4">
                  <div className="grid grid-cols-4 gap-4">
                    {/* Código */}
                    <div className="space-y-2">
                      <Label>CÓDIGO *</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formulario.codigo}
                          onChange={(e) => setFormulario(prev => ({ ...prev, codigo: e.target.value }))}
                          className="font-mono"
                          maxLength={3}
                        />
                        {!productoEditando && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={obtenerProximoCodigo}
                            title="Próximo código libre"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Código Secundario */}
                    <div className="space-y-2">
                      <Label>CÓDIGO SEC.</Label>
                      <Input
                        value={formulario.codigoSecundario}
                        onChange={(e) => setFormulario(prev => ({ ...prev, codigoSecundario: e.target.value }))}
                        className="bg-blue-50"
                      />
                    </div>

                    {/* Nombre */}
                    <div className="space-y-2 col-span-2">
                      <Label>NOMBRE *</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formulario.nombre}
                          onChange={(e) => setFormulario(prev => ({ ...prev, nombre: e.target.value }))}
                          className="flex-1"
                        />
                        <Button variant="outline" size="icon">
                          <Pencil className="h-4 w-4 text-amber-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Tara */}
                    <div className="space-y-2">
                      <Label>TARA</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formulario.tara}
                        onChange={(e) => setFormulario(prev => ({ ...prev, tara: e.target.value }))}
                      />
                    </div>

                    {/* Vencimiento */}
                    <div className="space-y-2">
                      <Label>VTO (días)</Label>
                      <Input
                        type="number"
                        value={formulario.vencimiento}
                        onChange={(e) => setFormulario(prev => ({ ...prev, vencimiento: e.target.value }))}
                      />
                    </div>

                    {/* Nro SENASA */}
                    <div className="space-y-2">
                      <Label>NRO SENASA</Label>
                      <Input
                        value={formulario.nroSenasa}
                        onChange={(e) => setFormulario(prev => ({ ...prev, nroSenasa: e.target.value }))}
                      />
                    </div>

                    {/* Unidad */}
                    <div className="space-y-2">
                      <Label>UNIDAD</Label>
                      <Input
                        value={formulario.unidad}
                        onChange={(e) => setFormulario(prev => ({ ...prev, unidad: e.target.value }))}
                        placeholder="kg, u, etc."
                      />
                    </div>

                    {/* Cantidad Etiquetas */}
                    <div className="space-y-2">
                      <Label>CANT. ETI</Label>
                      <Input
                        type="number"
                        value={formulario.cantidadEtiquetas}
                        onChange={(e) => setFormulario(prev => ({ ...prev, cantidadEtiquetas: e.target.value }))}
                      />
                    </div>

                    {/* Tipo */}
                    <div className="space-y-2">
                      <Label>TIPO</Label>
                      <Input
                        value={formulario.tipo}
                        onChange={(e) => setFormulario(prev => ({ ...prev, tipo: e.target.value }))}
                      />
                    </div>

                    {/* Tipo General */}
                    <div className="space-y-2">
                      <Label>TIPO GRAL.</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formulario.tipoGeneral}
                          onChange={(e) => setFormulario(prev => ({ ...prev, tipoGeneral: e.target.value }))}
                          className="flex-1"
                        />
                        <Button variant="outline" size="icon">
                          <Pencil className="h-4 w-4 text-amber-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Descripción Circular */}
                    <div className="space-y-2">
                      <Label>DESCRI. CIRCULAR</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formulario.descripcionCircular}
                          onChange={(e) => setFormulario(prev => ({ ...prev, descripcionCircular: e.target.value }))}
                          className="flex-1"
                        />
                        <Button variant="outline" size="icon">
                          <Pencil className="h-4 w-4 text-amber-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Precio Dólar */}
                    <div className="space-y-2">
                      <Label>P. DOLAR</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={formulario.precioDolar}
                          onChange={(e) => setFormulario(prev => ({ ...prev, precioDolar: e.target.value }))}
                          className="flex-1"
                        />
                        <Button variant="outline" size="icon">
                          <Pencil className="h-4 w-4 text-amber-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Precio Euro */}
                    <div className="space-y-2">
                      <Label>P. EURO</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={formulario.precioEuro}
                          onChange={(e) => setFormulario(prev => ({ ...prev, precioEuro: e.target.value }))}
                          className="flex-1"
                        />
                        <Button variant="outline" size="icon">
                          <Pencil className="h-4 w-4 text-amber-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 2: Tipificación */}
                <TabsContent value="tipificacion" className="mt-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Tiene Tipificación */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">TIENE TIPIFICACIÓN</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup
                          value={formulario.tieneTipificacion ? 'si' : 'no'}
                          onValueChange={(v) => setFormulario(prev => ({ ...prev, tieneTipificacion: v === 'si' }))}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="si" id="tipi-si" />
                            <Label htmlFor="tipi-si">Sí</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="tipi-no" />
                            <Label htmlFor="tipi-no">No</Label>
                          </div>
                        </RadioGroup>
                      </CardContent>
                    </Card>

                    {/* Tipificación */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">TIPIFICACIÓN</CardTitle>
                      </CardHeader>
                      <CardContent className="flex gap-4">
                        <div className="flex gap-2 flex-1">
                          <Input
                            value={formulario.tipificacion}
                            onChange={(e) => setFormulario(prev => ({ ...prev, tipificacion: e.target.value }))}
                            placeholder="Código"
                          />
                          <Button variant="outline" size="icon">
                            <Pencil className="h-4 w-4 text-amber-500" />
                          </Button>
                        </div>
                        <Input
                          value={formulario.tipificacionSecundaria}
                          onChange={(e) => setFormulario(prev => ({ ...prev, tipificacionSecundaria: e.target.value }))}
                          placeholder="Secundario"
                          className="flex-1"
                        />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Tab 3: Producción */}
                <TabsContent value="produccion" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Producido para Cliente */}
                    <div className="space-y-2">
                      <Label>PRODUCIDO PARA CLIENTE</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formulario.producidoParaCliente}
                          onChange={(e) => setFormulario(prev => ({ ...prev, producidoParaCliente: e.target.value }))}
                          className="flex-1"
                        />
                        <Input
                          value={formulario.producidoParaCliente}
                          onChange={(e) => setFormulario(prev => ({ ...prev, producidoParaCliente: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* Producido de Pieza */}
                    <div className="space-y-2">
                      <Label>PRODUCIDO DE PIEZA:</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formulario.producidoDePieza}
                          onChange={(e) => setFormulario(prev => ({ ...prev, producidoDePieza: e.target.value }))}
                          className="flex-1"
                        />
                        <Input
                          value={formulario.producidoDePieza}
                          onChange={(e) => setFormulario(prev => ({ ...prev, producidoDePieza: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* Producto General */}
                    <div className="space-y-2">
                      <Label>PRODUCTO GENERAL:</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formulario.productoGeneral}
                          onChange={(e) => setFormulario(prev => ({ ...prev, productoGeneral: e.target.value }))}
                          className="flex-1"
                        />
                        <Button variant="outline" size="icon">
                          <Pencil className="h-4 w-4 text-amber-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Producto Repo Rinde */}
                    <div className="space-y-2">
                      <Label>PRODUCTO REPO. RINDE:</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formulario.productoRepoRinde}
                          onChange={(e) => setFormulario(prev => ({ ...prev, productoRepoRinde: e.target.value }))}
                          className="flex-1"
                        />
                        <Button variant="outline" size="icon">
                          <Pencil className="h-4 w-4 text-amber-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Tipo de Trabajo */}
                    <Card className="col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Tipo de Trabajo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup
                          value={formulario.tipoTrabajo}
                          onValueChange={(v) => setFormulario(prev => ({ ...prev, tipoTrabajo: v }))}
                          className="flex gap-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="LAMA" id="tt-lama" />
                            <Label htmlFor="tt-lama">LAMA</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="MR" id="tt-mr" />
                            <Label htmlFor="tt-mr">MR</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="NINGUNO" id="tt-ninguno" />
                            <Label htmlFor="tt-ninguno">Ninguno</Label>
                          </div>
                        </RadioGroup>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Tab 4: Etiqueta */}
                <TabsContent value="etiqueta" className="mt-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Idioma de Etiqueta */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Idioma de Etiqueta</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup
                          value={formulario.idiomaEtiqueta}
                          onValueChange={(v) => setFormulario(prev => ({ ...prev, idiomaEtiqueta: v }))}
                          className="flex gap-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="INGLES" id="id-ing" />
                            <Label htmlFor="id-ing">Inglés</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="ITALIANO" id="id-ita" />
                            <Label htmlFor="id-ita">Italiano</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="OTRO" id="id-otro" />
                            <Label htmlFor="id-otro">Otro</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="ESPAÑOL" id="id-esp" />
                            <Label htmlFor="id-esp">Español</Label>
                          </div>
                        </RadioGroup>
                      </CardContent>
                    </Card>

                    {/* Formato Etiqueta */}
                    <div className="space-y-2">
                      <Label>FORMATO ETIQ.</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formulario.formatoEtiqueta}
                          onChange={(e) => setFormulario(prev => ({ ...prev, formatoEtiqueta: e.target.value }))}
                          className="flex-1"
                        />
                        <Button variant="outline">Armar</Button>
                      </div>
                    </div>

                    {/* Textos en Etiqueta */}
                    <Card className="col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">TEXTO EN ETIQUETA</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>TEXTO DE TIPO DE TRABAJO</Label>
                          <Input
                            value={formulario.textoTipoTrabajo}
                            onChange={(e) => setFormulario(prev => ({ ...prev, textoTipoTrabajo: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>TEXTO DE TIPO DE CARNE</Label>
                          <Input
                            value={formulario.textoTipoCarne}
                            onChange={(e) => setFormulario(prev => ({ ...prev, textoTipoCarne: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>TEXTO EN ESPAÑOL</Label>
                          <Input
                            value={formulario.textoEspanol}
                            onChange={(e) => setFormulario(prev => ({ ...prev, textoEspanol: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>TEXTO EN INGLÉS</Label>
                          <Input
                            value={formulario.textoIngles}
                            onChange={(e) => setFormulario(prev => ({ ...prev, textoIngles: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label>TEXTO EN TERCER IDIOMA</Label>
                          <Input
                            value={formulario.textoTercerIdioma}
                            onChange={(e) => setFormulario(prev => ({ ...prev, textoTercerIdioma: e.target.value }))}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Tab 5: Transporte y Consumo */}
                <TabsContent value="transporte" className="mt-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Temperatura y Transporte */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Temperatura y Transporte</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup
                          value={formulario.temperaturaTransporte}
                          onValueChange={(v) => setFormulario(prev => ({ ...prev, temperaturaTransporte: v }))}
                          className="flex flex-col gap-3"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="CONGELADA" id="temp-cong" />
                            <Label htmlFor="temp-cong">Congelada</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="ENFRIADA_BUQUE" id="temp-buque" />
                            <Label htmlFor="temp-buque">Enf. Buque</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="ENFRIADA_AVION" id="temp-avion" />
                            <Label htmlFor="temp-avion">Enf. Avión</Label>
                          </div>
                        </RadioGroup>
                      </CardContent>
                    </Card>

                    {/* Tipo de Consumo */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Tipo de Consumo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup
                          value={formulario.tipoConsumo}
                          onValueChange={(v) => setFormulario(prev => ({ ...prev, tipoConsumo: v }))}
                          className="flex gap-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="HUMANO" id="cons-hum" />
                            <Label htmlFor="cons-hum">Humano</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="NO_HUMANO" id="cons-no" />
                            <Label htmlFor="cons-no">No Humano</Label>
                          </div>
                        </RadioGroup>
                      </CardContent>
                    </Card>

                    {/* Empresa */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Empresa</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup
                          value={formulario.empresa}
                          onValueChange={(v) => setFormulario(prev => ({ ...prev, empresa: v }))}
                          className="flex gap-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="PROPIA" id="emp-prop" />
                            <Label htmlFor="emp-prop">Propia</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="OTRA" id="emp-otra" />
                            <Label htmlFor="emp-otra">Otra</Label>
                          </div>
                        </RadioGroup>
                      </CardContent>
                    </Card>

                    {/* Jaslo */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Jaslo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup
                          value={formulario.jaslo ? 'si' : 'no'}
                          onValueChange={(v) => setFormulario(prev => ({ ...prev, jaslo: v === 'si' }))}
                          className="flex gap-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="si" id="jaslo-si" />
                            <Label htmlFor="jaslo-si">Sí</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="jaslo-no" />
                            <Label htmlFor="jaslo-no">No</Label>
                          </div>
                        </RadioGroup>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>

          {/* Botones del modal */}
          <div className="border-t bg-muted/50 p-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setModalAbierto(false)}>
              <X className="h-4 w-4 mr-2" />
              Salir
            </Button>
            {productoEditando && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  setModalAbierto(false);
                  setConfirmarEliminar(productoEditando.id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            )}
            <Button onClick={guardar} disabled={cargando}>
              <Save className="h-4 w-4 mr-2" />
              {cargando ? 'Guardando...' : 'Aceptar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmación de eliminación */}
      <AlertDialog open={!!confirmarEliminar} onOpenChange={() => setConfirmarEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmarEliminar && eliminar(confirmarEliminar)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
