/**
 * Script simplificado para crear tropas simuladas rápidamente
 */

import { db } from '../src/lib/db'

async function main() {
  console.log('🌱 Creando tropas de simulación...\n')

  // Crear clientes
  const clientes = await Promise.all([
    db.cliente.upsert({
      where: { cuit: 'SIM-001' },
      create: { nombre: 'Estancia Demo S.A.', cuit: 'SIM-001', esProductor: true, esUsuarioFaena: true },
      update: {}
    }),
    db.cliente.upsert({
      where: { cuit: 'SIM-002' },
      create: { nombre: 'Campo Test S.R.L.', cuit: 'SIM-002', esProductor: true, esUsuarioFaena: true },
      update: {}
    }),
  ])

  // Obtener corrales
  let corrales = await db.corral.findMany()
  if (corrales.length === 0) {
    for (let i = 1; i <= 10; i++) {
      await db.corral.create({ data: { nombre: `D${i}`, capacidad: 20 } })
    }
    corrales = await db.corral.findMany()
  }

  // Crear tipificador
  const tipificador = await db.tipificador.upsert({
    where: { matricula: 'DEMO-001' },
    create: { nombre: 'Juan', apellido: 'Pérez', matricula: 'DEMO-001' },
    update: {}
  })

  let garron = 1
  const hoy = new Date()

  // TROPAS POR ESTADO
  const configs = [
    { estado: 'RECIBIDO', count: 2, animales: 15 },
    { estado: 'EN_CORRAL', count: 1, animales: 18 },
    { estado: 'PESADO', count: 1, animales: 20 },
    { estado: 'LISTO_FAENA', count: 1, animales: 16 },
    { estado: 'FAENADO', count: 2, animales: 12 }, // Para romaneo
  ]

  for (const config of configs) {
    for (let i = 0; i < config.count; i++) {
      const cliente = clientes[i % clientes.length]
      const corral = corrales[i % corrales.length]
      const numero = 300 + i + configs.indexOf(config) * 10
      const codigo = `B 2026 ${String(numero).padStart(4, '0')}`

      // Crear tropa
      const tropa = await db.tropa.create({
        data: {
          numero,
          codigo,
          codigoSimplificado: `B${numero}`,
          productorId: cliente.id,
          usuarioFaenaId: cliente.id,
          especie: 'BOVINO',
          dte: `DTE-${numero}`,
          guia: `G-CHO26-${numero}`,
          cantidadCabezas: config.animales,
          corralId: corral.id,
          estado: config.estado as any,
          pesoBruto: config.estado !== 'RECIBIDO' ? config.animales * 480 : null,
          pesoNeto: config.estado !== 'RECIBIDO' ? config.animales * 480 : null,
          fechaRecepcion: new Date(hoy.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        }
      })

      // Crear animales
      for (let j = 1; j <= config.animales; j++) {
        const peso = 400 + Math.random() * 150
        
        await db.animal.create({
          data: {
            tropaId: tropa.id,
            numero: j,
            codigo: `${codigo}-${j}`,
            caravana: `C${1000 + j}`,
            tipoAnimal: j % 3 === 0 ? 'VQ' : j % 3 === 1 ? 'NO' : 'NT',
            raza: 'Angus',
            pesoVivo: config.estado !== 'RECIBIDO' ? peso : null,
            estado: config.estado === 'FAENADO' ? 'FAENADO' : 'RECIBIDO',
            corralId: corral.id,
          }
        })

        // Si está faenado, crear romaneo pendiente
        if (config.estado === 'FAENADO') {
          await db.romaneo.create({
            data: {
              garron: garron++,
              tropaCodigo: tropa.codigo,
              tropaId: tropa.id,
              numeroAnimal: j,
              tipoAnimal: j % 3 === 0 ? 'VQ' : j % 3 === 1 ? 'NO' : 'NT',
              raza: 'Angus',
              caravana: `C${1000 + j}`,
              pesoVivo: peso,
              denticion: (j % 5) * 2 as any,
              categoria: j % 3 === 0 ? 'VQ' : j % 3 === 1 ? 'NO' : 'NT',
              estado: 'PENDIENTE',
            }
          })
        }
      }

      console.log(`✅ Tropa ${codigo} - ${config.estado} - ${config.animales} animales`)
    }
  }

  const total = await db.tropa.count()
  const animales = await db.animal.count()
  const romaneos = await db.romaneo.count()

  console.log(`\n📊 Total: ${total} tropas, ${animales} animales, ${romaneos} romaneos pendientes`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
