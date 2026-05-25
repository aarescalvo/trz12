import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener tropas en faena con sus garrones pendientes
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const tropaId = searchParams.get('tropaId')

    if (tropaId) {
      // Obtener detalle de una tropa específica con todos sus garrones
      const tropa = await db.tropa.findUnique({
        where: { id: tropaId },
        include: {
          usuarioFaena: true,
          animales: {
            include: {
              asignacionGarron: {
                include: {
                  listaFaena: true
                }
              },
              pesajeIndividual: true
            },
            orderBy: { numero: 'asc' }
          }
        }
      })

      if (!tropa) {
        return NextResponse.json({ success: false, error: 'Tropa no encontrada' }, { status: 404 })
      }

      // Obtener romaneos de esta tropa
      const romaneos = await db.romaneo.findMany({
        where: { tropaCodigo: tropa.codigo },
        include: { tipificador: true },
        orderBy: { garron: 'asc' }
      })

      // Construir lista de garrones con estado
      const garrones = tropa.animales.map(animal => {
        const asignacion = animal.asignacionGarron
        const romaneo = romaneos.find(r => r.garron === asignacion?.garron)
        
        return {
          garron: asignacion?.garron || 0,
          animalId: animal.id,
          numeroAnimal: animal.numero,
          tipoAnimal: animal.tipoAnimal,
          raza: animal.raza,
          caravana: animal.caravana,
          pesoVivo: animal.pesoVivo || animal.pesajeIndividual?.peso,
          // Estado del pesaje
          pesoMediaDer: romaneo?.pesoMediaDer,
          pesoMediaIzq: romaneo?.pesoMediaIzq,
          pesoTotal: romaneo?.pesoTotal,
          rinde: romaneo?.rinde,
          denticion: romaneo?.denticion,
          tipificador: romaneo?.tipificador,
          estado: getEstadoPesaje(romaneo),
          romaneoId: romaneo?.id,
          observaciones: romaneo?.observaciones
        }
      }).filter(g => g.garron > 0).sort((a, b) => a.garron - b.garron)

      return NextResponse.json({
        success: true,
        data: {
          tropa: {
            id: tropa.id,
            numero: tropa.numero,
            codigo: tropa.codigo,
            cantidadCabezas: tropa.cantidadCabezas,
            usuarioFaena: tropa.usuarioFaena,
            kgGancho: tropa.kgGancho,
            fechaFaena: tropa.fechaFaena
          },
          garrones,
          resumen: {
            total: garrones.length,
            pesadosDer: garrones.filter(g => g.pesoMediaDer !== null).length,
            pesadosIzq: garrones.filter(g => g.pesoMediaIzq !== null).length,
            completos: garrones.filter(g => g.pesoTotal !== null).length,
            kgTotalDer: garrones.reduce((sum, g) => sum + (g.pesoMediaDer || 0), 0),
            kgTotalIzq: garrones.reduce((sum, g) => sum + (g.pesoMediaIzq || 0), 0),
          }
        }
      })
    }

    // Listar todas las tropas en faena
    const tropas = await db.tropa.findMany({
      where: {
        estado: 'EN_FAENA'
      },
      include: {
        usuarioFaena: true
      },
      orderBy: { fechaRecepcion: 'desc' }
    })

    return NextResponse.json({ success: true, data: tropas })
  } catch (error) {
    console.error('Error en romaneo/tropa GET:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}

function getEstadoPesaje(romaneo: any): string {
  if (!romaneo) return 'PENDIENTE'
  if (romaneo.observaciones?.includes('DECOMISO')) return 'DECOMISO'
  if (romaneo.pesoMediaDer !== null && romaneo.pesoMediaIzq !== null) return 'COMPLETO'
  if (romaneo.pesoMediaDer !== null) return 'SOLO_DER'
  if (romaneo.pesoMediaIzq !== null) return 'SOLO_IZQ'
  return 'PENDIENTE'
}
