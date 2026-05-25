import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener stock de cuartos con filtros
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const camaraId = searchParams.get('camaraId')
    const estado = searchParams.get('estado')
    const sigla = searchParams.get('sigla')
    const tropa = searchParams.get('tropa')
    const propietarioId = searchParams.get('propietarioId')

    const where: any = {}
    
    if (camaraId) where.camaraId = camaraId
    if (estado) where.estado = estado
    if (sigla) where.sigla = sigla
    if (propietarioId) where.propietarioId = propietarioId
    if (tropa) {
      where.mediaRes = {
        romaneo: {
          tropaCodigo: { contains: tropa }
        }
      }
    }

    const cuartos = await db.cuarto.findMany({
      where,
      include: {
        mediaRes: {
          include: {
            romaneo: {
              select: {
                tropaCodigo: true,
                garron: true,
                fecha: true,
                tipoAnimal: true,
                denticion: true
              }
            },
            usuarioFaena: {
              select: { id: true, nombre: true }
            }
          }
        },
        camara: {
          select: { id: true, nombre: true, tipo: true }
        },
        propietario: {
          select: { id: true, nombre: true, cuit: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calcular estadísticas
    const stats = {
      totalCuartos: cuartos.length,
      enCamara: cuartos.filter(c => c.estado === 'EN_CAMARA').length,
      enDespostada: cuartos.filter(c => c.estado === 'EN_DESPOSTADA').length,
      despostados: cuartos.filter(c => c.estado === 'EN_DESPOSTADA').length,
      pesoTotal: cuartos.reduce((acc, c) => acc + (c.peso || 0), 0),
      porSigla: {
        A: cuartos.filter(c => c.sigla === 'A').length,
        D: cuartos.filter(c => c.sigla === 'D').length,
        T: cuartos.filter(c => c.sigla === 'T').length
      },
      pesoPorSigla: {
        A: cuartos.filter(c => c.sigla === 'A').reduce((acc, c) => acc + (c.peso || 0), 0),
        D: cuartos.filter(c => c.sigla === 'D').reduce((acc, c) => acc + (c.peso || 0), 0),
        T: cuartos.filter(c => c.sigla === 'T').reduce((acc, c) => acc + (c.peso || 0), 0)
      },
      alertasVencimiento: [] as { tipo: string; tropaCodigo: string; dias: number }[]
    }

    // Agrupar por cámara
    const porCamara = cuartos.reduce((acc: any, c) => {
      const camaraNombre = c.camara?.nombre || 'Sin cámara'
      if (!acc[camaraNombre]) {
        acc[camaraNombre] = { cantidad: 0, peso: 0 }
      }
      acc[camaraNombre].cantidad++
      acc[camaraNombre].peso += (c.peso || 0)
      return acc
    }, {})

    // Agrupar por tropa
    const porTropa = cuartos.reduce((acc: any, c) => {
      const tropa = c.mediaRes.romaneo?.tropaCodigo || 'Sin tropa'
      if (!acc[tropa]) {
        acc[tropa] = { cantidad: 0, peso: 0, propietario: c.propietario?.nombre || c.mediaRes.usuarioFaena?.nombre }
      }
      acc[tropa].cantidad++
      acc[tropa].peso += (c.peso || 0)
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: cuartos,
      stats,
      porCamara,
      porTropa
    })
  } catch (error) {
    console.error('Error obteniendo stock de cuartos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener stock de cuartos' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar estado de cuarto o mover de cámara
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, estado, camaraId, propietarioId, pesoCuarto, operadorId } = body

    const updateData: any = {}
    
    if (estado) {
      updateData.estado = estado
    }
    if (camaraId !== undefined) updateData.camaraId = camaraId
    if (propietarioId !== undefined) updateData.propietarioId = propietarioId
    if (pesoCuarto !== undefined) {
      updateData.peso = pesoCuarto
    }

    const cuarto = await db.cuarto.update({
      where: { id },
      data: updateData,
      include: {
        mediaRes: { include: { romaneo: { select: { tropaCodigo: true } } } },
        camara: true,
        propietario: true
      }
    })

    // Registrar auditoría
    if (operadorId) {
      await db.auditoria.create({
        data: {
          operadorId,
          modulo: 'STOCK_CUARTOS',
          accion: 'UPDATE',
          entidad: 'Cuarto',
          entidadId: id,
          descripcion: `Actualización: ${JSON.stringify(updateData)}`
        }
      })
    }

    return NextResponse.json({ success: true, data: cuarto })
  } catch (error) {
    console.error('Error actualizando cuarto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar cuarto' },
      { status: 500 }
    )
  }
}
