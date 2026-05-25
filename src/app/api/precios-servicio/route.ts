import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar precios de servicio
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')
    const tipoServicioId = searchParams.get('tipoServicioId')
    const vigente = searchParams.get('vigente')
    const fecha = searchParams.get('fecha')

    const where: any = {}

    if (clienteId) where.clienteId = clienteId
    if (tipoServicioId) where.tipoServicioId = tipoServicioId

    // Filtrar solo precios vigentes
    if (vigente === 'true') {
      where.fechaHasta = null
    }

    // Filtrar por fecha específica
    if (fecha) {
      const fechaBusqueda = new Date(fecha)
      where.AND = [
        { fechaDesde: { lte: fechaBusqueda } },
        {
          OR: [
            { fechaHasta: null },
            { fechaHasta: { gte: fechaBusqueda } }
          ]
        }
      ]
    }

    const precios = await db.precioServicio.findMany({
      where,
      include: {
        tipoServicio: true,
        cliente: {
          select: {
            id: true,
            nombre: true,
            cuit: true,
            razonSocial: true
          }
        }
      },
      orderBy: [
        { cliente: { nombre: 'asc' } },
        { tipoServicio: { orden: 'asc' } },
        { fechaDesde: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: precios
    })
  } catch (error) {
    console.error('Error fetching precios servicio:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener precios de servicio' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo precio de servicio
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const body = await request.json()
    const { 
      tipoServicioId, 
      clienteId, 
      precio, 
      fechaDesde, 
      observaciones, 
      createdBy 
    } = body

    if (!tipoServicioId || !clienteId || precio === undefined) {
      return NextResponse.json(
        { success: false, error: 'Tipo servicio, cliente y precio son requeridos' },
        { status: 400 }
      )
    }

    // Cerrar precio anterior si existe
    const precioAnterior = await db.precioServicio.findFirst({
      where: {
        tipoServicioId,
        clienteId,
        fechaHasta: null
      }
    })

    if (precioAnterior) {
      const nuevaFechaHasta = fechaDesde 
        ? new Date(new Date(fechaDesde).getTime() - 86400000) // Un día antes
        : new Date()

      await db.precioServicio.update({
        where: { id: precioAnterior.id },
        data: { fechaHasta: nuevaFechaHasta }
      })
    }

    const nuevoPrecio = await db.precioServicio.create({
      data: {
        tipoServicioId,
        clienteId,
        precio,
        fechaDesde: fechaDesde ? new Date(fechaDesde) : new Date(),
        observaciones,
        createdBy
      },
      include: {
        tipoServicio: true,
        cliente: {
          select: {
            id: true,
            nombre: true,
            cuit: true,
            razonSocial: true
          }
        }
      }
    })

    // Registrar historial de cambio de precio
    try {
      await db.precioHistorial.create({
        data: {
          precioServicioId: nuevoPrecio.id,
          tipoServicioId: nuevoPrecio.tipoServicioId,
          tipoServicioNombre: nuevoPrecio.tipoServicio.nombre,
          clienteId: nuevoPrecio.clienteId,
          clienteNombre: nuevoPrecio.cliente.nombre || nuevoPrecio.cliente.razonSocial || '',
          precioAnterior: precioAnterior ? precioAnterior.precio : null,
          precioNuevo: nuevoPrecio.precio,
          fechaDesde: nuevoPrecio.fechaDesde,
          motivo: observaciones || (precioAnterior ? 'Actualización de precio' : 'Creación de precio'),
          operadorId: createdBy || null,
          operadorNombre: null,
          tipoCambio: precioAnterior ? 'ACTUALIZACION' : 'CREACION'
        }
      })
    } catch (historyError) {
      // No bloquear la creación del precio si falla el historial
      console.error('Error al crear historial de precio:', historyError)
    }

    return NextResponse.json({
      success: true,
      data: nuevoPrecio
    })
  } catch (error) {
    console.error('Error creating precio servicio:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear precio de servicio' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar precio de servicio
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const precio = await db.precioServicio.update({
      where: { id },
      data,
      include: {
        tipoServicio: true,
        cliente: {
          select: {
            id: true,
            nombre: true,
            cuit: true,
            razonSocial: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: precio
    })
  } catch (error) {
    console.error('Error updating precio servicio:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar precio de servicio' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar precio de servicio
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    await db.precioServicio.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Precio de servicio eliminado'
    })
  } catch (error) {
    console.error('Error deleting precio servicio:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar precio de servicio' },
      { status: 500 }
    )
  }
}

// Función auxiliar para obtener precio vigente (not exported — Next.js route handlers only allow HTTP method exports)
async function obtenerPrecioVigente(tipoServicioId: string, clienteId: string, fecha?: Date) {
  const fechaBusqueda = fecha || new Date()

  const precio = await db.precioServicio.findFirst({
    where: {
      tipoServicioId,
      clienteId,
      fechaDesde: { lte: fechaBusqueda },
      OR: [
        { fechaHasta: null },
        { fechaHasta: { gte: fechaBusqueda } }
      ]
    },
    orderBy: { fechaDesde: 'desc' }
  })

  return precio
}
