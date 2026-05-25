/**
 * Exportar datos de SQLite a JSON para migración a PostgreSQL
 * Uso: bun run db:export
 */

import { db } from '../src/lib/db'
import fs from 'fs/promises'
import path from 'path'

const EXPORT_DIR = './backups/migration-data'

async function exportData() {
  console.log('📦 Exportando datos de SQLite...\n')
  
  await fs.mkdir(EXPORT_DIR, { recursive: true })
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const exportFile = path.join(EXPORT_DIR, `data-export-${timestamp}.json`)
  
  const data: Record<string, unknown[]> = {}
  
  try {
    // Exportar modelos principales
    console.log('Exportando operadores...')
    data.operadores = await db.operador.findMany()
    
    console.log('Exportando clientes...')
    data.clientes = await db.cliente.findMany()
    
    console.log('Exportando transportistas...')
    data.transportistas = await db.transportista.findMany()
    
    console.log('Exportando corrales...')
    data.corrales = await db.corral.findMany()
    
    console.log('Exportando cámaras...')
    data.camaras = await db.camara.findMany()
    
    console.log('Exportando tropas...')
    data.tropas = await db.tropa.findMany()
    
    console.log('Exportando animales...')
    data.animales = await db.animal.findMany()
    
    console.log('Exportando pesajes...')
    data.pesajesCamion = await db.pesajeCamion.findMany()
    
    console.log('Exportando productos...')
    data.productos = await db.producto.findMany()
    data.tiposProducto = await db.tipoProducto.findMany()
    
    console.log('Exportando stock...')
    data.stockMediaRes = await db.stockMediaRes.findMany()
    
    console.log('Exportando insumos...')
    data.insumos = await db.insumo.findMany()
    
    console.log('Exportando configuraciones...')
    data.configuracion = await db.configuracion.findMany()
    data.rotulos = await db.rotulo.findMany()
    data.balanzas = await db.balanza.findMany()
    data.puestosTrabajo = await db.puestoTrabajo.findMany()
    data.codigoBarrasConfig = await db.codigoBarrasConfig.findMany()
    
    // Guardar archivo
    await fs.writeFile(exportFile, JSON.stringify(data, null, 2))
    
    const total = Object.values(data).reduce((sum, arr) => sum + (arr?.length || 0), 0)
    
    console.log('\n✅ Exportación completada!')
    console.log(`📄 Archivo: ${exportFile}`)
    console.log(`📊 Total registros: ${total}`)
    
    // Metadata
    await fs.writeFile(
      path.join(EXPORT_DIR, `metadata-${timestamp}.json`),
      JSON.stringify({
        exportDate: new Date().toISOString(),
        version: '2.2.0',
        source: 'SQLite',
        totalRecords: total
      }, null, 2)
    )
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

exportData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
