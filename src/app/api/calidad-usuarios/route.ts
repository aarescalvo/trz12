import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar usuarios de calidad con filtros
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const estado = searchParams.get('estado')
    const area = searchParams.get('area')
    const busqueda = searchParams.get('busqueda')

    const where: Record<string, unknown> = {}

    if (tipo && tipo !== 'TODOS') {
      where.tipo = tipo
    }
    if (estado && estado !== 'TODOS') {
      where.estado = estado
    }
    if (area && area !== 'TODOS') {
      where.area = { contains: area }
    }
    if (busqueda) {
      where.OR = [
        { nombre: { contains: busqueda } },
        { apellido: { contains: busqueda } },
        { dni: { contains: busqueda } },
        { cuit: { contains: busqueda } }
      ]
    }

    const usuarios = await db.usuarioCalidad.findMany({
      where,
      include: {
        novedades: {
          orderBy: { fecha: 'desc' },
          take: 5
        }
      },
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' }
      ]
    })

    // Contar novedades pendientes por usuario
    const usuariosConStats = await Promise.all(
      usuarios.map(async (usuario) => {
        const novedadesPendientes = await db.novedadCalidad.count({
          where: {
            usuarioId: usuario.id,
            estado: 'PENDIENTE'
          }
        })
        const totalNovedades = await db.novedadCalidad.count({
          where: { usuarioId: usuario.id }
        })
        return {
          ...usuario,
          _count: {
            novedadesPendientes,
            totalNovedades
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: usuariosConStats
    })

  } catch (error) {
    console.error('[Calidad Usuarios API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo usuario
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const data = await request.json()

    // Verificar DNI único si se proporciona
    if (data.dni) {
      const existente = await db.usuarioCalidad.findUnique({
        where: { dni: data.dni }
      })
      if (existente) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un usuario con ese DNI' },
          { status: 400 }
        )
      }
    }

    const usuario = await db.usuarioCalidad.create({
      data: {
        id: randomUUID(),
        nombre: data.nombre,
        apellido: data.apellido,
        dni: data.dni || null,
        cuit: data.cuit || null,
        tipo: data.tipo || 'EMPLEADO',
        area: data.area || null,
        sector: data.sector || null,
        puesto: data.puesto || null,
        telefono: data.telefono || null,
        email: data.email || null,
        direccion: data.direccion || null,
        fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso) : new Date(),
        estado: data.estado || 'ACTIVO',
        observaciones: data.observaciones || null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: usuario
    })

  } catch (error) {
    console.error('[Calidad Usuarios API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear usuario' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar usuario
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const data = await request.json()

    // Verificar DNI único si se cambia
    if (data.dni) {
      const existente = await db.usuarioCalidad.findFirst({
        where: {
          dni: data.dni,
          NOT: { id: data.id }
        }
      })
      if (existente) {
        return NextResponse.json(
          { success: false, error: 'Ya existe otro usuario con ese DNI' },
          { status: 400 }
        )
      }
    }

    const usuario = await db.usuarioCalidad.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        dni: data.dni || null,
        cuit: data.cuit || null,
        tipo: data.tipo,
        area: data.area || null,
        sector: data.sector || null,
        puesto: data.puesto || null,
        telefono: data.telefono || null,
        email: data.email || null,
        direccion: data.direccion || null,
        fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso) : undefined,
        fechaEgreso: data.fechaEgreso ? new Date(data.fechaEgreso) : null,
        estado: data.estado,
        observaciones: data.observaciones || null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: usuario
    })

  } catch (error) {
    console.error('[Calidad Usuarios API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar usuario
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    // Eliminar novedades primero (cascade)
    await db.novedadCalidad.deleteMany({
      where: { usuarioId: id }
    })

    await db.usuarioCalidad.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado correctamente'
    })

  } catch (error) {
    console.error('[Calidad Usuarios API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}
