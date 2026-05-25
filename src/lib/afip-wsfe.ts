// AFIP WSFEv1 - Web Service de Factura Electrónica
// Referencia: https://www.afip.gob.ar/ws/WSFEV1/WSFEV1.HTM

import { obtenerTokenAcceso, getConfiguracionAFIP, WSAAConfig } from './afip-wsaa'
import { createLogger } from '@/lib/logger'
const log = createLogger('lib.afip-wsfe')

// URLs de AFIP según ambiente
export const WSFE_URLS = {
  testing: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx',
  production: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'
}

// Tipos de comprobante AFIP
export const TIPO_COMPROBANTE = {
  FACTURA_A: 1,
  NOTA_DEBITO_A: 2,
  NOTA_CREDITO_A: 3,
  FACTURA_B: 6,
  NOTA_DEBITO_B: 7,
  NOTA_CREDITO_B: 8,
  FACTURA_C: 11,
  NOTA_DEBITO_C: 12,
  NOTA_CREDITO_C: 13,
  FACTURA_M: 51,
  NOTA_DEBITO_M: 52,
  NOTA_CREDITO_M: 53,
} as const

// Tipos de documento
export const TIPO_DOCUMENTO = {
  CUIT: 80,
  CUIL: 86,
  DNI: 96,
  PASAPORTE: 94,
  CI: 1,
  LE: 2,
  LC: 3,
  SIN_IDENTIFICAR: 99,
} as const

// Monedas
export const MONEDA = {
  PESOS: 'PES',
  DOLAR: 'DOL',
  EURO: 'EUR',
} as const

// Alicuotas IVA
export const ALICUOTA_IVA = {
  CERO: 0,        // 0%
  DIEZ_CINCO: 4,  // 10.5%
  VEINTIUNO: 5,   // 21%
  VEINTISIETE: 6, // 27%
  CERO_EXENTO: 1, // Exento
  NO_GRAVADO: 2,  // No gravado
} as const

// Conceptos
export const CONCEPTO = {
  PRODUCTO: 1,
  SERVICIO: 2,
  PRODUCTO_Y_SERVICIO: 3,
} as const

export interface FEHeader {
  cuit: string
  puntoVenta: number
}

export interface FERequest {
  tipoComprobante: number
  puntoVenta: number
  numeroComprobante?: number // Si no se proporciona, se calcula automáticamente
  fecha: string // Formato: YYYYMMDD
  concepto: number // 1=Productos, 2=Servicios, 3=Productos y Servicios
  tipoDocumento: number
  numeroDocumento: string
  razonSocial?: string
  domicilio?: string
  
  // Importes
  importeTotal: number
  importeGravado: number
  importeNoGravado: number
  importeExento: number
  importeIVA: number
  importeTributos: number
  
  // Fechas de servicio (si concepto = 2 o 3)
  fechaServicioDesde?: string
  fechaServicioHasta?: string
  fechaVencimientoPago?: string
  
  // Moneda
  codigoMoneda: string
  cotizacionMoneda: number
  
  // IVA
  ivas: {
    id: number      // ID de alícuota
    baseImp: number // Base imponible
    importe: number // Importe de IVA
  }[]
  
  // Tributos
  tributos?: {
    id: number
    desc: string
    baseImp: number
    alic: number
    importe: number
  }[]
  
  // Opcionales
  opcionales?: {
    id: number
    valor: string
  }[]
  
  // Comprobantes asociados (para notas de crédito/débito)
  comprobantesAsociados?: {
    tipo: number
    ptoVta: number
    nro: number
  }[]
}

export interface FEResponse {
  success: boolean
  cae: string
  caeVencimiento: Date
  numeroComprobante: number
  errores: FEErr[]
  observaciones: FEObs[]
}

export interface FEErr {
  code: number
  msg: string
}

export interface FEObs {
  code: number
  msg: string
}

// Cache para tipos de AFIP
const tiposCache = {
  comprobantes: [] as { id: number; descripcion: string }[],
  documentos: [] as { id: number; descripcion: string }[],
  ivas: [] as { id: number; descripcion: string; importeMinimo?: number }[],
  monedas: [] as { id: string; descripcion: string }[],
  tributos: [] as { id: number; descripcion: string }[],
  paises: [] as { id: string; descripcion: string }[],
  lastUpdate: new Date(0)
}

