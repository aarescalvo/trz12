import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener el próximo código libre
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeStock')
  if (authError) return authError

  try {
    // Obtener todos los códigos existentes
    const productos = await db.producto.findMany({
      select: { codigo: true },
      orderBy: { codigo: 'asc' }
    });

    // Extraer los códigos numéricos
    const codigosExistentes = new Set(
      productos
        .map(p => parseInt(p.codigo))
        .filter(c => !isNaN(c))
    );

    // Encontrar el primer código libre (empezando desde 1)
    let proximoCodigo = 1;
    while (codigosExistentes.has(proximoCodigo)) {
      proximoCodigo++;
    }

    // Formatear con 3 dígitos
    const codigoFormateado = proximoCodigo.toString().padStart(3, '0');

    return NextResponse.json({ 
      codigo: codigoFormateado,
      numero: proximoCodigo
    });
  } catch (error) {
    console.error('Error al obtener próximo código:', error);
    return NextResponse.json(
      { error: 'Error al obtener próximo código' },
      { status: 500 }
    );
  }
}
