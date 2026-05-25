import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar reportes automáticos
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url);
    const activo = searchParams.get('activo');
    const tipo = searchParams.get('tipo');

    const where: any = {};
    if (activo !== null) where.activo = activo === 'true';
    if (tipo) where.tipo = tipo;

    const reportes = await db.reporteAutomatico.findMany({
      where,
      orderBy: { nombre: 'asc' }
    });

    return NextResponse.json(reportes);
  } catch (error) {
    console.error('Error al obtener reportes:', error);
    return NextResponse.json({ error: 'Error al obtener reportes' }, { status: 500 });
  }
}

// POST - Crear nuevo reporte automático
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const body = await request.json();
    const { nombre, descripcion, tipo, formato, frecuencia, diaSemana, diaMes, hora, destinatarios } = body;

    if (!nombre || !tipo || !frecuencia || !destinatarios) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Calcular próxima ejecución
    const proximoEnvio = calcularProximoEnvio(frecuencia, diaSemana, diaMes, hora);

    const reporte = await db.reporteAutomatico.create({
      data: {
        nombre,
        descripcion,
        tipo,
        formato: formato || 'PDF',
        frecuencia,
        diaSemana,
        diaMes,
        hora: hora || '08:00',
        destinatarios: JSON.stringify(Array.isArray(destinatarios) ? destinatarios : destinatarios.split(',').map((e: string) => e.trim())),
        proximoEnvio
      }
    });

    return NextResponse.json(reporte, { status: 201 });
  } catch (error) {
    console.error('Error al crear reporte:', error);
    return NextResponse.json({ error: 'Error al crear reporte' }, { status: 500 });
  }
}

// PUT - Actualizar reporte
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const updateData: any = { ...data };
    if (data.destinatarios) {
      updateData.destinatarios = JSON.stringify(Array.isArray(data.destinatarios) ? data.destinatarios : data.destinatarios.split(',').map((e: string) => e.trim()));
    }

    const reporte = await db.reporteAutomatico.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(reporte);
  } catch (error) {
    console.error('Error al actualizar reporte:', error);
    return NextResponse.json({ error: 'Error al actualizar reporte' }, { status: 500 });
  }
}

// DELETE - Eliminar reporte
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await db.reporteAutomatico.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar reporte:', error);
    return NextResponse.json({ error: 'Error al eliminar reporte' }, { status: 500 });
  }
}

// Función para calcular próxima ejecución
function calcularProximoEnvio(frecuencia: string, diaSemana?: number, diaMes?: number, hora?: string): Date {
  const ahora = new Date();
  const [h, m] = (hora || '08:00').split(':').map(Number);
  
  const proximo = new Date(ahora);
  proximo.setHours(h, m, 0, 0);

  switch (frecuencia) {
    case 'DIARIO':
      if (proximo <= ahora) {
        proximo.setDate(proximo.getDate() + 1);
      }
      break;
    case 'SEMANAL':
      const diaActual = proximo.getDay();
      const diaObjetivo = diaSemana || 1;
      const diff = (diaObjetivo - diaActual + 7) % 7;
      proximo.setDate(proximo.getDate() + diff);
      if (proximo <= ahora) {
        proximo.setDate(proximo.getDate() + 7);
      }
      break;
    case 'MENSUAL':
      const diaMesObjetivo = diaMes || 1;
      proximo.setDate(diaMesObjetivo);
      if (proximo <= ahora) {
        proximo.setMonth(proximo.getMonth() + 1);
      }
      break;
  }

  return proximo;
}
