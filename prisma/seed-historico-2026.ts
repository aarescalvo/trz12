import { db } from '../src/lib/db'
import * as fs from 'fs'

// Datos del Excel SERVICIO FAENA BOVINO 2026.xlsx
interface TropaHistorica {
  numeroTropa: number
  usuario: string
  cantidadAnimales: number
  kgPie: number
  fechaFaena: Date
  kgGancho: number
  rinde: number
  precioServicio: number
  precioServicioRecupero: number | null
  totalServicio: number
  tasaInspVet: number
  arancelIpcva: number
  totalFactura: number
  numeroFactura: string | null
  fechaFactura: Date | null
  fechaPago: Date | null
  montoDepositado: number | null
  estadoPago: string | null
  observaciones: string | null
}

// Mapeo de nombres de usuario a IDs de cliente
const usuarioToCliente: Record<string, { nombre: string; cuit: string; email: string }> = {
  'MORAGA': { nombre: 'MORAGA MAXIMILIANO IVAN', cuit: '20396498627', email: 'Valentinmoraga04@gmail.com' },
  'GANADERA NORTE NEUQUINO': { nombre: 'GANADERA NORTE NEUQUINO SAS', cuit: '30716426757', email: 'adminsr@srfrigorifico.com.ar' },
  'DOS DE FIERRO SA': { nombre: 'DOS DE FIERRO SA', cuit: '30715475533', email: 'carnicerias.la.criolla@gmail.com' },
  'DISTRIBUIDORA DE LA PATAGONIA': { nombre: 'DISTRIBUIDORA DE LA PATAGONIA SRL', cuit: '30709507849', email: 'Distribuidoradelapatagoniasrl@hotmil.com' },
  'MUCA SAS': { nombre: 'MUCA SAS', cuit: '30716490323', email: 'tesoreria@muca.com.ar' },
  'FERREYRA MARTIN': { nombre: 'FERREYRA MARTIN RUBEN', cuit: '23335321359', email: 'martin_ferreyra_797@hotmail.com' },
  'FRIGORIFICO DE LA PATAGONIA SRL': { nombre: 'FRIGORIFICO DE LA PATAGONIA SRL', cuit: '30718653467', email: 'ganadospatagonicos@gmail.com' },
  'LASAGNO JORGE ALBERTO': { nombre: 'JORGE ALBERTO LASAGNO', cuit: '20250067861', email: '' },
  'FERREYRA ALBERTO': { nombre: 'FERREYRA RUBEN ALBERTO', cuit: '20136718216', email: '' },
  'BOSQUES AMADOS SRL': { nombre: 'BOSQUE AMADO S.R.L', cuit: '30707770690', email: 'Bosqueamadosrl@gmail.com' },
  'MAIZALES DE LA PATAGONIA SRL': { nombre: 'MAIZALES DE LA PATAGONIA S.R.L', cuit: '30716325276', email: 'Ariel_trapial@hotmail.com' },
}

