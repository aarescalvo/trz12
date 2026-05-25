import { NextRequest, NextResponse } from 'next/server'
import { generarRomaneoPDF, getDatosRomaneoPorTropa } from '@/lib/pdf/romaneo-tropa'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Genera PDF de Romaneo para una tropa específica
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const tropaCodigo = searchParams.get('tropaCodigo')
    const formato = searchParams.get('formato') || 'pdf' // pdf o json

    if (!tropaCodigo) {
      return NextResponse.json(
        { success: false, error: 'Parámetro tropaCodigo requerido' },
        { status: 400 }
      )
    }

    // Si formato es json, devolver solo los datos (para debugging)
    if (formato === 'json') {
      const datos = await getDatosRomaneoPorTropa(tropaCodigo)
      
      if (!datos) {
        return NextResponse.json(
          { success: false, error: 'Tropa no encontrada o sin datos de romaneo' },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true, data: datos })
    }

    // Generar PDF
    const pdfBuffer = await generarRomaneoPDF(tropaCodigo)

    if (!pdfBuffer) {
      return NextResponse.json(
        { success: false, error: 'Tropa no encontrada o sin datos de romaneo' },
        { status: 404 }
      )
    }

    // Devolver el PDF como respuesta
    return new NextResponse(pdfBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="romaneo-${tropaCodigo.replace(/\s+/g, '-')}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Error generando PDF de romaneo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar el PDF' },
      { status: 500 }
    )
  }
}
