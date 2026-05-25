// Funciones de impresión para Control de Menudencias
// Frigorífico "Solemar Alimentaria"

// Interface para los datos de menudencias
export interface MenudenciaItem {
  articulo: string
  guardadoEnCamara: string | number
  elaboradoKg: number
  bolsas: number
}

export interface PesajeInterno {
  grasa?: number
  lavadito?: number
  bolsaAzul?: number
}

export interface PesajeBascula {
  hueso?: number
  grasa?: number
  despojo?: number
}

export interface MenudenciasData {
  fecha: Date | string
  tropa: string
  lote: number | string
  usuario: string
  items: MenudenciaItem[]
  pesajeInterno?: PesajeInterno
  pesajeBascula?: PesajeBascula
}

// Configuración de la empresa
const EMPRESA = {
  nombre: 'SOLEMAR ALIMENTARIA S.A.',
  direccion: 'Ruta Provincial N° 11 - Km 45.5',
  localidad: 'San Martín, Mendoza',
  cuit: '23-12345678-9',
  telefono: '(0263) 442-1234',
  establecimiento: '12-0345'
}

// Artículos estándar de menudencias
export const ARTICULOS_MENUDENCIAS = [
  'CHINCHULIN (KG)',
  'CORAZON',
  'HIGADO',
  'LENGUA',
  'MOLLEJAS (KG)',
  'RIÑON',
  'TENDON',
  'TRIPA GORDA',
  'CENTRO DE ENTRAÑA',
  'QUIJADA (KG)',
  'RABO',
  'SESOS',
  'CARNE DE CABEZA (KG)'
] as const

/**
 * Formatea fecha a formato argentino
 */
function formatFecha(fecha: Date | string): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Imprimir planilla de control de menudencias
 * Formato basado en template Excel: "ROMANEO VACUNO T61"
 */
