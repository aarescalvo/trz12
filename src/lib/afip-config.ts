// AFIP Configuration - Constantes y URLs para Facturación Electrónica
// Referencia: https://www.afip.gob.ar/ws/WSAA/WSAA.HTM

/**
 * URLs de los Web Services de AFIP
 */
export const AFIP_URLS = {
  // WSAA - Web Service de Autenticación y Autorización
  WSAA_TESTING: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
  WSAA_PRODUCTION: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
  
  // WSFEv1 - Web Service de Factura Electrónica
  WSFE_TESTING: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx',
  WSFE_PRODUCTION: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx',
  
  // WSCT - Cartera de Títulos (si se necesita en el futuro)
  WSCT_TESTING: 'https://wswhomo.afip.gov.ar/wsct/service.asmx',
  WSCT_PRODUCTION: 'https://servicios1.afip.gov.ar/wsct/service.asmx',
} as const

/**
 * Tipos de Comprobante AFIP
 * @see https://www.afip.gob.ar/ws/WSFEV1/WSFEV1.HTM
 */
export const TIPOS_COMPROBANTE = {
  // Facturas
  FACTURA_A: 1,
  NOTA_DEBITO_A: 2,
  NOTA_CREDITO_A: 3,
  FACTURA_B: 6,
  NOTA_DEBITO_B: 7,
  NOTA_CREDITO_B: 8,
  FACTURA_C: 11,
  NOTA_DEBITO_C: 12,
  NOTA_CREDITO_C: 13,
  
  // Facturas M (MiPyMEs)
  FACTURA_M: 51,
  NOTA_DEBITO_M: 52,
  NOTA_CREDITO_M: 53,
  
  // Facturas E (Exportación)
  FACTURA_E: 19,
  NOTA_DEBITO_E: 20,
  NOTA_CREDITO_E: 21,
  
  // Otros
  RECIBO_A: 81,
  RECIBO_B: 82,
  RECIBO_C: 83,
} as const

/**
 * Tipos de Documento AFIP
 */
export const TIPOS_DOCUMENTO = {
  DNI: 96,           // Documento Nacional de Identidad
  CUIT: 80,          // Clave Única de Identificación Tributaria
  CUIL: 86,          // Clave Única de Identificación Laboral
  PASAPORTE: 94,     // Pasaporte
  CI: 1,             // Cédula de Identidad
  LE: 2,             // Libreta de Enrolamiento
  LC: 3,             // Libreta Cívica
  SIN_IDENTIFICAR: 99, // Sin identificar (consumidor final)
} as const

/**
 * Monedas habilitadas por AFIP
 */
export const MONEDAS = {
  PESOS: 'PES',      // Pesos Argentinos
  DOLAR: 'DOL',      // Dólar Estadounidense
  EURO: '012',       // Euro
  REAL: '014',       // Real
  PESO_URUGUAYO: '015', // Peso Uruguayo
} as const

/**
 * Alícuotas IVA
 */
export const ALICUOTAS_IVA = {
  IVA_0: 0,          // 0%
  IVA_10_5: 4,       // 10.5%
  IVA_21: 5,         // 21%
  IVA_27: 6,         // 27%
  EXENTO: 1,         // Exento
  NO_GRAVADO: 2,     // No Gravado
} as const

/**
 * Conceptos de factura
 */
export const CONCEPTOS = {
  PRODUCTO: 1,           // Productos
  SERVICIO: 2,           // Servicios
  PRODUCTO_Y_SERVICIO: 3, // Productos y Servicios
} as const

/**
 * Tributos disponibles
 */
export const TRIBUTOS = {
  IMPUESTOS_NACIONALES: 1,
  IMPUESTOS_PROVINCIALES: 2,
  IMPUESTOS_MUNICIPALES: 3,
  IMPUESTOS_INTERNOS: 4,
  PERCEPCION_IVA: 5,
  PERCEPCION_IIBB: 6,
  PERCEPCION_GANANCIAS: 7,
  OTRAS_PERCEPCIONES: 8,
  OTRAS_PERCEPCIONES_NO_BCRA: 9,
} as const

/**
 * Tipos de IVA con descripción
 */
export const TIPOS_IVA_DESCRIPCION: Record<number, { descripcion: string; alicuota: number }> = {
  [ALICUOTAS_IVA.IVA_0]: { descripcion: '0%', alicuota: 0 },
  [ALICUOTAS_IVA.IVA_10_5]: { descripcion: '10.5%', alicuota: 10.5 },
  [ALICUOTAS_IVA.IVA_21]: { descripcion: '21%', alicuota: 21 },
  [ALICUOTAS_IVA.IVA_27]: { descripcion: '27%', alicuota: 27 },
  [ALICUOTAS_IVA.EXENTO]: { descripcion: 'Exento', alicuota: 0 },
  [ALICUOTAS_IVA.NO_GRAVADO]: { descripcion: 'No Gravado', alicuota: 0 },
}

