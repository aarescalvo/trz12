/**
 * Funciones de impresión para Romaneo General - Resumen Diario de Faena
 * Frigorífico "Solemar Alimentaria"
 * 
 * Formato basado en template Excel: ROMANEO VACUNO T61 06022026.pdf.xlsx
 */

// Configuración de la empresa
const EMPRESA = {
  nombre: 'SOLEMAR ALIMENTARIA S.A.',
  establecimiento: 'N° 300',
  senasa: '3986'
}

// Configuración de paginación
const ROWS_PER_PAGE = 30 // Filas por página (similar al Excel)

export interface RomaneoItem {
  garron: number
  tropaCodigo: string
  tropaNumero: number
  tipificacion: string
  pesoMediaIzq: number
  pesoMediaDer: number
}

export interface ResumenTipo {
  tipo: string
  cantidad: number
}

export interface ResumenTropa {
  tropaNumero: number
  cantidad: number
  tipos: ResumenTipo[]
}

export interface RomaneoGeneralOptions {
  fecha: Date
  romaneos: RomaneoItem[]
  resumenPorTropa: ResumenTropa[]
}

/**
 * Formatea fecha en formato argentino
 */
function formatFecha(fecha: Date): string {
  const dia = String(fecha.getDate()).padStart(2, '0')
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const año = fecha.getFullYear()
  return `${dia}/${mes}/${año}`
}

/**
 * Agrupa los romaneos por tropa para el resumen
 */
function agruparPorTropa(romaneos: RomaneoItem[]): Map<number, RomaneoItem[]> {
  const grupos = new Map<number, RomaneoItem[]>()
  
  for (const item of romaneos) {
    const existing = grupos.get(item.tropaNumero) || []
    existing.push(item)
    grupos.set(item.tropaNumero, existing)
  }
  
  return grupos
}

/**
 * Calcula totales del resumen
 */
function calcularTotales(romaneos: RomaneoItem[]): {
  totalCabezas: number
  totalKgDer: number
  totalKgIzq: number
  totalKg: number
} {
  const totalKgDer = romaneos.reduce((acc, r) => acc + r.pesoMediaDer, 0)
  const totalKgIzq = romaneos.reduce((acc, r) => acc + r.pesoMediaIzq, 0)
  
  return {
    totalCabezas: romaneos.length,
    totalKgDer,
    totalKgIzq,
    totalKg: totalKgDer + totalKgIzq
  }
}

/**
 * Imprime el Romaneo General - Resumen Diario de Faena
 * 
 * Formato A4 con paginación automática
 * Incluye:
 * - Header con fecha
 * - Tabla de animales (N° Garrón, Tropa, Tipificación, KG 1/2 der, KG 1/2 izq)
 * - Resumen por tropa al final
 */
