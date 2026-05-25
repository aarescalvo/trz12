import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar todas las Declaraciones Juradas
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const estado = searchParams.get('estado')
    const especie = searchParams.get('especie')
    const search = searchParams.get('search')
    
    const where: any = {}
    
    if (estado && estado !== 'TODOS') {
      where.estado = estado
    }
    
    if (especie && especie !== 'TODOS') {
      where.especie = especie
    }
    
    if (search) {
      where.OR = [
        { numeroDeclaracion: { contains: search, mode: 'insensitive' } },
        { nombreProductor: { contains: search, mode: 'insensitive' } },
        { cuitProductor: { contains: search, mode: 'insensitive' } },
        { numeroTropa: { contains: search, mode: 'insensitive' } },
        { numeroDTE: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    const declaraciones = await db.declaracionJurada.findMany({
      where,
      include: {
        productor: {
          select: { id: true, nombre: true, cuit: true, direccion: true }
        },
        operador: {
          select: { id: true, nombre: true }
        }
      },
      orderBy: { fecha: 'desc' },
      take: 100
    })
    
    return NextResponse.json({ success: true, data: declaraciones })
  } catch (error) {
    console.error('Error fetching Declaraciones Juradas:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener Declaraciones Juradas' }, { status: 500 })
  }
}

// POST - Crear nueva Declaración Jurada
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Obtener el último número de declaración
    const añoActual = new Date().getFullYear()
    const numerador = await db.numerador.upsert({
      where: { nombre: 'DECLARACION_JURADA' },
      update: { ultimoNumero: { increment: 1 } },
      create: { nombre: 'DECLARACION_JURADA', ultimoNumero: 1, anio: añoActual }
    })
    
    const numeroDeclaracion = `DJ-${añoActual}-${String(numerador.ultimoNumero).padStart(6, '0')}`
    
    const declaracion = await db.declaracionJurada.create({
      data: {
        numeroDeclaracion,
        fecha: new Date(),
        productorId: body.productorId || null,
        nombreProductor: body.nombreProductor,
        cuitProductor: body.cuitProductor || null,
        direccionProductor: body.direccionProductor || null,
        procedencia: body.procedencia || null,
        especie: body.especie || 'BOVINO',
        cantidadCabezas: parseInt(body.cantidadCabezas) || 0,
        numeroTropa: body.numeroTropa || null,
        numeroLote: body.numeroLote || null,
        numeroDTE: body.numeroDTE || null,
        numeroGuia: body.numeroGuia || null,
        declaracionSanidad: body.declaracionSanidad || null,
        procedenciaLibre: body.procedenciaLibre !== false,
        observaciones: body.observaciones || null,
        estado: 'ACTIVA',
        operadorId: body.operadorId || null,
      },
      include: {
        productor: {
          select: { id: true, nombre: true, cuit: true, direccion: true }
        },
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
          modulo: 'DECLARACION_JURADA',
          accion: 'CREATE',
          entidad: 'DeclaracionJurada',
          entidadId: declaracion.id,
          descripcion: `Declaración Jurada ${numeroDeclaracion} creada para ${body.nombreProductor}`
        }
      })
    }
    
    return NextResponse.json({ success: true, data: declaracion })
  } catch (error) {
    console.error('Error creating Declaración Jurada:', error)
    return NextResponse.json({ success: false, error: 'Error al crear Declaración Jurada' }, { status: 500 })
  }
}

// PUT - Actualizar Declaración Jurada (marcar como impreso o cambiar estado)
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
    
    const declaracion = await db.declaracionJurada.update({
      where: { id },
      data: updateData,
      include: {
        productor: {
          select: { id: true, nombre: true, cuit: true, direccion: true }
        },
        operador: {
          select: { id: true, nombre: true }
        }
      }
    })
    
    return NextResponse.json({ success: true, data: declaracion })
  } catch (error) {
    console.error('Error updating Declaración Jurada:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar Declaración Jurada' }, { status: 500 })
  }
}

// DELETE - Anular Declaración Jurada
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    const operadorId = searchParams.get('operadorId')
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }
    
    const declaracion = await db.declaracionJurada.update({
      where: { id },
      data: { estado: 'ANULADA' }
    })
    
    // Registrar auditoría
    if (operadorId) {
      await db.auditoria.create({
        data: {
          operadorId,
          modulo: 'DECLARACION_JURADA',
          accion: 'DELETE',
          entidad: 'DeclaracionJurada',
          entidadId: id,
          descripcion: `Declaración Jurada ${declaracion.numeroDeclaracion} anulada`
        }
      })
    }
    
    return NextResponse.json({ success: true, data: declaracion })
  } catch (error) {
    console.error('Error deleting Declaración Jurada:', error)
    return NextResponse.json({ success: false, error: 'Error al anular Declaración Jurada' }, { status: 500 })
  }
}
