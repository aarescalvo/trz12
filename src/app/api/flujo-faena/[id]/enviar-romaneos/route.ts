import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// PUT - Send romaneos to clients
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkPermission(request, 'puedeListaFaena')
  if (authError) return authError
  try {
    const { id } = await params
    const body = await request.json()
    const { operadorId, observaciones, destinatarios, metodoEnvio } = body

    const flujoActual = await db.flujoFaena.findUnique({
      where: { id },
      include: {
        listaFaena: {
          include: {
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
        }
      }
    })

    if (!flujoActual) {
      return NextResponse.json(
        { success: false, error: 'Flujo no encontrado' },
        { status: 404 }
      )
    }

    // Verify that reports were emitted
    if (!flujoActual.reportesEmitidos) {
      return NextResponse.json(
        { success: false, error: 'Los reportes deben ser emitidos antes de enviar romaneos' },
        { status: 400 }
      )
    }

    // Check if romaneos were already sent
    if (flujoActual.romaneosEnviados) {
      return NextResponse.json(
        { success: false, error: 'Los romaneos ya fueron enviados' },
        { status: 400 }
      )
    }

    // Check current state
    if (flujoActual.estado !== 'REPORTES_EMITIDOS') {
      return NextResponse.json(
        { success: false, error: `El flujo está en estado ${flujoActual.estado}, no puede enviar romaneos` },
        { status: 400 }
      )
    }

    // Get all unique clients from the tropas
    const clientes = new Set<string>()

    if (flujoActual.listaFaena) {
      for (const tropaItem of flujoActual.listaFaena.tropas) {
        if (tropaItem.tropa.usuarioFaena) {
          clientes.add(JSON.stringify({
            id: tropaItem.tropa.usuarioFaenaId,
            nombre: tropaItem.tropa.usuarioFaena.nombre,
            email: tropaItem.tropa.usuarioFaena.email
          }))
        }
      }
    }

    const clientesArray = Array.from(clientes).map(c => JSON.parse(c))

    // Build shipping metadata
    const envioMetadata = {
      fechaEnvio: new Date().toISOString(),
      metodoEnvio: metodoEnvio || 'EMAIL',
      destinatarios: destinatarios || clientesArray,
      totalClientes: clientesArray.length,
      enviadoPor: operadorId
    }

    const flujo = await db.flujoFaena.update({
      where: { id },
      data: {
        fechaEnvioRomaneos: new Date(),
        estado: 'ROMANEOS_ENVIADOS',
        observaciones: observaciones 
          ? `${flujoActual.observaciones || ''}\n[Romaneos] ${observaciones}` 
          : flujoActual.observaciones,
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
      message: `Romaneos enviados correctamente a ${clientesArray.length} cliente(s).`,
      metadata: envioMetadata
    })
  } catch (error) {
    console.error('Error sending romaneos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al enviar romaneos' },
      { status: 500 }
    )
  }
}
