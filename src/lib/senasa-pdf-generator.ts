import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ==================== TIPOS ====================

export interface SenasaReportData {
  tipo: string       // FAENA_MENSUAL, EXISTENCIAS, MOVIMIENTOS, DECOMISOS, PRODUCCION, STOCK
  periodo: string    // "2026-04" or "2024-01-01 - 2024-01-31"
  datos: any[]
  establecimiento: {
    nombre: string
    numero: string
    cuit: string
    direccion: string
  }
}

// Tipo labels para el encabezado
const TIPO_LABELS: Record<string, string> = {
  FAENA_MENSUAL: 'Reporte Mensual de Faena',
  EXISTENCIAS: 'Reporte de Existencias',
  MOVIMIENTOS: 'Reporte de Movimientos',
  DECOMISOS: 'Reporte de Decomisos',
  PRODUCCION: 'Reporte de Producción',
  STOCK: 'Reporte de Stock',
};

// Columnas por tipo de reporte
const TIPO_COLUMNS: Record<string, string[]> = {
  FAENA_MENSUAL: [
    'Fecha', 'Tropa', 'Especie', 'Tipo Animal', 'Cantidad',
    'Peso Vivo (kg)', 'Peso Faena (kg)', 'Rinde (%)', 'Productor',
  ],
  EXISTENCIAS: [
    'Código', 'Producto', 'Categoría', 'Depósito', 'Cantidad',
    'Unidad', 'Fecha Ingreso', 'Lote', 'Vencimiento',
  ],
  MOVIMIENTOS: [
    'Fecha', 'Tipo', 'Producto', 'Cantidad', 'Origen',
    'Destino', 'Documento', 'Operador',
  ],
  DECOMISOS: [
    'Fecha', 'Tropa', 'Especie', 'Motivo', 'Cantidad',
    'Peso (kg)', 'Destino', 'Observaciones',
  ],
  PRODUCCION: [
    'Fecha', 'Producto', 'Lote', 'Cantidad Producida',
    'Unidad', 'Materia Prima', 'Operador',
  ],
  STOCK: [
    'Código', 'Insumo', 'Categoría', 'Depósito',
    'Cantidad', 'Unidad', 'Stock Mínimo', 'Estado',
  ],
};

// ==================== GENERADOR ====================

export async function generateSenasaPDF(data: SenasaReportData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = addSenasaHeader(doc, data, pageWidth);

  // Tabla de datos
  const headers = TIPO_COLUMNS[data.tipo] || getDefaultHeaders(data.datos);
  const rows = mapDataToRows(data.datos, data.tipo);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: y,
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: [180, 180, 180],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [0, 75, 43],       // SENASA green
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [245, 250, 245],
    },
    margin: { top: y, left: 14, right: 14 },
    didDrawPage: (hookData) => {
      // Footer on each page
      addSenasaFooter(doc, hookData.pageNumber);
    },
  });

  return doc.output('blob');
}

// ==================== HEADER ====================

function addSenasaHeader(doc: jsPDF, data: SenasaReportData, pageWidth: number): number {
  let y = 10;

  // Top banner line (SENASA green)
  doc.setFillColor(0, 75, 43);
  doc.rect(0, 0, pageWidth, 3, 'F');

  // SENASA header text
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 75, 43);
  doc.text('SENASA', 14, y + 6);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(
    'Servicio Nacional de Sanidad y Calidad Agroalimentaria',
    14, y + 11
  );

  // Report type title (right-aligned)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 75, 43);
  const tipoLabel = TIPO_LABELS[data.tipo] || data.tipo;
  doc.text(tipoLabel, pageWidth - 14, y + 6, { align: 'right' });

  // Período (right-aligned)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Período: ${data.periodo}`, pageWidth - 14, y + 12, { align: 'right' });

  // Separator line
  y += 16;
  doc.setDrawColor(0, 75, 43);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);

  // Establishment info box
  y += 6;
  doc.setFillColor(248, 250, 248);
  doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, 'F');

  // Establishment details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 75, 43);
  doc.text('DATOS DEL ESTABLECIMIENTO', 18, y + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Razón Social: ${data.establecimiento.nombre}`, 18, y + 11);
  doc.text(`N° Establecimiento: ${data.establecimiento.numero}`, 18, y + 16);

  doc.text(`CUIT: ${data.establecimiento.cuit}`, pageWidth / 2 + 10, y + 11);
  doc.text(`Dirección: ${data.establecimiento.direccion}`, pageWidth / 2 + 10, y + 16);

  // Another separator
  y += 28;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(14, y, pageWidth - 14, y);

  // Summary line
  y += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Total de registros: ${data.datos.length}`, 14, y);
  doc.text(
    `Fecha de generación: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}`,
    pageWidth - 14, y, { align: 'right' }
  );

  return y + 8;
}

