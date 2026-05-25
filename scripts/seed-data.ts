/**
 * Script para crear datos de prueba en TrazaSole
 * Ejecutar con: bun run scripts/seed-data.ts
 */

import { db } from '../src/lib/db'
import bcrypt from 'bcrypt'

async function main() {
  console.log('🌱 Iniciando carga de datos de prueba...\n')

  // 1. Configuración del Frigorífico
  console.log('📍 Creando configuración del frigorífico...')
  const config = await db.configuracionFrigorifico.upsert({
    where: { id: 'default' },
    create: {
      nombre: 'Solemar Alimentaria',
      direccion: 'Ruta Provincial 123, Km 5, San Martín, Mendoza',
      numeroEstablecimiento: '12.345',
      cuit: '23-12345678-9',
      numeroMatricula: 'MAT-2024-001',
      emailHost: 'smtp.office365.com',
      emailPuerto: 587,
      emailHabilitado: false
    },
    update: {}
  })
  console.log('   ✓ Configuración creada\n')

  // 2. Corrales
  console.log('🏠 Creando corrales...')
  const corrales = await Promise.all([
    db.corral.upsert({
      where: { nombre: 'Corral 1' },
      create: { nombre: 'Corral 1', capacidad: 50, stockBovinos: 0, stockEquinos: 0 },
      update: {}
    }),
    db.corral.upsert({
      where: { nombre: 'Corral 2' },
      create: { nombre: 'Corral 2', capacidad: 60, stockBovinos: 0, stockEquinos: 0 },
      update: {}
    }),
    db.corral.upsert({
      where: { nombre: 'Corral 3' },
      create: { nombre: 'Corral 3', capacidad: 40, stockBovinos: 0, stockEquinos: 0 },
      update: {}
    }),
    db.corral.upsert({
      where: { nombre: 'Corral 4' },
      create: { nombre: 'Corral 4', capacidad: 55, stockBovinos: 0, stockEquinos: 0 },
      update: {}
    }),
    db.corral.upsert({
      where: { nombre: 'Corral 5' },
      create: { nombre: 'Corral 5', capacidad: 45, stockBovinos: 0, stockEquinos: 0 },
      update: {}
    }),
    db.corral.upsert({
      where: { nombre: 'Corral 6' },
      create: { nombre: 'Corral 6', capacidad: 30, stockBovinos: 0, stockEquinos: 0 },
      update: {}
    })
  ])
  console.log(`   ✓ ${corrales.length} corrales creados\n`)

  // 3. Cámaras
  console.log('❄️ Creando cámaras...')
  const camaras = await Promise.all([
    db.camara.upsert({
      where: { nombre: 'Cámara Faena 1' },
      create: { nombre: 'Cámara Faena 1', tipo: 'FAENA', capacidad: 100 },
      update: {}
    }),
    db.camara.upsert({
      where: { nombre: 'Cámara Faena 2' },
      create: { nombre: 'Cámara Faena 2', tipo: 'FAENA', capacidad: 80 },
      update: {}
    }),
    db.camara.upsert({
      where: { nombre: 'Cámara Cuarteo' },
      create: { nombre: 'Cámara Cuarteo', tipo: 'CUARTEO', capacidad: 2000 },
      update: {}
    }),
    db.camara.upsert({
      where: { nombre: 'Cámara Depósito' },
      create: { nombre: 'Cámara Depósito', tipo: 'DEPOSITO', capacidad: 5000 },
      update: {}
    })
  ])
  console.log(`   ✓ ${camaras.length} cámaras creadas\n`)

  // 4. Tipificadores
  console.log('👤 Creando tipificadores...')
  const tipificadores = await Promise.all([
    db.tipificador.upsert({
      where: { matricula: 'MAT-001' },
      create: { nombre: 'Carlos', apellido: 'Gómez', matricula: 'MAT-001', numero: '1' },
      update: {}
    }),
    db.tipificador.upsert({
      where: { matricula: 'MAT-002' },
      create: { nombre: 'María', apellido: 'Rodríguez', matricula: 'MAT-002', numero: '2' },
      update: {}
    }),
    db.tipificador.upsert({
      where: { matricula: 'MAT-003' },
      create: { nombre: 'Juan', apellido: 'Pérez', matricula: 'MAT-003', numero: '3' },
      update: {}
    })
  ])
  console.log(`   ✓ ${tipificadores.length} tipificadores creados\n`)

  // 5. Clientes (Productores y Usuarios de Faena)
  console.log('👥 Creando clientes...')
  const clientes = await Promise.all([
    db.cliente.upsert({
      where: { cuit: '20-12345678-1' },
      create: {
        nombre: 'Estancia Los Álamos',
        cuit: '20-12345678-1',
        dni: '12345678',
        direccion: 'Ruta 7, Km 45, San Luis',
        localidad: 'San Luis',
        provincia: 'San Luis',
        telefono: '02652-456789',
        email: 'losalamosestancia@email.com',
        esProductor: true,
        esUsuarioFaena: false,
        condicionIva: 'RI'
      },
      update: {}
    }),
    db.cliente.upsert({
      where: { cuit: '20-23456789-2' },
      create: {
        nombre: 'Ganadería del Valle',
        cuit: '20-23456789-2',
        direccion: 'Av. Libertador 1234, Mendoza',
        localidad: 'Mendoza',
        provincia: 'Mendoza',
        telefono: '0261-4123456',
        email: 'ganaderiavalle@email.com',
        esProductor: true,
        esUsuarioFaena: true,
        condicionIva: 'RI'
      },
      update: {}
    }),
    db.cliente.upsert({
      where: { cuit: '27-34567890-3' },
      create: {
        nombre: 'Carnicería Don José',
        cuit: '27-34567890-3',
        direccion: 'Belgrano 456, Godoy Cruz',
        localidad: 'Godoy Cruz',
        provincia: 'Mendoza',
        telefono: '0261-4987654',
        email: 'carniceriajose@email.com',
        esProductor: false,
        esUsuarioFaena: true,
        condicionIva: 'RI'
      },
      update: {}
    }),
    db.cliente.upsert({
      where: { cuit: '20-45678901-4' },
      create: {
        nombre: 'Supermercados del Centro',
        cuit: '20-45678901-4',
        direccion: 'Patricias Mendocinas 789, Mendoza',
        localidad: 'Mendoza',
        provincia: 'Mendoza',
        telefono: '0261-4321098',
        email: 'supercentro@email.com',
        esProductor: false,
        esUsuarioFaena: true,
        condicionIva: 'RI'
      },
      update: {}
    }),
    db.cliente.upsert({
      where: { cuit: '23-56789012-5' },
      create: {
        nombre: 'Frigorífico Regional SA',
        cuit: '23-56789012-5',
        direccion: 'Industrial 321, Luján de Cuyo',
        localidad: 'Luján de Cuyo',
        provincia: 'Mendoza',
        telefono: '0261-4963210',
        email: 'frigoregional@email.com',
        esProductor: false,
        esUsuarioFaena: true,
        condicionIva: 'RI'
      },
      update: {}
    }),
    db.cliente.upsert({
      where: { cuit: '20-67890123-6' },
      create: {
        nombre: 'Campo La Esperanza',
        cuit: '20-67890123-6',
        direccion: 'Ruta 40, Km 120, Malargüe',
        localidad: 'Malargüe',
        provincia: 'Mendoza',
        telefono: '02627-456123',
        email: 'campoesperanza@email.com',
        esProductor: true,
        esUsuarioFaena: false,
        condicionIva: 'CF'
      },
      update: {}
    }),
    db.cliente.upsert({
      where: { cuit: '27-78901234-7' },
      create: {
        nombre: 'Distribuidora Norte',
        cuit: '27-78901234-7',
        direccion: 'San Martín 654, Las Heras',
        localidad: 'Las Heras',
        provincia: 'Mendoza',
        telefono: '0261-4569870',
        email: 'distnorte@email.com',
        esProductor: false,
        esUsuarioFaena: true,
        condicionIva: 'MT'
      },
      update: {}
    }),
    db.cliente.upsert({
      where: { cuit: '20-89012345-8' },
      create: {
        nombre: 'Estancia San Pedro',
        cuit: '20-89012345-8',
        direccion: 'Camino Real s/n, San Carlos',
        localidad: 'San Carlos',
        provincia: 'Mendoza',
        telefono: '02622-452310',
        email: 'estanciasanpedro@email.com',
        esProductor: true,
        esUsuarioFaena: false,
        condicionIva: 'RI'
      },
      update: {}
    }),
    db.cliente.upsert({
      where: { cuit: '23-90123456-9' },
      create: {
        nombre: 'Exportadora Andina',
        cuit: '23-90123456-9',
        direccion: 'Parque Industrial, Guaymallén',
        localidad: 'Guaymallén',
        provincia: 'Mendoza',
        telefono: '0261-4456789',
        email: 'exportandina@email.com',
        esProductor: false,
        esUsuarioFaena: true,
        condicionIva: 'RI'
      },
      update: {}
    }),
    db.cliente.upsert({
      where: { cuit: '20-01234567-0' },
      create: {
        nombre: 'Ganadería El Oeste',
        cuit: '20-01234567-0',
        direccion: 'Ruta 143, Km 30, San Rafael',
        localidad: 'San Rafael',
        provincia: 'Mendoza',
        telefono: '02627-421098',
        email: 'ganaderiaoeste@email.com',
        esProductor: true,
        esUsuarioFaena: true,
        condicionIva: 'RI'
      },
      update: {}
    }),
    db.cliente.upsert({
      where: { cuit: '27-12345098-1' },
      create: {
        nombre: 'Carnicería Premium',
        cuit: '27-12345098-1',
        direccion: 'Chacabuco 234, Mendoza',
        localidad: 'Mendoza',
        provincia: 'Mendoza',
        telefono: '0261-4201020',
        email: 'carniceriapremium@email.com',
        esProductor: false,
        esUsuarioFaena: true,
        condicionIva: 'RI'
      },
      update: {}
    })
  ])
  console.log(`   ✓ ${clientes.length} clientes creados\n`)

  // 6. Transportistas
  console.log('🚛 Creando transportistas...')
  const transportistas = await Promise.all([
    db.transportista.upsert({
      where: { cuit: '20-11111111-1' },
      create: {
        nombre: 'Transportes Rodríguez',
        cuit: '20-11111111-1',
        direccion: 'Parque Industrial, Mendoza',
        telefono: '0261-4111111'
      },
      update: {}
    }),
    db.transportista.upsert({
      where: { cuit: '20-22222222-2' },
      create: {
        nombre: 'Logística del Sur',
        cuit: '20-22222222-2',
        direccion: 'San Rafael, Mendoza',
        telefono: '02627-422222'
      },
      update: {}
    }),
    db.transportista.upsert({
      where: { cuit: '23-33333333-3' },
      create: {
        nombre: 'Transportes El Norte',
        cuit: '23-33333333-3',
        direccion: 'San Juan 123, San Juan',
        telefono: '0264-4333333'
      },
      update: {}
    })
  ])
  console.log(`   ✓ ${transportistas.length} transportistas creados\n`)

  // 7. Operadores adicionales
  console.log('👤 Creando operadores...')
  const hashedPassword = await bcrypt.hash('operador123', 10)
  
  const operadores = await Promise.all([
    db.operador.upsert({
      where: { usuario: 'supervisor' },
      create: {
        nombre: 'Roberto Supervisor',
        usuario: 'supervisor',
        password: hashedPassword,
        rol: 'SUPERVISOR',
        pinSupervisor: '1234',
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
        puedeConfiguracion: false
      },
      update: {}
    }),
    db.operador.upsert({
      where: { usuario: 'balanza' },
      create: {
        nombre: 'Operador Balanza',
        usuario: 'balanza',
        password: hashedPassword,
        rol: 'OPERADOR',
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
      },
      update: {}
    }),
    db.operador.upsert({
      where: { usuario: 'faena' },
      create: {
        nombre: 'Operador Faena',
        usuario: 'faena',
        password: hashedPassword,
        rol: 'OPERADOR',
        puedePesajeCamiones: false,
        puedePesajeIndividual: false,
        puedeMovimientoHacienda: true,
        puedeListaFaena: true,
        puedeRomaneo: true,
        puedeIngresoCajon: true,
        puedeMenudencias: true,
        puedeStock: true,
        puedeReportes: true,
        puedeCCIR: false,
        puedeFacturacion: false,
        puedeConfiguracion: false
      },
      update: {}
    }),
    db.operador.upsert({
      where: { usuario: 'admin2' },
      create: {
        nombre: 'María Admin',
        usuario: 'admin2',
        password: hashedPassword,
        rol: 'ADMINISTRADOR',
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
      },
      update: {}
    })
  ])
  console.log(`   ✓ ${operadores.length} operadores creados\n`)

  // 8. Productos
  console.log('📦 Creando productos...')
  const productos = await Promise.all([
    db.producto.upsert({
      where: { codigo_especie: { codigo: '001', especie: 'BOVINO' } },
      create: { codigo: '001', nombre: 'Media Res Bovina', especie: 'BOVINO', tipoRotulo: 'MEDIA_RES', diasConservacion: 21 },
      update: {}
    }),
    db.producto.upsert({
      where: { codigo_especie: { codigo: '002', especie: 'BOVINO' } },
      create: { codigo: '002', nombre: 'Cuarto Delantero Bovino', especie: 'BOVINO', tipoRotulo: 'CUARTO', diasConservacion: 21 },
      update: {}
    }),
    db.producto.upsert({
      where: { codigo_especie: { codigo: '003', especie: 'BOVINO' } },
      create: { codigo: '003', nombre: 'Cuarto Trasero Bovino', especie: 'BOVINO', tipoRotulo: 'CUARTO', diasConservacion: 21 },
      update: {}
    }),
    db.producto.upsert({
      where: { codigo_especie: { codigo: '010', especie: 'BOVINO' } },
      create: { codigo: '010', nombre: 'Hígado Bovino', especie: 'BOVINO', tipoRotulo: 'MENUDENCIA', diasConservacion: 7 },
      update: {}
    }),
    db.producto.upsert({
      where: { codigo_especie: { codigo: '011', especie: 'BOVINO' } },
      create: { codigo: '011', nombre: 'Corazón Bovino', especie: 'BOVINO', tipoRotulo: 'MENUDENCIA', diasConservacion: 7 },
      update: {}
    }),
    db.producto.upsert({
      where: { codigo_especie: { codigo: '012', especie: 'BOVINO' } },
      create: { codigo: '012', nombre: 'Riñón Bovino', especie: 'BOVINO', tipoRotulo: 'MENUDENCIA', diasConservacion: 7 },
      update: {}
    }),
    db.producto.upsert({
      where: { codigo_especie: { codigo: '101', especie: 'EQUINO' } },
      create: { codigo: '101', nombre: 'Media Res Equina', especie: 'EQUINO', tipoRotulo: 'MEDIA_RES', diasConservacion: 14 },
      update: {}
    }),
    db.producto.upsert({
      where: { codigo_especie: { codigo: '110', especie: 'EQUINO' } },
      create: { codigo: '110', nombre: 'Hígado Equino', especie: 'EQUINO', tipoRotulo: 'MENUDENCIA', diasConservacion: 7 },
      update: {}
    })
  ])
  console.log(`   ✓ ${productos.length} productos creados\n`)

  // 9. Tipos de Menudencia
  console.log('🥩 Creando tipos de menudencia...')
  const tiposMenudencia = await Promise.all([
    db.tipoMenudencia.upsert({
      where: { nombre: 'Hígado' },
      create: { nombre: 'Hígado', observaciones: 'Hígado completo' },
      update: {}
    }),
    db.tipoMenudencia.upsert({
      where: { nombre: 'Corazón' },
      create: { nombre: 'Corazón', observaciones: 'Corazón completo' },
      update: {}
    }),
    db.tipoMenudencia.upsert({
      where: { nombre: 'Riñón' },
      create: { nombre: 'Riñón', observaciones: 'Riñones en par' },
      update: {}
    }),
    db.tipoMenudencia.upsert({
      where: { nombre: 'Lengua' },
      create: { nombre: 'Lengua' },
      update: {}
    }),
    db.tipoMenudencia.upsert({
      where: { nombre: 'Molleja' },
      create: { nombre: 'Molleja' },
      update: {}
    }),
    db.tipoMenudencia.upsert({
      where: { nombre: 'Cabeza' },
      create: { nombre: 'Cabeza', observaciones: 'Cabeza completa para consumo' },
      update: {}
    })
  ])
  console.log(`   ✓ ${tiposMenudencia.length} tipos de menudencia creados\n`)

  // 10. Numeradores
  console.log('🔢 Creando numeradores...')
  const añoActual = new Date().getFullYear()
  await Promise.all([
    db.numerador.upsert({
      where: { nombre: 'TROPA_BOVINO' },
      create: { nombre: 'TROPA_BOVINO', ultimoNumero: 0, anio: añoActual },
      update: { anio: añoActual }
    }),
    db.numerador.upsert({
      where: { nombre: 'TROPA_EQUINO' },
      create: { nombre: 'TROPA_EQUINO', ultimoNumero: 0, anio: añoActual },
      update: { anio: añoActual }
    }),
    db.numerador.upsert({
      where: { nombre: 'TICKET_PESAJE' },
      create: { nombre: 'TICKET_PESAJE', ultimoNumero: 0 },
      update: {}
    }),
    db.numerador.upsert({
      where: { nombre: 'LISTA_FAENA' },
      create: { nombre: 'LISTA_FAENA', ultimoNumero: 0 },
      update: {}
    }),
    db.numerador.upsert({
      where: { nombre: 'FACTURA' },
      create: { nombre: 'FACTURA', ultimoNumero: 0 },
      update: {}
    })
  ])
  console.log('   ✓ Numeradores creados\n')

  // 11. Códigos de Especie
  console.log('📋 Creando códigos de especie...')
  await Promise.all([
    db.codigoEspecie.upsert({
      where: { codigo: '1' },
      create: { codigo: '1', nombre: 'Bovino' },
      update: {}
    }),
    db.codigoEspecie.upsert({
      where: { codigo: '2' },
      create: { codigo: '2', nombre: 'Equino' },
      update: {}
    })
  ])
  console.log('   ✓ Códigos de especie creados\n')

  // 12. Crear una tropa de ejemplo con animales
  console.log('🐄 Creando tropa de ejemplo...')
  
  // Buscar cliente usuario de faena y productor
  const usuarioFaena = clientes.find(c => c.esUsuarioFaena) || clientes[0]
  const productor = clientes.find(c => c.esProductor) || clientes[1]
  const corralDisponible = corrales[0]

  // Obtener número de tropa
  const numeradorBovino = await db.numerador.findUnique({ where: { nombre: 'TROPA_BOVINO' } })
  const numeroTropa = (numeradorBovino?.ultimoNumero || 0) + 1
  const codigoTropa = `B ${añoActual} ${String(numeroTropa).padStart(4, '0')}`

  const tropa = await db.tropa.create({
    data: {
      numero: numeroTropa,
      codigo: codigoTropa,
      codigoSimplificado: `B${String(numeroTropa).padStart(4, '0')}`,
      especie: 'BOVINO',
      dte: `DTE-${añoActual}-${String(numeroTropa).padStart(6, '0')}`,
      guia: `GUIA-${añoActual}-${String(numeroTropa).padStart(6, '0')}`,
      cantidadCabezas: 5,
      productorId: productor.id,
      usuarioFaenaId: usuarioFaena.id,
      corralId: corralDisponible.id,
      estado: 'EN_CORRAL'
    }
  })

  // Actualizar numerador
  await db.numerador.update({
    where: { nombre: 'TROPA_BOVINO' },
    data: { ultimoNumero: numeroTropa }
  })

  // Crear animales
  const tiposAnimales = ['VA', 'NO', 'VQ', 'VA', 'NO']
  for (let i = 0; i < 5; i++) {
    await db.animal.create({
      data: {
        tropaId: tropa.id,
        numero: i + 1,
        codigo: `${codigoTropa}-${String(i + 1).padStart(3, '0')}`,
        tipoAnimal: tiposAnimales[i] as 'VA' | 'NO' | 'VQ',
        pesoVivo: 420 + Math.floor(Math.random() * 100),
        estado: 'RECIBIDO',
        corralId: corralDisponible.id
      }
    })
  }

  // Actualizar stock del corral
  await db.corral.update({
    where: { id: corralDisponible.id },
    data: { stockBovinos: 5 }
  })

  console.log(`   ✓ Tropa ${codigoTropa} creada con 5 animales\n`)

  // 13. Crear factura de ejemplo
  console.log('📄 Creando factura de ejemplo...')
  const factura = await db.factura.create({
    data: {
      numero: '0001-00000001',
      numeroInterno: 1,
      clienteId: usuarioFaena.id,
      subtotal: 500000,
      iva: 105000,
      total: 605000,
      estado: 'PENDIENTE',
      condicionVenta: 'CUENTA_CORRIENTE',
      detalles: {
        create: [
          {
            tipoProducto: 'MEDIA_RES',
            descripcion: 'Media Res Bovina - Tropa B20250001',
            cantidad: 10,
            unidad: 'KG',
            precioUnitario: 45000,
            subtotal: 450000,
            tropaCodigo: codigoTropa
          },
          {
            tipoProducto: 'MENUDENCIA',
            descripcion: 'Hígado Bovino',
            cantidad: 5,
            unidad: 'KG',
            precioUnitario: 10000,
            subtotal: 50000
          }
        ]
      }
    }
  })
  console.log(`   ✓ Factura ${factura.numero} creada\n`)

  console.log('✅ Datos de prueba cargados exitosamente!\n')
  console.log('📋 CREDENCIALES DE ACCESO:')
  console.log('   ┌─────────────────────────────────────┐')
  console.log('   │ admin / admin123        (Admin)     │')
  console.log('   │ admin2 / operador123    (Admin)     │')
  console.log('   │ supervisor / operador123 (Supervisor)│')
  console.log('   │ balanza / operador123   (Operador)  │')
  console.log('   │ faena / operador123     (Operador)  │')
  console.log('   └─────────────────────────────────────┘')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
