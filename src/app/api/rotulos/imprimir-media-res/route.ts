/**
 * API para imprimir rótulos de MEDIA RES
 * Genera 3 rótulos por media (A, T, D) con el lado correspondiente (DER/IZQ)
 * TrazaSole v3.7.24
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import net from 'net'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { checkPermission } from '@/lib/auth-helpers'
import { createLogger } from '@/lib/logger'
const log = createLogger('app.api.rotulos.imprimir-media-res.route')

interface PrintRequest {
  tropa: string
  garron: string
  lado: 'DER' | 'IZQ'
  kg: number
  fechaFaena: string
  nombreCliente: string
  cuitCliente: string
  matriculaCliente: string
  impresoraIp: string
  impresoraPuerto: number
}

// Cuartos que se imprimen por cada media
const CUARTOS = ['A', 'T', 'D'] as const

export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const body: PrintRequest = await request.json()

    // Validar datos requeridos
    if (!body.tropa || !body.garron || !body.lado || !body.impresoraIp) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: tropa, garron, lado, impresoraIp' },
        { status: 400 }
      )
    }

    // Obtener el rótulo configurado
    const rotulo = await db.rotulo.findFirst({
      where: { tipo: 'MEDIA_RES', activo: true }
    })

    if (!rotulo) {
      return NextResponse.json(
        { error: 'No hay rótulo MEDIA_RES configurado' },
        { status: 404 }
      )
    }

    // Calcular fecha de vencimiento (fecha faena + 13 días)
    const fechaFaenaDate = new Date(body.fechaFaena)
    const fechaVencimiento = new Date(fechaFaenaDate)
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 13)
    const vencimientoStr = formatearFecha(fechaVencimiento)
    const fechaFaenaStr = formatearFecha(fechaFaenaDate)

    // Cargar logos (convertidos a GRF)
    const logoSolemar = await cargarLogoGRF('logo-solemar.png')
    const logoSenasa = await cargarLogoGRF('logo-senasa.png')

    // Generar e imprimir los 3 rótulos (A, T, D)
    const resultados: { clasificacion: string; codigoBarras: string; exitoso: boolean }[] = []

    for (const clasificacion of CUARTOS) {
      // Generar código de barras: TROPA-GARRON-LADO-CLASIF
      const codigoBarras = `${body.tropa.replace(/\s/g, '')}-${body.garron}-${body.lado}-${clasificacion}`

      // Reemplazar variables en el template
      let zpl = rotulo.contenido
        .replace(/{LOGO_SOLEMAR}/g, logoSolemar)
        .replace(/{LOGO_SENASA}/g, logoSenasa)
        .replace(/{NOMBRE_CLIENTE}/g, body.nombreCliente.toUpperCase())
        .replace(/{CUIT_CLIENTE}/g, body.cuitCliente)
        .replace(/{MATRICULA_CLIENTE}/g, body.matriculaCliente)
        .replace(/{FECHA_FAENA}/g, fechaFaenaStr)
        .replace(/{TROPA}/g, body.tropa)
        .replace(/{GARRON}/g, body.garron)
        .replace(/{LADO}/g, body.lado)
        .replace(/{CLASIFICACION}/g, clasificacion)
        .replace(/{KG}/g, body.kg.toFixed(1))
        .replace(/{VENCIMIENTO}/g, vencimientoStr)
        .replace(/{CODIGO_BARRAS}/g, codigoBarras)

      // Enviar a impresora
      const exitoso = await imprimirZPL(body.impresoraIp, body.impresoraPuerto || 9100, zpl)
      
      resultados.push({
        clasificacion,
        codigoBarras,
        exitoso
      })
    }

    // Verificar si todos fueron exitosos
    const todosExitosos = resultados.every(r => r.exitoso)

    return NextResponse.json({
      success: todosExitosos,
      message: todosExitosos 
        ? '3 rótulos impresos correctamente' 
        : 'Algunos rótulos no se pudieron imprimir',
      resultados,
      rotulosGenerados: 3
    })

  } catch (error) {
    console.error('Error al imprimir rótulos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', detalle: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Formatea fecha a DD/MM/YYYY
 */
