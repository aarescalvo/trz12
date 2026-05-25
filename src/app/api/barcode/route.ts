import { NextRequest, NextResponse } from 'next/server';
import { generateBarcodePNG, generateBarcodeSVG, validateBarcode } from '@/lib/barcode';
import { checkPermission } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  const { searchParams } = new URL(request.url);
  
  const code = searchParams.get('code');
  const format = searchParams.get('format') || 'png';
  const width = parseInt(searchParams.get('width') || '2');
  const height = parseInt(searchParams.get('height') || '100');
  const displayValue = searchParams.get('displayValue') !== 'false';
  const fontSize = parseInt(searchParams.get('fontSize') || '16');
  
  if (!code) {
    return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
  }
  
  if (!validateBarcode(code)) {
    return NextResponse.json({ error: 'Código inválido para Code 128' }, { status: 400 });
  }
  
  try {
    const options = { width, height, displayValue, fontSize };
    
    if (format === 'svg') {
      const svg = generateBarcodeSVG(code, options);
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } else {
      const png = generateBarcodePNG(code, options);
      return new NextResponse(new Uint8Array(png), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Error generando código de barras', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const body = await request.json();
    const { codes, options = {} } = body;
    
    if (!Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json({ error: 'Se requiere un array de códigos' }, { status: 400 });
    }
    
    const results = codes.map(code => {
      try {
        const valid = validateBarcode(code);
        return {
          code,
          valid,
          dataURL: valid ? `data:image/png;base64,${generateBarcodePNG(code, options).toString('base64')}` : null,
        };
      } catch {
        return { code, valid: false, dataURL: null };
      }
    });
    
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error procesando códigos', details: String(error) },
      { status: 500 }
    );
  }
}
