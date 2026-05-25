import { db } from './db'
import { createLogger } from '@/lib/logger'
const log = createLogger('lib.moneda')

// Tipos
export interface MonedaInfo {
  id: string
  codigo: string
  nombre: string
  simbolo: string
  esDefault: boolean
  activa: boolean
}

export interface CotizacionInfo {
  id: string
  monedaId: string
  moneda?: MonedaInfo
  fecha: Date
  compra: number
  venta: number
  fuente: string | null
}

// ==================== FORMATO DE MONEDA ====================

/**
 * Formatea un monto según la moneda especificada
 */
export function formatearMonto(
  monto: number,
  moneda: MonedaInfo | null | undefined,
  opciones?: {
    decimales?: number
    mostrarCodigo?: boolean
  }
): string {
  const decimales = opciones?.decimales ?? 2
  const mostrarCodigo = opciones?.mostrarCodigo ?? false

  if (!moneda) {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    }).format(monto)
  }

  // Formatear según la moneda
  let formato: string
  
  switch (moneda.codigo) {
    case 'USD':
      formato = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
      }).format(monto)
      break
    case 'EUR':
      formato = new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
      }).format(monto)
      break
    case 'ARS':
    default:
      formato = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
      }).format(monto)
  }

  // Reemplazar símbolo si es necesario
  if (moneda.simbolo && !formato.includes(moneda.simbolo)) {
    formato = `${moneda.simbolo} ${new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    }).format(monto)}`
  }

  if (mostrarCodigo) {
    formato += ` ${moneda.codigo}`
  }

  return formato
}

/**
 * Formatea un monto en ARS (pesos argentinos)
 */
export function formatearARS(monto: number, decimales: number = 2): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(monto)
}

/**
 * Formatea un monto en USD (dólares estadounidenses)
 */
export function formatearUSD(monto: number, decimales: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(monto)
}

/**
 * Formatea un monto en EUR (euros)
 */
export function formatearEUR(monto: number, decimales: number = 2): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(monto)
}

// ==================== CONVERSIÓN DE MONEDAS ====================

/**
 * Convierte un monto de una moneda a otra usando la cotización especificada
 */
export function convertirMoneda(
  monto: number,
  cotizacionOrigen: number,
  cotizacionDestino: number
): number {
  // Convertir a ARS primero (moneda base), luego a la moneda destino
  const montoEnARS = monto * cotizacionOrigen
  return montoEnARS / cotizacionDestino
}

/**
 * Convierte un monto de moneda extranjera a ARS
 */
export function convertirAARS(
  monto: number,
  cotizacionVenta: number
): number {
  return monto * cotizacionVenta
}

/**
 * Convierte un monto de ARS a moneda extranjera
 */
export function convertirDeARS(
  monto: number,
  cotizacionCompra: number
): number {
  return monto / cotizacionCompra
}

// ==================== BCRA API INTEGRATION ====================

const BCRA_API_URL = 'https://api.bcra.gob.ar/estadisticas/v2.0/datosvariable'

/**
 * Obtiene la cotización del dólar desde la API del BCRA
 */
export async function obtenerCotizacionBCRA(): Promise<{
  compra: number
  venta: number
  fecha: Date
} | null> {
  try {
    // ID 4 = Dólar Observado BCRA
    const response = await fetch(`${BCRA_API_URL}/4`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Error al obtener cotización BCRA:', response.status)
      return null
    }

    const data = await response.json()
    
    if (data.results && data.results.length > 0) {
      const ultimoValor = data.results[data.results.length - 1]
      const valor = parseFloat(ultimoValor.valor)
      
      return {
        compra: valor * 0.98, // Aproximación: compra es 2% menos
        venta: valor * 1.02,  // Aproximación: venta es 2% más
        fecha: new Date(ultimoValor.fecha),
      }
    }

    return null
  } catch (error) {
    console.error('Error al conectar con BCRA:', error)
    return null
  }
}

/**
 * Obtiene cotizaciones de múltiples fuentes
 */
export async function obtenerCotizacionesMultiples(): Promise<{
  bcra: { compra: number; venta: number; fecha: Date } | null
  blue: { compra: number; venta: number } | null
}> {
  const bcra = await obtenerCotizacionBCRA()
  
  // Intentar obtener dólar blue de una API alternativa
  let blue: { compra: number; venta: number } | null = null
  try {
    const response = await fetch('https://api.bluelytics.com.ar/v2/latest', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })
    
    if (response.ok) {
      const data = await response.json()
      blue = {
        compra: data.blue?.value_buy || 0,
        venta: data.blue?.value_sell || 0,
      }
    }
  } catch (error) {
    console.error('Error al obtener dólar blue:', error)
  }

  return { bcra, blue }
}

// ==================== BASE DE DATOS ====================

/**
 * Obtiene la moneda por defecto del sistema
 */
export async function obtenerMonedaDefault(): Promise<MonedaInfo | null> {
  const moneda = await db.moneda.findFirst({
    where: {
      esDefault: true,
      activa: true,
    },
  })

  return moneda
}

/**
 * Obtiene todas las monedas activas
 */
export async function obtenerMonedas(): Promise<MonedaInfo[]> {
  const monedas = await db.moneda.findMany({
    where: { activa: true },
    orderBy: { codigo: 'asc' },
  })

  return monedas
}

