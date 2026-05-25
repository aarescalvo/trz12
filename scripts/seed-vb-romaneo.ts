// Script simplificado para crear datos de prueba para VB Romaneo
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Creando datos de prueba para VB Romaneo...\n')

  // Obtener admin
  const admin = await prisma.operador.findFirst({ where: { usuario: 'admin' } })
  if (!admin) {
    console.log('❌ No hay operador admin. Ejecuta primero el seed principal.')
    return
  }

  // Obtener clientes
  const productor = await prisma.cliente.findFirst({ where: { esProductor: true } })
  const usuarioFaena = await prisma.cliente.findFirst({ where: { esUsuarioFaena: true } })
  
  if (!productor || !usuarioFaena) {
    console.log('❌ Faltan clientes. Ejecuta primero el seed principal.')
    return
  }

  // Obtener corral y cámara
  const corral = await prisma.corral.findFirst()
  const camara = await prisma.camara.findFirst()
  
  if (!corral || !camara) {
    console.log('❌ Faltan corral o cámara. Ejecuta primero el seed principal.')
    return
  }

  // Obtener tipificador
  let tipificador = await prisma.tipificador.findFirst()
  if (!tipificador) {
    tipificador = await prisma.tipificador.create({
      data: { nombre: 'Juan Tipificador' }
    })
  }

  // ============================================
  // ESCENARIO 1: Lista de Faena con garrones SIN ASIGNAR
  // Para probar Pestaña 1 de VB Romaneo
  // ============================================
  
  // Crear tropa
  const tropa1 = await prisma.tropa.upsert({
    where: { codigo: 'VB-TEST-001' },
    update: {},
    create: {
      numero: 9001,
      codigo: 'VB-TEST-001',
      especie: 'BOVINO',
      cantidadCabezas: 5,
      estado: 'EN_FAENA',
      productorId: productor.id,
      usuarioFaenaId: usuarioFaena.id,
      corralId: corral.id,
      operadorId: admin.id,
      dte: 'DTE-VB-001',
      guia: 'GUIA-VB-001',
      fechaRecepcion: new Date()
    }
  })

  // Crear animales
  for (let i = 1; i <= 5; i++) {
    await prisma.animal.upsert({
      where: { codigo: `VB001-${String(i).padStart(3, '0')}` },
      update: {},
      create: {
        numero: i,
        codigo: `VB001-${String(i).padStart(3, '0')}`,
        tropaId: tropa1.id,
        tipoAnimal: i <= 3 ? 'NO' : 'VA',
        pesoVivo: 450 + Math.floor(Math.random() * 50),
        estado: 'PESADO'
      }
    })
  }

  // Crear lista de faena
  const listaFaena1 = await prisma.listaFaena.upsert({
    where: { numero: 9001 },
    update: {},
    create: {
      numero: 9001,
      fecha: new Date(),
      estado: 'EN_PROCESO',
      cantidadTotal: 5
    }
  })

  // Vincular tropa a lista
  await prisma.listaFaenaTropa.upsert({
    where: { 
      listaFaenaId_tropaId_corralId: {
        listaFaenaId: listaFaena1.id,
        tropaId: tropa1.id,
        corralId: corral.id
      }
    },
    update: {},
    create: {
      listaFaenaId: listaFaena1.id,
      tropaId: tropa1.id,
      corralId: corral.id,
      cantidad: 5
    }
  })

  // Crear garrones - SOLO ASIGNAMOS 3 de 5 (2 quedan sin asignar)
  for (let i = 1; i <= 5; i++) {
    const asignacion = await prisma.asignacionGarron.upsert({
      where: { listaFaenaId_garron: { listaFaenaId: listaFaena1.id, garron: i } },
      update: {},
      create: {
        listaFaenaId: listaFaena1.id,
        garron: i,
        tropaCodigo: tropa1.codigo,
        horaIngreso: new Date()
      }
    })

    // Solo asignamos animal a los primeros 3 garrones
    if (i <= 3) {
      const animal = await prisma.animal.findFirst({
        where: { tropaId: tropa1.id, numero: i }
      })
      if (animal) {
        await prisma.asignacionGarron.update({
          where: { id: asignacion.id },
          data: {
            animalId: animal.id,
            animalNumero: animal.numero,
            tipoAnimal: animal.tipoAnimal,
            pesoVivo: animal.pesoVivo
          }
        })
      }
    }
  }
  console.log('✅ Lista 9001 creada - 3 garrones asignados, 2 SIN ASIGNAR')

  // ============================================
  // ESCENARIO 2: Romaneo con RINDE ALTO (>70%)
  // Para probar Pestaña 2 de VB Romaneo
  // ============================================
  
  const tropa2 = await prisma.tropa.upsert({
    where: { codigo: 'VB-TEST-002' },
    update: {},
    create: {
      numero: 9002,
      codigo: 'VB-TEST-002',
      especie: 'BOVINO',
      cantidadCabezas: 5,
      estado: 'FAENADO',
      productorId: productor.id,
      usuarioFaenaId: usuarioFaena.id,
      corralId: corral.id,
      operadorId: admin.id,
      dte: 'DTE-VB-002',
      guia: 'GUIA-VB-002',
      fechaRecepcion: new Date()
    }
  })

  // Crear animales
  for (let i = 1; i <= 5; i++) {
    await prisma.animal.upsert({
      where: { codigo: `VB002-${String(i).padStart(3, '0')}` },
      update: {},
      create: {
        numero: i,
        codigo: `VB002-${String(i).padStart(3, '0')}`,
        tropaId: tropa2.id,
        tipoAnimal: 'NO',
        pesoVivo: 450,
        estado: 'FAENADO'
      }
    })
  }

  // Crear lista de faena
  const listaFaena2 = await prisma.listaFaena.upsert({
    where: { numero: 9002 },
    update: {},
    create: {
      numero: 9002,
      fecha: new Date(),
      estado: 'CERRADA',
      cantidadTotal: 5
    }
  })

  await prisma.listaFaenaTropa.upsert({
    where: { 
      listaFaenaId_tropaId_corralId: {
        listaFaenaId: listaFaena2.id,
        tropaId: tropa2.id,
        corralId: corral.id
      }
    },
    update: {},
    create: {
      listaFaenaId: listaFaena2.id,
      tropaId: tropa2.id,
      corralId: corral.id,
      cantidad: 5
    }
  })

  // Crear garrones y romaneos con diferentes rindes
  for (let i = 1; i <= 5; i++) {
    const animal = await prisma.animal.findFirst({
      where: { tropaId: tropa2.id, numero: i }
    })

    const asignacion = await prisma.asignacionGarron.upsert({
      where: { listaFaenaId_garron: { listaFaenaId: listaFaena2.id, garron: i } },
      update: {},
      create: {
        listaFaenaId: listaFaena2.id,
        garron: i,
        tropaCodigo: tropa2.codigo,
        tieneMediaDer: true,
        tieneMediaIzq: true,
        completado: true,
        horaIngreso: new Date()
      }
    })

    if (animal) {
      await prisma.asignacionGarron.update({
        where: { id: asignacion.id },
        data: {
          animalId: animal.id,
          animalNumero: animal.numero,
          tipoAnimal: animal.tipoAnimal,
          pesoVivo: animal.pesoVivo
        }
      })
    }

    // Calcular pesos según escenario
    let pesoVivoRomaneo: number
    let pesoDer: number
    let pesoIzq: number

    if (i === 2 || i === 4) {
      // RINDE ALTO - Error de asignación
      pesoVivoRomaneo = 250 // Peso vivo muy bajo (error)
      pesoDer = 130
      pesoIzq = 128
    } else {
      // Rinde normal (50-60%)
      pesoVivoRomaneo = 450
      pesoDer = 130
      pesoIzq = 128
    }

    const pesoTotal = pesoDer + pesoIzq
    const rinde = (pesoTotal / pesoVivoRomaneo) * 100

    // Crear romaneo
    const romaneo = await prisma.romaneo.create({
      data: {
        listaFaenaId: listaFaena2.id,
        fecha: new Date(),
        garron: i,
        tropaCodigo: tropa2.codigo,
        numeroAnimal: i,
        tipoAnimal: 'NO',
        pesoVivo: pesoVivoRomaneo,
        denticion: '4',
        tipificadorId: tipificador.id,
        pesoMediaDer: pesoDer,
        pesoMediaIzq: pesoIzq,
        pesoTotal: pesoTotal,
        rinde: rinde,
        estado: 'PENDIENTE',
        operadorId: admin.id
      }
    })

    // Crear medias reses
    await prisma.mediaRes.createMany({
      data: [
        {
          romaneoId: romaneo.id,
          lado: 'DERECHA',
          peso: pesoDer,
          sigla: 'A',
          codigo: `MED-VB-${Date.now()}-${i}-DER`,
          estado: 'EN_CAMARA',
          camaraId: camara.id
        },
        {
          romaneoId: romaneo.id,
          lado: 'IZQUIERDA',
          peso: pesoIzq,
          sigla: 'A',
          codigo: `MED-VB-${Date.now()}-${i}-IZQ`,
          estado: 'EN_CAMARA',
          camaraId: camara.id
        }
      ]
    })
  }
  console.log('✅ Lista 9002 creada - Garrones 2 y 4 con RINDE ALTO (>70%)')

  // ============================================
  // ESCENARIO 3: Medias reses en cámaras para movimiento
  // ============================================
  
  await prisma.stockMediaRes.upsert({
    where: { 
      camaraId_tropaCodigo_especie: {
        camaraId: camara.id,
        tropaCodigo: 'VB-TEST-002',
        especie: 'BOVINO'
      }
    },
    update: {},
    create: {
      camaraId: camara.id,
      tropaCodigo: 'VB-TEST-002',
      especie: 'BOVINO',
      cantidad: 10,
      pesoTotal: 1300,
      fechaIngreso: new Date()
    }
  })
  console.log('✅ Stock en cámara creado - 10 medias reses')

  console.log('\n' + '='.repeat(60))
  console.log('📋 RESUMEN DE DATOS DE PRUEBA PARA VB ROMANEO')
  console.log('='.repeat(60))
  console.log('\n📍 Pestaña 1 - Asignación Pendiente:')
  console.log('   • Lista 9001: 5 garrones, 2 SIN ASIGNAR (garrones 4 y 5)')
  console.log('   • Acceder desde: VB Romaneo → Pestaña "Asignación"')
  console.log('\n📍 Pestaña 2 - Revisión y Corrección:')
  console.log('   • Lista 9002: 5 romaneos con rinde alto en garrones 2 y 4')
  console.log('   • Acceder desde: VB Romaneo → Pestaña "Revisión"')
  console.log('\n📍 Pestaña 3 - Visto Bueno:')
  console.log('   • Listas 9001 y 9002 pendientes de VB')
  console.log('   • Acceder desde: VB Romaneo → Pestaña "VB"')
  console.log('\n📍 Movimiento de Cámaras:')
  console.log('   • 10 medias reses en cámara para mover')
  console.log('   • Acceder desde: CICLO I → Movimiento de Cámaras')
  console.log('\n✅ Datos de prueba creados exitosamente!')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