/**
 * Crea el XML SOAP para llamar a WSFE
 */
function crearSOAPEnvelope(method: string, params: Record<string, unknown>): string {
  let paramsXML = ''

  function objectToXML(obj: unknown, indent: string = ''): string {
    if (obj === null || obj === undefined) return ''
    
    if (Array.isArray(obj)) {
      return obj.map(item => objectToXML(item, indent)).join('\n')
    }

    if (typeof obj === 'object') {
      const entries = Object.entries(obj as Record<string, unknown>)
      return entries.map(([key, value]) => {
        if (key.startsWith('@')) return ''
        if (value === undefined || value === null) return ''
        if (typeof value === 'object' && value !== null) {
          return `${indent}<${key}>\n${objectToXML(value, indent + '  ')}${indent}</${key}>`
        }
        return `${indent}<${key}>${value}</${key}>`
      }).join('\n')
    }

    return `${indent}${obj}`
  }

  paramsXML = objectToXML(params, '        ')

  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsfe="http://ar.gov.afip.dif.FEV1/">
  <soapenv:Header/>
  <soapenv:Body>
    <wsfe:${method}>
${paramsXML}
    </wsfe:${method}>
  </soapenv:Body>
</soapenv:Envelope>`
}

/**
 * Parsea la respuesta XML de AFIP
 */
function parsearRespuestaXML(xml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  // Extraer errores
  const errores: FEErr[] = []
  const errRegex = /<Err>\s*<Code>(\d+)<\/Code>\s*<Msg>([^<]*)<\/Msg>\s*<\/Err>/g
  let match
  while ((match = errRegex.exec(xml)) !== null) {
    errores.push({ code: parseInt(match[1]), msg: match[2] })
  }
  if (errores.length > 0) result.errores = errores

  // Extraer observaciones
  const observaciones: FEObs[] = []
  const obsRegex = /<Obs>\s*<Code>(\d+)<\/Code>\s*<Msg>([^<]*)<\/Msg>\s*<\/Obs>/g
  while ((match = obsRegex.exec(xml)) !== null) {
    observaciones.push({ code: parseInt(match[1]), msg: match[2] })
  }
  if (observaciones.length > 0) result.observaciones = observaciones

  // Extraer CAE
  const caeMatch = xml.match(/<CAE>([^<]+)<\/CAE>/)
  if (caeMatch) result.cae = caeMatch[1]

  // Extraer fecha vencimiento CAE
  const caeVencMatch = xml.match(/<CAEFchVto>([^<]+)<\/CAEFchVto>/)
  if (caeVencMatch) {
    // Convertir formato YYYYMMDD a Date
    const fecha = caeVencMatch[1]
    result.caeVencimiento = new Date(
      parseInt(fecha.substring(0, 4)),
      parseInt(fecha.substring(4, 6)) - 1,
      parseInt(fecha.substring(6, 8))
    )
  }

  // Extraer número de comprobante
  const nroCbteMatch = xml.match(/<CbteDesde>(\d+)<\/CbteDesde>/)
  if (nroCbteMatch) result.numeroComprobante = parseInt(nroCbteMatch[1])

  // Extraer cotización
  const cotizMatch = xml.match(/<MonCotiz>([^<]+)<\/MonCotiz>/)
  if (cotizMatch) result.cotizacion = parseFloat(cotizMatch[1])

  // Extraer último número
  const ultNroMatch = xml.match(/<CbteNro>(\d+)<\/CbteNro>/)
  if (ultNroMatch) result.ultimoNumero = parseInt(ultNroMatch[1])

  // Extraer resultados de FEParamGetTipos
  const tiposRegex = /<FETipo([A-Za-z]+)>\s*<Id>([^<]+)<\/Id>\s*<Desc>([^<]*)<\/Desc>/g
  const tiposMatches = [...xml.matchAll(tiposRegex)]
  if (tiposMatches.length > 0) {
    const tipoKey = `tipos${tiposMatches[0][1]}`
    result[tipoKey] = tiposMatches.map(m => ({
      id: isNaN(parseInt(m[2])) ? m[2] : parseInt(m[2]),
      descripcion: m[3]
    }))
  }

  return result
}

/**
 * Realiza una llamada al WSFE
 */
async function llamarWSFE(
  method: string,
  params: Record<string, unknown>,
  config?: WSAAConfig
): Promise<Record<string, unknown>> {
  const cfg = config || await getConfiguracionAFIP()
  if (!cfg) throw new Error('Configuración AFIP no disponible')

  const url = WSFE_URLS[cfg.ambiente]

  // Obtener token de acceso
  const token = await obtenerTokenAcceso('wsfe', cfg)

  // Agregar credenciales a los parámetros
  const paramsWithAuth = {
    Auth: {
      Token: token.token,
      Sign: token.sign,
      Cuit: cfg.cuit
    },
    ...params
  }

  // Crear envelope SOAP
  const envelope = crearSOAPEnvelope(method, paramsWithAuth)

  log.info(`[WSFE] Llamando a ${method}...`)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `http://ar.gov.afip.dif.FEV1/${method}`,
        'User-Agent': 'AFIP-WSFE-Client/1.0'
      },
      body: envelope
    })

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`)
    }

    const responseText = await response.text()

    // Verificar fault
    if (responseText.includes('<faultstring>')) {
      const faultMatch = responseText.match(/<faultstring>([^<]+)<\/faultstring>/)
      throw new Error(faultMatch ? faultMatch[1] : 'Error SOAP de AFIP')
    }

    return parsearRespuestaXML(responseText)
  } catch (error) {
    console.error(`[WSFE] Error en ${method}:`, error)
    throw error
  }
}

/**
 * Verifica el estado del servicio (FEDummy)
 */
export async function FEDummy(config?: WSAAConfig): Promise<{
  appServer: string
  dbServer: string
  authServer: string
}> {
  const cfg = config || await getConfiguracionAFIP()
  if (!cfg) throw new Error('Configuración AFIP no disponible')

  const url = WSFE_URLS[cfg.ambiente]

  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsfe="http://ar.gov.afip.dif.FEV1/">
  <soapenv:Header/>
  <soapenv:Body>
    <wsfe:FEDummy/>
  </soapenv:Body>
</soapenv:Envelope>`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': 'http://ar.gov.afip.dif.FEV1/FEDummy'
    },
    body: envelope
  })

  const responseText = await response.text()

  const appServerMatch = responseText.match(/<AppServer>([^<]+)<\/AppServer>/)
  const dbServerMatch = responseText.match(/<DbServer>([^<]+)<\/DbServer>/)
  const authServerMatch = responseText.match(/<AuthServer>([^<]+)<\/AuthServer>/)

  return {
    appServer: appServerMatch ? appServerMatch[1] : 'ERROR',
    dbServer: dbServerMatch ? dbServerMatch[1] : 'ERROR',
    authServer: authServerMatch ? authServerMatch[1] : 'ERROR'
  }
}

