import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Generar PDF Planilla 01 - Bovino
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const tropaId = searchParams.get('tropaId')

    if (!tropaId) {
      return NextResponse.json(
        { success: false, error: 'ID de tropa requerido' },
        { status: 400 }
      )
    }

    // Obtener datos de la tropa
    const tropa = await db.tropa.findUnique({
      where: { id: tropaId },
      include: {
        productor: true,
        usuarioFaena: true,
        corral: true,
        tiposAnimales: true,
        animales: {
          include: {
            pesajeIndividual: true,
            asignacionGarron: true
          },
          orderBy: { numero: 'asc' }
        },
        pesajeCamion: true
      }
    })

    if (!tropa) {
      return NextResponse.json(
        { success: false, error: 'Tropa no encontrada' },
        { status: 404 }
      )
    }

    // Obtener configuración del frigorífico
    const config = await db.configuracionFrigorifico.findFirst()

    // Crear PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 10
    let y = 15

    // ===== ENCABEZADO =====
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('PLANILLA 01 - BOVINO', pageWidth / 2, y, { align: 'center' })
    y += 6
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('FORMULARIO DE INGRESO DE HACIENDA', pageWidth / 2, y, { align: 'center' })
    y += 8

    // ===== DATOS DEL ESTABLECIMIENTO =====
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('ESTABLECIMIENTO:', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(config?.nombre || 'Solemar Alimentaria S.A.', margin + 35, y)
    doc.setFont('helvetica', 'bold')
    doc.text('Mat.:', margin + 100, y)
    doc.setFont('helvetica', 'normal')
    doc.text(config?.numeroMatricula || '300', margin + 110, y)
    doc.setFont('helvetica', 'bold')
    doc.text('SENASA:', margin + 130, y)
    doc.setFont('helvetica', 'normal')
    doc.text(config?.numeroEstablecimiento || '3986', margin + 148, y)
    y += 6

    // Línea separadora
    doc.setDrawColor(0)
    doc.line(margin, y, pageWidth - margin, y)
    y += 5

    // ===== FILA 1 - DATOS DE PLANILLA =====
    doc.setFontSize(8)
    const rowHeight = 7
    
    // Fecha de Planilla
    doc.setFont('helvetica', 'bold')
    doc.text('Fecha Planilla:', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.rect(margin + 25, y - 3.5, 25, rowHeight)
    const fechaPlanilla = tropa.fechaRecepcion ? new Date(tropa.fechaRecepcion).toLocaleDateString('es-AR') : ''
    doc.text(fechaPlanilla, margin + 27, y)

    // Nº Registro Entrada
    doc.setFont('helvetica', 'bold')
    doc.text('Nº Reg. Entrada:', margin + 55, y)
    doc.setFont('helvetica', 'normal')
    doc.rect(margin + 83, y - 3.5, 20, rowHeight)
    doc.text(tropa.numero.toString(), margin + 85, y)

    // Nº Semana
    doc.setFont('helvetica', 'bold')
    doc.text('Nº Semana:', margin + 108, y)
    doc.setFont('helvetica', 'normal')
    doc.rect(margin + 128, y - 3.5, 15, rowHeight)
    const semana = tropa.fechaRecepcion ? getWeekNumber(new Date(tropa.fechaRecepcion)) : ''
    doc.text(semana.toString(), margin + 130, y)

    // Tropa Nº
    doc.setFont('helvetica', 'bold')
    doc.text('Tropa Nº:', margin + 148, y)
    doc.setFont('helvetica', 'normal')
    doc.rect(margin + 165, y - 3.5, 25, rowHeight)
    doc.text(tropa.numero.toString(), margin + 167, y)

    y += rowHeight + 2

    // ===== FILA 2 - HORA Y TRANSPORTE =====
    // Hora Ingreso
    doc.setFont('helvetica', 'bold')
    doc.text('Hora Ingreso:', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.rect(margin + 23, y - 3.5, 18, rowHeight)
    const horaIngreso = tropa.fechaRecepcion ? new Date(tropa.fechaRecepcion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : ''
    doc.text(horaIngreso, margin + 25, y)

    // Patente Chasis
    doc.setFont('helvetica', 'bold')
    doc.text('Patente Chasis:', margin + 45, y)
    doc.setFont('helvetica', 'normal')
    doc.rect(margin + 72, y - 3.5, 25, rowHeight)
    doc.text(tropa.pesajeCamion?.patenteChasis || '', margin + 74, y)

    // Patente Acoplado
    doc.setFont('helvetica', 'bold')
    doc.text('Patente Acoplado:', margin + 102, y)
    doc.setFont('helvetica', 'normal')
    doc.rect(margin + 132, y - 3.5, 25, rowHeight)
    doc.text(tropa.pesajeCamion?.patenteAcoplado || '', margin + 134, y)

    y += rowHeight + 2

    // ===== FILA 3 - DOCUMENTOS =====
    // Guía Nº
    doc.setFont('helvetica', 'bold')
    doc.text('Guía Nº:', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.rect(margin + 15, y - 3.5, 35, rowHeight)
    doc.text(tropa.guia || '', margin + 17, y)

    // DTA Nº (usamos DTE como DTA)
    doc.setFont('helvetica', 'bold')
    doc.text('DTA Nº:', margin + 55, y)
    doc.setFont('helvetica', 'normal')
    doc.rect(margin + 70, y - 3.5, 35, rowHeight)
    doc.text(tropa.dte || '', margin + 72, y)

    // Precinto Nº
    doc.setFont('helvetica', 'bold')
    doc.text('Precinto Nº:', margin + 110, y)
    doc.setFont('helvetica', 'normal')
    doc.rect(margin + 133, y - 3.5, 35, rowHeight)
    doc.text(tropa.pesajeCamion?.precintos || '', margin + 135, y)

    y += rowHeight + 2

    // ===== FILA 4 - PRODUCTOR =====
    doc.setFont('helvetica', 'bold')
    doc.text('Productor:', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.rect(margin + 20, y - 3.5, 90, rowHeight)
    doc.text(tropa.productor?.nombre || tropa.usuarioFaena?.nombre || '', margin + 22, y)

    // CUIT
    doc.setFont('helvetica', 'bold')
    doc.text('CUIT:', margin + 115, y)
    doc.setFont('helvetica', 'normal')
    doc.rect(margin + 128, y - 3.5, 35, rowHeight)
    doc.text(tropa.productor?.cuit || tropa.usuarioFaena?.cuit || '', margin + 130, y)

    y += rowHeight + 4

    // Línea separadora
    doc.line(margin, y, pageWidth - margin, y)
    y += 3

    // ===== TABLA DE ANIMALES =====
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('DETALLE DE ANIMALES', pageWidth / 2, y, { align: 'center' })
    y += 5

    // Preparar datos de la tabla
    const tableData = tropa.animales.map((animal, index) => {
      const tipoAnimalStr = formatTipoAnimal(animal.tipoAnimal)
      const sexo = getSexoFromTipo(animal.tipoAnimal)
      const pesoEntrada = animal.pesoVivo || animal.pesajeIndividual?.peso || ''
      
      return [
        (index + 1).toString(),
        tipoAnimalStr,
        sexo,
        pesoEntrada ? pesoEntrada.toFixed(0) : '',
        '', // Tipificación (vacío en planilla de ingreso)
        animal.corralId || tropa.corral?.nombre || ''
      ]
    })

    // Agregar filas vacías hasta completar 40 (formato oficial)
    while (tableData.length < 40) {
      tableData.push([
        (tableData.length + 1).toString(),
        '',
        '',
        '',
        '',
        ''
      ])
    }

    autoTable(doc, {
      startY: y,
      head: [[
        'Nº',
        'Tipo',
        'Sexo',
        'Peso Entrada',
        'Tipificación',
        'Corral'
      ]],
      body: tableData.slice(0, 20), // Primeras 20 filas en la primera página
      theme: 'grid',
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 7
      },
      bodyStyles: {
        fontSize: 7
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 25 },
        2: { cellWidth: 15 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 },
        5: { cellWidth: 20 }
      },
      margin: { left: margin, right: margin }
    })

    // Si hay más de 20 animales, agregar otra tabla en nueva página
    if (tableData.length > 20) {
      doc.addPage()
      y = 20

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('DETALLE DE ANIMALES (continuación)', pageWidth / 2, y, { align: 'center' })
      y += 5

      autoTable(doc, {
        startY: y,
        head: [[
          'Nº',
          'Tipo',
          'Sexo',
          'Peso Entrada',
          'Tipificación',
          'Corral'
        ]],
        body: tableData.slice(20, 40),
        theme: 'grid',
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 7
        },
        bodyStyles: {
          fontSize: 7
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 25 },
          2: { cellWidth: 15 },
          3: { cellWidth: 25 },
          4: { cellWidth: 30 },
          5: { cellWidth: 20 }
        },
        margin: { left: margin, right: margin }
      })
    }

    // ===== TOTALES =====
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTALES:', margin, y)
    
    doc.setFont('helvetica', 'normal')
    doc.text(`Cantidad de Cabezas: ${tropa.cantidadCabezas}`, margin + 25, y)
    
    const pesoTotal = tropa.animales.reduce((acc, a) => acc + (a.pesoVivo || a.pesajeIndividual?.peso || 0), 0)
    doc.text(`Peso Total: ${pesoTotal.toFixed(0)} kg`, margin + 80, y)
    
    const pesoPromedio = tropa.animales.length > 0 ? pesoTotal / tropa.animales.length : 0
    doc.text(`Peso Promedio: ${pesoPromedio.toFixed(0)} kg`, margin + 130, y)

    y += 10

    // ===== FIRMA Y SELLO =====
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('OBSERVACIONES:', margin, y)
    doc.rect(margin, y + 2, pageWidth - margin * 2, 15)
    doc.setFont('helvetica', 'normal')
    if (tropa.observaciones) {
      doc.text(tropa.observaciones, margin + 2, y + 7)
    }

    y += 25

    // Espacio para firmas
    doc.setFont('helvetica', 'bold')
    doc.text('FIRMA RESPONSABLE:', margin, y)
    doc.text('SELLO:', pageWidth / 2, y)

    doc.rect(margin, y + 5, 60, 20)
    doc.rect(pageWidth / 2, y + 5, 60, 20)

    // ===== PIE DE PÁGINA =====
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    }

    // Devolver PDF como blob
    const pdfBytes = doc.output('arraybuffer')
    
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="planilla-01-tropa-${tropa.numero}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generando Planilla 01:', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar el PDF' },
      { status: 500 }
    )
  }
}

// Funciones auxiliares
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function formatTipoAnimal(tipo: string): string {
  const tipos: Record<string, string> = {
    'TO': 'Toro',
    'VA': 'Vaca',
    'VQ': 'Vaquillona',
    'MEJ': 'Torito/Mej',
    'NO': 'Novillo',
    'NT': 'Novillito',
    'PADRILLO': 'Padrillo',
    'POTRILLO': 'Potrillo',
    'YEGUA': 'Yegua',
    'CABALLO': 'Caballo',
    'BURRO': 'Burro',
    'MULA': 'Mula'
  }
  return tipos[tipo] || tipo
}

function getSexoFromTipo(tipo: string): string {
  const machos = ['TO', 'MEJ', 'NO', 'NT', 'PADRILLO', 'POTRILLO', 'CABALLO', 'BURRO']
  const hembras = ['VA', 'VQ', 'YEGUA', 'MULA']
  
  if (machos.includes(tipo)) return 'M'
  if (hembras.includes(tipo)) return 'H'
  return ''
}
