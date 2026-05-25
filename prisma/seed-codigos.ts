import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

// Productos basados en CODIGO.xlsx - Tabla de composición de código
const PRODUCTOS_BOVINO = [
  { codigo: '000', nombre: 'Total', nombreReportes: 'Total' },
  { codigo: '001', nombre: 'Lomo', nombreReportes: 'Lomo' },
  { codigo: '002', nombre: 'Bife Angosto', nombreReportes: 'Bife Angosto' },
  { codigo: '003', nombre: 'Cuadril', nombreReportes: 'Cuadril' },
  { codigo: '004', nombre: 'Nalga de Adentro', nombreReportes: 'Nalga de Adentro' },
  { codigo: '005', nombre: 'Bola de Lomo', nombreReportes: 'Bola de Lomo' },
  { codigo: '006', nombre: 'Nalga de Afuera', nombreReportes: 'Nalga de Afuera' },
  { codigo: '007', nombre: 'Cuadrada', nombreReportes: 'Cuadrada' },
  { codigo: '008', nombre: 'Peceto', nombreReportes: 'Peceto' },
  { codigo: '009', nombre: 'Colita de Cuadril', nombreReportes: 'Colita de Cuadril' },
  { codigo: '010', nombre: 'Tortuguita', nombreReportes: 'Tortuguita' },
  { codigo: '011', nombre: 'Brazuelo', nombreReportes: 'Brazuelo' },
  { codigo: '012', nombre: 'Garrón', nombreReportes: 'Garrón' },
  { codigo: '013', nombre: 'Entraña', nombreReportes: 'Entraña' },
  { codigo: '014', nombre: 'Delantero Jaslo', nombreReportes: 'Delantero Jaslo' },
  { codigo: '015', nombre: 'Paleta', nombreReportes: 'Paleta' },
  { codigo: '016', nombre: 'Centro de Paleta', nombreReportes: 'Centro de Paleta' },
  { codigo: '017', nombre: 'Corazón de Paleta', nombreReportes: 'Corazón de Paleta' },
  { codigo: '018', nombre: 'Bife Ancho', nombreReportes: 'Bife Ancho' },
  { codigo: '019', nombre: 'Cogote/Aguja', nombreReportes: 'Cogote/Aguja' },
  { codigo: '020', nombre: 'Cogote/Aguja y Bife Ancho', nombreReportes: 'Cogote/Aguja y Bife Ancho' },
  { codigo: '021', nombre: 'Pecho Entero', nombreReportes: 'Pecho Entero' },
  { codigo: '022', nombre: 'Pecho Largo', nombreReportes: 'Pecho Largo' },
  { codigo: '023', nombre: 'Pecho Ancho', nombreReportes: 'Pecho Ancho' },
  { codigo: '024', nombre: 'Pecho 2T/LA', nombreReportes: 'Pecho 2T/LA' },
  { codigo: '025', nombre: 'AFD', nombreReportes: 'AFD' },
  { codigo: '026', nombre: 'Lengua', nombreReportes: 'Lengua' },
  { codigo: '027', nombre: 'Corazón', nombreReportes: 'Corazón' },
  { codigo: '028', nombre: 'Molleja', nombreReportes: 'Molleja' },
  { codigo: '029', nombre: 'Riñón', nombreReportes: 'Riñón' },
  { codigo: '030', nombre: 'Hígado', nombreReportes: 'Hígado' },
  { codigo: '031', nombre: 'Cabeza', nombreReportes: 'Cabeza' },
  { codigo: '032', nombre: 'Librillos', nombreReportes: 'Librillos' },
  { codigo: '033', nombre: 'Ossa', nombreReportes: 'Ossa' },
  { codigo: '034', nombre: 'Ossa 4T', nombreReportes: 'Ossa 4T' },
  { codigo: '035', nombre: 'Parrilla', nombreReportes: 'Parrilla' },
  { codigo: '036', nombre: 'Ojo de Bife', nombreReportes: 'Ojo de Bife' },
  { codigo: '037', nombre: 'Cortes Especiales', nombreReportes: 'Cortes Especiales' },
]

