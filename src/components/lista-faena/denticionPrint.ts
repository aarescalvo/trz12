// Funciones de impresión para Control de Dentición
// Frigorífico "Solemar Alimentaria"

export interface DenticionControlOptions {
  fecha: Date
  animales: {
    numeroCabeza: number
    tropaNumero: number
    tipificacion: string
    denticion: number // 2, 4, 6, or 8
  }[]
}

/**
 * Formatea la fecha en formato argentino (DD/MM/YYYY)
 */
function formatFecha(fecha: Date): string {
  const dia = String(fecha.getDate()).padStart(2, '0')
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const año = fecha.getFullYear()
  return `${dia}/${mes}/${año}`
}

/**
 * Obtiene el código de dentición basado en el número de dientes
 * 2 dientes = 2D, 4 dientes = 4D, 6 dientes = 6D, 8 dientes = 8D
 */
function getDenticionCodigo(denticion: number): string {
  switch (denticion) {
    case 2:
      return '2D'
    case 4:
      return '4D'
    case 6:
      return '6D'
    case 8:
      return '8D'
    default:
      return `${denticion}D`
  }
}

/**
 * Imprime el control de dentición
 * Formato basado en plantilla Excel "ROMANEO VACUNO T61 06022026.pdf.xlsx"
 * Hojas: denticion 1, denticion(2), denticion(3)
 */
