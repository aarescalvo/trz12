// Script para crear datos de prueba para testear el flujo de faena
// Ejecutar con: bun run prisma/seed-test.ts

import { PrismaClient, Especie, RolOperador, TipoAnimal, EstadoTropa, EstadoAnimal } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Creando datos de prueba para testear el sistema...')

  // 1. Asegurar operador admin
  const passwordHash = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.operador.upsert({
    where: { usuario: 'admin' },
    update: {},
    create: {
      nombre: 'Administrador',
      usuario: 'admin',
      password: passwordHash,
      pin: '1234',
      rol: RolOperador.ADMINISTRADOR,
      email: 'admin@solemar.com.ar',
      activo: true,
      puedePesajeCamiones: true,
      puedePesajeIndividual: true,
      puedeMovimientoHacienda: true,
      puedeListaFaena: true,
      puedeRomaneo: true,
      puedeIngresoCajon: true,
      puedeMenudencias: true,
      puedeStock: true,
      puedeReportes: true,
      puedeConfiguracion: true
    }
  })

  // 2. Crear/Asegurar usuario de faena
  const usuarioFaena = await prisma.cliente.upsert({
    where: { id: 'uf-test-001' },
    update: {},
    create: {
      id: 'uf-test-001',
      nombre: 'Juan Carlos Matarife',
      dni: '12345678',
      cuit: '20123456789',
      matricula: 'MAT-001',
      direccion: 'Parque Industrial, Córdoba',
      localidad: 'Córdoba',
      provincia: 'Córdoba',
      telefono: '0351-7778888',
      email: 'juan.matarife@email.com',
      condicionIva: 'RI',
      esProductor: false,
      esUsuarioFaena: true
    }
  })

  // 3. Crear/Asegurar corral
  const corral = await prisma.corral.upsert({
    where: { nombre: 'D1' },
    update: {},
    create: {
      nombre: 'D1',
      capacidad: 20,
      observaciones: 'Corral de descanso',
      stockBovinos: 0,
      stockEquinos: 0
    }
  })

  // 4. Crear/Asegurar cámara de faena
  const camara = await prisma.camara.upsert({
    where: { nombre: 'Cámara 1' },
    update: {},
    create: {
      nombre: 'Cámara 1',
      tipo: 'FAENA',
      capacidad: 90,
      observaciones: 'Cámara principal de faena'
    }
  })

  // 5. Crear/Asegurar tipificador
  const tipificador = await prisma.tipificador.upsert({
    where: { matricula: 'TIP-001' },
    update: {},
    create: {
      nombre: 'Carlos',
      apellido: 'López',
      matricula: 'TIP-001',
      activo: true
    }
  })

  // 6. Crear tropa con animales pesados y listos para faena
  const year = new Date().getFullYear()
  const tropaCodigo = `B ${year} 0099`
  
  const tropa = await prisma.tropa.upsert({
    where: { codigo: tropaCodigo },
    update: {},
    create: {
      codigo: tropaCodigo,
      numero: 99,
      usuarioFaenaId: usuarioFaena.id,
      especie: Especie.BOVINO,
      dte: 'DTE-TEST-001',
      guia: 'GUIA-TEST-001',
      cantidadCabezas: 10,
      corralId: corral.id,
      estado: EstadoTropa.LISTO_FAENA,
      pesoBruto: 8000,
      pesoTara: 5500,
      pesoNeto: 2500,
      pesoTotalIndividual: 4750,
      operadorId: admin.id
    }
  })

  // Crear tipos de animales
  await prisma.tropaAnimalCantidad.upsert({
    where: { tropaId_tipoAnimal: { tropaId: tropa.id, tipoAnimal: 'NO' } },
    update: { cantidad: 5 },
    create: { tropaId: tropa.id, tipoAnimal: 'NO', cantidad: 5 }
  })
  await prisma.tropaAnimalCantidad.upsert({
    where: { tropaId_tipoAnimal: { tropaId: tropa.id, tipoAnimal: 'VA' } },
    update: { cantidad: 5 },
    create: { tropaId: tropa.id, tipoAnimal: 'VA', cantidad: 5 }
  })

  // 7. Crear animales individuales con pesaje
  const animalesData: { tipo: TipoAnimal; peso: number; raza: string }[] = [
    { tipo: 'NO', peso: 485, raza: 'Angus' },
    { tipo: 'NO', peso: 510, raza: 'Hereford' },
    { tipo: 'NO', peso: 495, raza: 'Angus' },
    { tipo: 'NO', peso: 520, raza: 'Brangus' },
    { tipo: 'NO', peso: 478, raza: 'Angus' },
    { tipo: 'VA', peso: 420, raza: 'Angus' },
    { tipo: 'VA', peso: 435, raza: 'Hereford' },
    { tipo: 'VA', peso: 410, raza: 'Angus' },
    { tipo: 'VA', peso: 445, raza: 'Brangus' },
    { tipo: 'VA', peso: 428, raza: 'Angus' },
  ]

  console.log('🐄 Creando animales con pesaje individual...')
  
  for (let i = 0; i < animalesData.length; i++) {
    const a = animalesData[i]
    const codigo = `${tropaCodigo.replace(/ /g, '')}-${String(i + 1).padStart(3, '0')}`
    
    const animal = await prisma.animal.upsert({
      where: { codigo },
      update: {
        pesoVivo: a.peso,
        estado: EstadoAnimal.PESADO,
        corralId: corral.id
      },
      create: {
        tropaId: tropa.id,
        numero: i + 1,
        codigo,
        tipoAnimal: a.tipo,
        raza: a.raza,
        pesoVivo: a.peso,
        estado: EstadoAnimal.PESADO,
        corralId: corral.id
      }
    })

    // Crear/actualizar pesaje individual
    await prisma.pesajeIndividual.upsert({
      where: { animalId: animal.id },
      update: { peso: a.peso },
      create: {
        animalId: animal.id,
        peso: a.peso,
        operadorId: admin.id
      }
    })
  }

  // 8. Crear lista de faena para hoy
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  // Eliminar lista existente de hoy si hay
  const existingList = await prisma.listaFaena.findFirst({
    where: {
      fecha: {
        gte: hoy,
        lt: new Date(hoy.getTime() + 24 * 60 * 60 * 1000)
      }
    }
  })

  if (existingList) {
    await prisma.listaFaenaTropa.deleteMany({
      where: { listaFaenaId: existingList.id }
    })
    await prisma.listaFaena.delete({
      where: { id: existingList.id }
    })
  }

  const listaFaena = await prisma.listaFaena.create({
    data: {
      fecha: new Date(),
      estado: 'ABIERTA',
      cantidadTotal: 10
    }
  })

  // Agregar tropa a la lista
  await prisma.listaFaenaTropa.create({
    data: {
      listaFaenaId: listaFaena.id,
      tropaId: tropa.id,
      cantidad: 10
    }
  })

  // Actualizar stock del corral
  await prisma.corral.update({
    where: { id: corral.id },
    data: { stockBovinos: 10 }
  })

  console.log('\n✅ Datos de prueba creados exitosamente!')
  console.log('\n📋 Resumen:')
  console.log(`   - Tropa: ${tropaCodigo} (10 animales)`)
  console.log(`   - Estado: LISTO_FAENA`)
  console.log(`   - Lista de Faena: Creada para hoy`)
  console.log(`   - Corral: ${corral.nombre}`)
  console.log(`   - Cámara: ${camara.nombre}`)
  console.log(`   - Tipificador: ${tipificador.nombre} ${tipificador.apellido}`)
  console.log('\n🔐 Credenciales:')
  console.log('   Usuario: admin / Password: admin123')
  console.log('   PIN: 1234')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
