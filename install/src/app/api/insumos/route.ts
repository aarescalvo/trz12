import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET - List all insumos ordered by nombre
export async function GET() {
  try {
    const insumos = await db.insumo.findMany({
      orderBy: { nombre: 'asc' },
    });
    return NextResponse.json({ success: true, data: insumos });
  } catch (error) {
    console.error('Error fetching insumos:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener insumos' },
      { status: 500 }
    );
  }
}

// POST - Create new insumo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const insumo = await db.insumo.create({
      data: {
        id: randomUUID(),
        codigo: body.codigo,
        nombre: body.nombre,
        categoria: body.categoria,
        subcategoria: body.subcategoria,
        unidadMedida: body.unidadMedida,
        stockActual: body.stockActual ?? 0,
        stockMinimo: body.stockMinimo ?? 0,
        stockMaximo: body.stockMaximo ?? 0,
        puntoReposicion: body.puntoReposicion ?? 0,
        proveedorId: body.proveedorId,
        proveedorNombre: body.proveedorNombre,
        codigoProveedor: body.codigoProveedor,
        precioUnitario: body.precioUnitario ?? 0,
        moneda: body.moneda ?? 'USD',
        ubicacion: body.ubicacion,
        activo: body.activo ?? true,
        observaciones: body.observaciones,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, data: insumo });
  } catch (error) {
    console.error('Error creating insumo:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear insumo' },
      { status: 500 }
    );
  }
}

// PUT - Update existing insumo
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      );
    }

    const insumo = await db.insumo.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, data: insumo });
  } catch (error) {
    console.error('Error updating insumo:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar insumo' },
      { status: 500 }
    );
  }
}

// DELETE - Delete insumo by id
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      );
    }

    await db.insumo.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Error deleting insumo:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar insumo' },
      { status: 500 }
    );
  }
}
