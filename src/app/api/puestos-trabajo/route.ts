import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar todos los puestos de trabajo
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const activo = searchParams.get('activo')
    const sector = searchParams.get('sector')

    const where: any = {}
    if (activo !== null) where.activo = activo === 'true'
    if (sector) where.sector = sector

    const puestos = await db.puestoTrabajo.findMany({
      where,
      include: {
        balanza: {
          select: {
            id: true,
            nombre: true,
            tipoConexion: true,
            estado: true,
            activa: true
          }
        }
      },
      orderBy: [{ sector: 'asc' }, { nombre: 'asc' }]
    })

    return NextResponse.json({
      success: true,
      data: puestos
    })
  } catch (error) {
    console.error('Error al obtener puestos de trabajo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener puestos de trabajo' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo puesto de trabajo
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

    // Verificar si ya existe un puesto con el mismo código
    if (data.codigo) {
      const existente = await db.puestoTrabajo.findUnique({
        where: { codigo: data.codigo }
      })
      if (existente) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un puesto de trabajo con ese código' },
          { status: 400 }
        )
      }
    }

    const puesto = await db.puestoTrabajo.create({
      data: {
        nombre: data.nombre,
        codigo: data.codigo || null,
        sector: data.sector || null,
        ubicacion: data.ubicacion || null,
        balanzaId: data.balanzaId || null,
        impresoraIp: data.impresoraIp || null,
        impresoraPuerto: data.impresoraPuerto || 9100,
        impresoraModelo: data.impresoraModelo || null,
        rotuloDefaultId: data.rotuloDefaultId || null,
        impresoraTicketsIp: data.impresoraTicketsIp || null,
        impresoraTicketsPuerto: data.impresoraTicketsPuerto || null,
        scannerHabilitado: data.scannerHabilitado ?? false,
        scannerPuerto: data.scannerPuerto || null,
        modoPantalla: data.modoPantalla || 'normal',
        activo: data.activo ?? true,
        operativo: data.operativo ?? true,
        observaciones: data.observaciones || null
      },
      include: {
        balanza: {
          select: {
            id: true,
            nombre: true,
            tipoConexion: true,
            estado: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: puesto
    }, { status: 201 })
  } catch (error) {
    console.error('Error al crear puesto de trabajo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear puesto de trabajo' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar puesto de trabajo
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const data = await request.json()

    if (!data.id) {
      return NextResponse.json(
        { success: false, error: 'ID de puesto requerido' },
        { status: 400 }
      )
    }

    const puesto = await db.puestoTrabajo.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        sector: data.sector,
        ubicacion: data.ubicacion,
        balanzaId: data.balanzaId,
        impresoraIp: data.impresoraIp,
        impresoraPuerto: data.impresoraPuerto,
        impresoraModelo: data.impresoraModelo,
        rotuloDefaultId: data.rotuloDefaultId,
        impresoraTicketsIp: data.impresoraTicketsIp,
        impresoraTicketsPuerto: data.impresoraTicketsPuerto,
        scannerHabilitado: data.scannerHabilitado,
        scannerPuerto: data.scannerPuerto,
        modoPantalla: data.modoPantalla,
        activo: data.activo,
        operativo: data.operativo,
        observaciones: data.observaciones,
        operadorActualId: data.operadorActualId
      },
      include: {
        balanza: {
          select: {
            id: true,
            nombre: true,
            tipoConexion: true,
            estado: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: puesto
    })
  } catch (error) {
    console.error('Error al actualizar puesto de trabajo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar puesto de trabajo' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar puesto de trabajo
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de puesto requerido' },
        { status: 400 }
      )
    }

    await db.puestoTrabajo.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Puesto de trabajo eliminado correctamente'
    })
  } catch (error) {
    console.error('Error al eliminar puesto de trabajo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar puesto de trabajo' },
      { status: 500 }
    )
  }
}
