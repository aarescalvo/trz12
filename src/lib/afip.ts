// Configuración AFIP para Facturación Electrónica
// Referencia: https://www.afip.gob.ar/ws/WSAA/WSAA.HTM

import { 
  obtenerTokenAcceso, 
  getConfiguracionAFIP, 
  verificarConfiguracionAFIP,
  probarConexionAFIP,
  invalidarCache,
  WSAAConfig 
} from './afip-wsaa'
import {
  FECAESolicitar,
  FECompUltimoAutorizado,
  FECompConsultar,
  FEParamGetCotizacion,
  FEParamGetTiposCbte,
  FEParamGetTiposDoc,
  FEParamGetTiposIva,
  FEParamGetTiposMonedas,
  FEParamGetTiposTributos,
  FEDummy,
  determinarTipoComprobante,
  formatearFechaAFIP,
  calcularIVA,
  TIPO_COMPROBANTE,
  TIPO_DOCUMENTO,
  MONEDA,
  ALICUOTA_IVA,
  CONCEPTO,
  FERequest,
  FEResponse
} from './afip-wsfe'

// Re-export types and constants
export { TIPO_COMPROBANTE, TIPO_DOCUMENTO, MONEDA, ALICUOTA_IVA, CONCEPTO }
export type { FERequest, FEResponse }

export interface AFIPConfig {
  cuit: string           // CUIT del emisor
  razonSocial: string    // Razón social
  domicilio: string      // Domicilio comercial
  puntoVenta: number     // Punto de venta
  inicioActividades: string // Fecha inicio actividades
  certificado: string    // Contenido del certificado .pem
  clavePrivada: string   // Contenido de la clave privada .key
  ambiente: 'testing' | 'production'
}

export interface FacturaElectronica {
  tipoComprobante: number  // 1=FA, 6=FB, 11=FC, etc.
  puntoVenta: number
  numeroComprobante: number
  fecha: string
  tipoDocumento: number    // 80=CUIT, 96=DNI
  numeroDocumento: string
  razonSocial: string
  importeTotal: number
  cae?: string
  caeVencimiento?: Date
}

export interface EmitirFacturaParams {
  facturaId: string
  forzarNuevo?: boolean
}

export interface EmitirFacturaResult {
  success: boolean
  cae?: string
  caeVencimiento?: Date
  numeroComprobante?: number
  errores?: { code: number; msg: string }[]
  observaciones?: { code: number; msg: string }[]
}

/**
 * Clase principal para interactuar con AFIP
 */
export class AFIPService {
  private config: AFIPConfig | null = null

  constructor(config?: AFIPConfig) {
    if (config) {
      this.config = config
    }
  }

  /**
   * Carga la configuración desde la base de datos
   */
  private async loadConfig(): Promise<AFIPConfig | null> {
    if (this.config) return this.config
    
    const wsaaConfig = await getConfiguracionAFIP()
    if (!wsaaConfig) return null
    
    this.config = {
      cuit: wsaaConfig.cuit,
      razonSocial: wsaaConfig.razonSocial,
      domicilio: wsaaConfig.domicilio || '',
      puntoVenta: wsaaConfig.puntoVenta,
      inicioActividades: wsaaConfig.inicioActividades || '',
      certificado: wsaaConfig.certificado,
      clavePrivada: wsaaConfig.clavePrivada,
      ambiente: wsaaConfig.ambiente
    }
    
    return this.config
  }

  /**
   * Verifica si la configuración está completa
   */
  async verificarConfiguracion(): Promise<{ configurado: boolean; errores: string[] }> {
    return verificarConfiguracionAFIP()
  }

  /**
   * Prueba la conexión con AFIP
   */
  async probarConexion(): Promise<{ exito: boolean; mensaje: string; vencimiento?: Date }> {
    return probarConexionAFIP()
  }

  /**
   * Obtiene un token de acceso
   */
  async obtenerToken(service: string = 'wsfe'): Promise<{
    token: string
    sign: string
    expiration: Date
  }> {
    const config = await this.loadConfig()
    if (!config) {
      throw new Error('Configuración AFIP no disponible')
    }

    const token = await obtenerTokenAcceso(service, {
      cuit: config.cuit,
      razonSocial: config.razonSocial,
      puntoVenta: config.puntoVenta,
      certificado: config.certificado,
      clavePrivada: config.clavePrivada,
      ambiente: config.ambiente
    })

    return {
      token: token.token,
      sign: token.sign,
      expiration: token.expiration
    }
  }