export function imprimirControlDenticion(data: DenticionControlOptions) {
  const { fecha, animales } = data
  
  // Agrupar animales por número de dientes para el resumen
  const resumenDenticion = animales.reduce((acc, animal) => {
    const key = animal.denticion
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  const printWindow = window.open('', '_blank', 'width=800,height=1100')
  if (!printWindow) return

  const fechaFormateada = formatFecha(fecha)
  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '/logo.png'

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Control de Dentición - ${fechaFormateada}</title>
      <style>
        @page { 
          size: A4;
          margin: 15mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body { 
          font-family: 'Arial', sans-serif;
          font-size: 11px;
          width: 190mm;
          min-height: 277mm;
          background: white;
          padding: 5mm;
        }
        
        /* Header */
        .header {
          text-align: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #000;
        }
        
        .logo-img {
          max-width: 150px;
          max-height: 60px;
          object-fit: contain;
          margin-bottom: 5px;
        }
        
        .empresa-nombre {
          font-size: 18px;
          font-weight: bold;
          letter-spacing: 1px;
        }
        
        .empresa-datos {
          font-size: 9px;
          color: #555;
          margin-top: 3px;
        }
        
        /* Título */
        .titulo-section {
          text-align: center;
          margin: 15px 0;
        }
        
        .titulo {
          font-size: 16px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .fecha {
          font-size: 14px;
          margin-top: 8px;
          font-weight: 500;
        }
        
        /* Tabla */
        .tabla-container {
          margin: 15px 0;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }
        
        th {
          background: #1a1a1a;
          color: white;
          padding: 8px 6px;
          text-align: center;
          font-weight: bold;
          text-transform: uppercase;
          border: 1px solid #000;
        }
        
        td {
          padding: 6px;
          border: 1px solid #333;
          text-align: center;
        }
        
        tr:nth-child(even) {
          background: #f5f5f5;
        }
        
        .col-numero {
          width: 15%;
        }
        
        .col-tropa {
          width: 15%;
        }
        
        .col-tipificacion {
          width: 50%;
        }
        
        .col-dientes {
          width: 20%;
          font-weight: bold;
        }
        
        /* Resumen */
        .resumen-section {
          margin-top: 20px;
          padding: 15px;
          background: #f0f0f0;
          border: 2px solid #333;
        }
        
        .resumen-titulo {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        
        .resumen-grid {
          display: flex;
          justify-content: space-around;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .resumen-item {
          text-align: center;
          padding: 10px 20px;
          background: white;
          border: 1px solid #ccc;
          min-width: 100px;
        }
        
        .resumen-label {
          font-size: 10px;
          color: #555;
          text-transform: uppercase;
        }
        
        .resumen-value {
          font-size: 20px;
          font-weight: bold;
          margin-top: 3px;
        }
        
        .resumen-tipo {
          font-size: 9px;
          color: #777;
          margin-top: 2px;
        }
        
        /* Total */
        .total-section {
          margin-top: 15px;
          padding: 10px;
          background: #1a1a1a;
          color: white;
          text-align: center;
        }
        
        .total-label {
          font-size: 12px;
        }
        
        .total-value {
          font-size: 24px;
          font-weight: bold;
        }
        
        /* Firma */
        .firma-section {
          margin-top: 40px;
          padding-top: 20px;
        }
        
        .firma-container {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }
        
        .firma-box {
          width: 45%;
          text-align: center;
        }
        
        .firma-titulo {
          font-size: 10px;
          color: #666;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        
        .firma-linea {
          border-bottom: 1px solid #000;
          height: 40px;
          margin-top: 30px;
        }
        
        .firma-nombre {
          font-size: 9px;
          margin-top: 5px;
          font-weight: bold;
        }
        
        /* Footer */
        .footer {
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px solid #ccc;
          text-align: center;
          font-size: 9px;
          color: #888;
        }
        
        @media print { 
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <img src="${logoUrl}" alt="Solemar Alimentaria" class="logo-img" onerror="this.style.display='none'">
        <div class="empresa-nombre">SOLEMAR ALIMENTARIA S.A.</div>
        <div class="empresa-datos">
          Ruta Provincial N° 11 - Km 45.5 | San Martín, Mendoza | CUIT: 23-12345678-9
        </div>
      </div>
      
      <!-- Título -->
      <div class="titulo-section">
        <div class="titulo">ROMANEO FAENA BOVINA</div>
        <div class="fecha">FECHA: ${fechaFormateada}</div>
      </div>
      
      <!-- Tabla de Control -->
      <div class="tabla-container">
        <table>
          <thead>
            <tr>
              <th class="col-numero">N° CABEZA</th>
              <th class="col-tropa">TROPA</th>
              <th class="col-tipificacion">TIPIFICACION</th>
              <th class="col-dientes">DIENTES</th>
            </tr>
          </thead>
          <tbody>
            ${animales.map(animal => `
              <tr>
                <td class="col-numero">${animal.numeroCabeza}</td>
                <td class="col-tropa">${animal.tropaNumero}</td>
                <td class="col-tipificacion">${animal.tipificacion}</td>
                <td class="col-dientes">${animal.denticion}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <!-- Resumen por Dentición -->
      <div class="resumen-section">
        <div class="resumen-titulo">Resumen por Dentición</div>
        <div class="resumen-grid">
          ${[2, 4, 6, 8].map(d => `
            <div class="resumen-item">
              <div class="resumen-label">${d} Dientes</div>
              <div class="resumen-value">${resumenDenticion[d] || 0}</div>
              <div class="resumen-tipo">(${getDenticionCodigo(d)})</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Total -->
      <div class="total-section">
        <div class="total-label">TOTAL ANIMALES</div>
        <div class="total-value">${animales.length}</div>
      </div>
      
      <!-- Firmas -->
      <div class="firma-section">
        <div class="firma-container">
          <div class="firma-box">
            <div class="firma-titulo">Control Veterinario</div>
            <div class="firma-linea"></div>
            <div class="firma-nombre">Firma y Aclaración</div>
          </div>
          
          <div class="firma-box">
            <div class="firma-titulo">Supervisor de Faena</div>
            <div class="firma-linea"></div>
            <div class="firma-nombre">Firma y Aclaración</div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <p>Documento generado: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}</p>
        <p>Este documento certifica el control de dentición realizado según normativa sanitaria vigente</p>
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
 * Imprime múltiples hojas de control de dentición
 * Útil cuando se necesitan imprimir varias páginas con diferentes grupos de animales
 */
export function imprimirControlDenticionMultiple(hojas: DenticionControlOptions[]) {
  const printWindow = window.open('', '_blank', 'width=800,height=1100')
  if (!printWindow) return

  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '/logo.png'

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Control de Dentición - Múltiples Hojas</title>
      <style>
        @page { 
          size: A4;
          margin: 15mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body { 
          font-family: 'Arial', sans-serif;
          font-size: 11px;
          background: white;
        }
        
        .page {
          width: 190mm;
          min-height: 277mm;
          padding: 5mm;
          page-break-after: always;
        }
        
        .page:last-child {
          page-break-after: auto;
        }
        
        /* Header */
        .header {
          text-align: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #000;
        }
        
        .logo-img {
          max-width: 150px;
          max-height: 60px;
          object-fit: contain;
          margin-bottom: 5px;
        }
        
        .empresa-nombre {
          font-size: 18px;
          font-weight: bold;
          letter-spacing: 1px;
        }
        
        .empresa-datos {
          font-size: 9px;
          color: #555;
          margin-top: 3px;
        }
        
        /* Título */
        .titulo-section {
          text-align: center;
          margin: 15px 0;
        }
        
        .titulo {
          font-size: 16px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .fecha {
          font-size: 14px;
          margin-top: 8px;
          font-weight: 500;
        }
        
        .hoja-numero {
          font-size: 11px;
          color: #666;
          margin-top: 5px;
        }
        
        /* Tabla */
        .tabla-container {
          margin: 15px 0;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }
        
        th {
          background: #1a1a1a;
          color: white;
          padding: 8px 6px;
          text-align: center;
          font-weight: bold;
          text-transform: uppercase;
          border: 1px solid #000;
        }
        
        td {
          padding: 6px;
          border: 1px solid #333;
          text-align: center;
        }
        
        tr:nth-child(even) {
          background: #f5f5f5;
        }
        
        .col-numero { width: 15%; }
        .col-tropa { width: 15%; }
        .col-tipificacion { width: 50%; }
        .col-dientes { width: 20%; font-weight: bold; }
        
        /* Resumen */
        .resumen-section {
          margin-top: 20px;
          padding: 15px;
          background: #f0f0f0;
          border: 2px solid #333;
        }
        
        .resumen-titulo {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        
        .resumen-grid {
          display: flex;
          justify-content: space-around;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .resumen-item {
          text-align: center;
          padding: 10px 20px;
          background: white;
          border: 1px solid #ccc;
          min-width: 100px;
        }
        
        .resumen-label { font-size: 10px; color: #555; text-transform: uppercase; }
        .resumen-value { font-size: 20px; font-weight: bold; margin-top: 3px; }
        .resumen-tipo { font-size: 9px; color: #777; margin-top: 2px; }
        
        /* Total */
        .total-section {
          margin-top: 15px;
          padding: 10px;
          background: #1a1a1a;
          color: white;
          text-align: center;
        }
        
        .total-label { font-size: 12px; }
        .total-value { font-size: 24px; font-weight: bold; }
        
        /* Firma */
        .firma-section {
          margin-top: 40px;
          padding-top: 20px;
        }
        
        .firma-container {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }
        
        .firma-box { width: 45%; text-align: center; }
        .firma-titulo { font-size: 10px; color: #666; margin-bottom: 5px; text-transform: uppercase; }
        .firma-linea { border-bottom: 1px solid #000; height: 40px; margin-top: 30px; }
        .firma-nombre { font-size: 9px; margin-top: 5px; font-weight: bold; }
        
        /* Footer */
        .footer {
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px solid #ccc;
          text-align: center;
          font-size: 9px;
          color: #888;
        }
        
        @media print { 
          body { padding: 0; }
          .page { margin: 0; padding: 5mm; }
        }
      </style>
    </head>
    <body>
      ${hojas.map((hoja, index) => {
        const fechaFormateada = formatFecha(hoja.fecha)
        const resumenDenticion = hoja.animales.reduce((acc, animal) => {
          const key = animal.denticion
          acc[key] = (acc[key] || 0) + 1
          return acc
        }, {} as Record<number, number>)

        return `
          <div class="page">
            <!-- Header -->
            <div class="header">
              <img src="${logoUrl}" alt="Solemar Alimentaria" class="logo-img" onerror="this.style.display='none'">
              <div class="empresa-nombre">SOLEMAR ALIMENTARIA S.A.</div>
              <div class="empresa-datos">
                Ruta Provincial N° 11 - Km 45.5 | San Martín, Mendoza | CUIT: 23-12345678-9
              </div>
            </div>
            
            <!-- Título -->
            <div class="titulo-section">
              <div class="titulo">ROMANEO FAENA BOVINA</div>
              <div class="fecha">FECHA: ${fechaFormateada}</div>
              ${hojas.length > 1 ? `<div class="hoja-numero">Hoja ${index + 1} de ${hojas.length}</div>` : ''}
            </div>
            
            <!-- Tabla de Control -->
            <div class="tabla-container">
              <table>
                <thead>
                  <tr>
                    <th class="col-numero">N° CABEZA</th>
                    <th class="col-tropa">TROPA</th>
                    <th class="col-tipificacion">TIPIFICACION</th>
                    <th class="col-dientes">DIENTES</th>
                  </tr>
                </thead>
                <tbody>
                  ${hoja.animales.map(animal => `
                    <tr>
                      <td class="col-numero">${animal.numeroCabeza}</td>
                      <td class="col-tropa">${animal.tropaNumero}</td>
                      <td class="col-tipificacion">${animal.tipificacion}</td>
                      <td class="col-dientes">${animal.denticion}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <!-- Resumen por Dentición -->
            <div class="resumen-section">
              <div class="resumen-titulo">Resumen por Dentición</div>
              <div class="resumen-grid">
                ${[2, 4, 6, 8].map(d => `
                  <div class="resumen-item">
                    <div class="resumen-label">${d} Dientes</div>
                    <div class="resumen-value">${resumenDenticion[d] || 0}</div>
                    <div class="resumen-tipo">(${getDenticionCodigo(d)})</div>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <!-- Total -->
            <div class="total-section">
              <div class="total-label">TOTAL ANIMALES</div>
              <div class="total-value">${hoja.animales.length}</div>
            </div>
            
            <!-- Firmas -->
            <div class="firma-section">
              <div class="firma-container">
                <div class="firma-box">
                  <div class="firma-titulo">Control Veterinario</div>
                  <div class="firma-linea"></div>
                  <div class="firma-nombre">Firma y Aclaración</div>
                </div>
                
                <div class="firma-box">
                  <div class="firma-titulo">Supervisor de Faena</div>
                  <div class="firma-linea"></div>
                  <div class="firma-nombre">Firma y Aclaración</div>
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <p>Documento generado: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}</p>
              <p>Este documento certifica el control de dentición realizado según normativa sanitaria vigente</p>
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

/**
 * Divide un array de animales en grupos para imprimir en múltiples hojas
 * Cada hoja puede tener hasta 30 animales aproximadamente
 */
export function dividirAnimalesParaImpresion(
  animales: DenticionControlOptions['animales'],
  fecha: Date,
  animalesPorHoja: number = 30
): DenticionControlOptions[] {
  const hojas: DenticionControlOptions[] = []
  
  for (let i = 0; i < animales.length; i += animalesPorHoja) {
    hojas.push({
      fecha,
      animales: animales.slice(i, i + animalesPorHoja)
    })
  }
  
  return hojas
}
