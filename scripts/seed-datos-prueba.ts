// Script para crear datos de prueba en cada módulo del sistema frigorífico
// Ejecutar con: bun run scripts/seed-datos-prueba.ts

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Iniciando seed de datos de prueba...\n')

  // 1. Crear operador admin si no existe
  let admin = await prisma.operador.findFirst({ where: { usuario: 'admin' } })
  if (!admin) {
    const hashedPassword = await hash('admin123', 10)
    admin = await prisma.operador.create({
      data: {
        nombre: 'Administrador',
        usuario: 'admin',
        password: hashedPassword,
        rol: 'ADMINISTRADOR',
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
    console.log('✅ Operador admin creado')
  } else {
    console.log('✅ Operador admin ya existe')
  }

  // 2. Crear clientes (productor y usuario faena)
  let productor = await prisma.cliente.findFirst({ where: { cuit: '20-12345678-9' } })
  if (!productor) {
    productor = await prisma.cliente.create({
      data: {
        nombre: 'Estancia La Pampa SA',
        cuit: '20-12345678-9',
        direccion: 'Ruta 5 Km 45',
        localidad: 'Santa Rosa',
        provincia: 'La Pampa',
        telefono: '02954-456789',
        esProductor: true
      }
    })
    console.log('✅ Productor creado')
  }

  let usuarioFaena = await prisma.cliente.findFirst({ where: { cuit: '20-98765432-1' } })
  if (!usuarioFaena) {
    usuarioFaena = await prisma.cliente.create({
      data: {
        nombre: 'Carnicería Don José',
        cuit: '20-98765432-1',
        matricula: 'MAT-1234',
        direccion: 'Av. Principal 123',
        localidad: 'General Pico',
        provincia: 'La Pampa',
        telefono: '02302-123456',
        esUsuarioFaena: true
      }
    })
    console.log('✅ Usuario Faena creado')
  }

  // 3. Crear corrales
  const corrales = await Promise.all([
    prisma.corral.upsert({
      where: { nombre: 'Corral 1' },
      update: {},
      create: { nombre: 'Corral 1', capacidad: 50, stockBovinos: 0 }
    }),
    prisma.corral.upsert({
      where: { nombre: 'Corral 2' },
      update: {},
      create: { nombre: 'Corral 2', capacidad: 30, stockBovinos: 0 }
    }),
    prisma.corral.upsert({
      where: { nombre: 'Corral 3' },
      update: {},
      create: { nombre: 'Corral 3', capacidad: 40, stockBovinos: 0 }
    })
  ])
  console.log('✅ Corrales creados')

  // 4. Crear cámaras frigoríficas
  const camaras = await Promise.all([
    prisma.camara.upsert({
      where: { nombre: 'Cámara 1' },
      update: {},
      create: { nombre: 'Cámara 1', tipo: 'FAENA', capacidad: 5000 }
    }),
    prisma.camara.upsert({
      where: { nombre: 'Cámara 2' },
      update: {},
      create: { nombre: 'Cámara 2', tipo: 'FAENA', capacidad: 4000 }
    }),
    prisma.camara.upsert({
      where: { nombre: 'Cámara 3' },
      update: {},
      create: { nombre: 'Cámara 3', tipo: 'DEPOSITO', capacidad: 6000 }
    })
  ])
  console.log('✅ Cámaras creadas')

  // 5. Crear tipificador
  let tipificador = await prisma.tipificador.findFirst()
  if (!tipificador) {
    tipificador = await prisma.tipificador.create({
      data: { nombre: 'Juan Tipificador' }
    })
  }

  // ============================================
  // ESCENARIO 1: Tropa en Pesaje de Camiones
  // ============================================
  const tropa1 = await prisma.tropa.create({
    data: {
      numero: 101,
      codigo: 'B 2026 0101',
      especie: 'BOVINO',
      cantidadCabezas: 15,
      estado: 'RECIBIDO',
      productorId: productor.id,
      usuarioFaenaId: usuarioFaena.id,
      corralId: corrales[0].id,
      operadorId: admin.id,
      dte: 'DTE-101',
      guia: 'GUIA-101',
      fechaRecepcion: new Date()
    }
  })
  console.log('✅ Tropa B 2026 0101 creada (EN_RECEPCION - Pesaje Camiones)')

  // ============================================
  // ESCENARIO 2: Tropa en Pesaje Individual
  // ============================================
  const tropa2 = await prisma.tropa.create({
    data: {
      numero: 102,
      codigo: 'B 2026 0102',
      especie: 'BOVINO',
      cantidadCabezas: 12,
      estado: 'EN_PESAJE',
      pesoBruto: 8500,
      pesoTara: 1500,
      pesoNeto: 7000,
      productorId: productor.id,
      usuarioFaenaId: usuarioFaena.id,
      corralId: corrales[1].id,
      operadorId: admin.id,
      dte: 'DTE-102',
      guia: 'GUIA-102',
      fechaRecepcion: new Date(Date.now() - 86400000) // Ayer
    }
  })
  
  // Crear algunos animales pesados y otros no
  for (let i = 1; i <= 12; i++) {
    await prisma.animal.create({
      data: {
        numero: i,
        codigo: `B20260102-${String(i).padStart(3, '0')}`,
        tropaId: tropa2.id,
        tipoAnimal: i <= 8 ? 'NO' : 'VA',
        pesoVivo: i <= 8 ? Math.floor(420 + Math.random() * 100) : null, // 8 pesados, 4 sin pesar
        estado: i <= 8 ? 'PESADO' : 'RECIBIDO'
      }
    })
  }
  console.log('✅ Tropa B 2026 0102 creada (EN_PESAJE - Pesaje Individual) - 8 pesados, 4 pendientes')

  // ============================================
  // ESCENARIO 3: Tropa en Lista de Faena
  // ============================================
  const tropa3 = await prisma.tropa.create({
    data: {
      numero: 103,
      codigo: 'B 2026 0103',
      especie: 'BOVINO',
      cantidadCabezas: 10,
      estado: 'EN_FAENA',
      pesoBruto: 7200,
      pesoTara: 1200,
      pesoNeto: 6000,
      productorId: productor.id,
      usuarioFaenaId: usuarioFaena.id,
      corralId: corrales[2].id,
      operadorId: admin.id,
      dte: 'DTE-103',
      guia: 'GUIA-103',
      fechaRecepcion: new Date(Date.now() - 172800000) // Hace 2 días
    }
  })
  
  // Animales todos pesados
  for (let i = 1; i <= 10; i++) {
    await prisma.animal.create({
      data: {
        numero: i,
        codigo: `B20260103-${String(i).padStart(3, '0')}`,
        tropaId: tropa3.id,
        tipoAnimal: i <= 6 ? 'VA' : 'NO',
        pesoVivo: 450 + Math.floor(Math.random() * 80),
        estado: 'PESADO'
      }
    })
  }
  console.log('✅ Tropa B 2026 0103 creada (EN_FAENA - Lista de Faena)')

  // ============================================
  // ESCENARIO 4: Tropa con Ingreso a Cajón en proceso
  // Animales SIN ASIGNAR para probar VB Romaneo
  // ============================================
  const tropa4 = await prisma.tropa.create({
    data: {
      numero: 104,
      codigo: 'B 2026 0104',
      especie: 'BOVINO',
      cantidadCabezas: 8,
      estado: 'EN_FAENA',
      pesoBruto: 5800,
      pesoTara: 1000,
      pesoNeto: 4800,
      productorId: productor.id,
      usuarioFaenaId: usuarioFaena.id,
      corralId: corrales[0].id,
      operadorId: admin.id,
      dte: 'DTE-104',
      guia: 'GUIA-104',
      fechaRecepcion: new Date(Date.now() - 259200000) // Hace 3 días
    }
  })
  
  // Crear 8 animales
  for (let i = 1; i <= 8; i++) {
    await prisma.animal.create({
      data: {
        numero: i,
        codigo: `B20260104-${String(i).padStart(3, '0')}`,
        tropaId: tropa4.id,
        tipoAnimal: i <= 4 ? 'NO' : 'VA',
        pesoVivo: 480 + Math.floor(Math.random() * 60),
        estado: 'PESADO'
      }
    })
  }

  // Crear lista de faena
  const listaFaena4 = await prisma.listaFaena.create({
    data: {
      numero: 104,
      fecha: new Date(),
      estado: 'EN_PROCESO',
      cantidadTotal: 8,
      vbRomaneo: false
    }
  })

  // Asignar tropa a lista de faena
  await prisma.listaFaenaTropa.create({
    data: {
      listaFaenaId: listaFaena4.id,
      tropaId: tropa4.id,
      corralId: corrales[0].id,
      cantidad: 8
    }
  })

  // Crear garrones - SOLO ASIGNAMOS 5 de 8 (3 quedan sin asignar)
  for (let i = 1; i <= 8; i++) {
    const asignacion = await prisma.asignacionGarron.create({
      data: {
        listaFaenaId: listaFaena4.id,
        garron: i,
        tropaCodigo: tropa4.codigo,
        horaIngreso: new Date()
      }
    })
    
    // Solo asignamos animal a los primeros 5 garrones
    if (i <= 5) {
      const animal = await prisma.animal.findFirst({
        where: { tropaId: tropa4.id, numero: i }
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
  console.log('✅ Tropa B 2026 0104 creada (EN_FAENA - Ingreso Cajón)')
  console.log('   → 5 garrones asignados, 3 SIN ASIGNAR para probar VB Romaneo')

  // ============================================
  // ESCENARIO 5: Romaneo finalizado con problemas
  // - Algunos animales sin asignar
  // - Algunos con rinde > 70% (ERROR)
  // ============================================
  const tropa5 = await prisma.tropa.create({
    data: {
      numero: 105,
      codigo: 'B 2026 0105',
      especie: 'BOVINO',
      cantidadCabezas: 10,
      estado: 'FAENADO',
      pesoBruto: 7500,
      pesoTara: 1200,
      pesoNeto: 6300,
      productorId: productor.id,
      usuarioFaenaId: usuarioFaena.id,
      corralId: corrales[1].id,
      operadorId: admin.id,
      dte: 'DTE-105',
      guia: 'GUIA-105',
      fechaRecepcion: new Date(Date.now() - 345600000) // Hace 4 días
    }
  })
  
  // Crear 10 animales con pesos variados
  for (let i = 1; i <= 10; i++) {
    await prisma.animal.create({
      data: {
        numero: i,
        codigo: `B20260105-${String(i).padStart(3, '0')}`,
        tropaId: tropa5.id,
        tipoAnimal: i <= 5 ? 'NO' : 'VA',
        pesoVivo: 420 + Math.floor(Math.random() * 100),
        estado: 'FAENADO'
      }
    })
  }

  // Crear lista de faena
  const listaFaena5 = await prisma.listaFaena.create({
    data: {
      numero: 105,
      fecha: new Date(),
      estado: 'CERRADA',
      cantidadTotal: 10,
      vbRomaneo: false
    }
  })

  await prisma.listaFaenaTropa.create({
    data: {
      listaFaenaId: listaFaena5.id,
      tropaId: tropa5.id,
      corralId: corrales[1].id,
      cantidad: 10
    }
  })

  // Crear garrones con asignaciones y romaneos
  for (let i = 1; i <= 10; i++) {
    const animal = await prisma.animal.findFirst({
      where: { tropaId: tropa5.id, numero: i }
    })
    
    const asignacion = await prisma.asignacionGarron.create({
      data: {
        listaFaenaId: listaFaena5.id,
        garron: i,
        tropaCodigo: tropa5.codigo,
        tieneMediaDer: true,
        tieneMediaIzq: true,
        completado: true,
        horaIngreso: new Date()
      }
    })

    // Animales 3 y 7 QUEDAN SIN ASIGNAR
    if (i !== 3 && i !== 7 && animal) {
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

    // Crear romaneos con diferentes escenarios
    let pesoVivoRomaneo = animal?.pesoVivo || 450
    let pesoDer: number
    let pesoIzq: number

    // Casos especiales para rinde alto (> 70%)
    if (i === 4 || i === 8) {
      // Rinde alto simulando error de asignación
      // Peso vivo bajo pero medias pesadas = rinde alto
      pesoVivoRomaneo = 300 // Error: peso vivo muy bajo
      pesoDer = 140
      pesoIzq = 138
    } else if (i === 6) {
      // Otro caso de rinde alto
      pesoVivoRomaneo = 280
      pesoDer = 130
      pesoIzq = 128
    } else {
      // Rinde normal (50-60%)
      pesoDer = Math.floor(pesoVivoRomaneo * 0.28 + Math.random() * 20)
      pesoIzq = Math.floor(pesoVivoRomaneo * 0.28 + Math.random() * 20)
    }

    const pesoTotal = pesoDer + pesoIzq
    const rinde = pesoVivoRomaneo > 0 ? (pesoTotal / pesoVivoRomaneo) * 100 : 0

    const romaneo = await prisma.romaneo.create({
      data: {
        listaFaenaId: listaFaena5.id,
        fecha: new Date(),
        garron: i,
        tropaCodigo: tropa5.codigo,
        numeroAnimal: i === 3 || i === 7 ? null : i,
        tipoAnimal: animal?.tipoAnimal as any,
        pesoVivo: pesoVivoRomaneo,
        denticion: ['2', '4', '6', '8'][Math.floor(Math.random() * 4)],
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
          codigo: `MED-${Date.now()}-${i}-DER`,
          estado: 'EN_CAMARA',
          camaraId: camaras[0].id
        },
        {
          romaneoId: romaneo.id,
          lado: 'IZQUIERDA',
          peso: pesoIzq,
          sigla: 'A',
          codigo: `MED-${Date.now()}-${i}-IZQ`,
          estado: 'EN_CAMARA',
          camaraId: camaras[0].id
        }
      ]
    })
  }
  console.log('✅ Tropa B 2026 0105 creada (FAENADO - Romaneo con problemas)')
  console.log('   → Garrones 3 y 7 SIN ASIGNAR')
  console.log('   → Garrones 4, 6 y 8 con RINDE ALTO (>70%)')

  // ============================================
  // ESCENARIO 6: Stock en cámaras para movimiento
  // ============================================
  
  // Crear stock inicial en cámara 1
  await prisma.stockMediaRes.create({
    data: {
      camaraId: camaras[0].id,
      tropaCodigo: tropa5.codigo,
      especie: 'BOVINO',
      cantidad: 20,
      pesoTotal: 2800,
      fechaIngreso: new Date()
    }
  })

  // Crear algunas medias adicionales en cámara 2
  const tropa6 = await prisma.tropa.create({
    data: {
      numero: 106,
      codigo: 'B 2026 0106',
      especie: 'BOVINO',
      cantidadCabezas: 5,
      estado: 'FAENADO',
      pesoBruto: 3500,
      pesoTara: 600,
      pesoNeto: 2900,
      productorId: productor.id,
      usuarioFaenaId: usuarioFaena.id,
      corralId: corrales[2].id,
      operadorId: admin.id,
      dte: 'DTE-106',
      guia: 'GUIA-106',
      fechaRecepcion: new Date(Date.now() - 432000000) // Hace 5 días
    }
  })

  for (let i = 1; i <= 5; i++) {
    const animal = await prisma.animal.create({
      data: {
        numero: i,
        codigo: `B20260106-${String(i).padStart(3, '0')}`,
        tropaId: tropa6.id,
        tipoAnimal: 'VA',
        pesoVivo: 500,
        estado: 'FAENADO'
      }
    })

    const romaneo = await prisma.romaneo.create({
      data: {
        fecha: new Date(Date.now() - 86400000),
        garron: 100 + i,
        tropaCodigo: tropa6.codigo,
        numeroAnimal: i,
        tipoAnimal: 'VA',
        pesoVivo: 500,
        pesoMediaDer: 145,
        pesoMediaIzq: 143,
        pesoTotal: 288,
        rinde: 57.6,
        estado: 'PENDIENTE',
        operadorId: admin.id
      }
    })

    await prisma.mediaRes.createMany({
      data: [
        {
          romaneoId: romaneo.id,
          lado: 'DERECHA',
          peso: 145,
          sigla: 'A',
          codigo: `MED-OLD-${i}-DER`,
          estado: 'EN_CAMARA',
          camaraId: camaras[1].id
        },
        {
          romaneoId: romaneo.id,
          lado: 'IZQUIERDA',
          peso: 143,
          sigla: 'A',
          codigo: `MED-OLD-${i}-IZQ`,
          estado: 'EN_CAMARA',
          camaraId: camaras[1].id
        }
      ]
    })
  }

  await prisma.stockMediaRes.create({
    data: {
      camaraId: camaras[1].id,
      tropaCodigo: tropa6.codigo,
      especie: 'BOVINO',
      cantidad: 10,
      pesoTotal: 1440,
      fechaIngreso: new Date(Date.now() - 86400000)
    }
  })

  console.log('✅ Stock en cámaras creado')
  console.log('   → Cámara 1: 20 medias (tropa B 2026 0105)')
  console.log('   → Cámara 2: 10 medias (tropa B 2026 0106)')

  // ============================================
  // Resumen final
  // ============================================
  console.log('\n' + '='.repeat(60))
  console.log('📋 RESUMEN DE DATOS DE PRUEBA CREADOS')
  console.log('='.repeat(60))
  console.log('\n🏁 ESCENARIOS DISPONIBLES:')
  console.log('   1. Pesaje Camiones: B 2026 0101 (15 animales en recepción)')
  console.log('   2. Pesaje Individual: B 2026 0102 (12 animales, 8 pesados, 4 pendientes)')
  console.log('   3. Lista de Faena: B 2026 0103 (10 animales listos para faena)')
  console.log('   4. Ingreso Cajón: B 2026 0104 (8 garrones, 3 SIN ASIGNAR)')
  console.log('   5. Romaneo VB: B 2026 0105 (10 garrones con problemas)')
  console.log('      - Garrones 3 y 7: SIN ASIGNAR')
  console.log('      - Garrones 4, 6, 8: RINDE ALTO >70%')
  console.log('   6. Stock Cámaras: Medias reses para movimiento')
  console.log('\n✅ Seed completado exitosamente!')
  console.log('🔑 Usuario: admin / Password: admin123')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