function formatearFecha(fecha: Date): string {
  const dia = fecha.getDate().toString().padStart(2, '0')
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0')
  const año = fecha.getFullYear()
  return `${dia}/${mes}/${año}`
}

/**
 * Carga un logo y lo convierte a formato GRF para ZPL
 * Si no existe el archivo, devuelve un placeholder vacío
 */
async function cargarLogoGRF(nombreArchivo: string): Promise<string> {
  try {
    const rutaLogo = path.join(process.cwd(), 'public', 'logos', nombreArchivo)
    
    if (!fs.existsSync(rutaLogo)) {
      log.info(`Logo no encontrado: ${nombreArchivo}, usando placeholder`)
      // Devolver un placeholder pequeño (10x10 pixels vacío)
      return '00000000000000000000'
    }

    log.info(`Logo encontrado: ${nombreArchivo}, convirtiendo a GRF...`)

    // Convertir PNG a monocromo (1 bit) usando sharp
    const image = sharp(rutaLogo)
    const metadata = await image.metadata()

    const width = metadata.width || 0
    const height = metadata.height || 0
    if (width === 0 || height === 0) {
      log.warn(`Logo con dimensiones inválidas: ${nombreArchivo}`)
      return ''
    }

    // Escalar a máximo 200px de ancho para etiquetas térmicas
    const maxWidth = 200
    const scale = width > maxWidth ? maxWidth / width : 1
    const targetWidth = Math.round(width * scale)
    const targetHeight = Math.round(height * scale)

    // Convertir a escala de grises, luego a umbral (blanco/negro)
    const { data } = await image
      .resize(targetWidth, targetHeight, { fit: 'fill' })
      .greyscale()
      .threshold(128)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const bytesPerRow = Math.ceil(targetWidth / 8)
    const bitmapBytes: Buffer = Buffer.alloc(bytesPerRow * targetHeight)

    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        // Cada pixel en formato raw es RGBA (4 bytes)
        const pixelIndex = (y * targetWidth + x) * 4
        const alpha = data[pixelIndex + 3]
        const grey = data[pixelIndex]

        // Considerar pixel como negro si tiene suficiente opacidad y brillo bajo
        const isBlack = alpha > 128 && grey < 128

        if (isBlack) {
          const byteIndex = y * bytesPerRow + Math.floor(x / 8)
          // MSB = pixel izquierdo (convención Zebra)
          const bitIndex = 7 - (x % 8)
          bitmapBytes[byteIndex] |= (1 << bitIndex)
        }
      }
    }

    // Convertir bitmap a string hexadecimal (formato requerido por ZPL ~DG)
    const hexData = bitmapBytes.toString('hex').toUpperCase()
    const totalBytes = bitmapBytes.length

    // Generar comando ZPL ~DG para descargar la imagen a memoria RAM
    const objectName = path.parse(nombreArchivo).name.toUpperCase().replace(/-/g, '_')

    log.info(`Logo ${nombreArchivo} convertido: ${targetWidth}x${targetHeight}px, ${totalBytes} bytes GRF`)

    return `~DGR:${objectName}.GRF,${totalBytes.toString().padStart(5, '0')},${bytesPerRow.toString().padStart(3, '0')},${hexData}`
    
  } catch (error) {
    console.error(`Error cargando logo ${nombreArchivo}:`, error)
    return '00000000000000000000'
  }
}

/**
 * Envía ZPL a la impresora vía TCP/IP
 */
async function imprimirZPL(ip: string, puerto: number, zpl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const client = new net.Socket()
    
    client.setTimeout(5000)
    
    client.connect(puerto, ip, () => {
      client.write(zpl, 'utf8', () => {
        client.end()
        resolve(true)
      })
    })

    client.on('error', (err) => {
      console.error(`Error conectando a impresora ${ip}:${puerto}:`, err.message)
      resolve(false)
    })

    client.on('timeout', () => {
      console.error(`Timeout conectando a impresora ${ip}:${puerto}`)
      client.destroy()
      resolve(false)
    })
  })
}
