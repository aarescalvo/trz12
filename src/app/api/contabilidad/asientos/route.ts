import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createLogger } from '@/lib/logger';
import { checkPermission } from '@/lib/auth-helpers';

const logger = createLogger('API:AsientosContable');

// GET - Listar asientos contables
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const desde = searchParams.get('desde');
    const hasta = searchParams.get('hasta');

    const where: Record<string, unknown> = {};
    if (estado) where.estado = estado;
    if (desde || hasta) {
      where.fecha = {} as Record<string, unknown>;
      if (desde) (where.fecha as Record<string, unknown>).gte = new Date(desde);
      if (hasta) (where.fecha as Record<string, unknown>).lte = new Date(hasta);
    }

    const asientos = await db.asientoContable.findMany({
      where,
      include: { lineas: true },
      orderBy: { fecha: 'desc' }
    });

    return NextResponse.json(asientos);
  } catch (error) {
    logger.error('Error al obtener asientos', error);
    return NextResponse.json({ error: 'Error al obtener asientos' }, { status: 500 });
  }
}

// POST - Crear asiento contable
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const body = await request.json();
    const { tipoOrigen, origenId, origenDetalle, descripcion, lineas } = body;
    
    if (!descripcion || !lineas || lineas.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    // Validar que débitos = créditos
    const totalDebe = lineas.reduce((sum: number, l: any) => sum + (l.debe || 0), 0);
    const totalHaber = lineas.reduce((sum: number, l: any) => sum + (l.haber || 0), 0);
    
    if (Math.abs(totalDebe - totalHaber) > 0.01) {
      return NextResponse.json(
        { error: 'Asiento desbalanceado', totalDebe, totalHaber },
        { status: 400 }
      );
    }
    
    // Generar número de asiento secuencial: ASC-YYYYMMDD-NNNN
    const now = new Date()
    const fechaStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const countToday = await db.asientoContable.count({
      where: {
        numero: { startsWith: `ASC-${fechaStr}` }
      }
    })
    const numero = `ASC-${fechaStr}-${String(countToday + 1).padStart(4, '0')}`

    const asiento = await db.asientoContable.create({
      data: {
        numero,
        tipoOrigen: tipoOrigen || 'AJUSTE',
        origenId,
        origenDetalle,
        concepto: descripcion,
        lineas: {
          create: lineas.map((l: any, index: number) => ({
            codigoCuenta: l.codigoCuenta,
            nombreCuenta: l.nombreCuenta,
            debe: l.debe || 0,
            haber: l.haber || 0,
            auxiliarCodigo: l.auxiliarCodigo,
            auxiliarNombre: l.auxiliarNombre,
            orden: index
          }))
        }
      },
      include: { lineas: true }
    });

    return NextResponse.json(asiento, { status: 201 });
  } catch (error) {
    logger.error('Error al crear asiento', error);
    return NextResponse.json({ error: 'Error al crear asiento' }, { status: 500 });
  }
}
