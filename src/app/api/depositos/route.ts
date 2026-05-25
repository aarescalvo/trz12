import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar depósitos
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url);
    const activos = searchParams.get('activos');

    const where: Record<string, unknown> = {};
    if (activos === 'true') {
      where.activo = true;
    }

    const depositos = await db.deposito.findMany({
      where,
      orderBy: { nombre: 'asc' },
      include: {
        _count: {
          select: { stockInsumos: true }
        }
      }
    });

    return NextResponse.json(depositos);
  } catch (error) {
    console.error('Error al obtener depósitos:', error);
    return NextResponse.json({ error: 'Error al obtener depósitos' }, { status: 500 });
  }
}

// POST - Crear depósito
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError

  try {
    const data = await request.json();

    const deposito = await db.deposito.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        ubicacion: data.ubicacion,
        responsable: data.responsable,
        capacidadM2: data.capacidadM2 ? parseFloat(data.capacidadM2) : null,
        capacidadM3: data.capacidadM3 ? parseFloat(data.capacidadM3) : null,
        activo: data.activo ?? true,
      }
    });

    return NextResponse.json(deposito);
  } catch (error) {
    console.error('Error al crear depósito:', error);
    return NextResponse.json({ error: 'Error al crear depósito' }, { status: 500 });
  }
}

// PUT - Actualizar depósito
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError

  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const deposito = await db.deposito.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        ubicacion: data.ubicacion,
        responsable: data.responsable,
        capacidadM2: data.capacidadM2 ? parseFloat(data.capacidadM2) : null,
        capacidadM3: data.capacidadM3 ? parseFloat(data.capacidadM3) : null,
        activo: data.activo,
      }
    });

    return NextResponse.json(deposito);
  } catch (error) {
    console.error('Error al actualizar depósito:', error);
    return NextResponse.json({ error: 'Error al actualizar depósito' }, { status: 500 });
  }
}

// DELETE - Eliminar depósito
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    // Verificar si tiene stock asociado
    const stockAsociado = await db.stockInsumo.count({
      where: { depositoId: id, cantidad: { gt: 0 } }
    });

    if (stockAsociado > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar el depósito porque tiene stock asociado' 
      }, { status: 400 });
    }

    // Eliminar stock en cero si existe
    await db.stockInsumo.deleteMany({
      where: { depositoId: id }
    });

    await db.deposito.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar depósito:', error);
    return NextResponse.json({ error: 'Error al eliminar depósito' }, { status: 500 });
  }
}