export function imprimirMenudencias(data: MenudenciasData) {
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) return

  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '/logo.png'

  // Calcular totales
  const totalElaborado = data.items.reduce((acc, item) => acc + (item.elaboradoKg || 0), 0)
  const totalBolsas = data.items.reduce((acc, item) => acc + (item.bolsas || 0), 0)

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Control de Menudencias - Tropa ${data.tropa}</title>
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
          font-size: 11px;
          width: 190mm;
          background: white;
          padding: 5mm;
        }
        
        /* Header */
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }
        
        .logo-img {
          max-width: 150px;
          max-height: 50px;
          object-fit: contain;
          margin-bottom: 5px;
        }
        
        .empresa-nombre {
          font-size: 16px;
          font-weight: bold;
          letter-spacing: 1px;
        }
        
        .empresa-datos {
          font-size: 9px;
          color: #555;
          margin-top: 2px;
        }
        
        /* Info Section */
        .info-section {
          display: flex;
          justify-content: flex-end;
          gap: 20px;
          margin-bottom: 10px;
          font-size: 11px;
        }
        
        .info-row {
          display: flex;
          gap: 5px;
        }
        
        .info-label {
          font-weight: bold;
        }
        
        /* Usuario */
        .usuario-header {
          background: #f0f0f0;
          padding: 4px 8px;
          border: 1px solid #ccc;
          border-bottom: none;
          font-weight: bold;
          font-size: 10px;
        }
        
        /* Tabla principal */
        .main-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 5px;
        }
        
        .main-table th {
          background: #333;
          color: white;
          padding: 6px 8px;
          text-align: center;
          font-size: 10px;
          font-weight: bold;
        }
        
        .main-table th:first-child {
          text-align: left;
        }
        
        .main-table td {
          padding: 5px 8px;
          border: 1px solid #ccc;
          font-size: 10px;
        }
        
        .main-table td:first-child {
          text-align: left;
          font-weight: 500;
        }
        
        .main-table td:not(:first-child) {
          text-align: center;
        }
        
        .main-table tr:nth-child(even) {
          background: #f9f9f9;
        }
        
        .main-table tr.total-row {
          background: #e0e0e0;
          font-weight: bold;
        }
        
        .main-table tr.total-row td {
          border-top: 2px solid #333;
        }
        
        /* Secciones de pesaje */
        .pesaje-section {
          margin-top: 10px;
        }
        
        .pesaje-header {
          background: #f5f5f5;
          padding: 4px 8px;
          border: 1px solid #ccc;
          border-bottom: none;
          font-weight: bold;
          font-size: 10px;
        }
        
        .pesaje-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .pesaje-table td {
          padding: 4px 8px;
          border: 1px solid #ccc;
          font-size: 10px;
        }
        
        .pesaje-table td:first-child {
          font-weight: bold;
          width: 30%;
        }
        
        /* Firma */
        .firma-section {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
        }
        
        .firma-box {
          width: 45%;
          text-align: center;
        }
        
        .firma-linea {
          border-top: 1px solid #000;
          margin-top: 40px;
          padding-top: 5px;
          font-size: 10px;
        }
        
        /* Footer */
        .footer {
          margin-top: 20px;
          padding-top: 8px;
          border-top: 1px solid #ccc;
          text-align: center;
          font-size: 8px;
          color: #666;
        }
        
        @media print { 
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <img src="${logoUrl}" alt="Logo" class="logo-img" onerror="this.style.display='none'">
        <div class="empresa-nombre">${EMPRESA.nombre}</div>
        <div class="empresa-datos">
          ${EMPRESA.direccion} | ${EMPRESA.localidad} | CUIT: ${EMPRESA.cuit}
        </div>
      </div>
      
      <!-- Título -->
      <div style="text-align: center; font-size: 14px; font-weight: bold; margin: 10px 0; padding: 8px; background: #333; color: white;">
        CONTROL DE MENUDENCIAS
      </div>
      
      <!-- Info -->
      <div class="info-section">
        <div class="info-row">
          <span class="info-label">FECHA:</span>
          <span>${formatFecha(data.fecha)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">TROPA:</span>
          <span>${data.tropa}</span>
        </div>
        <div class="info-row">
          <span class="info-label">LOTE:</span>
          <span>${data.lote}</span>
        </div>
      </div>
      
      <!-- Usuario -->
      <div class="usuario-header">
        USUARIO: ${data.usuario}
      </div>
      
      <!-- Tabla principal de menudencias -->
      <table class="main-table">
        <thead>
          <tr>
            <th>ARTICULO</th>
            <th>GUARDADO EN CAMARA</th>
            <th>ELABORADO KG</th>
            <th>BOLSAS</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td>${item.articulo}</td>
              <td>${typeof item.guardadoEnCamara === 'number' ? item.guardadoEnCamara.toFixed(2) : item.guardadoEnCamara}</td>
              <td>${item.elaboradoKg.toFixed(2)}</td>
              <td>${item.bolsas}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td></td>
            <td>total</td>
            <td>${totalElaborado.toFixed(2)}</td>
            <td>${totalBolsas}</td>
          </tr>
        </tbody>
      </table>
      
      <!-- Pesaje Interno -->
      ${data.pesajeInterno ? `
      <div class="pesaje-section">
        <div class="pesaje-header">PESAJE INTERNO</div>
        <table class="pesaje-table">
          ${data.pesajeInterno.grasa !== undefined ? `
          <tr>
            <td>GRASA</td>
            <td>${data.pesajeInterno.grasa.toFixed(2)} kg</td>
          </tr>
          ` : ''}
          ${data.pesajeInterno.lavadito !== undefined ? `
          <tr>
            <td>LAVADITO</td>
            <td>${data.pesajeInterno.lavadito.toFixed(2)} kg</td>
          </tr>
          ` : ''}
          ${data.pesajeInterno.bolsaAzul !== undefined ? `
          <tr>
            <td>BOLSA AZUL</td>
            <td>${data.pesajeInterno.bolsaAzul.toFixed(2)} kg</td>
          </tr>
          ` : ''}
        </table>
      </div>
      ` : ''}
      
      <!-- Pesaje Báscula - Manitou -->
      ${data.pesajeBascula ? `
      <div class="pesaje-section">
        <div class="pesaje-header">PESAJE BASCULA - MANITOU</div>
        <table class="pesaje-table">
          ${data.pesajeBascula.hueso !== undefined ? `
          <tr>
            <td>HUESO</td>
            <td>${data.pesajeBascula.hueso.toFixed(2)} kg</td>
          </tr>
          ` : ''}
          ${data.pesajeBascula.grasa !== undefined ? `
          <tr>
            <td>GRASA</td>
            <td>${data.pesajeBascula.grasa.toFixed(2)} kg</td>
          </tr>
          ` : ''}
          ${data.pesajeBascula.despojo !== undefined ? `
          <tr>
            <td>DESPOJO</td>
            <td>${data.pesajeBascula.despojo.toFixed(2)} kg</td>
          </tr>
          ` : ''}
        </table>
      </div>
      ` : ''}
      
      <!-- Firmas -->
      <div class="firma-section">
        <div class="firma-box">
          <div class="firma-linea">Responsable Producción</div>
        </div>
        <div class="firma-box">
          <div class="firma-linea">Responsable Calidad</div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <p>Documento generado: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}</p>
        <p>${EMPRESA.nombre} | Est. N° ${EMPRESA.establecimiento}</p>
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
 * Crear datos de menudencias vacíos para una nueva planilla
 */
export function createEmptyMenudenciasData(
  fecha: Date | string,
  tropa: string,
  lote: number | string,
  usuario: string
): MenudenciasData {
  return {
    fecha,
    tropa,
    lote,
    usuario,
    items: ARTICULOS_MENUDENCIAS.map(articulo => ({
      articulo,
      guardadoEnCamara: 0,
      elaboradoKg: 0,
      bolsas: 0
    })),
    pesajeInterno: {
      grasa: 0,
      lavadito: 0,
      bolsaAzul: 0
    },
    pesajeBascula: {
      hueso: 0,
      grasa: 0,
      despojo: 0
    }
  }
}

/**
 * Imprimir múltiples planillas de menudencias (una por usuario/tropa)
 */
export function imprimirMenudenciasMultiple(listaData: MenudenciasData[]) {
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) return

  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '/logo.png'

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Control de Menudencias - Múltiples</title>
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
          font-size: 11px;
          background: white;
        }
        
        .page {
          width: 190mm;
          padding: 5mm;
          page-break-after: always;
        }
        
        .page:last-child {
          page-break-after: auto;
        }
        
        /* Header */
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }
        
        .logo-img {
          max-width: 150px;
          max-height: 50px;
          object-fit: contain;
          margin-bottom: 5px;
        }
        
        .empresa-nombre {
          font-size: 16px;
          font-weight: bold;
          letter-spacing: 1px;
        }
        
        .empresa-datos {
          font-size: 9px;
          color: #555;
          margin-top: 2px;
        }
        
        /* Info Section */
        .info-section {
          display: flex;
          justify-content: flex-end;
          gap: 20px;
          margin-bottom: 10px;
          font-size: 11px;
        }
        
        .info-row {
          display: flex;
          gap: 5px;
        }
        
        .info-label {
          font-weight: bold;
        }
        
        /* Usuario */
        .usuario-header {
          background: #f0f0f0;
          padding: 4px 8px;
          border: 1px solid #ccc;
          border-bottom: none;
          font-weight: bold;
          font-size: 10px;
        }
        
        /* Tabla principal */
        .main-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 5px;
        }
        
        .main-table th {
          background: #333;
          color: white;
          padding: 6px 8px;
          text-align: center;
          font-size: 10px;
          font-weight: bold;
        }
        
        .main-table th:first-child {
          text-align: left;
        }
        
        .main-table td {
          padding: 5px 8px;
          border: 1px solid #ccc;
          font-size: 10px;
        }
        
        .main-table td:first-child {
          text-align: left;
          font-weight: 500;
        }
        
        .main-table td:not(:first-child) {
          text-align: center;
        }
        
        .main-table tr:nth-child(even) {
          background: #f9f9f9;
        }
        
        .main-table tr.total-row {
          background: #e0e0e0;
          font-weight: bold;
        }
        
        .main-table tr.total-row td {
          border-top: 2px solid #333;
        }
        
        /* Secciones de pesaje */
        .pesaje-section {
          margin-top: 10px;
        }
        
        .pesaje-header {
          background: #f5f5f5;
          padding: 4px 8px;
          border: 1px solid #ccc;
          border-bottom: none;
          font-weight: bold;
          font-size: 10px;
        }
        
        .pesaje-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .pesaje-table td {
          padding: 4px 8px;
          border: 1px solid #ccc;
          font-size: 10px;
        }
        
        .pesaje-table td:first-child {
          font-weight: bold;
          width: 30%;
        }
        
        /* Firma */
        .firma-section {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
        }
        
        .firma-box {
          width: 45%;
          text-align: center;
        }
        
        .firma-linea {
          border-top: 1px solid #000;
          margin-top: 40px;
          padding-top: 5px;
          font-size: 10px;
        }
        
        /* Footer */
        .footer {
          margin-top: 20px;
          padding-top: 8px;
          border-top: 1px solid #ccc;
          text-align: center;
          font-size: 8px;
          color: #666;
        }
        
        @media print { 
          body { padding: 0; }
          .page { margin: 0; }
        }
      </style>
    </head>
    <body>
      ${listaData.map(data => {
        const totalElaborado = data.items.reduce((acc, item) => acc + (item.elaboradoKg || 0), 0)
        const totalBolsas = data.items.reduce((acc, item) => acc + (item.bolsas || 0), 0)
        
        return `
          <div class="page">
            <!-- Header -->
            <div class="header">
              <img src="${logoUrl}" alt="Logo" class="logo-img" onerror="this.style.display='none'">
              <div class="empresa-nombre">${EMPRESA.nombre}</div>
              <div class="empresa-datos">
                ${EMPRESA.direccion} | ${EMPRESA.localidad} | CUIT: ${EMPRESA.cuit}
              </div>
            </div>
            
            <!-- Título -->
            <div style="text-align: center; font-size: 14px; font-weight: bold; margin: 10px 0; padding: 8px; background: #333; color: white;">
              CONTROL DE MENUDENCIAS
            </div>
            
            <!-- Info -->
            <div class="info-section">
              <div class="info-row">
                <span class="info-label">FECHA:</span>
                <span>${formatFecha(data.fecha)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">TROPA:</span>
                <span>${data.tropa}</span>
              </div>
              <div class="info-row">
                <span class="info-label">LOTE:</span>
                <span>${data.lote}</span>
              </div>
            </div>
            
            <!-- Usuario -->
            <div class="usuario-header">
              USUARIO: ${data.usuario}
            </div>
            
            <!-- Tabla principal de menudencias -->
            <table class="main-table">
              <thead>
                <tr>
                  <th>ARTICULO</th>
                  <th>GUARDADO EN CAMARA</th>
                  <th>ELABORADO KG</th>
                  <th>BOLSAS</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map(item => `
                  <tr>
                    <td>${item.articulo}</td>
                    <td>${typeof item.guardadoEnCamara === 'number' ? item.guardadoEnCamara.toFixed(2) : item.guardadoEnCamara}</td>
                    <td>${item.elaboradoKg.toFixed(2)}</td>
                    <td>${item.bolsas}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td></td>
                  <td>total</td>
                  <td>${totalElaborado.toFixed(2)}</td>
                  <td>${totalBolsas}</td>
                </tr>
              </tbody>
            </table>
            
            <!-- Pesaje Interno -->
            ${data.pesajeInterno ? `
            <div class="pesaje-section">
              <div class="pesaje-header">PESAJE INTERNO</div>
              <table class="pesaje-table">
                ${data.pesajeInterno.grasa !== undefined ? `
                <tr>
                  <td>GRASA</td>
                  <td>${data.pesajeInterno.grasa.toFixed(2)} kg</td>
                </tr>
                ` : ''}
                ${data.pesajeInterno.lavadito !== undefined ? `
                <tr>
                  <td>LAVADITO</td>
                  <td>${data.pesajeInterno.lavadito.toFixed(2)} kg</td>
                </tr>
                ` : ''}
                ${data.pesajeInterno.bolsaAzul !== undefined ? `
                <tr>
                  <td>BOLSA AZUL</td>
                  <td>${data.pesajeInterno.bolsaAzul.toFixed(2)} kg</td>
                </tr>
                ` : ''}
              </table>
            </div>
            ` : ''}
            
            <!-- Pesaje Báscula - Manitou -->
            ${data.pesajeBascula ? `
            <div class="pesaje-section">
              <div class="pesaje-header">PESAJE BASCULA - MANITOU</div>
              <table class="pesaje-table">
                ${data.pesajeBascula.hueso !== undefined ? `
                <tr>
                  <td>HUESO</td>
                  <td>${data.pesajeBascula.hueso.toFixed(2)} kg</td>
                </tr>
                ` : ''}
                ${data.pesajeBascula.grasa !== undefined ? `
                <tr>
                  <td>GRASA</td>
                  <td>${data.pesajeBascula.grasa.toFixed(2)} kg</td>
                </tr>
                ` : ''}
                ${data.pesajeBascula.despojo !== undefined ? `
                <tr>
                  <td>DESPOJO</td>
                  <td>${data.pesajeBascula.despojo.toFixed(2)} kg</td>
                </tr>
                ` : ''}
              </table>
            </div>
            ` : ''}
            
            <!-- Firmas -->
            <div class="firma-section">
              <div class="firma-box">
                <div class="firma-linea">Responsable Producción</div>
              </div>
              <div class="firma-box">
                <div class="firma-linea">Responsable Calidad</div>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <p>Documento generado: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}</p>
              <p>${EMPRESA.nombre} | Est. N° ${EMPRESA.establecimiento}</p>
            </div>
          </div>
        `
      }).join('')}
      
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
