import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EstadoDetalleOrden } from '@prisma/client';

// GET - Listar detalles de orden de compra
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url);
    const ordenCompraId = searchParams.get('ordenCompraId');
    const insumoId = searchParams.get('insumoId');
    const estado = searchParams.get('estado');
    const id = searchParams.get('id');

    // Si se pasa un ID, obtener un detalle específico
    if (id) {
      const detalle = await db.detalleOrdenCompra.findUnique({
        where: { id },
        include: {
          ordenCompra: {
            include: {
              proveedor: true
            }
          },
          insumo: true
        }
      });

      if (!detalle) {
        return NextResponse.json({ error: 'Detalle de orden no encontrado' }, { status: 404 });
      }

      return NextResponse.json(detalle);
    }

    // Construir filtros
    const where: Record<string, unknown> = {};
    if (ordenCompraId) {
      where.ordenCompraId = ordenCompraId;
    }
    if (insumoId) {
      where.insumoId = insumoId;
    }
    if (estado) {
      where.estado = estado as EstadoDetalleOrden;
    }

    const detalles = await db.detalleOrdenCompra.findMany({
      where,
      include: {
        ordenCompra: {
          include: {
            proveedor: true
          }
        },
        insumo: true
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(detalles);
  } catch (error) {
    console.error('Error al obtener detalles de orden:', error);
    return NextResponse.json({ error: 'Error al obtener detalles de orden' }, { status: 500 });
  }
}

// POST - Crear detalle de orden de compra
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const data = await request.json();

    // Validar que la orden de compra exista
    const ordenCompra = await db.ordenCompra.findUnique({
      where: { id: data.ordenCompraId }
    });

    if (!ordenCompra) {
      return NextResponse.json({ error: 'Orden de compra no encontrada' }, { status: 404 });
    }

    // Validar que el insumo exista
    const insumo = await db.insumo.findUnique({
      where: { id: data.insumoId }
    });

    if (!insumo) {
      return NextResponse.json({ error: 'Insumo no encontrado' }, { status: 404 });
    }

    const subtotal = data.cantidadPedida * data.precioUnitario;

    const detalle = await db.detalleOrdenCompra.create({
      data: {
        ordenCompraId: data.ordenCompraId,
        insumoId: data.insumoId,
        cantidadPedida: data.cantidadPedida,
        cantidadRecibida: data.cantidadRecibida || 0,
        precioUnitario: data.precioUnitario,
        subtotal,
        estado: data.estado || EstadoDetalleOrden.PENDIENTE
      },
      include: {
        ordenCompra: {
          include: {
            proveedor: true
          }
        },
        insumo: true
      }
    });

    // Actualizar totales de la orden de compra
    await actualizarTotalesOrden(data.ordenCompraId);

    return NextResponse.json(detalle);
  } catch (error) {
    console.error('Error al crear detalle de orden:', error);
    return NextResponse.json({ error: 'Error al crear detalle de orden' }, { status: 500 });
  }
}

// PUT - Actualizar detalle de orden de compra
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const subtotal = data.cantidadPedida * data.precioUnitario;

    const detalle = await db.detalleOrdenCompra.update({
      where: { id: data.id },
      data: {
        cantidadPedida: data.cantidadPedida,
        cantidadRecibida: data.cantidadRecibida,
        precioUnitario: data.precioUnitario,
        subtotal,
        estado: data.estado
      },
      include: {
        ordenCompra: {
          include: {
            proveedor: true
          }
        },
        insumo: true
      }
    });

    // Actualizar totales de la orden de compra
    await actualizarTotalesOrden(detalle.ordenCompraId);

    return NextResponse.json(detalle);
  } catch (error) {
    console.error('Error al actualizar detalle de orden:', error);
    return NextResponse.json({ error: 'Error al actualizar detalle de orden' }, { status: 500 });
  }
}

// DELETE - Eliminar detalle de orden de compra
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    // Obtener el detalle para saber a qué orden pertenece
    const detalle = await db.detalleOrdenCompra.findUnique({
      where: { id },
      select: { ordenCompraId: true, estado: true }
    });

    if (!detalle) {
      return NextResponse.json({ error: 'Detalle de orden no encontrado' }, { status: 404 });
    }

    // Verificar que el detalle esté en estado PENDIENTE
    if (detalle.estado !== EstadoDetalleOrden.PENDIENTE) {
      return NextResponse.json({ 
        error: 'Solo se pueden eliminar detalles en estado PENDIENTE' 
      }, { status: 400 });
    }

    await db.detalleOrdenCompra.delete({
      where: { id }
    });

    // Actualizar totales de la orden de compra
    await actualizarTotalesOrden(detalle.ordenCompraId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar detalle de orden:', error);
    return NextResponse.json({ error: 'Error al eliminar detalle de orden' }, { status: 500 });
  }
}

// Función auxiliar para actualizar totales de una orden
async function actualizarTotalesOrden(ordenCompraId: string) {
  const detalles = await db.detalleOrdenCompra.findMany({
    where: { ordenCompraId }
  });

  let subtotal = 0;
  for (const d of detalles) {
    subtotal += d.subtotal;
  }

  const iva = subtotal * 0.21;
  const total = subtotal + iva;

  await db.ordenCompra.update({
    where: { id: ordenCompraId },
    data: { subtotal, iva, total }
  });
}
