import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission } from '@/lib/auth-helpers';

// GET - List all productos de desposte ordered by nombre
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion');
  if (authError) return authError;
  try {
    const productos = await db.c2ProductoDesposte.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        rubro: true,
        bomItems: {
          include: { insumo: true }
        }
      }
    });
    return NextResponse.json({ success: true, data: productos });
  } catch (error) {
    console.error('Error fetching productos de desposte:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener productos de desposte' },
      { status: 500 }
    );
  }
}

// POST - Create new producto de desposte
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

    if (!body.rubroId) {
      return NextResponse.json(
        { success: false, error: 'El rubro es requerido' },
        { status: 400 }
      );
    }

    // Validate codigo unique
    const existente = await db.c2ProductoDesposte.findFirst({
      where: { codigo: body.codigo.trim() }
    });

    if (existente) {
      return NextResponse.json(
        { success: false, error: `Ya existe un producto con el código "${body.codigo}"` },
        { status: 400 }
      );
    }

    const producto = await db.c2ProductoDesposte.create({
      data: {
        rubroId: body.rubroId,
        nombre: body.nombre.trim(),
        codigo: body.codigo.trim(),
        gtin: body.gtin || null,
        especie: body.especie || 'BOVINO',
        tipoCuartoOrigen: body.tipoCuartoOrigen || null,
        diasVencimiento: body.diasVencimiento ?? null,
        tempMin: body.tempMin ?? null,
        tempMax: body.tempMax ?? null,
        pesoTaraCaja: body.pesoTaraCaja ?? null,
        precioKg: body.precioKg ?? null,
        apareceRendimiento: body.apareceRendimiento ?? true,
        apareceStock: body.apareceStock ?? true,
        activo: body.activo ?? true,
        observaciones: body.observaciones || null,
      },
      include: {
        rubro: true,
        bomItems: { include: { insumo: true } }
      }
    });
    return NextResponse.json({ success: true, data: producto });
  } catch (error) {
    console.error('Error creating producto de desposte:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear producto de desposte' },
      { status: 500 }
    );
  }
}

// PUT - Update existing producto de desposte
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

    // Validate codigo unique if updating
    if (data.codigo && data.codigo.trim() !== '') {
      const existente = await db.c2ProductoDesposte.findFirst({
        where: {
          codigo: data.codigo.trim(),
          id: { not: id }
        }
      });

      if (existente) {
        return NextResponse.json(
          { success: false, error: `Ya existe otro producto con el código "${data.codigo}"` },
          { status: 400 }
        );
      }
    }

    const producto = await db.c2ProductoDesposte.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        rubro: true,
        bomItems: { include: { insumo: true } }
      }
    });
    return NextResponse.json({ success: true, data: producto });
  } catch (error) {
    console.error('Error updating producto de desposte:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar producto de desposte' },
      { status: 500 }
    );
  }
}

// DELETE - Delete producto de desposte by id
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

    // Check if has bomItems or cajas
    const [bomCount, cajasCount] = await Promise.all([
      db.c2BOM.count({ where: { productoDesposteId: id } }),
      db.cajaEmpaque.count({ where: { productoDesposteId: id } })
    ]);

    if (bomCount > 0 || cajasCount > 0) {
      const items: string[] = []
      if (bomCount > 0) items.push(`${bomCount} item(s) BOM`)
      if (cajasCount > 0) items.push(`${cajasCount} caja(s)`)
      return NextResponse.json(
        { success: false, error: `No se puede eliminar: el producto tiene ${items.join(' y ')}` },
        { status: 400 }
      );
    }

    await db.c2ProductoDesposte.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Error deleting producto de desposte:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar producto de desposte' },
      { status: 500 }
    );
  }
}
