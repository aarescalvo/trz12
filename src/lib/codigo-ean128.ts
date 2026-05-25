/**
 * Sistema de Códigos EAN-128 para Productos
 * Frigorífico "Solemar Alimentaria"
 * 
 * Estructura del código según CODIGO.xlsx:
 * - ARTICULO (3 dígitos)
 * - ESPECIE (1 dígito)
 * - TIPIFICACION (2 dígitos)
 * - TIPO TRABAJO (1 dígito)
 * - TRANSPORTE (1 dígito)
 * - DESTINO (2 dígitos)
 * - FECHA PRODUCCION (6 dígitos: YYMMDD)
 * - LOTE (6 dígitos)
 * - UNIDADES (2 dígitos)
 * - PESO NETO (5 dígitos, sin decimales, ej: 12.12 = 01212)
 * - NUM CAJA (4 dígitos)
 * - PESO BRUTO (5 dígitos, sin decimales)
 * 
 * Total: 38 dígitos
 */

// Tablas de códigos según CODIGO.xlsx
export const CODIGOS_ARTICULO: Record<string, { codigo: string; nombre: string }> = {
  '000': { codigo: '000', nombre: 'total' },
  '001': { codigo: '001', nombre: 'lomo' },
  '002': { codigo: '002', nombre: 'bife angosto' },
  '003': { codigo: '003', nombre: 'cuadril' },
  '004': { codigo: '004', nombre: 'nalga de adentro' },
  '005': { codigo: '005', nombre: 'bola de lomo' },
  '006': { codigo: '006', nombre: 'nalga de afuera' },
  '007': { codigo: '007', nombre: 'cuadrada' },
  '008': { codigo: '008', nombre: 'peceto' },
  '009': { codigo: '009', nombre: 'colita de cuadril' },
  '010': { codigo: '010', nombre: 'tortuguita' },
  '011': { codigo: '011', nombre: 'brazuelo' },
  '012': { codigo: '012', nombre: 'garron' },
  '013': { codigo: '013', nombre: 'entraña' },
  '014': { codigo: '014', nombre: 'delantero jaslo' },
  '015': { codigo: '015', nombre: 'paleta' },
  '016': { codigo: '016', nombre: 'centro de paleta' },
  '017': { codigo: '017', nombre: 'corazon de paleta' },
  '018': { codigo: '018', nombre: 'bife ancho' },
  '019': { codigo: '019', nombre: 'cogote/aguja' },
  '020': { codigo: '020', nombre: 'cogote/aguja y bife ancho' },
  '021': { codigo: '021', nombre: 'pecho entero' },
  '022': { codigo: '022', nombre: 'pecho largo' },
  '023': { codigo: '023', nombre: 'pecho ancho' },
  '024': { codigo: '024', nombre: 'pecho 2T/LA' },
  '025': { codigo: '025', nombre: 'afd' },
  '026': { codigo: '026', nombre: 'lengua' },
  '027': { codigo: '027', nombre: 'corazon' },
  '028': { codigo: '028', nombre: 'carnetta Iº' },
  '029': { codigo: '029', nombre: 'carnetta Iiº' },
  '030': { codigo: '030', nombre: 'carnetta G' },
  '031': { codigo: '031', nombre: 'bcs' },
  '032': { codigo: '032', nombre: 'recorte / trimming' },
  '033': { codigo: '033', nombre: 'costeletero (bife c/lomo)' },
  '034': { codigo: '034', nombre: 'balon de nalga' },
  '035': { codigo: '035', nombre: 'tapa y centro de nalga' },
  '036': { codigo: '036', nombre: 'tapa de nalga' },
  '037': { codigo: '037', nombre: 'pistola 5 corte' },
  '038': { codigo: '038', nombre: 'pistola 6 corte' },
  '039': { codigo: '039', nombre: 'asado c/hueso y entraña' },
  '040': { codigo: '040', nombre: 'skin trimming' },
  '046': { codigo: '046', nombre: 'higado' },
  '049': { codigo: '049', nombre: 'tendon' },
  '054': { codigo: '054', nombre: 'grasa' },
  '101': { codigo: '101', nombre: 'MEDIA RES JASLO BOX 1' },
  '102': { codigo: '102', nombre: 'MEDIA RES JASLO BOX 2' },
  '103': { codigo: '103', nombre: 'MEDIA RES JASLO BOX 3' },
  '104': { codigo: '104', nombre: 'MEDIA RES JASLO BOX 4' },
  '105': { codigo: '105', nombre: 'MEDIA RES JASLO BOX 5' },
  '106': { codigo: '106', nombre: 'MEDIA RES JASLO BOX 6' },
}

