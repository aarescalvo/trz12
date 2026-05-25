import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Registrar pesaje de media res
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      garron, 
      lado, 
      peso, 
      siglas, 
      denticion, 
      tipificadorId, 
      camaraId, 
      operadorId
    } = body

    console.log('=== INICIO PESAJE ===')
    console.log('Datos recibidos:', { garron, lado, peso, camaraId, denticion, tipificadorId, operadorId })

    if (!garron || !lado || !peso || !camaraId) {
      console.log('Error: Faltan datos requeridos')
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos: garron, lado, peso, camaraId' },
        { status: 400 }
      )
    }

    // Validar lado
    if (lado !== 'IZQUIERDA' && lado !== 'DERECHA') {
      return NextResponse.json(
        { success: false, error: 'Lado debe ser IZQUIERDA o DERECHA' },
        { status: 400 }
      )
    }

    // Validar peso
    const pesoNum = parseFloat(peso)
    if (isNaN(pesoNum) || pesoNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'Peso debe ser un número positivo' },
        { status: 400 }
      )
    }

    // Validar que el operador existe (si se proporciona)
    let validOperadorId: string | null = null
    if (operadorId) {
      const operadorExists = await db.operador.findUnique({
        where: { id: operadorId }
      })
      if (operadorExists) {
        validOperadorId = operadorId
      } else {
        console.log('Operador no encontrado, usando null:', operadorId)
      }
    }

    // Validar que el tipificador existe (si se proporciona)
    let validTipificadorId: string | null = null
    if (tipificadorId) {
      const tipificadorExists = await db.tipificador.findUnique({
        where: { id: tipificadorId }
      })
      if (tipificadorExists) {
        validTipificadorId = tipificadorId
      } else {
        console.log('Tipificador no encontrado, usando null:', tipificadorId)
      }
    }

    // Buscar la asignación del garrón para hoy
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const asignacion = await db.asignacionGarron.findFirst({
      where: {
        garron: parseInt(garron),
        horaIngreso: {
          gte: hoy,
          lt: new Date(hoy.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        animal: {
          include: {
            tropa: true,
            pesajeIndividual: true
          }
        }
      }
    })

    console.log('Asignación encontrada:', asignacion ? `ID: ${asignacion.id}` : 'No encontrada')

    // Verificar si ya existe romaneo para este garrón
    let romaneo = await db.romaneo.findFirst({
      where: { garron: parseInt(garron) },
      include: { mediasRes: true }
    })

    if (!romaneo) {
      // Crear nuevo romaneo
      const animal = asignacion?.animal
      
      console.log('Creando nuevo romaneo con datos:', {
        garron: parseInt(garron),
        tropaCodigo: animal?.tropa?.codigo || asignacion?.tropaCodigo,
        numeroAnimal: animal?.numero || asignacion?.animalNumero,
        pesoVivo: animal?.pesoVivo || animal?.pesajeIndividual?.peso || asignacion?.pesoVivo
      })

      romaneo = await db.romaneo.create({
        data: {
          garron: parseInt(garron),
          tropaCodigo: animal?.tropa?.codigo || asignacion?.tropaCodigo || null,
          numeroAnimal: animal?.numero || asignacion?.animalNumero || null,
          tipoAnimal: (animal?.tipoAnimal || asignacion?.tipoAnimal) as any || null,
          pesoVivo: animal?.pesoVivo || animal?.pesajeIndividual?.peso || asignacion?.pesoVivo || null,
          denticion: denticion || null,
          tipificadorId: validTipificadorId,
          operadorId: validOperadorId,
          estado: 'PENDIENTE'
        },
        include: { mediasRes: true }
      })
      
      console.log('Romaneo creado:', romaneo.id)
    }

    // Actualizar dentición si se proporciona
    if (denticion) {
      await db.romaneo.update({
        where: { id: romaneo.id },
        data: { denticion, tipificadorId }
      })
    }

    // Verificar si ya existe esta media
    const mediaExistente = await db.mediaRes.findFirst({
      where: {
        romaneoId: romaneo.id,
        lado: lado as 'IZQUIERDA' | 'DERECHA'
      }
    })

    if (mediaExistente) {
      console.log('Media ya existe:', mediaExistente.id)
      return NextResponse.json(
        { success: false, error: `Ya existe media ${lado.toLowerCase()} para el garrón ${garron}` },
        { status: 400 }
      )
    }

    // Generar código para la media
    const fecha = new Date()
    const codigoBase = `${fecha.getFullYear().toString().slice(-2)}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${garron.toString().padStart(4, '0')}-${lado.charAt(0)}`

    // Crear la media res
    const mediaRes = await db.mediaRes.create({
      data: {
        romaneoId: romaneo.id,
        lado: lado as 'IZQUIERDA' | 'DERECHA',
        sigla: 'A', // Por defecto A
        peso: pesoNum,
        codigo: `${codigoBase}-A`,
        estado: 'EN_CAMARA',
        camaraId
      }
    })

    console.log('MediaRes creada:', mediaRes.id)

    // Actualizar stock de la cámara
    try {
      const tropaCodigo = romaneo.tropaCodigo || 'SIN-TROPA'
      
      const stockExistente = await db.stockMediaRes.findFirst({
        where: {
          camaraId,
          tropaCodigo,
          especie: 'BOVINO'
        }
      })

      if (stockExistente) {
        await db.stockMediaRes.update({
          where: { id: stockExistente.id },
          data: {
            cantidad: { increment: 1 },
            pesoTotal: { increment: pesoNum }
          }
        })
        console.log('Stock actualizado:', stockExistente.id)
      } else {
        const nuevoStock = await db.stockMediaRes.create({
          data: {
            camaraId,
            tropaCodigo,
            especie: 'BOVINO',
            cantidad: 1,
            pesoTotal: pesoNum
          }
        })
        console.log('Stock creado:', nuevoStock.id)
      }
    } catch (stockError) {
      console.error('Error actualizando stock:', stockError)
      // No fallar el pesaje por error de stock
    }

    // Registrar movimiento de cámara
    try {
      await db.movimientoCamara.create({
        data: {
          camaraDestinoId: camaraId,
          producto: 'Media Res',
          cantidad: 1,
          peso: pesoNum,
          tropaCodigo: romaneo.tropaCodigo,
          mediaResId: mediaRes.id,
          operadorId: operadorId || null,
          observaciones: `Ingreso garrón ${garron} - ${lado}`
        }
      })
      console.log('Movimiento de cámara registrado')
    } catch (movError) {
      console.error('Error registrando movimiento:', movError)
      // No fallar el pesaje por error de movimiento
    }

    // Actualizar asignación del garrón
    if (asignacion) {
      if (lado === 'DERECHA') {
        await db.asignacionGarron.update({
          where: { id: asignacion.id },
          data: { tieneMediaDer: true }
        })
      } else {
        await db.asignacionGarron.update({
          where: { id: asignacion.id },
          data: { tieneMediaIzq: true }
        })
      }
    }

    // Verificar si ya tiene ambas medias
    const todasLasMedias = await db.mediaRes.findMany({
      where: { romaneoId: romaneo.id }
    })

    console.log('Total medias:', todasLasMedias.length)

    // Si tiene ambas medias, actualizar romaneo con totales
    if (todasLasMedias.length === 2) {
      const mediaIzq = todasLasMedias.find(m => m.lado === 'IZQUIERDA')
      const mediaDer = todasLasMedias.find(m => m.lado === 'DERECHA')
      
      if (mediaIzq && mediaDer) {
        const pesoTotal = mediaIzq.peso + mediaDer.peso
        const rinde = romaneo.pesoVivo ? (pesoTotal / romaneo.pesoVivo) * 100 : null

        await db.romaneo.update({
          where: { id: romaneo.id },
          data: {
            pesoMediaIzq: mediaIzq.peso,
            pesoMediaDer: mediaDer.peso,
            pesoTotal,
            rinde,
            estado: 'CONFIRMADO'
          }
        })

        // Marcar asignación como completada
        if (asignacion) {
          await db.asignacionGarron.update({
            where: { id: asignacion.id },
            data: { completado: true }
          })
        }
        
        console.log('Romaneo completado con ambas medias')
      }
    }

    console.log('=== FIN PESAJE EXITOSO ===')

    return NextResponse.json({
      success: true,
      data: {
        id: mediaRes.id,
        garron,
        lado,
        peso: pesoNum,
        codigo: mediaRes.codigo,
        romaneoId: romaneo.id
      }
    })

  } catch (error) {
    console.error('=== ERROR EN PESAJE ===')
    console.error('Error completo:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al registrar pesaje',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
