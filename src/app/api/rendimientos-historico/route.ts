import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Especie, TipoAnimal, Prisma } from '@prisma/client'

// GET - Fetch all rendimientos históricos
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const anio = searchParams.get('anio')
    const mes = searchParams.get('mes')
    const especie = searchParams.get('especie')
    const tipoAnimal = searchParams.get('tipoAnimal')

    const where: Record<string, unknown> = {}

    if (anio) {
      where.anio = parseInt(anio)
    }

    if (mes) {
      where.mes = parseInt(mes)
    }

    if (especie && especie !== 'todos') {
      where.especie = especie.toUpperCase() as Especie
    }

    if (tipoAnimal && tipoAnimal !== 'todos') {
      where.tipoAnimal = tipoAnimal.toUpperCase() as TipoAnimal
    }

    const rendimientos = await db.rendimientoHistorico.findMany({
      where,
      orderBy: [
        { anio: 'desc' },
        { mes: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: rendimientos.map(r => ({
        id: r.id,
        anio: r.anio,
        mes: r.mes,
        especie: r.especie,
        tipoAnimal: r.tipoAnimal,
        cantidadAnimales: r.cantidadAnimales,
        pesoVivoPromedio: r.pesoVivoPromedio,
        pesoFrioPromedio: r.pesoFrioPromedio,
        rindePromedio: r.rindePromedio,
        rindeMinimo: r.rindeMinimo,
        rindeMaximo: r.rindeMaximo,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))
    })
  } catch (error) {
    console.error('Error fetching rendimientos históricos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener rendimientos históricos' },
      { status: 500 }
    )
  }
}

// POST - Create new rendimiento histórico
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      anio,
      mes,
      especie,
      tipoAnimal,
      cantidadAnimales,
      pesoVivoPromedio,
      pesoFrioPromedio,
      rindePromedio,
      rindeMinimo,
      rindeMaximo
    } = body

    // Validar campos requeridos
    if (!anio || !mes || !especie || !tipoAnimal) {
      return NextResponse.json(
        { success: false, error: 'Año, mes, especie y tipo animal son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un registro con la misma combinación única
    const existente = await db.rendimientoHistorico.findUnique({
      where: {
        anio_mes_especie_tipo: {
          anio: parseInt(anio),
          mes: parseInt(mes),
          especie: especie as Especie,
          tipoAnimal: tipoAnimal as TipoAnimal
        }
      } as unknown as Prisma.RendimientoHistoricoWhereUniqueInput
    })

    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un registro para esta combinación de año, mes, especie y tipo animal' },
        { status: 400 }
      )
    }

    const rendimiento = await db.rendimientoHistorico.create({
      data: {
        anio: parseInt(anio),
        mes: parseInt(mes),
        especie: especie as Especie,
        tipoAnimal: tipoAnimal as TipoAnimal,
        cantidadAnimales: parseInt(cantidadAnimales) || 0,
        pesoVivoPromedio: pesoVivoPromedio ? parseFloat(pesoVivoPromedio) : null,
        pesoFrioPromedio: pesoFrioPromedio ? parseFloat(pesoFrioPromedio) : null,
        rindePromedio: rindePromedio ? parseFloat(rindePromedio) : null,
        rindeMinimo: rindeMinimo ? parseFloat(rindeMinimo) : null,
        rindeMaximo: rindeMaximo ? parseFloat(rindeMaximo) : null,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: rendimiento.id,
        anio: rendimiento.anio,
        mes: rendimiento.mes,
        especie: rendimiento.especie,
        tipoAnimal: rendimiento.tipoAnimal,
        cantidadAnimales: rendimiento.cantidadAnimales,
        pesoVivoPromedio: rendimiento.pesoVivoPromedio,
        pesoFrioPromedio: rendimiento.pesoFrioPromedio,
        rindePromedio: rendimiento.rindePromedio,
        rindeMinimo: rendimiento.rindeMinimo,
        rindeMaximo: rendimiento.rindeMaximo,
        createdAt: rendimiento.createdAt.toISOString(),
        updatedAt: rendimiento.updatedAt.toISOString(),
      }
    })
  } catch (error) {
    console.error('Error creating rendimiento histórico:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear rendimiento histórico' },
      { status: 500 }
    )
  }
}