/**
 * Obtiene la cotización más reciente de una moneda
 */
export async function obtenerCotizacionActual(monedaId: string): Promise<CotizacionInfo | null> {
  const cotizacion = await db.cotizacion.findFirst({
    where: { monedaId },
    orderBy: { fecha: 'desc' },
    include: { moneda: true },
  })

  return cotizacion
}

/**
 * Obtiene las cotizaciones actuales de todas las monedas
 */
export async function obtenerTodasCotizacionesActuales(): Promise<Map<string, CotizacionInfo>> {
  const monedas = await db.moneda.findMany({
    where: { activa: true },
    include: {
      cotizaciones: {
        orderBy: { fecha: 'desc' },
        take: 1,
      },
    },
  })

  const cotizaciones = new Map<string, CotizacionInfo>()
  
  for (const moneda of monedas) {
    if (moneda.cotizaciones.length > 0) {
      const cot = moneda.cotizaciones[0]
      cotizaciones.set(moneda.codigo, {
        ...cot,
        moneda: {
          id: moneda.id,
          codigo: moneda.codigo,
          nombre: moneda.nombre,
          simbolo: moneda.simbolo,
          esDefault: moneda.esDefault,
          activa: moneda.activa,
        },
      })
    }
  }

  return cotizaciones
}

/**
 * Guarda una nueva cotización
 */
export async function guardarCotizacion(
  monedaId: string,
  compra: number,
  venta: number,
  fuente: string = 'MANUAL'
): Promise<CotizacionInfo> {
  const cotizacion = await db.cotizacion.create({
    data: {
      monedaId,
      compra,
      venta,
      fuente,
    },
    include: { moneda: true },
  })

  return cotizacion
}

/**
 * Actualiza o crea la cotización del día para una moneda
 */
export async function actualizarCotizacionDia(
  monedaId: string,
  compra: number,
  venta: number,
  fuente: string = 'MANUAL'
): Promise<CotizacionInfo> {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  // Buscar si ya existe una cotización de hoy
  const cotizacionExistente = await db.cotizacion.findFirst({
    where: {
      monedaId,
      fecha: {
        gte: hoy,
        lt: new Date(hoy.getTime() + 24 * 60 * 60 * 1000),
      },
    },
  })

  if (cotizacionExistente) {
    return db.cotizacion.update({
      where: { id: cotizacionExistente.id },
      data: { compra, venta, fuente },
      include: { moneda: true },
    })
  }

  return guardarCotizacion(monedaId, compra, venta, fuente)
}

// ==================== SEED DEFAULT CURRENCIES ====================

/**
 * Crea las monedas por defecto si no existen
 */
export async function seedMonedasDefault(): Promise<void> {
  const monedasExistentes = await db.moneda.count()

  if (monedasExistentes === 0) {
    await db.moneda.createMany({
      data: [
        {
          codigo: 'ARS',
          nombre: 'Peso Argentino',
          simbolo: '$',
          esDefault: true,
          activa: true,
        },
        {
          codigo: 'USD',
          nombre: 'Dólar Estadounidense',
          simbolo: 'US$',
          esDefault: false,
          activa: true,
        },
        {
          codigo: 'EUR',
          nombre: 'Euro',
          simbolo: '€',
          esDefault: false,
          activa: true,
        },
      ],
    })

    log.info('Monedas por defecto creadas: ARS, USD, EUR')
  }
}

// ==================== UTILIDADES ====================

/**
 * Obtiene el símbolo de una moneda por su código
 */
export function obtenerSimboloMoneda(codigo: string): string {
  const simbolos: Record<string, string> = {
    ARS: '$',
    USD: 'US$',
    EUR: '€',
  }
  return simbolos[codigo] || codigo
}

/**
 * Obtiene el nombre de una moneda por su código
 */
export function obtenerNombreMoneda(codigo: string): string {
  const nombres: Record<string, string> = {
    ARS: 'Peso Argentino',
    USD: 'Dólar Estadounidense',
    EUR: 'Euro',
  }
  return nombres[codigo] || codigo
}

/**
 * Valida si un código de moneda es válido
 */
export function esCodigoMonedaValido(codigo: string): boolean {
  return ['ARS', 'USD', 'EUR'].includes(codigo.toUpperCase())
}

/**
 * Parsea un monto string a número
 */
export function parsearMonto(valor: string): number {
  // Eliminar símbolos de moneda y espacios
  const limpio = valor.replace(/[^0-9.,-]/g, '')
  
  // Detectar formato (comas como separador de miles o decimales)
  const tienePunto = limpio.includes('.')
  const tieneComa = limpio.includes(',')
  
  if (tienePunto && tieneComa) {
    // Determinar cuál es el separador decimal
    const ultimaComa = limpio.lastIndexOf(',')
    const ultimoPunto = limpio.lastIndexOf('.')
    
    if (ultimaComa > ultimoPunto) {
      // Formato argentino: 1.234,56
      return parseFloat(limpio.replace(/\./g, '').replace(',', '.'))
    } else {
      // Formato inglés: 1,234.56
      return parseFloat(limpio.replace(/,/g, ''))
    }
  } else if (tieneComa) {
    // Asumir que la coma es decimal (formato argentino sin separador de miles)
    return parseFloat(limpio.replace(',', '.'))
  }
  
  return parseFloat(limpio)
}
