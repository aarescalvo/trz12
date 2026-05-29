/**
 * Seed script: Carga 203 tropas del DETALLE a la DB
 * Uso: npx prisma db seed (o node prisma/seed-detalle.ts desde la raíz del proyecto)
 * 
 * Este script:
 * 1. Lee el JSON de /download/detalle_tropas.json
 * 2. Busca cada tropa por código "B 2026 XXXX" en la tabla Tropa
 * 3. Crea el registro DetalleTropaFaena vinculado
 * 4. Registra precios históricos en PrecioHistorial
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface TropaData {
  tropa: number
  mes: string | null
  usuario: string
  cantAnimales: number
  precioServicio: number
  kgGancho: number
  valorServicioFaena: number
  servicioDespostada: number
  totalOperacion: number
  factCompraMenudencia: number
  factVentaMenudencia: number
  ventaChinchulin: number
  montoHueso: number
  montoDesperdicio: number
  montoGrasa: number
  montoCuero: number
  montoGrasaDreasin: number
}

// Convertir número de tropa a código: 1 → "B 2026 0001"
function tropaNumToCodigo(num: number): string {
  return `B 2026 ${String(num).padStart(4, '0')}`
}

async function main() {
  console.log('=== SEED DETALLE TROPA FAENA ===\n')

  // 1. Leer JSON
  const jsonPath = path.resolve(process.cwd(), 'download/detalle_tropas.json')
  if (!fs.existsSync(jsonPath)) {
    console.error(`ERROR: No se encontró ${jsonPath}`)
    console.error('Primero ejecutá el script de extracción de Excel')
    process.exit(1)
  }

  const rawData: TropaData[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  console.log(`Leídas ${rawData.length} tropas del JSON`)

  // 2. Buscar tropas en la DB
  let encontradas = 0
  let noEncontradas = 0
  let creadas = 0
  let existentes = 0

  for (const item of rawData) {
    const codigo = tropaNumToCodigo(item.tropa)
    
    // Buscar tropa por código
    const tropa = await prisma.tropa.findUnique({
      where: { codigo },
      select: { id: true, codigo: true, numero: true }
    })

    if (!tropa) {
      if (noEncontradas < 10) {
        console.log(`  ⚠ Tropa ${item.tropa} (${codigo}) NO encontrada en DB`)
      }
      noEncontradas++
      continue
    }

    // Verificar si ya existe detalle
    const existente = await prisma.detalleTropaFaena.findUnique({
      where: { tropaId: tropa.id }
    })

    if (existente) {
      existentes++
      continue
    }

    // Crear detalle
    try {
      await prisma.detalleTropaFaena.create({
        data: {
          tropaId: tropa.id,
          numeroTropa: item.tropa,
          mes: item.mes || undefined,
          usuario: item.usuario.trim(),
          cantidadAnimales: item.cantAnimales,
          precioServicio: item.precioServicio,
          kgGancho: item.kgGancho,
          valorServicioFaena: item.valorServicioFaena,
          servicioDespostada: item.servicioDespostada || 0,
          factCompraMenudencia: item.factCompraMenudencia || 0,
          factVentaMenudencia: item.factVentaMenudencia || 0,
          ventaChinchulin: item.ventaChinchulin || 0,
          montoHueso: item.montoHueso || 0,
          montoDesperdicio: item.montoDesperdicio || 0,
          montoGrasa: item.montoGrasa || 0,
          montoCuero: item.montoCuero || 0,
          montoGrasaDressing: item.montoGrasaDreasin || 0,
        }
      })
      creadas++
      encontradas++
    } catch (err: any) {
      console.error(`  ✗ Error creando detalle para tropa ${item.tropa}: ${err.message}`)
    }
  }

  console.log(`\n=== RESULTADO ===`)
  console.log(`  Tropas encontradas en DB: ${encontradas}`)
  console.log(`  Detalles creados: ${creadas}`)
  console.log(`  Ya existían: ${existentes}`)
  console.log(`  Tropas NO encontradas en DB: ${noEncontradas}`)

  // 3. Registrar precios históricos
  console.log(`\n=== PRECIOS HISTÓRICOS ===`)

  // Determinar los tiers y sus períodos según la data
  const precios: { monto: number; desde: string }[] = [
    { monto: 335, desde: '2025-01-01' },
    { monto: 420, desde: '2025-05-01' },
    { monto: 440, desde: '2025-07-01' },
    { monto: 500, desde: '2025-09-01' },
  ]

  // Buscar TipoServicio FAENA o crear
  let tipoServicioFaena = await prisma.tipoServicio.findFirst({ where: { codigo: 'FAENA' } })
  if (!tipoServicioFaena) {
    tipoServicioFaena = await prisma.tipoServicio.create({
      data: {
        codigo: 'FAENA',
        nombre: 'Servicio de Faena por Kg (sin recupero)',
        descripcion: 'Precio del servicio de faena por kilogramo en gancho, sin recupero',
        unidad: 'KG',
        seFactura: true,
        porcentajeIva: 21,
        orden: 1,
      }
    })
    console.log(`  TipoServicio FAENA creado: ${tipoServicioFaena.id}`)
  }

  // Buscar TipoServicio DESPOSTADA o crear
  let tipoServicioDespostada = await prisma.tipoServicio.findFirst({ where: { codigo: 'DESPOSTADA' } })
  if (!tipoServicioDespostada) {
    tipoServicioDespostada = await prisma.tipoServicio.create({
      data: {
        codigo: 'DESPOSTADA',
        nombre: 'Servicio de Despostada',
        descripcion: 'Servicio de despostada adicional',
        unidad: 'KG',
        seFactura: true,
        porcentajeIva: 21,
        orden: 2,
      }
    })
    console.log(`  TipoServicio DESPOSTADA creado: ${tipoServicioDespostada.id}`)
  }

  // Registrar precios para cada usuario que tenga tropas
  const usuarios = [...new Set(rawData.map(d => d.usuario.trim()))]

  for (const usuarioNombre of usuarios) {
    const cliente = await prisma.cliente.findFirst({
      where: { nombre: { contains: usuarioNombre, mode: 'insensitive' } }
    })

    if (!cliente) {
      console.log(`  ⚠ Cliente "${usuarioNombre}" no encontrado en DB`)
      continue
    }

    // Obtener los distintos precios que tuvo este usuario
    const preciosUsuario = [...new Set(
      rawData.filter(d => d.usuario.trim() === usuarioNombre).map(d => d.precioServicio)
    )].filter(p => p > 0).sort()

    for (const precio of preciosUsuario) {
      // Verificar si ya existe un PrecioServicio vigente para este cliente+tipo
      const existente = await prisma.precioServicio.findFirst({
        where: {
          clienteId: cliente.id,
          tipoServicioId: tipoServicioFaena.id,
          precio: precio,
          fechaHasta: null,
        }
      })

      if (existente) continue

      // Determinar fecha desde según el tier
      const tierInfo = precios.find(p => p.monto === precio)
      const fechaDesde = tierInfo ? new Date(tierInfo.desde) : new Date('2025-01-01')

      // Si hay un precio anterior vigente, cerrarlo
      await prisma.precioServicio.updateMany({
        where: {
          clienteId: cliente.id,
          tipoServicioId: tipoServicioFaena.id,
          fechaHasta: null,
          precio: { not: precio },
        },
        data: { fechaHasta: fechaDesde }
      })

      await prisma.precioServicio.create({
        data: {
          clienteId: cliente.id,
          tipoServicioId: tipoServicioFaena.id,
          precio: precio,
          fechaDesde: fechaDesde,
          observaciones: `Precio faena $${precio}/kg - Importado de planilla DETALLE`,
        }
      })

      // Registrar en historial
      await prisma.precioHistorial.create({
        data: {
          tipoServicioId: tipoServicioFaena.id,
          tipoServicioNombre: tipoServicioFaena.nombre,
          clienteId: cliente.id,
          clienteNombre: cliente.nombre,
          precioNuevo: precio,
          precioAnterior: precio === 335 ? 0 : precios[precios.findIndex(p => p.monto === precio) - 1]?.monto || 0,
          fechaDesde: fechaDesde,
          motivo: 'Importación planilla DETALLE',
          tipoCambio: 'CREACION',
        }
      })

      console.log(`  ✓ ${cliente.nombre}: $${precio}/kg desde ${fechaDesde.toISOString().split('T')[0]}`)
    }
  }

  console.log(`\n=== SEED COMPLETADO ===`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
