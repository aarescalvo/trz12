import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TipoMovimientoInsumo } from '@prisma/client';
import { checkPermission } from '@/lib/auth-helpers';
import { createLogger } from '@/lib/logger';

const logger = createLogger('MovimientosInsumos')

// GET - Listar movimientos de insumos
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url);
    const insumoId = searchParams.get('insumoId');
    const depositoId = searchParams.get('depositoId');
    const tipo = searchParams.get('tipo');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const limit = searchParams.get('limit');

    const where: Record<string, unknown> = {};
    if (insumoId) {
      where.insumoId = insumoId;
    }
    if (tipo) {
      where.tipo = tipo as TipoMovimientoInsumo;
    }
    if (fechaDesde || fechaHasta) {
      const fechaFilter: Record<string, unknown> = {};
      if (fechaDesde) {
        fechaFilter.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        fechaFilter.lte = new Date(fechaHasta);
      }
      where.fecha = fechaFilter;
    }
    if (depositoId) {
      where.OR = [
        { depositoOrigenId: depositoId },
        { depositoDestinoId: depositoId }
      ];
    }

    const movimientos = await db.movimientoInsumo.findMany({
      where,
      include: {
        insumo: true,
        depositoOrigen: true,
        depositoDestino: true,
        operador: { select: { id: true, nombre: true } }
      },
      orderBy: { fecha: 'desc' },
      take: limit ? parseInt(limit) : undefined
    });

    return NextResponse.json({ success: true, data: movimientos });
  } catch (error) {
    console.error('Error al obtener movimientos de insumos:', error);
    return NextResponse.json({ error: 'Error al obtener movimientos de insumos' }, { status: 500 });
  }
}

// Función auxiliar para actualizar stock
async function actualizarStock(
  insumoId: string,
  depositoId: string,
  cantidad: number,
  tipo: TipoMovimientoInsumo,
  precioUnitario?: number
) {
  // Buscar o crear registro de stock
  let stock = await db.stockInsumo.findUnique({
    where: {
      stockInsumo_insumo_deposito: { insumoId, depositoId }
    }
  });

  if (!stock) {
    stock = await db.stockInsumo.create({
      data: {
        insumoId,
        depositoId,
        cantidad: 0,
        precioPromedio: precioUnitario || 0,
      }
    });
  }

  let nuevaCantidad = stock.cantidad;
  let nuevoPrecioPromedio = stock.precioPromedio;

  // Actualizar cantidad según tipo de movimiento
  switch (tipo) {
    case 'INGRESO':
    case 'AJUSTE_POSITIVO':
      // Calcular precio promedio ponderado
      if (precioUnitario && precioUnitario > 0) {
        const valorAnterior = stock.cantidad * (stock.precioPromedio || 0);
        const valorNuevo = cantidad * precioUnitario;
        const cantidadTotal = stock.cantidad + cantidad;
        nuevoPrecioPromedio = cantidadTotal > 0 ? (valorAnterior + valorNuevo) / cantidadTotal : precioUnitario;
      }
      nuevaCantidad = stock.cantidad + cantidad;
      break;
    
    case 'EGRESO':
    case 'AJUSTE_NEGATIVO':
    case 'PERDIDA':
      nuevaCantidad = stock.cantidad - cantidad;
      if (nuevaCantidad < 0) {
        throw new Error('Stock insuficiente para realizar el movimiento');
      }
      break;
    
    case 'DEVOLUCION':
      nuevaCantidad = stock.cantidad - cantidad;
      if (nuevaCantidad < 0) {
        throw new Error('Stock insuficiente para realizar la devolución');
      }
      break;
    
    default:
      break;
  }

  // Actualizar el registro de stock
  const ahora = new Date();
  const updateData: Record<string, unknown> = {
    cantidad: nuevaCantidad,
    precioPromedio: nuevoPrecioPromedio,
    valorTotal: nuevaCantidad * (nuevoPrecioPromedio || 0),
  };

  if (tipo === 'INGRESO') {
    updateData.ultimoIngreso = ahora;
  } else if (tipo === 'EGRESO' || tipo === 'DEVOLUCION') {
    updateData.ultimaSalida = ahora;
  }

  return db.stockInsumo.update({
    where: { id: stock.id },
    data: updateData
  });
}

