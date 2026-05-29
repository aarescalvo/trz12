/**
 * Seed: PlanillaServicioFaena
 * 
 * Carga los 203 registros de la planilla de servicio de faena
 * desde download/planilla_servicio_faena.json
 * 
 * Uso: npx tsx prisma/seed-planilla.ts
 */
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface PlanillaRecord {
  numeroTropa: number
  usuario: string
  cantidadAnimales: number
  kgPie: number
  fechaFaena: string
  kgGancho: number
  rindePorcentaje: number
  precioServicioKg: number
  precioServicioKgConRecupero: null | number
  totalServicioIva: number
  tasaInspeccionVet: number
  arancelIpcva: number
  totalFacturaImp: number
  numeroFactura: string | null
  fechaFactura: string | null
  fechaPago: string | null
  diasPago: number | null
  montoDepositado: number | null
  estadoPago: number
  observaciones: string | null
}

async function main() {
  console.log('=== SEED: PlanillaServicioFaena ===\n')

  // 1. Leer JSON
  const jsonPath = path.join(__dirname, '..', 'download', 'planilla_servicio_faena.json')
  if (!fs.existsSync(jsonPath)) {
    console.error(`ERROR: No se encontró ${jsonPath}`)
    console.error('Asegurate de que el archivo exista en download/planilla_servicio_faena.json')
    process.exit(1)
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8')
  const records: PlanillaRecord[] = JSON.parse(rawData)
  console.log(`Leídos ${records.length} registros del JSON`)

  // 2. Precargar todas las tropas y clientes
  console.log('Precargando tropas y clientes...')
  const allTropas = await prisma.tropa.findMany({
    select: { id: true, numero: true },
    orderBy: { numero: 'asc' },
  })
  const allClientes = await prisma.cliente.findMany({
    select: { id: true, nombre: true },
  })

  const tropaMap = new Map(allTropas.map(t => [t.numero, t.id]))
  const clienteMap = new Map(
    allClientes.map(c => [c.nombre.trim().toUpperCase(), c.id])
  )

  console.log(`Tropas en BD: ${allTropas.length}, Clientes en BD: ${allClientes.length}`)

  // 3. Verificar vinculación
  const noTropa = records.filter(r => !tropaMap.has(r.numeroTropa))
  if (noTropa.length > 0) {
    console.log(`\n⚠️  ${noTropa.length} registros sin tropa en BD:`)
    for (const r of noTropa.slice(0, 10)) {
      console.log(`   Tropa ${r.numeroTropa} - ${r.usuario}`)
    }
    if (noTropa.length > 10) console.log(`   ... y ${noTropa.length - 10} más`)
  }

  const noCliente = records.filter(r => !clienteMap.has(r.usuario.trim().toUpperCase()))
  if (noCliente.length > 0) {
    console.log(`\n⚠️  ${noCliente.length} registros con usuario sin cliente en BD:`)
    const missingUsers = [...new Set(noCliente.map(r => r.usuario))]
    for (const u of missingUsers) {
      console.log(`   "${u}"`)
    }
  }

  // 4. Limpiar datos existentes (opcional)
  const existingCount = await prisma.planillaServicioFaena.count()
  if (existingCount > 0) {
    console.log(`\nYa existen ${existingCount} registros en PlanillaServicioFaena`)
    console.log('Eliminando registros existentes...')
    await prisma.planillaServicioFaena.deleteMany()
    console.log('Registros existentes eliminados.')
  }

  // 5. Crear registros en lotes
  console.log(`\nCreando ${records.length} registros...`)
  const batchSize = 50
  let creados = 0

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)

    for (const rec of batch) {
      const tropaId = tropaMap.get(rec.numeroTropa) || null
      const usuario = rec.usuario.trim()
      const usuarioFaenaId = clienteMap.get(usuario.toUpperCase()) || null

      try {
        await prisma.planillaServicioFaena.create({
          data: {
            tropaId,
            numeroTropa: rec.numeroTropa,
            usuarioFaenaId,
            usuario,
            cantidadAnimales: rec.cantidadAnimales,
            kgPie: rec.kgPie,
            fechaFaena: new Date(rec.fechaFaena + 'T00:00:00'),
            kgGancho: rec.kgGancho,
            rindePorcentaje: rec.rindePorcentaje,
            precioServicioKg: rec.precioServicioKg,
            precioServicioKgConRecupero: rec.precioServicioKgConRecupero,
            totalServicioIva: rec.totalServicioIva,
            tasaInspeccionVet: rec.tasaInspeccionVet,
            arancelIpcva: rec.arancelIpcva,
            totalFacturaImp: rec.totalFacturaImp,
            numeroFactura: rec.numeroFactura,
            fechaFactura: rec.fechaFactura ? new Date(rec.fechaFactura + 'T00:00:00') : null,
            fechaPago: rec.fechaPago ? new Date(rec.fechaPago + 'T00:00:00') : null,
            diasPago: rec.diasPago,
            montoDepositado: rec.montoDepositado,
            estadoPago: rec.estadoPago,
            observaciones: rec.observaciones,
          },
        })
        creados++
      } catch (err: any) {
        console.error(`   ERROR Tropa ${rec.numeroTropa}: ${err.message}`)
      }
    }

    console.log(`   Progreso: ${Math.min(i + batchSize, records.length)}/${records.length}`)
  }

  // 6. Resumen final
  const finalCount = await prisma.planillaServicioFaena.count()
  const conTropa = await prisma.planillaServicioFaena.count({ where: { tropaId: { not: null } } })
  const conCliente = await prisma.planillaServicioFaena.count({ where: { usuarioFaenaId: { not: null } } })
  const conFactura = await prisma.planillaServicioFaena.count({ where: { numeroFactura: { not: null } } })

  console.log(`\n=== RESUMEN FINAL ===`)
  console.log(`Registros creados: ${creados}/${records.length}`)
  console.log(`Total en BD: ${finalCount}`)
  console.log(`Vinculados con Tropa: ${conTropa} (${(conTropa / finalCount * 100).toFixed(1)}%)`)
  console.log(`Vinculados con Cliente: ${conCliente} (${(conCliente / finalCount * 100).toFixed(1)}%)`)
  console.log(`Con factura: ${conFactura}`)

  const totalFacturado = await prisma.planillaServicioFaena.aggregate({
    _sum: { totalFacturaImp: true, montoDepositado: true, estadoPago: true },
  })
  console.log(`Total facturado: $${totalFacturado._sum.totalFacturaImp?.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`)
  console.log(`Total depositado: $${totalFacturado._sum.montoDepositado?.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`)
  console.log(`Saldo pendiente: $${totalFacturado._sum.estadoPago?.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`)

  console.log('\n=== SEED COMPLETADO ===')
}

main()
  .catch(err => {
    console.error('Error fatal:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
