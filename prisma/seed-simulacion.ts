// Script de seed para crear datos de simulación
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  console.log('🌱 Iniciando seed de simulación...')

  // 1. Crear clientes
  let productor = await prisma.cliente.findFirst({
    where: { nombre: 'Estancia Los Álamos' }
  })
  
  if (!productor) {
    productor = await prisma.cliente.create({
      data: {
        nombre: 'Estancia Los Álamos',
        cuit: '20-12345678-9',
        direccion: 'Ruta 7, Km 450, San Luis',
        telefono: '02652-456789',
        esProductor: true,
        esUsuarioFaena: false
      }
    })
    console.log('✅ Productor creado')
  }

  let usuarioFaena = await prisma.cliente.findFirst({
    where: { nombre: 'Frigorífico Sur S.A.' }
  })
  
  if (!usuarioFaena) {
    usuarioFaena = await prisma.cliente.create({
      data: {
        nombre: 'Frigorífico Sur S.A.',
        cuit: '30-98765432-1',
        direccion: 'Parque Industrial, Bahía Blanca',
        telefono: '0291-4567890',
        esProductor: false,
        esUsuarioFaena: true
      }
    })
    console.log('✅ Usuario Faena creado')
  }

  // 2. Crear corrales
  const corrales = []
  for (let i = 1; i <= 6; i++) {
    let corral = await prisma.corral.findFirst({
      where: { nombre: `Corral ${i}` }
    })
    if (!corral) {
      corral = await prisma.corral.create({
        data: {
          nombre: `Corral ${i}`,
          capacidad: 50,
          stockBovinos: 0,
          activo: true
        }
      })
    }
    corrales.push(corral)
  }
  console.log(`✅ ${corrales.length} corrales listos`)

  // 3. Crear tipificadores
  const tipificadoresData = [
    { nombre: 'Carlos', apellido: 'Rodríguez', matricula: 'JPG-001' },
    { nombre: 'María', apellido: 'González', matricula: 'JPG-002' },
    { nombre: 'Juan', apellido: 'Pérez', matricula: 'JPG-003' }
  ]
  
  const tipificadores = []
  for (const tipData of tipificadoresData) {
    let tip = await prisma.tipificador.findFirst({
      where: { matricula: tipData.matricula }
    })
    if (!tip) {
      tip = await prisma.tipificador.create({ data: tipData })
    }
    tipificadores.push(tip)
  }
  console.log(`✅ ${tipificadores.length} tipificadores listos`)

  // 4. Crear tropas en diferentes estados
  const estadosTropa = ['RECIBIDO', 'EN_CORRAL', 'EN_PESAJE', 'PESADO', 'LISTO_FAENA', 'EN_FAENA', 'FAENADO']
  const tropasCreadas = []
  
  for (let i = 0; i < estadosTropa.length; i++) {
    const estado = estadosTropa[i] as any
    const numeroTropa = 100 + i
    const codigoTropa = `B 2026 ${numeroTropa.toString().padStart(4, '0')}`
    
    let tropa = await prisma.tropa.findFirst({
      where: { codigo: codigoTropa }
    })
    
    if (!tropa) {
      tropa = await prisma.tropa.create({
        data: {
          numero: numeroTropa,
          codigo: codigoTropa,
          codigoSimplificado: `B${numeroTropa.toString().padStart(4, '0')}`,
          productorId: productor.id,
          usuarioFaenaId: usuarioFaena.id,
          especie: 'BOVINO',
          dte: `DTE-${numeroTropa}-2026`,
          guia: `G-${numeroTropa}-2026`,
          cantidadCabezas: 10, // Menos animales para prueba
          corralId: corrales[i % corrales.length].id,
          estado,
          pesoBruto: estado !== 'RECIBIDO' ? 15000 : null,
          pesoTara: estado !== 'RECIBIDO' ? 5000 : null,
          pesoNeto: estado !== 'RECIBIDO' ? 10000 : null,
          fechaRecepcion: new Date(hoy.getTime() - i * 24 * 60 * 60 * 1000)
        }
      })
    }
    
    tropasCreadas.push(tropa)

    // Crear animales
    const cantidadAnimales = tropa.cantidadCabezas
    const tiposAnimales = ['NO', 'VQ', 'NT', 'VA', 'MEJ']
    
    for (let j = 1; j <= cantidadAnimales; j++) {
      const codigoAnimal = `${codigoTropa.replace(/ /g, '')}-${j.toString().padStart(3, '0')}`
      
      const animalExistente = await prisma.animal.findFirst({
        where: { codigo: codigoAnimal }
      })
      
      if (!animalExistente) {
        await prisma.animal.create({
          data: {
            tropaId: tropa.id,
            numero: j,
            codigo: codigoAnimal,
            caravana: `CAR-${numeroTropa}-${j.toString().padStart(3, '0')}`,
            tipoAnimal: tiposAnimales[Math.floor(Math.random() * tiposAnimales.length)] as any,
            raza: 'Angus',
            pesoVivo: estado !== 'RECIBIDO' ? 450 : null,
            estado: getEstadoAnimal(estado),
            corralId: tropa.corralId
          }
        })
      }
    }
  }
  console.log(`✅ ${tropasCreadas.length} tropas creadas con animales`)

  // 5. Crear romaneos
  const tropaEnFaena = tropasCreadas[5]
  const tropaFaenada = tropasCreadas[6]
  
  const animalesEnFaena = await prisma.animal.findMany({
    where: { tropaId: tropaEnFaena.id }
  })
  
  const animalesFaenados = await prisma.animal.findMany({
    where: { tropaId: tropaFaenada.id }
  })

  let garronBase = 1
  
  // Romaneos pendientes
  for (const animal of animalesEnFaena) {
    const romaneoExistente = await prisma.romaneo.findFirst({
      where: { garron: garronBase, fecha: hoy }
    })
    
    if (!romaneoExistente) {
      await prisma.romaneo.create({
        data: {
          garron: garronBase,
          tropaCodigo: tropaEnFaena.codigoSimplificado,
          numeroAnimal: animal.numero,
          tipoAnimal: animal.tipoAnimal,
          raza: animal.raza,
          caravana: animal.caravana,
          pesoVivo: animal.pesoVivo,
          estado: 'PENDIENTE',
          fecha: hoy
        }
      })
    }
    garronBase++
  }

  // Romaneos completados
  for (const animal of animalesFaenados) {
    const romaneoExistente = await prisma.romaneo.findFirst({
      where: { garron: garronBase, fecha: hoy }
    })
    
    if (!romaneoExistente) {
      const pesoIzq = 100 + Math.random() * 50
      const pesoDer = 100 + Math.random() * 50
      const pesoTotal = pesoIzq + pesoDer
      const rinde = animal.pesoVivo ? (pesoTotal / animal.pesoVivo) * 100 : 0
      
      await prisma.romaneo.create({
        data: {
          garron: garronBase,
          tropaCodigo: tropaFaenada.codigoSimplificado,
          numeroAnimal: animal.numero,
          tipoAnimal: animal.tipoAnimal,
          raza: animal.raza,
          caravana: animal.caravana,
          pesoVivo: animal.pesoVivo,
          denticion: [0, 2, 4, 6, 8][Math.floor(Math.random() * 5)],
          categoria: animal.tipoAnimal as any,
          tipificacion: ['M', 'A', 'S', 'I', 'N'][Math.floor(Math.random() * 5)] as any,
          grasaCobertura: ['ESCASA', 'LIGHT', 'MEDIANA'][Math.floor(Math.random() * 3)] as any,
          conformacion: ['BUENA', 'REGULAR'][Math.floor(Math.random() * 2)] as any,
          tipificadorId: tipificadores[Math.floor(Math.random() * tipificadores.length)].id,
          pesoMediaIzq: pesoIzq,
          pesoMediaDer: pesoDer,
          pesoTotal,
          rinde,
          estado: 'CONFIRMADO',
          fechaConfirmacion: new Date(),
          fecha: hoy
        }
      })
    }
    garronBase++
  }

  console.log(`✅ Romaneos creados`)
  console.log('\n📊 Resumen:')
  console.log(`   - ${tropasCreadas.length} tropas en diferentes estados`)
  console.log(`   - ${animalesEnFaena.length} romaneos pendientes (tropa EN_FAENA)`)
  console.log(`   - ${animalesFaenados.length} romaneos completados (tropa FAENADO)`)
  console.log(`   - ${tipificadores.length} tipificadores`)
  console.log(`   - ${corrales.length} corrales`)
}

function getEstadoAnimal(estadoTropa: string): string {
  switch (estadoTropa) {
    case 'RECIBIDO':
    case 'EN_CORRAL':
      return 'RECIBIDO'
    case 'EN_PESAJE':
    case 'PESADO':
      return 'PESADO'
    case 'LISTO_FAENA':
    case 'EN_FAENA':
      return 'EN_FAENA'
    case 'FAENADO':
      return 'FAENADO'
    default:
      return 'RECIBIDO'
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('\n✅ Seed completado!')
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
