import * as XLSX from 'xlsx'

const file = '/home/z/my-project/upload/RINDE FAENA BOVINO - copia.xlsx'
const wb = XLSX.readFile(file)

// Comparar estructura de T 01 vs T 18
for (const hoja of ['T 01', 'T 18', 'T 19']) {
  const sheet = wb.Sheets[hoja]
  const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 })
  
  console.log(`\n=== ${hoja} ===`)
  for (let i = 0; i <= 15; i++) {
    console.log(`Fila ${i}: ${JSON.stringify(data[i]?.slice(0, 15)).substring(0, 200)}`)
  }
}
