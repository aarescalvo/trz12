import { db } from '../src/lib/db'
import * as fs from 'fs'

// Datos de clientes del archivo CUIT DE USUARIOS + DATOS.xlsx
const clientesData = [
  { nombre: 'DOS DE FIERRO SA', cuit: '30715475533', email: 'carnicerias.la.criolla@gmail.com', contacto: 'SERGIO', telefono: '2994022200', esUsuarioFaena: true },
  { nombre: 'FERREYRA MARTIN RUBEN', cuit: '23335321359', email: 'martin_ferreyra_797@hotmail.com', contacto: 'FERREYRA MARTIN RUBEN', telefono: '2984507605', esUsuarioFaena: true },
  { nombre: 'MUCA SAS', cuit: '30716490323', email: 'tesoreria@muca.com.ar', contacto: 'JOSE', telefono: '2996376511', esUsuarioFaena: true },
  { nombre: 'FERREYRA RUBEN ALBERTO', cuit: '20136718216', email: null, contacto: 'FERREYRA RUBEN ALBERTO', telefono: '2984500770', esUsuarioFaena: true },
  { nombre: 'PENROZ CINDY MARIA FERNANDA', cuit: '23345458654', email: 'carneskupal@gmail.com', contacto: 'PENROZ CINDY MARIA FERNANDA', telefono: '2996255126', esUsuarioFaena: false },
  { nombre: 'MORAGA MAXIMILIANO IVAN', cuit: '20396498627', email: 'Valentinmoraga04@gmail.com', contacto: 'MORAGA MAXIMILIANO IVAN', telefono: '2984218759', esUsuarioFaena: true },
  { nombre: 'FRIGORIFICO DE LA PATAGONIA SRL', cuit: '30718653467', email: 'ganadospatagonicos@gmail.com', contacto: 'NADIA SUYAI / PEDRO SUAREZ', telefono: '2995567306', esUsuarioFaena: true },
  { nombre: 'GANADERA NORTE NEUQUINO SAS', cuit: '30716426757', email: 'adminsr@srfrigorifico.com.ar', contacto: 'SANDRA', telefono: '2994018943', esUsuarioFaena: true },
  { nombre: 'BOSQUE AMADO S.R.L', cuit: '30707770690', email: 'Bosqueamadosrl@gmail.com', contacto: 'IGNACIO', telefono: '2996728854', esUsuarioFaena: true },
  { nombre: 'DISTRIBUIDORA DE LA PATAGONIA SRL', cuit: '30709507849', email: 'Distribuidoradelapatagoniasrl@hotmail.com', contacto: 'GERARDO AGUILERA', telefono: '2942664244', esUsuarioFaena: true },
  { nombre: 'JORGE ALBERTO LASAGNO', cuit: '20250067861', email: null, contacto: 'JORGE ALBERTO LASAGNO', telefono: null, esUsuarioFaena: true },
  { nombre: 'MAIZALES DE LA PATAGONIA S.R.L', cuit: '30716325276', email: 'Ariel_trapial@hotmail.com', contacto: 'ARIEL ORTEGA', telefono: '2984570584', esUsuarioFaena: true },
  { nombre: 'TRIAUD SA', cuit: '30715935100', email: 'Triaudsa@gmail.com', contacto: 'FEDERICO DE CELIS', telefono: '2302602382', esUsuarioFaena: false },
  { nombre: 'VIENTOS DEL VALLE SRL', cuit: '30712143483', email: 'gabriel_pagani@hotmail.com', contacto: 'GABRIEL PAGANI', telefono: '2995331473', esUsuarioFaena: false },
  { nombre: 'ROSA JOSE ANIBAL', cuit: '20246268062', email: null, contacto: 'JOSE', telefono: '2920661658', esUsuarioFaena: false },
  { nombre: 'EVASIO MARMETTO SA', cuit: '30537620893', email: 'Facundo@marmetto.com.ar', contacto: 'CAITO', telefono: '2262582647', esUsuarioFaena: false },
  { nombre: 'NECORUTA', cuit: '30710798946', email: null, contacto: null, telefono: null, esUsuarioFaena: false },
  // Clientes adicionales que aparecen en Excel pero no en CUIT
  { nombre: 'FERREYRA ALBERTO', cuit: '20136718216', email: null, contacto: 'FERREYRA RUBEN ALBERTO', telefono: '2984500770', esUsuarioFaena: true },
  { nombre: 'BOSQUES AMADOS SRL', cuit: '30707770690', email: 'Bosqueamadosrl@gmail.com', contacto: 'IGNACIO', telefono: '2996728854', esUsuarioFaena: true },
]

interface TropaHistorica {
  numero: number
  usuario: string
  usuarioCuit: string
  cantidadAnimales: number
  kgPie: number | null
  fechaFaena: string | null
  kgGancho: number | null
  rinde: number | null
  precioServicio: number | null
  precioRecupero: number | null
  totalServicio: number | null
  tasaInspVet: number | null
  arancelIpcva: number | null
  totalFactura: number | null
  numeroFactura: string | null
}