/**
 * Obtiene la cotización de una moneda
 */
export async function FEParamGetCotizacion(
  codigoMoneda: string = 'PES',
  config?: WSAAConfig
): Promise<{ moneda: string; cotizacion: number; fecha: Date }> {
  const result = await llamarWSFE('FEParamGetCotizacion', {
    MonId: codigoMoneda
  }, config)

  return {
    moneda: codigoMoneda,
    cotizacion: result.cotizacion as number || 1,
    fecha: new Date()
  }
}

/**
 * Consulta el último número de comprobante autorizado
 */
export async function FECompUltimoAutorizado(
  tipoComprobante: number,
  puntoVenta: number,
  config?: WSAAConfig
): Promise<number> {
  const result = await llamarWSFE('FECompUltimoAutorizado', {
    PtoVta: puntoVenta,
    CbteTipo: tipoComprobante
  }, config)

  return result.ultimoNumero as number || 0
}

/**
 * Solicita CAE para un comprobante
 */
export async function FECAESolicitar(
  request: FERequest,
  config?: WSAAConfig
): Promise<FEResponse> {
  const cfg = config || await getConfiguracionAFIP()
  if (!cfg) throw new Error('Configuración AFIP no disponible')

  // Obtener próximo número de comprobante si no se proporciona
  let proximoNumero = request.numeroComprobante
  if (!proximoNumero) {
    const ultimoNumero = await FECompUltimoAutorizado(
      request.tipoComprobante,
      request.puntoVenta,
      cfg
    )
    proximoNumero = ultimoNumero + 1
  }

  // Construir estructura de comprobante
  const params = {
    FeCAEReq: {
      FeCabReq: {
        CantReg: 1,
        PtoVta: request.puntoVenta,
        CbteTipo: request.tipoComprobante
      },
      FeDetReq: {
        FECAEDetRequest: {
          Concepto: request.concepto,
          DocTipo: request.tipoDocumento,
          DocNro: request.numeroDocumento,
          CbteDesde: proximoNumero,
          CbteHasta: proximoNumero,
          CbteFch: request.fecha,
          FchServDesde: request.fechaServicioDesde || undefined,
          FchServHasta: request.fechaServicioHasta || undefined,
          FchVtoPago: request.fechaVencimientoPago || undefined,
          ImpTotal: request.importeTotal.toFixed(2),
          ImpTotConc: request.importeNoGravado.toFixed(2),
          ImpNeto: request.importeGravado.toFixed(2),
          ImpOpEx: request.importeExento.toFixed(2),
          ImpIVA: request.importeIVA.toFixed(2),
          ImpTrib: request.importeTributos.toFixed(2),
          MonId: request.codigoMoneda,
          MonCotiz: request.cotizacionMoneda.toFixed(6),
          // IVA
          Iva: request.ivas.length > 0 ? {
            AlicIva: request.ivas.map(iva => ({
              Id: iva.id,
              BaseImp: iva.baseImp.toFixed(2),
              Importe: iva.importe.toFixed(2)
            }))
          } : undefined,
          // Tributos
          Tributos: request.tributos && request.tributos.length > 0 ? {
            Tributo: request.tributos.map(t => ({
              Id: t.id,
              Desc: t.desc,
              BaseImp: t.baseImp.toFixed(2),
              Alic: t.alic.toFixed(2),
              Importe: t.importe.toFixed(2)
            }))
          } : undefined,
          // Opcionales
          Opcionales: request.opcionales && request.opcionales.length > 0 ? {
            Opcional: request.opcionales.map(o => ({
              Id: o.id.toString(),
              Valor: o.valor
            }))
          } : undefined,
          // Comprobantes asociados
          CbtesAsoc: request.comprobantesAsociados && request.comprobantesAsociados.length > 0 ? {
            CbteAsoc: request.comprobantesAsociados.map(c => ({
              Tipo: c.tipo,
              PtoVta: c.ptoVta,
              Nro: c.nro
            }))
          } : undefined
        }
      }
    }
  }

  const result = await llamarWSFE('FECAESolicitar', params, cfg)

  // Procesar respuesta
  const errores = result.errores as FEErr[] || []
  const observaciones = result.observaciones as FEObs[] || []

  return {
    success: !!result.cae && errores.length === 0,
    cae: result.cae as string || '',
    caeVencimiento: result.caeVencimiento as Date || new Date(),
    numeroComprobante: proximoNumero,
    errores,
    observaciones
  }
}

