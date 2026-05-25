import { NextResponse, NextRequest } from 'next/server';
import { puenteWeb } from '@/lib/puente-web';
import { checkPermission } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const estado = await puenteWeb.getEstado();
    const conexion = await puenteWeb.probarConexion();
    
    return NextResponse.json({
      estado,
      conexion,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error obteniendo estado del puente web', details: String(error) },
      { status: 500 }
    );
  }
}
