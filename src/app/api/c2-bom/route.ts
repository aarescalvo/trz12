import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission } from '@/lib/auth-helpers';

// GET - List all BOM items
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion');
  if (authError) return authError;
  try {
    const bomItems = await db.c2BOM.findMany({
      include: {
        productoDesposte: true,
        insumo: true
      },
      orderBy: {
        productoDesposte: { nombre: 'asc' }
      }
    });
    return NextResponse.json({ success: true, data: bomItems });
  } catch (error) {
    console.error('Error fetching BOM:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener BOM' },
      { status: 500 }
    );
  }
}

// POST - Create new BOM item
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion');
  if (authError) return authError;
  try {
    const body = await request.json();

    if (!body.productoDesposteId) {
      return NextResponse.json(
        { success: false, error: 'El producto es requerido' },
        { status: 400 }
      );
    }

    if (!body.insumoId) {
      return NextResponse.json(
        { success: false, error: 'El insumo es requerido' },
        { status: 400 }
      );
    }

    if (body.cantidadPorCaja === undefined || body.cantidadPorCaja === null) {
      return NextResponse.json(
        { success: false, error: 'La cantidad por caja es requerida' },
        { status: 400 }
      );
    }

    // Validate unique combination (productoDesposteId + insumoId)
    const existente = await db.c2BOM.findFirst({
      where: {
        productoDesposteId: body.productoDesposteId,
        insumoId: body.insumoId
      }
    });

    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Ya existe este insumo para este producto' },
        { status: 400 }
      );
    }

    const bomItem = await db.c2BOM.create({
      data: {
        productoDesposteId: body.productoDesposteId,
        insumoId: body.insumoId,
        cantidadPorCaja: parseFloat(body.cantidadPorCaja),
        observaciones: body.observaciones || null,
      },
      include: {
        productoDesposte: true,
        insumo: true
      }
    });
    return NextResponse.json({ success: true, data: bomItem });
  } catch (error) {
    console.error('Error creating BOM item:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear item BOM' },
      { status: 500 }
    );
  }
}

// PUT - Update existing BOM item
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion');
  if (authError) return authError;
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      );
    }

    const bomItem = await db.c2BOM.update({
      where: { id },
      data: {
        cantidadPorCaja: data.cantidadPorCaja !== undefined ? parseFloat(data.cantidadPorCaja) : undefined,
        observaciones: data.observaciones !== undefined ? data.observaciones : undefined,
        updatedAt: new Date(),
      },
      include: {
        productoDesposte: true,
        insumo: true
      }
    });
    return NextResponse.json({ success: true, data: bomItem });
  } catch (error) {
    console.error('Error updating BOM item:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar item BOM' },
      { status: 500 }
    );
  }
}

// DELETE - Delete BOM item by id
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion');
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      );
    }

    await db.c2BOM.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Error deleting BOM item:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar item BOM' },
      { status: 500 }
    );
  }
}