export const CODIGOS_ESPECIE: Record<string, { codigo: string; nombre: string }> = {
  '0': { codigo: '0', nombre: 'todas' },
  '1': { codigo: '1', nombre: 'equino' },
  '2': { codigo: '2', nombre: 'caballo' },
  '3': { codigo: '3', nombre: 'potro' },
  '4': { codigo: '4', nombre: 'burro' },
  '5': { codigo: '5', nombre: 'equino LAND L' },
}

export const CODIGOS_TIPIFICACION: Record<string, { codigo: string; nombre: string }> = {
  '00': { codigo: '00', nombre: 'todas' },
  '01': { codigo: '01', nombre: 'no tipific.' },
  '02': { codigo: '02', nombre: 'M' },
  '03': { codigo: '03', nombre: 'A' },
  '04': { codigo: '04', nombre: 'S' },
  '05': { codigo: '05', nombre: 'I' },
  '06': { codigo: '06', nombre: 'N' },
  '07': { codigo: '07', nombre: 'AG' },
  '08': { codigo: '08', nombre: 'AS' },
  '09': { codigo: '09', nombre: 'L' },
  '10': { codigo: '10', nombre: 'D' },
  '11': { codigo: '11', nombre: 'O' },
  '12': { codigo: '12', nombre: 'MM' },
  '13': { codigo: '13', nombre: 'MP' },
  '14': { codigo: '14', nombre: 'MD' },
  '15': { codigo: '15', nombre: 'NN' },
  '16': { codigo: '16', nombre: 'SIN' },
  '17': { codigo: '17', nombre: 'IN' },
}

export const CODIGOS_TIPO_TRABAJO: Record<string, { codigo: string; nombre: string }> = {
  '0': { codigo: '0', nombre: 'Ninguna' },
  '1': { codigo: '1', nombre: 'descarte' },
  '2': { codigo: '2', nombre: 'T/lama' },
  '3': { codigo: '3', nombre: 'T/MR' },
  '4': { codigo: '4', nombre: 'T/jaslo' },
  '5': { codigo: '5', nombre: 'T/square' },
  '6': { codigo: '6', nombre: 'T/checo' },
}

export const CODIGOS_TRANSPORTE: Record<string, { codigo: string; nombre: string }> = {
  '0': { codigo: '0', nombre: 'no definido' },
  '1': { codigo: '1', nombre: 'BARCO enfriado' },
  '2': { codigo: '2', nombre: 'BARCO congelado' },
  '3': { codigo: '3', nombre: 'BARCO salado' },
  '4': { codigo: '4', nombre: 'AVION enfriado' },
  '5': { codigo: '5', nombre: 'AVION congelado' },
  '6': { codigo: '6', nombre: 'CAMION enfriado' },
  '7': { codigo: '7', nombre: 'CAMION congelado' },
  '8': { codigo: '8', nombre: 'INTERNO' },
}

export const CODIGOS_DESTINO: Record<string, { codigo: string; nombre: string }> = {
  '00': { codigo: '00', nombre: 'cualquiera' },
  '01': { codigo: '01', nombre: 'italia' },
  '02': { codigo: '02', nombre: 'francia' },
  '03': { codigo: '03', nombre: 'spagna' },
  '04': { codigo: '04', nombre: 'belgio' },
  '05': { codigo: '05', nombre: 'russia' },
  '06': { codigo: '06', nombre: 'svizzera' },
  '07': { codigo: '07', nombre: 'austria' },
  '08': { codigo: '08', nombre: 'japon' },
  '09': { codigo: '09', nombre: 'kazajistan' },
  '10': { codigo: '10', nombre: 'JAPON IMI' },
}

