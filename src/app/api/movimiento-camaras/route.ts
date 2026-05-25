import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// POST - Mover medias reses entre cámaras
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json()
    const { camaraOrigenId, camaraDestinoId, mediaResIds, observaciones, operadorId } = body

    // Validaciones
    if (!camaraDestinoId) {
      return NextResponse.json(
        { success: false, error: 'Cámara destino es requerida' },
        { status: 400 }
      )
    }

    if (!mediaResIds || !Array.isArray(mediaResIds) || mediaResIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Debe seleccionar al menos una media' },
        { status: 400 }
      )
    }

    // Verificar que la cámara destino existe y tiene capacidad
    const camaraDestino = await db.camara.findUnique({
      where: { id: camaraDestinoId }
    })

    if (!camaraDestino) {
      return NextResponse.json(
        { success: false, error: 'Cámara destino no encontrada' },
        { status: 404 }
      )
    }

    // Verificar capacidad de la cámara destino
    const stockDestino = await db.mediaRes.count({
      where: { camaraId: camaraDestinoId, estado: 'EN_CAMARA' }
    })

    if (stockDestino + mediaResIds.length > camaraDestino.capacidad) {
      return NextResponse.json(
        { success: false, error: `La cámara ${camaraDestino.nombre} no tiene suficiente capacidad` },
        { status: 400 }
      )
    }

    // Obtener las medias a mover
    const medias = await db.mediaRes.findMany({
      where: { 
        id: { in: mediaResIds }
      },
      include: { romaneo: true }
    })

    if (medias.length !== mediaResIds.length) {
      return NextResponse.json(
        { success: false, error: 'Algunas medias no fueron encontradas' },
        { status: 404 }
      )
    }

    // Wrap entire movement operation in a transaction for atomicity
    await db.$transaction(async (tx) => {
      // Actualizar las medias (mover a nueva cámara)
      await tx.mediaRes.updateMany({
        where: { id: { in: mediaResIds } },
        data: { camaraId: camaraDestinoId }
      })

      // Crear registro de movimiento para cada media
      const movimientosData = medias.map(media => ({
        camaraOrigenId: camaraOrigenId || null,
        camaraDestinoId,
        producto: 'Media Res',
        cantidad: 1,
        peso: media.peso,
        tropaCodigo: media.romaneo?.tropaCodigo || null,
        mediaResId: media.id,
        operadorId: operadorId || null,
        observaciones: observaciones || null
      }))

      await tx.movimientoCamara.createMany({
        data: movimientosData
      })

      // Actualizar stock de cámaras
      if (camaraOrigenId) {
        // Actualizar stock de la cámara de origen
        const mediasPorTropaOrigen = medias.reduce((acc, m) => {
          const tropa = m.romaneo?.tropaCodigo
          if (tropa) {
            if (!acc[tropa]) acc[tropa] = { cantidad: 0, peso: 0 }
            acc[tropa].cantidad++
            acc[tropa].peso += m.peso
          }
          return acc
        }, {} as Record<string, { cantidad: number; peso: number }>)

        for (const [tropaCodigo, datos] of Object.entries(mediasPorTropaOrigen)) {
          const stockExistente = await tx.stockMediaRes.findUnique({
            where: {
              camaraId_tropaCodigo_especie: {
                camaraId: camaraOrigenId,
                tropaCodigo,
                especie: 'BOVINO'
              }
            }
          })

          if (stockExistente) {
            const nuevaCantidad = stockExistente.cantidad - datos.cantidad
            const nuevoPeso = stockExistente.pesoTotal - datos.peso

            if (nuevaCantidad <= 0) {
              // Eliminar registro si no queda stock
              await tx.stockMediaRes.delete({
                where: { id: stockExistente.id }
              })
            } else {
              // Actualizar stock
              await tx.stockMediaRes.update({
                where: { id: stockExistente.id },
                data: {
                  cantidad: nuevaCantidad,
                  pesoTotal: nuevoPeso
                }
              })
            }
          }
        }
      }

      // Actualizar/Agregar stock de la cámara destino
      const mediasPorTropaDestino = medias.reduce((acc, m) => {
        const tropa = m.romaneo?.tropaCodigo
        if (tropa) {
          if (!acc[tropa]) acc[tropa] = { cantidad: 0, peso: 0 }
          acc[tropa].cantidad++
          acc[tropa].peso += m.peso
        }
        return acc
      }, {} as Record<string, { cantidad: number; peso: number }>)

      for (const [tropaCodigo, datos] of Object.entries(mediasPorTropaDestino)) {
        const stockExistenteDestino = await tx.stockMediaRes.findUnique({
          where: {
            camaraId_tropaCodigo_especie: {
              camaraId: camaraDestinoId,
              tropaCodigo,
              especie: 'BOVINO'
            }
          }
        })

        if (stockExistenteDestino) {
          // Actualizar stock existente
          await tx.stockMediaRes.update({
            where: { id: stockExistenteDestino.id },
            data: {
              cantidad: { increment: datos.cantidad },
              pesoTotal: { increment: datos.peso }
            }
          })
        } else {
          // Crear nuevo registro de stock
          await tx.stockMediaRes.create({
            data: {
              camaraId: camaraDestinoId,
              tropaCodigo,
              especie: 'BOVINO',
              cantidad: datos.cantidad,
              pesoTotal: datos.peso
            }
          })
        }
      }

      // Registrar auditoría
      if (operadorId) {
        await tx.auditoria.create({
          data: {
            operadorId,
            modulo: 'MOVIMIENTO_CAMARAS',
            accion: 'UPDATE',
            entidad: 'MediaRes',
            descripcion: `Movimiento de ${medias.length} media(s) de cámara ${camaraOrigenId || 'sin origen'} a ${camaraDestino.nombre}`,
            datosDespues: JSON.stringify({ mediaResIds, camaraOrigenId, camaraDestinoId })
          }
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        cantidadMovida: medias.length,
        pesoTotal: medias.reduce((sum, m) => sum + m.peso, 0),
        camaraOrigen: camaraOrigenId,
        camaraDestino: camaraDestino.nombre
      }
    })
  } catch (error) {
    console.error('Error en movimiento de cámaras:', error)
    return NextResponse.json(
      { success: false, error: 'Error al procesar movimiento' },
      { status: 500 }
    )
  }
}
