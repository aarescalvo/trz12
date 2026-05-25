import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkAnyPermission } from '@/lib/auth-helpers'

// Permisos válidos para leer la balanza (usada por múltiples módulos operativos)
const BALANZA_PERMISOS = [
  'puedePesajeIndividual',
  'puedeRomaneo',
  'puedeCuarteo',
  'puedeEmpaque',
  'puedeDesposte',
] as const

// Simulador de peso para testing
function simularPeso() {
  // Generar peso aleatorio entre 400 y 600 kg (típico de una res)
  const peso = 400 + Math.random() * 200
  const estable = Math.random() > 0.3 // 70% probabilidad de estar estable
  return {
    peso: Math.round(peso * 10) / 10,
    unidad: 'kg',
    estable,
    timestamp: new Date().toISOString(),
    simulado: true
  }
}

// GET - Lectura de peso en tiempo real
export async function GET(request: NextRequest) {
  const authError = await checkAnyPermission(request, [...BALANZA_PERMISOS])
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const simular = searchParams.get('simular') === 'true'

    // Si es modo simulación, retornar peso aleatorio
    if (simular) {
      return NextResponse.json({
        success: true,
        data: simularPeso()
      })
    }

    // Obtener configuración de balanza
    const config = await db.configBalanza.findFirst({
      where: { activa: true }
    })

    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'No hay balanza configurada',
        data: simularPeso() // Retornar simulación como fallback
      })
    }

    // En producción, aquí iría la lectura real del puerto serial
    // Por ahora retornamos simulación
    // TODO: Implementar con serialport cuando se use en producción real
    
    /* Código para producción real:
    const SerialPort = require('serialport')
    const port = new SerialPort(config.puerto, {
      baudRate: config.baudRate,
      dataBits: config.dataBits,
      parity: config.parity,
      stopBits: config.stopBits
    })
    
    // Leer datos según protocolo
    const data = await leerProtocolo(port, config.protocolo)
    */

    return NextResponse.json({
      success: true,
      data: {
        ...simularPeso(),
        configuracion: {
          puerto: config.puertoSerial,
          protocolo: config.protocolo
        }
      }
    })
  } catch (error) {
    console.error('Error reading balanza:', error)
    return NextResponse.json({
      success: false,
      error: 'Error de comunicación con balanza',
      data: simularPeso() // Retornar simulación como fallback
    }, { status: 500 })
  }
}