// Interface para datos del código
export interface CodigoEAN128Data {
  articulo: string       // 3 dígitos
  especie: string        // 1 dígito
  tipificacion: string   // 2 dígitos
  tipoTrabajo: string    // 1 dígito
  transporte: string     // 1 dígito
  destino: string        // 2 dígitos
  fechaProduccion: Date  // 6 dígitos (YYMMDD)
  lote: number           // 6 dígitos
  unidades: number       // 2 dígitos
  pesoNeto: number       // 5 dígitos (en centésimas)
  numCaja: number        // 4 dígitos
  pesoBruto: number      // 5 dígitos (en centésimas)
}

/**
 * Formatea fecha a YYMMDD
 */
function formatFechaCodigo(fecha: Date): string {
  const yy = String(fecha.getFullYear()).slice(-2)
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  const dd = String(fecha.getDate()).padStart(2, '0')
  return `${yy}${mm}${dd}`
}

/**
 * Convierte peso a formato de código (centésimas)
 * Ejemplo: 12.12 kg -> 01212
 */
function formatPesoCodigo(peso: number): string {
  const centesimas = Math.round(peso * 100)
  return String(centesimas).padStart(5, '0')
}

/**
 * Genera el código EAN-128 completo
 * 
 * Estructura:
 * - Datos fijos (10 dígitos): ARTICULO + ESPECIE + TIPIFICACION + TIPO TRABAJO + TRANSPORTE + DESTINO
 * - Datos variables (28 dígitos): FECHA + LOTE + UNIDADES + PESO NETO + NUM CAJA + PESO BRUTO
 * 
 * Total: 38 dígitos
 */
export function generarCodigoEAN128(data: CodigoEAN128Data): string {
  // Datos fijos (10 dígitos)
  const datosFijos = [
    data.articulo.padStart(3, '0'),      // 3 dígitos
    data.especie.padStart(1, '0'),       // 1 dígito
    data.tipificacion.padStart(2, '0'),  // 2 dígitos
    data.tipoTrabajo.padStart(1, '0'),   // 1 dígito
    data.transporte.padStart(1, '0'),    // 1 dígito
    data.destino.padStart(2, '0'),       // 2 dígitos
  ].join('')

  // Datos variables (28 dígitos)
  const datosVariables = [
    formatFechaCodigo(data.fechaProduccion),           // 6 dígitos
    String(data.lote).padStart(6, '0'),                // 6 dígitos
    String(data.unidades).padStart(2, '0'),            // 2 dígitos
    formatPesoCodigo(data.pesoNeto),                   // 5 dígitos
    String(data.numCaja).padStart(4, '0'),             // 4 dígitos
    formatPesoCodigo(data.pesoBruto),                  // 5 dígitos
  ].join('')

  return datosFijos + datosVariables
}

/**
 * Parsea un código EAN-128 y devuelve sus componentes
 */
export function parsearCodigoEAN128(codigo: string): CodigoEAN128Data | null {
  if (codigo.length !== 38) {
    return null
  }

  try {
    // Parsear fecha YYMMDD
    const fechaStr = codigo.substring(10, 16)
    const yy = parseInt(fechaStr.substring(0, 2), 10)
    const mm = parseInt(fechaStr.substring(2, 4), 10) - 1
    const dd = parseInt(fechaStr.substring(4, 6), 10)
    const fechaProduccion = new Date(2000 + yy, mm, dd)

    // Parsear pesos desde centésimas
    const pesoNeto = parseInt(codigo.substring(24, 29), 10) / 100
    const pesoBruto = parseInt(codigo.substring(33, 38), 10) / 100

    return {
      articulo: codigo.substring(0, 3),
      especie: codigo.substring(3, 4),
      tipificacion: codigo.substring(4, 6),
      tipoTrabajo: codigo.substring(6, 7),
      transporte: codigo.substring(7, 8),
      destino: codigo.substring(8, 10),
      fechaProduccion,
      lote: parseInt(codigo.substring(16, 22), 10),
      unidades: parseInt(codigo.substring(22, 24), 10),
      pesoNeto,
      numCaja: parseInt(codigo.substring(29, 33), 10),
      pesoBruto,
    }
  } catch {
    return null
  }
}

