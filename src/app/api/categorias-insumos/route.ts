import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar categorías de insumos
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url);
    const activos = searchParams.get('activos');

    const where: Record<string, unknown> = {};
    if (activos === 'true') {
      where.activo = true;
    }

    const categorias = await db.categoriaInsumoTabla.findMany({
      where,
      orderBy: { nombre: 'asc' as const },
    });

    return NextResponse.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías de insumos:', error);
    return NextResponse.json({ error: 'Error al obtener categorías de insumos' }, { status: 500 });
  }
}

// POST - Crear categoría de insumo
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const data = await request.json();

    const categoria = await db.categoriaInsumoTabla.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        activo: data.activo ?? true,
      }
    });

    return NextResponse.json(categoria);
  } catch (error) {
    console.error('Error al crear categoría de insumo:', error);
    return NextResponse.json({ error: 'Error al crear categoría de insumo' }, { status: 500 });
  }
}

// PUT - Actualizar categoría de insumo
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const categoria = await db.categoriaInsumoTabla.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        activo: data.activo,
      }
    });

    return NextResponse.json(categoria);
  } catch (error) {
    console.error('Error al actualizar categoría de insumo:', error);
    return NextResponse.json({ error: 'Error al actualizar categoría de insumo' }, { status: 500 });
  }
}

// DELETE - Eliminar categoría de insumo
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    // Verificar si tiene insumos asociados
    const insumosAsociados = await db.insumo.count({
      where: { categoria: 'OTROS' }
    });

    if (insumosAsociados > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar la categoría porque tiene insumos asociados' 
      }, { status: 400 });
    }

    await db.categoriaInsumoTabla.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar categoría de insumo:', error);
    return NextResponse.json({ error: 'Error al eliminar categoría de insumo' }, { status: 500 });
  }
}
