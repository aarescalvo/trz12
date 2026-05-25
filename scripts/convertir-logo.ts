/**
 * Utilidad para convertir imágenes PNG a formato GRF para ZPL
 * TrazaSole v3.7.24
 * 
 * Uso: bun run scripts/convertir-logo.ts <archivo.png> <nombre-variable>
 * Ejemplo: bun run scripts/convertir-logo.ts public/logos/logo-solemar.png LOGO_SOLEMAR
 */

import fs from 'fs'
import path from 'path'
import { createCanvas, loadImage } from 'canvas'

async function convertirLogoAGRF(rutaImagen: string, nombreVariable: string) {
  console.log(`🔄 Convirtiendo ${rutaImagen} a formato GRF...`)
  
  if (!fs.existsSync(rutaImagen)) {
    console.error(`❌ Archivo no encontrado: ${rutaImagen}`)
    process.exit(1)
  }

  try {
    // Cargar imagen
    const image = await loadImage(rutaImagen)
    
    // Redimensionar si es necesario (máximo 300px de ancho para rótulos)
    const maxWidth = 300
    let width = image.width
    let height = image.height
    
    if (width > maxWidth) {
      const ratio = maxWidth / width
      width = maxWidth
      height = Math.round(height * ratio)
    }

    // Crear canvas
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    
    // Dibujar imagen
    ctx.drawImage(image, 0, 0, width, height)
    
    // Obtener datos de píxeles
    const imageData = ctx.getImageData(0, 0, width, height)
    const pixels = imageData.data

    // Convertir a blanco y negro (threshold)
    const threshold = 128
    const bytesPerRow = Math.ceil(width / 8)
    const grfData: number[] = []

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < bytesPerRow * 8; x += 8) {
        let byte = 0
        for (let bit = 0; bit < 8; bit++) {
          const px = x + bit
          if (px < width) {
            const idx = (y * width + px) * 4
            const r = pixels[idx]
            const g = pixels[idx + 1]
            const b = pixels[idx + 2]
            const a = pixels[idx + 3]
            
            // Convertir a escala de grises
            const gray = (r + g + b) / 3
            
            // Aplicar threshold (invertido: negro=1, blanco=0)
            if (gray < threshold && a > threshold) {
              byte |= (0x80 >> bit)
            }
          }
        }
        grfData.push(byte)
      }
    }

    // Convertir a hexadecimal
    const hexString = grfData.map(b => b.toString(16).padStart(2, '0')).join('')
    
    // Formatear como comando GRF de ZPL
    const totalBytes = grfData.length
    const grfCommand = `${totalBytes},${totalBytes},${bytesPerRow},${hexString}`

    // Guardar resultado
    const outputPath = rutaImagen.replace('.png', '.grf')
    fs.writeFileSync(outputPath, grfCommand)
    
    // También guardar como archivo TypeScript para incluir en el código
    const tsOutputPath = rutaImagen.replace('.png', '.ts')
    const tsContent = `// Logo convertido automáticamente
// Archivo original: ${path.basename(rutaImagen)}
// Dimensiones: ${width}x${height} pixels
// Generado: ${new Date().toISOString()}

export const ${nombreVariable}_GRF = '${grfCommand}'
`
    fs.writeFileSync(tsOutputPath, tsContent)

    console.log(`✅ Conversión completada!`)
    console.log(`   Ancho: ${width}px, Alto: ${height}px`)
    console.log(`   Bytes por fila: ${bytesPerRow}`)
    console.log(`   Total bytes: ${totalBytes}`)
    console.log(`   Archivo GRF: ${outputPath}`)
    console.log(`   Archivo TS: ${tsOutputPath}`)
    
    // Mostrar primeros 100 caracteres del hex
    console.log(`   Hex (preview): ${hexString.substring(0, 100)}...`)

  } catch (error) {
    console.error('❌ Error al convertir:', error)
    process.exit(1)
  }
}

// Ejecutar
const args = process.argv.slice(2)
if (args.length < 2) {
  console.log('Uso: bun run scripts/convertir-logo.ts <archivo.png> <NOMBRE_VARIABLE>')
  console.log('Ejemplo: bun run scripts/convertir-logo.ts public/logos/logo-solemar.png LOGO_SOLEMAR')
  process.exit(1)
}

convertirLogoAGRF(args[0], args[1])