export function imprimirRomaneoGeneral(data: RomaneoGeneralOptions) {
  const { fecha, romaneos, resumenPorTropa } = data
  
  if (romaneos.length === 0) {
    alert('No hay datos de romaneo para imprimir')
    return
  }
  
  const printWindow = window.open('', '_blank', 'width=800,height=1100')
  if (!printWindow) {
    alert('No se pudo abrir la ventana de impresión. Verifique que no esté bloqueada.')
    return
  }
  
  const fechaFormateada = formatFecha(fecha)
  const totales = calcularTotales(romaneos)
  
  // Calcular páginas necesarias
  const totalPages = Math.ceil(romaneos.length / ROWS_PER_PAGE)
  
  // Generar contenido de páginas
  let pagesHTML = ''
  
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const startIdx = (pageNum - 1) * ROWS_PER_PAGE
    const endIdx = Math.min(startIdx + ROWS_PER_PAGE, romaneos.length)
    const pageRomaneos = romaneos.slice(startIdx, endIdx)
    const isLastPage = pageNum === totalPages
    
    pagesHTML += `
      <div class="page">
        <!-- Header -->
        <div class="header">
          <div class="header-title">ROMANEO FAENA BOVINA</div>
          <div class="header-date">FECHA: ${fechaFormateada}</div>
        </div>
        
        <!-- Tabla -->
        <table class="romaneo-table">
          <thead>
            <tr>
              <th class="col-garron">N° GARRON</th>
              <th class="col-tropa">TROPA</th>
              <th class="col-tipo">TIPIFICACION</th>
              <th class="col-kg">KG 1/2 der</th>
              <th class="col-kg">KG 1/2 izq</th>
            </tr>
          </thead>
          <tbody>
            ${pageRomaneos.map(r => `
              <tr>
                <td class="col-garron">${r.garron}</td>
                <td class="col-tropa">${r.tropaNumero}</td>
                <td class="col-tipo">${r.tipificacion}</td>
                <td class="col-kg">${r.pesoMediaDer.toFixed(1)}</td>
                <td class="col-kg">${r.pesoMediaIzq.toFixed(1)}</td>
              </tr>
            `).join('')}
            ${isLastPage ? `
              <!-- Fila de totales -->
              <tr class="total-row">
                <td colspan="3" class="total-label">TOTALES</td>
                <td class="col-kg total-value">${totales.totalKgDer.toFixed(1)}</td>
                <td class="col-kg total-value">${totales.totalKgIzq.toFixed(1)}</td>
              </tr>
            ` : ''}
          </tbody>
        </table>
        
        ${isLastPage && resumenPorTropa.length > 0 ? `
          <!-- Resumen por tropa -->
          <div class="resumen-section">
            <table class="resumen-table">
              <thead>
                <tr>
                  <th>TROPA N°</th>
                  <th>CANTIDAD</th>
                  <th>TIPO</th>
                  <th>CANTIDAD</th>
                  <th>TIPO</th>
                </tr>
              </thead>
              <tbody>
                ${generarFilasResumen(resumenPorTropa)}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        <!-- Pie de página con número de página -->
        <div class="page-footer">
          <div class="footer-left">${EMPRESA.nombre} - Est. ${EMPRESA.establecimiento} - SENASA ${EMPRESA.senasa}</div>
          <div class="footer-right">Página ${pageNum} de ${totalPages}</div>
        </div>
      </div>
    `
  }
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Romaneo General - ${fechaFormateada}</title>
      <style>
        @page {
          size: A4;
          margin: 10mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 10px;
          background: #f0f0f0;
        }
        
        /* Cada página */
        .page {
          width: 190mm;
          min-height: 277mm;
          background: white;
          padding: 5mm;
          margin: 0 auto 10mm;
          page-break-after: always;
          position: relative;
        }
        
        .page:last-child {
          page-break-after: auto;
        }
        
        /* Header */
        .header {
          text-align: center;
          margin-bottom: 5mm;
          padding-bottom: 3mm;
          border-bottom: 2px solid #000;
        }
        
        .header-title {
          font-size: 18px;
          font-weight: bold;
          letter-spacing: 2px;
          margin-bottom: 2mm;
        }
        
        .header-date {
          font-size: 12px;
          font-weight: bold;
        }
        
        /* Tabla principal */
        .romaneo-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 5mm;
        }
        
        .romaneo-table th {
          background: #1a1a1a;
          color: white;
          padding: 3mm 2mm;
          text-align: center;
          font-size: 9px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .romaneo-table td {
          padding: 2mm;
          border-bottom: 1px solid #ddd;
          text-align: center;
        }
        
        .romaneo-table tr:nth-child(even) {
          background: #f9f9f9;
        }
        
        /* Columnas */
        .col-garron {
          width: 15%;
          font-weight: bold;
        }
        
        .col-tropa {
          width: 12%;
        }
        
        .col-tipo {
          width: 33%;
          text-align: left !important;
        }
        
        .col-kg {
          width: 20%;
          font-family: 'Courier New', monospace;
        }
        
        /* Fila de totales */
        .total-row {
          background: #f0f0f0 !important;
          font-weight: bold;
          border-top: 2px solid #000;
        }
        
        .total-label {
          text-align: right !important;
          padding-right: 5mm !important;
          font-size: 11px;
        }
        
        .total-value {
          font-weight: bold;
          font-size: 11px;
          background: #e8e8e8;
        }
        
        /* Sección de resumen */
        .resumen-section {
          margin-top: 8mm;
          padding-top: 5mm;
          border-top: 2px solid #000;
        }
        
        .resumen-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .resumen-table th {
          background: #333;
          color: white;
          padding: 2mm 3mm;
          text-align: center;
          font-size: 9px;
          font-weight: bold;
        }
        
        .resumen-table td {
          padding: 2mm 3mm;
          border-bottom: 1px solid #ddd;
          text-align: center;
        }
        
        .resumen-table tr:nth-child(even) {
          background: #f9f9f9;
        }
        
        /* Pie de página */
        .page-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          padding: 3mm 5mm;
          font-size: 8px;
          color: #666;
          border-top: 1px solid #ddd;
          background: white;
        }
        
        .footer-left {
          text-align: left;
        }
        
        .footer-right {
          text-align: right;
          font-weight: bold;
        }
        
        @media print {
          body {
            background: white;
          }
          
          .page {
            margin: 0;
            padding: 0;
            page-break-after: always;
          }
          
          .page:last-child {
            page-break-after: auto;
          }
        }
      </style>
    </head>
    <body>
      ${pagesHTML}
      
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.onafterprint = function() { window.close(); }
          }, 300);
        }
      </script>
    </body>
    </html>
  `)
  
  printWindow.document.close()
}