// Códigos de tipificación
const TIPIFICACIONES_BOVINO = [
  { codigo: '00', nombre: 'Todas' },
  { codigo: '01', nombre: 'M' },
  { codigo: '02', nombre: 'A' },
  { codigo: '03', nombre: 'S' },
  { codigo: '04', nombre: 'I' },
  { codigo: '05', nombre: 'N' },
  { codigo: '06', nombre: 'AG' },
  { codigo: '07', nombre: 'AS' },
  { codigo: '08', nombre: 'L' },
  { codigo: '09', nombre: 'D' },
  { codigo: '10', nombre: 'O' },
  { codigo: '11', nombre: 'MM' },
  { codigo: '12', nombre: 'MP' },
  { codigo: '13', nombre: 'MD' },
  { codigo: '14', nombre: 'NN' },
  { codigo: '15', nombre: 'SIN' },
  { codigo: '16', nombre: 'IN' },
]

// Códigos de tipo de trabajo
const TIPOS_TRABAJO = [
  { codigo: '0', nombre: 'Ninguna' },
  { codigo: '1', nombre: 'Descarte' },
  { codigo: '2', nombre: 'T/Lama' },
  { codigo: '3', nombre: 'T/MR' },
  { codigo: '4', nombre: 'T/Jaslo' },
  { codigo: '5', nombre: 'T/Square' },
  { codigo: '6', nombre: 'T/Checo' },
]

// Códigos de transporte
const TRANSPORTES = [
  { codigo: '0', nombre: 'No definido' },
  { codigo: '1', nombre: 'BARCO enfriado' },
  { codigo: '2', nombre: 'BARCO congelado' },
  { codigo: '3', nombre: 'BARCO salado' },
  { codigo: '4', nombre: 'AVION enfriado' },
  { codigo: '5', nombre: 'AVION congelado' },
  { codigo: '6', nombre: 'CAMION enfriado' },
  { codigo: '7', nombre: 'CAMION congelado' },
  { codigo: '8', nombre: 'INTERNO' },
]

// Códigos de destino
const DESTINOS = [
  { codigo: '00', nombre: 'Cualquiera' },
  { codigo: '01', nombre: 'Italia' },
  { codigo: '02', nombre: 'Francia' },
  { codigo: '03', nombre: 'España' },
  { codigo: '04', nombre: 'Bélgica' },
  { codigo: '05', nombre: 'Rusia' },
  { codigo: '06', nombre: 'Suiza' },
  { codigo: '07', nombre: 'Austria' },
  { codigo: '08', nombre: 'Japón' },
  { codigo: '09', nombre: 'Kazajistán' },
  { codigo: '10', nombre: 'Japón IMI' },
]

async function main() {
  console.log('Iniciando seed de códigos...')

  // Crear productos bovinos
  for (const prod of PRODUCTOS_BOVINO) {
    await db.producto.upsert({
      where: { codigo_especie: { codigo: prod.codigo, especie: 'BOVINO' } },
      update: { nombre: prod.nombre, nombreReportes: prod.nombreReportes },
      create: {
        codigo: prod.codigo,
        nombre: prod.nombre,
        nombreReportes: prod.nombreReportes,
        especie: 'BOVINO',
        activo: true
      }
    })
  }
  console.log(`${PRODUCTOS_BOVINO.length} productos bovinos creados`)

  // Crear tipificaciones
  for (const tip of TIPIFICACIONES_BOVINO) {
    await db.codigoTipificacion.upsert({
      where: { codigo: tip.codigo },
      update: { nombre: tip.nombre },
      create: {
        codigo: tip.codigo,
        nombre: tip.nombre,
        especie: 'BOVINO',
        activo: true
      }
    })
  }
  console.log(`${TIPIFICACIONES_BOVINO.length} tipificaciones creadas`)

  // Crear tipos de trabajo
  for (const tipo of TIPOS_TRABAJO) {
    await db.codigoTipoTrabajo.upsert({
      where: { codigo: tipo.codigo },
      update: { nombre: tipo.nombre },
      create: {
        codigo: tipo.codigo,
        nombre: tipo.nombre,
        activo: true
      }
    })
  }
  console.log(`${TIPOS_TRABAJO.length} tipos de trabajo creados`)

  // Crear transportes
  for (const trans of TRANSPORTES) {
    await db.codigoTransporte.upsert({
      where: { codigo: trans.codigo },
      update: { nombre: trans.nombre },
      create: {
        codigo: trans.codigo,
        nombre: trans.nombre,
        activo: true
      }
    })
  }
  console.log(`${TRANSPORTES.length} transportes creados`)

  // Crear destinos
  for (const dest of DESTINOS) {
    await db.codigoDestino.upsert({
      where: { codigo: dest.codigo },
      update: { nombre: dest.nombre },
      create: {
        codigo: dest.codigo,
        nombre: dest.nombre,
        activo: true
      }
    })
  }
  console.log(`${DESTINOS.length} destinos creados`)

  console.log('Seed completado exitosamente!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
