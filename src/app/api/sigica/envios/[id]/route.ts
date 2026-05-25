import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET /api/sigica/envios/[id] - Obtener detalles de un envío específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const { id } = await params
    
    const envio = await db.envioSIGICA.findUnique({
      where: { id },
      include: {
        operador: {
          select: {
            id: true,
            nombre: true,
            usuario: true,
            email: true
          }
        }
      }
    })

    if (!envio) {
      return NextResponse.json(
        { success: false, error: 'Envío no encontrado' },
        { status: 404 }
      )
    }

    // Parsear datos enviados si existen
    let datosEnviados: Record<string, unknown> | unknown = null
    if (envio.datosEnviados) {
      try {
        datosEnviados = JSON.parse(envio.datosEnviados) as Record<string, unknown>
      } catch {
        datosEnviados = envio.datosEnviados
      }
    }

    // Parsear respuesta SIGICA si existe
    let respuestaSIGICA: any = null
    if (envio.respuestaSIGICA) {
      try {
        respuestaSIGICA = JSON.parse(envio.respuestaSIGICA)
      } catch {
        respuestaSIGICA = envio.respuestaSIGICA
      }
    }

    // Parsear romaneoIds si existen
    let romaneoIds: string[] = []
    if (envio.romaneoIds) {
      try {
        romaneoIds = JSON.parse(envio.romaneoIds)
      } catch {
        romaneoIds = []
      }
    }

    // Si es un envío de romaneo, obtener los datos de los romaneos
    let romaneos: any = null
    if (envio.tipo === 'ROMANEO' && romaneoIds.length > 0) {
      romaneos = await db.romaneo.findMany({
        where: {
          id: { in: romaneoIds }
        },
        select: {
          id: true,
          garron: true,
          tropaCodigo: true,
          fecha: true,
          pesoVivo: true,
          pesoTotal: true,
          pesoMediaIzq: true,
          pesoMediaDer: true,
          tipoAnimal: true,
          raza: true,
          denticion: true,
          tipificador: {
            select: {
              nombre: true,
              apellido: true,
              matricula: true
            }
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...envio,
        datosEnviados,
        respuestaSIGICA,
        romaneoIds,
        romaneos
      }
    })
  } catch (error) {
    console.error('Error al obtener envío SIGICA:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener envío' },
      { status: 500 }
    )
  }
}

// DELETE /api/sigica/envios/[id] - Eliminar un envío (solo si está en error o pendiente)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const { id } = await params
    
    const envio = await db.envioSIGICA.findUnique({
      where: { id }
    })

    if (!envio) {
      return NextResponse.json(
        { success: false, error: 'Envío no encontrado' },
        { status: 404 }
      )
    }

    // Solo se pueden eliminar envíos pendientes o con error
    if (!['PENDIENTE', 'ERROR'].includes(envio.estado)) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar un envío que ya fue procesado' },
        { status: 400 }
      )
    }

    await db.envioSIGICA.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Envío eliminado correctamente'
    })
  } catch (error) {
    console.error('Error al eliminar envío SIGICA:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar envío' },
      { status: 500 }
    )
  }
}
