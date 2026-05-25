import * as XLSX from 'xlsx'

const file = '/home/z/my-project/upload/CUIT DE USUARIOS + DATOS.xlsx'
const wb = XLSX.readFile(file)

console.log('Hojas:', wb.SheetNames)

for (const sheetName of wb.SheetNames) {
  const sheet = wb.Sheets[sheetName]
  const data: any[] = XLSX.utils.sheet_to_json(sheet)
  
  console.log(`\n=== ${sheetName} (${data.length} registros) ===`)
  console.log('Columnas:', Object.keys(data[0] || {}).join(', '))
  console.log('\nDatos:')
  data.forEach((row, i) => {
    console.log(`${i + 1}: ${JSON.stringify(row)}`)
  })
}
