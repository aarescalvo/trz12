import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ExcelJS from 'exceljs'
import { checkPermission } from '@/lib/auth-helpers'

// Mapeo de tipos de animal
const TIPOS_ANIMAL: Record<string, string> = {
  'TO': 'TORO', 'VA': 'VACA', 'VQ': 'VAQUILLONA', 'MEJ': 'MEJORADOR',
  'NO': 'NOVILLO', 'NT': 'NOVILLITO', 'TQ': 'TERNERO', 'TN': 'TERNERA'
}

export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const body = await request.json()
    const { tropaId } = body

    if (!tropaId) {
      return NextResponse.json({ success: false, error: 'ID de tropa requerido' }, { status: 400 })
    }

    // Obtener datos de la tropa
    const tropa = await db.tropa.findUnique({
      where: { id: tropaId },
      include: {
        productor: true,
        usuarioFaena: true,
        corral: true,
        animales: {
          orderBy: { numero: 'asc' }
        },
        pesajeCamion: {
          include: {
            transportista: true
          }
        }
      }
    })

    if (!tropa) {
      return NextResponse.json({ success: false, error: 'Tropa no encontrada' }, { status: 404 })
    }

    // Calcular semana
    const getSemana = (fecha: Date) => {
      const d = new Date(fecha)
      const start = new Date(d.getFullYear(), 0, 1)
      return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7)
    }

    const semana = getSemana(tropa.fechaRecepcion)
    const año = new Date(tropa.fechaRecepcion).getFullYear()
    const fechaStr = new Date(tropa.fechaRecepcion).toLocaleDateString('es-AR')
    const codigoTropa = tropa.codigo?.replace(/\s/g, '_') || tropaId

    // Crear workbook con ExcelJS
    const wb = new ExcelJS.Workbook()
    
    // Datos del encabezado
    const headerData = [
      ['PLANILLA 01 - REGISTRO DE INGRESO DE HACIENDA'],
      [''],
      ['ESTABLECIMIENTO:', 'SOLEMAR ALIMENTARIA S.A.', '', 'N° SENASA:', '3986', '', 'MATRÍCULA:', '300'],
      ['SEMANA N°:', semana, '', 'AÑO:', año, '', 'FECHA:', fechaStr],
      [''],
      ['DATOS DEL PRODUCTOR / USUARIO FAENA'],
      ['Productor:', tropa.productor?.nombre || tropa.usuarioFaena?.nombre || '-', '', 'CUIT:', tropa.productor?.cuit || tropa.usuarioFaena?.cuit || '-', '', 'Tropa N°:', tropa.codigo || '-'],
      [''],
      ['DATOS DEL TRANSPORTE'],
      ['Transportista:', tropa.pesajeCamion?.transportista?.nombre || '-', '', 'Chofer:', tropa.pesajeCamion?.choferNombre || '-', '', 'DNI:', tropa.pesajeCamion?.choferDni || '-'],
      ['Patente Chasis:', tropa.pesajeCamion?.patenteChasis || '-', '', 'Patente Acoplado:', tropa.pesajeCamion?.patenteAcoplado || '-', '', 'Precintos:', tropa.pesajeCamion?.precintos || '-'],
      [''],
      ['DOCUMENTACIÓN'],
      ['DTE:', tropa.dte || '-', '', 'Guía:', tropa.guia || '-', '', 'Corral:', tropa.corral?.nombre || '-'],
      [''],
      ['DETALLE DE ANIMALES'],
      ['N°', 'CARAVANA', 'TIPO', 'RAZA', 'PESO (kg)', 'OBSERVACIONES']
    ]

    // Datos de animales
    const animalesData = (tropa.animales || []).map((a, idx) => [
      idx + 1,
      a.caravana || '-',
      TIPOS_ANIMAL[a.tipoAnimal || ''] || a.tipoAnimal || '-',
      a.raza || '-',
      a.pesoVivo || '-',
      ''
    ])

    // Totales
    const totalKg = (tropa.animales || []).reduce((sum, a) => sum + (a.pesoVivo || 0), 0)
    const totalAnimales = (tropa.animales || []).length

    const footerData = [
      [''],
      ['TOTAL ANIMALES:', totalAnimales, '', 'TOTAL KG:', totalKg],
      [''],
      ['', '', '', '', '', ''],
      ['_________________________', '', '', '_________________________'],
      ['FIRMA RESPONSABLE INGRESO', '', '', 'FIRMA TRANSPORTISTA']
    ]

    // Combinar todos los datos
    const allData = [...headerData, ...animalesData, ...footerData]
    
    // Crear hoja y agregar filas
    const ws = wb.addWorksheet('Planilla 01')
    allData.forEach(row => ws.addRow(row))

    // Configurar anchos de columna
    const colWidths = [18, 25, 12, 18, 12, 15, 12, 15, 12, 15, 12, 15]
    colWidths.forEach((w, i) => {
      ws.getColumn(i + 1).width = w
    })

    // Generar buffer
    const buffer = await wb.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Planilla01_${codigoTropa}.xlsx"`
      }
    })

  } catch (error) {
    console.error('Error generando planilla:', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar la planilla' },
      { status: 500 }
    )
  }
}
