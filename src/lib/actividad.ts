/**
 * Helper para registrar actividades de operadores
 * Facilita el registro de movimientos en cualquier parte del sistema
 */

import { db } from '@/lib/db'

export type TipoActividad = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'CREAR' 
  | 'MODIFICAR' 
  | 'ELIMINAR' 
  | 'VER' 
  | 'IMPRIMIR' 
  | 'DESPACHAR' 
  | 'RECIBIR'
  | 'PESAR'
  | 'FACTURAR'
  | 'ANULAR'
  | 'EXPORTAR'
  | 'IMPORTAR'
  | 'CONFIGURAR'

export type ModuloActividad = 
  | 'auth'
  | 'dashboard'
  | 'pesajeCamiones'
  | 'pesajeIndividual'
  | 'movimientoHacienda'
  | 'listaFaena'
  | 'ingresoCajon'
  | 'romaneo'
  | 'vbRomaneo'
  | 'movimientoCamaras'
  | 'expedicion'
  | 'despachos'
  | 'cuarteo'
  | 'ingresoDespostada'
  | 'movimientosDespostada'
  | 'cortesDespostada'
  | 'empaque'
  | 'menudencias'
  | 'cueros'
  | 'grasa'
  | 'desperdicios'
  | 'fondoDigestor'
  | 'stock'
  | 'stocksCorrales'
  | 'planilla01'
  | 'rindesTropa'
  | 'busquedaFiltro'
  | 'reportesSenasa'
  | 'facturacion'
  | 'insumos'
  | 'stocksInsumos'
  | 'configRotulos'
  | 'configInsumos'
  | 'configUsuarios'
  | 'configCodigobarras'
  | 'configBalanzas'
  | 'configOperadores'
  | 'configProductos'
  | 'configSubproductos'
  | 'configuracion'
  | 'controlVencimientos'
  | 'fifo'
  | 'sistema'

interface RegistrarActividadParams {
  operadorId: string
  tipo: TipoActividad
  modulo: ModuloActividad
  descripcion: string
  entidad?: string
  entidadId?: string
  datos?: Record<string, unknown>
  ip?: string
  userAgent?: string
  sessionId?: string
}

/**
 * Registra una actividad de operador en la base de datos
 */
export async function registrarActividad(params: RegistrarActividadParams): Promise<void> {
  try {
    await db.actividadOperador.create({
      data: {
        operadorId: params.operadorId,
        tipo: params.tipo,
        modulo: params.modulo,
        descripcion: params.descripcion,
        entidad: params.entidad,
        entidadId: params.entidadId,
        datos: params.datos ? JSON.stringify(params.datos) : null,
        ip: params.ip,
        userAgent: params.userAgent,
        sessionId: params.sessionId
      }
    })
  } catch (error) {
    console.error('Error al registrar actividad:', error)
    // No lanzamos error para no interrumpir el flujo principal
  }
}

/**
 * Registra un login exitoso
 */
export async function registrarLogin(
  operadorId: string, 
  ip?: string, 
  userAgent?: string
): Promise<void> {
  await registrarActividad({
    operadorId,
    tipo: 'LOGIN',
    modulo: 'auth',
    descripcion: 'Inicio de sesión exitoso',
    ip,
    userAgent
  })
}

/**
 * Registra un logout
 */
export async function registrarLogout(
  operadorId: string, 
  ip?: string,
  duracionSegundos?: number
): Promise<void> {
  await registrarActividad({
    operadorId,
    tipo: 'LOGOUT',
    modulo: 'auth',
    descripcion: 'Cierre de sesión',
    ip,
    datos: duracionSegundos ? { duracionSegundos } : undefined
  })
}

/**
 * Registra la creación de una entidad
 */
export async function registrarCreacion(
  operadorId: string,
  modulo: ModuloActividad,
  entidad: string,
  entidadId: string,
  descripcion: string,
  datos?: Record<string, unknown>
): Promise<void> {
  await registrarActividad({
    operadorId,
    tipo: 'CREAR',
    modulo,
    descripcion,
    entidad,
    entidadId,
    datos
  })
}

/**
 * Registra la modificación de una entidad
 */
export async function registrarModificacion(
  operadorId: string,
  modulo: ModuloActividad,
  entidad: string,
  entidadId: string,
  descripcion: string,
  datosAntes?: Record<string, unknown>,
  datosDespues?: Record<string, unknown>
): Promise<void> {
  await registrarActividad({
    operadorId,
    tipo: 'MODIFICAR',
    modulo,
    descripcion,
    entidad,
    entidadId,
    datos: { antes: datosAntes, despues: datosDespues }
  })
}

/**
 * Registra la eliminación de una entidad
 */
export async function registrarEliminacion(
  operadorId: string,
  modulo: ModuloActividad,
  entidad: string,
  entidadId: string,
  descripcion: string,
  datosEliminados?: Record<string, unknown>
): Promise<void> {
  await registrarActividad({
    operadorId,
    tipo: 'ELIMINAR',
    modulo,
    descripcion,
    entidad,
    entidadId,
    datos: { eliminado: datosEliminados }
  })
}

/**
 * Registra una impresión
 */
export async function registrarImpresion(
  operadorId: string,
  modulo: ModuloActividad,
  descripcion: string,
  entidad?: string,
  entidadId?: string
): Promise<void> {
  await registrarActividad({
    operadorId,
    tipo: 'IMPRIMIR',
    modulo,
    descripcion,
    entidad,
    entidadId
  })
}

/**
 * Registra un despacho
 */
export async function registrarDespacho(
  operadorId: string,
  descripcion: string,
  entidadId: string,
  datos?: Record<string, unknown>
): Promise<void> {
  await registrarActividad({
    operadorId,
    tipo: 'DESPACHAR',
    modulo: 'despachos',
    descripcion,
    entidad: 'Despacho',
    entidadId,
    datos
  })
}

/**
 * Registra una facturación
 */
export async function registrarFacturacion(
  operadorId: string,
  descripcion: string,
  entidadId: string,
  datos?: Record<string, unknown>
): Promise<void> {
  await registrarActividad({
    operadorId,
    tipo: 'FACTURAR',
    modulo: 'facturacion',
    descripcion,
    entidad: 'Factura',
    entidadId,
    datos
  })
}

/**
 * Registra una anulación
 */
export async function registrarAnulacion(
  operadorId: string,
  modulo: ModuloActividad,
  entidad: string,
  entidadId: string,
  descripcion: string,
  motivo?: string
): Promise<void> {
  await registrarActividad({
    operadorId,
    tipo: 'ANULAR',
    modulo,
    descripcion,
    entidad,
    entidadId,
    datos: { motivo }
  })
}