/**
 * Configuración por defecto
 */
export const AFIP_DEFAULTS = {
  // Tiempo de vida del token en segundos (12 horas)
  TOKEN_TTL: 43200,
  
  // Margen de seguridad para renovación de token (10 minutos)
  TOKEN_REFRESH_MARGIN: 600,
  
  // Tiempo de espera para requests HTTP (30 segundos)
  REQUEST_TIMEOUT: 30000,
  
  // Máximo de reintentos para errores de red
  MAX_RETRIES: 3,
  
  // Delay entre reintentos (en milisegundos)
  RETRY_DELAY: 1000,
  
  // Moneda por defecto
  MONEDA_DEFAULT: 'PES',
  
  // Cotización por defecto para pesos
  COTIZACION_DEFAULT: 1,
  
  // Punto de venta por defecto
  PUNTO_VENTA_DEFAULT: 1,
  
  // Ambiente por defecto
  AMBIENTE_DEFAULT: 'testing' as const,
} as const

/**
 * Errores comunes de AFIP
 */
export const ERRORES_AFIP: Record<number, string> = {
  10001: 'Cuit no autorizado a usar este webservice',
  10002: 'Cuit no registrado en el padron de contribuyentes',
  10003: 'El certificado no corresponde al CUIT informado',
  10004: 'Error al verificar la firma del TRA',
  10005: 'El TRA ya fue utilizado anteriormente',
  10006: 'El TRA ha expirado',
  10007: 'Error al generar el token',
  10008: 'Error al conectar con la base de datos',
  10009: 'Error interno del servidor',
  10010: 'El token ha expirado',
  10011: 'El token es inválido',
  10012: 'El token no corresponde al CUIT informado',
  10013: 'El token no corresponde al servicio solicitado',
  10014: 'Error al validar el token',
  10015: 'Error al validar el sign',
  10016: 'El servicio solicitado no existe',
  10017: 'El servicio solicitado no está habilitado',
  10018: 'El servicio solicitado está en mantenimiento',
  10019: 'Error al procesar la solicitud',
  10020: 'Error al generar la respuesta',
  
  // Errores de facturación
  10024: 'El número de comprobante ya fue utilizado',
  10025: 'El número de comprobante no es correlativo',
  10026: 'El punto de venta no está habilitado',
  10027: 'El tipo de comprobante no está habilitado',
  10028: 'El importe total no coincide con la suma de los conceptos',
  10029: 'El importe de IVA no coincide con el cálculo esperado',
  10030: 'El número de documento del receptor es inválido',
  10031: 'La fecha del comprobante es inválida',
  10032: 'El comprobante está fuera del rango permitido',
  10033: 'El receptor no puede recibir facturas del tipo solicitado',
  10034: 'El certificado está vencido',
  10035: 'El certificado está revocado',
}

/**
 * Códigos de observaciones comunes
 */
export const OBSERVACIONES_AFIP: Record<number, string> = {
  1: 'Comprobante aceptado sin observaciones',
  2: 'El comprobante fue aceptado pero tiene observaciones',
  3: 'El comprobante fue rechazado',
  4: 'El comprobante está pendiente de autorización',
  5: 'El comprobante fue anulado',
  6: 'El comprobante fue modificado',
  7: 'El comprobante está duplicado',
  8: 'El comprobante tiene errores de validación',
  9: 'El comprobante tiene errores de negocio',
  10: 'El comprobante tiene errores de formato',
}

/**
 * Zonas horarias para AFIP (Argentina)
 */
export const AFIP_TIMEZONE = 'America/Argentina/Buenos_Aires'

/**
 * Namespace SOAP para los web services
 */
export const SOAP_NAMESPACES = {
  WSAA: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
  WSFE: 'http://ar.gov.afip.dif.FEV1/',
  SOAP_ENVELOPE: 'http://schemas.xmlsoap.org/soap/envelope/',
} as const

/**
 * Versión del cliente AFIP
 */
export const AFIP_CLIENT_VERSION = '1.0.0'

/**
 * User Agent para requests HTTP
 */
export const AFIP_USER_AGENT = `AFIP-WS-Client/${AFIP_CLIENT_VERSION}`

/**
 * Obtiene la URL del WSAA según el ambiente
 */
export function getWSAAUrl(ambiente: 'testing' | 'production'): string {
  return ambiente === 'testing' 
    ? AFIP_URLS.WSAA_TESTING 
    : AFIP_URLS.WSAA_PRODUCTION
}

/**
 * Obtiene la URL del WSFE según el ambiente
 */
export function getWSFEUrl(ambiente: 'testing' | 'production'): string {
  return ambiente === 'testing' 
    ? AFIP_URLS.WSFE_TESTING 
    : AFIP_URLS.WSFE_PRODUCTION
}

/**
 * Obtiene la descripción de un tipo de comprobante
 */
