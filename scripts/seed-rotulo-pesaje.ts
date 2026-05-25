import { PrismaClient, TipoRotulo } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  console.log('Creando rotulo pesaje individual (Zebra 90x60mm 200 DPI)...')
  const zpl = '^XA^CI28^PW709^LL472^BY2,2.0,80^FO80,78^A0N,28,28^FDTROPA^FS^FO420,78^A0N,52,52^FD{{TROPA}}^FS^FO80,115^GB550,2,2^FS^FO80,128^A0N,22,22^FDN. ANIMAL^FS^FO80,172^A0N,78,78^FD{{NUMERO}}^FS^FO300,115^GB2,148,2^FS^FO325,128^A0N,22,22^FDPESO VIVO^FS^FO325,220^A0N,62,62^FD{{PESO_KG}}^FS^FO80,288^GB550,2,2^FS^FO80,300^BCN,80,Y,N,N^FD{{CODIGO_BARRAS}}^FS^FO80,390^A0N,14,14^FDCODE128 - {{CODIGO_BARRAS}}^FS^FO548,128^A0N,22,22^FDTIPO: {{TIPO}}^FS^FO548,172^A0N,16,16^FD{{FECHA}}^FS^XZ'
  const variables = JSON.stringify([
    { variable: 'TROPA', campo: 'tropa.codigo', descripcion: 'Codigo de tropa' },
    { variable: 'NUMERO', campo: 'animal.numero', descripcion: 'Numero de animal' },
    { variable: 'PESO_KG', campo: 'animal.pesoVivo', descripcion: 'Peso vivo en kg' },
    { variable: 'CODIGO_BARRAS', campo: 'animal.codigo', descripcion: 'Codigo de barras' },
    { variable: 'TIPO', campo: 'animal.tipoAnimal', descripcion: 'Tipo de animal' },
    { variable: 'FECHA', campo: 'fecha', descripcion: 'Fecha de medicion' }
  ])
  const rotulo = await prisma.rotulo.upsert({
    where: { codigo: 'PESAJE_INDIVIDUAL_DEFAULT' },
    update: {
      nombre: 'Rotulo Pesaje Individual - Zebra 90x60',
      tipo: TipoRotulo.PESAJE_INDIVIDUAL,
      tipoImpresora: 'ZEBRA',
      ancho: 90,
      alto: 60,
      dpi: 200,
      contenido: zpl,
      variables: variables,
      activo: true,
      esDefault: true,
      categoria: 'PESAJE_INDIVIDUAL'
    },
    create: {
      codigo: 'PESAJE_INDIVIDUAL_DEFAULT',
      nombre: 'Rotulo Pesaje Individual - Zebra 90x60',
      tipo: TipoRotulo.PESAJE_INDIVIDUAL,
      tipoImpresora: 'ZEBRA',
      ancho: 90,
      alto: 60,
      dpi: 200,
      contenido: zpl,
      variables: variables,
      activo: true,
      esDefault: true,
      categoria: 'PESAJE_INDIVIDUAL'
    }
  })
  console.log('OK:', rotulo.id, '-', rotulo.nombre)
  console.log('Impresora:', rotulo.tipoImpresora, '| Tam:', rotulo.ancho + 'x' + rotulo.alto + 'mm | DPI:', rotulo.dpi)
}
main().catch((e) => { console.error('Error:', e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
