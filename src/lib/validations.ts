/**
 * Esquemas de validación Zod para las APIs
 */
import { z } from 'zod'

// ============================================
// ESQUEMAS DE AUTENTICACIÓN
// ============================================

export const LoginSchema = z.object({
  usuario: z.string().min(1, 'Usuario requerido').max(50).optional(),
  password: z.string().min(1, 'Password requerido').max(100).optional(),
  pin: z.string().length(4, 'PIN debe tener 4 dígitos').optional(),
}).refine(
  (data) => data.usuario && data.password || data.pin,
  { message: 'Debe proporcionar usuario/password o PIN' }
)

export const SupervisorAuthSchema = z.object({
  pin: z.string().length(4, 'PIN debe tener 4 dígitos').optional(),
  usuario: z.string().min(1).max(50).optional(),
  password: z.string().min(1).max(100).optional(),
}).refine(
  (data) => data.pin || (data.usuario && data.password),
  { message: 'Debe proporcionar PIN o usuario/password' }
)

// ============================================
// ESQUEMAS DE OPERADORES
// ============================================

export const OperadorCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(100),
  usuario: z.string().min(1, 'Usuario requerido').max(50).toLowerCase(),
  password: z.string().min(8, 'Password mínimo 8 caracteres').max(100),
  email: z.string().email('Email inválido').optional().nullable(),
  pin: z.string().length(4, 'PIN debe tener 4 dígitos').optional().nullable(),
  rol: z.enum(['OPERADOR', 'SUPERVISOR', 'ADMINISTRADOR']),
  activo: z.boolean().default(true),
  // Permisos
  puedePesajeCamiones: z.boolean().default(false),
  puedePesajeIndividual: z.boolean().default(false),
  puedeMovimientoHacienda: z.boolean().default(false),
  puedeListaFaena: z.boolean().default(false),
  puedeRomaneo: z.boolean().default(false),
  puedeIngresoCajon: z.boolean().default(false),
  puedeMenudencias: z.boolean().default(false),
  puedeStock: z.boolean().default(false),
  puedeReportes: z.boolean().default(false),
  puedeCCIR: z.boolean().default(false),
  puedeFacturacion: z.boolean().default(false),
  puedeConfiguracion: z.boolean().default(false),
  puedeAdminSistema: z.boolean().default(false),
})

export const OperadorUpdateSchema = OperadorCreateSchema.partial().extend({
  id: z.string().min(1, 'ID requerido'),
})

// ============================================
// ESQUEMAS DE PESAJE CAMIONES
// ============================================

export const PesajeCamionCreateSchema = z.object({
  tropaId: z.string().optional().nullable(),
  clienteId: z.string().optional().nullable(),
  transportistaId: z.string().optional().nullable(),
  chofer: z.string().max(100).optional().nullable(),
  dominio: z.string().max(20).optional().nullable(),
  tipo: z.enum(['INGRESO', 'EGRESO']),
  concepto: z.string().max(100),
  cantidad: z.number().int().positive('Cantidad debe ser positiva'),
  pesoBruto: z.number().positive('Peso bruto requerido').optional().nullable(),
  pesoTara: z.number().min(0).optional().nullable(),
  pesoNeto: z.number().min(0).optional().nullable(),
  observaciones: z.string().max(500).optional().nullable(),
  operadorId: z.string().min(1, 'Operador requerido'),
})

export const PesajeCamionUpdateSchema = PesajeCamionCreateSchema.partial().extend({
  id: z.string().min(1, 'ID requerido'),
})

// ============================================
// ESQUEMAS DE ANIMALES
// ============================================

export const AnimalCreateSchema = z.object({
  tropaId: z.string().min(1, 'Tropa requerida'),
  caravana: z.string().max(50).optional().nullable(),
  peso: z.number().positive('Peso debe ser positivo').optional().nullable(),
  pesoMedio: z.number().positive().optional().nullable(),
  romaneo: z.number().int().positive().optional().nullable(),
  cuero: z.string().max(20).optional().nullable(),
  categoria: z.string().max(50).optional().nullable(),
  estado: z.enum(['EN_CORRAL', 'EN_FAENA', 'FAENADO', 'EN_CAMARA']).default('EN_CORRAL'),
})

export const AnimalUpdateSchema = AnimalCreateSchema.partial().extend({
  id: z.string().min(1, 'ID requerido'),
})

// ============================================
// ESQUEMAS DE TROPAS
// ============================================

export const TropaCreateSchema = z.object({
  numero: z.number().int().positive('Número de tropa requerido'),
  origen: z.string().max(100).optional().nullable(),
  propietario: z.string().max(100).optional().nullable(),
  clienteId: z.string().optional().nullable(),
  cantidad: z.number().int().min(0).default(0),
  pesoTotal: z.number().min(0).default(0),
  corralId: z.string().optional().nullable(),
  observaciones: z.string().max(500).optional().nullable(),
})

export const TropaUpdateSchema = TropaCreateSchema.partial().extend({
  id: z.string().min(1, 'ID requerido'),
})

// ============================================
// ESQUEMAS DE ROMANEO
// ============================================

export const RomaneoPesarSchema = z.object({
  animalId: z.string().min(1, 'ID de animal requerido'),
  peso: z.number().positive('Peso debe ser positivo'),
  media1: z.number().positive().optional().nullable(),
  media2: z.number().positive().optional().nullable(),
  operadorId: z.string().min(1, 'Operador requerido'),
})

