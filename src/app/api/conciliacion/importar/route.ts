import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// Parseadores para diferentes bancos
interface ParsedMovement {
  fecha: Date
  descripcion: string
  referencia?: string
  monto: number
  tipo: 'DEBITO' | 'CREDITO'
  saldo?: number
}

// Parser para CMF
function parseCMF(content: string): ParsedMovement[] {
  const lines = content.split('\n').filter(line => line.trim())
  const movements: ParsedMovement[] = []
  
  // Saltar encabezado si existe
  const startIndex = lines[0].toLowerCase().includes('fecha') ? 1 : 0
  
  for (let i = startIndex; i < lines.length; i++) {
    const parts = lines[i].split(';').map(p => p.trim())
    if (parts.length < 4) continue
    
    const [fechaStr, descripcion, debitoStr, creditoStr, saldoStr] = parts
    
    // Parsear fecha DD/MM/YYYY
    const fechaParts = fechaStr.split('/')
    if (fechaParts.length !== 3) continue
    
    const fecha = new Date(
      parseInt(fechaParts[2]),
      parseInt(fechaParts[1]) - 1,
      parseInt(fechaParts[0])
    )
    
    const debito = parseFloat(debitoStr.replace(',', '.')) || 0
    const credito = parseFloat(creditoStr.replace(',', '.')) || 0
    const saldo = saldoStr ? parseFloat(saldoStr.replace(',', '.')) : undefined
    
    if (debito === 0 && credito === 0) continue
    
    movements.push({
      fecha,
      descripcion,
      monto: credito > 0 ? credito : debito,
      tipo: credito > 0 ? 'CREDITO' : 'DEBITO',
      saldo
    })
  }
  
  return movements
}

// Parser para Macro
function parseMacro(content: string): ParsedMovement[] {
  const lines = content.split('\n').filter(line => line.trim())
  const movements: ParsedMovement[] = []
  
  const startIndex = lines[0].toLowerCase().includes('fecha') ? 1 : 0
  
  for (let i = startIndex; i < lines.length; i++) {
    const parts = lines[i].split(';').map(p => p.trim())
    if (parts.length < 5) continue
    
    const [fechaMovStr, , descripcion, referencia, importeStr, saldoStr] = parts
    
    // Parsear fecha DD/MM/YYYY
    const fechaParts = fechaMovStr.split('/')
    if (fechaParts.length !== 3) continue
    
    const fecha = new Date(
      parseInt(fechaParts[2]),
      parseInt(fechaParts[1]) - 1,
      parseInt(fechaParts[0])
    )
    
    // El importe puede ser negativo (débito) o positivo (crédito)
    const importe = parseFloat(importeStr.replace(',', '.')) || 0
    const saldo = saldoStr ? parseFloat(saldoStr.replace(',', '.')) : undefined
    
    if (importe === 0) continue
    
    movements.push({
      fecha,
      descripcion,
      referencia,
      monto: Math.abs(importe),
      tipo: importe < 0 ? 'DEBITO' : 'CREDITO',
      saldo
    })
  }
  
  return movements
}

// Parser para Patagonia
function parsePatagonia(content: string): ParsedMovement[] {
  const lines = content.split('\n').filter(line => line.trim())
  const movements: ParsedMovement[] = []
  
  const startIndex = lines[0].toLowerCase().includes('fecha') ? 1 : 0
  
  for (let i = startIndex; i < lines.length; i++) {
    const parts = lines[i].split(';').map(p => p.trim())
    if (parts.length < 5) continue
    
    const [fechaStr, tipo, comprobante, descripcion, debitoStr, creditoStr, saldoStr] = parts
    
    // Parsear fecha DD/MM/YYYY
    const fechaParts = fechaStr.split('/')
    if (fechaParts.length !== 3) continue
    
    const fecha = new Date(
      parseInt(fechaParts[2]),
      parseInt(fechaParts[1]) - 1,
      parseInt(fechaParts[0])
    )
    
    const debito = parseFloat(debitoStr?.replace(',', '.') || '0') || 0
    const credito = parseFloat(creditoStr?.replace(',', '.') || '0') || 0
    const saldo = saldoStr ? parseFloat(saldoStr.replace(',', '.')) : undefined
    
    if (debito === 0 && credito === 0) continue
    
    movements.push({
      fecha,
      descripcion: `${descripcion} (Comp: ${comprobante})`,
      referencia: comprobante,
      monto: credito > 0 ? credito : debito,
      tipo: credito > 0 ? 'CREDITO' : 'DEBITO',
      saldo
    })
  }
  
  return movements
}

