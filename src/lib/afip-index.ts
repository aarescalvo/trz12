// AFIP - Facturación Electrónica
// Exportación centralizada de todos los módulos AFIP

// Configuración y constantes
export * from './afip-config'

// WSAA - Autenticación
export {
  // Funciones principales
  obtenerTokenAcceso,
  getConfiguracionAFIP,
  verificarConfiguracionAFIP,
  probarConexionAFIP,
  invalidarCache,
  getTokenCacheInfo,
  
  // Funciones internas (útiles para testing)
  generarTRA,
  firmarTRA,
  
  // Tipos
  type WSAAConfig,
  type TokenAcceso,
  
  // Constantes
  WSAA_URLS,
} from './afip-wsaa'

// WSFE - Facturación Electrónica
export {
  // Funciones principales
  FECAESolicitar,
  FECompUltimoAutorizado,
  FECompConsultar,
  FEDummy,
  FEParamGetCotizacion,
  FEParamGetTiposCbte,
  FEParamGetTiposDoc,
  FEParamGetTiposIva,
  FEParamGetTiposMonedas,
  FEParamGetTiposTributos,
  FEParamGetPtosVenta,
  
  // Helpers
  determinarTipoComprobante,
  formatearFechaAFIP,
  calcularIVA,
  getTiposCacheados,
  limpiarCacheTipos,
  
  // Tipos
  type FEHeader,
  type FERequest,
  type FEResponse,
  type FEErr,
  type FEObs,
  
  // Constantes
  WSFE_URLS,
  TIPO_COMPROBANTE,
  TIPO_DOCUMENTO,
  MONEDA,
  ALICUOTA_IVA,
  CONCEPTO,
} from './afip-wsfe'

// Servicio principal
export {
  AFIPService,
  getAFIPService,
  type AFIPConfig,
  type FacturaElectronica,
  type EmitirFacturaParams,
  type EmitirFacturaResult,
} from './afip'

// Gestión de certificados
export {
  parseCertificate,
  validateCertificatePair,
  storeCertificate,
  getCertificateConfig,
  needsRenewal,
  generateCSR,
  deleteCertificates,
  type CertificateInfo,
  type CertificateValidationResult,
} from './afip-certificates'