/**
 * Obtiene el nombre del artículo a partir del código
 */
export function getNombreArticulo(codigo: string): string {
  return CODIGOS_ARTICULO[codigo]?.nombre || 'Desconocido'
}

/**
 * Obtiene el nombre de la especie a partir del código
 */
export function getNombreEspecie(codigo: string): string {
  return CODIGOS_ESPECIE[codigo]?.nombre || 'Desconocido'
}

/**
 * Obtiene el nombre del destino a partir del código
 */
export function getNombreDestino(codigo: string): string {
  return CODIGOS_DESTINO[codigo]?.nombre || 'Desconocido'
}

/**
 * Genera código para media res
 */
export function generarCodigoMediaRes(params: {
  especie: 'BOVINO' | 'EQUINO'
  tropaNumero: number
  fechaFaena: Date
  pesoNeto: number
  numCaja: number
  pesoBruto: number
  destino?: string
}): string {
  const data: CodigoEAN128Data = {
    articulo: '001', // lomo por defecto, se puede cambiar
    especie: params.especie === 'BOVINO' ? '0' : '1',
    tipificacion: '02', // M por defecto
    tipoTrabajo: '0',
    transporte: '6', // CAMION enfriado
    destino: params.destino || '01', // italia por defecto
    fechaProduccion: params.fechaFaena,
    lote: params.tropaNumero,
    unidades: 1,
    pesoNeto: params.pesoNeto,
    numCaja: params.numCaja,
    pesoBruto: params.pesoBruto,
  }

  return generarCodigoEAN128(data)
}

/**
 * Genera código para producto/menudencia
 */
export function generarCodigoProducto(params: {
  codigoArticulo: string
  especie: 'BOVINO' | 'EQUINO'
  tipificacion?: string
  tipoTrabajo?: string
  transporte?: string
  destino?: string
  fechaProduccion: Date
  lote: number
  unidades: number
  pesoNeto: number
  numCaja: number
  pesoBruto: number
}): string {
  const data: CodigoEAN128Data = {
    articulo: params.codigoArticulo,
    especie: params.especie === 'BOVINO' ? '0' : '1',
    tipificacion: params.tipificacion || '02',
    tipoTrabajo: params.tipoTrabajo || '0',
    transporte: params.transporte || '6',
    destino: params.destino || '01',
    fechaProduccion: params.fechaProduccion,
    lote: params.lote,
    unidades: params.unidades,
    pesoNeto: params.pesoNeto,
    numCaja: params.numCaja,
    pesoBruto: params.pesoBruto,
  }

  return generarCodigoEAN128(data)
}

/**
 * Formatea el código para visualización con separadores
 */
export function formatearCodigoVisual(codigo: string): string {
  if (codigo.length !== 38) return codigo

  return [
    codigo.substring(0, 3),     // ARTICULO
    codigo.substring(3, 4),     // ESPECIE
    codigo.substring(4, 6),     // TIPIFICACION
    codigo.substring(6, 7),     // TIPO TRABAJO
    codigo.substring(7, 8),     // TRANSPORTE
    codigo.substring(8, 10),    // DESTINO
    codigo.substring(10, 16),   // FECHA
    codigo.substring(16, 22),   // LOTE
    codigo.substring(22, 24),   // UNIDADES
    codigo.substring(24, 29),   // PESO NETO
    codigo.substring(29, 33),   // NUM CAJA
    codigo.substring(33, 38),   // PESO BRUTO
  ].join(' ')
}
