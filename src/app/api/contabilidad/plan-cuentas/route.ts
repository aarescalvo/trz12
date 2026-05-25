import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createLogger } from '@/lib/logger';
import { checkPermission } from '@/lib/auth-helpers';

const logger = createLogger('API:PlanCuentas');

// GET - Listar plan de cuentas
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const imputable = searchParams.get('imputable');

    const where: Record<string, unknown> = { activo: true };
    if (tipo) where.tipo = tipo;
    if (imputable !== null) where.imputable = imputable === 'true';

    const cuentas = await db.planCuenta.findMany({
      where,
      orderBy: { codigo: 'asc' }
    });

    // Construir árbol jerárquico
    const cuentasMap = new Map<string, { id: string; codigo: string; nombre: string; tipo: string; imputable: boolean; activo: boolean; padreId: string | null; hijos: typeof raices }>(cuentas.map(c => [c.id, { ...c, hijos: [] }]))
    const raices: any[] = [];

    for (const cuenta of cuentas) {
      const nodo = cuentasMap.get(cuenta.id)!;
      if (cuenta.padreId && cuentasMap.has(cuenta.padreId)) {
        cuentasMap.get(cuenta.padreId)!.hijos.push(nodo);
      } else {
        raices.push(nodo);
      }
    }

    return NextResponse.json({ plano: cuentas, jerarquico: raices });
  } catch (error) {
    logger.error('Error al obtener plan de cuentas', error);
    return NextResponse.json({ error: 'Error al obtener plan de cuentas' }, { status: 500 });
  }
}

// POST - Crear cuenta
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const body = await request.json();
    const { codigo, nombre, tipo, imputable, padreId } = body;
    
    if (!codigo || !nombre || !tipo) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: codigo, nombre, tipo' },
        { status: 400 }
      );
    }
    
    const cuenta = await db.planCuenta.create({
      data: {
        codigo,
        nombre,
        tipo,
        imputable: imputable ?? true,
        padreId
      }
    });

    return NextResponse.json(cuenta, { status: 201 });
  } catch (error) {
    logger.error('Error al crear cuenta', error);
    return NextResponse.json({ error: 'Error al crear cuenta' }, { status: 500 });
  }
}
