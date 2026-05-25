import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission } from '@/lib/auth-helpers';

// GET - List all rubros ordered by orden
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion');
  if (authError) return authError;
  try {
    const rubros = await db.c2Rubro.findMany({
      orderBy: { orden: 'asc' },
    });
    return NextResponse.json({ success: true, data: rubros });
  } catch (error) {
    console.error('Error fetching rubros:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener rubros' },
      { status: 500 }
    );
  }
}

// POST - Create new rubro
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion');
  if (authError) return authError;
  try {
    const body = await request.json();

    if (!body.nombre || body.nombre.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Validate nombre unique
    const existente = await db.c2Rubro.findFirst({
      where: { nombre: body.nombre.trim() }
    });

    if (existente) {
      return NextResponse.json(
        { success: false, error: `Ya existe un rubro con el nombre "${body.nombre}"` },
        { status: 400 }
      );
    }

    const rubro = await db.c2Rubro.create({
      data: {
        nombre: body.nombre.trim(),
        descripcion: body.descripcion || null,
        orden: body.orden ?? 0,
        activo: body.activo ?? true,
      },
    });
    return NextResponse.json({ success: true, data: rubro });
  } catch (error) {
    console.error('Error creating rubro:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear rubro' },
      { status: 500 }
    );
  }
}

// PUT - Update existing rubro
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

    // Validate nombre unique if updating
    if (data.nombre && data.nombre.trim() !== '') {
      const existente = await db.c2Rubro.findFirst({
        where: {
          nombre: data.nombre.trim(),
          id: { not: id }
        }
      });

      if (existente) {
        return NextResponse.json(
          { success: false, error: `Ya existe otro rubro con el nombre "${data.nombre}"` },
          { status: 400 }
        );
      }
    }

    const rubro = await db.c2Rubro.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, data: rubro });
  } catch (error) {
    console.error('Error updating rubro:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar rubro' },
      { status: 500 }
    );
  }
}

// DELETE - Delete rubro by id
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

    // Check if has productos related
    const productosCount = await db.c2ProductoDesposte.count({
      where: { rubroId: id }
    });

    if (productosCount > 0) {
      return NextResponse.json(
        { success: false, error: `No se puede eliminar: el rubro tiene ${productosCount} producto(s) asociado(s)` },
        { status: 400 }
      );
    }

    await db.c2Rubro.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Error deleting rubro:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar rubro' },
      { status: 500 }
    );
  }
}
