import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch dashboard stats - SIMPLIFIED VERSION
export async function GET() {
  try {
    console.log('[Dashboard API] Fetching simple stats...')
    
    // Solo traer datos que existen
    const tropas = await db.tropa.count()
    const pesajes = await db.pesajeCamion.count()
    
    return NextResponse.json({
      success: true,
      data: {
        tropasActivas: tropas,
        enPesaje: 0,
        pesajesHoy: pesajes,
        enCamara: 0,
        kgRomaneoHoy: 0,
        ultimasTropas: []
      }
    })
  } catch (error) {
    console.error('[Dashboard API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
