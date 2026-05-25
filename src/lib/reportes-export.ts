import ExcelJS from 'exceljs'
import fs from 'fs/promises'
import path from 'path'

export interface ExportReportPayload {
  tipo: string
  datos?: Array<Record<string, unknown>>
  resumen?: Record<string, unknown>
  fechaDesde?: string
  fechaHasta?: string
  camaras?: Array<Record<string, unknown>>
  plantillaCodigo?: string
  datosPersonalizados?: Record<string, unknown>
}

const EXPORTS_DIR = path.join(process.cwd(), 'public', 'exports')

export async function exportReportToFile(payload: ExportReportPayload): Promise<string> {
  const { tipo, datos = [], resumen, fechaDesde, fechaHasta, camaras } = payload

  if (!tipo) {
    throw new Error('Tipo de reporte es requerido')
  }

  if (!Array.isArray(datos) || datos.length === 0) {
    throw new Error('Datos insuficientes para exportar')
  }

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Solemar'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Reporte')
  const reportTitle = getReportTitle(tipo)

  sheet.mergeCells('A1', 'G1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = reportTitle
  titleCell.font = { size: 16, bold: true, color: { argb: 'FF1A365D' } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(1).height = 26

  sheet.addRow([])
  const periodoText = fechaDesde || fechaHasta ? `Periodo: ${fechaDesde || '-'} - ${fechaHasta || '-'}` : 'Periodo: no especificado'
  sheet.addRow([periodoText])
  sheet.getRow(3).font = { italic: true, color: { argb: 'FF4A5568' } }
  sheet.addRow([])

  let currentRowIndex = 5

  if (resumen && Object.keys(resumen).length > 0) {
    sheet.mergeCells(`A${currentRowIndex}:G${currentRowIndex}`)
    const resumenTitle = sheet.getCell(`A${currentRowIndex}`)
    resumenTitle.value = 'Resumen'
    resumenTitle.font = { bold: true, size: 12 }
    currentRowIndex += 1

    Object.entries(resumen).forEach(([key, value]) => {
      const row = sheet.getRow(currentRowIndex)
      row.getCell(1).value = formatHeader(key)
      row.getCell(2).value = typeof value === 'number' ? value : String(value ?? '')
      row.getCell(1).font = { bold: true }
      currentRowIndex += 1
    })

    sheet.addRow([])
    currentRowIndex += 1
  }

  const datoEjemplo = datos[0] || {}
  const headers = Array.isArray(datoEjemplo)
    ? datoEjemplo.map((_, index) => `Columna ${index + 1}`)
    : Object.keys(datoEjemplo)

  const headerRow = sheet.getRow(currentRowIndex)
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1)
    cell.value = formatHeader(header)
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D3748' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  })
  sheet.getRow(currentRowIndex).height = 22
  currentRowIndex += 1

  datos.forEach((item) => {
    const rowValues = Array.isArray(item)
      ? item
      : headers.map((header) => item[header] ?? '')

    const row = sheet.getRow(currentRowIndex)
    rowValues.forEach((value, index) => {
      const cell = row.getCell(index + 1)
      cell.value = formatCellValue(value)
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
      cell.alignment = { vertical: 'middle', horizontal: typeof value === 'number' ? 'right' : 'left' }
    })
    currentRowIndex += 1
  })

  sheet.columns.forEach((column) => {
    const values = column.values || []
    const maxLength = values.reduce((max: number, cellValue) => {
      const text = cellValue != null ? String(cellValue) : ''
      return Math.max(max, text.length)
    }, 10)
    column.width = Math.min(Math.max(maxLength + 2, 12), 30)
  })

  if (Array.isArray(camaras) && camaras.length > 0) {
    const camaraSheet = workbook.addWorksheet('Cámaras')
    const camaraHeaders = Object.keys(camaras[0] || {})
    const camaraHeaderRow = camaraSheet.getRow(1)

    camaraHeaders.forEach((header, index) => {
      const cell = camaraHeaderRow.getCell(index + 1)
      cell.value = formatHeader(header)
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D3748' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    camaras.forEach((camara, rowIndex) => {
      const row = camaraSheet.getRow(rowIndex + 2)
      camaraHeaders.forEach((header, colIndex) => {
        const cell = row.getCell(colIndex + 1)
        cell.value = formatCellValue(camara[header])
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
        cell.alignment = { vertical: 'middle', horizontal: 'left' }
      })
    })

    camaraSheet.columns.forEach((column) => {
      const values = column.values || []
      const maxLength = values.reduce((max: number, cellValue) => {
        const text = cellValue != null ? String(cellValue) : ''
        return Math.max(max, text.length)
      }, 10)
      column.width = Math.min(Math.max(maxLength + 2, 12), 30)
    })
  }

  await fs.mkdir(EXPORTS_DIR, { recursive: true })

  const fileName = `${tipo.replace(/\s+/g, '_')}_${Date.now()}.xlsx`
  const outputPath = path.join(EXPORTS_DIR, fileName)
  await workbook.xlsx.writeFile(outputPath)

  return `/exports/${fileName}`
}

function formatHeader(value: string): string {
  return String(value)
    .replace(/([A-Z]{2,})(?=[A-Z][a-z]|\b)/g, '$1 ')
    .replace(/[_\-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatCellValue(value: unknown): string | number | boolean | null {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
    return value
  }

  return String(value)
}

function getReportTitle(tipo: string) {
  const titles: Record<string, string> = {
    tropas: 'Reporte de Tropas',
    stock: 'Reporte de Stock',
    rendimiento: 'Reporte de Rendimiento',
    pesajes: 'Reporte de Pesajes',
    faena: 'Reporte de Faena',
    'stock-camara': 'Reporte de Stock por Cámara'
  }

  return titles[tipo] || `Reporte ${tipo}`
}