/**
 * Consulta un comprobante por número
 */
export async function FECompConsultar(
  tipoComprobante: number,
  puntoVenta: number,
  numeroComprobante: number,
  config?: WSAAConfig
): Promise<{
  existe: boolean
  cae: string
  caeVencimiento: Date
  importeTotal: number
  docTipo: number
  docNro: string
}> {
  const result = await llamarWSFE('FECompConsultar', {
    FeCompConsReq: {
      CbteTipo: tipoComprobante,
      PtoVta: puntoVenta,
      CbteNro: numeroComprobante
    }
  }, config)

  return {
    existe: !!result.cae,
    cae: result.cae as string || '',
    caeVencimiento: result.caeVencimiento as Date || new Date(),
    importeTotal: 0,
    docTipo: 0,
    docNro: ''
  }
}

/**
 * Obtiene los tipos de comprobante disponibles
 */
export async function FEParamGetTiposCbte(
  config?: WSAAConfig
): Promise<{ id: number; descripcion: string }[]> {
  // Usar cache si está disponible (actualizar cada 24 horas)
  if (tiposCache.comprobantes.length > 0 && 
      Date.now() - tiposCache.lastUpdate.getTime() < 24 * 60 * 60 * 1000) {
    return tiposCache.comprobantes
  }

  const result = await llamarWSFE('FEParamGetTiposCbte', {}, config)
  
  if (result.tiposCbte) {
    tiposCache.comprobantes = result.tiposCbte as { id: number; descripcion: string }[]
  } else {
    // Valores por defecto si no se pueden obtener
    tiposCache.comprobantes = [
      { id: 1, descripcion: 'Factura A' },
      { id: 2, descripcion: 'Nota de Débito A' },
      { id: 3, descripcion: 'Nota de Crédito A' },
      { id: 6, descripcion: 'Factura B' },
      { id: 7, descripcion: 'Nota de Débito B' },
      { id: 8, descripcion: 'Nota de Crédito B' },
      { id: 11, descripcion: 'Factura C' },
      { id: 12, descripcion: 'Nota de Débito C' },
      { id: 13, descripcion: 'Nota de Crédito C' },
    ]
  }
  
  tiposCache.lastUpdate = new Date()
  return tiposCache.comprobantes
}

