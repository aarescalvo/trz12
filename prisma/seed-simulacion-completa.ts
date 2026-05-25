import { db } from '../src/lib/db'
import { Prisma } from '@prisma/client'

async function seedSimulacionCompleta() {
  console.log('🌱 Iniciando simulación completa de datos...\n')

  try {
    // ==================== 1. CLIENTES ====================
    console.log('📋 Creando clientes...')
    const clientes = await Promise.all([
      db.cliente.upsert({
        where: { cuit: '20-12345678-1' },
        update: {},
        create: {
          nombre: 'Carnicería Don Pedro',
          cuit: '20-12345678-1',
          dni: '12345678',
          direccion: 'Av. San Martín 1234',
          localidad: 'Neuquén',
          provincia: 'Neuquén',
          telefono: '299-444-5555',
          email: 'donpedro@email.com',
          razonSocial: 'Pedro Gómez e Hijos SRL',
          condicionIva: 'RI',
          esProductor: true,
          esUsuarioFaena: true
        }
      }),
      db.cliente.upsert({
        where: { cuit: '20-87654321-2' },
        update: {},
        create: {
          nombre: 'Frigorífico del Sur',
          cuit: '20-87654321-2',
          direccion: 'Ruta 22 Km 45',
          localidad: 'General Roca',
          provincia: 'Río Negro',
          telefono: '298-555-6666',
          email: 'frigorifico@email.com',
          razonSocial: 'Frigorífico del Sur SA',
          condicionIva: 'RI',
          esProductor: false,
          esUsuarioFaena: true
        }
      }),
      db.cliente.upsert({
        where: { cuit: '27-11223344-5' },
        update: {},
        create: {
          nombre: 'Estancia Santa María',
          cuit: '27-11223344-5',
          direccion: 'Camino Rural 15',
          localidad: 'Chimpay',
          provincia: 'Río Negro',
          telefono: '298-111-2222',
          email: 'estancia@email.com',
          razonSocial: 'Santa María Ganadera SA',
          condicionIva: 'RI',
          esProductor: true,
          esUsuarioFaena: false
        }
      }),
      db.cliente.upsert({
        where: { cuit: '20-55667788-9' },
        update: {},
        create: {
          nombre: 'Supermercado El Progreso',
          cuit: '20-55667788-9',
          direccion: 'Belgrano 789',
          localidad: 'Villa Regina',
          provincia: 'Río Negro',
          telefono: '298-333-4444',
          email: 'progreso@email.com',
          razonSocial: 'El Progreso SRL',
          condicionIva: 'MT',
          esProductor: false,
          esUsuarioFaena: true
        }
      })
    ])
    console.log(`   ✅ ${clientes.length} clientes creados\n`)

    // ==================== 2. CORRALES ====================
    console.log('📋 Creando corrales...')
    const corrales = await Promise.all([
      db.corral.upsert({
        where: { nombre: 'Corral A-1' },
        update: {},
        create: { nombre: 'Corral A-1', capacidad: 50, stockBovinos: 25, observaciones: 'Corral principal' }
      }),
      db.corral.upsert({
        where: { nombre: 'Corral A-2' },
        update: {},
        create: { nombre: 'Corral A-2', capacidad: 40, stockBovinos: 18 }
      }),
      db.corral.upsert({
        where: { nombre: 'Corral B-1' },
        update: {},
        create: { nombre: 'Corral B-1', capacidad: 60, stockBovinos: 35 }
      }),
      db.corral.upsert({
        where: { nombre: 'Corral B-2' },
        update: {},
        create: { nombre: 'Corral B-2', capacidad: 30, stockBovinos: 12 }
      })
    ])
    console.log(`   ✅ ${corrales.length} corrales creados\n`)

    // ==================== 3. CAMARAS ====================
    console.log('📋 Creando cámaras...')
    const camaras = await Promise.all([
      db.camara.upsert({
        where: { nombre: 'Cámara Faena 1' },
        update: {},
        create: { nombre: 'Cámara Faena 1', tipo: 'FAENA', capacidad: 100, observaciones: 'Cámara principal de faena' }
      }),
      db.camara.upsert({
        where: { nombre: 'Cámara Faena 2' },
        update: {},
        create: { nombre: 'Cámara Faena 2', tipo: 'FAENA', capacidad: 80 }
      }),
      db.camara.upsert({
        where: { nombre: 'Cámara Cuarteo' },
        update: {},
        create: { nombre: 'Cámara Cuarteo', tipo: 'CUARTEO', capacidad: 2000 }
      }),
      db.camara.upsert({
        where: { nombre: 'Depósito 1' },
        update: {},
        create: { nombre: 'Depósito 1', tipo: 'DEPOSITO', capacidad: 5000 }
      })
    ])
    console.log(`   ✅ ${camaras.length} cámaras creadas\n`)

    // ==================== 4. OPERADOR ====================
    console.log('📋 Creando operador admin...')
    const adminPassword = await import('bcrypt').then(b => b.hash('admin123', 10))
    const operador = await db.operador.upsert({
      where: { usuario: 'admin' },
      update: {},
      create: {
        nombre: 'Administrador',
        usuario: 'admin',
        password: adminPassword,
        rol: 'ADMINISTRADOR',
        email: 'admin@solemar.com',
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
    console.log(`   ✅ Operador admin creado\n`)

    // ==================== 5. TIPIFICADOR ====================
    console.log('📋 Creando tipificador...')
    const tipificador = await db.tipificador.upsert({
      where: { matricula: 'TIP-001' },
      update: {},
      create: {
        nombre: 'Juan',
        apellido: 'Pérez',
        matricula: 'TIP-001',
        numero: '1'
      }
    })
    console.log(`   ✅ Tipificador creado\n`)

    // ==================== 6. PRODUCTOS VENDIBLES ====================
    console.log('📋 Creando productos vendibles...')
    const productosVendibles = await Promise.all([
      db.productoVendible.upsert({
        where: { codigo: 'MR001' },
        update: {},
        create: {
          codigo: 'MR001',
          nombre: 'Media Res Bovina',
          descripcion: 'Media res de bovino completa',
          categoria: 'PRODUCTO_CARNICO',
          tipoVenta: 'POR_KG',
          unidadMedida: 'KG',
          precioBase: 3500,
          precioArs: 3500,
          moneda: 'ARS',
          alicuotaIva: 10.5,
          activo: true
        }
      }),
      db.productoVendible.upsert({
        where: { codigo: 'CD001' },
        update: {},
        create: {
          codigo: 'CD001',
          nombre: 'Cuarto Delantero',
          descripcion: 'Cuarto delantero de bovino',
          categoria: 'PRODUCTO_CARNICO',
          tipoVenta: 'POR_KG',
          unidadMedida: 'KG',
          precioBase: 3200,
          precioArs: 3200,
          moneda: 'ARS',
          alicuotaIva: 10.5,
          activo: true
        }
      }),
      db.productoVendible.upsert({
        where: { codigo: 'CT001' },
        update: {},
        create: {
          codigo: 'CT001',
          nombre: 'Cuarto Trasero',
          descripcion: 'Cuarto trasero de bovino',
          categoria: 'PRODUCTO_CARNICO',
          tipoVenta: 'POR_KG',
          unidadMedida: 'KG',
          precioBase: 3800,
          precioArs: 3800,
          moneda: 'ARS',
          alicuotaIva: 10.5,
          activo: true
        }
      }),
      db.productoVendible.upsert({
        where: { codigo: 'SF001' },
        update: {},
        create: {
          codigo: 'SF001',
          nombre: 'Servicio Faena Bovino',
          descripcion: 'Servicio de faena para bovinos',
          categoria: 'SERVICIO_FAENA',
          tipoVenta: 'FIJO',
          unidadMedida: 'UN',
          precioBase: 15000,
          precioArs: 15000,
          moneda: 'ARS',
          alicuotaIva: 10.5,
          activo: true
        }
      }),
      db.productoVendible.upsert({
        where: { codigo: 'MN001' },
        update: {},
        create: {
          codigo: 'MN001',
          nombre: 'Menudencias',
          descripcion: 'Menudencias de bovino',
          categoria: 'MENUDENCIA',
          tipoVenta: 'POR_KG',
          unidadMedida: 'KG',
          precioBase: 2500,
          precioArs: 2500,
          moneda: 'ARS',
          alicuotaIva: 10.5,
          activo: true
        }
      })
    ])
    console.log(`   ✅ ${productosVendibles.length} productos vendibles creados\n`)

    // ==================== 7. TROPAS CON ANIMALES ====================
    console.log('📋 Creando tropas y animales...')
    const tropas = []
    const animales = []
    const hoy = new Date()
    const clienteProductor = clientes.find(c => c.esProductor)!
    const clienteUsuarioFaena = clientes.find(c => c.esUsuarioFaena)!
    const corral = corrales[0]

    for (let i = 1; i <= 3; i++) {
      const fechaRecepcion = new Date(hoy)
      fechaRecepcion.setDate(fechaRecepcion.getDate() - (i * 2))

      const codigo = `B ${fechaRecepcion.getFullYear()} ${String(i).padStart(4, '0')}`
      
      const tropa = await db.tropa.upsert({
        where: { numero: i },
        update: {
          estado: i === 1 ? 'FAENADO' : i === 2 ? 'EN_FAENA' : 'RECIBIDO',
        },
        create: {
          codigo,
          codigoSimplificado: `B${String(i).padStart(4, '0')}`,
          numero: i,
          especie: 'BOVINO',
          productorId: clienteProductor?.id,
          usuarioFaenaId: clienteUsuarioFaena?.id,
          dte: `DTE-${1000 + i}`,
          guia: `GUIA-${2000 + i}`,
          cantidadCabezas: 10 + (i * 2),
          corralId: corral.id,
          estado: i === 1 ? 'FAENADO' : i === 2 ? 'EN_FAENA' : 'RECIBIDO',
          pesoBruto: 4500 + (i * 500),
          pesoTara: 800 + (i * 50),
          pesoNeto: 3700 + (i * 450),
          fechaRecepcion
        }
      })
      tropas.push(tropa)

      // Crear animales para cada tropa (usar upsert para evitar duplicados)
      for (let j = 1; j <= tropa.cantidadCabezas; j++) {
        const animalCodigo = `${codigo}-${String(j).padStart(3, '0')}`
        const animal = await db.animal.upsert({
          where: { codigo: animalCodigo },
          update: {
            estado: i === 1 ? 'FAENADO' : 'RECIBIDO',
          },
          create: {
            tropaId: tropa.id,
            numero: j,
            codigo: animalCodigo,
            tipoAnimal: j % 3 === 0 ? 'NO' : j % 3 === 1 ? 'VA' : 'TO',
            pesoVivo: 420 + Math.floor(Math.random() * 80),
            estado: i === 1 ? 'FAENADO' : 'RECIBIDO',
            corralId: corral.id
          }
        })
        animales.push(animal)
      }
    }
    console.log(`   ✅ ${tropas.length} tropas creadas`)
    console.log(`   ✅ ${animales.length} animales creados\n`)

    // ==================== 8. LISTA FAENA Y ROMANEOS ====================
    console.log('📋 Creando lista de faena y romaneos...')
    const tropaFaenada = tropas[0]
    
    const listaFaena = await db.listaFaena.upsert({
      where: { numero: 1 },
      update: {
        cantidadTotal: tropaFaenada.cantidadCabezas,
      },
      create: {
        numero: 1,
        fecha: new Date(hoy.getTime() - 2 * 24 * 60 * 60 * 1000),
        estado: 'CERRADA',
        cantidadTotal: tropaFaenada.cantidadCabezas,
        supervisorId: operador.id,
        observaciones: 'Faena completa del día'
      }
    })

    // Crear romaneos (usar upsert para evitar duplicados)
    const romaneos = []
    let garronCounter = 1
    const animalesFaenados = animales.filter(a => a.tropaId === tropaFaenada.id)
    
    for (const animal of animalesFaenados) {
      const pesoIzq = 110 + Math.floor(Math.random() * 30)
      const pesoDer = 108 + Math.floor(Math.random() * 30)
      const pesoTotal = pesoIzq + pesoDer
      const pesoVivo = animal.pesoVivo?.toNumber?.() || animal.pesoVivo || 450
      const rinde = (pesoTotal / pesoVivo) * 100

      const romaneo = await db.romaneo.upsert({
        where: { 
          listaFaenaId_garron: { listaFaenaId: listaFaena.id, garron: garronCounter }
        },
        update: {
          pesoMediaIzq: pesoIzq,
          pesoMediaDer: pesoDer,
          pesoTotal,
          rinde,
        },
        create: {
          listaFaenaId: listaFaena.id,
          fecha: new Date(hoy.getTime() - 2 * 24 * 60 * 60 * 1000),
          garron: garronCounter,
          tropaCodigo: tropaFaenada.codigo,
          numeroAnimal: animal.numero,
          tipoAnimal: animal.tipoAnimal as any,
          pesoVivo: pesoVivo,
          denticion: String(Math.floor(Math.random() * 8)),
          tipificadorId: tipificador.id,
          pesoMediaIzq: pesoIzq,
          pesoMediaDer: pesoDer,
          pesoTotal,
          rinde,
          estado: 'CONFIRMADO',
          operadorId: operador.id
        }
      })
      garronCounter++
      romaneos.push(romaneo)

      // Crear medias reses (usar upsert para evitar duplicados)
      const codigoIzq = `${tropaFaenada.codigo}-${String(animal.numero).padStart(3, '0')}-I`
      const codigoDer = `${tropaFaenada.codigo}-${String(animal.numero).padStart(3, '0')}-D`
      
      await db.mediaRes.upsert({
        where: { codigo: codigoIzq },
        update: { peso: pesoIzq },
        create: {
          romaneoId: romaneo.id,
          lado: 'IZQUIERDA',
          peso: pesoIzq,
          sigla: 'A',
          codigo: codigoIzq,
          estado: 'EN_CAMARA',
          camaraId: camaras[0].id,
          usuarioFaenaId: clienteUsuarioFaena?.id
        }
      })
      await db.mediaRes.upsert({
        where: { codigo: codigoDer },
        update: { peso: pesoDer },
        create: {
          romaneoId: romaneo.id,
          lado: 'DERECHA',
          peso: pesoDer,
          sigla: 'A',
          codigo: codigoDer,
          estado: 'EN_CAMARA',
          camaraId: camaras[0].id,
          usuarioFaenaId: clienteUsuarioFaena?.id
        }
      })
    }
    console.log(`   ✅ Lista de faena creada`)
    console.log(`   ✅ ${romaneos.length} romaneos creados\n`)

    // ==================== 9. STOCK CAMARAS ====================
    console.log('📋 Actualizando stock de cámaras...')
    await db.stockMediaRes.upsert({
      where: {
        camaraId_tropaCodigo_especie: {
          camaraId: camaras[0].id,
          tropaCodigo: tropaFaenada.codigo,
          especie: 'BOVINO'
        }
      },
      update: {
        cantidad: animalesFaenados.length * 2,
        pesoTotal: romaneos.reduce((sum, r) => sum + (r.pesoTotal?.toNumber?.() || r.pesoTotal || 0), 0)
      },
      create: {
        camaraId: camaras[0].id,
        tropaCodigo: tropaFaenada.codigo,
        especie: 'BOVINO',
        cantidad: animalesFaenados.length * 2,
        pesoTotal: romaneos.reduce((sum, r) => sum + (r.pesoTotal?.toNumber?.() || r.pesoTotal || 0), 0)
      }
    })
    console.log(`   ✅ Stock de cámaras actualizado\n`)

    // ==================== 10. DESPACHOS ====================
    console.log('📋 Creando despachos/remitos...')
    const despachos = []
    const fechaDespacho = new Date(hoy.getTime() - 1 * 24 * 60 * 60 * 1000)
    
    const despacho = await db.despacho.upsert({
      where: { numero: 1 },
      update: {
        kgTotal: romaneos.reduce((sum, r) => sum + (r.pesoTotal?.toNumber?.() || r.pesoTotal || 0), 0) / 2,
        cantidadMedias: animalesFaenados.length,
      },
      create: {
        numero: 1,
        fecha: fechaDespacho,
        destino: clienteUsuarioFaena?.nombre || 'Cliente',
        clienteId: clienteUsuarioFaena?.id,
        kgTotal: romaneos.reduce((sum, r) => sum + (r.pesoTotal?.toNumber?.() || r.pesoTotal || 0), 0) / 2,
        cantidadMedias: animalesFaenados.length,
        estado: 'PENDIENTE_FACTURACION',
        operadorId: operador.id
      }
    })
    despachos.push(despacho)
    console.log(`   ✅ ${despachos.length} despachos creados\n`)

    // ==================== 11. FACTURAS ====================
    console.log('📋 Creando facturas...')
    const facturas = []
    
    // Factura 1 - Cliente 1
    const factura1 = await db.factura.upsert({
      where: { numero: '0001-00000001' },
      update: {
        subtotal: 150000,
        iva: 31500,
        total: 181500,
      },
      create: {
        numero: '0001-00000001',
        numeroInterno: 1,
        clienteId: clientes[0].id,
        fecha: new Date(hoy.getTime() - 5 * 24 * 60 * 60 * 1000),
        subtotal: 150000,
        iva: 31500,
        total: 181500,
        estado: 'PAGADA',
        condicionVenta: 'CONTADO',
        detalles: {
          create: [
            {
              tipoProducto: 'MEDIA_RES',
              descripcion: 'Media Res Bovina',
              cantidad: 300,
              unidad: 'KG',
              precioUnitario: 500,
              precioConfirmado: true,
              subtotal: 150000
            }
          ]
        }
      }
    })
    facturas.push(factura1)

    // Factura 2 - Pendiente
    const factura2 = await db.factura.upsert({
      where: { numero: '0001-00000002' },
      update: {
        subtotal: 200000,
        iva: 42000,
        total: 242000,
      },
      create: {
        numero: '0001-00000002',
        numeroInterno: 2,
        clienteId: clientes[1].id,
        fecha: new Date(hoy.getTime() - 2 * 24 * 60 * 60 * 1000),
        subtotal: 200000,
        iva: 42000,
        total: 242000,
        estado: 'PENDIENTE',
        condicionVenta: 'CUENTA_CORRIENTE',
        detalles: {
          create: [
            {
              tipoProducto: 'MEDIA_RES',
              descripcion: 'Media Res Bovina Premium',
              cantidad: 400,
              unidad: 'KG',
              precioUnitario: 500,
              precioConfirmado: true,
              subtotal: 200000
            }
          ]
        }
      }
    })
    facturas.push(factura2)

    console.log(`   ✅ ${facturas.length} facturas creadas\n`)

    // ==================== RESUMEN ====================
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('✅ SIMULACIÓN COMPLETADA EXITOSAMENTE')
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('\n📊 Resumen de datos creados:')
    console.log(`   • Clientes: ${clientes.length}`)
    console.log(`   • Corrales: ${corrales.length}`)
    console.log(`   • Cámaras: ${camaras.length}`)
    console.log(`   • Productos Vendibles: ${productosVendibles.length}`)
    console.log(`   • Tropas: ${tropas.length}`)
    console.log(`   • Animales: ${animales.length}`)
    console.log(`   • Romaneos: ${romaneos.length}`)
    console.log(`   • Despachos: ${despachos.length}`)
    console.log(`   • Facturas: ${facturas.length}`)
    console.log('\n👤 Usuario de acceso:')
    console.log('   Usuario: admin')
    console.log('   Contraseña: admin123')
    console.log('═══════════════════════════════════════════════════════════════')

  } catch (error) {
    console.error('❌ Error en simulación:', error)
    throw error
  }
}

// Ejecutar
seedSimulacionCompleta()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
