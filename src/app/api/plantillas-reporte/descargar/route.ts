import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Descargar plantilla
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }
    
    const plantilla = await db.plantillaReporte.findUnique({
      where: { id }
    })
    
    if (!plantilla) {
      return NextResponse.json(
        { success: false, error: 'Plantilla no encontrada' },
        { status: 404 }
      )
    }
    
    // Decodificar base64
    const buffer = Buffer.from(plantilla.archivoContenido, 'base64')
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${plantilla.archivoNombre}"`
      }
    })
  } catch (error) {
    console.error('Error al descargar plantilla:', error)
    return NextResponse.json(
      { success: false, error: 'Error al descargar plantilla' },
      { status: 500 }
    )
  }
}
