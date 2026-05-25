import PDFDocument from 'pdfkit'
import { PassThrough } from 'stream'

// Tipos para los datos de la planilla
interface DatosPlanilla01 {
  // Encabezado
  fechaPlanilla: Date | string
  numeroRegistro: string
  horaIngreso?: string
  numeroSemana: number
  tropaCodigo: string
  nombreRomaneo: string
  
  // Datos del transporte
  empresaTransportadora: string
  patenteChasis: string
  patenteRemolque?: string
  renspsa?: string
  lugarEmisionGuia?: string
  numeroGuia: string
  dta?: string
  numeroPrecinto?: string
  
  // Datos del productor/consignatario
  consignatarioNombre?: string
  cuitProveedor?: string
  
  // Datos del remitente
  nombreRemitente?: string
  
  // Especie
  especie: 'BOVINO' | 'EQUINO'
  
  // Animales
  animales: Array<{
    numero: number
    notaPorFaena?: string
    tipoAnimal: string
    sexo: 'M' | 'H'
    color?: string
    pesoEntrada?: number
    desba?: number
    tipificacion?: string
    estadoCarne?: string
    corralNumero?: string
    notaAnimal?: string
  }>
  
  // Totales
  totalAnimales: number
  totalPeso: number
  observaciones?: string
  
  // Configuración
  configuracion?: {
    nombre?: string
    logo?: string
  }
}

// Mapeo de tipos de animal a etiquetas
const TIPOS_ANIMAL_LABELS: Record<string, string> = {
  'TO': 'Toro',
  'VA': 'Vaca',
  'VQ': 'Vaquillona',
  'MEJ': 'Torito/Mej',
  'NO': 'Novillo',
  'NT': 'Novillito',
  'PADRILLO': 'Padrillo',
  'POTRILLO': 'Potrillo/Potranca',
  'YEGUA': 'Yegua',
  'CABALLO': 'Caballo',
  'BURRO': 'Burro',
  'MULA': 'Mula',
}

/**
 * Genera un PDF de Planilla 01 en formato A4
 */
