import { TIPOS_PESAJE } from './constants'
import type { Pesaje } from './types'

// Imprimir ticket individual
export function imprimirTicket(pesaje: Pesaje, duplicado: boolean = false) {
  const tipoLabel = TIPOS_PESAJE.find(t => t.id === pesaje.tipo)?.label || pesaje.tipo
  const copia = duplicado ? ' - COPIA' : ''
  
  const printWindow = window.open('', '_blank', 'width=400,height=600')
  if (!printWindow) return
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ticket #${pesaje.numeroTicket}${copia}</title>
      <style>
        body { font-family: monospace; font-size: 12px; padding: 10mm; max-width: 80mm; }
        .header { text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 10px; }
        .empresa { font-size: 16px; font-weight: bold; }
        .ticket { font-size: 20px; font-weight: bold; }
        .row { display: flex; justify-content: space-between; padding: 2px 0; }
        .label { font-weight: bold; }
        .section { border-top: 1px dashed black; padding-top: 8px; margin-top: 8px; }
        .peso { font-size: 14px; font-weight: bold; }
        .firma { margin-top: 20px; border-top: 1px solid black; padding-top: 10px; }
        .firma-linea { border-bottom: 1px solid black; height: 30px; margin-top: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="empresa">SOLEMAR ALIMENTARIA</div>
        <div>TICKET DE PESAJE${copia}</div>
        <div class="ticket">Nº ${String(pesaje.numeroTicket).padStart(6, '0')}</div>
      </div>
      
      <div class="row"><span class="label">Tipo:</span><span>${tipoLabel}</span></div>
      <div class="row"><span class="label">Fecha:</span><span>${new Date(pesaje.fecha).toLocaleDateString('es-AR')}</span></div>
      <div class="row"><span class="label">Hora:</span><span>${new Date(pesaje.fecha).toLocaleTimeString('es-AR')}</span></div>
      ${pesaje.operador ? `<div class="row"><span class="label">Operador:</span><span>${pesaje.operador.nombre}</span></div>` : ''}
      
      <div class="section">
        <div class="row"><span class="label">Patente:</span><span>${pesaje.patenteChasis}</span></div>
        ${pesaje.patenteAcoplado ? `<div class="row"><span class="label">Acoplado:</span><span>${pesaje.patenteAcoplado}</span></div>` : ''}
        ${pesaje.chofer ? `<div class="row"><span class="label">Chofer:</span><span>${pesaje.chofer}</span></div>` : ''}
      </div>
      
      ${pesaje.tipo === 'INGRESO_HACIENDA' && pesaje.tropa ? `
        <div class="section">
          <div style="font-weight: bold; text-align: center; margin-bottom: 5px;">DATOS DE HACIENDA</div>
          <div class="row"><span class="label">Tropa:</span><span style="font-weight: bold;">${pesaje.tropa.codigo}</span></div>
          ${pesaje.tropa.productor ? `<div class="row"><span class="label">Productor:</span><span>${pesaje.tropa.productor.nombre}</span></div>` : ''}
          <div class="row"><span class="label">Usuario Faena:</span><span>${pesaje.tropa.usuarioFaena?.nombre || '-'}</span></div>
          <div class="row"><span class="label">Especie:</span><span>${pesaje.tropa.especie}</span></div>
          <div class="row"><span class="label">Corral:</span><span>${pesaje.tropa.corral || '-'}</span></div>
          ${pesaje.tropa.dte ? `<div class="row"><span class="label">DTE:</span><span>${pesaje.tropa.dte}</span></div>` : ''}
          ${pesaje.tropa.guia ? `<div class="row"><span class="label">Guía:</span><span>${pesaje.tropa.guia}</span></div>` : ''}
          ${pesaje.descripcion ? `<div class="row"><span class="label">Observaciones:</span><span>${pesaje.descripcion}</span></div>` : ''}
        </div>
      ` : ''}
      
      ${pesaje.tipo === 'SALIDA_MERCADERIA' ? `
        <div class="section">
          <div class="row"><span class="label">Destino:</span><span>${pesaje.destino || '-'}</span></div>
          ${pesaje.remito ? `<div class="row"><span class="label">Remito:</span><span>${pesaje.remito}</span></div>` : ''}
        </div>
      ` : ''}
      
      <div class="section">
        <div style="font-weight: bold; text-align: center; margin-bottom: 5px;">PESOS</div>
        <div class="row peso"><span class="label">Bruto:</span><span>${pesaje.pesoBruto?.toLocaleString() || '-'} kg</span></div>
        <div class="row peso"><span class="label">Tara:</span><span>${pesaje.pesoTara?.toLocaleString() || '-'} kg</span></div>
        <div class="row peso" style="font-size: 16px;"><span class="label">NETO:</span><span style="font-weight: bold;">${pesaje.pesoNeto?.toLocaleString() || '-'} kg</span></div>
      </div>
      
      <div class="firma">
        <div style="text-align: center;">Firma Conforme</div>
        <div class="firma-linea"></div>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() { window.close(); }
        }
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

// Imprimir reporte por rango de fechas
export function imprimirReporte(pesajes: Pesaje[], fechaDesde: string, fechaHasta: string) {
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) return
  
  const totalBruto = pesajes.reduce((acc, p) => acc + (p.pesoBruto || 0), 0)
  const totalTara = pesajes.reduce((acc, p) => acc + (p.pesoTara || 0), 0)
  const totalNeto = pesajes.reduce((acc, p) => acc + (p.pesoNeto || 0), 0)
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Reporte de Pesajes</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background: #f0f0f0; }
        .totals { margin-top: 20px; padding: 10px; background: #f9f9f9; }
        .totals p { margin: 5px 0; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>SOLEMAR ALIMENTARIA - Reporte de Pesajes</h1>
      <p><strong>Período:</strong> ${fechaDesde ? new Date(fechaDesde).toLocaleDateString('es-AR') : 'Inicio'} - ${fechaHasta ? new Date(fechaHasta).toLocaleDateString('es-AR') : 'Hoy'}</p>
      <p><strong>Generado:</strong> ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}</p>
      
      <table>
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Patente</th>
            <th>Tropa</th>
            <th>Bruto (kg)</th>
            <th>Tara (kg)</th>
            <th>Neto (kg)</th>
          </tr>
        </thead>
        <tbody>
          ${pesajes.map(p => `
            <tr>
              <td>#${String(p.numeroTicket).padStart(6, '0')}</td>
              <td>${new Date(p.fecha).toLocaleDateString('es-AR')}</td>
              <td>${TIPOS_PESAJE.find(t => t.id === p.tipo)?.label || p.tipo}</td>
              <td>${p.patenteChasis}</td>
              <td>${p.tropa?.codigo || '-'}</td>
              <td>${p.pesoBruto?.toLocaleString() || '-'}</td>
              <td>${p.pesoTara?.toLocaleString() || '-'}</td>
              <td><strong>${p.pesoNeto?.toLocaleString() || '-'}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <p>Total de pesajes: ${pesajes.length}</p>
        <p>Total Bruto: ${totalBruto.toLocaleString()} kg</p>
        <p>Total Tara: ${totalTara.toLocaleString()} kg</p>
        <p>Total Neto: ${totalNeto.toLocaleString()} kg</p>
      </div>
      
      <script>
        window.onload = function() { window.print(); window.onafterprint = function() { window.close(); } }
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
}
