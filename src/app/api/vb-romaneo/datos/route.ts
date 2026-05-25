import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener datos para VB Romaneo
// ?listaFaenaId=xxx - Datos de una lista específica
// ?fecha=2024-01-15 - Buscar listas por fecha
// ?historico=true - Últimas 10 listas de faena
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeRomaneo')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const listaFaenaId = searchParams.get('listaFaenaId')
    const fecha = searchParams.get('fecha')
    const historico = searchParams.get('historico') === 'true'

    // ========== HISTÓRICO: Últimas 10 listas de faena ==========
    if (historico) {
      const listas = await db.listaFaena.findMany({
        include: {
          supervisor: { select: { id: true, nombre: true } },
          tropas: {
            include: {
              tropa: {
                include: {
                  usuarioFaena: { select: { nombre: true } },
                  tiposAnimales: true
                }
              }
            }
          },
          asignaciones: {
            select: {
              id: true,
              garron: true,
              animalId: true,
              tieneMediaDer: true,
              tieneMediaIzq: true,
              completado: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })

      // Calcular estado de VB para cada lista
      const listasConEstado = await Promise.all(listas.map(async (lista) => {
        const totalGarrones = lista.asignaciones.length
        const garronesCompletos = lista.asignaciones.filter(a => a.completado).length
        const garronesSinAsignar = lista.asignaciones.filter(a => !a.animalId).length
        
        // Contar romaneos pendientes
        const romaneosPendientes = await db.romaneo.count({
          where: {
            garron: { in: lista.asignaciones.map(a => a.garron) },
            estado: 'PENDIENTE'
          }
        })

        return {
          id: lista.id,
          numero: lista.numero,
          fecha: lista.fecha,
          estado: lista.estado,
          supervisor: lista.supervisor,
          tropas: lista.tropas,
          resumen: {
            totalGarrones,
            garronesCompletos,
            garronesSinAsignar,
            romaneosPendientes
          }
        }
      }))

      return NextResponse.json({
        success: true,
        data: listasConEstado
      })
    }

    // ========== LISTA ESPECÍFICA ==========
    if (listaFaenaId) {
      const lista = await db.listaFaena.findUnique({
        where: { id: listaFaenaId },
        include: {
          supervisor: { select: { id: true, nombre: true } },
          tropas: {
            include: {
              tropa: {
                include: {
                  usuarioFaena: { select: { nombre: true } },
                  tiposAnimales: true,
                  animales: {
                    where: { estado: { in: ['PESADO', 'RECIBIDO', 'EN_FAENA', 'FAENADO'] } },
                    include: {
                      pesajeIndividual: true,
                      asignacionGarron: true
                    }
                  }
                }
              },
              corral: true
            }
          },
          asignaciones: {
            include: {
              animal: {
                include: {
                  tropa: true,
                  pesajeIndividual: true
                }
              }
            },
            orderBy: { garron: 'asc' }
          }
        }
      })

      if (!lista) {
        return NextResponse.json(
          { success: false, error: 'Lista de faena no encontrada' },
          { status: 404 }
        )
      }

      // 1. Garrones sin animal asignado (pero pueden tener medias pesadas)
      const garronesSinAsignar = lista.asignaciones
        .filter(a => !a.animalId)
        .map(a => ({
          garron: a.garron,
          listaFaenaId: a.listaFaenaId,
          tieneMediaDer: a.tieneMediaDer,
          tieneMediaIzq: a.tieneMediaIzq,
          pesoMediaIzq: null as number | null,
          pesoMediaDer: null as number | null,
          pesoTotal: null as number | null
        }))

      // Obtener romaneos para garrones sin asignar
      for (const g of garronesSinAsignar) {
        const romaneo = await db.romaneo.findFirst({
          where: { garron: g.garron },
          select: {
            id: true,
            pesoMediaIzq: true,
            pesoMediaDer: true,
            pesoTotal: true,
            estado: true
          }
        })
        if (romaneo) {
          g.pesoMediaIzq = romaneo.pesoMediaIzq
          g.pesoMediaDer = romaneo.pesoMediaDer
          g.pesoTotal = romaneo.pesoTotal
        }
      }

      // 2. Animales de las tropas de la lista que NO tienen garrón asignado
      const animalesSinGarron: Array<{
        id: string
        codigo: string
        numero: number
        tropaCodigo: string
        tipoAnimal: string
        raza: string | null
        caravana: string | null
        pesoVivo: number | null
      }> = []

      for (const lt of lista.tropas) {
        const tropa = lt.tropa
        for (const animal of tropa.animales) {
          // Si no tiene asignación de garrón
          if (!animal.asignacionGarron) {
            animalesSinGarron.push({
              id: animal.id,
              codigo: animal.codigo,
              numero: animal.numero,
              tropaCodigo: tropa.codigo,
              tipoAnimal: animal.tipoAnimal,
              raza: animal.raza,
              caravana: animal.caravana,
              pesoVivo: animal.pesoVivo || animal.pesajeIndividual?.peso || null
            })
          }
        }
      }

      // 3. Todos los garrones con sus datos completos (para pestaña de intercambio)
      const garronesConAsignacion = lista.asignaciones
        .filter(a => a.animalId)
        .map(a => ({
          garron: a.garron,
          animalId: a.animalId,
          animalCodigo: a.animal?.codigo || null,
          animalNumero: a.animalNumero,
          tropaCodigo: a.tropaCodigo || a.animal?.tropa?.codigo || null,
          tipoAnimal: a.tipoAnimal || a.animal?.tipoAnimal || null,
          pesoVivo: a.pesoVivo || a.animal?.pesoVivo || a.animal?.pesajeIndividual?.peso || null,
          caravana: a.animal?.caravana || null,
          raza: a.animal?.raza || null,
          tieneMediaDer: a.tieneMediaDer,
          tieneMediaIzq: a.tieneMediaIzq,
          completado: a.completado
        }))

      // Obtener romaneos para cada garrón
      const garronesConRomaneo = await Promise.all(
        garronesConAsignacion.map(async (g) => {
          const romaneo = await db.romaneo.findFirst({
            where: { garron: g.garron },
            select: {
              id: true,
              pesoMediaIzq: true,
              pesoMediaDer: true,
              pesoTotal: true,
              rinde: true,
              estado: true
            }
          })
          return {
            ...g,
            romaneo,
            alertaRinde: romaneo?.rinde && romaneo.rinde > 70 ? true : false
          }
        })
      )

      return NextResponse.json({
        success: true,
        data: {
          lista: {
            id: lista.id,
            numero: lista.numero,
            fecha: lista.fecha,
            estado: lista.estado,
            supervisor: lista.supervisor,
            tropas: lista.tropas.map(lt => ({
              id: lt.tropa.id,
              codigo: lt.tropa.codigo,
              cantidadCabezas: lt.tropa.cantidadCabezas,
              usuarioFaena: lt.tropa.usuarioFaena
            }))
          },
          garronesSinAsignar,
          animalesSinGarron,
          garronesCompletos: garronesConRomaneo
        }
      })
    }

    // ========== BUSCAR POR FECHA ==========
    if (fecha) {
      const fechaInicio = new Date(fecha)
      fechaInicio.setHours(0, 0, 0, 0)
      const fechaFin = new Date(fecha)
      fechaFin.setHours(23, 59, 59, 999)

      const listas = await db.listaFaena.findMany({
        where: {
          fecha: {
            gte: fechaInicio,
            lte: fechaFin
          }
        },
        include: {
          tropas: {
            include: {
              tropa: {
                include: {
                  usuarioFaena: { select: { nombre: true } }
                }
              }
            }
          },
          asignaciones: {
            select: {
              garron: true,
              animalId: true,
              completado: true
            }
          }
        },
        orderBy: { numero: 'asc' }
      })

      return NextResponse.json({
        success: true,
        data: listas.map(l => ({
          id: l.id,
          numero: l.numero,
          fecha: l.fecha,
          estado: l.estado,
          tropas: l.tropas.map(lt => ({
            codigo: lt.tropa.codigo,
            usuarioFaena: lt.tropa.usuarioFaena
          })),
          resumen: {
            totalGarrones: l.asignaciones.length,
            garronesCompletos: l.asignaciones.filter(a => a.completado).length,
            garronesSinAsignar: l.asignaciones.filter(a => !a.animalId).length
          }
        }))
      })
    }

    return NextResponse.json(
      { success: false, error: 'Parámetros insuficientes' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error en VB Romaneo API:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener datos' },
      { status: 500 }
    )
  }
}
