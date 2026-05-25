import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EstadoOrdenCompra } from '@prisma/client';

// GET - Listar órdenes de compra
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const proveedorId = searchParams.get('proveedorId');
    const id = searchParams.get('id');

    // Si se pasa un ID, obtener una orden específica con todas sus relaciones
    if (id) {
      const orden = await db.ordenCompra.findUnique({
        where: { id },
        include: {
          proveedor: true,
          detalles: {
            include: {
              insumo: true
            }
          },
          recepciones: true
        }
      });

      if (!orden) {
        return NextResponse.json({ error: 'Orden de compra no encontrada' }, { status: 404 });
      }

      return NextResponse.json(orden);
    }

    // Construir filtros
    const where: Record<string, unknown> = {};
    if (estado) {
      where.estado = estado as EstadoOrdenCompra;
    }
    if (proveedorId) {
      where.proveedorId = proveedorId;
    }

    const ordenes = await db.ordenCompra.findMany({
      where,
      include: {
        proveedor: true,
        detalles: {
          include: {
            insumo: true
          }
        },
        recepciones: true
      },
      orderBy: { fechaEmision: 'desc' }
    });

    return NextResponse.json(ordenes);
  } catch (error) {
    console.error('Error al obtener órdenes de compra:', error);
    return NextResponse.json({ error: 'Error al obtener órdenes de compra' }, { status: 500 });
  }
}

// POST - Crear orden de compra
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const data = await request.json();

    // Obtener el último número de orden
    const ultimaOrden = await db.ordenCompra.findFirst({
      orderBy: { numero: 'desc' },
      select: { numero: true }
    });

    const numero = (ultimaOrden?.numero || 0) + 1;

    // Calcular totales si hay detalles
    let subtotal = 0;
    const detalles = data.detalles || [];

    for (const detalle of detalles) {
      subtotal += detalle.cantidadPedida * detalle.precioUnitario;
    }

    const iva = subtotal * 0.21; // IVA 21%
    const total = subtotal + iva;

    const orden = await db.ordenCompra.create({
      data: {
        numero,
        proveedorId: data.proveedorId || null,
        fechaEmision: data.fechaEmision ? new Date(data.fechaEmision) : new Date(),
        fechaEntrega: data.fechaEntrega ? new Date(data.fechaEntrega) : null,
        estado: data.estado || EstadoOrdenCompra.PENDIENTE,
        subtotal,
        iva,
        total,
        observaciones: data.observaciones,
        operadorId: data.operadorId,
        detalles: {
          create: detalles.map((d: { insumoId: string; cantidadPedida: number; precioUnitario: number }) => ({
            insumoId: d.insumoId,
            cantidadPedida: d.cantidadPedida,
            cantidadRecibida: 0,
            precioUnitario: d.precioUnitario,
            subtotal: d.cantidadPedida * d.precioUnitario
          }))
        }
      },
      include: {
        proveedor: true,
        detalles: {
          include: {
            insumo: true
          }
        }
      }
    });

    return NextResponse.json(orden);
  } catch (error) {
    console.error('Error al crear orden de compra:', error);
    return NextResponse.json({ error: 'Error al crear orden de compra' }, { status: 500 });
  }
}

// PUT - Actualizar orden de compra
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    // Si hay detalles, recalcular totales
    let updateData: Record<string, unknown> = {
      proveedorId: data.proveedorId,
      fechaEmision: data.fechaEmision ? new Date(data.fechaEmision) : undefined,
      fechaEntrega: data.fechaEntrega ? new Date(data.fechaEntrega) : null,
      fechaRecepcion: data.fechaRecepcion ? new Date(data.fechaRecepcion) : null,
      estado: data.estado,
      observaciones: data.observaciones,
      operadorId: data.operadorId
    };

    if (data.detalles) {
      let subtotal = 0;
      for (const detalle of data.detalles) {
        subtotal += detalle.cantidadPedida * detalle.precioUnitario;
      }
      const iva = subtotal * 0.21;
      const total = subtotal + iva;

      updateData.subtotal = subtotal;
      updateData.iva = iva;
      updateData.total = total;
    }

    const orden = await db.ordenCompra.update({
      where: { id: data.id },
      data: updateData,
      include: {
        proveedor: true,
        detalles: {
          include: {
            insumo: true
          }
        },
        recepciones: true
      }
    });

    return NextResponse.json(orden);
  } catch (error) {
    console.error('Error al actualizar orden de compra:', error);
    return NextResponse.json({ error: 'Error al actualizar orden de compra' }, { status: 500 });
  }
}

// DELETE - Eliminar orden de compra
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    // Verificar que la orden esté en estado PENDIENTE
    const orden = await db.ordenCompra.findUnique({
      where: { id },
      select: { estado: true }
    });

    if (!orden) {
      return NextResponse.json({ error: 'Orden de compra no encontrada' }, { status: 404 });
    }

    if (orden.estado !== EstadoOrdenCompra.PENDIENTE) {
      return NextResponse.json({ 
        error: 'Solo se pueden eliminar órdenes en estado PENDIENTE' 
      }, { status: 400 });
    }

    await db.ordenCompra.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar orden de compra:', error);
    return NextResponse.json({ error: 'Error al eliminar orden de compra' }, { status: 500 });
  }
}
