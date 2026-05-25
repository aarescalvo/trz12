'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Package, AlertTriangle, Search, RefreshCw } from 'lucide-react'

interface StockInsumo {
  id: string
  insumoId: string
  depositoId: string
  cantidad: number
  insumo: {
    id: string
    nombre: string
    codigo?: string
    unidadMedida: string
    stockMinimo: number
    categoria?: { nombre: string }
  }
  deposito: {
    id: string
    nombre: string
    codigo?: string
  }
}

interface Insumo {
  id: string
  nombre: string
  codigo?: string
}

interface Deposito {
  id: string
  nombre: string
  codigo?: string
}

interface Props {
  operador: { id: string; nombre: string; nivel: string }
}

export function StockInsumos({ operador }: Props) {
  const [stocks, setStocks] = useState<StockInsumo[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [depositos, setDepositos] = useState<Deposito[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroInsumo, setFiltroInsumo] = useState<string>('all')
  const [filtroDeposito, setFiltroDeposito] = useState<string>('all')
  const [soloBajoMinimo, setSoloBajoMinimo] = useState(false)

  useEffect(() => {
    fetchInsumos()
    fetchDepositos()
    fetchStocks()
  }, [])

  const fetchInsumos = async () => {
    try {
      const res = await fetch('/api/insumos')
      if (res.ok) {
        const data = await res.json()
        setInsumos(data.filter((i: Insumo & { activo: boolean }) => i.activo))
      }
    } catch (error) {
      console.error('Error al cargar insumos:', error)
    }
  }

  const fetchDepositos = async () => {
    try {
      const res = await fetch('/api/depositos')
      if (res.ok) {
        const data = await res.json()
        setDepositos(data.filter((d: Deposito & { activo: boolean }) => d.activo))
      }
    } catch (error) {
      console.error('Error al cargar depósitos:', error)
    }
  }

  const fetchStocks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroInsumo && filtroInsumo !== 'all') params.append('insumoId', filtroInsumo)
      if (filtroDeposito && filtroDeposito !== 'all') params.append('depositoId', filtroDeposito)
      if (soloBajoMinimo) params.append('bajoMinimo', 'true')

      const res = await fetch(`/api/stock-insumos?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setStocks(data)
      }
    } catch (error) {
      console.error('Error al cargar stock:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBuscar = () => {
    fetchStocks()
  }

  const handleLimpiarFiltros = () => {
    setFiltroInsumo('')
    setFiltroDeposito('')
    setSoloBajoMinimo(false)
    fetchStocks()
  }

  const estaBajoMinimo = (stock: StockInsumo) => {
    return stock.cantidad < stock.insumo.stockMinimo
  }

  const contarAlertas = () => {
    return stocks.filter(estaBajoMinimo).length
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Stock de Insumos
          {contarAlertas() > 0 && (
            <Badge variant="destructive" className="ml-2">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {contarAlertas()} bajo mínimo
            </Badge>
          )}
        </CardTitle>
        <Button onClick={fetchStocks} size="sm" variant="outline">
          <RefreshCw className="w-4 h-4 mr-1" />
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-stone-50 rounded-lg">
          <div>
            <Label>Insumo</Label>
            <Select value={filtroInsumo} onValueChange={setFiltroInsumo}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los insumos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {insumos.map((ins) => (
                  <SelectItem key={ins.id} value={ins.id}>
                    {ins.codigo ? `${ins.codigo} - ` : ''}{ins.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Depósito</Label>
            <Select value={filtroDeposito} onValueChange={setFiltroDeposito}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los depósitos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {depositos.map((dep) => (
                  <SelectItem key={dep.id} value={dep.id}>
                    {dep.codigo ? `${dep.codigo} - ` : ''}{dep.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={soloBajoMinimo}
                onChange={(e) => setSoloBajoMinimo(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300"
              />
              <span className="text-sm">Solo stock bajo mínimo</span>
            </label>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={handleBuscar} size="sm">
              <Search className="w-4 h-4 mr-1" />
              Buscar
            </Button>
            <Button onClick={handleLimpiarFiltros} variant="outline" size="sm">
              Limpiar
            </Button>
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : stocks.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            No se encontraron registros de stock
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Insumo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Depósito</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Stock Mín.</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((stock) => {
                  const bajoMinimo = estaBajoMinimo(stock)
                  return (
                    <TableRow key={stock.id} className={bajoMinimo ? 'bg-red-50' : ''}>
                      <TableCell className="font-mono">
                        {stock.insumo.codigo || '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {stock.insumo.nombre}
                      </TableCell>
                      <TableCell>
                        {stock.insumo.categoria?.nombre || '-'}
                      </TableCell>
                      <TableCell>
                        {stock.deposito.nombre}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {stock.cantidad} {stock.insumo.unidadMedida}
                      </TableCell>
                      <TableCell className="text-right">
                        {stock.insumo.stockMinimo} {stock.insumo.unidadMedida}
                      </TableCell>
                      <TableCell>
                        {bajoMinimo ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Bajo mínimo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Normal
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default StockInsumos
