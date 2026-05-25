import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch clientes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const esUsuarioFaena = searchParams.get('esUsuarioFaena')
    const esProductor = searchParams.get('esProductor')
    
    let where: Record<string, unknown> = {}
    if (tipo === 'productor' || esProductor === 'true') {
      where.esProductor = true
    } else if (tipo === 'usuarioFaena' || esUsuarioFaena === 'true') {
      where.esUsuarioFaena = true
    }
    
    const clientes = await db.cliente.findMany({
      where,
      orderBy: { nombre: 'asc' }
    })
    
    return NextResponse.json({
      success: true,
      data: clientes
    })
  } catch (error) {
    console.error('Error fetching clientes:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener clientes' },
      { status: 500 }
    )
  }
}

// POST - Create new cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      nombre, dni, cuit, matricula, direccion, localidad, provincia, 
      telefono, telefonoAlternativo, email, razonSocial, condicionIva, 
      puntoVenta, observaciones, esProductor, esUsuarioFaena 
    } = body
    
    if (!nombre) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }
    
    const cliente = await db.cliente.create({
      data: {
        nombre,
        dni: dni || null,
        cuit: cuit || null,
        matricula: matricula || null,
        direccion: direccion || null,
        localidad: localidad || null,
        provincia: provincia || null,
        telefono: telefono || null,
        telefonoAlternativo: telefonoAlternativo || null,
        email: email || null,
        razonSocial: razonSocial || null,
        condicionIva: condicionIva || null,
        puntoVenta: puntoVenta || null,
        observaciones: observaciones || null,
        esProductor: esProductor || false,
        esUsuarioFaena: esUsuarioFaena || false
      }
    })
    
    return NextResponse.json({
      success: true,
      data: cliente
    })
  } catch (error) {
    console.error('Error creating cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear cliente' },
      { status: 500 }
    )
  }
}

// PUT - Update cliente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      id, nombre, dni, cuit, matricula, direccion, localidad, provincia, 
      telefono, telefonoAlternativo, email, razonSocial, condicionIva, 
      puntoVenta, observaciones, esProductor, esUsuarioFaena, activo 
    } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }
    
    // Build data object with only provided fields
    const data: any = {}
    if (nombre !== undefined) data.nombre = nombre
    if (dni !== undefined) data.dni = dni || null
    if (cuit !== undefined) data.cuit = cuit || null
    if (matricula !== undefined) data.matricula = matricula || null
    if (direccion !== undefined) data.direccion = direccion || null
    if (localidad !== undefined) data.localidad = localidad || null
    if (provincia !== undefined) data.provincia = provincia || null
    if (telefono !== undefined) data.telefono = telefono || null
    if (telefonoAlternativo !== undefined) data.telefonoAlternativo = telefonoAlternativo || null
    if (email !== undefined) data.email = email || null
    if (razonSocial !== undefined) data.razonSocial = razonSocial || null
    if (condicionIva !== undefined) data.condicionIva = condicionIva || null
    if (puntoVenta !== undefined) data.puntoVenta = puntoVenta || null
    if (observaciones !== undefined) data.observaciones = observaciones || null
    if (esProductor !== undefined) data.esProductor = esProductor || false
    if (esUsuarioFaena !== undefined) data.esUsuarioFaena = esUsuarioFaena || false
    if (activo !== undefined) data.activo = activo
    
    const cliente = await db.cliente.update({
      where: { id },
      data
    })
    
    return NextResponse.json({
      success: true,
      data: cliente
    })
  } catch (error) {
    console.error('Error updating cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar cliente' },
      { status: 500 }
    )
  }
}

// DELETE - Delete cliente
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }
    
    await db.cliente.delete({
      where: { id }
    })
    
    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error deleting cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar cliente' },
      { status: 500 }
    )
  }
}
