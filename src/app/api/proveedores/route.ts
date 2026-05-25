import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar proveedores
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url);
    const activos = searchParams.get('activos');

    const where: Record<string, unknown> = {};
    if (activos === 'true') {
      where.activo = true;
    }

    const proveedores = await db.proveedor.findMany({
      where,
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true,
        cuit: true,
        direccion: true,
        telefono: true,
        email: true,
        tipo: true,
        contacto: true,
        observaciones: true,
        activo: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: proveedores
    });
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Error al obtener proveedores' 
    }, { status: 500 });
  }
}

// POST - Crear proveedor
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const data = await request.json();

    if (!data.nombre) {
      return NextResponse.json({ 
        success: false,
        error: 'El nombre es requerido' 
      }, { status: 400 });
    }

    const proveedor = await db.proveedor.create({
      data: {
        nombre: data.nombre,
        cuit: data.cuit || null,
        direccion: data.direccion || null,
        telefono: data.telefono || null,
        email: data.email || null,
        tipo: data.tipo || 'OTROS',
        contacto: data.contacto || null,
        observaciones: data.observaciones || null,
        activo: data.activo ?? true,
      }
    });

    return NextResponse.json({
      success: true,
      data: proveedor
    });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Error al crear proveedor' 
    }, { status: 500 });
  }
}

// PUT - Actualizar proveedor
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ 
        success: false,
        error: 'ID requerido' 
      }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      nombre: data.nombre,
      cuit: data.cuit,
      direccion: data.direccion,
      telefono: data.telefono,
      email: data.email,
      activo: data.activo,
    }

    // Solo actualizar tipo/contacto/observaciones si se proporcionan
    if (data.tipo !== undefined) updateData.tipo = data.tipo
    if (data.contacto !== undefined) updateData.contacto = data.contacto
    if (data.observaciones !== undefined) updateData.observaciones = data.observaciones

    const proveedor = await db.proveedor.update({
      where: { id: data.id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: proveedor
    });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Error al actualizar proveedor' 
    }, { status: 500 });
  }
}

// DELETE - Eliminar proveedor
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        success: false,
        error: 'ID requerido' 
      }, { status: 400 });
    }

    await db.proveedor.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Error al eliminar proveedor' 
    }, { status: 500 });
  }
}