// POST - Crear movimiento de insumo (con actualización automática de stock)
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const data = await request.json();
    const tipo = data.tipo as TipoMovimientoInsumo;

    // Validaciones según tipo de movimiento
    if (tipo === 'TRANSFERENCIA') {
      if (!data.depositoOrigenId || !data.depositoDestinoId) {
        return NextResponse.json({ 
          error: 'Para transferencias se requieren depósito origen y destino' 
        }, { status: 400 });
      }
      if (data.depositoOrigenId === data.depositoDestinoId) {
        return NextResponse.json({ 
          error: 'El depósito origen y destino no pueden ser el mismo' 
        }, { status: 400 });
      }
    }

    // AJUSTE types allow movements without deposito (simple stock adjustments)
    const isAjusteSinDeposito = (tipo === 'AJUSTE_POSITIVO' || tipo === 'AJUSTE_NEGATIVO') 
      && !data.depositoDestinoId && !data.depositoOrigenId;

    if (!isAjusteSinDeposito) {
      if ((tipo === 'INGRESO' || tipo === 'AJUSTE_POSITIVO') && !data.depositoDestinoId) {
        return NextResponse.json({ 
          error: 'Se requiere depósito destino para este tipo de movimiento' 
        }, { status: 400 });
      }

      if ((tipo === 'EGRESO' || tipo === 'AJUSTE_NEGATIVO' || tipo === 'PERDIDA' || tipo === 'DEVOLUCION') && !data.depositoOrigenId) {
        return NextResponse.json({ 
          error: 'Se requiere depósito origen para este tipo de movimiento' 
        }, { status: 400 });
      }
    }

    const cantidad = parseFloat(data.cantidad);
    const precioUnitario = data.precioUnitario ? parseFloat(data.precioUnitario) : undefined;

    const operadorIdHeader = request.headers.get('x-operador-id');
    const operadorId = data.operadorId || operadorIdHeader || null;

    // Crear el movimiento
    const movimiento = await db.movimientoInsumo.create({
      data: {
        insumoId: data.insumoId,
        tipo,
        depositoOrigenId: data.depositoOrigenId || null,
        depositoDestinoId: data.depositoDestinoId || null,
        cantidad,
        loteInsumoId: data.loteInsumoId || null,
        precioUnitario,
        costoTotal: precioUnitario ? cantidad * precioUnitario : null,
        documentoTipo: data.documentoTipo,
        documentoNumero: data.documentoNumero,
        centroCostoId: data.centroCostoId || null,
        produccionId: data.produccionId || null,
        observaciones: data.observaciones,
        operadorId,
      },
      include: {
        insumo: true,
        depositoOrigen: true,
        depositoDestino: true,
        operador: { select: { id: true, nombre: true } }
      }
    });

    // Actualizar stock según tipo de movimiento
    switch (tipo) {
      case 'INGRESO':
      case 'AJUSTE_POSITIVO':
        if (isAjusteSinDeposito) {
          // Ajuste simple sin depósito: actualizar Insumo.stockActual directamente
          await db.insumo.update({
            where: { id: data.insumoId },
            data: { stockActual: { increment: cantidad } }
          });
          logger.info('Stock ajustado (sin depósito)', { insumoId: data.insumoId, tipo, cantidad });
        } else {
          await actualizarStock(
            data.insumoId,
            data.depositoDestinoId,
            cantidad,
            tipo,
            precioUnitario
          );
        }
        break;

      case 'EGRESO':
      case 'AJUSTE_NEGATIVO':
      case 'PERDIDA':
      case 'DEVOLUCION':
        if (isAjusteSinDeposito) {
          // Ajuste simple sin depósito: actualizar Insumo.stockActual directamente
          await db.insumo.update({
            where: { id: data.insumoId },
            data: { stockActual: { decrement: cantidad } }
          });
          logger.info('Stock ajustado (sin depósito)', { insumoId: data.insumoId, tipo, cantidad });
        } else {
          await actualizarStock(
            data.insumoId,
            data.depositoOrigenId,
            cantidad,
            tipo,
            precioUnitario
          );
        }
        break;

      case 'TRANSFERENCIA':
        // Salida del depósito origen
        await actualizarStock(
          data.insumoId,
          data.depositoOrigenId,
          cantidad,
          'EGRESO',
          precioUnitario
        );
        // Ingreso al depósito destino
        await actualizarStock(
          data.insumoId,
          data.depositoDestinoId,
          cantidad,
          'INGRESO',
          precioUnitario
        );
        break;
    }

    return NextResponse.json(movimiento);
  } catch (error) {
    console.error('Error al crear movimiento de insumo:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear movimiento de insumo' }, { status: 500 });
  }
}

