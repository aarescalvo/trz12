/**
 * Planilla 01 - Formato de Tropa Individual
 * Frigorífico "Solemar Alimentaria"
 * 
 * Formato basado en template Excel: ROMANEO VACUNO T61 06022026.pdf.xlsx
 * Hojas: TROPA 59, TROPA 60, TROPA 61, TROPA 62
 */

// Configuración de la empresa
const EMPRESA = {
  nombre: 'Solemar Alimentaria S.A.',
  matricula: '300',
  senasa: '3986'
}

// Interface para datos de la tropa
export interface Planilla01Data {
  // Datos del establecimiento
  establecimiento: string
  matricula: string
  senasa: string
  
  // Usuario/Matarife
  usuarioMatarife: string
  matriculaUsuario: string
  
  // Productor
  productor: string
  dte: string
  guia: string
  
  // Datos de la tropa
  fechaFaena: Date | string
  tropaNumero: number
  cantidadCabeza: number
  kgVivoEntrada: number
  kgMediaRes: number
  rinde: number
  promedio: number
  
  // Cuartos - cantidad y kg por tipo
  cuartos: {
    VQ: { cantidad: number; kg: number }
    NT: { cantidad: number; kg: number }
    NO: { cantidad: number; kg: number }
    TO: { cantidad: number; kg: number }
    VA: { cantidad: number; kg: number }
    MEJ: { cantidad: number; kg: number }
  }
  
  // Animales
  animales: {
    garron: number
    tropa: number
    tipificacion: string
    kgMediaDer: number
    kgMediaIzq: number
  }[]
}

/**
 * Formatea fecha a formato argentino DD/MM/YYYY
 */
function formatFecha(fecha: Date | string): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const año = d.getFullYear()
  return `${dia}/${mes}/${año}`
}

/**
 * Imprime la Planilla 01 - Individual por Tropa
 * Formato A4 horizontal compacto
 */
