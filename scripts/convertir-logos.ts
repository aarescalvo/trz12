/**
 * Convierte imágenes a formato GRF para ZPL
 * TrazaSole v3.7.24
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

async function convertirLogoAGRF(
  inputPath: string, 
  outputPath: string,
  maxWidth: number = 200,
  maxHeight: number = 100
) {
  console.log(`🔄 Convirtiendo: ${inputPath}`)
  
  try {
    // Cargar y redimensionar imagen
    const image = sharp(inputPath)
    const metadata = await image.metadata()
    
    console.log(`   Original: ${metadata.width}x${metadata.height}`)
    
    // Redimensionar manteniendo proporción
    let newWidth = metadata.width!
    let newHeight = metadata.height!
    
    if (newWidth > maxWidth || newHeight > maxHeight) {
      const ratioW = maxWidth / newWidth
      const ratioH = maxHeight / newHeight
      const ratio = Math.min(ratioW, ratioH)
      newWidth = Math.round(newWidth * ratio)
      newHeight = Math.round(newHeight * ratio)
    }
    
    console.log(`   Redimensionado: ${newWidth}x${newHeight}`)
    
    // Convertir a escala de grises y luego a blanco y negro
    const buffer = await image
      .resize(newWidth, newHeight)
      .grayscale()
      .raw()
      .toBuffer()
    
    // Crear datos GRF
    // Cada byte representa 8 píxeles horizontales
    const bytesPerRow = Math.ceil(newWidth / 8)
    const totalBytes = bytesPerRow * newHeight
    const grfData: number[] = []
    
    // Umbral para blanco/negro (128 = 50%)
    const threshold = 128
    
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < bytesPerRow * 8; x += 8) {
        let byte = 0
        for (let bit = 0; bit < 8; bit++) {
          const px = x + bit
          if (px < newWidth) {
            const idx = y * newWidth + px
            const gray = buffer[idx]
            // Invertido: negro = 1 (para imprimir)
            if (gray < threshold) {
              byte |= (0x80 >> bit)
            }
          }
        }
        grfData.push(byte)
      }
    }
    
    // Convertir a hexadecimal
    const hexString = grfData.map(b => b.toString(16).padStart(2, '0')).join('')
    
    // Formato GRF para ZPL: totalBytes,totalBytes,bytesPerRow,hexData
    const grfCommand = `${totalBytes},${totalBytes},${bytesPerRow},${hexString}`
    
    // Guardar archivo
    fs.writeFileSync(outputPath, grfCommand)
    
    console.log(`   ✅ Guardado: ${outputPath}`)
    console.log(`   Bytes por fila: ${bytesPerRow}`)
    console.log(`   Total bytes: ${totalBytes}`)
    console.log(`   Hex length: ${hexString.length}`)
    
    return grfCommand
    
  } catch (error) {
    console.error(`   ❌ Error:`, error)
    throw error
  }
}

async function main() {
  const logosDir = path.join(process.cwd(), 'public', 'logos')
  
  console.log('═'.repeat(60))
  console.log('CONVERSIÓN DE LOGOS A FORMATO GRF PARA ZPL')
  console.log('═'.repeat(60))
  console.log()
  
  // Convertir logo Solemar (más ancho que alto)
  console.log('1. LOGO SOLEMAR')
  console.log('-'.repeat(40))
  const solemarGrf = await convertirLogoAGRF(
    path.join(logosDir, 'logo-solemar.jpg'),
    path.join(logosDir, 'logo-solemar.grf'),
    280,  // max ancho
    80    // max alto
  )
  
  console.log()
  
  // Convertir logo SENASA (cuadrado)
  console.log('2. LOGO SENASA')
  console.log('-'.repeat(40))
  const senasaGrf = await convertirLogoAGRF(
    path.join(logosDir, 'logo-senasa.jpg'),
    path.join(logosDir, 'logo-senasa.grf'),
    80,   // max ancho
    80    // max alto
  )
  
  console.log()
  console.log('═'.repeat(60))
  console.log('✅ CONVERSIÓN COMPLETADA')
  console.log('═'.repeat(60))
  
  // Crear archivo TypeScript con los datos GRF
  const tsContent = `/**
 * Logos convertidos a formato GRF para ZPL
 * Generado automáticamente - ${new Date().toISOString()}
 */

export const LOGO_SOLEMAR_GRF = \`${solemarGrf}\`

export const LOGO_SENASA_GRF = \`${senasaGrf}\`
`
  
  const tsPath = path.join(logosDir, 'logos-grf.ts')
  fs.writeFileSync(tsPath, tsContent)
  console.log(`\n📝 Archivo TypeScript creado: ${tsPath}`)
}

main().catch(console.error)
