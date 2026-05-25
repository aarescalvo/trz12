import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validarPermiso } from '@/lib/auth-helpers'

function getOperadorId(request: NextRequest): string | null {
  return request.headers.get('x-operador-id')
}

// Fuentes estándar para pdfmake
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
}

const TIPOS_NOTA: Record<string, string> = {
  CREDITO: 'NOTA DE CREDITO',
  DEBITO: 'NOTA DE DEBITO',
}

const MOTIVOS_LABEL: Record<string, string> = {
  DEVOLUCION: 'Devolucion',
  DESCUENTO: 'Descuento',
  ERROR: 'Error en facturacion',
  ANULACION: 'Anulacion',
  AJUSTE: 'Ajuste',
}

const CONDICION_IVA: Record<string, string> = {
  RI: 'Responsable Inscripto',
  CF: 'Consumidor Final',
  MT: 'Monotributista',
  EX: 'Exento',
  NR: 'No Responsable',
}

const TIPOS_COMPROBANTE_FACT: Record<string, string> = {
  FACTURA_A: 'FACTURA A',
  FACTURA_B: 'FACTURA B',
  FACTURA_C: 'FACTURA C',
}

// POST /api/facturacion/notas/pdf — Generar PDF de nota de crédito/débito
export async function POST(request: NextRequest) {
  try {
    const operadorId = getOperadorId(request)
    const puedeVer = await validarPermiso(operadorId, 'puedeFacturacion')
    if (!puedeVer) {
      return NextResponse.json({ success: false, error: 'Sin permisos de facturación' }, { status: 403 })
    }
    const body = await request.json()
    const { notaId } = body

    if (!notaId) {
      return NextResponse.json({ success: false, error: 'notaId es requerido' }, { status: 400 })
    }

    const nota = await db.notaCreditoDebito.findUnique({
      where: { id: notaId },
      include: {
        factura: {
          include: {
            cliente: true,
            detalles: { orderBy: { createdAt: 'asc' } },
          }
        },
        operador: { select: { id: true, nombre: true } },
      },
    })

    if (!nota) {
      return NextResponse.json({ success: false, error: 'Nota no encontrada' }, { status: 404 })
    }

    const config = await db.configuracionFrigorifico.findFirst()

    // @ts-ignore - pdfmake/src/printer types may not be available on all platforms
    const PdfPrinter = ((await import('pdfmake')).default || (await import('pdfmake'))) as unknown as typeof import('pdfmake/src/printer')
    const printer = new PdfPrinter(fonts)

    const docDefinition = generarNotaPDF(nota, config)
    const pdfDoc = printer.createPdfKitDocument(docDefinition)

    const chunks: Buffer[] = []

    return new Promise<Response>((resolve, reject) => {
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk))
      pdfDoc.on('end', () => {
        const result = Buffer.concat(chunks)
        const tipoLabel = TIPOS_NOTA[nota.tipo] || 'NOTA'
        const numero = `${String(nota.puntoVenta).padStart(4, '0')}-${String(nota.numero).padStart(8, '0')}`
        const filename = `${tipoLabel.replace(/ /g, '_')}_${numero.replace(/-/g, '_')}.pdf`
        resolve(new NextResponse(result, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`
          }
        }))
      })
      pdfDoc.on('error', reject)
      pdfDoc.end()
    })
  } catch (error) {
    console.error('Error al generar PDF de nota:', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar PDF: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}

function generarNotaPDF(nota: any, config: any) {
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n || 0)

  const formatDate = (d: string | Date) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const factura = nota.factura
  const tipoLabel = TIPOS_NOTA[nota.tipo] || nota.tipo
  const motivoLabel = MOTIVOS_LABEL[nota.motivo] || nota.motivo
  const tipoFacturaLabel = TIPOS_COMPROBANTE_FACT[factura?.tipoComprobante] || factura?.tipoComprobante || '-'

  const clienteNombre = factura?.clienteNombre || factura?.cliente?.razonSocial || factura?.cliente?.nombre || '-'
  const clienteCuit = factura?.clienteCuit || factura?.cliente?.cuit || '-'
  const clienteCondIva = factura?.clienteCondicionIva || factura?.cliente?.condicionIva || '-'
  const clienteDireccion = factura?.clienteDireccion || factura?.cliente?.direccion || '-'
  const condIvaLabel = CONDICION_IVA[clienteCondIva] || clienteCondIva

  const empresaNombre = config?.nombre || 'Solemar Alimentaria'
  const empresaDireccion = config?.direccion || ''
  const empresaCuit = config?.cuit || ''
  const empresaEstab = config?.numeroEstablecimiento || ''
  const empresaMatricula = config?.numeroMatricula || ''

  const notaNumero = `${String(nota.puntoVenta).padStart(4, '0')}-${String(nota.numero).padStart(8, '0')}`

  const COLOR_PRIMARY = nota.tipo === 'CREDITO' ? '#1e40af' : '#991b1b'
  const COLOR_ACCENT = nota.tipo === 'CREDITO' ? '#3b82f6' : '#ef4444'
  const COLOR_TEXT = '#1c1917'
  const COLOR_MUTED = '#78716c'
  const COLOR_LIGHT = '#f5f5f4'
  const COLOR_BORDER = '#d6d3d1'

  const headerEmpresa: any[] = [
    { text: empresaNombre, fontSize: 18, bold: true, color: COLOR_TEXT },
  ]
  if (empresaDireccion) {
    headerEmpresa.push({ text: empresaDireccion, fontSize: 9, color: COLOR_MUTED, margin: [0, 2, 0, 0] })
  }
  const datosFiscales: string[] = []
  if (empresaCuit) datosFiscales.push(`CUIT: ${empresaCuit}`)
  if (empresaEstab) datosFiscales.push(`Est. N° ${empresaEstab}`)
  if (empresaMatricula) datosFiscales.push(`Mat. ${empresaMatricula}`)
  if (datosFiscales.length > 0) {
    headerEmpresa.push({ text: datosFiscales.join('  ·  '), fontSize: 8, color: COLOR_MUTED, margin: [0, 2, 0, 0] })
  }

  const headerComprobante: any[] = [
    { text: tipoLabel, fontSize: 16, bold: true, color: COLOR_ACCENT, alignment: 'right' },
    { text: notaNumero, fontSize: 14, bold: true, color: COLOR_TEXT, alignment: 'right', margin: [0, 2, 0, 0] },
    { text: `Fecha: ${formatDate(nota.fecha)}`, fontSize: 9, color: COLOR_MUTED, alignment: 'right', margin: [0, 4, 0, 0] },
    { text: `Ref. Factura: ${factura?.numero || '-'}`, fontSize: 9, color: COLOR_MUTED, alignment: 'right', margin: [0, 2, 0, 0] },
    ...(nota.estado === 'ANULADA' ? [{
      text: 'ANULADA',
      fontSize: 14,
      bold: true,
      color: '#dc2626',
      alignment: 'right',
      margin: [0, 6, 0, 0],
    }] : []),
  ]

  const detallesFactura: any[] = []
  if (factura?.detalles && factura.detalles.length > 0) {
    detallesFactura.push(
      { text: 'DETALLE DE LA FACTURA REFERENCIA', fontSize: 8, bold: true, color: COLOR_MUTED, margin: [0, 12, 0, 4] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Descripcion', style: 'tableHeader', alignment: 'left' },
              { text: 'Cantidad', style: 'tableHeader', alignment: 'right' },
              { text: 'Unidad', style: 'tableHeader', alignment: 'center' },
              { text: 'P. Unit.', style: 'tableHeader', alignment: 'right' },
              { text: 'Subtotal', style: 'tableHeader', alignment: 'right' },
            ],
            ...factura.detalles.map((d: any) => [
              { text: d.descripcion, fontSize: 8 },
              { text: String(d.cantidad), fontSize: 8, alignment: 'right' },
              { text: d.unidad || 'KG', fontSize: 8, alignment: 'center' },
              { text: formatCurrency(d.precioUnitario), fontSize: 8, alignment: 'right' },
              { text: formatCurrency(d.subtotal), fontSize: 8, alignment: 'right', bold: true },
            ]),
          ],
        },
        layout: {
          hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5,
          vLineWidth: () => 0.5,
          hLineColor: (i: number) => i <= 1 ? '#44403c' : COLOR_BORDER,
          vLineColor: () => COLOR_BORDER,
          fillColor: (rowIndex: number) => {
            if (rowIndex === 0) return '#44403c'
            return rowIndex % 2 === 0 ? COLOR_LIGHT : undefined
          },
          paddingTop: () => 3,
          paddingBottom: () => 3,
        },
      }
    )
  }

  const totalRows: any[] = [
    [
      { text: 'Subtotal:', alignment: 'right', fontSize: 10, color: COLOR_MUTED },
      { text: formatCurrency(nota.subtotal), alignment: 'right', fontSize: 10, bold: true },
    ],
  ]

  if (nota.iva > 0) {
    totalRows.push([
      { text: 'IVA:', alignment: 'right', fontSize: 10, color: COLOR_MUTED },
      { text: formatCurrency(nota.iva), alignment: 'right', fontSize: 10 },
    ])
  }

  totalRows.push([
    { text: 'TOTAL:', alignment: 'right', fontSize: 13, bold: true, color: COLOR_PRIMARY },
    { text: formatCurrency(nota.total), alignment: 'right', fontSize: 13, bold: true, color: COLOR_PRIMARY },
  ])

  const caeSection: any[] = []
  if (nota.cae) {
    caeSection.push({
      margin: [0, 15, 0, 0],
      table: {
        widths: ['*', 'auto'],
        body: [[
          {
            stack: [
              { text: 'CAE (Codigo de Autorizacion Electronico)', fontSize: 8, color: COLOR_MUTED },
              { text: nota.cae, fontSize: 11, bold: true, fontFeatures: ['tnum'] },
            ],
          },
          {
            stack: [
              { text: 'Vencimiento CAE', fontSize: 8, color: COLOR_MUTED },
              { text: nota.caeVencimiento ? formatDate(nota.caeVencimiento) : '-', fontSize: 11, bold: true },
            ],
            alignment: 'right',
          },
        ]],
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 0,
        hLineColor: () => COLOR_BORDER,
        fillColor: () => COLOR_LIGHT,
        paddingTop: () => 8,
        paddingBottom: () => 8,
      },
    })
  }

  const descSection: any[] = []
  if (nota.descripcion) {
    descSection.push({
      margin: [0, 12, 0, 0],
      table: {
        widths: ['*'],
        body: [[
          {
            stack: [
              { text: 'DESCRIPCION', fontSize: 8, bold: true, color: COLOR_ACCENT },
              { text: nota.descripcion, fontSize: 9, color: COLOR_TEXT, margin: [0, 4, 0, 0] },
            ],
            margin: [8, 6, 8, 6],
          },
        ]],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => COLOR_ACCENT,
        vLineColor: () => COLOR_ACCENT,
        fillColor: () => nota.tipo === 'CREDITO' ? '#eff6ff' : '#fef2f2',
      },
    })
  }

  const watermark = nota.estado === 'ANULADA' ? {
    text: 'ANULADA',
    opacity: 0.15,
    fontSize: 100,
    bold: true,
    color: '#dc2626',
    angle: 45,
  } : undefined

  const docDefinition = {
    pageSize: 'A4' as const,
    pageMargins: [35, 20, 35, 40],
    ...(watermark ? { watermark } : {}),

    header: () => ({
      columns: [
        { stack: headerEmpresa, width: '*' },
        { stack: headerComprobante, width: 'auto' },
      ],
      margin: [35, 20, 35, 0],
    }),

    content: [
      {
        canvas: [
          { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: COLOR_ACCENT },
        ],
        margin: [0, 0, 0, 12],
      },
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'CLIENTE', fontSize: 8, bold: true, color: COLOR_MUTED, margin: [0, 0, 0, 4] },
              { text: clienteNombre, fontSize: 11, bold: true },
              { text: `CUIT: ${clienteCuit}`, fontSize: 9, color: COLOR_MUTED, margin: [0, 2, 0, 0] },
              { text: `Cond. IVA: ${condIvaLabel}`, fontSize: 9, color: COLOR_MUTED, margin: [0, 2, 0, 0] },
              { text: `Direccion: ${clienteDireccion}`, fontSize: 9, color: COLOR_MUTED, margin: [0, 2, 0, 0] },
            ],
          },
          {
            width: 'auto',
            stack: [
              { text: 'COMPROBANTE REFERENCIA', fontSize: 8, bold: true, color: COLOR_MUTED, margin: [0, 0, 0, 4] },
              { text: `${tipoFacturaLabel} ${factura?.numero || '-'}`, fontSize: 10, bold: true },
              { text: `Pto. Vta.: ${String(nota.puntoVenta).padStart(4, '0')}`, fontSize: 9, margin: [0, 2, 0, 0] },
              { text: `Fecha Factura: ${formatDate(factura?.fecha)}`, fontSize: 9, color: COLOR_MUTED, margin: [0, 2, 0, 0] },
              ...(nota.operador ? [{ text: `Operador: ${nota.operador.nombre}`, fontSize: 8, color: COLOR_MUTED, margin: [0, 2, 0, 0] }] : []),
            ],
          },
        ],
        margin: [0, 0, 0, 12],
      },
      {
        margin: [0, 0, 0, 8],
        table: {
          widths: ['auto', '*'],
          body: [[
            { text: 'MOTIVO:', fontSize: 9, bold: true, color: COLOR_PRIMARY, margin: [6, 4, 6, 4] },
            { text: motivoLabel, fontSize: 10, bold: true, color: COLOR_TEXT, margin: [6, 4, 6, 4] },
          ]],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 0,
          hLineColor: () => COLOR_ACCENT,
          fillColor: () => nota.tipo === 'CREDITO' ? '#eff6ff' : '#fef2f2',
        },
      },
      ...detallesFactura,
      {
        margin: [0, 12, 0, 0],
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            table: {
              widths: ['auto', 'auto'],
              body: totalRows,
            },
            layout: {
              hLineWidth: (i: number, node: any) => i === node.table.body.length - 1 ? 1.5 : 0,
              vLineWidth: () => 0,
              hLineColor: (i: number, node: any) => i === node.table.body.length - 1 ? COLOR_TEXT : COLOR_BORDER,
              paddingTop: () => 2,
              paddingBottom: () => 2,
            },
          },
        ],
      },
      ...caeSection,
      ...descSection,
    ],

    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        {
          text: `Documento no valido como factura · ${empresaNombre} · Generado: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`,
          fontSize: 7,
          color: COLOR_MUTED,
          alignment: 'center',
        },
        {
          text: `Pag. ${currentPage} de ${pageCount}`,
          fontSize: 7,
          color: COLOR_MUTED,
          alignment: 'right',
          width: 'auto',
        },
      ],
      margin: [35, 10, 35, 0],
    }),

    styles: {
      tableHeader: {
        fontSize: 8,
        bold: true,
        color: 'white',
        fillColor: '#44403c',
      },
    },

    defaultStyle: {
      font: 'Roboto',
    },
  }

  return docDefinition
}
