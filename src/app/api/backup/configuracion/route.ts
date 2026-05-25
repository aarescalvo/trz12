import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener configuración de backup
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    let config = await db.configuracionBackup.findFirst();
    
    if (!config) {
      config = await db.configuracionBackup.create({
        data: {
          backupDiario: true,
          horaBackup: '02:00',
          retenerDias: 30,
          nubeHabilitado: false,
          pointInTime: false,
          activo: true
        }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
  }
}

// PUT - Actualizar configuración
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const body = await request.json();
    
    let config = await db.configuracionBackup.findFirst();
    
    if (!config) {
      config = await db.configuracionBackup.create({
        data: {
          backupDiario: body.backupDiario ?? true,
          horaBackup: body.horaBackup || '02:00',
          retenerDias: body.retenerDias || 30,
          nubeHabilitado: body.nubeHabilitado ?? false,
          proveedorNube: body.proveedorNube,
          credenciales: body.credenciales,
          pointInTime: body.pointInTime ?? false,
          intervaloPIT: body.intervaloPIT,
          activo: body.activo ?? true
        }
      });
    } else {
      config = await db.configuracionBackup.update({
        where: { id: config.id },
        data: {
          backupDiario: body.backupDiario,
          horaBackup: body.horaBackup,
          retenerDias: body.retenerDias,
          nubeHabilitado: body.nubeHabilitado,
          proveedorNube: body.proveedorNube,
          credenciales: body.credenciales,
          pointInTime: body.pointInTime,
          intervaloPIT: body.intervaloPIT,
          activo: body.activo
        }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 });
  }
}
