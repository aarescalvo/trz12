import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface AnimalIngreso {
  id: string
  codigo: string
  garron: number
  tipoAnimal: string
  pesoVivo: number | null
  estado: string
  tieneRomaneo: boolean
  enCamara: boolean
  romaneoData: {
    id: string
    pesoMediaIzq: number | null
    pesoMediaDer: number | null
    pesoTotal: number | null
    rinde: number | null
    denticion: string | null
    raza: string | null
  } | null
}

interface TropaIngreso {
  tropaId: string
  tropaCodigo: string
  especie: string
  usuarioFaena: string
  animales: AnimalIngreso[]
}

// GET - Fetch tropas with animals ready for camera ingress
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') // 'pendientes' | 'historial'

    if (tipo === 'historial') {
      // Get history of camera ingress
      const historial = await db.mediaRes.findMany({
        where: {
          camaraId: { not: null }
        },
        include: {
          camara: true,
          romaneo: {
            include: {
              tipificador: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      })

      return NextResponse.json({
        success: true,
        data: historial.map(m => ({
          id: m.id,
          codigo: m.codigo,
          lado: m.lado,
          sigla: m.sigla,
          peso: m.peso,
          estado: m.estado,
          camara: m.camara?.nombre,
          garron: m.romaneo.garron,
          tropaCodigo: m.romaneo.tropaCodigo,
          tipoAnimal: m.romaneo.tipoAnimal,
          fecha: m.createdAt
        }))
      })
    }

    // Get all romaneos with weights recorded
    const romaneos = await db.romaneo.findMany({
      where: {
        pesoTotal: { not: null },
        mediasRes: {
          none: {
            camaraId: { not: null }
          }
        }
      },
      include: {
        mediasRes: true
      },
      orderBy: { garron: 'asc' }
    })

    // Get garron assignments for these romaneos
    const garrones = romaneos.map(r => r.garron)

    const asignaciones = await db.asignacionGarron.findMany({
      where: {
        garron: { in: garrones }
      },
      include: {
        animal: {
          include: {
            tropa: {
              include: {
                usuarioFaena: true
              }
            },
            pesajeIndividual: true
          }
        },
        listaFaena: true
      }
    })

    // Group by tropa
    const tropasMap = new Map<string, TropaIngreso>()

    for (const asignacion of asignaciones) {
      const animal = asignacion.animal
      const tropa = animal.tropa
      const romaneo = romaneos.find(r => r.garron === asignacion.garron)

      if (!romaneo) continue

      // Check if already in camera
      const enCamara = romaneo.mediasRes.some(m => m.camaraId)
      if (enCamara) continue

      if (!tropasMap.has(tropa.id)) {
        tropasMap.set(tropa.id, {
          tropaId: tropa.id,
          tropaCodigo: tropa.codigo,
          especie: tropa.especie,
          usuarioFaena: tropa.usuarioFaena?.nombre || 'Sin asignar',
          animales: []
        })
      }

      const tropaData = tropasMap.get(tropa.id)!
      tropaData.animales.push({
        id: animal.id,
        codigo: animal.codigo,
        garron: asignacion.garron,
        tipoAnimal: animal.tipoAnimal,
        pesoVivo: animal.pesoVivo || animal.pesajeIndividual?.peso || romaneo.pesoVivo || null,
        estado: animal.estado,
        tieneRomaneo: true,
        enCamara: false,
        romaneoData: {
          id: romaneo.id,
          pesoMediaIzq: romaneo.pesoMediaIzq,
          pesoMediaDer: romaneo.pesoMediaDer,
          pesoTotal: romaneo.pesoTotal,
          rinde: romaneo.rinde,
          denticion: romaneo.denticion,
          raza: romaneo.raza
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: Array.from(tropasMap.values())
    })
  } catch (error) {
    console.error('Error fetching tropas for ingreso:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener tropas' },
      { status: 500 }
    )
  }
}

// POST - Register camera ingress for an animal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { romaneoId, camaraId, operadorId, siglas } = body

    if (!romaneoId || !camaraId) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Get romaneo data
    const romaneo = await db.romaneo.findUnique({
      where: { id: romaneoId },
      include: {
        mediasRes: true
      }
    })

    if (!romaneo) {
      return NextResponse.json(
        { success: false, error: 'Romaneo no encontrado' },
        { status: 404 }
      )
    }

    if (!romaneo.pesoTotal) {
      return NextResponse.json(
        { success: false, error: 'El romaneo no tiene pesos registrados' },
        { status: 400 }
      )
    }

    // Check camera capacity
    const camara = await db.camara.findUnique({
      where: { id: camaraId },
      include: {
        _count: {
          select: { mediasRes: true }
        }
      }
    })

    if (!camara) {
      return NextResponse.json(
        { success: false, error: 'Cámara no encontrada' },
        { status: 404 }
      )
    }

    // Check if camera has enough capacity (2 medias per animal)
    const mediasActuales = camara._count.mediasRes
    const nuevasMedias = 2
    if (mediasActuales + nuevasMedias > camara.capacidad) {
      return NextResponse.json(
        { success: false, error: `La cámara no tiene capacidad suficiente. Disponible: ${camara.capacidad - mediasActuales} ganchos` },
        { status: 400 }
      )
    }

    // Generate barcodes for each media
    const generarCodigo = (garron: number, lado: string, sigla: string) => {
      const fecha = new Date()
      const año = fecha.getFullYear().toString().slice(-2)
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0')
      const dia = fecha.getDate().toString().padStart(2, '0')
      return `${año}${mes}${dia}-${garron.toString().padStart(4, '0')}-${lado.charAt(0)}-${sigla}`
    }

    const mediasCreadas = []

    // Media Izquierda
    if (romaneo.pesoMediaIzq) {
      const siglaIzq = siglas?.izquierda || 'A'
      const codigoIzq = generarCodigo(romaneo.garron, 'IZQUIERDA', siglaIzq)

      // Check if media already exists
      const existingMediaIzq = await db.mediaRes.findFirst({
        where: {
          romaneoId: romaneo.id,
          lado: 'IZQUIERDA'
        }
      })

      let mediaIzq
      if (existingMediaIzq) {
        mediaIzq = await db.mediaRes.update({
          where: { id: existingMediaIzq.id },
          data: {
            camaraId: camaraId,
            estado: 'EN_CAMARA',
            codigo: codigoIzq,
            sigla: siglaIzq as 'A' | 'T' | 'D'
          }
        })
      } else {
        mediaIzq = await db.mediaRes.create({
          data: {
            romaneoId: romaneo.id,
            lado: 'IZQUIERDA',
            sigla: siglaIzq as 'A' | 'T' | 'D',
            peso: romaneo.pesoMediaIzq,
            codigo: codigoIzq,
            estado: 'EN_CAMARA',
            camaraId: camaraId
          }
        })
      }
      mediasCreadas.push(mediaIzq)
    }

    // Media Derecha
    if (romaneo.pesoMediaDer) {
      const siglaDer = siglas?.derecha || 'A'
      const codigoDer = generarCodigo(romaneo.garron, 'DERECHA', siglaDer)

      // Check if media already exists
      const existingMediaDer = await db.mediaRes.findFirst({
        where: {
          romaneoId: romaneo.id,
          lado: 'DERECHA'
        }
      })

      let mediaDer
      if (existingMediaDer) {
        mediaDer = await db.mediaRes.update({
          where: { id: existingMediaDer.id },
          data: {
            camaraId: camaraId,
            estado: 'EN_CAMARA',
            codigo: codigoDer,
            sigla: siglaDer as 'A' | 'T' | 'D'
          }
        })
      } else {
        mediaDer = await db.mediaRes.create({
          data: {
            romaneoId: romaneo.id,
            lado: 'DERECHA',
            sigla: siglaDer as 'A' | 'T' | 'D',
            peso: romaneo.pesoMediaDer,
            codigo: codigoDer,
            estado: 'EN_CAMARA',
            camaraId: camaraId
          }
        })
      }
      mediasCreadas.push(mediaDer)
    }

    // Update or create stock
    const tropaCodigo = romaneo.tropaCodigo || 'SIN-TROPA'
    const existingStock = await db.stockMediaRes.findFirst({
      where: {
        camaraId: camaraId,
        tropaCodigo: tropaCodigo
      }
    })

    if (existingStock) {
      await db.stockMediaRes.update({
        where: { id: existingStock.id },
        data: {
          cantidad: { increment: 2 },
          pesoTotal: { increment: romaneo.pesoTotal || 0 }
        }
      })
    } else {
      await db.stockMediaRes.create({
        data: {
          camaraId: camaraId,
          tropaCodigo: tropaCodigo,
          especie: 'BOVINO',
          cantidad: 2,
          pesoTotal: romaneo.pesoTotal || 0
        }
      })
    }

    // Create movement record
    await db.movimientoCamara.create({
      data: {
        camaraDestinoId: camaraId,
        producto: 'Media Res',
        cantidad: 2,
        peso: romaneo.pesoTotal,
        tropaCodigo: romaneo.tropaCodigo,
        operadorId: operadorId,
        observaciones: `Ingreso garrón ${romaneo.garron}`
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        medias: mediasCreadas,
        camara: camara.nombre
      }
    })
  } catch (error) {
    console.error('Error registering camera ingress:', error)
    return NextResponse.json(
      { success: false, error: 'Error al registrar ingreso a cámara' },
      { status: 500 }
    )
  }
}
