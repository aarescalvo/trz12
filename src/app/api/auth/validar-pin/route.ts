import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Validar PIN de supervisor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pin, operadorId } = body

    if (!pin) {
      return NextResponse.json(
        { success: false, error: 'PIN es requerido' },
        { status: 400 }
      )
    }

    // Si se proporciona operadorId, verificar si es ADMINISTRADOR
    if (operadorId) {
      const operador = await db.operador.findUnique({
        where: { id: operadorId },
        select: { rol: true, pinSupervisor: true }
      })

      if (operador?.rol === 'ADMINISTRADOR') {
        return NextResponse.json({
          success: true,
          data: { autorizado: true, rol: 'ADMINISTRADOR' },
          message: 'Acceso autorizado como administrador'
        })
      }

      // Si el operador tiene PIN de supervisor configurado, validarlo
      if (operador?.pinSupervisor && operador.pinSupervisor === pin) {
        return NextResponse.json({
          success: true,
          data: { autorizado: true, rol: operador.rol },
          message: 'PIN de supervisor validado correctamente'
        })
      }
    }

    // Buscar un supervisor o administrador con el PIN proporcionado
    const supervisor = await db.operador.findFirst({
      where: {
        pinSupervisor: pin,
        activo: true,
        rol: { in: ['SUPERVISOR', 'ADMINISTRADOR'] }
      },
      select: { id: true, nombre: true, rol: true }
    })

    if (supervisor) {
      return NextResponse.json({
        success: true,
        data: { 
          autorizado: true, 
          supervisorId: supervisor.id,
          supervisorNombre: supervisor.nombre,
          rol: supervisor.rol 
        },
        message: 'Acceso autorizado'
      })
    }

    return NextResponse.json(
      { success: false, error: 'PIN incorrecto o sin permisos de supervisor' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Error validating PIN:', error)
    return NextResponse.json(
      { success: false, error: 'Error al validar PIN' },
      { status: 500 }
    )
  }
}
