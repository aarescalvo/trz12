import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ExcelJS from 'exceljs'
import * as fs from 'fs'
import { checkPermission } from '@/lib/auth-helpers'

// POST - Import articulos from Excel file
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const body = await request.json()
    const { filePath } = body
    
    // Use default file path if not provided
    const excelPath = filePath || '/home/z/my-project/upload/CODIGO.xlsx'
    
    // Check if file exists
    if (!fs.existsSync(excelPath)) {
      return NextResponse.json(
        { success: false, error: `Archivo no encontrado: ${excelPath}` },
        { status: 400 }
      )
    }
    
    // Read the Excel file with ExcelJS
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(excelPath)
    
    // Look for the specific sheet name
    const sheetName = 'tabla composicion codigo'
    const ws = workbook.getWorksheet(sheetName)
    
    if (!ws) {
      return NextResponse.json(
        { success: false, error: `Hoja "${sheetName}" no encontrada` },
        { status: 400 }
      )
    }
    
    // Collect parsed rows from worksheet (sync in exceljs)
    const parsedRows: { rowIndex: number; codigo: string; nombre: string }[] = []
    ws.eachRow((row, rowNumber) => {
      if (!row || row.cellCount === 0) return
      
      const primeraColumna = String(row.getCell(1).value || '').trim()
      
      // Skip empty rows or headers
      if (!primeraColumna || 
          primeraColumna.toLowerCase().includes('tabla') || 
          primeraColumna.toLowerCase().includes('articulo')) {
        return
      }
      
      // Parse "ARTICULO" column which has format: ".001 lomo"
      const match = primeraColumna.match(/^(\.\d{3})\s+(.+)$/)
      if (!match) return
      
      const codigo = match[1]  // .001
      const nombre = match[2].trim()  // lomo
      
      // Skip "total" row
      if (codigo === '.000' || nombre.toLowerCase().includes('total')) return
      
      if (!nombre) return
      
      parsedRows.push({ rowIndex: rowNumber, codigo, nombre })
    })

    // Process rows with DB operations (async)
    let importados = 0
    let actualizados = 0
    let errores = 0
    
    for (const { rowIndex, codigo, nombre } of parsedRows) {
      try {
        const existente = await db.articulo.findUnique({
          where: { codigo }
        })
        
        if (existente) {
          if (existente.nombre !== nombre) {
            await db.articulo.update({
              where: { codigo },
              data: { nombre }
            })
            actualizados++
          }
        } else {
          await db.articulo.create({
            data: {
              codigo,
              nombre,
              activo: true
            }
          })
          importados++
        }
      } catch (error) {
        console.error(`Error processing row ${rowIndex}:`, error)
        errores++
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Importación completada`,
      data: {
        importados,
        actualizados,
        errores,
        sheetName
      }
    })
    
  } catch (error) {
    console.error('Error importing articulos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al importar articulos: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
