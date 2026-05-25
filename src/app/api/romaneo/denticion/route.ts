import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener dentición de un garrón
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const garron = searchParams.get('garron')

    if (!garron) {
      return NextResponse.json(
        { success: false, error: 'Número de garrón requerido' },
        { status: 400 }
      )
    }

    // Buscar el romaneo del garrón para obtener la dentición
    const romaneo = await db.romaneo.findFirst({
      where: {
        garron: parseInt(garron)
      },
      select: {
        denticion: true
      }
    })

    if (romaneo && romaneo.denticion) {
      return NextResponse.json({
        success: true,
        denticion: romaneo.denticion
      })
    }

    return NextResponse.json({
      success: false,
      denticion: null
    })

  } catch (error) {
    console.error('Error obteniendo dentición:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener dentición' },
      { status: 500 }
    )
  }
}
