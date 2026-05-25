import { createLogger } from '@/lib/logger'
const log = createLogger('lib.export-pdf-charts')
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ==================== TYPES ====================

export interface ChartExportOptions {
  /** Report title displayed in the header */
  title: string
  /** Optional subtitle (e.g., date range) */
  subtitle?: string
  /** Primary chart image as a base64 PNG data URL */
  chartImage: string
  /** Data table column definitions */
  dataColumns: { header: string; width?: number }[]
  /** Data table rows */
  dataRows: string[][]
  /** Additional charts to include (e.g., second chart in a dual-chart layout) */
  additionalCharts?: { image: string; title: string }[]
  /** Output filename (without extension) */
  fileName?: string
  /** Page orientation */
  orientation?: 'portrait' | 'landscape'
}

// ==================== CONSTANTS ====================

const COMPANY_NAME = 'Solemar Alimentaria'
const COMPANY_DETAILS = {
  cuit: '30-12345678-9',
  direccion: 'Ruta 2 Km 45, San Cayetano',
}

const COLORS = {
  amber: [245, 158, 11] as [number, number, number],
  darkText: [51, 51, 51] as [number, number, number],
  grayText: [100, 100, 100] as [number, number, number],
  lightGray: [200, 200, 200] as [number, number, number],
  altRow: [250, 250, 250] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
}

const MARGIN = { top: 14, bottom: 14, left: 14, right: 14 }
const FOOTER_HEIGHT = 15

// ==================== MAIN EXPORT FUNCTION ====================

/**
 * Exports a report that includes chart images plus a data table to PDF.
 * Handles multi-page layout automatically.
 */
export async function exportChartReportToPDF(options: ChartExportOptions): Promise<void> {
  const {
    title,
    subtitle,
    chartImage,
    dataColumns,
    dataRows,
    additionalCharts = [],
    fileName = 'reporte_con_grafico',
    orientation = 'landscape',
  } = options

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - MARGIN.left - MARGIN.right

  // ---- HEADER ----
  let y = drawHeader(doc, pageWidth, title, subtitle)

  // ---- CHART IMAGE(S) ----
  // Build array of charts to render: primary + additional
  const chartsToRender: { image: string; title: string }[] = [
    { image: chartImage, title },
    ...additionalCharts,
  ]

  const isMultiChart = chartsToRender.length > 1

  for (let i = 0; i < chartsToRender.length; i++) {
    const chartInfo = chartsToRender[i]
    const availableHeight = pageHeight - y - MARGIN.bottom - FOOTER_HEIGHT

    // Calculate chart dimensions
    let chartWidth: number
    let chartHeight: number

    if (isMultiChart) {
      // Two charts side by side on landscape, or stacked on portrait
      if (orientation === 'landscape') {
        chartWidth = (contentWidth - 10) / 2 // 10mm gap between charts
      } else {
        chartWidth = contentWidth
      }
      // Chart height: ~40% of remaining usable page height
      chartHeight = Math.min(availableHeight * 0.4, 100)
    } else {
      chartWidth = contentWidth
      // Single chart: ~40% of page height
      chartHeight = Math.min(availableHeight * 0.4, 110)
    }

    // If there's a second chart on landscape, render them side by side
    if (i === 1 && orientation === 'landscape') {
      // Move to the right column
      const x2 = MARGIN.left + chartWidth + 10
      await drawChartImage(doc, chartInfo.image, x2, y, chartWidth, chartHeight)
    } else {
      // Check if we need a new page
      if (y + chartHeight + 10 > pageHeight - MARGIN.bottom - FOOTER_HEIGHT) {
        doc.addPage()
        y = MARGIN.top
      }
      await drawChartImage(doc, chartInfo.image, MARGIN.left, y, chartWidth, chartHeight)
    }

    // After first chart in multi-chart landscape mode, don't move y
    if (i === 0 && isMultiChart && orientation === 'landscape') {
      // y stays the same, second chart renders next to it
    } else {
      y += chartHeight + 8
    }
  }

  // ---- DATA TABLE ----
  // Check if we need a new page for the table
  const minTableSpace = 30
  if (y + minTableSpace > pageHeight - MARGIN.bottom - FOOTER_HEIGHT) {
    doc.addPage()
    y = MARGIN.top
  }

  // Table section label
  y += 2
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.darkText)
  doc.text('Datos Detallados', MARGIN.left, y)
  y += 4
  doc.setDrawColor(...COLORS.lightGray)
  doc.line(MARGIN.left, y, pageWidth - MARGIN.right, y)
  y += 4

  const headers = dataColumns.map((col) => col.header)
  const columnWidths = dataColumns.map((col) => col.width)

  autoTable(doc, {
    head: [headers],
    body: dataRows,
    startY: y,
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: COLORS.amber,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: COLORS.altRow,
    },
    margin: {
      top: MARGIN.top,
      left: MARGIN.left,
      right: MARGIN.right,
      bottom: MARGIN.bottom + FOOTER_HEIGHT,
    },
    columnStyles: columnWidths.length > 0
      ? Object.fromEntries(
          columnWidths
            .map((w, idx) => (w ? [idx, { cellWidth: w }] : null))
            .filter(Boolean) as [number, { cellWidth: number }][]
        )
      : undefined,
  })

  // ---- FOOTER ----
  drawFooter(doc, pageWidth, pageHeight)

  // ---- SAVE ----
  doc.save(`${fileName}.pdf`)
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Draws the company header + report title.
 */
