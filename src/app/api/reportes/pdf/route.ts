import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// Definir fuentes
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
}

// POST - Exportar reporte PDF
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const body = await request.json()
    const { tipo, filtros = {} } = body

    // @ts-ignore - pdfmake dynamic import types may vary by platform
    const PdfPrinter = (await import('pdfmake/src/printer')).default
    const printer = new PdfPrinter(fonts)

    const docDefinition = await generarDefinicionPDF(tipo, filtros)
    const pdfDoc = printer.createPdfKitDocument(docDefinition)

    const chunks: Buffer[] = []

    return new Promise<Response>((resolve, reject) => {
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk))
      pdfDoc.on('end', () => {
        const result = Buffer.concat(chunks)
        resolve(new NextResponse(result, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${tipo}_${new Date().toISOString().split('T')[0]}.pdf"`
          }
        }))
      })
      pdfDoc.on('error', reject)
      pdfDoc.end()
    })

  } catch (error) {
    console.error('Error al exportar PDF:', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar PDF: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}

async function generarDefinicionPDF(tipo: string, filtros: Record<string, any>): Promise<any> {
  // Header común
  const header = {
    columns: [
      {
        width: '*',
        stack: [
          { text: 'FRIGORÍFICO SOLEMAR', style: 'header' },
          { text: 'Ruta Nacional N° 22, Km 1043, Chimpay', style: 'subheader' },
          { text: 'Río Negro, Argentina', style: 'subheader' }
        ],
        alignment: 'left'
      },
      {
        width: 'auto',
        stack: [
          { text: new Date().toLocaleDateString('es-AR'), alignment: 'right' },
          { text: new Date().toLocaleTimeString('es-AR'), alignment: 'right', style: 'subheader' }
        ]
      }
    ],
    margin: [40, 20, 40, 10] as [number, number, number, number]
  }

  // Footer común
  const footer = (currentPage: number, pageCount: number) => ({
    text: `Página ${currentPage} de ${pageCount}`,
    alignment: 'center',
    style: 'footer'
  })

  // Estilos
  const styles = {
    header: { fontSize: 18, bold: true, color: '#1a365d' },
    subheader: { fontSize: 10, color: '#718096' },
    title: { fontSize: 14, bold: true, margin: [0, 20, 0, 10] as [number, number, number, number] },
    tableHeader: { fontSize: 10, bold: true, fillColor: '#2d3748', color: 'white', alignment: 'center' },
    tableData: { fontSize: 9 },
    footer: { fontSize: 8, color: '#a0aec0' }
  }

  // Obtener datos según tipo
  let titulo = ''
  let tableBody: any[][] = []

  switch (tipo) {
    case 'tropas':
      titulo = 'Reporte de Tropas'
      const tropas = await db.tropa.findMany({
        include: {
          productor: true,
          _count: { select: { animales: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: filtros.limite || 50
      })
      tableBody = [
        [{ text: 'Código', style: 'tableHeader' }, { text: 'Productor', style: 'tableHeader' },
        { text: 'Cabezas', style: 'tableHeader' }, { text: 'Especie', style: 'tableHeader' },
        { text: 'Estado', style: 'tableHeader' }, { text: 'Fecha', style: 'tableHeader' }],
        ...tropas.map(t => [
          t.codigo,
          t.productor?.nombre || '-',
          String(t._count.animales),
          t.especie,
          t.estado,
          t.createdAt.toLocaleDateString('es-AR')
        ])
      ]
      break

    case 'faena-diaria':
      titulo = 'Reporte de Faena Diaria'
      const fecha = filtros.fecha || new Date().toISOString().split('T')[0]
      const faenas = await db.romaneo.findMany({
        where: {
          createdAt: {
            gte: new Date(fecha + 'T00:00:00'),
            lte: new Date(fecha + 'T23:59:59')
          }
        },
        orderBy: { createdAt: 'asc' }
      }) as Array<Record<string, unknown>>
      tableBody = [
        [{ text: 'Tropa', style: 'tableHeader' }, { text: 'Productor', style: 'tableHeader' },
        { text: 'Media', style: 'tableHeader' }, { text: 'Peso', style: 'tableHeader' },
        { text: 'Clasificación', style: 'tableHeader' }],
        ...faenas.map(f => [
          f.tropaCodigo || '-',
          '-',
          f.numeroMedia || '-',
          `${f.peso || 0} kg`,
          f.clasificacion || '-'
        ])
      ]
      break

    default:
      titulo = 'Reporte'
      tableBody = [[{ text: 'No hay datos', colSpan: 6 }]]
  }

  return {
    pageMargins: [40, 80, 40, 60],
    header: () => header,
    footer,
    content: [
      { text: titulo, style: 'title', alignment: 'center' },
      {
        table: {
          headerRows: 1,
          widths: tableBody[0]?.map(() => '*') || [],
          body: tableBody
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#e2e8f0',
          vLineColor: () => '#e2e8f0',
          fillColor: (rowIndex: number) => rowIndex === 0 ? '#2d3748' : (rowIndex % 2 === 0 ? '#f7fafc' : undefined)
        }
      }
    ],
    styles
  }
}
