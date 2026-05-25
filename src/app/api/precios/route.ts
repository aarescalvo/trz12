import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validarPermiso } from '@/lib/auth-helpers'

function getOperadorId(request: NextRequest): string | null {
  return request.headers.get('x-operador-id')
}

// GET /api/precios — Listar precios vigentes o todos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modo = searchParams.get('modo') || 'vigentes'
    const tipoServicioId = searchParams.get('tipoServicioId') || undefined
    const clienteId = searchParams.get('clienteId') || undefined

    if (modo === 'vigentes') {
      // Precios vigentes (fechaHasta = null)
      const where: any = { fechaHasta: null }
      if (tipoServicioId) where.tipoServicioId = tipoServicioId
      if (clienteId) where.clienteId = clienteId

      const precios = await db.precioServicio.findMany({
        where,
        include: {
          tipoServicio: { select: { id: true, codigo: true, nombre: true, unidad: true, porcentajeIva: true } },
          cliente: { select: { id: true, nombre: true, cuit: true, razonSocial: true } },
        },
        orderBy: [{ tipoServicioId: 'asc' }, { clienteId: 'asc' }],
      })
      return NextResponse.json({ success: true, data: precios })
    }

    if (modo === 'todos') {
      // Todos los precios (incluyendo histórico)
      const where: any = {}
      if (tipoServicioId) where.tipoServicioId = tipoServicioId
      if (clienteId) where.clienteId = clienteId

      const precios = await db.precioServicio.findMany({
        where,
        include: {
          tipoServicio: { select: { id: true, codigo: true, nombre: true, unidad: true, porcentajeIva: true } },
          cliente: { select: { id: true, nombre: true, cuit: true, razonSocial: true } },
          historial: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: [{ fechaDesde: 'desc' }],
      })
      return NextResponse.json({ success: true, data: precios })
    }

    if (modo === 'precioVigente') {
      // Buscar precio vigente para un tipo de servicio y cliente específico
      const tsId = searchParams.get('tipoServicioId')
      const clId = searchParams.get('clienteId')
      if (!tsId || !clId) {
        return NextResponse.json({ success: false, error: 'tipoServicioId y clienteId son requeridos' }, { status: 400 })
      }

      const precio = await db.precioServicio.findFirst({
        where: { tipoServicioId: tsId, clienteId: clId, fechaHasta: null },
        include: {
          tipoServicio: { select: { id: true, codigo: true, nombre: true, unidad: true, porcentajeIva: true } },
          cliente: { select: { id: true, nombre: true, cuit: true } },
        },
      })
      return NextResponse.json({ success: true, data: precio })
    }

    return NextResponse.json({ success: false, error: 'Modo no válido. Use: vigentes, todos, precioVigente' }, { status: 400 })
  } catch (error: any) {
    console.error('Error precios GET:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST /api/precios — Crear nuevo precio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipoServicioId, clienteId, precio, fechaDesde, observaciones, operadorId, motivo } = body

    const opId = operadorId || getOperadorId(request)
    const puedeCrear = await validarPermiso(opId, 'puedeFacturacion')
    if (!puedeCrear) {
      return NextResponse.json({ success: false, error: 'Sin permisos de facturación' }, { status: 403 })
    }

    if (!tipoServicioId || !clienteId || precio === undefined || precio === null) {
      return NextResponse.json({ success: false, error: 'tipoServicioId, clienteId y precio son requeridos' }, { status: 400 })
    }

    if (precio < 0) {
      return NextResponse.json({ success: false, error: 'El precio no puede ser negativo' }, { status: 400 })
    }

    // Buscar tipo de servicio y cliente para snapshots
    const tipoServicio = await db.tipoServicio.findUnique({ where: { id: tipoServicioId } })
    const cliente = await db.cliente.findUnique({ where: { id: clienteId } })

    if (!tipoServicio) {
      return NextResponse.json({ success: false, error: 'Tipo de servicio no encontrado' }, { status: 404 })
    }
    if (!cliente) {
      return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Buscar precio vigente anterior para este tipo+cliente
    const precioAnterior = await db.precioServicio.findFirst({
      where: { tipoServicioId, clienteId, fechaHasta: null },
    })

    let precioAnteriorValor: number | null = null
    let precioAnteriorId: string | null = null

    if (precioAnterior) {
      precioAnteriorValor = precioAnterior.precio
      precioAnteriorId = precioAnterior.id
      // Cerrar la vigencia del precio anterior
      const nuevaFechaDesde = fechaDesde ? new Date(fechaDesde) : new Date()
      await db.precioServicio.update({
        where: { id: precioAnterior.id },
        data: { fechaHasta: nuevaFechaDesde },
      })
    }

    // Obtener nombre del operador
    let operadorNombre: string | null = null
    if (operadorId) {
      const operador = await db.operador.findUnique({ where: { id: operadorId } })
      operadorNombre = operador?.nombre || null
    }

    // Crear el nuevo precio y el registro de historial en una transacción
    const resultado = await db.$transaction(async (tx) => {
      const nuevoPrecio = await tx.precioServicio.create({
        data: {
          tipoServicioId,
          clienteId,
          precio,
          fechaDesde: fechaDesde ? new Date(fechaDesde) : new Date(),
          observaciones,
          createdBy: operadorId,
        },
        include: {
          tipoServicio: { select: { id: true, codigo: true, nombre: true, unidad: true, porcentajeIva: true } },
          cliente: { select: { id: true, nombre: true, cuit: true, razonSocial: true } },
        },
      })

      // Crear registro en historial
      await tx.precioHistorial.create({
        data: {
          precioServicioId: nuevoPrecio.id,
          tipoServicioId,
          tipoServicioNombre: tipoServicio.nombre,
          clienteId,
          clienteNombre: cliente.nombre || cliente.razonSocial || '',
          precioAnterior: precioAnteriorValor,
          precioNuevo: precio,
          fechaDesde: nuevoPrecio.fechaDesde,
          motivo: motivo || (precioAnteriorValor !== null ? 'Actualización de precio' : 'Creación de precio'),
          operadorId: operadorId || null,
          operadorNombre,
          tipoCambio: precioAnteriorValor !== null ? 'ACTUALIZACION' : 'CREACION',
        },
      })

      return nuevoPrecio
    })

    return NextResponse.json({ success: true, data: resultado })
  } catch (error: any) {
    console.error('Error precios POST:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT /api/precios — Actualizar precio
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, precio, observaciones, motivo, operadorId } = body

    const opId = operadorId || getOperadorId(request)
    const puedeEditar = await validarPermiso(opId, 'puedeFacturacion')
    if (!puedeEditar) {
      return NextResponse.json({ success: false, error: 'Sin permisos de facturación' }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID es requerido' }, { status: 400 })
    }

    const precioExistente = await db.precioServicio.findUnique({
      where: { id },
      include: {
        tipoServicio: { select: { id: true, codigo: true, nombre: true, unidad: true } },
        cliente: { select: { id: true, nombre: true, cuit: true, razonSocial: true } },
      },
    })

    if (!precioExistente) {
      return NextResponse.json({ success: false, error: 'Precio no encontrado' }, { status: 404 })
    }

    let operadorNombre: string | null = null
    if (operadorId) {
      const operador = await db.operador.findUnique({ where: { id: operadorId } })
      operadorNombre = operador?.nombre || null
    }

    // Si cambia el precio, registrar en historial
    if (precio !== undefined && precio !== precioExistente.precio) {
      const precioAnteriorValor = precioExistente.precio

      const resultado = await db.$transaction(async (tx) => {
        const actualizado = await tx.precioServicio.update({
          where: { id },
          data: {
            precio,
            observaciones: observaciones !== undefined ? observaciones : precioExistente.observaciones,
          },
          include: {
            tipoServicio: { select: { id: true, codigo: true, nombre: true, unidad: true, porcentajeIva: true } },
            cliente: { select: { id: true, nombre: true, cuit: true, razonSocial: true } },
          },
        })

        await tx.precioHistorial.create({
          data: {
            precioServicioId: id,
            tipoServicioId: precioExistente.tipoServicioId,
            tipoServicioNombre: precioExistente.tipoServicio.nombre,
            clienteId: precioExistente.clienteId,
            clienteNombre: precioExistente.cliente.nombre || precioExistente.cliente.razonSocial || '',
            precioAnterior: precioAnteriorValor,
            precioNuevo: precio,
            fechaDesde: precioExistente.fechaDesde,
            motivo: motivo || 'Actualización de precio',
            operadorId: operadorId || null,
            operadorNombre,
            tipoCambio: 'ACTUALIZACION',
          },
        })

        return actualizado
      })

      return NextResponse.json({ success: true, data: resultado })
    }

    // Si solo cambian observaciones
    const actualizado = await db.precioServicio.update({
      where: { id },
      data: { observaciones },
      include: {
        tipoServicio: { select: { id: true, codigo: true, nombre: true, unidad: true, porcentajeIva: true } },
        cliente: { select: { id: true, nombre: true, cuit: true, razonSocial: true } },
      },
    })

    return NextResponse.json({ success: true, data: actualizado })
  } catch (error: any) {
    console.error('Error precios PUT:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE /api/precios — Eliminar/desactivar precio
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const operadorId = request.headers.get('x-operador-id')

    const puedeEliminar = await validarPermiso(operadorId, 'puedeFacturacion')
    if (!puedeEliminar) {
      return NextResponse.json({ success: false, error: 'Sin permisos de facturación' }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID es requerido' }, { status: 400 })
    }

    const precioExistente = await db.precioServicio.findUnique({
      where: { id },
      include: {
        tipoServicio: { select: { id: true, codigo: true, nombre: true } },
        cliente: { select: { id: true, nombre: true, razonSocial: true } },
      },
    })

    if (!precioExistente) {
      return NextResponse.json({ success: false, error: 'Precio no encontrado' }, { status: 404 })
    }

    let operadorNombre: string | null = null
    if (operadorId) {
      const operador = await db.operador.findUnique({ where: { id: operadorId } })
      operadorNombre = operador?.nombre || null
    }

    await db.$transaction(async (tx) => {
      // Registrar eliminación en historial
      await tx.precioHistorial.create({
        data: {
          precioServicioId: null, // El precio se elimina
          tipoServicioId: precioExistente.tipoServicioId,
          tipoServicioNombre: precioExistente.tipoServicio.nombre,
          clienteId: precioExistente.clienteId,
          clienteNombre: precioExistente.cliente.nombre || precioExistente.cliente.razonSocial || '',
          precioAnterior: precioExistente.precio,
          precioNuevo: 0,
          fechaDesde: precioExistente.fechaDesde,
          fechaHasta: new Date(),
          motivo: 'Eliminación de precio',
          operadorId: operadorId || null,
          operadorNombre,
          tipoCambio: 'ELIMINACION',
        },
      })

      // Eliminar el precio
      await tx.precioServicio.delete({ where: { id } })
    })

    return NextResponse.json({ success: true, message: 'Precio eliminado exitosamente' })
  } catch (error: any) {
    console.error('Error precios DELETE:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
