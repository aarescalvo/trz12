import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission } from '@/lib/auth-helpers'

// GET - List all insumos ordered by nombre
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
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
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json();
    
    // Validar código único si se proporciona
    if (body.codigo && body.codigo.trim() !== '') {
      const existente = await db.insumo.findFirst({
        where: { codigo: body.codigo.trim() }
      });
      
      if (existente) {
        return NextResponse.json(
          { success: false, error: `Ya existe un insumo con el código ${body.codigo}` },
          { status: 400 }
        );
      }
    }
    
    const insumo = await db.insumo.create({
      data: {
        codigo: body.codigo || null,
        nombre: body.nombre,
        categoria: body.categoria,
        subcategoria: body.subcategoria || null,
        unidadMedida: body.unidadMedida || 'UN',
        stockActual: body.stockActual ?? 0,
        stockMinimo: body.stockMinimo ?? 0,
        stockMaximo: body.stockMaximo ?? null,
        puntoReposicion: body.puntoReposicion ?? null,
        proveedorNombre: body.proveedorNombre || null,
        codigoProveedor: body.codigoProveedor || null,
        precioUnitario: body.precioUnitario ?? null,
        moneda: body.moneda ?? 'ARS',
        ubicacion: body.ubicacion || null,
        activo: body.activo ?? true,
        observaciones: body.observaciones || null,
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
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      );
    }

    // Validar código único si se está actualizando
    if (data.codigo && data.codigo.trim() !== '') {
      const existente = await db.insumo.findFirst({
        where: { 
          codigo: data.codigo.trim(),
          id: { not: id }
        }
      });
      
      if (existente) {
        return NextResponse.json(
          { success: false, error: `Ya existe otro insumo con el código ${data.codigo}` },
          { status: 400 }
        );
      }
    }

    // Si cambia el precio, registrar en historial
    if (data.precioUnitario !== undefined) {
      const insumoActual = await db.insumo.findUnique({ where: { id } });
      const precioNuevo = data.precioUnitario ?? null;
      const precioAnterior = insumoActual?.precioUnitario ?? null;

      if (precioNuevo !== precioAnterior) {
        await db.historialPrecioInsumo.create({
          data: {
            insumoId: id,
            precioAnterior,
            precioNuevo,
            moneda: data.moneda || insumoActual?.moneda || 'ARS',
            motivo: data.motivoPrecio || 'Actualización manual',
            operadorId: data.operadorId || null,
          }
        });
      }
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
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError
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
