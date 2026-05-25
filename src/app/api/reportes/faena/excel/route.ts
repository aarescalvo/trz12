import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { db } from '@/lib/db';
import { checkPermission } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const body = await request.json();
    const { fechaDesde, fechaHasta, tropaId } = body;

    // Construir filtros
    const where: any = {};
    
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) where.fecha.lte = new Date(fechaHasta);
    }
    
    if (tropaId) {
      where.tropaId = tropaId;
    }

    // Obtener datos de balances de faena
    const balances = await db.balanceFaena.findMany({
      where,
      include: {
        tropa: {
          include: {
            productor: true,
          },
        },
      },
      orderBy: { fecha: 'desc' },
    });

    // Transformar datos para exportación
    const data = balances.map((b) => ({
      fecha: b.fecha,
      tropaNumero: b.tropa?.numero || 0,
      productor: b.tropa?.productor?.nombre || 'Sin productor',
      cantidadAnimales: b.tropa?.cantidadCabezas || 0,
      pesoVivoTotal: b.pesoVivoTotal,
      pesoFrioTotal: b.pesoFrioTotal,
      rinde: b.rindePromedio || 0,
      observaciones: b.observaciones || '',
    }));

    // Crear workbook con ExcelJS
    const wb = new ExcelJS.Workbook();

    // Preparar datos
    const headers = [
      'Fecha',
      'Tropa',
      'Productor',
      'Animales',
      'Peso Vivo (kg)',
      'Peso Frío (kg)',
      'Rinde (%)',
      'Observaciones',
    ];

    const rows = data.map((d) => [
      new Date(d.fecha).toLocaleDateString('es-AR'),
      `T-${d.tropaNumero}`,
      d.productor,
      d.cantidadAnimales,
      d.pesoVivoTotal,
      d.pesoFrioTotal,
      d.rinde.toFixed(2),
      d.observaciones,
    ]);

    // Agregar totales
    const totalAnimales = data.reduce((sum, d) => sum + d.cantidadAnimales, 0);
    const totalPesoVivo = data.reduce((sum, d) => sum + d.pesoVivoTotal, 0);
    const totalPesoFrio = data.reduce((sum, d) => sum + d.pesoFrioTotal, 0);
    const rindePromedio = totalPesoVivo > 0 ? (totalPesoFrio / totalPesoVivo) * 100 : 0;

    rows.push([]);
    rows.push(['', '', 'TOTALES', totalAnimales, totalPesoVivo, totalPesoFrio, rindePromedio.toFixed(2), '']);

    // Crear hoja
    const ws = wb.addWorksheet('Faena');
    ws.addRow(headers);
    rows.forEach(row => ws.addRow(row));

    // Ajustar anchos de columna
    const colWidths = [12, 10, 25, 10, 15, 15, 10, 30];
    colWidths.forEach((w, i) => {
      ws.getColumn(i + 1).width = w;
    });

    // Generar buffer
    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="reporte_faena_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error generando Excel de faena:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar el reporte Excel' },
      { status: 500 }
    );
  }
}
