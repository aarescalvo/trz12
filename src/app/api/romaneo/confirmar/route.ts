import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// POST - Confirmar romaneo
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError
  try {
    const body = await request.json()
    const { romaneoId, supervisorId } = body

    if (!romaneoId) {
      return NextResponse.json(
        { success: false, error: 'romaneoId es requerido' },
        { status: 400 }
      )
    }

    // Actualizar estado del romaneo
    const romaneo = await db.romaneo.update({
      where: { id: romaneoId },
      data: {
        estado: 'CONFIRMADO',
        supervisorId,
        fechaConfirmacion: new Date()
      },
      include: {
        tipificador: true
      }
    })

    // Crear las medias reses automáticamente si no existen
    const mediasExistentes = await db.mediaRes.count({
      where: { romaneoId }
    })

    if (mediasExistentes === 0 && romaneo.pesoMediaIzq && romaneo.pesoMediaDer) {
      // Generar códigos de barras
      const codigoBase = `${romaneo.tropaCodigo || 'S/T'}-${romaneo.garron}`

      // Crear media izquierda
      await db.mediaRes.create({
        data: {
          romaneoId,
          lado: 'IZQUIERDA',
          peso: romaneo.pesoMediaIzq,
          sigla: 'A',
          codigo: `${codigoBase}-I-${Date.now().toString(36).toUpperCase()}`,
          estado: 'EN_CAMARA'
        }
      })

      // Crear media derecha
      await db.mediaRes.create({
        data: {
          romaneoId,
          lado: 'DERECHA',
          peso: romaneo.pesoMediaDer,
          sigla: 'A',
          codigo: `${codigoBase}-D-${Date.now().toString(36).toUpperCase()}`,
          estado: 'EN_CAMARA'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: romaneo.id,
        garron: romaneo.garron,
        estado: romaneo.estado,
        fechaConfirmacion: romaneo.fechaConfirmacion
      }
    })
  } catch (error) {
    console.error('Error confirmando romaneo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al confirmar romaneo' },
      { status: 500 }
    )
  }
}
