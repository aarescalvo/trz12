import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validarPermiso } from '@/lib/auth-helpers'

function getOperadorId(request: NextRequest): string | null {
  return request.headers.get('x-operador-id')
}

// GET - List notas de crédito/débito con filtros avanzados
export async function GET(request: NextRequest) {
  try {
    const operadorId = getOperadorId(request)
    const puedeVer = await validarPermiso(operadorId, 'puedeFacturacion')
    if (!puedeVer) {
      return NextResponse.json({ success: false, error: 'Sin permisos de facturación' }, { status: 403 })
    }
    const { searchParams } = new URL(request.url)
    const facturaId = searchParams.get('facturaId')
    const tipo = searchParams.get('tipo')
    const estado = searchParams.get('estado')
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const clienteId = searchParams.get('clienteId')
    
    const where: any = {}
    if (facturaId) where.facturaId = facturaId
    if (tipo) where.tipo = tipo
    if (estado) where.estado = estado
    if (desde || hasta) {
      where.fecha = {}
      if (desde) where.fecha.gte = new Date(desde)
      if (hasta) where.fecha.lte = new Date(hasta + 'T23:59:59')
    }
    if (clienteId) {
      where.factura = { clienteId }
    }
    
    const [notas, resumen] = await Promise.all([
      db.notaCreditoDebito.findMany({
        where,
        include: { 
          factura: { 
            select: { id: true, numero: true, cliente: { select: { id: true, nombre: true, razonSocial: true } }, clienteId: true, tipoComprobante: true } 
          },
          operador: { select: { id: true, nombre: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      // Resumen para KPIs
      db.notaCreditoDebito.aggregate({
        where: { ...where, estado: 'EMITIDA' },
        _count: true,
        _sum: { subtotal: true, iva: true, total: true },
      })
    ])
    
    // Separar por tipo para resumen
    const [resumenCredito, resumenDebito] = await Promise.all([
      db.notaCreditoDebito.aggregate({
        where: { ...where, tipo: 'CREDITO', estado: 'EMITIDA' },
        _count: true,
        _sum: { total: true },
      }),
      db.notaCreditoDebito.aggregate({
        where: { ...where, tipo: 'DEBITO', estado: 'EMITIDA' },
        _count: true,
        _sum: { total: true },
      }),
    ])
    
    return NextResponse.json({ 
      success: true, 
      data: notas,
      resumen: {
        total: resumen._count,
        totalMonto: resumen._sum.total || 0,
        creditoCount: resumenCredito._count,
        creditoMonto: resumenCredito._sum.total || 0,
        debitoCount: resumenDebito._count,
        debitoMonto: resumenDebito._sum.total || 0,
        saldoNeto: (resumenDebito._sum.total || 0) - (resumenCredito._sum.total || 0),
      }
    })
  } catch (error) {
    console.error('Error fetching notas:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener notas' }, { status: 500 })
  }
}

// POST - Create nota de crédito/débito
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { facturaId, tipo, motivo, descripcion, subtotal, iva, total, operadorId } = body
    
    // Validate permissions
    const puedeFacturar = await validarPermiso(operadorId, 'puedeFacturacion')
    if (!puedeFacturar) {
      return NextResponse.json({ success: false, error: 'Sin permisos de facturación' }, { status: 403 })
    }
    
    if (!facturaId || !tipo || !motivo) {
      return NextResponse.json(
        { success: false, error: 'Factura, tipo y motivo son requeridos' }, 
        { status: 400 }
      )
    }
    
    // Verify factura exists and is not ANULADA
    const factura = await db.factura.findUnique({ 
      where: { id: facturaId },
      include: { cliente: true }
    })
    
    if (!factura) {
      return NextResponse.json(
        { success: false, error: 'Factura no encontrada' }, 
        { status: 404 }
      )
    }
    
    if (factura.estado === 'ANULADA') {
      return NextResponse.json(
        { success: false, error: 'No se puede crear una nota sobre una factura anulada' }, 
        { status: 400 }
      )
    }
    
    // Get numerador for notas
    const numerador = await db.numerador.upsert({
      where: { nombre: 'NOTA_CREDITO_DEBITO' },
      update: { ultimoNumero: { increment: 1 } },
      create: { nombre: 'NOTA_CREDITO_DEBITO', ultimoNumero: 1 }
    })
    
    // Determine tipoComprobante AFIP code based on factura type
    let tipoComprobante = 3 // Default: Nota Crédito A
    if (tipo === 'DEBITO') tipoComprobante = 2 // Nota Débito A
    if (factura.tipoComprobante === 'FACTURA_B') {
      tipoComprobante = tipo === 'CREDITO' ? 8 : 7 // Nota Crédito B / Nota Débito B
    }
    if (factura.tipoComprobante === 'FACTURA_C') {
      tipoComprobante = tipo === 'CREDITO' ? 13 : 12 // Nota Crédito C / Nota Débito C
    }
    
    const nota = await db.notaCreditoDebito.create({
      data: {
        tipo,
        tipoComprobante,
        facturaId,
        numero: numerador.ultimoNumero,
        puntoVenta: factura.puntoVenta || 1,
        motivo,
        descripcion,
        subtotal: subtotal || 0,
        iva: iva || 0,
        total: total || 0,
        estado: 'EMITIDA',
        operadorId
      },
      include: {
        factura: { select: { id: true, numero: true, cliente: { select: { id: true, nombre: true, razonSocial: true } } } }
      }
    })
    
    // Auditoría
    await db.auditoria.create({
      data: {
        modulo: 'facturacion',
        accion: 'CREATE',
        entidad: 'NotaCreditoDebito',
        entidadId: nota.id,
        descripcion: `Nota de ${tipo === 'CREDITO' ? 'Crédito' : 'Débito'} creada - ${String(nota.puntoVenta).padStart(4, '0')}-${String(nota.numero).padStart(8, '0')} - Factura ref: ${factura.numero}`,
        datosDespues: JSON.stringify(nota),
        operadorId,
      }
    })
    
    return NextResponse.json({ success: true, data: nota })
  } catch (error) {
    console.error('Error creating nota:', error)
    return NextResponse.json({ success: false, error: 'Error al crear nota' }, { status: 500 })
  }
}

// PUT - Anular nota de crédito/débito
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, estado, operadorId } = body
    
    // Validate permissions
    const puedeFacturar = await validarPermiso(operadorId, 'puedeFacturacion')
    if (!puedeFacturar) {
      return NextResponse.json({ success: false, error: 'Sin permisos de facturación' }, { status: 403 })
    }
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de nota es requerido' }, 
        { status: 400 }
      )
    }
    
    const notaExistente = await db.notaCreditoDebito.findUnique({
      where: { id },
      include: { factura: { select: { id: true, numero: true, cliente: { select: { id: true, nombre: true, razonSocial: true } } } } }
    })
    
    if (!notaExistente) {
      return NextResponse.json(
        { success: false, error: 'Nota no encontrada' }, 
        { status: 404 }
      )
    }
    
    if (notaExistente.estado === 'ANULADA') {
      return NextResponse.json(
        { success: false, error: 'La nota ya se encuentra anulada' }, 
        { status: 400 }
      )
    }
    
    const nota = await db.notaCreditoDebito.update({
      where: { id },
      data: { estado: estado || 'ANULADA' },
      include: {
        factura: { select: { id: true, numero: true, cliente: { select: { id: true, nombre: true, razonSocial: true } } } }
      }
    })
    
    // Auditoría
    await db.auditoria.create({
      data: {
        modulo: 'facturacion',
        accion: 'UPDATE',
        entidad: 'NotaCreditoDebito',
        entidadId: nota.id,
        descripcion: `Nota ${String(nota.puntoVenta).padStart(4, '0')}-${String(nota.numero).padStart(8, '0')} anulada`,
        datosAntes: JSON.stringify(notaExistente),
        datosDespues: JSON.stringify(nota),
        operadorId,
      }
    })
    
    return NextResponse.json({ success: true, data: nota })
  } catch (error) {
    console.error('Error updating nota:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar nota' }, { status: 500 })
  }
}
