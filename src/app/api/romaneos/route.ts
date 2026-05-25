import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar todos los romaneos con filtros
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const tropaCodigo = searchParams.get('tropaCodigo')
    const garron = searchParams.get('garron')

    const where: Record<string, unknown> = {}

    // Filtro por fecha
    if (fechaDesde || fechaHasta) {
      const fechaFilter: Record<string, Date> = {}
      if (fechaDesde) {
        fechaFilter.gte = new Date(fechaDesde)
      }
      if (fechaHasta) {
        const hasta = new Date(fechaHasta)
        hasta.setHours(23, 59, 59, 999)
        fechaFilter.lte = hasta
      }
      where.fecha = fechaFilter
    }

    // Filtro por tropa
    if (tropaCodigo) {
      where.tropaCodigo = { contains: tropaCodigo }
    }

    // Filtro por garrón
    if (garron) {
      where.garron = parseInt(garron)
    }

    const romaneos = await db.romaneo.findMany({
      where,
      include: {
        tipificador: true
      },
      orderBy: [
        { fecha: 'desc' },
        { garron: 'asc' }
      ],
      take: 500
    })

    return NextResponse.json({
      success: true,
      data: romaneos
    })

  } catch (error) {
    console.error('[Romaneos API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener romaneos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo romaneo
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError
  try {
    const body = await request.json()
    const {
      garron,
      listaFaenaId,
      tropaCodigo,
      numeroAnimal,
      tipoAnimal,
      raza,
      pesoVivo,
      denticion,
      tipificadorId,
      pesoMediaIzq,
      pesoMediaDer,
      observaciones,
      operadorId
    } = body

    if (!garron) {
      return NextResponse.json(
        { success: false, error: 'El número de garrón es requerido' },
        { status: 400 }
      )
    }

    // Calcular peso total y rinde
    const pesoIzq = pesoMediaIzq ? parseFloat(pesoMediaIzq) : 0
    const pesoDer = pesoMediaDer ? parseFloat(pesoMediaDer) : 0
    const pesoTotal = pesoIzq + pesoDer
    const pesoVivoNum = pesoVivo ? parseFloat(pesoVivo) : 0
    const rinde = pesoVivoNum > 0 ? (pesoTotal / pesoVivoNum) * 100 : null

    const romaneo = await db.romaneo.create({
      data: {
        garron: parseInt(garron),
        listaFaenaId: listaFaenaId || null,
        tropaCodigo: tropaCodigo || null,
        numeroAnimal: numeroAnimal ? parseInt(numeroAnimal) : null,
        tipoAnimal: tipoAnimal || null,
        raza: raza || null,
        pesoVivo: pesoVivoNum || null,
        denticion: denticion || null,
        tipificadorId: tipificadorId || null,
        pesoMediaIzq: pesoIzq || null,
        pesoMediaDer: pesoDer || null,
        pesoTotal: pesoTotal || null,
        rinde: rinde,
        observaciones: observaciones || null,
        operadorId: operadorId || null,
        estado: 'PENDIENTE'
      },
      include: {
        tipificador: true
      }
    })

    // Crear medias reses si hay pesos
    if (pesoIzq > 0 || pesoDer > 0) {
      // Generar códigos de barras
      const fechaStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      
      if (pesoIzq > 0) {
        await db.mediaRes.create({
          data: {
            romaneoId: romaneo.id,
            lado: 'IZQUIERDA',
            peso: pesoIzq,
            sigla: 'A',
            codigo: `${fechaStr}-${garron}-I`,
            estado: 'EN_CAMARA'
          }
        })
      }
      
      if (pesoDer > 0) {
        await db.mediaRes.create({
          data: {
            romaneoId: romaneo.id,
            lado: 'DERECHA',
            peso: pesoDer,
            sigla: 'A',
            codigo: `${fechaStr}-${garron}-D`,
            estado: 'EN_CAMARA'
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: romaneo,
      message: 'Romaneo creado correctamente'
    })

  } catch (error) {
    console.error('[Romaneos API] Error al crear:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear romaneo' },
      { status: 500 }
    )
  }
}
