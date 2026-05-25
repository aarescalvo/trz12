import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validarPermiso } from '@/lib/auth-helpers'

function getOperadorId(request: NextRequest): string | null {
  return request.headers.get('x-operador-id')
}

// GET - Obtener configuración del frigorífico
export async function GET() {
  try {
    // Buscar la configuración existente (solo debe haber una)
    let config = await db.configuracionFrigorifico.findFirst()

    // Si no existe, crear una por defecto
    if (!config) {
      config = await db.configuracionFrigorifico.create({
        data: {
          nombre: 'Solemar Alimentaria',
          emailHabilitado: false
        }
      })
    }

    // No devolver la contraseña de email por seguridad
    const { emailPassword, ...configSafe } = config

    return NextResponse.json({
      success: true,
      data: configSafe
    })
  } catch (error) {
    console.error('Error al obtener configuración:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener configuración' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar configuración del frigorífico
export async function PUT(request: NextRequest) {
  try {
    const operadorId = getOperadorId(request)
    const puedeEditar = await validarPermiso(operadorId, 'puedeConfiguracion')
    if (!puedeEditar) {
      return NextResponse.json({ success: false, error: 'Sin permisos de configuración' }, { status: 403 })
    }

    const body = await request.json()

    // Buscar configuración existente
    let config = await db.configuracionFrigorifico.findFirst()

    if (!config) {
      // Crear si no existe
      config = await db.configuracionFrigorifico.create({
        data: {
          nombre: body.nombre || 'Solemar Alimentaria',
          direccion: body.direccion || null,
          numeroEstablecimiento: body.numeroEstablecimiento || null,
          cuit: body.cuit || null,
          numeroMatricula: body.numeroMatricula || null,
          emailHost: body.emailHost || null,
          emailPuerto: body.emailPuerto || 587,
          emailUsuario: body.emailUsuario || null,
          emailHabilitado: body.emailHabilitado || false
        }
      })
    } else {
      // Actualizar existente
      config = await db.configuracionFrigorifico.update({
        where: { id: config.id },
        data: {
          nombre: body.nombre,
          direccion: body.direccion || null,
          numeroEstablecimiento: body.numeroEstablecimiento || null,
          cuit: body.cuit || null,
          numeroMatricula: body.numeroMatricula || null,
          emailHost: body.emailHost || null,
          emailPuerto: body.emailPuerto || 587,
          emailUsuario: body.emailUsuario || null,
          emailHabilitado: body.emailHabilitado || false
        }
      })
    }

    // No devolver la contraseña de email por seguridad
    const { emailPassword, ...configSafe } = config

    return NextResponse.json({
      success: true,
      data: configSafe
    })
  } catch (error) {
    console.error('Error al guardar configuración:', error)
    return NextResponse.json(
      { success: false, error: 'Error al guardar configuración' },
      { status: 500 }
    )
  }
}
