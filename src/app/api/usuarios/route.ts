import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validarPermiso, getOperadorId } from '@/lib/auth-helpers';


// GET - Listar usuarios (usando Operador como usuarios internos del sistema)
export async function GET(request: NextRequest) {
  try {
    const operadorId = getOperadorId(request)
    const puedeVer = await validarPermiso(operadorId, 'puedeConfiguracion')
    if (!puedeVer) {
      return NextResponse.json({ success: false, error: 'Sin permisos de configuración' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url);
    const rol = searchParams.get('rol');
    const activos = searchParams.get('activos');

    const where: Record<string, unknown> = {};
    if (activos === 'true') {
      where.activo = true;
    }
    if (rol) {
      where.rol = rol;
    }

    const usuarios = await db.operador.findMany({
      where,
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true,
        usuario: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: usuarios
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Error al obtener usuarios' 
    }, { status: 500 });
  }
}
