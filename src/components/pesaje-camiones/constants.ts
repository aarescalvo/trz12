// Constantes para el módulo de Pesaje de Camiones

import { ArrowDownToLine, ArrowUpFromLine, Weight } from 'lucide-react'

// Tipos de animales organizados por especie
export const TIPOS_ANIMALES: Record<string, { codigo: string; label: string; siglas: string }[]> = {
  BOVINO: [
    { codigo: 'TO', label: 'Toro', siglas: 'TORO' },
    { codigo: 'VA', label: 'Vaca', siglas: 'VACA' },
    { codigo: 'VQ', label: 'Vaquillona', siglas: 'VAQU' },
    { codigo: 'MEJ', label: 'Torito/Mej', siglas: 'MEJ' },
    { codigo: 'NO', label: 'Novillo', siglas: 'NOVI' },
    { codigo: 'NT', label: 'Novillito', siglas: 'NOVT' },
  ],
  EQUINO: [
    { codigo: 'PADRILLO', label: 'Padrillo', siglas: 'PADR' },
    { codigo: 'POTRILLO', label: 'Potrillo/Potranca', siglas: 'POTR' },
    { codigo: 'YEGUA', label: 'Yegua', siglas: 'YEGU' },
    { codigo: 'CABALLO', label: 'Caballo', siglas: 'CAB' },
    { codigo: 'BURRO', label: 'Burro', siglas: 'BURR' },
    { codigo: 'MULA', label: 'Mula', siglas: 'MULA' },
  ]
}

export const ESPECIES = [
  { id: 'BOVINO', label: 'Bovino', letra: 'B' },
  { id: 'EQUINO', label: 'Equino', letra: 'E' },
]

export const TIPOS_PESAJE = [
  { id: 'INGRESO_HACIENDA' as const, label: 'Ingreso de Hacienda', icon: ArrowDownToLine, color: 'text-green-600', desc: 'Recepción de animales - Bruto' },
  { id: 'PESAJE_PARTICULAR' as const, label: 'Pesaje Particular', icon: Weight, color: 'text-blue-600', desc: 'Pesaje general' },
  { id: 'SALIDA_MERCADERIA' as const, label: 'Salida de Mercadería', icon: ArrowUpFromLine, color: 'text-orange-600', desc: 'Tara → Carga → Bruto' },
]
