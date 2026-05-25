import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener romaneos/garrones por fecha
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')
    
    if (!fecha) {
      return NextResponse.json({ 
        success: false, 
        error: 'Fecha requerida' 
      }, { status: 400 })
    }

    // Parsear la fecha
    const fechaFiltro = new Date(fecha)
    fechaFiltro.setHours(0, 0, 0, 0)
    const fechaFin = new Date(fechaFiltro)
    fechaFin.setHours(23, 59, 59, 999)

    // Buscar romaneos de esa fecha
    const romaneos = await db.romaneo.findMany({
      where: {
        fecha: {
          gte: fechaFiltro,
          lte: fechaFin
        }
      },
      orderBy: { garron: 'asc' }
    })

    // Convertir a formato de medias pesadas
    const medias: Array<{
      id: string
      garron: number
      lado: string
      peso: number
      siglas: string[]
      fecha: Date
      tropaCodigo: string | null
      tipoAnimal: string | null
      decomisada?: boolean
      kgDecomiso?: number
      kgRestantes?: number
    }> = []

    for (const r of romaneos) {
      // Agregar media derecha si existe
      if (r.pesoMediaDer && r.pesoMediaDer > 0) {
        medias.push({
          id: `${r.id}-DER`,
          garron: r.garron,
          lado: 'DERECHA',
          peso: r.pesoMediaDer,
          siglas: ['A', 'T', 'D'],
          fecha: r.fecha,
          tropaCodigo: r.tropaCodigo,
          tipoAnimal: r.tipoAnimal,
          decomisada: false,
          kgDecomiso: undefined,
          kgRestantes: undefined
        })
      }
      
      // Agregar media izquierda si existe
      if (r.pesoMediaIzq && r.pesoMediaIzq > 0) {
        medias.push({
          id: `${r.id}-IZQ`,
          garron: r.garron,
          lado: 'IZQUIERDA',
          peso: r.pesoMediaIzq,
          siglas: ['A', 'T', 'D'],
          fecha: r.fecha,
          tropaCodigo: r.tropaCodigo,
          tipoAnimal: r.tipoAnimal,
          decomisada: false,
          kgDecomiso: undefined,
          kgRestantes: undefined
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: medias
    })
  } catch (error) {
    console.error('[API Romaneo Por Fecha] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error al cargar romaneos' 
    }, { status: 500 })
  }
}