// PUT - Actualizar movimiento de insumo (solo observaciones)
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    // Solo permitimos actualizar observaciones y datos adicionales
    // No se puede modificar cantidad, tipo o depósitos porque afectaría el stock
    const movimiento = await db.movimientoInsumo.update({
      where: { id: data.id },
      data: {
        observaciones: data.observaciones,
        documentoTipo: data.documentoTipo,
        documentoNumero: data.documentoNumero,
      },
      include: {
        insumo: true,
        depositoOrigen: true,
        depositoDestino: true
      }
    });

    return NextResponse.json(movimiento);
  } catch (error) {
    console.error('Error al actualizar movimiento de insumo:', error);
    return NextResponse.json({ error: 'Error al actualizar movimiento de insumo' }, { status: 500 });
  }
}

// DELETE - Anular movimiento de insumo (reverso de stock)
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    // Obtener el movimiento
    const movimiento = await db.movimientoInsumo.findUnique({
      where: { id }
    });

    if (!movimiento) {
      return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 });
    }

    // Revertir el stock según el tipo de movimiento
    const cantidad = movimiento.cantidad;

    switch (movimiento.tipo) {
      case 'INGRESO':
        // Revertir: quitar stock del depósito destino
        if (movimiento.depositoDestinoId) {
          const stock = await db.stockInsumo.findUnique({
            where: {
              stockInsumo_insumo_deposito: {
                insumoId: movimiento.insumoId,
                depositoId: movimiento.depositoDestinoId
              }
            }
          });
          if (stock && stock.cantidad < cantidad) {
            return NextResponse.json({ 
              error: 'No se puede anular el movimiento: stock insuficiente para revertir' 
            }, { status: 400 });
          }
          await db.stockInsumo.update({
            where: { id: stock!.id },
            data: { cantidad: { decrement: cantidad } }
          });
        }
        break;

      case 'EGRESO':
      case 'PERDIDA':
        // Revertir: devolver stock al depósito origen
        if (movimiento.depositoOrigenId) {
          const stock = await db.stockInsumo.findUnique({
            where: {
              stockInsumo_insumo_deposito: {
                insumoId: movimiento.insumoId,
                depositoId: movimiento.depositoOrigenId
              }
            }
          });
          if (stock) {
            await db.stockInsumo.update({
              where: { id: stock.id },
              data: { cantidad: { increment: cantidad } }
            });
          } else {
            await db.stockInsumo.create({
              data: {
                insumoId: movimiento.insumoId,
                depositoId: movimiento.depositoOrigenId,
                cantidad: cantidad
              }
            });
          }
        }
        break;

      case 'TRANSFERENCIA':
        // Revertir: devolver al origen, quitar del destino
        if (movimiento.depositoOrigenId) {
          const stockOrigen = await db.stockInsumo.findUnique({
            where: {
              stockInsumo_insumo_deposito: {
                insumoId: movimiento.insumoId,
                depositoId: movimiento.depositoOrigenId
              }
            }
          });
          if (stockOrigen) {
            await db.stockInsumo.update({
              where: { id: stockOrigen.id },
              data: { cantidad: { increment: cantidad } }
            });
          } else {
            await db.stockInsumo.create({
              data: {
                insumoId: movimiento.insumoId,
                depositoId: movimiento.depositoOrigenId,
                cantidad: cantidad
              }
            });
          }
        }
        if (movimiento.depositoDestinoId) {
          const stockDestino = await db.stockInsumo.findUnique({
            where: {
              stockInsumo_insumo_deposito: {
                insumoId: movimiento.insumoId,
                depositoId: movimiento.depositoDestinoId
              }
            }
          });
          if (stockDestino && stockDestino.cantidad >= cantidad) {
            await db.stockInsumo.update({
              where: { id: stockDestino.id },
              data: { cantidad: { decrement: cantidad } }
            });
          }
        }
        break;

      case 'AJUSTE_POSITIVO':
        // Revertir: quitar el ajuste
        if (!movimiento.depositoDestinoId && !movimiento.depositoOrigenId) {
          // Ajuste sin depósito: revertir Insumo.stockActual
          await db.insumo.update({
            where: { id: movimiento.insumoId },
            data: { stockActual: { decrement: cantidad } }
          });
          logger.info('Movimiento AJUSTE_POSITIVO anulado (sin depósito)', { id, cantidad });
        } else if (movimiento.depositoDestinoId) {
          const stock = await db.stockInsumo.findUnique({
            where: {
              stockInsumo_insumo_deposito: {
                insumoId: movimiento.insumoId,
                depositoId: movimiento.depositoDestinoId
              }
            }
          });
          if (stock && stock.cantidad >= cantidad) {
            await db.stockInsumo.update({
              where: { id: stock.id },
              data: { cantidad: { decrement: cantidad } }
            });
          }
        }
        break;

      case 'AJUSTE_NEGATIVO':
        // Revertir: devolver lo que se quitó
        if (!movimiento.depositoOrigenId && !movimiento.depositoDestinoId) {
          // Ajuste sin depósito: revertir Insumo.stockActual
          await db.insumo.update({
            where: { id: movimiento.insumoId },
            data: { stockActual: { increment: cantidad } }
          });
          logger.info('Movimiento AJUSTE_NEGATIVO anulado (sin depósito)', { id, cantidad });
        } else if (movimiento.depositoOrigenId) {
          const stock = await db.stockInsumo.findUnique({
            where: {
              stockInsumo_insumo_deposito: {
                insumoId: movimiento.insumoId,
                depositoId: movimiento.depositoOrigenId
              }
            }
          });
          if (stock) {
            await db.stockInsumo.update({
              where: { id: stock.id },
              data: { cantidad: { increment: cantidad } }
            });
          } else {
            await db.stockInsumo.create({
              data: {
                insumoId: movimiento.insumoId,
                depositoId: movimiento.depositoOrigenId,
                cantidad: cantidad
              }
            });
          }
        }
        break;

      case 'DEVOLUCION':
        // Revertir: quitar del stock lo que se "devolvió"
        if (movimiento.depositoOrigenId) {
          const stock = await db.stockInsumo.findUnique({
            where: {
              stockInsumo_insumo_deposito: {
                insumoId: movimiento.insumoId,
                depositoId: movimiento.depositoOrigenId
              }
            }
          });
          if (stock) {
            await db.stockInsumo.update({
              where: { id: stock.id },
              data: { cantidad: { increment: cantidad } }
            });
          }
        }
        break;
    }

    // Eliminar el movimiento
    await db.movimientoInsumo.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Movimiento anulado y stock revertido' });
  } catch (error) {
    console.error('Error al anular movimiento de insumo:', error);
    return NextResponse.json({ error: 'Error al anular movimiento de insumo' }, { status: 500 });
  }
}