  /**
   * Consulta el último número de comprobante
   */
  async consultarUltimoNumero(tipoComprobante: number, puntoVenta?: number): Promise<number> {
    const config = await this.loadConfig()
    if (!config) {
      throw new Error('Configuración AFIP no disponible')
    }

    return FECompUltimoAutorizado(tipoComprobante, puntoVenta || config.puntoVenta, {
      cuit: config.cuit,
      razonSocial: config.razonSocial,
      puntoVenta: config.puntoVenta,
      certificado: config.certificado,
      clavePrivada: config.clavePrivada,
      ambiente: config.ambiente
    })
  }

  /**
   * Emite una factura electrónica
   */
  async emitirFactura(factura: FERequest): Promise<FEResponse> {
    const config = await this.loadConfig()
    if (!config) {
      throw new Error('Configuración AFIP no disponible')
    }

    return FECAESolicitar(factura, {
      cuit: config.cuit,
      razonSocial: config.razonSocial,
      puntoVenta: config.puntoVenta,
      certificado: config.certificado,
      clavePrivada: config.clavePrivada,
      ambiente: config.ambiente
    })
  }

  /**
   * Consulta una factura emitida
   */
  async consultarFactura(
    tipoComprobante: number,
    puntoVenta: number,
    numeroComprobante: number
  ): Promise<{
    existe: boolean
    cae: string
    caeVencimiento: Date
    importeTotal: number
  }> {
    const config = await this.loadConfig()
    if (!config) {
      throw new Error('Configuración AFIP no disponible')
    }

    return FECompConsultar(tipoComprobante, puntoVenta, numeroComprobante, {
      cuit: config.cuit,
      razonSocial: config.razonSocial,
      puntoVenta: config.puntoVenta,
      certificado: config.certificado,
      clavePrivada: config.clavePrivada,
      ambiente: config.ambiente
    })
  }

  /**
   * Obtiene la cotización de una moneda
   */
  async obtenerCotizacion(moneda: string = 'PES'): Promise<{ moneda: string; cotizacion: number }> {
    const config = await this.loadConfig()
    if (!config) {
      throw new Error('Configuración AFIP no disponible')
    }

    const result = await FEParamGetCotizacion(moneda, {
      cuit: config.cuit,
      razonSocial: config.razonSocial,
      puntoVenta: config.puntoVenta,
      certificado: config.certificado,
      clavePrivada: config.clavePrivada,
      ambiente: config.ambiente
    })

    return { moneda: result.moneda, cotizacion: result.cotizacion }
  }

  /**
   * Obtiene los tipos de comprobante
   */
  async obtenerTiposComprobante(): Promise<{ id: number; descripcion: string }[]> {
    const config = await this.loadConfig()
    if (!config) {
      throw new Error('Configuración AFIP no disponible')
    }

    return FEParamGetTiposCbte({
      cuit: config.cuit,
      razonSocial: config.razonSocial,
      puntoVenta: config.puntoVenta,
      certificado: config.certificado,
      clavePrivada: config.clavePrivada,
      ambiente: config.ambiente
    })
  }

  /**
   * Verifica el estado del servicio
   */
  async verificarEstadoServicio(): Promise<{
    appServer: string
    dbServer: string
    authServer: string
  }> {
    const config = await this.loadConfig()
    if (!config) {
      throw new Error('Configuración AFIP no disponible')
    }

    return FEDummy({
      cuit: config.cuit,
      razonSocial: config.razonSocial,
      puntoVenta: config.puntoVenta,
      certificado: config.certificado,
      clavePrivada: config.clavePrivada,
      ambiente: config.ambiente
    })
  }

  /**
   * Invalida el cache de tokens
   */
  invalidarCache(): void {
    invalidarCache()
  }
}

// Instancia singleton
let afipServiceInstance: AFIPService | null = null

/**
 * Obtiene la instancia del servicio AFIP
 */
export function getAFIPService(): AFIPService {
  if (!afipServiceInstance) {
    afipServiceInstance = new AFIPService()
  }
  return afipServiceInstance
}

// Re-export helper functions
export { determinarTipoComprobante, formatearFechaAFIP, calcularIVA }
