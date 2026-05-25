// Tipos para el módulo de Auditoría por Operador

export type TipoAccion = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ERROR' | 'VIEW'

export interface AuditoriaItem {
  id: string
  operadorId: string | null
  operador?: OperadorInfo
  modulo: string
  accion: TipoAccion
  entidad: string
  entidadId?: string
  descripcion: string
  datosAntes?: string  // JSON string
  datosDespues?: string  // JSON string
  fecha: string
  ip?: string
}

export interface OperadorInfo {
  id: string
  nombre: string
  usuario: string
  rol: string
}

export interface OperadorStats {
  operadorId: string
  operadorNombre: string
  totalAcciones: number
  creates: number
  updates: number
  deletes: number
  logins: number
  errores: number
  ultimoAcceso: string
}

export interface FiltrosAuditoria {
  operadorId?: string
  modulo?: string
  accion?: string
  fechaDesde?: string
  fechaHasta?: string
  busqueda?: string
}

export interface PaginacionAuditoria {
  pagina: number
  limite: number
  total: number
  paginas: number
}

export interface AuditoriaResponse {
  success: boolean
  data: AuditoriaItem[]
  paginacion?: PaginacionAuditoria
  error?: string
}

export interface ModuloInfo {
  id: string
  nombre: string
  descripcion?: string
}

// Módulos del sistema
export const MODULOS_SISTEMA: ModuloInfo[] = [
  { id: 'PESAJE_CAMIONES', nombre: 'Pesaje Camiones' },
  { id: 'PESAJE_INDIVIDUAL', nombre: 'Pesaje Individual' },
  { id: 'MOVIMIENTO_HACIENDA', nombre: 'Movimiento Hacienda' },
  { id: 'LISTA_FAENA', nombre: 'Lista de Faena' },
  { id: 'INGRESO_CAJON', nombre: 'Ingreso a Cajón' },
  { id: 'ROMANEO', nombre: 'Romaneo' },
  { id: 'VB_ROMANEO', nombre: 'VB Romaneo' },
  { id: 'MENUDENCIAS', nombre: 'Menudencias' },
  { id: 'CUEROS', nombre: 'Cueros' },
  { id: 'RENDERING', nombre: 'Rendering' },
  { id: 'CUARTEO', nombre: 'Cuarteo' },
  { id: 'DESPOSTADA', nombre: 'Despostada' },
  { id: 'EMPAQUE', nombre: 'Empaque' },
  { id: 'STOCK', nombre: 'Stock' },
  { id: 'MOVIMIENTO_CAMARAS', nombre: 'Movimiento Cámaras' },
  { id: 'DESPACHOS', nombre: 'Despachos' },
  { id: 'EXPEDICION', nombre: 'Expedición' },
  { id: 'FACTURACION', nombre: 'Facturación' },
  { id: 'CCIR', nombre: 'CCIR' },
  { id: 'DECLARACION_JURADA', nombre: 'Declaración Jurada' },
  { id: 'REPORTES', nombre: 'Reportes' },
  { id: 'REPORTES_SENASA', nombre: 'Reportes SENASA' },
  { id: 'CONFIGURACION', nombre: 'Configuración' },
  { id: 'OPERADORES', nombre: 'Operadores' },
  { id: 'CLIENTES', nombre: 'Clientes' },
  { id: 'PRODUCTOS', nombre: 'Productos' },
  { id: 'INSUMOS', nombre: 'Insumos' },
  { id: 'CAMARAS', nombre: 'Cámaras' },
  { id: 'CORRALES', nombre: 'Corrales' },
  { id: 'TROPAS', nombre: 'Tropas' },
  { id: 'ANIMALES', nombre: 'Animales' },
  { id: 'AUTH', nombre: 'Autenticación' },
  { id: 'SISTEMA', nombre: 'Sistema' },
]

// Colores por tipo de acción
export const ACCION_CONFIG: Record<TipoAccion, { color: string; bgColor: string; label: string; icon: string }> = {
  CREATE: { 
    color: 'text-green-700', 
    bgColor: 'bg-green-100', 
    label: 'Creación',
    icon: 'CheckCircle'
  },
  UPDATE: { 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-100', 
    label: 'Actualización',
    icon: 'TrendingUp'
  },
  DELETE: { 
    color: 'text-red-700', 
    bgColor: 'bg-red-100', 
    label: 'Eliminación',
    icon: 'XCircle'
  },
  LOGIN: { 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-100', 
    label: 'Inicio sesión',
    icon: 'User'
  },
  LOGOUT: { 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-100', 
    label: 'Cierre sesión',
    icon: 'User'
  },
  ERROR: { 
    color: 'text-red-700', 
    bgColor: 'bg-red-100', 
    label: 'Error',
    icon: 'AlertTriangle'
  },
  VIEW: { 
    color: 'text-stone-700', 
    bgColor: 'bg-stone-100', 
    label: 'Visualización',
    icon: 'Eye'
  },
}
