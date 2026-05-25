// ==================== TIPOS DE FACTURACIÓN ====================

import { z } from 'zod'

// ---------- Tarifas ----------

export const UNIDADES_TARIFA = {
  POR_KG: 'POR_KG',
  POR_CABEZA: 'POR_CABEZA', 
  FIJO: 'FIJO',
  POR_KG_POR_DIA: 'POR_KG_POR_DIA',
} as const

export type UnidadTarifa = typeof UNIDADES_TARIFA[keyof typeof UNIDADES_TARIFA]

export interface TipoTarifa {
  id: string
  codigo: string
  descripcion: string
  unidad: UnidadTarifa
  activo: boolean
  orden: number
}

export interface HistoricoTarifa {
  id: string
  tipoTarifaId: string
  tipoTarifa?: TipoTarifa
  clienteId?: string | null
  especie?: string | null
  categoria?: string | null
  valor: number
  moneda: string
  vigenciaDesde: string | Date
  vigenciaHasta?: string | Date | null
  operadorId?: string | null
  motivo?: string | null
  createdAt: string | Date
  // Joined
  cliente?: { id: string; nombre: string; razonSocial?: string }
  operador?: { id: string; nombre: string }
}

// Zod schema for creating a new tarifa
export const crearTarifaSchema = z.object({
  tipoTarifaCodigo: z.string().min(1, 'Tipo de tarifa requerido'),
  valor: z.number().positive('El valor debe ser positivo'),
  vigenciaDesde: z.string().or(z.date()),
  clienteId: z.string().optional().nullable(),
  especie: z.string().optional().nullable(),
  categoria: z.string().optional().nullable(),
  motivo: z.string().min(3, 'El motivo es obligatorio (mín. 3 caracteres)'),
  operadorId: z.string().min(1, 'Operador requerido'),
})

export type CrearTarifaInput = z.infer<typeof crearTarifaSchema>

// ---------- Liquidaciones ----------

export const ESTADOS_LIQUIDACION = {
  BORRADOR: 'BORRADOR',
  EMITIDA: 'EMITIDA',
  ANULADA: 'ANULADA',
} as const

export type EstadoLiquidacion = typeof ESTADOS_LIQUIDACION[keyof typeof ESTADOS_LIQUIDACION]

export interface LiquidacionItem {
  id: string
  liquidacionId: string
  tipoTarifaId?: string | null
  descripcion: string
  unidad: string
  cantidad: number
  tarifaValor: number
  subtotal: number
  alicuotaIVA: number
  importeIVA: number
  esDescuento: boolean
}

export interface LiquidacionFaena {
  id: string
  numero: number
  tropaId: string
  clienteId: string
  fechaFaena: string | Date
  dteSenasa?: string | null
  certFaena?: string | null
  cantCabezas: number
  kgRomaneo: number
  tarifaFaenaId?: string | null
  tarifaFaenaValor: number
  subtotalNeto: number
  totalIVA: number
  totalRetenciones: number
  totalFinal: number
  estado: EstadoLiquidacion
  facturaId?: string | null
  supervisorId?: string | null
  operadorId?: string | null
  createdAt: string | Date
  updatedAt: string | Date
  // Joined
  tropa?: { id: string; codigo: string; especie: string; cantidadCabezas: number }
  cliente?: { id: string; nombre: string; cuit?: string; condicionIva?: string; razonSocial?: string }
  items?: LiquidacionItem[]
  factura?: { id: string; numero: string; tipoComprobante: string; cae?: string | null }
  operador?: { id: string; nombre: string }
  supervisor?: { id: string; nombre: string }
}

// Zod schema for creating a liquidacion
export const crearLiquidacionSchema = z.object({
  tropaId: z.string().min(1, 'Tropa requerida'),
  operadorId: z.string().min(1, 'Operador requerido'),
})

export type CrearLiquidacionInput = z.infer<typeof crearLiquidacionSchema>

// Zod schema for adding items to a liquidacion
export const actualizarItemsSchema = z.object({
  items: z.array(z.object({
    id: z.string().optional(),           // existing item id (for updates)
    tipoTarifaId: z.string().optional().nullable(),
    descripcion: z.string().min(1),
    unidad: z.string().default('POR_KG'),
    cantidad: z.number().positive(),
    tarifaValor: z.number().nonnegative(),
    alicuotaIVA: z.number().default(21),
    esDescuento: z.boolean().default(false),
  }))
})

export type ActualizarItemsInput = z.infer<typeof actualizarItemsSchema>

// ---------- Supervisor Auth ----------

export const supervisorAuthSchema = z.object({
  liquidacionId: z.string(),
  pin: z.string().min(4, 'PIN requerido (mín. 4 dígitos)'),
  operadorId: z.string(),
})

export type SupervisorAuthInput = z.infer<typeof supervisorAuthSchema>

// ---------- Tropa para liquidar (from romaneo) ----------

export interface TropaPendienteLiquidacion {
  id: string
  codigo: string
  especie: string
  cantidadCabezas: number
  kgGancho?: number | null
  pesoTotalIndividual?: number | null
  fechaFaena?: string | Date | null
  dte: string
  guia: string
  usuarioFaena: { id: string; nombre: string; cuit?: string; condicionIva?: string; razonSocial?: string }
  productor?: { id: string; nombre: string } | null
  romaneosCount: number
  tieneLiquidacion: boolean
}
