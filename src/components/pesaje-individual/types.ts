// Tipos para el módulo de Pesaje Individual

export interface Operador {
  id: string
  nombre: string
}

export interface Corral {
  id: string
  nombre: string
  capacidad: number
  stockBovinos: number
  stockEquinos: number
}

export interface Tropa {
  id: string
  numero: number
  codigo: string
  especie: string
  cantidadCabezas: number
  estado: string
  corral?: { id: string; nombre: string } | string
  corralId?: string
  pesoNeto?: number
  pesoTotalIndividual?: number
  usuarioFaena?: { nombre: string }
  tiposAnimales?: { tipoAnimal: string; cantidad: number }[]
  observaciones?: string
}

export interface Animal {
  id: string
  numero: number
  codigo: string
  tipoAnimal: string
  caravana?: string
  raza?: string
  pesoVivo?: number
  observaciones?: string
  estado: string
  tropaId?: string
}

export type Especie = 'BOVINO' | 'EQUINO'
export type EstadoAnimal = 'RECIBIDO' | 'PESADO' | 'FAENADO'
