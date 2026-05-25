import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar todas las balanzas
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const activa = searchParams.get('activa')

    const where: any = {}
    if (activa !== null) where.activa = activa === 'true'

    const balanzas = await db.balanza.findMany({
      where,
      include: {
        puestos: {
          where: { activo: true },
          select: { id: true, nombre: true, sector: true }
        }
      },
      orderBy: { nombre: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: balanzas
    })
  } catch (error) {
    console.error('Error al obtener balanzas:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener balanzas' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva balanza
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const data = await request.json()

    // Validar campos requeridos
    if (!data.nombre) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    // Verificar si ya existe una balanza con el mismo código
    if (data.codigo) {
      const existente = await db.balanza.findUnique({
        where: { codigo: data.codigo }
      })
      if (existente) {
        return NextResponse.json(
          { success: false, error: 'Ya existe una balanza con ese código' },
          { status: 400 }
        )
      }
    }

    const balanza = await db.balanza.create({
      data: {
        nombre: data.nombre,
        codigo: data.codigo || null,
        tipoConexion: data.tipoConexion || 'SIMULADA',
        puerto: data.puerto || null,
        baudRate: data.baudRate || 9600,
        dataBits: data.dataBits || 8,
        parity: data.parity || 'none',
        stopBits: data.stopBits || 1,
        ip: data.ip || null,
        puertoTcp: data.puertoTcp || null,
        protocolo: data.protocolo || 'GENERICO',
        comandoPeso: data.comandoPeso || null,
        formatoRespuesta: data.formatoRespuesta || null,
        capacidadMax: data.capacidadMax || null,
        division: data.division || 0.1,
        unidad: data.unidad || 'kg',
        activa: data.activa ?? true,
        estado: 'DESCONECTADA',
        observaciones: data.observaciones || null
      }
    })

    return NextResponse.json({
      success: true,
      data: balanza
    }, { status: 201 })
  } catch (error) {
    console.error('Error al crear balanza:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear balanza' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar balanza
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const data = await request.json()

    if (!data.id) {
      return NextResponse.json(
        { success: false, error: 'ID de balanza requerido' },
        { status: 400 }
      )
    }

    const balanza = await db.balanza.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        tipoConexion: data.tipoConexion,
        puerto: data.puerto,
        baudRate: data.baudRate,
        dataBits: data.dataBits,
        parity: data.parity,
        stopBits: data.stopBits,
        ip: data.ip,
        puertoTcp: data.puertoTcp,
        protocolo: data.protocolo,
        comandoPeso: data.comandoPeso,
        formatoRespuesta: data.formatoRespuesta,
        capacidadMax: data.capacidadMax,
        division: data.division,
        unidad: data.unidad,
        activa: data.activa,
        observaciones: data.observaciones,
        fechaCalibracion: data.fechaCalibracion ? new Date(data.fechaCalibracion) : undefined,
        proximaCalibracion: data.proximaCalibracion ? new Date(data.proximaCalibracion) : undefined
      }
    })

    return NextResponse.json({
      success: true,
      data: balanza
    })
  } catch (error) {
    console.error('Error al actualizar balanza:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar balanza' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar balanza
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de balanza requerido' },
        { status: 400 }
      )
    }

    // Verificar si tiene puestos asignados
    const puestosAsignados = await db.puestoTrabajo.count({
      where: { balanzaId: id }
    })

    if (puestosAsignados > 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar la balanza porque tiene puestos de trabajo asignados' },
        { status: 400 }
      )
    }

    await db.balanza.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Balanza eliminada correctamente'
    })
  } catch (error) {
    console.error('Error al eliminar balanza:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar balanza' },
      { status: 500 }
    )
  }
}
