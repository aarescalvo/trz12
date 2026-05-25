// Constantes para el módulo de Movimiento de Hacienda

export const ESTADOS = [
  { id: 'RECIBIDO', label: 'Recibido', color: 'bg-amber-100 text-amber-700' },
  { id: 'EN_CORRAL', label: 'En Corral', color: 'bg-blue-100 text-blue-700' },
  { id: 'EN_PESAJE', label: 'En Pesaje', color: 'bg-purple-100 text-purple-700' },
  { id: 'PESADO', label: 'Pesado', color: 'bg-green-100 text-green-700' },
  { id: 'LISTO_FAENA', label: 'Listo Faena', color: 'bg-cyan-100 text-cyan-700' },
  { id: 'EN_FAENA', label: 'En Faena', color: 'bg-orange-100 text-orange-700' },
  { id: 'FAENADO', label: 'Faenado', color: 'bg-gray-100 text-gray-700' },
  { id: 'DESPACHADO', label: 'Despachado', color: 'bg-stone-100 text-stone-500' },
]

// Transiciones de estado válidas
export const TRANSICIONES_ESTADO: Record<string, string[]> = {
  'RECIBIDO': ['EN_CORRAL', 'EN_PESAJE'],
  'EN_CORRAL': ['EN_PESAJE'],
  'EN_PESAJE': ['PESADO'],
  'PESADO': ['LISTO_FAENA'],
  'LISTO_FAENA': ['EN_FAENA'],
  'EN_FAENA': ['FAENADO'],
  'FAENADO': ['DESPACHADO'],
}

// Estados que permiten agregar a lista de faena
export const ESTADOS_FAENA = ['PESADO', 'LISTO_FAENA']

// Nombres de corrales (fallback si no hay en DB)
export const CORRALES_DEFAULT = [
  'Corral A', 'Corral B', 'Corral C', 'Corral D', 'Corral E1', 'Corral E2'
]

// Motivos de baja
export const MOTIVOS_BAJA = [
  'Muerte natural',
  'Enfermedad',
  'Accidente',
  'Sacrificio',
  'Otro'
]
