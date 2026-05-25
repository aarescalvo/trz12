import * as XLSX from 'xlsx'

const files = [
  '/home/z/my-project/upload/RINDE FAENA BOVINO - copia.xlsx',
  '/home/z/my-project/upload/CUIT DE USUARIOS + DATOS.xlsx',
  '/home/z/my-project/upload/CODIGO.xlsx',
  '/home/z/my-project/upload/ROMANEO VACUNO T61 06022026.pdf.xlsx',
]

for (const file of files) {
  console.log(`\n=== ${file.split('/').pop()} ===`)
  try {
    const workbook = XLSX.readFile(file)
    console.log(`Hojas: ${workbook.SheetNames.join(', ')}`)
    
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const data: any[] = XLSX.utils.sheet_to_json(sheet)
      console.log(`\nHoja: ${sheetName} - ${data.length} registros`)
      
      if (data.length > 0) {
        console.log('Columnas:', Object.keys(data[0]).slice(0, 10).join(', '))
        console.log('Primer registro:', JSON.stringify(data[0]).substring(0, 200))
      }
    }
  } catch (e) {
    console.log('Error:', e)
  }
}
