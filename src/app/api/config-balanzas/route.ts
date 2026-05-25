import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar configuraciones de balanzas
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const soloActivas = searchParams.get('activas') === 'true'

    const where: Prisma.ConfigBalanzaWhereInput = {}
    if (soloActivas) {
      where.activa = true
    }

    const balanzas = await db.configBalanza.findMany({
      where,
      orderBy: [
        { esPrincipal: 'desc' },
        { nombre: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: balanzas
    })

  } catch (error) {
    console.error('Error al obtener balanzas:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error al obtener configuración de balanzas' 
    }, { status: 500 })
  }
}

// POST - Crear nueva configuración de balanza
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const body = await request.json()
    const {
      nombre,
      modelo,
      marca,
      tipoConexion,
      puertoSerial,
      baudRate,
      dataBits,
      stopBits,
      paridad,
      direccionIP,
      puertoTCP,
      protocolo,
      timeout,
      intervaloLectura,
      comandoPesar,
      comandoTara,
      comandoCero,
      formatoTrama,
      posicionPeso,
      decimales,
      unidad,
      activa,
      esPrincipal,
      ubicacion,
      terminalId,
      observaciones
    } = body

    if (!nombre) {
      return NextResponse.json({ 
        success: false, 
        error: 'El nombre es requerido' 
      }, { status: 400 })
    }

    // Si esta balanza se marca como principal, quitar marca de las demás
    if (esPrincipal) {
      await db.configBalanza.updateMany({
        where: { esPrincipal: true },
        data: { esPrincipal: false }
      })
    }

    const balanza = await db.configBalanza.create({
      data: {
        nombre,
        modelo,
        marca,
        tipoConexion: tipoConexion || 'SERIAL',
        puertoSerial,
        baudRate: baudRate || 9600,
        dataBits: dataBits || 8,
        stopBits: stopBits || 1,
        paridad: paridad || 'NONE',
        direccionIP,
        puertoTCP,
        protocolo: protocolo || 'CONTINUO',
        timeout: timeout || 5000,
        intervaloLectura: intervaloLectura || 500,
        comandoPesar,
        comandoTara,
        comandoCero,
        formatoTrama,
        posicionPeso,
        decimales: decimales || 2,
        unidad: unidad || 'KG',
        activa: activa !== false,
        esPrincipal: esPrincipal || false,
        ubicacion,
        terminalId,
        observaciones
      }
    })

    return NextResponse.json({
      success: true,
      data: balanza
    })

  } catch (error) {
    console.error('Error al crear balanza:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error al crear configuración de balanza' 
    }, { status: 500 })
  }
}

// PUT - Actualizar configuración
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID es requerido' 
      }, { status: 400 })
    }

    // Si esta balanza se marca como principal, quitar marca de las demás
    if (data.esPrincipal) {
      await db.configBalanza.updateMany({
        where: { 
          esPrincipal: true,
          id: { not: id }
        },
        data: { esPrincipal: false }
      })
    }

    const balanza = await db.configBalanza.update({
      where: { id },
      data
    })

    return NextResponse.json({
      success: true,
      data: balanza
    })

  } catch (error) {
    console.error('Error al actualizar balanza:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error al actualizar configuración de balanza' 
    }, { status: 500 })
  }
}

// DELETE - Eliminar configuración
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID es requerido' 
      }, { status: 400 })
    }

    await db.configBalanza.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Balanza eliminada correctamente'
    })

  } catch (error) {
    console.error('Error al eliminar balanza:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error al eliminar configuración de balanza' 
    }, { status: 500 })
  }
}
