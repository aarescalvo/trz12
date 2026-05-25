import ExcelJS from 'exceljs';
import * as fs from 'fs';

const planillaPath = '/home/z/my-project/upload/Planilla 01 - Bovino.xlsx';
const logoPath = '/home/z/my-project/upload/WhatsApp Image 2026-03-04 at 9.02.37 PM.jpeg';
const outputPath = '/home/z/my-project/upload/Planilla 01 - Bovino MODIFICADA.xlsx';

async function modificarPlanilla() {
  // Crear nuevo workbook
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(planillaPath);
  
  const sheet = workbook.worksheets[0];
  
  // Leer el logo
  const logoBuffer = fs.readFileSync(logoPath);
  
  // Agregar imagen al workbook
  const imageId = workbook.addImage({
    buffer: logoBuffer,
    extension: 'jpeg'
  });
  
  // Agregar imagen en la posición A1 (esquina superior izquierda)
  // La imagen estará en las filas 1-4, columnas A-B
  sheet.addImage(imageId, {
    tl: { col: 0, row: 0 },  // Top-left: columna A, fila 1
    br: { col: 2, row: 4 },  // Bottom-right: columna C, fila 4
    editAs: 'oneCell'
  });
  
  // Eliminar filas vacías de animales (dejar solo 15)
  // Las filas de animales empiezan en la fila 10 (índice 9 en ExcelJS)
  // Primero identificamos cuántas filas hay
  const totalFilas = sheet.rowCount;
  console.log(`Total filas: ${totalFilas}`);
  
  // Buscar la última fila con datos de encabezado
  // Filas 1-9 son encabezados (1-indexed en ExcelJS)
  // Fila 10 vacía
  // Filas 11+ son números de animales
  
  // Eliminar filas desde la 26 en adelante (dejar 15 animales)
  // Fila 11-25 = 15 animales
  if (totalFilas > 25) {
    for (let i = totalFilas; i > 25; i--) {
      sheet.spliceRows(i, 1);
    }
    console.log(`Filas eliminadas desde la 26 hasta ${totalFilas}`);
  }
  
  // Guardar archivo
  await workbook.xlsx.writeFile(outputPath);
  
  console.log(`\n✅ Planilla modificada guardada en: ${outputPath}`);
  console.log('Cambios realizados:');
  console.log('  - Logo de Solemar agregado en esquina superior izquierda');
  console.log('  - Filas de animales reducidas a 15');
}

modificarPlanilla().catch(console.error);
