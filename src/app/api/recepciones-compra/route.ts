import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EstadoRecepcion, EstadoOrdenCompra } from '@prisma/client';

// GET - Listar recepciones de compra
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url);
    const ordenCompraId = searchParams.get('ordenCompraId');
    const estado = searchParams.get('estado');
    const id = searchParams.get('id');

    // Si se pasa un ID, obtener una recepción específica
    if (id) {
      const recepcion = await db.recepcionCompra.findUnique({
        where: { id },
        include: {
          ordenCompra: {
            include: {
              proveedor: true,
              detalles: {
                include: {
                  insumo: true
                }
              }
            }
          }
        }
      });

      if (!recepcion) {
        return NextResponse.json({ error: 'Recepción no encontrada' }, { status: 404 });
      }

      return NextResponse.json(recepcion);
    }

    // Construir filtros
    const where: Record<string, unknown> = {};
    if (ordenCompraId) {
      where.ordenCompraId = ordenCompraId;
    }
    if (estado) {
      where.estado = estado as EstadoRecepcion;
    }

    const recepciones = await db.recepcionCompra.findMany({
      where,
      include: {
        ordenCompra: {
          include: {
            proveedor: true,
            detalles: {
              include: {
                insumo: true
              }
            }
          }
        }
      },
      orderBy: { fechaRecepcion: 'desc' }
    });

    return NextResponse.json(recepciones);
  } catch (error) {
    console.error('Error al obtener recepciones:', error);
    return NextResponse.json({ error: 'Error al obtener recepciones' }, { status: 500 });
  }
}

// POST - Crear recepción de compra
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const data = await request.json();

    // Validar que la orden de compra exista
    const ordenCompra = await db.ordenCompra.findUnique({
      where: { id: data.ordenCompraId },
      include: {
        detalles: true
      }
    });

    if (!ordenCompra) {
      return NextResponse.json({ error: 'Orden de compra no encontrada' }, { status: 404 });
    }

    // Verificar que la orden no esté ANULADA
    if (ordenCompra.estado === EstadoOrdenCompra.ANULADA) {
      return NextResponse.json({ 
        error: 'No se puede recibir una orden anulada' 
      }, { status: 400 });
    }

    const recepcion = await db.recepcionCompra.create({
      data: {
        ordenCompraId: data.ordenCompraId,
        numeroRemito: data.numeroRemito,
        fechaRecepcion: data.fechaRecepcion ? new Date(data.fechaRecepcion) : new Date(),
        estado: data.estado || EstadoRecepcion.PARCIAL,
        observaciones: data.observaciones,
        operadorId: data.operadorId
      },
      include: {
        ordenCompra: {
          include: {
            proveedor: true,
            detalles: {
              include: {
                insumo: true
              }
            }
          }
        }
      }
    });

    // Actualizar estado de la orden de compra
    await actualizarEstadoOrden(data.ordenCompraId);

    return NextResponse.json(recepcion);
  } catch (error) {
    console.error('Error al crear recepción:', error);
    return NextResponse.json({ error: 'Error al crear recepción' }, { status: 500 });
  }
}

// PUT - Actualizar recepción de compra
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const recepcion = await db.recepcionCompra.update({
      where: { id: data.id },
      data: {
        numeroRemito: data.numeroRemito,
        fechaRecepcion: data.fechaRecepcion ? new Date(data.fechaRecepcion) : undefined,
        estado: data.estado,
        observaciones: data.observaciones,
        operadorId: data.operadorId
      },
      include: {
        ordenCompra: {
          include: {
            proveedor: true,
            detalles: {
              include: {
                insumo: true
              }
            }
          }
        }
      }
    });

    // Actualizar estado de la orden de compra
    await actualizarEstadoOrden(recepcion.ordenCompraId);

    return NextResponse.json(recepcion);
  } catch (error) {
    console.error('Error al actualizar recepción:', error);
    return NextResponse.json({ error: 'Error al actualizar recepción' }, { status: 500 });
  }
}

// DELETE - Eliminar recepción de compra
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    // Obtener la recepción para saber a qué orden pertenece
    const recepcion = await db.recepcionCompra.findUnique({
      where: { id },
      select: { ordenCompraId: true }
    });

    if (!recepcion) {
      return NextResponse.json({ error: 'Recepción no encontrada' }, { status: 404 });
    }

    await db.recepcionCompra.delete({
      where: { id }
    });

    // Actualizar estado de la orden de compra
    await actualizarEstadoOrden(recepcion.ordenCompraId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar recepción:', error);
    return NextResponse.json({ error: 'Error al eliminar recepción' }, { status: 500 });
  }
}

// Función auxiliar para actualizar estado de la orden según recepciones
async function actualizarEstadoOrden(ordenCompraId: string) {
  const orden = await db.ordenCompra.findUnique({
    where: { id: ordenCompraId },
    include: {
      detalles: true,
      recepciones: true
    }
  });

  if (!orden) return;

  // Si no hay recepciones, mantener estado actual o ponerlo como APROBADA si estaba ENVIADA
  if (orden.recepciones.length === 0) {
    if (orden.estado === EstadoOrdenCompra.ENVIADA || orden.estado === EstadoOrdenCompra.PARCIAL) {
      await db.ordenCompra.update({
        where: { id: ordenCompraId },
        data: { estado: EstadoOrdenCompra.APROBADA }
      });
    }
    return;
  }

  // Verificar si todas las recepciones son COMPLETAS
  const todasCompletas = orden.recepciones.every(r => r.estado === EstadoRecepcion.COMPLETA);

  if (todasCompletas) {
    // Verificar si todos los detalles están completos
    const todosDetallesCompletos = orden.detalles.every(d => 
      d.cantidadRecibida >= d.cantidadPedida
    );

    if (todosDetallesCompletos) {
      await db.ordenCompra.update({
        where: { id: ordenCompraId },
        data: { 
          estado: EstadoOrdenCompra.COMPLETADA,
          fechaRecepcion: new Date()
        }
      });
    } else {
      await db.ordenCompra.update({
        where: { id: ordenCompraId },
        data: { estado: EstadoOrdenCompra.PARCIAL }
      });
    }
  } else {
    await db.ordenCompra.update({
      where: { id: ordenCompraId },
      data: { estado: EstadoOrdenCompra.PARCIAL }
    });
  }
}
