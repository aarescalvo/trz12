import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { EstadoTropa } from '@prisma/client'

// Estados válidos para referencia
const ESTADOS_VALIDOS = Object.values(EstadoTropa)

// API de Tropas - Actualizado para manejar múltiples estados (v2)
// GET - Fetch all tropas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estadoParam = searchParams.get('estado')
    const especie = searchParams.get('especie')
    
    const where: Record<string, unknown> = {}

    // Manejar estados múltiples separados por coma
    if (estadoParam && estadoParam !== 'todos') {
      const estados = estadoParam
        .split(',')
        .map(e => e.trim().toUpperCase())
        .filter(e => ESTADOS_VALIDOS.includes(e as EstadoTropa)) // Solo estados válidos
      
      if (estados.length === 1) {
        where.estado = estados[0]
      } else if (estados.length > 1) {
        where.estado = { in: estados }
      }
      // Si no hay estados válidos, no filtrar por estado
    }
    
    if (especie && especie !== 'todos') {
      where.especie = especie.toUpperCase()
    }
    
    const tropas = await db.tropa.findMany({
      where,
      include: {
        productor: true,
        usuarioFaena: true,
        corral: true,
        tiposAnimales: true,
        animales: {
          orderBy: { numero: 'asc' }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json({
      success: true,
      data: tropas.map(t => ({
        id: t.id,
        numero: t.numero,
        codigo: t.codigo,
        codigoSimplificado: t.codigoSimplificado,
        productor: t.productor,
        usuarioFaena: t.usuarioFaena,
        especie: t.especie,
        cantidadCabezas: t.cantidadCabezas,
        corralId: t.corralId,
        corral: t.corral,
        estado: t.estado,
        fechaRecepcion: t.fechaRecepcion.toISOString(),
        pesoBruto: t.pesoBruto,
        pesoTara: t.pesoTara,
        pesoNeto: t.pesoNeto,
        pesoTotalIndividual: t.pesoTotalIndividual,
        dte: t.dte,
        guia: t.guia,
        observaciones: t.observaciones,
        tiposAnimales: t.tiposAnimales,
        animales: t.animales?.map(a => ({
          id: a.id,
          numero: a.numero,
          codigo: a.codigo,
          tipoAnimal: a.tipoAnimal,
          caravana: a.caravana,
          raza: a.raza,
          pesoVivo: a.pesoVivo,
          estado: a.estado,
          corralId: a.corralId,
          fechaBaja: a.fechaBaja,
          motivoBaja: a.motivoBaja,
          pesoBaja: a.pesoBaja
        }))
      }))
    })
  } catch (error) {
    console.error('Error fetching tropas:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener tropas' },
      { status: 500 }
    )
  }
}

// PUT - Update tropa
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, estado, cantidadCabezas, corralId, pesoBruto, pesoTara, pesoNeto, pesoTotalIndividual, observaciones } = body

    const updateData: Record<string, unknown> = {}
    
    if (estado) updateData.estado = estado
    if (corralId !== undefined) updateData.corralId = corralId || null
    if (cantidadCabezas) updateData.cantidadCabezas = parseInt(cantidadCabezas)
    if (pesoBruto !== undefined) updateData.pesoBruto = parseFloat(pesoBruto) || null
    if (pesoTara !== undefined) updateData.pesoTara = parseFloat(pesoTara) || null
    if (pesoNeto !== undefined) updateData.pesoNeto = parseFloat(pesoNeto) || null
    if (pesoTotalIndividual !== undefined) updateData.pesoTotalIndividual = parseFloat(pesoTotalIndividual) || null
    if (observaciones !== undefined) updateData.observaciones = observaciones

    const tropa = await db.tropa.update({
      where: { id },
      data: updateData,
      include: {
        productor: true,
        usuarioFaena: true,
        corral: true,
        tiposAnimales: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: tropa.id,
        numero: tropa.numero,
        codigo: tropa.codigo,
        productor: tropa.productor,
        usuarioFaena: tropa.usuarioFaena,
        especie: tropa.especie,
        cantidadCabezas: tropa.cantidadCabezas,
        corralId: tropa.corralId,
        corral: tropa.corral,
        estado: tropa.estado,
        tiposAnimales: tropa.tiposAnimales
      }
    })
  } catch (error) {
    console.error('Error updating tropa:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar tropa' },
      { status: 500 }
    )
  }
}
