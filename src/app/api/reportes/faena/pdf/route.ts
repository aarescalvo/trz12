import { NextRequest, NextResponse } from 'next/server';
import { PDFExporter } from '@/lib/export-pdf';
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

    // Transformar datos para el reporte
    const data = balances.map((b) => ({
      fecha: b.fecha,
      tropaNumero: b.tropa?.numero || 0,
      productor: b.tropa?.productor?.nombre || 'Sin productor',
      cantidadAnimales: 0, // Se puede agregar si está disponible
      pesoVivoTotal: b.pesoVivoTotal,
      pesoFrioTotal: b.pesoFrioTotal,
      rinde: b.rindePromedio || 0,
      observaciones: b.observaciones || undefined,
    }));

    // Generar PDF
    const doc = PDFExporter.generateFaenaReport(data);

    // Retornar como blob
    const pdfBuffer = doc.output('arraybuffer');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte_faena_${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generando PDF de faena:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar el reporte PDF' },
      { status: 500 }
    );
  }
}
