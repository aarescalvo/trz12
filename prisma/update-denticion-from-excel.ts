/**
 * Actualiza el campo `denticion` de los romaneos leyendo el Excel de rinde de faena.
 *
 * Estructura del Excel:
 *   - 192 hojas: "T 01" ... "T 192"
 *   - Fila 6, Col G (7): número de tropa
 *   - Fila 10: encabezados
 *   - Fila 11+: datos (Col C = garrón, Col F = tipo animal con dentición)
 *   - Col F tiene valores como "2D - VQ", "2D - MEJ", "4D - NT"
 *
 * La función buildClasificacion(denticion, tipoAnimal) espera:
 *   denticion = "2" → denticionToPrefix("2") → "2D" → "2D - NT"
 *
 * Uso: npx tsx prisma/update-denticion-from-excel.ts
 */

import ExcelJS from 'exceljs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function extractDenticion(tipoAnimalRaw: string | null | undefined): string | null {
  if (!tipoAnimalRaw) return null
  // "2D - VQ" → "2", "4D - NT" → "4", "0D" → "0"
  const match = String(tipoAnimalRaw).match(/^(\d+)\s*D/i)
  return match ? match[1] : null
}

async function main() {
  const excelPath = path.resolve('upload/RINDE FAENA BOVINO.xlsx')
  console.log(`Leyendo: ${excelPath}`)

  // ── 1. Cargar mapa tropa.numero → tropa.codigo ──
  const tropas = await prisma.tropa.findMany({
    select: { numero: true, codigo: true },
  })
  const tropaNumeroToCodigo = new Map<number, string>()
  for (const t of tropas) {
    tropaNumeroToCodigo.set(t.numero, t.codigo)
  }
  console.log(`Tropas en BD: ${tropas.length}`)

  // ── 2. Leer Excel ──
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(excelPath)
  console.log(`Hojas en Excel: ${workbook.worksheets.length}\n`)

  // ── 3. Procesar cada hoja ──
  let totalActualizados = 0
  let totalNoEncontrados = 0
  let totalFilas = 0
  let hojasProcesadas = 0
  const errores: string[] = []

  for (const ws of workbook.worksheets) {
    // Parsear tropa del nombre de hoja: "T 01" → 1, "T 191" → 191
    const match = ws.name.match(/T\s+(\d+)/i)
    if (!match) continue

    const tropaNumero = parseInt(match[1], 10)
    const tropaCodigo = tropaNumeroToCodigo.get(tropaNumero)
    if (!tropaCodigo) {
      // Tropa no existe en BD, saltear
      continue
    }

    hojasProcesadas++

    // Data rows start at row 11, columns: C(3)=garron, F(6)=tipoAnimal
    for (let r = 11; r <= ws.rowCount; r++) {
      const row = ws.getRow(r)
      const garronVal = row.getCell(3).value  // Col C: Nº GARRON
      const tipoAnimalVal = row.getCell(6).value  // Col F: TIPO DE ANIMAL

      // Skip empty rows
      if (garronVal === null || garronVal === undefined || String(garronVal).trim() === '') {
        break // No more data rows
      }

      const garron = parseInt(String(garronVal), 10)
      if (isNaN(garron)) {
        continue
      }

      const denticion = extractDenticion(tipoAnimalVal)
      if (!denticion) {
        continue
      }

      totalFilas++

      try {
        const result = await prisma.romaneo.updateMany({
          where: {
            tropaCodigo: tropaCodigo,
            garron: garron,
          },
          data: {
            denticion: denticion,
          },
        })

        if (result.count > 0) {
          totalActualizados += result.count
        } else {
          totalNoEncontrados++
          if (totalNoEncontrados <= 5) {
            errores.push(`  Tropa ${tropaNumero} (${tropaCodigo}) garrón ${garron} denticion=${denticion}`)
          }
        }
      } catch (err: any) {
        errores.push(`  ERROR Tropa ${tropaNumero} garrón ${garron}: ${err.message}`)
      }
    }
  }

  // ── 4. Resumen ──
  console.log('========================================')
  console.log('RESUMEN')
  console.log('========================================')
  console.log(`Hojas procesadas (con tropa en BD): ${hojasProcesadas}`)
  console.log(`Filas leídas del Excel: ${totalFilas}`)
  console.log(`Romaneos actualizados: ${totalActualizados}`)
  console.log(`Romaneos no encontrados en BD: ${totalNoEncontrados}`)
  if (errores.length > 0) {
    console.log(`\nPrimeros no encontrados:`)
    errores.forEach(e => console.log(e))
  }
  console.log('========================================')

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('ERROR FATAL:', e.message || e)
  await prisma.$disconnect()
  process.exit(1)
})