/**
 * Obtiene los tipos de documento disponibles
 */
export async function FEParamGetTiposDoc(
  config?: WSAAConfig
): Promise<{ id: number; descripcion: string }[]> {
  if (tiposCache.documentos.length > 0 && 
      Date.now() - tiposCache.lastUpdate.getTime() < 24 * 60 * 60 * 1000) {
    return tiposCache.documentos
  }

  const result = await llamarWSFE('FEParamGetTiposDoc', {}, config)
  
  if (result.tiposDoc) {
    tiposCache.documentos = result.tiposDoc as { id: number; descripcion: string }[]
  } else {
    tiposCache.documentos = [
      { id: 80, descripcion: 'CUIT' },
      { id: 86, descripcion: 'CUIL' },
      { id: 96, descripcion: 'DNI' },
      { id: 94, descripcion: 'Pasaporte' },
      { id: 99, descripcion: 'Sin identificar' },
    ]
  }
  
  return tiposCache.documentos
}

/**
 * Obtiene los tipos de IVA disponibles
 */
export async function FEParamGetTiposIva(
  config?: WSAAConfig
): Promise<{ id: number; descripcion: string }[]> {
  if (tiposCache.ivas.length > 0 && 
      Date.now() - tiposCache.lastUpdate.getTime() < 24 * 60 * 60 * 1000) {
    return tiposCache.ivas
  }

  const result = await llamarWSFE('FEParamGetTiposIva', {}, config)
  
  if (result.tiposIva) {
    tiposCache.ivas = result.tiposIva as { id: number; descripcion: string }[]
  } else {
    tiposCache.ivas = [
      { id: 0, descripcion: '0%' },
      { id: 1, descripcion: 'Exento' },
      { id: 2, descripcion: 'No gravado' },
      { id: 4, descripcion: '10.5%' },
      { id: 5, descripcion: '21%' },
      { id: 6, descripcion: '27%' },
    ]
  }
  
  return tiposCache.ivas
}

/**
 * Obtiene los tipos de moneda disponibles
 */
export async function FEParamGetTiposMonedas(
  config?: WSAAConfig
): Promise<{ id: string; descripcion: string }[]> {
  if (tiposCache.monedas.length > 0 && 
      Date.now() - tiposCache.lastUpdate.getTime() < 24 * 60 * 60 * 1000) {
    return tiposCache.monedas
  }

  const result = await llamarWSFE('FEParamGetTiposMonedas', {}, config)
  
  if (result.tiposMonedas) {
    tiposCache.monedas = result.tiposMonedas as { id: string; descripcion: string }[]
  } else {
    tiposCache.monedas = [
      { id: 'PES', descripcion: 'Pesos Argentinos' },
      { id: 'DOL', descripcion: 'Dólar Estadounidense' },
      { id: 'EUR', descripcion: 'Euro' },
    ]
  }
  
  return tiposCache.monedas
}

