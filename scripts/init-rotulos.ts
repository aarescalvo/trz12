import { PrismaClient, TipoRotulo } from '@prisma/client'

const prisma = new PrismaClient()

const generarId = () => Math.random().toString(36).substr(2, 9)

const crearElementosMediaRes = () => [
  { id: generarId(), tipo: 'texto', valor: 'ROTULO DEFINITIVO ENVASE PRIMARIO', x: 50, y: 2, ancho: 96, tamano: 8, negrita: true, alineacion: 'centro', visible: true },
  { id: generarId(), tipo: 'logo', x: 50, y: 8, ancho: 30, alto: 10, visible: true },
  { id: generarId(), tipo: 'texto', valor: 'ESTABLECIMIENTO FAENADOR', x: 50, y: 20, ancho: 96, tamano: 7, negrita: true, alineacion: 'centro', visible: true },
  { id: generarId(), tipo: 'campo_dinamico', campo: 'establecimiento', x: 50, y: 25, ancho: 96, tamano: 7, alineacion: 'centro', visible: true },
  { id: generarId(), tipo: 'separador', x: 50, y: 46, ancho: 90, visible: true },
  { id: generarId(), tipo: 'texto', valor: 'CARNE VACUNA CON HUESO ENFRIADA', x: 50, y: 62, ancho: 96, tamano: 7, negrita: true, alineacion: 'centro', visible: true },
  { id: generarId(), tipo: 'campo_dinamico', campo: 'nombreProducto', x: 50, y: 77, ancho: 96, tamano: 10, negrita: true, alineacion: 'centro', visible: true },
  { id: generarId(), tipo: 'campo_dinamico', campo: 'peso', etiqueta: 'PESO:', x: 10, y: 96, ancho: 80, tamano: 8, negrita: true, alineacion: 'izquierda', visible: true },
]

async function main() {
  const existentes = await prisma.rotulo.count()
  if (existentes > 0) {
    console.log('Ya existen', existentes, 'rótulos')
    return
  }

  await prisma.rotulo.create({
    data: {
      nombre: 'Media Res - Estándar',
      codigo: 'MEDIA_RES',
      tipo: 'MEDIA_RES' as TipoRotulo,
      categoria: 'ENVASE_PRIMARIO',
      ancho: 80,
      alto: 120,
      orientacion: 'vertical',
      elementos: JSON.stringify(crearElementosMediaRes()),
      fuentePrincipal: 'Arial',
      tamanoFuenteBase: 7,
      colorTexto: '#000000',
      incluyeSenasa: true,
      temperaturaMax: 5,
      diasConsumo: 30,
      activo: true,
      esDefault: true
    }
  })

  console.log('Rótulos inicializados correctamente')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
