import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  // Desmarcar default de otras plantillas PESAJE_INDIVIDUAL
  await db.rotulo.updateMany({
    where: { tipo: 'PESAJE_INDIVIDUAL', esDefault: true },
    data: { esDefault: false }
  })

  // Crear plantilla de pesaje individual 90x60mm 200 DPI
  const plantilla = await db.rotulo.create({
    data: {
      nombre: 'Pesaje Individual 90x60mm (200 DPI)',
      codigo: 'PESAJE_IND_90x60_200DPI',
      tipo: 'PESAJE_INDIVIDUAL',
      categoria: 'PESAJE',
      tipoImpresora: 'ZEBRA',
      ancho: 90,
      alto: 60,
      dpi: 200,
      activo: true,
      esDefault: true,
      diasConsumo: 30,
      temperaturaMax: 5.0,
      variables: JSON.stringify([
        { variable: 'TROPA', campo: 'tropa', descripcion: 'Código de tropa' },
        { variable: 'NUMERO', campo: 'numero', descripcion: 'Número de animal (3 dígitos)' },
        { variable: 'PESO_KG', campo: 'peso_kg', descripcion: 'Peso vivo en kg' },
        { variable: 'CODIGO_BARRAS', campo: 'codigo_barras', descripcion: 'Código de barras (Tropa-Número)' },
        { variable: 'TIPO', campo: 'tipo', descripcion: 'Tipo de animal (V/N/P)' },
        { variable: 'FECHA', campo: 'fecha', descripcion: 'Fecha de medición' }
      ]),
      contenido: `^XA^CI28^PW709^LL472^BY2,2.0,80^FO80,78^A0N,28,28^FDTROPA^FS^FO420,78^A0N,52,52^FD{{TROPA}}^FS^FO80,115^GB550,2,2^FS^FO80,128^A0N,22,22^FDN. ANIMAL^FS^FO80,172^A0N,78,78^FD{{NUMERO}}^FS^FO300,115^GB2,148,2^FS^FO325,128^A0N,22,22^FDPESO VIVO^FS^FO325,220^A0N,62,62^FD{{PESO_KG}}^FS^FO80,288^GB550,2,2^FS^FO80,300^BCN,80,Y,N,N^FD{{CODIGO_BARRAS}}^FS^FO80,390^A0N,14,14^FDCODE128 - {{CODIGO_BARRAS}}^FS^FO548,128^A0N,22,22^FDTIPO: {{TIPO}}^FS^FO548,172^A0N,16,16^FD{{FECHA}}^FS^XZ`
    }
  })

  console.log('✅ Plantilla creada:', plantilla.id, plantilla.nombre)
  console.log('📋 Código:', plantilla.codigo)
  console.log('📐 Dimensiones:', plantilla.ancho, 'x', plantilla.alto, 'mm @', plantilla.dpi, 'DPI')
  console.log('🔄 Es default para PESAJE_INDIVIDUAL:', plantilla.esDefault)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
