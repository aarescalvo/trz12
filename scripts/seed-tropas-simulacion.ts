/**
 * Script para crear tropas en diferentes etapas de producción
 * Simula el flujo completo del frigorífico
 */

import { db } from '../src/lib/db'

async function main() {
  console.log('🌱 Iniciando seed de tropas simuladas...\n')

  // Limpiar datos existentes
  console.log('🧹 Limpiando datos existentes...')
  await db.romaneo.deleteMany()
  await db.asignacionGarron.deleteMany()
  await db.listaFaenaTropa.deleteMany()
  await db.listaFaena.deleteMany()
  await db.pesajeIndividual.deleteMany()
  await db.animal.deleteMany()
  await db.tropaAnimalCantidad.deleteMany()
  await db.tropa.deleteMany()

  // Crear clientes si no existen
  console.log('👥 Creando clientes...')
  const clientes = await Promise.all([
    db.cliente.upsert({
      where: { cuit: '20-12345678-1' },
      create: { nombre: 'La Estancia S.A.', cuit: '20-12345678-1', esProductor: true, esUsuarioFaena: true },
      update: {}
    }),
    db.cliente.upsert({
      where: { cuit: '20-87654321-9' },
      create: { nombre: 'Ganaderos del Sur S.R.L.', cuit: '20-87654321-9', esProductor: true, esUsuarioFaena: true },
      update: {}
    }),
    db.cliente.upsert({
      where: { cuit: '20-11111111-1' },
      create: { nombre: 'Campo Verde S.A.', cuit: '20-11111111-1', esProductor: true, esUsuarioFaena: true },
      update: {}
    }),
    db.cliente.upsert({
      where: { cuit: '20-22222222-2' },
      create: { nombre: 'El Rosario S.R.L.', cuit: '20-22222222-2', esProductor: true, esUsuarioFaena: true },
      update: {}
    }),
    db.cliente.upsert({
      where: { cuit: '20-33333333-3' },
      create: { nombre: 'Santa María Estancia', cuit: '20-33333333-3', esProductor: true, esUsuarioFaena: true },
      update: {}
    }),
  ])
  console.log(`   ✅ ${clientes.length} clientes creados\n`)

  // Obtener corrales
  const corrales = await db.corral.findMany()
  if (corrales.length === 0) {
    console.log('⚠️  No hay corrales. Creando corrales...')
    for (let i = 1; i <= 10; i++) {
      await db.corral.create({
        data: { nombre: `D${i}`, capacidad: 20, stockBovinos: 0 }
      })
    }
    await db.corral.create({ data: { nombre: 'OBSERVACION', capacidad: 20, stockBovinos: 0 } })
    await db.corral.create({ data: { nombre: 'AISLAMIENTO', capacidad: 10, stockBovinos: 0 } })
  }
  const corralesActualizados = await db.corral.findMany()

  // Obtener numerador
  let numerador = await db.numerador.findUnique({ where: { nombre: 'TROPA_BOVINO' } })
  if (!numerador) {
    numerador = await db.numerador.create({
      data: { nombre: 'TROPA_BOVINO', ultimoNumero: 200, anio: 2026 }
    })
  }

  // ==================== CREAR TROPAS EN DIFERENTES ETAPAS ====================

  const estados = [
    { estado: 'RECIBIDO', cantidad: 2, descripcion: 'Recién llegada, sin pesaje' },
    { estado: 'EN_CORRAL', cantidad: 2, descripcion: 'En corral esperando pesaje individual' },
    { estado: 'PESADO', cantidad: 2, descripcion: 'Pesaje individual completo' },
    { estado: 'LISTO_FAENA', cantidad: 1, descripcion: 'Lista para faena' },
    { estado: 'EN_FAENA', cantidad: 1, descripcion: 'En proceso de faena con garrones asignados' },
    { estado: 'FAENADO', cantidad: 2, descripcion: 'Faenado, pendiente de romaneo' },
  ]

  let garronGlobal = 1
  const hoy = new Date()
  hoy.setHours(6, 0, 0, 0)

  for (const config of estados) {
    console.log(`📦 Creando ${config.cantidad} tropas en estado ${config.estado}...`)
    console.log(`   📝 ${config.descripcion}`)

    for (let i = 0; i < config.cantidad; i++) {
      // Incrementar numerador
      numerador = await db.numerador.update({
        where: { nombre: 'TROPA_BOVINO' },
        data: { ultimoNumero: { increment: 1 } }
      })

      const numeroTropa = numerador.ultimoNumero
      const codigo = `B 2026 ${String(numeroTropa).padStart(4, '0')}`
      const cliente = clientes[Math.floor(Math.random() * clientes.length)]
      const cantidadCabezas = 15 + Math.floor(Math.random() * 10) // 15-24 animales

      // Crear tropa
      const tropa = await db.tropa.create({
        data: {
          numero: numeroTropa,
          codigo,
          codigoSimplificado: `B${String(numeroTropa).padStart(4, '0')}`,
          productorId: cliente.id,
          usuarioFaenaId: cliente.id,
          especie: 'BOVINO',
          dte: `DTE-${100000 + numeroTropa}`,
          guia: `G-CHO26-${String(numeroTropa).padStart(5, '0')}`,
          cantidadCabezas,
          corralId: ['RECIBIDO', 'EN_CORRAL', 'PESADO', 'LISTO_FAENA'].includes(config.estado)
            ? corralesActualizados[Math.floor(Math.random() * corralesActualizados.length)].id
            : null,
          estado: config.estado as any,
          pesoBruto: ['PESADO', 'LISTO_FAENA', 'EN_FAENA', 'FAENADO'].includes(config.estado)
            ? cantidadCabezas * (450 + Math.random() * 100)
            : null,
          pesoTara: ['PESADO', 'LISTO_FAENA', 'EN_FAENA', 'FAENADO'].includes(config.estado)
            ? 12000 + Math.random() * 2000
            : null,
          pesoNeto: ['PESADO', 'LISTO_FAENA', 'EN_FAENA', 'FAENADO'].includes(config.estado)
            ? cantidadCabezas * (450 + Math.random() * 100)
            : null,
          fechaRecepcion: new Date(hoy.getTime() - (6 - estados.indexOf(config)) * 24 * 60 * 60 * 1000),
        }
      })

      // Crear tipos de animales
      const tipos = [
        { tipo: 'VQ', cantidad: Math.floor(cantidadCabezas * 0.4) },
        { tipo: 'NO', cantidad: Math.floor(cantidadCabezas * 0.3) },
        { tipo: 'NT', cantidad: Math.floor(cantidadCabezas * 0.2) },
        { tipo: 'MEJ', cantidad: cantidadCabezas - Math.floor(cantidadCabezas * 0.4) - Math.floor(cantidadCabezas * 0.3) - Math.floor(cantidadCabezas * 0.2) },
      ]

      for (const t of tipos) {
        if (t.cantidad > 0) {
          await db.tropaAnimalCantidad.create({
            data: {
              tropaId: tropa.id,
              tipoAnimal: t.tipo as any,
              cantidad: t.cantidad
            }
          })
        }
      }

      // Crear animales individuales
      const razas = ['Angus', 'Hereford', 'Charolais', 'Brangus', 'Cruza']
      let numeroAnimal = 1

      for (let j = 0; j < cantidadCabezas; j++) {
        const tipoAnimal = tipos.find((_, idx) => {
          const inicio = tipos.slice(0, idx).reduce((sum, t) => sum + t.cantidad, 0)
          return j >= inicio && j < inicio + tipos[idx].cantidad
        })?.tipo || 'VQ'

        const pesoVivo = 380 + Math.random() * 220 // 380-600 kg

        const animal = await db.animal.create({
          data: {
            tropaId: tropa.id,
            numero: numeroAnimal,
            codigo: `${codigo}-${String(numeroAnimal).padStart(3, '0')}`,
            caravana: `A${String(1000 + Math.floor(Math.random() * 9000)).padStart(4, '0')}`,
            tipoAnimal: tipoAnimal as any,
            raza: razas[Math.floor(Math.random() * razas.length)],
            pesoVivo: ['PESADO', 'LISTO_FAENA', 'EN_FAENA', 'FAENADO'].includes(config.estado)
              ? pesoVivo
              : null,
            estado: config.estado === 'FAENADO' ? 'FAENADO' 
                  : config.estado === 'EN_FAENA' ? 'EN_FAENA'
                  : config.estado === 'LISTO_FAENA' ? 'PESADO'
                  : config.estado === 'PESADO' ? 'PESADO'
                  : 'RECIBIDO',
            corralId: tropa.corralId,
          }
        })

        // Crear pesaje individual si corresponde
        if (['PESADO', 'LISTO_FAENA', 'EN_FAENA', 'FAENADO'].includes(config.estado)) {
          await db.pesajeIndividual.create({
            data: {
              animalId: animal.id,
              peso: pesoVivo,
              caravana: animal.caravana,
              fecha: new Date(tropa.fechaRecepcion.getTime() + 2 * 60 * 60 * 1000),
            }
          })
        }

        numeroAnimal++
      }

      // Si está en faena, crear lista de faena y asignaciones de garrón
      if (config.estado === 'EN_FAENA' || config.estado === 'FAENADO') {
        const listaFaena = await db.listaFaena.create({
          data: {
            fecha: hoy,
            estado: 'EN_PROCESO',
            cantidadTotal: cantidadCabezas,
          }
        })

        // Conectar tropa a lista de faena
        await db.listaFaenaTropa.create({
          data: {
            listaFaenaId: listaFaena.id,
            tropaId: tropa.id,
            cantidad: cantidadCabezas
          }
        })

        // Crear asignaciones de garrón
        const animales = await db.animal.findMany({ where: { tropaId: tropa.id } })
        
        for (const animal of animales) {
          const asignacion = await db.asignacionGarron.create({
            data: {
              listaFaenaId: listaFaena.id,
              garron: garronGlobal,
              animalId: animal.id,
              numeroAnimal: animal.numero,
              horaIngreso: new Date(hoy.getTime() + garronGlobal * 5 * 60 * 1000), // 5 min entre animales
            }
          })

          // Si está FAENADO, crear romaneo pendiente
          if (config.estado === 'FAENADO') {
            const pesoMediaIzq = animal.pesoVivo ? (animal.pesoVivo * 0.27 + Math.random() * 10) : null
            const pesoMediaDer = animal.pesoVivo ? (animal.pesoVivo * 0.27 + Math.random() * 10) : null
            
            await db.romaneo.create({
              data: {
                listaFaenaId: listaFaena.id,
                garron: garronGlobal,
                tropaCodigo: tropa.codigo,
                tropaId: tropa.id,
                numeroAnimal: animal.numero,
                tipoAnimal: animal.tipoAnimal,
                raza: animal.raza || undefined,
                caravana: animal.caravana,
                pesoVivo: animal.pesoVivo,
                // Tipificación parcial (el operario la completa)
                denticion: Math.floor(Math.random() * 5) * 2 as any, // 0, 2, 4, 6, 8
                categoria: animal.tipoAnimal as any,
                // Pesos vacíos - el operario los completa
                estado: 'PENDIENTE',
              }
            })
          }

          garronGlobal++
        }
      }

      console.log(`   ✅ Tropa ${codigo}: ${cantidadCabezas} cabezas, cliente: ${cliente.nombre}`)
    }
    console.log()
  }

  // ==================== RESUMEN ====================
  
  console.log('═'.repeat(60))
  console.log('📊 RESUMEN DE TROPAS CREADAS')
  console.log('═'.repeat(60))

  const resumen = await db.tropa.groupBy({
    by: ['estado'],
    _count: { id: true },
    _sum: { cantidadCabezas: true }
  })

  for (const r of resumen) {
    console.log(`   ${r.estado.padEnd(15)} | ${r._count.id} tropas | ${r._sum.cantidadCabezas} animales`)
  }

  const totalAnimales = await db.animal.count()
  const totalRomaneos = await db.romaneo.count()
  const romaneosPendientes = await db.romaneo.count({ where: { estado: 'PENDIENTE' } })

  console.log('═'.repeat(60))
  console.log(`   TOTAL ANIMALES: ${totalAnimales}`)
  console.log(`   TOTAL ROMANEOS: ${totalRomaneos}`)
  console.log(`   ROMANEOS PENDIENTES: ${romaneosPendientes}`)
  console.log('═'.repeat(60))

  console.log('\n✅ Seed completado!\n')
  
  console.log('📌 MÓDULOS PARA PROBAR:')
  console.log('   1. Pesaje Camiones - Ver tropas RECIBIDO')
  console.log('   2. Pesaje Individual - Ver tropas EN_CORRAL')
  console.log('   3. Lista de Faena - Ver tropas LISTO_FAENA')
  console.log('   4. Romaneo - Ver garrones FAENADO pendientes')
  console.log('   5. Stock Cámaras - Ver después de romaneo')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