async function main() {
  console.log('============================================')
  console.log('  CARGA COMPLETA DE DATOS HISTÓRICOS 2026')
  console.log('============================================\n')

  // 1. Crear/actualizar clientes
  console.log('1. Creando/actualizando clientes...')
  const clienteMap: Record<string, string> = {}
  
  for (const clienteData of clientesData) {
    const cliente = await db.cliente.upsert({
      where: { cuit: clienteData.cuit },
      update: {
        email: clienteData.email,
        telefono: clienteData.telefono,
        esUsuarioFaena: clienteData.esUsuarioFaena,
      },
      create: {
        nombre: clienteData.nombre,
        cuit: clienteData.cuit,
        email: clienteData.email,
        telefono: clienteData.telefono,
        esUsuarioFaena: clienteData.esUsuarioFaena,
        esProductor: !clienteData.esUsuarioFaena,
      }
    })
    clienteMap[clienteData.nombre] = cliente.id
    clienteMap[clienteData.cuit] = cliente.id
  }
  console.log(`   ✅ ${clientesData.length} clientes procesados\n`)

  // 2. Leer tropas del JSON
  console.log('2. Cargando tropas históricas...')
  const tropasJson = fs.readFileSync('prisma/tropas-historicas.json', 'utf-8')
  const tropasData: TropaHistorica[] = JSON.parse(tropasJson)
  
  let tropasCreadas = 0
  let animalesCreados = 0
  let romaneosCreados = 0
  let errores = 0

  for (const tropaData of tropasData) {
    try {
      // Buscar cliente por CUIT o nombre
      let usuarioFaenaId = clienteMap[tropaData.usuarioCuit] || clienteMap[tropaData.usuario]
      
      if (!usuarioFaenaId) {
        // Buscar por nombre parcial
        const cliente = await db.cliente.findFirst({
          where: {
            OR: [
              { nombre: { contains: tropaData.usuario.toUpperCase() } },
              { cuit: tropaData.usuarioCuit }
            ]
          }
        })
        if (cliente) {
          usuarioFaenaId = cliente.id
        } else {
          console.log(`   ⚠️ Cliente no encontrado: ${tropaData.usuario}`)
          errores++
          continue
        }
      }

      // Crear tropa
      const tropa = await db.tropa.create({
        data: {
          numero: tropaData.numero,
          codigo: `B 2026 ${tropaData.numero.toString().padStart(4, '0')}`,
          codigoSimplificado: `B${tropaData.numero.toString().padStart(4, '0')}`,
          usuarioFaenaId: usuarioFaenaId,
          especie: 'BOVINO',
          cantidadCabezas: tropaData.cantidadAnimales,
          kgPie: tropaData.kgPie,
          kgGancho: tropaData.kgGancho,
          rindePorcentaje: tropaData.rinde ? tropaData.rinde / 100 : null,
          fechaFaena: tropaData.fechaFaena ? new Date(tropaData.fechaFaena) : null,
          precioServicioPorKg: tropaData.precioServicio,
          precioServicioConRecupero: tropaData.precioRecupero,
          totalServicio: tropaData.totalServicio,
          estadoPago: 'PAGADO', // Asumimos pagado por ser histórico
          dte: `DTE-${tropaData.numero}-2026`,
          guia: `GUIA-${tropaData.numero}-2026`,
          estado: 'FAENADO',
          fechaRecepcion: tropaData.fechaFaena ? new Date(tropaData.fechaFaena) : new Date(),
        }
      })
      tropasCreadas++

      // Crear animales y romaneos
      const pesoPromedio = tropaData.kgPie && tropaData.cantidadAnimales > 0 
        ? tropaData.kgPie / tropaData.cantidadAnimales 
        : 0
      const pesoMediaPromedio = tropaData.kgGancho && tropaData.cantidadAnimales > 0 
        ? tropaData.kgGancho / tropaData.cantidadAnimales 
        : 0

      for (let i = 1; i <= tropaData.cantidadAnimales; i++) {
        // Crear animal
        const animal = await db.animal.create({
          data: {
            tropaId: tropa.id,
            numero: i,
            codigo: `${tropa.codigo}-${i.toString().padStart(3, '0')}`,
            tipoAnimal: 'NO', // Default - no viene individual
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
            rinde: tropaData.rinde ? tropaData.rinde / 100 : null,
            estado: 'CONFIRMADO',
            fecha: tropaData.fechaFaena ? new Date(tropaData.fechaFaena) : new Date(),
          }
        })
        romaneosCreados++
      }

      if (tropasCreadas % 20 === 0) {
        console.log(`   Procesadas ${tropasCreadas} tropas...`)
      }
    } catch (error) {
      console.log(`   ❌ Error en tropa ${tropaData.numero}: ${error}`)
      errores++
    }
  }

  console.log('\n============================================')
  console.log('  RESUMEN FINAL')
  console.log('============================================')
  console.log(`  ✅ Tropas creadas: ${tropasCreadas}`)
  console.log(`  ✅ Animales creados: ${animalesCreados}`)
  console.log(`  ✅ Romaneos creados: ${romaneosCreados}`)
  console.log(`  ❌ Errores: ${errores}`)
  console.log('============================================\n')

  // Verificación
  const totalTropas = await db.tropa.count()
  const totalAnimales = await db.animal.count()
  const totalRomaneos = await db.romaneo.count()
  const totalClientes = await db.cliente.count()
  
  console.log('📊 VERIFICACIÓN EN BASE DE DATOS:')
  console.log(`   Clientes: ${totalClientes}`)
  console.log(`   Tropas: ${totalTropas}`)
  console.log(`   Animales: ${totalAnimales}`)
  console.log(`   Romaneos: ${totalRomaneos}`)
}

main()
  .catch((e) => {
    console.error('Error fatal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
