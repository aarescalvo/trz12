/**
 * Script de migración de usuarios desde Excel a la base de datos
 * 
 * Lee el archivo "CUIT DE USUARIOS + DATOS.xlsx" y crea registros
 * en la tabla Cliente con los datos de usuarios de faena.
 * 
 * Ejecutar con: npx tsx prisma/migrar-usuarios.ts
 */

import XLSX from 'xlsx'
import { db } from '../src/lib/db'
import path from 'path'

interface UsuarioExcel {
  'TITULAR ': string
  'CUIT': number
  'MAIL': string
  'NOMBRE Y APELLIGO': string
  'CELULAR': string
}

interface ResultadoMigracion {
  total: number
  creados: number
  duplicados: number
  errores: string[]
  usuariosCreados: Array<{
    nombre: string
    cuit: string
  }>
}

export async function migrarUsuarios(): Promise<ResultadoMigracion> {
  const resultado: ResultadoMigracion = {
    total: 0,
    creados: 0,
    duplicados: 0,
    errores: [],
    usuariosCreados: []
  }

  try {
    // Leer archivo Excel
    const filePath = path.join(process.cwd(), 'upload', 'CUIT DE USUARIOS + DATOS.xlsx')
    const workbook = XLSX.readFile(filePath)
    const sheet = workbook.Sheets['Hoja1']
    const data = XLSX.utils.sheet_to_json<UsuarioExcel>(sheet)
    
    resultado.total = data.length
    console.log(`\n📋 Total de usuarios en Excel: ${data.length}`)

    for (const row of data) {
      try {
        // Normalizar datos
        const nombre = row['TITULAR ']?.trim() || ''
        const cuit = String(row['CUIT'] || '').trim()
        const mail = row['MAIL']?.trim() || ''
        const contactoNombre = row['NOMBRE Y APELLIGO']?.trim() || ''
        const celular = row['CELULAR']?.trim() || ''

        if (!nombre || !cuit) {
          resultado.errores.push(`Fila incompleta: ${JSON.stringify(row)}`)
          continue
        }

        // Verificar si ya existe por CUIT
        const existente = await db.cliente.findUnique({
          where: { cuit }
        })

        if (existente) {
          console.log(`⚠️  Duplicado: ${nombre} (CUIT: ${cuit})`)
          resultado.duplicados++
          continue
        }

        // Crear cliente
        const cliente = await db.cliente.create({
          data: {
            nombre,
            cuit,
            emails: mail || null,
            contactoNombre: contactoNombre || null,
            celular: celular || null,
            esUsuarioFaena: true,
            esProductor: false,
            modalidadRetiro: true, // Según Hoja2, todos tienen "Retiro en planta"
          }
        })

        console.log(`✅ Creado: ${nombre} (CUIT: ${cuit})`)
        resultado.creados++
        resultado.usuariosCreados.push({
          nombre: cliente.nombre,
          cuit: cliente.cuit || ''
        })

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
        resultado.errores.push(`Error con ${row['TITULAR ']}: ${errorMsg}`)
        console.error(`❌ Error: ${errorMsg}`)
      }
    }

    console.log(`\n📊 Resumen de migración:`)
    console.log(`   Total en Excel: ${resultado.total}`)
    console.log(`   Creados: ${resultado.creados}`)
    console.log(`   Duplicados (omitidos): ${resultado.duplicados}`)
    console.log(`   Errores: ${resultado.errores.length}`)

    return resultado

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    console.error(`❌ Error general: ${errorMsg}`)
    resultado.errores.push(errorMsg)
    return resultado
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  migrarUsuarios()
    .then((resultado) => {
      console.log('\n✅ Migración completada')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Error en migración:', error)
      process.exit(1)
    })
}
