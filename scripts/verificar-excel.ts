import * as XLSX from 'xlsx'

const excelPath = '/home/z/my-project/upload/SERVICIO FAENA BOVINO 2026.xlsx'

const workbook = XLSX.readFile(excelPath)
const sheetName = workbook.SheetNames[0]
const sheet = workbook.Sheets[sheetName]
const data: any[] = XLSX.utils.sheet_to_json(sheet)

console.log(`Total registros: ${data.length}`)
console.log('\n=== COLUMNAS ===')
if (data.length > 0) {
  console.log(Object.keys(data[0]))
}

console.log('\n=== PRIMEROS 5 REGISTROS ===')
data.slice(0, 5).forEach((row, i) => {
  console.log(`\nRegistro ${i + 1}:`)
  Object.entries(row).forEach(([k, v]) => {
    console.log(`  ${k}: ${v}`)
  })
})
