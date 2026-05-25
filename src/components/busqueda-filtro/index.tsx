'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  Search, Loader2, FileText, Truck, User, Package, Beef,
  Calendar, Hash, ExternalLink
} from 'lucide-react'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Props {
  operador: Operador
}

type EntityType = 'tropas' | 'animales' | 'romaneos' | 'medias' | 'expediciones'

interface SearchResult {
  tipo: string
  id: string
  codigo: string
  descripcion: string
  fecha?: string
  datos: Record<string, unknown>
}

export function BusquedaFiltroModule({ operador }: Props) {
  const { editMode, getTexto } = useEditor()
  const [busqueda, setBusqueda] = useState('')
  const [tipoBusqueda, setTipoBusqueda] = useState<EntityType>('tropas')
  const [resultados, setResultados] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)

  const handleBuscar = async () => {
    if (!busqueda.trim()) {
      toast.error('Ingrese un término de búsqueda')
      return
    }

    setLoading(true)
    setBusquedaRealizada(true)
    
    try {
      const res = await fetch(`/api/busqueda?q=${encodeURIComponent(busqueda)}&tipo=${tipoBusqueda}`)
      const data = await res.json()
      
      if (data.success) {
        setResultados(data.data)
      } else {
        setResultados([])
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error en la búsqueda')
      setResultados([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBuscar()
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'tropa': return <Truck className="w-4 h-4" />
      case 'animal': return <Beef className="w-4 h-4" />
      case 'romaneo': return <FileText className="w-4 h-4" />
      case 'media': return <Package className="w-4 h-4" />
      case 'expedicion': return <Truck className="w-4 h-4" />
      default: return <Search className="w-4 h-4" />
    }
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      tropa: 'Tropa',
      animal: 'Animal',
      romaneo: 'Romaneo',
      media: 'Media Res',
      expedicion: 'Expedición',
      cliente: 'Cliente',
      productor: 'Productor'
    }
    return labels[tipo] || tipo
  }

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      tropa: 'bg-amber-100 text-amber-700',
      animal: 'bg-purple-100 text-purple-700',
      romaneo: 'bg-blue-100 text-blue-700',
      media: 'bg-emerald-100 text-emerald-700',
      expedicion: 'bg-red-100 text-red-700',
      cliente: 'bg-stone-100 text-stone-700',
      productor: 'bg-stone-100 text-stone-700'
    }
    return colors[tipo] || 'bg-stone-100 text-stone-700'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Search className="w-8 h-8 text-amber-500" />
              <TextoEditable id="busqueda-titulo" original="Búsqueda por Filtro" tag="span" />
            </h1>
            <p className="text-stone-500 mt-1">
              <TextoEditable id="busqueda-subtitulo" original="Búsqueda avanzada en todo el sistema" tag="span" />
            </p>
          </div>
        </EditableBlock>

        {/* Buscador */}
        <EditableBlock bloqueId="buscador" label="Buscador">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por código, tropa, garrón, caravana, cliente..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="h-12 text-lg"
                  />
                </div>
                <Select value={tipoBusqueda} onValueChange={(v) => setTipoBusqueda(v as EntityType)}>
                  <SelectTrigger className="w-48 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tropas">
                      <TextoEditable id="busqueda-opt-tropas" original="Tropas" tag="span" />
                    </SelectItem>
                    <SelectItem value="animales">
                      <TextoEditable id="busqueda-opt-animales" original="Animales" tag="span" />
                    </SelectItem>
                    <SelectItem value="romaneos">
                      <TextoEditable id="busqueda-opt-romaneos" original="Romaneos" tag="span" />
                    </SelectItem>
                    <SelectItem value="medias">
                      <TextoEditable id="busqueda-opt-medias" original="Medias Res" tag="span" />
                    </SelectItem>
                    <SelectItem value="expediciones">
                      <TextoEditable id="busqueda-opt-expediciones" original="Expediciones" tag="span" />
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleBuscar} 
                  className="h-12 bg-amber-500 hover:bg-amber-600 px-8"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      <TextoEditable id="btn-buscar" original="Buscar" tag="span" />
                    </>
                  )}
                </Button>
              </div>

              {/* Tips */}
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-stone-400">
                <span>
                  <TextoEditable id="busqueda-sugerencias" original="Sugerencias:" tag="span" />
                </span>
                <button onClick={() => setBusqueda('B2026')} className="hover:text-amber-600">B2026</button>
                <span>•</span>
                <button onClick={() => setBusqueda('G-CHO')} className="hover:text-amber-600">G-CHO</button>
                <span>•</span>
                <button onClick={() => setBusqueda('garron:15')} className="hover:text-amber-600">garron:15</button>
                <span>•</span>
                <button onClick={() => setBusqueda('caravana:A033')} className="hover:text-amber-600">caravana:A033</button>
              </div>
            </CardContent>
          </Card>
        </EditableBlock>

        {/* Resultados */}
        {busquedaRealizada && (
          <EditableBlock bloqueId="resultados" label="Resultados">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-500" />
                    <TextoEditable id="busqueda-resultados-title" original="Resultados de Búsqueda" tag="span" />
                  </CardTitle>
                  <Badge variant="outline">{resultados.length} encontrados</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {resultados.length === 0 ? (
                  <div className="py-12 text-center text-stone-400">
                    <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>
                      <TextoEditable id="busqueda-no-resultados" original="No se encontraron resultados" tag="span" /> "{busqueda}"
                    </p>
                    <p className="text-sm mt-2">
                      <TextoEditable id="busqueda-intentar-otros" original="Intente con otros términos o categorías" tag="span" />
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50">
                        <TableHead className="w-24">
                          <TextoEditable id="busqueda-th-tipo" original="Tipo" tag="span" />
                        </TableHead>
                        <TableHead>
                          <TextoEditable id="busqueda-th-codigo" original="Código" tag="span" />
                        </TableHead>
                        <TableHead>
                          <TextoEditable id="busqueda-th-descripcion" original="Descripción" tag="span" />
                        </TableHead>
                        <TableHead>
                          <TextoEditable id="busqueda-th-fecha" original="Fecha" tag="span" />
                        </TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultados.map((r, idx) => (
                        <TableRow key={`${r.tipo}-${r.id}-${idx}`} className="hover:bg-stone-50">
                          <TableCell>
                            <Badge className={getTipoColor(r.tipo)}>
                              <span className="flex items-center gap-1">
                                {getTipoIcon(r.tipo)}
                                {getTipoLabel(r.tipo)}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono font-medium">{r.codigo}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-stone-800">{r.descripcion}</p>
                              {r.datos && Object.keys(r.datos).length > 0 && (
                                <p className="text-xs text-stone-400 mt-1">
                                  {Object.entries(r.datos).slice(0, 3).map(([k, v]) => (
                                    <span key={k} className="mr-3">{k}: {String(v)}</span>
                                  ))}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-stone-500">
                            {r.fecha ? new Date(r.fecha).toLocaleDateString('es-AR') : '-'}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </EditableBlock>
        )}

        {/* Búsquedas por categoría */}
        <EditableBlock bloqueId="categorias" label="Categorías">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50">
              <CardTitle className="text-lg">
                <TextoEditable id="busqueda-categorias-title" original="Búsquedas por Categoría" tag="span" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { tipo: 'tropas', icon: Truck, label: 'Tropas', color: 'text-amber-500' },
                  { tipo: 'animales', icon: Beef, label: 'Animales', color: 'text-purple-500' },
                  { tipo: 'romaneos', icon: FileText, label: 'Romaneos', color: 'text-blue-500' },
                  { tipo: 'medias', icon: Package, label: 'Medias Res', color: 'text-emerald-500' },
                  { tipo: 'expediciones', icon: Truck, label: 'Expediciones', color: 'text-red-500' },
                ].map((cat) => (
                  <button
                    key={cat.tipo}
                    onClick={() => setTipoBusqueda(cat.tipo as EntityType)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      tipoBusqueda === cat.tipo 
                        ? 'border-amber-500 bg-amber-50' 
                        : 'border-stone-200 hover:border-amber-300'
                    }`}
                  >
                    <cat.icon className={`w-6 h-6 mx-auto mb-2 ${cat.color}`} />
                    <p className="text-sm font-medium text-center">
                      <TextoEditable id={`busqueda-cat-${cat.tipo}`} original={cat.label} tag="span" />
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </EditableBlock>
      </div>
    </div>
  )
}

export default BusquedaFiltroModule
