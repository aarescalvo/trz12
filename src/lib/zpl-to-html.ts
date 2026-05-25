/**
 * Parser ZPL -> HTML para renderizar plantillas de rótulos
 * Convierte comandos ZPL principales en elementos HTML posicionados con CSS.
 * Diseñado para impresora predeterminada de Windows (window.print()).
 */

interface ZplElement {
  type: 'text' | 'barcode' | 'line' | 'box' | 'graphic'
  x: number
  y: number
  width?: number
  height?: number
  content?: string
  fontSize?: number
  fontWeight?: string
  barcodeType?: string
  barcodeHeight?: number
  thickness?: number
  border?: number
  borderColor?: string
}

interface ParseResult {
  elements: ZplElement[]
  labelWidth: number
  labelHeight: number
  dpi: number
}

const DEFAULT_DPI = 203

/**
 * Parsea un string ZPL y devuelve los elementos visuales + dimensiones
 */
export function parseZPL(zpl: string, dpi: number = DEFAULT_DPI): ParseResult {
  const lines = zpl.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  const elements: ZplElement[] = []
  let labelWidth = 800 // 100mm default @ 203dpi
  let labelHeight = 400 // 50mm default @ 203dpi

  let currentElement: Partial<ZplElement> = {}
  let pendingFieldData = false
  let barcodeType = ''
  let barcodeData = ''
  let barcodeHeight = 100
  let fontName = '0' // default font
  let fontHeight = 20
  let fontWidth = 20
  let fieldOrientation = 'N' // N=Normal, R=Rotated, I=Inverted, B=Bottom-up

  for (const line of lines) {
    // Comandos de configuración de etiqueta
    if (line.startsWith('^PW')) {
      labelWidth = parseInt(line.slice(3)) || 800
      continue
    }
    if (line.startsWith('^LL')) {
      labelHeight = parseInt(line.slice(3)) || 400
      continue
    }

    // Configuración de barcode
    if (line.startsWith('^BY')) {
      const parts = line.slice(3).split(',').map(p => p.trim())
      const moduleWidth = parseFloat(parts[0]) || 2
      const ratio = parseFloat(parts[1]) || 2
      barcodeHeight = parseInt(parts[2]) || 10
      barcodeHeight = barcodeHeight * moduleWidth * dpi / 203 // Convert to dots
      continue
    }

    // Tipos de barcode
    if (line.startsWith('^BC')) {
      // Code 128
      const params = line.slice(2).split(',').map(p => p.trim())
      barcodeHeight = parseInt(params[0]) || 100
      barcodeType = 'CODE128'
      pendingFieldData = true
      continue
    }
    if (line.startsWith('^BE')) {
      barcodeType = 'EAN13'
      pendingFieldData = true
      continue
    }
    if (line.startsWith('^BQ')) {
      barcodeType = 'QR'
      pendingFieldData = true
      continue
    }
    if (line.startsWith('^B3')) {
      // Code 39
      const params = line.slice(2).split(',').map(p => p.trim())
      barcodeHeight = parseInt(params[0]) || 100
      barcodeType = 'CODE39'
      pendingFieldData = true
      continue
    }
    if (line.startsWith('^FD')) {
      const data = line.slice(3)
      if (pendingFieldData && barcodeType) {
        barcodeData = data
        continue
      }
      if (currentElement.x !== undefined) {
        currentElement.content = data
        pendingFieldData = false
        continue
      }
    }
    if (line.startsWith('^FS')) {
      // Field Separator - flush current element
      if (barcodeType && barcodeData) {
        elements.push({
          type: 'barcode',
          x: currentElement.x || 0,
          y: currentElement.y || 0,
          width: currentElement.width,
          content: barcodeData,
          barcodeType: barcodeType,
          barcodeHeight: barcodeHeight,
        })
        barcodeType = ''
        barcodeData = ''
        pendingFieldData = false
      } else if (currentElement.x !== undefined && currentElement.content) {
        elements.push({
          type: 'text',
          x: currentElement.x || 0,
          y: currentElement.y || 0,
          content: currentElement.content,
          fontSize: Math.round((fontHeight / dpi) * 25.4 * 3.5), // dots to roughly px
          fontWeight: fontHeight >= 40 ? 'bold' : 'normal',
          width: currentElement.width,
        })
      } else if (currentElement.x !== undefined && (currentElement.type === 'line' || currentElement.type === 'box')) {
        elements.push({
          type: currentElement.type!,
          x: currentElement.x,
          y: currentElement.y || 0,
          width: currentElement.width,
          height: currentElement.height,
          thickness: currentElement.thickness,
          border: currentElement.border,
          borderColor: currentElement.borderColor,
        })
      }

      // Reset
      currentElement = {}
      barcodeType = ''
      barcodeData = ''
      pendingFieldData = false
      fontHeight = 20
      fontWidth = 20
      fontName = '0'
      fieldOrientation = 'N'
      continue
    }

    // Posición del campo
    if (line.startsWith('^FO')) {
      const params = line.slice(3).split(',').map(p => p.trim())
      currentElement.x = parseInt(params[0]) || 0
      currentElement.y = parseInt(params[1]) || 0
      continue
    }

    // Posición relativa
    if (line.startsWith('^A0')) {
      const params = line.slice(2).split(',').map(p => p.trim())
      fieldOrientation = params[0] || 'N'
      fontHeight = parseInt(params[1]) || 20
      fontWidth = parseInt(params[2]) || 20
      continue
    }
    if (line.match(/^A\d/)) {
      // Alternative font command
      const params = line.slice(2).split(',').map(p => p.trim())
      fieldOrientation = params[0] || 'N'
      fontHeight = parseInt(params[1]) || 20
      fontWidth = parseInt(params[2]) || 20
      continue
    }
    if (line.startsWith('^CF')) {
      // Change Default Font
      const params = line.slice(3).split(',').map(p => p.trim())
      fontHeight = parseInt(params[0]) || 20
      fontWidth = parseInt(params[1]) || 20
      continue
    }
    if (line.startsWith('^AD')) {
      // ^AD orientation,height,width
      const params = line.slice(3).split(',').map(p => p.trim())
      fieldOrientation = params[0] || 'N'
      fontHeight = parseInt(params[1]) || 20
      fontWidth = parseInt(params[2]) || 20
      continue
    }

    // Línea
    if (line.startsWith('^GB')) {
      const params = line.slice(3).split(',').map(p => p.trim())
      const w = parseInt(params[0]) || 0
      const h = parseInt(params[1]) || 1
      const thickness = parseInt(params[2]) || 1
      const border = params[3] || 'B'
      const borderColor = params[4] || 'B'

      // Si w o h son 1-2, es una línea. Si ambos son grandes, es una caja.
      if (w <= 2 || h <= 2) {
        currentElement.type = 'line'
        currentElement.width = w
        currentElement.height = h
        currentElement.thickness = thickness
        currentElement.borderColor = borderColor === 'W' ? 'white' : 'black'
      } else {
        currentElement.type = 'box'
        currentElement.width = w
        currentElement.height = h
        currentElement.thickness = thickness
        currentElement.border = border === 'B' ? 1 : 0
        currentElement.borderColor = borderColor === 'W' ? 'white' : 'black'
      }
      continue
    }

    // Ancho de campo para texto multilinea
    if (line.startsWith('^FB')) {
      const params = line.slice(3).split(',').map(p => p.trim())
      currentElement.width = parseInt(params[0]) || 200
      continue
    }

    // ^CI - Character set (ignorar)
    // ^FX - Comment (ignorar)
    // ^XA, ^XZ - Start/End label (ignorar)
    // ^PQ - Quantity (ignorar)
    // ^PR - Speed (ignorar)
    // ~SD - Darkness (ignorar)
  }

  return { elements, labelWidth, labelHeight, dpi }
}

