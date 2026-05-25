import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar diferencias pendientes
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const conciliacionId = searchParams.get('conciliacionId')
    const estado = searchParams.get('estado') || 'DIFERENCIA'
    
    const where: any = {}
    if (conciliacionId) where.conciliacionId = conciliacionId
    if (estado) where.estado = estado
    
    const detalles = await db.detalleConciliacion.findMany({
      where,
      include: {
        conciliacion: {
          include: {
            cuentaBancaria: true
          }
        },
        movimientoCaja: true
      },
      orderBy: { fechaExtracto: 'asc' }
    })
    
    return NextResponse.json({
      success: true,
      data: detalles
    })
  } catch (error) {
    console.error('Error obteniendo diferencias:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener diferencias' },
      { status: 500 }
    )
  }
}

// POST - Resolver diferencia
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError

  try {
    const body = await request.json()
    const { 
      detalleId, 
      accion, 
      movimientoCajaId, 
      montoAjuste, 
      observaciones 
    } = body
    
    if (!detalleId || !accion) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }
    
    const detalle = await db.detalleConciliacion.findUnique({
      where: { id: detalleId },
      include: { conciliacion: true }
    })
    
    if (!detalle) {
      return NextResponse.json(
        { success: false, error: 'Detalle no encontrado' },
        { status: 404 }
      )
    }
    
    let resultado: any = {}
    
    switch (accion) {
      case 'CONCILIAR':
        // Conciliar manualmente con un movimiento del sistema
        if (!movimientoCajaId) {
          return NextResponse.json(
            { success: false, error: 'Movimiento de caja requerido' },
            { status: 400 }
          )
        }
        
        resultado = await db.detalleConciliacion.update({
          where: { id: detalleId },
          data: {
            movimientoCajaId,
            estado: 'CONCILIADO',
            confianza: 100,
            observaciones
          }
        })
        
        // Actualizar contador en la conciliación
        await db.conciliacionBancaria.update({
          where: { id: detalle.conciliacionId },
          data: {
            diferencias: { decrement: 1 },
            conciliados: { increment: 1 }
          }
        })
        break
        
      case 'AJUSTE':
        // Crear ajuste contable
        if (montoAjuste === undefined) {
          return NextResponse.json(
            { success: false, error: 'Monto de ajuste requerido' },
            { status: 400 }
          )
        }
        
        resultado = await db.detalleConciliacion.update({
          where: { id: detalleId },
          data: {
            estado: 'AJUSTE',
            montoAjuste,
            observaciones
          }
        })
        
        // Actualizar contadores
        await db.conciliacionBancaria.update({
          where: { id: detalle.conciliacionId },
          data: {
            diferencias: { decrement: 1 }
          }
        })
        
        // Crear movimiento de ajuste en caja
        const caja = await db.caja.findFirst({
          where: { cuentaBancariaId: detalle.conciliacion.cuentaBancariaId }
        })
        
        if (caja) {
          await db.movimientoCaja.create({
            data: {
              cajaId: caja.id,
              tipo: detalle.tipoExtracto === 'CREDITO' ? 'INGRESO' : 'EGRESO',
              monto: montoAjuste,
              saldoAnterior: caja.saldoActual,
              saldoNueva: caja.saldoActual + (detalle.tipoExtracto === 'CREDITO' ? montoAjuste : -montoAjuste),
              concepto: `AJUSTE CONCILIACIÓN: ${detalle.descripcionExtracto}`,
              documentoTipo: 'AJUSTE_CONCILIACION',
              documentoId: detalleId,
              observaciones
            }
          })
          
          await db.caja.update({
            where: { id: caja.id },
            data: {
              saldoActual: caja.saldoActual + (detalle.tipoExtracto === 'CREDITO' ? montoAjuste : -montoAjuste)
            }
          })
        }
        break
        
      case 'IGNORAR':
        // Marcar como ignorado (no se conciliará)
        resultado = await db.detalleConciliacion.update({
          where: { id: detalleId },
          data: {
            estado: 'AJUSTE', // Tratar como ajuste con monto 0
            montoAjuste: 0,
            observaciones: `IGNORADO: ${observaciones || 'Sin observaciones'}`
          }
        })
        
        await db.conciliacionBancaria.update({
          where: { id: detalle.conciliacionId },
          data: {
            diferencias: { decrement: 1 }
          }
        })
        break
        
      case 'BUSCAR':
        // Buscar posibles coincidencias manualmente
        const movimientos = await db.movimientoCaja.findMany({
          where: {
            fecha: {
              gte: new Date(detalle.fechaExtracto.getTime() - 7 * 24 * 60 * 60 * 1000),
              lte: new Date(detalle.fechaExtracto.getTime() + 7 * 24 * 60 * 60 * 1000)
            },
            monto: {
              gte: detalle.montoExtracto * 0.9,
              lte: detalle.montoExtracto * 1.1
            }
          },
          take: 10
        })
        
        return NextResponse.json({
          success: true,
          data: {
            detalle,
            posiblesCoincidencias: movimientos
          }
        })
        
      default:
        return NextResponse.json(
          { success: false, error: 'Acción no válida' },
          { status: 400 }
        )
    }
    
    return NextResponse.json({
      success: true,
      data: resultado
    })
  } catch (error) {
    console.error('Error resolviendo diferencia:', error)
    return NextResponse.json(
      { success: false, error: 'Error al resolver la diferencia' },
      { status: 500 }
    )
  }
}

// PUT - Buscar movimientos para conciliación manual
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError

  try {
    const body = await request.json()
    const { detalleId, filtros } = body
    
    if (!detalleId) {
      return NextResponse.json(
        { success: false, error: 'ID de detalle requerido' },
        { status: 400 }
      )
    }
    
    const detalle = await db.detalleConciliacion.findUnique({
      where: { id: detalleId }
    })
    
    if (!detalle) {
      return NextResponse.json(
        { success: false, error: 'Detalle no encontrado' },
        { status: 404 }
      )
    }
    
    // Construir filtros de búsqueda
    const where: any = {}
    
    if (filtros?.fechaDesde || filtros?.fechaHasta) {
      where.fecha = {}
      if (filtros.fechaDesde) where.fecha.gte = new Date(filtros.fechaDesde)
      if (filtros.fechaHasta) where.fecha.lte = new Date(filtros.fechaHasta)
    }
    
    if (filtros?.montoMin || filtros?.montoMax) {
      where.monto = {}
      if (filtros.montoMin) where.monto.gte = filtros.montoMin
      if (filtros.montoMax) where.monto.lte = filtros.montoMax
    }
    
    if (filtros?.concepto) {
      where.concepto = { contains: filtros.concepto, mode: 'insensitive' }
    }
    
    // Filtrar por tipo según el detalle
    if (detalle.tipoExtracto === 'CREDITO') {
      where.tipo = { in: ['INGRESO', 'TRANSFERENCIA_ENTRADA'] }
    } else {
      where.tipo = { in: ['EGRESO', 'TRANSFERENCIA_SALIDA'] }
    }
    
    // Solo movimientos no conciliados
    where.detallesConciliacion = { none: {} }
    
    const movimientos = await db.movimientoCaja.findMany({
      where,
      include: {
        caja: true
      },
      take: 20,
      orderBy: { fecha: 'desc' }
    })
    
    return NextResponse.json({
      success: true,
      data: movimientos
    })
  } catch (error) {
    console.error('Error buscando movimientos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al buscar movimientos' },
      { status: 500 }
    )
  }
}
