import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { checkRateLimit, generateRateLimitKey } from '@/lib/rate-limit'

// POST - Validar credenciales de supervisor
export async function POST(request: NextRequest) {
  try {
    // Rate limiting para supervisor
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimitKey = generateRateLimitKey(ip, 'auth:supervisor')
    const rateLimit = checkRateLimit(rateLimitKey, 'AUTH_SUPERVISOR')

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: rateLimit.blocked
            ? 'Demasiados intentos de supervisor. Intente más tarde.'
            : 'Rate limit excedido',
          retryAfter: rateLimit.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter || 60)
          }
        }
      )
    }

    const body = await request.json()
    const { pin, password, usuario } = body

    let operador: any = null

    // Validar con PIN
    if (pin) {
      operador = await db.operador.findFirst({
        where: {
          pin: String(pin),
          activo: true,
          rol: { in: ['SUPERVISOR', 'ADMINISTRADOR'] }
        }
      })
    }
    // Validar con usuario y password
    else if (usuario && password) {
      operador = await db.operador.findFirst({
        where: {
          usuario: String(usuario).toLowerCase(),
          activo: true,
          rol: { in: ['SUPERVISOR', 'ADMINISTRADOR'] }
        }
      })

      if (operador) {
        const validPassword = await bcrypt.compare(password, operador.password)
        if (!validPassword) {
          return NextResponse.json(
            { success: false, error: 'Contraseña incorrecta' },
            { status: 401 }
          )
        }
      }
    }

    if (!operador) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas o no tiene permisos de supervisor' },
        { status: 401 }
      )
    }

    // Registrar auditoría
    await db.auditoria.create({
      data: {
        operadorId: operador.id,
        modulo: 'AUTH_SUPERVISOR',
        accion: 'VALIDACION',
        entidad: 'Operador',
        entidadId: operador.id,
        descripcion: `Validación de supervisor: ${operador.nombre}`
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: operador.id,
        nombre: operador.nombre,
        rol: operador.rol
      }
    })
  } catch (error) {
    console.error('Error validando supervisor:', error)
    return NextResponse.json(
      { success: false, error: 'Error de servidor' },
      { status: 500 }
    )
  }
}