export async function generarPlanilla01PDF(datos: DatosPlanilla01): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Crear documento PDF en formato A4
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 30,
          bottom: 30,
          left: 30,
          right: 30
        },
        info: {
          Title: `Planilla 01 - ${datos.tropaCodigo}`,
          Author: datos.configuracion?.nombre || 'Solemar Alimentaria S.A.',
          Subject: 'Registro Ingreso de Hacienda'
        } as any
      })
      
      const chunks: Buffer[] = []
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)
      
      // Título del documento
      const tituloEspecie = datos.especie === 'BOVINO' ? 'BOVINO' : 'EQUINO'
      
      // ===== ENCABEZADO =====
      // Primera fila: Logo y título
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .text(datos.configuracion?.nombre || 'Solemar Alimentaria S.A.', 30, 30, { align: 'center' })
      
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .text(`PLANILLA 01 - ${tituloEspecie}`, 30, 50, { align: 'center' })
      
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Registro Ingreso Hacienda', 30, 68, { align: 'center' })
      
      doc.fontSize(10)
        .font('Helvetica')
        .text(`Nº: ${datos.tropaCodigo}`, 30, 85, { align: 'center' })
      
      // Línea separadora
      doc.moveTo(30, 100)
        .lineTo(doc.page.width - 30, 100)
        .stroke()
      
      let y = 115
      
      // ===== DATOS PRINCIPALES =====
      // Primera sección: Fecha, Semana, Tropa
      const fechaStr = typeof datos.fechaPlanilla === 'string' 
        ? new Date(datos.fechaPlanilla).toLocaleDateString('es-AR')
        : datos.fechaPlanilla.toLocaleDateString('es-AR')
      
      doc.fontSize(9)
        .font('Helvetica-Bold')
        .text('FECHA DE PLANILLA/ENTRADA:', 30, y)
      doc.font('Helvetica')
        .text(fechaStr, 150, y)
      
      doc.font('Helvetica-Bold')
        .text('N° SEMANA:', 250, y)
      doc.font('Helvetica')
        .text(String(datos.numeroSemana), 320, y)
      
      doc.font('Helvetica-Bold')
        .text('TROPA N°:', 380, y)
      doc.font('Helvetica')
        .text(datos.tropaCodigo, 430, y)
      
      y += 15
      
      doc.font('Helvetica-Bold')
        .text('N° REGISTRO ENTRADA:', 30, y)
      doc.font('Helvetica')
        .text(datos.numeroRegistro, 150, y)
      
      if (datos.horaIngreso) {
        doc.font('Helvetica-Bold')
          .text('HORA INGRESO:', 250, y)
        doc.font('Helvetica')
          .text(datos.horaIngreso, 330, y)
      }
      
      y += 15
      
      doc.font('Helvetica-Bold')
        .text('NOMBRE ROMANEO:', 30, y)
      doc.font('Helvetica')
        .text(datos.nombreRomaneo, 130, y)
      
      // ===== DATOS DEL TRANSPORTE =====
      y += 25
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('DATOS DEL TRANSPORTE', 30, y, { underline: true })
      
      y += 15
      doc.fontSize(9)
      
      // Primera fila de transporte
      doc.font('Helvetica-Bold')
        .text('EMPRESA TRANSPORTADORA:', 30, y)
      doc.font('Helvetica')
        .text(datos.empresaTransportadora || '-', 160, y)
      
      doc.font('Helvetica-Bold')
        .text('PATENTE CHASIS:', 320, y)
      doc.font('Helvetica')
        .text(datos.patenteChasis || '-', 410, y)
      
      y += 12
      
      doc.font('Helvetica-Bold')
        .text('PATENTE REMOLQUE:', 30, y)
      doc.font('Helvetica')
        .text(datos.patenteRemolque || '-', 130, y)
      
      doc.font('Helvetica-Bold')
        .text('RENSPA N°:', 250, y)
      doc.font('Helvetica')
        .text(datos.renspsa || '-', 310, y)
      
      y += 12
      
      doc.font('Helvetica-Bold')
        .text('LUGAR EMISIÓN GUÍA:', 30, y)
      doc.font('Helvetica')
        .text(datos.lugarEmisionGuia || '-', 130, y)
      
      doc.font('Helvetica-Bold')
        .text('GUÍA N°:', 250, y)
      doc.font('Helvetica')
        .text(datos.numeroGuia || '-', 300, y)
      
      y += 12
      
      doc.font('Helvetica-Bold')
        .text('DTA N°:', 30, y)
      doc.font('Helvetica')
        .text(datos.dta || '-', 80, y)
      
      doc.font('Helvetica-Bold')
        .text('N° PRECINTO:', 150, y)
      doc.font('Helvetica')
        .text(datos.numeroPrecinto || '-', 230, y)
      
      // ===== DATOS DEL PRODUCTOR/CONSIGNATARIO =====
      y += 25
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('DATOS DEL PRODUCTOR/CONSIGNATARIO', 30, y, { underline: true })
      
      y += 15
      doc.fontSize(9)
      
      doc.font('Helvetica-Bold')
        .text('CONSIGNATARIO/ACOPIADOR:', 30, y)
      doc.font('Helvetica')
        .text(datos.consignatarioNombre || '-', 165, y)
      
      doc.font('Helvetica-Bold')
        .text('CUIT PROVEEDOR/ACOPIADOR:', 300, y)
      doc.font('Helvetica')
        .text(datos.cuitProveedor || '-', 440, y)
      
      y += 12
      
      doc.font('Helvetica-Bold')
        .text('NOMBRE REMITENTE:', 30, y)
      doc.font('Helvetica')
        .text(datos.nombreRemitente || '-', 130, y)
      
      // ===== TABLA DE ANIMALES =====
      y += 25
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('DETALLE DE ANIMALES', 30, y, { underline: true })
      
      y += 15
      
      // Encabezados de la tabla
      const tablaInicioX = 30
      const columnas = [
        { header: 'N° PRO.', width: 40, align: 'center' as const },
        { header: 'NOTA\nFAENA', width: 55, align: 'center' as const },
        { header: 'TIPO\nANIMAL', width: 70, align: 'center' as const },
        { header: 'SEXO', width: 35, align: 'center' as const },
        { header: 'COLOR', width: 55, align: 'center' as const },
        { header: 'PESO\nENTRADA', width: 55, align: 'center' as const },
        { header: 'DESBA\n%', width: 40, align: 'center' as const },
        { header: 'TIPIF.\n', width: 40, align: 'center' as const },
        { header: 'ESTADO\nCARNE', width: 50, align: 'center' as const },
        { header: 'CORRAL\nN°', width: 45, align: 'center' as const },
        { header: 'NOTA\nANIMAL', width: 55, align: 'center' as const },
      ]
      
      // Fila de encabezados
      doc.fontSize(7)
        .font('Helvetica-Bold')
      
      let x = tablaInicioX
      const filaHeight = 20
      const headerY = y
      
      columnas.forEach(col => {
        const lines = col.header.split('\n')
        let textY = headerY + 2
        lines.forEach(line => {
          doc.text(line, x, textY, { width: col.width, align: col.align })
          textY += 8
        })
        x += col.width
      })
      
      // Línea bajo encabezados
      y += filaHeight
      doc.moveTo(tablaInicioX, y)
        .lineTo(tablaInicioX + columnas.reduce((sum, col) => sum + col.width, 0), y)
        .stroke()
      
      // Filas de animales
      doc.fontSize(7)
        .font('Helvetica')
      
      const filaAnimalHeight = 12
      let filaNum = 0
      
      for (const animal of datos.animales) {
        // Verificar si necesitamos nueva página
        if (y + filaAnimalHeight > doc.page.height - 80) {
          doc.addPage()
          y = 50
          
          // Repetir encabezados en nueva página
          doc.fontSize(10)
            .font('Helvetica-Bold')
            .text(`PLANILLA 01 - ${tituloEspecie} (continuación)`, 30, y, { align: 'center' })
          
          y += 20
          doc.fontSize(7)
            .font('Helvetica-Bold')
          
          let hx = tablaInicioX
          columnas.forEach(col => {
            const lines = col.header.split('\n')
            let textY = y + 2
            lines.forEach(line => {
              doc.text(line, hx, textY, { width: col.width, align: col.align })
              textY += 8
            })
            hx += col.width
          })
          
          y += filaHeight
          doc.moveTo(tablaInicioX, y)
            .lineTo(tablaInicioX + columnas.reduce((sum, col) => sum + col.width, 0), y)
            .stroke()
          
          doc.fontSize(7)
            .font('Helvetica')
        }
        
        y += filaAnimalHeight
        filaNum++
        
        // Alternar color de fila
        if (filaNum % 2 === 0) {
          doc.rect(tablaInicioX, y - filaAnimalHeight, columnas.reduce((sum, col) => sum + col.width, 0), filaAnimalHeight)
            .fillAndStroke('#f5f5f5', '#f5f5f5')
          doc.fillColor('black')
        }
        
        x = tablaInicioX
        
        // N° Pro.
        doc.text(String(animal.numero), x, y - filaAnimalHeight + 2, { width: columnas[0].width, align: 'center' })
        x += columnas[0].width
        
        // Nota Faena
        doc.text(animal.notaPorFaena || '', x, y - filaAnimalHeight + 2, { width: columnas[1].width, align: 'center' })
        x += columnas[1].width
        
        // Tipo Animal
        const tipoLabel = TIPOS_ANIMAL_LABELS[animal.tipoAnimal] || animal.tipoAnimal
        doc.text(tipoLabel, x, y - filaAnimalHeight + 2, { width: columnas[2].width, align: 'center' })
        x += columnas[2].width
        
        // Sexo
        doc.text(animal.sexo || '', x, y - filaAnimalHeight + 2, { width: columnas[3].width, align: 'center' })
        x += columnas[3].width
        
        // Color
        doc.text(animal.color || '', x, y - filaAnimalHeight + 2, { width: columnas[4].width, align: 'center' })
        x += columnas[4].width
        
        // Peso Entrada
        doc.text(animal.pesoEntrada ? animal.pesoEntrada.toFixed(0) : '', x, y - filaAnimalHeight + 2, { width: columnas[5].width, align: 'center' })
        x += columnas[5].width
        
        // Desba %
        doc.text(animal.desba ? animal.desba.toFixed(1) : '', x, y - filaAnimalHeight + 2, { width: columnas[6].width, align: 'center' })
        x += columnas[6].width
        
        // Tipificación
        doc.text(animal.tipificacion || '', x, y - filaAnimalHeight + 2, { width: columnas[7].width, align: 'center' })
        x += columnas[7].width
        
        // Estado Carne
        doc.text(animal.estadoCarne || '', x, y - filaAnimalHeight + 2, { width: columnas[8].width, align: 'center' })
        x += columnas[8].width
        
        // Corral N°
        doc.text(animal.corralNumero || '', x, y - filaAnimalHeight + 2, { width: columnas[9].width, align: 'center' })
        x += columnas[9].width
        
        // Nota Animal
        doc.text(animal.notaAnimal || '', x, y - filaAnimalHeight + 2, { width: columnas[10].width, align: 'center' })
      }
      
      // Línea final de tabla
      y += 5
      doc.moveTo(tablaInicioX, y)
        .lineTo(tablaInicioX + columnas.reduce((sum, col) => sum + col.width, 0), y)
        .stroke()
      
      // ===== TOTALES =====
      y += 20
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('TOTALES', 30, y)
      
      y += 15
      doc.fontSize(9)
        .font('Helvetica-Bold')
        .text('Total Animales:', 30, y)
      doc.font('Helvetica')
        .text(String(datos.totalAnimales), 120, y)
      
      doc.font('Helvetica-Bold')
        .text('Total Peso:', 200, y)
      doc.font('Helvetica')
        .text(`${datos.totalPeso.toFixed(0)} kg`, 270, y)
      
      // ===== OBSERVACIONES =====
      if (datos.observaciones) {
        y += 20
        doc.fontSize(10)
          .font('Helvetica-Bold')
          .text('OBSERVACIONES', 30, y)
        
        y += 12
        doc.fontSize(9)
          .font('Helvetica')
          .text(datos.observaciones, 30, y, { width: 530 })
      }
      
      // ===== PIE DE PÁGINA =====
      y = doc.page.height - 60
      doc.fontSize(8)
        .font('Helvetica')
        .text(`Documento generado el ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')}`, 30, y, { align: 'center' })
      
      doc.text(datos.configuracion?.nombre || 'Solemar Alimentaria S.A.', 30, y + 12, { align: 'center' })
      
      // Finalizar documento
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Obtiene el número de semana del año
 */
export function getNumeroSemana(fecha: Date): number {
  const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime())) / 86400000 + 1) / 7)
}

/**
 * Determina el sexo basado en el tipo de animal
 */
export function getSexoAnimal(tipoAnimal: string): 'M' | 'H' {
  const machos = ['TO', 'MEJ', 'NO', 'NT', 'PADRILLO', 'POTRILLO', 'CABALLO', 'BURRO']
  return machos.includes(tipoAnimal) ? 'M' : 'H'
}