function drawHeader(
  doc: jsPDF,
  pageWidth: number,
  title: string,
  subtitle?: string
): number {
  let y = 15

  // Company name
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.darkText)
  doc.text(COMPANY_NAME, pageWidth / 2, y, { align: 'center' })

  y += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.grayText)
  doc.text(COMPANY_DETAILS.direccion, pageWidth / 2, y, { align: 'center' })

  y += 5
  doc.text(`CUIT: ${COMPANY_DETAILS.cuit}`, pageWidth / 2, y, { align: 'center' })

  // Separator
  y += 8
  doc.setDrawColor(...COLORS.lightGray)
  doc.line(MARGIN.left, y, pageWidth - MARGIN.right, y)

  // Report title
  y += 10
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.darkText)
  doc.text(title, pageWidth / 2, y, { align: 'center' })

  if (subtitle) {
    y += 6
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.grayText)
    doc.text(subtitle, pageWidth / 2, y, { align: 'center' })
  }

  // Second separator
  y += 5
  doc.setDrawColor(...COLORS.lightGray)
  doc.line(MARGIN.left, y, pageWidth - MARGIN.right, y)

  return y + 8
}

/**
 * Draws a chart image (base64 PNG data URL) onto the PDF.
 * Wraps the image in a bordered box with optional title.
 */
async function drawChartImage(
  doc: jsPDF,
  imageBase64: string,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number
): Promise<number> {
  return new Promise<number>((resolve) => {
    try {
      const img = new Image()
      img.onload = () => {
        // Calculate dimensions preserving aspect ratio
        const imgAspect = img.naturalWidth / img.naturalHeight
        let imgWidth = maxWidth
        let imgHeight = maxWidth / imgAspect

        if (imgHeight > maxHeight) {
          imgHeight = maxHeight
          imgWidth = maxHeight * imgAspect
        }

        // Draw a light border/background box
        const padding = 3
        doc.setFillColor(250, 250, 250)
        doc.setDrawColor(230, 230, 230)
        doc.roundedRect(
          x - padding,
          y - padding,
          imgWidth + padding * 2,
          imgHeight + padding * 2,
          2,
          2,
          'FD'
        )

        // Add the chart image
        doc.addImage(imageBase64, 'PNG', x, y, imgWidth, imgHeight, undefined, 'FAST')

        resolve(imgHeight + padding * 2)
      }

      img.onerror = () => {
        log.warn('[export-pdf-charts] Failed to load chart image')
        // Draw placeholder
        doc.setFillColor(245, 245, 245)
        doc.setDrawColor(200, 200, 200)
        doc.roundedRect(x, y, maxWidth, maxHeight, 2, 2, 'FD')
        doc.setFontSize(10)
        doc.setTextColor(150, 150, 150)
        doc.text('Gráfico no disponible', x + maxWidth / 2, y + maxHeight / 2, {
          align: 'center',
          baseline: 'middle',
        })
        resolve(maxHeight)
      }

      img.src = imageBase64
    } catch (error) {
      console.error('[export-pdf-charts] Error drawing chart image:', error)
      resolve(maxHeight)
    }
  })
}

/**
 * Draws page number footer on all pages.
 */
function drawFooter(doc: jsPDF, pageWidth: number, pageHeight: number): void {
  const pageCount = doc.getNumberOfPages()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)

    // Generation date
    doc.text(
      `Generado el ${new Date().toLocaleString('es-AR')}`,
      MARGIN.left,
      pageHeight - 10
    )

    // Page number
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - MARGIN.right,
      pageHeight - 10,
      { align: 'right' }
    )
  }
}
