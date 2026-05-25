import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Listar costos de faena
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url);
    const activo = searchParams.get('activo');
    const tipo = searchParams.get('tipo');

    const where: any = {};
    
    if (activo !== null) {
      where.activo = activo === 'true';
    }
    
    if (tipo) {
      where.tipo = tipo;
    }

    const costos = await db.costoFaena.findMany({
      where,
      orderBy: [
        { tipo: 'asc' },
        { nombre: 'asc' }
      ]
    });

    return NextResponse.json(costos);
  } catch (error) {
    console.error('Error al obtener costos de faena:', error);
    return NextResponse.json(
      { error: 'Error al obtener costos de faena' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo costo de faena
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const body = await request.json();
    const { nombre, descripcion, tipo, monto, monedaId, aplicaA, fechaDesde, fechaHasta } = body;

    if (!nombre || !tipo || monto === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: nombre, tipo, monto' },
        { status: 400 }
      );
    }

    const costo = await db.costoFaena.create({
      data: {
        nombre,
        descripcion,
        tipo, // FIJO, VARIABLE, POR_KG, POR_ANIMAL
        monto: parseFloat(monto),
        monedaId,
        aplicaA: aplicaA || 'TODOS',
        fechaDesde: fechaDesde ? new Date(fechaDesde) : new Date(),
        fechaHasta: fechaHasta ? new Date(fechaHasta) : null
      }
    });

    return NextResponse.json(costo, { status: 201 });
  } catch (error) {
    console.error('Error al crear costo de faena:', error);
    return NextResponse.json(
      { error: 'Error al crear costo de faena' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar costo de faena
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID requerido' },
        { status: 400 }
      );
    }

    const updateData: any = { ...data };
    
    if (data.monto !== undefined) {
      updateData.monto = parseFloat(data.monto);
    }
    
    if (data.fechaDesde) {
      updateData.fechaDesde = new Date(data.fechaDesde);
    }
    
    if (data.fechaHasta) {
      updateData.fechaHasta = new Date(data.fechaHasta);
    }

    const costo = await db.costoFaena.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(costo);
  } catch (error) {
    console.error('Error al actualizar costo de faena:', error);
    return NextResponse.json(
      { error: 'Error al actualizar costo de faena' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar (desactivar) costo de faena
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID requerido' },
        { status: 400 }
      );
    }

    // Desactivar en lugar de eliminar
    await db.costoFaena.update({
      where: { id },
      data: { activo: false }
    });

    return NextResponse.json({ success: true, message: 'Costo de faena desactivado' });
  } catch (error) {
    console.error('Error al eliminar costo de faena:', error);
    return NextResponse.json(
      { error: 'Error al eliminar costo de faena' },
      { status: 500 }
    );
  }
}
