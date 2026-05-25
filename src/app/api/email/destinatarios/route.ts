import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar todos los destinatarios
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const destinatarios = await db.destinatarioReporte.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(destinatarios)
  } catch (error) {
    console.error('Error al obtener destinatarios:', error)
    return NextResponse.json(
      { error: 'Error al obtener destinatarios' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo destinatario
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const data = await request.json()
    
    // Verificar si ya existe el email
    const existente = await db.destinatarioReporte.findFirst({
      where: { email: data.email }
    })
    
    if (existente) {
      return NextResponse.json(
        { error: 'Ya existe un destinatario con ese email' },
        { status: 400 }
      )
    }
    
    const destinatario = await db.destinatarioReporte.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        activo: data.activo ?? true,
        recibeStock: data.recibeStock ?? false,
        recibeFaena: data.recibeFaena ?? false,
        recibeRendimiento: data.recibeRendimiento ?? false,
        recibeAlertas: data.recibeAlertas ?? false,
        observaciones: data.observaciones
      }
    })
    
    return NextResponse.json(destinatario, { status: 201 })
  } catch (error) {
    console.error('Error al crear destinatario:', error)
    return NextResponse.json(
      { error: 'Error al crear destinatario' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar destinatario
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const data = await request.json()
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'ID de destinatario requerido' },
        { status: 400 }
      )
    }
    
    // Verificar que existe
    const existente = await db.destinatarioReporte.findUnique({
      where: { id: data.id }
    })
    
    if (!existente) {
      return NextResponse.json(
        { error: 'Destinatario no encontrado' },
        { status: 404 }
      )
    }
    
    // Verificar email duplicado (excepto el mismo)
    if (data.email && data.email !== existente.email) {
      const emailDuplicado = await db.destinatarioReporte.findFirst({
        where: { 
          email: data.email,
          NOT: { id: data.id }
        }
      })
      
      if (emailDuplicado) {
        return NextResponse.json(
          { error: 'Ya existe otro destinatario con ese email' },
          { status: 400 }
        )
      }
    }
    
    const destinatario = await db.destinatarioReporte.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        email: data.email,
        activo: data.activo,
        recibeStock: data.recibeStock,
        recibeFaena: data.recibeFaena,
        recibeRendimiento: data.recibeRendimiento,
        recibeAlertas: data.recibeAlertas,
        observaciones: data.observaciones
      }
    })
    
    return NextResponse.json(destinatario)
  } catch (error) {
    console.error('Error al actualizar destinatario:', error)
    return NextResponse.json(
      { error: 'Error al actualizar destinatario' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar destinatario
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de destinatario requerido' },
        { status: 400 }
      )
    }
    
    // Verificar que existe
    const existente = await db.destinatarioReporte.findUnique({
      where: { id }
    })
    
    if (!existente) {
      return NextResponse.json(
        { error: 'Destinatario no encontrado' },
        { status: 404 }
      )
    }
    
    // Eliminar historiales de envío asociados
    await db.historialEnvio.deleteMany({
      where: { destinatarioId: id }
    })
    
    // Eliminar destinatario
    await db.destinatarioReporte.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Destinatario eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar destinatario:', error)
    return NextResponse.json(
      { error: 'Error al eliminar destinatario' },
      { status: 500 }
    )
  }
}