// POST - Importar archivo CSV del banco
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const banco = formData.get('banco') as string
    const cuentaBancariaId = formData.get('cuentaBancariaId') as string
    const creadoPor = formData.get('creadoPor') as string | null
    
    if (!file || !banco || !cuentaBancariaId) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Validación de MIME type (solo .csv, .xlsx)
    const ALLOWED_MIME_TYPES = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',  // algunos navegadores envían CSV como text/plain
    ]
    const ALLOWED_EXTENSIONS = ['.csv', '.xlsx']

    const fileName = file.name.toLowerCase()
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))

    if (!hasValidExtension || !ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de archivo no permitido. Solo se aceptan archivos .csv y .xlsx' },
        { status: 400 }
      )
    }

    // Validación de tamaño (máximo 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `El archivo excede el tamaño máximo permitido (10MB). Tamaño actual: ${(file.size / (1024 * 1024)).toFixed(1)}MB` },
        { status: 400 }
      )
    }
    
    // Verificar que la cuenta bancaria existe
    const cuentaBancaria = await db.cuentaBancaria.findUnique({
      where: { id: cuentaBancariaId }
    })
    
    if (!cuentaBancaria) {
      return NextResponse.json(
        { success: false, error: 'Cuenta bancaria no encontrada' },
        { status: 404 }
      )
    }
    
    // Leer contenido del archivo
    const content = await file.text()
    
    // Parsear según el banco
    let movements: ParsedMovement[] = []
    
    switch (banco.toUpperCase()) {
      case 'CMF':
        movements = parseCMF(content)
        break
      case 'MACRO':
        movements = parseMacro(content)
        break
      case 'PATAGONIA':
        movements = parsePatagonia(content)
        break
      default:
        return NextResponse.json(
          { success: false, error: `Banco no soportado: ${banco}` },
          { status: 400 }
        )
    }
    
    if (movements.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se encontraron movimientos en el archivo' },
        { status: 400 }
      )
    }
    
    // Calcular totales
    const totalDebitos = movements
      .filter(m => m.tipo === 'DEBITO')
      .reduce((sum, m) => sum + m.monto, 0)
    
    const totalCreditos = movements
      .filter(m => m.tipo === 'CREDITO')
      .reduce((sum, m) => sum + m.monto, 0)
    
    // Determinar rango de fechas
    const fechas = movements.map(m => m.fecha.getTime())
    const fechaDesde = new Date(Math.min(...fechas))
    const fechaHasta = new Date(Math.max(...fechas))
    
    // Crear conciliación con detalles
    const conciliacion = await db.conciliacionBancaria.create({
      data: {
        cuentaBancariaId,
        fechaDesde,
        fechaHasta,
        nombreArchivo: file.name,
        totalRegistros: movements.length,
        totalDebitos,
        totalCreditos,
        creadoPor,
        detalles: {
          create: movements.map(m => ({
            fechaExtracto: m.fecha,
            descripcionExtracto: m.descripcion,
            referenciaExtracto: m.referencia,
            montoExtracto: m.monto,
            tipoExtracto: m.tipo,
            estado: 'PENDIENTE'
          }))
        }
      },
      include: {
        detalles: true
      }
    })
    
    return NextResponse.json({
      success: true,
      data: conciliacion,
      resumen: {
        totalRegistros: movements.length,
        totalDebitos,
        totalCreditos,
        fechaDesde,
        fechaHasta
      }
    })
  } catch (error) {
    console.error('Error importando extracto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al importar el extracto bancario' },
      { status: 500 }
    )
  }
}

// GET - Listar conciliaciones
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const cuentaBancariaId = searchParams.get('cuentaBancariaId')
    const estado = searchParams.get('estado')
    
    const where: any = {}
    if (cuentaBancariaId) where.cuentaBancariaId = cuentaBancariaId
    if (estado) where.estado = estado
    
    const conciliaciones = await db.conciliacionBancaria.findMany({
      where,
      include: {
        cuentaBancaria: true,
        _count: {
          select: { detalles: true }
        }
      },
      orderBy: { fecha: 'desc' }
    })
    
    return NextResponse.json({
      success: true,
      data: conciliaciones
    })
  } catch (error) {
    console.error('Error obteniendo conciliaciones:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener conciliaciones' },
      { status: 500 }
    )
  }
}
