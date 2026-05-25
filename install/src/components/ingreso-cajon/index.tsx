'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  BoxSelect, RefreshCw, Link2, Hash, CheckCircle, AlertTriangle,
  Delete, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface AnimalLista {
  id: string
  codigo: string
  tropaCodigo: string
  tipoAnimal: string
  pesoVivo: number | null
  numero: number
  garronAsignado: number | null
}

interface GarronAsignado {
  garron: number
  animalId: string | null
  animalCodigo: string | null
  tropaCodigo: string | null
  tipoAnimal: string | null
  pesoVivo: number | null
  completado: boolean
}

interface Operador {
  id: string
  nombre: string
  nivel: string
}

export function IngresoCajonModule({ operador }: { operador: Operador }) {
  // Datos
  const [animalesLista, setAnimalesLista] = useState<AnimalLista[]>([])
  const [garronesAsignados, setGarronesAsignados] = useState<GarronAsignado[]>([])
  
  // Estado
  const [proximoGarron, setProximoGarron] = useState(1)
  const [numeroAnimal, setNumeroAnimal] = useState('')
  const [animalEncontrado, setAnimalEncontrado] = useState<AnimalLista | null>(null)
  
  // UI
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [listaRes, garronesRes] = await Promise.all([
        fetch('/api/lista-faena/animales-hoy'),
        fetch('/api/garrones-asignados')
      ])
      
      const listaData = await listaRes.json()
      const garronesData = await garronesRes.json()
      
      if (listaData.success) {
        setAnimalesLista(listaData.data)
      }
      
      if (garronesData.success) {
        setGarronesAsignados(garronesData.data)
        const garronesUsados = garronesData.data.map((g: GarronAsignado) => g.garron)
        const maxGarron = garronesUsados.length > 0 ? Math.max(...garronesUsados) : 0
        setProximoGarron(maxGarron + 1)
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Teclado numérico
  const handleKeyPress = (key: string) => {
    if (key === 'clear') {
      setNumeroAnimal('')
      setAnimalEncontrado(null)
    } else if (key === 'backspace') {
      setNumeroAnimal(prev => prev.slice(0, -1))
      setAnimalEncontrado(null)
    } else if (numeroAnimal.length < 4) {
      const newNumber = numeroAnimal + key
      setNumeroAnimal(newNumber)
      // Buscar animal automáticamente cuando hay 3 o más dígitos
      if (newNumber.length >= 1) {
        buscarAnimal(newNumber)
      }
    }
  }

  const buscarAnimal = (numero: string) => {
    // Buscar animal por número (última parte del código)
    // El formato del código es: B20260099-001 (el número es 001)
    const numInt = parseInt(numero)
    
    // Buscar en animales pendientes
    const animal = animalesLista.find(a => {
      // Buscar por número de animal dentro de la tropa
      if (a.numero === numInt) return true
      // Buscar por últimos dígitos del código
      if (a.codigo.endsWith(numero.padStart(3, '0'))) return true
      // Buscar por coincidencia parcial
      if (a.codigo.includes(numero)) return true
      return false
    })

    // Solo mostrar si no tiene garrón asignado
    if (animal && !animal.garronAsignado) {
      setAnimalEncontrado(animal)
    } else if (animal && animal.garronAsignado) {
      setAnimalEncontrado(null)
      toast.warning(`Animal ya tiene garrón #${animal.garronAsignado} asignado`)
    } else {
      setAnimalEncontrado(null)
    }
  }

  const handleAsignarGarron = async (animalId: string | null) => {
    setSaving(true)
    try {
      const res = await fetch('/api/garrones-asignados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garron: proximoGarron,
          animalId,
          operadorId: operador.id
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success(`Garrón #${proximoGarron} asignado correctamente`, {
          description: animalId ? `Animal: ${animalEncontrado?.codigo}` : 'Sin identificar'
        })
        // Limpiar y actualizar
        setNumeroAnimal('')
        setAnimalEncontrado(null)
        fetchData()
      } else {
        toast.error(data.error || 'Error al asignar garrón')
      }
      
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleAsignarSinIdentificar = () => {
    handleAsignarGarron(null)
  }

  const getAnimalesPendientes = () => {
    return animalesLista.filter(a => !a.garronAsignado)
  }

  // Teclado numérico
  const TecladoNumerico = () => (
    <div className="grid grid-cols-3 gap-2">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'backspace'].map((key) => (
        <Button
          key={key}
          variant={key === 'clear' || key === 'backspace' ? 'destructive' : 'outline'}
          className={`h-14 text-2xl font-bold ${
            key === 'clear' || key === 'backspace' 
              ? '' 
              : 'hover:bg-amber-50 hover:border-amber-300'
          }`}
          onClick={() => handleKeyPress(key)}
        >
          {key === 'clear' ? <Delete className="w-6 h-6" /> : 
           key === 'backspace' ? '←' : key}
        </Button>
      ))}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
        <BoxSelect className="w-8 h-8 animate-pulse text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">Ingreso a Cajón</h1>
            <p className="text-stone-500">Asignación de garrones - Ingrese número de animal</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Badge variant="outline" className="text-lg px-4 py-2 bg-amber-50 border-amber-200">
              Próximo: <span className="font-bold text-amber-600 ml-1">#{proximoGarron}</span>
            </Badge>
          </div>
        </div>

        {/* Resumen */}
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-600" />
                <strong>Lista:</strong> {animalesLista.length} animales
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Asignados: {animalesLista.filter(a => a.garronAsignado).length}
              </span>
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Pendientes: {getAnimalesPendientes().length}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Panel izquierdo - Teclado y asignación */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-amber-50 py-3">
              <CardTitle className="text-base">Ingreso de Número de Animal</CardTitle>
              <CardDescription>
                Ingrese el número del animal con el teclado numérico
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Display del número */}
              <div className="text-center p-4 bg-stone-900 rounded-lg">
                <p className="text-stone-400 text-sm">Número de Animal</p>
                <div className="text-5xl font-mono font-bold text-amber-400 min-h-[60px] flex items-center justify-center">
                  {numeroAnimal || '_ _ _'}
                </div>
              </div>

              {/* Teclado numérico */}
              <TecladoNumerico />

              <Separator />

              {/* Animal encontrado */}
              {animalEncontrado ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-700">Animal encontrado</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-stone-500">Código:</span>
                      <span className="font-bold ml-1">{animalEncontrado.codigo}</span>
                    </div>
                    <div>
                      <span className="text-stone-500">Tropa:</span>
                      <span className="ml-1">{animalEncontrado.tropaCodigo}</span>
                    </div>
                    <div>
                      <span className="text-stone-500">Tipo:</span>
                      <Badge variant="outline" className="ml-1">{animalEncontrado.tipoAnimal}</Badge>
                    </div>
                    <div>
                      <span className="text-stone-500">Peso:</span>
                      <span className="font-bold ml-1">{animalEncontrado.pesoVivo?.toFixed(0) || '-'} kg</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleAsignarGarron(animalEncontrado.id)}
                    disabled={saving}
                    className="w-full h-14 mt-4 bg-green-600 hover:bg-green-700 text-lg"
                  >
                    <Link2 className="w-5 h-5 mr-2" />
                    ASIGNAR GARRÓN #{proximoGarron}
                  </Button>
                </div>
              ) : numeroAnimal.length > 0 ? (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <span className="text-orange-700">No se encontró animal con número {numeroAnimal}</span>
                  </div>
                  <p className="text-sm text-orange-600 mt-1">
                    Verifique el número o asigne sin identificar
                  </p>
                </div>
              ) : null}

              {/* Botón asignar sin identificar */}
              <Button
                variant="outline"
                onClick={handleAsignarSinIdentificar}
                disabled={saving}
                className="w-full h-12 border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                <AlertTriangle className="w-5 h-5 mr-2" />
                ASIGNAR SIN IDENTIFICAR
              </Button>
            </CardContent>
          </Card>

          {/* Panel derecho - Lista de garrones */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 py-3">
              <CardTitle className="text-base">Garrones Asignados ({garronesAsignados.length})</CardTitle>
              <CardDescription>
                Últimas asignaciones del día
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {garronesAsignados.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <BoxSelect className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay garrones asignados</p>
                    <p className="text-sm">Ingrese un número de animal para comenzar</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {[...garronesAsignados].reverse().map((g) => (
                      <div 
                        key={g.garron}
                        className={`p-3 flex items-center justify-between ${
                          !g.animalId ? 'bg-orange-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-amber-600 w-14">#{g.garron}</span>
                          {g.animalId ? (
                            <div>
                              <p className="font-medium">{g.animalCodigo}</p>
                              <p className="text-xs text-stone-500">{g.tropaCodigo} • {g.tipoAnimal}</p>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-orange-600">
                              Sin identificar
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          {g.completado ? (
                            <Badge className="bg-green-100 text-green-700">
                              <Check className="w-3 h-3 mr-1" />
                              Completado
                            </Badge>
                          ) : (
                            <span className="text-sm text-stone-500">
                              {g.pesoVivo?.toFixed(0) || '-'} kg
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default IngresoCajonModule
