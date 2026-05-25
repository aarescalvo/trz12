import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar todos los CCIR
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const estado = searchParams.get('estado')
    const search = searchParams.get('search')
    
    const where: any = {}
    
    if (estado && estado !== 'TODOS') {
      where.estado = estado
    }
    
    if (search) {
      where.OR = [
        { numeroCertificado: { contains: search, mode: 'insensitive' } },
        { producto: { contains: search, mode: 'insensitive' } },
        { paisDestino: { contains: search, mode: 'insensitive' } },
        { lote: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    const ccirs = await db.cCIR.findMany({
      where,
      include: {
        operador: {
          select: { id: true, nombre: true }
        }
      },
      orderBy: { fechaEmision: 'desc' },
      take: 100
    })
    
    return NextResponse.json({ success: true, data: ccirs })
  } catch (error) {
    console.error('Error fetching CCIR:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener CCIR' }, { status: 500 })
  }
}

// POST - Crear nuevo CCIR
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Obtener el último número de certificado
    const añoActual = new Date().getFullYear()
    const numerador = await db.numerador.upsert({
      where: { nombre: 'CCIR' },
      update: { ultimoNumero: { increment: 1 } },
      create: { nombre: 'CCIR', ultimoNumero: 1, anio: añoActual }
    })
    
    const numeroCertificado = `CCIR-${añoActual}-${String(numerador.ultimoNumero).padStart(6, '0')}`
    
    const ccir = await db.cCIR.create({
      data: {
        numeroCertificado,
        fechaEmision: new Date(),
        producto: body.producto,
        cantidad: parseFloat(body.cantidad) || 0,
        lote: body.lote || null,
        paisDestino: body.paisDestino,
        puertoDestino: body.puertoDestino || null,
        numeroEstablecimiento: body.numeroEstablecimiento || null,
        nombreEstablecimiento: body.nombreEstablecimiento || null,
        cuitEstablecimiento: body.cuitEstablecimiento || null,
        nombreImportador: body.nombreImportador || null,
        direccionImportador: body.direccionImportador || null,
        numeroContenedor: body.numeroContenedor || null,
        matriculaTransporte: body.matriculaTransporte || null,
        numeroPrecintos: body.numeroPrecintos || null,
        observaciones: body.observaciones || null,
        estado: 'EMITIDO',
        operadorId: body.operadorId || null,
      },
      include: {
        operador: {
          select: { id: true, nombre: true }
        }
      }
    })
    
    // Registrar auditoría
    if (body.operadorId) {
      await db.auditoria.create({
        data: {
          operadorId: body.operadorId,
          modulo: 'CCIR',
          accion: 'CREATE',
          entidad: 'CCIR',
          entidadId: ccir.id,
          descripcion: `CCIR ${numeroCertificado} creado para ${body.paisDestino}`
        }
      })
    }
    
    return NextResponse.json({ success: true, data: ccir })
  } catch (error) {
    console.error('Error creating CCIR:', error)
    return NextResponse.json({ success: false, error: 'Error al crear CCIR' }, { status: 500 })
  }
}

// PUT - Actualizar CCIR (marcar como impreso o cambiar estado)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, estado, marcarImpreso } = body
    
    const updateData: any = {}
    
    if (estado) {
      updateData.estado = estado
    }
    
    if (marcarImpreso) {
      updateData.fechaImpresion = new Date()
      updateData.vecesImpreso = { increment: 1 }
    }
    
    const ccir = await db.cCIR.update({
      where: { id },
      data: updateData,
      include: {
        operador: {
          select: { id: true, nombre: true }
        }
      }
    })
    
    return NextResponse.json({ success: true, data: ccir })
  } catch (error) {
    console.error('Error updating CCIR:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar CCIR' }, { status: 500 })
  }
}

// DELETE - Anular CCIR
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    const operadorId = searchParams.get('operadorId')
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }
    
    const ccir = await db.cCIR.update({
      where: { id },
      data: { estado: 'ANULADO' }
    })
    
    // Registrar auditoría
    if (operadorId) {
      await db.auditoria.create({
        data: {
          operadorId,
          modulo: 'CCIR',
          accion: 'DELETE',
          entidad: 'CCIR',
          entidadId: id,
          descripcion: `CCIR ${ccir.numeroCertificado} anulado`
        }
      })
    }
    
    return NextResponse.json({ success: true, data: ccir })
  } catch (error) {
    console.error('Error deleting CCIR:', error)
    return NextResponse.json({ success: false, error: 'Error al anular CCIR' }, { status: 500 })
  }
}