/**
 * Genera las filas del resumen por tropa
 * Formato: TROPA N° | CANTIDAD | TIPO | CANTIDAD | TIPO
 * 
 * Cada tropa puede tener múltiples tipos, se organizan en columnas
 */
function generarFilasResumen(resumenPorTropa: ResumenTropa[]): string {
  let filas = ''
  
  for (const tropa of resumenPorTropa) {
    // Ordenar tipos por cantidad descendente
    const tiposOrdenados = [...tropa.tipos].sort((a, b) => b.cantidad - a.cantidad)
    
    // Calcular total de animales en la tropa
    const totalTropa = tropa.tipos.reduce((acc, t) => acc + t.cantidad, 0)
    
    // Agrupar tipos en pares para mostrar en 2 columnas
    for (let i = 0; i < tiposOrdenados.length; i += 2) {
      const tipo1 = tiposOrdenados[i]
      const tipo2 = tiposOrdenados[i + 1]
      
      // Solo mostrar TROPA N° y CANTIDAD en la primera fila de cada tropa
      const esPrimeraFila = i === 0
      
      filas += `
        <tr>
          <td style="font-weight: ${esPrimeraFila ? 'bold' : 'normal'}">
            ${esPrimeraFila ? tropa.tropaNumero : ''}
          </td>
          <td style="font-weight: ${esPrimeraFila ? 'bold' : 'normal'}">
            ${esPrimeraFila ? totalTropa : ''}
          </td>
          <td>${tipo1.tipo}</td>
          <td>${tipo1.cantidad}</td>
          <td>${tipo2 ? tipo2.tipo : ''}</td>
        </tr>
      `
    }
  }
  
  return filas
}

/**
 * Imprime romaneo individual por tropa
 * Una página por tropa con detalle completo
 */
