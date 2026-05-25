import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// PUT - Supervisor approval (Visto Bueno)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkPermission(request, 'puedeListaFaena')
  if (authError) return authError
  try {
    const { id } = await params
    const body = await request.json()
    const { supervisorId, comentarioVistoBueno, aprobado } = body

    // Verify supervisor exists and has correct role
    const supervisor = await db.operador.findUnique({
      where: { id: supervisorId }
    })

    if (!supervisor) {
      return NextResponse.json(
        { success: false, error: 'Supervisor no encontrado' },
        { status: 404 }
      )
    }

    if (supervisor.rol !== 'SUPERVISOR' && supervisor.rol !== 'ADMINISTRADOR') {
      return NextResponse.json(
        { success: false, error: 'El operador no tiene permisos de supervisor' },
        { status: 403 }
      )
    }

    const flujoActual = await db.flujoFaena.findUnique({
      where: { id },
      include: {
        listaFaena: true
      }
    })

    if (!flujoActual) {
      return NextResponse.json(
        { success: false, error: 'Flujo no encontrado' },
        { status: 404 }
      )
    }

    // Check if data was verified first
    if (!flujoActual.datosVerificados) {
      return NextResponse.json(
        { success: false, error: 'Los datos deben ser verificados antes de dar el visto bueno' },
        { status: 400 }
      )
    }

    // Check if already has visto bueno
    if (flujoActual.vistoBueno) {
      return NextResponse.json(
        { success: false, error: 'Ya se otorgó el visto bueno para este flujo' },
        { status: 400 }
      )
    }

    // Check current state
    if (flujoActual.estado !== 'PENDIENTE_VISTO_BUENO') {
      return NextResponse.json(
        { success: false, error: `El flujo está en estado ${flujoActual.estado}, no puede recibir visto bueno` },
        { status: 400 }
      )
    }

    let nuevoEstado: 'CONFIRMADO' | 'VERIFICACION' = aprobado ? 'CONFIRMADO' : 'VERIFICACION'
    let mensajeHistorial = aprobado 
      ? `Visto bueno otorgado por ${supervisor.nombre}` 
      : `Visto bueno rechazado por ${supervisor.nombre}. Se requiere nueva verificación.`

    const flujo = await db.flujoFaena.update({
      where: { id },
      data: {
        supervisorId,
        fechaVistoBueno: aprobado ? new Date() : null,
        comentarioVistoBueno,
        estado: nuevoEstado,
      },
      include: {
        listaFaena: {
          include: {
            supervisor: true,
            tropas: {
              include: {
                tropa: {
                  include: {
                    usuarioFaena: true
                  }
                }
              }
            }
          }
        },
        verificador: true,
        supervisor: true,
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: flujo,
      message: aprobado 
        ? 'Visto bueno otorgado correctamente. Los datos pueden ser subidos al sistema.' 
        : 'Visto bueno rechazado. Se requiere nueva verificación de datos.'
    })
  } catch (error) {
    console.error('Error in supervisor approval:', error)
    return NextResponse.json(
      { success: false, error: 'Error al procesar visto bueno' },
      { status: 500 }
    )
  }
}
