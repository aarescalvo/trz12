import * as XLSX from 'xlsx'

const file = '/home/z/my-project/upload/RINDE FAENA BOVINO - copia.xlsx'
const workbook = XLSX.readFile(file)

// Analizar hoja T 01 completa
const sheet = workbook.Sheets['T 01']
const data: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 })

console.log('=== HOJA T 01 - TODAS LAS FILAS ===\n')
data.forEach((row, i) => {
  console.log(`Fila ${i}: ${JSON.stringify(row).substring(0, 150)}`)
})