/**
 * Genera un HTML completo listo para window.print() a partir de elementos ZPL parseados
 */
export function zplToHTML(
  zpl: string,
  datos: Record<string, string>,
  options: {
    anchoMm?: number
    altoMm?: number
    dpi?: number
    copias?: number
  } = {}
): string {
  const { anchoMm, altoMm, dpi = DEFAULT_DPI, copias = 1 } = options
  const parsed = parseZPL(zpl, dpi)

  const widthMm = anchoMm || Math.round((parsed.labelWidth / dpi) * 25.4)
  const heightMm = altoMm || Math.round((parsed.labelHeight / dpi) * 25.4)

  // Escala: de dots ZPL a porcentajes dentro del HTML
  const scaleX = (dots: number | string) => ((Number(dots) / parsed.labelWidth) * 96).toFixed(1)
  const scaleY = (dots: number | string) => ((Number(dots) / parsed.labelHeight) * 96).toFixed(1)
  const scaleFont = (dots: number) => Math.round((dots / parsed.labelWidth) * 96 * 0.8)

  const barcodeScripts: string[] = []
  const barcodeElements: string[] = []
  let barcodeCounter = 0

  const renderElements = parsed.elements.map(el => {
    const left = scaleX(el.x)
    const top = scaleY(el.y)

    switch (el.type) {
      case 'text': {
        const fontSize = scaleFont(el.fontSize || 20)
        const maxW = el.width ? scaleX(el.width) : undefined
        const fontWeight = el.fontSize && el.fontSize > 14 ? 'bold' : 'normal'
        return `<div style="position:absolute;left:${left}vw;top:${top}vh;font-size:${fontSize}vw;font-weight:${fontWeight};font-family:Arial,sans-serif;color:#000;white-space:nowrap;line-height:1.1;${maxW ? `max-width:${maxW}vw;` : ''}">${escapeHtml(el.content || '')}</div>`
      }
      case 'barcode': {
        const barcodeId = `bc-${barcodeCounter++}`
        const barHeight = el.barcodeHeight ? scaleY(el.barcodeHeight) : '15vh'
        barcodeScripts.push(`try{JsBarcode("#${barcodeId}","${escapeJs(el.content || '')}",{format:"${el.barcodeType}",width:2,height:60,displayValue:false,margin:0,fontSize:10})}catch(e){document.getElementById("${barcodeId}").outerHTML='<div style="font-size:8vw;font-family:monospace;text-align:center">${escapeHtml(el.content || '')}</div>'}`)
        return `<div style="position:absolute;left:${left}vw;top:${top}vh;"><svg id="${barcodeId}" style="height:${barHeight};max-width:90vw;"></svg></div>`
      }
      case 'line': {
        const w = el.width ? scaleX(el.width) : '100vw'
        const h = el.thickness ? Math.max(parseFloat(scaleY(String(el.thickness))), 0.3) : 0.3
        const color = el.borderColor || '#000'
        if (parseInt(String(el.height || 0)) > 5) {
          // Vertical line
          return `<div style="position:absolute;left:${left}vw;top:${top}vh;width:${h}vh;height:${scaleY(el.height || 100)};background:${color};"></div>`
        }
        return `<div style="position:absolute;left:${left}vw;top:${top}vh;width:${w};height:${h}vh;background:${color};"></div>`
      }
      case 'box': {
        const w = el.width ? scaleX(el.width) : '50vw'
        const h = el.height ? scaleY(el.height) : '20vh'
        const borderW = el.thickness ? Math.max(parseFloat(scaleY(String(el.thickness))), 0.3) : 0.3
        const color = el.borderColor || '#000'
        return `<div style="position:absolute;left:${left}vw;top:${top}vh;width:${w};height:${h};border:${borderW}vh solid ${color};"></div>`
      }
      default:
        return ''
    }
  }).join('\n')

  const copiasHtml = Array.from({ length: copias }, (_, i) => `
    <div class="label" style="width:${widthMm}mm;height:${heightMm}mm;position:relative;overflow:hidden;page-break-after:always;border:1px dashed #ccc;margin-bottom:2mm;">
      ${renderElements}
    </div>
  `).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Rótulo</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
  <style>
    @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: white; }
    .label { background: white; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .label { border: none !important; }
    }
  </style>
</head>
<body>
  ${copiasHtml}
  <script>
    ${barcodeScripts.join(';\n')}
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeJs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'")
}
