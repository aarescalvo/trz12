// Script para crear datos de prueba para CICLO I
// Crea animales en cada etapa del proceso

import { PrismaClient, Especie, RolOperador, TipoAnimal, EstadoTropa, EstadoAnimal, EstadoListaFaena, EstadoRomaneo, EstadoMediaRes, LadoMedia, SiglaMedia, TipoCamara } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando creación de datos de prueba CICLO I...')

  // Obtener datos existentes
  const admin = await prisma.operador.findFirst({ where: { usuario: 'admin' } })
  const corralA = await prisma.corral.findFirst({ where: { nombre: 'Corral A' } })
  const corralB = await prisma.corral.findFirst({ where: { nombre: 'Corral B' } })
  const corralC = await prisma.corral.findFirst({ where: { nombre: 'Corral C' } })
  const corralD = await prisma.corral.findFirst({ where: { nombre: 'Corral D' } })
  const uf1 = await prisma.cliente.findFirst({ where: { id: 'uf-001' } })
  const uf2 = await prisma.cliente.findFirst({ where: { id: 'uf-002' } })
  const uf3 = await prisma.cliente.findFirst({ where: { id: 'uf-003' } })
  const prod1 = await prisma.cliente.findFirst({ where: { id: 'prod-001' } })
  const prod2 = await prisma.cliente.findFirst({ where: { id: 'prod-002' } })
  const tipificador1 = await prisma.tipificador.findFirst({ where: { matricula: 'TIP-001' } })
  const camaraFaena1 = await prisma.camara.findFirst({ where: { nombre: 'Cámara Faena 1' } })
  const camaraFaena2 = await prisma.camara.findFirst({ where: { nombre: 'Cámara Faena 2' } })

  if (!admin || !corralA || !uf1) {
    console.log('❌ Faltan datos base. Ejecute primero el seed principal.')
    return
  }

  // ==========================================
  // 1. TROPA 1 - Animales en corral (RECIBIDO)
  // ==========================================
  console.log('\n📦 Creando Tropa 1 - Animales en corral (RECIBIDO)...')
  
  const tropa1 = await prisma.tropa.upsert({
    where: { codigo: 'B 2026 0101' },
    update: {},
    create: {
      numero: 101,
      codigo: 'B 2026 0101',
      codigoSimplificado: 'B0101',
      especie: Especie.BOVINO,
      productorId: prod1?.id,
      usuarioFaenaId: uf1.id,
      dte: 'DTE-2026-00101',
      guia: 'GUIA-2026-00101',
      cantidadCabezas: 15,
      corralId: corralA.id,
      estado: EstadoTropa.EN_CORRAL,
      observaciones: 'Tropa de prueba - animales en corral listos para pesaje',
      operadorId: admin.id
    }
  })

  // Crear animales para Tropa 1
  for (let i = 1; i <= 15; i++) {
    await prisma.animal.upsert({
      where: { codigo: `B20260101-${String(i).padStart(3, '0')}` },
      update: {},
      create: {
        tropaId: tropa1.id,
        numero: i,
        codigo: `B20260101-${String(i).padStart(3, '0')}`,
        caravana: `CAR-${101}-${String(i).padStart(3, '0')}`,
        tipoAnimal: i <= 5 ? TipoAnimal.NO : i <= 10 ? TipoAnimal.VA : TipoAnimal.VQ,
        raza: i <= 8 ? 'Angus' : 'Hereford',
        estado: EstadoAnimal.RECIBIDO,
        corralId: corralA.id
      }
    })
  }
  console.log(`   ✓ Tropa 101 creada con 15 animales en Corral A`)

  // ==========================================
  // 2. TROPA 2 - Animales para pesaje individual
  // ==========================================
  console.log('\n⚖️ Creando Tropa 2 - Animales para pesaje individual...')
  
  const tropa2 = await prisma.tropa.upsert({
    where: { codigo: 'B 2026 0102' },
    update: {},
    create: {
      numero: 102,
      codigo: 'B 2026 0102',
      codigoSimplificado: 'B0102',
      especie: Especie.BOVINO,
      productorId: prod2?.id,
      usuarioFaenaId: uf2?.id || uf1.id,
      dte: 'DTE-2026-00102',
      guia: 'GUIA-2026-00102',
      cantidadCabezas: 12,
      corralId: corralB?.id || corralA.id,
      estado: EstadoTropa.EN_PESAJE,
      observaciones: 'Tropa de prueba - lista para pesaje individual',
      operadorId: admin.id
    }
  })

  for (let i = 1; i <= 12; i++) {
    await prisma.animal.upsert({
      where: { codigo: `B20260102-${String(i).padStart(3, '0')}` },
      update: {},
      create: {
        tropaId: tropa2.id,
        numero: i,
        codigo: `B20260102-${String(i).padStart(3, '0')}`,
        caravana: `CAR-${102}-${String(i).padStart(3, '0')}`,
        tipoAnimal: i <= 4 ? TipoAnimal.NO : i <= 8 ? TipoAnimal.VA : TipoAnimal.NT,
        raza: 'Angus',
        estado: EstadoAnimal.RECIBIDO,
        corralId: corralB?.id || corralA.id
      }
    })
  }
  console.log(`   ✓ Tropa 102 creada con 12 animales listos para pesaje`)

  // ==========================================
  // 3. TROPA 3 - Animales pesados individualmente (PESADO)
  // ==========================================
  console.log('\n📊 Creando Tropa 3 - Animales pesados individualmente...')
  
  const tropa3 = await prisma.tropa.upsert({
    where: { codigo: 'B 2026 0103' },
    update: {},
    create: {
      numero: 103,
      codigo: 'B 2026 0103',
      codigoSimplificado: 'B0103',
      especie: Especie.BOVINO,
      productorId: prod1?.id,
      usuarioFaenaId: uf3?.id || uf1.id,
      dte: 'DTE-2026-00103',
      guia: 'GUIA-2026-00103',
      cantidadCabezas: 10,
      corralId: corralC?.id || corralA.id,
      estado: EstadoTropa.PESADO,
      pesoTotalIndividual: 4580,
      observaciones: 'Tropa de prueba - animales pesados individualmente',
      operadorId: admin.id
    }
  })

  for (let i = 1; i <= 10; i++) {
    const pesoBase = 420 + (i * 15)
    const animal = await prisma.animal.upsert({
      where: { codigo: `B20260103-${String(i).padStart(3, '0')}` },
      update: {},
      create: {
        tropaId: tropa3.id,
        numero: i,
        codigo: `B20260103-${String(i).padStart(3, '0')}`,
        caravana: `CAR-${103}-${String(i).padStart(3, '0')}`,
        tipoAnimal: i <= 5 ? TipoAnimal.NO : TipoAnimal.VA,
        raza: 'Hereford',
        pesoVivo: pesoBase,
        estado: EstadoAnimal.PESADO,
        corralId: corralC?.id || corralA.id
      }
    })

    // Crear registro de pesaje individual
    await prisma.pesajeIndividual.upsert({
      where: { animalId: animal.id },
      update: {},
      create: {
        animalId: animal.id,
        peso: pesoBase,
        caravana: `CAR-${103}-${String(i).padStart(3, '0')}`,
        operadorId: admin.id
      }
    })
  }
  console.log(`   ✓ Tropa 103 creada con 10 animales pesados (total: 4580 kg)`)

  // ==========================================
  // 4. LISTA DE FAENA ABIERTA - Tropa lista para faena
  // ==========================================
  console.log('\n📝 Creando Lista de Faena y Tropa 4 - Lista para faena...')
  
  const tropa4 = await prisma.tropa.upsert({
    where: { codigo: 'B 2026 0104' },
    update: {},
    create: {
      numero: 104,
      codigo: 'B 2026 0104',
      codigoSimplificado: 'B0104',
      especie: Especie.BOVINO,
      productorId: prod2?.id,
      usuarioFaenaId: uf1.id,
      dte: 'DTE-2026-00104',
      guia: 'GUIA-2026-00104',
      cantidadCabezas: 8,
      corralId: corralD?.id || corralA.id,
      estado: EstadoTropa.LISTO_FAENA,
      pesoTotalIndividual: 3680,
      observaciones: 'Tropa de prueba - en lista de faena',
      operadorId: admin.id
    }
  })

  for (let i = 1; i <= 8; i++) {
    const pesoBase = 430 + (i * 20)
    const animal = await prisma.animal.upsert({
      where: { codigo: `B20260104-${String(i).padStart(3, '0')}` },
      update: {},
      create: {
        tropaId: tropa4.id,
        numero: i,
        codigo: `B20260104-${String(i).padStart(3, '0')}`,
        caravana: `CAR-${104}-${String(i).padStart(3, '0')}`,
        tipoAnimal: i <= 4 ? TipoAnimal.NO : TipoAnimal.VA,
        raza: 'Angus',
        pesoVivo: pesoBase,
        estado: EstadoAnimal.PESADO,
        corralId: corralD?.id || corralA.id
      }
    })

    await prisma.pesajeIndividual.upsert({
      where: { animalId: animal.id },
      update: {},
      create: {
        animalId: animal.id,
        peso: pesoBase,
        operadorId: admin.id
      }
    })
  }

  // Crear Lista de Faena abierta
  const listaFaena = await prisma.listaFaena.upsert({
    where: { id: 'lista-faena-test-001' },
    update: {},
    create: {
      id: 'lista-faena-test-001',
      fecha: new Date(),
      estado: EstadoListaFaena.ABIERTA,
      cantidadTotal: 8,
      observaciones: 'Lista de faena de prueba - abierta',
      supervisorId: admin.id
    }
  })

  // Agregar tropa a la lista de faena
  await prisma.listaFaenaTropa.upsert({
    where: { id: 'lft-001' },
    update: {},
    create: {
      id: 'lft-001',
      listaFaenaId: listaFaena.id,
      tropaId: tropa4.id,
      cantidad: 8
    }
  })
  console.log(`   ✓ Tropa 104 creada con 8 animales en Lista de Faena abierta`)

  // ==========================================
  // 5. INGRESO A CAJÓN - Animales con asignación de garrón
  // ==========================================
  console.log('\n🔢 Creando animales para Ingreso a Cajón (con garrones asignados)...')
  
  const tropa5 = await prisma.tropa.upsert({
    where: { codigo: 'B 2026 0105' },
    update: {},
    create: {
      numero: 105,
      codigo: 'B 2026 0105',
      codigoSimplificado: 'B0105',
      especie: Especie.BOVINO,
      productorId: prod1?.id,
      usuarioFaenaId: uf2?.id || uf1.id,
      dte: 'DTE-2026-00105',
      guia: 'GUIA-2026-00105',
      cantidadCabezas: 6,
      corralId: corralA.id,
      estado: EstadoTropa.EN_FAENA,
      pesoTotalIndividual: 2850,
      observaciones: 'Tropa de prueba - con garrones asignados (ingreso cajón)',
      operadorId: admin.id
    }
  })

  // Crear lista de faena para estos animales
  const listaFaena2 = await prisma.listaFaena.upsert({
    where: { id: 'lista-faena-test-002' },
    update: {},
    create: {
      id: 'lista-faena-test-002',
      fecha: new Date(),
      estado: EstadoListaFaena.EN_PROCESO,
      cantidadTotal: 6,
      observaciones: 'Lista de faena para ingreso a cajón',
      supervisorId: admin.id
    }
  })

  await prisma.listaFaenaTropa.upsert({
    where: { id: 'lft-002' },
    update: {},
    create: {
      id: 'lft-002',
      listaFaenaId: listaFaena2.id,
      tropaId: tropa5.id,
      cantidad: 6
    }
  })

  for (let i = 1; i <= 6; i++) {
    const pesoBase = 450 + (i * 15)
    const garronNumber = 100 + i
    
    const animal = await prisma.animal.upsert({
      where: { codigo: `B20260105-${String(i).padStart(3, '0')}` },
      update: {},
      create: {
        tropaId: tropa5.id,
        numero: i,
        codigo: `B20260105-${String(i).padStart(3, '0')}`,
        caravana: `CAR-${105}-${String(i).padStart(3, '0')}`,
        tipoAnimal: i <= 3 ? TipoAnimal.NO : TipoAnimal.VA,
        raza: 'Angus',
        pesoVivo: pesoBase,
        estado: EstadoAnimal.EN_FAENA,
        corralId: corralA.id
      }
    })

    await prisma.pesajeIndividual.upsert({
      where: { animalId: animal.id },
      update: {},
      create: {
        animalId: animal.id,
        peso: pesoBase,
        operadorId: admin.id
      }
    })

    // Crear asignación de garrón
    await prisma.asignacionGarron.upsert({
      where: { id: `garron-${garronNumber}` },
      update: {},
      create: {
        id: `garron-${garronNumber}`,
        listaFaenaId: listaFaena2.id,
        garron: garronNumber,
        animalId: animal.id,
        tropaCodigo: tropa5.codigo,
        animalNumero: i,
        tipoAnimal: i <= 3 ? 'NO' : 'VA',
        pesoVivo: pesoBase,
        operadorId: admin.id,
        horaIngreso: new Date()
      }
    })
  }
  console.log(`   ✓ Tropa 105 creada con 6 animales con garrones asignados (101-106)`)

  // ==========================================
  // 6. ROMANEO - Animales con romaneo pendiente y completado
  // ==========================================
  console.log('\n🥩 Creando animales para Romaneo...')
  
  const tropa6 = await prisma.tropa.upsert({
    where: { codigo: 'B 2026 0106' },
    update: {},
    create: {
      numero: 106,
      codigo: 'B 2026 0106',
      codigoSimplificado: 'B0106',
      especie: Especie.BOVINO,
      productorId: prod2?.id,
      usuarioFaenaId: uf3?.id || uf1.id,
      dte: 'DTE-2026-00106',
      guia: 'GUIA-2026-00106',
      cantidadCabezas: 8,
      corralId: corralB?.id || corralA.id,
      estado: EstadoTropa.EN_FAENA,
      pesoTotalIndividual: 3720,
      observaciones: 'Tropa de prueba - en romaneo',
      operadorId: admin.id
    }
  })

  const listaFaena3 = await prisma.listaFaena.upsert({
    where: { id: 'lista-faena-test-003' },
    update: {},
    create: {
      id: 'lista-faena-test-003',
      fecha: new Date(),
      estado: EstadoListaFaena.EN_PROCESO,
      cantidadTotal: 8,
      observaciones: 'Lista de faena para romaneo',
      supervisorId: admin.id
    }
  })

  await prisma.listaFaenaTropa.upsert({
    where: { id: 'lft-003' },
    update: {},
    create: {
      id: 'lft-003',
      listaFaenaId: listaFaena3.id,
      tropaId: tropa6.id,
      cantidad: 8
    }
  })

  // Crear animales: 4 pendientes de romaneo, 4 con romaneo completado
  for (let i = 1; i <= 8; i++) {
    const pesoBase = 440 + (i * 12)
    const garronNumber = 200 + i
    
    const animal = await prisma.animal.upsert({
      where: { codigo: `B20260106-${String(i).padStart(3, '0')}` },
      update: {},
      create: {
        tropaId: tropa6.id,
        numero: i,
        codigo: `B20260106-${String(i).padStart(3, '0')}`,
        caravana: `CAR-${106}-${String(i).padStart(3, '0')}`,
        tipoAnimal: i <= 4 ? TipoAnimal.NO : TipoAnimal.VA,
        raza: 'Hereford',
        pesoVivo: pesoBase,
        estado: EstadoAnimal.EN_FAENA,
        corralId: corralB?.id || corralA.id
      }
    })

    await prisma.pesajeIndividual.upsert({
      where: { animalId: animal.id },
      update: {},
      create: {
        animalId: animal.id,
        peso: pesoBase,
        operadorId: admin.id
      }
    })

    await prisma.asignacionGarron.upsert({
      where: { id: `garron-${garronNumber}` },
      update: {},
      create: {
        id: `garron-${garronNumber}`,
        listaFaenaId: listaFaena3.id,
        garron: garronNumber,
        animalId: animal.id,
        tropaCodigo: tropa6.codigo,
        animalNumero: i,
        tipoAnimal: i <= 4 ? 'NO' : 'VA',
        pesoVivo: pesoBase,
        operadorId: admin.id,
        horaIngreso: new Date()
      }
    })

    // Los primeros 4 con romaneo PENDIENTE (sin pesos de medias)
    // Los últimos 4 con romaneo COMPLETADO (con pesos de medias)
    if (i > 4) {
      const pesoMediaIzq = Math.round(pesoBase * 0.27)
      const pesoMediaDer = Math.round(pesoBase * 0.265)
      const pesoTotal = pesoMediaIzq + pesoMediaDer
      const rinde = Math.round((pesoTotal / pesoBase) * 1000) / 10

      const romaneo = await prisma.romaneo.upsert({
        where: { id: `romaneo-${garronNumber}` },
        update: {},
        create: {
          id: `romaneo-${garronNumber}`,
          listaFaenaId: listaFaena3.id,
          garron: garronNumber,
          tropaCodigo: tropa6.codigo,
          numeroAnimal: i,
          tipoAnimal: animal.tipoAnimal,
          raza: animal.raza,
          pesoVivo: pesoBase,
          denticion: '2 dientes',
          tipificadorId: tipificador1?.id,
          pesoMediaIzq: pesoMediaIzq,
          pesoMediaDer: pesoMediaDer,
          pesoTotal: pesoTotal,
          rinde: rinde,
          estado: EstadoRomaneo.CONFIRMADO,
          operadorId: admin.id,
          fechaConfirmacion: new Date()
        }
      })

      // Crear medias reses
      await prisma.mediaRes.upsert({
        where: { codigo: `MR-${garronNumber}-I` },
        update: {},
        create: {
          romaneoId: romaneo.id,
          lado: LadoMedia.IZQUIERDA,
          peso: pesoMediaIzq,
          sigla: SiglaMedia.A,
          codigo: `MR-${garronNumber}-I`,
          estado: EstadoMediaRes.EN_CAMARA,
          camaraId: camaraFaena1?.id
        }
      })

      await prisma.mediaRes.upsert({
        where: { codigo: `MR-${garronNumber}-D` },
        update: {},
        create: {
          romaneoId: romaneo.id,
          lado: LadoMedia.DERECHA,
          peso: pesoMediaDer,
          sigla: SiglaMedia.A,
          codigo: `MR-${garronNumber}-D`,
          estado: EstadoMediaRes.EN_CAMARA,
          camaraId: camaraFaena1?.id
        }
      })
    } else {
      // Romaneo pendiente (sin pesos)
      await prisma.romaneo.upsert({
        where: { id: `romaneo-${garronNumber}` },
        update: {},
        create: {
          id: `romaneo-${garronNumber}`,
          listaFaenaId: listaFaena3.id,
          garron: garronNumber,
          tropaCodigo: tropa6.codigo,
          numeroAnimal: i,
          tipoAnimal: animal.tipoAnimal,
          raza: animal.raza,
          pesoVivo: pesoBase,
          denticion: '0 dientes',
          tipificadorId: tipificador1?.id,
          estado: EstadoRomaneo.PENDIENTE,
          operadorId: admin.id
        }
      })
    }
  }
  console.log(`   ✓ Tropa 106 creada: 4 animales pendientes de romaneo, 4 con romaneo completado`)

  // ==========================================
  // 7. STOCK DE MEDIAS RESES EN CÁMARAS
  // ==========================================
  console.log('\n❄️ Creando stock de medias reses en cámaras...')
  
  // Crear tropa faenada con medias reses en cámara
  const tropa7 = await prisma.tropa.upsert({
    where: { codigo: 'B 2026 0107' },
    update: {},
    create: {
      numero: 107,
      codigo: 'B 2026 0107',
      codigoSimplificado: 'B0107',
      especie: Especie.BOVINO,
      productorId: prod1?.id,
      usuarioFaenaId: uf1.id,
      dte: 'DTE-2026-00107',
      guia: 'GUIA-2026-00107',
      cantidadCabezas: 10,
      corralId: corralC?.id || corralA.id,
      estado: EstadoTropa.FAENADO,
      pesoTotalIndividual: 4650,
      observaciones: 'Tropa de prueba - faenada con stock en cámaras',
      operadorId: admin.id
    }
  })

  const listaFaena4 = await prisma.listaFaena.upsert({
    where: { id: 'lista-faena-test-004' },
    update: {},
    create: {
      id: 'lista-faena-test-004',
      fecha: new Date(Date.now() - 86400000), // Ayer
      estado: EstadoListaFaena.CERRADA,
      cantidadTotal: 10,
      observaciones: 'Lista de faena completada',
      supervisorId: admin.id,
      fechaCierre: new Date()
    }
  })

  await prisma.listaFaenaTropa.upsert({
    where: { id: 'lft-004' },
    update: {},
    create: {
      id: 'lft-004',
      listaFaenaId: listaFaena4.id,
      tropaId: tropa7.id,
      cantidad: 10
    }
  })

  // Crear animales faenados con medias reses en cámara
  for (let i = 1; i <= 10; i++) {
    const pesoBase = 450 + (i * 10)
    const garronNumber = 300 + i
    const pesoMediaIzq = Math.round(pesoBase * 0.27)
    const pesoMediaDer = Math.round(pesoBase * 0.265)
    const pesoTotal = pesoMediaIzq + pesoMediaDer
    const rinde = Math.round((pesoTotal / pesoBase) * 1000) / 10

    const animal = await prisma.animal.upsert({
      where: { codigo: `B20260107-${String(i).padStart(3, '0')}` },
      update: {},
      create: {
        tropaId: tropa7.id,
        numero: i,
        codigo: `B20260107-${String(i).padStart(3, '0')}`,
        tipoAnimal: i <= 5 ? TipoAnimal.NO : TipoAnimal.VA,
        raza: 'Angus',
        pesoVivo: pesoBase,
        estado: EstadoAnimal.EN_CAMARA,
        corralId: corralC?.id || corralA.id
      }
    })

    await prisma.asignacionGarron.upsert({
      where: { id: `garron-${garronNumber}` },
      update: {},
      create: {
        id: `garron-${garronNumber}`,
        listaFaenaId: listaFaena4.id,
        garron: garronNumber,
        animalId: animal.id,
        tropaCodigo: tropa7.codigo,
        animalNumero: i,
        tipoAnimal: i <= 5 ? 'NO' : 'VA',
        pesoVivo: pesoBase,
        operadorId: admin.id,
        completado: true,
        tieneMediaDer: true,
        tieneMediaIzq: true,
        horaIngreso: new Date(Date.now() - 86400000)
      }
    })

    const romaneo = await prisma.romaneo.upsert({
      where: { id: `romaneo-${garronNumber}` },
      update: {},
      create: {
        id: `romaneo-${garronNumber}`,
        listaFaenaId: listaFaena4.id,
        garron: garronNumber,
        tropaCodigo: tropa7.codigo,
        numeroAnimal: i,
        tipoAnimal: animal.tipoAnimal,
        raza: animal.raza,
        pesoVivo: pesoBase,
        denticion: '2 dientes',
        tipificadorId: tipificador1?.id,
        pesoMediaIzq: pesoMediaIzq,
        pesoMediaDer: pesoMediaDer,
        pesoTotal: pesoTotal,
        rinde: rinde,
        estado: EstadoRomaneo.CONFIRMADO,
        operadorId: admin.id,
        fechaConfirmacion: new Date(Date.now() - 86400000)
      }
    })

    // Crear medias reses en cámara
    const camaraAsignada = i <= 5 ? camaraFaena1?.id : camaraFaena2?.id
    
    await prisma.mediaRes.upsert({
      where: { codigo: `MR-${garronNumber}-I` },
      update: {},
      create: {
        romaneoId: romaneo.id,
        lado: LadoMedia.IZQUIERDA,
        peso: pesoMediaIzq,
        sigla: SiglaMedia.A,
        codigo: `MR-${garronNumber}-I`,
        estado: EstadoMediaRes.EN_CAMARA,
        camaraId: camaraAsignada
      }
    })

    await prisma.mediaRes.upsert({
      where: { codigo: `MR-${garronNumber}-D` },
      update: {},
      create: {
        romaneoId: romaneo.id,
        lado: LadoMedia.DERECHA,
        peso: pesoMediaDer,
        sigla: SiglaMedia.A,
        codigo: `MR-${garronNumber}-D`,
        estado: EstadoMediaRes.EN_CAMARA,
        camaraId: camaraAsignada
      }
    })
  }

  // Crear stock agregado por cámara y tropa
  if (camaraFaena1) {
    await prisma.stockMediaRes.upsert({
      where: { id: 'stock-camara1-tropa107' },
      update: {
        cantidad: 10,
        pesoTotal: 2700
      },
      create: {
        id: 'stock-camara1-tropa107',
        camaraId: camaraFaena1.id,
        tropaCodigo: 'B 2026 0107',
        especie: Especie.BOVINO,
        cantidad: 10,
        pesoTotal: 2700
      }
    })
  }

  if (camaraFaena2) {
    await prisma.stockMediaRes.upsert({
      where: { id: 'stock-camara2-tropa107' },
      update: {
        cantidad: 10,
        pesoTotal: 2650
      },
      create: {
        id: 'stock-camara2-tropa107',
        camaraId: camaraFaena2.id,
        tropaCodigo: 'B 2026 0107',
        especie: Especie.BOVINO,
        cantidad: 10,
        pesoTotal: 2650
      }
    })
  }
  console.log(`   ✓ Tropa 107 creada con 20 medias reses en cámaras de faena`)

  // ==========================================
  // 8. TROPA ADICIONAL EN CORRAL
  // ==========================================
  console.log('\n📦 Creando Tropa adicional en corral...')
  
  const tropa8 = await prisma.tropa.upsert({
    where: { codigo: 'B 2026 0108' },
    update: {},
    create: {
      numero: 108,
      codigo: 'B 2026 0108',
      codigoSimplificado: 'B0108',
      especie: Especie.BOVINO,
      productorId: prod2?.id,
      usuarioFaenaId: uf2?.id || uf1.id,
      dte: 'DTE-2026-00108',
      guia: 'GUIA-2026-00108',
      cantidadCabezas: 20,
      corralId: corralD?.id || corralA.id,
      estado: EstadoTropa.EN_CORRAL,
      observaciones: 'Tropa de prueba - animales en corral',
      operadorId: admin.id
    }
  })

  for (let i = 1; i <= 20; i++) {
    await prisma.animal.upsert({
      where: { codigo: `B20260108-${String(i).padStart(3, '0')}` },
      update: {},
      create: {
        tropaId: tropa8.id,
        numero: i,
        codigo: `B20260108-${String(i).padStart(3, '0')}`,
        caravana: `CAR-${108}-${String(i).padStart(3, '0')}`,
        tipoAnimal: i <= 8 ? TipoAnimal.NO : i <= 14 ? TipoAnimal.VA : TipoAnimal.VQ,
        raza: i <= 10 ? 'Angus' : 'Hereford',
        estado: EstadoAnimal.RECIBIDO,
        corralId: corralD?.id || corralA.id
      }
    })
  }
  console.log(`   ✓ Tropa 108 creada con 20 animales en Corral D`)

  // ==========================================
  // RESUMEN FINAL
  // ==========================================
  console.log('\n' + '='.repeat(60))
  console.log('✅ DATOS DE PRUEBA CICLO I CREADOS EXITOSAMENTE')
  console.log('='.repeat(60))
  console.log('\n📊 RESUMEN DE DATOS CREADOS:\n')
  console.log('   🏠 CORRALES:')
  console.log('      • Tropa 101: 15 animales en Corral A (RECIBIDO)')
  console.log('      • Tropa 108: 20 animales en Corral D (RECIBIDO)')
  console.log('\n   ⚖️ PESAJE INDIVIDUAL:')
  console.log('      • Tropa 102: 12 animales listos para pesaje')
  console.log('      • Tropa 103: 10 animales ya pesados')
  console.log('\n   📝 LISTA DE FAENA:')
  console.log('      • Tropa 104: 8 animales en lista abierta')
  console.log('\n   🔢 INGRESO A CAJÓN:')
  console.log('      • Tropa 105: 6 animales con garrones 101-106')
  console.log('\n   🥩 ROMANEO:')
  console.log('      • Tropa 106: 4 pendientes + 4 completados')
  console.log('\n   ❄️ STOCK CÁMARAS:')
  console.log('      • Tropa 107: 20 medias reses en cámaras de faena')
  console.log('\n' + '='.repeat(60))
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
