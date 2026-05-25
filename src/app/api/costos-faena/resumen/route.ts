import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Resumen de costos de una lista de faena
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url);
    const listaFaenaId = searchParams.get('listaFaenaId');

    if (!listaFaenaId) {
      return NextResponse.json(
        { error: 'ID de lista de faena requerido' },
        { status: 400 }
      );
    }

    // Obtener resumen existente
    let resumen = await db.resumenCostosFaena.findUnique({
      where: { listaFaenaId }
    });

    // Obtener aplicaciones
    const aplicaciones = await db.costoFaenaAplicado.findMany({
      where: { listaFaenaId },
      include: { costoFaena: true }
    });

    const listaFaena = await db.listaFaena.findUnique({
      where: { id: listaFaenaId }
    });

    if (!listaFaena) {
      return NextResponse.json(
        { error: 'Lista de faena no encontrada' },
        { status: 404 }
      );
    }

    // Obtener KG totales de romaneos
    const romaneos = await db.romaneo.findMany({
      where: { listaFaenaId }
    });

    const totalAnimales = listaFaena.cantidadTotal;
    const totalKg = romaneos.reduce((sum, r) => sum + (r.pesoTotal || 0), 0);
    const costoTotal = aplicaciones.reduce((sum, app) => sum + app.montoTotal, 0);
    const costoPorKg = totalKg > 0 ? costoTotal / totalKg : 0;
    const costoPorAnimal = totalAnimales > 0 ? costoTotal / totalAnimales : 0;

    return NextResponse.json({
      resumen: resumen || {
        listaFaenaId,
        totalAnimales,
        totalKg,
        costoTotal,
        costoPorKg,
        costoPorAnimal
      },
      aplicaciones,
      detalle: {
        totalAnimales,
        totalKg,
        costoTotal,
        costoPorKg,
        costoPorAnimal
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen de costos:', error);
    return NextResponse.json(
      { error: 'Error al obtener resumen de costos' },
      { status: 500 }
    );
  }
}

// POST - Aplicar costos a una lista de faena
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const body = await request.json();
    const { listaFaenaId, costoFaenaId, cantidad, observaciones } = body;

    if (!listaFaenaId || !costoFaenaId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const costoFaena = await db.costoFaena.findUnique({
      where: { id: costoFaenaId }
    });

    if (!costoFaena) {
      return NextResponse.json(
        { error: 'Costo de faena no encontrado' },
        { status: 404 }
      );
    }

    const cantidadFinal = cantidad || 1;
    const montoUnitario = costoFaena.monto;
    const montoTotal = montoUnitario * cantidadFinal;

    const aplicacion = await db.costoFaenaAplicado.create({
      data: {
        listaFaenaId,
        costoFaenaId,
        cantidad: cantidadFinal,
        montoUnitario,
        montoTotal,
        observaciones
      }
    });

    return NextResponse.json(aplicacion, { status: 201 });
  } catch (error) {
    console.error('Error al aplicar costo:', error);
    return NextResponse.json(
      { error: 'Error al aplicar costo' },
      { status: 500 }
    );
  }
}