export function getDescripcionTipoComprobante(tipo: number): string {
  const descripciones: Record<number, string> = {
    [TIPOS_COMPROBANTE.FACTURA_A]: 'Factura A',
    [TIPOS_COMPROBANTE.NOTA_DEBITO_A]: 'Nota de Débito A',
    [TIPOS_COMPROBANTE.NOTA_CREDITO_A]: 'Nota de Crédito A',
    [TIPOS_COMPROBANTE.FACTURA_B]: 'Factura B',
    [TIPOS_COMPROBANTE.NOTA_DEBITO_B]: 'Nota de Débito B',
    [TIPOS_COMPROBANTE.NOTA_CREDITO_B]: 'Nota de Crédito B',
    [TIPOS_COMPROBANTE.FACTURA_C]: 'Factura C',
    [TIPOS_COMPROBANTE.NOTA_DEBITO_C]: 'Nota de Débito C',
    [TIPOS_COMPROBANTE.NOTA_CREDITO_C]: 'Nota de Crédito C',
    [TIPOS_COMPROBANTE.FACTURA_M]: 'Factura M',
    [TIPOS_COMPROBANTE.NOTA_DEBITO_M]: 'Nota de Débito M',
    [TIPOS_COMPROBANTE.NOTA_CREDITO_M]: 'Nota de Crédito M',
    [TIPOS_COMPROBANTE.FACTURA_E]: 'Factura E',
    [TIPOS_COMPROBANTE.NOTA_DEBITO_E]: 'Nota de Débito E',
    [TIPOS_COMPROBANTE.NOTA_CREDITO_E]: 'Nota de Crédito E',
  }
  return descripciones[tipo] || `Tipo ${tipo}`
}

/**
 * Obtiene la descripción de un tipo de documento
 */
export function getDescripcionTipoDocumento(tipo: number): string {
  const descripciones: Record<number, string> = {
    [TIPOS_DOCUMENTO.DNI]: 'DNI',
    [TIPOS_DOCUMENTO.CUIT]: 'CUIT',
    [TIPOS_DOCUMENTO.CUIL]: 'CUIL',
    [TIPOS_DOCUMENTO.PASAPORTE]: 'Pasaporte',
    [TIPOS_DOCUMENTO.CI]: 'Cédula de Identidad',
    [TIPOS_DOCUMENTO.LE]: 'Libreta de Enrolamiento',
    [TIPOS_DOCUMENTO.LC]: 'Libreta Cívica',
    [TIPOS_DOCUMENTO.SIN_IDENTIFICAR]: 'Sin identificar',
  }
  return descripciones[tipo] || `Tipo ${tipo}`
}

/**
 * Determina si un tipo de comprobante requiere CUIT del receptor
 */
export function requiereCUITReceptor(tipoComprobante: number): boolean {
  // Facturas A y M requieren CUIT del receptor
  const tiposQueRequierenCUIT = [
    TIPOS_COMPROBANTE.FACTURA_A,
    TIPOS_COMPROBANTE.NOTA_DEBITO_A,
    TIPOS_COMPROBANTE.NOTA_CREDITO_A,
    TIPOS_COMPROBANTE.FACTURA_M,
    TIPOS_COMPROBANTE.NOTA_DEBITO_M,
    TIPOS_COMPROBANTE.NOTA_CREDITO_M,
  ]
  return tiposQueRequierenCUIT.includes(tipoComprobante as typeof tiposQueRequierenCUIT[number])
}

/**
 * Determina si un tipo de comprobante discrimina IVA
 */
export function discriminaIVA(tipoComprobante: number): boolean {
  // Facturas A y M discriminan IVA
  const tiposQueDiscriminan = [
    TIPOS_COMPROBANTE.FACTURA_A,
    TIPOS_COMPROBANTE.NOTA_DEBITO_A,
    TIPOS_COMPROBANTE.NOTA_CREDITO_A,
    TIPOS_COMPROBANTE.FACTURA_M,
    TIPOS_COMPROBANTE.NOTA_DEBITO_M,
    TIPOS_COMPROBANTE.NOTA_CREDITO_M,
  ]
  return tiposQueDiscriminan.includes(tipoComprobante as typeof tiposQueDiscriminan[number])
}

/**
 * Configuración completa de AFIP
 */
export const AFIP_CONFIG = {
  URLs: AFIP_URLS,
  TiposComprobante: TIPOS_COMPROBANTE,
  TiposDocumento: TIPOS_DOCUMENTO,
  Monedas: MONEDAS,
  AlicuotasIVA: ALICUOTAS_IVA,
  Conceptos: CONCEPTOS,
  Tributos: TRIBUTOS,
  Defaults: AFIP_DEFAULTS,
  Errores: ERRORES_AFIP,
  Observaciones: OBSERVACIONES_AFIP,
  Timezone: AFIP_TIMEZONE,
  Namespaces: SOAP_NAMESPACES,
  Version: AFIP_CLIENT_VERSION,
  UserAgent: AFIP_USER_AGENT,
}
