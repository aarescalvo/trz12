import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ==================== TIPOS ====================

interface ReportOptions {
  title: string;
  subtitle?: string;
  headers: string[];
  data: any[][];
  orientation?: 'portrait' | 'landscape';
  logo?: string;
  companyName?: string;
  companyDetails?: {
    cuit?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
  };
  fileName?: string;
}

interface FaenaData {
  fecha: Date | string;
  tropaNumero: number;
  productor: string;
  cantidadAnimales: number;
  pesoVivoTotal: number;
  pesoFrioTotal: number;
  rinde: number;
  observaciones?: string;
}

interface RendimientoData {
  fecha: Date | string;
  periodo: string;
  tipoAnimal?: string;
  cantidadAnimales: number;
  pesoVivoTotal: number;
  pesoFrioTotal: number;
  rindePromedio: number;
  rindeMaximo: number;
  rindeMinimo: number;
}

interface StockData {
  codigo: string;
  insumo: string;
  categoria?: string;
  deposito: string;
  cantidad: number;
  unidad: string;
  stockMinimo: number;
  estado: 'NORMAL' | 'BAJO_MINIMO';
}

interface FacturaData {
  numero: string;
  fecha: Date | string;
  cliente: {
    nombre: string;
    cuit?: string;
    direccion?: string;
    condicionIva?: string;
  };
  items: {
    descripcion: string;
    cantidad: number;
    unidad: string;
    precioUnitario: number;
    subtotal: number;
  }[];
  subtotal: number;
  iva: number;
  total: number;
  condicionVenta?: string;
  remito?: string;
  observaciones?: string;
  cae?: string;
  caeVencimiento?: Date | string;
  emisor?: {
    nombre: string;
    cuit: string;
    direccion?: string;
    condicionIva?: string;
    inicioActividades?: string;
  };
}

interface RemitoData {
  numero: string;
  fecha: Date | string;
  origen: {
    nombre: string;
    direccion?: string;
  };
  destino: {
    nombre: string;
    direccion?: string;
    cuit?: string;
  };
  transportista?: {
    nombre: string;
    cuit?: string;
  };
  patenteChasis?: string;
  patenteAcoplado?: string;
  items: {
    descripcion: string;
    cantidad: number;
    unidad: string;
    pesoKg?: number;
  }[];
  pesoTotal: number;
  observaciones?: string;
}

interface OrdenCompraData {
  numero: string;
  fecha: Date | string;
  proveedor: {
    nombre: string;
    cuit?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
  };
  items: {
    codigo?: string;
    descripcion: string;
    cantidad: number;
    unidad: string;
    precioUnitario: number;
    subtotal: number;
  }[];
  subtotal: number;
  iva: number;
  total: number;
  condicionesPago?: string;
  fechaEntrega?: Date | string;
  lugarEntrega?: string;
  observaciones?: string;
  solicitante?: string;
}

interface MovimientoCajaData {
  fecha: Date | string;
  tipo: 'INGRESO' | 'EGRESO';
  concepto: string;
  categoria?: string;
  monto: number;
  formaPago?: string;
  observaciones?: string;
}

interface CuentaCorrienteData {
  tercero: {
    nombre: string;
    cuit?: string;
    tipo: 'CLIENTE' | 'PROVEEDOR';
  };
  movimientos: {
    fecha: Date | string;
    tipo: 'FACTURA' | 'PAGO' | 'NOTA_CREDITO' | 'NOTA_DEBITO';
    comprobante: string;
    debe: number;
    haber: number;
    saldo: number;
  }[];
  saldoFinal: number;
  resumen: {
    dias30: number;
    dias60: number;
    dias90: number;
    masDe90: number;
    total: number;
  };
}

// ==================== CLASE EXPORTADORA PDF ====================

export class PDFExporter {
  private static defaultCompanyName = 'Solemar Alimentaria';
  private static defaultCompanyDetails = {
    cuit: '30-12345678-9',
    direccion: 'Ruta 2 Km 45, San Cayetano',
    telefono: '(02268) 45-1234',
    email: 'contacto@solemar.com.ar',
  };

