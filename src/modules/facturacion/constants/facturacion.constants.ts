// ==================== CONSTANTES DE FACTURACIÓN ====================

// Tipos de tarifa predefinidos (para seed inicial)
export const TIPOS_TARIFA_DEFAULT = [
  { codigo: 'FAENA_BOVINO', descripcion: 'Servicio de faena bovino', unidad: 'POR_KG', orden: 1 },
  { codigo: 'FAENA_EQUINO', descripcion: 'Servicio de faena equino', unidad: 'POR_KG', orden: 2 },
  { codigo: 'FAENA_PORCINO', descripcion: 'Servicio de faena porcino', unidad: 'POR_KG', orden: 3 },
  { codigo: 'ESTACIONAMIENTO', descripcion: 'Estacionamiento en cámara', unidad: 'POR_KG_POR_DIA', orden: 10 },
  { codigo: 'HONORARIOS_VET', descripcion: 'Honorarios veterinario bromatología', unidad: 'POR_CABEZA', orden: 20 },
  { codigo: 'SELLADO_SENASA', descripcion: 'Sellado/estampillas SENASA', unidad: 'POR_CABEZA', orden: 21 },
  { codigo: 'FLETE', descripcion: 'Flete/transporte', unidad: 'FIJO', orden: 30 },
  { codigo: 'DOCUMENTACION', descripcion: 'Guías y documentación', unidad: 'FIJO', orden: 31 },
] as const

// Mapeo de especie a código de tarifa de faena
export const ESPECIE_TARIFA_MAP: Record<string, string> = {
  BOVINO: 'FAENA_BOVINO',
  EQUINO: 'FAENA_EQUINO',
  PORCINO: 'FAENA_PORCINO',
}

// Alícuotas IVA por tipo de concepto
export const ALICUOTAS_IVA = {
  SERVICIO_FAENA: 21,      // Servicio tributa 21%
  CARNE_FRESCA: 10.5,      // Venta de carne fresca
  PRODUCTO_ELABORADO: 21,  // Fiambres, embutidos
  EXENTO: 0,               // Exportaciones
} as const

// Tipos de comprobante AFIP
export const TIPOS_COMPROBANTE_AFIP = {
  FACTURA_A: { codigo: 1, label: 'Factura A', descr: 'RI → RI' },
  FACTURA_B: { codigo: 6, label: 'Factura B', descr: 'RI → CF/MT/EX' },
  FACTURA_C: { codigo: 11, label: 'Factura C', descr: 'MT → todos' },
  NOTA_CREDITO_A: { codigo: 3, label: 'Nota Crédito A' },
  NOTA_CREDITO_B: { codigo: 8, label: 'Nota Crédito B' },
  NOTA_DEBITO_A: { codigo: 2, label: 'Nota Débito A' },
  NOTA_DEBITO_B: { codigo: 7, label: 'Nota Débito B' },
} as const

// Condición IVA → Tipo comprobante
export const CONDICION_IVA_COMPROBANTE: Record<string, string> = {
  RI: 'FACTURA_A',
  CF: 'FACTURA_B',
  MT: 'FACTURA_B',
  EX: 'FACTURA_B',
  NC: 'FACTURA_C',
}

// Permisos del módulo de facturación por rol
export const PERMISOS_FACTURACION = {
  crearTarifa: ['ADMINISTRADOR'],
  verTarifas: ['ADMINISTRADOR', 'SUPERVISOR'],
  crearLiquidacion: ['ADMINISTRADOR', 'SUPERVISOR'],
  editarLiquidacion: ['ADMINISTRADOR', 'SUPERVISOR'],  // requiere PIN supervisor
  emitirFactura: ['ADMINISTRADOR', 'SUPERVISOR'],
  anularFactura: ['ADMINISTRADOR'],
  verComprobantes: ['ADMINISTRADOR', 'SUPERVISOR', 'OPERADOR'],
  registrarPago: ['ADMINISTRADOR', 'SUPERVISOR'],
} as const

// Motivos de notas de crédito/débito
export const MOTIVOS_NOTA = [
  { value: 'CORRECCION_ROMANEO', label: 'Corrección de romaneo' },
  { value: 'DEVOLUCION', label: 'Devolución' },
  { value: 'DESCUENTO', label: 'Descuento' },
  { value: 'ERROR', label: 'Error de facturación' },
  { value: 'ANULACION', label: 'Anulación parcial' },
  { value: 'AJUSTE', label: 'Ajuste de precio' },
] as const

// Tributos AFIP comunes
export const TRIBUTOS_AFIP = [
  { id: 1, descripcion: 'Impuestos nacionales' },
  { id: 4, descripcion: 'Percepción IIBB' },
  { id: 5, descripcion: 'Percepción IVA' },
  { id: 6, descripcion: 'Percepción Ganancias' },
  { id: 7, descripcion: 'Otros tributos' },
] as const