// ==================== FOOTER ====================

function addSenasaFooter(doc: jsPDF, pageNumber: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Bottom green line
  doc.setFillColor(0, 75, 43);
  doc.rect(0, pageHeight - 3, pageWidth, 3, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130, 130, 130);
  doc.text(
    'Documento generado para presentación ante SENASA',
    14, pageHeight - 7
  );
  doc.text(
    `Página ${pageNumber}`,
    pageWidth - 14, pageHeight - 7, { align: 'right' }
  );
}

// ==================== HELPERS ====================

/**
 * Extract headers from data keys if type is unknown
 */
function getDefaultHeaders(datos: any[]): string[] {
  if (datos.length === 0) return [];
  return Object.keys(datos[0]).map(
    (key) => key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
  );
}

/**
 * Map generic data array to string[][] for jspdf-autotable
 */
function mapDataToRows(datos: any[], tipo: string): string[][] {
  return datos.map((item) => {
    if (tipo === 'FAENA_MENSUAL') {
      return [
        formatDateValue(item.fecha),
        String(item.tropa || item.tropaCodigo || '-'),
        String(item.especie || '-'),
        String(item.tipoAnimal || item.tipo || '-'),
        formatNumber(item.cantidad || item.cantidadAnimales || 0),
        formatNumber(item.pesoVivo || item.pesoVivoTotal || 0),
        formatNumber(item.pesoFaena || item.pesoFrioTotal || item.pesoTotal || 0),
        formatPercent(item.rinde || 0),
        String(item.productor || '-'),
      ];
    }
    if (tipo === 'EXISTENCIAS') {
      return [
        String(item.codigo || '-'),
        String(item.producto || item.insumo || '-'),
        String(item.categoria || '-'),
        String(item.deposito || '-'),
        formatNumber(item.cantidad || 0),
        String(item.unidad || '-'),
        formatDateValue(item.fechaIngreso || item.fecha),
        String(item.lote || '-'),
        formatDateValue(item.vencimiento),
      ];
    }
    if (tipo === 'MOVIMIENTOS') {
      return [
        formatDateValue(item.fecha),
        String(item.tipo || '-'),
        String(item.producto || '-'),
        formatNumber(item.cantidad || 0),
        String(item.origen || '-'),
        String(item.destino || '-'),
        String(item.documento || item.comprobante || '-'),
        String(item.operador || '-'),
      ];
    }
    if (tipo === 'DECOMISOS') {
      return [
        formatDateValue(item.fecha),
        String(item.tropa || item.tropaCodigo || '-'),
        String(item.especie || '-'),
        String(item.motivo || '-'),
        formatNumber(item.cantidad || 0),
        formatNumber(item.peso || item.pesoTotal || 0),
        String(item.destino || '-'),
        String(item.observaciones || '-'),
      ];
    }
    if (tipo === 'PRODUCCION') {
      return [
        formatDateValue(item.fecha),
        String(item.producto || '-'),
        String(item.lote || '-'),
        formatNumber(item.cantidadProducida || item.cantidad || 0),
        String(item.unidad || '-'),
        String(item.materiaPrima || '-'),
        String(item.operador || item.responsable || '-'),
      ];
    }
    if (tipo === 'STOCK') {
      return [
        String(item.codigo || '-'),
        String(item.insumo || item.nombre || '-'),
        String(item.categoria || '-'),
        String(item.deposito || '-'),
        formatNumber(item.cantidad || 0),
        String(item.unidad || '-'),
        formatNumber(item.stockMinimo || 0),
        String(item.estado || 'NORMAL'),
      ];
    }
    // Generic fallback: use all values in key order
    return Object.values(item).map((v) => String(v ?? '-'));
  });
}

function formatDateValue(value: unknown): string {
  if (!value) return '-';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('es-AR');
    } catch {
      // fall through
    }
  }
  return String(value);
}

function formatNumber(value: unknown): string {
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(num);
}

function formatPercent(value: unknown): string {
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) return '-';
  return `${num.toFixed(1)}%`;
}