  /**
   * Formatea un número como moneda argentina
   */
  private static formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value);
  }

  /**
   * Formatea una fecha
   */
  private static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-AR');
  }

  /**
   * Agrega el encabezado común a todos los reportes
   */
  private static addHeader(
    doc: jsPDF,
    title: string,
    subtitle?: string,
    companyName?: string
  ): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // Logo (placeholder - se puede reemplazar con imagen real)
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text(companyName || this.defaultCompanyName, pageWidth / 2, y, {
      align: 'center',
    });

    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(
      this.defaultCompanyDetails.direccion || '',
      pageWidth / 2,
      y,
      { align: 'center' }
    );

    y += 5;
    doc.text(
      `CUIT: ${this.defaultCompanyDetails.cuit}`,
      pageWidth / 2,
      y,
      { align: 'center' }
    );

    // Línea separadora
    y += 8;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, y, pageWidth - 14, y);

    // Título del reporte
    y += 12;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text(title, pageWidth / 2, y, { align: 'center' });

    if (subtitle) {
      y += 6;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(subtitle, pageWidth / 2, y, { align: 'center' });
    }

    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, y, pageWidth - 14, y);

    return y + 10;
  }

  /**
   * Agrega el pie de página a todos los reportes
   */
  private static addFooter(doc: jsPDF) {
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);

      // Fecha de generación
      doc.text(
        `Generado el ${new Date().toLocaleString('es-AR')}`,
        14,
        pageHeight - 10
      );

      // Número de página
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth - 14,
        pageHeight - 10,
        { align: 'right' }
      );
    }
  }

  /**
   * Genera un reporte genérico
   */
  static generateReport(options: ReportOptions): jsPDF {
    const {
      title,
      subtitle,
      headers,
      data,
      orientation = 'portrait',
      companyName,
      fileName,
    } = options;

    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    let y = this.addHeader(doc, title, subtitle, companyName);

    // Tabla de datos
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: y,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [245, 158, 11], // amber-500
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      margin: { top: y, left: 14, right: 14 },
    });

    this.addFooter(doc);

    return doc;
  }

  /**
   * Genera reporte de faena
   */
  static generateFaenaReport(data: FaenaData[]): jsPDF {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    let y = this.addHeader(doc, 'Reporte de Faena', 'Detalle de balances por tropa');

    // Resumen
    const totalAnimales = data.reduce((sum, d) => sum + d.cantidadAnimales, 0);
    const totalPesoVivo = data.reduce((sum, d) => sum + d.pesoVivoTotal, 0);
    const totalPesoFrio = data.reduce((sum, d) => sum + d.pesoFrioTotal, 0);
    const rindePromedio = totalPesoVivo > 0 ? (totalPesoFrio / totalPesoVivo) * 100 : 0;

    y += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Total registros: ${data.length}`, 14, y);
    doc.text(`Total animales: ${totalAnimales.toLocaleString('es-AR')}`, 60, y);
    doc.text(`Rinde promedio: ${rindePromedio.toFixed(2)}%`, 120, y);

    // Tabla
    const headers = ['Fecha', 'Tropa', 'Productor', 'Animales', 'Peso Vivo', 'Peso Frío', 'Rinde', 'Observaciones'];
    const rows = data.map(d => [
      this.formatDate(d.fecha),
      `T-${d.tropaNumero}`,
      d.productor,
      d.cantidadAnimales.toString(),
      `${d.pesoVivoTotal.toLocaleString('es-AR')} kg`,
      `${d.pesoFrioTotal.toLocaleString('es-AR')} kg`,
      `${(d.rinde ?? 0).toFixed(2)}%`,
      d.observaciones || '-',
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: y + 10,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
      },
    });

    this.addFooter(doc);
    return doc;
  }

  /**
   * Genera reporte de rendimientos
   */
  static generateRendimientoReport(data: RendimientoData[]): jsPDF {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    let y = this.addHeader(doc, 'Reporte de Rendimientos', 'Histórico de rindes por período');

    // Estadísticas
    const rindePromedio = data.length > 0
      ? data.reduce((sum, d) => sum + d.rindePromedio, 0) / data.length
      : 0;
    const mejorRinde = data.length > 0 ? Math.max(...data.map(d => d.rindePromedio)) : 0;
    const peorRinde = data.length > 0 ? Math.min(...data.map(d => d.rindePromedio)) : 0;

    y += 5;
    doc.setFontSize(10);
    doc.text(`Rinde promedio general: ${rindePromedio.toFixed(2)}%`, 14, y);
    doc.text(`Mejor rinde: ${mejorRinde.toFixed(2)}%`, 80, y);
    doc.text(`Peor rinde: ${peorRinde.toFixed(2)}%`, 140, y);

    // Tabla
    const headers = ['Período', 'Fecha', 'Tipo Animal', 'Animales', 'Peso Vivo', 'Peso Frío', 'Rinde Prom.', 'Rinde Máx.', 'Rinde Mín.'];
    const rows = data.map(d => [
      d.periodo,
      this.formatDate(d.fecha),
      d.tipoAnimal || 'Todos',
      d.cantidadAnimales.toLocaleString('es-AR'),
      `${d.pesoVivoTotal.toLocaleString('es-AR')} kg`,
      `${d.pesoFrioTotal.toLocaleString('es-AR')} kg`,
      `${d.rindePromedio.toFixed(2)}%`,
      `${d.rindeMaximo.toFixed(2)}%`,
      `${d.rindeMinimo.toFixed(2)}%`,
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: y + 10,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });

    this.addFooter(doc);
    return doc;
  }

  /**
   * Genera reporte de stock
   */
  static generateStockReport(data: StockData[]): jsPDF {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    let y = this.addHeader(doc, 'Reporte de Stock de Insumos', 'Inventario actual por depósito');

    // Alertas
    const bajoMinimo = data.filter(d => d.estado === 'BAJO_MINIMO').length;

    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Total items: ${data.length}`, 14, y);
    if (bajoMinimo > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(`⚠️ Items bajo mínimo: ${bajoMinimo}`, 60, y);
    }

    // Tabla
    const headers = ['Código', 'Insumo', 'Categoría', 'Depósito', 'Cantidad', 'Unidad', 'Stock Mín.', 'Estado'];
    const rows = data.map(d => [
      d.codigo || '-',
      d.insumo,
      d.categoria || '-',
      d.deposito,
      d.cantidad.toLocaleString('es-AR'),
      d.unidad,
      d.stockMinimo.toLocaleString('es-AR'),
      d.estado === 'BAJO_MINIMO' ? '⚠️ BAJO MÍNIMO' : 'Normal',
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: y + 10,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      didParseCell: (hookData) => {
        if (hookData.row.index > 0 && hookData.column.index === 7) {
          const cellData = hookData.cell.raw as string;
          if (cellData.includes('BAJO')) {
            hookData.cell.styles.textColor = [220, 38, 38];
            hookData.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    this.addFooter(doc);
    return doc;
  }

  /**
   * Genera factura para impresión (con CAE para AFIP)
   */
  static generateFactura(factura: FacturaData): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 10;

    // Encabezado empresa
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(factura.emisor?.nombre || this.defaultCompanyName, 14, y);

    y += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(factura.emisor?.direccion || this.defaultCompanyDetails.direccion || '', 14, y);
    y += 4;
    doc.text(`CUIT: ${factura.emisor?.cuit || this.defaultCompanyDetails.cuit}`, 14, y);
    y += 4;
    doc.text(`${factura.emisor?.condicionIva || 'IVA Responsable Inscripto'} - Inicio Actividades: ${factura.emisor?.inicioActividades || '01/01/2000'}`, 14, y);

    // Título factura
    y = 15;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA', pageWidth - 14, y, { align: 'right' });
    y += 7;
    doc.setFontSize(12);
    doc.text(factura.numero, pageWidth - 14, y, { align: 'right' });
    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${this.formatDate(factura.fecha)}`, pageWidth - 14, y, { align: 'right' });

    // Línea separadora
    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, y, pageWidth - 14, y);

    // Datos cliente
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE:', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(factura.cliente.nombre, 14, y);
    if (factura.cliente.cuit) {
      y += 4;
      doc.text(`CUIT: ${factura.cliente.cuit}`, 14, y);
    }
    if (factura.cliente.direccion) {
      y += 4;
      doc.text(`Domicilio: ${factura.cliente.direccion}`, 14, y);
    }
    if (factura.cliente.condicionIva) {
      y += 4;
      doc.text(`Condición IVA: ${factura.cliente.condicionIva}`, 14, y);
    }

    // Tabla de items
    y += 10;
    const headers = ['Descripción', 'Cantidad', 'Unidad', 'P. Unitario', 'Subtotal'];
    const rows = factura.items.map(item => [
      item.descripcion,
      item.cantidad.toString(),
      item.unidad,
      this.formatCurrency(item.precioUnitario),
      this.formatCurrency(item.subtotal),
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: y,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        1: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
    });

    // Totales
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || y + 50;
    y = finalY + 5;

    doc.setFontSize(10);
    doc.text('Subtotal:', pageWidth - 60, y);
    doc.text(this.formatCurrency(factura.subtotal), pageWidth - 14, y, { align: 'right' });
    y += 5;
    doc.text('IVA (21%):', pageWidth - 60, y);
    doc.text(this.formatCurrency(factura.iva), pageWidth - 14, y, { align: 'right' });
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', pageWidth - 60, y);
    doc.text(this.formatCurrency(factura.total), pageWidth - 14, y, { align: 'right' });

    // CAE (si existe)
    if (factura.cae) {
      y += 15;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(14, y, pageWidth - 28, 30);

      y += 5;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('DATOS AFIP:', 18, y);

      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.text(`CAE: ${factura.cae}`, 18, y);

      if (factura.caeVencimiento) {
        doc.text(`Vencimiento CAE: ${this.formatDate(factura.caeVencimiento)}`, pageWidth - 18, y, { align: 'right' });
      }

      // Código de barras del CAE (simulado - en producción usar librería de código de barras)
      y += 10;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Código de Barras:', 18, y);
      y += 5;
      // Simulación de código de barras
      const barCode = factura.cae + factura.caeVencimiento?.toString().replace(/\D/g, '').slice(0, 8) || '';
      for (let i = 0; i < barCode.length; i++) {
        const lineWidth = Math.random() > 0.5 ? 1 : 0.5;
        doc.setLineWidth(lineWidth);
        doc.line(18 + i * 4, y, 18 + i * 4, y + 10);
      }
    }

    // Observaciones
    if (factura.observaciones) {
      y = factura.cae ? y + 20 : y + 10;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Observaciones: ${factura.observaciones}`, 14, y);
    }

    // Condición de venta
    if (factura.condicionVenta) {
      y += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Condición de venta: ${factura.condicionVenta}`, 14, y);
    }

    this.addFooter(doc);
    return doc;
  }

  /**
   * Genera remito
   */
  static generateRemito(remito: RemitoData): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // Encabezado
    y = this.addHeader(doc, 'REMITO', `N° ${remito.numero}`);

    // Datos de origen y destino
    y += 5;
    const colWidth = (pageWidth - 28) / 2;

    // Origen
    doc.setFillColor(250, 250, 250);
    doc.rect(14, y, colWidth - 5, 30, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ORIGEN:', 18, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(remito.origen.nombre, 18, y + 12);
    if (remito.origen.direccion) {
      doc.setFontSize(9);
      doc.text(remito.origen.direccion, 18, y + 18);
    }

    // Destino
    doc.rect(14 + colWidth + 5, y, colWidth - 5, 30, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DESTINO:', 18 + colWidth + 5, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(remito.destino.nombre, 18 + colWidth + 5, y + 12);
    if (remito.destino.cuit) {
      doc.setFontSize(9);
      doc.text(`CUIT: ${remito.destino.cuit}`, 18 + colWidth + 5, y + 18);
    }
    if (remito.destino.direccion) {
      doc.text(remito.destino.direccion, 18 + colWidth + 5, y + 24);
    }

    y += 35;

    // Transporte
    if (remito.transportista || remito.patenteChasis) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      if (remito.transportista) {
        doc.text(`Transportista: ${remito.transportista.nombre}${remito.transportista.cuit ? ` - CUIT: ${remito.transportista.cuit}` : ''}`, 14, y);
      }
      if (remito.patenteChasis) {
        doc.text(`Patente: ${remito.patenteChasis}${remito.patenteAcoplado ? ` / ${remito.patenteAcoplado}` : ''}`, pageWidth - 14, y, { align: 'right' });
      }
      y += 8;
    }

    // Tabla de items
    const headers = ['Descripción', 'Cantidad', 'Unidad', 'Peso (kg)'];
    const rows = remito.items.map(item => [
      item.descripcion,
      item.cantidad.toString(),
      item.unidad,
      item.pesoKg?.toLocaleString('es-AR') || '-',
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: y,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });

    // Total
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || y + 50;
    y = finalY + 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Peso Total: ${remito.pesoTotal.toLocaleString('es-AR')} kg`, pageWidth - 14, y, { align: 'right' });

    // Firmas
    y += 20;
    doc.setDrawColor(150, 150, 150);
    doc.line(14, y + 15, 80, y + 15);
    doc.line(pageWidth - 80, y + 15, pageWidth - 14, y + 15);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Firma Entrega', 47, y + 22, { align: 'center' });
    doc.text('Firma Recibe', pageWidth - 47, y + 22, { align: 'center' });

    // Aclaraciones
    doc.line(14, y + 35, 80, y + 35);
    doc.line(pageWidth - 80, y + 35, pageWidth - 14, y + 35);
    doc.text('Aclaración', 47, y + 42, { align: 'center' });
    doc.text('Aclaración', pageWidth - 47, y + 42, { align: 'center' });

    // Observaciones
    if (remito.observaciones) {
      y += 50;
      doc.setFontSize(9);
      doc.text(`Observaciones: ${remito.observaciones}`, 14, y);
    }

    this.addFooter(doc);
    return doc;
  }

  /**
   * Genera orden de compra
   */
  static generateOrdenCompra(orden: OrdenCompraData): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // Encabezado
    y = this.addHeader(doc, 'ORDEN DE COMPRA', `N° ${orden.numero}`);

    // Datos del proveedor
    y += 5;
    doc.setFillColor(250, 250, 250);
    doc.rect(14, y, pageWidth - 28, 28, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PROVEEDOR:', 18, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(orden.proveedor.nombre, 18, y + 12);
    if (orden.proveedor.cuit) {
      doc.setFontSize(9);
      doc.text(`CUIT: ${orden.proveedor.cuit}`, 18, y + 18);
      if (orden.proveedor.telefono) {
        doc.text(`Tel: ${orden.proveedor.telefono}`, 80, y + 18);
      }
    }

    y += 35;

    // Condiciones
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (orden.condicionesPago) {
      doc.text(`Condiciones de pago: ${orden.condicionesPago}`, 14, y);
    }
    if (orden.fechaEntrega) {
      doc.text(`Fecha de entrega: ${this.formatDate(orden.fechaEntrega)}`, pageWidth - 14, y, { align: 'right' });
    }
    if (orden.lugarEntrega) {
      y += 5;
      doc.text(`Lugar de entrega: ${orden.lugarEntrega}`, 14, y);
    }
    if (orden.solicitante) {
      y += 5;
      doc.text(`Solicitante: ${orden.solicitante}`, 14, y);
    }

    y += 10;

    // Tabla de items
    const headers = ['Código', 'Descripción', 'Cantidad', 'Unidad', 'P. Unitario', 'Subtotal'];
    const rows = orden.items.map(item => [
      item.codigo || '-',
      item.descripcion,
      item.cantidad.toString(),
      item.unidad,
      this.formatCurrency(item.precioUnitario),
      this.formatCurrency(item.subtotal),
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: y,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        2: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
      },
    });

    // Totales
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || y + 50;
    y = finalY + 5;

    doc.setFontSize(10);
    doc.text('Subtotal:', pageWidth - 60, y);
    doc.text(this.formatCurrency(orden.subtotal), pageWidth - 14, y, { align: 'right' });
    y += 5;
    doc.text('IVA:', pageWidth - 60, y);
    doc.text(this.formatCurrency(orden.iva), pageWidth - 14, y, { align: 'right' });
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', pageWidth - 60, y);
    doc.text(this.formatCurrency(orden.total), pageWidth - 14, y, { align: 'right' });

    // Firmas
    y += 20;
    doc.setDrawColor(150, 150, 150);
    doc.line(14, y + 15, 80, y + 15);
    doc.line(pageWidth - 80, y + 15, pageWidth - 14, y + 15);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Firma Autorizada', 47, y + 22, { align: 'center' });
    doc.text('Fecha', pageWidth - 47, y + 22, { align: 'center' });

    // Observaciones
    if (orden.observaciones) {
      y += 35;
      doc.setFontSize(9);
      doc.text(`Observaciones: ${orden.observaciones}`, 14, y);
    }

    this.addFooter(doc);
    return doc;
  }

  /**
   * Genera reporte de movimientos de caja
   */
  static generateMovimientosCaja(
    data: MovimientoCajaData[],
    cajaNombre?: string,
    fechaDesde?: Date,
    fechaHasta?: Date
  ): jsPDF {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    let subtitle = cajaNombre ? `Caja: ${cajaNombre}` : undefined;
    if (fechaDesde && fechaHasta) {
      subtitle = `${subtitle || ''} Período: ${this.formatDate(fechaDesde)} - ${this.formatDate(fechaHasta)}`;
    }

    let y = this.addHeader(doc, 'Reporte de Movimientos de Caja', subtitle);

    // Resumen
    const totalIngresos = data.filter(d => d.tipo === 'INGRESO').reduce((sum, d) => sum + d.monto, 0);
    const totalEgresos = data.filter(d => d.tipo === 'EGRESO').reduce((sum, d) => sum + d.monto, 0);
    const saldo = totalIngresos - totalEgresos;

    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Total Ingresos: ${this.formatCurrency(totalIngresos)}`, 14, y);
    doc.text(`Total Egresos: ${this.formatCurrency(totalEgresos)}`, 80, y);
    doc.text(`Saldo: ${this.formatCurrency(saldo)}`, 150, y);

    // Tabla
    const headers = ['Fecha', 'Tipo', 'Concepto', 'Categoría', 'Monto', 'Forma Pago', 'Observaciones'];
    const rows = data.map(d => [
      this.formatDate(d.fecha),
      d.tipo,
      d.concepto,
      d.categoria || '-',
      this.formatCurrency(d.monto),
      d.formaPago || '-',
      d.observaciones || '-',
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: y + 10,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      didParseCell: (hookData) => {
        if (hookData.row.index > 0 && hookData.column.index === 1) {
          const cellData = hookData.cell.raw as string;
          if (cellData === 'INGRESO') {
            hookData.cell.styles.textColor = [22, 163, 74]; // green
          } else if (cellData === 'EGRESO') {
            hookData.cell.styles.textColor = [220, 38, 38]; // red
          }
        }
      },
    });

    this.addFooter(doc);
    return doc;
  }

  /**
   * Genera reporte de cuenta corriente
   */
  static generateCuentaCorriente(data: CuentaCorrienteData): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = this.addHeader(
      doc,
      'Cuenta Corriente',
      `${data.tercero.tipo}: ${data.tercero.nombre}`
    );

    // Datos del tercero
    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    if (data.tercero.cuit) {
      doc.text(`CUIT: ${data.tercero.cuit}`, 14, y);
    }

    // Resumen de antigüedad
    y += 10;
    const boxWidth = (pageWidth - 28 - 16) / 5;
    const labels = ['0-30 días', '31-60 días', '61-90 días', '+90 días', 'TOTAL'];
    const values = [
      data.resumen.dias30,
      data.resumen.dias60,
      data.resumen.dias90,
      data.resumen.masDe90,
      data.resumen.total,
    ];

    labels.forEach((label, i) => {
      const x = 14 + i * (boxWidth + 4);
      doc.setFillColor(250, 250, 250);
      doc.rect(x, y, boxWidth, 20, 'F');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(label, x + boxWidth / 2, y + 6, { align: 'center' });
      doc.setFontSize(11);
      doc.setTextColor(51, 51, 51);
      doc.text(this.formatCurrency(values[i]), x + boxWidth / 2, y + 15, { align: 'center' });
    });

    y += 28;

    // Tabla de movimientos
    const headers = ['Fecha', 'Tipo', 'Comprobante', 'Debe', 'Haber', 'Saldo'];
    const rows = data.movimientos.map(m => [
      this.formatDate(m.fecha),
      m.tipo,
      m.comprobante,
      m.debe > 0 ? this.formatCurrency(m.debe) : '-',
      m.haber > 0 ? this.formatCurrency(m.haber) : '-',
      this.formatCurrency(m.saldo),
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: y,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
      },
    });

    // Saldo final
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || y + 50;
    y = finalY + 5;
    doc.setFillColor(250, 250, 250);
    doc.rect(14, y, pageWidth - 28, 12, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Saldo Final:', 18, y + 8);
    doc.text(this.formatCurrency(data.saldoFinal), pageWidth - 18, y + 8, { align: 'right' });

    this.addFooter(doc);
    return doc;
  }

  /**
   * Descarga el PDF directamente
   */
  static downloadPDF(doc: jsPDF, filename: string) {
    doc.save(filename);
  }

  /**
   * Obtiene el PDF como blob
   */
  static getBlob(doc: jsPDF): Blob {
    return doc.output('blob');
  }

  /**
   * Obtiene el PDF como base64
   */
  static getBase64(doc: jsPDF): string {
    return doc.output('datauristring');
  }
}

export default PDFExporter;
