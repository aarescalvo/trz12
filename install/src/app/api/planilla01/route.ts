import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'

// Mapeo de tipos de animal
const TIPOS_ANIMAL: Record<string, string> = {
  'TO': 'TORO', 'VA': 'VACA', 'VQ': 'VAQUILLONA', 'MEJ': 'MEJORADOR',
  'NO': 'NOVILLO', 'NT': 'NOVILLITO', 'TQ': 'TERNERO', 'TN': 'TERNERA'
}

export async function POST(request: NextRequest) {
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

    // Crear workbook
    const wb = XLSX.utils.book_new()
    
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
    
    // Crear hoja
    const ws = XLSX.utils.aoa_to_sheet(allData)

    // Configurar anchos de columna
    ws['!cols'] = [
      { wch: 18 }, { wch: 25 }, { wch: 12 }, { wch: 18 }, 
      { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 },
      { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 }
    ]

    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Planilla 01')

    // Generar buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

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
