import { NextRequest, NextResponse } from 'next/server';
import { puenteWeb } from '@/lib/puente-web';
import { checkAdminRole } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  // Verificar que sea administrador
  const adminError = await checkAdminRole(request)
  if (adminError) return adminError

  try {
    const body = await request.json().catch(() => ({}));
    const { servicio } = body; // 'afip', 'sigica', or undefined for both

    let resultado;
    
    if (servicio === 'afip') {
      resultado = { afip: await puenteWeb.sincronizarAFIP() };
    } else if (servicio === 'sigica') {
      resultado = { sigica: await puenteWeb.sincronizarSIGICA() };
    } else {
      resultado = await puenteWeb.sincronizarTodo();
    }

    return NextResponse.json({
      exito: true,
      resultado,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error en sincronización', details: String(error) },
      { status: 500 }
    );
  }
}
