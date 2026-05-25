import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET - Listar operadores
export async function GET(request: NextRequest) {
  try {
    const operadores = await db.operador.findMany({
      select: {
        id: true,
        nombre: true,
        usuario: true,
        email: true,
        rol: true,
        activo: true,
        puedePesajeCamiones: true,
        puedePesajeIndividual: true,
        puedeMovimientoHacienda: true,
        puedeListaFaena: true,
        puedeRomaneo: true,
        puedeIngresoCajon: true,
        puedeMenudencias: true,
        puedeStock: true,
        puedeReportes: true,
        puedeConfiguracion: true,
        createdAt: true
      },
      orderBy: { nombre: 'asc' }
    })
    
    return NextResponse.json({
      success: true,
      data: operadores
    })
  } catch (error) {
    console.error('Error fetching operadores:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener operadores' },
      { status: 500 }
    )
  }
}

// POST - Crear operador
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      nombre,
      usuario,
      password,
      pin,
      email,
      rol,
      puedePesajeCamiones,
      puedePesajeIndividual,
      puedeMovimientoHacienda,
      puedeListaFaena,
      puedeRomaneo,
      puedeIngresoCajon,
      puedeMenudencias,
      puedeStock,
      puedeReportes,
      puedeConfiguracion
    } = body
    
    if (!nombre || !usuario || !password) {
      return NextResponse.json(
        { success: false, error: 'Nombre, usuario y contraseña son requeridos' },
        { status: 400 }
      )
    }
    
    // Verificar si ya existe un operador con el mismo usuario
    const existingUsuario = await db.operador.findFirst({
      where: { usuario }
    })
    
    if (existingUsuario) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un operador con ese usuario' },
        { status: 400 }
      )
    }
    
    // Verificar PIN si se proporciona
    if (pin) {
      const existingPin = await db.operador.findFirst({
        where: { pin }
      })
      
      if (existingPin) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un operador con ese PIN' },
          { status: 400 }
        )
      }
    }
    
    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const operador = await db.operador.create({
      data: {
        nombre,
        usuario,
        password: hashedPassword,
        pin: pin || null,
        email: email || null,
        rol: rol || 'OPERADOR',
        puedePesajeCamiones: puedePesajeCamiones ?? true,
        puedePesajeIndividual: puedePesajeIndividual ?? true,
        puedeMovimientoHacienda: puedeMovimientoHacienda ?? true,
        puedeListaFaena: puedeListaFaena ?? false,
        puedeRomaneo: puedeRomaneo ?? false,
        puedeIngresoCajon: puedeIngresoCajon ?? false,
        puedeMenudencias: puedeMenudencias ?? false,
        puedeStock: puedeStock ?? false,
        puedeReportes: puedeReportes ?? false,
        puedeConfiguracion: puedeConfiguracion ?? false
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: operador.id,
        nombre: operador.nombre,
        usuario: operador.usuario,
        rol: operador.rol
      }
    })
  } catch (error) {
    console.error('Error creating operador:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear operador' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar operador
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      nombre,
      usuario,
      password,
      pin,
      email,
      rol,
      activo,
      puedePesajeCamiones,
      puedePesajeIndividual,
      puedeMovimientoHacienda,
      puedeListaFaena,
      puedeRomaneo,
      puedeIngresoCajon,
      puedeMenudencias,
      puedeStock,
      puedeReportes,
      puedeConfiguracion
    } = body
    
    const updateData: Record<string, unknown> = {}
    
    if (nombre !== undefined) updateData.nombre = nombre
    if (usuario !== undefined) updateData.usuario = usuario
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }
    if (pin !== undefined) updateData.pin = pin || null
    if (email !== undefined) updateData.email = email || null
    if (rol !== undefined) updateData.rol = rol
    if (activo !== undefined) updateData.activo = activo
    if (puedePesajeCamiones !== undefined) updateData.puedePesajeCamiones = puedePesajeCamiones
    if (puedePesajeIndividual !== undefined) updateData.puedePesajeIndividual = puedePesajeIndividual
    if (puedeMovimientoHacienda !== undefined) updateData.puedeMovimientoHacienda = puedeMovimientoHacienda
    if (puedeListaFaena !== undefined) updateData.puedeListaFaena = puedeListaFaena
    if (puedeRomaneo !== undefined) updateData.puedeRomaneo = puedeRomaneo
    if (puedeIngresoCajon !== undefined) updateData.puedeIngresoCajon = puedeIngresoCajon
    if (puedeMenudencias !== undefined) updateData.puedeMenudencias = puedeMenudencias
    if (puedeStock !== undefined) updateData.puedeStock = puedeStock
    if (puedeReportes !== undefined) updateData.puedeReportes = puedeReportes
    if (puedeConfiguracion !== undefined) updateData.puedeConfiguracion = puedeConfiguracion
    
    const operador = await db.operador.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: operador.id,
        nombre: operador.nombre,
        usuario: operador.usuario,
        rol: operador.rol
      }
    })
  } catch (error) {
    console.error('Error updating operador:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar operador' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar operador
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
    
    await db.operador.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting operador:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar operador' },
      { status: 500 }
    )
  }
}
