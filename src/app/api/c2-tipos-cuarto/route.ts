import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission } from '@/lib/auth-helpers';

// GET - List all tipos de cuarto ordered by orden
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion');
  if (authError) return authError;
  try {
    const tipos = await db.c2TipoCuarto.findMany({
      orderBy: { orden: 'asc' },
    });
    return NextResponse.json({ success: true, data: tipos });
  } catch (error) {
    console.error('Error fetching tipos de cuarto:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener tipos de cuarto' },
      { status: 500 }
    );
  }
}

// POST - Create new tipo de cuarto
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

    if (!body.codigo || body.codigo.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'El código es requerido' },
        { status: 400 }
      );
    }

    // Validate nombre unique
    const existenteNombre = await db.c2TipoCuarto.findFirst({
      where: { nombre: body.nombre.trim() }
    });

    if (existenteNombre) {
      return NextResponse.json(
        { success: false, error: `Ya existe un tipo de cuarto con el nombre "${body.nombre}"` },
        { status: 400 }
      );
    }

    // Validate codigo unique
    const existenteCodigo = await db.c2TipoCuarto.findFirst({
      where: { codigo: body.codigo.trim().toUpperCase() }
    });

    if (existenteCodigo) {
      return NextResponse.json(
        { success: false, error: `Ya existe un tipo de cuarto con el código "${body.codigo}"` },
        { status: 400 }
      );
    }

    const tipo = await db.c2TipoCuarto.create({
      data: {
        nombre: body.nombre.trim(),
        codigo: body.codigo.trim().toUpperCase(),
        descripcion: body.descripcion || null,
        orden: body.orden ?? 0,
        activo: body.activo ?? true,
      },
    });
    return NextResponse.json({ success: true, data: tipo });
  } catch (error) {
    console.error('Error creating tipo de cuarto:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear tipo de cuarto' },
      { status: 500 }
    );
  }
}

// PUT - Update existing tipo de cuarto
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
      const existenteNombre = await db.c2TipoCuarto.findFirst({
        where: {
          nombre: data.nombre.trim(),
          id: { not: id }
        }
      });

      if (existenteNombre) {
        return NextResponse.json(
          { success: false, error: `Ya existe otro tipo de cuarto con el nombre "${data.nombre}"` },
          { status: 400 }
        );
      }
    }

    // Validate codigo unique if updating
    if (data.codigo && data.codigo.trim() !== '') {
      const existenteCodigo = await db.c2TipoCuarto.findFirst({
        where: {
          codigo: data.codigo.trim().toUpperCase(),
          id: { not: id }
        }
      });

      if (existenteCodigo) {
        return NextResponse.json(
          { success: false, error: `Ya existe otro tipo de cuarto con el código "${data.codigo}"` },
          { status: 400 }
        );
      }
    }

    const tipo = await db.c2TipoCuarto.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, data: tipo });
  } catch (error) {
    console.error('Error updating tipo de cuarto:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar tipo de cuarto' },
      { status: 500 }
    );
  }
}

// DELETE - Delete tipo de cuarto by id
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

    // Verificar si hay cuartos asociados antes de eliminar
    const relacionados = await db.cuarto.count({
      where: { tipoCuartoId: id }
    })
    if (relacionados > 0) {
      return NextResponse.json({
        success: false,
        error: `No se puede eliminar: hay ${relacionados} cuarto(s) asociados a este tipo`
      }, { status: 409 })
    }

    await db.c2TipoCuarto.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Error deleting tipo de cuarto:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar tipo de cuarto' },
      { status: 500 }
    );
  }
}
