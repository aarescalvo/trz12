/**
 * Importar datos a PostgreSQL desde JSON exportado
 * Uso: bun run db:import <archivo.json>
 */

import { db } from '../src/lib/db'
import fs from 'fs/promises'

interface ExportData {
  operadores?: unknown[]
  clientes?: unknown[]
  transportistas?: unknown[]
  corrales?: unknown[]
  camaras?: unknown[]
  tropas?: unknown[]
  animales?: unknown[]
  pesajesCamion?: unknown[]
  productos?: unknown[]
  tiposProducto?: unknown[]
  stockMediaRes?: unknown[]
  insumos?: unknown[]
  configuracion?: unknown[]
  [key: string]: unknown[] | undefined
}

async function importData(jsonFile: string) {
  console.log('📥 Importando datos a PostgreSQL...')
  console.log(`📄 Archivo: ${jsonFile}\n`)
  
  const fileContent = await fs.readFile(jsonFile, 'utf-8')
  const data: ExportData = JSON.parse(fileContent)
  
  try {
    // Importar en orden de dependencias
    
    if (data.operadores?.length) {
      console.log(`  Operadores: ${data.operadores.length}`)
      await db.operador.createMany({ data: data.operadores as never[], skipDuplicates: true })
    }
    
    if (data.clientes?.length) {
      console.log(`  Clientes: ${data.clientes.length}`)
      await db.cliente.createMany({ data: data.clientes as never[], skipDuplicates: true })
    }
    
    if (data.transportistas?.length) {
      console.log(`  Transportistas: ${data.transportistas.length}`)
      await db.transportista.createMany({ data: data.transportistas as never[], skipDuplicates: true })
    }
    
    if (data.corrales?.length) {
      console.log(`  Corrales: ${data.corrales.length}`)
      await db.corral.createMany({ data: data.corrales as never[], skipDuplicates: true })
    }
    
    if (data.camaras?.length) {
      console.log(`  Cámaras: ${data.camaras.length}`)
      await db.camara.createMany({ data: data.camaras as never[], skipDuplicates: true })
    }
    
    if (data.pesajesCamion?.length) {
      console.log(`  Pesajes: ${data.pesajesCamion.length}`)
      await db.pesajeCamion.createMany({ data: data.pesajesCamion as never[], skipDuplicates: true })
    }
    
    if (data.tropas?.length) {
      console.log(`  Tropas: ${data.tropas.length}`)
      await db.tropa.createMany({ data: data.tropas as never[], skipDuplicates: true })
    }
    
    if (data.animales?.length) {
      console.log(`  Animales: ${data.animales.length}`)
      await db.animal.createMany({ data: data.animales as never[], skipDuplicates: true })
    }
    
    if (data.productos?.length) {
      console.log(`  Productos: ${data.productos.length}`)
      await db.producto.createMany({ data: data.productos as never[], skipDuplicates: true })
    }
    
    if (data.tiposProducto?.length) {
      console.log(`  Tipos Producto: ${data.tiposProducto.length}`)
      await db.tipoProducto.createMany({ data: data.tiposProducto as never[], skipDuplicates: true })
    }
    
    if (data.stockMediaRes?.length) {
      console.log(`  Stock: ${data.stockMediaRes.length}`)
      await db.stockMediaRes.createMany({ data: data.stockMediaRes as never[], skipDuplicates: true })
    }
    
    if (data.insumos?.length) {
      console.log(`  Insumos: ${data.insumos.length}`)
      await db.insumo.createMany({ data: data.insumos as never[], skipDuplicates: true })
    }
    
    if (data.configuracion?.length) {
      console.log(`  Configuración: ${data.configuracion.length}`)
      await db.configuracion.createMany({ data: data.configuracion as never[], skipDuplicates: true })
    }
    
    console.log('\n✅ Importación completada!')
    
    // Verificar
    const counts = await Promise.all([
      db.operador.count(),
      db.cliente.count(),
      db.tropa.count(),
      db.animal.count(),
    ])
    
    console.log('\n📊 Verificación:')
    console.log(`   Operadores: ${counts[0]}`)
    console.log(`   Clientes: ${counts[1]}`)
    console.log(`   Tropas: ${counts[2]}`)
    console.log(`   Animales: ${counts[3]}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Uso: bun run db:import <archivo.json>')
  process.exit(1)
}

importData(args[0])
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
