import { NextRequest, NextResponse } from 'next/server'
import net from 'net'
import { checkPermission } from '@/lib/auth-helpers'

// POST - Enviar ZPL directamente a impresora por TCP/IP con parámetros de velocidad y calor
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedePesaje')
  if (authError) return authError

  try {
    const data = await request.json()
    const {
      contenido,
      impresoraIp,
      impresoraPuerto = 9100,
      velocidad,
      calor,
      anchoEtiqueta,
      altoEtiqueta
    } = data

    if (!contenido || !impresoraIp) {
      return NextResponse.json(
        { error: 'Contenido ZPL e IP de impresora son requeridos' },
        { status: 400 }
      )
    }

    // Inyectar comandos de configuración en el ZPL
    let zplFinal = contenido
    const configCommands: string[] = []

    // Tamaño de etiqueta: ^PW (print width) y ^LL (label length)
    // 203 dpi = 8 dots/mm
    if (anchoEtiqueta) {
      const anchoDots = Math.round(Number(anchoEtiqueta) * 8)
      configCommands.push(`^PW${anchoDots}`)
    }
    if (altoEtiqueta) {
      const altoDots = Math.round(Number(altoEtiqueta) * 8)
      configCommands.push(`^LL${altoDots}`)
    }

    // Velocidad de impresión: ^PR (Print Rate)
    // ^PRa,b,c: a = print speed (2-12 ips), b = slew speed, c = density
    if (velocidad !== undefined && velocidad !== null) {
      const v = Math.min(12, Math.max(1, parseInt(String(velocidad)) || 4))
      configCommands.push(`^PR${v},${v + 2},`)
    }

    // Calor/densidad: ~SD (Set Darkness) 0-30
    if (calor !== undefined && calor !== null) {
      const d = Math.min(30, Math.max(0, parseInt(String(calor)) || 10))
      configCommands.push(`~SD${d}`)
    }

    // Inyectar configuración después de ^XA
    if (configCommands.length > 0 && zplFinal.includes('^XA')) {
      const configBlock = configCommands.join('\n')
      zplFinal = zplFinal.replace('^XA', `^XA\n${configBlock}`)
    }

    // Enviar a impresora via TCP socket
    await enviarAImpresora(zplFinal, impresoraIp, impresoraPuerto)

    return NextResponse.json({
      success: true,
      message: `Enviado a ${impresoraIp}:${impresoraPuerto}`,
      velocidad: velocidad || 'default',
      calor: calor || 'default',
      tamaño: anchoEtiqueta && altoEtiqueta ? `${anchoEtiqueta}x${altoEtiqueta}mm` : 'default'
    })
  } catch (error) {
    console.error('Error al enviar a impresora:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al enviar a la impresora',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// Enviar a impresora via socket TCP
function enviarAImpresora(contenido: string, ip: string, puerto: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket()

    client.connect(puerto, ip, () => {
      client.write(contenido, 'utf8', () => {
        client.end()
        resolve()
      })
    })

    client.on('error', (err: Error) => {
      reject(err)
    })

    client.on('timeout', () => {
      client.destroy()
      reject(new Error('Timeout conectando a impresora'))
    })

    client.setTimeout(10000) // 10 segundos
  })
}
