import JsBarcode from 'jsbarcode';
import { createCanvas } from 'canvas';

// Code 128 barcode configuration
export interface BarcodeOptions {
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
  format?: 'CODE128' | 'CODE128A' | 'CODE128B' | 'CODE128C' | 'EAN13' | 'EAN8' | 'UPC';
}

const defaultOptions: BarcodeOptions = {
  width: 2,
  height: 100,
  displayValue: true,
  fontSize: 16,
  margin: 10,
  format: 'CODE128',
};

/**
 * Generate a Code 128 barcode as SVG string
 */
export function generateBarcodeSVG(code: string, options: BarcodeOptions = {}): string {
  const opts = { ...defaultOptions, ...options };
  
  try {
    // Create a mock canvas for server-side rendering
    const canvas = createCanvas(400, 150);
    JsBarcode(canvas as unknown as HTMLCanvasElement, code, {
      format: opts.format,
      width: opts.width,
      height: opts.height,
      displayValue: opts.displayValue,
      fontSize: opts.fontSize,
      margin: opts.margin,
    });
    
     
    return (canvas as any).toBuffer('image/svg+xml').toString('utf-8');
  } catch (error) {
    throw new Error(`Error generando código de barras: ${error}`);
  }
}

/**
 * Generate a Code 128 barcode as PNG data URL
 */
export function generateBarcodeDataURL(code: string, options: BarcodeOptions = {}): string {
  const opts = { ...defaultOptions, ...options };
  
  try {
    const canvas = createCanvas(400, 150);
    JsBarcode(canvas as unknown as HTMLCanvasElement, code, {
      format: opts.format,
      width: opts.width,
      height: opts.height,
      displayValue: opts.displayValue,
      fontSize: opts.fontSize,
      margin: opts.margin,
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    throw new Error(`Error generando código de barras: ${error}`);
  }
}

/**
 * Generate a Code 128 barcode as PNG buffer
 */
export function generateBarcodePNG(code: string, options: BarcodeOptions = {}): Buffer {
  const opts = { ...defaultOptions, ...options };
  
  try {
    const canvas = createCanvas(400, 150);
    JsBarcode(canvas as unknown as HTMLCanvasElement, code, {
      format: opts.format,
      width: opts.width,
      height: opts.height,
      displayValue: opts.displayValue,
      fontSize: opts.fontSize,
      margin: opts.margin,
    });
    
    return canvas.toBuffer('image/png');
  } catch (error) {
    throw new Error(`Error generando código de barras: ${error}`);
  }
}

/**
 * Generate EAN-128 (GS1-128) format code with Application Identifiers
 * Common AIs:
 * - 01: GTIN (Global Trade Item Number)
 * - 10: Batch number
 * - 11: Production date (YYMMDD)
 * - 17: Expiration date (YYMMDD)
 * - 21: Serial number
 * - 310x: Net weight in kg (x = decimal places)
 */
export function generateEAN128Code(ai: string, value: string): string {
  // EAN-128 uses FNC1 character (represented as Ñ in Code 128 C)
  return `(${ai})${value}`;
}

/**
 * Generate barcode for media res (half carcass)
 * Format: TROPA-GARRON-LADO (e.g., B20260001-001-I)
 */
export function generateMediaResBarcode(
  tropaCodigo: string,
  garron: number,
  lado: 'I' | 'D'
): string {
  const garronStr = garron.toString().padStart(3, '0');
  return `${tropaCodigo}-${garronStr}-${lado}`;
}

/**
 * Generate barcode for product label with EAN-128
 */
export function generateProductoEAN128(
  gtin: string,
  lote: string,
  fechaVencimiento: Date,
  pesoKg?: number
): string {
  let code = `01${gtin}`;
  code += `10${lote}`;
  
  // Expiration date YYMMDD
  const fecha = fechaVencimiento;
  const yy = fecha.getFullYear().toString().slice(-2);
  const mm = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const dd = fecha.getDate().toString().padStart(2, '0');
  code += `17${yy}${mm}${dd}`;
  
  // Weight if provided (AI 310x - net weight in kg)
  if (pesoKg) {
    const peso = Math.round(pesoKg * 1000); // Convert to grams, 3 decimal places
    const pesoStr = peso.toString().padStart(6, '0');
    code += `3103${pesoStr}`;
  }
  
  return code;
}

/**
 * Validate a Code 128 barcode
 */
export function validateBarcode(code: string): boolean {
  if (!code || code.length === 0) return false;
  
  // Code 128 can contain ASCII 32-126
  const validChars = /^[\x20-\x7E]+$/;
  return validChars.test(code);
}

/**
 * Generate batch of barcodes for printing
 */
export function generateBatchBarcodes(
  codes: string[],
  options: BarcodeOptions = {}
): Array<{ code: string; dataURL: string; valid: boolean }> {
  return codes.map(code => {
    try {
      const valid = validateBarcode(code);
      const dataURL = valid ? generateBarcodeDataURL(code, options) : '';
      return { code, dataURL, valid };
    } catch {
      return { code, dataURL: '', valid: false };
    }
  });
}

/**
 * Generate print sheet HTML with multiple barcodes
 */
export function generatePrintSheet(
  items: Array<{ code: string; label?: string }>,
  options: {
    columns?: number;
    rows?: number;
    labelWidth?: string;
    labelHeight?: string;
  } = {}
): string {
  const { columns = 3, rows = 10, labelWidth = '6cm', labelHeight = '2.5cm' } = options;
  
  const labels = items.map((item, index) => {
    const barcodeSvg = generateBarcodeSVG(item.code, { height: 60, fontSize: 12 });
    return `
      <div class="label" style="width: ${labelWidth}; height: ${labelHeight}; display: inline-block; text-align: center; border: 1px dashed #ccc; margin: 2px; padding: 5px;">
        ${barcodeSvg}
        ${item.label ? `<div style="font-size: 10px; margin-top: 5px;">${item.label}</div>` : ''}
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Códigos de Barras</title>
      <style>
        @page { size: A4; margin: 1cm; }
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        .sheet { width: 21cm; min-height: 29.7cm; }
        .label { page-break-inside: avoid; }
        @media print {
          .label { border: none; }
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        ${labels}
      </div>
    </body>
    </html>
  `;
}

// Export client-side barcode generator (uses browser canvas)
export function generateBarcodeClient(
  code: string,
  canvas: HTMLCanvasElement,
  options: BarcodeOptions = {}
): void {
  const opts = { ...defaultOptions, ...options };
  
  JsBarcode(canvas, code, {
    format: opts.format,
    width: opts.width,
    height: opts.height,
    displayValue: opts.displayValue,
    fontSize: opts.fontSize,
    margin: opts.margin,
  });
}

// Client-side SVG generator
export function generateBarcodeSVGClient(code: string, options: BarcodeOptions = {}): string {
  const opts = { ...defaultOptions, ...options };
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  JsBarcode(svg, code, {
    format: opts.format,
    width: opts.width,
    height: opts.height,
    displayValue: opts.displayValue,
    fontSize: opts.fontSize,
    margin: opts.margin,
  });
  return svg.outerHTML;
}
