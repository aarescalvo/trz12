import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// Algoritmo de matching para conciliación automática
interface MatchResult {
  detalleId: string
  movimientoCajaId?: string
  confianza: number
  tipoMatch: 'EXACTO' | 'MONTO' | 'REFERENCIA' | 'NINGUNO'
}

function calcularSimilitudTexto(texto1: string, texto2: string): number {
  const t1 = texto1.toLowerCase().trim()
  const t2 = texto2.toLowerCase().trim()
  
  if (t1 === t2) return 100
  if (t1.includes(t2) || t2.includes(t1)) return 80
  
  // Comparar palabras
  const palabras1 = t1.split(/\s+/)
  const palabras2 = t2.split(/\s+/)
  
  const coincidencias = palabras1.filter(p => 
    p.length > 3 && palabras2.some(p2 => p2.includes(p) || p.includes(p2))
  )
  
  return Math.min(100, (coincidencias.length / Math.max(palabras1.length, palabras2.length)) * 100)
}

function encontrarMejorMatch(
  detalle: { id: string; montoExtracto: number; descripcionExtracto: string; referenciaExtracto?: string | null; fechaExtracto: Date; tipoExtracto: string },
  movimientos: { id: string; monto: number; concepto: string; documentoNumero?: string | null; fecha: Date; tipo: string }[]
): MatchResult {
  let mejorMatch: MatchResult = {
    detalleId: detalle.id,
    confianza: 0,
    tipoMatch: 'NINGUNO'
  }
  
  // Filtrar movimientos por tipo (INGRESO = CREDITO, EGRESO = DEBITO)
  const movimientosFiltrados = movimientos.filter(m => {
    if (detalle.tipoExtracto === 'CREDITO' && m.tipo === 'INGRESO') return true
    if (detalle.tipoExtracto === 'DEBITO' && m.tipo === 'EGRESO') return true
    if (detalle.tipoExtracto === 'CREDITO' && (m.tipo === 'TRANSFERENCIA_ENTRADA')) return true
    if (detalle.tipoExtracto === 'DEBITO' && (m.tipo === 'TRANSFERENCIA_SALIDA')) return true
    return false
  })
  
  for (const movimiento of movimientosFiltrados) {
    let confianza = 0
    let tipoMatch: MatchResult['tipoMatch'] = 'NINGUNO'
    
    // 1. Match exacto por monto
    const diffMonto = Math.abs(detalle.montoExtracto - movimiento.monto)
    const porcentajeDiferencia = diffMonto / detalle.montoExtracto
    
    if (porcentajeDiferencia === 0) {
      confianza += 40
    } else if (porcentajeDiferencia < 0.01) {
      confianza += 35
    } else if (porcentajeDiferencia < 0.05) {
      confianza += 20
    } else if (porcentajeDiferencia > 0.1) {
      continue // Saltar si la diferencia de monto es muy grande
    }
    
    // 2. Match por fecha (dentro de un rango de 3 días)
    const diffDias = Math.abs(
      (detalle.fechaExtracto.getTime() - movimiento.fecha.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (diffDias === 0) {
      confianza += 30
    } else if (diffDias <= 1) {
      confianza += 25
    } else if (diffDias <= 3) {
      confianza += 15
    } else if (diffDias > 7) {
      continue // Saltar si la diferencia de fecha es muy grande
    }
    
    // 3. Match por referencia/número de documento
    if (detalle.referenciaExtracto && movimiento.documentoNumero) {
      if (detalle.referenciaExtracto === movimiento.documentoNumero) {
        confianza += 30
        tipoMatch = 'REFERENCIA'
      } else if (
        detalle.referenciaExtracto.includes(movimiento.documentoNumero) ||
        movimiento.documentoNumero.includes(detalle.referenciaExtracto)
      ) {
        confianza += 20
      }
    }
    
    // 4. Match por similitud de descripción
    const similitudDescripcion = calcularSimilitudTexto(detalle.descripcionExtracto, movimiento.concepto)
    if (similitudDescripcion > 50) {
      confianza += similitudDescripcion * 0.3
    }
    
    // Determinar tipo de match
    if (confianza >= 90) {
      tipoMatch = 'EXACTO'
    } else if (confianza >= 70) {
      tipoMatch = 'MONTO'
    } else if (confianza >= 50) {
      tipoMatch = 'REFERENCIA'
    }
    
    // Actualizar mejor match
    if (confianza > mejorMatch.confianza) {
      mejorMatch = {
        detalleId: detalle.id,
        movimientoCajaId: movimiento.id,
        confianza: Math.min(100, confianza),
        tipoMatch
      }
    }
  }
  
  return mejorMatch
}

// POST - Procesar conciliación automática
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json()
    const { conciliacionId, umbralConfianza = 70 } = body
    
    if (!conciliacionId) {
      return NextResponse.json(
        { success: false, error: 'ID de conciliación requerido' },
        { status: 400 }
      )
    }
    
    // Obtener conciliación con detalles
    const conciliacion = await db.conciliacionBancaria.findUnique({
      where: { id: conciliacionId },
      include: {
        cuentaBancaria: true,
        detalles: {
          where: { estado: 'PENDIENTE' }
        }
      }
    })
    
    if (!conciliacion) {
      return NextResponse.json(
        { success: false, error: 'Conciliación no encontrada' },
        { status: 404 }
      )
    }
    
    // Obtener movimientos de caja del período
    const movimientosCaja = await db.movimientoCaja.findMany({
      where: {
        fecha: {
          gte: conciliacion.fechaDesde,
          lte: conciliacion.fechaHasta
        }
      }
    })
    
    // Procesar cada detalle
    const resultados: MatchResult[] = []
    let conciliados = 0
    let pendientes = 0
    let diferencias = 0
    
    for (const detalle of conciliacion.detalles) {
      const match = encontrarMejorMatch(detalle, movimientosCaja)
      resultados.push(match)
      
      if (match.confianza >= umbralConfianza && match.movimientoCajaId) {
        // Conciliar automáticamente
        await db.detalleConciliacion.update({
          where: { id: detalle.id },
          data: {
            movimientoCajaId: match.movimientoCajaId,
            confianza: match.confianza,
            estado: 'CONCILIADO'
          }
        })
        conciliados++
      } else if (match.confianza >= 50) {
        // Potencial match, requiere revisión
        await db.detalleConciliacion.update({
          where: { id: detalle.id },
          data: {
            movimientoCajaId: match.movimientoCajaId,
            confianza: match.confianza,
            estado: 'PENDIENTE'
          }
        })
        pendientes++
      } else {
        // Sin match, es una diferencia
        await db.detalleConciliacion.update({
          where: { id: detalle.id },
          data: {
            confianza: match.confianza,
            estado: 'DIFERENCIA'
          }
        })
        diferencias++
      }
    }
    
    // Actualizar conciliación
    const conciliacionActualizada = await db.conciliacionBancaria.update({
      where: { id: conciliacionId },
      data: {
        conciliados,
        pendientes,
        diferencias,
        estado: 'PROCESADA'
      },
      include: {
        detalles: {
          include: {
            movimientoCaja: true
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: conciliacionActualizada,
      resumen: {
        totalProcesados: conciliacion.detalles.length,
        conciliados,
        pendientes,
        diferencias,
        resultados
      }
    })
  } catch (error) {
    console.error('Error procesando conciliación:', error)
    return NextResponse.json(
      { success: false, error: 'Error al procesar la conciliación' },
      { status: 500 }
    )
  }
}

// PUT - Confirmar conciliación completa
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json()
    const { conciliacionId } = body
    
    if (!conciliacionId) {
      return NextResponse.json(
        { success: false, error: 'ID de conciliación requerido' },
        { status: 400 }
      )
    }
    
    // Verificar que no haya pendientes
    const pendientes = await db.detalleConciliacion.count({
      where: {
        conciliacionId,
        estado: 'PENDIENTE'
      }
    })
    
    if (pendientes > 0) {
      return NextResponse.json(
        { success: false, error: `Hay ${pendientes} movimientos pendientes de conciliar` },
        { status: 400 }
      )
    }
    
    // Confirmar conciliación
    const conciliacion = await db.conciliacionBancaria.update({
      where: { id: conciliacionId },
      data: { estado: 'CONFIRMADA' },
      include: {
        cuentaBancaria: true,
        detalles: {
          include: {
            movimientoCaja: true
          }
        }
      }
    })
    
    // Actualizar saldo conciliado de la cuenta bancaria
    const saldoConciliado = conciliacion.detalles
      .filter(d => d.estado === 'CONCILIADO')
      .reduce((sum, d) => {
        return sum + (d.tipoExtracto === 'CREDITO' ? d.montoExtracto : -d.montoExtracto)
      }, conciliacion.cuentaBancaria.saldoConciliado)
    
    await db.cuentaBancaria.update({
      where: { id: conciliacion.cuentaBancariaId },
      data: { saldoConciliado }
    })
    
    return NextResponse.json({
      success: true,
      data: conciliacion
    })
  } catch (error) {
    console.error('Error confirmando conciliación:', error)
    return NextResponse.json(
      { success: false, error: 'Error al confirmar la conciliación' },
      { status: 500 }
    )
  }
}
