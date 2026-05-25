// Script para crear datos de prueba
// Ejecutar con: bun run db:seed

import { PrismaClient, Especie, RolOperador, TipoAnimal } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de datos de prueba...')

  // 1. Crear operadores
  console.log('📝 Creando operadores...')
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
      puedeCCIR: true,
      puedeFacturacion: true,
      puedeConfiguracion: true
    }
  })

  const operador1 = await prisma.operador.upsert({
    where: { usuario: 'balanza' },
    update: {},
    create: {
      nombre: 'Juan Pérez',
      usuario: 'balanza',
      password: await bcrypt.hash('balanza123', 10),
      pin: '1111',
      rol: RolOperador.OPERADOR,
      activo: true,
      puedePesajeCamiones: true,
      puedePesajeIndividual: true,
      puedeMovimientoHacienda: true,
      puedeListaFaena: false,
      puedeRomaneo: false,
      puedeIngresoCajon: false,
      puedeMenudencias: false,
      puedeStock: false,
      puedeReportes: false,
      puedeCCIR: false,
      puedeFacturacion: false,
      puedeConfiguracion: false
    }
  })

  const supervisor = await prisma.operador.upsert({
    where: { usuario: 'supervisor' },
    update: {},
    create: {
      nombre: 'María García',
      usuario: 'supervisor',
      password: await bcrypt.hash('super123', 10),
      pin: '2222',
      rol: RolOperador.SUPERVISOR,
      email: 'maria@solemar.com.ar',
      activo: true,
      puedePesajeCamiones: true,
      puedePesajeIndividual: true,
      puedeMovimientoHacienda: true,
      puedeListaFaena: true,
      puedeIngresoCajon: true,
      puedeRomaneo: true,
      puedeMenudencias: true,
      puedeStock: true,
      puedeReportes: true,
      puedeCCIR: true,
      puedeFacturacion: false,
      puedeConfiguracion: false
    }
  })

  console.log(`   ✓ Operadores creados: ${admin.nombre}, ${operador1.nombre}, ${supervisor.nombre}`)

  // 2. Crear transportistas
  console.log('🚛 Creando transportistas...')
  const trans1 = await prisma.transportista.upsert({
    where: { id: 'trans-001' },
    update: {},
    create: {
      id: 'trans-001',
      nombre: 'Transporte Rodríguez SRL',
      cuit: '20-12345678-1',
      direccion: 'Ruta 9 KM 45, Córdoba',
      telefono: '0351-4567890'
    }
  })
  
  const trans2 = await prisma.transportista.upsert({
    where: { id: 'trans-002' },
    update: {},
    create: {
      id: 'trans-002',
      nombre: 'Logística del Centro',
      cuit: '20-87654321-9',
      direccion: 'Av. Colón 1234, Santa Fe',
      telefono: '0342-1234567'
    }
  })
  
  const trans3 = await prisma.transportista.upsert({
    where: { id: 'trans-003' },
    update: {},
    create: {
      id: 'trans-003',
      nombre: 'Transportes Sur',
      cuit: '20-11223344-5',
      direccion: 'Ruta 8 KM 200, Buenos Aires',
      telefono: '011-45556666'
    }
  })
  console.log(`   ✓ 3 transportistas creados`)

  // 3. Crear clientes (productores y usuarios de faena)
  console.log('👥 Creando clientes...')
  
  // Productores
  const prod1 = await prisma.cliente.upsert({
    where: { id: 'prod-001' },
    update: {},
    create: {
      id: 'prod-001',
      nombre: 'Estancia La Esperanza',
      cuit: '30-11111111-1',
      direccion: 'Campo La Esperanza, Ruta 9 KM 150',
      telefono: '0351-1112222',
      email: 'esperanza@campo.com.ar',
      esProductor: true,
      esUsuarioFaena: false
    }
  })
  
  const prod2 = await prisma.cliente.upsert({
    where: { id: 'prod-002' },
    update: {},
    create: {
      id: 'prod-002',
      nombre: 'Ganadera del Norte SA',
      cuit: '30-22222222-2',
      direccion: 'Ruta 34 KM 500, Santiago del Estero',
      telefono: '0385-3334444',
      email: 'contacto@ganadera-norte.com.ar',
      esProductor: true,
      esUsuarioFaena: false
    }
  })
  
  const prod3 = await prisma.cliente.upsert({
    where: { id: 'prod-003' },
    update: {},
    create: {
      id: 'prod-003',
      nombre: 'Los Alamos Agropecuaria',
      cuit: '30-33333333-3',
      direccion: 'Campo Los Álamos, Ruta 158 KM 80',
      telefono: '0343-5556666',
      esProductor: true,
      esUsuarioFaena: false
    }
  })

  // Usuarios de Faena (Matarifes)
  const uf1 = await prisma.cliente.upsert({
    where: { id: 'uf-001' },
    update: {},
    create: {
      id: 'uf-001',
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
  
  const uf2 = await prisma.cliente.upsert({
    where: { id: 'uf-002' },
    update: {},
    create: {
      id: 'uf-002',
      nombre: 'José Rodríguez',
      dni: '23456789',
      cuit: '20234567890',
      matricula: 'MAT-002',
      direccion: 'Av. San Martín 456, Villa María',
      localidad: 'Villa María',
      provincia: 'Córdoba',
      telefono: '0353-9990000',
      email: 'jose.rodriguez@email.com',
      condicionIva: 'MT',
      esProductor: false,
      esUsuarioFaena: true
    }
  })
  
  const uf3 = await prisma.cliente.upsert({
    where: { id: 'uf-003' },
    update: {},
    create: {
      id: 'uf-003',
      nombre: 'María González',
      dni: '34567890',
      cuit: '20345678901',
      matricula: 'MAT-003',
      direccion: 'Centro Comercial, Río Cuarto',
      localidad: 'Río Cuarto',
      provincia: 'Córdoba',
      telefono: '0358-1112222',
      telefonoAlternativo: '0358-1113333',
      email: 'maria.gonzalez@email.com',
      razonSocial: 'Supermercados del Valle',
      condicionIva: 'RI',
      esProductor: false,
      esUsuarioFaena: true
    }
  })
  
  const uf4 = await prisma.cliente.upsert({
    where: { id: 'uf-004' },
    update: {},
    create: {
      id: 'uf-004',
      nombre: 'Pedro Fernández',
      dni: '45678901',
      cuit: '20456789012',
      matricula: 'MAT-004',
      direccion: 'Puerto de Buenos Aires',
      localidad: 'Buenos Aires',
      provincia: 'Buenos Aires',
      telefono: '011-44445555',
      email: 'pedro.fernandez@email.com',
      razonSocial: 'Exportadora Pampeana SA',
      condicionIva: 'RI',
      esProductor: false,
      esUsuarioFaena: true
    }
  })

  // Cliente que es ambos (productor y usuario de faena)
  const mixto = await prisma.cliente.upsert({
    where: { id: 'mix-001' },
    update: {},
    create: {
      id: 'mix-001',
      nombre: 'Roberto Santa Rosa',
      dni: '56789012',
      cuit: '20567890123',
      matricula: 'MAT-005',
      direccion: 'Campo Santa Rosa, Ruta 9 KM 200',
      localidad: 'Córdoba',
      provincia: 'Córdoba',
      telefono: '0351-1234567',
      email: 'santarosa@agro.com.ar',
      razonSocial: 'Agropecuaria Santa Rosa',
      condicionIva: 'RI',
      esProductor: true,
      esUsuarioFaena: true
    }
  })

  console.log(`   ✓ 3 productores creados`)
  console.log(`   ✓ 4 usuarios de faena creados`)
  console.log(`   ✓ 1 cliente mixto creado`)

  // 4. Crear corrales
  console.log('🏠 Creando corrales...')
  const corralA = await prisma.corral.upsert({
    where: { id: 'corral-a' },
    update: {},
    create: { id: 'corral-a', nombre: 'Corral A', capacidad: 50, observaciones: 'Corral principal bovinos', stockBovinos: 0, stockEquinos: 0 }
  })
  const corralB = await prisma.corral.upsert({
    where: { id: 'corral-b' },
    update: {},
    create: { id: 'corral-b', nombre: 'Corral B', capacidad: 40, observaciones: 'Bovinos', stockBovinos: 0, stockEquinos: 0 }
  })
  const corralC = await prisma.corral.upsert({
    where: { id: 'corral-c' },
    update: {},
    create: { id: 'corral-c', nombre: 'Corral C', capacidad: 30, observaciones: 'Equinos', stockBovinos: 0, stockEquinos: 0 }
  })
  const corralD = await prisma.corral.upsert({
    where: { id: 'corral-d' },
    update: {},
    create: { id: 'corral-d', nombre: 'Corral D', capacidad: 60, observaciones: 'Corral grande', stockBovinos: 0, stockEquinos: 0 }
  })
  const corralE1 = await prisma.corral.upsert({
    where: { id: 'corral-e1' },
    update: {},
    create: { id: 'corral-e1', nombre: 'Corral E1', capacidad: 25, observaciones: 'Aislamiento', stockBovinos: 0, stockEquinos: 0 }
  })
  const corralE2 = await prisma.corral.upsert({
    where: { id: 'corral-e2' },
    update: {},
    create: { id: 'corral-e2', nombre: 'Corral E2', capacidad: 25, observaciones: 'Aislamiento', stockBovinos: 0, stockEquinos: 0 }
  })
  console.log(`   ✓ 6 corrales creados`)

  // 5. Crear tipificadores
  console.log('🔬 Creando tipificadores...')
  const tipificador1 = await prisma.tipificador.upsert({
    where: { matricula: 'TIP-001' },
    update: {},
    create: {
      nombre: 'Carlos',
      apellido: 'López',
      numero: '1',
      matricula: 'TIP-001',
      activo: true
    }
  })
  const tipificador2 = await prisma.tipificador.upsert({
    where: { matricula: 'TIP-002' },
    update: {},
    create: {
      nombre: 'Roberto',
      apellido: 'Fernández',
      numero: '2',
      matricula: 'TIP-002',
      activo: true
    }
  })
  const tipificador3 = await prisma.tipificador.upsert({
    where: { matricula: 'TIP-003' },
    update: {},
    create: {
      nombre: 'Ana',
      apellido: 'Martínez',
      numero: '3',
      matricula: 'TIP-003',
      activo: true
    }
  })
  console.log(`   ✓ 3 tipificadores creados`)

  // 6. Crear cámaras
  console.log('❄️ Creando cámaras...')
  await prisma.camara.upsert({
    where: { nombre: 'Cámara Faena 1' },
    update: {},
    create: { nombre: 'Cámara Faena 1', tipo: 'FAENA', capacidad: 200, observaciones: 'Medias reses frescas' }
  })
  await prisma.camara.upsert({
    where: { nombre: 'Cámara Faena 2' },
    update: {},
    create: { nombre: 'Cámara Faena 2', tipo: 'FAENA', capacidad: 150, observaciones: 'Medias reses frescas' }
  })
  await prisma.camara.upsert({
    where: { nombre: 'Cámara Congelados' },
    update: {},
    create: { nombre: 'Cámara Congelados', tipo: 'CUARTEO', capacidad: 10000, observaciones: 'Productos congelados - capacidad en kg' }
  })
  await prisma.camara.upsert({
    where: { nombre: 'Depósito Menudencias' },
    update: {},
    create: { nombre: 'Depósito Menudencias', tipo: 'DEPOSITO', capacidad: 5000, observaciones: 'Menudencias en kg' }
  })
  console.log(`   ✓ 4 cámaras creadas`)

  // 6. Crear tropas con animales ya pesados individualmente
  console.log('🐄 Creando tropas con pesaje individual completo...')
  const year = new Date().getFullYear()
  
  // Tropa 1 - PESADA con 20 animales
  const tropa1 = await prisma.tropa.upsert({
    where: { codigo: `B ${year} 0001` },
    update: {},
    create: {
      codigo: `B ${year} 0001`,
      numero: 1,
      productorId: prod1.id,
      usuarioFaenaId: uf1.id,
      especie: Especie.BOVINO,
      dte: 'DTE-2024-0001',
      guia: 'GUIA-2024-001',
      cantidadCabezas: 20,
      corralId: corralA.id,
      estado: 'PESADO',
      pesoBruto: 15000,
      pesoTara: 10000,
      pesoNeto: 5000,
      pesoTotalIndividual: 9450, // Suma de animales
      operadorId: admin.id
    }
  })

  // Tipos de animales tropa 1
  await prisma.tropaAnimalCantidad.upsert({
    where: { tropaId_tipoAnimal: { tropaId: tropa1.id, tipoAnimal: 'NO' } },
    update: { cantidad: 10 },
    create: { tropaId: tropa1.id, tipoAnimal: 'NO', cantidad: 10 }
  })
  await prisma.tropaAnimalCantidad.upsert({
    where: { tropaId_tipoAnimal: { tropaId: tropa1.id, tipoAnimal: 'VA' } },
    update: { cantidad: 10 },
    create: { tropaId: tropa1.id, tipoAnimal: 'VA', cantidad: 10 }
  })

  // Animales pesados tropa 1
  const animalesTropa1: { tipo: TipoAnimal; peso: number; raza: string }[] = [
    { tipo: 'NO', peso: 485, raza: 'Angus' },
    { tipo: 'NO', peso: 510, raza: 'Angus' },
    { tipo: 'NO', peso: 495, raza: 'Hereford' },
    { tipo: 'NO', peso: 520, raza: 'Angus' },
    { tipo: 'NO', peso: 478, raza: 'Brangus' },
    { tipo: 'NO', peso: 502, raza: 'Angus' },
    { tipo: 'NO', peso: 488, raza: 'Hereford' },
    { tipo: 'NO', peso: 515, raza: 'Angus' },
    { tipo: 'NO', peso: 492, raza: 'Brangus' },
    { tipo: 'NO', peso: 505, raza: 'Angus' },
    { tipo: 'VA', peso: 420, raza: 'Angus' },
    { tipo: 'VA', peso: 435, raza: 'Hereford' },
    { tipo: 'VA', peso: 410, raza: 'Angus' },
    { tipo: 'VA', peso: 445, raza: 'Brangus' },
    { tipo: 'VA', peso: 428, raza: 'Angus' },
    { tipo: 'VA', peso: 440, raza: 'Hereford' },
    { tipo: 'VA', peso: 418, raza: 'Angus' },
    { tipo: 'VA', peso: 452, raza: 'Brangus' },
    { tipo: 'VA', peso: 425, raza: 'Angus' },
    { tipo: 'VA', peso: 437, raza: 'Hereford' },
  ]

  for (let i = 0; i < animalesTropa1.length; i++) {
    const a = animalesTropa1[i]
    const codigo = `B${year}0001-${String(i + 1).padStart(3, '0')}`
    const animal = await prisma.animal.upsert({
      where: { codigo },
      update: {},
      create: {
        tropaId: tropa1.id,
        numero: i + 1,
        codigo,
        tipoAnimal: a.tipo,
        raza: a.raza,
        pesoVivo: a.peso,
        estado: 'PESADO',
        corralId: corralA.id
      }
    })
    // Crear pesaje individual
    await prisma.pesajeIndividual.upsert({
      where: { animalId: animal.id },
      update: {},
      create: {
        animalId: animal.id,
        peso: a.peso,
        operadorId: admin.id
      }
    })
  }

  // Tropa 2 - PESADA con 15 animales
  const tropa2 = await prisma.tropa.upsert({
    where: { codigo: `B ${year} 0002` },
    update: {},
    create: {
      codigo: `B ${year} 0002`,
      numero: 2,
      productorId: prod2.id,
      usuarioFaenaId: uf2.id,
      especie: Especie.BOVINO,
      dte: 'DTE-2024-0002',
      guia: 'GUIA-2024-002',
      cantidadCabezas: 15,
      corralId: corralB.id,
      estado: 'PESADO',
      pesoBruto: 12000,
      pesoTara: 8000,
      pesoNeto: 4000,
      pesoTotalIndividual: 7230,
      operadorId: admin.id
    }
  })

  await prisma.tropaAnimalCantidad.upsert({
    where: { tropaId_tipoAnimal: { tropaId: tropa2.id, tipoAnimal: 'VQ' } },
    update: { cantidad: 8 },
    create: { tropaId: tropa2.id, tipoAnimal: 'VQ', cantidad: 8 }
  })
  await prisma.tropaAnimalCantidad.upsert({
    where: { tropaId_tipoAnimal: { tropaId: tropa2.id, tipoAnimal: 'NT' } },
    update: { cantidad: 7 },
    create: { tropaId: tropa2.id, tipoAnimal: 'NT', cantidad: 7 }
  })

  const animalesTropa2: { tipo: TipoAnimal; peso: number; raza: string }[] = [
    { tipo: 'VQ', peso: 395, raza: 'Angus' },
    { tipo: 'VQ', peso: 410, raza: 'Hereford' },
    { tipo: 'VQ', peso: 385, raza: 'Angus' },
    { tipo: 'VQ', peso: 420, raza: 'Brangus' },
    { tipo: 'VQ', peso: 398, raza: 'Angus' },
    { tipo: 'VQ', peso: 412, raza: 'Hereford' },
    { tipo: 'VQ', peso: 390, raza: 'Angus' },
    { tipo: 'VQ', peso: 425, raza: 'Brangus' },
    { tipo: 'NT', peso: 460, raza: 'Angus' },
    { tipo: 'NT', peso: 475, raza: 'Hereford' },
    { tipo: 'NT', peso: 455, raza: 'Angus' },
    { tipo: 'NT', peso: 480, raza: 'Brangus' },
    { tipo: 'NT', peso: 468, raza: 'Angus' },
    { tipo: 'NT', peso: 482, raza: 'Hereford' },
    { tipo: 'NT', peso: 470, raza: 'Angus' },
  ]

  for (let i = 0; i < animalesTropa2.length; i++) {
    const a = animalesTropa2[i]
    const codigo = `B${year}0002-${String(i + 1).padStart(3, '0')}`
    const animal = await prisma.animal.upsert({
      where: { codigo },
      update: {},
      create: {
        tropaId: tropa2.id,
        numero: i + 1,
        codigo,
        tipoAnimal: a.tipo,
        raza: a.raza,
        pesoVivo: a.peso,
        estado: 'PESADO',
        corralId: corralB.id
      }
    })
    await prisma.pesajeIndividual.upsert({
      where: { animalId: animal.id },
      update: {},
      create: {
        animalId: animal.id,
        peso: a.peso,
        operadorId: admin.id
      }
    })
  }

  // Tropa 3 - PESADA con 12 animales
  const tropa3 = await prisma.tropa.upsert({
    where: { codigo: `B ${year} 0003` },
    update: {},
    create: {
      codigo: `B ${year} 0003`,
      numero: 3,
      productorId: prod3.id,
      usuarioFaenaId: uf3.id,
      especie: Especie.BOVINO,
      dte: 'DTE-2024-0003',
      guia: 'GUIA-2024-003',
      cantidadCabezas: 12,
      corralId: corralC.id,
      estado: 'PESADO',
      pesoTotalIndividual: 5680,
      operadorId: admin.id
    }
  })

  await prisma.tropaAnimalCantidad.upsert({
    where: { tropaId_tipoAnimal: { tropaId: tropa3.id, tipoAnimal: 'NO' } },
    update: { cantidad: 6 },
    create: { tropaId: tropa3.id, tipoAnimal: 'NO', cantidad: 6 }
  })
  await prisma.tropaAnimalCantidad.upsert({
    where: { tropaId_tipoAnimal: { tropaId: tropa3.id, tipoAnimal: 'MEJ' } },
    update: { cantidad: 6 },
    create: { tropaId: tropa3.id, tipoAnimal: 'MEJ', cantidad: 6 }
  })

  const animalesTropa3: { tipo: TipoAnimal; peso: number; raza: string }[] = [
    { tipo: 'NO', peso: 490, raza: 'Angus' },
    { tipo: 'NO', peso: 505, raza: 'Hereford' },
    { tipo: 'NO', peso: 478, raza: 'Angus' },
    { tipo: 'NO', peso: 512, raza: 'Brangus' },
    { tipo: 'NO', peso: 495, raza: 'Angus' },
    { tipo: 'NO', peso: 508, raza: 'Hereford' },
    { tipo: 'MEJ', peso: 380, raza: 'Angus' },
    { tipo: 'MEJ', peso: 395, raza: 'Hereford' },
    { tipo: 'MEJ', peso: 372, raza: 'Angus' },
    { tipo: 'MEJ', peso: 388, raza: 'Brangus' },
    { tipo: 'MEJ', peso: 402, raza: 'Angus' },
    { tipo: 'MEJ', peso: 378, raza: 'Hereford' },
  ]

  for (let i = 0; i < animalesTropa3.length; i++) {
    const a = animalesTropa3[i]
    const codigo = `B${year}0003-${String(i + 1).padStart(3, '0')}`
    const animal = await prisma.animal.upsert({
      where: { codigo },
      update: {},
      create: {
        tropaId: tropa3.id,
        numero: i + 1,
        codigo,
        tipoAnimal: a.tipo,
        raza: a.raza,
        pesoVivo: a.peso,
        estado: 'PESADO',
        corralId: corralC.id
      }
    })
    await prisma.pesajeIndividual.upsert({
      where: { animalId: animal.id },
      update: {},
      create: {
        animalId: animal.id,
        peso: a.peso,
        operadorId: admin.id
      }
    })
  }

  // Tropa 4 - EN_CORRAL (para probar pesaje individual)
  const tropa4 = await prisma.tropa.upsert({
    where: { codigo: `B ${year} 0004` },
    update: {},
    create: {
      codigo: `B ${year} 0004`,
      numero: 4,
      productorId: prod1.id,
      usuarioFaenaId: uf1.id,
      especie: Especie.BOVINO,
      dte: 'DTE-2024-0004',
      guia: 'GUIA-2024-004',
      cantidadCabezas: 10,
      corralId: corralD.id,
      estado: 'EN_CORRAL',
      pesoBruto: 8000,
      pesoTara: 5500,
      pesoNeto: 2500,
      operadorId: admin.id
    }
  })

  await prisma.tropaAnimalCantidad.upsert({
    where: { tropaId_tipoAnimal: { tropaId: tropa4.id, tipoAnimal: 'NO' } },
    update: { cantidad: 5 },
    create: { tropaId: tropa4.id, tipoAnimal: 'NO', cantidad: 5 }
  })
  await prisma.tropaAnimalCantidad.upsert({
    where: { tropaId_tipoAnimal: { tropaId: tropa4.id, tipoAnimal: 'VA' } },
    update: { cantidad: 5 },
    create: { tropaId: tropa4.id, tipoAnimal: 'VA', cantidad: 5 }
  })

  // Tropa 5 - RECIBIDO (sin pesaje individual)
  const tropa5 = await prisma.tropa.upsert({
    where: { codigo: `B ${year} 0005` },
    update: {},
    create: {
      codigo: `B ${year} 0005`,
      numero: 5,
      productorId: prod2.id,
      usuarioFaenaId: uf2.id,
      especie: Especie.BOVINO,
      dte: 'DTE-2024-0005',
      guia: 'GUIA-2024-005',
      cantidadCabezas: 8,
      corralId: corralE1.id,
      estado: 'RECIBIDO',
      pesoBruto: 6500,
      operadorId: admin.id
    }
  })

  await prisma.tropaAnimalCantidad.upsert({
    where: { tropaId_tipoAnimal: { tropaId: tropa5.id, tipoAnimal: 'NT' } },
    update: { cantidad: 8 },
    create: { tropaId: tropa5.id, tipoAnimal: 'NT', cantidad: 8 }
  })

  console.log(`   ✓ 5 tropas creadas (3 con pesaje individual completo)`)

  // 7. Configuración del frigorífico
  console.log('⚙️ Creando configuración del frigorífico...')
  await prisma.configuracionFrigorifico.upsert({
    where: { id: 'config-main' },
    update: {},
    create: {
      id: 'config-main',
      nombre: 'Solemar Alimentaria',
      direccion: 'Ruta 9 KM 45, Córdoba, Argentina',
      numeroEstablecimiento: '12.345',
      cuit: '30-12345678-9',
      numeroMatricula: 'MAT-2024-001'
    }
  })
  console.log(`   ✓ Configuración del frigorífico creada`)

  // 8. Actualizar stock de corrales
  try {
    await prisma.corral.update({
      where: { id: corralA.id },
      data: { stockBovinos: 20 }
    })
    await prisma.corral.update({
      where: { id: corralB.id },
      data: { stockBovinos: 15 }
    })
    await prisma.corral.update({
      where: { id: corralC.id },
      data: { stockBovinos: 12 }
    })
    await prisma.corral.update({
      where: { id: corralD.id },
      data: { stockBovinos: 10 }
    })
    await prisma.corral.update({
      where: { id: corralE1.id },
      data: { stockBovinos: 8 }
    })
  } catch (e) {
    // Ignore if corral not found
  }

  console.log('\n✅ Seed completado exitosamente!')
  console.log('\n📋 Datos de acceso:')
  console.log('   Admin: admin / admin123 (PIN: 1234)')
  console.log('   Balanza: balanza / balanza123 (PIN: 1111)')
  console.log('   Supervisor: supervisor / super123 (PIN: 2222)')
  console.log('\n📊 Tropas creadas:')
  console.log('   - B 2025 0001: 20 animales PESADOS (9,450 kg total)')
  console.log('   - B 2025 0002: 15 animales PESADOS (7,230 kg total)')
  console.log('   - B 2025 0003: 12 animales PESADOS (5,680 kg total)')
  console.log('   - B 2025 0004: 10 animales EN_CORRAL (listo para pesaje)')
  console.log('   - B 2025 0005: 8 animales RECIBIDO (pendiente tara)')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
