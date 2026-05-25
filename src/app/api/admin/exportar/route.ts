import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as fs from 'fs'
import * as path from 'path'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Exportar datos
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'tropas'
    const format = searchParams.get('format') || 'csv'

    let data: unknown[] = []
    let headers: string[] = []
    let filename = `${tipo}_${new Date().toISOString().split('T')[0]}`

    // Obtener datos según el tipo
    switch (tipo) {
      case 'tropas':
        data = await db.tropa.findMany({
          include: {
            productor: true,
            usuarioFaena: true,
            corral: true
          },
          orderBy: { createdAt: 'desc' }
        })
        headers = ['ID', 'Código', 'Productor', 'Especie', 'Cabezas', 'Peso Bruto', 'Peso Neto', 'Estado', 'Fecha']
        break

      case 'animales':
        data = await db.animal.findMany({
          include: {
            tropa: { include: { productor: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 1000
        })
        headers = ['ID', 'Caravana', 'Tropa', 'Productor', 'Peso Vivo', 'Peso Faena', 'Estado', 'Fecha']
        break

      case 'romaneos':
        data = await db.asignacionGarron.findMany({
          include: {
            animal: { include: { tropa: true } },
            listaFaena: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1000
        })
        headers = ['ID', 'Garrón', 'Tropa', 'Media', 'Peso', 'Clasificación', 'Fecha']
        break

      case 'clientes':
        data = await db.cliente.findMany({
          orderBy: { nombre: 'asc' }
        })
        headers = ['ID', 'Nombre', 'CUIT', 'Dirección', 'Teléfono', 'Email', 'Activo']
        break

      case 'stock':
        const stockData = await db.stockCamara.findMany({
          include: {
            producto: true,
            camara: true
          },
          orderBy: { updatedAt: 'desc' }
        })
        data = stockData
        headers = ['ID', 'Producto', 'Cámara', 'Cantidad', 'Peso Total', 'Fecha']
        break

      case 'produccion':
        const produccion = await db.ingresoDespostada.findMany({
          include: {
            camaraOrigen: true,
            camaraDestino: true
          },
          orderBy: { createdAt: 'desc' },
          take: 500
        })
        data = produccion
        headers = ['ID', 'Producto', 'Peso', 'Cajones', 'Fecha']
        break

      default:
        return NextResponse.json({
          success: false,
          error: 'Tipo de exportación no válido'
        }, { status: 400 })
    }

    // Generar archivo según formato
    let content: string
    let mimeType: string
    let extension: string

    switch (format) {
      case 'csv':
        content = generateCSV(data, headers)
        mimeType = 'text/csv'
        extension = 'csv'
        break

      case 'excel':
      case 'xls':
        content = generateCSV(data, headers, '\t') // TSV para Excel
        mimeType = 'application/vnd.ms-excel'
        extension = 'xls'
        break

      case 'json':
        content = JSON.stringify(data, null, 2)
        mimeType = 'application/json'
        extension = 'json'
        break

      default:
        return NextResponse.json({
          success: false,
          error: 'Formato no soportado'
        }, { status: 400 })
    }

    // Crear respuesta con el archivo
    const encoder = new TextEncoder()
    const encodedContent = encoder.encode(content)

    return new NextResponse(encodedContent, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}.${extension}"`,
        'Content-Length': encodedContent.length.toString()
      }
    })

  } catch (error) {
    console.error('Error exportando datos:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al exportar datos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Función para generar CSV
function generateCSV(data: unknown[], headers: string[], separator: string = ','): string {
  const lines: string[] = []
  
  // Agregar encabezados
  lines.push(headers.join(separator))
  
  // Agregar datos
  for (const item of data) {
    const row = extractRowValues(item, headers.length)
    lines.push(row.map(v => escapeCSV(v, separator)).join(separator))
  }
  
  return lines.join('\n')
}

// Función para extraer valores de fila
function extractRowValues(item: unknown, count: number): string[] {
  const result: string[] = []
  const obj = item as Record<string, unknown>
  
  // Intentar extraer valores comunes
  const commonFields = [
    'id', 'codigo', 'nombre', 'numero', 'cuit', 'direccion', 'telefono', 'email',
    'activo', 'especie', 'cantidadCabezas', 'pesoBruto', 'pesoNeto', 'estado',
    'createdAt', 'updatedAt', 'peso', 'pesoVivo', 'pesoFaena', 'caravana',
    'garron', 'media', 'clasificacion', 'producto', 'productor', 'corral'
  ]
  
  for (let i = 0; i < count; i++) {
    const field = commonFields[i] || `field${i}`
    const value = getNestedValue(obj, field)
    result.push(value)
  }
  
  return result
}

// Función para obtener valor anidado
function getNestedValue(obj: Record<string, unknown>, field: string): string {
  // Manejar campos anidados (ej: productor.nombre)
  const parts = field.split('.')
  let current: unknown = obj
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part]
    } else {
      // Intentar buscar el campo directamente
      for (const key of Object.keys(obj)) {
        if (key.toLowerCase().includes(field.toLowerCase())) {
          current = obj[key]
          break
        }
      }
      break
    }
  }
  
  if (current === null || current === undefined) return ''
  if (current instanceof Date) return current.toISOString()
  return String(current)
}

// Función para escapar valores CSV
function escapeCSV(value: string, separator: string): string {
  if (value.includes(separator) || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
