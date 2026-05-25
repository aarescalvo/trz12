import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar stock de insumos
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url);
    const insumoId = searchParams.get('insumoId');
    const depositoId = searchParams.get('depositoId');
    const bajoMinimo = searchParams.get('bajoMinimo');

    const where: Record<string, unknown> = {};
    if (insumoId) {
      where.insumoId = insumoId;
    }
    if (depositoId) {
      where.depositoId = depositoId;
    }

    const stockItems = await db.stockInsumo.findMany({
      where,
      include: {
        insumo: true,
        deposito: true
      },
      orderBy: [
        { insumo: { nombre: 'asc' } },
        { deposito: { nombre: 'asc' } }
      ]
    });

    // Filtrar por bajo mínimo si se solicita
    let resultado = stockItems;
    if (bajoMinimo === 'true') {
      resultado = stockItems.filter(item => {
        const minimo = item.cantidadMinima ?? (item.insumo as Record<string, unknown> | null)?.stockMinimo;
        return minimo != null && item.cantidad < Number(minimo);
      });
    }

    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error al obtener stock de insumos:', error);
    return NextResponse.json({ error: 'Error al obtener stock de insumos' }, { status: 500 });
  }
}

// POST - Crear registro de stock
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const data = await request.json();

    // Verificar si ya existe el registro
    const existente = await db.stockInsumo.findFirst({
      where: {
        insumoId: data.insumoId,
        depositoId: data.depositoId
      }
    });

    if (existente) {
      return NextResponse.json({ 
        error: 'Ya existe un registro de stock para este insumo en este depósito' 
      }, { status: 400 });
    }

    const stock = await db.stockInsumo.create({
      data: {
        insumoId: data.insumoId,
        depositoId: data.depositoId,
        cantidad: parseFloat(data.cantidad) || 0,
        cantidadMinima: data.cantidadMinima ? parseFloat(data.cantidadMinima) : null,
        cantidadMaxima: data.cantidadMaxima ? parseFloat(data.cantidadMaxima) : null,
        precioPromedio: data.precioPromedio ? parseFloat(data.precioPromedio) : null,
        valorTotal: data.valorTotal ? parseFloat(data.valorTotal) : null,
      },
      include: {
        insumo: true,
        deposito: true
      }
    });

    return NextResponse.json(stock);
  } catch (error) {
    console.error('Error al crear stock de insumo:', error);
    return NextResponse.json({ error: 'Error al crear stock de insumo' }, { status: 500 });
  }
}

// PUT - Actualizar registro de stock
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const stock = await db.stockInsumo.update({
      where: { id: data.id },
      data: {
        cantidad: data.cantidad !== undefined ? parseFloat(data.cantidad) : undefined,
        cantidadMinima: data.cantidadMinima !== undefined ? (data.cantidadMinima ? parseFloat(data.cantidadMinima) : null) : undefined,
        cantidadMaxima: data.cantidadMaxima !== undefined ? (data.cantidadMaxima ? parseFloat(data.cantidadMaxima) : null) : undefined,
        precioPromedio: data.precioPromedio !== undefined ? (data.precioPromedio ? parseFloat(data.precioPromedio) : null) : undefined,
        valorTotal: data.valorTotal !== undefined ? (data.valorTotal ? parseFloat(data.valorTotal) : null) : undefined,
      },
      include: {
        insumo: true,
        deposito: true
      }
    });

    return NextResponse.json(stock);
  } catch (error) {
    console.error('Error al actualizar stock de insumo:', error);
    return NextResponse.json({ error: 'Error al actualizar stock de insumo' }, { status: 500 });
  }
}

// DELETE - Eliminar registro de stock
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const stock = await db.stockInsumo.findUnique({
      where: { id }
    });

    if (stock && stock.cantidad > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar el registro porque tiene stock disponible' 
      }, { status: 400 });
    }

    await db.stockInsumo.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar stock de insumo:', error);
    return NextResponse.json({ error: 'Error al eliminar stock de insumo' }, { status: 500 });
  }
}