export const RomaneoCrearSchema = z.object({
  tropaId: z.string().min(1, 'Tropa requerida'),
  fecha: z.string().or(z.date()),
  cantidad: z.number().int().positive('Cantidad requerida'),
  operadorId: z.string().min(1, 'Operador requerido'),
})

// ============================================
// ESQUEMAS DE CLIENTES
// ============================================

export const ClienteCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(200),
  cuit: z.string().max(20).optional().nullable(),
  direccion: z.string().max(200).optional().nullable(),
  telefono: z.string().max(50).optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable(),
  categoria: z.string().max(50).optional().nullable(),
  activo: z.boolean().default(true),
})

export const ClienteUpdateSchema = ClienteCreateSchema.partial().extend({
  id: z.string().min(1, 'ID requerido'),
})

// ============================================
// ESQUEMAS DE TRANSPORTISTAS
// ============================================

export const TransportistaCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(200),
  cuit: z.string().max(20).optional().nullable(),
  telefono: z.string().max(50).optional().nullable(),
  activo: z.boolean().default(true),
})

// ============================================
// ESQUEMAS DE PRODUCTOS/STOCK
// ============================================

export const ProductoCreateSchema = z.object({
  codigo: z.string().min(1, 'Código requerido').max(20),
  nombre: z.string().min(1, 'Nombre requerido').max(200),
  tipo: z.enum(['MEDIA', 'SUBPRODUCTO', 'MENUDENCIA', 'INSUMO']),
  unidad: z.string().max(20).default('kg'),
  precioKg: z.number().min(0).default(0),
  stockMinimo: z.number().min(0).default(0),
  camaraId: z.string().optional().nullable(),
})

export const IngresoCajonSchema = z.object({
  productoId: z.string().min(1, 'Producto requerido'),
  cantidad: z.number().positive('Cantidad requerida'),
  peso: z.number().positive('Peso requerido'),
  camaraId: z.string().min(1, 'Cámara requerida'),
  operadorId: z.string().min(1, 'Operador requerido'),
  observaciones: z.string().max(500).optional().nullable(),
})

// ============================================
// ESQUEMAS DE LISTA DE FAENA
// ============================================

export const ListaFaenaCreateSchema = z.object({
  fecha: z.string().or(z.date()),
  tropaId: z.string().min(1, 'Tropa requerida'),
  cantidad: z.number().int().positive('Cantidad requerida'),
  observaciones: z.string().max(500).optional().nullable(),
})

export const ListaFaenaAsignarSchema = z.object({
  listaId: z.string().min(1, 'Lista requerida'),
  animales: z.array(z.string()).min(1, 'Al menos un animal requerido'),
})

// ============================================
// ESQUEMAS DE FACTURACIÓN
// ============================================

export const FacturaCreateSchema = z.object({
  clienteId: z.string().min(1, 'Cliente requerido'),
  tipo: z.enum(['A', 'B', 'C']),
  puntoVenta: z.number().int().min(1).max(9999),
  fecha: z.string().or(z.date()),
  detalles: z.array(z.object({
    productoId: z.string().min(1, 'Producto requerido'),
    cantidad: z.number().positive('Cantidad requerida'),
    precioUnitario: z.number().positive('Precio requerido'),
  })).min(1, 'Al menos un detalle requerido'),
  observaciones: z.string().max(500).optional().nullable(),
})

// ============================================
// ESQUEMAS DE CONFIGURACIÓN
// ============================================

export const ConfigBalanzaSchema = z.object({
  puerto: z.string().min(1, 'Puerto requerido'),
  baudRate: z.number().int().min(1200).max(115200),
  dataBits: z.number().int().min(5).max(8),
  stopBits: z.number().int().min(1).max(2),
  parity: z.enum(['none', 'even', 'odd']),
  timeout: z.number().int().min(100).max(10000),
})

// ============================================
// ESQUEMAS DE MOVIMIENTOS
// ============================================

export const MovimientoAnimalSchema = z.object({
  animales: z.array(z.string()).min(1, 'Al menos un animal requerido'),
  destinoCorralId: z.string().optional().nullable(),
  destinoCamaraId: z.string().optional().nullable(),
  operadorId: z.string().min(1, 'Operador requerido'),
  observaciones: z.string().max(500).optional().nullable(),
})

export const MovimientoTropaSchema = z.object({
  tropaId: z.string().min(1, 'Tropa requerida'),
  corralDestinoId: z.string().min(1, 'Corral destino requerido'),
  operadorId: z.string().min(1, 'Operador requerido'),
})

// ============================================
// ESQUEMAS DE REPORTES
// ============================================

export const ReporteQuerySchema = z.object({
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  clienteId: z.string().optional(),
  tropaId: z.string().optional(),
  tipo: z.string().optional(),
  formato: z.enum(['json', 'pdf', 'excel']).default('json'),
})

// ============================================
// UTILIDADES DE VALIDACIÓN
// ============================================

import { NextResponse } from 'next/server'

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: NextResponse }

/**
 * Valida datos contra un esquema Zod y retorna respuesta de error si falla
 */
export function validateOrError<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    const errors = result.error.issues.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }))
    
    return {
      success: false,
      error: NextResponse.json(
        { 
          success: false, 
          error: 'Datos de entrada inválidos',
          details: errors 
        },
        { status: 400 }
      ),
    }
  }
  
  return { success: true, data: result.data }
}

/**
 * Tipo inferido para errores de validación
 */
export type ValidationError = {
  field: string
  message: string
}
