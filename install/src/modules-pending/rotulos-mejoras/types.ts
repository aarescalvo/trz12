// Tipos para el módulo de Rótulos Mejoras

export type TipoElemento = 'TEXTO' | 'CODIGO_BARRAS' | 'LINEA' | 'RECTANGULO' | 'IMAGEN' | 'QR'

export type TipoImpresora = 'ZEBRA' | 'DATAMAX'

export type TipoRotulo = 
  | 'PESAJE_INDIVIDUAL'
  | 'MEDIA_RES'
  | 'CUARTO'
  | 'MENUDENCIA'
  | 'PRODUCTO_TERMINADO_ENVASE_PRIMARIO'
  | 'PRODUCTO_TERMINADO_ENVASE_SECUNDARIO'
  | 'PRODUCTO_TERMINADO_UN_ENVASE'

export interface RotuloElement {
  id: string
  tipo: TipoElemento
  
  // Contenido
  campo?: string      // Variable: numeroAnimal, peso, fecha, etc.
  textoFijo?: string  // Texto estático si campo es null
  
  // Posición y tamaño (en puntos según DPI)
  posX: number
  posY: number
  ancho: number
  alto: number
  
  // Fuente (para TEXTO)
  fuente: string      // ZPL: 0-9, A-Z; DPL: nombre de fuente
  tamano: number      // Tamaño de fuente
  negrita: boolean
  anchoFuente?: number // Ancho de carácter en puntos (ZPL)
  
  // Alineación
  alineacion: 'LEFT' | 'CENTER' | 'RIGHT'
  
  // Código de barras
  tipoCodigo?: string       // CODE128, CODE39, EAN13, etc.
  altoCodigo?: number       // Alto del código de barras
  mostrarTexto?: boolean    // Mostrar texto debajo del código
  
  // Líneas y rectángulos
  grosorLinea?: number      // Grosor en puntos
  color?: string            // B=Black, W=White
  
  // Orden (z-index)
  orden: number
}

export interface Rotulo {
  id: string
  nombre: string
  codigo: string
  tipo: TipoRotulo
  categoria?: string
  
  // Tipo de impresora
  tipoImpresora: TipoImpresora
  modeloImpresora: string
  
  // Dimensiones en mm
  ancho: number
  alto: number
  dpi: number
  
  // Contenido
  contenido: string           // Contenido raw ZPL/DPL
  elementos: RotuloElement[]  // Elementos para editor visual
  variables?: string          // JSON con variables detectadas
  nombreArchivo?: string
  esBinario?: boolean
  
  // Configuración de consumo
  diasConsumo?: number
  temperaturaMax?: number
  
  // Estado
  activo: boolean
  esDefault: boolean
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface VariableRotulo {
  id: string
  nombre: string
  ejemplo: string
  descripcion?: string
}

export interface ModeloImpresora {
  id: string
  nombre: string
  dpi: number
  tipoImpresora: TipoImpresora
}

export interface PreviewData {
  NUMERO: string
  TROPA: string
  TIPO: string
  PESO: string
  CODIGO: string
  RAZA: string
  FECHA: string
  FECHA_VENC: string
  PRODUCTO: string
  GARRON: string
  LADO: string
  SIGLA: string
  PESO_NETO: string
  USUARIO_FAENA: string
  MATRICULA: string
  CODIGO_BARRAS: string
}

// Constantes
export const VARIABLES_DISPONIBLES: VariableRotulo[] = [
  { id: 'NUMERO', nombre: 'Número de Animal', ejemplo: '15' },
  { id: 'TROPA', nombre: 'Código de Tropa', ejemplo: 'B 2026 0012' },
  { id: 'TIPO', nombre: 'Tipo de Animal', ejemplo: 'VA' },
  { id: 'PESO', nombre: 'Peso', ejemplo: '452' },
  { id: 'CODIGO', nombre: 'Código Completo', ejemplo: 'B20260012-015' },
  { id: 'RAZA', nombre: 'Raza', ejemplo: 'Angus' },
  { id: 'FECHA', nombre: 'Fecha', ejemplo: '20/03/2026' },
  { id: 'FECHA_VENC', nombre: 'Fecha Vencimiento', ejemplo: '19/04/2026' },
  { id: 'PRODUCTO', nombre: 'Producto', ejemplo: 'MEDIA RES' },
  { id: 'GARRON', nombre: 'Garrón', ejemplo: '42' },
  { id: 'LADO', nombre: 'Lado', ejemplo: 'I' },
  { id: 'SIGLA', nombre: 'Sigla', ejemplo: 'A' },
  { id: 'PESO_NETO', nombre: 'Peso Neto', ejemplo: '118.5' },
  { id: 'USUARIO_FAENA', nombre: 'Usuario Faena', ejemplo: 'Juan Pérez' },
  { id: 'MATRICULA', nombre: 'Matrícula', ejemplo: '12345' },
  { id: 'CODIGO_BARRAS', nombre: 'Código de Barras', ejemplo: 'B202600120151' },
]

export const TIPOS_CODIGO_BARRAS = [
  { id: 'CODE128', nombre: 'Code 128' },
  { id: 'CODE39', nombre: 'Code 39' },
  { id: 'EAN13', nombre: 'EAN-13' },
  { id: 'EAN8', nombre: 'EAN-8' },
  { id: 'UPC', nombre: 'UPC-A' },
  { id: 'QR', nombre: 'QR Code' },
  { id: 'DATAMATRIX', nombre: 'DataMatrix' },
]

export const FUENTES_ZPL = [
  { id: '0', nombre: 'Font 0 (Mono)', ancho: 10 },
  { id: '1', nombre: 'Font 1', ancho: 8 },
  { id: '2', nombre: 'Font 2', ancho: 10 },
  { id: '3', nombre: 'Font 3', ancho: 12 },
  { id: '4', nombre: 'Font 4', ancho: 14 },
  { id: '5', nombre: 'Font 5', ancho: 20 },
  { id: 'A', nombre: 'Font A', ancho: 5 },
  { id: 'B', nombre: 'Font B', ancho: 8 },
]

export const MODELOS_IMPRESORA: Record<TipoImpresora, ModeloImpresora[]> = {
  ZEBRA: [
    { id: 'ZT410', nombre: 'Zebra ZT410', dpi: 300, tipoImpresora: 'ZEBRA' },
    { id: 'ZT230', nombre: 'Zebra ZT230', dpi: 203, tipoImpresora: 'ZEBRA' },
    { id: 'ZD420', nombre: 'Zebra ZD420', dpi: 203, tipoImpresora: 'ZEBRA' },
    { id: 'ZD620', nombre: 'Zebra ZD620', dpi: 300, tipoImpresora: 'ZEBRA' },
    { id: 'GK420', nombre: 'Zebra GK420', dpi: 203, tipoImpresora: 'ZEBRA' },
  ],
  DATAMAX: [
    { id: 'MARK_II', nombre: 'Datamax Mark II', dpi: 203, tipoImpresora: 'DATAMAX' },
    { id: 'I-4208', nombre: 'Datamax I-4208', dpi: 203, tipoImpresora: 'DATAMAX' },
    { id: 'I-4212', nombre: 'Datamax I-4212', dpi: 203, tipoImpresora: 'DATAMAX' },
    { id: 'I-4406', nombre: 'Datamax I-4406', dpi: 203, tipoImpresora: 'DATAMAX' },
  ]
}
