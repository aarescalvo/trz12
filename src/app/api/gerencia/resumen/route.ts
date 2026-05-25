import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EstadoDespacho } from '@prisma/client';
import { checkPermission } from '@/lib/auth-helpers'

// GET - Resumen para gerencia (mobile PWA)
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const hace7Dias = new Date(hoy);
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    
    const hace30Dias = new Date(hoy);
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    // Faena del día
    const faenaHoy = await db.listaFaena.findFirst({
      where: { fecha: { gte: hoy } }
    });

    // Stock en cámaras
    const stockCamaras = await db.stockMediaRes.findMany({
      include: { camara: true }
    });

    const totalStock = stockCamaras.reduce((sum, s) => sum + s.cantidad, 0);
    const totalKgStock = stockCamaras.reduce((sum, s) => sum + s.pesoTotal, 0);

    // Facturas pendientes de cobro
    const facturasPendientes = await db.factura.count({
      where: { estado: 'EMITIDA' } // Emitida pero no pagada
    });

    // Despachos pendientes (PENDIENTE, EN_PREPARACION, LISTO)
    const despachosPendientes = await db.despacho.count({
      where: {
        estado: { in: [EstadoDespacho.PENDIENTE, EstadoDespacho.EN_CARGA, EstadoDespacho.DESPACHADO] }
      }
    });

    // Romaneos de hoy
    const romaneosHoy = await db.romaneo.findMany({
      where: { fecha: { gte: hoy } }
    });

    const kgProducidosHoy = romaneosHoy.reduce((sum, r) => sum + (r.pesoTotal || 0), 0);

    // Faena últimos 7 días
    const faenaSemana = await db.listaFaena.findMany({
      where: { fecha: { gte: hace7Dias } }
    });

    const totalAnimalesSemana = faenaSemana.reduce((sum, f) => sum + f.cantidadTotal, 0);

    // Rendimiento promedio
    const romaneosSemana = await db.romaneo.findMany({
      where: {
        fecha: { gte: hace7Dias },
        rinde: { not: null }
      }
    });

    const rindePromedio = romaneosSemana.length > 0
      ? romaneosSemana.reduce((sum, r) => sum + (r.rinde || 0), 0) / romaneosSemana.length
      : 0;

    // ===== GENERAR ALERTAS =====
    const alertas: Array<{
      tipo: string;
      mensaje: string;
      severidad: 'alta' | 'media' | 'baja';
    }> = [];

    // Alerta: Stock bajo en cámaras
    const camarasConStockBajo = await db.camara.findMany({
      where: {
        activo: true,
        stockMedias: {
          some: {
            cantidad: { lt: 10 } // Menos de 10 medias
          }
        }
      },
      include: {
        stockMedias: true
      }
    });

    for (const camara of camarasConStockBajo) {
      const totalEnCamara = camara.stockMedias.reduce((sum, s) => sum + s.cantidad, 0);
      if (totalEnCamara < 10) {
        alertas.push({
          tipo: 'Stock Bajo',
          mensaje: `Cámara ${camara.nombre}: ${totalEnCamara} medias`,
          severidad: 'media'
        });
      }
    }

    // Alerta: PTR vencidos o por vencer
    const ptrVencidos = await db.despacho.findMany({
      where: {
        estado: { in: [EstadoDespacho.PENDIENTE, EstadoDespacho.EN_CARGA, EstadoDespacho.DESPACHADO] },
      } satisfies Record<string, unknown>
    });

    if (ptrVencidos.length > 0) {
      alertas.push({
        tipo: 'PTR Vencido',
        mensaje: `${ptrVencidos.length} despacho(s) con permiso vencido`,
        severidad: 'alta'
      });
    }

    // Alerta: PTR por vencer (próximos 3 días)
    const en3Dias = new Date(hoy);
    en3Dias.setDate(en3Dias.getDate() + 3);

    const ptrPorVencer = await db.despacho.count({
      where: {
        estado: { in: [EstadoDespacho.PENDIENTE, EstadoDespacho.EN_CARGA, EstadoDespacho.DESPACHADO] },
      } satisfies Record<string, unknown>
    });

    if (ptrPorVencer > 0) {
      alertas.push({
        tipo: 'PTR por Vencer',
        mensaje: `${ptrPorVencer} despacho(s) con permiso próximo a vencer`,
        severidad: 'media'
      });
    }

    // Alerta: Facturas vencidas (más de 30 días)
    const facturasVencidas = await db.factura.count({
      where: {
        estado: 'EMITIDA',
        fecha: { lt: hace30Dias }
      }
    });

    if (facturasVencidas > 0) {
      alertas.push({
        tipo: 'Facturas Vencidas',
        mensaje: `${facturasVencidas} factura(s) pendientes hace más de 30 días`,
        severidad: 'alta'
      });
    }

    // Alerta: Tropas pendientes de procesar
    const tropasPendientes = await db.tropa.count({
      where: {
        estado: { in: ['RECIBIDO', 'EN_CORRAL', 'EN_PESAJE'] }
      }
    });

    if (tropasPendientes > 5) {
      alertas.push({
        tipo: 'Tropas Pendientes',
        mensaje: `${tropasPendientes} tropas esperando procesamiento`,
        severidad: 'baja'
      });
    }

    // Alerta: Corrales con alta ocupación
    const corrales = await db.corral.findMany({
      where: { activo: true }
    });

    for (const corral of corrales) {
      const ocupacionTotal = corral.stockBovinos + corral.stockEquinos;
      const porcentajeOcupacion = (ocupacionTotal / corral.capacidad) * 100;
      
      if (porcentajeOcupacion >= 90) {
        alertas.push({
          tipo: 'Corral Lleno',
          mensaje: `${corral.nombre}: ${porcentajeOcupacion.toFixed(0)}% ocupado`,
          severidad: 'alta'
        });
      }
    }

    return NextResponse.json({
      kpis: {
        faenaHoy: faenaHoy?.cantidadTotal || 0,
        kgProducidosHoy,
        totalStockMedias: totalStock,
        totalStockKg: totalKgStock,
        facturasPendientes,
        despachosPendientes,
        totalAnimalesSemana,
        rindePromedio: Math.round(rindePromedio * 100) / 100
      },
      faenaHoy: faenaHoy ? {
        id: faenaHoy.id,
        cantidad: faenaHoy.cantidadTotal,
        estado: faenaHoy.estado
      } : null,
      stock: stockCamaras.map(s => ({
        camara: s.camara?.nombre,
        cantidad: s.cantidad,
        pesoTotal: s.pesoTotal,
        especie: s.especie
      })),
      alertas,
      fecha: hoy.toISOString()
    });
  } catch (error) {
    console.error('Error al obtener resumen gerencia:', error);
    return NextResponse.json({ error: 'Error al obtener resumen' }, { status: 500 });
  }
}