// PUT - Update rendimiento histórico
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      id,
      anio,
      mes,
      especie,
      tipoAnimal,
      cantidadAnimales,
      pesoVivoPromedio,
      pesoFrioPromedio,
      rindePromedio,
      rindeMinimo,
      rindeMaximo
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (anio !== undefined) updateData.anio = parseInt(anio)
    if (mes !== undefined) updateData.mes = parseInt(mes)
    if (especie) updateData.especie = especie as Especie
    if (tipoAnimal) updateData.tipoAnimal = tipoAnimal as TipoAnimal
    if (cantidadAnimales !== undefined) updateData.cantidadAnimales = parseInt(cantidadAnimales) || 0
    if (pesoVivoPromedio !== undefined) updateData.pesoVivoPromedio = pesoVivoPromedio ? parseFloat(pesoVivoPromedio) : null
    if (pesoFrioPromedio !== undefined) updateData.pesoFrioPromedio = pesoFrioPromedio ? parseFloat(pesoFrioPromedio) : null
    if (rindePromedio !== undefined) updateData.rindePromedio = rindePromedio ? parseFloat(rindePromedio) : null
    if (rindeMinimo !== undefined) updateData.rindeMinimo = rindeMinimo ? parseFloat(rindeMinimo) : null
    if (rindeMaximo !== undefined) updateData.rindeMaximo = rindeMaximo ? parseFloat(rindeMaximo) : null

    // Si se actualizan campos de la clave única, verificar que no exista conflicto
    if (anio || mes || especie || tipoAnimal) {
      const actual = await db.rendimientoHistorico.findUnique({
        where: { id }
      })

      if (actual) {
        const nuevoAnio = anio !== undefined ? parseInt(anio) : actual.anio
        const nuevoMes = mes !== undefined ? parseInt(mes) : actual.mes
        const nuevaEspecie = especie ? (especie as Especie) : actual.especie
        const nuevoTipoAnimal = tipoAnimal ? (tipoAnimal as TipoAnimal) : actual.tipoAnimal

        const existente = await db.rendimientoHistorico.findUnique({
          where: {
            anio_mes_especie_tipo: {
              anio: nuevoAnio,
              mes: nuevoMes,
              especie: nuevaEspecie,
              tipoAnimal: nuevoTipoAnimal
            }
          } as unknown as Prisma.RendimientoHistoricoWhereUniqueInput
        })

        if (existente && existente.id !== id) {
          return NextResponse.json(
            { success: false, error: 'Ya existe un registro para esta combinación de año, mes, especie y tipo animal' },
            { status: 400 }
          )
        }
      }
    }

    const rendimiento = await db.rendimientoHistorico.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: {
        id: rendimiento.id,
        anio: rendimiento.anio,
        mes: rendimiento.mes,
        especie: rendimiento.especie,
        tipoAnimal: rendimiento.tipoAnimal,
        cantidadAnimales: rendimiento.cantidadAnimales,
        pesoVivoPromedio: rendimiento.pesoVivoPromedio,
        pesoFrioPromedio: rendimiento.pesoFrioPromedio,
        rindePromedio: rendimiento.rindePromedio,
        rindeMinimo: rendimiento.rindeMinimo,
        rindeMaximo: rendimiento.rindeMaximo,
        createdAt: rendimiento.createdAt.toISOString(),
        updatedAt: rendimiento.updatedAt.toISOString(),
      }
    })
  } catch (error) {
    console.error('Error updating rendimiento histórico:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar rendimiento histórico' },
      { status: 500 }
    )
  }
}

// DELETE - Delete rendimiento histórico
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    await db.rendimientoHistorico.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Rendimiento histórico eliminado correctamente'
    })
  } catch (error) {
    console.error('Error deleting rendimiento histórico:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar rendimiento histórico' },
      { status: 500 }
    )
  }
}