async function main() {
  console.log('=== INICIANDO CARGA DE DATOS HISTÓRICOS 2026 ===\n')

  // 1. Actualizar clientes con emails
  console.log('1. Actualizando clientes con emails y teléfonos...')
  for (const [, datos] of Object.entries(usuarioToCliente)) {
    await db.cliente.upsert({
      where: { cuit: datos.cuit },
      update: {
        email: datos.email || null,
        esUsuarioFaena: true,
      },
      create: {
        nombre: datos.nombre,
        cuit: datos.cuit,
        email: datos.email || null,
        esUsuarioFaena: true,
        esProductor: false,
      }
    })
  }
  console.log('   ✅ Clientes actualizados\n')

  // 2. Obtener todos los clientes para referencia
  const clientes = await db.cliente.findMany()
  const clienteByNombre: Record<string, string> = {}
  for (const c of clientes) {
    clienteByNombre[c.nombre] = c.id
    // También mapear por nombre corto
    if (c.nombre.includes('MORAGA')) clienteByNombre['MORAGA'] = c.id
    if (c.nombre.includes('GANADERA NORTE')) clienteByNombre['GANADERA NORTE NEUQUINO'] = c.id
    if (c.nombre.includes('DOS DE FIERRO')) clienteByNombre['DOS DE FIERRO SA'] = c.id
    if (c.nombre.includes('DISTRIBUIDORA DE LA PATAGONIA')) clienteByNombre['DISTRIBUIDORA DE LA PATAGONIA'] = c.id
    if (c.nombre.includes('MUCA')) clienteByNombre['MUCA SAS'] = c.id
    if (c.nombre.includes('FERREYRA MARTIN')) clienteByNombre['FERREYRA MARTIN'] = c.id
    if (c.nombre.includes('FRIGORIFICO DE LA PATAGONIA')) clienteByNombre['FRIGORIFICO DE LA PATAGONIA SRL'] = c.id
    if (c.nombre.includes('LASAGNO')) clienteByNombre['LASAGNO JORGE ALBERTO'] = c.id
    if (c.nombre.includes('FERREYRA RUBEN')) clienteByNombre['FERREYRA ALBERTO'] = c.id
    if (c.nombre.includes('BOSQUE')) clienteByNombre['BOSQUES AMADOS SRL'] = c.id
    if (c.nombre.includes('MAIZALES')) clienteByNombre['MAIZALES DE LA PATAGONIA SRL'] = c.id
  }

  // 3. Datos de tropas del Excel (hardcodeados desde el análisis)
  // Nota: En producción estos datos vendrían de leer el Excel con una librería
  const tropasData: TropaHistorica[] = [
    // ENERO 2026
    { numeroTropa: 1, usuario: 'MORAGA', cantidadAnimales: 15, kgPie: 5052, fechaFaena: new Date('2026-01-02'), kgGancho: 2940.3, rinde: 58.2, precioServicio: 335, precioServicioRecupero: null, totalServicio: 985000.5, tasaInspVet: 5891.70, arancelIpcva: 5625, totalFactura: 1203367.305, numeroFactura: '00004-00000388', fechaFactura: new Date('2026-01-05'), fechaPago: null, montoDepositado: null, estadoPago: null, observaciones: null },
    { numeroTropa: 2, usuario: 'GANADERA NORTE NEUQUINO', cantidadAnimales: 43, kgPie: 16831, fechaFaena: new Date('2026-01-02'), kgGancho: 9891.8, rinde: 58.77, precioServicio: 335, precioServicioRecupero: null, totalServicio: 3313753.0, tasaInspVet: 16889.54, arancelIpcva: 16125, totalFactura: 4042655.670, numeroFactura: '00004-00000387', fechaFactura: new Date('2026-01-05'), fechaPago: null, montoDepositado: null, estadoPago: null, observaciones: null },
    { numeroTropa: 3, usuario: 'GANADERA NORTE NEUQUINO', cantidadAnimales: 40, kgPie: 14972, fechaFaena: new Date('2026-01-05'), kgGancho: 8567.8, rinde: 57.23, precioServicio: 335, precioServicioRecupero: null, totalServicio: 2870213.0, tasaInspVet: 15711.20, arancelIpcva: 15000, totalFactura: 3503668.930, numeroFactura: '00004-00000393', fechaFactura: new Date('2026-01-07'), fechaPago: null, montoDepositado: null, estadoPago: null, observaciones: null },
    { numeroTropa: 4, usuario: 'DOS DE FIERRO SA', cantidadAnimales: 25, kgPie: 8989, fechaFaena: new Date('2026-01-05'), kgGancho: 5030.4, rinde: 55.96, precioServicio: 335, precioServicioRecupero: null, totalServicio: 1685184.0, tasaInspVet: 9819.50, arancelIpcva: 9375, totalFactura: 2058267.140, numeroFactura: '00004-00000390', fechaFactura: new Date('2026-01-06'), fechaPago: null, montoDepositado: null, estadoPago: null, observaciones: null },
    { numeroTropa: 5, usuario: 'DISTRIBUIDORA DE LA PATAGONIA', cantidadAnimales: 30, kgPie: 11530, fechaFaena: new Date('2026-01-05'), kgGancho: 6743.3, rinde: 58.48, precioServicio: 335, precioServicioRecupero: null, totalServicio: 2259005.5, tasaInspVet: 11783.40, arancelIpcva: 11250, totalFactura: 2756430.055, numeroFactura: '00004-00000389', fechaFactura: new Date('2026-01-06'), fechaPago: null, montoDepositado: null, estadoPago: null, observaciones: null },
    { numeroTropa: 6, usuario: 'DISTRIBUIDORA DE LA PATAGONIA', cantidadAnimales: 15, kgPie: 5216, fechaFaena: new Date('2026-01-06'), kgGancho: 3075.2, rinde: 58.96, precioServicio: 335, precioServicioRecupero: null, totalServicio: 1030192.0, tasaInspVet: 5891.70, arancelIpcva: 5625, totalFactura: 1258049.020, numeroFactura: '00004-00000391', fechaFactura: new Date('2026-01-06'), fechaPago: null, montoDepositado: null, estadoPago: null, observaciones: null },
    { numeroTropa: 7, usuario: 'MUCA SAS', cantidadAnimales: 35, kgPie: 17870, fechaFaena: new Date('2026-01-06'), kgGancho: 10641.5, rinde: 59.55, precioServicio: 335, precioServicioRecupero: null, totalServicio: 3564902.5, tasaInspVet: 13747.30, arancelIpcva: 18725, totalFactura: 4346004.325, numeroFactura: '00004-00000395', fechaFactura: new Date('2026-01-08'), fechaPago: null, montoDepositado: null, estadoPago: null, observaciones: null },
    { numeroTropa: 8, usuario: 'MUCA SAS', cantidadAnimales: 5, kgPie: 2714, fechaFaena: new Date('2026-01-06'), kgGancho: 1585.2, rinde: 58.41, precioServicio: 335, precioServicioRecupero: null, totalServicio: 531042.0, tasaInspVet: 1963.90, arancelIpcva: 2675, totalFactura: 647199.720, numeroFactura: '00004-00000395', fechaFactura: new Date('2026-01-08'), fechaPago: null, montoDepositado: null, estadoPago: null, observaciones: null },
    { numeroTropa: 9, usuario: 'MUCA SAS', cantidadAnimales: 10, kgPie: 4777, fechaFaena: new Date('2026-01-06'), kgGancho: 2712.6, rinde: 56.78, precioServicio: 335, precioServicioRecupero: null, totalServicio: 908721.0, tasaInspVet: 3927.80, arancelIpcva: 5350, totalFactura: 1108830.210, numeroFactura: '00004-00000395', fechaFactura: new Date('2026-01-08'), fechaPago: null, montoDepositado: null, estadoPago: null, observaciones: null },
    { numeroTropa: 10, usuario: 'MORAGA', cantidadAnimales: 15, kgPie: 6235, fechaFaena: new Date('2026-01-07'), kgGancho: 3623.5, rinde: 58.13, precioServicio: 335, precioServicioRecupero: null, totalServicio: 1213872.5, tasaInspVet: 5891.70, arancelIpcva: 5625, totalFactura: 1480757.455, numeroFactura: '00004-00000398', fechaFactura: new Date('2026-01-09'), fechaPago: null, montoDepositado: null, estadoPago: null, observaciones: null },
  ]

  // 4. Crear tropas
  console.log('2. Creando tropas históricas...')
  let tropasCreadas = 0
  let animalesCreados = 0
  let romaneosCreados = 0

  for (const tropaData of tropasData) {
    const usuarioFaenaId = clienteByNombre[tropaData.usuario]
    if (!usuarioFaenaId) {
      console.log(`   ⚠️ Cliente no encontrado: ${tropaData.usuario}`)
      continue
    }

    // Crear tropa
    const tropa = await db.tropa.create({
      data: {
        numero: tropaData.numeroTropa,
        codigo: `B 2026 ${tropaData.numeroTropa.toString().padStart(4, '0')}`,
        codigoSimplificado: `B${tropaData.numeroTropa.toString().padStart(4, '0')}`,
        usuarioFaenaId: usuarioFaenaId,
        especie: 'BOVINO',
        dte: `DTE-${tropaData.numeroTropa}-2026`, // Placeholder - no viene en Excel
        guia: `GUIA-${tropaData.numeroTropa}-2026`, // Placeholder - no viene en Excel
        cantidadCabezas: tropaData.cantidadAnimales,
        pesoTotalIndividual: tropaData.kgPie,
        estado: 'FAENADO',
        fechaRecepcion: tropaData.fechaFaena,
        observaciones: tropaData.observaciones,
      }
    })
    tropasCreadas++

    // Crear animales para esta tropa
    for (let i = 1; i <= tropaData.cantidadAnimales; i++) {
      const pesoPromedio = tropaData.kgPie / tropaData.cantidadAnimales
      const pesoMediaPromedio = tropaData.kgGancho / tropaData.cantidadAnimales
      
      // Crear animal
      const animal = await db.animal.create({
        data: {
          tropaId: tropa.id,
          numero: i,
          codigo: `${tropa.codigo}-${i.toString().padStart(3, '0')}`,
          tipoAnimal: 'NO', // Default - no viene en Excel
          pesoVivo: pesoPromedio,
          estado: 'FAENADO',
        }
      })
      animalesCreados++

      // Crear pesaje individual
      await db.pesajeIndividual.create({
        data: {
          animalId: animal.id,
          peso: pesoPromedio,
        }
      })

      // Crear romaneo
      await db.romaneo.create({
        data: {
          tropaId: tropa.id,
          tropaCodigo: tropa.codigo,
          garron: i,
          numeroAnimal: i,
          tipoAnimal: 'NO',
          pesoVivo: pesoPromedio,
          pesoMediaIzq: pesoMediaPromedio / 2,
          pesoMediaDer: pesoMediaPromedio / 2,
          pesoTotal: pesoMediaPromedio,
          rinde: tropaData.rinde,
          estado: 'CONFIRMADO',
          fecha: tropaData.fechaFaena,
        }
      })
      romaneosCreados++
    }

    console.log(`   ✅ Tropa ${tropaData.numeroTropa}: ${tropaData.cantidadAnimales} animales, ${tropaData.kgGancho} kg`)
  }

  console.log(`\n=== RESUMEN ===`)
  console.log(`Tropas creadas: ${tropasCreadas}`)
  console.log(`Animales creados: ${animalesCreados}`)
  console.log(`Romaneos creados: ${romaneosCreados}`)

  // Verificar datos
  const totalTropas = await db.tropa.count()
  const totalAnimales = await db.animal.count()
  const totalRomaneos = await db.romaneo.count()
  
  console.log(`\n=== VERIFICACIÓN ===`)
  console.log(`Total tropas en DB: ${totalTropas}`)
  console.log(`Total animales en DB: ${totalAnimales}`)
  console.log(`Total romaneos en DB: ${totalRomaneos}`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