export function imprimirRomaneoPorTropa(
  fecha: Date,
  tropaNumero: number,
  romaneos: RomaneoItem[],
  tipos: ResumenTipo[]
) {
  const printWindow = window.open('', '_blank', 'width=800,height=1100')
  if (!printWindow) return
  
  const fechaFormateada = formatFecha(fecha)
  const totales = calcularTotales(romaneos)
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Romaneo Tropa ${tropaNumero}</title>
      <style>
        @page { size: A4; margin: 10mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 10px; padding: 5mm; }
        
        .header {
          text-align: center;
          margin-bottom: 5mm;
          padding-bottom: 3mm;
          border-bottom: 2px solid #000;
        }
        
        .header-title { font-size: 16px; font-weight: bold; margin-bottom: 2mm; }
        .header-subtitle { font-size: 14px; font-weight: bold; color: #333; }
        .header-date { font-size: 11px; margin-top: 2mm; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 5mm; }
        
        th {
          background: #1a1a1a;
          color: white;
          padding: 2mm;
          text-align: center;
          font-size: 9px;
        }
        
        td {
          padding: 2mm;
          border-bottom: 1px solid #ddd;
          text-align: center;
        }
        
        tr:nth-child(even) { background: #f9f9f9; }
        
        .total-row {
          background: #f0f0f0 !important;
          font-weight: bold;
          border-top: 2px solid #000;
        }
        
        .resumen {
          margin-top: 5mm;
          padding: 3mm;
          background: #f9f9f9;
          border: 1px solid #ddd;
        }
        
        .resumen-title {
          font-weight: bold;
          margin-bottom: 2mm;
          border-bottom: 1px solid #ddd;
          padding-bottom: 1mm;
        }
        
        .resumen-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2mm;
        }
        
        .resumen-item {
          text-align: center;
          padding: 2mm;
          background: white;
          border: 1px solid #ddd;
        }
        
        .resumen-item .label { font-size: 8px; color: #666; }
        .resumen-item .value { font-size: 12px; font-weight: bold; }
        
        .footer {
          margin-top: 10mm;
          text-align: center;
          font-size: 8px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 3mm;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-title">ROMANEO FAENA BOVINA</div>
        <div class="header-subtitle">TROPA N° ${tropaNumero}</div>
        <div class="header-date">FECHA: ${fechaFormateada}</div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>N° GARRON</th>
            <th>TIPIFICACION</th>
            <th>KG 1/2 der</th>
            <th>KG 1/2 izq</th>
            <th>TOTAL KG</th>
          </tr>
        </thead>
        <tbody>
          ${romaneos.map(r => `
            <tr>
              <td style="font-weight: bold">${r.garron}</td>
              <td>${r.tipificacion}</td>
              <td>${r.pesoMediaDer.toFixed(1)}</td>
              <td>${r.pesoMediaIzq.toFixed(1)}</td>
              <td style="font-weight: bold">${(r.pesoMediaDer + r.pesoMediaIzq).toFixed(1)}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="2">TOTALES</td>
            <td>${totales.totalKgDer.toFixed(1)}</td>
            <td>${totales.totalKgIzq.toFixed(1)}</td>
            <td>${totales.totalKg.toFixed(1)}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="resumen">
        <div class="resumen-title">RESUMEN POR TIPO</div>
        <div class="resumen-grid">
          ${tipos.map(t => `
            <div class="resumen-item">
              <div class="label">${t.tipo}</div>
              <div class="value">${t.cantidad}</div>
            </div>
          `).join('')}
          <div class="resumen-item">
            <div class="label">TOTAL CABEZAS</div>
            <div class="value">${romaneos.length}</div>
          </div>
        </div>
      </div>
      
      <div class="footer">
        ${EMPRESA.nombre} - Est. ${EMPRESA.establecimiento} - SENASA ${EMPRESA.senasa}
      </div>
      
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.onafterprint = function() { window.close(); }
          }, 300);
        }
      </script>
    </body>
    </html>
  `)
  
  printWindow.document.close()
}

/**
 * Imprime solo la tabla de romaneo (para incrustar en otros reportes)
 */
export function generarTablaRomaneoHTML(romaneos: RomaneoItem[], incluirTotales: boolean = true): string {
  const totales = calcularTotales(romaneos)
  
  return `
    <table class="romaneo-table" style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #1a1a1a; color: white;">
          <th style="padding: 8px; text-align: center;">N° GARRON</th>
          <th style="padding: 8px; text-align: center;">TROPA</th>
          <th style="padding: 8px; text-align: center;">TIPIFICACION</th>
          <th style="padding: 8px; text-align: center;">KG 1/2 der</th>
          <th style="padding: 8px; text-align: center;">KG 1/2 izq</th>
        </tr>
      </thead>
      <tbody>
        ${romaneos.map((r, idx) => `
          <tr style="background: ${idx % 2 === 0 ? 'white' : '#f9f9f9'};">
            <td style="padding: 6px; text-align: center; border-bottom: 1px solid #ddd; font-weight: bold;">${r.garron}</td>
            <td style="padding: 6px; text-align: center; border-bottom: 1px solid #ddd;">${r.tropaNumero}</td>
            <td style="padding: 6px; text-align: left; border-bottom: 1px solid #ddd;">${r.tipificacion}</td>
            <td style="padding: 6px; text-align: center; border-bottom: 1px solid #ddd; font-family: monospace;">${r.pesoMediaDer.toFixed(1)}</td>
            <td style="padding: 6px; text-align: center; border-bottom: 1px solid #ddd; font-family: monospace;">${r.pesoMediaIzq.toFixed(1)}</td>
          </tr>
        `).join('')}
        ${incluirTotales ? `
          <tr style="background: #f0f0f0; font-weight: bold; border-top: 2px solid #000;">
            <td colspan="3" style="padding: 8px; text-align: right;">TOTALES</td>
            <td style="padding: 8px; text-align: center;">${totales.totalKgDer.toFixed(1)}</td>
            <td style="padding: 8px; text-align: center;">${totales.totalKgIzq.toFixed(1)}</td>
          </tr>
        ` : ''}
      </tbody>
    </table>
  `
}