/**
 * Obtiene los tipos de tributos disponibles
 */
export async function FEParamGetTiposTributos(
  config?: WSAAConfig
): Promise<{ id: number; descripcion: string }[]> {
  if (tiposCache.tributos.length > 0 && 
      Date.now() - tiposCache.lastUpdate.getTime() < 24 * 60 * 60 * 1000) {
    return tiposCache.tributos
  }

  const result = await llamarWSFE('FEParamGetTiposTributos', {}, config)
  
  if (result.tiposTributos) {
    tiposCache.tributos = result.tiposTributos as { id: number; descripcion: string }[]
  } else {
    tiposCache.tributos = [
      { id: 1, descripcion: 'Impuestos nacionales' },
      { id: 2, descripcion: 'Impuestos provinciales' },
      { id: 3, descripcion: 'Impuestos municipales' },
      { id: 4, descripcion: 'Impuestos internos' },
      { id: 5, descripcion: 'Percepción de IVA' },
      { id: 6, descripcion: 'Percepción de IIBB' },
      { id: 7, descripcion: 'Percepciones por ganancias' },
      { id: 8, descripcion: 'Otras percepciones' },
      { id: 9, descripcion: 'Otras percepciones (no BCRA)' },
    ]
  }
  
  return tiposCache.tributos
}

/**
 * Obtiene los puntos de venta habilitados
 */
export async function FEParamGetPtosVenta(
  config?: WSAAConfig
): Promise<{ numero: number; bloqueado: boolean; baja: boolean }[]> {
  const result = await llamarWSFE('FEParamGetPtosVenta', {}, config)
  // Parsear puntos de venta de la respuesta
  return (result as Record<string, unknown>).ptosVenta as { numero: number; bloqueado: boolean; baja: boolean }[] || []
}

/**
 * Determina el tipo de comprobante según el cliente
 */
export function determinarTipoComprobante(
  cuitCliente: string | null,
  esResponsableInscripto: boolean = true
): number {
  // Si no tiene CUIT o es consumidor final
  if (!cuitCliente || cuitCliente.length < 11) {
    return TIPO_COMPROBANTE.FACTURA_B // Factura B para consumidor final
  }

  // Si el cliente tiene CUIT, depende de la responsabilidad
  if (esResponsableInscripto) {
    return TIPO_COMPROBANTE.FACTURA_A // Factura A para RI
  }

  return TIPO_COMPROBANTE.FACTURA_B // Factura B para monotributista/exento
}

/**
 * Formatea una fecha para AFIP (YYYYMMDD)
 */
export function formatearFechaAFIP(fecha: Date): string {
  const year = fecha.getFullYear()
  const month = String(fecha.getMonth() + 1).padStart(2, '0')
  const day = String(fecha.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

/**
 * Calcula el IVA según alícuota
 */
export function calcularIVA(baseImponible: number, alicuotaId: number): number {
  const alicuotas: Record<number, number> = {
    [ALICUOTA_IVA.DIEZ_CINCO]: 10.5,
    [ALICUOTA_IVA.VEINTIUNO]: 21,
    [ALICUOTA_IVA.VEINTISIETE]: 27,
    [ALICUOTA_IVA.CERO]: 0,
  }

  const tasa = alicuotas[alicuotaId] || 0
  return Math.round(baseImponible * tasa / 100 * 100) / 100
}

/**
 * Obtiene todos los tipos de AFIP cacheados
 */
export function getTiposCacheados() {
  return {
    comprobantes: tiposCache.comprobantes,
    documentos: tiposCache.documentos,
    ivas: tiposCache.ivas,
    monedas: tiposCache.monedas,
    tributos: tiposCache.tributos,
  }
}

/**
 * Limpia el cache de tipos
 */
export function limpiarCacheTipos(): void {
  tiposCache.comprobantes = []
  tiposCache.documentos = []
  tiposCache.ivas = []
  tiposCache.monedas = []
  tiposCache.tributos = []
  tiposCache.lastUpdate = new Date(0)
}