export function imprimirPlanilla01(data: Planilla01Data) {
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) return
  
  // Calcular totales
  const totalKgDer = data.animales.reduce((acc, a) => acc + a.kgMediaDer, 0)
  const totalKgIzq = data.animales.reduce((acc, a) => acc + a.kgMediaIzq, 0)
  const totalKg = totalKgDer + totalKgIzq
  
  const fechaFormateada = formatFecha(data.fechaFaena)
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Planilla 01 - Tropa ${data.tropaNumero}</title>
      <style>
        @page { 
          size: A4;
          margin: 5mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body { 
          font-family: 'Arial', sans-serif;
          font-size: 9px;
          width: 200mm;
          min-height: 287mm;
          background: white;
          padding: 3mm;
        }
        
        /* Tabla principal - estructura del Excel */
        .main-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        
        .main-table td {
          border: 1px solid #000;
          padding: 2mm 3mm;
          vertical-align: top;
        }
        
        /* Celda vacía */
        .empty-cell {
          border: none;
          width: 15%;
        }
        
        /* Header del establecimiento - celda superior derecha */
        .header-estab {
          text-align: right;
          font-size: 8px;
          line-height: 1.4;
        }
        
        .header-estab .empresa-nombre {
          font-size: 10px;
          font-weight: bold;
        }
        
        /* Rinde/Promedio box */
        .rinde-box {
          text-align: center;
          font-size: 9px;
          width: 12%;
        }
        
        .rinde-box .label {
          font-weight: bold;
          font-size: 8px;
        }
        
        .rinde-box .value {
          font-size: 10px;
          font-weight: bold;
        }
        
        /* Datos usuario/productor */
        .datos-section {
          padding: 3mm;
        }
        
        .dato-row {
          display: flex;
          margin-bottom: 1mm;
          font-size: 9px;
        }
        
        .dato-label {
          font-weight: bold;
          min-width: 35mm;
        }
        
        .dato-value {
          font-weight: normal;
        }
        
        /* Datos tropa */
        .datos-tropa {
          padding: 3mm;
        }
        
        .datos-tropa .dato-row {
          display: flex;
          justify-content: space-between;
          padding: 1mm 0;
          border-bottom: 1px dotted #ccc;
          font-size: 8px;
        }
        
        .datos-tropa .dato-row:last-child {
          border-bottom: none;
        }
        
        /* Cuartos table */
        .cuartos-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8px;
        }
        
        .cuartos-table th,
        .cuartos-table td {
          border: 1px solid #000;
          padding: 1.5mm 2mm;
          text-align: center;
        }
        
        .cuartos-table th {
          background: #333;
          color: white;
          font-weight: bold;
        }
        
        /* Tabla de animales */
        .animales-section {
          margin-top: 3mm;
        }
        
        .animales-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8px;
        }
        
        .animales-table th {
          background: #000;
          color: white;
          padding: 2mm 1.5mm;
          text-align: center;
          font-weight: bold;
          font-size: 7px;
        }
        
        .animales-table td {
          padding: 1.5mm 1mm;
          border: 1px solid #000;
          text-align: center;
        }
        
        .animales-table tbody tr:nth-child(even) {
          background: #f5f5f5;
        }
        
        .animales-table .text-right {
          text-align: right;
          font-family: 'Courier New', monospace;
        }
        
        /* Fila de totales */
        .totales-row {
          background: #e0e0e0 !important;
          font-weight: bold;
        }
        
        /* Footer */
        .footer {
          margin-top: 5mm;
          padding-top: 2mm;
          border-top: 1px solid #000;
          text-align: center;
          font-size: 7px;
          color: #666;
        }
        
        @media print { 
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <table class="main-table">
        <!-- Fila 1: Vacía + Header establecimiento + Rinde/Prom -->
        <tr>
          <td class="empty-cell" rowspan="6" style="border: none;"></td>
          <td class="empty-cell" rowspan="6" style="border: none;"></td>
          <td class="header-estab" colspan="4">
            <div class="empresa-nombre">Estab. Faenador: ${data.establecimiento}</div>
            <div>Matrícula: ${data.matricula}</div>
            <div>Nº SENASA: ${data.senasa}</div>
          </td>
          <td class="empty-cell" rowspan="6" style="border: none;"></td>
          <td class="rinde-box">
            <div class="label">RINDE</div>
            <div class="value">${((data.rinde ?? 0) * 100).toFixed(5)}</div>
          </td>
        </tr>
        <tr>
          <td colspan="4" style="border-top: none; border-bottom: none;"></td>
          <td class="rinde-box">
            <div class="label">PROM.</div>
            <div class="value">${data.promedio.toFixed(3)}</div>
          </td>
        </tr>
        <tr>
          <td colspan="5" style="border: none; height: 5mm;"></td>
        </tr>
        <tr>
          <td colspan="5" style="border: none; height: 5mm;"></td>
        </tr>
        
        <!-- Fila: Usuario/Matarife + Productor -->
        <tr>
          <td colspan="4" style="border-top: none;"></td>
          <td colspan="5" style="border: none;"></td>
        </tr>
        <tr>
          <td class="datos-section" colspan="4">
            <div class="dato-row">
              <span class="dato-label">Usuario/Matarife:</span>
              <span class="dato-value">${data.usuarioMatarife}</span>
            </div>
            <div class="dato-row">
              <span class="dato-label">Matrícula:</span>
              <span class="dato-value">${data.matriculaUsuario}</span>
            </div>
          </td>
          <td colspan="2" style="border: none;"></td>
          <td class="datos-section" colspan="3" style="text-align: right;">
            <div class="dato-row" style="justify-content: flex-end;">
              <span class="dato-label">Productor:</span>
              <span class="dato-value">${data.productor}</span>
            </div>
            <div class="dato-row" style="justify-content: flex-end;">
              <span class="dato-label">Nº DTE:</span>
              <span class="dato-value">${data.dte}</span>
            </div>
            <div class="dato-row" style="justify-content: flex-end;">
              <span class="dato-label">Nº Guia:</span>
              <span class="dato-value">${data.guia}</span>
            </div>
          </td>
        </tr>
        
        <!-- Fila vacía -->
        <tr>
          <td colspan="9" style="border: none; height: 5mm;"></td>
        </tr>
        
        <!-- Fila: Datos tropa + Cuartos -->
        <tr>
          <td class="datos-tropa" colspan="3" style="width: 30%;">
            <div class="dato-row">
              <span class="dato-label">Fecha Faena:</span>
              <span class="dato-value">${fechaFormateada}</span>
            </div>
            <div class="dato-row">
              <span class="dato-label">Nº Tropa:</span>
              <span class="dato-value">${data.tropaNumero}</span>
            </div>
            <div class="dato-row">
              <span class="dato-label">Cantidad Cabeza:</span>
              <span class="dato-value">${data.cantidadCabeza}</span>
            </div>
            <div class="dato-row">
              <span class="dato-label">Kg Vivo entrada:</span>
              <span class="dato-value">${data.kgVivoEntrada.toLocaleString('es-AR')}</span>
            </div>
            <div class="dato-row">
              <span class="dato-label">Kg 1/2 Res</span>
              <span class="dato-value">${data.kgMediaRes.toLocaleString('es-AR', { minimumFractionDigits: 1 })}</span>
            </div>
            <div class="dato-row">
              <span class="dato-label">Rinde:</span>
              <span class="dato-value">${((data.rinde ?? 0) * 100).toFixed(5)}</span>
            </div>
            <div class="dato-row">
              <span class="dato-label">Promedio:</span>
              <span class="dato-value">${data.promedio.toFixed(3)}</span>
            </div>
          </td>
          <td colspan="1" style="border: none; width: 5mm;"></td>
          <td colspan="5" style="vertical-align: top; padding: 2mm;">
            <table class="cuartos-table">
              <thead>
                <tr>
                  <th>Cuartos</th>
                  <th>Cantidad</th>
                  <th>Kg</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>VQ</strong></td>
                  <td>${data.cuartos.VQ.cantidad || '-'}</td>
                  <td>${data.cuartos.VQ.kg ? data.cuartos.VQ.kg.toFixed(1) : '-'}</td>
                </tr>
                <tr>
                  <td><strong>NT</strong></td>
                  <td>${data.cuartos.NT.cantidad || '-'}</td>
                  <td>${data.cuartos.NT.kg ? data.cuartos.NT.kg.toFixed(1) : '-'}</td>
                </tr>
                <tr>
                  <td><strong>NO</strong></td>
                  <td>${data.cuartos.NO.cantidad || '-'}</td>
                  <td>${data.cuartos.NO.kg ? data.cuartos.NO.kg.toFixed(1) : '-'}</td>
                </tr>
                <tr>
                  <td><strong>TO</strong></td>
                  <td>${data.cuartos.TO.cantidad || '-'}</td>
                  <td>${data.cuartos.TO.kg ? data.cuartos.TO.kg.toFixed(1) : '-'}</td>
                </tr>
                <tr>
                  <td><strong>VA</strong></td>
                  <td>${data.cuartos.VA.cantidad || '-'}</td>
                  <td>${data.cuartos.VA.kg ? data.cuartos.VA.kg.toFixed(1) : '-'}</td>
                </tr>
                <tr>
                  <td><strong>MEJ</strong></td>
                  <td>${data.cuartos.MEJ.cantidad || '-'}</td>
                  <td>${data.cuartos.MEJ.kg ? data.cuartos.MEJ.kg.toFixed(1) : '-'}</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </table>
      
      <!-- Tabla de animales -->
      <div class="animales-section">
        <table class="animales-table">
          <thead>
            <tr>
              <th style="width: 12%;">N°<br>GARRON</th>
              <th style="width: 10%;">TROPA</th>
              <th style="width: 20%;">TIPIFICACION</th>
              <th style="width: 18%;">KG 1/2 der</th>
              <th style="width: 18%;">KG 1/2 izq</th>
            </tr>
          </thead>
          <tbody>
            ${data.animales.map(a => `
              <tr>
                <td><strong>${a.garron}</strong></td>
                <td>${a.tropa}</td>
                <td>${a.tipificacion}</td>
                <td class="text-right">${a.kgMediaDer.toFixed(1)}</td>
                <td class="text-right">${a.kgMediaIzq.toFixed(1)}</td>
              </tr>
            `).join('')}
            <tr class="totales-row">
              <td colspan="2">TOTALES</td>
              <td><strong>${data.animales.length}</strong></td>
              <td class="text-right"><strong>${totalKgDer.toFixed(1)}</strong></td>
              <td class="text-right"><strong>${totalKgIzq.toFixed(1)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <p>${data.establecimiento} - Matrícula ${data.matricula} - Nº SENASA ${data.senasa}</p>
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
 * Convierte datos de romaneo del sistema a formato Planilla01
 */
export function convertirRomaneoAPlanilla01(
  tropaData: {
    numero: number
    productor?: { nombre: string }
    usuarioFaena?: { nombre: string; cuit?: string }
    dte: string
    guia: string
  },
  romaneos: {
    garron: number
    tropaNumero: number
    tipoAnimal: string
    pesoMediaIzq: number
    pesoMediaDer: number
    pesoVivo?: number
    denticion?: string
  }[],
  fechaFaena: Date | string
): Planilla01Data {
  // Calcular totales
  const cantidadCabeza = romaneos.length
  const kgVivoEntrada = romaneos.reduce((acc, r) => acc + (r.pesoVivo || 0), 0)
  const kgMediaRes = romaneos.reduce((acc, r) => acc + (r.pesoMediaIzq || 0) + (r.pesoMediaDer || 0), 0)
  const rinde = kgVivoEntrada > 0 ? kgMediaRes / kgVivoEntrada : 0
  const promedio = cantidadCabeza > 0 ? kgMediaRes / cantidadCabeza : 0
  
  // Contar cuartos por tipo
  const cuartos = {
    VQ: { cantidad: 0, kg: 0 },
    NT: { cantidad: 0, kg: 0 },
    NO: { cantidad: 0, kg: 0 },
    TO: { cantidad: 0, kg: 0 },
    VA: { cantidad: 0, kg: 0 },
    MEJ: { cantidad: 0, kg: 0 }
  }
  
  romaneos.forEach(r => {
    const tipo = r.tipoAnimal?.toUpperCase()
    if (cuartos[tipo as keyof typeof cuartos]) {
      cuartos[tipo as keyof typeof cuartos].cantidad++
      cuartos[tipo as keyof typeof cuartos].kg += (r.pesoMediaIzq || 0) + (r.pesoMediaDer || 0)
    }
  })
  
  // Formatear tipificación
  const formatTipificacion = (tipo: string, denticion?: string): string => {
    const denticionCode = denticion || '2'
    const tipoCode = tipo?.toUpperCase() || ''
    return `${denticionCode}D - ${tipoCode}`
  }
  
  return {
    establecimiento: EMPRESA.nombre,
    matricula: EMPRESA.matricula,
    senasa: EMPRESA.senasa,
    usuarioMatarife: tropaData.usuarioFaena?.nombre || '-',
    matriculaUsuario: tropaData.usuarioFaena?.cuit || '-',
    productor: tropaData.productor?.nombre || '-',
    dte: tropaData.dte,
    guia: tropaData.guia,
    fechaFaena,
    tropaNumero: tropaData.numero,
    cantidadCabeza,
    kgVivoEntrada,
    kgMediaRes,
    rinde,
    promedio,
    cuartos,
    animales: romaneos.map(r => ({
      garron: r.garron,
      tropa: r.tropaNumero,
      tipificacion: formatTipificacion(r.tipoAnimal, r.denticion),
      kgMediaDer: r.pesoMediaDer,
      kgMediaIzq: r.pesoMediaIzq
    }))
  }
}
