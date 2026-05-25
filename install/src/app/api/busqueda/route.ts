import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Búsqueda global
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.toLowerCase() || ''
    const tipo = searchParams.get('tipo') || 'tropas'

    if (!q || q.length < 2) {
      return NextResponse.json({ success: true, data: [] })
    }

    const resultados: Array<{
      tipo: string
      id: string
      codigo: string
      descripcion: string
      fecha?: string
      datos: Record<string, unknown>
    }> = []

    // Buscar según el tipo
    switch (tipo) {
      case 'tropas':
        const tropas = await db.tropa.findMany({
          where: {
            OR: [
              { codigo: { contains: q } },
              { codigoSimplificado: { contains: q } },
              { dte: { contains: q } },
              { guia: { contains: q } },
              { productor: { nombre: { contains: q } } },
              { usuarioFaena: { nombre: { contains: q } } }
            ]
          },
          include: {
            productor: true,
            usuarioFaena: true,
            corral: true
          },
          take: 20
        })
        
        tropas.forEach(t => {
          resultados.push({
            tipo: 'tropa',
            id: t.id,
            codigo: t.codigo,
            descripcion: `${t.cantidadCabezas} cabezas - ${t.productor?.nombre || t.usuarioFaena?.nombre || 'Sin productor'}`,
            fecha: t.fechaRecepcion.toISOString(),
            datos: {
              especie: t.especie,
              estado: t.estado,
              corral: t.corral?.nombre,
              dte: t.dte,
              guia: t.guia
            }
          })
        })
        break

      case 'animales':
        const animales = await db.animal.findMany({
          where: {
            OR: [
              { codigo: { contains: q } },
              { caravana: { contains: q } }
            ]
          },
          include: {
            tropa: {
              include: { productor: true }
            }
          },
          take: 20
        })
        
        animales.forEach(a => {
          resultados.push({
            tipo: 'animal',
            id: a.id,
            codigo: a.codigo,
            descripcion: `Animal #${a.numero} - ${a.tipoAnimal} - Tropa: ${a.tropa?.codigo}`,
            fecha: a.createdAt.toISOString(),
            datos: {
              tropa: a.tropa?.codigo,
              tipoAnimal: a.tipoAnimal,
              raza: a.raza,
              pesoVivo: a.pesoVivo,
              estado: a.estado
            }
          })
        })
        break

      case 'romaneos':
        // Buscar por número de garrón
        const garronMatch = q.match(/garron[:\s]*(\d+)/i)
        const garronNum = garronMatch ? parseInt(garronMatch[1]) : null
        
        const romaneos = await db.romaneo.findMany({
          where: {
            OR: [
              { tropaCodigo: { contains: q } },
              garronNum ? { garron: garronNum } : { garron: isNaN(parseInt(q)) ? undefined : parseInt(q) }
            ].filter(Boolean) as Array<{ tropaCodigo: { contains: string } } | { garron: number }>
          },
          include: {
            tipificador: true
          },
          take: 20
        })
        
        romaneos.forEach(r => {
          resultados.push({
            tipo: 'romaneo',
            id: r.id,
            codigo: `Garrón ${r.garron}`,
            descripcion: `Tropa: ${r.tropaCodigo} - ${r.tipoAnimal || 'Sin tipo'} - Peso: ${r.pesoTotal?.toFixed(1) || 0} kg`,
            fecha: r.fecha.toISOString(),
            datos: {
              tropa: r.tropaCodigo,
              garron: r.garron,
              pesoVivo: r.pesoVivo,
              pesoTotal: r.pesoTotal,
              rinde: r.rinde,
              denticion: r.denticion,
              tipificador: r.tipificador?.nombre
            }
          })
        })
        break

      case 'medias':
        const medias = await db.mediaRes.findMany({
          where: {
            OR: [
              { codigo: { contains: q } },
              { romaneo: { tropaCodigo: { contains: q } } }
            ]
          },
          include: {
            romaneo: true,
            camara: true
          },
          take: 20
        })
        
        medias.forEach(m => {
          resultados.push({
            tipo: 'media',
            id: m.id,
            codigo: m.codigo,
            descripcion: `${m.lado} - ${m.peso.toFixed(1)} kg - Tropa: ${m.romaneo?.tropaCodigo || 'N/A'}`,
            fecha: m.createdAt.toISOString(),
            datos: {
              lado: m.lado,
              peso: m.peso,
              sigla: m.sigla,
              estado: m.estado,
              camara: m.camara?.nombre
            }
          })
        })
        break

      case 'expediciones':
        const expediciones = await db.expedicion.findMany({
          where: {
            OR: [
              { numeroRemito: { contains: q } },
              { cliente: { nombre: { contains: q } } }
            ]
          },
          include: {
            cliente: true
          },
          take: 20
        })
        
        expediciones.forEach(e => {
          resultados.push({
            tipo: 'expedicion',
            id: e.id,
            codigo: e.numeroRemito,
            descripcion: `Cliente: ${e.cliente?.nombre || 'N/A'} - Estado: ${e.estado}`,
            fecha: e.fecha.toISOString(),
            datos: {
              cliente: e.cliente?.nombre,
              estado: e.estado,
              destino: e.destino
            }
          })
        })
        break
    }

    return NextResponse.json({
      success: true,
      data: resultados
    })

  } catch (error) {
    console.error('[Búsqueda API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error en la búsqueda' },
      { status: 500 }
    )
  }
}
